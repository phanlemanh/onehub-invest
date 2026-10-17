import { fmtInt, fmtMoney, fmtPct } from "@/lib/format";

type Kpi = {
  key: string;
  label: string;
  value: string;
  hint: string;
};

/**
 * KPI strip — hỗ trợ field-level redaction (mirror `redactions[]` của AirDNA:
 * server trả null + danh sách field bị che, UI hiển thị khoá thay vì giá trị).
 */
export function KpiStrip({
  kpis,
  currency,
  redactions = [],
}: {
  kpis: { revenue: number; listings: number; adr: number | null; occupancy: number | null };
  currency: string;
  redactions?: string[];
}) {
  const items: Kpi[] = [
    {
      key: "revenue",
      label: "Annual Revenue",
      value: fmtMoney(kpis.revenue, currency, true),
      hint: "Sum of monthly revenue over the loaded window",
    },
    {
      key: "listings",
      label: "Total Active Listings",
      value: fmtInt(kpis.listings),
      hint: "Peak listings with ≥1 booked night in a month",
    },
    {
      key: "adr",
      label: "Average Daily Rate",
      value: fmtMoney(kpis.adr, currency),
      hint: "Revenue ÷ booked nights (listed-price basis)",
    },
    {
      key: "occupancy",
      label: "Occupancy Rate",
      value: fmtPct(kpis.occupancy),
      hint: "Booked ÷ (booked + available) nights",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((k) => {
        const redacted = redactions.includes(k.key);
        return (
          <div key={k.label} className="rounded-lg border border-neutral-200 bg-white p-4" title={k.hint}>
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-neutral-500">{k.label}</div>
              {redacted ? (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                  PRO
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-2xl font-semibold text-neutral-900">
              {redacted ? (
                <span className="tracking-widest text-neutral-400" aria-label={`${k.label} locked`}>
                  ••• 🔒
                </span>
              ) : (
                k.value
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
