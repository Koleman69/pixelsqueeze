import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const contentTypePrompts: Record<string, { system: string; userTemplate: (ctx: string) => string }> = {
  caption: {
    system: `You are an expert social media copywriter. Generate 3 unique captions optimized for engagement. Each caption should have a different angle/hook. Include relevant hashtags and emojis. Return JSON: { "results": [{ "title": "Caption angle", "content": "The caption text", "hashtags": ["#tag1"], "platform_tips": "Platform-specific advice" }] }`,
    userTemplate: (ctx) => `Generate 3 viral social media captions for: ${ctx}`,
  },
  visual: {
    system: `You are a creative director specializing in social media visuals and templates. Generate detailed visual/template concepts including layout descriptions, color palettes, typography suggestions, and copy placement. Return JSON: { "results": [{ "title": "Template name", "content": "Detailed visual description and layout", "dimensions": "Recommended size", "colors": ["#hex1", "#hex2"], "copy_overlay": "Suggested text overlay", "style_notes": "Design style guidance" }] }`,
    userTemplate: (ctx) => `Create 3 visual template concepts for: ${ctx}. Include Instagram post, Story, and carousel formats.`,
  },
  seo: {
    system: `You are an SEO specialist and conversion copywriter. Generate SEO-optimized product/service descriptions with meta tags, keywords, and structured content. Return JSON: { "results": [{ "title": "Description variant", "content": "The full SEO description", "meta_title": "Under 60 chars", "meta_description": "Under 160 chars", "keywords": ["keyword1", "keyword2"], "word_count": 150, "readability_score": "Easy/Medium/Advanced" }] }`,
    userTemplate: (ctx) => `Write 3 SEO-optimized descriptions for: ${ctx}. Target different intent levels (informational, commercial, transactional).`,
  },
  social_hooks: {
    system: `You are a viral content strategist. Generate scroll-stopping hooks and social media post openers across platforms (Instagram, X/Twitter, LinkedIn, TikTok captions). Each hook should use a different psychological trigger (curiosity, FOMO, controversy, storytelling, data). Return JSON: { "results": [{ "title": "Hook type", "content": "The hook text", "platform": "Best platform", "trigger": "Psychological trigger used", "follow_up": "Suggested post body after the hook" }] }`,
    userTemplate: (ctx) => `Generate 5 viral social hooks for: ${ctx}`,
  },
  email_sequence: {
    system: `You are an email marketing expert. Create a complete email sequence (welcome, nurture, conversion). Each email should have subject line, preview text, body copy, and CTA. Return JSON: { "results": [{ "title": "Email name (e.g., Welcome Email)", "subject_line": "Subject", "preview_text": "Preview snippet", "content": "Full email body in markdown", "cta_text": "Button text", "cta_url_suggestion": "/suggested-path", "send_timing": "When to send (e.g., Day 0, Day 2)" }] }`,
    userTemplate: (ctx) => `Create a 5-email sequence for: ${ctx}. Include welcome, value, social proof, urgency, and final conversion emails.`,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate admin user
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

    // Verify admin role
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { contentType, context, customInstructions } = await req.json();

    if (!contentType || !context) {
      return new Response(
        JSON.stringify({ error: 'contentType and context are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const promptConfig = contentTypePrompts[contentType];
    if (!promptConfig) {
      return new Response(
        JSON.stringify({ error: `Invalid contentType: ${contentType}. Valid types: ${Object.keys(contentTypePrompts).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = customInstructions
      ? `${promptConfig.system}\n\nAdditional instructions: ${customInstructions}`
      : promptConfig.system;

    console.log(`Admin content generation: type=${contentType}, user=${user.id}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: promptConfig.userTemplate(context) }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage limit reached. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      console.error('Failed to parse AI response, using raw content');
      parsedContent = { results: [{ title: 'Generated Content', content }] };
    }

    return new Response(JSON.stringify({
      contentType,
      context,
      ...parsedContent,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate content error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to generate content'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
