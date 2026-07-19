import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[ANALYZE-COMPETITOR] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    logStep('User authenticated', { userId: user.id });

    const { url, competitorId, competitorName } = await req.json();

    if (!url || !competitorId) {
      throw new Error('URL and competitorId are required');
    }

    logStep('Analyzing competitor', { url, competitorId, competitorName });

    // Validate URL: only public http(s), block private/loopback/link-local hosts
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error('Invalid URL');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Only http(s) URLs are allowed');
    }
    const host = parsed.hostname.toLowerCase();
    const isBlockedHost =
      host === 'localhost' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^(0|10|127|169\.254|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(host) ||
      /^\[?(::1|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:|fe80:)/i.test(host) ||
      host === '::1' ||
      host === '169.254.169.254';
    if (isBlockedHost) {
      throw new Error('Target host is not allowed');
    }

    // Fetch the website content with a timeout and size cap
    let websiteContent = '';
    let fetchError: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(parsed.toString(), {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CompetitorAnalyzer/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const buf = await response.arrayBuffer();
        // Cap at 2 MB
        const slice = buf.byteLength > 2 * 1024 * 1024 ? buf.slice(0, 2 * 1024 * 1024) : buf;
        websiteContent = new TextDecoder('utf-8', { fatal: false }).decode(slice);
        logStep('Website content fetched', { contentLength: websiteContent.length });
      } else {
        fetchError = `HTTP ${response.status}`;
      }
    } catch (error) {
      fetchError = error instanceof Error ? error.message : 'Unknown fetch error';
      logStep('Failed to fetch website', { error: fetchError });
    }

    // Use AI to analyze the content
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const analysisPrompt = websiteContent 
      ? `Analyze this competitor's website content and extract key insights:

Website: ${url}
Company: ${competitorName}

HTML Content (first 15000 chars):
${websiteContent.substring(0, 15000)}

Provide a JSON response with the following structure:
{
  "overview": "Brief company overview",
  "key_offerings": ["list of main products/services"],
  "pricing_info": "Any visible pricing information or 'Not visible'",
  "target_audience": "Who they're targeting",
  "unique_value_proposition": "Their main differentiator",
  "recent_updates": "Any recent news, blog posts, or updates visible",
  "marketing_messaging": "Key marketing messages and tone",
  "technology_stack": ["visible technologies mentioned"],
  "call_to_actions": ["main CTAs on the site"],
  "competitive_strengths": ["perceived strengths"],
  "potential_weaknesses": ["potential gaps or weaknesses"]
}`
      : `The website ${url} for ${competitorName} could not be fetched directly. 
Based on the URL and company name, provide a general analysis structure with placeholder information.
Return a JSON object with these fields: overview, key_offerings, pricing_info, target_audience, unique_value_proposition, recent_updates, marketing_messaging, technology_stack, call_to_actions, competitive_strengths, potential_weaknesses.
Mark each field with "Analysis pending - website not accessible" where data is unavailable.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a competitive intelligence analyst. Analyze websites and extract actionable insights. Always respond with valid JSON.' 
          },
          { role: 'user', content: analysisPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep('AI API error', { status: aiResponse.status, error: errorText });
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    logStep('AI analysis complete', { hasContent: !!content });

    // Parse AI response
    let analysisResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        analysisResult = { overview: content, raw_response: true };
      }
    } catch (parseError) {
      logStep('Failed to parse AI response', { error: parseError });
      analysisResult = { overview: content, parse_error: true };
    }

    // Store the snapshot using service role for insert
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check for changes by comparing with previous snapshot
    const { data: previousSnapshot } = await supabaseAdmin
      .from('competitor_snapshots')
      .select('data')
      .eq('competitor_id', competitorId)
      .order('captured_at', { ascending: false })
      .limit(1)
      .single();

    const changeDetected = previousSnapshot 
      ? JSON.stringify(previousSnapshot.data) !== JSON.stringify(analysisResult)
      : false;

    // Insert new snapshot
    const { error: snapshotError } = await supabaseAdmin
      .from('competitor_snapshots')
      .insert({
        competitor_id: competitorId,
        user_id: user.id,
        snapshot_type: 'general',
        title: `Analysis of ${competitorName}`,
        description: analysisResult.overview || 'Website analysis complete',
        change_detected: changeDetected,
        data: analysisResult,
        captured_at: new Date().toISOString()
      });

    if (snapshotError) {
      logStep('Error saving snapshot', { error: snapshotError });
      throw snapshotError;
    }

    // Create alert if change detected
    if (changeDetected) {
      await supabaseAdmin
        .from('competitor_alerts')
        .insert({
          user_id: user.id,
          competitor_id: competitorId,
          alert_type: 'change',
          title: `Changes detected on ${competitorName}`,
          message: 'New website analysis shows differences from the previous snapshot.',
          priority: 'normal'
        });
    }

    logStep('Analysis complete', { changeDetected });

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisResult,
      changeDetected,
      fetchError
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logStep('Error in analyze-competitor', { error: error instanceof Error ? error.message : 'Unknown error' });
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to analyze competitor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
