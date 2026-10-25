// o-kpi-chi-do-local.test.tsx — ON3 (ADR-0014): ô KPI ba trang Ops trên cloud đọc số máy local đẩy lên. Lược đồ «như cloud»
// (không source_registry, không review_queue) chỉ có ops_heartbeat; bản tin do push-ops-facts THẬT dựng trên lược đồ local
// tạm (pipeline/scripts/ops-facts-fixture.mjs) rồi đi qua handler POST /api/v1/ops/ingest THẬT. Dựng trang thật, đọc HTML.
// Tên ca mở đầu bằng mã AC (ON3-AC-n).
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import pg from "pg"

import type { User } from "../src/lib/auth"
import { captureOpsFacts, localDbUrl, mutantPush } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { dropOpsSchema, makeOpsSchema, schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { shiftPayload } from "../../scripts/ops-cloud-proto.mjs"

const S_CLOUD = `on3_cloud_${process.pid}`
const S_LOCAL = `on3_local_${process.pid}`
const LOCAL_ERR: Record<string, string> = {
  freshness: `on3_err_fr_${process.pid}`,
  records24h: `on3_err_rec_${process.pid}`,
  reviewQueue: `on3_err_rq_${process.pid}`,
}
const OMIT: Record<string, string[]> = { freshness: ["stg_chotot_ads"], records24h: ["airbnb_snapshots"], reviewQueue: ["review_queue"] }
process.env.DATABASE_URL = schemaUrl(S_CLOUD) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = "on3-thu"
const ADMIN: User = { id: "1", email: "ops-test@local.test", plan: "free", role: "admin" }
const RAW_LOCAL = ["source_registry", "review_queue", "airbnb_snapshots", "stg_zalo_posts", "stg_chotot_ads", "airdna_markets", "airdna_listings", "listings", "stg_abnb_listings", "sale_offers"]
/** Bảng đã đồng bộ lên máy chủ mà trang cloud đọc (ON5: «Luồng 7 ngày» đếm listing tươi trên `listings` — sync-cloud FILL). */
const CLOUD_SYNCED = ["listings"]

type Payload = Record<string, unknown> & { pushedAt: string; blocks: Record<string, Record<string, unknown>> }
const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
before(async () => {
  try {
    await admin.connect()
    await admin.query(`DROP SCHEMA IF EXISTS "${S_CLOUD}" CASCADE`)
    await admin.query(`CREATE SCHEMA "${S_CLOUD}"`)
    await admin.query(`CREATE TABLE "${S_CLOUD}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`)
    await admin.query(`CREATE TABLE "${S_CLOUD}".ops_audit (LIKE public.ops_audit INCLUDING ALL)`)
    for (const t of CLOUD_SYNCED) await admin.query(`CREATE TABLE "${S_CLOUD}".${t} (LIKE public.${t} INCLUDING ALL)`)
    await makeOpsSchema(admin, S_LOCAL)
    for (const [k, s] of Object.entries(LOCAL_ERR)) await makeOpsSchema(admin, s, { omit: OMIT[k] })
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  for (const s of [S_CLOUD, S_LOCAL, ...Object.values(LOCAL_ERR)]) await dropOpsSchema(admin, s).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end()
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

// ---- bên ghi thật → handler ingest thật ----
const push = async (schema = S_LOCAL, script?: string) => {
  const r = (await captureOpsFacts({ ...(script ? { script } : {}), env: { DATABASE_URL: schemaUrl(schema) } })) as { code: number; stderr: string; payload: Payload }
  assert.equal(r.code, 0, r.stderr.slice(0, 600))
  return r.payload
}
const ingest = async (payload: Payload) => {
  const { POST } = await import("../src/app/api/v1/ops/ingest/route")
  const res = await POST(new Request("http://x/api/v1/ops/ingest", { method: "POST", headers: { authorization: "Bearer on3-thu" }, body: JSON.stringify(payload) }))
  assert.equal(res.status, 200)
}
const clear = () => admin.query(`DELETE FROM "${S_CLOUD}".ops_heartbeat`)

// ---- dựng trang ----
async function html(el: unknown): Promise<string> {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { renderToStaticMarkup } = await import("react-dom/server")
  return renderToStaticMarkup(el as React.ReactElement)
}
const renderOps = async (file = "../src/app/ops/page") => html(await (await import(file)).default())
/** /ops/collections dựng bằng TRANG thật (mọi hàm tải dữ liệu chạy trên lược đồ đang nối). `cloud` bật nhánh Vercel
 * (`VERCEL=1`): các hàm local-bound đọc bản tin ops_heartbeat như trên cloud thật — factsPushedAt là `pushedAt` thật. */
async function renderCollections(pageFile = "../src/app/ops/collections/page", { cloud = true } = {}) {
  const prev = process.env.VERCEL
  if (cloud) process.env.VERCEL = "1"
  else delete process.env.VERCEL
  const { resetFactsCache } = await import("../src/lib/collections-queries")
  resetFactsCache()
  try {
    return await html(await (await import(pageFile)).default())
  } finally {
    if (prev === undefined) delete process.env.VERCEL
    else process.env.VERCEL = prev
    resetFactsCache()
  }
}
const renderReview = async () => html(await (await import("../src/components/ops/review-content")).ReviewContent({ user: ADMIN }))

// ---- đọc HTML ----
const localCount = (h: string) => (h.match(/chỉ (đo|có) ở (máy )?(local|thu)/gi) ?? []).length
const successBadges = (h: string) => (h.match(/bg-success\/10/g) ?? []).length
/** Mọi tô màu «đạt» (badge bg-success/10 lẫn đoạn thanh bg-success). */
const successTone = (h: string) => (h.match(/\bbg-success\b/g) ?? []).length
const zeroValues = (h: string) => (h.match(/text-2xl[^>]*>0</g) ?? []).length
/** Mọi giá trị text-2xl bắt đầu bằng chữ số: [lớp, giá trị]. */
const numericValues = (h: string) => [...h.matchAll(/class="([^"]*text-2xl[^"]*)"[^>]*>(\d[^<]*)</g)].map((m) => [m[1], m[2]] as const)
const alertTitles = (h: string) => [...h.matchAll(/data-slot="alert-title"[^>]*>([^<]*(?:<!-- -->[^<]*)*)</g)].map((m) => m[1].replace(/<!-- -->/g, ""))
/** Giá trị ô đầu tiên (text-2xl) trong một vùng. */
const kpiValue = (r: string) => r.match(/text-2xl[^>]*>([^<]*)</)?.[1]
const tileValue = (h: string, title: string) => h.match(new RegExp(`>${title}<[\\s\\S]*?text-2xl[^>]*>([^<]*)<`))?.[1]
const PART = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
const vnParts = (iso: string) => Object.fromEntries(PART.formatToParts(new Date(iso)).map((x) => [x.type, x.value]))
const vnTime = (iso: string) => {
  const p = vnParts(iso)
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} (GMT+7)`
}
const vnDate = (iso: string) => {
  const p = vnParts(iso)
  return `${p.year}-${p.month}-${p.day}`
}
const text = (h: string) => h.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")
/** HTML một ô: từ tiêu đề `from` tới tiêu đề ô kế `to` (ô cuối: tới mốc `to` bất kỳ sau nó). */
function region(h: string, from: string, to: string) {
  const i = h.indexOf(from)
  assert.ok(i >= 0, `không thấy «${from}» trong trang`)
  const j = h.indexOf(to, i + from.length)
  assert.ok(j > i, `không thấy «${to}» sau «${from}»`)
  return h.slice(i, j)
}
const OPS_TILES = [">Đạt SLO<", ">Quá hạn<", ">Chưa có snapshot<", ">Snapshot mới nhất<", ">Độ tươi theo nguồn<"]
const COL_TILES = [">Sức khoẻ nguồn<", ">Bản ghi 24h<", ">Cổng S03", ">Khoá an toàn<", ">Sức khoẻ nguồn<"] // mốc cuối: tiêu đề lưới nguồn ngay dưới hàng ô
const headings = (h: string) => [...h.matchAll(/role="heading"[^>]*>([^<]*)</g)].map((m) => m[1])
/** Trên cloud chỉ dựng vùng đọc bản tin: hàng ô số + lưới sức khoẻ nguồn + lưới khoá an toàn (ON23) + lưới job khi có bản
 * tin (khuôn đổi ở lượt 3, sổ d-16). */
const CLOUD_HEADINGS = ["Sức khoẻ nguồn", "Khoá an toàn &amp; hạ tầng thu", "Máy móc"]
const NO_CLOUD_VIEW = { rel: "src/components/ops/collections/collections-view.tsx", fn: (s: string) => s.replace("if (props.cloud) return <CloudCollections", "if (false) return <CloudCollections") }

/** Đạt SLO tính độc lập với bên đọc: nguồn đạt khi mọi hàng của nó tươi; mã có hàng chưa khai SLO không đếm. */
function expectSlo(rows: { code: string; status: string }[]) {
  const by = new Map<string, string[]>()
  for (const r of rows) by.set(r.code, [...(by.get(r.code) ?? []), r.status])
  const counted = [...by.values()].filter((st) => !st.includes("no-slo"))
  return { ok: counted.filter((st) => st.every((x) => x === "fresh")).length, total: counted.length }
}

let mutantSeq = 0
/** Chép một tệp nguồn của app cạnh bản thật qua `fn` (đột biến cho chiều đỏ), trả đường để import; xoá sau ca. */
function mutantApp(rel: string, fn: (s: string) => string) {
  const p = join(import.meta.dirname, "..", rel)
  const src = readFileSync(p, "utf8")
  const out = fn(src)
  assert.notEqual(out, src, `khuôn đột biến ${rel} không khớp mã nguồn`)
  // tên riêng mỗi lần: ESM giữ module theo đường dẫn, trùng tên thì lần sau nhận bản đột biến cũ
  const dst = p.replace(/\/([^/]+)\.tsx?$/, `/.on3-mut-${process.pid}-${++mutantSeq}-$1.tsx`)
  writeFileSync(dst, out)
  return { path: dst.replace(/\.tsx$/, ""), done: () => rmSync(dst, { force: true }) }
}
/** Đột biến một component rồi dựng trang thật trỏ vào bản đột biến: `chain` từ lá lên trang, mỗi mắt thay chỗ import
 * mắt dưới. Trả đường trang đột biến; `done()` xoá mọi bản chép. */
function mutantChain(leaf: { rel: string; fn: (s: string) => string }, parents: { rel: string; spec: string }[]) {
  const made = [mutantApp(leaf.rel, leaf.fn)]
  for (const { rel, spec } of parents) {
    const child = made[made.length - 1].path
    made.push(mutantApp(rel, (s) => s.replace(`"${spec}"`, JSON.stringify(child))))
  }
  return { path: made[made.length - 1].path, done: () => made.forEach((m) => m.done()) }
}
const COL_PAGE = { rel: "src/app/ops/collections/page.tsx", spec: "@/components/ops/collections/collections-view" }
const COL_VIEW_TILES = { rel: "src/components/ops/collections/collections-view.tsx", spec: "@/components/ops/collections/collections-tiles" }
const OPS_PAGE_TILES = { rel: "src/app/ops/page.tsx", spec: "@/components/ops/overview/overview-tiles" }

describe("ON3-AC-1 chưa có bản tin", () => {
  test("ON3-AC-1 không facts: mỗi trang đúng một chữ chỉ-local, 0 ô KPI số 0, 0 badge success, mọi ô KPI là «—»", async () => {
    ready()
    await clear()
    const PAGES: [string, () => Promise<string>, string][] = [
      ["/ops", () => renderOps(), "Chỉ đo ở máy thu"],
      ["/ops/collections", () => renderCollections(), "Chỉ đo ở máy thu"],
      ["/ops/review", renderReview, "Hàng duyệt chỉ có ở máy thu"],
    ]
    for (const [name, render, pinned] of PAGES) {
      const h = await render()
      assert.equal(localCount(h), 1, `${name}: chữ chỉ-local phải đúng một lần`)
      assert.ok(alertTitles(h).includes(pinned), `${name}: nguyên văn «${pinned}»`)
      const kpi = name === "/ops" ? region(h, OPS_TILES[0], OPS_TILES[4]) : name === "/ops/collections" ? region(h, COL_TILES[0], COL_TILES[4]) : h
      assert.equal(zeroValues(kpi), 0, `${name}: không ô KPI nào hiện số 0`)
      assert.equal(successBadges(kpi), 0, `${name}: không ô KPI nào có badge xanh`)
    }
    const ops = await renderOps()
    for (let i = 0; i < 4; i++) {
      const r = region(ops, OPS_TILES[i], OPS_TILES[i + 1])
      assert.equal(tileValue(r, OPS_TILES[i].slice(1, -1)), "—", `/ops ô ${OPS_TILES[i]} phải «—»`)
      assert.match(text(r), /Chưa có số/, `/ops ô ${OPS_TILES[i]} phải «Chưa có số»`)
    }
    const col = await renderCollections()
    for (let i = 0; i < 4; i++) assert.equal(kpiValue(region(col, COL_TILES[i], COL_TILES[i + 1])), "—", `/ops/collections ô ${COL_TILES[i]} phải «—»`)
    assert.match(text(await renderReview()), /— thẻ đang chờ/)
  })
  test("ON3-AC-1 bản sao còn «chỉ đo ở local» trong stats PageHeader và ô Quá hạn 0 kèm badge xanh → bắt", async () => {
    ready()
    await clear()
    const m = mutantApp("src/app/ops/page.tsx", (s) =>
      s.replace("unmeasured ? [] : [sloSummaryText(slo),", "[sloSummaryText(slo, true),").replace("unmeasured={unmeasured}", "unmeasured={false}"))
    try {
      const h = await renderOps(m.path)
      assert.equal(localCount(h), 2, "phép đếm phải thấy câu chỉ-local lặp ở đầu trang")
      assert.ok(zeroValues(h) > 0 && successBadges(h) > 0, "phép đo phải thấy ô 0 kèm badge xanh")
    } finally {
      m.done()
    }
  })
  test("ON3-AC-1 bản sao ô Cổng S03 hiện số khi chưa có bản tin → bắt", async () => {
    ready()
    await clear()
    const m = mutantChain(
      { rel: "src/components/ops/collections/collections-tiles.tsx", fn: (s) => s.replace('value={cloud && !cloud.funnelMeasured ? "—" : fmtInt(funnel.today.passed)}', "value={fmtInt(funnel.today.passed)}") },
      [COL_VIEW_TILES, COL_PAGE],
    )
    try {
      const h = await renderCollections(m.path)
      assert.notEqual(kpiValue(region(h, COL_TILES[2], COL_TILES[3])), "—", "phép đo phải thấy ô Cổng S03 có số")
    } finally {
      m.done()
    }
  })
})

describe("ON3-AC-2/AC-3 bản tin tươi", () => {
  test("ON3-AC-2 /ops facts tươi: bốn ô bằng số tính từ khối freshness, dòng «Số đo lúc … từ máy thu» đúng mốc đo theo giờ VN", async () => {
    ready()
    const p = await push()
    await ingest(p)
    const raw = p.blocks.freshness.rows as { code: string; status: string; last: string | null }[]
    const cov = raw.filter((r) => r.status !== "no-slo")
    const slo = expectSlo(raw)
    assert.ok(slo.total > 0 && cov.length > 0, "fixture phải có nguồn khai SLO")
    const newest = cov.map((r) => r.last).filter((x): x is string => !!x).sort((a, b) => Date.parse(b) - Date.parse(a))[0]
    assert.ok(newest, "fixture phải có snapshot")
    const h = await renderOps()
    const tile = (i: number) => text(region(h, OPS_TILES[i], OPS_TILES[i + 1]))
    assert.match(tile(0), new RegExp(`Đạt SLO [^\\d]*${slo.ok} / ${slo.total} nguồn`), "ô Đạt SLO = x / y nguồn của khối freshness")
    assert.equal(tileValue(h, "Quá hạn"), String(cov.filter((r) => r.status === "stale").length))
    assert.equal(tileValue(h, "Chưa có snapshot"), String(cov.filter((r) => r.status === "none").length))
    assert.equal(tileValue(h, "Snapshot mới nhất"), vnDate(newest), "ô Snapshot mới nhất = ngày VN của snapshot mới nhất")
    assert.match(text(h), new RegExp(`Số đo lúc ${vnTime(p.pushedAt).replace(/[()+]/g, "\\$&")} từ máy thu`))
    assert.equal(localCount(h), 0, "có số thì không còn chữ chỉ-local")
  })
  test("ON3-AC-2 bản sao ô Đạt SLO hiện tổng thay số đạt → bắt", async () => {
    ready()
    const p = await push()
    await ingest(p)
    const slo = expectSlo(p.blocks.freshness.rows as { code: string; status: string }[])
    assert.notEqual(slo.ok, slo.total, "fixture phải có nguồn không đạt để chiều đỏ phân biệt")
    const m = mutantChain({ rel: "src/components/ops/overview/overview-tiles.tsx", fn: (s) => s.replace("<KpiValue value={fmtInt(summary.ok)}", "<KpiValue value={fmtInt(summary.total)}") }, [OPS_PAGE_TILES])
    try {
      const h = await renderOps(m.path)
      assert.doesNotMatch(text(region(h, OPS_TILES[0], OPS_TILES[1])), new RegExp(`${slo.ok} / ${slo.total} nguồn`))
    } finally {
      m.done()
    }
  })
  test("ON3-AC-2 bản sao lệch giờ VN → bắt", async () => {
    ready()
    const m = mutantApp("src/components/ops/facts-status.tsx", (s) => s.replaceAll("fmtVnDateTime(measuredAt)", 'String(measuredAt).slice(0, 16).replace("T", " ") + " (GMT+7)"'))
    try {
      const { FactsStamp } = await import(m.path)
      const at = "2026-10-24T12:13:00.000Z"
      const h = await html(FactsStamp({ state: "fresh", measuredAt: at }))
      assert.ok(!text(h).includes(vnTime(at)), "phép đo phải thấy mốc giờ không theo giờ VN")
    } finally {
      m.done()
    }
  })
  test("ON3-AC-3 /ops/collections facts tươi: Bản ghi 24h = tổng records24h, Sức khoẻ nguồn = x/y freshness, dòng mốc đo, ô Khoá an toàn theo khối lockdown (ON23)", async () => {
    ready()
    const p = await push()
    await ingest(p)
    const want = (p.blocks.records24h.bySource as { n: number }[]).reduce((a, r) => a + r.n, 0)
    assert.ok(want > 0, "fixture phải có bản ghi trong 24 giờ")
    const slo = expectSlo(p.blocks.freshness.rows as { code: string; status: string }[])
    const h = await renderCollections()
    assert.equal(tileValue(h, "Bản ghi 24h"), String(want))
    assert.match(text(region(h, COL_TILES[0], COL_TILES[1])), new RegExp(`Sức khoẻ nguồn \\D*${slo.ok} ?/ ?${slo.total}\\b`), "ô Sức khoẻ nguồn = x/y")
    assert.ok(h.includes("data-facts-stamp"), "dòng mốc đo")
    // ON3 Hỏi-1 = A giữ ô «—» «tới khi ON23 đọc khối lockdown»; từ ON23 ô = số lớp Ổn của khối (phép đo đầy đủ ở
    // lockdown-cloud-theo-facts.test.tsx).
    const layersOk = (p.blocks.lockdown.layers as { ok: boolean | null }[]).filter((l) => l.ok === true).length
    assert.equal(tileValue(h, "Khoá an toàn"), String(layersOk))
  })
  test("ON3-AC-3 bản sao Bản ghi 24h đọc 0 → bắt", async () => {
    ready()
    const p = await push()
    await ingest(p)
    const m = mutantChain({ rel: "src/components/ops/collections/collections-view.tsx", fn: (s) => s.replace("cloud.records24h.reduce((a, r) => a + r.n, 0)", "0") }, [COL_PAGE])
    try {
      const want = (p.blocks.records24h.bySource as { n: number }[]).reduce((a, r) => a + r.n, 0)
      assert.notEqual(tileValue(await renderCollections(m.path), "Bản ghi 24h"), String(want))
    } finally {
      m.done()
    }
  })
})

describe("ON3-AC-4 bản tin cũ", () => {
  const staleTitles = (h: string) => alertTitles(h).filter((t) => t.startsWith("Máy thu không đẩy số từ"))
  test("ON3-AC-4 bản tin thật qua handler ingest thật, mốc lùi 46′: mỗi trang đúng một Alert, mọi số mờ, không tô màu đạt, không câu trấn an, không còn cảnh báo 30′ cũ", async () => {
    ready()
    const p = shiftPayload(await push(), -46) as Payload
    await ingest(p)
    const ops = await renderOps()
    const col = await renderCollections()
    const rev = await renderReview()
    for (const [name, h] of [["/ops", ops], ["/ops/collections", col], ["/ops/review", rev]] as const) {
      assert.deepEqual(staleTitles(h), [`Máy thu không đẩy số từ ${vnTime(p.pushedAt)}`], `${name}: một Alert số cũ`)
      assert.equal(successBadges(h), 0, `${name}: không badge xanh`)
      assert.ok(!h.includes("Máy thu có thể mất kết nối"), `${name}: cảnh báo 30′ cũ phải bỏ`)
    }
    for (const [name, r] of [["/ops ô KPI", region(ops, OPS_TILES[0], OPS_TILES[4])], ["/ops/collections ô KPI", region(col, COL_TILES[0], COL_TILES[4])]] as const) {
      const nums = numericValues(r)
      assert.ok(nums.length >= 3, `${name}: phải có số để xét mờ (${nums.length})`)
      assert.deepEqual(nums.filter(([cls]) => !cls.includes("text-muted-foreground")).map(([, v]) => v), [], `${name}: mọi số phải mờ`)
      assert.equal(successTone(r), 0, `${name}: không tô màu đạt (badge hay thanh)`)
    }
    assert.doesNotMatch(text(ops), /Mọi nguồn có snapshot đều trong hạn|Mọi nguồn đã có snapshot(?! ở)/, "/ops: không câu trấn an trên số cũ")
    assert.match(rev, /data-pending-total="\d+"><span class="[^"]*text-muted-foreground/, "/ops/review: số thẻ chờ mờ")
  })
  test("ON3-AC-4 bản tin 31′ và 44′ → không Alert số cũ, không cảnh báo «Máy thu có thể mất kết nối»", async () => {
    ready()
    for (const min of [31, 44]) {
      await ingest(shiftPayload(await push(), -min) as Payload)
      for (const h of [await renderOps(), await renderCollections()]) {
        assert.deepEqual(staleTitles(h), [], `${min}′: không Alert số cũ`)
        assert.ok(!h.includes("Máy thu có thể mất kết nối"), `${min}′: không cảnh báo 30′ cũ`)
      }
    }
  })
  test("ON3-AC-4 bản sao còn ngưỡng 30′ trên cloud → bắt", async () => {
    ready()
    await ingest(shiftPayload(await push(), -31) as Payload)
    const m = mutantChain(NO_CLOUD_VIEW, [COL_PAGE])
    try {
      assert.ok((await renderCollections(m.path)).includes("Máy thu có thể mất kết nối"), "phép đo phải thấy cảnh báo 30′ cũ")
    } finally {
      m.done()
    }
  })
  test("ON3-AC-4 bản sao thanh phân đoạn giữ màu đạt khi số cũ → bắt", async () => {
    ready()
    await ingest(shiftPayload(await push(), -46) as Payload)
    const m = mutantChain(
      { rel: "src/components/ops/collections/collections-tiles.tsx", fn: (s) => s.replace('const tone = (t: string) => (muted ? "bg-muted-foreground/40" : t)', "const tone = (t: string) => t") },
      [COL_VIEW_TILES, COL_PAGE],
    )
    try {
      assert.ok(successTone(region(await renderCollections(m.path), COL_TILES[0], COL_TILES[4])) > 0, "phép đo phải thấy màu đạt trên số cũ")
    } finally {
      m.done()
    }
  })
})

describe("ON3-AC-4 vùng đo trên máy thu không dựng trên cloud", () => {
  const STATES: [string, () => Promise<unknown>][] = [
    ["chưa có bản tin", () => clear()],
    ["tươi", async () => ingest(await push())],
    ["cũ 46′", async () => ingest(shiftPayload(await push(), -46) as Payload)],
  ]
  test("ON3-AC-4 ba trạng thái: /ops/collections chỉ có hàng ô số + lưới nguồn + lưới khoá an toàn, một Alert «Phần còn lại…», nút ô luồng / nhóm S03 trỏ #tren-may-thu, không «ổn» / «tươi» nào của vùng không đo", async () => {
    ready()
    for (const [name, set] of STATES) {
      await set()
      const h = await renderCollections()
      // ON5 (luong-7-ngay-dung-so): bảng «Luồng 7 ngày qua» dựng trên cloud khi đã có bản tin (khối luong7), như lưới job.
      const choPhep = name === "chưa có bản tin" ? CLOUD_HEADINGS : [...CLOUD_HEADINGS, "Luồng 7 ngày qua"]
      assert.deepEqual(headings(h).filter((x) => !choPhep.includes(x)), [], `${name}: vùng ngoài bản tin không được dựng`)
      assert.equal(headings(h).includes("Luồng 7 ngày qua"), name !== "chưa có bản tin", `${name}: bảng luồng chỉ khi có bản tin`)
      assert.equal(headings(h).includes("Máy móc"), name !== "chưa có bản tin", `${name}: lưới job chỉ khi có bản tin`)
      assert.equal(alertTitles(h).filter((t) => t === "Phần còn lại của trang chưa có số trên máy chủ").length, 1, `${name}: một Alert gom vùng trên máy thu`)
      assert.equal(localCount(h), name === "chưa có bản tin" ? 1 : 0, `${name}: chữ chỉ-local đúng số lần`)
      // «Hỏng» nay là nhãn tab của lưới khoá an toàn đọc khối (ON23) — không còn là trạng thái giả của vùng không đo.
      assert.doesNotMatch(text(h), /Mọi thứ ổn|đều tươi|Kênh kết nối|Hoạt động/, `${name}: không trạng thái giả của vùng không đo`)
      const hrefs = [...region(h, COL_TILES[1], COL_TILES[3]).matchAll(/href="(#[^"]+)"/g)].map((m) => m[1])
      // ON5: khi đã có bản tin, nút ô luồng trỏ bảng #luong; nhóm S03 vẫn trỏ Alert.
      const luong = name === "chưa có bản tin" ? "#tren-may-thu" : "#luong"
      assert.ok(hrefs.length >= 2 && hrefs.includes(luong) && hrefs.filter((x) => x !== luong).every((x) => x === "#tren-may-thu"), `${name}: nút ô luồng trỏ ${luong}, nhóm S03 trỏ Alert (${hrefs.join(", ")})`)
      if (luong === "#luong") assert.ok(h.includes('id="luong"'), `${name}: đích #luong có mặt`)
      assert.ok(region(h, COL_TILES[3], COL_TILES[4]).includes('href="#lockdown"'), `${name}: nút ô khoá an toàn trỏ lưới khoá an toàn (ON23)`)
      assert.ok(h.includes('id="tren-may-thu"'), `${name}: đích của nút có mặt`)
    }
  })
  test("ON3-AC-4 bản sao dựng bố cục máy local trên cloud → bắt", async () => {
    ready()
    await ingest(shiftPayload(await push(), -46) as Payload)
    const m = mutantChain(NO_CLOUD_VIEW, [COL_PAGE])
    try {
      const h = await renderCollections(m.path)
      assert.ok(headings(h).some((x) => !CLOUD_HEADINGS.includes(x)), "phép đo phải thấy vùng ngoài bản tin")
      assert.ok(!alertTitles(h).includes("Phần còn lại của trang chưa có số trên máy chủ"), "bản sao không có Alert gom")
    } finally {
      m.done()
    }
  })
})

