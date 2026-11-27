// transform-chotot.mjs — stg_chotot_ads → sale_offers (tầng P2, nguồn S06).
//
// Vải công khai: cấu trúc sẵn từ API (không parse text). Chỉ giữ offer có
// giá + diện tích (bỏ "Thỏa thuận" — vô dụng cho median). Phường match ưu
// tiên ward_name_v3 (tên phường mới 2025, khớp OSM đã migrate), fallback
// match tên từ subject như transform-zalo. Upsert KHÔNG xóa cũ — fabric
// tích luỹ theo thời gian phục vụ trend.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { mintOfferId } from "./lib/offer-key.mjs";
import { matchPhuong } from "./transform-zalo.mjs";
import { docBiDanhAnToan, docPhuongHopLe, docThiTruongCoXa } from "./lib/osm.mjs";
import { chuanTen } from "./lib/dvhc.mjs";
import { thiTruongCua } from "./lib/thi-truong.mjs";
import { ASSERTION_METHOD, CONFIDENCE, ENRICH_FIELD, EVIDENCE_TIER, KIND, PROPERTY_TYPE } from "./lib/vocab.generated.mjs";
import { kiemCatChuyen, resolveOffers, retractRule, subjectKey, writeAssertions } from "./lib/assert.mjs";
import { rutDuongCoSo } from "./lib/sdt-trong-chuoi.mjs";
import { docDacTrungS06 } from "./lib/dac-trung-s06.mjs";
import { ganSdtS06 } from "./gan-sdt-s06.mjs";
import { findSourceNames } from "./lib/mask-source-names.mjs";
import { docSourceNameEntries } from "./lib/source-name-entries.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const norm = (s) =>
  (s ?? "").normalize("NFC").toLowerCase().replace(/^(phường|xã|thị trấn|thị xã)\s+/i, "").trim();

/**
 * Phường của một tin S06: ward_name_v3 (chuẩn 2025) → ward_name → khớp chữ subject → bí danh xã cũ an toàn của ward_name
 * (PX1, cuối cùng: chỉ lấp tin mà các đường trước không gắn được, không đổi xã của tin đã gắn).
 * @param {{ ward_name_v3?: string|null, ward_name?: string|null, subject?: string|null, area_name?: string|null }} ad
 * @param {{ mk: string|null, wardMap?: Map<string,string>, biDanh?: Map<string,string>, slugList?: [string,string][] }} o
 * @returns {{ areaId: string|null, phuongRaw: string|null, cach: "v3"|"ward"|"chu"|"bi-danh"|null }}
 */
export function ganPhuongS06(ad, { mk, wardMap, biDanh, slugList }) {
  let areaId = wardMap?.get(norm(ad.ward_name_v3)) ?? null;
  if (areaId) return { areaId, phuongRaw: ad.ward_name_v3 ?? ad.ward_name ?? null, cach: "v3" };
  areaId = wardMap?.get(norm(ad.ward_name)) ?? null;
  if (areaId) return { areaId, phuongRaw: ad.ward_name_v3 ?? ad.ward_name ?? null, cach: "ward" };
  const m = matchPhuong(`${ad.subject ?? ""} ${ad.ward_name ?? ""} ${ad.area_name ?? ""}`, slugList ?? []);
  if (m) return { areaId: `${mk}-${m.slug}`, phuongRaw: m.name, cach: "chu" };
  areaId = ad.ward_name ? biDanh?.get(chuanTen(ad.ward_name)) ?? null : null;
  if (areaId) return { areaId, phuongRaw: ad.ward_name, cach: "bi-danh" };
  return { areaId: null, phuongRaw: null, cach: null };
}

