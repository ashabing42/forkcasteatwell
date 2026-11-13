import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProfileForm } from "@/components/ProfileForm";
import { Button } from "@/components/ui/button";
import { CalendarConnect } from "@/components/CalendarConnect";
import { useProfile } from "@/hooks/use-mealmap";
import { qk, saveProfile } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Forkcast" }, { name: "description", content: "Diet, servings and reminder settings." }] }),
  component: Settings,
});

function Settings() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  if (!profile) return null;
  return (
    <div className="space-y-10">
      <h1 className="text-3xl">Settings</h1>
      <ProfileForm initial={profile} showTimes submitLabel="Save changes" onSubmit={async (d) => {
        await saveProfile({ ...d, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
        await qc.invalidateQueries({ queryKey: qk.profile });
        toast.success("Saved! Your next plan will use these.");
      }} />
      <section className="rounded-lg border bg-card p-5">
        <h2 className="text-xl">Calendar subscription</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your private calendar of meals and prep reminders. Keep the link to yourself.</p>
        <div className="mt-4"><CalendarConnect token={profile.calendar_token} /></div>
      </section>
      <Button variant="outline" className="w-full rounded-lg" onClick={async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }}>Sign out</Button>
    </div>
  );
}
