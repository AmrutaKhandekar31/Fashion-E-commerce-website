import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productsQuery } from "@/lib/products";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — DUNE" },
      { name: "description", content: "Your saved DUNE favorites." },
      { property: "og:title", content: "Wishlist — DUNE" },
      { property: "og:description", content: "Your saved DUNE favorites." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Wishlist,
});

function Wishlist() {
  const { data } = useSuspenseQuery(productsQuery);
  const { user } = useAuth();
  const { ids } = useWishlist();
  const items = data.filter((p) => ids.has(p.id));
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-7xl">Wishlist</h1>
      {!user ? (
        <p className="mt-6">
          <Link to="/auth" className="text-primary underline">Sign in</Link> to save favorites across devices.
        </p>
      ) : items.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Nothing saved yet — tap the heart on anything you love.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}
