import { createFileRoute } from "@tanstack/react-router";
import { buildIcs, computePrepEvents, reconcileSlots, type Profile, type Recipe, type Slot } from "@/lib/mealmap";

export const Route = createFileRoute("/api/public/calendar/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const token = params.token.replace(/\.ics$/, "");
        if (!/^[0-9a-f-]{36}$/i.test(token)) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("calendar_token", token).maybeSingle();
        if (!profile) return new Response("Not found", { status: 404 });
        const since = new Date(Date.now() - 14 * 86400_000).toISOString().slice(0, 10);
        const [{ data: plans }, { data: recipes }] = await Promise.all([
          supabaseAdmin.from("meal_plans").select("week_start,slots").eq("user_id", profile.id).gte("week_start", since),
          supabaseAdmin.from("recipes").select("*").eq("user_id", profile.id),
        ]);
        const rs = (recipes ?? []) as unknown as Recipe[];
        const events = (plans ?? []).flatMap((p) => computePrepEvents(reconcileSlots(p.week_start, profile, p.slots as unknown as Slot[]), rs, profile as unknown as Profile));
        return new Response(buildIcs(events), { headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "no-cache" } });
      },
    },
  },
});