// PL39: ô chữ của tin S06 lên cloud (CLOUD_ALLOW của sync-cloud) mà bộ dò tên nguồn trúng thì không ghi — cùng lõi khớp với
// bộ soát tầng A của sync-cloud (tier-a-guard → findSourceNames), sổ tên đọc bằng cùng hàm nạp. Hai trường đi qua phát biểu
// (đường, toà): không ghi phát biểu, rồi rút MỌI phát biểu sống của S06 ở hai trường ấy mà giá trị trúng (mọi phương pháp, kể cả
// legacy) với lý do `mang-ten-nguon`; bộ phân xử trả cột về phát biểu sạch còn lại hoặc NULL. Hai cột ghi thẳng (phường, quận):
// ghi NULL. Seller_name, seller_phone không ở đây — sync-cloud đã che khi gửi.
export const O_CHU_PHAT_BIEU = [ENRICH_FIELD.street_raw, ENRICH_FIELD.block_raw];
// Trần một lượt: sổ nguồn có token chung chung thì bộ dò trúng hàng loạt — dừng job (đỏ, có tên) thay vì NULL lặng lẽ.
// PL41: trần đếm cái lượt THẬT SỰ đổi — phát biểu sống trúng (lượt sẽ rút) cộng giá trị trúng ở tin MỚI (chưa có bản ghi tin,
// lượt sẽ bỏ ghi lần đầu). Giá trị trúng còn nằm trong stg của tin đã có (các đêm trước đã bỏ ghi) không đếm lại: stg giữ mọi
// tin từng thu, đếm trên cả stg thì trần thành cộng dồn và transform dừng mọi đêm khi tích đủ 51 (S4 r2 PL39, finding t3).
// 25/11 trên DB máy thu: 1 ô.
export const TRAN_TEN_NGUON = 50;

/** Ném khi số ô bỏ ghi hay phát biểu rút của lượt vượt trần. `n`: số đếm, `cai`: tên phép đếm cho thông điệp. */
export function kiemTranTenNguon(n, cai) {
  if (n > TRAN_TEN_NGUON) {
    throw new Error(`PL39: ${n} ${cai} mang tên nguồn trong một lượt, vượt trần ${TRAN_TEN_NGUON} — dừng, không rút, không ghi; soát sổ nguồn (source_registry) trước khi chạy lại`);
  }
}

/**
 * PL41: đếm ô chữ mang tên nguồn của một lượt — hàm thuần, transform gọi trước mọi lần ghi.
 * @param {Array<{ khoa: string, o: Array<[string, unknown]> }>} tin mỗi tin: khoá gốc + các cặp [cột, giá trị] sẽ ghi
 * @param {{ tinCu: Set<string>, nPhatBieuSong: number, entries: object[] }} ngu tinCu = khoá gốc đã có bản ghi tin
 * @returns {{ boTen: Record<string, number>, trungMoi: number, tran: number }} boTen đếm MỌI giá trị trúng (log);
 *   trungMoi chỉ giá trị trúng của tin chưa có bản ghi; tran = trungMoi + phát biểu sống trúng — số đem so trần.
 */
export function demTenNguonLuot(tin, { tinCu, nPhatBieuSong, entries }) {
  const boTen = { street_raw: 0, block_raw: 0, phuong_raw: 0, district_raw: 0 };
  let trungMoi = 0;
  for (const { khoa, o } of tin) {
    const moi = !tinCu.has(khoa);
    for (const [cot, v] of o) {
      if (!mangTenNguon(v, entries)) continue;
      boTen[cot]++;
      if (moi) trungMoi++;
    }
  }
  return { boTen, trungMoi, tran: trungMoi + nPhatBieuSong };
}

/** Phát biểu sống của S06 ở đường, toà mà giá trị mang tên nguồn: [{ id, subject_key }]. Chỉ đọc. */
export async function docPhatBieuTenNguonS06(client, entries) {
  if (!entries.length) return [];
  const { rows } = await client.query(
    `SELECT id, subject_key, value FROM field_assertions
      WHERE retracted_at IS NULL AND field = ANY($1::text[]) AND subject_key LIKE 'S06:%'`, [O_CHU_PHAT_BIEU]);
  return rows.filter((r) => mangTenNguon(r.value, entries)).map(({ id, subject_key }) => ({ id, subject_key }));
}

/** Rút các phát biểu đã đọc ở `docPhatBieuTenNguonS06` (lý do `mang-ten-nguon`). Trả các chủ thể (để phân xử lại). */
export async function rutPhatBieuTenNguon(client, trung) {
  if (!trung.length) return [];
  await client.query(
    `UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'mang-ten-nguon'
      WHERE retracted_at IS NULL AND id = ANY($1::bigint[])`, [trung.map((r) => r.id)]);
  return [...new Set(trung.map((r) => r.subject_key))];
}

