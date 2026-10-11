import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Layers, MessageCircle, Ruler } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { productsQuery } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DUNE — Fashion styled by AI" },
      { name: "description", content: "Shop sun-washed essentials, chat with an AI stylist, build outfits and find your perfect size." },
      { property: "og:title", content: "DUNE — Fashion styled by AI" },
      { property: "og:description", content: "Shop sun-washed essentials with an AI stylist, outfit builder and size finder." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Index,
});

const features = [
  { to: "/stylist", icon: MessageCircle, title: "AI Stylist", text: "Tell it the occasion. Get a full look from our collection." },
  { to: "/outfit-builder", icon: Layers, title: "Outfit Builder", text: "Mix tops, bottoms and shoes. Save looks you love." },
  { to: "/size-finder", icon: Ruler, title: "Size Finder", text: "Height, weight, fit — we'll tell you your size." },
] as const;

function Index() {
  const { data } = useSuspenseQuery(productsQuery);
  const fresh = data.filter((p) => p.is_new).slice(0, 4);
  return (
    <>
      <section className="relative h-[88vh] min-h-[560px] overflow-hidden grain">
        <img src={hero} alt="Model in a camel trench in a desert canyon" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/30 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-20 text-ink-foreground">
          <p className="animate-rise text-sm font-semibold uppercase tracking-[0.3em]">Collection 26 — Golden Hour</p>
          <h1 className="animate-rise mt-3 max-w-3xl text-7xl md:text-9xl">Dressed by the desert</h1>
          <div className="animate-rise mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="inline-flex items-center gap-2 bg-primary px-6 py-3 font-semibold uppercase tracking-widest text-primary-foreground hover:opacity-90">Shop now <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/stylist" className="inline-flex items-center gap-2 border border-ink-foreground px-6 py-3 font-semibold uppercase tracking-widest hover:bg-ink-foreground hover:text-ink">Ask the stylist</Link>
          </div>
        </div>
      </section>

      <div className="overflow-hidden bg-sunset py-3 text-primary-foreground">
        <div className="flex w-max animate-marquee gap-10 font-display text-2xl">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            ["Free shipping over ₹13,200", "AI styled looks", "Sun-washed fabrics", "Find your size in 10 seconds", "Easy 30-day returns"].map((t) => <span key={k + t}>✦ {t}</span>),
          )}
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-20 md:grid-cols-3">
        {features.map((f) => (
          <Link key={f.to} to={f.to} className="group border bg-card p-8 transition hover:-translate-y-1 hover:shadow-warm">
            <f.icon className="h-8 w-8 text-primary" />
            <h2 className="mt-6 text-4xl">{f.title}</h2>
            <p className="mt-2 text-muted-foreground">{f.text}</p>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-widest group-hover:text-primary">Try it <ArrowRight className="h-4 w-4" /></span>
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-6xl">New arrivals</h2>
          <Link to="/shop" className="text-sm font-semibold uppercase tracking-widest hover:text-primary">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {fresh.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>
    </>
  );
}
