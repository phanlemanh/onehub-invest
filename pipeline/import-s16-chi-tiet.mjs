#!/usr/bin/env node
// import-s16-chi-tiet.mjs — bộ nạp thuộc tính căn S16 (kind mngt-can-chi-tiet, DATA-CONTRACT v14,
// claudedp-1811-8, DA40) vào stg_s16_can_chi_tiet (migration 113 của làn import).
// Khuôn import-s16.mjs bản sạch @928bf7914: kiểm manifest TRƯỚC khi mở DB — schemaVersion phải
// nằm trong SCHEMA_CHI_TIET, băm sha256 TỪNG tệp trong manifest.files phải khớp (lệch một byte
// cũng ném 'checksum sai'), manifest thiếu files/rỗng/không tệp items nào thì ném — lỗi trước
// khi mở DB nên rollback sạch cả lượt kể cả dòng airbnb_snapshots; thông điệp không in tên
// nguồn thật hay tên thư mục bản thu.
// Cột đúng BÁO claudedp-1811-5: du_an/khu/toa lấy từ meta, ma_can nguyên văn unitNumber,
// dong = số thứ tự item TRONG SNAPSHOT (từ 0, tính mọi item kể cả bị bỏ — phần khoá chính);
// KHÔNG nạp trường chủ căn tự nhập (purchasePrice, purchaseDate, initialInvestmentCost,
// loanAmount, investmentCapital, juridicalStatus, deliveryStatus, furnitureStatus, houseStatus)
// và _propertyType, projectAlias, areaClusterAlias, floors — chúng ở lại raw snapshot.
// Chạy lại cùng snapshot: 0 dòng mới (ON CONFLICT DO NOTHING). Log chỉ in số đếm.
// Mặc định chỉ DB thử oneinvest_suite_*; --may-thu là cờ cho GIAO triển khai riêng.
//   node pipeline/import-s16-chi-tiet.mjs <đường-thư-mục-snapshot-vn__s16-*__*>
import { readFileSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import pg from "pg";
import { NGUON_S16 } from "./lib/s16-danh-muc.mjs";

// Snapshot kind mngt-can-chi-tiet ghi schemaVersion 14 (DC v14); số 12–13 thuộc kind cũ của S16/S09.
export const SCHEMA_CHI_TIET = [14];
const KIND = "mngt-can-chi-tiet";
const LO = 500; // dòng mỗi lệnh INSERT

const CHAY_TRUC_TIEP =
  process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1]);

const soNguyen = (v) => (Number.isFinite(v) ? Math.trunc(v) : null);
const soThuc = (v) => (Number.isFinite(v) ? v : null);
const chuoi = (v) => (v == null ? "" : String(v));

