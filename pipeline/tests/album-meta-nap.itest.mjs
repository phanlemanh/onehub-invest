// E5/AC-5 — phần BỘ NẠP (ma-album-s03): chạy trên DB THỬ (executor dựng bằng
// db/db-thu.sh oneinvest_album_s03). Cột album_meta do test tự ADD IF NOT
// EXISTS hai lần (mô phỏng migration 077 idempotent — tệp 077 thuộc làn
// Claude); snapshot sinh bằng SnapshotWriter THẬT của collector (bản build
// dist); nạp bằng cách gọi pipeline/import-airbnb.mjs đúng như
// zalo-import-daily.sh chạy thật (tiến trình con, argv = thư mục snapshot).
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "../..");
const NAP = join(REPO, "pipeline/import-airbnb.mjs");
// root repo không có node_modules — pipeline mượn pg từ checkout chính (bẫy đã ghi)
const pg = await import("/Users/manhphan/dev/onehub-invest/pipeline/node_modules/pg/lib/index.js").then((m) => m.default ?? m);
const { SnapshotWriter, KENH_TIN_SCHEMA_VERSION } = await import(join(REPO, "collector/dist/core/storage.js"));

// P0 (claudedp-0511-20): KHÔNG đọc DATABASE_URL (shell hai làn export trỏ DB
// THẬT oneinvest) — biến riêng + chặn cứng tên DB thử trước MỌI câu lệnh,
// vì itest ALTER/DROP cột: chạy nhầm là xoá cột thật sau khi 077 đã áp.
const DB = process.env.ALBUM_ITEST_DB ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_album_s03";
if (!/_album_s03$/.test(new URL(DB.replace("postgres://", "http://")).pathname.split("/").pop() ?? "")) {
  console.error("album-meta-nap: ALBUM_ITEST_DB phải là DB thử oneinvest_*_album_s03 — từ chối chạy trên DB khác");
  process.exit(2);
}
const c = new pg.Client({ connectionString: DB });

const ALBUM = { group_layout_id: "g-777", id_in_group: "5", total_item_in_group: 2 };

function tinAnhAlbum(ts) {
  return {
    source: "zalo-agent",
    sourceId: `album-${ts}`,
    kind: "post",
    fetchedAt: new Date(ts).toISOString(),
    payload: { text: `anh-album-${ts}.jpg`, group: "NhomX", agent_id: "t", senderName: null, senderId: "1", conversationId: "9", media: null },
    meta: { city: "hanoi", agent: "t", group: "NhomX", ts: new Date(ts).toISOString(), albumMeta: { ...ALBUM } },
  };
}
function tinCu(ts) {
  return {
    source: "zalo-agent",
    sourceId: `cu-${ts}`,
    kind: "post",
    fetchedAt: new Date(ts).toISOString(),
    payload: { text: `tin-cu-${ts}`, group: "NhomX", agent_id: "t" },
    meta: { city: "hanoi", agent: "t", group: "NhomX", ts: new Date(ts).toISOString() },
  };
}
async function sinhSnapshot(items, schemaVersion) {
  const root = mkdtempSync(join(tmpdir(), "mas3-snap-"));
  const w = new SnapshotWriter(root, "hanoi", "zalo-agent", { schemaVersion });
  await w.write(items);
  await w.finalize({ failed: 0 });
  return { root, dir: join(root, "hanoi", w.snapshotId) };
}
function nap(dir) {
  const r = spawnSync(process.execPath, [NAP, dir], { encoding: "utf8", timeout: 120_000, env: { ...process.env, DATABASE_URL: DB } }); // bộ nạp con nhận ĐÚNG biến DB-thử
  return { rc: r.status, out: (r.stdout || "") + (r.stderr || "") };
}
const albumCua = async (postId) =>
  (await c.query("SELECT album_meta FROM stg_zalo_posts WHERE post_id = $1", [postId])).rows[0]?.album_meta;

