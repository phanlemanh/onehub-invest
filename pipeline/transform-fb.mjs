// transform-fb.mjs — posts Facebook Groups (S05, tier P1) → sale_offers.
//
// Tái dùng parser nguồn chân lý duy nhất của transform-zalo (parsePost,
// matchPhuong, extractPhones) — không fork logic. Khác biệt duy nhất:
//   - nguồn lọc theo agent_id='apify-facebook' trong stg_zalo_posts
//   - phường match theo THÀNH PHỐ suy từ tên nhóm (nhóm FB mang chữ
//     "HÀ NỘI"/"TPHCM"…), nhóm mơ hồ thì thử cả hai
//   - offer_id hash có prefix S05 để không đụng dedup key của S03
// Kiến trúc: FB = tín hiệu riêng P1 như Zalo (tin môi giới, SĐT trong text).
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { parsePost, matchPhuong } from "./transform-zalo.mjs";
import { writeOffers } from "./lib/write-offers.mjs";

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

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    const { rows: areas } = await client.query(
      `SELECT id, name, parent_id FROM areas WHERE region_type = 'submarket'
         AND parent_id IN ('vn-hanoi', 'vn-hcmc')`,
    );
    const slugLists = new Map([
      ["vn-hanoi", areas.filter((a) => a.parent_id === "vn-hanoi").map((a) => [a.id.replace("vn-hanoi-", ""), a.name])],
      ["vn-hcmc", areas.filter((a) => a.parent_id === "vn-hcmc").map((a) => [a.id.replace("vn-hcmc-", ""), a.name])],
    ]);

    const { rows: posts } = await client.query(
      `SELECT DISTINCT ON (post_id) post_id, text, posted_at, group_name, author_hash, sender_name
       FROM stg_zalo_posts
       WHERE agent_id = 'apify-facebook'
       ORDER BY post_id, captured_at DESC`,
    );
    console.log(`FB posts: ${posts.length}`);

    const parsed = [];
    let nFull = 0, nPartial = 0, nFail = 0;
    for (const p of posts) {
      const pr = parsePost(p.text);
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
        hasPrice && pr.areaM2 && pr.phuong ? "high" : hasPrice ? "medium" : "low";
      if (pr.confidence === "high") nFull++;
      else if (pr.confidence !== "low") nPartial++;
      parsed.push({ ...pr, post: p });
    }
    console.log(`parse: ${nFull} high, ${nPartial} medium, ${nFail} fail — coverage ${posts.length ? ((nFull / posts.length) * 100).toFixed(1) : 0}%`);

    // dedup — cùng công thức zalo nhưng prefix S05 (không đụng offer S03)
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
          postIds: [pr.post.post_id],
          phone: pr.phone, senderName: pr.post.sender_name, authorHash: pr.post.author_hash,
        });
      } else {
        const o = dedup.get(offerId);
        o.nReposts++;
        o.postIds.push(pr.post.post_id);
        if (new Date(pr.post.posted_at) < new Date(o.firstSeen)) o.firstSeen = pr.post.posted_at;
        if (new Date(pr.post.posted_at) > new Date(o.lastSeen)) o.lastSeen = pr.post.posted_at;
      }
    }
    console.log(`dedup: ${dedup.size} unique offers`);

    // Upsert + đối soát offer cũ (writeOffers, migration 039) thay cho DELETE toàn nguồn:
    // đề xuất enrich + thẻ duyệt sống qua lần nạp lại (_acceptance/enrich-hau-ky).
    const sellerAgg = new Map();
    const rows = [];
    for (const o of dedup.values()) {
      const phoneHash = o.phone
        ? createHash("sha256").update(o.phone).digest("hex").slice(0, 32)
        : null;
      rows.push({
        offer_id: o.offerId, area_id: o.areaId, kind: o.kind, price_vnd: o.priceVnd,
        area_m2: o.areaM2, price_perm2: o.pricePerm2, bedrooms: o.bedrooms, phuong_raw: o.phuongRaw,
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
    await client.query("BEGIN");
    try {
      const { reconcile } = await writeOffers(client, "S05", rows);
      await client.query("COMMIT");
      console.log(`đối soát: ${JSON.stringify({ ...reconcile, pairs: undefined })}`);
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    }
    console.log(`S05 offers ghi: ${dedup.size} (SĐT: ${sellerAgg.size} người bán)`);

    } finally {
    await client.end();
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
