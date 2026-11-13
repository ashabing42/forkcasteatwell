/** Simple ink-line food doodles for empty states. */
const paths = {
  bowl: "M10 34h44M12 34c0 12 9 20 20 20s20-8 20-20M24 28c0-5 4-8 8-8M34 22c2-6 8-8 12-6M20 26c-2-4 0-9 4-10",
  basket: "M10 26h44l-5 26H15zM20 26l8-14M44 26l-8-14M22 34v10M32 34v10M42 34v10",
  jar: "M22 14h20v6H22zM20 20h24v32a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4zM26 34h12M26 40h8",
  pan: "M8 32h36a0 0 0 0 1 0 0c0 8-6 14-14 14h-8c-8 0-14-6-14-14zM44 34h14M18 22c0-4 4-4 4-8M28 22c0-4 4-4 4-8",
  book: "M32 18c-6-4-14-4-20-2v34c6-2 14-2 20 2 6-4 14-4 20-2V16c-6-2-14-2-20 2zM32 18v34",
} as const;

export function Doodle({ kind, className }: { kind: keyof typeof paths; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className ?? "h-16 w-16 text-foreground"} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[kind]} />
    </svg>
  );
}

export function EmptyState({ kind, children }: { kind: keyof typeof paths; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 border-y border-dashed py-10 text-center text-muted-foreground">
      <Doodle kind={kind} />
      <div className="max-w-xs">{children}</div>
    </div>
  );
}
