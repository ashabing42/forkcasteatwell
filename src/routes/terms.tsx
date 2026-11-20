import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/SiteFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Forkcast" },
      { name: "description", content: "The terms for using Forkcast." },
      { property: "og:title", content: "Terms — Forkcast" },
      { property: "og:description", content: "The terms for using Forkcast." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <InfoPage title="Terms">
      <p>Forkcast is provided free and as is. Recipes and quantities are a guide: check ingredients for allergies and cook food safely.</p>
      <p>Tips are voluntary, one-off and do not unlock anything. Be kind to the service and we will keep it running.</p>
    </InfoPage>
  ),
});
