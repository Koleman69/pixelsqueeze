import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const platformSpecs: Record<string, { maxLength: number; hashtagCount: number; style: string }> = {
  instagram: { 
    maxLength: 2200, 
    hashtagCount: 15, 
    style: 'Use emojis naturally. Include a hook in the first line. Add line breaks for readability.'
  },
  twitter: { 
    maxLength: 280, 
    hashtagCount: 3, 
    style: 'Be punchy and direct. Use trending formats. Include a call-to-action.'
  },
  youtube: { 
    maxLength: 500, 
    hashtagCount: 5, 
    style: 'Focus on searchability. Include keywords. Add a subscribe CTA.'
  },
  facebook: { 
    maxLength: 500, 
    hashtagCount: 5, 
    style: 'Be conversational. Ask questions to drive engagement. Use storytelling.'
  },
  pinterest: { 
    maxLength: 500, 
    hashtagCount: 10, 
    style: 'Be descriptive and inspirational. Focus on value and tips. Include keywords.'
  }
};

const toneGuides: Record<string, string> = {
  viral: 'Use trending phrases, create FOMO, be bold and attention-grabbing. Start with a hook that stops the scroll.',
  professional: 'Maintain authority and credibility. Use industry terminology appropriately. Be informative and valuable.',
  funny: 'Use humor, puns, and wit. Be relatable and light-hearted. Include unexpected twists.',
  luxury: 'Use sophisticated language. Evoke exclusivity and aspiration. Focus on quality and experience.',
  casual: 'Be friendly and approachable. Use everyday language. Feel like a friend sharing something cool.',
  'brand-safe': 'Keep it clean and appropriate for all audiences. Focus on positivity and value. Avoid controversy.'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
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

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { platform, tone, context } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const platformSpec = platformSpecs[platform] || platformSpecs.instagram;
    const toneGuide = toneGuides[tone] || toneGuides.viral;

    const systemPrompt = `You are an expert social media copywriter who creates viral, engaging captions that drive engagement. You understand platform algorithms and what makes content perform well.

Platform: ${platform.toUpperCase()}
- Max length: ${platformSpec.maxLength} characters
- Style: ${platformSpec.style}
- Include ${platformSpec.hashtagCount} relevant hashtags

Tone: ${tone.toUpperCase()}
${toneGuide}

IMPORTANT RULES:
1. The caption must be immediately engaging - hook the reader in the first line
2. Include a clear call-to-action
3. Make it shareable and relatable
4. Optimize for the specific platform's algorithm
5. Return ONLY valid JSON with no additional text`;

    const userPrompt = `Create a ${tone} caption for ${platform} about: ${context}

Return JSON in this exact format:
{
  "caption": "The main caption text here",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
}`;

    console.log('Generating caption for:', { platform, tone, context });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response:', content);

    // Parse the JSON response
    let parsedContent;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error, using fallback:', parseError);
      // Fallback: treat the whole response as the caption
      parsedContent = {
        caption: content.replace(/```json|```/g, '').trim(),
        hashtags: []
      };
    }

    return new Response(JSON.stringify({
      caption: parsedContent.caption || content,
      hashtags: parsedContent.hashtags || [],
      platform,
      tone
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate caption error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate caption'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
