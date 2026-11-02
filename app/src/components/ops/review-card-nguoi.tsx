"use client";

import type { ReactNode } from "react";
import { CheckIcon, CircleHelpIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtInt, fmtMoney, fmtVnDate } from "@/lib/format";
import type { ReviewItem } from "@/lib/ops/review-queue";

import type { ReviewCardParts } from "./review-card";
import { DoneState, PendingActions, useDecide } from "./review-card";

/** Evidence thẻ Người (HD17, pipeline/lib/the-duyet-nguoi.mjs `evidenceThe`). */
export type NguoiEvidence = {
  source?: string;
  tai_khoan?: { id: string; ten: string | null; so_tin: number }[];
  sdt?: { sdt: string; so_tin: number }[];
  tin_mau?: { offer_id: string; gia: number | null; dien_tich: number | null; ngay: string | null }[];
};

export const NGUOI_DONE_LABEL: Record<string, string> = { approved: "Đã gộp", rejected: "Giữ tách", deferred: "Hoãn" };

/** Thẻ «Gộp Người?»: một nhóm tài khoản–SĐT không nối một–một; người duyệt quyết cả nhóm. */
export function NguoiCard({ item, render }: { item: ReviewItem; render: (parts: ReviewCardParts) => ReactNode }) {
  const d = useDecide(item.id);
  const ev = (item.evidence ?? {}) as NguoiEvidence;
  const taiKhoan = ev.tai_khoan ?? [];
  const sdt = ev.sdt ?? [];
  const tin = ev.tin_mau ?? [];
  const body = (
    <div className="flex flex-col gap-4" data-review-nguoi>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Gộp Người?</span>
        {ev.source && <Badge variant="outline">{ev.source}</Badge>}
        <span className="text-muted-foreground text-xs">
          {taiKhoan.length} tài khoản · {sdt.length} SĐT — gộp hết thành một Người, hay giữ tách
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Table data-review-nguoi-tai-khoan>
          <TableHeader>
            <TableRow>
              <TableHead>Tài khoản</TableHead>
              <TableHead className="text-right">Số tin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taiKhoan.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-sm break-all">
                  {t.ten ?? "Chưa có tên"} <span className="text-muted-foreground text-xs">· {t.id}</span>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">{fmtInt(t.so_tin)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Table data-review-nguoi-sdt>
          <TableHeader>
            <TableRow>
              <TableHead>SĐT</TableHead>
              <TableHead className="text-right">Số tin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sdt.map((s) => (
              <TableRow key={s.sdt}>
                <TableCell className="text-sm tabular-nums">{s.sdt}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">{fmtInt(s.so_tin)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {tin.length > 0 && (
        <Table data-review-nguoi-tin>
          <TableHeader>
            <TableRow>
              <TableHead>Tin mẫu</TableHead>
              <TableHead className="text-right">Giá</TableHead>
              <TableHead className="text-right">Diện tích</TableHead>
              <TableHead className="text-right">Ngày</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tin.map((t) => (
              <TableRow key={t.offer_id}>
                <TableCell className="text-xs break-all">{t.offer_id}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">{fmtMoney(t.gia, "VND", true)}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">{t.dien_tich == null ? "—" : `${t.dien_tich} m²`}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">{fmtVnDate(t.ngay)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
  const tat = d.pending || !d.ready;
  const actions = item.status === "pending" ? (
    <PendingActions d={d}>
      <Button size="sm" onClick={() => d.decide("approved")} disabled={tat}>
        <CheckIcon data-icon="inline-start" aria-hidden />
        Gộp thành một Người
      </Button>
      <Button size="sm" variant="outline" onClick={() => d.decide("rejected")} disabled={tat}>
        <XIcon data-icon="inline-start" aria-hidden />
        Giữ tách
      </Button>
      <Button size="sm" variant="outline" onClick={() => d.decide("deferred")} disabled={tat}>
        <CircleHelpIcon data-icon="inline-start" aria-hidden />
        Hoãn
      </Button>
    </PendingActions>
  ) : (
    <DoneState item={item} labels={NGUOI_DONE_LABEL} />
  );
  return render({ body, actions });
}
