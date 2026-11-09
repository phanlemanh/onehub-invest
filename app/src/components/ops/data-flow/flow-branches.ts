import type { Branches, SourceFlow } from "@/lib/data-flow-queries"

/**
 * Hai hàm đọc nhánh bài của DF6 (`bai-nhan-tru-bai-chi-anh`) cho các thành phần client — tách khỏi data-flow-queries.ts
 * vì tệp ấy kéo `pg` (chỉ nhập KIỂU từ đó).
 */

/** «Bài cần đọc» = bài nhận trừ ảnh đã ghép vào tin — mẫu số của tỉ lệ «Đọc được» ở mọi chỗ của trang. Khối chưa tách
 * nhánh → bài nhận như trước. */
export function toReadOf(c: { received: number } & Pick<Branches, "imageMerged">): number {
  return c.received - (c.imageMerged ?? 0)
}

/** «Đọc được» = đọc thành tin rao + đọc thành Yêu cầu (Mạnh chốt ở Cổng Phạm vi 09/11: Yêu cầu là đầu ra ngang tin rao).
 * Khối chưa tách nhánh → chỉ tin rao như trước. */
export function readOf(c: { readable: number } & Pick<Branches, "inquiry">): number {
  return c.readable + (c.inquiry ?? 0)
}

/** Khối có tách nhánh bài: mọi nguồn có bài nhận đều mang đủ ba khoá là số. */
export function hasBranches(sources: SourceFlow[]): boolean {
  const live = sources.filter((s) => s.received > 0)
  const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v)
  return live.length > 0 && live.every((s) => isNum(s.imageMerged) && isNum(s.inquiry) && isNum(s.imageUnmerged))
}
