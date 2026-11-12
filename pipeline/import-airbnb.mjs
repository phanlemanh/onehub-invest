// import-airbnb.mjs — nạp snapshot từ one-invest-collector theo DATA-CONTRACT
// (collector/docs/DATA-CONTRACT.md schemaVersion 1–2): verify sha256 từng file trước khi parse.
// v2 chỉ thêm file media/* + RawItem.meta.mediaFiles — items đọc y như v1;
// meta.mediaFiles (zalo-agent) → stg_zalo_posts.media_files (PII tầng A, chỉ local).
// - airbnb-listing items → stg_abnb_listings (payload nguyên vẹn) + stg_abnb_nights
// - airbnb-discovery items → stg_abnb_discovery (title là nguồn suy ra area)
//
// Dùng: node import-airbnb.mjs <đường-dẫn-snapshot-dir>
//   (vd: ../collector/snapshots/hanoi/hanoi__airbnb-listing__2026…)
import { readFile } from "node:fs/promises";
import { existsSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
// 2610-10 vòng 2: đường nạp S08 dùng ĐÚNG hàm pure này (BÁO 2610-17)
import { s08RowOf, s08Num, s08Int } from "./import-s08-row.mjs";
import { bocS10, duBoLoc } from "./lib/s10-bang-hang.mjs";
export { s08Num, s08Int }; // re-export — test cũ import từ đây

// Luật khuôn tên thư mục dùng chung cho cả hai importer (PL1 mở lại vòng 4,
// claudedp-2310-4 + BÁO claudedp-2510-5): '<city>__<nguồn>__<mốc thời gian>'
// với mốc khớp SNAPSHOT_TS_RE — chuỗi GIỐNG HỆT literal TS_RE trong
// scripts/apify-facebook-daily.sh, scripts/zalo-import-daily.sh (AU3
// 2310-8 vòng 3) và import-chotot.mjs; test đối chiếu bốn bản không lệch.
// Inline (không import-file riêng): harness nghiệm thu chép MỖI file
// importer sang cây tạm, module kèm theo sẽ làm ERR_MODULE_NOT_FOUND.
// Mốc nhận giây (6 số), mili-giây (9 số, storage.ts b0898fe) và hậu tố
// '-n' khi trùng ms; '__TEST'/'__e2e' không phải mốc → bỏ cả thư mục.
const SNAPSHOT_TS_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{6}([0-9]{3})?(-[0-9]+)?Z?$/;

/** Tách '<city>__<nguồn>__<mốc>' — null nếu sai khuôn hoặc mốc không phải
 *  thời gian (segment thử như TEST/e2e). Export để test. */
export function parseSnapshotDirName(name) {
  const parts = String(name).split("__");
  if (parts.length !== 3) return null;
  const [city, source, ts] = parts;
  if (!city || !source || !SNAPSHOT_TS_RE.test(ts)) return null;
  return { city, source, ts };
}

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// 3010-3 (GẤP): U+0000 trong chuỗi làm Postgres từ chối UTF8 — lọc ĐỆ QUY
// khỏi mọi chuỗi (kể cả giá trị lồng trong mảng/đối tượng/jsonb) TRƯỚC khi
// ghi stg. Snapshot bất biến — lọc ở BÊN ĐỌC, không sửa tệp.
export function stripNullBytes(value) {
  if (typeof value === "string") return value.replace(/\0/g, "");
  if (Array.isArray(value)) return value.map(stripNullBytes);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[stripNullBytes(k)] = stripNullBytes(v);
    return out;
  }
  return value;
}

// meta.mediaFiles (v2) → giá trị cột media_files. Gắn snapshotId vào từng phần
// tử: `file` tương đối theo thư mục snapshot, còn snapshot_id của dòng không đổi
// khi bài xuất hiện lại ở snapshot sau (upsert theo post_id).
// Không có ảnh → null (SQL NULL, để COALESCE giữ bản đã nạp trước).
export function mediaFilesOf(item, snapshotId) {
  const mf = item?.meta?.mediaFiles;
  if (!Array.isArray(mf) || mf.length === 0) return null;
  return mf.map((m) => ({ ...m, snapshotId }));
}

