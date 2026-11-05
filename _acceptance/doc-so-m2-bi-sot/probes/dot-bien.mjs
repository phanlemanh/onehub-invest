// dot-bien.mjs — E2: phá từng chặn của luật diện tích trên bản sao, ca đúng tên phải đỏ. Bản sao nguyên vẹn phải xanh.
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

import { chepPipeline, donChep, kiem } from "./_goc.mjs"

const DOT_BIEN = [
  { ten: "bo NFKC", ca: "GC1-AC-2", tu: 'const soKieu = gatSo((text ?? "").normalize("NFKC"))', thanh: 'const soKieu = gatSo(text ?? "")' },
  { ten: "bo chan chu sau so", ca: "GC1-AC-3", tu: "[ \\t]*(?:$|[^\\p{L}\\p{N}\\s])/imu", thanh: "/imu" },
  { ten: "bo chan dai", ca: "GC1-AC-3", tu: "(?!\\s*[-–~\\/x×]\\s*\\d)", thanh: "" },
  { ten: "bo chan nhan", ca: "GC1-AC-3", tu: "[-–~\\/x×]", thanh: "[-–~\\/x]" },
  { ten: "bo khoang", ca: "GC1-AC-3", tu: "return v >= 15 && v <= 500 ? v : null", thanh: "return v" },
  { ten: "mo nhan sang dt", ca: "GC1-AC-3", tu: "(?:diện\\s*tích|dien\\s*tich)\\s*[:", thanh: "(?:diện\\s*tích|dien\\s*tich|dt)\\s*[:" },
  { ten: "bo luat nhan", ca: "GC1-AC-1", tu: " ?? dienTichSauNhan(soKieu)", thanh: "" },
  { ten: "dao thu tu", ca: "GC1-AC-4", tu: "dienTichCoDonVi(so) ?? dienTichCoDonVi(soKieu)", thanh: "dienTichCoDonVi(soKieu) ?? dienTichCoDonVi(so)" },
]

function chay(thuMuc) {
  const r = spawnSync("node", ["--test", "--test-reporter=tap", "parse.test.mjs"], { cwd: path.join(thuMuc, "pipeline"), encoding: "utf8" })
  const do_ = [...r.stdout.matchAll(/^\s*not ok \d+ - (.+)$/gm)].map((m) => m[1])
  return { status: r.status, do_ }
}

const loi = []
const dich = chepPipeline("dot-bien", null)
const tep = path.join(dich, "pipeline/transform-zalo.mjs")
const lanh = fs.readFileSync(tep, "utf8")
try {
  const l = chay(dich)
  kiem(loi, l.status === 0, "ban sao lanh", `loi ban sao lanh do: ${l.do_.join(", ")}`)
  for (const d of DOT_BIEN) {
    if (!lanh.includes(d.tu)) {
      kiem(loi, false, "", `loi khong thay moc dot bien: ${d.ten}`)
      continue
    }
    fs.writeFileSync(tep, lanh.replace(d.tu, d.thanh))
    const r = chay(dich)
    kiem(loi, r.do_.some((t) => t.startsWith(d.ca)), `dot bien ${d.ten} do ${d.ca}`, `loi dot bien ${d.ten} khong lam do ${d.ca}: ${r.do_.join(", ") || "khong ca nao do"}`)
  }
} finally {
  donChep(dich)
}
if (loi.length) process.exit(1)
console.log("DOT-BIEN OK")
