// ops-review-sources-cloud.test.tsx — audit prod 24/10 OPS-1/OPS-2: /ops/review và /ops/sources 500 trên cloud vì
// review_queue / source_registry vắng (tầng A, leak gate). Lược đồ tạm trong DB local VẮNG HẲN các bảng đó (như cloud):
// render trọn nội dung hai trang (sau bước kiểm quyền) — không lỗi, mỗi trang đúng một thông báo có tên. Đối chứng: có bảng
// (rỗng) thì không hiện thông báo, trang chạy đường cũ. Tên ca mở đầu bằng mã AC (RS-AC-n).
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import pg from "pg"

import type { User } from "../src/lib/auth"

const SCHEMA = `ops_rs_cloud_test_${process.pid}`
const BASE_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
// Pool của app (src/lib/db.ts) đọc DATABASE_URL lúc import — đặt TRƯỚC mọi import động bên dưới.
{
  const u = new URL(BASE_URL)
  u.searchParams.set("options", `-c search_path=${SCHEMA}`)
  process.env.DATABASE_URL = u.toString()
}
const ADMIN: User = { id: "1", email: "ops-test@local.test", plan: "free", role: "admin" }
const REVIEW_TITLE = "Hàng chờ duyệt chỉ có ở máy local"
const SOURCES_TITLE = "Nguồn dữ liệu chỉ quản trị ở máy local"

const admin = new pg.Client({ connectionString: BASE_URL })
let dbErr: string | null = null
before(async () => {
  try {
    await admin.connect()
    await admin.query(`CREATE SCHEMA "${SCHEMA}"`) // rỗng: không bảng nào — như cloud
  } catch (e) {
    dbErr = (e as Error).message
  }
})
after(async () => {
  await admin.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end()
})
const needDb = () => assert.equal(dbErr, null, `DB local :5433 không tới được — eval đòi chạy thật: ${dbErr}`)

async function html(el: unknown): Promise<string> {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { renderToStaticMarkup } = await import("react-dom/server")
  // Bảng nguồn / nhóm thu dùng useRouter — router giả như tests/review-card.test.tsx.
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  const noop = () => {}
  const router = { push: noop, replace: noop, refresh: noop, back: noop, forward: noop, prefetch: noop }
  return renderToStaticMarkup(React.createElement(AppRouterContext.Provider, { value: router as never }, el as React.ReactElement))
}
async function renderReview(): Promise<string> {
  const { ReviewContent } = await import("../src/components/ops/review-content")
  return html(await ReviewContent({ user: ADMIN }))
}
async function renderSources(): Promise<string> {
  const { SourcesContent } = await import("../src/components/ops/sources/sources-content")
  return html(await SourcesContent())
}
const alertTitles = (h: string) => [...h.matchAll(/data-slot="alert-title"[^>]*>([^<]*)</g)].map((m) => m[1])

describe("/ops/review và /ops/sources trên cloud không có bảng tầng A (audit OPS-1/OPS-2)", () => {
  test("RS-AC-1 lược đồ vắng review_queue → /ops/review render, đúng một thông báo «Hàng chờ duyệt chỉ có ở máy local»", async () => {
    needDb()
    const { rows } = await admin.query(`SELECT count(*)::int n FROM information_schema.tables WHERE table_schema = $1`, [SCHEMA])
    assert.equal(rows[0].n, 0, "tiền đề: lược đồ không có bảng nào, như cloud")
    const h = await renderReview()
    assert.deepEqual(alertTitles(h), [REVIEW_TITLE])
  })

  test("RS-AC-2 lược đồ vắng source_registry → /ops/sources render, đúng một thông báo «Nguồn dữ liệu chỉ quản trị ở máy local», không bảng giải mã", async () => {
    needDb()
    const h = await renderSources()
    assert.deepEqual(alertTitles(h), [SOURCES_TITLE])
    assert.ok(!/\d+ mã nguồn/.test(h), "không được hiện số mã nguồn khi không có bảng")
  })

  test("RS-AC-3 đối chứng: có review_queue + source_registry (bảng rỗng) → không thông báo, trang chạy đường cũ", async () => {
    needDb()
    for (const t of ["review_queue", "source_registry"]) await admin.query(`CREATE TABLE "${SCHEMA}".${t} (LIKE public.${t} INCLUDING ALL)`)
    try {
      const [review, sources] = [await renderReview(), await renderSources()]
      assert.deepEqual(alertTitles(review), [])
      assert.ok(review.includes("Queue trống"), "hàng chờ rỗng hiện trạng thái trống như cũ")
      assert.deepEqual(alertTitles(sources), [])
      assert.ok(sources.includes("0 mã nguồn"), "trang Nguồn dữ liệu chạy truy vấn registry như cũ")
    } finally {
      for (const t of ["review_queue", "source_registry"]) await admin.query(`DROP TABLE IF EXISTS "${SCHEMA}".${t}`)
    }
  })
})
