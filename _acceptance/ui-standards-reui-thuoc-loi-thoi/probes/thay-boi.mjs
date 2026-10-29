// AC-3: E12 của hồ sơ đã ký ui-standards-reui khai status: not-run + superseded_by trỏ AC-2 của hồ sơ này, cmd giữ nguyên; E7 giữ
// sống; ngoài hai dòng ấy evals.yaml của hồ sơ cũ không đổi so với origin/main. Bộ chứng thay-bởi CỦA KIT (lib/evidence-core.cjs
// notRunConflicts) trên bản giả lập (hồ sơ này signed-off, báo cáo có E2 exit 0) nhận E12; bỏ thẻ bắt tay → «thay-khong-nhan».
import { execFileSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8" })
console.log(`root ${ROOT} sha ${git("rev-parse", "HEAD").trim()}`)
const req = createRequire(import.meta.url)
const { parseEvals } = req(path.join(ROOT, "lib/eval-yaml.cjs"))
const { notRunConflicts } = req(path.join(ROOT, "lib/evidence-core.cjs"))
const SLUG = "ui-standards-reui-thuoc-loi-thoi", CU = "ui-standards-reui"
let bad = 0
const evCu = readFileSync(path.join(ROOT, `_acceptance/${CU}/evals.yaml`), "utf8")
const ev = parseEvals(evCu, ["status", "superseded_by", "cmd"])
const e12 = ev.find((x) => x.id === "E12"), e7 = ev.find((x) => x.id === "E7")
if (e12?.status === "not-run" && e12?.superseded_by === `${SLUG}#AC-2` && e12?.cmd === "config:executors.script.ui_baseline_doc" && !e7?.status && !e7?.superseded_by)
  console.log("ok E12 → AC-2: not-run, superseded_by dung, cmd giu nguyen; E7 giu song")
else { console.log(`THAY BOI SAI: E12=${JSON.stringify(e12)} E7=${JSON.stringify(e7)}`); bad = 1 }
const base = git("merge-base", "origin/main", "HEAD").trim()
const diff = git("diff", "-U0", base, "--", `_acceptance/${CU}/evals.yaml`).split("\n").filter((l) => /^[+-][^+-]/.test(l))
const la = diff.filter((l) => !/^\+    (status: not-run|superseded_by: ui-standards-reui-thuoc-loi-thoi#AC-2)$/.test(l))
if (diff.length === 2 && la.length === 0) console.log("ok evals.yaml cu chi them 2 dong (status, superseded_by)")
else { console.log(`EVALS CU DOI NGOAI 2 DONG: ${la.join(" | ") || diff.length + " dòng"}`); bad = 1 }
// Bản giả lập: chép hai hồ sơ + lib vào thư mục tạm; hồ sơ thay signed-off, báo cáo đã ký có E2 exit 0.
function giaLap(boThe) {
  const T = mkdtempSync(path.join(tmpdir(), "urt-thay-"))
  try {
    for (const s of [CU, SLUG]) cpSync(path.join(ROOT, "_acceptance", s), path.join(T, "_acceptance", s), { recursive: true })
    const hd = path.join(T, "_acceptance", SLUG, "contract.md")
    let t = readFileSync(hd, "utf8").replace(/^status: .*$/m, "status: signed-off")
    if (boThe) t = t.replaceAll(`${CU}/E12`, "ô-cũ")
    writeFileSync(hd, t)
    const dd = /^design_doc: (.+)$/m.exec(t)?.[1]?.trim()
    if (dd) { mkdirSync(path.dirname(path.join(T, dd)), { recursive: true }); writeFileSync(path.join(T, dd), boThe ? "" : readFileSync(path.join(ROOT, dd), "utf8").replaceAll(`${CU}/E12`, "ô-cũ")) }
    writeFileSync(path.join(T, "_acceptance", SLUG, "evidence-report.md"), "---\nverdict: PASS\nhuman_signoff: giả lập\n---\n\n## Evidence\n\n- eval: E2\n  run_id: gia-lap\n  exit_code: 0\n")
    return notRunConflicts(readFileSync(path.join(T, "_acceptance", CU, "evals.yaml"), "utf8"), readFileSync(path.join(T, "_acceptance", CU, "evidence-report.md"), "utf8"), { root: T, slug: CU })
  } finally { rmSync(T, { recursive: true, force: true }) }
}
const r = giaLap(false)
const nhan = (r.thayBoi ?? []).some((x) => (x.id ?? x) === "E12" || JSON.stringify(x).includes("E12"))
if (nhan && !(r.xungDot ?? []).includes("E12")) console.log("ok kit notRunConflicts: E12 thay-boi hop le (gia lap ho so thay signed-off)")
else { console.log(`KIT KHONG NHAN THAY BOI: ${JSON.stringify(r)}`); bad = 1 }
const r2 = giaLap(true)
if (JSON.stringify(r2.lyDo ?? []).includes("thay-khong-nhan")) console.log("ban bo the bat tay: do, ly do thay-khong-nhan")
else { console.log(`CA KHONG DO (bo the): ${JSON.stringify(r2)}`); bad = 1 }
if (!bad) console.log("THAY BOI OK")
process.exit(bad)
