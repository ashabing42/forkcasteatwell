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
export function PrepTag({ title, due }: { title: string; due: Date }) {
  const now = useNow();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-tomato px-2.5 py-1 text-sm font-medium text-tomato-foreground tabular">
      <Bell className="h-3.5 w-3.5" /> {title} · {countdown(due, now)}
    </span>
  );
}
