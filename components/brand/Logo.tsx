import { cn } from '@/lib/utils';

/** Cells of the 3x3 heatmap that are lit; together they form a "T". */
const LIT = [0, 1, 2, 4, 7];

/**
 * TrackCode mark: a contribution-heatmap grid with a lit T.
 * Colors come from the --mark-* tokens, so it follows light/dark theme.
 */
export function LogoMark({ size = 24, className, animated = false }: { size?: number; className?: string; animated?: boolean }) {
  const gap = Math.max(1, Math.round(size * 0.075));
  const radius = Math.max(1, Math.round(size * 0.067));
  let lit = 0;
  return (
    <span
      role="img"
      aria-label="TrackCode"
      className={cn('grid shrink-0 grid-cols-3', animated && 'tc-mark-animated', className)}
      style={{ width: size, height: size, gap }}
    >
      {Array.from({ length: 9 }, (_, i) => {
        const on = LIT.includes(i);
        const color = on ? `var(--mark-${lit++})` : 'var(--mark-off)';
        return <span key={i} className={on ? 'tc-mark-on' : undefined} style={{ background: color, borderRadius: radius, ['--i' as string]: i }} />;
      })}
    </span>
  );
}

/** App-icon tile: the mark centred on a rounded square, as in the favicon. */
export function LogoTile({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center border border-[var(--mark-tile-border)] bg-[var(--mark-tile)]', className)}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.22) }}
    >
      <LogoMark size={Math.round(size * 0.6)} />
    </span>
  );
}

/** Primary lockup: mark + "Track" (600) "Code" (400, brand green). */
export function Logo({ size = 22, className, animated = false }: { size?: number; className?: string; animated?: boolean }) {
  return (
    <span className={cn('inline-flex items-center', className)} style={{ gap: Math.round(size * 0.42) }}>
      <LogoMark size={size} animated={animated} />
      <Wordmark size={Math.round(size * 0.78)} />
    </span>
  );
}

export function Wordmark({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('inline-flex items-baseline leading-none font-[family-name:var(--font-brand)] tracking-[-0.03em]', className)}
      style={{ fontSize: size }}
    >
      <span className="font-semibold">Track</span>
      <span className="font-normal text-[var(--brand)]">Code</span>
    </span>
  );
}
