import { Badge } from "@/components/reui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RawLabel } from "@/components/ops/raw-label"
import { propertyTypeLabel } from "@/lib/ops-labels"
import { fmtInt } from "@/lib/format"
import { fmtGia, fmtGiaM2, NGUONG_DANG_NHIEU, nhanCanCu, SO_LABEL, type BenNguoi, type HangNguoi, type HangSo, type So } from "@/lib/ops/review-can-cu"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

const SO_VARIANT: Record<So, BadgeVariant> = { khop: "success-light", lech: "warning-light", thieu: "outline", khong_so: "outline" }

function giaTri(h: HangSo, v: string | number | null) {
  if (v === null) return "—"
  if (h.key === "price_vnd") return <span className="tabular-nums">{fmtGia(Number(v))}</span>
  if (h.key === "price_perm2") return <span className="tabular-nums">{fmtGiaM2(Number(v))}</span>
  if (h.key === "area_m2") return <span className="tabular-nums">{v} m²</span>
  if (h.key === "property_type") return <RawLabel n={propertyTypeLabel(String(v))} raw={String(v)} />
  if (typeof v === "number") return <span className="tabular-nums">{v}</span>
  return <span translate="no">{v}</span>
}

/** Ô giá trị; trường trục mang căn cứ của chính tin đó ngay dưới giá trị; ô đổi từ lúc sinh thẻ mang dòng «Lúc chấm». */
function O({ h, v, canCu, lucCham }: { h: HangSo; v: string | number | null; canCu: string; lucCham: string | number | null }) {
  return (
    <TableCell className="align-top whitespace-normal">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-medium">{giaTri(h, v)}</span>
        {h.truc && <span className="text-muted-foreground text-xs" data-review-can-cu>{canCu}</span>}
        {lucCham !== null && (
          <span className="text-muted-foreground text-xs" data-review-luc-cham>
            Lúc chấm: {giaTri(h, lucCham)}
          </span>
        )}
      </div>
    </TableCell>
  )
}

/** Ô người đăng của một tin (HD7): người neo, SĐT, số tin hoặc Badge, căn cứ của vai. Tên và SĐT là tầng C — hiện nguyên. */
function ONguoi({ ben, dangNhieu }: { ben: BenNguoi | null; dangNhieu: number | null }) {
  if (!ben) return <TableCell className="align-top">—</TableCell>
  const neo = ben.ds[0]
  const ten = neo?.ten ?? ben.ten
  const sdt = ben.sdt ?? neo?.sdts[0] ?? null
  const khac = ben.ds.length - 1
  // Badge của người khác đứng cạnh «+n người khác», không dưới tên người neo — đọc nhầm là số tin của người neo.
  const badge = dangNhieu !== null && (
    <Badge variant="warning-light" data-review-dang-nhieu>Đăng {fmtInt(dangNhieu)} tin</Badge>
  )
  return (
    <TableCell className="align-top whitespace-normal">
      <div className="flex min-w-0 flex-col items-start gap-0.5">
        <span className="font-medium" translate="no" data-review-nguoi-ten>{ten ?? "—"}</span>
        <span className={sdt ? "tabular-nums" : "text-muted-foreground text-xs"} translate={sdt ? "no" : undefined} data-review-nguoi-sdt>
          {sdt ?? "Chưa có SĐT"}
        </span>
        {neo && neo.soTin >= NGUONG_DANG_NHIEU && badge}
        {neo && neo.soTin < NGUONG_DANG_NHIEU && (
          <span className="text-muted-foreground text-xs tabular-nums" data-review-so-tin>{fmtInt(neo.soTin)} tin đang rao</span>
        )}
        {neo ? (
          <span className="text-muted-foreground text-xs" data-review-can-cu>{nhanCanCu(neo.canCu)}</span>
        ) : (
          <span className="text-muted-foreground text-xs" data-review-ngoai-danh-ba>Chưa có trong danh bạ</span>
        )}
        {khac > 0 && <span className="text-muted-foreground text-xs" data-review-nguoi-khac>+{fmtInt(khac)} người khác</span>}
        {neo && neo.soTin < NGUONG_DANG_NHIEU && badge}
      </div>
    </TableCell>
  )
}

/** Hàng «Người đăng» — nhãn So và dòng phụ tính tất định ở `soNguoiDang`. */
function HangNguoiDang({ h }: { h: HangNguoi }) {
  return (
    <TableRow data-review-compare="nguoi_dang">
      <TableCell className="text-muted-foreground align-top text-xs whitespace-normal">Người đăng</TableCell>
      <ONguoi ben={h.a} dangNhieu={h.dangNhieuA} />
      <ONguoi ben={h.b} dangNhieu={h.dangNhieuB} />
      <TableCell className="align-top whitespace-normal">
        <div className="flex min-w-0 flex-col items-start gap-1">
          <Badge variant={SO_VARIANT[h.so]}>{SO_LABEL[h.so]}</Badge>
          {h.phu && <span className="text-muted-foreground text-xs" translate="no" data-review-so-phu>{h.phu}</span>}
          {h.tenGoi && (
            <span className="text-muted-foreground text-xs" data-review-ten-goi>
              Tên gọi «<span translate="no">{h.tenGoi}</span>» có trong văn bản Tin A
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

/**
 * Bảng so từng trường của thẻ ghép căn (PL3): một hàng mỗi trường, giá trị Tin A/Tin B kèm căn cứ của chính tin đó,
 * nhãn So tính tất định ở `soTruongGhepCan`. Thay hai khối tin + «Điểm B» cũ — căn cứ của «cùng căn?» là từng trường.
 * Trường ngoài trục PL15 (giá, diện tích, giá/m², phường, tầng) chưa có phát biểu ở cả hai tin: câu chưa ghi căn cứ đứng
 * một lần ở cột Trường thay vì lặp ở hai ô.
 */
export function ReviewCompare({ rows }: { rows: (HangSo | HangNguoi)[] }) {
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
        {rows.map((h) => h.key === "nguoi_dang" ? (
          <HangNguoiDang key={h.key} h={h} />
        ) : (
          <TableRow key={h.key} data-review-compare={h.key}>
            <TableCell className="align-top text-xs whitespace-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">{h.label}</span>
                {!h.truc && <span className="text-muted-foreground" data-review-can-cu>{h.canCuA}</span>}
              </div>
            </TableCell>
            <O h={h} v={h.a} canCu={h.canCuA} lucCham={h.lucChamA} />
            <O h={h} v={h.b} canCu={h.canCuB} lucCham={h.lucChamB} />
            <TableCell className="align-top">
              <Badge variant={SO_VARIANT[h.so]}>{SO_LABEL[h.so]}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