describe("ON3-AC-5 thẻ chờ duyệt", () => {
  const counts = async () => {
    const { rows } = await admin.query(`SELECT item_type AS type, count(*)::int AS n FROM "${S_LOCAL}".review_queue WHERE status = 'pending' GROUP BY 1 ORDER BY 1`)
    return { total: rows.reduce((a: number, r: { n: number }) => a + r.n, 0), byType: rows as { type: string; n: number }[] }
  }
  const shown = (h: string) => ({
    total: h.match(/data-pending-total="(\d*)"/)?.[1],
    byType: [...h.matchAll(/data-pending-type="([^"]+)"[^>]*>([\s\S]*?)<\/span>/g)].map((m) => [m[1], text(m[2]).trim()]),
  })
  test("ON3-AC-5 /ops/review cloud: «N thẻ đang chờ» = phép đếm SQL pending, từng loại = đếm theo item_type, một chỗ chữ chỉ-local", async () => {
    ready()
    const want = await counts()
    assert.ok(want.byType.length >= 2, "fixture phải có ≥ 2 loại thẻ")
    await ingest(await push())
    const h = await renderReview()
    const got = shown(h)
    assert.equal(got.total, String(want.total))
    assert.deepEqual(got.byType, want.byType.map((t) => [t.type, `${t.type}: ${t.n}`]))
    assert.equal(localCount(h), 1)
  })
  test("ON3-AC-5 bản sao bên ghi đổi khuôn byType → bắt", async () => {
    ready()
    const f = mutantPush("rq-khuon.mjs", (s: string) =>
      s.replace("measure(() => readReviewQueue(client))", "measure(async () => { const r = await readReviewQueue(client); return { ...r, byType: r.byType.map((x) => ({ type: x.type, count: x.n })) }; })"))
    await ingest(await push(S_LOCAL, f))
    const want = await counts()
    assert.notDeepEqual(shown(await renderReview()).byType, want.byType.map((t) => [t.type, `${t.type}: ${t.n}`]))
  })
})

