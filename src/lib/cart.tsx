import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartLine = { productId: string; slug: string; name: string; price: number; image: string; size: string; quantity: number };
type CartCtx = {
  lines: CartLine[];
  add: (l: Omit<CartLine, "quantity">, qty?: number) => void;
  update: (productId: string, size: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
};
const Ctx = createContext<CartCtx | null>(null);
const KEY = "dune-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setLines(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(lines)); }, [lines, ready]);

  const add: CartCtx["add"] = (l, qty = 1) =>
    setLines((prev) => {
      const i = prev.findIndex((p) => p.productId === l.productId && p.size === l.size);
      if (i >= 0) return prev.map((p, j) => (j === i ? { ...p, quantity: p.quantity + qty } : p));
      return [...prev, { ...l, quantity: qty }];
    });
  const update: CartCtx["update"] = (id, size, qty) =>
    setLines((prev) => prev.flatMap((p) => (p.productId === id && p.size === size ? (qty <= 0 ? [] : [{ ...p, quantity: qty }]) : [p])));
  const clear = () => setLines([]);
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const total = lines.reduce((s, l) => s + l.quantity * l.price, 0);
  return <Ctx.Provider value={{ lines, add, update, clear, count, total }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
