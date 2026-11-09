// data-flow-bai-chi-anh.test.tsx — hồ sơ _acceptance/bai-nhan-tru-bai-chi-anh (DF6): chặng «Bài nhận → Đọc được» của S03
// tính trên bài cần đọc (bài nhận trừ ảnh đã ghép vào tin), «Đọc được» = đọc thành tin rao + đọc thành Yêu cầu (Mạnh chốt
// ở Cổng Phạm vi 09/11). Tên ca mở đầu bằng mã AC (DF6-AC-n).
// Lược đồ tạm `df6_*_<pid>` trên DB local: fixture dòng chảy dùng chung (tests/ops-dong-chay-fixture.ts) + bài S03 của DF6
// (chữ, người gửi, nhóm) + migration 051 THẬT; làm tươi bằng bộ chạy THẬT `chayLamTuoi` (pipeline/refresh-data-flow.mjs —
// cùng đường CLI của cloud-sync) → nhánh bài tính bằng baiAnhCuaTin, parsePost, laYeuCau THẬT → 600 THẬT. Mỗi phép đo có
// chiều đỏ trên CÙNG fixture: bản chép tạm của tệp nguồn đổi đúng một chỗ, thông điệp ghim.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { JSDOM } from "jsdom"
import pg from "pg"
import type { ReactNode } from "react"

import { captureOpsFacts, localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { makeOpsSchema, schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { IN, NOW, OFFERS, ROOT, flowSql, inSchema, makeFlowSchema, vn, type Offer } from "./ops-dong-chay-fixture"

const P = process.pid
const S = `df6_main_${P}` // máy thu: fixture + bài DF6, làm tươi qua bộ chạy
const S_MUT = `df6_mut_${P}` // làm tươi bằng bản đột biến (dựng lại mỗi ca đỏ)
const S_LOCAL = `df6_local_${P}` // máy thu có bảng bản tin — nguồn của khối cloud
const S_CLOUD = `df6_cloud_${P}` // máy chủ: không stg_*, chỉ khối bản tin
const SCHEMAS = [S, S_MUT, S_LOCAL, S_CLOUD]
process.env.DATABASE_URL = schemaUrl(S_CLOUD) // pool của app = máy chủ — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = "df6-thu"
delete process.env.VERCEL
const WINDOWS = ["7d", "30d", "all"] as const
type W = (typeof WINDOWS)[number]
const APP = path.join(ROOT, "app")
const PIPE = path.join(ROOT, "pipeline")
const NHANH = ["imageMerged", "inquiry", "imageUnmerged"] as const

// ---------- jsdom (cùng khuôn ops-dong-chay.test.tsx) ----------
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3465/ops/data-flow" })
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  SVGElement: dom.window.SVGElement,
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  MutationObserver: dom.window.MutationObserver,
  IntersectionObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  // Báo kích thước cố định để Sankey (recharts) vẽ được trong jsdom — khung không có bố cục thật.
  ResizeObserver: class {
    constructor(private cb: (e: unknown[]) => void) {}
    observe(target: Element) {
      this.cb([{ target, contentRect: { width: 1200, height: 520, top: 0, left: 0, right: 1200, bottom: 520, x: 0, y: 0 } }])
    }
    unobserve() {}
    disconnect() {}
  },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
})
dom.window.matchMedia = (globalThis as unknown as { matchMedia: typeof dom.window.matchMedia }).matchMedia
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
;(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => []
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })

let currentRoot: { render: (n: ReactNode) => void; unmount: () => void } | null = null
async function render(node: ReactNode) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { createRoot } = await import("react-dom/client")
  if (currentRoot) {
    const r = currentRoot
    currentRoot = null
    await React.act(async () => r.unmount())
  }
  document.body.innerHTML = "<div id=root></div>"
  const root = createRoot(document.getElementById("root")!)
  currentRoot = root
  await React.act(async () => root.render(node))
  return document.getElementById("root")!
}
const txt = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ")

// ---------- bản chép đột biến (cùng khuôn ops-duyet-phim-va-loi-ghi.test.tsx) ----------
const CHEP: string[] = []
/** Bản chép tạm của tệp `rel` (tương đối gốc kho) đổi bằng `doi`, đặt CẠNH tệp gốc (pipeline) hay ở tests (app) để import
 * tương đối vẫn trỏ đúng; `thay` đổi chuỗi import. */
function chep(rel: string, doi: (s: string) => string, thay: Record<string, string> = {}): string {
  const goc = readFileSync(path.join(ROOT, rel), "utf8")
  const sau = doi(goc)
  assert.notEqual(sau, goc, `đột biến của ${rel} không đổi gì — đối chứng vô nghĩa`)
  let doiImport = sau
  for (const [tu, sang] of Object.entries(thay)) {
    assert.ok(doiImport.includes(`"${tu}"`), `bản chép ${rel} không import "${tu}"`)
    doiImport = doiImport.split(`"${tu}"`).join(`"${sang}"`)
  }
  const ext = path.extname(rel)
  if (rel.startsWith("pipeline/")) {
    const f = path.join(ROOT, path.dirname(rel), `.df6-tmp-${P}-${CHEP.length}${ext}`)
    writeFileSync(f, doiImport)
    CHEP.push(f)
    return f
  }
  const dir = path.dirname(path.join(ROOT, rel))
  const tuyet = doiImport.replace(/(from\s+|import\()"(\.{1,2}\/[^"]+)"/g, (_m, a, p) => `${a}"${path.join(dir, p)}"`)
  const f = path.join(APP, "tests", `.df6-cu-${P}-${CHEP.length}${ext}`)
  writeFileSync(f, ext === ".tsx" ? `import React from "react"\n${tuyet}` : tuyet)
  CHEP.push(f)
  return f
}
/** Thay đúng một đoạn (đếm lần xuất hiện) — đột biến ghim chỗ. */
const mot = (a: string, b: string, n = 1) => (s: string) => {
  assert.equal(s.split(a).length - 1, n, `đoạn đột biến «${a.slice(0, 60)}» xuất hiện khác ${n} lần`)
  return s.split(a).join(b)
}

