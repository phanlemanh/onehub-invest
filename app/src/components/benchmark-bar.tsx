import { fmtMoney, fmtPct } from "@/lib/format";

type Band = { p: number[]; mine: number | null };

function bandLabel(mine: number | null, p: number[]): string | null {
  if (mine === null) return null;
  if (mine < p[0]) return "bottom 30%";
  if (mine < p[1]) return "30–60%";
  if (mine < p[2]) return "60–90%";
  return "top 10%";
}

export function BenchmarkBar({
  benchmark,
  currency,
}: {
  benchmark: {
    nSiblings: number;
    adr: Band;
    occ: Band;
  };
  currency: string;
}) {
  const chips = [
    {
      label: "ADR vs siblings",
      value: `${fmtMoney(benchmark.adr.mine, currency)} · ${bandLabel(benchmark.adr.mine, benchmark.adr.p) ?? "—"}`,
    },
    {
      label: "Occupancy vs siblings",
      value: `${fmtPct(benchmark.occ.mine)} · ${bandLabel(benchmark.occ.mine, benchmark.occ.p) ?? "—"}`,
    },
  ];
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-sm font-semibold text-neutral-900">
        Benchmark vs {benchmark.nSiblings} sibling submarkets
      </div>
      <div className="mt-1 text-xs text-neutral-500">
        Percentile bands (p30/p60/p90) computed from the same-level set — latest month
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((c) => (
          <span
            key={c.label}
            className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700"
          >
            <span className="text-neutral-500">{c.label}:</span> {c.value}
          </span>
        ))}
      </div>
    </div>
  );
}
