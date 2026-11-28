// luong-7-ngay-dung-so.test.tsx — người vận hành đọc «Luồng 7 ngày qua» thấy mỗi cột đếm đúng thứ nhãn nói (ON5, OPS-8).
// Hồ sơ nghiệm thu: _acceptance/luong-7-ngay-dung-so (AC-1…AC-7; AC-8 ở scripts/luong-7-ngay-do.mjs, AC-9 ở
// scripts/smoke-luong-7-ngay.mjs). Lược đồ tạm từ pipeline/scripts/ops-facts-fixture.mjs + dữ liệu S03 viết trước; bên ghi
// thật qua capture-ops-facts. Tên ca mở đầu bằng mã AC (ON5-AC-n).
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import pg from "pg"
import { readFileSync } from "node:fs"

import { captureOpsFacts, localDbUrl, mutantPush } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { dropOpsSchema, makeOpsSchema, schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { S03_ACTIVE_OFFERS_SQL, S03_OFFERS_SQL, S03_POSTS_SQL, luong7 } from "../../pipeline/lib/ops-flow.mjs"

const S = `on5_app_${process.pid}`
const S_ERR = `on5_app_err_${process.pid}`
const S25 = `on25_l7_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động

/** Mốc đo ghim 00:30 giờ VN ngày 25/10 (17:30 UTC ngày 24) — ngày cuối của cửa sổ là ngày VN, không ngày UTC. */
const NOW = Date.parse("2026-10-24T17:30:00Z")
const DAYS = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"]
const vn = (s: string) => new Date(`${s}+07:00`).toISOString()

// [post_id, snapshot_id, posted_at (giờ VN), captured_at (giờ VN)] — bài 22:49 nạp sau nửa đêm, một bài mock.
const POSTS: [string, string, string, string][] = [
  ["p1", "hanoi__zalo-agent__2026-10-23T100000", "2026-10-23T10:00:00", "2026-10-23T10:05:00"],
  ["p2", "hanoi__zalo-agent__2026-10-24T000024", "2026-10-23T22:49:00", "2026-10-24T00:00:24"],
  ["p3", "hanoi__zalo-agent__2026-10-24T090000", "2026-10-24T09:00:00", "2026-10-24T09:01:00"],
  ["p4", "hanoi__zalo-agent__2026-10-25T001000", "2026-10-25T00:10:00", "2026-10-25T00:11:00"],
  ["m1", "hanoi__zalo-mock__2026-10-23T110000", "2026-10-23T11:00:00", "2026-10-23T11:00:00"],
]
// DF0 (26/10): bài đi chung ống snapshot `zalo-agent` nhưng không phải bài S03 thật — một bài S05 (tác tử FB), một bài
// nhóm TEST, một bài tác tử e2e. [post_id, snapshot_id, posted_at, captured_at, agent_id, group_name]; không bài nào được đếm.
const NOT_S03: [string, string, string, string, string, string][] = [
  ["f1", "hanoi__zalo-agent__2026-10-23T120000", "2026-10-23T12:00:00", "2026-10-23T12:01:00", "apify-facebook", "Nhóm FB"],
  ["t1", "hanoi__zalo-agent__2026-10-24T080000", "2026-10-24T08:00:00", "2026-10-24T08:01:00", "openclaw-hook", "TEST-G1"],
  ["e1", "hanoi__zalo-agent__2026-10-24T083000", "2026-10-24T08:30:00", "2026-10-24T08:31:00", "e2e-agent", "Nhóm A"],
]
// GN5 (dau-noi-dung-sql-bai-thu): bài thử của Mạnh mang dấu nội dung (testMarker «noi-dung») — ống snapshot, tác tử, nhóm đều
// thật, chỉ chữ bài lộ là bài thử. Ngày 22/10 không bài thật nào, nên mọi bài đếm lọt hiện thành một con số khác 0.
const NOI_DUNG: [string, string, string][] = [
  ["n1", "2026-10-22T09:00:00", "Bán căn [Tên sàn] giá tốt"],
  ["n2", "2026-10-22T10:00:00", "Xem ảnh https://abc.trycloudflare.com/x nhé"],
]
// [offer_id, source, first_seen (giờ VN), post_ids] — 23:59 và 00:01 hai bên nửa đêm, một tin S06 cùng ngày. post_ids (ON25) nối
// tin với bài đã có để cột «tin có bài hôm đó» có số; không đổi số bài hay số tin rao mới của ON5.
const OFFERS: [string, string, string, string[]][] = [
  ["o1", "S03", "2026-10-23T23:59:00", ["p2"]],
  ["o2", "S03", "2026-10-24T00:01:00", ["p3"]],
  ["o3", "S06", "2026-10-23T12:00:00", []],
  ["o4", "S03", "2026-10-23T10:00:00", ["p1", "p4"]],
]
/** Đáp án viết trước theo ngày (ngày không ghi = 0). */
const WANT_POSTS: Record<string, number> = { "2026-10-23": 2, "2026-10-24": 1, "2026-10-25": 1 }
const WANT_OFFERS: Record<string, number> = { "2026-10-23": 2, "2026-10-24": 1 }
const want = (m: Record<string, number>) => DAYS.map((d) => [d, m[d] ?? 0] as [string, number])

const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
before(async () => {
  try {
    await admin.connect()
    await makeOpsSchema(admin, S)
    // Đo hỏng chỉ ở khối luong7: khoá cũ zaloFlow (zaloExtras) đọc cùng hai bảng S03 nên vắng cả bảng thì cả lượt đẩy sập
    // (có từ trước ON5) — vắng cột posted_at, cột chỉ luong7 đọc.
    await makeOpsSchema(admin, S_ERR)
    await admin.query(`ALTER TABLE "${S_ERR}".stg_zalo_posts DROP COLUMN posted_at`)
    for (const t of ["listings", "airdna_listings"]) await admin.query(`CREATE TABLE "${S}".${t} (LIKE public.${t} INCLUDING ALL)`)
    for (const [id, snap, posted, captured] of POSTS)
      await admin.query(`INSERT INTO "${S}".stg_zalo_posts (post_id, snapshot_id, text, posted_at, captured_at) VALUES ($1, $2, 'bài thử', $3, $4)`, [
        id, snap, vn(posted), vn(captured),
      ])
    for (const [id, snap, posted, captured, agent, group] of NOT_S03)
      await admin.query(
        `INSERT INTO "${S}".stg_zalo_posts (post_id, snapshot_id, text, posted_at, captured_at, agent_id, group_name) VALUES ($1, $2, 'bài thử', $3, $4, $5, $6)`,
        [id, snap, vn(posted), vn(captured), agent, group],
      )
    for (const [id, posted, text] of NOI_DUNG)
      await admin.query(
        `INSERT INTO "${S}".stg_zalo_posts (post_id, snapshot_id, text, posted_at, captured_at, agent_id, group_name) VALUES ($1, 'hanoi__zalo-agent__2026-10-22T090000', $2, $3, $3, 'openclaw-hook', 'Nhóm thật')`,
        [id, text, vn(posted)],
      )
    for (const [id, source, seen, postIds] of OFFERS)
      await admin.query(`INSERT INTO "${S}".sale_offers (offer_id, kind, first_seen, last_seen, source, post_ids) VALUES ($1, 'sale', $2, $2, $3, $4)`, [id, vn(seen), source, postIds])
    await dungS25()
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  await dropOpsSchema(admin, S).catch(() => {})
  await dropOpsSchema(admin, S_ERR).catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S25}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end()
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

/** Lỗi theo ngày: «<ngày>: <cột> <được> ≠ <đáp án>» — rỗng là khớp. */
function loiCot(cot: string, got: [string, number][], wantRows: [string, number][]): string[] {
  const g = new Map(got)
  return wantRows.filter(([d, n]) => g.get(d) !== n).map(([d, n]) => `${d}: ${cot} ${g.get(d) ?? "vắng"} ≠ ${n}`)
}
async function flow() {
  const { getFlowDays } = await import("../src/lib/collections-queries")
  return getFlowDays(7, { now: NOW })
}
/** Chạy một câu SQL đếm theo ngày (bản thật hoặc bản đột biến) trên lược đồ tạm → [ngày, số] cho 7 ngày. */
async function demSql(sql: string): Promise<[string, number][]> {
  const { pool } = await import("../src/lib/db")
  const { rows } = await pool.query<{ d: string; n: number }>(sql, [vn("2026-10-19T00:00:00")])
  const m = new Map(rows.map((r) => [r.d, r.n]))
  return DAYS.map((d) => [d, m.get(d) ?? 0])
}

describe("ON5-AC-1 tin rao S03", () => {
  test("ON5-AC-1 tin rao chỉ đếm nguồn S03 theo ngày first_seen", async () => {
    ready()
    const days = await flow()
    const got = days.map((x) => [x.day, x.zaloOffers] as [string, number])
    console.log(`# ON5-AC-1 ${got.map(([d, n]) => `${d}=${n}`).join(" ")}`)
    assert.deepEqual(loiCot("tin rao", got, want(WANT_OFFERS)), [])
  })
  test("ON5-AC-1 bản sao đếm mọi nguồn → báo ngày và hai số", async () => {
    ready()
    const sai = await demSql(S03_OFFERS_SQL.replace(" AND source = 'S03'", ""))
    assert.deepEqual(loiCot("tin rao", sai, want(WANT_OFFERS)), ["2026-10-23: tin rao 3 ≠ 2"])
  })
})