// ---------- fixture DF6: bài S03 có chữ, người gửi, nhóm ----------
const SNAP = "hanoi__zalo-agent__2026-10-24T090000"
const URL1 = "https://photo-stal-1.zdn.vn/x1.jpg"
// [post_id, text, sender_id, posted_at (giờ VN)]
type Bai = [string, string, string, string]
const BAI: Bai[] = [
  ["d_tin", "Bán căn 2PN 70m2 giá 3 tỷ", "u1", "2026-10-24T09:00:00"], // thành tin od1
  ["d_anh_gan", URL1, "u1", "2026-10-24T09:01:00"], // ảnh cách bài chữ của tin 60 giây, cùng người → ảnh đã ghép
  ["d_anh_khac", URL1, "u2", "2026-10-24T09:01:00"], // cách 60 giây nhưng khác người → ảnh chưa ghép
  ["d_anh_xa", URL1, "u1", "2026-10-24T09:10:00"], // cách 10 phút → ảnh chưa ghép
  ["d_chat", "chào cả nhà", "u3", "2026-10-24T10:00:00"], // chat → còn lại
  ["d_anh_chat", URL1, "u3", "2026-10-24T10:01:00"], // gần bài chữ không thành tin → ảnh chưa ghép
  ["d_yc", "Cần thuê căn 2pn khu này", "u4", "2026-10-24T11:00:00"], // Yêu cầu
  ["d_ai_co", "Ai có căn bán 2pn 3 tỷ", "u5", "2026-10-24T11:30:00"], // khớp Yêu cầu nhưng parsePost ra loại → KHÔNG Yêu cầu
  ["d_yc_tin", "Cần tìm căn 2pn ngân sách 3 tỷ", "u6", "2026-10-24T12:00:00"], // Yêu cầu nhưng nằm trong tin od2 → đọc được
  ["d_anh_tin", URL1, "u6", "2026-10-24T12:30:00"], // chỉ-ảnh nhưng nằm trong tin od2 → đọc được
  ["d_tin_cu", "Bán căn 3PN 90m2 giá 5 tỷ", "u7", "2026-10-10T09:00:00"], // tin cũ (ngoài 7 ngày)
  ["d_anh_cu", URL1, "u7", "2026-10-10T09:01:00"], // ảnh đã ghép, ngoài 7 ngày
  ["f_anh", URL1, "fb1", "2026-10-24T09:00:00"], // S05: chỉ-ảnh — S05 không có nhánh
  ["f_yc", "Cần mua căn 2pn", "fb2", "2026-10-24T09:00:00"], // S05: Yêu cầu — S05 không có nhánh
]
const DF6_OFFERS: Offer[] = [
  ["od1", "S03", "sale", "apartment", 3_000_000_000, 70, "vn-hanoi-a", IN, ["d_tin"], false],
  ["od2", "S03", "sale", "apartment", 3_000_000_000, 70, "vn-hanoi-a", "2026-10-24T12:00:00", ["d_yc_tin", "d_anh_tin"], false],
  ["od_cu", "S03", "sale", "apartment", 5_000_000_000, 90, "vn-hanoi-a", "2026-10-10T09:00:00", ["d_tin_cu"], false],
]
/** Số nhánh S03 mà fixture dựng, theo cửa sổ (NOW = 26/10 12:00 VN; 7 ngày = 20…26/10). */
const KY_VONG: Record<W, { imageMerged: number; inquiry: number; imageUnmerged: number }> = {
  "7d": { imageMerged: 1, inquiry: 1, imageUnmerged: 3 },
  "30d": { imageMerged: 2, inquiry: 1, imageUnmerged: 3 },
  all: { imageMerged: 2, inquiry: 1, imageUnmerged: 3 },
}

const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

const LUOC_DO_TAM = /^df6_(main|mut|local|cloud)_(\d+)$/
function pidSong(pid: number) {
  try {
    process.kill(pid, 0)
    return true
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM"
  }
}
async function donLuocDoChet() {
  const { rows } = await admin.query<{ nspname: string }>(`SELECT nspname FROM pg_namespace WHERE nspname ~ '^df6_'`)
  for (const { nspname } of rows) {
    const m = LUOC_DO_TAM.exec(nspname)
    if (m && !pidSong(Number(m[2]))) await admin.query(`DROP SCHEMA IF EXISTS "${nspname}" CASCADE`)
  }
}

/** Fixture dòng chảy + bài DF6 (fresh=false khi lược đồ đã có bảng bản tin). */
async function makeDf6(schema: string, { fresh = true } = {}) {
  await makeFlowSchema(admin, schema, { offers: [...OFFERS, ...DF6_OFFERS], fresh })
  for (const [id, text, sender, posted] of BAI)
    await admin.query(
      `INSERT INTO "${schema}".stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, captured_at, sender_id, conversation_id)
       VALUES ($1,$2,$3,'Nhóm D',$4,$5,$5,$6,'g1')`,
      [id, SNAP, id.startsWith("f_") ? "apify-facebook" : "openclaw-hook", text, vn(posted), sender],
    )
}

type FF = import("../src/lib/data-flow-queries").FlowFacts
type SF = import("../src/lib/data-flow-queries").SourceFlow
type Nap = (c: pg.Client) => Promise<unknown>
const NAP_THAT = async (c: pg.Client) => (await import("../../pipeline/lib/nhanh-bai-s03.mjs")).napNhanhBai(c)
/** Làm tươi lược đồ: `cach` = "bo-chay" (bộ chạy thật chayLamTuoi, hay bản chép `boChay`), "tran" (600 chạy trần),
 * hay `nap` riêng (bản chép lib nhánh) rồi chạy `sql`. Trả facts theo cửa sổ. */
async function lamTuoi(schema: string, o: { cach?: "bo-chay" | "tran" | "nap"; sql?: string; nap?: Nap; boChay?: string; truoc?: (c: pg.Client) => Promise<void> } = {}) {
  const { cach = "bo-chay", sql = flowSql() } = o
  await inSchema(schema, async (c) => {
    await c.query(`SELECT set_config('oneinvest.flow_now', $1, false)`, [new Date(NOW).toISOString()])
    if (o.truoc) await o.truoc(c)
    if (cach === "bo-chay") {
      const mod = (await import(o.boChay ?? "../../pipeline/refresh-data-flow.mjs")) as { chayLamTuoi: (c: pg.Client, s: string) => Promise<unknown> }
      await mod.chayLamTuoi(c, sql)
    } else {
      if (cach === "nap") await (o.nap ?? NAP_THAT)(c)
      await c.query(sql)
    }
  })
  const { rows } = await admin.query(`SELECT time_window, facts FROM "${schema}".data_flow_snapshot ORDER BY time_window`)
  return Object.fromEntries(rows.map((r) => [r.time_window, r.facts])) as Record<W, FF>
}
const s03 = (f: FF) => f.sources.find((s) => s.source === "S03")!

let FACTS: Record<W, FF>

