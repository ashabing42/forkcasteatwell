<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Domain logic (planning, shopping aggregation, prep scheduling, ICS) lives in pure functions in src/lib/mealmap.ts so it is unit-testable and shared by the UI and the calendar feed route.
- Prep reminders are computed from the saved plan on demand, not stored, so they always reflect the current plan.
- Recipe reads and saves run the pure ingredient audit; mismatched gluten-free tags are removed and borrowed starter photos use the shared RecipeImage fallback, so old accounts get the same safeguards as new ones.
- Locked meals must still satisfy the active diet and meal rules; changed weekly preferences cannot preserve an incompatible lock.
- Seed recipes are inserted per user at onboarding from src/lib/seed-recipes.ts.
- Each week stores its own setup (diets, people, days, meals) on the meal plan; the profile only supplies defaults, so past weeks keep their own shopping amounts.
- Weekly start_day is a Monday-based offset within the plan's stable week key; date windows and calendar feeds use that saved offset, and Today resolves spillover meals from the previous week.
- Shopping aggregates exact recipe quantities before rounding count units; canonical ingredient identities are shared by imports, shopping and pantry, while staple decisions persist on the plan.
- Cooked meals are recorded on slots and fresh pantry entries are removed atomically through an owner-scoped SECURITY INVOKER RPC; the name-only pantry deliberately keeps staples and does not claim exact stock balances.
- Recipe nutrition is per serving: prefer provided values, otherwise labelled ingredient estimates; unknown values remain unknown and partial daily summaries are not shown as complete.
- Admin access is checked server-side via `has_role` on `user_roles`; impersonation mints a magic-link token server-side, stashes the admin session in localStorage and restores it via setSession — so every admin action is re-verified and audited in `admin_audit`.
- Payments: tips use fixed Stripe products (tip_3/tip_5/tip_10 via lookup keys) via a requireSupabaseAuth server fn in src/utils/payments.functions.ts; all Stripe calls go through createStripeClient in src/lib/stripe.server.ts (gateway keys, not real secrets).
