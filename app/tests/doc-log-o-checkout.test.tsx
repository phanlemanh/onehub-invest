// doc-log-o-checkout.test.tsx — ON16 `audit-all-doc-log-o-checkout`: trang Ops ở máy local đọc log job ở checkout chính
// khi app chạy từ worktree. Hai cây tạm dựng bằng git THẬT (git init + git worktree add — tệp .git do git viết); log chỉ
// nằm ở checkout chính tạm. Đối chứng dương: bản sao ops-queries / collections-queries của main 9e3bb9f (`git show`) trên
// cùng cây. KHÔNG gọi lệnh `openclaw` nào, không đọc ~/.openclaw (an toàn Zalo); bước dò hạ tầng (pgrep, GET cổng) chỉ đọc.
// Tên ca mở đầu bằng mã AC để evals bám (ON16-AC-n).
process.env.TZ = "Asia/Ho_Chi_Minh"
delete process.env.VERCEL // nhánh local của readSchedulerStatus

import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, utimesSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import type { LockdownLayer } from "../src/lib/ops-queries"

const APP = path.resolve(import.meta.dirname, "..")
const MAIN_SHA = "9e3bb9f" // main trước ON16 — đường log suy từ cwd của cây đang chạy
const ORIG_CWD = process.cwd()
const TMP = realpathSync(mkdtempSync(path.join(tmpdir(), "on16-app-")))
const MAIN_DIR = path.join(APP, `node_modules/.cache/on16-main-${process.pid}`)

const NOW = new Date("2026-10-24T10:00:00+07:00")
const WD_LAST = "2026-10-24T09:55:00+07:00 ok — bindings=0, mention-all, no bot, handler read-only, 0 turn mới, kev:ok, db:ok"
// Mỗi loại log của lưới Máy móc (design doc §1) → job đọc nó, mtime riêng để không ca nào trùng giờ ca khác.
const LOGS: { file: string; job: string; mtime: string }[] = [
  { file: "airdna-daily.log", job: "s02-daily", mtime: "2026-10-23T19:13:00+07:00" },
  { file: "launchd-smoke.log", job: "s01-smoke", mtime: "2026-10-24T08:00:00+07:00" },
  { file: "launchd-collector-api.log", job: "collector-api", mtime: "2026-10-21T11:37:00+07:00" },
  { file: "weekly-2026-10-19.log", job: "s01-weekly", mtime: "2026-10-19T23:40:00+07:00" },
]

