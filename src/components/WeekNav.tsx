import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, parseISODate } from "@/lib/mealmap";

export function weekLabel(week: string) {
  const s = parseISODate(week);
  const e = parseISODate(addDays(week, 6));
  const f = (d: Date) => d.toLocaleDateString("en", { month: "short", day: "numeric" });
  return `${f(s)} – ${f(e)}`;
}

export function WeekNav({ week, onChange }: { week: string; onChange: (w: string) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-full border bg-card p-1">
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Previous week" onClick={() => onChange(addDays(week, -7))}><ChevronLeft className="h-4 w-4" /></Button>
      <span className="min-w-28 text-center text-sm font-medium">{weekLabel(week)}</span>
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Next week" onClick={() => onChange(addDays(week, 7))}><ChevronRight className="h-4 w-4" /></Button>
    </div>
  );
}
