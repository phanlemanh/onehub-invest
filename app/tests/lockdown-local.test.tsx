// lockdown-local.test.tsx — ON2 `lockdown-local-noi-that`: ô Lockdown ở máy local không báo «Ổn» cho lớp không kiểm
// được, và «Dòng log cuối» của job là dòng có nghĩa. Mọi tệp log nằm trong thư mục tạm (mkdtemp); KHÔNG gọi lệnh
// `openclaw` nào và không đọc ~/.openclaw (an toàn Zalo) — bước dò hạ tầng của hàm (pgrep, GET cổng) chỉ đọc.
// Tên ca mở đầu bằng mã AC để evals bám (LD-AC-n).
process.env.TZ = "Asia/Ho_Chi_Minh" // AC-3: «ngày giờ máy» phải là ngày giờ VN — ghim trước mọi import
delete process.env.VERCEL // nhánh local của readSchedulerStatus

import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import type { LockdownLayer } from "../src/lib/ops-queries"

const ORIG_CWD = process.cwd()
const TMP = realpathSync(mkdtempSync(path.join(tmpdir(), "lockdown-local-")))
after(() => {
  process.chdir(ORIG_CWD)
  rmSync(TMP, { recursive: true, force: true })
})

const MARK = "auto-reply/agent-turn-timing"
const NOW = new Date("2026-10-24T10:00:00+07:00")
const WD_LINE = {
  fresh: "2026-10-24T09:55:00+07:00 ok — bindings=0, mention-all, no bot, handler read-only, 0 turn mới, kev:ok, db:ok",
  notOk: "2026-10-24T09:55:00+07:00 KILL: bindings=1",
  stale: "2026-10-24T09:44:00+07:00 ok — bindings=0, mention-all, no bot, handler read-only, 0 turn mới, kev:ok, db:ok",
}

/** Gốc kho tạm: <dir>/app (cwd của Next) + <dir>/pipeline/logs/zalo-watchdog.log (vắng khi wd = null). */
function repo(name: string, wd: string | null): string {
  const dir = path.join(TMP, name)
  mkdirSync(path.join(dir, "app"), { recursive: true })
  mkdirSync(path.join(dir, "pipeline/logs"), { recursive: true })
  if (wd !== null) writeFileSync(path.join(dir, "pipeline/logs/zalo-watchdog.log"), `2026-10-24T09:50:00+07:00 ok — cũ\n${wd}\n`)
  return dir
}
/** Thư mục log openclaw tạm; files = { "openclaw-YYYY-MM-DD.log": số dấu agent-turn }. */
function agentDir(name: string, files: Record<string, number>): string {
  const dir = path.join(TMP, `oc-${name}`)
  mkdirSync(dir, { recursive: true })
  for (const [f, n] of Object.entries(files))
    writeFileSync(path.join(dir, f), ["gateway start", ...Array.from({ length: n }, (_, i) => `t${i} ${MARK} 1200ms`), "drop no mention"].join("\n") + "\n")
  return dir
}
const layer = (layers: LockdownLayer[], name: string) => layers.find((l) => l.layer === name)!
const wdLayers = (layers: LockdownLayer[]) => ["L1", "L2", "L3", "L4"].map((n) => layer(layers, n).ok)

async function lockdown(opts: { root?: string; agentLogDir?: string; now?: Date }) {
  const { getLockdownStatus } = await import("../src/lib/ops-queries")
  return getLockdownStatus(opts)
}

// Bản sao hai nhánh CŨ của L4b (trước ON2) — chạy trên cùng thư mục để chứng chiều đỏ của AC-1/AC-3.
async function oldL4b(dir: string, now: Date, utcName: boolean, swallow: boolean) {
  const { readFile } = await import("node:fs/promises")
  const p = (n: number) => String(n).padStart(2, "0")
  const day = utcName ? now.toISOString().slice(0, 10) : `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
  try {
    const text = await readFile(path.join(dir, `openclaw-${day}.log`), "utf8")
    const turns = text.split("\n").filter((l) => l.includes(MARK)).length
    return { ok: turns === 0, turns }
  } catch {
    return swallow ? { ok: true, turns: 0 } : { ok: null, turns: null }
  }
}

// ---------------------------------------------------------------- AC-6 (app) --
// Chạy TRƯỚC mọi import collections-queries: ROOT của nó suy từ cwd lúc nạp module.
describe("LD-AC-6 readSchedulerStatus nhánh local", () => {
  test("LD-AC-6 readSchedulerStatus nhánh local trên gốc tạm (cwd <tmp>/app, tệp airdna-daily.log = mẫu cloud-sync thật) → lastLine sync xong …", async () => {
    const dir = repo("sched", WD_LINE.fresh)
    const sync = "sync xong 2026-10-24T05:40:23.792Z (run 20261024053813-93ccda): 296463 dòng, 21 bảng; tổng 130.2s; leak gate"
    writeFileSync(
      path.join(dir, "pipeline/logs/airdna-daily.log"),
      `  ref_calib_submarket_metrics: 28\n${sync}\n(node:37275) DeprecationWarning: Calling client.query() when the client is already executing a query is deprecated.\n(Use \`node --trace-deprecation ...\` to show where the warning was created)\n`,
    )
    process.chdir(path.join(dir, "app"))
    try {
      const { readSchedulerStatus } = await import("../src/lib/collections-queries")
      const job = (await readSchedulerStatus()).find((j) => j.id === "s02-daily")! // id trung tính từ ON7 ops-nhan-ma-nguon
      assert.equal(job.lastLine, sync)
    } finally {
      process.chdir(ORIG_CWD)
    }
  })
})

