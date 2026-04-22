import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn, formatPct, PLATFORM_BG_COLORS, PLATFORM_LABELS, AVAILABILITY_LABELS, AVAILABILITY_COLORS } from "@/lib/utils";
import type { Platform, Availability, DeltaDirection } from "@/lib/utils";

// ─── Platform Badge ───────────────────────────────────────────────────────────
interface PlatformBadgeProps {
  platform: Platform;
  size?: "sm" | "md";
}

export function PlatformBadge({ platform, size = "md" }: PlatformBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium tracking-wide",
        PLATFORM_BG_COLORS[platform],
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      )}
    >
      {PLATFORM_LABELS[platform]}
    </span>
  );
}

// ─── Delta Badge ──────────────────────────────────────────────────────────────
interface DeltaBadgeProps {
  changePct: number;
  direction: DeltaDirection | string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function DeltaBadge({ changePct, direction, size = "md", showIcon = true }: DeltaBadgeProps) {
  if (direction === "none" || changePct === 0) {
    return (
      <span className={cn(
        "inline-flex items-center gap-0.5 rounded font-mono text-price-neutral",
        size === "sm" ? "text-[11px]" : "text-xs"
      )}>
        {showIcon && <Minus className="w-3 h-3" />}
        0.00%
      </span>
    );
  }

  const isUp = direction === "up";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded font-mono font-medium",
        isUp ? "text-price-up" : "text-price-down",
        size === "sm" ? "text-[11px]" : "text-xs"
      )}
    >
      {showIcon && (
        isUp
          ? <TrendingUp className="w-3 h-3 shrink-0" />
          : <TrendingDown className="w-3 h-3 shrink-0" />
      )}
      {formatPct(Math.abs(changePct))}
    </span>
  );
}

// ─── Availability Badge ───────────────────────────────────────────────────────
interface AvailabilityBadgeProps {
  availability: Availability | string;
}

export function AvailabilityBadge({ availability }: AvailabilityBadgeProps) {
  const avail = availability as Availability;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", AVAILABILITY_COLORS[avail] ?? "text-muted-foreground")}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        avail === "in_stock" ? "bg-price-up" :
        avail === "limited" ? "bg-yellow-400" :
        "bg-destructive"
      )} />
      {AVAILABILITY_LABELS[avail] ?? availability}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  delta?: { changePct: number; direction: DeltaDirection | string };
  accent?: boolean;
}

export function StatCard({ label, value, sub, delta, accent }: StatCardProps) {
  return (
    <div className={cn(
      "rounded-xl border p-4 flex flex-col gap-1",
      accent
        ? "border-primary/30 bg-primary/5"
        : "border-border bg-card"
    )}>
      <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{label}</p>
      <p className="text-2xl font-semibold tabular text-foreground">{value}</p>
      <div className="flex items-center gap-2">
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        {delta && <DeltaBadge changePct={delta.changePct} direction={delta.direction} size="sm" />}
      </div>
    </div>
  );
}
