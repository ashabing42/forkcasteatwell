import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Leaf } from "lucide-react";
import { toast } from "sonner";
import { ProfileForm } from "@/components/ProfileForm";
import { useProfile } from "@/hooks/use-mealmap";
import { qk, saveProfile, seedRecipesIfEmpty } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — MealMap" }, { name: "description", content: "Set up your MealMap diet and plan." }] }),
  component: Onboarding,
});

function Onboarding() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  if (!profile) return null;
  return (
    <div>
      <div className="mb-8">
        <Leaf className="h-8 w-8 text-primary" />
        <h1 className="mt-3 text-3xl">Hi there! Let's set up your week.</h1>
        <p className="mt-2 text-muted-foreground">Three quick questions and you'll have a plan. You can change this anytime in Settings.</p>
      </div>
      <ProfileForm
        initial={profile}
        submitLabel="Start planning"
        onSubmit={async (d) => {
          try {
            await saveProfile({ ...d, onboarded: true, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
            await seedRecipesIfEmpty();
            await qc.invalidateQueries({ queryKey: qk.profile });
            await qc.invalidateQueries({ queryKey: qk.recipes });
            navigate({ to: "/plan" });
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    </div>
  );
}
