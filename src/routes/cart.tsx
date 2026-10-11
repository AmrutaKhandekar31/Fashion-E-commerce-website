import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your bag — DUNE" },
      { name: "description", content: "Review the items in your DUNE shopping bag." },
      { property: "og:title", content: "Your bag — DUNE" },
      { property: "og:description", content: "Review your DUNE bag." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { lines, update, total } = useCart();
  const shipping = total >= 150 || total === 0 ? 0 : 9;
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-7xl">Your bag</h1>
      {lines.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Your bag is empty. <Link to="/shop" className="text-primary underline">Start shopping</Link></p>
      ) : (
        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_300px]">
          <ul className="divide-y border-y">
            {lines.map((l) => (
              <li key={l.productId + l.size} className="flex gap-4 py-4">
                <img src={l.image} alt={l.name} loading="lazy" width={96} height={120} className="h-30 w-24 object-cover" />
                <div className="flex-1">
                  <Link to="/product/$slug" params={{ slug: l.slug }} className="font-semibold">{l.name}</Link>
                  <p className="text-sm text-muted-foreground">Size {l.size}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button aria-label="Decrease" onClick={() => update(l.productId, l.size, l.quantity - 1)} className="border p-1"><Minus className="h-3 w-3" /></button>
                    <span>{l.quantity}</span>
                    <button aria-label="Increase" onClick={() => update(l.productId, l.size, l.quantity + 1)} className="border p-1"><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
                <p className="font-display text-2xl">{formatPrice(l.price * l.quantity)}</p>
              </li>
            ))}
          </ul>
          <aside className="h-fit border bg-card p-6">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
            <div className="mt-2 flex justify-between text-sm text-muted-foreground"><span>Shipping</span><span>{shipping ? formatPrice(shipping) : "Free"}</span></div>
            <div className="mt-4 flex justify-between border-t pt-4 font-display text-3xl"><span>Total</span><span>{formatPrice(total + shipping)}</span></div>
            <Link to="/checkout" className="mt-6 block bg-primary py-3 text-center font-semibold uppercase tracking-widest text-primary-foreground">Checkout</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