before(async () => {
  try {
    await admin.connect()
    await donLuocDoChet()
    await makeDf6(S)
    FACTS = await lamTuoi(S)
  } catch (e) {
    setupErr = (e as Error).stack ?? (e as Error).message
  }
})
after(async () => {
  currentRoot = null
  document.body.innerHTML = ""
  for (const f of CHEP) rmSync(f, { force: true })
  for (const dir of [path.join(APP, "tests"), PIPE, path.join(PIPE, "lib"), path.join(ROOT, "scripts")])
    for (const f of readdirSync(dir)) if (f.startsWith(`.df6-tmp-${P}-`) || f.startsWith(`.df6-cu-${P}-`)) rmSync(path.join(dir, f), { force: true })
  for (const s of SCHEMAS) await admin.query(`DROP SCHEMA IF EXISTS "${s}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

// ---------- AC-1: ba nhánh đếm đúng ----------
/** Vấn đề của khối so với số fixture dựng (ma trận nhánh × cửa sổ viết trước). */
function vanDeAC1(facts: Record<W, FF>): string[] {
  const out = new Set<string>()
  for (const w of WINDOWS) {
    const s = s03(facts[w])
    if (NHANH.some((k) => typeof s[k] !== "number")) {
      out.add("NHANH VANG KHI QUA BO CHAY")
      continue
    }
    if (s.imageMerged !== KY_VONG[w].imageMerged) out.add("ANH GHEP SAI TIN")
    if (s.inquiry !== KY_VONG[w].inquiry) out.add("YEU CAU NUOT TIN RAO")
    if (s.imageUnmerged !== KY_VONG[w].imageUnmerged) out.add("ANH CHUA GHEP LECH")
  }
  return [...out]
}

describe("DF6-AC-1 ba nhánh bài S03 đếm đúng qua bộ chạy", () => {
  test("DF6-AC-1 khớp fixture ở ba cửa sổ và khớp hàm của transform gọi thẳng", async () => {
    ready()
    let n = 0
    for (const w of WINDOWS)
      for (const k of NHANH) {
        assert.equal(s03(FACTS[w])[k], KY_VONG[w][k], `S03 ${w}.${k}`)
        n++
      }
    assert.equal(n, WINDOWS.length * NHANH.length, "số assert = cửa sổ × nhánh")
    // Nguồn độc lập thứ hai: gọi thẳng hàm của transform trên cùng lược đồ (cửa sổ toàn kho).
    const { baiAnhCuaTin } = await import("../../pipeline/transform-media.mjs")
    const { parsePost, laYeuCau } = await import("../../pipeline/transform-zalo.mjs")
    const { laChiAnh } = await import("../../pipeline/lib/gop-anh.mjs")
    const { loadStgPosts } = await import("../../pipeline/lib/test-posts.mjs")
    const dem = await inSchema(S, async (c) => {
      const daGhep = new Set<string>()
      for (const rows of (await baiAnhCuaTin(c)).values()) for (const r of rows as { post_id: string }[]) daGhep.add(r.post_id)
      const daDoc = new Set((await c.query(`SELECT unnest(post_ids) AS p FROM sale_offers WHERE source = 'S03'`)).rows.map((r) => r.p))
      const { posts } = await loadStgPosts(c, "zalo")
      const d = { imageMerged: 0, inquiry: 0, imageUnmerged: 0 }
      for (const p of posts as { post_id: string; text: string }[]) {
        if (daDoc.has(p.post_id)) continue
        if (laChiAnh(p.text)) d[daGhep.has(p.post_id) ? "imageMerged" : "imageUnmerged"]++
        else if (!parsePost(p.text).kind && laYeuCau(p.text)) d.inquiry++
      }
      return d
    })
    assert.deepEqual(dem, KY_VONG.all, "đếm bằng hàm của transform gọi thẳng")
    assert.deepEqual(vanDeAC1(FACTS), [])
  })

  test("DF6-AC-1 chiều đỏ: ghép theo bài chữ gần nhất bất kể tin · Yêu cầu bỏ điều kiện parsePost · bộ chạy bỏ bước nạp", async () => {
    ready()
    const libGhep = chep(
      "pipeline/lib/nhanh-bai-s03.mjs",
      mot(
        "for (const rows of (await baiAnhCuaTin(c)).values()) for (const r of rows) daGhep.add(r.post_id);",
        `{ const { ganBaiAnh } = await import("./gop-anh.mjs"); const { posts: tat } = await loadStgPosts(c, "zalo");
           for (const id of ganBaiAnh(tat.filter((p) => !laChiAnh(p.text)), tat.filter((p) => laChiAnh(p.text))).keys()) daGhep.add(id); }`,
      ),
    )
    const libYc = chep("pipeline/lib/nhanh-bai-s03.mjs", mot(`if (!parsePost(bai.text ?? "").kind && laYeuCau(bai.text))`, `if (laYeuCau(bai.text))`))
    const boChay = chep("pipeline/refresh-data-flow.mjs", mot("  const dem = await napNhanhBai(c);", "  const dem = {};"))
    await makeDf6(S_MUT)
    const f1 = await lamTuoi(S_MUT, { cach: "nap", nap: async (c) => (await import(libGhep)).napNhanhBai(c) })
    await makeDf6(S_MUT)
    const f2 = await lamTuoi(S_MUT, { cach: "nap", nap: async (c) => (await import(libYc)).napNhanhBai(c) })
    await makeDf6(S_MUT)
    const f3 = await lamTuoi(S_MUT, { boChay })
    console.log(`# DF6-AC-1 đỏ: ${vanDeAC1(f1)} | ${vanDeAC1(f2)} | ${vanDeAC1(f3)}`)
    assert.ok(vanDeAC1(f1).includes("ANH GHEP SAI TIN"), "ghép sai tin phải đỏ")
    assert.ok(vanDeAC1(f2).includes("YEU CAU NUOT TIN RAO"), "Yêu cầu nuốt tin rao phải đỏ")
    assert.deepEqual(vanDeAC1(f3), ["NHANH VANG KHI QUA BO CHAY"])
  })
})

// ---------- AC-2: bảo toàn ----------
function vanDeAC2(facts: Record<W, FF>): string[] {
  const out = new Set<string>()
  for (const w of WINDOWS)
    for (const s of facts[w].sources) {
      const nhanh = NHANH.reduce((a, k) => a + ((s[k] as number) ?? 0), 0)
      if (s.received - s.readable - nhanh < 0) out.add(`TONG NHANH VUOT ${w}.${s.source}`)
      if (s.source === "S03" && (s.inquiry !== KY_VONG[w].inquiry || s.imageUnmerged !== KY_VONG[w].imageUnmerged)) out.add("NHANH CHONG TIN")
    }
  const f30 = facts["30d"]
  for (const k of ["received", "readable", ...NHANH] as const) {
    const ngay = f30.days.filter((d) => d.source === "S03").reduce((a, d) => a + ((d[k] as number) ?? 0), 0)
    if (ngay !== s03(f30)[k]) out.add("NGAY LECH CUA SO")
  }
  const fa = facts.all
  for (const k of ["received", "readable", ...NHANH] as const) {
    const nhom = fa.groups.filter((g) => g.source === "S03").reduce((a, g) => a + ((g[k] as number) ?? 0), 0)
    if (nhom !== s03(fa)[k]) out.add("NHOM LECH NGUON")
  }
  return [...out]
}

describe("DF6-AC-2 tổng nhánh bằng bài nhận, ngày và nhóm khớp nguồn", () => {
  test("DF6-AC-2 bất biến xanh; bài thành tin không vào nhánh mới", async () => {
    ready()
    assert.deepEqual(vanDeAC2(FACTS), [])
    // Đối chứng dương: bài d_yc_tin (chữ Yêu cầu) và d_anh_tin (chỉ-ảnh) nằm trong tin → đọc được, không vào nhánh.
    assert.equal(s03(FACTS.all).inquiry, 1, "d_yc_tin thành tin nên không là Yêu cầu")
    assert.equal(s03(FACTS.all).imageUnmerged, 3, "d_anh_tin thành tin nên không là ảnh chưa ghép")
  })
  test("DF6-AC-2 chiều đỏ: bỏ ưu tiên đọc được · nhánh ngày lệch ngày đăng", async () => {
    ready()
    await makeDf6(S_MUT)
    const chong = await lamTuoi(S_MUT, { sql: mot("AND u.post_id IS NULL AND b.branch", "AND b.branch", 3)(flowSql()) })
    await makeDf6(S_MUT)
    const lech = await lamTuoi(S_MUT, {
      sql: mot(
        "SELECT source, d, received, readable, 0 AS offers, 0 AS unit_linked, image_merged, inquiry, image_unmerged FROM posts_daily",
        "SELECT source, d, received, readable, 0 AS offers, 0 AS unit_linked, 0 AS image_merged, 0 AS inquiry, 0 AS image_unmerged FROM posts_daily UNION ALL SELECT source, d - 40, 0, 0, 0, 0, image_merged, inquiry, image_unmerged FROM posts_daily",
      )(flowSql()),
    })
    console.log(`# DF6-AC-2 đỏ: ${vanDeAC2(chong)} | ${vanDeAC2(lech)}`)
    assert.ok(vanDeAC2(chong).includes("NHANH CHONG TIN"))
    assert.ok(vanDeAC2(lech).includes("NGAY LECH CUA SO"))
  })
})

