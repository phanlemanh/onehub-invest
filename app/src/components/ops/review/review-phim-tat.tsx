"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"

/** Bảng phím của chế độ duyệt — một nguồn cho Dialog và test (mọi phím `usePhimDuyet` bắt phải có ở đây). */
export const PHIM_DUYET: { nhom: string; phim: { keys: string[]; viec: string }[] }[] = [
  {
    nhom: "Đi lại",
    phim: [
      { keys: ["J"], viec: "Thẻ sau" },
      { keys: ["↓"], viec: "Thẻ sau" },
      { keys: ["K"], viec: "Thẻ trước" },
      { keys: ["↑"], viec: "Thẻ trước" },
      { keys: ["Esc"], viec: "Đóng thẻ" },
    ],
  },
  {
    nhom: "Quyết",
    phim: [
      { keys: ["1–4"], viec: "Bấm đáp án theo số trên nút" },
      { keys: ["R"], viec: "Vào ô lý do" },
      { keys: ["?"], viec: "Mở bảng phím" },
    ],
  },
]

/**
 * Bảng phím tắt (OD2 · ĐC4) — chuyển thể `@reui/c-dialog-9`: Dialog nhỏ hai cột, không Sheet chồng lên sheet thẻ (§f4).
 * Đổi so với bản gốc: danh sách phím của chế độ duyệt chia hai nhóm, chữ tiếng Việt, không phím ⌘ (vỏ Ops giữ ⌘K).
 */
export function ReviewPhimTat({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-review-phim-tat>
        <DialogHeader>
          <DialogTitle>Phím tắt</DialogTitle>
          <DialogDescription>Phím chữ và số không chạy khi đang gõ trong ô lý do.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {PHIM_DUYET.map((n) => (
            <div key={n.nhom} className="flex flex-col gap-3">
              <span className="text-xs font-medium">{n.nhom}</span>
              {n.phim.map((p) => (
                <div key={`${p.keys.join("+")}-${p.viec}`} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground text-sm">{p.viec}</span>
                  <div className="flex gap-1">
                    {p.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Đóng</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
