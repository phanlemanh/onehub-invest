export function fmtMoney(v: number | null, currency: string, compact = false): string {
  if (v === null || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(v);
}

export function fmtPct(v: number | null, digits = 1): string {
  if (v === null || Number.isNaN(v)) return "—";
  return `${(v * 100).toFixed(digits)}%`;
}

export function fmtInt(v: number | null): string {
  if (v === null || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("en-US").format(Math.round(v));
}

export function fmtMonth(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
