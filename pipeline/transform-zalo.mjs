// transform-zalo.mjs — parse tin rao VN + dedup + canonical offers (G1).
// Pipeline 5 bước: clean → parse regex → confidence → dedup → offers.
// Parser đo coverage: % tin có đủ (giá + diện tích + phường) cho confidence=high.
// Export parsePost/matchPhuong cho bench-extraction dùng chung (C2) — nguồn
// chân lý của parser là một, bench và transform không được fork logic.
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const stripPrefix = (s) => s.replace(/^(Quận|Huyện|Phường|Thị xã|Thị trấn|Xã)\s+/, "");

// ---- Bước 2: parse ----
export function parsePost(text) {
  const out = { kind: null, priceVnd: null, pricePerm2Vnd: null, areaM2: null, bedrooms: null, phuong: null };

  // loại tin: bán vs thuê
  if (/cho thuê|thuê dài hạn|cần cho thuê|thuê dài hạn/i.test(text)) out.kind = "rent_lt";
  else if (/bán|chính chủ bán|cần tiền bán|bán gấp/i.test(text)) out.kind = "sale";
  else return out;

  // giá: "45tr/m2", "3.2 tỷ", "2tỷ", "15tr/tháng", "12 triệu/th"
  const perm2 = text.match(/([\d.,]+)\s*(?:tr|triệu)\/m[²2]/i);
  if (perm2) out.pricePerm2Vnd = Math.round(parseFloat(perm2[1].replace(/\./g, "")) * 1e6);

  const ty = text.match(/([\d.,]+)\s*t(?:ỷ|y|\b)/i);
  if (ty) out.priceVnd = Math.round(parseFloat(ty[1].replace(/\./g, "")) * 1e9);

  if (!out.priceVnd && !out.pricePerm2Vnd) {
    const trieu = text.match(/([\d.,]+)\s*(?:tr|triệu)(?!\/m)(?:\s*\/\s*th(?:áng)?)?/i);
    if (trieu) out.priceVnd = Math.round(parseFloat(trieu[1].replace(/\./g, "")) * 1e6);
  }

  // diện tích: "65m2", "65m²", "DT 45m"
  const area = text.match(/(\d+(?:\.\d+)?)\s*m[²2]/i);
  if (area) out.areaM2 = parseFloat(area[1]);

  // bedrooms: "2PN", "2 phòng ngủ", "2BR"
  const bd = text.match(/(\d+)\s*(?:PN|phòng ngủ|BR)/i);
  if (bd) out.bedrooms = parseInt(bd[1]);

  // phường: match tên phường từ text (danh sách sẽ load từ DB)
  out._phuongCandidates = [];
  return out;
}