test("E5: 077-idempotent + nạp album_meta đúng + snapshot cũ NULL + DB thiếu cột vẫn nạp", async () => {
  await c.connect();
  // dọn dấu vết lần chạy trước (nạp lại idempotent vẫn phải pass cả khi có sẵn)
  await c.query("DELETE FROM stg_zalo_posts WHERE post_id LIKE 'album-%' OR post_id LIKE 'cu-%'");
  // (1) cột như 077: nếu migration thật có trên nhánh thì ÁP ĐÚNG TỆP ĐÓ hai
  // lần (idempotent như AC-5), không thì ADD IF NOT EXISTS mô phỏng (077 của
  // làn Claude chưa gộp xuống đây)
  const fs = await import("node:fs");
  const mig = fs.readdirSync(join(REPO, "db/migrations")).filter((f) => /^077_.*\.sql$/.test(f))[0];
  const psql = (f) => spawnSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db",
    "psql", "-U", "oneinvest", "-h", "localhost", "-d", DB.split("/").pop(), "-v", "ON_ERROR_STOP=1", "-f", "-"],
    { input: fs.readFileSync(join(REPO, "db/migrations", f)), encoding: "utf8", timeout: 60_000 });
  for (let i = 0; i < 2; i++) {
    if (mig) {
      const r = psql(mig);
      if (r.status !== 0) throw new Error(`áp 077 thật (${mig}) lần ${i + 1} lỗi: ${(r.stderr || "").slice(0, 200)}`);
    } else {
      await c.query("ALTER TABLE stg_zalo_posts ADD COLUMN IF NOT EXISTS album_meta jsonb");
    }
  }
  // (2) SnapshotWriter THẬT sinh snapshot v6 có meta.albumMeta → cột đúng
  const tsA = Date.now();
  const s1 = await sinhSnapshot([tinAnhAlbum(tsA), tinCu(tsA)], KENH_TIN_SCHEMA_VERSION);
  const r1 = nap(s1.dir);
  assert.equal(r1.rc, 0, `nạp snapshot 6 rc=0 (out: ${r1.out.slice(0, 300)})`);
  const am = await albumCua(`album-${tsA}`);
  assert.ok(am && am.group_layout_id === ALBUM.group_layout_id && am.id_in_group === ALBUM.id_in_group && am.total_item_in_group === ALBUM.total_item_in_group, `cột album_meta đúng giá trị (${JSON.stringify(am)})`);
  assert.equal(await albumCua(`cu-${tsA}`), null, "tin không albumMeta → album_meta IS NULL");
  // nạp LẦN HAI cùng snapshot (bộ nạp đọc số schemaVersion mới nhận lại):
  const r1b = nap(s1.dir);
  assert.equal(r1b.rc, 0, "nạp lại snapshot 6 rc=0 (idempotent)");
  const nSau = Number((await c.query("SELECT count(*) FROM stg_zalo_posts WHERE post_id IN ($1,$2)", [`album-${tsA}`, `cu-${tsA}`])).rows[0].count);
  assert.equal(nSau, 2, "số bài không nhân đôi");
  // (3) snapshot CŨ (v4, không albumMeta) vẫn nạp; bài mới của nó album_meta NULL
  const tsB = tsA + 1;
  const s2 = await sinhSnapshot([tinCu(tsB)], 4);
  const r2 = nap(s2.dir);
  assert.equal(r2.rc, 0, "nạp snapshot v4 rc=0");
  assert.equal(await albumCua(`cu-${tsB}`), null, "bài từ snapshot cũ → album_meta IS NULL");
  // (4) DB CHƯA có 077 (DROP cột) → snapshot 6 vẫn nạp + cảnh báo, không mất bài
  await c.query("ALTER TABLE stg_zalo_posts DROP COLUMN IF EXISTS album_meta");
  const tsC = tsA + 2;
  const s3 = await sinhSnapshot([tinAnhAlbum(tsC)], KENH_TIN_SCHEMA_VERSION);
  const r3 = nap(s3.dir);
  assert.equal(r3.rc, 0, "DB thiếu cột: nạp rc=0 (không dừng chuỗi)");
  assert.ok(r3.out.includes("WARN"), `in cảnh báo (out: ${r3.out.slice(0, 200)})`);
  const nC = Number((await c.query("SELECT count(*) FROM stg_zalo_posts WHERE post_id = $1", [`album-${tsC}`])).rows[0].count);
  assert.equal(nC, 1, "bài vẫn vào stg dù bỏ trường");
  // dọn: trả lại cột cho lần chạy kế (nếu lượt chấm chạy cùng DB)
  await c.query("ALTER TABLE stg_zalo_posts ADD COLUMN IF NOT EXISTS album_meta jsonb");
  for (const s of [s1, s2, s3]) rmSync(s.root, { recursive: true, force: true });
  await c.end();
});
