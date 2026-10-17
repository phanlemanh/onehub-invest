import { fmtInt, fmtMoney, fmtPct } from "@/lib/format";

export function KpiStrip({
  kpis,
  currency,
}: {
  kpis: { revenue: number; listings: number; adr: number | null; occupancy: number | null };
  currency: string;
}) {
  const items = [
    {
      label: "Annual Revenue",
      value: fmtMoney(kpis.revenue, currency, true),
      hint: "Sum of monthly revenue over the loaded window",
    },
    {
      label: "Total Active Listings",
      value: fmtInt(kpis.listings),
      hint: "Peak listings with ≥1 booked night in a month",
    },
    {
      label: "Average Daily Rate",
      value: fmtMoney(kpis.adr, currency),
      hint: "Revenue ÷ booked nights (listed-price basis)",
    },
    {
      label: "Occupancy Rate",
      value: fmtPct(kpis.occupancy),
      hint: "Booked ÷ (booked + available) nights",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((k) => (
        <div key={k.label} className="rounded-lg border border-neutral-200 bg-white p-4" title={k.hint}>
          <div className="text-xs uppercase tracking-wide text-neutral-500">{k.label}</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">{k.value}</div>
        </div>
      ))}
    </div>
  );
}
