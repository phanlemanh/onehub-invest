// AC-3: (1) HÀNH VI — tiêm lỗi 53300 vào pg.Client.connect (NODE_OPTIONS --import, cùng bản pg của app) rồi chạy chính tệp
// test thật: k=1 → ON7-AC-2 và ON12-AC-7 (DB local) xanh, có dòng «# lỗi DB tạm thời 53300»; k=∞ → đỏ, thông điệp nêu 53300;
// đối chứng: ca chạm DB KHÔNG bọc (ON7-AC-6 (a)) với k=1 → đỏ. (2) CẤU TRÚC — ON22 bên ghi là tiến trình con (pg riêng của
// pipeline, không tiêm được từ đây): push thử lại theo laLoiBenGhiTam, writerSide kiểm mã trước khi trả payload.
import { execFileSync, spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const APP = path.join(ROOT, "app")
console.log(`root ${ROOT} sha ${execFileSync("git", ["-C", ROOT, "rev-parse", "HEAD"], { encoding: "utf8" }).trim()}`)
const tam = mkdtempSync(path.join(tmpdir(), "tn-tiem-"))
const tiem = path.join(tam, "tiem.mjs")
writeFileSync(tiem, `import { createRequire } from "node:module"
const pg = createRequire(${JSON.stringify(path.join(APP, "package.json"))})("pg")
const k = Number(process.env.TN_TIEM_K); let n = 0; const goc = pg.Client.prototype.connect
pg.Client.prototype.connect = function (...a) {
  if (n < k) { n++; const e = Object.assign(new Error("sorry, too many clients already (tiêm)"), { code: "53300" })
    const cb = a.find((x) => typeof x === "function"); if (cb) { process.nextTick(() => cb(e)); return } return Promise.reject(e) }
  return goc.apply(this, a)
}
`)
const env0 = { ...process.env }; delete env0.NODE_TEST_CONTEXT
function chay(tep, mau, k) {
  const r = spawnSync(process.execPath, ["--import", "tsx", "--test", `--test-name-pattern=${mau}`, `tests/${tep}`], {
    cwd: APP, encoding: "utf8", timeout: 300_000, env: { ...env0, TN_TIEM_K: String(k), NODE_OPTIONS: `--import ${pathToFileURL(tiem).href}` } })
  const out = (r.stdout ?? "") + (r.stderr ?? "")
  return { out, pass: +(out.match(/^ℹ pass (\d+)/m)?.[1] ?? -1), fail: +(out.match(/^ℹ fail (\d+)/m)?.[1] ?? -1) }
}
let bad = 0
const CA = [["ON7-AC-2", "ops-nhan-ma-nguon.test.tsx", "ON7-AC-2 /ops/quality thật trên DB local"], ["ON12-AC-7", "ops-nhan-theo-context.test.tsx", "ON12-AC-7 mọi giá trị đang có trên DB local"]]
try {
  for (const [ma, tep, mau] of CA) {
    const mot = chay(tep, mau, 1)
    if (mot.fail === 0 && mot.pass >= 1 && /# lỗi DB tạm thời 53300 — thử lại/.test(mot.out)) console.log(`ok ${ma}: cham DB qua thu lai (tiem 53300 mot lan → xanh, co dong thu lai)`)
    else { console.log(`THIEU THU LAI ${ma} (k=1: pass ${mot.pass} fail ${mot.fail})`); console.log(mot.out.split("\n").filter((l) => /✖|53300|Error/.test(l)).slice(0, 8).join("\n")); bad = 1 }
    const mai = chay(tep, mau, 1e9)
    if (mai.fail >= 1 && /53300|too many clients/.test(mai.out)) console.log(`ok ${ma}: tiem 53300 mai mai → do, thong diep neu 53300`)
    else { console.log(`THU LAI CHE LOI ${ma} (k=∞: pass ${mai.pass} fail ${mai.fail})`); bad = 1 }
  }
  const dc = chay("ops-nhan-ma-nguon.test.tsx", "ON7-AC-6 vai trò: \\(a\\)", 1)
  if (dc.fail >= 1) console.log("doi chung: ca khong boc (ON7-AC-6 (a)) + tiem 53300 mot lan → do")
  else { console.log(`DOI CHUNG KHONG DO (pass ${dc.pass} fail ${dc.fail})`); bad = 1 }
} finally { rmSync(tam, { recursive: true, force: true }) }
const on22 = readFileSync(path.join(APP, "tests/ops-facts-so-tong-hop.test.tsx"), "utf8")
const push = on22.slice(on22.indexOf("const push = async"), on22.indexOf('describe("ON22-AC-3'))
if (/laLoiBenGhiTam\(r\.stderr\)/.test(push) && /i >= 3/.test(push)) console.log("ok ON22-AC-5: ben ghi thu lai theo laLoiBenGhiTam")
else { console.log("THIEU THU LAI ON22-AC-5 (push)"); bad = 1 }
const ws = on22.slice(on22.indexOf("const writerSide = async"), on22.indexOf("type Layer"))
const iKiem = ws.indexOf("assert.equal(r.code, 0"), iTra = ws.indexOf("return r")
if (iKiem > 0 && iTra > iKiem) console.log("ok ON22-AC-5: kiem ma ben ghi truoc payload")
else { console.log("DOC PAYLOAD TRUOC KHI KIEM MA"); bad = 1 }
if (!bad) console.log("CAU TRUC OK")
process.exit(bad)
