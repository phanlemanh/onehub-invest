// danh-ba-nguoi-tren-ops.test.tsx — hồ sơ _acceptance/danh-ba-nguoi-tren-ops, ca «DBN-AC-n». Một lược đồ tạm có migration
// 055 áp thật (ref_lookup, ref_field_lookup chép khuôn public; nhãn assertion_method/evidence_tier chép dòng public),
// source_registry giả mang một tên nguồn thật giả. public không được chạm. Ma trận bảy người viết trước; mỗi phép đo mới
// có chiều đỏ trên cùng fixture (bản đột biến chép sang thư mục tạm, đổi đúng một chỗ), thông điệp ghim.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"
import { isValidElement, type ReactElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import type { User } from "../src/lib/auth"

const S = `dbn_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ROOT = resolve(APP, "..")
const MIG = join(ROOT, "db/migrations/055_danh_ba_nguoi.sql")
const PEOPLE_TS = join(APP, "src/lib/ops/people.ts")
const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })

/** Khoá người: mã 26 ký tự Crockford (chữ số đều hợp lệ); ma trận P1–P7 xếp trước lô S09 (khoá tiền tố pty_9). */
const K = (n: number) => `pty_${String(n).padStart(26, "0")}`
const P = { 1: K(1), 2: K(2), 3: K(3), 4: K(4), 5: K(5), 6: K(6), 7: K(7) } as const
const HASH = "ab12cd34" + "e".repeat(56)
const TEN_LO_NGUON = "Nha Dat Nguon That Dbn 24h"

/** Ma trận viết trước: mỗi người — có hàng?, số tin, số bí danh còn dùng. Thứ tự hàng kỳ vọng theo số tin giảm dần. */
const KY_VONG: Record<string, { hang: boolean; soTin: number; soBiDanh: number }> = {
  [P[1]]: { hang: true, soTin: 5, soBiDanh: 3 },
  [P[2]]: { hang: true, soTin: 1, soBiDanh: 2 },
  [P[3]]: { hang: true, soTin: 0, soBiDanh: 1 },
  [P[4]]: { hang: false, soTin: 0, soBiDanh: 0 },
  [P[5]]: { hang: true, soTin: 4, soBiDanh: 1 },
  [P[6]]: { hang: true, soTin: 2, soBiDanh: 2 },
  [P[7]]: { hang: true, soTin: 3, soBiDanh: 2 },
}
const THU_TU = [P[1], P[5], P[7], P[6], P[2], P[3]]
const BI_DANH_CHUOI = [TEN_LO_NGUON, "Nha Dat S07 24h", "acc-p1", "Chị Lan Hoa", "acc-p2", HASH.slice(0, 8)]

const nguoi = (source: string, key: string, status = "active", mergedInto: string | null = null) =>
  sc.query(`INSERT INTO parties (party_key, status, merged_into, source) VALUES ($1, $2, $3, $4)`, [key, status, mergedInto, source])
const biDanh = (key: string, kind: string, value: string, source: string) =>
  sc.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, $2, $3, $4) RETURNING id`, [key, kind, value, source])
const vai = (key: string, subject: string) =>
  sc.query(
    `INSERT INTO party_roles (party_key, role, subject_key, evidence_tier, method, run_id) VALUES ($1, 'nguoi_dang', $2, 'fact', 'source_field', 'dbn-thu') RETURNING id`,
    [key, subject],
  )

