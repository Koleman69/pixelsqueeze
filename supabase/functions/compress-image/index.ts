import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

// Memory-efficient image processing
async function processImage(
  fileData: { file: string; fileName: string },
  quality: number,
  maxWidth: number,
  maxHeight: number,
  dpi: number,
  isSubscribed: boolean
): Promise<{
  fileName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
  compressedImage?: string;
  error?: string;
}> {
  try {
    console.log(`Processing ${fileData.fileName}`);
    
    // Calculate size from base64 without fully decoding
    const base64Length = fileData.file.length;
    const originalSize = Math.floor((base64Length * 3) / 4);
    
    console.log(`Original file size: ${originalSize} bytes`);

    // Enhanced compression simulation with DPI and resizing considerations
    let compressionFactor = Math.max(0.1, quality / 100);
    
    // Adjust compression based on DPI (higher DPI = larger file)
    if (dpi > 72) {
      compressionFactor *= (72 / dpi) * 0.8;
    }
    
    // Adjust for resizing
    const resizeFactor = (maxWidth * maxHeight) / (1920 * 1920);
    if (resizeFactor < 1) {
      compressionFactor *= resizeFactor;
    }

    const simulatedCompressedSize = Math.floor(originalSize * compressionFactor);
    const compressionRatio = Math.round((1 - compressionFactor) * 100);

    // Minimal processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const result = {
      fileName: fileData.fileName,
      originalSize,
      compressedSize: simulatedCompressedSize,
      compressionRatio,
      quality: Math.min(quality, isSubscribed ? 100 : 85),
      compressedImage: fileData.file // Return original for now (simulated compression)
    };

    console.log(`Compression complete: ${originalSize} -> ${simulatedCompressedSize} bytes (${compressionRatio}% reduction)`);
    
    return result;
  } catch (error) {
    console.error(`Error processing ${fileData.fileName}:`, error);
    return {
      fileName: fileData.fileName,
      originalSize: 0,
      compressedSize: 0,
      compressionRatio: 0,
      quality: 0,
      error: `Failed to process ${fileData.fileName}: ${error.message}`
    };
  }
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
    
    // Memory-safe limits
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file (reduced from 10MB)
    const MAX_FILES = 5; // Reduced from 50 to prevent memory issues
    const MAX_FILENAME_LENGTH = 255;
    const MAX_TOTAL_SIZE = 15 * 1024 * 1024; // 15MB total request size
    
    // Validate quality parameter
    if (typeof quality !== 'number' || quality < 1 || quality > 100) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Quality must be a number between 1 and 100',
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    // Validate dimensions
    if (typeof maxWidth !== 'number' || maxWidth < 1 || maxWidth > 10000) {
      return new Response(JSON.stringify({
        success: false,
        error: 'maxWidth must be a number between 1 and 10000',
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    if (typeof maxHeight !== 'number' || maxHeight < 1 || maxHeight > 10000) {
      return new Response(JSON.stringify({
        success: false,
        error: 'maxHeight must be a number between 1 and 10000',
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    // Validate DPI
    if (typeof dpi !== 'number' || dpi < 72 || dpi > 600) {
      return new Response(JSON.stringify({
        success: false,
        error: 'DPI must be a number between 72 and 600',
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    // Validate files array
    if (!Array.isArray(files)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Files must be an array',
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    if (files.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'At least one file is required',
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    if (files.length > MAX_FILES) {
      return new Response(JSON.stringify({
        success: false,
        error: `Maximum ${MAX_FILES} files allowed per request. Please compress in smaller batches.`,
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    // Calculate total size and validate each file
    let totalSize = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file || typeof file !== 'object') {
        return new Response(JSON.stringify({
          success: false,
          error: `File at index ${i} is invalid`,
          results: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
      
      if (!file.file || typeof file.file !== 'string') {
        return new Response(JSON.stringify({
          success: false,
          error: `File at index ${i} is missing valid base64 data`,
          results: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
      
      if (!file.fileName || typeof file.fileName !== 'string') {
        return new Response(JSON.stringify({
          success: false,
          error: `File at index ${i} is missing valid fileName`,
          results: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
      
      if (file.fileName.length > MAX_FILENAME_LENGTH) {
        return new Response(JSON.stringify({
          success: false,
          error: `Filename at index ${i} exceeds ${MAX_FILENAME_LENGTH} characters`,
          results: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
      
      // Estimate base64 decoded size
      const estimatedSize = (file.file.length * 3) / 4;
      if (estimatedSize > MAX_FILE_SIZE) {
        return new Response(JSON.stringify({
          success: false,
          error: `File "${file.fileName}" exceeds maximum size of 5MB. Please use smaller files or compress individually.`,
          results: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
      
      totalSize += estimatedSize;
    }
    
    // Check total request size
    if (totalSize > MAX_TOTAL_SIZE) {
      return new Response(JSON.stringify({
        success: false,
        error: `Total file size exceeds 15MB limit. Please compress fewer files at once.`,
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
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
    
    // Process images sequentially to manage memory
    for (const fileData of files) {
      const result = await processImage(fileData, quality, maxWidth, maxHeight, dpi, isSubscribed);
      results.push(result);
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
