#!/usr/bin/env node
// import-s09-danh-ba.mjs — bộ nạp danh bạ nguồn s09-danh-ba (DC v15, mọi kind của nguồn)
// vào stg_s09_danh_ba. Khớp từng điểm GS CHỐT (BÁO claudedp-2011-19, mảnh 2 của GIAO 2011-17):
//   CỘT: snapshot_id (FK airbnb_snapshots ON DELETE CASCADE) · dong bigint · kind · source_id ·
//        payload jsonb · meta jsonb · fetched_at · PK (snapshot_id, dong) — KHÔNG cột tiền tố
//        (đọc meta->>'tienTo' phía migration, bộ nạp không ghi).
//   dong BẮT ĐẦU TỪ 1; thứ tự = tệp items-*.json.gz SẮP TÊN TƯỜNG MINH (sort theo name, không
//        dựa thứ tự manifest/readdir) rồi chỉ số trong mảng; đếm MỌI item MỌI kind kể cả item
//        bị bỏ (hở số là hợp lệ).
//   Dòng airbnb_snapshots chèn TRƯỚC dòng stg trong CÙNG giao dịch (đúng lỗi FK S08 lượt 15/11).
//   Nạp lại: ON CONFLICT (snapshot_id, dong) DO NOTHING; in «nạp N/N, bỏ …» + số dòng đã có sẵn.
//   Index là việc migration 115 phía làn import — bộ nạp KHÔNG tạo index.
//   manifest.error: từ chối cả lượt TRỪ khi cờ tường minh --cho-phep-loi (lượt hỏng khai trong
//   tệp kê KHÔNG nạp — vd snapshot hỏng ngày 18/11).
// Mặc định chỉ DB thử ^oneinvest_suite_; --may-thu là cờ cho GIAO triển khai riêng.
//   node pipeline/import-s09-danh-ba.mjs <đường-thư-mục-snapshot-vn__s09-danh-ba__*> [--cho-phep-loi]
import { readFileSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import pg from "pg";

export const SCHEMA_DANH_BA = [15];
const LO = 500; // dòng mỗi lệnh INSERT

const CHAY_TRUC_TIEP =
  process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1]);

/** Đọc + kiểm manifest TRƯỚC khi mở DB; trả { snapshotId, items (theo thứ tự dong) }.
 *  Băm sha256 từng tệp trong manifest.files phải khớp; thiếu tệp items → ném. */
export function docSnapshot(thuMuc) {
  const manifest = JSON.parse(readFileSync(join(thuMuc, "manifest.json"), "utf8"));
  if (manifest.source !== "s09-danh-ba") {
    throw new Error("snapshot không phải nguồn s09-danh-ba");
  }
  if (manifest.error && !process.argv.includes("--cho-phep-loi")) {
    throw new Error("manifest ghi error — từ chối nạp (cờ tường minh --cho-phep-loi để vượt)");
  }
  if (!SCHEMA_DANH_BA.includes(manifest.schemaVersion)) {
    throw new Error(`schemaVersion ${manifest.schemaVersion} chưa hỗ trợ (chỉ ${SCHEMA_DANH_BA.join(",")})`);
  }
  if (!(manifest.files ?? []).some((f) => /^items-\d+\.json\.gz$/.test(f.name))) {
    throw new Error("manifest không có tệp items");
  }
  const snapshotId = manifest.snapshotId ?? basename(thuMuc);
  // THỨ TỰ ĐONG (điểm chốt GS): tệp items-*.json.gz theo TÊN tăng dần — sắp tường minh
  // tại đây, không dựa thứ tự manifest.files hay readdir; rồi chỉ số trong mảng.
  const tepItems = (manifest.files ?? [])
    .filter((f) => /^items-\d+\.json\.gz$/.test(f.name))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  const items = tepItems.flatMap((f) => {
    const buf = readFileSync(join(thuMuc, f.name));
    if (createHash("sha256").update(buf).digest("hex") !== f.sha256) {
      throw new Error(`checksum sai (sai băm): ${f.name}`);
    }
    const d = JSON.parse(gunzipSync(buf).toString("utf8"));
    return Array.isArray(d) ? d : d.items;
  });
  return { manifest, snapshotId, items };
}

/** Nạp snapshot vào stg_s09_danh_ba. Trả { ghi, bo, soCoSan, soDoc, snapshotId }.
 *  dong từ 1 — đếm mọi item (kể cả item phi-object bị bỏ → hở số hợp lệ). */
