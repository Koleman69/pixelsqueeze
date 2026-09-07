import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Tables that hold data scoped directly to a user_id.
const USER_TABLES = [
  "ai_usage",
  "alert_preferences",
  "automation_jobs",
  "automation_connections",
  "batch_jobs",
  "batch_processing_stats",
  "campaign_triggers",
  "competitor_alerts",
  "competitor_snapshots",
  "tracked_competitors",
  "scheduled_posts",
  "posting_workflows",
  "shared_files",
  "user_collections",
  "user_folders",
  "subscriber_audit_log",
  "subscribers",
  "user_roles",
  "profiles",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error("[DELETE-ACCOUNT] invalid token", userError?.message);
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    console.log("[DELETE-ACCOUNT] start", userId);

    // Remove stored files belonging to the user (best effort).
    try {
      const { data: files } = await admin
        .from("shared_files")
        .select("file_path")
        .eq("user_id", userId);
      const paths = (files ?? []).map((f: { file_path: string }) => f.file_path).filter(Boolean);
      if (paths.length) {
        await admin.storage.from("shared-files").remove(paths);
        console.log("[DELETE-ACCOUNT] removed storage objects", paths.length);
      }
    } catch (e) {
      console.error("[DELETE-ACCOUNT] storage cleanup skipped", (e as Error).message);
    }

    for (const table of USER_TABLES) {
      const { error } = await admin.from(table).delete().eq("user_id", userId);
      if (error) console.error(`[DELETE-ACCOUNT] ${table}:`, error.message);
    }

    const { error: delError } = await admin.auth.admin.deleteUser(userId);
    if (delError) {
      console.error("[DELETE-ACCOUNT] auth delete failed", delError.message);
      return new Response(JSON.stringify({ error: delError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[DELETE-ACCOUNT] deleted", userId);
    return new Response(JSON.stringify({ deleted: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[DELETE-ACCOUNT] error", (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