before(async () => {
  await admin.connect()
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  await admin.query(`CREATE TABLE "${S}".ref_lookup (LIKE public.ref_lookup INCLUDING ALL)`)
  await admin.query(`CREATE TABLE "${S}".ref_field_lookup (LIKE public.ref_field_lookup INCLUDING ALL)`)
  await admin.query(`INSERT INTO "${S}".ref_lookup SELECT * FROM public.ref_lookup WHERE lookup_name IN ('assertion_method', 'evidence_tier')`)
  await admin.query(`CREATE TABLE "${S}".source_registry (code text PRIMARY KEY, real_name text)`)
  await admin.query(`INSERT INTO "${S}".source_registry VALUES ('S07', 'Nguon That Dbn'), ('S03', NULL)`)
  await sc.connect()
  await sc.query(readFileSync(MIG, "utf8"))
  // Ma trận bảy người.
  await nguoi("S03", P[1])
  await biDanh(P[1], "ten", TEN_LO_NGUON, "S03")
  await biDanh(P[1], "tai_khoan_nguon", "acc-p1", "S03")
  await biDanh(P[1], "sdt_bam", HASH, "S03")
  for (let i = 1; i <= 5; i++) await vai(P[1], `S03:a${i}`)
  await nguoi("S03", P[2])
  await biDanh(P[2], "ten", "Chị Lan Hoa", "S03")
  await biDanh(P[2], "tai_khoan_nguon", "acc-p2", "S03")
  await vai(P[2], "S03:b1")
  await nguoi("S03", P[3])
  await biDanh(P[3], "ten", "Không Tin Nào", "S03")
  await nguoi("S03", P[4], "merged", P[1])
  for (let i = 1; i <= 3; i++) await vai(P[4], `S03:d${i}`)
  await nguoi("S03", P[5])
  await biDanh(P[5], "tai_khoan_nguon", "acc-p5", "S03")
  for (let i = 1; i <= 5; i++) await vai(P[5], `S03:e${i}`)
  await sc.query(`UPDATE party_roles SET retracted_at = now(), retract_reason = 'thay-boi-luot' WHERE subject_key = 'S03:e5'`)
  await nguoi("S03", P[6])
  await biDanh(P[6], "ten", "Anh Sáu Mới", "S03")
  const cu = await biDanh(P[6], "ten", "Anh Sáu Cũ", "S03")
  await sc.query(`UPDATE registry_aliases SET retired_at = now() WHERE id = $1`, [cu.rows[0].id])
  await biDanh(P[6], "tai_khoan_nguon", "acc-p6", "S03")
  for (let i = 1; i <= 2; i++) await vai(P[6], `S03:f${i}`)
  await nguoi("S05", P[7])
  await biDanh(P[7], "ten", "Người Năm", "S05")
  await biDanh(P[7], "tai_khoan_nguon", "acc-p7", "S05")
  for (let i = 1; i <= 3; i++) await vai(P[7], `S05:g${i}`)
  // Lô 230 người S09 không tin — để đo chia trang (100 + 100 + 30).
  await sc.query(
    `INSERT INTO parties (party_key, source) SELECT 'pty_9' || lpad(i::text, 25, '0'), 'S09' FROM generate_series(1, 230) i`,
  )
  await sc.query(
    `INSERT INTO registry_aliases (object_key, kind, value, source)
     SELECT 'pty_9' || lpad(i::text, 25, '0'), 'ten', 'Lô Chín ' || i, 'S09' FROM generate_series(1, 230) i`,
  )
})

after(async () => {
  await sc.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

/** Bản đột biến của people.ts (chép sang thư mục tạm, đổi đúng một chỗ) — chiều đỏ trên cùng fixture. */
async function banDot(tu: string, thanh: string): Promise<typeof import("../src/lib/ops/people")> {
  const goc = readFileSync(PEOPLE_TS, "utf8")
  assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`)
  const dot = goc
    .replace(tu, thanh)
    .replace(`from "../db"`, `from "${pathToFileURL(join(APP, "src/lib/db.ts")).href}"`)
    .replace(`from "../mask-source-names"`, `from "${pathToFileURL(join(APP, "src/lib/mask-source-names.ts")).href}"`)
  const f = join(mkdtempSync(join(tmpdir(), "dbn-dot-")), "people.ts")
  writeFileSync(f, dot)
  return import(pathToFileURL(f).href)
}

/** Bản chép một tệp của app vào app/tests/.dbn-cu-<pid>/ (để «@/» còn giải), đổi các chỗ trong `doi`. */
let soBanChep = 0
async function banChep<T>(rel: string, doi: [string, string][]): Promise<T> {
  let src = readFileSync(join(APP, rel), "utf8")
  for (const [tu, thanh] of doi) {
    assert.ok(src.includes(tu), `bản chép không áp được: ${tu}`)
    src = src.replace(tu, thanh)
  }
  const thuMuc = join(APP, "tests", `.dbn-cu-${process.pid}`)
  mkdirSync(thuMuc, { recursive: true })
  src = src.replace(/from "\.\/([\w-]+)"/g, (_m, ten: string) => `from "${pathToFileURL(join(APP, dirname(rel), `${ten}`)).href}.tsx"`)
  src = src.replace(/(file:[^"]+?)\.tsx"/g, (m, u: string) => {
    const p = fileURLToPath(u)
    try {
      readFileSync(`${p}.tsx`)
      return m
    } catch {
      return `${u}.ts"`
    }
  })
  const f = join(thuMuc, `ban-${++soBanChep}.tsx`)
  // Thư mục test dựng JSX kiểu cũ (React.createElement) — bản chép cần React trong phạm vi.
  writeFileSync(f, `import React from "react"\n${src}`)
  return import(pathToFileURL(f).href) as Promise<T>
}
after(() => rmSync(join(APP, "tests", `.dbn-cu-${process.pid}`), { recursive: true, force: true }))

