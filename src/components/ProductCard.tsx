import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { formatPrice, type Product } from "@/lib/products";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export function ProductCard({ p }: { p: Product }) {
  const { ids, toggle } = useWishlist();
  const saved = ids.has(p.id);
  return (
    <div className="group relative">
      <Link to="/product/$slug" params={{ slug: p.slug }} className="block overflow-hidden bg-secondary">
        <img src={p.image} alt={p.name} loading="lazy" width={768} height={960}
          className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        {p.is_new && <span className="absolute left-3 top-3 bg-ink px-2 py-1 font-display text-sm text-ink-foreground">NEW</span>}
      </Link>
      <button aria-label="Toggle wishlist" onClick={() => toggle(p.id)}
        className="absolute right-3 top-3 rounded-full bg-card/90 p-2 transition hover:scale-110">
        <Heart className={cn("h-4 w-4", saved ? "fill-accent text-accent" : "text-foreground")} />
      </button>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{p.category}</p>
          <Link to="/product/$slug" params={{ slug: p.slug }} className="font-medium hover:text-primary">{p.name}</Link>
        </div>
        <span className="font-display text-xl">{formatPrice(p.price)}</span>
      </div>
    </div>
  );
}
