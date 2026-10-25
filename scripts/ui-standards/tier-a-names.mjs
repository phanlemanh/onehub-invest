#!/usr/bin/env node
// Ghi danh sách tên tầng A (tên nguồn thật, tên/khoá nhóm thu ở source_groups) từ DB LOCAL ra
// một tệp tạm quyền 600 để mask-tier-a.js tự kiểm ảnh chụp. KHÔNG in tên ra stdout —
// chỉ in đường dẫn tệp và số lượng (tên thật không được rời máy, kể cả vào transcript).
// Dùng: node scripts/ui-standards/tier-a-names.mjs [--out <tệp>]
import { execFileSync } from "node:child_process"
import { chmodSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const { Client } = createRequire(join(ROOT, "app", "package.json"))("pg")
const url = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest"
if (!/@(localhost|127\.0\.0\.1)(:|\/)/.test(url)) {
  console.error("tier-a-names: chỉ chạy trên DB local")
  process.exit(2)
}
const outIdx = process.argv.indexOf("--out")
const out = outIdx >= 0 ? process.argv[outIdx + 1] : join(tmpdir(), "onehub-tier-a-names.json")

const db = new Client({ connectionString: url })
await db.connect()
const q = async (sql) => {
  try {
    return (await db.query(sql)).rows.map((r) => Object.values(r)[0]).filter(Boolean)
  } catch {
    return [] // bảng vắng (vd chưa có stg_zalo_posts) — bỏ qua
  }
}
const names = [
  ...(await q("SELECT real_name FROM source_registry")),
  ...(await q("SELECT name FROM source_groups")),
  ...(await q("SELECT group_key FROM source_groups")),
  // Tên nhóm S03 (stg_zalo_posts.group_name) là tầng C từ 24/10 (sửa đổi ADR-0007) — không còn trong danh sách che.
]
await db.end()
// Tên đã có sẵn trong mã nguồn/tài liệu đã commit (vd tên nguồn hiệu chuẩn hiện ở /ops/quality)
// không phải thứ ảnh chụp làm lộ thêm → bỏ khỏi danh sách tự kiểm.
const inRepo = (n) => {
  try {
    execFileSync("git", ["grep", "-q", "-i", "-F", n, "--", "app/src", "docs"], { cwd: ROOT, stdio: "ignore" })
    return true
  } catch {
    return false
  }
}
const all = [...new Set(names.map((n) => String(n).trim()).filter((n) => n.length >= 3))]
const uniq = all.filter((n) => !inRepo(n))
writeFileSync(out, JSON.stringify(uniq))
chmodSync(out, 0o600)
console.log(`tier-a-names: ${uniq.length} tên chỉ có ở DB local (bỏ ${all.length - uniq.length} tên đã có trong mã nguồn) → ${out} (quyền 600)`)