function git(cwd: string, ...args: string[]): void {
  const r = spawnSync("git", ["-c", "user.name=on16", "-c", "user.email=on16@local.test", "-C", cwd, ...args], { encoding: "utf8" })
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`)
}

/** Ghi log vào <gốc>/pipeline/logs: watchdog tươi + bốn loại log job, mỗi tệp mtime riêng. */
function ghiLog(root: string): void {
  const dir = path.join(root, "pipeline/logs")
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, "zalo-watchdog.log"), `2026-10-24T09:50:00+07:00 ok — cũ\n${WD_LAST}\n`)
  for (const l of LOGS) {
    const f = path.join(dir, l.file)
    writeFileSync(f, `bắt đầu\n${l.job} xong lúc ${l.mtime}\n`)
    const t = Date.parse(l.mtime) / 1000
    utimesSync(f, t, t)
  }
}

/** Checkout chính tạm (git init, log gitignore) + worktree tạm (git worktree add, không log), mỗi cây có app/. */
function haiCay(name: string): { main: string; wt: string } {
  const main = path.join(TMP, `${name}-chinh`)
  mkdirSync(path.join(main, "app"), { recursive: true })
  writeFileSync(path.join(main, "app/.keep"), "")
  writeFileSync(path.join(main, ".gitignore"), "pipeline/logs/\n")
  git(main, "init", "-q", "-b", "main")
  git(main, "add", ".")
  git(main, "commit", "-q", "-m", "cay chinh")
  ghiLog(main)
  const wt = path.join(TMP, `${name}-wt`)
  git(main, "worktree", "add", "-q", "-b", `wt-${name}`, wt)
  return { main, wt }
}

const isoOf = (s: string) => new Date(s).toISOString()
const layer = (layers: LockdownLayer[], name: string) => layers.find((l) => l.layer === name)
const wdLayers = (layers: LockdownLayer[]) => ["L1", "L2", "L3", "L4"].map((n) => layer(layers, n)?.ok ?? null)
let emptyAgentDir = ""

let setupErr: string | null = null
before(() => {
  try {
    emptyAgentDir = path.join(TMP, "openclaw-trong")
    mkdirSync(emptyAgentDir, { recursive: true })
    // Bản sao mã main của hai tệp đọc log: viết lại import tương đối/alias thành đường tuyệt đối vào src/lib.
    mkdirSync(MAIN_DIR, { recursive: true })
    for (const f of ["ops-queries.ts", "collections-queries.ts"]) {
      const src = spawnSync("git", ["-C", APP, "show", `${MAIN_SHA}:app/src/lib/${f}`], { encoding: "utf8" }).stdout
      assert.ok(src.length > 0, `không rút được ${f} của ${MAIN_SHA}`)
      writeFileSync(
        path.join(MAIN_DIR, f),
        src.replaceAll('from "./', `from "${path.join(APP, "src/lib")}/`).replaceAll('from "@/', `from "${path.join(APP, "src")}/`),
      )
    }
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  process.chdir(ORIG_CWD)
  rmSync(TMP, { recursive: true, force: true })
  rmSync(MAIN_DIR, { recursive: true, force: true })
  const { pool } = await import("../src/lib/db")
  await pool.end()
})
const ready = () => assert.equal(setupErr, null, `dựng cây tạm / bản sao main không được: ${setupErr}`)

// ---------------------------------------------------------------- AC-4 --
describe("ON16-AC-4 lockdown đọc log watchdog ở checkout chính", () => {
  test("ON16-AC-4 lockdown từ worktree đọc log watchdog ở checkout chính", async () => {
    ready()
    const { wt, main } = haiCay("ac4")
    process.chdir(path.join(wt, "app"))
    const { getLockdownStatus } = await import("../src/lib/ops-queries")
    const r = await getLockdownStatus({ agentLogDir: emptyAgentDir, now: NOW })
    console.log(`# ON16-AC-4 cwd ${wt}/app · log ở ${main} · lớp 1–4 ${JSON.stringify(wdLayers(r.layers))} · lastWatchdogAt ${r.lastWatchdogAt}`)
    assert.deepEqual(wdLayers(r.layers), [true, true, true, true])
    assert.equal(r.lastWatchdogAt, WD_LAST.slice(0, 25))
  })

  test("ON16-AC-4 ops-queries main từ worktree → lớp 4 không ok", async () => {
    ready()
    const { wt } = haiCay("ac4do")
    process.chdir(path.join(wt, "app"))
    const { getLockdownStatus } = await import(path.join(MAIN_DIR, "ops-queries.ts"))
    const r = await getLockdownStatus({ agentLogDir: emptyAgentDir, now: NOW })
    console.log(`# ON16-AC-4 chiều đỏ (main ${MAIN_SHA}): lớp 1–4 ${JSON.stringify(wdLayers(r.layers))} · lastWatchdogAt ${r.lastWatchdogAt}`)
    assert.notEqual(layer(r.layers, "L4")?.ok, true, "bản main phải KHÔNG thấy watchdog từ worktree")
    assert.equal(r.lastWatchdogAt, null)
  })
})

