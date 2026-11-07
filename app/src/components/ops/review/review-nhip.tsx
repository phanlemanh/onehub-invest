import Link from "next/link"
import { TimerIcon } from "lucide-react"

import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fmtInt } from "@/lib/format"
import { REVIEW_CATEGORY_LABEL } from "@/lib/ops/review-hang-muc"
import { NHIP_SO_NGAY, NHIP_TRAN_GIAY, type HangNhip } from "@/lib/ops/review-nhip"

/** Giây hiện cho người: «50 giây», «6,5 giây», «2 phút 10 giây»; null → «—». */
export function fmtGiay(s: number | null): string {
  if (s === null) return "—"
  if (s < 60) return `${String(s).replace(".", ",")} giây`
  const p = Math.floor(s / 60)
  const g = Math.round(s - p * 60)
  return g === 0 ? `${p} phút` : `${p} phút ${g} giây`
}

const TIEU_DE = `Nhịp duyệt ${NHIP_SO_NGAY} ngày`

/**
 * Frame «Nhịp duyệt 7 ngày» trên /ops/review (OD1 · ĐC6): một hàng mỗi hạng mục có thẻ chờ hay có lượt đo. Số trước của OD2
 * (rail hạng mục thay khung này). Cùng họ Frame với «Danh sách thẻ». Không lượt đo nào → trống kèm lối mở thẻ chờ cũ nhất.
 */
export function ReviewNhip({ rows, oldestPendingId }: { rows: HangNhip[]; oldestPendingId: number | null }) {
  const coDo = rows.some((r) => r.n > 0 || r.overCap > 0 || r.medianSincePrev !== null)
  return (
    <Frame spacing="default" className="w-full min-w-0" data-review-nhip>
      <FrameHeader>
        <FrameTitle role="heading" aria-level={2}>{TIEU_DE}</FrameTitle>
        <FrameDescription>
          Trung vị giây mỗi thẻ theo hạng mục. Lượt mở quá {NHIP_TRAN_GIAY / 60} phút không vào trung vị.
        </FrameDescription>
      </FrameHeader>
      <FramePanel>
        {coDo ? (
          <Table data-review-nhip-bang>
            <TableHeader>
              <TableRow>
                <TableHead>Hạng mục</TableHead>
                <TableHead className="text-end">Thẻ chờ</TableHead>
                <TableHead className="text-end">Đã quyết có đo</TableHead>
                <TableHead className="text-end">Trung vị ở thẻ</TableHead>
                <TableHead className="text-end">Giữa hai lượt</TableHead>
                <TableHead className="text-end">Quá {NHIP_TRAN_GIAY / 60} phút</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.category} data-review-nhip-hang={r.category}>
                  <TableCell className="font-medium">{REVIEW_CATEGORY_LABEL[r.category]}</TableCell>
                  <TableCell className="text-end tabular-nums" data-cot="cho">{fmtInt(r.pending)}</TableCell>
                  <TableCell className="text-end tabular-nums" data-cot="n">{fmtInt(r.n)}</TableCell>
                  <TableCell className="text-end tabular-nums" data-cot="trung-vi">{fmtGiay(r.medianSeconds)}</TableCell>
                  <TableCell className="text-end tabular-nums" data-cot="giua">{fmtGiay(r.medianSincePrev)}</TableCell>
                  <TableCell className="text-end tabular-nums" data-cot="qua-tran">{fmtInt(r.overCap)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty data-review-nhip-trong>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TimerIcon aria-hidden />
              </EmptyMedia>
              <EmptyTitle>Chưa có lượt quyết nào được đo trong {NHIP_SO_NGAY} ngày.</EmptyTitle>
              <EmptyDescription>Số giây mỗi thẻ ghi từ lượt quyết kế tiếp.</EmptyDescription>
            </EmptyHeader>
            {oldestPendingId !== null && (
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/ops/review?card=${oldestPendingId}`} />}
                >
                  Mở thẻ chờ cũ nhất
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </FramePanel>
    </Frame>
  )
}

/** Khung tải của Frame nhịp — đúng bố cục: tiêu đề + 4 hàng bảng. */
export function ReviewNhipSkeleton() {
  return (
    <Frame spacing="default" className="w-full min-w-0">
      <FrameHeader>
        <FrameTitle role="heading" aria-level={2}>{TIEU_DE}</FrameTitle>
        <Skeleton className="h-4 w-72" />
      </FrameHeader>
      <FramePanel className="flex flex-col gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </FramePanel>
    </Frame>
  )
}
