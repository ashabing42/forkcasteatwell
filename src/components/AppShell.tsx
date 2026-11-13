import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { BookOpen, CalendarDays, Settings, ShoppingBasket, Sun, Leaf } from "lucide-react";
import { fetchProfile, qk } from "@/lib/api";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/today", label: "Today", icon: Sun },
  { to: "/plan", label: "Plan", icon: CalendarDays },
  { to: "/shopping", label: "Shopping", icon: ShoppingBasket },
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
    return (
      <div className="flex min-h-screen items-center justify-center text-primary">
        <Leaf className="h-8 w-8 animate-pulse" />
      </div>
    );
  }

  if (onboarding) return <main className="mx-auto min-h-screen max-w-xl px-5 py-8">{children}</main>;

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-56">
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r bg-card px-4 py-6 md:flex">
        <Link to="/today" className="mb-8 flex items-center gap-2 px-2 font-display text-2xl text-primary">
          <Leaf className="h-6 w-6" /> MealMap
        </Link>
        <nav className="flex flex-col gap-1">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
              activeProps={{ className: "bg-secondary !text-secondary-foreground" }}
            >
              <t.icon className="h-5 w-5" /> {t.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid grid-cols-5">
          {TABS.map((t) => {
            const active = pathname.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                <span className={cn("rounded-full px-4 py-1 transition-colors", active && "bg-secondary")}>
                  <t.icon className="h-5 w-5" />
                </span>
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
