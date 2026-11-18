// lenh-hien.test.ts — hồ sơ _acceptance/tam-dung-nguon-tu-cloud (TV4b), ca hàm thuần «TD-AC-3a», «TD-AC-4», «TD-AC-5»,
// «TD-AC-6», «TD-AC-6c» (executor tdn_hien, không DB). Mỗi ma trận viết trước, đếm phần tử trước khi lặp; đối chứng đỏ
// chạy bản chép tạm của lenh-hien.ts với đúng một chỗ thay.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import * as H from "../src/lib/lenh-hien"
import type { LenhHien } from "../src/lib/lenh-hien"

const TEP = join(dirname(fileURLToPath(import.meta.url)), "../src/lib/lenh-hien.ts")

/** Bản chép tạm cùng thư mục (để alias @/ và import tương đối còn đúng) với một chỗ thay; xoá sau khi dùng. */
async function banSao<T>(tu: string, thanh: string, dung: (m: typeof H) => T | Promise<T>): Promise<T> {
  const goc = readFileSync(TEP, "utf8")
  assert.equal(goc.split(tu).length, 2, `không thấy đúng một chỗ «${tu}» trong lenh-hien.ts`)
  const dot = join(dirname(TEP), `.dot-${process.pid}-${Math.random().toString(36).slice(2)}.ts`)
  writeFileSync(dot, goc.replace(tu, thanh))
  try {
    return await dung((await import(pathToFileURL(dot).href)) as typeof H)
  } finally {
    rmSync(dot, { force: true })
  }
}

const L = (o: Partial<LenhHien>): LenhHien => ({
  id: "c1", type: "source.pause", target: "S05", payload: { reason: "hết credit" }, status: "submitted",
  requested_by: "user:a", approved_by: null, note: null, before: null, after: null, result: null,
  created_at: "2026-11-12T03:00:00Z", decided_at: null, queued_at: null, finished_at: null, ...o,
})
const NOW = Date.parse("2026-11-12T03:06:00Z")

test("TD-AC-3a coTheGui: 5 ô", async () => {
  const o: [string, boolean][] = [
    ["", false], ["   ", false], ["a".repeat(501), false], ["a".repeat(500), true], ["  hết credit ", true],
  ]
  assert.equal(o.length, 5)
  for (const [v, k] of o) assert.equal(H.coTheGui(v), k, JSON.stringify(v).slice(0, 20))
  await banSao("const t = lyDo.trim()", "const t = lyDo", (m) => {
    assert.equal(m.coTheGui("   "), true, "khoang-trang: bản sao bỏ trim phải nhận ô khoảng trắng")
  })
})

test("TD-AC-4 trangThaiLenh: 8 ô nhãn + tone", async () => {
  const o: [string, LenhHien, string, H.ToneLenh, string?][] = [
    ["submitted S03", L({ target: "S03" }), "Chờ người thứ hai duyệt", "info-light"],
    ["submitted S05", L({}), "Chờ duyệt", "warning-light"],
    ["approved", L({ status: "approved" }), "Chờ máy thu nhận", "warning-light"],
    ["queued", L({ status: "queued", queued_at: "2026-11-12T03:05:00Z" }), "Máy thu đã nhận lúc 10:05", "info-light"],
    ["applied", L({ status: "applied", finished_at: "2026-11-12T03:07:00Z", before: { status: "active" }, after: { status: "paused" } }),
      "Đã áp lúc 10:07", "success-light", "Đang chạy → Tạm dừng"],
    ["failed", L({ status: "failed", result: { ly_do: "nguon-khong-active" } }),
      "Không áp được: nguồn không ở trạng thái Đang chạy", "destructive-light"],
    ["reverted", L({ status: "reverted" }), "Đã hoàn lại", "secondary"],
    ["rejected", L({ status: "rejected" }), "Bị từ chối", "secondary"],
  ]
  assert.equal(o.length, 8)
  for (const [ten, cmd, nhan, tone, ts] of o) {
    const r = H.trangThaiLenh(cmd, "2026-11-12T03:05:30Z", NOW)
    assert.equal(r.nhan, nhan, ten)
    assert.equal(r.tone, tone, `${ten} tone`)
    if (ts) assert.equal(r.truoc_sau, ts, `${ten} truoc_sau`)
  }
  assert.ok(o[5][2].startsWith("Không áp được:"))
  await banSao('const GIO_VN = "Asia/Ho_Chi_Minh"', 'const GIO_VN = "UTC"', (m) => {
    assert.equal(m.trangThaiLenh(o[3][1], null, NOW).nhan, "Máy thu đã nhận lúc 03:05", "gio-vn: bản sao giờ UTC phải ra 03:05")
  })
})