const user = (role: string | null): User | null =>
  role ? ({ id: `usr_${role}`, email: `${role}@local.test`, plan: "free", role } as User) : null

/** Tìm phần tử con có `type === loai` trong cây React trả từ page (không dựng). */
function timPhanTu(node: ReactNode, loai: unknown): ReactElement<Record<string, unknown>> | null {
  if (!isValidElement(node)) {
    if (Array.isArray(node)) for (const c of node) {
      const r = timPhanTu(c, loai)
      if (r) return r
    }
    return null
  }
  if (node.type === loai) return node as ReactElement<Record<string, unknown>>
  return timPhanTu((node.props as { children?: ReactNode }).children, loai)
}

async function htmlDanhSach(u: User, loc = { source: null as string | null, q: "", page: 1 }) {
  const { PeopleContent } = await import("../src/components/ops/people/people-content")
  return renderToStaticMarkup(await PeopleContent({ user: u, loc }))
}
async function htmlNguoi(u: User, partyKey: string) {
  const { PersonContent } = await import("../src/components/ops/people/person-content")
  return renderToStaticMarkup(await PersonContent({ user: u, partyKey }))
}
const ADMIN = user("admin") as User

test("DBN-AC-2 ma trận bảy người: mỗi người đang dùng một hàng, số tin bỏ vai rút, số bí danh bỏ bí danh nghỉ", async () => {
  const { danhSachNguoi } = await import("../src/lib/ops/people")
  const all: import("../src/lib/ops/people").NguoiHang[] = []
  for (let page = 1; page <= 3; page++) all.push(...(await danhSachNguoi({ source: null, q: "", page }, sc)).rows)
  let soAssert = 0
  for (const [key, kv] of Object.entries(KY_VONG)) {
    const hang = all.filter((r) => r.partyKey === key)
    assert.equal(hang.length, kv.hang ? 1 : 0, `DBN-AC-2 ${key} có hàng`)
    if (kv.hang) {
      assert.equal(hang[0].soTin, kv.soTin, `DBN-AC-2 ${key === P[5] ? "P5 " : ""}số tin ${key}`)
      assert.equal(hang[0].soBiDanh, kv.soBiDanh, `DBN-AC-2 số bí danh ${key}`)
    }
    soAssert++
  }
  assert.equal(soAssert, Object.keys(KY_VONG).length)
  assert.deepEqual(all.slice(0, THU_TU.length).map((r) => r.partyKey), THU_TU, "DBN-AC-2 thứ tự hàng theo số tin")
  // Chiều đỏ: đếm cả vai rút → P5 thành 5 tin.
  const dot = await banDot("AND r.retracted_at IS NULL)::int AS so_tin", ")::int AS so_tin")
  const p5 = (await dot.danhSachNguoi({ source: "S03", q: "", page: 1 }, sc)).rows.find((r) => r.partyKey === P[5])
  assert.throws(() => assert.equal(p5?.soTin, KY_VONG[P[5]].soTin, "DBN-AC-2 P5 số tin"), /DBN-AC-2 P5 số tin/)
})

