import type { ReactNode } from "react"
import Link from "next/link"
import { InfoIcon } from "lucide-react"

import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"

/** Hai nhãn cùng chữ «Chưa xác minh» nói về hai thứ khác nhau (CONTEXT.md), nên mỗi nhãn có tên và lời giải thích riêng. */
export const OFFER_LABEL_HELP = {
  offer: {
    title: "Tin chưa xác minh",
    body: "Tin từ nhóm cộng đồng, chưa đối chiếu với nguồn khác. Hãy tự kiểm giá, diện tích và vị trí trước khi quyết định.",
    note: "Thẻ không có nhãn cũng chưa được kiểm tra từng tin.",
    anchor: "chua-xac-minh",
  },
  phone: {
    title: "Số chưa xác minh",
    body: "Số không lấy trực tiếp từ chính tin này: suy từ tin hoặc bài khác của cùng tài khoản, hoặc chưa đủ bằng chứng. Khi gọi, hãy hỏi lại có đúng người đăng tin không.",
    note: null,
    anchor: "so-chua-xac-minh",
  },
} as const

/**
 * Bọc nhãn để giải thích ngay trên thẻ: rê chuột, chạm hoặc Enter đều mở, nên điện thoại không thiếu đường. Không có nhãn
 * thì không vẽ gì. Badge do chỗ gọi truyền vào, thành phần này không đổi cỡ hay màu của nó.
 */
export function OfferLabelHelp({ what, children }: { what: keyof typeof OFFER_LABEL_HELP; children: ReactNode }) {
  if (!children) return null
  const help = OFFER_LABEL_HELP[what]
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        aria-label={`${help.title}: xem giải thích`}
        className="focus-visible:ring-ring/50 inline-flex w-fit cursor-help items-center gap-1 rounded-full outline-none focus-visible:ring-[3px]"
      >
        {children}
        <InfoIcon className="text-muted-foreground size-3.5" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>{help.title}</PopoverTitle>
          <PopoverDescription>{help.body}</PopoverDescription>
          {help.note ? <PopoverDescription>{help.note}</PopoverDescription> : null}
        </PopoverHeader>
        <Link prefetch={false} href={`/methodology#${help.anchor}`} className="text-foreground text-sm underline underline-offset-4">
          Xem phương pháp
        </Link>
      </PopoverContent>
    </Popover>
  )
}