describe("ON5-AC-2 bài thô S03", () => {
  test("ON5-AC-2 bài thô đếm bài S03 thật theo ngày posted_at", async () => {
    ready()
    const days = await flow()
    const got = days.map((x) => [x.day, x.zaloPosts] as [string, number])
    console.log(`# ON5-AC-2 ${got.map(([d, n]) => `${d}=${n}`).join(" ")}`)
    assert.deepEqual(loiCot("bài thô", got, want(WANT_POSTS)), [])
  })
  test("DF0 bản sao lọc theo snapshot_id như cũ → đếm cả bài S05 và bài thử, báo ngày và hai số", async () => {
    ready()
    const cu = S03_POSTS_SQL.replace(/ AND coalesce\(agent_id[\s\S]*? GROUP BY/, " GROUP BY")
    assert.notEqual(cu, S03_POSTS_SQL, "đột biến phải bỏ được ba điều kiện DF0")
    const sai = await demSql(cu)
    // GN5: đột biến bỏ luôn vế nội dung, nên hai bài nội dung thử ngày 22/10 cũng lọt.
    assert.deepEqual(loiCot("bài thô", sai, want(WANT_POSTS)), ["2026-10-22: bài thô 2 ≠ 0", "2026-10-23: bài thô 3 ≠ 2", "2026-10-24: bài thô 3 ≠ 1"])
  })
  test("ON5-AC-2 bản sao đếm theo captured_at → báo ngày và hai số", async () => {
    ready()
    const sai = await demSql(S03_POSTS_SQL.replaceAll("posted_at", "captured_at"))
    assert.deepEqual(loiCot("bài thô", sai, want(WANT_POSTS)), ["2026-10-23: bài thô 1 ≠ 2", "2026-10-24: bài thô 2 ≠ 1"])
  })
})

// ---------- AC-7: trang máy thu ----------

// ON6 (collections-khong-so-s02, luật 5) bỏ hai cột S02 khỏi bảng ở máy thu.
const COT_MAY_THU = ["day", "airbnbSeen", "airbnbSnapshots", "zaloPosts", "zaloOffers", "s03ActiveOffers"]

async function render(el: unknown): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server")
  return renderToStaticMarkup(el as React.ReactElement)
}
const thIds = (html: string) => [...html.slice(html.indexOf("<thead"), html.indexOf("</thead>")).matchAll(/<th[^>]*data-col-id="([^"]+)"/g)].map((m) => m[1])
const thieuCot = (ids: string[]) => COT_MAY_THU.filter((c) => !ids.includes(c))
const MAU = DAYS.map((day) => ({ day, airbnbListingsSeen: 3, airbnbSnapshots: 4, zaloPosts: 5, zaloOffers: 6, s03ActiveOffers: 7 }))

