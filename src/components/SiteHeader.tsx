import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, ShoppingBag, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/shop", label: "Shop" },
  { to: "/stylist", label: "AI Stylist" },
  { to: "/outfit-builder", label: "Outfit Builder" },
  { to: "/size-finder", label: "Size Finder" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
  const { count } = useCart();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const signOut = async () => {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" className="font-display text-3xl tracking-wider">DUNE<span className="text-primary">.</span></Link>
        <nav className="hidden gap-6 md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="text-sm font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-sm font-semibold uppercase tracking-widest text-primary" }}>{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/wishlist" aria-label="Wishlist"><Heart className="h-5 w-5" /></Link>
          {user ? (
            <>
              <Link to="/account" aria-label="Account"><User className="h-5 w-5" /></Link>
              <button onClick={signOut} className="hidden text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground sm:block">Sign out</button>
            </>
          ) : (
            <Link to="/auth" className="text-xs font-semibold uppercase tracking-widest">Sign in</Link>
          )}
          <Link to="/cart" aria-label="Cart" className="relative">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{count}</span>}
          </Link>
        </div>
      </div>
      <nav className="flex gap-5 overflow-x-auto px-4 pb-2 md:hidden">
        {nav.map((n) => <Link key={n.to} to={n.to} className="whitespace-nowrap text-xs font-semibold uppercase tracking-widest">{n.label}</Link>)}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-3">
        <div>
          <p className="font-display text-5xl">DUNE<span className="text-primary">.</span></p>
          <p className="mt-2 text-sm opacity-70">Sun-washed essentials, styled by AI.</p>
        </div>
        <div className="text-sm opacity-80">
          <p className="font-display text-xl">Explore</p>
          <div className="mt-2 flex flex-col gap-1">
            <Link to="/shop">Shop all</Link><Link to="/stylist">AI Stylist</Link><Link to="/outfit-builder">Outfit Builder</Link><Link to="/size-finder">Size Finder</Link>
          </div>
        </div>
        <p className="text-sm opacity-60">Demo store — no real payments are taken.</p>
      </div>
    </footer>
  );
}
