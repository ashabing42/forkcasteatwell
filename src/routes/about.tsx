import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Forkcast" },
      { name: "description", content: "Why Forkcast exists: healthy meal planning without the weekly headache." },
      { property: "og:title", content: "About — Forkcast" },
      { property: "og:description", content: "Why Forkcast exists: healthy meal planning without the weekly headache." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <InfoPage title="About">
      <p>Forkcast takes the thinking out of planning healthy meals. Tell it how you eat and how often you cook, and it fills your week from your own recipes or suggested ones, then writes the shopping list.</p>
      <p>It is free to use. If it saves you some evenings, you can buy the creator a coffee from Settings.</p>
    </InfoPage>
  ),
});
