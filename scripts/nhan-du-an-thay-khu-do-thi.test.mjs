// Lưới chữ hiển thị «Dự án» thay «Khu đô thị» (hồ sơ nhan-du-an-thay-khu-do-thi-ops, ROADMAP §3 mục 39 Hỏi-1).
// NDT-AC-1: không dòng .ts/.tsx nào trong app/src còn «khu đô thị» trừ dòng nói quy mô.
// NDT-AC-2: ma trận viết trước tệp × chuỗi mới, cùng các khoá giữ nguyên.
// NDT-AC-3: «danh mục dự án» không nằm trong dòng _Avoid_ nào của CONTEXT.md.
import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, appendFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative } from "node:path"

const ROOT = new URL("..", import.meta.url).pathname
const MOC = "5508f6209d5abe3ee654ca0738745155d7bfc3e6"
const TAM_TEP = [
  "app/src/components/ops/sources/so-don-vi.tsx",
  "app/src/components/ops/sources/so-don-vi-dialog.tsx",
  "app/src/components/ops/quality/do-hang-ngay.tsx",
  "app/src/components/ops/quality/lam-giau-bang.tsx",
  "app/src/lib/so-don-vi.ts",
  "app/src/lib/dq-labels.ts",
  "app/src/lib/labels-normalize.ts",
  "app/src/lib/do-hang-ngay.ts",
]

// Luật một dòng: có «khu đô thị» (không phân biệt hoa thường) mà không nói quy mô → vi phạm.
export function viPhamDong(dong) {
  return /khu đô thị/iu.test(dong) && !/quy mô/iu.test(dong)
}

export function quetChu(tep, noiDung) {
  const ra = []
  noiDung.split("\n").forEach((d, i) => {
    if (viPhamDong(d)) ra.push(`NDT-AC-1 ${tep}:${i + 1} còn chữ Khu đô thị`)
  })
  return ra
}

function lietTep(goc, thuMuc) {
  const ra = []
  for (const ten of readdirSync(join(goc, thuMuc))) {
    const p = join(thuMuc, ten)
    const st = statSync(join(goc, p))
    if (st.isDirectory()) ra.push(...lietTep(goc, p))
    else if (/\.tsx?$/.test(ten)) ra.push(p)
  }
  return ra
}

export function quetCay(goc) {
  const tep = lietTep(goc, "app/src")
  const viPham = tep.flatMap((t) => quetChu(t, readFileSync(join(goc, t), "utf8")))
  return { soTep: tep.length, viPham }
}

// Ma trận viết trước: tệp × chuỗi phải có mặt sau vòng.
export const MA_TRAN = [
  ["app/src/components/ops/sources/so-don-vi.tsx", 'header: "Dự án"'],
  ["app/src/components/ops/sources/so-don-vi.tsx", '"Đã khai thị trường, dự án"'],
  ["app/src/components/ops/sources/so-don-vi.tsx", 'aria-label="Khai thị trường, dự án"'],
  ["app/src/components/ops/sources/so-don-vi.tsx", 'id: "projects"'],
  ["app/src/components/ops/sources/so-don-vi-dialog.tsx", "Khai thị trường, dự án"],
  ["app/src/components/ops/sources/so-don-vi-dialog.tsx", 'label="Dự án"'],
  ["app/src/components/ops/sources/so-don-vi-dialog.tsx", 'placeholder="Chọn dự án…"'],
  ["app/src/components/ops/quality/do-hang-ngay.tsx", "tên dự án trong bài"],
  ["app/src/lib/do-hang-ngay.ts", '{ value: "du_an", label: "Dự án" }'],
  ["app/src/lib/labels-normalize.ts", 'project: "Dự án"'],
  ["app/src/lib/labels-normalize.ts", '{ value: "ma-trung-du-an", label: "Mã trùng giữa dự án" }'],
]

export function kiemMaTran(doc) {
  return MA_TRAN.filter(([tep, chuoi]) => !doc(tep).includes(chuoi)).map(([tep, chuoi]) => `NDT-AC-2 ${tep} thiếu ${chuoi}`)
}

export function kiemAvoid(noiDung) {
  const dong = noiDung.split("\n").filter((d) => d.includes("_Avoid_:"))
  const loi = dong.some((d) => /danh mục dự án/iu.test(d)) ? ["NDT-AC-3 danh mục dự án nằm trong _Avoid_"] : []
  return { soDong: dong.length, loi }
}