// ---------------------------------------------------------------- AC-5 --
/** Lỗi theo từng loại log: job có lastLogAt bằng mtime tệp của nó. */
function loiJobs(jobs: { id: string; lastLogAt: string | null }[]): string[] {
  return LOGS.flatMap((l) => {
    const j = jobs.find((x) => x.id === l.job)
    const got = j?.lastLogAt ?? null
    console.log(`#   ${l.file} → ${l.job}: lastLogAt ${got} (muốn ${isoOf(l.mtime)})`)
    return got === isoOf(l.mtime) ? [] : [`${l.job} (${l.file}): lastLogAt ${got}, muốn ${isoOf(l.mtime)}`]
  })
}

describe("ON16-AC-5 lưới Máy móc đọc log ở checkout chính", () => {
  test("ON16-AC-5 lưới Máy móc từ worktree đọc 4 loại log ở checkout chính", async () => {
    ready()
    const { wt } = haiCay("ac5")
    process.chdir(path.join(wt, "app"))
    const { readSchedulerStatus } = await import("../src/lib/collections-queries")
    console.log(`# ON16-AC-5 cwd ${wt}/app`)
    assert.deepEqual(loiJobs(await readSchedulerStatus()), [])
  })

  test("ON16-AC-5 checkout chính và cây không git đọc log của chính cây", async () => {
    ready()
    const { readSchedulerStatus } = await import("../src/lib/collections-queries")
    const { main } = haiCay("ac5chinh")
    process.chdir(path.join(main, "app"))
    console.log(`# ON16-AC-5 checkout chính ${main}`)
    const a = loiJobs(await readSchedulerStatus())
    const plain = path.join(TMP, "khong-git")
    mkdirSync(path.join(plain, "app"), { recursive: true })
    ghiLog(plain)
    process.chdir(path.join(plain, "app"))
    console.log(`# ON16-AC-5 cây không git ${plain}`)
    const b = loiJobs(await readSchedulerStatus())
    assert.deepEqual([...a, ...b], [])
  })

  test("ON16-AC-5 collections-queries main từ worktree → không giờ", async () => {
    ready()
    const { wt } = haiCay("ac5do")
    process.chdir(path.join(wt, "app")) // bản main suy ROOT từ cwd lúc nạp mô-đun → chdir trước khi import
    const { readSchedulerStatus } = await import(path.join(MAIN_DIR, "collections-queries.ts"))
    console.log(`# ON16-AC-5 chiều đỏ (main ${MAIN_SHA})`)
    const loi = loiJobs(await readSchedulerStatus())
    assert.equal(loi.length, LOGS.length, `bản main phải không thấy cả ${LOGS.length} loại log: ${loi.join(" | ")}`)
  })

  // Luật tĩnh: phía app chỉ log-root.ts dựng đường pipeline/logs — chỗ đọc log khác đi qua logsDir().
  const LUAT_TEP = ["src/lib/ops-queries.ts", "src/lib/collections-queries.ts"]
  const viPham = (files: Record<string, string>) => Object.entries(files).filter(([, src]) => src.includes("pipeline/logs")).map(([f]) => f)

  test("ON16-AC-5 luật tĩnh: không chuỗi pipeline/logs ngoài log-root.ts", () => {
    const files = Object.fromEntries(LUAT_TEP.map((f) => [f, readFileSync(path.join(APP, f), "utf8")]))
    assert.ok(readFileSync(path.join(APP, "src/lib/log-root.ts"), "utf8").includes("pipeline/logs"), "log-root.ts phải là chỗ dựng đường")
    console.log(`# ON16-AC-5 luật tĩnh: ${LUAT_TEP.length} tệp, vi phạm ${viPham(files).length}`)
    assert.deepEqual(viPham(files), [])
  })

  test("ON16-AC-5 bản sao có chuỗi pipeline/logs → luật gọi tên tệp", () => {
    const files = Object.fromEntries(LUAT_TEP.map((f) => [f, readFileSync(path.join(MAIN_DIR, path.basename(f)), "utf8")]))
    const v = viPham(files)
    console.log(`# ON16-AC-5 chiều đỏ luật tĩnh (main ${MAIN_SHA}): ${v.join(", ")}`)
    assert.deepEqual(v, LUAT_TEP)
  })
})
