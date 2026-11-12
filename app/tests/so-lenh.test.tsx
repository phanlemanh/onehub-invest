// so-lenh.test.tsx — hồ sơ _acceptance/so-lenh-bo-ap (TV4), ca route cloud: «SL-AC-2» (tạo lệnh), «SL-AC-3» (duyệt),
// «SL-AC-4» (kéo bằng token máy), «SL-AC-8» (kết quả qua ingest), «SL-AC-9» (danh sách + mốc kéo cuối), «SL-NOI»
// (đầu-cuối: route thật ↔ pipeline/ops-apply.mjs thật ↔ push-ops-facts.mjs thật). Chạy dưới db/db-thu.sh (executor
// so_lenh_app). Lược đồ CLOUD tạm (không source_registry; ops_audit do 091 tạo) cho pool của app; lược đồ MÁY THU tạm
// (source_registry + 047 + 091) cho bộ áp. public không được chạm.
import { after, before, beforeEach, test } from "node:test"
import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import http from "node:http"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { chay091, dungCloud, dungMayThu } from "../../pipeline/scripts/so-lenh-fixture.mjs"
import { chay047, chupPublic, xoaLuocDo } from "../../pipeline/scripts/vong-doi-fixture.mjs"
import { dungBangPhien, taoNguoi } from "./helpers/phien-thu"

const APP = join(dirname(fileURLToPath(import.meta.url)), "..")
const GOC = join(APP, "..")
const S = `sl_app_${process.pid}`
const M = `sl_may_${process.pid}`
const CHUNG = "sl-thu-bearer-chung-0123456789"
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = CHUNG

const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })
const mc = new pg.Client({ connectionString: schemaUrl(M) })
let publicTruoc: unknown
const nguoi: Record<string, { id: string; cookie: string }> = {}

before(async () => {
  await admin.connect()
  publicTruoc = await chupPublic(admin)
  await dungCloud(admin, S)
  await dungBangPhien(admin, S)
  await sc.connect()
  await chay091(sc)
  for (const vai of ["viewer", "ops", "admin", "owner"]) nguoi[vai] = await taoNguoi(sc, vai)
  nguoi.admin2 = await taoNguoi(sc, "admin")
  await dungMayThu(admin, M)
  await mc.connect()
  await chay047(mc)
  await chay091(mc)
  await mc.query(
    `INSERT INTO source_registry (code, real_name, label_vi, status) VALUES ('S05', 'nguonthuslx', 'thu', 'active'), ('S03', 'nguonbaslx', 'thu', 'active')`,
  )
})
after(async () => {
  await sc.end().catch(() => {})
  await mc.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await new Promise((r) => setTimeout(r, 200))
  await pool.end().catch(() => {})
  await xoaLuocDo(admin, S).catch(() => {})
  await xoaLuocDo(admin, M).catch(() => {})
  const publicSau = await chupPublic(admin)
  await admin.end().catch(() => {})
  assert.deepEqual(publicSau, publicTruoc, "public đã bị chạm")
})
beforeEach(async () => {
  await sc.query(`DELETE FROM change_requests`)
  await sc.query(`DELETE FROM machine_tokens`)
})

type Goi = { cookie?: string; auth?: string; body?: unknown }
const yeuCau = (url: string, method: string, o: Goi) =>
  new Request(`http://localhost${url}`, {
    method,
    headers: {
      ...(o.cookie ? { cookie: o.cookie } : {}),
      ...(o.auth ? { authorization: o.auth } : {}),
      "content-type": "application/json",
    },
    ...(o.body !== undefined ? { body: JSON.stringify(o.body) } : {}),
  })
