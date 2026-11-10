// suite-chung-bo-ca.test.tsx — hồ sơ app-test-chap-chon-e4b-sap AC-1, AC-2: bộ test app chung bỏ đúng bốn ca đo theo
// tải (E4B-AC-3, E4B-AC-4, E4B-AC-7, CGT-DC); chạy riêng thì ca chạy thật với nguyên trần đã ký. Không cần DB.
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { test } from "node:test"

import { BIEN_SUITE_CHUNG, boQuaTrongSuiteChung } from "./helpers/suite-chung"

const TESTS = join(import.meta.dirname)
const HAI_TEP = ["tin-rao-doi-chieu.test.tsx", "can-gia-tot-doi-chieu.test.tsx"]

type BoQua = (executor: string, env: Record<string, string | undefined>) => string | false

/** Hàm bỏ qua đúng hai chiều: bộ chung → lý do gọi tên executor; chạy riêng → không bỏ qua. */
function kiemHamBoQua(f: BoQua) {
  const chung = f("tir_doi_chieu", { [BIEN_SUITE_CHUNG]: "1" })
  if (chung !== "chạy riêng qua executor tir_doi_chieu") throw new Error(`BO QUA SAI LY DO: ${String(chung)}`)
  if (f("tir_doi_chieu", {}) !== false) throw new Error("BO QUA KHI CHAY RIENG")
  if (f("tir_doi_chieu", { [BIEN_SUITE_CHUNG]: "0" }) !== false) throw new Error("BO QUA KHI CHAY RIENG")
}

/** Mọi hằng số trong một tệp test, theo thứ tự — trần 700/1000 ms, timeout, giới hạn song song đều nằm trong đây. */
function soTran(src: string): string[] {
  return (src.match(/\b\d[\d_]*\b/g) ?? []).filter((s) => !/^\d+$/.test(s) || Number(s) > 1)
}

function kiemTran(truoc: string, sau: string, tep: string) {
  if (JSON.stringify(soTran(truoc)) !== JSON.stringify(soTran(sau))) throw new Error(`TRAN BI DOI ${tep}`)
}

/** Đúng bốn ca dùng hàm bỏ qua, mỗi ca gọi đúng executor riêng của hồ sơ mình. */
function demCaBoQua(src: string, executor: string): string[] {
  const ca: string[] = []
  for (const m of src.matchAll(/test\("([^"]+)",\s*\{[^}]*boQuaTrongSuiteChung\("([^"]+)"\)/g)) {
    if (m[2] !== executor) throw new Error(`BO QUA SAI EXECUTOR ${m[1]}: ${m[2]}`)
    ca.push(m[1].split(" ")[0] === "CGT-DC" ? "CGT-DC" : m[1].split(" ")[0])
  }
  return ca
}

test("SCB-AC-1 bộ chung bỏ đúng bốn ca đo theo tải, mỗi ca gọi tên executor riêng", () => {
  const e4b = demCaBoQua(readFileSync(join(TESTS, HAI_TEP[0]), "utf8"), "tir_doi_chieu")
  const cgt = demCaBoQua(readFileSync(join(TESTS, HAI_TEP[1]), "utf8"), "can_gia_tot_doi_chieu")
  assert.deepEqual(e4b.sort(), ["E4B-AC-3", "E4B-AC-4", "E4B-AC-7"], "SAI SO CA BO QUA E4b")
  assert.deepEqual(cgt, ["CGT-DC"], "SAI SO CA BO QUA CGT-DC")
  const pkg = JSON.parse(readFileSync(join(TESTS, "..", "package.json"), "utf8"))
  assert.match(pkg.scripts.test, new RegExp(`^${BIEN_SUITE_CHUNG}=1 `), "npm test không đặt biến bộ chung")
  // Đối chứng: ca thứ năm dùng hàm bỏ qua thì bộ đếm phải thấy.
  const them = `test("E4b đối chiếu DB máy thu", { skip: boQuaTrongSuiteChung("tir_doi_chieu") }, () => {})\n`
  assert.notDeepEqual(demCaBoQua(them + readFileSync(join(TESTS, HAI_TEP[0]), "utf8"), "tir_doi_chieu").sort(), ["E4B-AC-3", "E4B-AC-4", "E4B-AC-7"])
})

test("SCB-AC-2 chạy riêng thì không bỏ qua; trần đã ký không đổi; bản phá đỏ đúng thông điệp", () => {
  kiemHamBoQua(boQuaTrongSuiteChung)
  // Đột biến: bỏ qua cả khi chạy riêng — phải đỏ BO QUA KHI CHAY RIENG.
  assert.throws(() => kiemHamBoQua((ex) => `chạy riêng qua executor ${ex}`), /BO QUA KHI CHAY RIENG/)

  // Đột biến trần: đổi 700 → 1000 trong bản sao phải đỏ TRAN BI DOI.
  const src = readFileSync(join(TESTS, HAI_TEP[0]), "utf8")
  assert.ok(src.includes("700"), "tệp E4b không còn trần 700")
  assert.throws(() => kiemTran(src, src.replace("700", "1000"), HAI_TEP[0]), /TRAN BI DOI/)
})

test("SCB-AC-2 hằng trần của hai tệp bằng bản ở gốc nhánh", { skip: process.env.CI ? "CI kho chép nông, không có gốc nhánh" : false }, () => {
  const goc = execFileSync("git", ["merge-base", "HEAD", "origin/main"], { cwd: TESTS, encoding: "utf8" }).trim()
  for (const tep of HAI_TEP) {
    const truoc = execFileSync("git", ["show", `${goc}:app/tests/${tep}`], { cwd: TESTS, encoding: "utf8" })
    kiemTran(truoc, readFileSync(join(TESTS, tep), "utf8"), tep)
  }
})
