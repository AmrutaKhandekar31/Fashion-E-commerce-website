import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — DUNE" },
      { name: "description", content: "Sign in or create your DUNE account." },
      { property: "og:title", content: "Sign in — DUNE" },
      { property: "og:description", content: "Sign in or create your DUNE account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user) navigate({ to: "/account" }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) toast.error(error.message);
    else if (mode === "up") toast.success("Check your email to confirm your account");
  };
  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="text-7xl">{mode === "in" ? "Welcome back" : "Join DUNE"}</h1>
      <button onClick={google} className="mt-8 w-full border border-foreground py-3 font-semibold hover:bg-foreground hover:text-background">Continue with Google</button>
      <div className="my-6 text-center text-xs uppercase tracking-widest text-muted-foreground">or</div>
      <form onSubmit={submit} className="space-y-3">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full border bg-card px-4 py-3" />
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full border bg-card px-4 py-3" />
        <button disabled={busy} className="w-full bg-primary py-3 font-semibold uppercase tracking-widest text-primary-foreground disabled:opacity-60">{mode === "in" ? "Sign in" : "Create account"}</button>
      </form>
      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 text-sm text-muted-foreground underline">
        {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
      </button>
    </div>
  );
}
