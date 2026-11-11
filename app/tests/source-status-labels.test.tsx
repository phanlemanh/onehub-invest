// source-status-labels.test.tsx — mọi trạng thái mã nguồn mà DB cho phép đều có nhãn (hàng nhan-trang-thai-nguon-draft).
// Hồ sơ nghiệm thu: _acceptance/nhan-trang-thai-nguon-draft (AC-1…AC-3). Tên ca mở đầu bằng mã SL-AC-n.
// Ca thuần: đọc tệp migration và CONTEXT.md, không chạm DB — thêm giá trị vào CHECK mà quên nhãn là đỏ ngay ở đây,
// không phải chờ DB local có dòng mang giá trị ấy (ca ON12-AC-7 đọc DB nên chỉ đỏ khi dữ liệu đã lệch).
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { NHAN_TRANG_THAI_NGUON, sourceStatusLabel } from "../src/lib/source-status-labels"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")
const MIG = join(REPO, "db", "migrations")

/** Nối mọi migration theo thứ tự chạy (tên NNN_*.sql). */
function docMigration(): string {
  return readdirSync(MIG)
    .filter((t) => /^\d+_.*\.sql$/.test(t))
    .sort()
    .map((t) => readFileSync(join(MIG, t), "utf8"))
    .join("\n")
}

/** Giá trị của lần đặt CHECK `source_registry_status_chk` CUỐI CÙNG trong chuỗi migration. */
function giaTriCheck(sql: string): string[] {
  const lan = [...sql.matchAll(/source_registry_status_chk\s+CHECK\s*\(\s*status\s+IN\s*\(([^)]*)\)\s*\)/gi)]
  if (lan.length === 0) throw new Error("không thấy CHECK source_registry_status_chk trong migration")
  return [...lan[lan.length - 1][1].matchAll(/'([^']*)'/g)].map((m) => m[1])
}

/** Ném khi có giá trị chưa có nhãn — thông điệp gọi tên từng giá trị. */
function kiemNhan(giaTri: string[]): void {
  const thieu = giaTri.filter((v) => !sourceStatusLabel(v).known)
  if (thieu.length) throw new Error(`trạng thái mã nguồn chưa có nhãn: ${thieu.join(", ")}`)
}

/** Cặp `code` «nhãn» trong khối thuật ngữ «Trạng thái mã nguồn» của CONTEXT.md. */
function capContext(context: string): Record<string, string> {
  const m = /^\*\*Trạng thái mã nguồn\*\*:(.*)$/m.exec(context)
  if (!m) throw new Error("CONTEXT.md thiếu khối thuật ngữ «Trạng thái mã nguồn»")
  return Object.fromEntries([...m[1].matchAll(/`([a-z_]+)` «([^»]+)»/g)].map((x) => [x[1], x[2]]))
}

const SQL = docMigration()
const CONTEXT = readFileSync(join(REPO, "CONTEXT.md"), "utf8")

test("SL-AC-1 draft có nhãn «Chưa thu»; bốn giá trị cũ giữ nhãn; giá trị lạ vẫn là «Giá trị khác»", () => {
  const MT: [string, string][] = [
    ["draft", "Chưa thu"],
    ["active", "Đang dùng"],
    ["paused", "Tạm dừng"],
    ["completed", "Đã xong"],
    ["retired", "Đã ngừng"],
  ]
  for (const [v, nhan] of MT) assert.deepEqual(sourceStatusLabel(v), { label: nhan, known: true }, v)
  assert.equal(Object.keys(NHAN_TRANG_THAI_NGUON).length, MT.length, "bảng nhãn có giá trị ngoài ma trận viết trước")
  for (const v of ["deprecated", "", "Draft", null, undefined])
    assert.deepEqual(sourceStatusLabel(v), { label: "Giá trị khác", known: false }, String(v))
})

test("SL-AC-2 mọi giá trị CHECK source_registry_status_chk có nhãn", () => {
  const gt = giaTriCheck(SQL)
  // Ma trận viết trước: đọc sai khuôn ra mảng rỗng thì kiemNhan xanh suông — ghim đúng tập của migration 047.
  assert.deepEqual([...gt].sort(), ["active", "completed", "draft", "paused", "retired"])
  kiemNhan(gt)
})