describe("ON5-AC-7 trang máy thu", () => {
  test("ON5-AC-7 máy thu đủ cột như main (trừ hai cột S02 ON6 gỡ), mô tả nói giờ VN và ngày đăng bài", async () => {
    const { FlowTable } = await import("../src/components/ops/collections-tables")
    const html = await render(<FlowTable days={MAU} />)
    assert.deepEqual(thIds(html), COT_MAY_THU)
    assert.ok(html.includes("giờ VN"), "mô tả thiếu «giờ VN»")
    assert.ok(html.includes("ngày đăng bài"), "mô tả thiếu «ngày đăng bài»")
    assert.ok(!html.includes("giờ máy"), "mô tả còn «giờ máy»")
  })
  test("ON5-AC-7 bản sao thiếu một cột → báo cột thiếu", async () => {
    const { FlowTable } = await import("../src/components/ops/collections-tables")
    const html = (await render(<FlowTable days={MAU} />)).replace(/<th[^>]*data-col-id="airbnbSnapshots"[\s\S]*?<\/th>/, "")
    assert.deepEqual(thieuCot(thIds(html)), ["airbnbSnapshots"])
  })
})

// ---------- AC-3, AC-4: khối `luong7` của bản tin (bên ghi thật) ----------

type Day7 = { day: string; s03Posts: number; s03Offers: number; s03ActiveOffers?: number }
type Payload = Record<string, unknown> & { pushedAt: string; blocks: Record<string, Record<string, unknown>> }
const push = (opts: Record<string, unknown> = {}, schema = S) =>
  captureOpsFacts({
    ...opts,
    env: { DATABASE_URL: schemaUrl(schema), OPS_FACTS_NOW: new Date(NOW).toISOString(), ...((opts.env as object) ?? {}) },
  }) as Promise<{ code: number; stderr: string; payload: Payload }>
const DAYS_SRC = "days: await luong7(client, { now: now.getTime() })"

/** Lỗi khuôn khối `luong7` so với 7 ngày VN viết trước: «luong7: …» — rỗng là đạt. */
function loiKhoi(payload: Payload | undefined): string[] {
  const b = payload?.blocks?.luong7
  if (!b) return ["luong7: vắng"]
  const out: string[] = []
  if (typeof b.measured_at !== "string" || !Number.isFinite(Date.parse(b.measured_at))) out.push("luong7: thiếu measured_at")
  const days = (b.days ?? []) as Day7[]
  const keys = days.map((d) => d.day)
  for (const d of DAYS) if (!keys.includes(d)) out.push(`luong7: thiếu ngày ${d}`)
  for (const k of keys) if (!DAYS.includes(k)) out.push(`luong7: thừa ngày ${k}`)
  if (keys.join() !== [...keys].sort().join() || new Set(keys).size !== keys.length) out.push("luong7: ngày không liên tiếp cũ → mới")
  for (const d of days)
    if (!Number.isInteger(d.s03Posts) || !Number.isInteger(d.s03Offers)) out.push(`luong7: ngày ${d.day} thiếu số`)
  return out
}

describe("ON5-AC-3 khối luong7", () => {
  test("ON5-AC-3 khối luong7 có measured_at và đúng 7 khoá ngày VN liên tiếp", async () => {
    ready()
    const r = await push()
    assert.equal(r.code, 0, r.stderr.slice(0, 800))
    assert.deepEqual(r.stderr.split("\n").filter((l) => l.startsWith("FACTS CHẶN")), [], "bộ soát tầng A chặn bản tin")
    assert.deepEqual(loiKhoi(r.payload), [])
    const days = r.payload.blocks.luong7.days as Day7[]
    console.log(`# ON5-AC-3 ${days.map((d) => `${d.day}:${d.s03Posts}/${d.s03Offers}`).join(" ")}`)
    assert.deepEqual(
      days.filter((d) => !(d.day in WANT_POSTS) && !(d.day in WANT_OFFERS)).map((d) => d.s03Posts + d.s03Offers),
      [0, 0, 0, 0],
      "ngày rỗng phải ghi 0",
    )
  })
  test("ON5-AC-3 bảng vắng (cột posted_at) → khối mang error, khối khác vẫn đi", async () => {
    ready()
    const r = await push({}, S_ERR)
    assert.equal(r.code, 0, r.stderr.slice(0, 800))
    const b = r.payload.blocks.luong7
    assert.match(String(b.error ?? ""), /^không đo được/)
    assert.equal(b.days, undefined, "khối lỗi không được mang số")
    assert.equal(r.payload.blocks.reviewQueue.error, undefined, "khối khác phải vẫn đo được")
  })
  test("ON5-AC-3 bên ghi bỏ một ngày → báo ngày thiếu", async () => {
    ready()
    const f = mutantPush("on5-bo-ngay.mjs", (src: string) => src.replace(DAYS_SRC, `days: (await luong7(client, { now: now.getTime() })).slice(1)`))
    assert.deepEqual(loiKhoi((await push({ script: f })).payload), ["luong7: thiếu ngày 2026-10-19"])
  })
  test("ON5-AC-3 bên ghi bỏ measured_at → báo tên khối", async () => {
    ready()
    const f = mutantPush("on5-bo-moc.mjs", (src: string) => src.replace("luong7: luong7Block,", "luong7: (({ measured_at, ...x }) => x)(luong7Block),"))
    assert.deepEqual(loiKhoi((await push({ script: f })).payload), ["luong7: thiếu measured_at"])
  })
})