const doc = async (res: Response) => ({ status: res.status, body: (await res.json().catch(() => null)) as Record<string, unknown> })
async function tao(o: Goi) {
  const { POST } = await import("../src/app/api/v1/ops/change-requests/route")
  return doc(await POST(yeuCau("/api/v1/ops/change-requests", "POST", o)))
}
async function danhSach(o: Goi) {
  const { GET } = await import("../src/app/api/v1/ops/change-requests/route")
  return doc(await GET(yeuCau("/api/v1/ops/change-requests", "GET", o)))
}
async function quyet(id: string, o: Goi, tep = "../src/app/api/v1/ops/change-requests/[id]/decide/route") {
  const { POST } = await import(tep)
  return doc(await POST(yeuCau(`/api/v1/ops/change-requests/${id}/decide`, "POST", o), { params: Promise.resolve({ id }) }))
}
async function keo(auth?: string) {
  const { GET } = await import("../src/app/api/v1/ops/change-requests/pull/route")
  return doc(await GET(yeuCau("/api/v1/ops/change-requests/pull", "GET", { auth })))
}
const dem = async (bang: string, where = "TRUE") => (await sc.query(`SELECT count(*)::int AS n FROM ${bang} WHERE ${where}`)).rows[0].n as number
const anhLenh = async () => (await sc.query(`SELECT * FROM change_requests ORDER BY created_at, id`)).rows
const anhToken = async () => (await sc.query(`SELECT * FROM machine_tokens ORDER BY name`)).rows

/** Cấp token bằng script thật trên lược đồ cloud tạm. */
function capToken(ten: string, scope: string): string {
  const r = spawnSync(process.execPath, [join(GOC, "scripts", "cap-token-may.mjs"), "--name", ten, "--scope", scope], {
    env: { ...process.env, DATABASE_URL: schemaUrl(S) },
    encoding: "utf8",
  })
  assert.equal(r.status, 0, r.stderr)
  const t = r.stdout.trim()
  assert.match(t, /^om_[0-9a-f]{64}$/)
  return t
}
function thuHoi(ten: string) {
  const r = spawnSync(process.execPath, [join(GOC, "scripts", "cap-token-may.mjs"), "--thu-hoi", ten], {
    env: { ...process.env, DATABASE_URL: schemaUrl(S) },
    encoding: "utf8",
  })
  assert.equal(r.status, 0, r.stderr)
}
/** Chèn lệnh thẳng vào lược đồ cloud (fixture của ca kéo/kết quả). */
async function chenLenh(status: string, opts: { target?: string; type?: string; phut?: number } = {}) {
  const { rows } = await sc.query(
    `INSERT INTO change_requests (type, target, payload, status, requested_by, approved_by, idempotency_key, created_at)
     VALUES ($1, $2, '{"reason":"het credit"}', $3, 'user:a', 'user:b', gen_random_uuid()::text, now() - make_interval(mins => $4))
     RETURNING id, idempotency_key`,
    [opts.type ?? "source.pause", opts.target ?? "S05", status, opts.phut ?? 0],
  )
  return rows[0] as { id: string; idempotency_key: string }
}

