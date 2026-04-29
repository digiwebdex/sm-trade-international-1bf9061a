import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image_url, product_id } = await req.json();
    if (!image_url) return json(400, { error: "image_url required" });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) return json(500, { error: "LOVABLE_API_KEY not configured" });

    // Ask Nano Banana to remove background and return a transparent PNG
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Remove the background from this product image completely. Output a clean PNG with a fully transparent background. Keep the product itself fully intact, sharp, and centered. Do not add any shadow, reflection, color cast, watermark, or text. Preserve original colors and details exactly.",
              },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (aiResp.status === 429) return json(429, { error: "Rate limit exceeded. Please try again later." });
    if (aiResp.status === 402) return json(402, { error: "AI credits exhausted. Please add credits in workspace settings." });
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return json(500, { error: "AI gateway error" });
    }

    const data = await aiResp.json();
    const dataUrl: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      return json(500, { error: "AI did not return an image" });
    }

    // data:image/png;base64,xxxxxx
    const commaIdx = dataUrl.indexOf(",");
    const meta = dataUrl.slice(5, commaIdx); // image/png;base64
    const base64 = dataUrl.slice(commaIdx + 1);
    const contentType = meta.split(";")[0] || "image/png";
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    // Upload to Supabase Storage (products bucket — public)
    const supa = createClient(SUPABASE_URL, SERVICE_KEY);
    const filename = `nobg/${product_id || "img"}-${Date.now()}.png`;
    const { error: upErr } = await supa.storage
      .from("products")
      .upload(filename, bytes, { contentType, upsert: false });
    if (upErr) {
      console.error("Storage upload error:", upErr);
      return json(500, { error: "Failed to upload processed image" });
    }
    const { data: pub } = supa.storage.from("products").getPublicUrl(filename);
    const newUrl = pub.publicUrl;

    // Optionally update product row directly
    if (product_id) {
      const { error: updErr } = await supa
        .from("products")
        .update({ image_url: newUrl })
        .eq("id", product_id);
      if (updErr) console.error("Product update error:", updErr);
    }

    return json(200, { url: newUrl });
  } catch (e) {
    console.error("remove-bg error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