/** Ngày lệch giữa khối và hai cột S03 của getFlowDays: «<ngày>: <cột> khối <a> ≠ trang <b>». */
async function lechKhoi(payload: Payload): Promise<string[]> {
  const page = new Map((await flow()).map((d) => [d.day, d]))
  const out: string[] = []
  for (const d of payload.blocks.luong7.days as Day7[]) {
    const p = page.get(d.day)
    if (p?.zaloPosts !== d.s03Posts) out.push(`${d.day}: bài thô khối ${d.s03Posts} ≠ trang ${p?.zaloPosts}`)
    if (p?.zaloOffers !== d.s03Offers) out.push(`${d.day}: tin rao khối ${d.s03Offers} ≠ trang ${p?.zaloOffers}`)
    if (p?.s03ActiveOffers !== d.s03ActiveOffers) out.push(`${d.day}: s03ActiveOffers khối ${d.s03ActiveOffers} ≠ trang ${p?.s03ActiveOffers}`)
  }
  return out
}

describe("ON5-AC-4 khối bằng trang máy thu", () => {
  test("ON5-AC-4 khối luong7 bằng hai cột S03 của getFlowDays trên cùng lược đồ", async () => {
    ready()
    const r = await push()
    assert.equal(r.code, 0, r.stderr.slice(0, 800))
    assert.deepEqual(await lechKhoi(r.payload), [])
  })
  test("ON5-AC-4 bên ghi đếm mọi nguồn → báo ngày lệch", async () => {
    ready()
    const f = mutantPush("on5-moi-nguon.mjs", (src: string) =>
      src.replace(
        DAYS_SRC,
        `days: await (async () => { const r = await luong7(client, { now: now.getTime() }); const { rows } = await client.query("SELECT (first_seen AT TIME ZONE 'Asia/Ho_Chi_Minh')::date::text d, count(*)::int n FROM sale_offers GROUP BY 1"); const m = new Map(rows.map((x) => [x.d, x.n])); return r.map((x) => ({ ...x, s03Offers: m.get(x.day) ?? 0 })); })()`,
      ))
    assert.deepEqual(await lechKhoi((await push({ script: f })).payload), ["2026-10-23: tin rao khối 3 ≠ trang 2"])
  })
})

// ---------- GN5 dau-noi-dung-sql-bai-thu AC-2: bài nội dung thử không vào «Bài nhận» ở cả hai bên ----------

/** Bản S03_POSTS_SQL của app, rút từ mã nguồn rồi dựng như lúc chạy (template literal thật, ${VN_TZ} → giờ VN). */
function appS03PostsSql(): string {
  const src = readFileSync(new URL("../src/lib/collections-queries.ts", import.meta.url), "utf8")
  const m = src.match(/const S03_POSTS_SQL = `([^`]*)`/)
  assert.ok(m, "không rút được S03_POSTS_SQL trong collections-queries.ts")
  return new Function("VN_TZ", `return \`${m[1]}\`;`)("Asia/Ho_Chi_Minh") as string
}

