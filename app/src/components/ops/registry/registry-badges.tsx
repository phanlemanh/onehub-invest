import { Badge } from "@/components/reui/badge"
import { LABELS_VI } from "@/lib/vocab.generated"

const BAC_VARIANT = { xac_minh: "success-light", suy_ra_manh: "info-light", mot_loi_khai: "warning-light" } as const

/** Bậc danh mục của nút, toà hay căn (nhãn từ sổ từ vựng `catalog_tier`). */
export function BacBadge({ bac }: { bac: string }) {
  const nhan = (LABELS_VI.catalog_tier as Record<string, string>)[bac] ?? bac
  const variant = (BAC_VARIANT as Record<string, (typeof BAC_VARIANT)[keyof typeof BAC_VARIANT]>)[bac] ?? "outline"
  return (
    <Badge variant={variant} data-bac={bac}>
      {nhan}
    </Badge>
  )
}

/** Nguồn dạng mã `S0x`; không có nguồn thì một gạch. */
export function NguonBadges({ nguon }: { nguon: string[] }) {
  if (nguon.length === 0) return <span className="text-muted-foreground text-xs">—</span>
  return (
    <div className="flex flex-wrap gap-1" data-nguon={nguon.join(" ")}>
      {nguon.map((s) => (
        <Badge key={s} variant="outline" translate="no">
          {s}
        </Badge>
      ))}
    </div>
  )
}
