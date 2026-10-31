// anh-goc-doi-chieu.test.tsx — hồ sơ _acceptance/anh-goc-qua-may-chu AC-7: đối chiếu trên DB máy thu thật (chỉ đọc, READ ONLY,
// không gọi mạng). Dải ảnh thẻ của một tin S06 dựng cho vai Vận hành không chứa tên máy nào của các media_url của tin; khuôn
// khoá và giao thức của toàn bảng media đúng như thiết kế đo. Chỉ in số đếm — không in tên máy hay URL (tầng A).
import { test } from "node:test"
import assert from "node:assert/strict"
import pg from "pg"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"

const OPS = { id: "agm-dc", email: "agm-dc@local.test", plan: "free" as const, role: "ops" as const }

test("AGM-DC dải ảnh S06 cho vai ops không chứa tên máy gốc; khoá 32 hex và URL https trên toàn bảng media", async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có bảng media thật — CI chỉ có lược đồ")
  const db = new pg.Client({ connectionString: localDbUrl() })
  await db.connect()
  try {
    await db.query("BEGIN READ ONLY")
    const { loadReviewMedia } = await import("../src/lib/ops/review-media")
    const { ReviewPhotos } = await import("../src/components/ops/review-photos")

    const { rows: chon } = await db.query<{ offer: string }>(
      `SELECT resource_record_key AS offer FROM media
        WHERE originating_system_name = 'S06' AND local_file IS NULL AND media_url IS NOT NULL
        ORDER BY resource_record_key LIMIT 1`,
    )
    assert.equal(chon.length, 1, "không có tin S06 nào có dòng media — phép đo không đo được")
    const offer = chon[0].offer
    const { rows: urls } = await db.query<{ media_url: string }>(
      "SELECT media_url FROM media WHERE resource_record_key = $1 AND media_url IS NOT NULL",
      [offer],
    )
    const hosts = [...new Set(urls.map((r) => new URL(r.media_url).hostname))]
    assert.ok(hosts.length >= 1)

    const the = [{ id: 1, item_type: "agent_output", evidence: { offer_id: offer } }]
    const media = await loadReviewMedia(the, OPS, (text, values) => db.query(text, values))
    const anh = media[1]?.offer ?? []
    const proxy = anh.filter((i) => i.origin === "proxy").length
    assert.ok(proxy >= 1, `vai ops phải nhận ≥ 1 ảnh proxy (nhận ${proxy})`)

    const html = renderToStaticMarkup(createElement(ReviewPhotos, { label: "Tin", images: anh, chiGoc: media[1]?.chiGoc?.offer }))
    const lot = hosts.filter((h) => html.includes(h)).length
    // Đối chứng dương: chuỗi media_url thô ghép lại thì bộ quét bắt được tên máy.
    const doiChung = hosts.filter((h) => urls.map((r) => r.media_url).join(" ").includes(h)).length
    console.log(`AGM-DC: ảnh proxy ${proxy}, tên máy của tin ${hosts.length}, lọt vào HTML ${lot}, đối chứng dương bắt ${doiChung}`)
    assert.equal(lot, 0, "HTML dải ảnh chứa tên máy gốc")
    assert.ok(doiChung >= 1, "đối chứng dương: bộ quét không bắt được tên máy trong URL thô")

    const { rows: dem } = await db.query<{ khoa_sai: number; khong_https: number }>(
      `SELECT count(*) FILTER (WHERE media_key !~ '^[0-9a-f]{32}$')::int AS khoa_sai,
              count(*) FILTER (WHERE media_url IS NOT NULL AND media_url !~ '^https://')::int AS khong_https
         FROM media WHERE originating_system_name IN ('S03', 'S05', 'S06')`,
    )
    console.log(`AGM-DC: khoá ngoài khuôn ${dem[0].khoa_sai}, media_url không https ${dem[0].khong_https}`)
    assert.equal(dem[0].khoa_sai, 0, "có media_key ngoài khuôn 32 hex")
    assert.equal(dem[0].khong_https, 0, "có media_url không phải https")
  } finally {
    await db.query("ROLLBACK").catch(() => {})
    await db.end()
  }
})
