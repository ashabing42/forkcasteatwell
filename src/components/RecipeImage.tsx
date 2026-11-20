import { useState } from "react";
import { Doodle } from "@/components/Doodle";
import { cn } from "@/lib/utils";

/** Never show a broken or unrelated photograph in place of a recipe. */
export function RecipeImage({ src, title, className, compact = false }: { src: string | null; title: string; className?: string; compact?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (src && failedSrc !== src) return <img src={src} alt={title} className={cn("bg-muted object-cover", className)} loading="lazy" onError={() => setFailedSrc(src)} />;
  return (
    <div role="img" aria-label={title} className={cn("flex flex-col items-center justify-center gap-3 overflow-hidden bg-secondary text-secondary-foreground", className)}>
      <Doodle kind="pan" className={compact ? "h-8 w-8 shrink-0" : "h-20 w-20 shrink-0"} />
      {!compact && <span className="max-w-full px-4 text-center font-display text-xl leading-snug break-words">{title}</span>}
    </div>
  );
}