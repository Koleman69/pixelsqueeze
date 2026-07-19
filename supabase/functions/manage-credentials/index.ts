import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENCRYPTION_PREFIX = "enc::";

async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("CREDENTIALS_ENCRYPTION_KEY");
  if (!secret) throw new Error("Encryption key not configured");
  // Derive a 256-bit AES key from the secret using HKDF-SHA256.
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "HKDF",
    false,
    ["deriveKey"],
  );
  return await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode("pixelsqueeze.automation.v1"),
      info: new TextEncoder().encode("aes-gcm-credentials-key"),
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  // Convert to base64
  return ENCRYPTION_PREFIX + btoa(String.fromCharCode(...combined));
}

async function decrypt(encryptedStr: string): Promise<string> {
  if (!encryptedStr.startsWith(ENCRYPTION_PREFIX)) {
    return encryptedStr; // Not encrypted, return as-is (legacy data)
  }
  const key = await getEncryptionKey();
  const data = Uint8Array.from(
    atob(encryptedStr.slice(ENCRYPTION_PREFIX.length)),
    (c) => c.charCodeAt(0)
  );
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

async function encryptCredentials(
  creds: Record<string, string>
): Promise<Record<string, string>> {
  const encrypted: Record<string, string> = {};
  for (const [k, v] of Object.entries(creds)) {
    encrypted[k] = typeof v === "string" && v ? await encrypt(v) : v;
  }
  return encrypted;
}

async function decryptCredentials(
  creds: Record<string, string>
): Promise<Record<string, string>> {
  const decrypted: Record<string, string> = {};
  for (const [k, v] of Object.entries(creds)) {
    decrypted[k] = typeof v === "string" && v ? await decrypt(v) : v;
  }
  return decrypted;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const { action, ...body } = await req.json();

    if (action === "save") {
      const { provider, display_name, credentials, config } = body;
      if (!provider || !credentials) {
        return new Response(
          JSON.stringify({ error: "Missing provider or credentials" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const encryptedCreds = await encryptCredentials(credentials);

      const { error } = await supabaseAdmin
        .from("automation_connections")
        .upsert({
          user_id: userId,
          provider,
          display_name: display_name || provider,
          credentials: encryptedCreds,
          config: config || { output_format: "webp" },
          is_active: true,
          status: "connected",
        }, { onConflict: "user_id,provider" })
        // Fallback: try without onConflict
        ;

      if (error) {
        // If upsert with onConflict fails, try update then insert
        const { data: existing } = await supabaseAdmin
          .from("automation_connections")
          .select("id")
          .eq("user_id", userId)
          .eq("provider", provider)
          .single();

        if (existing) {
          const { error: updateError } = await supabaseAdmin
            .from("automation_connections")
            .update({
              display_name: display_name || provider,
              credentials: encryptedCreds,
              config: config || { output_format: "webp" },
              is_active: true,
              status: "connected",
            })
            .eq("id", existing.id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabaseAdmin
            .from("automation_connections")
            .insert({
              user_id: userId,
              provider,
              display_name: display_name || provider,
              credentials: encryptedCreds,
              config: config || { output_format: "webp" },
              is_active: true,
              status: "connected",
            });
          if (insertError) throw insertError;
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[manage-credentials] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Export for use by process-automation
export { decryptCredentials };