describe("DND-AC-2 Luồng 7 ngày không đếm bài nội dung thử", () => {
  test("DND-AC-2 bên ghi và trang máy thu cùng bỏ bài nội dung thử, hai bên bằng nhau", async () => {
    ready()
    const { pool } = await import("../src/lib/db")
    const { rows } = await pool.query<{ n: number }>(`SELECT count(*)::int n FROM stg_zalo_posts WHERE post_id IN ('n1','n2')`)
    assert.equal(rows[0].n, 2, "đối chứng: hai bài nội dung thử nằm trong bảng nạp")
    const got = (await flow()).map((x) => [x.day, x.zaloPosts] as [string, number])
    assert.deepEqual(loiCot("bài thô", got, want(WANT_POSTS)), [], "trang máy thu")
    const r = await push()
    assert.equal(r.code, 0, r.stderr.slice(0, 800))
    const khoi = (r.payload.blocks.luong7.days as Day7[]).map((d) => [d.day, d.s03Posts] as [string, number])
    assert.deepEqual(loiCot("bài thô", khoi, want(WANT_POSTS)), [], "khối luong7 của bên ghi")
    assert.deepEqual(await lechKhoi(r.payload), [])
  })
  test("DND-AC-2 bản chép app bỏ vế nội dung → báo ngày và hai số", async () => {
    ready()
    const app = appS03PostsSql()
    const bo = app.replace(/ AND NOT \(normalize\(coalesce\(text, ''\), NFC\) ~\* '[^']*'\)/, "")
    assert.notEqual(bo, app, "đột biến phải bỏ được vế nội dung của bản app")
    assert.deepEqual(loiCot("bài thô", await demSql(app), want(WANT_POSTS)), [], "bản app nguyên vẹn")
    assert.deepEqual(loiCot("bài thô", await demSql(bo), want(WANT_POSTS)), ["2026-10-22: bài thô 2 ≠ 0"])
  })
})

// ---------- AC-5, AC-6: bảng trên máy chủ — bản tin bên ghi thật → ops_heartbeat → readOpsFacts → SSR ----------

const S03_KEY = { zaloPosts: "s03Posts", zaloOffers: "s03Offers" } as const
const WANT_KHOI: Record<"s03Posts" | "s03Offers", Record<string, number>> = { s03Posts: WANT_POSTS, s03Offers: WANT_OFFERS }

async function ghiBanTin(payload: Payload | null) {
  if (payload === null) return void (await admin.query(`DELETE FROM "${S}".ops_heartbeat`))
  await admin.query(
    `INSERT INTO "${S}".ops_heartbeat (id, payload, pushed_at) VALUES ('primary', $1, now())
     ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, pushed_at = EXCLUDED.pushed_at`,
    [payload],
  )
}
/** Trang Thu thập ở chế độ máy chủ dựng từ bản tin đang nằm trong ops_heartbeat của lược đồ tạm. */
async function trangMayChu({ now = new Date(), staleTable }: { now?: Date; staleTable?: boolean } = {}) {
  const { getCloudOpsView } = await import("../src/lib/ops-cloud")
  const { getCloudFlowDays } = await import("../src/lib/collections-queries")
  const { CollectionsView } = await import("../src/components/ops/collections/collections-view")
  const cloud = await getCloudOpsView({ now })
  const cloudDays = cloud.state === "none" ? [] : await getCloudFlowDays(cloud.luong7, { now: NOW })
  const EMPTY = { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 }
  let html = await render(
    <CollectionsView
      days={[]}
      funnel={{ lastEventAt: null, today: EMPTY, last7: EMPTY }}
      jobs={[]}
      rotation={{ updatedAt: null, cursor: 0, total: 0, next: [] }}
      zaloGroups={[]}
      zaloAllowlist={[]}
      zaloHealth={{ connected: null, uptime24h: null, heartbeatAgeMin: null, lastHeartbeatAt: null, lastPostAt: null, silentAlert24h: false, driftAlert24h: false }}
      factsPushedAt={null}
      feedHealth={cloud.feeds ?? []}
      lockdown={{ layers: [], lastWatchdogAt: null, agentTurnsToday: null, openClawUp: false, kevUp: false, collectorUp: false }}
      nowMs={NOW}
      cloud={cloud}
      cloudDays={cloudDays}
    />,
  )
  if (staleTable !== undefined) {
    // bản sao: bảng luồng dựng lại với cờ mờ cố định (chiều đỏ «luôn mờ» / «không mờ»)
    const { CloudFlowTable } = await import("../src/components/ops/collections-tables")
    html = html.replace(bangLuong(html) ?? "\u0000", bangLuong(await render(<CloudFlowTable days={cloudDays} stale={staleTable} />)) ?? "")
  }
  return { cloud, html }
}
function bangLuong(html: string): string | null {
  return [...html.matchAll(/<table[\s\S]*?<\/table>/g)].map((m) => m[0]).find((t) => t.includes('data-col-id="zaloOffers"')) ?? null
}
const chu = (td: string) => td.replace(/<[^>]+>/g, "").trim()
const alertMayThu = (html: string) => html.match(/>([^<>]*) đo trực tiếp trên máy thu/)?.[1] ?? ""

/** Lỗi của bảng «Luồng 7 ngày» trên máy chủ so với đáp án: số S03 (hoặc «—»), lớp mờ từng ô, ô snapshot, cột S02. */
function loiBangMayChu(html: string, want: "so" | "gach", mo: boolean): string[] {
  const t = bangLuong(html)
  if (!t) return ["bảng Luồng 7 ngày vắng"]
  const out: string[] = []
  const ids = thIds(t)
  for (const c of ["airdnaMarkets", "airdnaListings"]) if (ids.includes(c)) out.push(`cột S02 ${c} có mặt`)
  const rows = [...t.slice(t.indexOf("<tbody")).matchAll(/<tr[\s\S]*?<\/tr>/g)]
    .map((m) => [...m[0].matchAll(/<td[\s\S]*?<\/td>/g)].map((x) => x[0]))
    .filter((r) => r.length === ids.length)
  if (rows.length !== 7) out.push(`số hàng ${rows.length} ≠ 7`)
  for (const r of rows) {
    const day = chu(r[ids.indexOf("day")])
    const snap = chu(r[ids.indexOf("airbnbSnapshots")] ?? "")
    if (snap !== "Chỉ ở máy thu") out.push(`${day}: airbnbSnapshots «${snap}» ≠ «Chỉ ở máy thu»`)
    for (const [col, key] of Object.entries(S03_KEY)) {
      const td = r[ids.indexOf(col)] ?? ""
      const exp = want === "gach" ? "—" : String(WANT_KHOI[key][day] ?? 0)
      if (chu(td) !== exp) out.push(`${day}: ${key} «${chu(td)}» ≠ «${exp}»`)
      if (want === "so" && td.includes("text-muted-foreground") !== mo) out.push(`${day}: ${key} ${mo ? "không mờ" : "mờ"}`)
    }
  }
  return out
}

describe("ON5-AC-5 bảng trên máy chủ, bản tin tươi", () => {
  test("ON5-AC-5 vòng trọn: bản tin bên ghi thật qua readOpsFacts → 14 ô S03 bằng số viết trước, không ô nào mờ", async () => {
    ready()
    const r = await push()
    assert.equal(r.code, 0, r.stderr.slice(0, 800))
    await ghiBanTin(r.payload)
    const { cloud, html } = await trangMayChu()
    assert.equal(cloud.state, "fresh")
    assert.deepEqual(loiBangMayChu(html, "so", false), [])
    const t = bangLuong(html)!
    console.log(`# ON5-AC-5 cột ${thIds(t).join(",")} · Alert «${alertMayThu(html)}»`)
  })
  test("ON5-AC-5 máy chủ tươi: 7 ô snapshot «Chỉ ở máy thu», không cột S02, Alert bỏ «Luồng 7 ngày»", async () => {
    ready()
    await ghiBanTin((await push()).payload)
    const { html } = await trangMayChu()
    const t = bangLuong(html)!
    assert.equal((t.match(/Chỉ ở máy thu/g) ?? []).length, 7)
    assert.deepEqual(thIds(t), ["day", "airbnbSeen", "airbnbSnapshots", "zaloPosts", "zaloOffers", "s03ActiveOffers"])
    assert.ok(alertMayThu(html).length > 0, "Alert «Phần còn lại…» vắng")
    assert.ok(!alertMayThu(html).includes("Luồng 7 ngày"), `Alert còn «Luồng 7 ngày»: ${alertMayThu(html)}`)
  })
  test("ON5-AC-5 bên ghi đổi tên khoá → báo tên khoá và ô «—»", async () => {
    ready()
    const f = mutantPush("on5-doi-khoa.mjs", (src: string) =>
      src.replace(DAYS_SRC, `days: (await luong7(client, { now: now.getTime() })).map(({ s03Offers, ...x }) => ({ ...x, s03_offers: s03Offers }))`))
    await ghiBanTin((await push({ script: f })).payload)
    const loi = loiBangMayChu((await trangMayChu()).html, "so", false)
    assert.ok(loi.includes("2026-10-23: s03Offers «—» ≠ «2»"), loi.join(" | "))
    assert.ok(loi.every((l) => l.includes("s03Offers «—»")), loi.join(" | "))
  })
  test("ON5-AC-5 bản sao ô snapshot là 0 → báo", async () => {
    ready()
    await ghiBanTin((await push()).payload)
    const { html } = await trangMayChu()
    const t = bangLuong(html)!
    assert.deepEqual(loiBangMayChu(html.replace(t, t.replace("Chỉ ở máy thu", "0")), "so", false), ["2026-10-25: airbnbSnapshots «0» ≠ «Chỉ ở máy thu»"])
  })
  test("ON5-AC-5 bản sao còn cột S02 → báo", async () => {
    ready()
    await ghiBanTin((await push()).payload)
    const { html } = await trangMayChu()
    const t = bangLuong(html)!
    const sao = t.replace("<th ", '<th data-col-id="airdnaMarkets">S02</th><th ') // «<th » — không khớp nhầm «<thead»
    assert.ok(loiBangMayChu(html.replace(t, sao), "so", false).includes("cột S02 airdnaMarkets có mặt"))
  })
  test("ON5-AC-5 bản sao luôn mờ ô S03 → báo tên ô", async () => {
    ready()
    await ghiBanTin((await push()).payload)
    const loi = loiBangMayChu((await trangMayChu({ staleTable: true })).html, "so", false)
    assert.equal(loi.length, 14, loi.join(" | "))
    assert.ok(loi.includes("2026-10-23: s03Posts mờ"), loi.join(" | "))
  })
})

describe("ON5-AC-6 bảng trên máy chủ, ba trạng thái", () => {
  test("ON5-AC-6 thiếu khối → 14 ô S03 «—», không 0", async () => {
    ready()
    const p = (await push()).payload
    for (const khoi of [undefined, { measured_at: new Date().toISOString(), error: "không đo được: thử" }]) {
      const sao = structuredClone(p)
      if (khoi) sao.blocks.luong7 = khoi
      else delete sao.blocks.luong7
      await ghiBanTin(sao)
      const { cloud, html } = await trangMayChu()
      assert.equal(cloud.luong7, null)
      assert.deepEqual(loiBangMayChu(html, "gach", false), [], khoi ? "khối lỗi" : "khối vắng")
    }
  })
  test("ON5-AC-6 bản tin cũ → cả 14 ô S03 mờ (đọc từng ô)", async () => {
    ready()
    const p = (await push()).payload
    await ghiBanTin(p)
    const { cloud, html } = await trangMayChu({ now: new Date(Date.parse(p.pushedAt) + 46 * 60_000) })
    assert.equal(cloud.state, "stale")
    assert.deepEqual(loiBangMayChu(html, "so", true), [])
  })
  test("ON5-AC-6 chưa có bản tin → không bảng, Alert còn «Luồng 7 ngày»", async () => {
    ready()
    await ghiBanTin(null)
    const { cloud, html } = await trangMayChu()
    assert.equal(cloud.state, "none")
    assert.equal(bangLuong(html), null, "chưa có bản tin mà vẫn dựng bảng")
    assert.ok(alertMayThu(html).includes("Luồng 7 ngày"), `Alert thiếu «Luồng 7 ngày»: ${alertMayThu(html)}`)
  })
  test("ON5-AC-6 bản sao hiện 0 khi khối vắng → báo", async () => {
    ready()
    const p = structuredClone((await push()).payload)
    delete p.blocks.luong7
    await ghiBanTin(p)
    const { html } = await trangMayChu()
    const t = bangLuong(html)!
    const loi = loiBangMayChu(html.replace(t, t.replaceAll(">—<", ">0<")), "gach", false)
    assert.equal(loi.length, 14, loi.join(" | "))
    assert.ok(loi.includes("2026-10-25: s03Posts «0» ≠ «—»"), loi.join(" | "))
  })
  test("ON5-AC-6 bản sao không mờ khi bản tin cũ → báo tên ô", async () => {
    ready()
    const p = (await push()).payload
    await ghiBanTin(p)
    const loi = loiBangMayChu((await trangMayChu({ now: new Date(Date.parse(p.pushedAt) + 46 * 60_000), staleTable: false })).html, "so", true)
    assert.equal(loi.length, 14, loi.join(" | "))
    assert.ok(loi.includes("2026-10-24: s03Offers không mờ"), loi.join(" | "))
  })
})

// =====================================================================================================================
// ON25 (ops-hien-dung-chang-s03) — cột «tin có bài hôm đó» (s03ActiveOffers) của Luồng 7 ngày.
// =====================================================================================================================

// Lược đồ riêng S25: sale_offers là VIEW dựng từ đúng định nghĩa của public trên sale_offer_records (tin đã nghỉ rời view như
// thật). Ma trận viết trước, mỗi ô một ngày VN của cửa sổ 19–25/10: [ô, post_ids của tin, nguồn, first_seen, nghỉ, bài (giờ VN)].
const O25: { o: string; nguon: string; dau: string; nghi: boolean; bai: string[] }[] = [
  { o: "19 tin mới một bài", nguon: "S03", dau: "2026-10-19T09:00:00", nghi: false, bai: ["2026-10-19T09:00:00"] },
  { o: "20 tin cũ đăng lại", nguon: "S03", dau: "2026-10-10T09:00:00", nghi: false, bai: ["2026-10-10T09:00:00", "2026-10-20T09:00:00"] },
  { o: "21 một tin ba bài cùng ngày", nguon: "S03", dau: "2026-10-21T08:00:00", nghi: false, bai: ["2026-10-21T08:00:00", "2026-10-21T12:00:00", "2026-10-21T18:00:00"] },
  { o: "22 tin S05", nguon: "S05", dau: "2026-10-22T09:00:00", nghi: false, bai: ["2026-10-22T09:00:00"] },
  { o: "23 tin S03 đã nghỉ", nguon: "S03", dau: "2026-10-23T09:00:00", nghi: true, bai: ["2026-10-23T09:00:00"] },
]
/** Bài S03 ngày 24 không thuộc tin nào; ngày 25 không bài. */
const BAI_LE = "2026-10-24T09:00:00"
const WANT_ACTIVE: Record<string, number> = { "2026-10-19": 1, "2026-10-20": 1, "2026-10-21": 1, "2026-10-22": 0, "2026-10-23": 0, "2026-10-24": 0, "2026-10-25": 0 }
const WANT_MOI25: Record<string, number> = { "2026-10-19": 1, "2026-10-21": 1 }

async function dungS25() {
  const { rows: [v] } = await admin.query(`SELECT pg_get_viewdef('public.sale_offers'::regclass, true) AS def`)
  await admin.query(`DROP SCHEMA IF EXISTS "${S25}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S25}"`)
  await admin.query(`CREATE TABLE "${S25}".stg_zalo_posts (LIKE public.stg_zalo_posts INCLUDING DEFAULTS)`)
  await admin.query(`CREATE TABLE "${S25}".sale_offer_records (LIKE public.sale_offer_records INCLUDING DEFAULTS)`)
  await admin.query(`SET search_path = "${S25}"`)
  try {
    await admin.query(`CREATE VIEW "${S25}".sale_offers AS ${v.def}`)
  } finally {
    await admin.query(`SET search_path = DEFAULT`)
  }
  let n = 0
  const bai = async (luc: string) => {
    const id = `on25p-${++n}`
    await admin.query(`INSERT INTO "${S25}".stg_zalo_posts (post_id, snapshot_id, text, posted_at, captured_at) VALUES ($1, 'hanoi__zalo-agent__on25', 'bài', $2, $2)`, [id, vn(luc)])
    return id
  }
  let k = 0
  for (const t of O25) {
    const ids = []
    for (const luc of t.bai) ids.push(await bai(luc))
    await admin.query(`INSERT INTO "${S25}".sale_offer_records (offer_id, kind, property_type, confidence, first_seen, last_seen, n_reposts, post_ids,
        source, field_provenance, offer_status, retired_at) VALUES ($1, 'sale', 'apartment', 'medium', $2, $2, $3, $4, $5, '{}', 'active', $6)`,
      [`on25o-${++k}`, vn(t.dau), ids.length, ids, t.nguon, t.nghi ? vn(t.dau) : null])
  }
  await bai(BAI_LE)
}
const urlS25 = () => schemaUrl(S25)
async function demS25(sql: string): Promise<[string, number][]> {
  const c = new pg.Client({ connectionString: urlS25() })
  await c.connect()
  try {
    const { rows } = await c.query<{ d: string; n: number }>(sql, [vn("2026-10-19T00:00:00")])
    const m = new Map(rows.map((r) => [r.d, r.n]))
    return DAYS.map((d) => [d, m.get(d) ?? 0])
  } finally {
    await c.end()
  }
}

describe("ON25-AC-4 tin có bài hôm đó (bên ghi)", () => {
  test("ON25-AC-4 luong7 đếm s03ActiveOffers đúng bảy ô viết trước, mỗi ngày tin rao mới ≤ tin có bài", async () => {
    ready()
    const c = new pg.Client({ connectionString: urlS25() })
    await c.connect()
    try {
      const days = await luong7(c, { now: NOW })
      assert.deepEqual(days.map((d) => d.day), DAYS)
      for (const d of days) assert.ok("s03ActiveOffers" in d, `${d.day}: khối thiếu khoá s03ActiveOffers`)
      const got = days.map((d) => [d.day, d.s03ActiveOffers] as [string, number])
      console.log(`# ON25-AC-4 ${got.map(([d, x]) => `${d}=${x}`).join(" ")}`)
      assert.deepEqual(loiCot("s03ActiveOffers", got, want(WANT_ACTIVE)), [])
      assert.deepEqual(loiCot("tin rao mới", days.map((d) => [d.day, d.s03Offers] as [string, number]), want(WANT_MOI25)), [])
      for (const d of days) assert.ok(d.s03Offers <= d.s03ActiveOffers, `${d.day}: tin rao mới ${d.s03Offers} > tin có bài ${d.s03ActiveOffers}`)
    } finally {
      await c.end()
    }
  })
  test("ON25-AC-4 đột biến đếm bài thay vì tin → ô ba bài cùng ngày đỏ", async () => {
    ready()
    const sai = await demS25(S03_ACTIVE_OFFERS_SQL.replace("count(DISTINCT o.offer_id)", "count(*)"))
    assert.deepEqual(loiCot("s03ActiveOffers", sai, want(WANT_ACTIVE)), ["2026-10-21: s03ActiveOffers 3 ≠ 1"])
  })
  test("ON25-AC-4 đột biến bỏ lọc nguồn S03 → ô S05 đỏ", async () => {
    ready()
    const sai = await demS25(S03_ACTIVE_OFFERS_SQL.replace("o.source = 'S03' AND ", ""))
    assert.deepEqual(loiCot("s03ActiveOffers", sai, want(WANT_ACTIVE)), ["2026-10-22: s03ActiveOffers 1 ≠ 0"])
  })
  test("ON25-AC-4 đột biến đếm cả tin đã nghỉ (sale_offer_records) → ô tin nghỉ đỏ", async () => {
    ready()
    const sai = await demS25(S03_ACTIVE_OFFERS_SQL.replace("FROM sale_offers o", "FROM sale_offer_records o"))
    assert.deepEqual(loiCot("s03ActiveOffers", sai, want(WANT_ACTIVE)), ["2026-10-23: s03ActiveOffers 1 ≠ 0"])
  })
})

/** Bản S03_ACTIVE_OFFERS_SQL của app, rút từ mã nguồn rồi dựng như lúc chạy. */
function appS03ActiveSql(src = readFileSync(new URL("../src/lib/collections-queries.ts", import.meta.url), "utf8")): string {
  const m = src.match(/const S03_ACTIVE_OFFERS_SQL = `([^`]*)`/)
  assert.ok(m, "không rút được S03_ACTIVE_OFFERS_SQL trong collections-queries.ts")
  return new Function("VN_TZ", `return \`${m[1]}\`;`)("Asia/Ho_Chi_Minh") as string
}