// PL1 (claudedp-2310-4 mở lại lần 2): ALLOWLIST nguồn thật thay denylist
// nguồn thử — denylist không bắt được nguồn lạ mới (vd 'example' có thật trên
// đĩa). Mỗi importer chỉ nhận DANH SÁCH TRẮNG nguồn nó phụ trách; nguồn khác
// bị bỏ CÓ LOG (bảo vệ hai chiều: chặn dữ liệu thử VÀ chặn nhầm nguồn vào
// sai bảng). Export để test.
const AIRBNB_IMPORTER_SOURCES = new Set([
  "zalo-agent", // stg_zalo_posts (nhánh chính)
  "s03-ho-so", // stg_s03_ho_so (link-nguoi-ban-s03 v7 — bảng 080, mốc 4b)
  "airbnb-listing",
  "airbnb-discovery",
  "airdna-research",
  "osm-boundaries",
  "s08-danh-muc", // PL10/BÁO 2510-12: snapshot vn__s08-danh-muc__ nạp qua
                  // import-airbnb vào stg_s08_inventory — thiếu là bị allowlist
                  // bỏ exit 0 (0 dòng stg, không job nào báo lỗi)
  "s10-bang-hang", // v8 (DATA-CONTRACT mục S10): bảng hàng CĐT → stg_s10_stock (089)
]);
export function isAllowedSource(source) {
  return AIRBNB_IMPORTER_SOURCES.has(String(source));
}

// v5 (claudedp-0211-1 hợp đồng người bán): RawItem.seller chỉ THÊM key tùy chọn,
// đọc items y như cũ — cùng mảng với import-chotot.mjs, test đối chiếu hai bản.
// Export để test; mọi lần nới phải cập nhật DATA-CONTRACT «bên import phải chấp nhận».
// link-nguoi-ban-s03 (v7): nguồn s03-ho-so + kind ho-so — {6,7} S03 bất kể
// thứ tự gộp với nhánh album (v6); bên import chấp nhận {1..7}
// v8 (2026-11-10): nguồn s10-bang-hang + s11-nn1-du-an — RawItem không thêm trường chung; bên import chấp nhận {1..8}
export const SUPPORTED_SCHEMA_VERSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
/** @deprecated giữ cho test cũ — nghĩa mới: NGOÀI allowlist = không nạp */
export function isTestSnapshot(name) {
  const m = String(name).match(/__([^_]+)__/);
  return m ? !isAllowedSource(m[1]) : true;
}