test("DBN-AC-3 lọc nguồn, tìm khác hoa thường, chia trang 100, trang lạ về 1, trang nói k/n và tổng", async () => {
  const { danhSachNguoi, parsePage, parseSource } = await import("../src/lib/ops/people")
  const s05 = await danhSachNguoi({ source: "S05", q: "", page: 1 }, sc)
  assert.deepEqual([s05.rows.map((r) => r.partyKey), s05.total], [[P[7]], 1])
  const ten = await danhSachNguoi({ source: null, q: "chị lan", page: 1 }, sc)
  assert.deepEqual(ten.rows.map((r) => r.partyKey), [P[2]], "DBN-AC-3 q hoa thường")
  const tk = await danhSachNguoi({ source: null, q: "ACC-P6", page: 1 }, sc)
  assert.deepEqual(tk.rows.map((r) => r.partyKey), [P[6]])
  assert.equal(parseSource("S0X; drop"), null)
  assert.equal(parseSource("abc"), null)
  assert.equal(parseSource("S05"), "S05")
  const trang = [1, 2, 3].map((page) => danhSachNguoi({ source: "S09", q: "", page }, sc))
  const [t1, t2, t3] = await Promise.all(trang)
  assert.deepEqual([t1.rows.length, t2.rows.length, t3.rows.length, t1.total, t1.pages], [100, 100, 30, 230, 3])
  const khoa = new Set([...t1.rows, ...t2.rows, ...t3.rows].map((r) => r.partyKey))
  assert.equal(khoa.size, 230, "DBN-AC-3 trang trùng")
  for (const v of ["0", "-1", "abc", undefined]) assert.equal(parsePage(v), 1)
  const qua = await danhSachNguoi({ source: "S09", q: "", page: parsePage("99") }, sc)
  assert.equal(qua.page, 1)
  assert.deepEqual(qua.rows.map((r) => r.partyKey), t1.rows.map((r) => r.partyKey))
  // Trang thật (page=2, lọc S09): «Trang 2/3», «230 người khớp», ba số đầu trang theo ma trận + lô.
  const html = await htmlDanhSach(ADMIN, { source: "S09", q: "", page: 2 })
  assert.match(html, /Trang 2\/3 · 230 người khớp/)
  assert.match(html, /236 người đang dùng/, "DBN-AC-3 số người không đếm P4 đã gộp")
  assert.match(html, /15 vai Người đăng/, "DBN-AC-3 số vai không đếm vai rút của P5")
  assert.match(html, /S03 5 · S05 1 · S09 230/)
  assert.match(html, /Trang trước/)
  assert.match(html, /Trang sau/)
  // Đối chứng dương: lọc S05 một trang → «Trang 1/1», không nút Trang sau.
  const mot = await htmlDanhSach(ADMIN, { source: "S05", q: "", page: 1 })
  assert.match(mot, /Trang 1\/1 · 1 người khớp/)
  assert.doesNotMatch(mot, /Trang sau|Trang trước/)
  // Chiều đỏ: bỏ lower() → tìm khác hoa thường hỏng; OFFSET 0 → trang trùng.
  const khongLower = await banDot("strpos(lower(a.value), lower($2))", "strpos(a.value, $2)")
  const r1 = await khongLower.danhSachNguoi({ source: null, q: "chị lan", page: 1 }, sc)
  assert.throws(() => assert.deepEqual(r1.rows.map((r) => r.partyKey), [P[2]], "DBN-AC-3 q hoa thường"), /DBN-AC-3 q hoa thường/)
  const offset0 = await banDot("(page - 1) * PAGE_SIZE", "0")
  const d = await Promise.all([1, 2, 3].map((page) => offset0.danhSachNguoi({ source: "S09", q: "", page }, sc)))
  assert.throws(
    () => assert.equal(new Set(d.flatMap((t) => t.rows.map((r) => r.partyKey))).size, 230, "DBN-AC-3 trang trùng"),
    /DBN-AC-3 trang trùng/,
  )
})

