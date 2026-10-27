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
import { docPhuongHopLe } from "./lib/osm.mjs";
import { ASSERTION_METHOD, CONFIDENCE, ENRICH_FIELD, EVIDENCE_TIER, KIND, PROPERTY_TYPE } from "./lib/vocab.generated.mjs";
import { kiemCatChuyen, resolveOffers, subjectKey, writeAssertions } from "./lib/assert.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const norm = (s) =>
  (s ?? "").normalize("NFC").toLowerCase().replace(/^(phường|xã|thị trấn|thị xã)\s+/i, "").trim();

/**
 * Thân transform S06 — main chạy không bọc transaction như trước; test và phép đo (thước nap-lai-ba-luot) bọc BEGIN…ROLLBACK.
 * @param {import("pg").Client} client
 */
export async function runTransformChotot(client) {
  await kiemCatChuyen(client);   // PL15: chưa cắt chuyển thì dừng trước mọi lần ghi (job đỏ có tên, không mất ô)
  // Phường hợp lệ theo thành phố (OSM đã migrate sáp nhập 2025) — bộ đọc chung, bỏ khu vực lạc
  const areas = await docPhuongHopLe(client, ["vn-hanoi", "vn-hcmc"]);
  const byCity = new Map([
    ["vn-hanoi", new Map(areas.filter((a) => a.parent_id === "vn-hanoi").map((a) => [norm(a.name), a.id]))],
    ["vn-hcmc", new Map(areas.filter((a) => a.parent_id === "vn-hcmc").map((a) => [norm(a.name), a.id]))],
  ]);
  const slugLists = new Map([
    ["vn-hanoi", areas.filter((a) => a.parent_id === "vn-hanoi").map((a) => [a.id.replace("vn-hanoi-", ""), a.name])],
    ["vn-hcmc", areas.filter((a) => a.parent_id === "vn-hcmc").map((a) => [a.id.replace("vn-hcmc-", ""), a.name])],
  ]);

  const { rows: ads } = await client.query(
    `SELECT * FROM stg_chotot_ads WHERE price > 0 AND size_m2 > 0`,
  );
  console.log(`stg có giá+DT: ${ads.length}`);

  let nHigh = 0, nMed = 0, nSkip = 0, nWardV3 = 0, nWardTxt = 0;
  // PL15: loại hình (category) và phòng ngủ (rooms) là trường có cấu trúc của nguồn → phát biểu lớp sự thật; năm cột
  // do bộ phân xử dựng cuối lượt, không ghi thẳng.
  const phatBieu = [];
  const offerIds = [];
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
    const wardMap = byCity.get(ad.city_code);
    let areaId = wardMap?.get(norm(ad.ward_name_v3)) ?? null;
    if (areaId) nWardV3++;
    if (!areaId) {
      areaId = wardMap?.get(norm(ad.ward_name)) ?? null;
    }
    let phuongRaw = areaId ? ad.ward_name_v3 ?? ad.ward_name : null;
    if (!areaId) {
      const m = matchPhuong(`${ad.subject ?? ""} ${ad.ward_name ?? ""} ${ad.area_name ?? ""}`, slugLists.get(ad.city_code) ?? []);
      if (m) {
        areaId = `${ad.city_code}-${m.slug}`;
        phuongRaw = m.name;
        nWardTxt++;
      }
    }

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
        ad.area_name, seller.full_name ?? null,
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
  }
  const ghi = await writeAssertions(client, phatBieu, { replaceOwn: true });
  const pxu = offerIds.length ? await resolveOffers(client, offerIds) : { offers: 0, offers_changed: 0 };
  console.log(`phát biểu S06: +${ghi.inserted} (rút ${ghi.retracted}) · phân xử ${pxu.offers} tin, đổi ${pxu.offers_changed}`);
  console.log(
    `P2 offers: ${nHigh} high / ${nMed} medium / ${nSkip} skip — ` +
    `phường: ${nWardV3} ward_v3 + ${nWardTxt} text-match` +
    `${nHigh + nMed > 0 ? ` (match ${(((nWardV3 + nWardTxt) / (nHigh + nMed)) * 100).toFixed(1)}%)` : ""}`,
  );
  return { high: nHigh, medium: nMed, skip: nSkip, wardV3: nWardV3, wardText: nWardTxt };
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
