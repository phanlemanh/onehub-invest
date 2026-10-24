// ops-nhan-ma-nguon-db-chet.test.tsx — ON7 `ops-nhan-ma-nguon` AC-5: DB không tới được (không đọc được danh sách tên) →
// readSchedulerStatus local trả lastLine null, không trả dòng log thô mang tên thật (đóng chặt). Đối chứng dương cùng cây
// log với DB lành: ca ON7-AC-5 trong ops-nhan-ma-nguon.test.tsx. Pool của app đọc DATABASE_URL lúc import — đặt trước.
delete process.env.VERCEL
{
  const u = new URL("postgres://placeholder/oneinvest")
  u.hostname = "127.0.0.1"; u.port = "1"; u.username = "u"
  process.env.DATABASE_URL = u.toString()
}

import { after, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { findSourceNames, sourceRegistrySeeds } from "../../scripts/lib/tier-a-source-names.mjs"

type Seed = { code: string; realName: string }
const ENTRIES = (sourceRegistrySeeds() as Seed[]).map(({ code, realName }) => ({ code, realName }))
const ORIG_CWD = process.cwd()
const TMP = realpathSync(mkdtempSync(path.join(tmpdir(), "ops-on7-dbchet-")))
mkdirSync(path.join(TMP, "app"), { recursive: true })
mkdirSync(path.join(TMP, "pipeline/logs"), { recursive: true })
writeFileSync(path.join(TMP, "pipeline/logs/airdna-daily.log"), `2026-10-24T19:06:00 ${ENTRIES.find((e) => e.code === "S02")!.realName} rotation xong\n`)
process.chdir(path.join(TMP, "app"))
after(async () => {
  process.chdir(ORIG_CWD)
  rmSync(TMP, { recursive: true, force: true })
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

test("ON7-AC-5 DB không tới được → lastLine null, không dòng thô", async () => {
  const { readSchedulerStatus } = await import("../src/lib/collections-queries")
  const jobs = await readSchedulerStatus()
  const s02 = jobs.find((j) => j.id === "s02-daily")
  assert.ok(s02, "tiền đề: có job s02-daily")
  assert.ok(s02.lastLogAt, "tiền đề: tệp log tạm của job S02 đọc được (mtime có)")
  assert.equal(s02.lastLine, null, "không đọc được danh sách tên thì phải ẩn dòng log, không trả dòng thô")
  for (const j of jobs) for (const v of [j.id, j.label, j.lastLine ?? ""]) assert.deepEqual(findSourceNames(v, ENTRIES), [], `job ${j.id} còn tên nguồn thật`)
})
