// _goc.mjs — chép bộ đọc tại commit trước khi sửa ra thư mục chạy, để so cũ với mới bằng đúng mã cũ.
import { execSync } from "node:child_process"
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
export const THU_MUC_CHAY = path.join(ROOT, ".acceptance-runs/doc-so-m2-bi-sot")
export const GOC = "9976fb01"
export const pg = createRequire(path.join(ROOT, "app/package.json"))("pg")
export const docJson = (ten) => JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), ten), "utf8"))

/** Thư mục tạm chứa pipeline/ tại `commit` (không có commit thì lấy cây hiện tại), node_modules trỏ về bản của cây. */
export function chepPipeline(ten, commit = GOC) {
  const dich = path.join(THU_MUC_CHAY, `${ten}-${process.pid}`)
  fs.mkdirSync(dich, { recursive: true })
  if (commit) execSync(`git archive ${commit} pipeline | tar -x -C ${JSON.stringify(dich)}`, { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"] })
  else fs.cpSync(path.join(ROOT, "pipeline"), path.join(dich, "pipeline"), { recursive: true, filter: (p) => !p.includes(`${path.sep}node_modules`) })
  fs.symlinkSync(path.join(ROOT, "pipeline/node_modules"), path.join(dich, "pipeline/node_modules"))
  return dich
}

export const donChep = (dich) => fs.rmSync(dich, { recursive: true, force: true })

export function kiem(loi, dieu, okMsg, failMsg) {
  if (dieu) console.log(`ok ${okMsg}`)
  else {
    console.log(`FAIL ${failMsg}`)
    loi.push(failMsg)
  }
}
