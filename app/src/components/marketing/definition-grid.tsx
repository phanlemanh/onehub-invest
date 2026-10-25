import type { ReactNode } from "react"
import { cn } from "cn"

export type Definition = { id: string; question: string; answer: ReactNode }

/**
 * Một mục định nghĩa của trang Phương pháp — chuyển thể lưới câu hỏi của @reui/faq-3:
 * mọi câu trả lời mở sẵn (không accordion), lưới hai cột kẻ mảnh, xếp một cột ở màn hẹp.
 * Khác bản gốc: tiêu đề mục là h2 có id (đích của mục lục), mỗi ô mang id riêng để
 * ⓘ định nghĩa trên ô KPI trỏ thẳng tới (vd. /methodology#revpar); câu trả lời nhận ReactNode.
 */
export function DefinitionGrid({
  id,
  title,
  description,
  items,
}: {
  id: string
  title: string
  description?: string
  items: Definition[]
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mx-auto flex w-full max-w-5xl scroll-mt-20 flex-col gap-6">
      <div className="flex max-w-2xl flex-col gap-2">
        <h2
          id={`${id}-title`}
          className="text-foreground text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl"
        >
          {title}
        </h2>
        {description && <p className="text-muted-foreground text-base leading-7 text-pretty">{description}</p>}
      </div>

      <div className="border-border/60 grid border-t md:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            id={item.id}
            className={cn(
              "border-border/60 flex scroll-mt-20 flex-col gap-2 border-b py-6 md:py-7",
              index % 2 === 0 ? "md:border-r md:pr-8" : "md:pl-8"
            )}
          >
            <h3 className="text-foreground text-base font-semibold">{item.question}</h3>
            <div className="text-muted-foreground text-sm leading-relaxed text-pretty">
              {typeof item.answer === "string" ? <p>{item.answer}</p> : item.answer}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