test("DBN-AC-4 trang một người: bí danh có nhãn, dấu Đã nghỉ, chỉ vai sống, số vai rút; khoá sai → 404", async () => {
  const p5 = await htmlNguoi(ADMIN, P[5])
  for (let i = 1; i <= 4; i++) assert.ok(p5.includes(`S03:e${i}`), `DBN-AC-4 thiếu tin sống S03:e${i}`)
  assert.ok(!p5.includes("S03:e5"), "DBN-AC-4 vai rút lọt")
  assert.match(p5, /1 vai đã rút không tính/)
  assert.match(p5, /Trường có cấu trúc của nguồn/)
  assert.match(p5, /Sự thật/)
  const p6 = await htmlNguoi(ADMIN, P[6])
  assert.equal(p6.split("Đã nghỉ").length - 1, 1, "DBN-AC-4 dấu Đã nghỉ chỉ ở bí danh nghỉ")
  assert.match(p6, /Tên hiển thị/)
  assert.match(p6, /Tài khoản tại nguồn/)
  const p1 = await htmlNguoi(ADMIN, P[1])
  assert.match(p1, /SĐT băm/)
  for (const sai of ["pty_sai", K(99)]) {
    await assert.rejects(htmlNguoi(ADMIN, sai), (e: unknown) => /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/.test(String((e as { digest?: string }).digest ?? e)))
  }
  // Chiều đỏ: bỏ lọc vai rút ở danh sách tin.
  const dot = await banDot("WHERE r.party_key = $1 AND r.role = 'nguoi_dang' AND r.retracted_at IS NULL", "WHERE r.party_key = $1 AND r.role = 'nguoi_dang'")
  const mot = await dot.motNguoi(P[5], sc)
  assert.throws(() => assert.ok(!mot?.tin.some((t) => t.subjectKey === "S03:e5"), "DBN-AC-4 vai rút lọt"), /DBN-AC-4 vai rút lọt/)
})

test("DBN-AC-5 nhãn suy luận từ 5 tin; dựng hai trang không đổi số dòng; mã chỉ SELECT", async () => {
  const dem = async () =>
    (await sc.query(`SELECT (SELECT count(*) FROM parties) a, (SELECT count(*) FROM registry_aliases) b,
                            (SELECT count(*) FROM registry_events) c, (SELECT count(*) FROM party_roles) d`)).rows[0]
  const truoc = await dem()
  const list = await htmlDanhSach(ADMIN, { source: "S03", q: "", page: 1 })
  const p1 = await htmlNguoi(ADMIN, P[1])
  const p5 = await htmlNguoi(ADMIN, P[5])
  assert.deepEqual(await dem(), truoc, "DBN-AC-5 trang ghi vào danh bạ")
  assert.equal(list.split("Có thể là môi giới").length - 1, 1, "DBN-AC-5 ngưỡng N: chỉ P1 (5 tin) mang nhãn trong danh sách S03")
  assert.match(list, /suy luận/)
  assert.match(p1, /Có thể là môi giới · suy luận/)
  assert.doesNotMatch(p5, /Có thể là môi giới/, "DBN-AC-5 ngưỡng N: P5 (4 tin) không nhãn")
  const src = readFileSync(PEOPLE_TS, "utf8")
  assert.doesNotMatch(src, /\b(INSERT|UPDATE|DELETE|TRUNCATE)\b/)
  // Chiều đỏ: > thay ≥ → P1 (đúng 5 tin) mất nhãn.
  const dot = await banDot("soTin >= NGUONG_MOI_GIOI", "soTin > NGUONG_MOI_GIOI")
  assert.throws(() => assert.ok(dot.laMoiGioi(5), "DBN-AC-5 ngưỡng N"), /DBN-AC-5 ngưỡng N/)
})

type PageMod = { default: (p: unknown) => Promise<ReactNode> }
const g = globalThis as unknown as { __DBN_NGUOI: User | null }

