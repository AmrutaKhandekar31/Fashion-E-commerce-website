import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My account — DUNE" },
      { name: "description", content: "Your DUNE orders and profile." },
      { property: "og:title", content: "My account — DUNE" },
      { property: "og:description", content: "Your DUNE orders and profile." },
    ],
  }),
  component: Account,
});

function Account() {
  const { user, loading } = useAuth();
  const orders = useQuery({
    queryKey: ["orders", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false })).data ?? [],
  });
  if (loading) return null;
  if (!user) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><Link to="/auth" className="text-primary underline">Sign in</Link> to see your account.</div>;
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-7xl">Hello, {user.email?.split("@")[0]}</h1>
      <h2 className="mt-12 text-4xl">Your orders</h2>
      {(orders.data?.length ?? 0) === 0 ? (
        <p className="mt-4 text-muted-foreground">No orders yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.data!.map((o) => (
            <li key={o.id} className="border bg-card p-5">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()} · #{o.id.slice(0, 8)}</span>
                <span className="font-display text-2xl">{formatPrice(o.total)}</span>
              </div>
              <ul className="mt-2 text-sm">{o.order_items.map((i) => <li key={i.id}>{i.quantity}× {i.name} ({i.size})</li>)}</ul>
              <span className="mt-2 inline-block bg-secondary px-2 py-0.5 text-xs uppercase tracking-widest">{o.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
