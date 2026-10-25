// backfill-zalo-media.mjs — nạp lại meta.mediaFiles (N1, DATA-CONTRACT v2) cho
// snapshot zalo-agent v2+ có bài chưa mang stg_zalo_posts.media_files.
//
// CHỈ đụng snapshot v2+ còn thiếu: chạy lại cả 299 snapshot v1 tốn giờ vô ích.
// 2410-1 v2: importer giờ upsert captured_at = LEAST(cũ, giờ thu snapshot) —
// chạy lại KHÔNG còn đặt now(), độ tươi an toàn. Raw bất biến, importer
// idempotent (ON CONFLICT post_id) → chạy lại an toàn.
//
// Dùng: node backfill-zalo-media.mjs [--check] [snapshots-dir]
//   --check: chỉ đo, không ghi — exit 1 khi còn bài có ảnh chưa nạp.
//   snapshots-dir mặc định $SNAPSHOTS_DIR hoặc ../collector/snapshots.
import { readFile, readdir } from "node:fs/promises";
import { existsSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { gunzipSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const HERE = dirname(fileURLToPath(import.meta.url));
const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// meta.mediaFiles có từ v2; v3 (Kev-nhãn) chỉ thêm meta.kev, giữ nguyên ảnh
// (DATA-CONTRACT §Lịch sử phiên bản) → mọi bản ≥ 2 đều phải xét.
export const MEDIA_SCHEMA_MIN = 2;

// post_id có mediaFiles trong một snapshot v2+ (đọc items, không verify sha —
// importer verify lúc nạp thật)
export async function postsWithMedia(dir, manifest) {
  const ids = [];
  for (const f of manifest.files.filter((f) => f.name.startsWith("items-"))) {
    const items = JSON.parse(gunzipSync(await readFile(join(dir, f.name))).toString("utf8"));
    for (const it of items) if (Array.isArray(it.meta?.mediaFiles) && it.meta.mediaFiles.length) ids.push(it.sourceId);
  }
  return ids;
}

// snapshot zalo-agent dưới <root>/<city>/<id>: tổng số + những bản mang được ảnh
export async function mediaSnapshots(root) {
  const snaps = [];
  let total = 0;
  for (const city of await readdir(root, { withFileTypes: true })) {
    if (!city.isDirectory()) continue;
    for (const snap of await readdir(join(root, city.name), { withFileTypes: true })) {
      if (!snap.isDirectory() || !snap.name.includes("__zalo-agent__")) continue;
      const dir = join(root, city.name, snap.name);
      if (!existsSync(join(dir, "manifest.json"))) continue; // mồ côi — importer cũng bỏ qua
      total++;
      const manifest = JSON.parse(await readFile(join(dir, "manifest.json"), "utf8"));
      if (manifest.schemaVersion >= MEDIA_SCHEMA_MIN) snaps.push({ dir, manifest });
    }
  }
  return { total, snaps };
}

async function main(args) {
  const check = args.includes("--check");
  const root = args.find((a) => !a.startsWith("--")) ?? process.env.SNAPSHOTS_DIR ?? join(HERE, "../collector/snapshots");
  if (!existsSync(root)) throw new Error(`không thấy thư mục snapshots: ${root}`);
  const { total, snaps } = await mediaSnapshots(root);

  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  let raw = 0;
  let missing = 0;
  const todo = [];
  try {
    for (const s of snaps) {
      const ids = await postsWithMedia(s.dir, s.manifest);
      raw += ids.length;
      if (!ids.length) continue;
      const { rows } = await client.query(
        `SELECT count(*)::int n FROM stg_zalo_posts WHERE post_id = ANY($1) AND media_files IS NOT NULL`,
        [ids],
      );
      const gap = ids.length - rows[0].n;
      if (gap > 0) {
        missing += gap;
        todo.push(s.dir);
      }
    }
    const { rows } = await client.query(
      `SELECT count(*)::int n FROM stg_zalo_posts WHERE media_files IS NOT NULL`,
    );
    console.log(
      `snapshot zalo-agent: ${total} (v2+: ${snaps.length}) · bài có ảnh trong raw v2+: ${raw} · ` +
        `chưa nạp: ${missing} · stg_zalo_posts có media_files: ${rows[0].n}`,
    );
  } finally {
    await client.end();
  }

  if (check) {
    if (missing) {
      console.error(`còn ${missing} bài có ảnh chưa nạp (${todo.length} snapshot)`);
      process.exit(1);
    }
    return;
  }
  for (const dir of todo) execFileSync("node", [join(HERE, "import-airbnb.mjs"), dir], { stdio: "inherit" });
  console.log(`backfill xong: import lại ${todo.length} snapshot v2+`);
}

// chỉ chạy khi gọi trực tiếp — test import các hàm trên mà không chạm DB. So realpath:
// gọi qua symlink (~/dev/one-invest) thì argv[1] giữ đường symlink còn import.meta.url
// đã resolve — so chuỗi thô sẽ bỏ main và --check thoát 0 im lặng.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
