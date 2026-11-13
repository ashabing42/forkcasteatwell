import { CalendarPlus, Copy } from "@/components/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { googleCalendarSubscribeUrl } from "@/lib/mealmap";

/** One-tap calendar subscription: meals + prep reminders, kept in sync with the plan. */
export function CalendarConnect({ token, compact = false }: { token: string; compact?: boolean }) {
  const feed = `${window.location.origin}/api/public/calendar/${token}.ics`;
  return (
    <div className="space-y-2">
      <Button asChild size={compact ? "default" : "lg"} className="w-full rounded-lg">
        <a href={googleCalendarSubscribeUrl(feed)} target="_blank" rel="noreferrer"><CalendarPlus className="mr-2 h-5 w-5" /> Add to Google Calendar</a>
      </Button>
      <div className="flex gap-2">
        <Button asChild variant="secondary" className="flex-1 rounded-lg">
          <a href={feed.replace(/^https?:/, "webcal:")}>Apple / Outlook</a>
        </Button>
        <Button variant="ghost" className="rounded-lg" onClick={() => { navigator.clipboard.writeText(feed); toast.success("Link copied"); }}>
          <Copy className="mr-2 h-4 w-4" /> Copy link
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Your meals and prep reminders show up in your calendar and update when your plan changes. Google can take a few hours to refresh.</p>
    </div>
  );
}