test("SL-AC-2 đối chứng: migration sau thêm giá trị chưa có nhãn → đỏ, gọi tên giá trị", () => {
  const sau = `${SQL}\nALTER TABLE source_registry ADD CONSTRAINT source_registry_status_chk\n  CHECK (status IN ('draft', 'active', 'paused', 'retired', 'completed', 'archived'));\n`
  const gt = giaTriCheck(sau)
  assert.ok(gt.includes("archived"), "bộ đọc phải lấy lần đặt CHECK cuối cùng")
  assert.throws(() => kiemNhan(gt), /trạng thái mã nguồn chưa có nhãn: archived$/)
  // Bản thiếu nhãn draft (như trước hàng này) cũng đỏ đúng giá trị ấy.
  const truoc = (v: string) => (v === "draft" ? { label: "Giá trị khác", known: false } : sourceStatusLabel(v))
  assert.deepEqual(gt.filter((v) => !truoc(v).known).sort(), ["archived", "draft"])
  assert.throws(() => giaTriCheck("SELECT 1;"), /không thấy CHECK source_registry_status_chk/)
})

test("SL-AC-2 đối chứng: CHECK của source_groups không lẫn vào source_registry", () => {
  const nhom = "\nALTER TABLE source_groups ADD CONSTRAINT source_groups_status_chk\n  CHECK (status IN ('draft', 'active', 'paused', 'retired', 'completed', 'archived'));\n"
  // (a) chỉ source_groups thêm giá trị → source_registry vẫn đúng năm giá trị, xanh.
  const a = giaTriCheck(SQL + nhom)
  assert.deepEqual([...a].sort(), ["active", "completed", "draft", "paused", "retired"])
  kiemNhan(a)
  // (b) source_registry thêm giá trị, sau đó source_groups đặt lại năm giá trị → vẫn đỏ đúng giá trị của source_registry.
  const dk = "\nALTER TABLE source_registry ADD CONSTRAINT source_registry_status_chk\n  CHECK (status IN ('draft', 'active', 'paused', 'retired', 'completed', 'archived'));\n"
  const nam = "\nALTER TABLE source_groups ADD CONSTRAINT source_groups_status_chk\n  CHECK (status IN ('draft', 'active', 'paused', 'retired', 'completed'));\n"
  assert.throws(() => kiemNhan(giaTriCheck(SQL + dk + nam)), /trạng thái mã nguồn chưa có nhãn: archived$/)
})

test("SL-AC-5 ô trạng thái của danh mục nguồn hiện «Chưa thu» cho mã draft", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server")
  const { RegistryTable } = await import("../src/components/ops/sources/registry-table")
  const dong = (code: string, status: string) => ({ code, real_name: "x", label_vi: "Thử", status, since: "2026-11-10", retired_at: null })
  const html = renderToStaticMarkup(<RegistryTable rows={[dong("S07", "draft"), dong("S01", "active")]} />)
  assert.match(html, />Chưa thu</)
  assert.match(html, />Đang dùng</)
  assert.doesNotMatch(html, /Giá trị khác/)
  assert.doesNotMatch(html, />draft</)
})

test("SL-AC-3 khối thuật ngữ CONTEXT.md khớp bảng nhãn từng cặp", () => {
  assert.deepEqual(capContext(CONTEXT), { ...NHAN_TRANG_THAI_NGUON })
})

test("SL-AC-3 đối chứng: CONTEXT lệch một nhãn hay thiếu khối → đỏ", () => {
  const lech = CONTEXT.replace("`draft` «Chưa thu»", "`draft` «Nháp»")
  assert.notEqual(lech, CONTEXT, "khối CONTEXT phải chứa đúng `draft` «Chưa thu»")
  assert.throws(() => assert.deepEqual(capContext(lech), { ...NHAN_TRANG_THAI_NGUON }), /Nháp/)
  assert.throws(() => capContext("# rỗng"), /thiếu khối thuật ngữ «Trạng thái mã nguồn»/)
})
