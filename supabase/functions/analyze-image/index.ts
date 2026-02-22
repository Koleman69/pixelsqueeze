import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalysisResult {
  imageType: string;
  dominantColors: string[];
  composition: string;
  platforms: {
    platform: string;
    score: number;
    reason: string;
    recommendedSettings: {
      quality: number;
      maxWidth: number;
      maxHeight: number;
      dpi: number;
    };
    aspectRatio?: string;
  }[];
  styleEnhancements: {
    name: string;
    description: string;
    intensity: 'subtle' | 'moderate' | 'strong';
    cssFilter?: string;
  }[];
  aestheticScore: number;
  suggestions: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageBase64, fileName } = await req.json();

    if (!imageBase64) {
      console.error("[analyze-image] No image data provided");
      return new Response(
        JSON.stringify({ error: "No image data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[analyze-image] LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[analyze-image] Analyzing image: ${fileName || 'unnamed'}`);

    const systemPrompt = `You are an expert image analyst for a compression and optimization app. Analyze the provided image and return a JSON object with the following structure:

{
  "imageType": "photograph|graphic|text-heavy|illustration|screenshot|logo|product",
  "dominantColors": ["#hexcode1", "#hexcode2", "#hexcode3"],
  "composition": "brief description of composition and subject matter",
  "platforms": [
    {
      "platform": "Instagram Feed",
      "score": 95,
      "reason": "Perfect for lifestyle content with strong visual appeal",
      "recommendedSettings": { "quality": 85, "maxWidth": 1080, "maxHeight": 1080, "dpi": 72 },
      "aspectRatio": "1:1"
    }
  ],
  "styleEnhancements": [
    {
      "name": "Warm Sunset",
      "description": "Adds warm orange tones for a cozy feel",
      "intensity": "moderate",
      "cssFilter": "saturate(1.1) sepia(0.15) brightness(1.05)"
    }
  ],
  "aestheticScore": 85,
  "suggestions": ["Crop slightly to improve rule of thirds", "Consider increasing contrast"]
}

Platform options to consider: Instagram Feed, Instagram Stories, Instagram Reels, Twitter/X, Facebook, LinkedIn, Pinterest, TikTok, YouTube Thumbnail, Website Hero, Email Newsletter, Print, E-commerce.

Style enhancements should suggest 2-4 options appropriate for the image content. Use real CSS filter values.

Be specific and actionable in your suggestions. Score platforms 0-100 based on how suitable the image is.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image${fileName ? ` named "${fileName}"` : ''} and provide optimization recommendations in JSON format.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("[analyze-image] Rate limited");
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("[analyze-image] Payment required");
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("[analyze-image] AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to analyze image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[analyze-image] No content in AI response");
      return new Response(
        JSON.stringify({ error: "No analysis generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[analyze-image] AI response received, parsing...");

    // Extract JSON from the response (handle markdown code blocks)
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }

    let analysis: AnalysisResult;
    try {
      analysis = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("[analyze-image] Failed to parse AI response as JSON:", parseError);
      console.log("[analyze-image] Raw content:", content);
      
      // Return a fallback analysis
      analysis = {
        imageType: "photograph",
        dominantColors: ["#4A90A4", "#2C3E50", "#ECF0F1"],
        composition: "Image analyzed but detailed parsing failed",
        platforms: [
          {
            platform: "Instagram Feed",
            score: 80,
            reason: "Good for social sharing",
            recommendedSettings: { quality: 85, maxWidth: 1080, maxHeight: 1080, dpi: 72 },
            aspectRatio: "1:1"
          },
          {
            platform: "Web",
            score: 85,
            reason: "Suitable for web optimization",
            recommendedSettings: { quality: 80, maxWidth: 1920, maxHeight: 1080, dpi: 72 }
          }
        ],
        styleEnhancements: [
          {
            name: "Vibrant",
            description: "Boost colors for more visual impact",
            intensity: "moderate",
            cssFilter: "saturate(1.2) contrast(1.05)"
          }
        ],
        aestheticScore: 75,
        suggestions: ["Consider adjusting brightness", "Try different aspect ratios for various platforms"]
      };
    }

    console.log("[analyze-image] Analysis complete:", analysis.imageType);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[analyze-image] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