async function napChiTietThuMuc(thuMuc, db) {
  const manifest = JSON.parse(readFileSync(join(thuMuc, "manifest.json"), "utf8"));
  if (!String(manifest.source ?? "").startsWith("s16-")) {
    throw new Error(`snapshot không phải nguồn S16: ${manifest.source}`);
  }
  if (!SCHEMA_CHI_TIET.includes(manifest.schemaVersion)) {
    throw new Error(`schemaVersion ${manifest.schemaVersion} chưa hỗ trợ`);
  }
  // MỞ LẠI 1711-20 (2) kế thừa: manifest thiếu files, rỗng hay không có tệp items nào thì ném
  // TRƯỚC khi mở DB (trước đây items=[] vẫn chèn airbnb_snapshots + báo nạp 0).
  if (!(manifest.files ?? []).some((f) => /^items-\d+\.json\.gz$/.test(f.name))) {
    throw new Error("manifest không có tệp items");
  }
  const snapshotId = manifest.snapshotId ?? basename(thuMuc);
  // Đọc THEO manifest.files: kiểm sha256 từng tệp trước, chỉ bóc items-*.json.gz (khuôn @928bf7914).
  const items = (manifest.files ?? [])
    .flatMap((f) => {
      const buf = readFileSync(join(thuMuc, f.name));
      if (createHash("sha256").update(buf).digest("hex") !== f.sha256) {
        throw new Error(`checksum sai: ${f.name}`);
      }
      if (!/^items-\d+\.json\.gz$/.test(f.name)) return [];
      const d = JSON.parse(gunzipSync(buf).toString("utf8"));
      return Array.isArray(d) ? d : d.items;
    });

  const client = new pg.Client({ connectionString: db });
  await client.connect();
  try {
    await client.query("BEGIN");
    // (1) một dòng airbnb_snapshots — FK của stg_s16_can_chi_tiet; source='S16' đúng mẫu (1711-7(2)(a))
    await client.query(
      `INSERT INTO airbnb_snapshots (snapshot_id, city, source, collected_at, manifest)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (snapshot_id) DO NOTHING`,
      [snapshotId, manifest.city ?? "vn", NGUON_S16, manifest.finishedAt ?? null, JSON.stringify(manifest)],
    );
    // (2) dòng stg — dong là số thứ tự item trong snapshot (mọi item, kể cả bị bỏ), từ 0
    let ghi = 0;
    const bo = { "kind-la": 0, "thieu-du-an": 0, "thieu-ma-can": 0 };
    const hang = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it || it.kind !== KIND) { bo["kind-la"]++; continue; }
      const p = it.payload ?? {};
      const duAn = chuoi(it.meta?.duAn ?? p.proj);
      const maCan = chuoi(p.unitNumber).trim();
      if (!duAn.trim()) { bo["thieu-du-an"]++; continue; }
      if (!maCan) { bo["thieu-ma-can"]++; continue; }
      hang.push([
        snapshotId, duAn, chuoi(it.meta?.khu ?? p.khu), chuoi(it.meta?.toa ?? p.tower),
        chuoi(p.unitNumber), i, chuoi(p.heightType) || null, chuoi(p.propertyType) || null,
        chuoi(p.floorNumber) || null, soNguyen(p.bedroom), soNguyen(p.bathroom),
        chuoi(p.direction) || null, chuoi(p.balconyDirection) || null, chuoi(p.houseStyle) || null,
        soNguyen(p.salePrice), soThuc(p.areaUsing), soThuc(p.areaBuilding),
        Array.isArray(p.editableFields) ? p.editableFields : [],
      ]);
    }
    const COT = 18;
    for (let i = 0; i < hang.length; i += LO) {
      const lo = hang.slice(i, i + LO);
      const giaTri = lo.map((_, j) => `(${Array.from({ length: COT }, (_, k) => `$${j * COT + k + 1}`).join(",")})`).join(",");
      const params = lo.flat();
      const r = await client.query(
        `INSERT INTO stg_s16_can_chi_tiet (snapshot_id, du_an, khu, toa, ma_can, dong, height_type, property_type,
           floor_number, bedroom, bathroom, direction, balcony_direction, house_style, sale_price,
           area_using, area_building, editable_fields)
         VALUES ${giaTri} ON CONFLICT (snapshot_id, du_an, toa, ma_can, dong) DO NOTHING`,
        params,
      );
      ghi += r.rowCount;
    }
    await client.query("COMMIT");
    // (3) tổng kết — CHỈ số đếm, không mã căn/toà/tên nguồn (1711-7(2)(b))
    console.log(
      `S16 thuộc tính nạp: ${ghi}/${hang.length} dòng stg_s16_can_chi_tiet (đọc ${items.length} item, snapshot 1 dòng airbnb_snapshots); ` +
      `bỏ ${bo["kind-la"]} kind-lạ, ${bo["thieu-du-an"]} thiếu-du-an, ${bo["thieu-ma-can"]} thiếu-mã-căn`,
    );
    return { ghi, bo, soDoc: items.length, snapshotId };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

export { napChiTietThuMuc };

if (CHAY_TRUC_TIEP) {
  const thuMuc = process.argv[2];
  if (!thuMuc) {
    console.error("import-s16-chi-tiet: thiếu đường thư mục snapshot — node pipeline/import-s16-chi-tiet.mjs <snapshot>");
    process.exit(2);
  }
  const db = process.env.DATABASE_URL;
  if (!db) {
    console.error("import-s16-chi-tiet: thiếu DATABASE_URL");
    process.exit(2);
  }
  // Chốt chặn DANH SÁCH CHO PHÉP (khuôn import-s09 1411-11 / import-s16): chỉ DB thử
  // ^oneinvest_suite_ (db-thu cấp); DB khác chỉ khi cờ tường minh --may-thu (GIAO triển khai riêng).
  const tenDb = (() => { try { return decodeURIComponent(new URL(db.replace(/^postgresql:/, "postgres:")).pathname.replace(/^\//, "")); } catch { return ""; } })();
  const mayThu = process.argv.includes("--may-thu");
  if (!/^oneinvest_suite_[a-z0-9_]+$/.test(tenDb) && !mayThu) {
    console.error(`import-s16-chi-tiet: từ chối DB '${tenDb || "(đọc được tên?)"}' — chỉ chạy DB thử oneinvest_suite_*; DB khác cần cờ --may-thu (GIAO triển khai riêng)`);
    process.exit(2);
  }
  napChiTietThuMuc(thuMuc, db).catch((e) => {
    console.error(`import-s16-chi-tiet: ${e.message || e.code || String(e)}`);
    process.exit(1);
  });
}
