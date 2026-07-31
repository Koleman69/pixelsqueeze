import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Override with the RESEND_FROM secret once a domain is verified in Resend.
const FROM = Deno.env.get("RESEND_FROM") ?? "PixelSqueeze <noreply@pixelsqueeze.app>";
// Used only if the primary sender domain is not yet verified in Resend.
// resend.dev only delivers to the Resend account owner's own address.
const FALLBACK_FROM = "PixelSqueeze <onboarding@resend.dev>";

const ALLOWED_ORIGINS = [
  "https://pixelsqueeze.app",
  "https://pixelsqueeze.lovable.app",
  "https://compressngo.app",
  "https://ai4hoteliers.com",
];

function resolveRedirectBase(origin: unknown): string {
  if (typeof origin === "string") {
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    if (/^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(origin)) return origin;
    if (/^http:\/\/localhost:\d+$/.test(origin)) return origin;
  }
  return ALLOWED_ORIGINS[0];
}

function emailHtml(link: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
      <h1 style="margin:0 0 12px;font-size:22px;color:#0f172a;">Reset your password</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
        We received a request to reset the password for your PixelSqueeze account.
        Tap the button below to choose a new password. This link expires in 1 hour.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${link}" style="display:inline-block;background:#3B82F6;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 24px;border-radius:12px;">Set a new password</a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Or copy this link into your browser:</p>
      <p style="margin:0 0 24px;font-size:12px;word-break:break-all;color:#3B82F6;">${link}</p>
      <p style="margin:0;font-size:13px;color:#94a3b8;">
        Didn't request this? You can safely ignore this email — your password will stay the same.
      </p>
    </div>
  </body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ok = () =>
    new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const redirectBase = resolveRedirectBase(body.origin);

    if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Valid email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${redirectBase}/reset-password` },
    });

    // Never reveal whether an account exists.
    if (error || !data?.properties?.action_link) {
      console.log("generateLink skipped:", error?.message ?? "no link returned");
      return ok();
    }

    const html = emailHtml(data.properties.action_link);
    const send = (from: string) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: "Reset your PixelSqueeze password",
          html,
        }),
      });

    let res = await send(FROM);

    if (res.status === 403) {
      const details = await res.text();
      console.error(`Resend rejected sender ${FROM} [403]: ${details} — retrying with fallback sender`);
      res = await send(FALLBACK_FROM);
    }

    if (!res.ok) {
      const details = await res.text();
      console.error(`Resend failed [${res.status}]: ${details}`);
      return new Response(
        JSON.stringify({ error: "Could not send reset email", status: res.status, details }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }


    return ok();
  } catch (e) {
    console.error("send-password-reset error:", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
