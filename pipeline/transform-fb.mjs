// transform-fb.mjs — posts Facebook Groups (S05, tier P1) → sale_offers.
//
// Tái dùng parser nguồn chân lý duy nhất của transform-zalo (parsePost,
// matchPhuong, extractPhones) — không fork logic. Khác biệt duy nhất:
//   - nguồn lọc theo agent_id='apify-facebook' trong stg_zalo_posts
//   - phường match theo THÀNH PHỐ suy từ tên nhóm (nhóm FB mang chữ
//     "HÀ NỘI"/"TPHCM"…), nhóm mơ hồ thì thử cả hai
//   - offer_id băm 'S05|<post neo>' (khoá dính PL14) — không đụng khoá S03
// Kiến trúc: FB = tín hiệu riêng P1 như Zalo (tin môi giới, SĐT trong text).
import { realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { parsePost, matchPhuong } from "./transform-zalo.mjs";
import { auditRejected, loadStgPosts } from "./lib/test-posts.mjs";
import { docPhuongHopLe } from "./lib/osm.mjs";
import { CONFIDENCE } from "./lib/vocab.generated.mjs";
import { writeOffers } from "./lib/write-offers.mjs";
import { phatBieuPhongNgu } from "./lib/assert.mjs";
import { assignStickyIds } from "./lib/offer-key.mjs";

/** Nhóm Facebook "MUA BÁN…" mặc định là rao BÁN: môi giới không lặp chữ
 * "bán" trong body. Khi parser không thấy keyword, suy kind từ tín hiệu
 * thuê ("/tháng", "cho thuê gz") — không có thì sale nếu có giá. */
function inferKind(text, pr) {
  if (pr.kind) return pr.kind;
  const hasPrice = pr.priceVnd !== null || pr.pricePerm2Vnd !== null;
  if (!hasPrice) return null;
  if (/thuê|\/\s*th(áng)?\b|triệu\/th/i.test(text)) return "rent_lt";
  return "sale";
}

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const CITY_OF_GROUP = (name) => {
  const n = (name ?? "").toUpperCase();
  if (n.includes("HÀ NỘI") || n.includes("HA NOI")) return "vn-hanoi";
  if (
    n.includes("TPHCM") || n.includes("TP.HCM") || n.includes("HCM") ||
    n.includes("BÌNH THẠNH") || n.includes("SÀI GÒN") || n.includes("SAIGON")
  ) return "vn-hcmc";
  return null; // mơ hồ — thử cả hai
};

/**
 * Thân transform S05 — người gọi giữ transaction. Post thử bị gạt ở đầu đọc (lib/test-posts.mjs, PL2).
 * @param {import("pg").Client} client
 */
// `parse` chỉ để thước giả lập đổi rule parser (PL14 NL-AC-4); đường chạy thật luôn dùng parsePost.
export async function runTransformFb(client, { parse = parsePost } = {}) {
  const areas = await docPhuongHopLe(client, ["vn-hanoi", "vn-hcmc"]);
  const slugLists = new Map([
    ["vn-hanoi", areas.filter((a) => a.parent_id === "vn-hanoi").map((a) => [a.id.replace("vn-hanoi-", ""), a.name])],
    ["vn-hcmc", areas.filter((a) => a.parent_id === "vn-hcmc").map((a) => [a.id.replace("vn-hcmc-", ""), a.name])],
  ]);

  const { posts, rejected } = await loadStgPosts(client, "facebook");
  console.log(`FB posts: ${posts.length} (gạt ${rejected.total} post thử ${JSON.stringify(rejected.by_marker)})`);

  const parsed = [];
  let nFull = 0, nPartial = 0, nFail = 0;
  for (const p of posts) {
    const pr = parse(p.text);
    pr.kind = inferKind(p.text, pr);
    if (!pr.kind) { nFail++; continue; }
    const city = CITY_OF_GROUP(p.group_name);
    // phường: khớp trong thành phố của nhóm; nhóm mơ hồ → thử HN rồi HCMC
    const tryCities = city ? [city] : ["vn-hanoi", "vn-hcmc"];
    for (const c of tryCities) {
      const m = matchPhuong(p.text, slugLists.get(c) ?? []);
      if (m) { pr.phuong = m.slug; pr.city = c; break; }
    }
    if (!pr.pricePerm2Vnd && pr.priceVnd && pr.areaM2) {
      pr.pricePerm2Vnd = Math.round(pr.priceVnd / pr.areaM2);
    }
    const hasPrice = pr.priceVnd !== null || pr.pricePerm2Vnd !== null;
    pr.confidence =
      hasPrice && pr.areaM2 && pr.phuong ? CONFIDENCE.high : hasPrice ? CONFIDENCE.medium : CONFIDENCE.low;
    if (pr.confidence === CONFIDENCE.high) nFull++;
    else if (pr.confidence !== CONFIDENCE.low) nPartial++;
    parsed.push({ ...pr, post: p });
  }
  console.log(`parse: ${nFull} high, ${nPartial} medium, ${nFail} fail — coverage ${posts.length ? ((nFull / posts.length) * 100).toFixed(1) : 0}%`);

  // gom repost — cùng công thức zalo nhưng prefix S05; offer_id cấp theo khoá dính ở dưới
  const dedup = new Map();
  for (const pr of parsed) {
    if (pr.confidence === "low") continue;
    const key = createHash("sha256")
      .update(`S05|${pr.kind}|${pr.phuong ?? "?"}|${pr.priceVnd ?? pr.pricePerm2Vnd}|${pr.areaM2 ?? "?"}|${pr.bedrooms ?? "?"}`)
      .digest("hex").slice(0, 16);
    const offerId = `offer_${key}`;
    if (!dedup.has(offerId)) {
      dedup.set(offerId, {
        offerId, kind: pr.kind,
        areaId: pr.phuong ? `${pr.city ?? "vn-hanoi"}-${pr.phuong}` : null,
        priceVnd: pr.priceVnd, areaM2: pr.areaM2, pricePerm2: pr.pricePerm2Vnd,
        bedrooms: pr.bedrooms, phuongRaw: pr.phuong, confidence: pr.confidence,
        firstSeen: pr.post.posted_at, lastSeen: pr.post.posted_at, nReposts: 1,
        postIds: [pr.post.post_id], posts: [{ post_id: pr.post.post_id, posted_at: pr.post.posted_at }],
        phone: pr.phone, senderName: pr.post.sender_name, authorHash: pr.post.author_hash,
      });
    } else {
      const o = dedup.get(offerId);
      o.nReposts++;
      o.postIds.push(pr.post.post_id);
      o.posts.push({ post_id: pr.post.post_id, posted_at: pr.post.posted_at });
      if (new Date(pr.post.posted_at) < new Date(o.firstSeen)) o.firstSeen = pr.post.posted_at;
      if (new Date(pr.post.posted_at) > new Date(o.lastSeen)) o.lastSeen = pr.post.posted_at;
    }
  }
  console.log(`dedup: ${dedup.size} unique offers`);

  // Upsert + đối soát offer cũ (writeOffers, migration 039) thay cho DELETE toàn nguồn:
  // đề xuất enrich + thẻ duyệt sống qua lần nạp lại (_acceptance/enrich-hau-ky).
  const sellerAgg = new Map();
  const rows = [];
  // Khoá dính (PL14, migration 044): nhóm theo nội dung chỉ để gom repost; offer_id lấy theo post — nhóm thừa kế khoá
  // của tin có chung nhiều post nhất, nhóm mới băm 'S05|<post neo>'. Đổi giá/DT/PN/parser không đổi offer_id.
  const nhom = [...dedup.values()];
  const khoa = await assignStickyIds(client, "S05", nhom.map((o) => ({ posts: o.posts })));
  nhom.forEach((o, i) => { o.offerId = khoa[i].offer_id; o.osk = khoa[i].originating_system_key; });
  for (const o of nhom) {
    const phoneHash = o.phone
      ? createHash("sha256").update(o.phone).digest("hex").slice(0, 32)
      : null;
    rows.push({
      offer_id: o.offerId, originating_system_key: o.osk, area_id: o.areaId, kind: o.kind, price_vnd: o.priceVnd,
      area_m2: o.areaM2, price_perm2: o.pricePerm2, phuong_raw: o.phuongRaw,
      confidence: o.confidence, first_seen: o.firstSeen, last_seen: o.lastSeen,
      n_reposts: o.nReposts, post_ids: o.postIds, price_tier: "P1", seller_name: o.senderName,
      seller_phone: o.phone, seller_phone_hash: phoneHash, seller_ref: o.authorHash,
    });
    if (phoneHash) {
      const s = sellerAgg.get(phoneHash) ?? { n: 0, first: o.firstSeen, last: o.lastSeen };
      s.n++;
      sellerAgg.set(phoneHash, s);
    }
  }
  await auditRejected(client, "S05", rejected);
  // PL15: phòng ngủ đi qua phát biểu (mỗi post một), năm cột do bộ phân xử dựng — không ghi thẳng.
  const { reconcile } = await writeOffers(client, "S05", rows, { assertions: phatBieuPhongNgu("S05", nhom, "transform-fb@045") });
  console.log(`đối soát: ${JSON.stringify({ ...reconcile, pairs: undefined })}`);
  console.log(`S05 offers ghi: ${dedup.size} (SĐT: ${sellerAgg.size} người bán)`);
  return { offers: rows.length, rejected, reconcile };
}

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    try {
      await runTransformFb(client);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    }
  } finally {
    await client.end();
  }
}

const isMain =
  process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
