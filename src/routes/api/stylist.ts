import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createResponsesCall } from "@/lib/ai-responses.server";

export const Route = createFileRoute("/api/stylist")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI not configured", { status: 500 });
        const body = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(body.messages) || body.messages.length > 40) return new Response("Bad request", { status: 400 });

        const url = process.env["SUPABASE_URL"]!;
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const sb = createClient(url, key, {
          auth: { persistSession: false },
          global: { fetch: (input, init) => {
            const h = new Headers(init?.headers);
            if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
            h.set("apikey", key);
            return fetch(input, { ...init, headers: h });
          } },
        });
        const { data: products } = await sb.from("products").select("slug,name,category,price,colors,tags,description");
        const catalog = (products ?? []).map((p) => `- ${p.name} [slug:${p.slug}] (${p.category}, ₹${Math.round(p.price * 88).toLocaleString("en-IN")}, ${p.colors.join("/")}) tags: ${p.tags.join(", ")}`).join("\n");

        const instructions = `You are Mira, DUNE's warm, witty fashion stylist. Recommend complete outfits ONLY from this catalog:
${catalog}

Rules: Keep answers short (under 150 words). Use markdown bullet lists. For each recommended item write its name as a markdown link to /product/<slug>. Mention the total look price. Give one styling tip.`;

        const messages = await convertToModelMessages(body.messages);
        return createResponsesCall(request, { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, model: "openai/gpt-6-astra" }, messages, instructions).response();
      },
    },
  },
});