// ---------- AC-3: số cũ không đổi so với bản merge-base ----------
const boNhanh = <T extends object>(x: T) => Object.fromEntries(Object.entries(x).filter(([k]) => !(NHANH as readonly string[]).includes(k)))
function banNen(): string | null {
  try {
    const mb = execFileSync("git", ["merge-base", "HEAD", "origin/main"], { cwd: ROOT, encoding: "utf8" }).trim()
    return execFileSync("git", ["show", `${mb}:pipeline/sql/600_data_flow.sql`], { cwd: ROOT, encoding: "utf8" })
  } catch {
    return null
  }
}
function vanDeAC3(cu: Record<W, FF>, moi: Record<W, FF>): string[] {
  const out = new Set<string>()
  for (const w of WINDOWS) {
    for (const k of ["shortStay", "mix", "enrichPending"] as const) if (JSON.stringify(cu[w][k]) !== JSON.stringify(moi[w][k])) out.add("SO CU DOI")
    for (const s of moi[w].sources) {
      const c = cu[w].sources.find((x) => x.source === s.source)
      if (JSON.stringify(boNhanh(s)) !== JSON.stringify(c)) out.add(s.source === "S03" ? "KHOA CU DOI NGHIA" : "S05 DOI SO")
      if (s.source !== "S03" && NHANH.some((k) => s[k] !== 0)) out.add("S05 DOI SO")
    }
    if (JSON.stringify(moi[w].days.map(boNhanh)) !== JSON.stringify(cu[w].days)) out.add("SO CU DOI")
    if (JSON.stringify(moi[w].groups.map(boNhanh)) !== JSON.stringify(cu[w].groups)) out.add("SO CU DOI")
  }
  return [...out]
}

describe("DF6-AC-3 số cũ giữ nguyên so với 600 của merge-base", () => {
  test("DF6-AC-3 chỉ thêm ba khoá; S05, S06 nhánh = 0", async () => {
    ready()
    const cuSql = banNen()
    assert.ok(cuSql, "KHONG CO BAN NEN: không đọc được 600 của merge-base với origin/main")
    await makeDf6(S_MUT)
    const cu = await lamTuoi(S_MUT, { cach: "tran", sql: cuSql! })
    assert.deepEqual(vanDeAC3(cu, FACTS), [])
    for (const w of WINDOWS)
      for (const s of FACTS[w].sources.filter((x) => x.source !== "S03")) for (const k of NHANH) assert.equal(s[k], 0, `${w}.${s.source}.${k}`)
    assert.ok(FACTS.all.sources.find((s) => s.source === "S05")!.received >= 2, "đối chứng dương: fixture có bài S05 chỉ-ảnh và Yêu cầu")
  })
  test("DF6-AC-3 chiều đỏ: tính nhánh cả cho S05 · đổi nghĩa khoá readable", async () => {
    ready()
    const cuSql = banNen()!
    await makeDf6(S_MUT)
    const cu = await lamTuoi(S_MUT, { cach: "tran", sql: cuSql })
    const libS05 = chep(
      "pipeline/lib/nhanh-bai-s03.mjs",
      mot(`const { posts } = await loadStgPosts(c, "zalo");`, `const posts = [...(await loadStgPosts(c, "zalo")).posts, ...(await loadStgPosts(c, "facebook")).posts];`),
    )
    await makeDf6(S_MUT)
    const s05 = await lamTuoi(S_MUT, { cach: "nap", nap: async (c) => (await import(libS05)).napNhanhBai(c), sql: mot(" AND t.src = 'S03' AND (SELECT on_ FROM flag)", " AND (SELECT on_ FROM flag)", 2)(flowSql()) })
    await makeDf6(S_MUT)
    const nghia = await lamTuoi(S_MUT, { sql: mot("ELSE coalesce(r.readable, 0) END,", "ELSE coalesce(r.readable, 0) + coalesce(r.image_merged, 0) END,")(flowSql()) })
    console.log(`# DF6-AC-3 đỏ: ${vanDeAC3(cu, s05)} | ${vanDeAC3(cu, nghia)}`)
    assert.ok(vanDeAC3(cu, s05).includes("S05 DOI SO"))
    assert.ok(vanDeAC3(cu, nghia).includes("KHOA CU DOI NGHIA"))
  })
})