/** Page thật (bản chép thay getSessionUser bằng phiên giả) → HTML: gate của page, rồi nội dung async page đã trao. */
async function quaPage(mod: PageMod, loai: unknown, props: unknown, u: User | null): Promise<string> {
  g.__DBN_NGUOI = u
  const cay = await mod.default(props)
  const el = timPhanTu(cay, loai)
  if (!el) return renderToStaticMarkup(cay as ReactElement)
  const fn = loai as (p: Record<string, unknown>) => Promise<ReactElement>
  return renderToStaticMarkup(await fn(el.props))
}
const STUB: [string, string] = [
  `import { getSessionUser } from "@/lib/auth"`,
  `const getSessionUser = async () => (globalThis as unknown as { __DBN_NGUOI: unknown }).__DBN_NGUOI as never`,
]

test("DBN-AC-6 ma trận 5 vai × 2 trang qua page thật: viewer thấy số và mã, không thấy bí danh", async () => {
  const listPage = await banChep<PageMod>("src/app/ops/people/page.tsx", [STUB])
  const onePage = await banChep<PageMod>("src/app/ops/people/[partyKey]/page.tsx", [STUB])
  const { PeopleContent } = await import("../src/components/ops/people/people-content")
  const { PersonContent } = await import("../src/components/ops/people/person-content")
  const { AN_VOI_VIEWER } = await import("../src/components/ops/people/people-text")
  let o = 0
  for (const role of [null, "user", "viewer", "ops", "admin"]) {
    const u = user(role)
    const html = [
      await quaPage(listPage, PeopleContent, { searchParams: Promise.resolve({ source: "S03" }) }, u),
      await quaPage(onePage, PersonContent, { params: Promise.resolve({ partyKey: P[1] }) }, u),
    ]
    for (const h of html) {
      o++
      if (role === null || role === "user") {
        assert.ok(!h.includes("pty_") && h.includes("Cần đăng nhập ops."), `DBN-AC-6 ${role ?? "khách"} thấy trang`)
      } else if (role === "viewer") {
        assert.ok(h.includes(P[1]) && h.includes("S03") && h.includes(AN_VOI_VIEWER), "DBN-AC-6 viewer thiếu số/mã")
        for (const s of BI_DANH_CHUOI) assert.ok(!h.includes(s), "DBN-AC-6 viewer thấy bí danh")
      } else {
        assert.ok(h.includes("acc-p1"), `DBN-AC-6 ${role} không thấy bí danh`)
      }
    }
  }
  assert.equal(o, 10)
  // Chiều đỏ: chỗ che dùng canAccessOps thay xemNoiDungTin → viewer thấy bí danh.
  const dot = await banChep<{ PeopleContent: typeof PeopleContent }>("src/components/ops/people/people-content.tsx", [
    [`import { xemNoiDungTin } from "@/lib/ops-access"`, `import { canAccessOps as xemNoiDungTin } from "@/lib/ops-access"`],
  ])
  const h = renderToStaticMarkup(await dot.PeopleContent({ user: user("viewer") as User, loc: { source: "S03", q: "", page: 1 } }))
  assert.throws(() => assert.ok(!h.includes("acc-p1"), "DBN-AC-6 viewer thấy bí danh"), /DBN-AC-6 viewer thấy bí danh/)
})

const BANG_CAM = /\b(source_registry|real_name|users|sessions|user_events|user_profile)\b/
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gi, "d").toLowerCase()

