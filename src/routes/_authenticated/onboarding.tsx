import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarConnect } from "@/components/CalendarConnect";
import { Button } from "@/components/ui/button";
import { Fork } from "@/components/icons";
import { toast } from "sonner";
import { ProfileForm } from "@/components/ProfileForm";
import { useProfile } from "@/hooks/use-mealmap";
import { fetchRecipes, qk, savePlan, saveProfile, seedRecipesIfEmpty } from "@/lib/api";
import { buildEmptySlots, generatePlan, weekStartOf } from "@/lib/mealmap";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Forkcast" }, { name: "description", content: "Set up your Forkcast diet and plan." }] }),
  component: Onboarding,
});

function Onboarding() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  if (!profile) return null;
  if (done) return (
    <div className="space-y-6">
      <div>
        <Fork className="h-8 w-8" />
        <h1 className="mt-3 text-3xl">Your week is ready</h1>
        <p className="mt-2 text-muted-foreground">Want your meals and prep reminders (like "thaw the chicken tonight") in your calendar? One tap and it stays up to date.</p>
      </div>
      <CalendarConnect token={profile.calendar_token} />
      <Button variant="outline" size="lg" className="w-full rounded-lg" onClick={() => navigate({ to: "/plan" })}>See my week</Button>
    </div>
  );
  return (
    <div>
      <div className="mb-8">
        <Fork className="h-8 w-8" />
        <h1 className="mt-3 text-3xl">Let’s set up your week.</h1>
        <p className="mt-2 text-muted-foreground">Three quick questions and you'll have a plan. You can change this anytime in Settings.</p>
      </div>
      <ProfileForm
        initial={profile}
        submitLabel="Start planning"
        onSubmit={async (d) => {
          try {
            await saveProfile({ ...d, onboarded: true, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
            await seedRecipesIfEmpty();
            // These answers also plan the current week, so the Plan page opens already filled.
            const week = weekStartOf(new Date());
            const settings = { diets: d.diets, servings: d.servings, days: d.days, meals: d.meals };
            await savePlan(week, { settings, slots: generatePlan(buildEmptySlots(week, settings), await fetchRecipes(), d.diets) });
            await qc.invalidateQueries({ queryKey: qk.plan(week) });
            await qc.invalidateQueries({ queryKey: qk.profile });
            await qc.invalidateQueries({ queryKey: qk.recipes });
            setDone(true);
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    </div>
  );
}