test("TD-AC-5 cờ máy thu: 7 ô", async () => {
  const o: [string, LenhHien, string | null, string | null][] = [
    ["approved chưa kéo", L({ status: "approved" }), null, "Máy thu chưa kéo lệnh lần nào"],
    ["approved cũ 6′", L({ status: "approved" }), "2026-11-12T03:00:00Z", "Máy thu chưa nhận lệnh từ 10:00"],
    ["approved cũ 4′", L({ status: "approved" }), "2026-11-12T03:02:00Z", null],
    ["queued", L({ status: "queued", queued_at: "2026-11-12T03:01:00Z" }), null, null],
    ["applied", L({ status: "applied", finished_at: "2026-11-12T03:01:00Z" }), null, null],
    ["submitted", L({}), null, null],
    ["approved kéo ở tương lai", L({ status: "approved" }), "2026-11-12T03:10:00Z", null],
  ]
  assert.equal(o.length, 7)
  for (const [ten, cmd, keo, canh] of o) assert.equal(H.trangThaiLenh(cmd, keo, NOW).canh, canh, ten)
  await banSao('cmd.status === "approved" && ', "", (m) => {
    assert.notEqual(m.trangThaiLenh(o[3][1], null, NOW).canh, null, "chi-approved: bản sao bỏ điều kiện phải gắn cờ cho queued")
  })
})

test("TD-AC-6 nutNguon: 30 ô", async () => {
  const VAI = ["viewer", "ops", "admin"] as const
  const TT = ["active", "paused", "draft", "retired", "completed"] as const
  const CHO = [false, true] as const
  const N = { nut: null }
  const G = { nut: null, ghi_chu: "Đang có lệnh chờ" }
  // Bảng kỳ vọng viết tay: vai · trạng thái · có lệnh chờ → kết quả.
  const KY_VONG: Record<string, unknown> = {
    "viewer·active·false": N, "viewer·active·true": G, "viewer·paused·false": N, "viewer·paused·true": G,
    "viewer·draft·false": N, "viewer·draft·true": N, "viewer·retired·false": N, "viewer·retired·true": N,
    "viewer·completed·false": N, "viewer·completed·true": N,
    "ops·active·false": { nut: "pause" }, "ops·active·true": G, "ops·paused·false": N, "ops·paused·true": G,
    "ops·draft·false": N, "ops·draft·true": N, "ops·retired·false": N, "ops·retired·true": N,
    "ops·completed·false": N, "ops·completed·true": N,
    "admin·active·false": { nut: "pause" }, "admin·active·true": G, "admin·paused·false": { nut: "resume" }, "admin·paused·true": G,
    "admin·draft·false": N, "admin·draft·true": N, "admin·retired·false": N, "admin·retired·true": N,
    "admin·completed·false": N, "admin·completed·true": N,
  }
  const o = VAI.flatMap((v) => TT.flatMap((t) => CHO.map((c) => [v, t, c] as const)))
  assert.equal(o.length, 30)
  assert.equal(Object.keys(KY_VONG).length, 30)
  for (const [v, t, c] of o) assert.deepEqual(H.nutNguon(v, t, c), KY_VONG[`${v}·${t}·${c}`], `${v}·${t}·${c}`)
  const dem = (k: string) => o.filter(([v, t, c]) => H.nutNguon(v, t, c).nut === k).length
  assert.deepEqual([dem("pause"), dem("resume")], [2, 1])
  assert.equal(o.filter(([v, t, c]) => H.nutNguon(v, t, c).ghi_chu).length, 6)
  const { BAC_VAI } = await import("../src/lib/ops-access")
  assert.deepEqual({ ...H.BAC_VAI }, BAC_VAI, "bậc vai của lenh-hien phải bằng ops-access")
  await banSao('BAC_VAI[vai] >= BAC_VAI.admin', 'BAC_VAI[vai] >= BAC_VAI.ops', (m) => {
    assert.deepEqual(m.nutNguon("ops", "paused", false), { nut: "resume" }, "resume-admin: bản sao cho ops bật lại phải lệch ô ops·paused")
  })
})

test("TD-AC-6c trangThaiHieuLuc: 4 ô", async () => {
  const MOC = "2026-11-12T03:00:00Z"
  const apSau = L({ status: "applied", finished_at: "2026-11-12T03:05:00Z", after: { status: "paused" } })
  const apTruoc = L({ status: "applied", finished_at: "2026-11-12T02:55:00Z", after: { status: "paused" } })
  const hong = L({ id: "c2", status: "failed", finished_at: "2026-11-12T03:06:00Z" })
  const o: [string, LenhHien[], string][] = [
    ["áp sau mốc", [apSau], "paused"],
    ["áp trước mốc", [apTruoc], "active"],
    ["mới nhất là failed", [hong, apTruoc], "active"],
    ["không lệnh", [], "active"],
  ]
  assert.equal(o.length, 4)
  for (const [ten, ls, k] of o) assert.equal(H.trangThaiHieuLuc("active", MOC, ls), k, ten)
  await banSao("Date.parse(l.finished_at) > moc", "true", (m) => {
    assert.equal(m.trangThaiHieuLuc("active", MOC, [apTruoc]), "paused", "moc-ban-tin: bản sao bỏ so mốc phải lệch ô thứ hai")
  })
})
