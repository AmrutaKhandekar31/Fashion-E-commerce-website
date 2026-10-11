import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, Ruler } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, productsQuery } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { ProductCard } from "@/components/ProductCard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const all = await context.queryClient.ensureQueryData(productsQuery);
    const p = all.find((x) => x.slug === params.slug);
    if (!p) throw notFound();
    return { name: p.name, description: p.description };
  },
  head: ({ loaderData }) => loaderData
    ? { meta: [
        { title: `${loaderData.name} — DUNE` },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: `${loaderData.name} — DUNE` },
        { property: "og:description", content: loaderData.description },
      ] }
    : { meta: [{ title: "Not found — DUNE" }, { name: "robots", content: "noindex" }] },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(productsQuery);
  const p = data.find((x) => x.slug === slug)!;
  const [size, setSize] = useState<string | null>(p.sizes.length === 1 ? (p.sizes[0] ?? null) : null);
  const { add } = useCart();
  const { ids, toggle } = useWishlist();
  const related = data.filter((x) => x.id !== p.id && x.tags.some((t) => p.tags.includes(t))).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="grid gap-12 md:grid-cols-2">
        <img src={p.image} alt={p.name} width={768} height={960} className="aspect-[4/5] w-full bg-secondary object-cover" />
        <div className="md:pt-8">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{p.category}</p>
          <h1 className="mt-2 text-6xl md:text-7xl">{p.name}</h1>
          <p className="mt-3 font-display text-4xl text-primary">{formatPrice(p.price)}</p>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">{p.description}</p>
          <p className="mt-6 text-sm">Color: <strong>{p.colors.join(" / ")}</strong></p>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-widest">Size</p>
            <Link to="/size-finder" className="inline-flex items-center gap-1 text-sm text-primary"><Ruler className="h-4 w-4" />Find my size</Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.sizes.map((s) => (
              <button key={s} onClick={() => setSize(s)} className={cn("min-w-12 border px-3 py-2 text-sm", size === s ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}>{s}</button>
            ))}
          </div>
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => {
                if (!size) { toast.error("Pick a size first"); return; }
                add({ productId: p.id, slug: p.slug, name: p.name, price: Number(p.price), image: p.image, size });
                toast.success("Added to bag");
              }}
              className="flex-1 bg-primary py-4 font-semibold uppercase tracking-widest text-primary-foreground hover:opacity-90">Add to bag</button>
            <button onClick={() => toggle(p.id)} aria-label="Wishlist" className="border px-5">
              <Heart className={cn("h-5 w-5", ids.has(p.id) && "fill-accent text-accent")} />
            </button>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="text-5xl">Pairs well with</h2>
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}
