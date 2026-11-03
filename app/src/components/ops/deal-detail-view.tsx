import { InfoIcon, PhoneIcon, TriangleAlertIcon } from "lucide-react";
import Link from "next/link";

import { DealSeenNote } from "@/components/ops/deal-seen-note";
import { LocalOnlyAlert } from "@/components/ops/local-only-alert";
import { ReviewPhotos } from "@/components/ops/review-photos";
import { PageHeader } from "@/components/page/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Frame, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { NGHI_NGO_PCT } from "@/lib/deals";
import { type DealChiTiet, NGUONG_LOAI_PCT, NGUONG_VAO_PCT, tenCan, thieuGi } from "@/lib/deals-chi-tiet";
import { fmtCompact, fmtInt } from "@/lib/format";
import { fmtPhone, telHref } from "@/lib/ops/people";

const trM2 = (v: number | null) => (v ? `${fmtInt(v / 1e6)} tr/m²` : "—");

function Dong({ nhan, children }: { nhan: string; children: React.ReactNode }) {
  return (
    <TableRow>
      <TableHead scope="row" className="text-muted-foreground w-2/5 font-normal whitespace-normal">{nhan}</TableHead>
      <TableCell className="text-sm wrap-anywhere whitespace-normal">{children}</TableCell>
    </TableRow>
  );
}

function Khoi({ tieuDe, children }: { tieuDe: string; children: React.ReactNode }) {
  return (
    <Frame spacing="default" className="w-full min-w-0">
      <FrameHeader>
        <FrameTitle role="heading" aria-level={2}>{tieuDe}</FrameTitle>
      </FrameHeader>
      <FramePanel>{children}</FramePanel>
    </Frame>
  );
}

/** Câu chứng minh: rẻ hơn thước bao nhiêu và đứng đâu so với ngưỡng. */
export function cauChungMinh(d: DealChiTiet): string | null {
  if (!d.pricePerm2 || !d.medianPerm2 || d.discountPct === null) return null;
  const re = `Rẻ hơn thước phường ${fmtInt((d.medianPerm2 - d.pricePerm2) / 1e6)} tr/m², tức ${d.discountPct.toFixed(0)}%`;
  return d.suspect
    ? `${re}, vượt ngưỡng ${NGHI_NGO_PCT}% nên cần gọi xác minh trước khi tin.`
    : `${re}, trên ngưỡng vào danh sách ${NGUONG_VAO_PCT}% và chưa tới ngưỡng cần xác minh ${NGHI_NGO_PCT}%.`;
}

