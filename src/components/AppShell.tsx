import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { checkIsAdmin } from "@/lib/admin.functions";
import { getImpersonation, stopImpersonation } from "@/lib/impersonation";
import { BookOpen, CalendarDays, Settings, ShoppingBasket, Sun, Jar, Fork, Users } from "@/components/icons";
import { fetchProfile, qk } from "@/lib/api";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/today", label: "Today", icon: Sun },
  { to: "/plan", label: "Plan", icon: CalendarDays },
  { to: "/shopping", label: "Shopping", icon: ShoppingBasket },
  { to: "/pantry", label: "Pantry", icon: Jar },
  { to: "/recipes", label: "Recipes", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useQuery({ queryKey: qk.profile, queryFn: fetchProfile });
  const onboarding = pathname.startsWith("/onboarding");
  const qc = useQueryClient();
  const [viewing, setViewing] = useState<string | null>(null);
  useEffect(() => { setViewing(getImpersonation()?.email ?? null); }, [pathname]);
  const { data: admin } = useQuery({ queryKey: ["is-admin"], queryFn: () => checkIsAdmin(), staleTime: 60_000 });
  async function backToAdmin() {
    await qc.cancelQueries(); qc.clear();
    await stopImpersonation();
    setViewing(null);
    navigate({ to: "/admin", replace: true });
  }
  const banner = viewing ? (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b bg-highlight px-4 py-2 text-sm">
      <span className="truncate">Viewing as <strong>{viewing}</strong></span>
      <button onClick={backToAdmin} className="shrink-0 font-medium underline underline-offset-4">Back to admin</button>
    </div>
  ) : null;

  useEffect(() => {
    if (profile && !profile.onboarded && !onboarding) navigate({ to: "/onboarding", replace: true });
  }, [profile, onboarding, navigate]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Fork className="h-8 w-8 animate-pulse" /></div>;
  }

  if (onboarding) return <>{banner}<main className="mx-auto min-h-screen max-w-xl px-5 py-10">{children}</main></>;

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-56">
      {banner}
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r px-5 py-8 md:flex">
        <Link to="/today" className="mb-10 flex items-center gap-2 font-display text-2xl">
          <Fork className="h-6 w-6" /> Forkcast
        </Link>
        <nav className="flex flex-col">
          {TABS.map((t) => (
            <Link key={t.to} to={t.to} className="flex items-center gap-3 border-b border-border/70 py-3 text-[15px] text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "!text-foreground font-medium" }}>
              <t.icon className="h-5 w-5" /> {t.label}
            </Link>
          ))}
          {admin?.isAdmin && !viewing && (
            <Link to="/admin" className="flex items-center gap-3 border-b border-border/70 py-3 text-[15px] text-muted-foreground hover:text-foreground" activeProps={{ className: "!text-foreground font-medium" }}>
              <Users className="h-5 w-5" /> Admin
            </Link>
          )}
        </nav>
      </aside>
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-10 md:py-12">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid grid-cols-6">
          {TABS.map((t) => {
            const active = pathname.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px]", active ? "text-foreground" : "text-muted-foreground")}>
                <t.icon className="h-6 w-6" />
                <span className={cn(active && "border-b-2 border-highlight")}>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
