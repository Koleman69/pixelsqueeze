import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[UPLOAD-SHARED] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create authenticated client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { fileData, fileName, fileType, fileSize, expirationDays } = await req.json();

    if (!fileData || !fileName) {
      throw new Error("Missing required fields: fileData and fileName");
    }

    // Calculate expiration date
    let expiresAt: string | null = null;
    if (expirationDays !== null && expirationDays !== undefined) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expirationDays);
      expiresAt = expDate.toISOString();
    }

    logStep("Processing file", { fileName, fileType, fileSize, expirationDays, expiresAt });

    // Convert base64 to binary
    let binaryData: Uint8Array;
    
    if (fileData.startsWith('data:')) {
      // Remove data URL prefix
      const base64Data = fileData.split(',')[1];
      const binaryString = atob(base64Data);
      binaryData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        binaryData[i] = binaryString.charCodeAt(i);
      }
    } else {
      // Raw base64
      const binaryString = atob(fileData);
      binaryData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        binaryData[i] = binaryString.charCodeAt(i);
      }
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/${timestamp}_${sanitizedFileName}`;

    logStep("Uploading to storage", { filePath });

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("shared-files")
      .upload(filePath, binaryData, {
        contentType: fileType || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      logStep("Upload error", { error: uploadError.message });
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    logStep("File uploaded", { path: uploadData.path });

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("shared-files")
      .getPublicUrl(filePath);

    // Create shared file record
    const { data: sharedFile, error: dbError } = await supabase
      .from("shared_files")
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize || binaryData.length,
        file_type: fileType,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (dbError) {
      logStep("Database error", { error: dbError.message });
      // Clean up uploaded file
      await supabase.storage.from("shared-files").remove([filePath]);
      throw new Error(`Database error: ${dbError.message}`);
    }

    logStep("Shared file record created", { shareCode: sharedFile.share_code });

    // Generate share URL
    const baseUrl = req.headers.get("origin") || "https://pixelsqueeze.lovable.app";
    const shareUrl = `${baseUrl}/share/${sharedFile.share_code}`;

    return new Response(
      JSON.stringify({
        success: true,
        shareUrl,
        shareCode: sharedFile.share_code,
        publicUrl,
        expiresAt: sharedFile.expires_at,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    logStep("Error", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