describe("ON25-AC-5 tin có bài: trang máy thu bằng khối", () => {
  test("ON25-AC-5 S03_ACTIVE_OFFERS_SQL của app trùng bản ops-flow; getFlowDays bằng khối luong7 từng ngày", async () => {
    ready()
    assert.equal(appS03ActiveSql(), S03_ACTIVE_OFFERS_SQL, "S03_ACTIVE_OFFERS_SQL của app lệch bản ops-flow.mjs")
    const page = (await flow()).map((d) => [d.day, d.s03ActiveOffers] as [string, number])
    // Lược đồ ON5: o1 (p2, 23/10), o2 (p3, 24/10), o4 (p1 23/10, p4 25/10); o3 là S06.
    assert.deepEqual(loiCot("s03ActiveOffers", page, want({ "2026-10-23": 2, "2026-10-24": 1, "2026-10-25": 1 })), [])
    const r = await push()
    assert.equal(r.code, 0, r.stderr.slice(0, 800))
    assert.deepEqual(await lechKhoi(r.payload), [])
  })
  test("ON25-AC-5 bản app bỏ DISTINCT → báo S03_ACTIVE_OFFERS_SQL lệch", () => {
    const src = readFileSync(new URL("../src/lib/collections-queries.ts", import.meta.url), "utf8").replace("count(DISTINCT o.offer_id)", "count(o.offer_id)")
    assert.throws(() => assert.equal(appS03ActiveSql(src), S03_ACTIVE_OFFERS_SQL, "S03_ACTIVE_OFFERS_SQL của app lệch bản ops-flow.mjs"), /S03_ACTIVE_OFFERS_SQL/)
  })
})

