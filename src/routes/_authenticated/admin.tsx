import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { checkIsAdmin, listUsers, impersonateUser } from "@/lib/admin.functions";
import { startImpersonation } from "@/lib/impersonation";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Admin · Forkcast" },
    { name: "description", content: "Forkcast admin: people using the app." },
    { property: "og:title", content: "Admin · Forkcast" },
    { property: "og:description", content: "Forkcast admin: people using the app." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  beforeLoad: async () => {
    const { isAdmin } = await checkIsAdmin();
    if (!isAdmin) throw redirect({ to: "/today" });
  },
  component: AdminPage,
});

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

function AdminPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const { data: users = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => listUsers() });

  async function viewAs(id: string) {
    setBusy(id);
    try {
      const { tokenHash, email } = await impersonateUser({ data: { userId: id } });
      await qc.cancelQueries(); qc.clear();
      await startImpersonation(tokenHash, email);
      navigate({ to: "/today", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't switch");
    } finally { setBusy(null); }
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Admin</p>
      <h1 className="mt-1 font-display text-4xl">People</h1>
      <p className="mt-2 text-muted-foreground">{users.length} {users.length === 1 ? "account" : "accounts"}. Every "View as" is logged.</p>
      {isLoading ? <p className="mt-8 text-muted-foreground">Loading…</p> : (
        <ul className="mt-8 border-t">
          {users.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium">{u.email}{u.isAdmin && <span className="ml-2 text-xs uppercase tracking-wider text-primary">admin</span>}</p>
                <p className="tabular text-sm text-muted-foreground">
                  Joined {fmt(u.createdAt)} · last in {fmt(u.lastSignIn)} · {u.recipes} recipes · {u.weeks} weeks{!u.onboarded && " · not set up"}
                </p>
                {u.diets.length > 0 && <p className="text-xs uppercase tracking-wider text-muted-foreground">{u.diets.join(" · ")}</p>}
              </div>
              {!u.isAdmin && (
                <Button variant="outline" size="sm" className="rounded-lg" disabled={busy !== null} onClick={() => viewAs(u.id)}>
                  {busy === u.id ? "Switching…" : "View as"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
