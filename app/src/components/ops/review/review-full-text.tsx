import type { OfferContext } from "@/lib/ops/review-context"

/**
 * Toàn văn một tin trên sheet hàng duyệt (PL3): đọc lại từ bảng nạp ở máy thu (`loadReviewContext`), không cắt ký tự,
 * giữ xuống dòng; máy thu không có bài gốc (vd S05) → nói ra, kèm đoạn đầu evidence nếu có. Tên nhóm S03 (tầng C)
 * là dòng meta riêng, không dính vào đoạn tin. `ctx` vắng (vai không có nội dung, dựng thẻ đứng riêng) → không render.
 */
export function ReviewFullText({ label, ctx, doanDau }: {
  label: string
  ctx: OfferContext | undefined
  /** Đoạn đầu tin lưu trong evidence (tối đa 300 ký tự) — chỉ hiện khi máy thu không có toàn văn. */
  doanDau?: string | null
}) {
  if (!ctx) return null
  return (
    <section className="flex min-w-0 flex-col gap-1" aria-label={`Toàn văn ${label}`}>
      <h3 className="text-xs font-medium">Toàn văn — {label}</h3>
      {ctx.nhom && (
        <p className="text-muted-foreground text-xs" translate="no" data-review-group>
          Nhóm: {ctx.nhom}
        </p>
      )}
      {ctx.toanVan ? (
        <p className="text-sm break-words whitespace-pre-line" translate="no" data-review-quote data-review-fulltext>
          {ctx.toanVan}
        </p>
      ) : (
        <>
          <p className="text-muted-foreground text-xs" data-review-fulltext-missing>
            Không có toàn văn ở máy thu{doanDau ? " — đoạn đầu lưu trên thẻ:" : ""}
          </p>
          {doanDau && (
            <p className="text-muted-foreground text-xs break-words whitespace-pre-line" translate="no" data-review-quote>
              {doanDau}
            </p>
          )}
        </>
      )}
    </section>
  )
}
