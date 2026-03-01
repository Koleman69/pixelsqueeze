import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...payload } = await req.json();

    switch (action) {
      case 'create_post': {
        const { title, content, platforms, post_type, scheduled_at, hashtags, media_urls, blog_slug, blog_excerpt, blog_category, seo_title, seo_description, metadata } = payload;
        
        const status = scheduled_at ? 'scheduled' : 'draft';

        const { data, error } = await supabase
          .from('scheduled_posts')
          .insert({
            user_id: user.id,
            title,
            content,
            platforms: platforms || [],
            post_type: post_type || 'social',
            status,
            scheduled_at: scheduled_at || null,
            hashtags: hashtags || [],
            media_urls: media_urls || [],
            blog_slug: blog_slug || null,
            blog_excerpt: blog_excerpt || null,
            blog_category: blog_category || null,
            seo_title: seo_title || null,
            seo_description: seo_description || null,
            metadata: metadata || {},
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ post: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_post': {
        const { id, ...updates } = payload;
        const { data, error } = await supabase
          .from('scheduled_posts')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ post: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'publish_now': {
        const { id } = payload;

        // Mark as published
        const { data: post, error: fetchError } = await supabase
          .from('scheduled_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (fetchError) throw fetchError;

        // Simulate platform publishing results
        const platformResults: Record<string, any> = {};
        for (const platform of post.platforms) {
          platformResults[platform] = {
            status: 'published',
            published_at: new Date().toISOString(),
            post_url: `https://${platform}.com/post/${post.id.slice(0, 8)}`,
          };
        }

        // Update with platform results
        const { data: updated, error: updateError } = await supabase
          .from('scheduled_posts')
          .update({ platform_results: platformResults })
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ post: updated, platformResults }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'syndicate_blog': {
        const { id } = payload;

        const { data: post, error: fetchError } = await supabase
          .from('scheduled_posts')
          .select()
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;

        // Auto-generate SEO metadata if missing
        let seoTitle = post.seo_title;
        let seoDescription = post.seo_description;

        if (!seoTitle || !seoDescription) {
          const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
          if (LOVABLE_API_KEY) {
            const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-3-flash-preview',
                messages: [
                  { role: 'system', content: 'Generate SEO metadata. Return JSON: { "seo_title": "under 60 chars", "seo_description": "under 160 chars", "slug": "url-friendly-slug" }' },
                  { role: 'user', content: `Title: ${post.title}\nContent: ${post.content.substring(0, 500)}` }
                ],
                response_format: { type: "json_object" }
              }),
            });

            if (aiResp.ok) {
              const aiData = await aiResp.json();
              try {
                const seo = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');
                seoTitle = seo.seo_title || post.title;
                seoDescription = seo.seo_description || post.blog_excerpt;

                await supabase
                  .from('scheduled_posts')
                  .update({
                    seo_title: seoTitle,
                    seo_description: seoDescription,
                    blog_slug: seo.slug || post.blog_slug,
                  })
                  .eq('id', id);
              } catch {}
            }
          }
        }

        // Mark as syndicated
        const { data: updated, error: updateError } = await supabase
          .from('scheduled_posts')
          .update({
            status: 'syndicated',
            published_at: new Date().toISOString(),
            metadata: {
              ...post.metadata,
              syndicated_at: new Date().toISOString(),
              syndication_targets: post.platforms,
            },
          })
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ post: updated }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list_posts': {
        const { status: filterStatus, post_type } = payload;
        let query = supabase
          .from('scheduled_posts')
          .select()
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (filterStatus) query = query.eq('status', filterStatus);
        if (post_type) query = query.eq('post_type', post_type);

        const { data, error } = await query.limit(50);
        if (error) throw error;

        return new Response(JSON.stringify({ posts: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete_post': {
        const { id } = payload;
        const { error } = await supabase
          .from('scheduled_posts')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Distribute content error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to process request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