/** Bản chép tạm của một tệp nguồn (cùng thư mục, tên ẩn) với một chỗ thay — đối chứng đỏ; xoá sau ca. */
async function banSao<T>(tep: string, tu: string, thanh: string, dung: (duong: string) => Promise<T>): Promise<T> {
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

test("SL-AC-2 tạo lệnh: bảng 12 lời gọi; giao dịch hỏng thì 0 dòng", async () => {
  const P = (payload: unknown, extra: Record<string, unknown> = {}) => ({ type: "source.pause", target: "S05", payload, ...extra })
  const ok = await tao({ cookie: nguoi.ops.cookie, body: P({ reason: "het credit" }) })
  assert.equal(ok.status, 201)
  assert.equal(ok.body.status, "submitted")
  assert.equal(ok.body.requested_by, `user:${nguoi.ops.id}`)
  assert.equal(await dem("ops_audit", `action = 'change_request.create' AND detail->>'change_request_id' = '${ok.body.id}'`), 1)
  const truoc = [await dem("change_requests"), await dem("ops_audit")]
  // Mỗi ô ghim cả lý do: «khoá cấm» và «khoá thừa» đều ra 400, chỉ lý do phân biệt được hai bước kiểm.
  const xau: [string, Goi, string][] = [
    ["thiếu reason", { cookie: nguoi.ops.cookie, body: P({}) }, "thieu-reason"],
    ["reason trắng", { cookie: nguoi.ops.cookie, body: P({ reason: "  " }) }, "thieu-reason"],
    ["unit.create", { cookie: nguoi.ops.cookie, body: { type: "unit.create", target: "S05", payload: {} } }, "loai-chua-co-bo-ap:unit.create"],
    ["loại lạ", { cookie: nguoi.ops.cookie, body: { type: "source.purge", target: "S05", payload: {} } }, "loai-la:source.purge"],
    ["target S5", { cookie: nguoi.ops.cookie, body: { type: "source.pause", target: "S5", payload: { reason: "x" } } }, "target-sai-khuon"],
    ["khoá thừa", { cookie: nguoi.ops.cookie, body: P({ reason: "x", extra: 1 }) }, "khoa-thua:extra"],
    ["khoá cấm sâu 3", { cookie: nguoi.ops.cookie, body: P({ reason: "x", a: { b: { bindings: [] } } }) }, "khoa-cam:bindings"],
    ["requireMention", { cookie: nguoi.ops.cookie, body: P({ reason: "x", requireMention: false }) }, "khoa-cam:requireMention"],
  ]
  assert.equal(xau.length, 8)
  for (const [ten, o, lyDo] of xau) {
    const r = await tao(o)
    assert.deepEqual([r.status, r.body.error, r.body.ly_do], [400, "lenh-sai-khuon", lyDo], ten)
  }
  assert.equal((await tao({ cookie: nguoi.viewer.cookie, body: P({ reason: "x" }) })).status, 403, "viewer")
  assert.equal((await tao({ cookie: nguoi.ops.cookie, body: { type: "source.resume", target: "S05", payload: {} } })).status, 403, "ops bật lại")
  assert.equal((await tao({ auth: `Bearer ${CHUNG}`, body: P({ reason: "x" }) })).status, 403, "bearer chung")
  assert.deepEqual([await dem("change_requests"), await dem("ops_audit")], truoc, "lời gọi xấu đã ghi")
  assert.equal((await tao({ cookie: nguoi.admin.cookie, body: { type: "source.resume", target: "S05", payload: {} } })).status, 201, "admin bật lại")
  // Đối chứng: nhật ký hỏng giữa giao dịch → không còn lệnh, không còn dòng audit.
  const truoc2 = [await dem("change_requests"), await dem("ops_audit")]
  await sc.query(`ALTER TABLE ops_audit RENAME TO ops_audit_tam`)
  try {
    await assert.rejects(tao({ cookie: nguoi.ops.cookie, body: P({ reason: "x" }) }))
  } finally {
    await sc.query(`ALTER TABLE ops_audit_tam RENAME TO ops_audit`)
  }
  assert.deepEqual([await dem("change_requests"), await dem("ops_audit")], truoc2)
})

test("SL-AC-3 duyệt: admin duyệt/từ chối; tự duyệt S05 được, S03 cần người thứ hai", async () => {
  const L = async (cookie: string, target = "S05", type = "source.pause") =>
    (await tao({ cookie, body: { type, target, payload: type === "source.pause" ? { reason: "x" } : {} } })).body.id as string
  const a = await L(nguoi.ops.cookie)
  const r = await quyet(a, { cookie: nguoi.admin.cookie, body: { decision: "approve" } })
  assert.equal(r.status, 200)
  const d = (await sc.query(`SELECT status, approved_by, decided_at FROM change_requests WHERE id = $1`, [a])).rows[0]
  assert.equal(d.status, "approved")
  assert.equal(d.approved_by, `user:${nguoi.admin.id}`)
  assert.ok(d.decided_at)
  assert.equal(await dem("ops_audit", `action = 'change_request.decide' AND detail->>'change_request_id' = '${a}'`), 1)
  const b = await L(nguoi.ops.cookie)
  assert.equal((await quyet(b, { cookie: nguoi.admin.cookie, body: { decision: "reject" } })).body.status, "rejected")
  const tuDuyet = await L(nguoi.admin.cookie, "S05", "source.resume")
  assert.equal((await quyet(tuDuyet, { cookie: nguoi.admin.cookie, body: { decision: "approve" } })).status, 200, "admin tự duyệt bật lại S05")
  const c = await L(nguoi.ops.cookie)
  assert.equal((await quyet(c, { cookie: nguoi.ops.cookie, body: { decision: "approve" } })).status, 403, "ops duyệt")
  const truocA = (await sc.query(`SELECT * FROM change_requests WHERE id = $1`, [a])).rows[0]
  assert.equal((await quyet(a, { cookie: nguoi.admin.cookie, body: { decision: "approve" } })).status, 409)
  assert.deepEqual((await sc.query(`SELECT * FROM change_requests WHERE id = $1`, [a])).rows[0], truocA)
  const s03 = await L(nguoi.admin.cookie, "S03")
  const truoc03 = (await sc.query(`SELECT * FROM change_requests WHERE id = $1`, [s03])).rows[0]
  assert.equal((await quyet(s03, { cookie: nguoi.admin.cookie, body: { decision: "approve" } })).status, 409, "S03 tự duyệt")
  assert.deepEqual((await sc.query(`SELECT * FROM change_requests WHERE id = $1`, [s03])).rows[0], truoc03)
  assert.equal((await quyet(s03, { cookie: nguoi.admin2.cookie, body: { decision: "approve" } })).status, 200, "S03 người thứ hai")
  // Đối chứng: bỏ luật S03 trong bản sao handler thì tự duyệt qua — luật người thứ hai là thứ chặn.
  const s03b = await L(nguoi.admin.cookie, "S03")
  const tep = join(APP, "src/app/api/v1/ops/change-requests/[id]/decide/route.ts")
  const st = await banSao(tep, 'l.target === "S03"', "false", (dot) =>
    quyet(s03b, { cookie: nguoi.admin.cookie, body: { decision: "approve" } }, dot).then((x) => x.status),
  )
  assert.equal(st, 200, "luật người thứ hai — bản bỏ luật phải cho tự duyệt S03")
})

test("SL-AC-4 kéo bằng token máy: đúng lệnh, đúng thứ tự; sáu lời gọi xấu không đổi gì", async () => {
  const token = capToken("may-thu-thu", "ops:pull")
  const bam = (await sc.query(`SELECT token_hash FROM machine_tokens WHERE name = 'may-thu-thu'`)).rows[0].token_hash
  const { bamToken } = await import("../src/lib/token-may")
  assert.equal(bam, bamToken(token))
  const cot = (await admin.query(
    `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = $1 AND data_type IN ('text', 'jsonb', 'ARRAY')`, [S],
  )).rows as { table_name: string; column_name: string }[]
  for (const { table_name, column_name } of cot) {
    const n = (await sc.query(`SELECT count(*)::int AS n FROM ${table_name} WHERE "${column_name}"::text LIKE '%' || $1 || '%'`, [token])).rows[0].n
    assert.equal(n, 0, `token nằm trong ${table_name}.${column_name}`)
  }
  const L1 = await chenLenh("approved", { phut: 30 })
  const L2 = await chenLenh("queued", { phut: 20 })
  const L3 = await chenLenh("approved", { phut: 10 })
  for (const s of ["submitted", "rejected", "applied"]) await chenLenh(s, { phut: 5 })
  const thuHoiTok = capToken("may-thu-cu", "ops:pull")
  thuHoi("may-thu-cu")
  const thieuScope = capToken("may-thu-doc", "ops:read")
  const xau: [string, string | undefined][] = [
    ["không header", undefined],
    ["bearer chung", `Bearer ${CHUNG}`],
    ["token thu hồi", `Bearer ${thuHoiTok}`],
    ["thiếu scope", `Bearer ${thieuScope}`],
    ["token lạ", `Bearer om_${"cd".repeat(32)}`],
    ["bearer chữ thường", `bearer ${token}`],
    ["thừa khoảng trắng", `Bearer  ${token}`],
  ]
  for (const [ten, auth] of xau) {
    const truoc = [await anhLenh(), await anhToken()]
    const r = await keo(auth)
    assert.ok([401, 403].includes(r.status), `${ten}: ${r.status}`)
    assert.deepEqual([await anhLenh(), await anhToken()], truoc, `${ten}: đã đổi trạng thái`)
  }
  // Phiên người vai owner cũng không kéo được.
  const { GET } = await import("../src/app/api/v1/ops/change-requests/pull/route")
  assert.equal((await GET(yeuCau("/api/v1/ops/change-requests/pull", "GET", { cookie: nguoi.owner.cookie }))).status, 401)
  const r = await keo(`Bearer ${token}`)
  assert.equal(r.status, 200)
  assert.deepEqual((r.body.commands as { id: string }[]).map((x) => x.id), [L1.id, L2.id, L3.id])
  const tt = (await sc.query(`SELECT id, status, queued_at FROM change_requests WHERE id = ANY($1)`, [[L1.id, L3.id]])).rows
  assert.ok(tt.every((x) => x.status === "queued" && x.queued_at), "approved phải chuyển queued có queued_at")
  assert.ok((await sc.query(`SELECT last_used_at FROM machine_tokens WHERE name = 'may-thu-thu'`)).rows[0].last_used_at)
  // Đối chứng: bản sao bỏ kiểm revoked_at thì token thu hồi qua được.
  const tep = join(APP, "src/lib/token-may.ts")
  const ok = await banSao(tep, "AND revoked_at IS NULL", "", async (dot) => {
    const { kiemTokenMay } = await import(pathToFileURL(dot).href)
    return (await kiemTokenMay(yeuCau("/x", "GET", { auth: `Bearer ${thuHoiTok}` }), "ops:pull")).ok
  })
  assert.equal(ok, true, "thu hồi — bản bỏ kiểm revoked_at phải cho token thu hồi qua")
})

/** Server bọc handler THẬT của ingest (và lệnh) trên cổng ngẫu nhiên. */
async function serverThat(tepPull?: string) {
  const ingest = await import("../src/app/api/v1/ops/ingest/route")
  const pull = await import(tepPull ?? "../src/app/api/v1/ops/change-requests/pull/route")
  let dem = 0
  const server = http.createServer(async (req, res) => {
    dem++
    let body = ""
    for await (const d of req) body += d
    const r = new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      ...(req.method === "POST" ? { body } : {}),
    })
    const out: Response =
      req.url === "/api/v1/ops/ingest" ? await ingest.POST(r)
      : req.url === "/api/v1/ops/change-requests/pull" ? await pull.GET(r)
      : new Response("not found", { status: 404 })
    res.writeHead(out.status, { "content-type": "application/json" }).end(await out.text())
  })
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r))
  const addr = server.address() as { port: number }
  return { url: `http://127.0.0.1:${addr.port}`, dem: () => dem, dong: () => new Promise((r) => server.close(r)) }
}
function chay(tep: string, args: string[], env: Record<string, string>) {
  return new Promise<{ code: number | null; out: string; err: string }>((resolve) => {
    const p = spawn(process.execPath, [tep, ...args], { env: { ...process.env, ...env } })
    let out = ""
    let err = ""
    p.stdout.on("data", (d) => (out += d))
    p.stderr.on("data", (d) => (err += d))
    p.on("close", (code) => resolve({ code, out, err }))
  })
}
const PUSH = join(GOC, "pipeline", "push-ops-facts.mjs")
const OPS_APPLY = join(GOC, "pipeline", "ops-apply.mjs")

