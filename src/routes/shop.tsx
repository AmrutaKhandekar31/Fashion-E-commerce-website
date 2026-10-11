import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CATEGORIES, productsQuery } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — DUNE" },
      { name: "description", content: "Browse tops, bottoms, dresses, outerwear, shoes and accessories at DUNE." },
      { property: "og:title", content: "Shop — DUNE" },
      { property: "og:description", content: "Browse the full DUNE collection." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Shop,
});

function Shop() {
  const { data } = useSuspenseQuery(productsQuery);
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new");
  const list = useMemo(() => {
    let l = data.filter((p) => (cat === "all" || p.category === cat) && (p.name + p.tags.join(" ")).toLowerCase().includes(q.toLowerCase()));
    if (sort === "low") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "high") l = [...l].sort((a, b) => b.price - a.price);
    return l;
  }, [data, cat, q, sort]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-7xl">The collection</h1>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {["all", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={cn("border px-4 py-2 text-xs font-semibold uppercase tracking-widest", cat === c ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}>{c}</button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="ml-auto border bg-card px-3 py-2 text-sm" />
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="border bg-card px-3 py-2 text-sm">
          <option value="new">Newest</option><option value="low">Price: low</option><option value="high">Price: high</option>
        </select>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {list.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
      {list.length === 0 && <p className="mt-10 text-muted-foreground">Nothing matches — try another filter.</p>}
    </div>
  );
}