// ------------------------------------------------------------- AC-1…AC-3 --
describe("LD-AC-1..3 lớp L4b agent-turn hôm nay", () => {
  let root: string
  before(() => {
    root = repo("l4b", WD_LINE.fresh)
  })

  test("LD-AC-1 tệp log hôm nay vắng → L4b null, agentTurnsToday null", async () => {
    const dir = agentDir("vang", { "openclaw-2026-10-23.log": 3 })
    const r = await lockdown({ root, agentLogDir: dir, now: NOW })
    assert.equal(layer(r.layers, "L4b").ok, null)
    assert.equal(r.agentTurnsToday, null)
  })

  test("LD-AC-1 bản sao nhánh cũ (lỗi đọc → 0) ra ok true, ca đỏ nêu L4b", async () => {
    const dir = agentDir("vang", { "openclaw-2026-10-23.log": 3 })
    const old = await oldL4b(dir, NOW, false, true)
    assert.equal(old.ok, true, "L4b: nhánh cũ nuốt lỗi đọc thành 0 → «Ổn» khi không kiểm được")
    assert.notEqual(old.ok, layer((await lockdown({ root, agentLogDir: dir, now: NOW })).layers, "L4b").ok)
  })

  test("LD-AC-2 0 dấu → ok true/0; 2 dấu → ok false/2", async () => {
    const zero = await lockdown({ root, agentLogDir: agentDir("zero", { "openclaw-2026-10-24.log": 0 }), now: NOW })
    assert.equal(layer(zero.layers, "L4b").ok, true)
    assert.equal(zero.agentTurnsToday, 0)
    const two = await lockdown({ root, agentLogDir: agentDir("two", { "openclaw-2026-10-24.log": 2 }), now: NOW })
    assert.equal(layer(two.layers, "L4b").ok, false)
    assert.equal(two.agentTurnsToday, 2)
  })

  const NIGHT = new Date("2026-10-24T01:00:00+07:00") // = 2026-10-23T18:00:00Z
  test("LD-AC-3 now 01:00 giờ máy → đọc openclaw-2026-10-24.log, ok false, agentTurnsToday 2", async () => {
    assert.equal(NIGHT.toISOString().slice(0, 10), "2026-10-23")
    const dir = agentDir("dem", { "openclaw-2026-10-24.log": 2 })
    const r = await lockdown({ root, agentLogDir: dir, now: NIGHT })
    assert.equal(layer(r.layers, "L4b").ok, false)
    assert.equal(r.agentTurnsToday, 2)
  })

  test("LD-AC-3 bản sao đặt tên theo ngày UTC ra ok null, ca đỏ nêu ngày UTC", async () => {
    const dir = agentDir("dem", { "openclaw-2026-10-24.log": 2 })
    const old = await oldL4b(dir, NIGHT, true, false)
    assert.equal(old.ok, null, "ngày UTC: tên tệp theo toISOString tìm openclaw-2026-10-23.log lúc 01:00 giờ VN")
  })
})

// ---------------------------------------------------------------------- AC-4 --
describe("LD-AC-4 watchdog L1–L4 theo gốc kho", () => {
  const CASES: { name: string; wd: string | null; want: (boolean | null)[] }[] = [
    { name: "vắng", wd: null, want: [null, null, null, false] },
    { name: "ok 5′", wd: WD_LINE.fresh, want: [true, true, true, true] },
    { name: "không ok", wd: WD_LINE.notOk, want: [null, null, null, false] },
    { name: "ok cũ 16′", wd: WD_LINE.stale, want: [null, null, null, false] },
  ]
  const MODES = ["truyền root", "không root, cwd <tmp>/app", "không root, cwd <tmp>"] as const
  for (const c of CASES)
    for (const mode of MODES)
      test(`LD-AC-4 watchdog ${c.name} · ${mode} → L1–L4 ${JSON.stringify(c.want)}`, async () => {
        const dir = repo(`wd-${CASES.indexOf(c)}`, c.wd)
        const agentLogDir = agentDir("wd", { "openclaw-2026-10-24.log": 0 })
        let r
        if (mode === "truyền root") r = await lockdown({ root: dir, agentLogDir, now: NOW })
        else {
          process.chdir(mode === "không root, cwd <tmp>" ? dir : path.join(dir, "app"))
          try {
            r = await lockdown({ agentLogDir, now: NOW })
          } finally {
            process.chdir(ORIG_CWD)
          }
        }
        assert.deepEqual(wdLayers(r.layers), c.want)
      })
})