describe("ON3-AC-6 khối lỗi do bên ghi thật", () => {
  // [khối, trang, HTML của đúng các ô đọc khối ấy] — ô khác của trang đọc khối khác nên không xét
  const CASES: [string, string, () => Promise<string>, (h: string) => string[]][] = [
    ["freshness", "/ops", () => renderOps(), (h) => [0, 1, 2, 3].map((i) => region(h, OPS_TILES[i], OPS_TILES[i + 1]))],
    ["freshness", "/ops/collections", () => renderCollections(), (h) => [region(h, COL_TILES[0], COL_TILES[1])]],
    ["records24h", "/ops/collections", () => renderCollections(), (h) => [region(h, COL_TILES[1], COL_TILES[2])]],
    ["reviewQueue", "/ops/review", renderReview, (h) => [region(h, "data-pending-total", "thẻ đang chờ")]],
  ]
  test("ON3-AC-6 ma trận khối lỗi (freshness ở /ops và /ops/collections, records24h, reviewQueue) → ô «—» + «Chưa có số», 0 số 0, 0 badge success", async () => {
    ready()
    for (const [block, page, render, cells] of CASES) {
      const p = await push(LOCAL_ERR[block])
      assert.match(String(p.blocks[block].error ?? ""), /^không đo được/, `${block}: bên ghi phải ghi lỗi`)
      await ingest(p)
      const h = await render()
      for (const c of cells(h)) {
        assert.match(text(c), /—/, `${block} ${page}: ô của khối lỗi phải «—»`)
        if (block !== "reviewQueue") assert.match(text(c), /Chưa có số/, `${block} ${page}: ô của khối lỗi phải «Chưa có số»`)
        assert.equal(zeroValues(c), 0, `${block} ${page}: ô của khối lỗi không số 0`)
        assert.equal(successTone(c), 0, `${block} ${page}: ô của khối lỗi không tô màu đạt`)
      }
    }
  })
  test("ON3-AC-6 bản sao ô Bản ghi 24h hiện 0 khi khối lỗi → phép đo trên đúng ô ấy bắt", async () => {
    ready()
    await ingest(await push(LOCAL_ERR.records24h))
    const m = mutantChain(
      { rel: "src/components/ops/collections/collections-tiles.tsx", fn: (s) => s.replace('value={items24h === null ? "—" : fmtInt(items24h)}', "value={fmtInt(items24h ?? 0)}") },
      [COL_VIEW_TILES, COL_PAGE],
    )
    try {
      assert.ok(zeroValues(region(await renderCollections(m.path), COL_TILES[1], COL_TILES[2])) > 0, "phép đo phải thấy số 0 trong ô")
    } finally {
      m.done()
    }
  })
})

