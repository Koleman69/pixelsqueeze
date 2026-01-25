import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName, fileType, fileSize, content, analysisType, isImage, imageData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt: string;
    let userContent: any[];

    if (isImage && imageData) {
      // Image analysis with vision
      systemPrompt = `You are an expert image analyst. Analyze the provided image and provide:
1. A comprehensive description of the image content (subjects, composition, colors, style)
2. Image quality assessment (sharpness, exposure, noise, artifacts)
3. Technical insights (estimated resolution quality, compression artifacts, color balance)
4. Optimization suggestions (compression recommendations, enhancement opportunities, best use cases)

Respond in JSON format:
{
  "analysis": "detailed analysis of image content and composition",
  "insights": ["quality insight 1", "technical insight 2", ...],
  "suggestions": ["optimization suggestion 1", "enhancement suggestion 2", ...]
}`;

      userContent = [
        {
          type: "text",
          text: `Analyze this image named "${fileName}" (${(fileSize / 1024).toFixed(2)} KB, type: ${fileType}). Provide content analysis, quality assessment, and optimization suggestions.`
        },
        {
          type: "image_url",
          image_url: {
            url: imageData
          }
        }
      ];
    } else {
      // Text/document analysis
      systemPrompt = `You are an expert file analyzer. Analyze the provided file content and provide:
1. A comprehensive analysis of the file's purpose and content
2. Key insights (as a JSON array of strings)
3. Actionable suggestions for improvement (as a JSON array of strings)

Respond in JSON format:
{
  "analysis": "detailed analysis text",
  "insights": ["insight 1", "insight 2", ...],
  "suggestions": ["suggestion 1", "suggestion 2", ...]
}`;

      userContent = [
        {
          type: "text",
          text: `Analyze this ${fileType} file named "${fileName}" (${(fileSize / 1024).toFixed(2)} KB):

${content.substring(0, 10000)}${content.length > 10000 ? '\n\n[Content truncated...]' : ''}

Analysis type: ${analysisType}`
        }
      ];
    }

    console.log(`Analyzing ${isImage ? 'image' : 'file'}: ${fileName}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const resultContent = data.choices?.[0]?.message?.content;
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultContent);
    } catch {
      parsedResult = {
        analysis: resultContent,
        insights: ["Analysis completed"],
        suggestions: ["Review the analysis above"]
      };
    }

    console.log(`Analysis complete for: ${fileName}`);

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
