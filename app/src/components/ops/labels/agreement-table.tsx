import { Badge } from "@/components/reui/badge"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FIELD_LABEL, LABEL_FIELDS, type LabelField } from "@/lib/labels-normalize"
import type { DongThuanTruong } from "@/lib/labels-queries"
import { fmtInt } from "@/lib/format"

/** Ngưỡng đồng thuận từng trường (F5): dưới ngưỡng thì sửa hướng dẫn gắn nhãn trước khi tin số đo. */
export const NGUONG_DONG_THUAN = 0.9

const fmtTiLe = (v: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(v)

/** Bảng đồng thuận chín trường trên phần gắn trùng (view eval_label_agreement). Chưa có cặp → «chưa đủ cặp», không 0. */
export function AgreementTable({ rows }: { rows: DongThuanTruong[] }) {
  const theoTruong = new Map(rows.map((r) => [r.field, r]))
  return (
    <Frame variant="default" spacing="sm" className="w-full" data-labels-agreement="">
      <FrameHeader>
        <FrameTitle>Đồng thuận trên phần gắn trùng</FrameTitle>
        <FrameDescription className="text-xs text-pretty">
          Tỉ lệ cặp hai người ghi cùng giá trị, từng trường. Dưới {fmtTiLe(NGUONG_DONG_THUAN)} thì sửa hướng dẫn gắn nhãn trước khi
          tin số đo.
        </FrameDescription>
      </FrameHeader>
      <FramePanel className="p-0!">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="ps-5">Trường</TableHead>
              <TableHead className="text-end">Cặp đủ</TableHead>
              <TableHead className="text-end">Khớp</TableHead>
              <TableHead className="pe-5 text-end">Đồng thuận</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {LABEL_FIELDS.map((f: LabelField) => {
              const r = theoTruong.get(f)
              const tiLe = r?.tiLe ?? null
              return (
                <TableRow key={f} data-field={f}>
                  <TableCell className="ps-5">{FIELD_LABEL[f]}</TableCell>
                  <TableCell className="text-end tabular-nums">{fmtInt(r?.capDu ?? 0)}</TableCell>
                  <TableCell className="text-end tabular-nums">{fmtInt(r?.khop ?? 0)}</TableCell>
                  <TableCell className="pe-5 text-end">
                    {tiLe == null ? (
                      <span className="text-muted-foreground text-xs">chưa đủ cặp</span>
                    ) : tiLe < NGUONG_DONG_THUAN ? (
                      <Badge variant="warning-light" data-duoi-nguong="">
                        {fmtTiLe(tiLe)}
                      </Badge>
                    ) : (
                      <span className="tabular-nums">{fmtTiLe(tiLe)}</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </FramePanel>
    </Frame>
  )
}