test("SL-AC-8 kết quả qua push-ops-facts → ingest: đúng lệnh đổi, heartbeat giữ, tầng A chặn", async () => {
  const token = capToken("may-thu-thu", "ops:pull")
  await sc.query(`DELETE FROM ops_heartbeat`)
  await sc.query(`INSERT INTO ops_heartbeat (id, payload, pushed_at) VALUES ('primary', '{"pushedAt":"P0"}', '2026-11-01T00:00:00Z')`)
  const Q1 = await chenLenh("queued")
  const Q2 = await chenLenh("queued")
  const Q3 = await chenLenh("queued")
  const A1 = await chenLenh("applied")
  const truocA1 = (await sc.query(`SELECT * FROM change_requests WHERE id = $1`, [A1.id])).rows[0]
  const hb = async () => (await sc.query(`SELECT payload, pushed_at FROM ops_heartbeat`)).rows
  const hbTruoc = await hb()
  const truoc = { status: "active", reason: null, resume_when: null }
  const sau = { status: "paused", reason: "het credit", resume_when: null }
  const kq = [
    { ...Q1, outcome: "applied", before: truoc, after: sau, applied_at: "2026-11-10T00:00:00Z" },
    { ...Q2, outcome: "failed", before: truoc, after: truoc, ly_do: "tien-dieu-kien:nguon-paused" },
    { ...Q3, outcome: "reverted", before: truoc, after: truoc, ly_do: "kiem-sau-hong" },
    { ...A1, outcome: "applied", before: truoc, after: sau },
    { id: Q1.id, idempotency_key: "sai-khoa", outcome: "failed" },
  ]
  const dir = mkdtempSync(join(tmpdir(), "sl-ac8-"))
  const tep = join(dir, "kq.json")
  writeFileSync(tep, JSON.stringify({ results: kq }))
  const sv = await serverThat()
  const env = { DATABASE_URL: schemaUrl(M), INGEST_URL: `${sv.url}/api/v1/ops/ingest`, OPS_MACHINE_TOKEN: token }
  try {
    const batDau = Date.now() - 1000
    const r = await chay(PUSH, ["--chi-lenh", tep], env)
    assert.equal(r.code, 0, r.err)
    assert.match(r.out, /cập nhật 3, bỏ qua 2/)
    const L = async (id: string) => (await sc.query(`SELECT * FROM change_requests WHERE id = $1`, [id])).rows[0]
    // result và trạng thái so đúng giá trị của tệp; finished_at là giờ cloud nhận kết quả (now() trong cùng lượt gửi).
    const q1 = await L(Q1.id)
    assert.deepEqual([q1.status, q1.before, q1.after, q1.result], ["applied", truoc, sau, { outcome: "applied", ly_do: null, applied_at: "2026-11-10T00:00:00Z" }])
    const q2 = await L(Q2.id)
    assert.deepEqual([q2.status, q2.before, q2.after, q2.result], ["failed", truoc, truoc, { outcome: "failed", ly_do: "tien-dieu-kien:nguon-paused", applied_at: null }])
    const q3 = await L(Q3.id)
    assert.deepEqual([q3.status, q3.before, q3.after, q3.result], ["reverted", truoc, truoc, { outcome: "reverted", ly_do: "kiem-sau-hong", applied_at: null }])
    for (const q of [q1, q2, q3]) {
      assert.ok(q.finished_at instanceof Date && q.finished_at.getTime() >= batDau && q.finished_at.getTime() <= Date.now() + 1000, `finished_at ${q.id}`)
    }
    assert.deepEqual(await L(A1.id), truocA1)
    assert.equal(await dem("ops_audit", `actor = 'machine:may-thu-thu' AND action = 'change_request.result'`), 3)
    assert.deepEqual(await hb(), hbTruoc, "ops_heartbeat bị ghi đè")
    const lai = await chay(PUSH, ["--chi-lenh", tep], env)
    assert.match(lai.out, /cập nhật 0, bỏ qua 5/)
    // Bearer chung ở nhánh kết quả → 403; results sai khuôn → 400.
    const { POST } = await import("../src/app/api/v1/ops/ingest/route")
    const banTin = { pushedAt: "x", kind: "change_request_results", results: [] }
    assert.equal((await POST(yeuCau("/api/v1/ops/ingest", "POST", { auth: `Bearer ${CHUNG}`, body: banTin }))).status, 403)
    assert.equal((await POST(yeuCau("/api/v1/ops/ingest", "POST", { auth: `Bearer ${token}`, body: { ...banTin, results: "x" } }))).status, 400)
    // Tầng A: kết quả mang tên nguồn thật → không gửi, thoát 1.
    const tepA = join(dir, "kq-a.json")
    writeFileSync(tepA, JSON.stringify({ results: [{ ...Q1, outcome: "failed", ly_do: "loi nguonthuslx" }] }))
    const dem0 = sv.dem()
    const ra = await chay(PUSH, ["--chi-lenh", tepA], env)
    assert.equal(ra.code, 1)
    assert.match(ra.err, /FACTS CHẶN \[tầng A\]/)
    assert.equal(sv.dem(), dem0, "bản tin trúng tầng A vẫn được gửi")
    // Bản tin thường bằng bearer chung vẫn upsert ops_heartbeat như trước.
    const thuong = await POST(yeuCau("/api/v1/ops/ingest", "POST", { auth: `Bearer ${CHUNG}`, body: { pushedAt: "2026-11-10T01:00:00Z", x: 1 } }))
    assert.equal(thuong.status, 200)
    assert.equal((await hb())[0].payload.x, 1)
    // Đối chứng: bản sao bỏ kiểm idempotency_key thì kết quả sai khoá làm đổi lệnh.
    const Q4 = await chenLenh("queued")
    const tepR = join(APP, "src/app/api/v1/ops/ingest/route.ts")
    const doi = await banSao(tepR, "AND idempotency_key = $2 ", "AND $2::text IS NOT NULL ", async (dot) => {
      const R = await import(pathToFileURL(dot).href)
      await R.POST(yeuCau("/api/v1/ops/ingest", "POST", {
        auth: `Bearer ${token}`,
        body: { pushedAt: "x", kind: "change_request_results", results: [{ id: Q4.id, idempotency_key: "sai-khoa", outcome: "failed" }] },
      }))
      return (await L(Q4.id)).status
    })
    assert.equal(doi, "failed", "idempotency_key — bản bỏ kiểm khoá phải để kết quả sai khoá đổi lệnh")
  } finally {
    await sv.dong()
    rmSync(dir, { recursive: true, force: true })
  }
})