describe("ON3-AC-7 máy local", () => {
  test("ON3-AC-7 DB local đủ bảng: ba trang không dòng mốc đo, không Alert số cũ, không truy vấn ops_heartbeat", async () => {
    ready()
    for (const t of RAW_LOCAL.filter((x) => !CLOUD_SYNCED.includes(x))) await admin.query(`CREATE TABLE "${S_CLOUD}".${t} (LIKE public.${t} INCLUDING ALL)`)
    const { pool } = await import("../src/lib/db")
    const seen: string[] = []
    const orig = pool.query.bind(pool)
    ;(pool as unknown as { query: unknown }).query = (sql: unknown, ...rest: unknown[]) => {
      seen.push(String(typeof sql === "string" ? sql : (sql as { text?: string })?.text ?? ""))
      return (orig as (...a: unknown[]) => unknown)(sql, ...rest)
    }
    try {
      for (const h of [await renderOps(), await renderCollections(undefined, { cloud: false }), await renderReview()]) {
        assert.ok(!h.includes("data-facts-stamp"), "ở local không có dòng mốc đo")
        assert.ok(!h.includes("data-facts-stale"), "ở local không có Alert số cũ")
      }
      assert.deepEqual(seen.filter((q) => q.includes("ops_heartbeat")), [], "ở local không đọc ops_heartbeat")
    } finally {
      ;(pool as unknown as { query: unknown }).query = orig
      for (const t of RAW_LOCAL.filter((x) => !CLOUD_SYNCED.includes(x))) await admin.query(`DROP TABLE IF EXISTS "${S_CLOUD}".${t}`)
    }
  })
})
