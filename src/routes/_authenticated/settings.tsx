import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { ProfileForm } from "@/components/ProfileForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-mealmap";
import { qk, saveProfile } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — MealMap" }, { name: "description", content: "Diet, servings and reminder settings." }] }),
  component: Settings,
});

function Settings() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  if (!profile) return null;
  const feed = `${window.location.origin}/api/public/calendar/${profile.calendar_token}`;
  return (
    <div className="space-y-10">
      <h1 className="text-3xl">Settings</h1>
      <ProfileForm initial={profile} showTimes submitLabel="Save changes" onSubmit={async (d) => {
        await saveProfile({ ...d, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
        await qc.invalidateQueries({ queryKey: qk.profile });
        toast.success("Saved! Your next plan will use these.");
      }} />
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-xl">Calendar subscription</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add this private link to Google, Apple or Outlook Calendar ("subscribe by URL"). It updates when your plan changes. Keep it to yourself.</p>
        <div className="mt-3 flex gap-2">
          <Input readOnly value={feed} className="rounded-xl text-xs" />
          <Button size="icon" variant="secondary" aria-label="Copy link" onClick={() => { navigator.clipboard.writeText(feed); toast.success("Link copied"); }}><Copy className="h-4 w-4" /></Button>
        </div>
      </section>
      <Button variant="outline" className="w-full rounded-full" onClick={async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }}>Sign out</Button>
    </div>
  );
}
