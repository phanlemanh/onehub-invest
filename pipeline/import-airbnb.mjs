// import-airbnb.mjs — nạp snapshot từ one-invest-collector theo DATA-CONTRACT
import { dongDuAnS08, CAU_CHEN_S08_PROJECT } from "./lib/s08-du-an.mjs"; // DA30 1211-35
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
]);
export function isAllowedSource(source) {
  return AIRBNB_IMPORTER_SOURCES.has(String(source));
}

// v5 (claudedp-0211-1 hợp đồng người bán): RawItem.seller chỉ THÊM key tùy chọn,
// đọc items y như cũ — cùng mảng với import-chotot.mjs, test đối chiếu hai bản.
// Export để test; mọi lần nới phải cập nhật DATA-CONTRACT «bên import phải chấp nhận».
// link-nguoi-ban-s03 (v7): nguồn s03-ho-so + kind ho-so — {6,7} S03 bất kể
// thứ tự gộp với nhánh album (v6); bên import chấp nhận {1..7}
export const SUPPORTED_SCHEMA_VERSIONS = [1, 2, 3, 4, 5, 6, 7];
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
  try {
    await client.query("BEGIN");
    // 0711-37(d): snapshot HỒ SƠ KHÔNG được đánh dấu đã-nạp khi DB thiếu 080 —
    // INSERT vào bảng snapshot đĩa chỉ cho các nguồn khác; nếu hồ sơ bỏ hết,
    // rollback và thoát 0 (AC-6), để sau khi áp 080 lượt nạp lại được đủ.
    const coS08DanhMuc = items.some((it) => it.source === "s08-danh-muc");
    const coBang094 = coS08DanhMuc ? await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'stg_s08_project'`).then((r) => (r.rowCount ?? 0) >= 1).catch(() => false) : false;
    let s08ProjectDong = 0;
    const boHetHoSo = items.length > 0 && items.every((it) => it.source === "s03-ho-so");
    // 1211-35 MỞ LẠI(2): thiếu 094 → ROLLBACK CẢ LƯỢT mọi snapshot CÓ item project_catalog (giống hồ sơ S03)
    // — giữ phần dự án không mất khi chỉ lẫn căn; áp 094 rồi nạp lại được đủ.
    const coCatalogS08 = items.some((it) => it.source === "s08-danh-muc" && it.kind === "project_catalog");
    const boHetS08 = coCatalogS08 && !coBang094;
    if (!(!coBang && boHetHoSo) && !boHetS08) {
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
    for (const it of items) {
      if (it.source === "s03-ho-so") {
        if (coBang) { await napHoSo(client, it); hoSo++; }
        else { hoSoBo++; }
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
        // 1211-35 DA30: item project_catalog GOM vào stg_s08_project (không bỏ nữa) —
        // dongDuAnS08 xử lý trọn snapshot sau vòng (catalog + detail theo mã dự án)
        if (it.kind === "project_catalog" || it.meta?.state === "catalog") {
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
    // 1211-35 DA30: dòng stg_s08_project từ item project_catalog + inventory_unit/detail (bỏ đếm-bỏ cũ)
    if (coS08DanhMuc && coBang094) {
      const itemsS08 = items.filter((it) => it.source === "s08-danh-muc");
      const cacDong = dongDuAnS08(itemsS08, manifest.snapshotId);
      for (const dong of cacDong) {
        const r = await client.query(CAU_CHEN_S08_PROJECT, [
          dong.snapshot_id, dong.project_id,
          dong.catalog_payload == null ? null : JSON.stringify(dong.catalog_payload),
          dong.detail_payload == null ? null : JSON.stringify(dong.detail_payload),
          dong.fetched_at,
        ]);
        s08ProjectDong += r.rowCount ?? 0;
      }
      console.log(`S08 danh mục: ${cacDong.length} dự án (stg_s08_project ghi ${s08ProjectDong})`);
    } else if (coS08DanhMuc && !coBang094) {
      console.log("CHUA-AP-094: bảng stg_s08_project chưa có (migration 094 chưa áp) — phần dự án S08 bỏ");
      await client.query("ROLLBACK").catch(() => {});
      console.log("snapshot CÓ item project_catalog — KHÔNG đánh dấu đã nạp (áp 094 rồi nạp lại được đủ — 1211-35 MỞ LẠI(2))");
      return; // thoát 0 — AC-6: rollback cả lượt kể cả khi snapshot lẫn căn
    }
    await client.query("COMMIT");
    console.log(
      `đã nạp: ${listings} listings (+${nights} đêm), ${discovery} discovery refs, ${osm} osm boundaries, ${zalo} zalo posts (${zaloMedia} có media_files), ${s08} S08 căn (+${s08Detail} detail, ${s08Catalog} catalog gom stg_s08_project), ${hoSo} hồ sơ S03${hoSoBo ? ` (+${hoSoBo} BỎ do CHUA-AP-080)` : ""}`,
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