test("DBN-AC-7 nguồn chỉ là mã S0x, tên nguồn thật bị che, SĐT băm 8 ký tự, mã không đọc bảng cấm", async () => {
  const list = await htmlDanhSach(ADMIN, { source: "S03", q: "", page: 1 })
  const p1 = await htmlNguoi(ADMIN, P[1])
  for (const h of [list, p1]) {
    assert.ok(!fold(h).includes(fold("Nguon That Dbn")), "DBN-AC-7 bí danh lộ tên nguồn")
    for (const m of h.match(/S\d\d/g) ?? []) assert.match(m, /^S0[1-9]$/)
  }
  assert.ok(list.includes("Nha Dat S07 24h") && p1.includes("Nha Dat S07 24h"))
  assert.ok(list.includes(`${HASH.slice(0, 8)}…`) && !list.includes(HASH) && !p1.includes(HASH))
  // Đối chứng dương: danh sách tên rỗng → «—», không hiện nguyên văn (đóng chặt).
  const { hienBiDanh } = await import("../src/lib/ops/people")
  assert.equal(hienBiDanh("ten", TEN_LO_NGUON, [], true), "—")
  assert.equal(hienBiDanh("ten", TEN_LO_NGUON, [{ code: "S07", realName: "Nguon That Dbn" }], false), null)
  assert.doesNotMatch(readFileSync(PEOPLE_TS, "utf8"), BANG_CAM)
  // Chiều đỏ 1: bỏ bộ che → tên nguồn lọt.
  const dot = await banDot(`return maskSourceNames(value, entries) ?? "—"`, `return value`)
  assert.throws(
    () => assert.ok(!fold(dot.hienBiDanh("ten", TEN_LO_NGUON, [{ code: "S07", realName: "Nguon That Dbn" }], true) ?? "").includes(fold("Nguon That Dbn")), "DBN-AC-7 bí danh lộ tên nguồn"),
    /DBN-AC-7 bí danh lộ tên nguồn/,
  )
  // Chiều đỏ 2: chèn JOIN source_registry → quét bảng cấm đỏ.
  const chen = readFileSync(PEOPLE_TS, "utf8").replace("FROM parties p WHERE ${LOC}`", "FROM parties p JOIN source_registry sr ON true WHERE ${LOC}`")
  assert.throws(() => assert.doesNotMatch(chen, BANG_CAM, "DBN-AC-7 đọc bảng cấm"), /DBN-AC-7 đọc bảng cấm/)
})

test("DBN-AC-1 cloud và DB thiếu bảng: «Chỉ ở máy thu», 0 truy vấn tới danh bạ", async () => {
  const { pool } = await import("../src/lib/db")
  const goc = pool.query.bind(pool)
  let soTruyVan = 0
  ;(pool as unknown as { query: unknown }).query = (text: string, ...rest: unknown[]) => {
    if (typeof text === "string" && /\b(parties|party_roles|registry_aliases|registry_events)\b/.test(text) && !/to_regclass/.test(text)) soTruyVan++
    return (goc as (...a: unknown[]) => unknown)(text, ...rest)
  }
  try {
    process.env.VERCEL = "1"
    const h = [await htmlDanhSach(ADMIN), await htmlNguoi(ADMIN, P[1])]
    for (const x of h) assert.match(x, /Chỉ ở máy thu/)
    assert.equal(soTruyVan, 0, "DBN-AC-1 cloud vẫn truy vấn")
    // Chiều đỏ: bản chép bỏ nhánh cloud → cùng VERCEL=1 vẫn truy vấn.
    const dot = await banChep<{ PeopleContent: (p: unknown) => Promise<ReactElement> }>("src/components/ops/people/people-content.tsx", [
      [`if (process.env.VERCEL === "1" || (await localOnlyTable("parties")))`, `if (await localOnlyTable("parties"))`],
    ])
    renderToStaticMarkup(await dot.PeopleContent({ user: ADMIN, loc: { source: null, q: "", page: 1 } }))
    assert.throws(() => assert.equal(soTruyVan, 0, "DBN-AC-1 cloud vẫn truy vấn"), /DBN-AC-1 cloud vẫn truy vấn/)
    delete process.env.VERCEL
    // DB thiếu bảng parties → cùng kết quả.
    soTruyVan = 0
    await sc.query(`ALTER TABLE parties RENAME TO parties_vang`)
    try {
      for (const x of [await htmlDanhSach(ADMIN), await htmlNguoi(ADMIN, P[1])]) assert.match(x, /Chỉ ở máy thu/)
      assert.equal(soTruyVan, 0, "DBN-AC-1 thiếu bảng vẫn truy vấn")
    } finally {
      await sc.query(`ALTER TABLE parties_vang RENAME TO parties`)
    }
    // Đối chứng dương: máy thu có bảng → không cảnh báo, có hàng người.
    const co = await htmlDanhSach(ADMIN)
    assert.doesNotMatch(co, /Chỉ ở máy thu/)
    assert.ok(co.includes(P[1]))
  } finally {
    delete process.env.VERCEL
    ;(pool as unknown as { query: unknown }).query = goc
  }
})

