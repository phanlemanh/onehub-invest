import { Badge } from "@/components/reui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RawLabel } from "@/components/ops/raw-label"
import { propertyTypeLabel } from "@/lib/ops-labels"
import { fmtGia, fmtGiaM2, SO_LABEL, type HangSo, type So } from "@/lib/ops/review-can-cu"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

const SO_VARIANT: Record<So, BadgeVariant> = { khop: "success-light", lech: "warning-light", thieu: "outline" }

function giaTri(h: HangSo, v: string | number | null) {
  if (v === null) return "—"
  if (h.key === "price_vnd") return <span className="tabular-nums">{fmtGia(Number(v))}</span>
  if (h.key === "price_perm2") return <span className="tabular-nums">{fmtGiaM2(Number(v))}</span>
  if (h.key === "area_m2") return <span className="tabular-nums">{v} m²</span>
  if (h.key === "property_type") return <RawLabel n={propertyTypeLabel(String(v))} raw={String(v)} />
  if (typeof v === "number") return <span className="tabular-nums">{v}</span>
  return <span translate="no">{v}</span>
}

/** Ô giá trị; trường trục mang căn cứ của chính tin đó ngay dưới giá trị. */
function O({ h, v, canCu }: { h: HangSo; v: string | number | null; canCu: string }) {
  return (
    <TableCell className="align-top whitespace-normal">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-medium">{giaTri(h, v)}</span>
        {h.truc && <span className="text-muted-foreground text-xs" data-review-can-cu>{canCu}</span>}
      </div>
    </TableCell>
  )
}

/**
 * Bảng so từng trường của thẻ ghép căn (PL3): một hàng mỗi trường, giá trị Tin A/Tin B kèm căn cứ của chính tin đó,
 * nhãn So tính tất định ở `soTruongGhepCan`. Thay hai khối tin + «Điểm B» cũ — căn cứ của «cùng căn?» là từng trường.
 * Trường ngoài trục PL15 (giá, diện tích, giá/m², phường, tầng) chưa có phát biểu ở cả hai tin: câu chưa ghi căn cứ đứng
 * một lần ở cột Trường thay vì lặp ở hai ô.
 */
export function ReviewCompare({ rows }: { rows: HangSo[] }) {
  return (
    <Table data-review-compare-table>
      <TableHeader>
        <TableRow>
          <TableHead>Trường</TableHead>
          <TableHead>Tin A</TableHead>
          <TableHead>Tin B</TableHead>
          <TableHead>So</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((h) => (
          <TableRow key={h.key} data-review-compare={h.key}>
            <TableCell className="align-top text-xs whitespace-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">{h.label}</span>
                {!h.truc && <span className="text-muted-foreground" data-review-can-cu>{h.canCuA}</span>}
              </div>
            </TableCell>
            <O h={h} v={h.a} canCu={h.canCuA} />
            <O h={h} v={h.b} canCu={h.canCuB} />
            <TableCell className="align-top">
              <Badge variant={SO_VARIANT[h.so]}>{SO_LABEL[h.so]}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
