import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, Square } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/stylist")({
  head: () => ({
    meta: [
      { title: "AI Stylist — DUNE" },
      { name: "description", content: "Chat with Mira, DUNE's AI stylist, for outfit ideas built from our collection." },
      { property: "og:title", content: "AI Stylist — DUNE" },
      { property: "og:description", content: "Personal outfit ideas from an AI stylist." },
    ],
  }),
  component: Stylist,
});

const prompts = ["Desert wedding guest look", "Casual weekend in the city", "First date, autumn evening", "Outfit under ₹18,000"];

function Stylist() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/stylist" }),
    onError: (e) => toast.error(e.message.includes("402") ? "AI credits ran out." : e.message.includes("429") ? "Too many requests — try again shortly." : "The stylist couldn't respond. Please try again."),
  });
  const busy = status === "submitted" || status === "streaming";
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const send = (t: string) => { if (!t.trim() || busy) return; sendMessage({ text: t }); setInput(""); };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-3xl flex-col px-4 py-12">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-sunset font-display text-3xl text-primary-foreground">M</div>
        <div>
          <h1 className="text-6xl">Mira, your stylist</h1>
          <p className="text-muted-foreground">Tell me the occasion — I'll build the look from our collection.</p>
        </div>
      </div>

      <div className="mt-10 flex-1 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {prompts.map((p) => <button key={p} onClick={() => send(p)} className="border px-4 py-2 text-sm hover:border-foreground">{p}</button>)}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={m.role === "user" ? "max-w-[80%] bg-ink px-4 py-3 text-ink-foreground" : "prose-chat max-w-none"}>
              {m.parts.map((part, i) =>
                part.type === "text" ? (
                  m.role === "user" ? <p key={i}>{part.text}</p> : (
                    <ReactMarkdown key={i} components={{
                      a: ({ href, children }) => href?.startsWith("/product/")
                        ? <Link to="/product/$slug" params={{ slug: href.replace("/product/", "") }} className="font-semibold text-primary underline">{children}</Link>
                        : <a href={href} className="underline">{children}</a>,
                      ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
                      p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
                    }}>{part.text}</ReactMarkdown>
                  )
                ) : null,
              )}
            </div>
          </div>
        ))}
        {status === "submitted" && <p className="animate-pulse text-sm text-muted-foreground">Mira is pulling pieces from the rail…</p>}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="sticky bottom-4 mt-6 flex items-center gap-2 border bg-card p-2 shadow-warm">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. Something bold for a gallery opening" className="flex-1 bg-transparent px-3 py-2 outline-none" />
        {busy ? (
          <button type="button" onClick={stop} aria-label="Stop" className="grid h-10 w-10 place-items-center bg-foreground text-background"><Square className="h-4 w-4" /></button>
        ) : (
          <button type="submit" aria-label="Send" className="grid h-10 w-10 place-items-center bg-primary text-primary-foreground"><ArrowUp className="h-5 w-5" /></button>
        )}
      </form>
    </div>
  );
}
