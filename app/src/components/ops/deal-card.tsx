import { PhoneIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/reui/badge";
import { DealSeenNote } from "@/components/ops/deal-seen-note";
import { type DealRow, dealMediaSrc } from "@/lib/deals";
import { fmtInt } from "@/lib/format";

function fmtPrice(v: number | null) {
  if (v === null) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(v % 1e9 === 0 ? 0 : 1)} tỷ`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}tr`;
  return fmtInt(v);
}

function confBadge(c: string) {
  if (c === "high") return <Badge variant="success-light">tin cậy cao</Badge>;
  if (c === "medium") return <Badge variant="outline">trung bình</Badge>;
  return <Badge variant="warning-light">thấp</Badge>;
}

// Ops chỉ hiện mã nguồn (SPL tầng B) — tên nguồn thật là tầng A.
function sourceBadge(s: string) {
  return <Badge variant="outline">{s}</Badge>;
}

/** SĐT lưu số gốc E.164 (SD3): +84973034567 → 0973 034 567 — dễ đọc khi gọi; dạng 0… đời trước vẫn tách nhóm. */
export function fmtPhone(p: string) {
  return p.replace(/^(?:\+84|0)(\d{3})(\d{3})(\d{3})$/, "0$1 $2 $3");
}

/**
 * Thẻ một tin trên «Căn giá tốt» (/ops/deals). Tách khỏi trang để test vẽ thẻ trong jsdom (ON11):
 * nhãn số lần đăng và nhãn «cần xác minh» là quan hệ với dữ liệu, không phải chữ có mặt trong mã.
 */
export function DealCard({ d, showContact }: { d: DealRow; showContact: boolean }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-lg font-semibold tabular-nums">
            {fmtPrice(d.priceVnd)}
          </span>
          <span className="text-muted-foreground text-xs">
            {d.areaM2 ? `${fmtInt(d.areaM2)} m²` : "—"}
            {d.bedrooms ? ` · ${d.bedrooms}PN` : ""} ·{" "}
            {d.pricePerm2 ? `${fmtInt(d.pricePerm2 / 1e6)}tr/m²` : "—"}
          </span>
        </div>
        <Badge variant="success-light" className="tabular-nums text-sm">
          −{d.discountPct?.toFixed(0)}%
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {sourceBadge(d.source)}
        <Link
          prefetch={false}
          href={d.areaPath ?? "/vn"}
          className="text-primary font-medium hover:underline"
        >
          {d.phuong ?? "—"}
        </Link>
        <span className="text-muted-foreground">
          thước {d.medianPerm2 ? `${fmtInt(d.medianPerm2 / 1e6)}tr/m²` : "—"}
          {d.rulerN ? ` (${d.rulerN} tin)` : ""}
        </span>
        {confBadge(d.confidence)}
        {d.suspect && <Badge variant="warning-light">cần xác minh</Badge>}
      </div>
      {showContact && (d.mediaPath || d.mediaUrl) && (
        // eslint-disable-next-line @next/next/no-img-element -- Ảnh local hoặc ảnh CDN của tin
        <img
          src={dealMediaSrc(d)}
          alt={`Ảnh tin bán — ${d.phuong ?? ""}`}
          className="h-36 w-full rounded-md object-cover"
          loading="lazy"
        />
      )}
      {showContact && (d.sellerPhone || d.sellerName) && (
        <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-xs">
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">
              {d.sellerName ? <span translate="no">{d.sellerName}</span> : "Người đăng"}
              {d.brokerNAds && d.brokerNAds > 1 && (
                <span className="text-muted-foreground font-normal">
                  {" "}· {d.brokerNAds} tin
                  {d.brokerMedianGap !== null
                    ? ` · chênh giữa ${d.brokerMedianGap.toFixed(0)}%`
                    : ""}
                </span>
              )}
            </span>
            <span className="text-muted-foreground truncate" translate="no">
              {d.groupName}
            </span>
          </div>
          {d.sellerPhone && (
            <a
              href={`tel:${d.sellerPhone}`}
              className="flex shrink-0 items-center gap-1 rounded-md bg-primary px-2 py-1 font-medium text-primary-foreground"
            >
              <PhoneIcon aria-hidden className="size-3" />
              {fmtPhone(d.sellerPhone)}
            </a>
          )}
        </div>
      )}
      {showContact && d.postText && (
        <p className="text-muted-foreground line-clamp-2 text-xs" translate="no">{d.postText}</p>
      )}
      <DealSeenNote firstSeen={d.firstSeen} nReposts={d.nReposts} />
    </div>
  );
}