test("SL-AC-9 danh sách: lệnh chờ không bao giờ «đã áp»; last_pull_at theo token còn hiệu lực", async () => {
  await chenLenh("approved")
  await chenLenh("queued")
  const r0 = await danhSach({ cookie: nguoi.viewer.cookie })
  assert.equal(r0.status, 200)
  assert.equal(r0.body.last_pull_at, null)
  const cmds = r0.body.commands as { status: string; finished_at: unknown; result: unknown }[]
  assert.ok(cmds.some((c) => c.status === "approved"))
  for (const c of cmds) if (c.status === "applied") assert.ok(c.finished_at && c.result)
  assert.ok(cmds.every((c) => c.status !== "applied"))
  const t1 = capToken("may-thu-thu", "ops:pull")
  await keo(`Bearer ${t1}`)
  const used = (await sc.query(`SELECT last_used_at FROM machine_tokens WHERE name = 'may-thu-thu'`)).rows[0].last_used_at as Date
  const r1 = await danhSach({ cookie: nguoi.viewer.cookie })
  assert.equal(new Date(r1.body.last_pull_at as string).getTime(), used.getTime())
  thuHoi("may-thu-thu")
  assert.equal((await danhSach({ cookie: nguoi.viewer.cookie })).body.last_pull_at, null)
  assert.equal((await danhSach({})).status, 401)
  // Đối chứng: bản sao tính cả token thu hồi thì mốc vẫn còn sau thu hồi.
  const tep = join(APP, "src/app/api/v1/ops/change-requests/route.ts")
  const moc = await banSao(tep, "WHERE revoked_at IS NULL AND 'ops:pull'", "WHERE 'ops:pull'", async (dot) => {
    const R = await import(pathToFileURL(dot).href)
    return (await doc(await R.GET(yeuCau("/api/v1/ops/change-requests", "GET", { cookie: nguoi.viewer.cookie })))).body.last_pull_at
  })
  assert.notEqual(moc, null, "token thu hồi — bản tính cả token thu hồi phải giữ mốc")
})

