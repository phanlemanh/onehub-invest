// ops-collections-api-cloud.test.tsx — GET /api/v1/ops/collections trên cloud không đọc bảng chỉ có ở máy thu (audit-all 07/11:
// prod trả 500 vì «Luồng N ngày» đọc stg S03 mà bảng stg trên cloud không đồng bộ lược đồ). Ghi lại mọi câu SQL qua pool rồi soi.
import { test } from "node:test"
import assert from "node:assert/strict"

import { pool } from "../src/lib/db"
import { docThuThap } from "../src/lib/collections-api"
import { resetFactsCache } from "../src/lib/collections-queries"

const BANG_MAY_THU = /\b(stg_\w+|airbnb_snapshots)\b/

async function ghiCau(fn: () => Promise<unknown>): Promise<string[]> {
  const cau: string[] = []
  const goc = pool.query.bind(pool)
  ;(pool as unknown as { query: unknown }).query = (q: unknown, ...rest: unknown[]) => {
    cau.push(typeof q === "string" ? q : String((q as { text?: string })?.text ?? ""))
    return (goc as (...a: unknown[]) => unknown)(q, ...rest)
  }
  try {
    await fn()
  } finally {
    ;(pool as unknown as { query: unknown }).query = goc
  }
  return cau
}

test("ops/collections trên cloud: «Luồng N ngày» dựng từ bản tin, không câu nào đọc bảng stg hay airbnb_snapshots", async () => {
  let kq: Awaited<ReturnType<typeof docThuThap>> | undefined
  // Trên Vercel các hàm khác của route rẽ sang bản tin theo VERCEL=1 (collections-queries isCloud); ca này dựng đúng môi trường đó.
  const cu = process.env.VERCEL
  process.env.VERCEL = "1"
  resetFactsCache()
  let cau: string[]
  try {
    cau = await ghiCau(async () => { kq = await docThuThap(3, { laCloud: true }) })
  } finally {
    if (cu === undefined) delete process.env.VERCEL
    else process.env.VERCEL = cu
    resetFactsCache()
  }
  assert.deepEqual(cau.filter((q) => BANG_MAY_THU.test(q)).map((q) => q.replace(/\s+/g, " ").slice(0, 90)), [], "cloud không được đọc bảng chỉ có ở máy thu")
  assert.ok(Array.isArray(kq?.flow), "flow vẫn là mảng")
  assert.ok(kq!.flow.length === 0 || kq!.flow.length === 3, "flow rỗng (chưa có bản tin) hoặc đủ số ngày hỏi")
})

test("ops/collections ở máy thu: vẫn đếm thẳng bảng thô (đối chứng dương của phép soi)", async () => {
  const cau = await ghiCau(() => docThuThap(3, { laCloud: false }))
  assert.ok(cau.some((q) => BANG_MAY_THU.test(q)), "máy thu phải đọc bảng thô — phép soi trên không mù")
})
