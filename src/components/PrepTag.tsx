import { useEffect, useState } from "react";
import { Bell } from "@/components/icons";

/** "in 14 h", "in 35 min", "now", "2 h ago". */
export function countdown(due: Date, now: Date): string {
  const mins = Math.round((due.getTime() - now.getTime()) / 60000);
  const abs = Math.abs(mins);
  const txt = abs < 60 ? `${abs} min` : abs < 48 * 60 ? `${Math.round(abs / 60)} h` : `${Math.round(abs / 1440)} d`;
  if (abs < 1) return "now";
  return mins > 0 ? `in ${txt}` : `${txt} ago`;
}

export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

/** Small tomato tag with a live countdown, e.g. "Thaw chicken · in 14 h". */
export function PrepTaskTag({ title, timing }: { title: string; timing: string }) {
  return <span className="inline-flex max-w-full items-start gap-1.5 rounded-md bg-tomato px-2.5 py-1 text-sm font-medium text-tomato-foreground tabular"><Bell className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="min-w-0 break-words">{title} · {timing}</span></span>;
}

export function PrepTag({ title, due, timezone }: { title: string; due: Date; timezone?: string }) {
  const now = useNow();
  const when = due.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", ...(timezone ? { timeZone: timezone } : {}) });
  return <PrepTaskTag title={title} timing={`${when} · ${countdown(due, now)}`} />;
}
