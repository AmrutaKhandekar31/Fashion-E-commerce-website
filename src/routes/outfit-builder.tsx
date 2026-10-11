import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Shuffle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, productsQuery, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/outfit-builder")({
  head: () => ({
    meta: [
      { title: "Outfit Builder — DUNE" },
      { name: "description", content: "Mix and match tops, bottoms, shoes and extras to build and save complete looks." },
      { property: "og:title", content: "Outfit Builder — DUNE" },
      { property: "og:description", content: "Mix and match pieces into complete looks." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Builder,
});

const SLOTS = [
  { key: "top", label: "Top layer", cats: ["tops", "outerwear", "dresses"] },
  { key: "bottom", label: "Bottom", cats: ["bottoms"] },
  { key: "shoes", label: "Shoes", cats: ["shoes"] },
  { key: "extra", label: "Accessory", cats: ["accessories"] },
] as const;

function Builder() {
  const { data } = useSuspenseQuery(productsQuery);
  const { user } = useAuth();
  const { add } = useCart();
  const qc = useQueryClient();
  const pools = SLOTS.map((s) => data.filter((p) => (s.cats as readonly string[]).includes(p.category)));
  const [idx, setIdx] = useState<number[]>(SLOTS.map(() => 0));
  const [name, setName] = useState("");
  const picks = pools.map((pool, i) => pool[idx[i]! % pool.length]).filter(Boolean) as Product[];
  const total = picks.reduce((s, p) => s + Number(p.price), 0);

  const saved = useQuery({
    queryKey: ["outfits", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("saved_outfits").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const shift = (i: number, d: number) => setIdx((v) => v.map((x, j) => (j === i ? (x + d + pools[i]!.length) % pools[i]!.length : x)));
  const shuffle = () => setIdx(pools.map((p) => Math.floor(Math.random() * p.length)));
  const save = async () => {
    if (!user) { toast("Sign in to save looks"); return; }
    await supabase.from("saved_outfits").insert({ user_id: user.id, name: name || "My look", product_ids: picks.map((p) => p.id) });
    setName(""); toast.success("Look saved");
    qc.invalidateQueries({ queryKey: ["outfits", user.id] });
  };
  const addAll = () => {
    picks.forEach((p) => add({ productId: p.id, slug: p.slug, name: p.name, price: Number(p.price), image: p.image, size: p.sizes[Math.floor(p.sizes.length / 2)] ?? "One Size" }));
    toast.success("Whole look added — check sizes in your bag");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-7xl">Outfit builder</h1>
        <button onClick={shuffle} className="inline-flex items-center gap-2 border border-foreground px-5 py-3 text-sm font-semibold uppercase tracking-widest hover:bg-foreground hover:text-background"><Shuffle className="h-4 w-4" />Surprise me</button>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="grid grid-cols-2 gap-4">
          {SLOTS.map((s, i) => {
            const p = pools[i]![idx[i]! % pools[i]!.length];
            if (!p) return null;
            return (
              <div key={s.key} className="relative bg-secondary">
                <img src={p.image} alt={p.name} loading="lazy" width={768} height={960} className="aspect-[4/5] w-full object-cover" />
                <span className="absolute left-3 top-3 bg-ink px-2 py-1 font-display text-sm text-ink-foreground">{s.label}</span>
                <button onClick={() => shift(i, -1)} aria-label="Previous" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-card p-2 shadow-warm"><ChevronLeft className="h-5 w-5" /></button>
                <button onClick={() => shift(i, 1)} aria-label="Next" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-card p-2 shadow-warm"><ChevronRight className="h-5 w-5" /></button>
                <div className="absolute inset-x-0 bottom-0 bg-card/90 px-3 py-2 text-sm"><strong>{p.name}</strong> · {formatPrice(p.price)}</div>
              </div>
            );
          })}
        </div>
        <aside className="h-fit border bg-card p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Look total</p>
          <p className="font-display text-6xl text-primary">{formatPrice(total)}</p>
          <ul className="mt-4 space-y-1 text-sm">{picks.map((p) => <li key={p.id}>— {p.name}</li>)}</ul>
          <button onClick={addAll} className="mt-6 w-full bg-primary py-3 font-semibold uppercase tracking-widest text-primary-foreground">Add look to bag</button>
          <div className="mt-4 flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name this look" className="flex-1 border bg-background px-3 py-2 text-sm" />
            <button onClick={save} className="border border-foreground px-4 text-sm font-semibold uppercase">Save</button>
          </div>
          {user && (saved.data?.length ?? 0) > 0 && (
            <div className="mt-6 border-t pt-4">
              <p className="font-display text-2xl">Saved looks</p>
              <ul className="mt-2 space-y-2">
                {saved.data!.map((o) => (
                  <li key={o.id} className="flex items-center justify-between text-sm">
                    <button className="hover:text-primary" onClick={() => setIdx(SLOTS.map((_, i) => Math.max(0, pools[i]!.findIndex((p) => o.product_ids.includes(p.id)))))}>{o.name}</button>
                    <button aria-label="Delete" onClick={async () => { await supabase.from("saved_outfits").delete().eq("id", o.id); qc.invalidateQueries({ queryKey: ["outfits", user.id] }); }}><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