export async function napDanhBaThuMuc(thuMuc, db) {
  const { manifest, snapshotId, items } = docSnapshot(thuMuc);
  const client = new pg.Client({ connectionString: db });
  await client.connect();
  try {
    await client.query("BEGIN");
    // (1) dòng airbnb_snapshots TRƯỚC stg trong CÙNG giao dịch — FK cần cha trước
    await client.query(
      `INSERT INTO airbnb_snapshots (snapshot_id, city, source, collected_at, manifest)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (snapshot_id) DO NOTHING`,
      [snapshotId, manifest.city ?? "vn", manifest.source, manifest.finishedAt ?? null, JSON.stringify(manifest)],
    );
    // số dòng của snapshot đã có sẵn từ lượt nạp trước (in khi nạp lại)
    const { rows } = await client.query(
      `SELECT count(*)::int AS n FROM stg_s09_danh_ba WHERE snapshot_id = $1`,
      [snapshotId],
    );
    const soCoSan = rows[0]?.n ?? 0;
    // (2) dòng stg — mọi item mọi kind, nguyên vẹn payload/meta; dong = chỉ số toàn cục từ 1
    let ghi = 0;
    let bo = 0;
    // Lý do bỏ (AC-1 của DA42 «item hỏng đếm theo lý do»). Item thiếu kind/sourceId KHÔNG ghi chuỗi rỗng — bảng của 115 có
    // CHECK btrim(kind|source_id) <> '', một dòng rỗng làm cả lượt ROLLBACK (lỗi tích hợp, P1 sửa 22/11 theo GS + LL).
    const boTheoLyDo = { phi_object: 0, thieu_kind: 0, thieu_source_id: 0 };
    const hang = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it || typeof it !== "object" || Array.isArray(it)) { bo++; boTheoLyDo.phi_object++; continue; }
      const kind = String(it.kind ?? "").trim() === "" ? null : String(it.kind);
      const sourceId = String(it.sourceId ?? "").trim() === "" ? null : String(it.sourceId);
      if (kind === null) { bo++; boTheoLyDo.thieu_kind++; continue; }
      if (sourceId === null) { bo++; boTheoLyDo.thieu_source_id++; continue; }
      hang.push([
        snapshotId,
        i + 1, // dong BẮT ĐẦU TỪ 1 (điểm chốt GS) — đếm mọi item kể cả bị bỏ
        kind,
        sourceId,
        it.payload ?? {},
        it.meta ?? {},
        it.fetchedAt ?? null,
      ]);
    }
    for (let i = 0; i < hang.length; i += LO) {
      const lo = hang.slice(i, i + LO);
      const giaTri = lo.map((_, j) => `(${Array.from({ length: 7 }, (_, k) => `$${j * 7 + k + 1}`).join(",")})`).join(",");
      const r = await client.query(
        `INSERT INTO stg_s09_danh_ba (snapshot_id, dong, kind, source_id, payload, meta, fetched_at)
         VALUES ${giaTri} ON CONFLICT (snapshot_id, dong) DO NOTHING`,
        lo.flat(),
      );
      ghi += r.rowCount;
    }
    await client.query("COMMIT");
    // (3) tổng kết — chỉ số đếm; nạp lại in thêm số dòng có sẵn
    const soLap = hang.length - ghi;
    console.log(
      `s09-danh-ba nạp: ${ghi}/${hang.length} dòng stg_s09_danh_ba (đọc ${items.length} item; ` +
      `bỏ ${bo} item: phi_object ${boTheoLyDo.phi_object}, thieu_kind ${boTheoLyDo.thieu_kind}, ` +
      `thieu_source_id ${boTheoLyDo.thieu_source_id}; nạp lại bỏ trùng ${soLap}; đã có sẵn ${soCoSan} dòng trước lượt)`,
    );
    return { ghi, bo, boTheoLyDo, soCoSan, soLap, soDoc: items.length, snapshotId };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

export { napDanhBaThuMuc as nap };

if (CHAY_TRUC_TIEP) {
  const doi = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const thuMuc = doi[0];
  if (!thuMuc) {
    console.error("import-s09-danh-ba: thiếu đường thư mục snapshot — node pipeline/import-s09-danh-ba.mjs <snapshot> [--cho-phep-loi]");
    process.exit(2);
  }
  const db = process.env.DATABASE_URL;
  if (!db) {
    console.error("import-s09-danh-ba: thiếu DATABASE_URL");
    process.exit(2);
  }
  const tenDb = (() => { try { return decodeURIComponent(new URL(db.replace(/^postgresql:/, "postgres:")).pathname.replace(/^\//, "")); } catch { return ""; } })();
  const mayThu = process.argv.includes("--may-thu");
  if (!/^oneinvest_suite_[a-z0-9_]+$/.test(tenDb) && !mayThu) {
    console.error(`import-s09-danh-ba: từ chối DB '${tenDb || "(đọc được tên?)"}' — chỉ chạy DB thử oneinvest_suite_*; DB khác cần cờ --may-thu (GIAO triển khai riêng)`);
    process.exit(2);
  }
  napDanhBaThuMuc(thuMuc, db).catch((e) => {
    console.error(`import-s09-danh-ba: ${e.message || e.code || String(e)}`);
    process.exit(1);
  });
}
