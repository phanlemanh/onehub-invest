import type { Nhan } from "@/lib/ops-labels"

/** Nhãn tiếng Việt của một giá trị thô; giá trị chưa có nhãn hiện «Giá trị khác» KÈM mã gốc trong `<code>` để người đọc
 *  vẫn thấy giá trị thật (ON12, lib/ops-labels). */
export function RawLabel({ n, raw }: { n: Nhan; raw: string }) {
  return (
    <>
      {n.label}
      {n.known ? null : (
        <>
          {" "}
          <code translate="no" className="font-mono">
            {raw}
          </code>
        </>
      )}
    </>
  )
}
