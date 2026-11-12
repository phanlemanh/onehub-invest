// import-chotot.mjs — nạp snapshot chotot-ads vào stg_chotot_ads (S06).
// Theo DATA-CONTRACT như import-airbnb: verify sha256 từng file trước khi parse.
// stg giữ trạng thái MỚI NHẤT per list_id (upsert); lịch sử giá nằm trong
// raw snapshot bất biến — trend query join theo snapshot_id.
//
// Dùng: node import-chotot.mjs <snapshot-dir> | node import-chotot.mjs --latest
import { readFile, readdir } from "node:fs/promises";
import { existsSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

// Luật khuôn tên thư mục — BẢN SAO GIỐNG HỆT import-airbnb.mjs (PL1 mở lại
// vòng 4, claudedp-2310-4 + BÁO 2510-5): inline vì harness nghiệm thu chép
// mỗi importer là một file lẻ; chuỗi phải đồng bộ với import-airbnb.mjs và
// TS_RE của hai daily script (AU3 2310-8 vòng 3) — test đối chiếu cả bốn.
const SNAPSHOT_TS_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{6}([0-9]{3})?(-[0-9]+)?Z?$/;

function parseSnapshotDirName(name) {
  const parts = String(name).split("__");
  if (parts.length !== 3) return null;
  const [city, source, ts] = parts;
  if (!city || !source || !SNAPSHOT_TS_RE.test(ts)) return null;
  return { city, source, ts };
}

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

async function latestSnapshotDir() {
  const root = process.argv[3] ?? join(process.cwd(), "collector", "snapshots");
  const dirs = [];
  for (const city of await readdir(root)) {
    const cityPath = join(root, city);
    if (!existsSync(join(cityPath))) continue;
    for (const d of await readdir(cityPath)) {
      if (d.includes("__chotot-ads__") && existsSync(join(cityPath, d, "manifest.json"))) {
        dirs.push({ dir: join(cityPath, d), mtime: (await readFile(join(cityPath, d, "manifest.json"))).length, path: join(cityPath, d) });
      }
    }
  }
  if (dirs.length === 0) throw new Error("không tìm thấy snapshot chotot-ads nào");
  // Chọn theo tên snapshotId mới nhất (timestamp trong tên, sort chuỗi ổn)
  dirs.sort((a, b) => b.path.localeCompare(a.path));
  return [dirs[0].dir];
}

// v5 (claudedp-0211-1 hợp đồng người bán): RawItem.seller chỉ THÊM key tùy chọn
// (kênh S06 chưa ghi seller — giữ ghi 1 cho tới khi được cấp vòng thu số riêng);
// cùng mảng với import-airbnb.mjs, test đối chiếu hai bản không lệch.
export const SUPPORTED_SCHEMA_VERSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // v6 album · v7 s03-ho-so · v8 S10/S11 · v9 s07-danh-muc · v10 s03-tu-lieu-drive · v11 S10 meta dự án (1211-29: hai importer không lệch)

// Export để test đọc snapshot v5 từ dir tạm (verify sha256 + parse, không đụng DB)
export async function readSnapshot(dir) {
  const manifest = JSON.parse(await readFile(join(dir, "manifest.json"), "utf8"));
  if (!SUPPORTED_SCHEMA_VERSIONS.includes(manifest.schemaVersion)) {
    throw new Error(`schemaVersion ${manifest.schemaVersion} chưa hỗ trợ`);
  }
  // Lớp 2 (mở lại 2310-4 lần 2): manifest.source là lời khai của chính snapshot
  if (manifest.source !== "chotot-ads") {
    console.warn(`bỏ qua theo manifest.source=${manifest.source} (không phải chotot-ads): ${dir}`);
    process.exit(0);
  }
  // 2510-34: manifest thiếu finishedAt → captured_at NULL, và từ vòng 2510-6
  // dòng đó ĐÓNG BĂNG vĩnh viễn (WHERE EXCLUDED.captured_at >= NULL luôn sai).
  // Từ chối nạp (exit ≠0, log rõ) thay vì sinh dòng NULL — khuyến nghị lời giao.
  if (typeof manifest.finishedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(manifest.finishedAt)) {
    throw new Error(`manifest thiếu finishedAt (có: ${JSON.stringify(manifest.finishedAt)}) — snapshot hỏng, từ chối nạp: ${dir}`);
  }
  for (const f of manifest.files) {
    const buf = await readFile(join(dir, f.name));
    const sha = createHash("sha256").update(buf).digest("hex");
    if (sha !== f.sha256) throw new Error(`checksum sai: ${f.name}`);
  }
  const items = [];
  for (const f of manifest.files.filter((f) => f.name.startsWith("items-"))) {
    items.push(...JSON.parse(gunzipSync(await readFile(join(dir, f.name))).toString("utf8")));
  }
  return { manifest, items: items.filter((i) => i.source === "chotot-ads") };
}

// 2510-6 (claudedp, Ngoài-1 của giu-captured-at): bảng đi theo snapshot MỚI và
// KHÔNG LÙI NỘI DUNG — WHERE chặn CẢ lệnh update khi snapshot nạp vào cũ hơn
// dòng hiện có (price/payload/snapshot_id/captured_at giữ nguyên bản mới);
// bằng mốc (nạp lại cùng snapshot) thì cập nhật như cũ — idempotent.
// 2510-34: OR ... IS NULL — dòng captured_at NULL (di sản manifest thiếu mốc
// trước guard 2510-34) vẫn CẬP NHẬT được bằng snapshot có mốc, hết đóng băng.
// 2410-1 v2: captured_at = giờ thu snapshot (airbnb_snapshots.collected_at).
export const UPSERT_SQL = `INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, subject,
                              price, price_string, size_m2, rooms, toilets, house_type,
                              area_name, ward_name, ward_name_v3, latitude, longitude,
                              list_time, seller, images, payload, snapshot_id, captured_at)
 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
 ON CONFLICT (list_id) DO UPDATE SET
   price = EXCLUDED.price, price_string = EXCLUDED.price_string,
   size_m2 = EXCLUDED.size_m2, subject = EXCLUDED.subject,
   ward_name = EXCLUDED.ward_name, ward_name_v3 = EXCLUDED.ward_name_v3,
   -- MỞ LẠI 0211-7 đA + 0311-3 đ4: lượt thu THƯỜNG (payload không có seller v5)
   -- phải KHÔNG xoá phone/phoneStatus/accountRef/seenAt/DISPLAYNAME đã nạp từ
   -- lượt lấy số — phần mô tả (full_name, company_ad, seller_info) vẫn lấy bản
   -- mới, các khoá người bán giữ từ bản hiện có khi EXCLUDED không mang phone.
   seller = CASE
     WHEN EXCLUDED.seller->>'phone' IS NOT NULL THEN EXCLUDED.seller
     ELSE (EXCLUDED.seller - 'phone' - 'phoneStatus' - 'accountRef' - 'seenAt' - 'displayName')
        || jsonb_strip_nulls(jsonb_build_object(
             'phone', stg_chotot_ads.seller->'phone',
             'phoneStatus', stg_chotot_ads.seller->'phoneStatus',
             'accountRef', stg_chotot_ads.seller->'accountRef',
             'displayName', stg_chotot_ads.seller->'displayName',
             'seenAt', stg_chotot_ads.seller->'seenAt'))
   END, images = EXCLUDED.images,
   payload = EXCLUDED.payload, snapshot_id = EXCLUDED.snapshot_id,
   captured_at = EXCLUDED.captured_at
 WHERE EXCLUDED.captured_at >= stg_chotot_ads.captured_at
    OR stg_chotot_ads.captured_at IS NULL`;

// Export để test chạy importDir trên lược đồ tạm (luoc-do-rieng) — MỞ LẠI 0211-1 đ1
export async function importDir(client, dir) {
  const { manifest, items } = await readSnapshot(dir);
  console.log(`manifest ok: ${manifest.snapshotId} — ${items.length} items`);

  await client.query(
    `INSERT INTO airbnb_snapshots (snapshot_id, city, source, collected_at, manifest)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (snapshot_id) DO UPDATE SET manifest = EXCLUDED.manifest`,
    [manifest.snapshotId, manifest.city, manifest.source, manifest.finishedAt, JSON.stringify(manifest)],
  );

  // MỞ LẠI 0211-7 đB: lượt LẤY SỐ (coverage.methods.hienSo) nạp seller-ONLY —
  // không làm mới captured_at / payload / cột khác: tin đã hết hạn không thành
  // «vừa thấy», payload không bị ghi đè bằng bản mỏng của lượt số.
  const sellerOnly = Number(manifest.coverage?.methods?.hienSo ?? 0) > 0;
  let n = 0;
  for (const it of items) {
    const a = it.payload;
    // v5 (MỞ LẠI 0211-1 đ1): RawItem.seller gộp PHẲNG vào cột seller có sẵn
    // (thêm accountRef/displayName/phone/phoneStatus/seenAt cạnh full_name/
    // company_ad/seller_info). Snapshot cũ không có it.seller → giá trị y hệt
    // trước v5 — không migration, cột jsonb đủ chỗ.
    const seller = { full_name: a.full_name ?? null, company_ad: a.company_ad ?? null, ...(a.seller_info ?? {}) };
    if (it.seller && typeof it.seller === "object") Object.assign(seller, it.seller);
    if (sellerOnly) {
      // 0211-8 (1)(2): item lượt số MỎNG (payload chỉ list_id) — chỉ gộp
      // it.seller: có phone thì ghi {phone, phoneStatus, accountRef, seenAt};
      // KHÔNG phone (error) thì chỉ {phoneStatus} — không mang khoá phone/
      // accountRef để không ghi null đè TÊN đang có và không XOÁ số đã nạp
      // từ lần thử trước. full_name/company_ad không bao giờ từ lượt số.
      const s = it.seller ?? {};
      const goi = s.phone
        ? { phone: s.phone, phoneStatus: s.phoneStatus ?? "available",
            ...(s.accountRef ? { accountRef: s.accountRef } : {}),
            ...(s.seenAt ? { seenAt: s.seenAt } : {}) }
        : { phoneStatus: s.phoneStatus ?? "error" };
      // 0211-12 (4): displayName lượt số lấy từ payload.account_name của chính
      // dòng stg khi it.seller không mang tên — stg.seller giờ có tên đồng bộ
      // với canonical (trước đây chỉ 5/51.994 dòng có tên trong seller).
      await client.query(
        `UPDATE stg_chotot_ads SET seller = COALESCE(seller, '{}'::jsonb) || $2::jsonb
           || (CASE WHEN COALESCE(seller->>'displayName', $2->>'displayName') IS NULL
                    AND payload->>'account_name' IS NOT NULL
               THEN jsonb_build_object('displayName', payload->>'account_name')
               ELSE '{}'::jsonb END)
           WHERE list_id = $1`,
        [a.list_id, JSON.stringify(goi)],
      );
      n++;
      continue;
    }
    await client.query(
      UPSERT_SQL,
      [
        a.list_id, a.region_v2 ?? it.meta?.region_v2, it.meta?.city ?? a.region_name,
        a.category ?? it.meta?.cg, a.type ?? it.meta?.st, a.subject ?? null,
        a.price ?? null, a.price_string ?? null, a.size ?? null,
        a.rooms ?? null, a.toilets ?? null, a.house_type ?? null,
        a.area_name ?? null, a.ward_name ?? null, a.ward_name_v3 ?? null,
        a.latitude ?? null, a.longitude ?? null,
        a.list_time ? new Date(a.list_time).toISOString() : null,
        JSON.stringify(seller),
        JSON.stringify({ images: a.images ?? [], thumbnails: a.image_thumbnails ?? [] }),
        JSON.stringify(a), manifest.snapshotId, manifest.finishedAt, // 2410-1 v2: giờ thu snapshot (airbnb_snapshots.collected_at) — không dùng giờ nạp/giờ từng item
      ],
    );
    n++;
  }
  console.log(`✅ ${n} ads → stg_chotot_ads${sellerOnly ? " (lượt lấy số: chỉ cập nhật seller)" : ""}`);
  return n;
}

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    let dirs = process.argv[2] === "--latest" ? await latestSnapshotDir() : [process.argv[2]];
    // PL1 (mở lại lần 2): ALLOWLIST — chotot importer chỉ nhận 'chotot-ads'.
    // Lớp khuôn tên (mở lại 2310-4 vòng 4): '…__chotot-ads__TEST' có nguồn
    // hợp lệ nhưng mốc không phải thời gian → bỏ cả thư mục, cùng luật
    // '<city>__<nguồn>__<mốc>' với import-airbnb (BÁO 2510-5).
    const allowed = new Set(["chotot-ads"]);
    dirs = dirs.filter((d) => {
      const parsed = parseSnapshotDirName(basename(d));
      if (!parsed) {
        console.warn(`bỏ qua thư mục không đúng khuôn <city>__<nguồn>__<mốc thời gian>: ${d}`);
        return false;
      }
      if (!allowed.has(parsed.source)) {
        console.warn(`bỏ qua snapshot nguồn ngoài ALLOWLIST '${parsed.source}' (không nạp stg): ${d}`);
        return false;
      }
      return true;
    });
    for (const d of dirs) await importDir(client, d);
  } finally {
    await client.end();
  }
}

// AggregateError (vd ECONNREFUSED khi DB chết) có message rỗng — in đủ
// code + errors để log đêm tự chẩn đoán được (bài học 22/10).
const errDetail = (e) => {
  const parts = [e?.code, e?.message].filter(Boolean);
  if (e instanceof AggregateError && e.errors?.length) {
    parts.push(e.errors.map(String).join("; "));
  }
  if (parts.length === 0) parts.push(e?.stack ?? String(e));
  return parts.join(" — ");
};

// Chỉ chạy main() khi được gọi trực tiếp (khuôn import-airbnb) — test import
// UPSERT_SQL từ file này không làm script nạp chạy theo.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error("❌", errDetail(e)); process.exit(1); });
}
