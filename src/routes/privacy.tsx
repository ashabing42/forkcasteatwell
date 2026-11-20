import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Forkcast" },
      { name: "description", content: "How Forkcast handles your data." },
      { property: "og:title", content: "Privacy — Forkcast" },
      { property: "og:description", content: "How Forkcast handles your data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <InfoPage title="Privacy">
      <p>We store your account email, your diet settings, recipes, plans, shopping and pantry lists so the app works. Only you can see them.</p>
      <p>We do not sell your data or show ads. Payments for tips are handled by Stripe; we never see your card details. You can ask us to delete your account at any time via the Contact page.</p>
    </InfoPage>
  ),
});