// 0611-6 mốc 4b: bảng stg hồ sơ (migration 080 của làn Claude, chưa có trên
// nhánh này) — tên mặc định stg_s03_ho_so; 080 đặt tên khác thì sửa hằng này.
// link-nguoi-ban-s03 E6 (0711-20): export để db-nap đọc tên bảng/nguồn từ hằng
// của bộ nạp — không viết tay chuỗi ở script chấm. (Tên bảng/nguồn TIN mang
// tên kênh thật nên KHÔNG thành hằng ở đây — db-nap đọc từ env hay ánh xạ
// ALLOWLIST của tệp này lúc chạy, kho không giữ chuỗi mới.)
export const STG_HO_SO = "stg_s03_ho_so";
export const NGUON_HO_SO_S03 = "s03-ho-so"; // nguồn hồ sơ kênh S03 trong ALLOWLIST
let hoSoDaChua080 = false; // chỉ in CHUA-AP-080 một lần mỗi lượt nạp
// 0711-37(d): lỗi dò bảng KHÔNG được nuốt thành false — False âm đẩy snapshot
// hồ sơ vào đường «bỏ + đánh dấu đã nạp» = MẤT DỮ LIỆU thật. Ném để dừng lượt.
async function coBangHoSo(client) {
  try {
    const r = await client.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1`, [STG_HO_SO]);
    return (r.rowCount ?? 0) >= 1; // bảng nhiều cột — đếm cột, không đòi đúng 1
  } catch (e) {
    console.error(`LỖI dò bảng ${STG_HO_SO}: ${e instanceof Error ? e.message : String(e)} — coi như CHƯA có 080 nhưng sẽ KHÔNG đánh dấu; nếu là lỗi kết nối, lượt nạp sẽ lỗi ở INSERT dưới đây`);
    return false;
  }
}

async function napHoSo(client, it) {
  await client.query(
    `INSERT INTO ${STG_HO_SO} (source_id, ma_tai_khoan, username, loai, captured_at)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (source_id) DO NOTHING`,
    [it.sourceId, it.payload.ma_tai_khoan, it.payload.username || "", it.payload.loai ?? it.meta?.loai_ket_qua, it.fetchedAt]);
}

// S10 (089 của làn Claude): bảng stg_s10_stock. DB chưa có bảng → in CHUA-AP-089, snapshot S10 KHÔNG đánh dấu đã nạp
// (như hồ sơ 080) để sau khi áp 089 nạp lại được. Lỗi dò bảng KHÔNG nuốt thành false — ném, dừng lượt.
export const STG_S10 = "stg_s10_stock";
// 1111-17: bảng danh bạ dự án S10 (cùng migration 089 của làn Claude).
export const STG_S10_PROJECT = "stg_s10_project";
export const NGUON_S10 = "s10-bang-hang";
async function coBangS10(client, bang = STG_S10) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1`, [bang]);
  return (r.rowCount ?? 0) >= 1;
}
const COT_S10 = ["stock_id", "source_id", "project_id", "block_type", "unit_number", "subdivision_name", "block_raw",
  "property_sub_type_raw", "lot_size_m2", "building_area_m2", "handover_condition_raw", "direction_faces_raw",
  "list_price_vnd", "status_raw", "remarks_raw", "source_modified_on", "snapshot_id", "captured_at", "server_cond", "raw_row"];
/** Nạp dòng của một item stock_table theo lô 500; trả số dòng THẬT SỰ ghi (nạp lại cùng snapshot → 0). */
let s10TrungLan = 0; // 1211-22(2): đếm dòng trùng bị ON CONFLICT bỏ theo lượt nạp
async function napS10(client, rows, snapshotId, capturedAt, cond) {
  let ghi = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const lo = rows.slice(i, i + 500);
    const params = [];
    const values = lo.map((d) => {
      const v = [d.stock_id, d.source_id, d.project_id, d.block_type, d.unit_number, d.subdivision_name, d.block_raw,
        d.property_sub_type_raw, d.lot_size_m2, d.building_area_m2, d.handover_condition_raw, d.direction_faces_raw,
        d.list_price_vnd, d.status_raw, d.remarks_raw, d.source_modified_on, snapshotId, capturedAt,
        cond == null ? null : JSON.stringify(cond), stripNullBytes(d.raw_row)];
      const base = params.length;
      params.push(...v);
      return `(${v.map((_, j) => `$${base + j + 1}`).join(",")})`;
    });
    const dangCo = new Set((await client.query(
      `SELECT stock_id FROM ${STG_S10} WHERE snapshot_id = $1 AND stock_id = ANY($2::text[])`,
      [snapshotId, lo.map((d) => d.stock_id)])).rows.map((x) => x.stock_id));
    s10TrungLan += lo.filter((d) => dangCo.has(d.stock_id)).length;
    const r = await client.query(
      `INSERT INTO ${STG_S10} (${COT_S10.join(", ")}) VALUES ${values.join(", ")}
       ON CONFLICT (snapshot_id, stock_id) DO NOTHING`, params);
    ghi += r.rowCount ?? 0;
  }
  return ghi;
}

/** Chuẩn hoá chuỗi meta S10: rỗng hoặc «---» → NULL; stripNullBytes (1111-17). */
const donChuoiS10 = (v) => {
  const s = typeof v === "string" ? v : v == null ? "" : String(v);
  const t = stripNullBytes(s.trim());
  return t === "" || t === "---" ? null : t;
};

