export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAirdnaMarkets } from "@/lib/queries";
import { fmtInt } from "@/lib/format";

export default async function VnPage() {
  const markets = await getAirdnaMarkets();
  const withScore = markets.filter(m => m.score !== null);
  const withOurData = markets.filter(m => m.ourAreaId);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="text-xs uppercase tracking-wide text-neutral-500">
        <Link href="/" className="hover:underline">One Invest</Link> › Việt Nam
      </div>
      <h1 className="text-3xl font-bold text-neutral-900">Việt Nam — Thị trường</h1>
      <div className="text-sm text-neutral-500">
        {markets.length} thị trường theo AirDNA · {withOurData.length} có dữ liệu tự thu ·
        Nguồn: <span className="font-medium">AirDNA Market Research</span> + tự thu Airbnb
      </div>

      {/* Market Score highlight */}
      {withScore.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {withScore.map(m => (
            <div key={m.airdnaId} className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3">
              <span className="text-3xl font-bold text-blue-800">{m.score}</span>
              <div>
                <div className="text-sm font-semibold text-blue-900">{m.name}</div>
                <div className="text-xs text-blue-600">AirDNA Market Score</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Market list */}
      <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-2 font-medium">Thị trường</th>
              <th className="px-4 py-2 text-right font-medium">AirDNA Score</th>
              <th className="px-4 py-2 text-right font-medium">Listings (tự thu)</th>
              <th className="px-4 py-2 font-medium">Trang</th>
            </tr>
          </thead>
          <tbody>
            {markets.map(m => (
              <tr key={m.airdnaId} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2 font-medium">{m.name}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {m.score !== null ? (
                    <span className={m.score >= 80 ? "font-bold text-emerald-700" : m.score >= 60 ? "text-blue-700" : "text-neutral-500"}>
                      {m.score}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-neutral-600">
                  {m.ourListings ? fmtInt(m.ourListings) : "—"}
                </td>
                <td className="px-4 py-2">
                  {m.ourAreaId ? (
                    <Link href={`/vn/${m.ourAreaId.replace("vn-", "")}`} className="text-blue-700 hover:underline">
                      Xem insights →
                    </Link>
                  ) : (
                    <span className="text-xs text-neutral-400">chưa có dữ liệu tự thu</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-neutral-400">
        Để có chi tiết (ADR, occupancy, revenue) cho từng thị trường: collector cần duyệt
        từng market page trên AirDNA. Hiện chỉ Hà Nội có dữ liệu đầy đủ.
      </div>
    </main>
  );
}
