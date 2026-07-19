// Validates a share code and returns a short-lived signed URL for the file.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const code: string | undefined = body?.code;
    if (!code || typeof code !== "string" || code.length < 6 || code.length > 128) {
      return new Response(JSON.stringify({ error: "Invalid share code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: rows, error } = await admin.rpc("get_shared_file_by_code", { _code: code });
    if (error || !rows || rows.length === 0) {
      return new Response(JSON.stringify({ error: "Not found or expired" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const file = rows[0];

    const { data: signed, error: signErr } = await admin.storage
      .from("shared-files")
      .createSignedUrl(file.file_path, 60 * 10); // 10 minutes

    if (signErr || !signed?.signedUrl) {
      return new Response(JSON.stringify({ error: "Could not sign URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        file: {
          id: file.id,
          file_name: file.file_name,
          file_size: file.file_size,
          file_type: file.file_type,
          download_count: file.download_count,
          expires_at: file.expires_at,
          created_at: file.created_at,
        },
        signed_url: signed.signedUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("get-shared-file error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
