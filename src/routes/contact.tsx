import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/SiteFooter";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Forkcast" },
      { name: "description", content: "Get in touch with the Forkcast team." },
      { property: "og:title", content: "Contact — Forkcast" },
      { property: "og:description", content: "Get in touch with the Forkcast team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <InfoPage title="Contact">
      <p>Questions, ideas or a recipe that went wrong? Email <a className="text-primary underline underline-offset-4" href="mailto:aislingoconnell@gmail.com">aislingoconnell@gmail.com</a>.</p>
    </InfoPage>
  ),
});
