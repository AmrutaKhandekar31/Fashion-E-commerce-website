import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — DUNE" },
      { name: "description", content: "Complete your DUNE order." },
      { property: "og:title", content: "Checkout — DUNE" },
      { property: "og:description", content: "Complete your DUNE order." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { lines, total, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "", zip: "" });
  const shipping = total >= 150 ? 0 : 9;

  if (!user) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-6xl">Almost there</h1><p className="mt-4"><Link to="/auth" className="text-primary underline">Sign in</Link> to place your order.</p></div>;
  if (lines.length === 0) return <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-6xl">Bag is empty</h1><Link to="/shop" className="mt-4 inline-block text-primary underline">Shop now</Link></div>;

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data: order, error } = await supabase.from("orders").insert({ user_id: user.id, total: total + shipping, shipping: form }).select().single();
    if (error || !order) { toast.error("Could not place order"); setBusy(false); return; }
    const { error: e2 } = await supabase.from("order_items").insert(lines.map((l) => ({ order_id: order.id, product_id: l.productId, name: l.name, price: l.price, size: l.size, quantity: l.quantity })));
    if (e2) { toast.error("Could not save order items"); setBusy(false); return; }
    clear();
    toast.success("Order placed! (demo — no payment taken)");
    navigate({ to: "/account" });
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-[1fr_300px]">
      <form onSubmit={place} className="space-y-4">
        <h1 className="text-7xl">Checkout</h1>
        {(["name", "address", "city", "zip"] as const).map((k) => (
          <input key={k} required value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={k === "zip" ? "Postal code" : k.charAt(0).toUpperCase() + k.slice(1)} className="w-full border bg-card px-4 py-3" />
        ))}
        <div className="border border-dashed bg-muted p-4 text-sm text-muted-foreground">Demo checkout — your order is saved, but no card is charged.</div>
        <button disabled={busy} className="w-full bg-primary py-4 font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-60">{busy ? "Placing…" : `Place order · ${formatPrice(total + shipping)}`}</button>
      </form>
      <aside className="h-fit border bg-card p-6 text-sm">
        {lines.map((l) => <div key={l.productId + l.size} className="flex justify-between py-1"><span>{l.quantity}× {l.name} ({l.size})</span><span>{formatPrice(l.price * l.quantity)}</span></div>)}
        <div className="mt-3 flex justify-between border-t pt-3"><span>Shipping</span><span>{shipping ? formatPrice(shipping) : "Free"}</span></div>
      </aside>
    </div>
  );
}
