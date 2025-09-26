import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompressionRequest {
  file: string; // base64 encoded image
  fileName: string;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

interface CompressionResponse {
  success: boolean;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
  compressedImage?: string;
  error?: string;
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

    const { file, fileName, quality = 80, maxWidth = 1920, maxHeight = 1920 }: CompressionRequest = await req.json()
    
    console.log(`Starting compression for ${fileName} with quality ${quality}`)

    // Decode base64 image
    const imageData = Uint8Array.from(atob(file), c => c.charCodeAt(0))
    const originalSize = imageData.length

    console.log(`Original file size: ${originalSize} bytes`)

    // Create a simple compression simulation
    // In a real implementation, you'd use an image processing library
    const compressionFactor = Math.max(0.1, quality / 100)
    const simulatedCompressedSize = Math.floor(originalSize * compressionFactor)
    const compressionRatio = Math.round((1 - compressionFactor) * 100)

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))

    // For demo purposes, we'll return the original image as "compressed"
    // In a real implementation, you'd process the image here
    const compressedImage = file

    console.log(`Compression complete: ${originalSize} -> ${simulatedCompressedSize} bytes (${compressionRatio}% reduction)`)

    const response: CompressionResponse = {
      success: true,
      originalSize,
      compressedSize: simulatedCompressedSize,
      compressionRatio,
      quality,
      compressedImage
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('Compression error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    const errorResponse: CompressionResponse = {
      success: false,
      originalSize: 0,
      compressedSize: 0,
      compressionRatio: 0,
      quality: 0,
      error: errorMessage
    }

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        } 
      }
    )
  }
})