// ops-html.ts — tiện ích cho các phép đo HTML của ON7 `ops-nhan-ma-nguon` (không phải tệp test).

/** Phần người đọc được của HTML (hợp đồng AC-1): chữ (bỏ <style>/<script>) + giá trị title/aria-label/href/alt/placeholder.
 *  Thuộc tính kỹ thuật (data-col-id, biến CSS của biểu đồ) mang khoá trường — định danh, không hiện. */
export function readable(html: string): string[] {
  const body = html.replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<script[\s\S]*?<\/script>/g, " ")
  const attrs = [...body.matchAll(/\s(?:title|aria-label|href|alt|placeholder)="([^"]*)"/g)].map((m) => m[1])
  const text = body.replace(/<[^>]*>/g, "\n").split("\n").map((t) => t.trim()).filter(Boolean)
  return [...text, ...attrs].map((t) => t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'"))
}
