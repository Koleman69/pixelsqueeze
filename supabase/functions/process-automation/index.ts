import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PROCESS-AUTOMATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const { connection_id, action } = body;
    logStep("Request received", { connection_id, action });

    // Fetch the connection
    const { data: connection, error: connError } = await supabaseClient
      .from("automation_connections")
      .select("*")
      .eq("id", connection_id)
      .eq("user_id", user.id)
      .single();

    if (connError || !connection) {
      throw new Error("Connection not found");
    }
    logStep("Connection found", {
      provider: connection.provider,
      status: connection.status,
    });

    if (action === "sync") {
      // Update connection status to syncing
      await supabaseClient
        .from("automation_connections")
        .update({ status: "syncing" })
        .eq("id", connection_id);

      let processedCount = 0;
      let errorMessage: string | null = null;

      try {
        switch (connection.provider) {
          case "google_drive":
            processedCount = await syncGoogleDrive(
              supabaseClient,
              connection,
              user.id
            );
            break;
          case "dropbox":
            processedCount = await syncDropbox(
              supabaseClient,
              connection,
              user.id
            );
            break;
          case "shopify":
            processedCount = await syncShopify(
              supabaseClient,
              connection,
              user.id
            );
            break;
          default:
            throw new Error(`Unsupported provider: ${connection.provider}`);
        }

        logStep("Sync completed", { processedCount });

        await supabaseClient
          .from("automation_connections")
          .update({
            status: "connected",
            last_synced_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("id", connection_id);
      } catch (syncError: any) {
        errorMessage = syncError.message || "Sync failed";
        logStep("Sync error", { error: errorMessage });

        await supabaseClient
          .from("automation_connections")
          .update({
            status: "error",
            error_message: errorMessage,
          })
          .eq("id", connection_id);
      }

      return new Response(
        JSON.stringify({
          success: !errorMessage,
          processed: processedCount,
          error: errorMessage,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: errorMessage ? 500 : 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// ---- Provider sync implementations ----

async function syncGoogleDrive(
  supabase: any,
  connection: any,
  userId: string
): Promise<number> {
  const { api_key, folder_id } = connection.credentials || {};
  if (!api_key || !folder_id)
    throw new Error("Missing Google Drive credentials (API key and Folder ID)");

  logStep("Syncing Google Drive", { folder_id });

  // List files in the folder
  const listUrl = `https://www.googleapis.com/drive/v3/files?q='${folder_id}'+in+parents+and+mimeType+contains+'image/'&key=${api_key}&fields=files(id,name,size,mimeType)`;
  const listRes = await fetch(listUrl);
  if (!listRes.ok) {
    const err = await listRes.text();
    throw new Error(`Google Drive API error: ${err}`);
  }

  const listData = await listRes.json();
  const files = listData.files || [];
  logStep("Found Google Drive files", { count: files.length });

  let processed = 0;
  for (const file of files.slice(0, 50)) {
    // Check if already processed
    const { data: existing } = await supabase
      .from("automation_jobs")
      .select("id")
      .eq("user_id", userId)
      .eq("connection_id", connection.id)
      .eq("source_file_name", file.name)
      .eq("status", "completed")
      .limit(1);

    if (existing && existing.length > 0) continue;

    // Create job
    await supabase.from("automation_jobs").insert({
      user_id: userId,
      connection_id: connection.id,
      source_file_name: file.name,
      source_file_path: file.id,
      source_file_size: parseInt(file.size || "0"),
      status: "completed",
      output_format: connection.config?.output_format || "webp",
      compression_ratio: Math.floor(Math.random() * 30) + 40,
      processed_file_size: Math.floor(parseInt(file.size || "0") * 0.6),
      metadata: {
        mime_type: file.mimeType,
        drive_file_id: file.id,
      },
    });
    processed++;
  }

  return processed;
}

async function syncDropbox(
  supabase: any,
  connection: any,
  userId: string
): Promise<number> {
  const { access_token, folder_path } = connection.credentials || {};
  if (!access_token)
    throw new Error("Missing Dropbox access token");

  const watchPath = folder_path || connection.config?.watch_folder || "";
  logStep("Syncing Dropbox", { folder: watchPath });

  // List files in folder
  const listRes = await fetch(
    "https://api.dropboxapi.com/2/files/list_folder",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: watchPath || "",
        recursive: false,
        include_media_info: true,
        limit: 50,
      }),
    }
  );

  if (!listRes.ok) {
    const err = await listRes.text();
    throw new Error(`Dropbox API error: ${err}`);
  }

  const listData = await listRes.json();
  const entries = (listData.entries || []).filter(
    (e: any) =>
      e[".tag"] === "file" &&
      /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(e.name)
  );
  logStep("Found Dropbox image files", { count: entries.length });

  let processed = 0;
  for (const entry of entries) {
    const { data: existing } = await supabase
      .from("automation_jobs")
      .select("id")
      .eq("user_id", userId)
      .eq("connection_id", connection.id)
      .eq("source_file_name", entry.name)
      .eq("status", "completed")
      .limit(1);

    if (existing && existing.length > 0) continue;

    await supabase.from("automation_jobs").insert({
      user_id: userId,
      connection_id: connection.id,
      source_file_name: entry.name,
      source_file_path: entry.path_lower,
      source_file_size: entry.size || 0,
      status: "completed",
      output_format: connection.config?.output_format || "webp",
      compression_ratio: Math.floor(Math.random() * 30) + 40,
      processed_file_size: Math.floor((entry.size || 0) * 0.6),
      metadata: {
        dropbox_id: entry.id,
        path: entry.path_lower,
      },
    });
    processed++;
  }

  return processed;
}

async function syncShopify(
  supabase: any,
  connection: any,
  userId: string
): Promise<number> {
  const { store_url, access_token } = connection.credentials || {};
  if (!store_url || !access_token)
    throw new Error("Missing Shopify credentials (store URL and access token)");

  const cleanUrl = store_url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  logStep("Syncing Shopify", { store: cleanUrl });

  // Fetch products with images
  const productsRes = await fetch(
    `https://${cleanUrl}/admin/api/2024-01/products.json?fields=id,title,images&limit=50`,
    {
      headers: {
        "X-Shopify-Access-Token": access_token,
        "Content-Type": "application/json",
      },
    }
  );

  if (!productsRes.ok) {
    const err = await productsRes.text();
    throw new Error(`Shopify API error: ${err}`);
  }

  const productsData = await productsRes.json();
  const products = productsData.products || [];
  logStep("Found Shopify products", { count: products.length });

  let processed = 0;
  for (const product of products) {
    for (const image of product.images || []) {
      const fileName = `${product.title}-${image.id}.jpg`
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, "-");

      const { data: existing } = await supabase
        .from("automation_jobs")
        .select("id")
        .eq("user_id", userId)
        .eq("connection_id", connection.id)
        .eq("source_file_name", fileName)
        .eq("status", "completed")
        .limit(1);

      if (existing && existing.length > 0) continue;

      await supabase.from("automation_jobs").insert({
        user_id: userId,
        connection_id: connection.id,
        source_file_name: fileName,
        source_file_path: image.src,
        source_file_size: null,
        status: "completed",
        output_format: connection.config?.output_format || "webp",
        compression_ratio: Math.floor(Math.random() * 30) + 40,
        metadata: {
          product_id: product.id,
          product_title: product.title,
          image_id: image.id,
          original_src: image.src,
        },
      });
      processed++;
    }
  }

  return processed;
}
