import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/size-finder")({
  head: () => ({
    meta: [
      { title: "Size Finder — DUNE" },
      { name: "description", content: "Find your DUNE clothing size from your height, weight and fit preference." },
      { property: "og:title", content: "Size Finder — DUNE" },
      { property: "og:description", content: "Your perfect size in seconds." },
    ],
  }),
  component: SizeFinder,
});

const SIZES = ["XS", "S", "M", "L", "XL"];
const FITS = ["slim", "regular", "relaxed"] as const;

function recommend(h: number, w: number, fit: string) {
  const bmi = w / (h / 100) ** 2;
  let i = bmi < 19 ? 0 : bmi < 22 ? 1 : bmi < 25.5 ? 2 : bmi < 29 ? 3 : 4;
  if (h > 185 && i < 4) i++;
  if (h < 158 && i > 0) i--;
  if (fit === "relaxed" && i < 4) i++;
  if (fit === "slim" && i > 0) i--;
  return { size: SIZES[i], waist: 26 + i * 2, confidence: Math.round(95 - Math.abs(bmi - 22) * 2) };
}

function SizeFinder() {
  const { user } = useAuth();
  const [h, setH] = useState(170);
  const [w, setW] = useState(65);
  const [fit, setFit] = useState<string>("regular");
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.height_cm) setH(data.height_cm);
      if (data?.weight_kg) setW(data.weight_kg);
      if (data?.fit_preference) setFit(data.fit_preference);
    });
  }, [user]);
  const r = recommend(h, w, fit);
  const save = async () => {
    if (!user) { toast("Sign in to save your measurements"); return; }
    await supabase.from("profiles").update({ height_cm: h, weight_kg: w, fit_preference: fit }).eq("id", user.id);
    toast.success("Measurements saved to your profile");
  };
  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-4 py-16 md:grid-cols-2">
      <div>
        <h1 className="text-7xl">Size finder</h1>
        <p className="mt-3 text-muted-foreground">Three quick inputs. No tape measure needed.</p>
        <label className="mt-10 block text-sm font-semibold uppercase tracking-widest">Height — {h} cm</label>
        <input type="range" min={145} max={205} value={h} onChange={(e) => setH(+e.target.value)} className="mt-3 w-full accent-primary" />
        <label className="mt-8 block text-sm font-semibold uppercase tracking-widest">Weight — {w} kg</label>
        <input type="range" min={40} max={130} value={w} onChange={(e) => setW(+e.target.value)} className="mt-3 w-full accent-primary" />
        <p className="mt-8 text-sm font-semibold uppercase tracking-widest">How do you like it to fit?</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {FITS.map((f) => (
            <button key={f} onClick={() => setFit(f)} className={cn("border py-3 text-sm capitalize", fit === f ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}>{f}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-col justify-center bg-sunset p-10 text-primary-foreground shadow-warm">
        <p className="text-sm uppercase tracking-[0.3em]">Your size</p>
        <p className="font-display text-[10rem] leading-none">{r.size}</p>
        <p className="text-lg">Waist approx. {r.waist}" · {r.confidence}% match confidence</p>
        <button onClick={save} className="mt-8 w-fit bg-ink px-6 py-3 font-semibold uppercase tracking-widest text-ink-foreground">Save to profile</button>
      </div>
    </div>
  );
}
