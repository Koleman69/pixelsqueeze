import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompressionRequest {
  files: Array<{
    file: string; // base64 encoded image
    fileName: string;
  }>;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  dpi?: number;
  isBulk?: boolean;
}

interface CompressionResponse {
  success: boolean;
  results: Array<{
    fileName: string;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    quality: number;
    compressedImage?: string;
    error?: string;
  }>;
  bulkDownloadUrl?: string;
  error?: string;
  requiresSubscription?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { files, quality = 80, maxWidth = 1920, maxHeight = 1920, dpi = 72, isBulk = false }: CompressionRequest = await req.json()
    
    // Check if user is authenticated for premium features
    let isSubscribed = false;
    let userId: string | null = null;
    let freeCompressionsUsed = 0;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData } = await supabase.auth.getUser(token);
        
        if (userData?.user?.email) {
          userId = userData.user.id;
          
          // Check subscription status
          const checkSubResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/check-subscription`, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json'
            }
          });
          
          if (checkSubResponse.ok) {
            const subData = await checkSubResponse.json();
            isSubscribed = subData.subscribed;
          }
          
          // Get current free compressions count
          const { data: subscriberData } = await supabase
            .from('subscribers')
            .select('free_compressions_used, subscribed')
            .eq('user_id', userId)
            .single();
          
          if (subscriberData) {
            freeCompressionsUsed = subscriberData.free_compressions_used || 0;
            isSubscribed = subscriberData.subscribed;
          }
        }
      } catch (error) {
        console.warn('Failed to check subscription:', error);
      }
    }

    // Check free compression limit for non-subscribers
    if (!isSubscribed) {
      if (freeCompressionsUsed >= 3) {
        return new Response(JSON.stringify({
          success: false,
          error: "You've used all 3 free compressions. Subscribe to Pixel Squeeze Pro for unlimited compression.",
          requiresSubscription: true,
          results: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
      
      if (files.length > 3) {
        return new Response(JSON.stringify({
          success: false,
          error: "Free users can only compress up to 3 images at once. Subscribe to Pixel Squeeze Pro for unlimited bulk compression.",
          requiresSubscription: true,
          results: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
      
      if (dpi > 72 || maxWidth > 1920 || maxHeight > 1920) {
        return new Response(JSON.stringify({
          success: false,
          error: "Advanced features like custom DPI and large sizes require Pixel Squeeze Pro subscription.",
          requiresSubscription: true,
          results: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
    }

    console.log(`Starting ${isBulk ? 'bulk ' : ''}compression for ${files.length} files with quality ${quality}, DPI ${dpi}`);

    const results = [];
    
    for (const fileData of files) {
      try {
        console.log(`Processing ${fileData.fileName}`);
        
        // Decode base64 image
        const imageData = Uint8Array.from(atob(fileData.file), c => c.charCodeAt(0));
        const originalSize = imageData.length;

        console.log(`Original file size: ${originalSize} bytes`);

        // Enhanced compression simulation with DPI and resizing considerations
        let compressionFactor = Math.max(0.1, quality / 100);
        
        // Adjust compression based on DPI (higher DPI = larger file)
        if (dpi > 72) {
          compressionFactor *= (72 / dpi) * 0.8; // Reduce compression efficiency for higher DPI
        }
        
        // Adjust for resizing
        const resizeFactor = (maxWidth * maxHeight) / (1920 * 1920);
        if (resizeFactor < 1) {
          compressionFactor *= resizeFactor; // Smaller dimensions = better compression
        }

        const simulatedCompressedSize = Math.floor(originalSize * compressionFactor);
        const compressionRatio = Math.round((1 - compressionFactor) * 100);

        // Simulate processing time (longer for premium features)
        const processingTime = isSubscribed ? 
          1000 + Math.random() * 2000 : // Faster processing for subscribers
          2000 + Math.random() * 3000;  // Standard processing time
          
        await new Promise(resolve => setTimeout(resolve, processingTime));

        results.push({
          fileName: fileData.fileName,
          originalSize,
          compressedSize: simulatedCompressedSize,
          compressionRatio,
          quality: Math.min(quality, isSubscribed ? 100 : 85), // Limit quality for free users
          compressedImage: fileData.file // In real implementation, this would be the processed image
        });

        console.log(`Compression complete: ${originalSize} -> ${simulatedCompressedSize} bytes (${compressionRatio}% reduction)`);
      } catch (error) {
        console.error(`Error processing ${fileData.fileName}:`, error);
        results.push({
          fileName: fileData.fileName,
          originalSize: 0,
          compressedSize: 0,
          compressionRatio: 0,
          quality: 0,
          error: `Failed to process ${fileData.fileName}: ${error.message}`
        });
      }
    }

    // Update free compressions counter for non-subscribers
    if (!isSubscribed && userId && results.some(r => !r.error)) {
      try {
        const successfulCompressions = results.filter(r => !r.error).length;
        await supabase
          .from('subscribers')
          .update({ 
            free_compressions_used: freeCompressionsUsed + successfulCompressions 
          })
          .eq('user_id', userId);
        
        console.log(`Updated free compressions: ${freeCompressionsUsed} -> ${freeCompressionsUsed + successfulCompressions}`);
      } catch (error) {
        console.error('Failed to update compression counter:', error);
      }
    }

    // Generate bulk download URL for subscribers with multiple files
    let bulkDownloadUrl;
    if (isBulk && isSubscribed && results.length > 1) {
      bulkDownloadUrl = `data:application/zip;base64,${btoa('bulk-download-placeholder')}`;
    }

    const response: CompressionResponse = {
      success: true,
      results,
      bulkDownloadUrl
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Compression error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    const errorResponse: CompressionResponse = {
      success: false,
      results: [],
      error: errorMessage
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    );
  }
})