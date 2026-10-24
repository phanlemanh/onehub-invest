// gio-ops-gio-vn.test.tsx — cổng Ops đọc mốc theo giờ Việt Nam (OPS-7) và nguồn quá hạn hiện mức trễ (YC4).
// Hồ sơ nghiệm thu: _acceptance/gio-ops-gio-vn (AC-1…AC-5, AC-7…AC-9; AC-6 ở pipeline/scripts/vn-day.test.mjs).
// Tên ca mở đầu bằng mã AC (GV-AC-n).
import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { fmtOverdue } from "../src/lib/freshness"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const MUI_MAY = ["UTC", "America/New_York"] as const

/**
 * Chạy bộ định dạng trong TIẾN TRÌNH CON có TZ đặt từ lúc khởi động: Intl dựng lúc nạp module theo múi máy, nên đổi
 * process.env.TZ giữa chừng không chứng gì (phá-thử 24/10: bỏ timeZone mà ca vẫn xanh trên máy giờ VN).
 */
function chayDuoiMui(mui: string, file: string, dauVao: unknown[]): { gio: string; ngay: string }[] {
  const code = `const m = await import(${JSON.stringify(pathToFileURL(file).href)});
const vao = JSON.parse(process.argv[1]).map(([k, v]) => (k === "date" ? new Date(v) : v));
process.stdout.write(JSON.stringify(vao.map((v) => ({ gio: m.fmtVnDateTime(v), ngay: m.fmtVnDate(v) }))));`
  const ma = dauVao.map((v) => (v instanceof Date ? ["date", v.toISOString()] : ["v", v]))
  const out = execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", code, JSON.stringify(ma)], {
    cwd: APP,
    env: { ...process.env, TZ: mui },
    encoding: "utf8",
  })
  return JSON.parse(out) as { gio: string; ngay: string }[]
}

// ---------- AC-1: bộ định dạng ----------

const MA_TRAN: [string, unknown, string, string][] = [
  ["ISO Z", "2026-10-23T12:13:00Z", "2026-10-23 19:13 (GMT+7)", "2026-10-23"],
  ["16:59Z (23:59 VN)", "2026-10-23T16:59:00Z", "2026-10-23 23:59 (GMT+7)", "2026-10-23"],
  ["17:00Z (nửa đêm VN)", "2026-10-23T17:00:00Z", "2026-10-24 00:00 (GMT+7)", "2026-10-24"],
  ["17:30Z (00:30 VN)", "2026-10-23T17:30:00Z", "2026-10-24 00:30 (GMT+7)", "2026-10-24"],
  ["date -Iseconds +07:00", "2026-10-24T00:30:12+07:00", "2026-10-24 00:30 (GMT+7)", "2026-10-24"],
  ["Postgres ::text +00", "2026-10-23 12:13:45.123+00", "2026-10-23 19:13 (GMT+7)", "2026-10-23"],
  ["không ghi múi", "2026-10-24 00:30:12", "—", "—"],
  ["Date", new Date("2026-10-23T12:13:00Z"), "2026-10-23 19:13 (GMT+7)", "2026-10-23"],
  ["số mili giây", Date.UTC(2026, 9, 23, 17, 30), "2026-10-24 00:30 (GMT+7)", "2026-10-24"],
  ["null", null, "—", "—"],
  ["chuỗi rác", "hôm qua", "—", "—"],
]

test("GV-AC-1 fmtVnDateTime/fmtVnDate ma trận viết trước dưới TZ=UTC và TZ=America/New_York", () => {
  assert.equal(MA_TRAN.length, 11)
  for (const mui of MUI_MAY) {
    const kq = chayDuoiMui(mui, join(APP, "src/lib/format.ts"), MA_TRAN.map((r) => r[1]))
    MA_TRAN.forEach(([ten, , gio, ngay], i) => {
      assert.equal(kq[i].gio, gio, `${ten} · fmtVnDateTime · TZ=${mui}`)
      assert.equal(kq[i].ngay, ngay, `${ten} · fmtVnDate · TZ=${mui}`)
    })
  }
})

// ---------- AC-7: mức trễ ----------

const SLO = 8 * 24
const MA_TRAN_TRE: [string, number | null, number | null, string | null][] = [
  ["8,4 ngày / 8 ngày", 8.4 * 24, SLO, "trễ 9 giờ"],
  ["SLO + 30 giây", SLO + 30 / 3600, SLO, "trễ 1 phút"],
  ["SLO + 59 phút", SLO + 59 / 60, SLO, "trễ 59 phút"],
  ["SLO + 60 phút", SLO + 1, SLO, "trễ 1 giờ"],
  ["SLO + 47 giờ 59 phút", SLO + 47 + 59 / 60, SLO, "trễ 47 giờ"],
  ["SLO + 48 giờ", SLO + 48, SLO, "trễ 2 ngày"],
  ["SLO + 3 ngày 5 giờ", SLO + 77, SLO, "trễ 3 ngày"],
  ["30 giờ / 24 giờ", 30, 24, "trễ 6 giờ"],
  ["tuổi = SLO", SLO, SLO, null],
  ["7 ngày / 8 ngày", 7 * 24, SLO, null],
  ["tuổi null", null, SLO, null],
]

test("GV-AC-7 fmtOverdue ma trận viết trước", () => {
  assert.equal(MA_TRAN_TRE.length, 11)
  for (const [ten, tuoi, slo, mong] of MA_TRAN_TRE) assert.equal(fmtOverdue(tuoi, slo), mong, ten)
})