describe("ON25-AC-6 tin có bài trên máy chủ", () => {
  /** Lỗi của bộ dựng ngày cloud: khối mới → đúng số; khối cũ thiếu khoá → null; khối vắng → null. */
  async function loiCloud(dung: (l7: Day7[] | null, o: { now: number }) => Promise<{ day: string; s03ActiveOffers: number | null }[]>) {
    const out: string[] = []
    const moi = DAYS.map((day, i) => ({ day, s03Posts: 1, s03Offers: 1, s03ActiveOffers: 10 + i }))
    const cu = DAYS.map((day) => ({ day, s03Posts: 1, s03Offers: 1 }))
    for (const d of await dung(moi, { now: NOW })) {
      const w = 10 + DAYS.indexOf(d.day)
      if (d.s03ActiveOffers !== w) out.push(`${d.day}: s03ActiveOffers khối mới ${d.s03ActiveOffers} ≠ ${w}`)
    }
    for (const d of await dung(cu, { now: NOW })) if (d.s03ActiveOffers !== null) out.push(`${d.day}: s03ActiveOffers khối cũ ${d.s03ActiveOffers} ≠ null`)
    for (const d of await dung(null, { now: NOW })) if (d.s03ActiveOffers !== null) out.push(`${d.day}: s03ActiveOffers khối vắng ${d.s03ActiveOffers} ≠ null`)
    return out
  }
  test("ON25-AC-6 khối mới cho số, khối cũ thiếu khoá và khối vắng cho null (không 0)", async () => {
    ready()
    const { getCloudFlowDays } = await import("../src/lib/collections-queries")
    assert.deepEqual(await loiCloud(getCloudFlowDays), [])
  })
  test("ON25-AC-6 đột biến «?? 0» → khối cũ đỏ, thông điệp nêu s03ActiveOffers", async () => {
    ready()
    const { getCloudFlowDays } = await import("../src/lib/collections-queries")
    const pha = async (l7: Day7[] | null, o: { now: number }) =>
      (await getCloudFlowDays(l7, o)).map((d) => ({ ...d, s03ActiveOffers: d.s03ActiveOffers ?? 0 }))
    const loi = await loiCloud(pha)
    assert.ok(loi.length === 14 && loi.every((l) => /s03ActiveOffers khối (cũ|vắng) 0 ≠ null/.test(l)), loi.join(" | "))
  })
})