/** Match phường: tên phường xuất hiện trong text. */
export function matchPhuong(text, phuongSlugs) {
  const textLower = text.toLowerCase();
  for (const [slug, name] of phuongSlugs) {
    if (textLower.includes(name.toLowerCase()) || textLower.includes(slug.replace(/-/g, " "))) {
      return { slug, name };
    }
  }
  return null;
}

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    // Load phường list (tên + area_id)
    const { rows: areas } = await client.query(
      `SELECT id, name FROM areas WHERE parent_id = 'vn-hanoi' AND region_type = 'submarket'`,
    );
    const phuongSlugs = areas.map((a) => [a.id.replace("vn-hanoi-", ""), a.name]);
    const areaBySlug = new Map(areas.map((a) => [a.id.replace("vn-hanoi-", ""), a.id]));

    // Load staging posts (mới nhất per post_id)
    const { rows: posts } = await client.query(
      `SELECT DISTINCT ON (post_id) post_id, text, posted_at, group_name, author_hash
       FROM stg_zalo_posts ORDER BY post_id, captured_at DESC`,
    );
    console.log(`posts: ${posts.length}`);

    // ---- Bước 2+3: parse + confidence ----
    const parsed = [];
    let nFull = 0, nPartial = 0, nFail = 0;
    for (const p of posts) {
      const pr = parsePost(p.text);
      if (!pr.kind) { nFail++; continue; }
      const ph = matchPhuong(p.text, phuongSlugs);
      if (ph) pr.phuong = ph.slug;
      // tính price_perm2 nếu thiếu
      if (!pr.pricePerm2Vnd && pr.priceVnd && pr.areaM2) {
        pr.pricePerm2Vnd = Math.round(pr.priceVnd / pr.areaM2);
      }
      const hasPrice = pr.priceVnd !== null || pr.pricePerm2Vnd !== null;
      const hasArea = pr.areaM2 !== null;
      const hasPhuong = pr.phuong !== null;
      pr.confidence = hasPrice && hasArea && hasPhuong ? "high" : hasPrice ? "medium" : "low";
      if (pr.confidence === "high") nFull++;
      else if (pr.confidence !== "low") nPartial++;
      else if (hasPrice) nPartial++;
      parsed.push({ ...pr, post: p });
    }
    console.log(`parse: ${nFull} high, ${nPartial} medium, ${nFail} fail — coverage ${(nFull / posts.length * 100).toFixed(1)}%`);

    // ---- Bước 4: dedup — hash(kind + phường + price + area + bedrooms) ----
    const dedup = new Map();
    for (const pr of parsed) {
      if (pr.confidence === "low") continue;
      const key = createHash("sha256")
        .update(`${pr.kind}|${pr.phuong ?? "?"}|${pr.priceVnd ?? pr.pricePerm2Vnd}|${pr.areaM2 ?? "?"}|${pr.bedrooms ?? "?"}`)
        .digest("hex").slice(0, 16);
      const offerId = `offer_${key}`;
      if (!dedup.has(offerId)) {
        dedup.set(offerId, {
          offerId, kind: pr.kind, areaId: pr.phuong ? areaBySlug.get(pr.phuong) : null,
          priceVnd: pr.priceVnd, areaM2: pr.areaM2, pricePerm2: pr.pricePerm2Vnd,
          bedrooms: pr.bedrooms, phuongRaw: pr.phuong, confidence: pr.confidence,
          firstSeen: pr.post.posted_at, lastSeen: pr.post.posted_at, nReposts: 1,
          postIds: [pr.post.post_id],
        });
      } else {
        const o = dedup.get(offerId);
        o.nReposts++;
        o.postIds.push(pr.post.post_id);
        if (new Date(pr.post.posted_at) < new Date(o.firstSeen)) o.firstSeen = pr.post.posted_at;
        if (new Date(pr.post.posted_at) > new Date(o.lastSeen)) o.lastSeen = pr.post.posted_at;
      }
    }
    console.log(`dedup: ${dedup.size} unique offers (từ ${parsed.filter(p => p.confidence !== "low").length} tin có giá)`);

    // ---- Bước 5: ghi canonical ----
    await client.query("DELETE FROM sale_offers WHERE source = 'S03'");
    for (const o of dedup.values()) {
      await client.query(
        `INSERT INTO sale_offers (offer_id, area_id, kind, price_vnd, area_m2, price_perm2,
                                   bedrooms, phuong_raw, confidence, first_seen, last_seen, n_reposts, post_ids, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'S03')
         ON CONFLICT (offer_id) DO UPDATE SET n_reposts = EXCLUDED.n_reposts,
           last_seen = EXCLUDED.last_seen, post_ids = EXCLUDED.post_ids`,
        [o.offerId, o.areaId, o.kind, o.priceVnd, o.areaM2, o.pricePerm2, o.bedrooms,
         o.phuongRaw, o.confidence, o.firstSeen, o.lastSeen, o.nReposts, o.postIds],
      );
    }
    console.log(`offers ghi: ${dedup.size}`);
  } finally {
    await client.end();
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
