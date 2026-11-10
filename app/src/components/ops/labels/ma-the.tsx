"use client"

// Theo chip mã của @reui/solution-dev-ops-6 (ConnectionIdChip): mã đơn sắc, bấm để chép, đổi biểu tượng khi đã chép,
// bảng tạm bị chặn thì báo. Ở đây chính mã là nút, cỡ chữ của dòng mô tả, để Mạnh và phiên trợ lý gọi đúng một thẻ.
import { useEffect, useRef, useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function MaThe({ itemId }: { itemId: number }) {
  const [daChep, setDaChep] = useState(false)
  const hen = useRef<number | null>(null)
  useEffect(() => () => {
    if (hen.current) window.clearTimeout(hen.current)
  }, [])
  const chep = () => {
    const loi = () => toast.error("Không chép được mã thẻ", { description: "Trình duyệt chặn bảng tạm." })
    if (!navigator.clipboard) return loi()
    navigator.clipboard.writeText(String(itemId)).then(() => {
      setDaChep(true)
      if (hen.current) window.clearTimeout(hen.current)
      hen.current = window.setTimeout(() => setDaChep(false), 2000)
    }, loi)
  }
  return (
    <Button
      type="button"
      variant="link"
      size="xs"
      className="tabular-nums"
      aria-label={daChep ? `Đã chép mã thẻ ${itemId}` : `Chép mã thẻ ${itemId}`}
      data-labels-ma-the={itemId}
      onClick={chep}
    >
      #{itemId}
      {daChep ? <CheckIcon data-icon="inline-end" aria-hidden="true" /> : <CopyIcon data-icon="inline-end" aria-hidden="true" />}
    </Button>
  )
}