test("DBN-AC-8 trạng thái: danh bạ rỗng, lọc không khớp, khung chờ, lỗi bọc vùng", async () => {
  const { PeopleView } = await import("../src/components/ops/people/people-view")
  const { PeopleSkeleton } = await import("../src/components/ops/people/people-skeleton")
  const { LENH_DUNG } = await import("../src/components/ops/people/people-text")
  const rong = renderToStaticMarkup(
    <PeopleView mode="local" tong={{ nguoi: 0, vaiSong: 0, theoNguon: [] }} loc={{ source: null, q: "", page: 1 }} rows={[]} total={0} page={1} pages={1} />,
  )
  assert.ok(rong.includes(LENH_DUNG) && LENH_DUNG === "node pipeline/dung-nguoi.mjs")
  const loc = await htmlDanhSach(ADMIN, { source: null, q: "khongkhopxyz", page: 1 })
  assert.match(loc, /Xoá lọc/)
  assert.match(loc, /href="\/ops\/people"/)
  assert.match(renderToStaticMarkup(<PeopleSkeleton />), /aria-busy="true"[\s\S]*data-slot="skeleton"/)
  const co = await htmlDanhSach(ADMIN)
  assert.doesNotMatch(co, /Xoá lọc|dung-nguoi\.mjs/)
  const { RegionError } = await import("../src/components/states/region-error")
  for (const rel of ["src/app/ops/people/page.tsx", "src/app/ops/people/[partyKey]/page.tsx"]) {
    const mod = await banChep<PageMod>(rel, [STUB])
    g.__DBN_NGUOI = ADMIN
    const cay = await mod.default(rel.includes("partyKey") ? { params: Promise.resolve({ partyKey: P[1] }) } : { searchParams: Promise.resolve({}) })
    assert.ok(isValidElement(cay) && cay.type === RegionError, `DBN-AC-8 ${rel} không bọc RegionError`)
  }
})

test("DBN-AC-9 thanh bên Ops có «Danh bạ người» nhóm Xử lý; portals.md có dòng trang", () => {
  const nav = readFileSync(join(APP, "src/components/shell/nav.tsx"), "utf8")
  const khoi = nav.slice(nav.indexOf(`id: "people"`), nav.indexOf("},", nav.indexOf(`id: "people"`)))
  assert.match(khoi, /label: "Danh bạ người"/)
  assert.match(khoi, /href: "\/ops\/people"/)
  assert.match(khoi, /group: "Xử lý"/)
  assert.match(readFileSync(join(ROOT, "docs/architecture/portals.md"), "utf8"), /^\| `\/ops\/people` \|/m)
})

// Cuối tệp: dựng RegionError trong jsdom với con ném lỗi → câu «Thử lại» hiện (ranh giới lỗi chỉ chạy khi dựng phía khách).
test("DBN-AC-8 RegionError của trang hiện «Thử lại» khi nội dung ném lỗi", async () => {
  const { JSDOM } = await import("jsdom")
  const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3456/ops/people" })
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })
  Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })
  const React = await import("react")
  const { createRoot } = await import("react-dom/client")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  const { RegionError } = await import("../src/components/states/region-error")
  const Nem = () => {
    throw new Error("dbn-thu")
  }
  const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
  const loi = console.error
  console.error = () => {}
  try {
    const root = createRoot(document.getElementById("root")!)
    await React.act(async () => {
      root.render(
        <AppRouterContext.Provider value={router as never}>
          <RegionError what="danh bạ người">
            <Nem />
          </RegionError>
        </AppRouterContext.Provider>,
      )
    })
    const text = document.body.textContent ?? ""
    assert.match(text, /Không tải được danh bạ người/)
    assert.match(text, /Thử lại/)
    await React.act(async () => root.unmount())
  } finally {
    console.error = loi
  }
})
