// bu-seller-v5.mjs — bù snapshot v5 cho tin CÓ SỐ trong state nhưng stg chưa
// có (0211-15: 71 số lượt 08:xx/09:xx UTC bị flush thiếu vì chạy code cũ).
// KHÔNG gọi nguồn: chỉ đọc state.json + stg, ghi một bản v5 (đường hienSo —
// importer seller-only) rồi nạp. Tái dùng: chạy lại chỉ bù phần còn thiếu.
// Kèm đối chiếu state↔stg cuối lượt: in lệch để không mất số âm thầm nữa.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { gzipSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { importDir } from "./import-chotot.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATE_F = join(ROOT, "state", "thu-so-s06", "state.json");
const SNAP_ROOT = join(ROOT, "state", "seller-v5");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const state = JSON.parse(await readFile(STATE_F, "utf8"));
const client = new pg.Client({ connectionString: DB_URL });
await client.connect();

// 1. Đối chiếu: state có số ↔ stg có số
const stgCoSo = new Set(
  (await client.query("SELECT list_id FROM stg_chotot_ads WHERE seller->>'phone' LIKE '+84%'")).rows.map((r) => String(r.list_id)),
);
const stateCoSo = Object.entries(state.da_thu).filter(([, x]) => x.phone);
const thieu = stateCoSo.filter(([id]) => !stgCoSo.has(String(id)));
console.log(`đối chiếu: state ${stateCoSo.length} số · stg ${stgCoSo.size} số · thiếu ở stg: ${thieu.length}`);
if (thieu.length === 0) {
  await client.end();
  console.log("không thiếu — không cần bù");
  process.exit(0);
}

// 2. Ghép accountRef từ chính stg (không gọi nguồn)
const ids = thieu.map(([id]) => Number(id));
const rows = (
  await client.query("SELECT list_id, payload->>'account_id' AS account_id FROM stg_chotot_ads WHERE list_id = ANY($1::bigint[])", [ids])
).rows;
const accCua = new Map(rows.map((r) => [String(r.list_id), r.account_id]));

const items = thieu.map(([list_id, x]) => ({
  source: "chotot-ads",
  sourceId: `ct-${list_id}`,
  kind: "ad",
  fetchedAt: x.at,
  payload: { list_id: Number(list_id) },
  seller: {
    accountRef: accCua.get(String(list_id)) ? `S06:${accCua.get(String(list_id))}` : null,
    displayName: null, // importer tự điền từ payload.account_name của chính dòng
    phone: x.phone,
    phoneStatus: "available",
    seenAt: x.at,
  },
}));

// 3. Ghi một bản v5 (đường hienSo → nạp seller-only) rồi nạp ngay
const ts = new Date().toISOString().replace(/[:.]/g, "").slice(0, 17);
const snapshotId = `vn__chotot-ads__${ts}bu`;
const dir = join(SNAP_ROOT, "vn", snapshotId);
await mkdir(dir, { recursive: true });
const gz = gzipSync(Buffer.from(JSON.stringify(items)));
await writeFile(join(dir, "items-0001.json.gz"), gz);
await writeFile(
  join(dir, "manifest.json"),
  JSON.stringify(
    {
      schemaVersion: 5, snapshotId, city: "vn", source: "chotot-ads",
      startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(),
      counts: { items: items.length, failed: 0 },
      coverage: { discovered: items.length, captured: items.length, failed: 0, methods: { hienSo: items.length }, notes: ["bù từ state — không gọi nguồn (0211-15)"] },
      files: [{ name: "items-0001.json.gz", sha256: createHash("sha256").update(gz).digest("hex"), bytes: gz.length }],
    },
    null,
    2,
  ),
);
console.log(`bản bù ${snapshotId}: ${items.length} items (state→stg, 0 lời gọi nguồn)`);
await importDir(client, dir);
await client.end();