// ---------------------------------------------------------------------- AC-5 --
describe("LD-AC-5 hiển thị khi chưa kiểm được", () => {
  async function html(el: unknown): Promise<string> {
    const React = await import("react")
    Object.assign(globalThis, { React })
    const { renderToStaticMarkup } = await import("react-dom/server")
    return renderToStaticMarkup(el as React.ReactElement)
  }
  async function view(turnsFile: Record<string, number>) {
    const React = await import("react")
    const { CollectionsTiles } = await import("../src/components/ops/collections/collections-tiles")
    const { LockdownGrid } = await import("../src/components/ops/collections/lockdown-grid")
    const { issuesOf } = await import("../src/components/ops/collections/attention-list")
    const lk = await lockdown({ root: repo("ui", WD_LINE.fresh), agentLogDir: agentDir(`ui-${Object.keys(turnsFile).length}`, turnsFile), now: NOW })
    const zero = { messages: 0, passed: 0, skipped: 0, accepted: 0, media: 0 }
    const zalo = { connected: null, uptime24h: null, heartbeatAgeMin: null, lastHeartbeatAt: null, lastPostAt: null, silentAlert24h: false, driftAlert24h: false }
    const tiles = await html(React.createElement(CollectionsTiles, { feeds: [], funnel: { lastEventAt: null, today: zero, last7: zero }, layers: lk.layers, agentTurnsToday: lk.agentTurnsToday }))
    const grid = await html(React.createElement(LockdownGrid, { layers: lk.layers, lastWatchdogAt: lk.lastWatchdogAt }))
    const issues = issuesOf({ feeds: [], layers: lk.layers, agentTurnsToday: lk.agentTurnsToday, zalo, groups: [], factsAgeMin: null, nowMs: NOW.getTime() })
    return { lk, tiles, grid, issues }
  }
  /** Nhãn trạng thái của hàng lưới chứa mô tả `desc`. */
  const rowState = (grid: string, desc: string) => {
    const row = [...grid.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[1]).find((r) => r.includes(desc))
    assert.ok(row, `có hàng «${desc}» trong lưới`)
    // ON13: cột Trạng thái đứng ngay sau cột Lớp — đọc nhãn trạng thái (Badge) của hàng, không đọc ô cuối.
    return row!.match(/data-slot="badge"[^>]*>([^<]+)</)?.[1]
  }

  test("LD-AC-5 null → Chưa kiểm được agent-turn hôm nay, 0 mục Khẩn agent-turn, L4b trong nhóm Chưa kiểm được của lưới", async () => {
    const { lk, tiles, grid, issues } = await view({})
    assert.equal(lk.agentTurnsToday, null)
    assert.match(tiles, /Chưa kiểm được lượt máy tự trả lời hôm nay/) // ON12: «Lượt máy tự trả lời» thay «agent-turn»
    assert.doesNotMatch(tiles, /Không có lượt máy tự trả lời hôm nay/)
    assert.equal(issues.filter((i) => i.key === "agent").length, 0)
    assert.equal(issues.filter((i) => i.label === "Khẩn").length, 0)
    assert.equal(rowState(grid, "Lượt máy tự trả lời hôm nay = 0"), "Chưa kiểm được")
  })

  test("LD-AC-5 2 dấu → mục Khẩn Agent-turn hôm nay", async () => {
    const { tiles, grid, issues } = await view({ "openclaw-2026-10-24.log": 2 })
    const agent = issues.find((i) => i.key === "agent")
    assert.ok(agent)
    assert.equal(agent.label, "Khẩn")
    assert.equal(agent.title, "Lượt máy tự trả lời hôm nay")
    assert.match(tiles, /Có lượt máy tự trả lời hôm nay — kiểm ngay/)
    assert.equal(rowState(grid, "Lượt máy tự trả lời hôm nay = 0"), "Hỏng")
  })
})

// readFileSync giữ cho bản chép lệnh test đọc được tệp mẫu nếu cần soi tay.
void readFileSync
