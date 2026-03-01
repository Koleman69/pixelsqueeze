import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DAYS_MAP: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

function getNextSlots(postsPerWeek: number, preferredTimes: string[], preferredDays: string[], count: number): Date[] {
  const slots: Date[] = [];
  const now = new Date();
  const dayIndices = preferredDays.map(d => DAYS_MAP[d]).filter(d => d !== undefined);
  if (dayIndices.length === 0 || preferredTimes.length === 0) return slots;

  const slotsPerDay = Math.ceil(postsPerWeek / dayIndices.length);
  const timesPerDay = preferredTimes.slice(0, slotsPerDay);

  let checkDate = new Date(now);
  checkDate.setMinutes(0, 0, 0);

  for (let dayOffset = 0; dayOffset < 30 && slots.length < count; dayOffset++) {
    const d = new Date(checkDate);
    d.setDate(d.getDate() + dayOffset);
    if (!dayIndices.includes(d.getDay())) continue;

    for (const time of timesPerDay) {
      if (slots.length >= count) break;
      const [h, m] = time.split(':').map(Number);
      const slot = new Date(d);
      slot.setHours(h, m || 0, 0, 0);
      if (slot > now) slots.push(slot);
    }
  }
  return slots;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...payload } = await req.json();

    switch (action) {
      // ── WORKFLOWS CRUD ──
      case 'list_workflows': {
        const { data, error } = await supabase
          .from('posting_workflows')
          .select()
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return respond({ workflows: data });
      }

      case 'save_workflow': {
        const { id, ...fields } = payload;
        if (id) {
          const { data, error } = await supabase
            .from('posting_workflows')
            .update(fields)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();
          if (error) throw error;
          return respond({ workflow: data });
        } else {
          const { data, error } = await supabase
            .from('posting_workflows')
            .insert({ user_id: user.id, ...fields })
            .select()
            .single();
          if (error) throw error;
          return respond({ workflow: data });
        }
      }

      case 'delete_workflow': {
        const { error } = await supabase
          .from('posting_workflows')
          .delete()
          .eq('id', payload.id)
          .eq('user_id', user.id);
        if (error) throw error;
        return respond({ success: true });
      }

      case 'toggle_workflow': {
        const { data: wf } = await supabase
          .from('posting_workflows')
          .select()
          .eq('id', payload.id)
          .eq('user_id', user.id)
          .single();
        if (!wf) throw new Error('Workflow not found');

        const { data, error } = await supabase
          .from('posting_workflows')
          .update({ is_active: !wf.is_active })
          .eq('id', payload.id)
          .select()
          .single();
        if (error) throw error;
        return respond({ workflow: data });
      }

      // ── AUTO-SCHEDULE: generate posts from AI and schedule them ──
      case 'run_auto_schedule': {
        const { data: wf } = await supabase
          .from('posting_workflows')
          .select()
          .eq('id', payload.id)
          .eq('user_id', user.id)
          .single();
        if (!wf) throw new Error('Workflow not found');

        const slots = getNextSlots(
          wf.posts_per_week,
          wf.preferred_times || ['09:00', '12:00', '18:00'],
          wf.preferred_days || ['mon', 'tue', 'wed', 'thu', 'fri'],
          wf.posts_per_week
        );

        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

        // Generate content for each slot
        const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              {
                role: 'system',
                content: `You create ${slots.length} unique social media posts for an image optimization tool called PixelSqueeze. Each post should have a different angle: tips, stats, behind-the-scenes, user benefits, comparisons, humor, trending formats. Return JSON: { "posts": [{ "title": "Post theme", "content": "Post text with emojis", "hashtags": ["#tag1"] }] }`
              },
              {
                role: 'user',
                content: `Generate ${slots.length} engaging posts for platforms: ${wf.platforms.join(', ')}. Context: ${wf.name}. Mix educational, promotional, and entertaining content.`
              }
            ],
            response_format: { type: "json_object" }
          }),
        });

        let generatedPosts: any[] = [];
        if (aiResp.ok) {
          const aiData = await aiResp.json();
          try {
            const parsed = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');
            generatedPosts = parsed.posts || [];
          } catch { /* fallback below */ }
        }

        // Create scheduled posts
        const createdPosts = [];
        for (let i = 0; i < slots.length; i++) {
          const gp = generatedPosts[i] || { title: `Auto post ${i + 1}`, content: `Scheduled post #${i + 1}`, hashtags: [] };
          const { data: post, error } = await supabase
            .from('scheduled_posts')
            .insert({
              user_id: user.id,
              title: gp.title,
              content: gp.content,
              platforms: wf.platforms,
              status: 'scheduled',
              scheduled_at: slots[i].toISOString(),
              hashtags: gp.hashtags || [],
              post_type: 'social',
              workflow_id: wf.id,
            })
            .select()
            .single();
          if (!error && post) createdPosts.push(post);
        }

        // Update workflow
        await supabase
          .from('posting_workflows')
          .update({ last_run_at: new Date().toISOString(), next_run_at: slots[slots.length - 1]?.toISOString() })
          .eq('id', wf.id);

        return respond({ posts: createdPosts, slotsGenerated: slots.length });
      }

      // ── RECYCLE best-performing posts ──
      case 'recycle_top_posts': {
        const { data: wf } = await supabase
          .from('posting_workflows')
          .select()
          .eq('id', payload.id)
          .eq('user_id', user.id)
          .single();
        if (!wf) throw new Error('Workflow not found');

        const minAge = new Date();
        minAge.setDate(minAge.getDate() - (wf.recycle_after_days || 30));

        // Get top posts by engagement
        const { data: topPosts } = await supabase
          .from('scheduled_posts')
          .select()
          .eq('user_id', user.id)
          .eq('status', 'published')
          .gte('engagement_score', wf.recycle_min_engagement || 0)
          .lte('published_at', minAge.toISOString())
          .is('recycled_from', null)
          .order('engagement_score', { ascending: false })
          .limit(5);

        if (!topPosts?.length) {
          return respond({ recycled: [], message: 'No eligible posts to recycle yet.' });
        }

        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        const recycled = [];

        for (const original of topPosts) {
          let newContent = original.content;

          // Refresh content with AI if available
          if (LOVABLE_API_KEY) {
            try {
              const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'google/gemini-3-flash-preview',
                  messages: [
                    { role: 'system', content: 'Rewrite this social media post with a fresh angle. Keep the core message but change the hook, add new emojis, and update hashtags. Return JSON: { "content": "new post text", "hashtags": ["#tag"] }' },
                    { role: 'user', content: original.content }
                  ],
                  response_format: { type: "json_object" }
                }),
              });
              if (aiResp.ok) {
                const aiData = await aiResp.json();
                const parsed = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');
                newContent = parsed.content || original.content;
              }
            } catch { /* use original */ }
          }

          const slots = getNextSlots(1, wf.preferred_times || ['12:00'], wf.preferred_days || ['mon', 'wed', 'fri'], 1);

          const { data: post } = await supabase
            .from('scheduled_posts')
            .insert({
              user_id: user.id,
              title: `♻️ ${original.title}`,
              content: newContent,
              platforms: wf.platforms.length ? wf.platforms : original.platforms,
              status: 'scheduled',
              scheduled_at: slots[0]?.toISOString() || new Date(Date.now() + 86400000).toISOString(),
              hashtags: original.hashtags,
              post_type: 'social',
              recycled_from: original.id,
              workflow_id: wf.id,
            })
            .select()
            .single();
          if (post) recycled.push(post);
        }

        return respond({ recycled, message: `Recycled ${recycled.length} top-performing posts.` });
      }

      // ── CAMPAIGN TRIGGERS CRUD ──
      case 'list_campaigns': {
        const { data, error } = await supabase
          .from('campaign_triggers')
          .select()
          .eq('user_id', user.id)
          .order('trigger_date', { ascending: true });
        if (error) throw error;
        return respond({ campaigns: data });
      }

      case 'save_campaign': {
        const { id, ...fields } = payload;
        if (id) {
          const { data, error } = await supabase
            .from('campaign_triggers')
            .update(fields)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();
          if (error) throw error;
          return respond({ campaign: data });
        } else {
          const { data, error } = await supabase
            .from('campaign_triggers')
            .insert({ user_id: user.id, ...fields })
            .select()
            .single();
          if (error) throw error;
          return respond({ campaign: data });
        }
      }

      case 'delete_campaign': {
        const { error } = await supabase
          .from('campaign_triggers')
          .delete()
          .eq('id', payload.id)
          .eq('user_id', user.id);
        if (error) throw error;
        return respond({ success: true });
      }

      case 'trigger_campaign': {
        const { data: campaign } = await supabase
          .from('campaign_triggers')
          .select()
          .eq('id', payload.id)
          .eq('user_id', user.id)
          .single();
        if (!campaign) throw new Error('Campaign not found');

        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

        const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              {
                role: 'system',
                content: `Create ${campaign.posts_count} campaign posts for a ${campaign.trigger_type} event. Tone: ${campaign.tone}. Include urgency, event relevance, and calls to action. Return JSON: { "posts": [{ "title": "Post theme", "content": "Full post with emojis", "hashtags": ["#tag"] }] }`
              },
              {
                role: 'user',
                content: `Campaign: ${campaign.name}. ${campaign.content_template || ''} Platforms: ${campaign.platforms.join(', ')}. Create engaging ${campaign.trigger_type} campaign posts for PixelSqueeze.`
              }
            ],
            response_format: { type: "json_object" }
          }),
        });

        let posts: any[] = [];
        if (aiResp.ok) {
          const aiData = await aiResp.json();
          try {
            posts = JSON.parse(aiData.choices?.[0]?.message?.content || '{}').posts || [];
          } catch {}
        }

        const triggerDate = campaign.trigger_date ? new Date(campaign.trigger_date) : new Date();
        const startDate = new Date(triggerDate);
        startDate.setDate(startDate.getDate() - (campaign.days_before || 3));

        const created = [];
        for (let i = 0; i < posts.length; i++) {
          const schedDate = new Date(startDate);
          schedDate.setDate(schedDate.getDate() + i);
          schedDate.setHours(10 + (i * 4) % 12, 0, 0, 0);

          const { data: post } = await supabase
            .from('scheduled_posts')
            .insert({
              user_id: user.id,
              title: posts[i].title,
              content: posts[i].content,
              platforms: campaign.platforms,
              status: 'scheduled',
              scheduled_at: schedDate.toISOString(),
              hashtags: [...(posts[i].hashtags || []), ...(campaign.hashtags || [])],
              post_type: 'social',
              campaign_id: campaign.id,
            })
            .select()
            .single();
          if (post) created.push(post);
        }

        await supabase
          .from('campaign_triggers')
          .update({ last_triggered_at: new Date().toISOString() })
          .eq('id', campaign.id);

        return respond({ posts: created, message: `Campaign triggered: ${created.length} posts scheduled.` });
      }

      // ── ENGAGEMENT update ──
      case 'update_engagement': {
        const { post_id, engagement_score } = payload;
        const { data, error } = await supabase
          .from('scheduled_posts')
          .update({ engagement_score })
          .eq('id', post_id)
          .eq('user_id', user.id)
          .select()
          .single();
        if (error) throw error;
        return respond({ post: data });
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Posting workflow error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed'
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function respond(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