/** DA29 (1111-17): mỗi item stock_table ghi 1 dòng stg_s10_project — hai item cùng
 *  project_id cùng nhãn (bt177 + bt178) ra 1 dòng nhờ ON CONFLICT DO NOTHING;
 *  khoá (snapshot_id, project_id, project_label) NULLS NOT DISTINCT do 089 tạo. */
async function napS10Project(client, it, snapshotId, capturedAt) {
  const projectId = donChuoiS10(it.meta?.request?.project_id);
  if (projectId == null) return 0; // thiếu project_id → không có khoá, bỏ có đếm ở gọi chỗ
  const r = await client.query(
    `INSERT INTO ${STG_S10_PROJECT} (project_id, du_an, phan_khu, project_label, snapshot_id, captured_at)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (snapshot_id, project_id, project_label) DO NOTHING`,
    [projectId, donChuoiS10(it.meta?.duAn), donChuoiS10(it.meta?.phanKhu),
     donChuoiS10(it.meta?.projectLabel), snapshotId, capturedAt]);
  return r.rowCount ?? 0;
}

async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error("thiếu tham số: node import-airbnb.mjs <snapshot-dir>");
    process.exit(1);
  }
  // Snapshot thử → bỏ qua CÓ LOG (exit 0 để vòng nạp hằng đêm không gãy,
  // nhưng stderr nói rõ đã skip cái gì cho auditable). basename() tự bỏ
  // dấu / cuối — split('/').pop() trả rỗng khi path kết thúc / (mở lại 2310-4).
  // Lớp khuôn tên (mở lại 2310-4 vòng 4, hồi quy AC-6): '…__zalo-agent__TEST'
  // có nguồn nằm trong allowlist nên lọt qua lớp nguồn — cả thư mục phải đúng
  // '<city>__<nguồn>__<mốc thời gian>' với mốc khớp TS_RE (BÁO 2510-5).
  const parsed = parseSnapshotDirName(basename(dir));
  if (!parsed) {
    console.warn(`bỏ qua thư mục không đúng khuôn <city>__<nguồn>__<mốc thời gian>: ${dir}`);
    process.exit(0);
  }
  if (!isAllowedSource(parsed.source)) {
    console.warn(`bỏ qua snapshot nguồn ngoài ALLOWLIST '${parsed.source}' (không nạp stg): ${dir}`);
    process.exit(0);
  }
  // Orphan: crash giữa write items và finalize → dir không có manifest.
  // Skip + warn (không nạp, không ném) để một dir mồ côi không gãy cả finalize.
  if (!existsSync(join(dir, "manifest.json"))) {
    console.warn(`bỏ qua snapshot mồ côi (thiếu manifest): ${dir}`);
    process.exit(0);
  }
  const manifest = JSON.parse(await readFile(join(dir, "manifest.json"), "utf8"));
  // v2 (N1 media) + v3 (Kev-nhãn meta.kev) + v5 (seller người bán) đều giữ
  // nguyên hình dạng cũ, chỉ thêm key
  if (!SUPPORTED_SCHEMA_VERSIONS.includes(manifest.schemaVersion)) {
    throw new Error(`schemaVersion ${manifest.schemaVersion} chưa hỗ trợ`);
  }
  // Lớp thứ hai nhận diện snapshot thử (mở lại 2310-4): chỉ nhìn TÊN THƯ MỤC
  // có thể bị đổi tên — manifest.source là lời khai của chính snapshot.
  if (!isAllowedSource(manifest.source)) {
    console.warn(`bỏ qua snapshot nguồn ngoài ALLOWLIST theo manifest.source=${manifest.source}: ${dir}`);
    process.exit(0);
  }

  // 1. Verify checksum từng file (quy tắc tiêu thụ #2 của DATA-CONTRACT)
  for (const f of manifest.files) {
    const buf = await readFile(join(dir, f.name));
    const sha = createHash("sha256").update(buf).digest("hex");
    if (sha !== f.sha256) throw new Error(`checksum sai: ${f.name}`);
  }
  console.log(`manifest ok: ${manifest.snapshotId} (${manifest.files.length} file đã verify)`);

  // 2. Đọc items
  const items = [];
  for (const f of manifest.files.filter((f) => f.name.startsWith("items-"))) {
    items.push(...JSON.parse(gunzipSync(await readFile(join(dir, f.name))).toString("utf8")));
  }

  // Item thử lẫn trong snapshot THẬT (vd zalo-mock items hòa chung) — bỏ
  // từng item có source thuộc nhóm thử, đếm để log (mở lại 2310-4).
  const before = items.length;
  for (let i = items.length - 1; i >= 0; i--) {
    if (!isAllowedSource(items[i].source ?? "")) items.splice(i, 1);
  }
  if (items.length < before) {
    console.warn(`bỏ ${before - items.length} item nguồn ngoài ALLOWLIST lẫn trong snapshot thật: ${manifest.snapshotId}`);
  }

  // mediaFiles trỏ tới file không khai trong manifest = lệch hợp đồng → cảnh báo
  // (file khai trong manifest đã được verify sha256 ở bước 1).
  const declared = new Set(manifest.files.map((f) => f.name));
  const undeclared = items
    .flatMap((it) => it.meta?.mediaFiles ?? [])
    .filter((m) => m?.file && !declared.has(m.file)).length;
  if (undeclared) console.warn(`cảnh báo: ${undeclared} mediaFiles trỏ tới file không có trong manifest`);

  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  const coBang = await coBangHoSo(client).catch(() => false);
  if (!coBang) {
    if (!hoSoDaChua080) { console.log("CHUA-AP-080: bảng " + STG_HO_SO + " chưa có (migration 080 chưa áp) — snapshot hồ sơ bỏ qua, KHÔNG đánh dấu đã nạp; nguồn khác nạp như cũ"); hoSoDaChua080 = true; }
  }
  let hoSo = 0, hoSoBo = 0;
  const coS10Item = items.some((it) => it.source === NGUON_S10);
  const coBangS10Db = coS10Item ? await coBangS10(client) : false;
  // 1111-17: bảng danh bạ dự án thiếu riêng → in 1 lần như luật stock, KHÔNG bỏ phần stock đã có bảng.
  const coBangS10ProjectDb = coS10Item ? await coBangS10(client, STG_S10_PROJECT) : false;
  let daInChuaAp089Project = true; // in CHUA-AP-089 cho stg_s10_project đúng 1 lần mỗi lượt (khi bảng thiếu riêng)
  if (coS10Item && !coBangS10Db) {
    console.log(`CHUA-AP-089: bảng ${STG_S10} chưa có (migration 089 chưa áp) — snapshot S10 bỏ qua, KHÔNG đánh dấu đã nạp`);
  }
  let s10Dong = 0, s10Bo = 0, s10ThieuLoc = 0, s10Lech = 0, s10Cay = 0, s10ProjectDong = 0, s10ProjectBo = 0;
  let s10Boc = 0; // 1211-24: Σ tr.p_row bóc được (đối soát)
  try {
    await client.query("BEGIN");
    // 0711-37(d): snapshot HỒ SƠ KHÔNG được đánh dấu đã-nạp khi DB thiếu 080 —
    // INSERT vào bảng snapshot đĩa chỉ cho các nguồn khác; nếu hồ sơ bỏ hết,
    // rollback và thoát 0 (AC-6), để sau khi áp 080 lượt nạp lại được đủ.
    const boHetHoSo = items.length > 0 && items.every((it) => it.source === "s03-ho-so");
    // Cùng luật cho S10 khi DB thiếu 089.
    const boHetS10 = items.length > 0 && items.every((it) => it.source === NGUON_S10) && !coBangS10Db;
    if (!(!coBang && boHetHoSo) && !boHetS10) {
      await client.query(
        `INSERT INTO airbnb_snapshots (snapshot_id, city, source, collected_at, manifest)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (snapshot_id) DO UPDATE SET manifest = EXCLUDED.manifest`,
        [
          manifest.snapshotId,
          manifest.city,
          manifest.source,
          manifest.finishedAt,
          JSON.stringify(manifest),
        ],
      );
    }

    let listings = 0;
    let nights = 0;
    let discovery = 0;
    let osm = 0;
    let zalo = 0;
    let zaloMedia = 0;
  let s08 = 0;
  let s08Detail = 0;
  let s08Catalog = 0; // 2610-22(3): đếm item project_catalog bỏ
    const S10_UT = { "177": 0, "178": 1 };
    const itemsSap = [...items].sort((a, b) => {
      const ua = a.source === NGUON_S10 && a.kind === "stock_table" ? S10_UT[a.meta?.request?.block_type] ?? 9 : 9.5;
      const ub = b.source === NGUON_S10 && b.kind === "stock_table" ? S10_UT[b.meta?.request?.block_type] ?? 9 : 9.5;
      return ua - ub;
    });
    for (const it of itemsSap) {
      if (it.source === "s03-ho-so") {
        if (coBang) { await napHoSo(client, it); hoSo++; }
        else { hoSoBo++; }
        continue;
      }
      if (it.source === NGUON_S10) {
        // 1211-23(b): nạp stock_table 177 TRƯỚC 178 trong cùng snapshot — trùng stock_id giữ 177, không dựa may
        // 1211-26: Σ bóc đếm MỘT chỗ (ở duBoLoc dưới) — không đếm đôi tại đây
        // DATA-CONTRACT S10 luật 1: item thiếu bộ lọc rộng (snapshot 10/11 trước lượt thu lại) bị máy chủ lọc — bỏ có đếm.
        // Chọn snapshot MỚI NHẤT cho mỗi sourceId là việc của bước đọc stg (089), không phải bộ nạp: nạp mọi snapshot đủ lọc.
        if (it.kind === "project_tree") { s10Cay++; continue; } // v11: cây đối chiếu — khai hợp đồng, chưa nạp bảng nào
        if (!coBangS10Db) { s10Bo++; continue; }
        if (it.kind !== "stock_table") { s10Bo++; continue; }
        const soDongTrang = (String(it.payload?.html ?? "").match(/class="[^"]*\bp_row\b/g) || []).length;
        s10Boc += soDongTrang; // Σ bóc = TẤT CẢ tr.p_row (đủ lọc + thiếu lọc) — đẳng thức tự khép
        if (!duBoLoc(it)) { s10ThieuLoc += soDongTrang; continue; } // 1211-26: đếm DÒNG bỏ
        const r = bocS10(it);
        s10Lech += r.lechKhuon;
        if (r.khongStockId) console.warn(`S10: ${r.khongStockId} dòng không có stock_id (bỏ): ${it.sourceId} ${manifest.snapshotId}`);
        s10Dong += await napS10(client, r.dong, manifest.snapshotId, manifest.finishedAt, it.payload?.cond ?? null);
        // 1111-17: dòng danh bạ dự án từ meta của chính item (snapshot 11/11 đã phát đủ ba trường)
        if (!coBangS10ProjectDb) {
          if (daInChuaAp089Project) { console.log(`CHUA-AP-089: bảng ${STG_S10_PROJECT} chưa có — phần danh bạ dự án S10 bỏ, stock vẫn nạp`); daInChuaAp089Project = false; }
        } else {
          const themProject = await napS10Project(client, it, manifest.snapshotId, manifest.finishedAt);
          s10ProjectDong += themProject;
          if (themProject === 0 && donChuoiS10(it.meta?.request?.project_id) == null) s10ProjectBo++;
        }
        continue;
      }
      if (it.source === "zalo-mock" || it.source === "zalo-groups" || it.source === "zalo-agent") {
        const mediaFiles = mediaFilesOf(it, manifest.snapshotId);
        await client.query(
          `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, author_hash, posted_at, text,
                                       sender_name, sender_id, conversation_id, media, agent_id,
                                       media_files, captured_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12::jsonb,$13)
           ON CONFLICT (post_id) DO UPDATE SET text = EXCLUDED.text,
             -- 2410-1 v2 (luật claudedp): captured_at = GIỜ THU snapshot (manifest.finishedAt
             -- = airbnb_snapshots.collected_at), không bao giờ now(). Bảng giữ snapshot ĐẦU
             -- (snapshot_id không đổi) → mốc = LEAST(cũ, EXCLUDED): nạp snapshot cũ hơn sau
             -- vẫn hội tụ về mốc thu đầu, nạp lại không lệch thứ tự.
             captured_at = LEAST(stg_zalo_posts.captured_at, EXCLUDED.captured_at),

             sender_name = COALESCE(EXCLUDED.sender_name, stg_zalo_posts.sender_name),
             sender_id = COALESCE(EXCLUDED.sender_id, stg_zalo_posts.sender_id),
             conversation_id = COALESCE(EXCLUDED.conversation_id, stg_zalo_posts.conversation_id),
             media = COALESCE(EXCLUDED.media, stg_zalo_posts.media),
             agent_id = COALESCE(EXCLUDED.agent_id, stg_zalo_posts.agent_id),
             media_files = COALESCE(EXCLUDED.media_files, stg_zalo_posts.media_files)`,
          [
            it.sourceId,
            manifest.snapshotId,
            stripNullBytes(it.payload?.group ?? null),
            stripNullBytes(it.payload?.author ?? it.payload?.agent_id ?? null),
            it.fetchedAt,
            stripNullBytes(it.payload?.text ?? ""),
            stripNullBytes(it.payload?.senderName ?? null),
            stripNullBytes(it.payload?.senderId ?? null),
            stripNullBytes(it.payload?.conversationId ?? null),
            JSON.stringify(stripNullBytes(it.payload?.media ?? null)),
            stripNullBytes(it.payload?.agent_id ?? null),
            mediaFiles ? JSON.stringify(stripNullBytes(mediaFiles)) : null,
            manifest.finishedAt, // 2410-1 v2: giờ thu snapshot — không rơi DEFAULT now()
          ],
        );
        zalo++;
        if (mediaFiles) zaloMedia++;
      } else if (it.source === "airbnb-listing") {
        await client.query(
          `INSERT INTO stg_abnb_listings (listing_id, snapshot_id, fetched_at, payload)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (listing_id, snapshot_id) DO UPDATE SET payload = EXCLUDED.payload`,
          [it.sourceId, manifest.snapshotId, it.fetchedAt, JSON.stringify(it.payload)],
        );
        listings++;

        const months =
          it.payload?.calendar?.data?.node?.pdpAvailabilityCalendar?.calendarMonths ?? [];
        const values = [];
        const params = [];
        let p = 0;
        for (const m of months) {
          for (const d of m.days ?? []) {
            if (!d.calendarDate) continue;
            params.push(
              it.sourceId,
              manifest.snapshotId,
              d.calendarDate,
              d.available ?? null,
              d.minNights ?? null,
            );
            values.push(`($${++p},$${++p},$${++p},$${++p},$${++p})`);
          }
        }
        if (values.length) {
          await client.query(
            `INSERT INTO stg_abnb_nights (listing_id, snapshot_id, night, available, min_nights)
             VALUES ${values.join(",")}
             ON CONFLICT (listing_id, snapshot_id, night) DO NOTHING`,
            params,
          );
          nights += values.length;
        }
      } else if (it.source === "airbnb-discovery") {
        await client.query(
          `INSERT INTO stg_abnb_discovery (listing_id, snapshot_id, title, href, price_label, fetched_at)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (listing_id, snapshot_id) DO NOTHING`,
          [
            it.sourceId,
            manifest.snapshotId,
            it.payload?.title ?? null,
            it.payload?.href ?? null,
            it.payload?.price ?? null,
            it.fetchedAt,
          ],
        );
        discovery++;
      } else if (it.source === "s08-danh-muc") {
        // S08 inventory_unit (2410-12): item state=detail là metadata dự án
        // (không phải căn, CHECK state chặn) — bỏ có log.
        // 2610-22(3): state=catalog (kind project_catalog, gộp v4) cũng metadata
        // — bỏ im lặng CÓ ĐẾM như detail, hết cảnh báo «state lạ».
        if (it.meta?.state === "detail") {
          s08Detail++;
          continue;
        }
        if (it.meta?.state === "catalog") {
          s08Catalog++;
          continue;
        }
        const st = it.meta?.state;
        if (st !== "notSold" && st !== "sold") {
          console.warn(`bỏ item S08 state lạ '${st}' (product ${it.meta?.productCode}): ${manifest.snapshotId}`);
          continue;
        }
        // 2610-10 vòng 2: dựng dòng bằng s08RowOf (nguồn duy nhất, có đổi số
        // rác→NULL) — không còn bản dựng tham số song song trong importer.
        const row = s08RowOf(it, manifest.snapshotId);
        if (!row) {
          console.warn(`bỏ item S08 state lạ '${st}' (product ${it.meta?.productCode}): ${manifest.snapshotId}`);
          continue;
        }
        const ins = await client.query(
          `INSERT INTO stg_s08_inventory (source_id, snapshot_id, project_id, project_type, state,
                                         product_code, row_code, subdivision_name, apartment_type_name,
                                         land_area, construction_area, base_direction_name,
                                         number_of_room, number_of_wc, apartment_price, early_payment_price,
                                         state_line, delivery_standard_name, fund_groups_sell_code,
                                         payload, fetched_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
           ON CONFLICT (source_id, snapshot_id) DO NOTHING`,
          [
            row.source_id, row.snapshot_id, row.project_id, row.project_type, row.state,
            row.product_code, row.row_code, row.subdivision_name, row.apartment_type_name,
            row.land_area, row.construction_area, row.base_direction_name,
            row.number_of_room, row.number_of_wc, row.apartment_price, row.early_payment_price,
            row.state_line, row.delivery_standard_name, row.fund_groups_sell_code,
            JSON.stringify(row.payload), row.fetched_at,
          ],
        );
        // 2610-10 vòng 2: chỉ tính dòng THẬT SỰ ghi — nạp lại cùng snapshot
        // thì log báo 0 dòng mới (rowCount 0 khi ON CONFLICT DO NOTHING trúng).
        if (ins.rowCount === 1) s08++;
      } else if (it.source === "osm-boundaries") {
        await client.query(
          `INSERT INTO stg_osm_boundaries (osm_id, snapshot_id, name, payload)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (osm_id, snapshot_id) DO NOTHING`,
          [it.sourceId, manifest.snapshotId, it.meta?.name ?? null, JSON.stringify(it.payload)],
        );
        osm++;
      }
    }
    await client.query("COMMIT");
    console.log(
      `đã nạp: ${listings} listings (+${nights} đêm), ${discovery} discovery refs, ${osm} osm boundaries, ${zalo} zalo posts (${zaloMedia} có media_files), ${s08} S08 căn (+${s08Detail} detail, +${s08Catalog} catalog bỏ), ${hoSo} hồ sơ S03${hoSoBo ? ` (+${hoSoBo} BỎ do CHUA-AP-080)` : ""}`
      + (coS10Item ? `, ${s10Dong} dòng S10, ${s10ProjectDong} dòng danh bạ dự án S10 (cây ${s10Cay}, bỏ ${s10ThieuLoc} dòng thiếu bộ lọc, ${s10Bo} khác, ${s10ProjectBo} thiếu project_id, ${s10Lech} lệch khuôn, trùng ${s10TrungLan})`
      + `\n  S10 đối soát: bóc ${s10Boc} tr.p_row → stg ${s10Dong} + trùng bỏ ${s10TrungLan} + lệch khuôn ${s10Lech} + thiếu bộ lọc ${s10ThieuLoc} (dòng)` : ""),
    );
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

// So realpath: launchd gọi qua symlink ~/dev/one-invest — so URL thô sẽ lệch và
// main() lặng lẽ không chạy (script daily còn `|| true` nên không ai thấy).
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
