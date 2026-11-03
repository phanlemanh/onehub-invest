import { PhoneIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/reui/badge";
import { DealSeenNote } from "@/components/ops/deal-seen-note";
import { Card, CardContent } from "@/components/ui/card";
import type { DealRow } from "@/lib/deals";
import { fmtCompact, fmtInt } from "@/lib/format";
import { fmtPhone } from "@/lib/ops/people";

function confBadge(c: string) {
  if (c === "high") return <Badge variant="success-light">tin cậy cao</Badge>;
  if (c === "medium") return <Badge variant="outline">trung bình</Badge>;
  return <Badge variant="warning-light">thấp</Badge>;
}

// Ops chỉ hiện mã nguồn (SPL tầng B) — tên nguồn thật là tầng A.
function sourceBadge(s: string) {
  return <Badge variant="outline">{s}</Badge>;
}

/**
 * Thẻ một tin trên «Căn giá tốt» (/ops/deals): chọn căn đáng xem rồi mở trang một căn. Tách khỏi trang để test vẽ thẻ
 * trong jsdom (ON11): nhãn số lần đăng và nhãn «cần xác minh» là quan hệ với dữ liệu, không phải chữ có mặt trong mã.
 */
export function DealCard({ d, showContact, ten, anhDau, soThieu }: {
  d: DealRow;
  showContact: boolean;
  ten: string;
  anhDau: string | null;
  soThieu: number;
}) {
  return (
    <Card size="sm" className="relative">
      {showContact && (
        anhDau ? (
          // eslint-disable-next-line @next/next/no-img-element -- Ảnh tin qua /api/zalo-media
          <img src={anhDau} alt={`Ảnh căn — ${ten}`} className="h-36 w-full object-cover" loading="lazy" />
        ) : (
          <div className="bg-muted text-muted-foreground -mt-(--card-spacing) flex h-36 items-center justify-center text-xs">Chưa có ảnh</div>
        )
      )}
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link prefetch={false} href={`/ops/deals/${d.offerId}`} className="text-sm font-medium after:absolute after:inset-0 hover:underline">
              {ten}
            </Link>
            <span className="text-lg font-semibold tabular-nums">{d.priceVnd === null ? "—" : fmtCompact(d.priceVnd)}</span>
            <span className="text-muted-foreground text-xs">
              {d.pricePerm2 ? `${fmtInt(d.pricePerm2 / 1e6)} tr/m²` : "—"} · thước {d.medianPerm2 ? `${fmtInt(d.medianPerm2 / 1e6)} tr/m²` : "—"}
              {d.rulerN ? ` (${d.rulerN} tin)` : ""}
            </span>
          </div>
          <Badge variant="success-light" className="tabular-nums">−{d.discountPct?.toFixed(0)}%</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sourceBadge(d.source)}
          {confBadge(d.confidence)}
          {d.suspect && <Badge variant="warning-light">cần xác minh</Badge>}
          {soThieu > 0 && <Badge variant="outline">còn thiếu {soThieu} mục</Badge>}
        </div>
        {showContact && (d.sellerPhone || d.sellerName) && (
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="min-w-0 truncate font-medium" translate="no">{d.sellerName ?? "Người đăng"}</span>
            {d.sellerPhone && (
              <a href={`tel:${d.sellerPhone}`} className="text-primary relative z-10 flex shrink-0 items-center gap-1 font-medium tabular-nums hover:underline">
                <PhoneIcon aria-hidden className="size-3" />
                {fmtPhone(d.sellerPhone)}
              </a>
            )}
          </div>
        )}
        <DealSeenNote firstSeen={d.firstSeen} nReposts={d.nReposts} />
      </CardContent>
    </Card>
  );
}
