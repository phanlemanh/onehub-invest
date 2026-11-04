#!/usr/bin/env node
// people-hien-so-goc E8 (AC-8): chữ về SĐT nói đúng quyền mới, khối 4 của lệnh kiểm cổng đo
// cổng mới. `--moi <chuỗi>`: quét một chuỗi mồi như quét tệp, để đối chứng đỏ. Đầu ra không chứa số điện thoại.
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..")
const doc = (p) => readFileSync(join(ROOT, p), "utf8")

/** Dòng còn gọi SĐT là tầng A hay còn nhãn che. */
const chuCu = (s) =>
  s.split("\n").filter((l) => /SĐT \(đã che\)|NHAN_CHE_SDT/.test(l) || (/tầng A/.test(l) && /SĐT|seller_phone|liên hệ/i.test(l)))

function quetMa(thuMuc) {
  const out = []
  for (const e of readdirSync(thuMuc)) {
    const f = join(thuMuc, e)
    if (statSync(f).isDirectory()) out.push(...quetMa(f))
    else if (/\.tsx?$/.test(e) && /NHAN_CHE_SDT/.test(readFileSync(f, "utf8"))) out.push(f.slice(ROOT.length + 1))
  }
  return out
}

const moi = process.argv.indexOf("--moi")
if (moi >= 0) {
  const sai = chuCu(process.argv[moi + 1] ?? "")
  if (sai.length) {
    console.error(`SHS-AC-8 chữ cũ trong chuỗi mồi: ${sai.length} dòng`)
    process.exit(1)
  }
  process.exit(0)
}

const loi = []
for (const p of ["app/src/lib/deals.ts", "app/src/app/ops/deals/page.tsx", "app/src/lib/ops/people.ts"]) {
  if (chuCu(doc(p)).length) loi.push(`${p} còn gọi SĐT là tầng A hay còn nhãn che`)
}
for (const f of quetMa(join(ROOT, "app/src"))) loi.push(`${f} còn NHAN_CHE_SDT`)
const biDanh = doc("CONTEXT.md").split("\n").find((l) => l.startsWith("**Bí danh**")) ?? ""
if (!biDanh) loi.push("CONTEXT.md không có dòng Bí danh")
if (/đã che/.test(biDanh)) loi.push("CONTEXT.md dòng Bí danh còn «đã che»")
if (!/Vận hành/.test(biDanh)) loi.push("CONTEXT.md dòng Bí danh chưa nói quyền vai Vận hành")

// Khối 4 chạy trên bản chép các tệp của nó: trang đúng thì đạt, trang tính cổng sai thì đỏ đúng dòng. Tệp đổi theo
// can-gia-tot-biet-can (bảng + phần thân thay thẻ); ý của phép đo giữ nguyên.
const PAGE = "app/src/app/ops/deals/page.tsx"
const TEP = [
  PAGE,
  "app/src/app/ops/deals/[offerId]/page.tsx",
  "app/src/components/ops/deal-body.tsx",
  "app/src/components/ops/deals-grid.tsx",
  "app/src/components/ops/deal-sheet.tsx",
  "app/src/components/ops/deal-similar.tsx",
  "app/src/components/ops/deals-cells.tsx",
]
const CONG = "const xemNoiDung = xemNoiDungTin(user);"
if (!doc(PAGE).includes(CONG)) loi.push(`${PAGE} không tính xemNoiDung từ xemNoiDungTin`)
const tam = mkdtempSync(join(tmpdir(), "shs-chu-"))
try {
  for (const p of TEP) {
    mkdirSync(dirname(join(tam, p)), { recursive: true })
    writeFileSync(join(tam, p), doc(p))
  }
  const chay = () =>
    spawnSync(process.execPath, [join(ROOT, "scripts/check-portal-compliance.mjs"), "--only", "deals-gate", "--root", tam], { encoding: "utf8" })
  const lanh = chay()
  if (lanh.status !== 0 || (lanh.stdout.match(/^ok /gm) ?? []).length < 7) loi.push("đối chứng dương: khối 4 không đạt trên bản chép lành")
  for (const [ten, tu, thanh, dong] of [
    ["mở cho mọi vai vào Ops", CONG, "const xemNoiDung = true;", "FAIL ops/deals tính xemNoiDung từ xemNoiDungTin(user)"],
    ["trở lại cổng admin", CONG, "const xemNoiDung = isAdmin(user);", "FAIL ops/deals tính xemNoiDung từ xemNoiDungTin(user)"],
    ["bỏ lọc trường theo vai", "dealTheoVai(d, { lienHe: xemNoiDung, noiDung: xemNoiDung })", "d", "FAIL ops/deals lọc trường theo vai trước khi vào bảng"],
  ]) {
    if (!doc(PAGE).includes(tu)) loi.push(`đột biến không áp được: ${ten}`)
    writeFileSync(join(tam, PAGE), doc(PAGE).replace(tu, thanh))
    const r = chay()
    if (r.status !== 1 || !r.stdout.includes(dong)) loi.push(`khối 4 không đỏ khi ${ten}`)
    writeFileSync(join(tam, PAGE), doc(PAGE))
  }
} finally {
  rmSync(tam, { recursive: true, force: true })
}

// Đối chứng đỏ: chuỗi mồi mang nhãn che cũ phải thoát 1 với mã ghim; chuỗi sạch thoát 0.
const f = fileURLToPath(import.meta.url)
const moiDo = spawnSync(process.execPath, [f, "--moi", "Số hiện «SĐT (đã che)» ở mọi vai"], { encoding: "utf8" })
if (moiDo.status !== 1 || !moiDo.stderr.includes("SHS-AC-8")) loi.push("đối chứng đỏ: chuỗi mồi không bị bắt")
if (spawnSync(process.execPath, [f, "--moi", "Số hiện cho vai Vận hành"], { encoding: "utf8" }).status !== 0) loi.push("đối chứng dương: chuỗi sạch bị bắt nhầm")

if (loi.length) {
  for (const l of loi) console.error(`SHS-AC-8 ${l}`)
  process.exit(1)
}
console.log("SHS-AC-8 đạt: chữ đúng quyền mới, khối 4 đo cổng mới và đỏ khi cổng sai")