/** /ops/deals/[offerId]: đủ năm câu căn nào, ở đâu, ảnh gì, vì sao giá tốt, gọi ai. */
export function DealDetailView({ d, xemNoiDung, mayThu }: { d: DealChiTiet; xemNoiDung: boolean; mayThu: boolean }) {
  const thieu = thieuGi(d, { xemNoiDung, mayThu });
  const noi = [
    ["Toà", d.block], ["Tầng", d.floor], ["Căn", d.unit],
    ["Đường", [d.streetNumber, d.street].filter(Boolean).join(" ") || null],
  ].filter(() => xemNoiDung) as [string, string | null][];
  const tel = d.sellerPhone ? telHref("sdt", d.sellerPhone, xemNoiDung) : null;
  const cau = cauChungMinh(d);
  const coNoiDung = xemNoiDung && mayThu;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Vận hành", href: "/ops" }, { label: "Căn giá tốt", href: "/ops/deals" }, { label: "Một căn" }]}
        title={tenCan(d)}
        stats={[d.priceVnd === null ? "—" : fmtCompact(d.priceVnd), `−${d.discountPct?.toFixed(0)}%`, d.source]}
        description="Đủ để quyết có gọi người bán không. Chỉ đọc."
        actions={d.suspect ? <Badge variant="warning-light">Cần xác minh</Badge> : undefined}
      />
      {d.roiDanhSach && (
        <Alert variant="info" data-deal-roi>
          <InfoIcon aria-hidden="true" />
          <AlertTitle>Đã rời danh sách</AlertTitle>
          <AlertDescription>{d.roiDanhSach}</AlertDescription>
        </Alert>
      )}
      {thieu.length > 0 && (
        <Alert variant="warning" data-deal-thieu>
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>Còn thiếu</AlertTitle>
          <AlertDescription>{thieu.join(" · ")}</AlertDescription>
        </Alert>
      )}
      {!mayThu && (
        <LocalOnlyAlert title="Ảnh, chữ bài chỉ có ở máy thu">
          Máy chủ chưa giữ hai phần này, nên căn không thiếu chúng. Mở cổng Ops trên máy thu để xem.
        </LocalOnlyAlert>
      )}
      {mayThu && !xemNoiDung && (
        <LocalOnlyAlert title="Ảnh, chữ bài, liên hệ dành cho vai Vận hành">
          Vai của bạn chỉ xem được số chứng minh và phường.
        </LocalOnlyAlert>
      )}
      <div className={coNoiDung ? "grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:grid-rows-[auto_1fr]" : "flex flex-col gap-6"}>
        {coNoiDung && (
          <Khoi tieuDe="Ảnh">
            {d.images.length > 0 ? (
              <ReviewPhotos label="Căn" images={d.images} lon />
            ) : (
              <Empty><EmptyHeader><EmptyTitle>Chưa có ảnh</EmptyTitle></EmptyHeader></Empty>
            )}
          </Khoi>
        )}
        <div className={coNoiDung ? "flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-span-2 lg:row-start-1" : "grid min-w-0 items-start gap-6 lg:grid-cols-2"}>
          <Khoi tieuDe="Vì sao giá tốt">
            <div className="flex flex-col gap-3">
              {cau && <p className="text-sm" data-deal-chung-minh>{cau}</p>}
              <Table>
                <TableBody>
                  <Dong nhan="Giá/m² căn này"><span className="tabular-nums">{trM2(d.pricePerm2)}</span></Dong>
                  <Dong nhan="Thước phường"><span className="tabular-nums">{trM2(d.medianPerm2)}</span></Dong>
                  <Dong nhan="Số tin dựng thước"><span className="tabular-nums">{d.rulerN ? `${fmtInt(d.rulerN)} tin S06` : "—"}</span></Dong>
                  <Dong nhan="Mức giảm"><span className="tabular-nums">{d.discountPct === null ? "—" : `${d.discountPct.toFixed(0)}%`}</span></Dong>
                  <Dong nhan="Ngưỡng">Vào danh sách từ {NGUONG_VAO_PCT}%, cần xác minh trên {NGHI_NGO_PCT}%, loại trên {NGUONG_LOAI_PCT}%</Dong>
                </TableBody>
              </Table>
            </div>
          </Khoi>
          {xemNoiDung && (
            <Khoi tieuDe="Gọi ai">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium" translate="no">{d.sellerName ?? "Người đăng chưa có tên"}</span>
                    <span className="text-muted-foreground text-xs" translate="no">
                      {[d.groupName, d.brokerNAds && d.brokerNAds > 1 ? `${d.brokerNAds} tin` : null].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  {tel && d.sellerPhone ? (
                    <Button size="sm" className="tabular-nums" nativeButton={false} render={<a href={tel} />}>
                      <PhoneIcon aria-hidden="true" />
                      <span translate="no">{fmtPhone(d.sellerPhone)}</span>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">Chưa có SĐT</span>
                  )}
                </div>
                <DealSeenNote firstSeen={d.firstSeen} nReposts={d.nReposts} />
              </div>
            </Khoi>
          )}
          <Khoi tieuDe="Ở đâu">
            <Table>
              <TableBody>
                {noi.filter(([, v]) => v).map(([n, v]) => <Dong key={n} nhan={n}><span translate="no">{v}</span></Dong>)}
                <Dong nhan="Phường">
                  <Button variant="link" size="xs" className="justify-start px-0" nativeButton={false} render={<Link prefetch={false} href={d.areaPath ?? "/vn"} />}>
                    {d.phuong ?? "—"}
                  </Button>
                </Dong>
                {d.district && <Dong nhan="Quận"><span translate="no">{d.district}</span></Dong>}
              </TableBody>
            </Table>
          </Khoi>
        </div>
        {coNoiDung && (
          <div className="lg:col-start-1 lg:row-start-2">
            <Khoi tieuDe="Chữ bài">
              {d.postTextFull ? (
                <p className="text-sm whitespace-pre-line" translate="no" data-deal-chu-bai>{d.postTextFull}</p>
              ) : (
                <Empty><EmptyHeader><EmptyTitle>Chưa có chữ bài</EmptyTitle></EmptyHeader></Empty>
              )}
            </Khoi>
          </div>
        )}
      </div>
    </div>
  );
}
