"use client"

import { Badge } from "@/components/reui/badge"
import { Item, ItemContent, ItemTitle } from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { fmtInt } from "@/lib/format"
import { TAT_CA, type HopChon, type MucHop } from "@/lib/ops/review-hop-hang-muc"

/** Giây → «8 giây» / «1 phút 12 giây» (như bảng Nhịp duyệt; làm tròn tổng giây trước khi tách phút). */
function giay(s: number | null): string {
  if (s === null) return "—"
  const t = Math.round(s)
  if (t < 60) return `${t} giây`
  const p = Math.floor(t / 60)
  const g = t % 60
  return g === 0 ? `${p} phút` : `${p} phút ${g} giây`
}

/**
 * Hộp hạng mục (OD2 · ĐC3) — chuyển thể cột trái `ScopeRail` của `@reui/solution-agents-9` (Mạnh duyệt §f4): mục «Tất cả»
 * rồi mỗi Hạng mục duyệt đang có thẻ chờ, số chờ ở badge, dòng mô tả «cũ nhất n ngày · trung vị x». Đổi so với bản gốc:
 * bỏ avatar chủ, bỏ thanh độ tự tin (Q9), chữ tiếng Việt; màn hẹp là dải cuộn ngang (container query của Frame).
 */
export function ReviewHopHangMuc({ hop, chon, tongCho, onChon }: {
  hop: MucHop[]
  chon: HopChon
  tongCho: number
  onChon: (c: HopChon) => void
}) {
  const muc = (ma: HopChon, nhan: string, cho: number, moTa: string | null) => {
    const dangChon = chon === ma
    return (
      <Item
        key={ma}
        // eslint-disable-next-line onehub-ui/no-raw-controls -- nguyên bản cột trái @reui/solution-agents-9: cả mục là một nút; Button không mang bố cục Item và ReUI cấm đặt padding/height lên nó
        render={<button type="button" />}
        size="sm"
        aria-pressed={dangChon}
        data-review-hop-muc={ma}
        className={cn(
          "hover:bg-muted min-w-48 shrink-0 cursor-pointer items-start border-0 text-left transition-colors @4xl:w-full @4xl:min-w-0",
          dangChon && "bg-primary/5 hover:bg-primary/5",
        )}
        onClick={() => onChon(ma)}
      >
        <ItemContent className="min-w-0 gap-1">
          <ItemTitle className="text-foreground flex w-full min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 truncate">{nhan}</span>
            <Badge variant={dangChon ? "primary-outline" : "outline"} className="tabular-nums" data-review-hop-cho>
              {fmtInt(cho)}
            </Badge>
          </ItemTitle>
          {moTa && <div className="text-muted-foreground min-w-0 truncate text-xs tabular-nums" data-review-hop-mo-ta>{moTa}</div>}
        </ItemContent>
      </Item>
    )
  }
  return (
    <aside
      className="border-border flex min-w-0 flex-col border-b @4xl:border-r @4xl:border-b-0"
      aria-label="Hạng mục duyệt"
      data-review-hop
    >
      <div className="flex items-center justify-between gap-3 px-(--frame-panel-header-px) py-2.5">
        <div className="text-foreground text-sm font-semibold">Hạng mục</div>
        <span className="text-muted-foreground text-xs tabular-nums">{fmtInt(hop.length)} hạng mục có thẻ chờ</span>
      </div>
      <div className="flex gap-1 overflow-x-auto p-1 @4xl:flex-col @4xl:overflow-visible">
        {muc(TAT_CA, "Tất cả", tongCho, null)}
        <Separator orientation="vertical" className="my-1 @4xl:hidden" />
        {hop.map((m) =>
          muc(m.ma, m.nhan, m.cho, [m.cuNhatNgay === null ? null : `cũ nhất ${fmtInt(m.cuNhatNgay)} ngày`, `trung vị ${giay(m.trungViGiay)}`].filter(Boolean).join(" · ")),
        )}
      </div>
    </aside>
  )
}