// ---------- AC-4: chạy trần → null, trang như trước ----------
const LOI_GOI_MIEN = new Set(["pipeline/refresh-data-flow.mjs", "pipeline/scripts/do-nhanh-bai-s03.mjs"])
/** Lối gọi 600 không đi qua bộ chạy: dòng mã (không phải chú thích) trong scripts/, pipeline/ nhắc tệp 600 mà không nhắc bộ chạy. */
function loiGoi600(them: string[] = []): string[] {
  const out: string[] = []
  const quet = (dir: string): string[] =>
    readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
      e.name === "node_modules" || e.name === "logs" ? [] : e.isDirectory() ? quet(path.join(dir, e.name)) : [path.join(dir, e.name)],
    )
  const tep = [...new Set([...quet("scripts"), ...quet("pipeline"), ...them])]
    .filter((f) => /\.(sh|mjs|js|cjs|plist)$/.test(f) && !/\.(test|itest)\.m?js$/.test(f) && !path.basename(f).startsWith(".df6-tmp-") || them.includes(f))
  for (const f of tep) {
    if (LOI_GOI_MIEN.has(f)) continue
    for (const l of readFileSync(path.join(ROOT, f), "utf8").split("\n")) {
      const t = l.trim()
      if (/^(\/\/|#|\*|\/\*)/.test(t)) continue
      if (t.includes("600_data_flow.sql") && !t.includes("refresh-data-flow")) out.push(`LOI GOI 600 TRAN ${f}`)
    }
  }
  return out
}

describe("DF6-AC-4 khối chưa tách nhánh: null, trang như trước DF6", () => {
  test("DF6-AC-4 chạy trần: null ở mọi nơi, số khác như qua bộ chạy; trang vẽ cây cũ kèm dòng báo", async () => {
    ready()
    await makeDf6(S_MUT)
    const tran = await lamTuoi(S_MUT, { cach: "tran" }) // bảng tạm vắng → 600 tự tạo rỗng, cờ tắt
    await makeDf6(S_MUT)
    const tat = await lamTuoi(S_MUT, { cach: "nap", truoc: async () => {}, sql: `SELECT set_config('oneinvest.flow_branch', 'off', false); ${flowSql()}` })
    for (const [ten, f] of [["bảng vắng", tran], ["cờ tắt", tat]] as const)
      for (const w of WINDOWS) {
        // Khối chạy trần không mang ba khoá (giống hệt khối trước DF6); trang đọc khoá vắng thành null.
        for (const x of [...f[w].sources, ...f[w].days, ...f[w].groups]) for (const k of NHANH) assert.ok(!(k in (x as object)), `${ten} ${w}.${k} phải vắng`)
        assert.deepEqual(f[w].sources.map(boNhanh), FACTS[w].sources.map(boNhanh), `${ten} ${w}: khoá khác như qua bộ chạy`)
      }
    const { normalizeFacts } = await import("../src/lib/data-flow-queries")
    const { buildFlow } = await import("../src/components/ops/data-flow/flow-sankey-data")
    const n = normalizeFacts(tran.all)
    assert.ok(s03(n).imageMerged == null, "normalizeFacts không bịa số cho khoá vắng")
    const flow = buildFlow([s03(n)], {})
    const ids = flow.nodes.map((x) => x.id)
    for (const id of ["toRead", "imageMerged", "inquiry", "imageUnmerged"]) assert.ok(!ids.includes(id), `khối cũ không có nút ${id}`)
    const s = s03(n)
    assert.equal(flow.nodes.find((x) => x.id === "unreadable")!.amount, s.received - s.readable)
    const { fmtPct } = await import("../src/lib/format")
    assert.equal(flow.headers.readable.note, fmtPct(s.readable / s.received))
    const { FlowSankey } = await import("../src/components/ops/data-flow/flow-sankey")
    const root = await render(<FlowSankey sources={n.sources} roles={{}} />)
    assert.match(txt(root), /Chưa tách bài chỉ-ảnh và Yêu cầu — có ở lượt làm tươi kế/)
    const coNhanh = await render(<FlowSankey sources={normalizeFacts(FACTS.all).sources} roles={{}} />)
    assert.doesNotMatch(txt(coNhanh), /Chưa tách bài chỉ-ảnh/, "đối chứng dương: khối có nhánh không có dòng báo")
    assert.deepEqual(loiGoi600(), [], "mọi lối gọi 600 đi qua bộ chạy")
  })
  test("DF6-AC-4 chiều đỏ: null đọc thành 0 · cờ tắt vẫn đếm bảng · lối gọi 600 trần", async () => {
    ready()
    const q0 = chep(
      "app/src/lib/data-flow-queries.ts",
      mot("BRANCH_KEYS.filter((k) => k in x).map((k) => [k, nOrNull(x[k])])", "BRANCH_KEYS.map((k) => [k, nOrNull(x[k]) ?? 0])"),
    )
    await makeDf6(S_MUT)
    const tran = await lamTuoi(S_MUT, { cach: "tran" })
    const { buildFlow } = await import("../src/components/ops/data-flow/flow-sankey-data")
    const n0 = (await import(q0)).normalizeFacts(tran.all) as FF
    const loi0 = buildFlow([s03(n0)], {}).nodes.some((x) => x.id === "toRead") ? ["KHOI CU THANH SO 0"] : []
    await makeDf6(S_MUT)
    const bang = await lamTuoi(S_MUT, {
      cach: "nap",
      sql: `SELECT set_config('oneinvest.flow_branch', 'off', false); ${mot("coalesce(current_setting('oneinvest.flow_branch', true), '') = 'on' AS on_", "true AS on_")(flowSql())}`,
    })
    const loiBang = typeof s03(bang.all).imageMerged === "number" ? ["BANG TAM KHONG CO"] : []
    const gia = path.join("scripts", `.df6-tmp-${P}-cloud-sync.sh`)
    writeFileSync(path.join(ROOT, gia), readFileSync(path.join(ROOT, "scripts/cloud-sync.sh"), "utf8") + `\npsql -f "$ROOT/pipeline/sql/600_data_flow.sql"\n`)
    CHEP.push(path.join(ROOT, gia))
    const loiGoi = loiGoi600([gia])
    console.log(`# DF6-AC-4 đỏ: ${loi0} | ${loiBang} | ${loiGoi}`)
    assert.deepEqual(loi0, ["KHOI CU THANH SO 0"])
    assert.deepEqual(loiBang, ["BANG TAM KHONG CO"])
    assert.deepEqual(loiGoi, [`LOI GOI 600 TRAN ${gia}`])
  })
})

// ---------- AC-5: Sankey ----------
type BF = typeof import("../src/components/ops/data-flow/flow-sankey-data").buildFlow
async function vanDeAC5(build: BF, f: FF): Promise<string[]> {
  const { fmtInt, fmtPct } = await import("../src/lib/format")
  const { STAGE_COLOR } = await import("../src/components/ops/data-flow/stage-face")
  const s = s03(f)
  const out = new Set<string>()
  const { nodes, links, headers } = build([s], {})
  const nut = (id: string) => nodes.find((x) => x.id === id)
  const toRead = s.received - (s.imageMerged ?? 0)
  const so: Record<string, number> = { imageMerged: s.imageMerged!, toRead, readable: s.readable, inquiry: s.inquiry!, imageUnmerged: s.imageUnmerged! }
  const ten: Record<string, string> = { imageMerged: "Ảnh đã ghép vào tin", toRead: "Bài cần đọc", readable: "Đọc thành tin rao", inquiry: "Đọc thành Yêu cầu", imageUnmerged: "Ảnh chưa ghép", unreadable: "Không đọc được" }
  for (const [id, t] of Object.entries(ten)) if (nut(id)?.name !== t) out.add(`THIEU NUT ${t}`)
  for (const [id, v] of Object.entries(so)) if (nut(id)?.amount !== v) out.add(`SO NUT LECH ${id}`)
  // Bảo toàn ở mọi nút giữa (ma trận viết trước).
  const idx = (id: string) => nodes.findIndex((x) => x.id === id)
  for (const id of ["received", "toRead", "readable", "offers"]) {
    const i = idx(id)
    const vao = links.filter((l) => l.target === i).reduce((a, l) => a + l.value, 0)
    const ra = links.filter((l) => l.source === i).reduce((a, l) => a + l.value, 0)
    if (i < 0 || vao !== ra) out.add("DONG CHAY KHONG BAO TOAN")
  }
  const canh = (a: string, b: string) => links.some((l) => l.source === idx(a) && l.target === idx(b))
  for (const [a, b] of [["received", "imageMerged"], ["received", "toRead"], ["toRead", "readable"], ["toRead", "inquiry"], ["toRead", "imageUnmerged"], ["toRead", "unreadable"]])
    if (!canh(a, b)) out.add("DONG CHAY KHONG BAO TOAN")
  if (headers.readable?.value !== fmtInt(s.readable + s.inquiry!)) out.add("YEU CAU KHONG TINH DOC DUOC")
  if (headers.readable?.note !== fmtPct((s.readable + s.inquiry!) / toRead)) out.add(headers.readable?.note === fmtPct((s.readable + s.inquiry!) / s.received) ? "MAU SO CU" : "YEU CAU KHONG TINH DOC DUOC")
  // Ma trận nút → loại (6) + bốn màu khác nhau.
  const LOAI: Record<string, string> = { imageMerged: "merged", toRead: "journey", readable: "journey", inquiry: "inquiry", imageUnmerged: "dropped", unreadable: "dropped" }
  for (const [id, st] of Object.entries(LOAI)) if (nut(id)?.stage !== st) out.add(id === "inquiry" && nut(id)?.stage === "dropped" ? "YEU CAU TO MAU ROI" : `LOAI NUT LECH ${id}`)
  const mau = ["merged", "inquiry", "dropped", "linked"].map((k) => STAGE_COLOR[k as keyof typeof STAGE_COLOR])
  if (new Set(mau).size !== 4) out.add("MAU NUT TRUNG")
  if (/hỏi mua/.test(nut("unreadable")?.hint ?? "")) out.add("GOI Y CON HOI MUA")
  if (!nut("readable")?.labeled) out.add("DAU RA KHONG NHAN")
  return [...out]
}

describe("DF6-AC-5 Sankey hai đầu ra ngang hàng", () => {
  test("DF6-AC-5 nút, cạnh, bảo toàn, chú thích, bảng đọc, nhãn, loại nút", async () => {
    ready()
    const { normalizeFacts } = await import("../src/lib/data-flow-queries")
    const { buildFlow } = await import("../src/components/ops/data-flow/flow-sankey-data")
    const f = normalizeFacts(FACTS.all)
    assert.deepEqual(await vanDeAC5(buildFlow, f), [])
    const s = s03(f)
    const toRead = s.received - s.imageMerged!
    const { nodes, links, headers } = buildFlow([s], {})
    const { fmtPct } = await import("../src/lib/format")
    const { FlowReadout } = await import("../src/components/ops/data-flow/flow-readout")
    for (const [id, v] of [["readable", s.readable], ["inquiry", s.inquiry!]] as const) {
      const root = await render(<FlowReadout hover={{ type: "node", index: nodes.findIndex((x) => x.id === id) }} nodes={nodes} links={links} total={s.received} />)
      assert.match(txt(root), new RegExp(`Tỉ lệ bước ?${fmtPct(v / toRead).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), `tỉ lệ bước ${id}`)
    }
    const { FlowJourney } = await import("../src/components/ops/data-flow/flow-journey")
    const root = await render(<FlowJourney nodes={nodes} links={links} headers={headers} paused />)
    const nhan = [...root.querySelectorAll("svg text tspan")].map((t) => t.textContent?.trim())
    for (const t of ["Đọc thành tin rao", "Đọc thành Yêu cầu"]) assert.ok(nhan.includes(t), `nhãn «${t}» cạnh thanh (có: ${nhan.join(", ")})`)
    const chiS06 = buildFlow(f.sources.filter((x) => x.source === "S06"), {}).nodes.map((x) => x.id)
    for (const id of ["imageMerged", "inquiry", "imageUnmerged"]) assert.ok(!chiS06.includes(id), `chỉ S06: không nút ${id}`)
  })
  test("DF6-AC-5 chiều đỏ: chia bài nhận · bỏ Yêu cầu khỏi tử số · cạnh sai gốc · Yêu cầu màu rơi", async () => {
    ready()
    const { normalizeFacts } = await import("../src/lib/data-flow-queries")
    const f = normalizeFacts(FACTS.all)
    const REL = "app/src/components/ops/data-flow/flow-sankey-data.ts"
    const ca: [string, (s: string) => string][] = [
      ["MAU SO CU", mot("note: rate(readable + inquiry, toRead) }", "note: rate(readable + inquiry, received) }")],
      ["YEU CAU KHONG TINH DOC DUOC", mot("value: fmtInt(readable + inquiry), note: rate(readable + inquiry, toRead) }", "value: fmtInt(readable), note: rate(readable, toRead) }")],
      ["DONG CHAY KHONG BAO TOAN", mot(`["received", "imageMerged"],`, `["toRead", "imageMerged"],`)],
      ["YEU CAU TO MAU ROI", mot(`stage: "inquiry",\n            amount: inquiry,`, `stage: "dropped",\n            amount: inquiry,`)],
    ]
    for (const [ma, doi] of ca) {
      const loi = await vanDeAC5(((await import(chep(REL, doi))) as { buildFlow: BF }).buildFlow, f)
      console.log(`# DF6-AC-5 đỏ ${ma}: ${loi}`)
      assert.ok(loi.includes(ma), `${ma} phải đỏ (có: ${loi})`)
    }
  })
})

// ---------- AC-6: lưới chất lượng ----------
type DF = import("../src/lib/data-flow-queries").DataFlow
const sf = (source: "S03" | "S05" | "S06", x: Partial<SF>): SF =>
  ({
    source, received: 100, readable: 0, offers: 10, clustered: 0, located: 0, unitLinked: 0, locatedPending: 0, uniqueIdPending: 0,
    deepest: { unitLinked: 0, located: 0, clustered: 0 }, testRejected: 0, withWard: 10, withType: 10, withPriceArea: 10, complete: 10,
    highConfidence: 0, latestAt: new Date(NOW).toISOString(), approx: false, imageMerged: null, inquiry: null, imageUnmerged: null, ...x,
  }) as SF
const flowOf = (sources: SF[], groups: DF["groups"] = []): DF =>
  ({ sources, days: [], groups, shortStay: { received: 0, stored: 0, withWard: 0, latestAt: null }, mix: { sale: 0, rentLt: 0, shortStay: 0 }, enrichPending: 0, records: [] }) as unknown as DF
// Ma trận viết trước: [tên ô, received, imageMerged, readable, inquiry, nhãn kỳ vọng]
const O_AC6: [string, number, number | null, number, number | null, string][] = [
  ["25%/20%", 100, 20, 20, 0, "Kẹt · đọc"],
  ["45%/25%", 100, 40, 25, 2, "Theo dõi · đọc"],
  ["65%/40%", 100, 20, 40, 12, "Khoẻ"],
  ["null nhánh", 100, null, 25, null, "Kẹt · đọc"],
]
type QR = typeof import("../src/components/ops/data-flow/quality-rows")
async function vanDeAC6(q: QR, f: FF): Promise<string[]> {
  const out = new Set<string>()
  let n = 0
  for (const [ten, received, imageMerged, readable, inquiry, nhan] of O_AC6) {
    const nhanh = { imageMerged, inquiry, imageUnmerged: imageMerged === null ? null : 0 }
    const row = q.sourceRows(flowOf([sf("S03", { received, readable, ...nhanh })]), {}, NOW)[0]
    const grp = q.groupRows(flowOf([sf("S03", { received: 1000, readable: 1, imageMerged: 0, inquiry: 0, imageUnmerged: 0 })], [{ group: "Nhóm D", source: "S03", received, readable, offers: 10, latestAt: new Date(NOW).toISOString(), ...nhanh }]), {}, NOW)[0]
    n += 2
    if (row.health.label !== nhan) out.add(row.health.label === "Kẹt · đọc" && nhan !== "Kẹt · đọc" ? "NHAN SUC KHOE MAU SO CU" : `NHAN LECH ${ten}`)
    if (nhan !== "Kẹt · đọc" && row.health.label === "Theo dõi · đọc" && nhan === "Khoẻ") out.add("YEU CAU KHONG TINH DOC DUOC")
    if (grp.health.label !== nhan) out.add(grp.health.label === "Kẹt · đọc" && nhan !== "Kẹt · đọc" ? "NHOM THU MAU SO CU" : `NHOM NHAN LECH ${ten}`)
  }
  if (n !== O_AC6.length * 2) out.add("MA TRAN THIEU")
  // Trên khối do bộ chạy sinh: tử số, mẫu số của nguồn S03 và từng nhóm thu S03 tính độc lập từ chính phần tử.
  const flow = flowOf(f.sources, f.groups)
  const r = q.sourceRows(flow, {}, NOW).find((x) => x.id === "S03")!
  const s = s03(f)
  if (r.readTotal !== s.readable + s.inquiry! || r.toRead !== s.received - s.imageMerged!) out.add("NGUON S03 LECH KHOI")
  for (const g of q.groupRows(flow, {}, NOW).filter((x) => x.id.startsWith("S03|"))) {
    const goc = f.groups.find((x) => `${x.source}|${x.group}` === g.id)!
    if (g.toRead !== goc.received - (goc.imageMerged ?? 0)) out.add(g.toRead === s.received - s.imageMerged! ? "NHOM DOC NHANH NGUON" : "NHOM THU MAU SO CU")
    if (g.readTotal !== goc.readable + (goc.inquiry ?? 0)) out.add("NHOM THU MAU SO CU")
  }
  return [...out]
}

describe("DF6-AC-6 lưới chất lượng chia cho bài cần đọc", () => {
  test("DF6-AC-6 ma trận bốn ô × nguồn, nhóm; khối thật; ô lưới; S05 S06 S01 không đổi", async () => {
    ready()
    const q = await import("../src/components/ops/data-flow/quality-rows")
    const { normalizeFacts } = await import("../src/lib/data-flow-queries")
    const f = normalizeFacts(FACTS.all)
    assert.deepEqual(await vanDeAC6(q, f), [])
    const { fmtInt, fmtPct } = await import("../src/lib/format")
    const { QualityGrid } = await import("../src/components/ops/data-flow/quality-grid")
    const rows = q.sourceRows(flowOf(f.sources, f.groups), {}, NOW)
    const root = await render(<QualityGrid bySource={rows} byGroup={[]} />)
    const tr = [...root.querySelectorAll("tbody tr")].find((x) => /S03/.test(txt(x)))
    const s = s03(f)
    assert.match(txt(tr), new RegExp(`${fmtInt(s.readable + s.inquiry!)}\\s*${fmtPct((s.readable + s.inquiry!) / (s.received - s.imageMerged!), 0).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`))
    // S05, S06: số và nhãn như khối chưa tách nhánh.
    const cu = q.sourceRows(flowOf(f.sources.map((x) => ({ ...x, imageMerged: null, inquiry: null, imageUnmerged: null }))), {}, NOW)
    for (const id of ["S05", "S06"]) {
      const a = rows.find((x) => x.id === id)!, b = cu.find((x) => x.id === id)!
      assert.equal(a.health.label, b.health.label, `${id} nhãn`)
      assert.equal(a.readTotal, b.readable, `${id} đọc được`)
    }
  })
  test("DF6-AC-6 chiều đỏ: kiểm đọc chia bài nhận · bỏ Yêu cầu · nhóm thu sót · nhóm đọc nhánh nguồn", async () => {
    ready()
    const { normalizeFacts } = await import("../src/lib/data-flow-queries")
    const f = normalizeFacts(FACTS.all)
    const REL = "app/src/components/ops/data-flow/quality-rows.ts"
    const ca: [string, (s: string) => string][] = [
      ["NHAN SUC KHOE MAU SO CU", mot("den: (r) => r.toRead ?? r.received,", "den: (r) => r.received,")],
      ["YEU CAU KHONG TINH DOC DUOC", mot("num: (r) => r.readTotal ?? r.readable,", "num: (r) => r.readable,")],
      ["NHOM THU MAU SO CU", mot("      toRead: toReadOf(g),\n      readTotal: readOf(g),\n", "")],
      ["NHOM DOC NHANH NGUON", mot("      toRead: toReadOf(g),", "      toRead: toReadOf(flow.sources.find((s) => s.source === g.source) ?? g),")],
    ]
    for (const [ma, doi] of ca) {
      const loi = await vanDeAC6((await import(chep(REL, doi))) as QR, f)
      console.log(`# DF6-AC-6 đỏ ${ma}: ${loi}`)
      assert.ok(loi.includes(ma), `${ma} phải đỏ (có: ${loi})`)
    }
  })
})

// ---------- AC-7: Chặng theo ngày ----------
type TC = typeof import("../src/components/ops/data-flow/stage-trend-chart")
type TD = typeof import("../src/components/ops/data-flow/stage-trend-data")
async function vanDeAC7(chart: TC, data: TD, f: FF): Promise<string[]> {
  const { fmtInt, fmtPct } = await import("../src/lib/format")
  const out = new Set<string>()
  const root = await render(<chart.StageTrendChart sources={f.sources} days={f.days} nowMs={NOW} windowDays={30} />)
  const docTong = f.sources.reduce((a, s) => a + s.readable + (s.inquiry ?? 0), 0)
  const canDoc = f.sources.reduce((a, s) => a + s.received - (s.imageMerged ?? 0), 0)
  const tinRao = f.sources.reduce((a, s) => a + s.readable, 0)
  const o = [...root.querySelectorAll("span[title]")].map((e) => [e.getAttribute("title"), e.textContent?.trim()])
  const doc = o.find(([t]) => t === "so với bài cần đọc")
  if (!doc) out.add(o.some(([t]) => t === "so với bài nhận") ? "O TI LE MAU SO CU" : "O DOC DUOC VANG")
  else if (doc[1] !== fmtPct(docTong / canDoc)) out.add("O TI LE MAU SO CU")
  if (!txt(root).includes(fmtInt(docTong))) out.add("O DOC DUOC THIEU YEU CAU")
  if (!o.some(([t, v]) => t === "so với bài thành tin rao" && v === fmtPct(f.sources.reduce((a, s) => a + s.offers, 0) / tinRao))) out.add("O TIN RAO LECH")
  for (const d of data.readDays(f.days, true)) {
    const goc = f.days.find((x) => x.day === d.day && x.source === d.source)!
    if (d.readable !== goc.readable + (goc.inquiry ?? 0)) out.add("DUONG NGAY THIEU YEU CAU")
    if (d.received !== goc.received || d.offers !== goc.offers) out.add("DUONG NGAY DOI CHANG KHAC")
  }
  return [...out]
}

describe("DF6-AC-7 Chặng theo ngày", () => {
  test("DF6-AC-7 ô và đường «Đọc được» = tin rao + Yêu cầu trên bài cần đọc; khối chưa tách như cũ", async () => {
    ready()
    const { normalizeFacts } = await import("../src/lib/data-flow-queries")
    const f = normalizeFacts(FACTS["30d"])
    const chart = await import("../src/components/ops/data-flow/stage-trend-chart")
    const data = await import("../src/components/ops/data-flow/stage-trend-data")
    assert.deepEqual(await vanDeAC7(chart, data, f), [])
    const cu = { ...f, sources: f.sources.map((x) => ({ ...x, imageMerged: null, inquiry: null, imageUnmerged: null })) }
    const root = await render(<chart.StageTrendChart sources={cu.sources} days={cu.days} nowMs={NOW} windowDays={30} />)
    assert.ok([...root.querySelectorAll("span[title]")].some((e) => e.getAttribute("title") === "so với bài nhận"), "khối chưa tách: ô Đọc được so với bài nhận")
  })
  test("DF6-AC-7 chiều đỏ: ô chia bài nhận · đường ngày bỏ Yêu cầu", async () => {
    ready()
    const { normalizeFacts } = await import("../src/lib/data-flow-queries")
    const f = normalizeFacts(FACTS["30d"])
    const CH = "app/src/components/ops/data-flow/stage-trend-chart.tsx"
    const DA = "app/src/components/ops/data-flow/stage-trend-data.ts"
    const data = await import("../src/components/ops/data-flow/stage-trend-data")
    const c1 = (await import(chep(CH, mot(`{ total: toRead, label: "bài cần đọc" }`, `{ total: totals.received, label: "bài cần đọc" }`)))) as TC
    const loi1 = await vanDeAC7(c1, data, f)
    const d2 = chep(DA, mot("return branched ? days.map((d) => ({ ...d, readable: readOf(d) })) : days", "return days"))
    const c2 = (await import(chep(CH, (s) => s + "\n", { "./stage-trend-data": d2 }))) as TC
    const loi2 = await vanDeAC7(c2, (await import(d2)) as TD, f)
    console.log(`# DF6-AC-7 đỏ: ${loi1} | ${loi2}`)
    assert.ok(loi1.includes("O TI LE MAU SO CU"))
    assert.ok(loi2.includes("DUONG NGAY THIEU YEU CAU"))
  })
})

// ---------- AC-8: cloud ----------
type Payload = Record<string, unknown> & { pushedAt: string; blocks: Record<string, Record<string, unknown>> }
async function asCloud<T>(fn: () => Promise<T>): Promise<T> {
  const prev = process.env.VERCEL
  process.env.VERCEL = "1"
  try {
    return await fn()
  } finally {
    if (prev === undefined) delete process.env.VERCEL
    else process.env.VERCEL = prev
  }
}
async function dungCloud() {
  await makeOpsSchema(admin, S_LOCAL)
  await makeDf6(S_LOCAL, { fresh: false })
  await lamTuoi(S_LOCAL)
  const r = (await captureOpsFacts({ env: { DATABASE_URL: schemaUrl(S_LOCAL) }, args: [] as never[] })) as { code: number; stderr: string; payload: Payload | null }
  assert.equal(r.code, 0, r.stderr.slice(0, 600))
  assert.ok(r.payload, "push-ops-facts không gửi bản tin")
  await makeFlowSchema(admin, S_CLOUD, { tables: ["sale_offers", "property_offers", "areas", "listings"], migrate: false })
  await admin.query(`CREATE TABLE "${S_CLOUD}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`)
  await admin.query(`CREATE TABLE "${S_CLOUD}".ops_audit (LIKE public.ops_audit INCLUDING ALL)`)
  const { POST } = await import("../src/app/api/v1/ops/ingest/route")
  const res = await POST(new Request("http://x/api/v1/ops/ingest", { method: "POST", headers: { authorization: "Bearer df6-thu" }, body: JSON.stringify(r.payload) }))
  assert.equal(res.status, 200)
}
type GDF = typeof import("../src/lib/data-flow-queries").getDataFlow
/** So máy thu (getDataFlow THẬT, mode local) với cloud qua `get` (thật, hay bản chép đột biến). */
async function vanDeAC8(get: GDF): Promise<string[]> {
  const { getDataFlow: that } = await import("../src/lib/data-flow-queries")
  const out = new Set<string>()
  const c = new pg.Client({ connectionString: schemaUrl(S_LOCAL) })
  await c.connect()
  try {
    const { buildFlow } = await import("../src/components/ops/data-flow/flow-sankey-data")
    const { sourceRows } = await import("../src/components/ops/data-flow/quality-rows")
    for (const w of WINDOWS) {
      const local = await that(w, { now: NOW, query: (t, v) => c.query(t, v), mode: "local" })
      const cloud = await asCloud(() => get(w, { now: NOW }))
      if (cloud.mode !== "cloud") out.add("KHONG PHAI CLOUD")
      for (const k of ["sources", "days", "groups"] as const)
        for (const x of local[k] as unknown as Record<string, unknown>[]) {
          const y = (cloud[k] as unknown as Record<string, unknown>[]).find((z) => z.source === x.source && z.day === x.day && z.group === x.group)
          for (const n of NHANH) if (y?.[n] !== x[n]) out.add("CLOUD MAT NHANH")
        }
      const a = buildFlow(local.sources, {}), b = buildFlow(cloud.sources, {})
      if (JSON.stringify(a.nodes) !== JSON.stringify(b.nodes) || JSON.stringify(a.headers) !== JSON.stringify(b.headers)) out.add("CLOUD SANKEY LECH")
      if (JSON.stringify(sourceRows(local, {}, NOW).map((r) => r.health.label)) !== JSON.stringify(sourceRows(cloud, {}, NOW).map((r) => r.health.label))) out.add("CLOUD NHAN LECH")
    }
  } finally {
    await c.end()
  }
  return [...out]
}

describe("DF6-AC-8 cloud thấy cùng nhánh", () => {
  test("DF6-AC-8 khối dataFlow do push-ops-facts thật chở lên mang ba khoá; Sankey, nhãn như máy thu; khối đời trước → null", async () => {
    ready()
    await dungCloud()
    const { getDataFlow } = await import("../src/lib/data-flow-queries")
    assert.deepEqual(await vanDeAC8(getDataFlow), [])
    const { readOpsFacts } = await import("../src/lib/ops-facts")
    const cu = await asCloud(() =>
      getDataFlow("all", {
        now: NOW,
        readFacts: async (o) => {
          const f = structuredClone(await readOpsFacts(o))
          const win = (f.blocks.dataFlow!.data!.windows as Record<W, FF>).all
          for (const x of [...win.sources, ...win.days, ...win.groups] as Record<string, unknown>[]) for (const k of NHANH) delete x[k]
          return f
        },
      }),
    )
    assert.ok(s03(cu).imageMerged == null, "khối cloud đời trước → không có số nhánh")
    const { buildFlow } = await import("../src/components/ops/data-flow/flow-sankey-data")
    assert.ok(!buildFlow([s03(cu)], {}).nodes.some((x) => x.id === "toRead"), "khối đời trước: cây như trước DF6")
  })
  test("DF6-AC-8 chiều đỏ: normalizeFacts bỏ khoá nhánh", async () => {
    ready()
    const q = chep("app/src/lib/data-flow-queries.ts", mot("        deepest,\n        ...branchesOf(s),", "        deepest,\n        imageMerged: null, inquiry: null, imageUnmerged: null,"))
    const loi = await vanDeAC8(((await import(q)) as { getDataFlow: GDF }).getDataFlow)
    console.log(`# DF6-AC-8 đỏ: ${loi}`)
    assert.ok(loi.includes("CLOUD MAT NHANH"))
  })
})