test("SL-NOI đầu-cuối: route thật → ops-apply thật → push-ops-facts thật → ingest thật", async () => {
  await mc.query(`UPDATE source_registry SET status = 'active', reason = NULL, resume_when = NULL WHERE code = 'S05'`)
  const token = capToken("may-thu-noi", "ops:pull")
  const ch = mkdtempSync(join(tmpdir(), "sl-noi-"))
  writeFileSync(join(ch, "cloud.env"), `OPS_MACHINE_TOKEN=${token}\n`)
  const guiDuyet = async () => {
    const t = await tao({ cookie: nguoi.ops.cookie, body: { type: "source.pause", target: "S05", payload: { reason: "het credit" } } })
    assert.equal(t.status, 201)
    assert.equal((await quyet(t.body.id as string, { cookie: nguoi.admin.cookie, body: { decision: "approve" } })).status, 200)
    return t.body as { id: string; idempotency_key: string }
  }
  const env = (url: string) => ({ DATABASE_URL: schemaUrl(M), OPS_APPLY_CLOUD: url, INGEST_URL: `${url}/api/v1/ops/ingest`, OPS_APPLY_CONFIG_DIR: ch })
  try {
    const l = await guiDuyet()
    const sv = await serverThat()
    try {
      const r = await chay(OPS_APPLY, [], env(sv.url))
      assert.equal(r.code, 0, r.err + r.out)
    } finally {
      await sv.dong()
    }
    const tren = (await sc.query(`SELECT status, before, after, finished_at FROM change_requests WHERE id = $1`, [l.id])).rows[0]
    const so = (await mc.query(`SELECT outcome, before, after FROM change_request_applies WHERE idempotency_key = $1`, [l.idempotency_key])).rows[0]
    assert.equal(tren.status, "applied")
    assert.ok(tren.finished_at)
    assert.equal(so.outcome, "applied")
    assert.deepEqual([tren.before, tren.after], [so.before, so.after])
    assert.equal((await mc.query(`SELECT status FROM source_registry WHERE code = 'S05'`)).rows[0].status, "paused")
    // Đối chứng: route pull đổi tên khoá idempotency_key trong phản hồi → bộ áp không nhận được lệnh, lệnh vẫn queued.
    await mc.query(`UPDATE source_registry SET status = 'active', reason = NULL WHERE code = 'S05'`)
    const l2 = await guiDuyet()
    const tepPull = join(APP, "src/app/api/v1/ops/change-requests/pull/route.ts")
    await banSao(tepPull, "SELECT id, type, target, payload, idempotency_key,", "SELECT id, type, target, payload, idempotency_key AS khoa,", async (dot) => {
      const sv2 = await serverThat(dot)
      try {
        await chay(OPS_APPLY, [], env(sv2.url))
      } finally {
        await sv2.dong()
      }
    })
    assert.equal(
      (await sc.query(`SELECT status FROM change_requests WHERE id = $1`, [l2.id])).rows[0].status,
      "queued",
      "khuôn lệnh — bản đổi tên khoá phải để lệnh nằm queued",
    )
  } finally {
    rmSync(ch, { recursive: true, force: true })
  }
})

// ---- Hồ sơ _acceptance/so-lenh-sua-sau-tv4: «SS-AC-5» — cloud chặn resume_when sai kiểu ngay lúc gửi ----
test("SS-AC-5 POST source.pause resume_when 5 → 400 resume-when-sai-khuon, không ghi; chuỗi → 201", async () => {
  const P = (resume_when: unknown) => ({ type: "source.pause", target: "S05", payload: { reason: "x", resume_when } })
  const truoc = [await dem("change_requests"), await dem("ops_audit")]
  const r = await tao({ cookie: nguoi.ops.cookie, body: P(5) })
  assert.deepEqual([r.status, r.body.error, r.body.ly_do], [400, "lenh-sai-khuon", "resume-when-sai-khuon"])
  assert.deepEqual([await dem("change_requests"), await dem("ops_audit")], truoc, "lời gọi sai kiểu đã ghi")
  const ok = await tao({ cookie: nguoi.ops.cookie, body: P("khi hết hạn mức") })
  assert.equal(ok.status, 201, "đối chứng dương: resume_when chuỗi phải nhận")
})
