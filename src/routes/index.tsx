import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CalendarDays, Fork, ShoppingBasket, Timer } from "@/components/icons";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const HERO = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1400&q=80&auto=format&fit=crop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Forkcast — the week's meals, planned for you" },
      { name: "description", content: "Pick your diet, and Forkcast plans your week, builds your shopping list and reminds you to thaw the chicken." },
      { property: "og:title", content: "Forkcast — the week's meals, planned for you" },
      { property: "og:description", content: "Weekly meal plans, shopping lists and prep reminders for vegan, low-sugar, high-protein and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: HERO },
      { name: "twitter:image", content: HERO },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && navigate({ to: "/today", replace: true }));
  }, [navigate]);
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="flex items-center gap-2 font-display text-2xl"><Fork className="h-6 w-6" /> Forkcast</span>
        <Button asChild variant="ghost" className="rounded-lg"><Link to="/auth">Sign in</Link></Button>
      </header>
      <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 pb-16 pt-6 md:grid-cols-2">
        <div>
          <h1 className="text-5xl leading-[1.05] md:text-7xl">Dinner, sorted. <em className="text-primary">All week.</em></h1>
          <p className="mt-4 text-lg text-muted-foreground">Tell us how you eat. Forkcast picks the recipes, writes the shopping list and reminds you to thaw the chicken.</p>
          <Button asChild size="lg" className="mt-8 h-12 rounded-lg px-8 text-base"><Link to="/auth">Plan my week</Link></Button>
        </div>
        <img src={HERO} alt="A colorful healthy bowl" className="aspect-[4/5] w-full rounded-xl object-cover" />
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-20 sm:grid-cols-3">
        {[
          { icon: CalendarDays, t: "A week in one tap", d: "Meals matched to your diet, ready to swap or lock." },
          { icon: ShoppingBasket, t: "Shopping, sorted", d: "Exact quantities, combined and grouped by aisle." },
          { icon: Timer, t: "Prep nudges", d: "“Thaw the chicken tonight”, straight into your calendar." },
        ].map((f) => (
          <div key={f.t} className="border-t pt-5">
            <f.icon className="h-6 w-6" />
            <h3 className="mt-3 text-2xl">{f.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
