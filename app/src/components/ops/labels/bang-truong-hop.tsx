import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fmtInt } from "@/lib/format"
import type { DongTruongHop } from "@/lib/labels-luot-hai"
import { CASE_KINDS } from "@/lib/labels-normalize"

/** Bảng trường hợp theo nhóm: chỉ có số. Chữ lý do chỉ đọc qua lệnh xuất ở máy thu, để người gắn trùng không bị dẫn dắt. */
export function BangTruongHop({ rows }: { rows: DongTruongHop[] }) {
  return (
    <Frame variant="default" spacing="sm" className="w-full min-w-0" data-labels-cases="">
      <FrameHeader>
        <FrameTitle>Trường hợp theo nhóm</FrameTitle>
        <FrameDescription className="text-xs text-pretty">Chỉ có số. Chữ lý do đọc qua lệnh xuất ở máy thu.</FrameDescription>
      </FrameHeader>
      <FramePanel className="p-0!">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="ps-5">Nhóm</TableHead>
              <TableHead className="text-end">Đã gắn</TableHead>
              <TableHead className="text-end">Cần ngữ cảnh</TableHead>
              <TableHead className="pe-5">Trường hợp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const loai = CASE_KINDS.filter((k) => r.theoLoai[k.value]).map((k) => `${k.label} ${fmtInt(r.theoLoai[k.value]!)}`)
              return (
                <TableRow key={r.unitCode} data-nhom={r.unitCode}>
                  <TableCell className="ps-5 whitespace-normal wrap-anywhere">{r.ten}</TableCell>
                  <TableCell className="text-end tabular-nums">
                    {r.daGan === 0 ? <span className="text-muted-foreground text-xs">chưa có</span> : `${fmtInt(r.daGan)}/${fmtInt(r.tong)}`}
                  </TableCell>
                  <TableCell className="text-end tabular-nums">{r.daGan === 0 ? "—" : fmtInt(r.canNguCanh)}</TableCell>
                  <TableCell className="text-muted-foreground pe-5 text-xs whitespace-normal">{loai.length ? loai.join(" · ") : "—"}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </FramePanel>
    </Frame>
  )
}
