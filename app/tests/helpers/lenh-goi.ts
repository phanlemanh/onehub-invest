// Đồ dùng chung cho ca thử đường lệnh của TV4b (tam-dung-nguon*.test.tsx): dựng Request, đọc Response, bản chép tạm
// một tệp nguồn với đúng một chỗ thay (đối chứng đỏ). Cùng khuôn với so-lenh.test.tsx của TV4.
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

export type Goi = { cookie?: string; auth?: string; body?: unknown }

export const yeuCau = (url: string, method: string, o: Goi) =>
  new Request(`http://localhost${url}`, {
    method,
    headers: {
      ...(o.cookie ? { cookie: o.cookie } : {}),
      ...(o.auth ? { authorization: o.auth } : {}),
      "content-type": "application/json",
    },
    ...(o.body !== undefined ? { body: JSON.stringify(o.body) } : {}),
  })

export const doc = async (res: Response) => ({
  status: res.status,
  body: (await res.json().catch(() => null)) as Record<string, unknown>,
})

/** Bản chép tạm cùng thư mục (alias @/ và import tương đối còn đúng), tên ẩn, đúng một chỗ thay; xoá sau khi dùng. */
export async function banSao<T>(tep: string, tu: string, thanh: string, dung: (duong: string) => Promise<T>): Promise<T> {
  const goc = readFileSync(tep, "utf8")
  assert.equal(goc.split(tu).length, 2, `không thấy đúng một chỗ «${tu}» trong ${tep}`)
  const dot = join(dirname(tep), `.dot-${process.pid}-${Math.random().toString(36).slice(2)}.ts`)
  writeFileSync(dot, goc.replace(tu, thanh))
  try {
    return await dung(dot)
  } finally {
    rmSync(dot, { force: true })
  }
}
