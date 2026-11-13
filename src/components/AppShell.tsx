import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { BookOpen, CalendarDays, Settings, ShoppingBasket, Sun, Archive, Fork } from "@/components/icons";
import { fetchProfile, qk } from "@/lib/api";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/today", label: "Today", icon: Sun },
  { to: "/plan", label: "Plan", icon: CalendarDays },
  { to: "/shopping", label: "Shopping", icon: ShoppingBasket },
  { to: "/pantry", label: "Pantry", icon: Archive },
  { to: "/recipes", label: "Recipes", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useQuery({ queryKey: qk.profile, queryFn: fetchProfile });
  const onboarding = pathname.startsWith("/onboarding");

  useEffect(() => {
    if (profile && !profile.onboarded && !onboarding) navigate({ to: "/onboarding", replace: true });
  }, [profile, onboarding, navigate]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Fork className="h-8 w-8 animate-pulse" /></div>;
  }

  if (onboarding) return <main className="mx-auto min-h-screen max-w-xl px-5 py-10">{children}</main>;

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-56">
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