function cayTam() {
  const d = mkdtempSync(join(tmpdir(), "ndt-"))
  cpSync(join(ROOT, "app/src"), join(d, "app/src"), { recursive: true })
  return d
}

test("NDT-AC-1 lưới phạm vi app/src: 0 dòng còn chữ Khu đô thị (trừ quy mô)", () => {
  const { soTep, viPham } = quetCay(ROOT)
  assert.ok(soTep > 0, "lưới không quét tệp nào")
  assert.deepEqual(viPham, [])
})

test("NDT-AC-1 chiều đỏ cùng fixture: chèn một dòng vào bản chép → đỏ đúng tệp, đúng dòng; dòng có «quy mô» không bị bắt", () => {
  const d = cayTam()
  try {
    const tep = "app/src/lib/do-hang-ngay.ts"
    const truoc = readFileSync(join(d, tep), "utf8")
    const so = truoc.endsWith("\n") ? truoc.split("\n").length : truoc.split("\n").length + 1
    appendFileSync(join(d, tep), (truoc.endsWith("\n") ? "" : "\n") + 'const x = "Khu đô thị"\n')
    assert.deepEqual(quetCay(d).viPham, [`NDT-AC-1 ${tep}:${so} còn chữ Khu đô thị`])
    writeFileSync(join(d, tep), truoc + (truoc.endsWith("\n") ? "" : "\n") + "// khu đô thị là quy mô của dự án\n")
    assert.deepEqual(quetCay(d).viPham, [], "dòng nói quy mô không phải vi phạm")
  } finally {
    rmSync(d, { recursive: true, force: true })
  }
})

test("NDT-AC-1 đối chứng dương: bản main 5508f620 của tám tệp → đúng 18 vi phạm ở 8 tệp", () => {
  const viPham = TAM_TEP.flatMap((t) => quetChu(t, execFileSync("git", ["show", `${MOC}:${t}`], { cwd: ROOT, encoding: "utf8" })))
  assert.equal(viPham.length, 18, viPham.join("\n"))
  assert.equal(new Set(viPham.map((v) => v.split(" ")[1].split(":")[0])).size, 8)
})

test("NDT-AC-2 ma trận tệp × chuỗi hiển thị mới và khoá giữ nguyên", () => {
  assert.equal(MA_TRAN.length, 11)
  assert.deepEqual(kiemMaTran((t) => readFileSync(join(ROOT, t), "utf8")), [])
  const nhan = readFileSync(join(ROOT, "app/src/lib/labels-normalize.ts"), "utf8")
  assert.match(nhan, /^\s+project: "Dự án",$/m, "khoá project của FIELD_LABEL")
})

test("NDT-AC-2 chiều đỏ cùng fixture: labels-normalize mất «Dự án» → đỏ gọi tên ô", () => {
  const doc = (t) => {
    const s = readFileSync(join(ROOT, t), "utf8")
    return t === "app/src/lib/labels-normalize.ts" ? s.replace('project: "Dự án"', 'project: "Du an"') : s
  }
  assert.deepEqual(kiemMaTran(doc), ['NDT-AC-2 app/src/lib/labels-normalize.ts thiếu project: "Dự án"'])
})

test("NDT-AC-3 CONTEXT.md: không dòng _Avoid_ nào chứa «danh mục dự án»", () => {
  const { soDong, loi } = kiemAvoid(readFileSync(join(ROOT, "CONTEXT.md"), "utf8"))
  assert.ok(soDong > 0, "không đọc được dòng _Avoid_ nào")
  assert.deepEqual(loi, [])
})

test("NDT-AC-3 chiều đỏ cùng fixture: chèn lại vào _Avoid_ của «Danh mục CĐT» → đỏ ghim", () => {
  const goc = readFileSync(join(ROOT, "CONTEXT.md"), "utf8").split("\n")
  const i = goc.findIndex((d, k) => d.startsWith("_Avoid_:") && goc.slice(Math.max(0, k - 8), k).some((x) => x.includes("**Danh mục CĐT**")))
  assert.ok(i >= 0, "không tìm thấy dòng _Avoid_ của Danh mục CĐT")
  goc[i] = goc[i] + ", danh mục dự án"
  assert.deepEqual(kiemAvoid(goc.join("\n")).loi, ["NDT-AC-3 danh mục dự án nằm trong _Avoid_"])
})