/** Chữ mang tên nguồn thật theo sổ `entries`. Sổ rỗng → false: không lọc (sync-cloud vẫn đóng chặt khi gửi). */
export function mangTenNguon(v, entries) {
  return typeof v === "string" && v !== "" && entries.length > 0 && findSourceNames(v, entries).length > 0;
}

/**
 * Thân transform S06 — main chạy không bọc transaction như trước; test và phép đo (thước nap-lai-ba-luot) bọc BEGIN…ROLLBACK.
 * @param {import("pg").Client} client
 */
export async function runTransformChotot(client) {
  await kiemCatChuyen(client);   // PL15: chưa cắt chuyển thì dừng trước mọi lần ghi (job đỏ có tên, không mất ô)
  // Phường hợp lệ của MỌI thị trường có phường (OSM đã migrate sáp nhập 2025) — bộ đọc chung với S03, bỏ khu vực lạc;
  // city_code của tin đi qua MỘT chỗ ánh xạ (lib/thi-truong.mjs: tỉnh cũ đã sáp nhập → thị trường mới).
  // PX1: thị trường có khu vực khớp tên được (phường OSM hoặc xã danh bạ 084); chưa áp 084 thì như cũ.
  const markets = await docThiTruongCoXa(client);
  const areas = await docPhuongHopLe(client, markets);
  const biDanhCua = await docBiDanhAnToan(client, markets);
  const byCity = new Map(markets.map((m) => [m, new Map(areas.filter((a) => a.parent_id === m).map((a) => [norm(a.name), a.id]))]));
  const slugLists = new Map(markets.map((m) => [m, areas.filter((a) => a.parent_id === m).map((a) => [a.id.slice(m.length + 1), a.name])]));
  const { rows: mkRows } = await client.query(`SELECT id FROM areas WHERE region_type = 'market'`);
  const thiTruongCo = new Set(mkRows.map((r) => r.id));
  const maLa = new Map();

  const { rows: ads } = await client.query(
    `SELECT * FROM stg_chotot_ads WHERE price > 0 AND size_m2 > 0`,
  );
  console.log(`stg có giá+DT: ${ads.length}`);
  const tenNguon = await docSourceNameEntries(client);
  if (!tenNguon.length) console.log("sổ nguồn rỗng — không lọc ô chữ mang tên nguồn (sync-cloud vẫn chặn khi gửi)");
  // PL39: đếm trước khi ghi dòng nào — vượt trần thì job dừng ở đây, chưa upsert tin, chưa ghi hay rút phát biểu.
  const tinhSan = new Map();
  // PL41: tin đã có bản ghi (khoá gốc S06) — giá trị trúng của chúng đã được các lượt trước xử, không vào trần.
  const { rows: daCo } = await client.query(
    `SELECT originating_system_key AS k FROM sale_offer_records WHERE source = 'S06' AND originating_system_key IS NOT NULL`);
  const tinCu = new Set(daCo.map((r) => r.k));
  const cacO = [];
  for (const ad of ads) {
    if (ad.ad_type !== "s" && ad.ad_type !== "u") continue;
    const mk = thiTruongCua(ad.city_code, thiTruongCo);
    const g = ganPhuongS06(ad, { mk, wardMap: byCity.get(mk), biDanh: biDanhCua.get(mk), slugList: slugLists.get(mk) });
    const dacTrung = docDacTrungS06(ad);
    cacO.push({ khoa: String(ad.list_id), o: [["phuong_raw", g.phuongRaw], ["district_raw", ad.area_name],
      ...dacTrung.filter((d) => O_CHU_PHAT_BIEU.includes(d.field)).map((d) => [d.field, d.value])] });
    tinhSan.set(ad, { mk, g, dacTrung });
  }
  const phatBieuTenNguon = await docPhatBieuTenNguonS06(client, tenNguon);
  const demLuot = demTenNguonLuot(cacO, { tinCu, nPhatBieuSong: phatBieuTenNguon.length, entries: tenNguon });
  const boTen = demLuot.boTen;
  kiemTranTenNguon(demLuot.tran, "ô chữ mới (tin mới + phát biểu sống)");

  let nHigh = 0, nMed = 0, nSkip = 0, nWardV3 = 0, nWardTxt = 0, nBiDanh = 0;
  // PL15: loại hình (category) và phòng ngủ (rooms) là trường có cấu trúc của nguồn → phát biểu lớp sự thật; năm cột
  // do bộ phân xử dựng cuối lượt, không ghi thẳng.
  const phatBieu = [];
  const offerIds = [];
  const khongDuong = [];
  for (const ad of ads) {
    const kind = ad.ad_type === "s" ? KIND.sale : ad.ad_type === "u" ? KIND.rent_lt : null;
    // G-1: property_type theo category Chợ Tốt (migration 025, ADR-0011)
    const PT = {
      1010: PROPERTY_TYPE.apartment, 1020: PROPERTY_TYPE.house, 1030: PROPERTY_TYPE.commercial,
      1040: PROPERTY_TYPE.land, 1050: PROPERTY_TYPE.room,
    };
    const propertyType = PT[ad.category] ?? null;
    if (!kind) { nSkip++; continue; }

    // Phường: ward_name_v3 (chuẩn 2025) → ward_name → text-match subject
    const { mk, g, dacTrung } = tinhSan.get(ad);
    if (!mk) maLa.set(ad.city_code ?? "(rỗng)", (maLa.get(ad.city_code ?? "(rỗng)") ?? 0) + 1);
    const areaId = g.areaId;
    const phuongRaw = mangTenNguon(g.phuongRaw, tenNguon) ? null : g.phuongRaw;
    const districtRaw = mangTenNguon(ad.area_name, tenNguon) ? null : ad.area_name;
    if (g.cach === "v3") nWardV3++;
    if (g.cach === "chu") nWardTxt++;
    if (g.cach === "bi-danh") nBiDanh++;

    const confidence = areaId ? CONFIDENCE.high : CONFIDENCE.medium;
    if (confidence === CONFIDENCE.high) nHigh++; else nMed++;

    const payload = ad.payload ?? {};
    const pricePerm2 = payload.price_million_per_m2
      ? Math.round(payload.price_million_per_m2 * 1e6)
      : Math.round(Number(ad.price) / Number(ad.size_m2));
    // Khoá gốc S06 = list_id (RESO OriginatingSystemKey); offer_id = mintOfferId — cùng công thức trước PL14.
    const osk = String(ad.list_id);
    const offerId = mintOfferId("S06", osk);
    const seller = ad.seller ?? {};
    const seen = ad.list_time ?? ad.captured_at;

    await client.query(
      `INSERT INTO sale_offer_records (offer_id, area_id, kind, price_vnd, area_m2, price_perm2,
                                 phuong_raw, confidence, first_seen, last_seen, n_reposts, post_ids, source,
                                 price_tier, district_raw, seller_name, seller_ref, originating_system_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,1,ARRAY[]::text[],'S06','P2',$10,$11,$12,$13)
       ON CONFLICT (offer_id) DO UPDATE SET
         last_seen = EXCLUDED.last_seen, price_vnd = EXCLUDED.price_vnd,
         price_perm2 = EXCLUDED.price_perm2, confidence = EXCLUDED.confidence,
         area_id = COALESCE(EXCLUDED.area_id, sale_offer_records.area_id),
         phuong_raw = COALESCE(EXCLUDED.phuong_raw, sale_offer_records.phuong_raw),
         originating_system_key = EXCLUDED.originating_system_key`,
      [
        offerId, areaId, kind, Number(ad.price), Number(ad.size_m2), pricePerm2,
        phuongRaw, confidence, seen,
        districtRaw, seller.full_name ?? null,
        payload.account_id ? `ct:${payload.account_id}` : null, osk,
      ],
    );
    offerIds.push(offerId);
    const chung = { subject_key: subjectKey("S06", osk), evidence_tier: EVIDENCE_TIER.fact,
      method: ASSERTION_METHOD.source_field, method_version: "transform-chotot@045", observed_at: seen };
    if (propertyType) phatBieu.push({ ...chung, field: ENRICH_FIELD.property_type, value: propertyType, rule_id: `category:${ad.category}` });
    if (Number.isInteger(Number(ad.rooms)) && Number(ad.rooms) > 0) {
      phatBieu.push({ ...chung, field: ENRICH_FIELD.bedrooms, value: String(Number(ad.rooms)), rule_id: "rooms" });
    }
    // HD5 (061): đặc trưng nhà — số nhà, mã căn, mặt tiền, ngang × dài, số tầng, WC, toạ độ; rule_id = khoá nguồn đã đọc.
    for (const d of dacTrung) {
      if (O_CHU_PHAT_BIEU.includes(d.field) && mangTenNguon(d.value, tenNguon)) continue; // PL39: đã đếm ở lượt đếm trước
      phatBieu.push({ ...chung, ...d });
    }
    if (!dacTrung.some((d) => d.field === ENRICH_FIELD.street_raw)) khongDuong.push(chung.subject_key);
  }
  const ghi = await writeAssertions(client, phatBieu, { replaceOwn: true });
  // Phát biểu đường mang số điện thoại, kể cả `legacy`, thì rút rồi phân xử lại, kể cả tin ngoài lượt này. Đứng trước bước dưới để lý do rút đúng là `chua-sdt`.
  const coSo = await rutDuongCoSo(client);
  if (coSo.length) console.log(`đường mang số: rút ${coSo.length} phát biểu`);
  // DS1: nguồn bỏ trống đường thì rút phát biểu của transform; bộ phân xử trả cột về `legacy` hoặc NULL.
  await retractRule(client, khongDuong, ENRICH_FIELD.street_raw, "payload.street_name", "nguon-bo-trong");
  // PL39: giá trị mang tên nguồn không thành phát biểu; mọi phát biểu sống trúng (cả tin ngoài lượt, cả legacy) rút, rồi phân xử lại.
  const rutTenNguon = await rutPhatBieuTenNguon(client, phatBieuTenNguon);
  for (const k of rutTenNguon) offerIds.push(mintOfferId("S06", k.slice("S06:".length)));
  console.log(`ô chữ mang tên nguồn: bỏ ghi ${Object.entries(boTen).map(([c, n]) => `${c} ${n}`).join(" · ")} · rút ${rutTenNguon.length} chủ thể (trần ${TRAN_TEN_NGUON})`);
  for (const k of coSo) offerIds.push(mintOfferId("S06", k.slice("S06:".length)));
  const pxu = offerIds.length ? await resolveOffers(client, [...new Set(offerIds)]) : { offers: 0, offers_changed: 0 };
  console.log(`phát biểu S06: +${ghi.inserted} (rút ${ghi.retracted}) · phân xử ${pxu.offers} tin, đổi ${pxu.offers_changed}`);
  // SĐT đi sau phân xử: câu upsert phía trên không đụng cột số, nên chạy lại không mất số đã ghi.
  const sdt = await ganSdtS06(client);
  if (!sdt.bo_qua) {
    console.log(`SĐT S06: đổi ${sdt.doi} tin (trực tiếp ${sdt.truc_tiep}, ghép ${sdt.ghep}, rút ${sdt.rut}) · khôi phục ${sdt.khoi_phuc} · không rõ gốc ${sdt.khong_ro} · tài khoản từ 2 số ${sdt.tai_khoan_hai_so} · số sai dạng ${sdt.sai_e164}`);
  }
  console.log(
    `P2 offers: ${nHigh} high / ${nMed} medium / ${nSkip} skip — ` +
    `phường: ${nWardV3} ward_v3 + ${nWardTxt} text-match + ${nBiDanh} bí danh xã cũ` +
    `${nHigh + nMed > 0 ? ` (match ${(((nWardV3 + nWardTxt) / (nHigh + nMed)) * 100).toFixed(1)}%)` : ""}`,
  );
  for (const [ma, n] of maLa) console.log(`city_code lạ: ${ma} (${n} tin) — không ánh xạ được thị trường, area_id NULL`);
  return {
    high: nHigh, medium: nMed, skip: nSkip, wardV3: nWardV3, wardText: nWardTxt, biDanh: nBiDanh, maLa: Object.fromEntries(maLa), sdt,
    inserted: ghi.inserted, retracted: ghi.retracted, offersChanged: pxu.offers_changed, boTenNguon: boTen, rutTenNguon: rutTenNguon.length,
  };
}

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    // Giữ như trước khi tách hàm: mỗi câu upsert tự commit (không bọc transaction)
    await runTransformChotot(client);
  } finally {
    await client.end();
  }
}

const isMain =
  process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
