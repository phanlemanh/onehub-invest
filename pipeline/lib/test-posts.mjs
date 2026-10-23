// test-posts.mjs — định nghĩa DUY NHẤT của «post thử» cho các transform đọc stg_zalo_posts.
// Spec: docs/superpowers/specs/2026-10-23-canonical-khong-tin-gia-design.md §2.1 (_acceptance/canonical-khong-tin-gia).
//
// L19: 1.260 post của bộ sinh tin giả (snapshot zalo-mock) đã thành 1.020 tin S03 giả trong sale_offers.
// Importer bỏ snapshot thử là PL1 (làn ZCode); transform tự gạt post thử ở đầu đọc để canonical sạch
// dù stg còn hay không. Importer có thể import cùng hàm này sau.

/** Ba dấu post thử, theo thứ tự xét. Tên là khoá của ops_audit và thước dư lượng. */
export const TEST_MARKERS = Object.freeze(["snapshot-source", "agent", "group"]);

// snapshot_id = '<city>__<source>__<ts>'; nguồn 'example' là snapshot synthetic của collector.
const SOURCE_TEST = /(mock|test|e2e)/i;
const AGENT_TEST = /^(e2e|test|mock)/i;
// «TEST», «TEST-G1» là nhóm thử; «TESTING…» là một từ khác nên không tính.
const GROUP_TEST = /^test(?!\p{L})/iu;

/**
 * Dấu thử của một hàng stg, hoặc null khi là post thật.
 * @param {{ snapshot_id?: string|null, agent_id?: string|null, group_name?: string|null }} row
 * @returns {"snapshot-source"|"agent"|"group"|null}
 */
export function testMarker(row) {
  const source = (row.snapshot_id ?? "").split("__")[1] ?? "";
  if (source === "example" || SOURCE_TEST.test(source)) return "snapshot-source";
  if (AGENT_TEST.test(row.agent_id ?? "")) return "agent";
  if (GROUP_TEST.test((row.group_name ?? "").trim())) return "group";
  return null;
}

const CHANNEL_WHERE = {
  // Zalo (S03): mọi post không do actor Facebook thu.
  zalo: "agent_id IS NULL OR agent_id <> 'apify-facebook'",
  facebook: "agent_id = 'apify-facebook'",
};

/**
 * Đọc post mới nhất mỗi post_id của một kênh, gạt post thử.
 * @param {import("pg").Client} client
 * @param {"zalo"|"facebook"} channel
 */
export async function loadStgPosts(client, channel) {
  const where = CHANNEL_WHERE[channel];
  if (!where) throw new Error(`loadStgPosts: kênh lạ «${channel}»`);
  const { rows } = await client.query(
    `SELECT DISTINCT ON (post_id) post_id, snapshot_id, agent_id, text, posted_at, group_name,
            author_hash, sender_name
     FROM stg_zalo_posts
     WHERE ${where}
     ORDER BY post_id, captured_at DESC`,
  );
  const posts = [];
  const byMarker = {};
  for (const r of rows) {
    const m = testMarker(r);
    if (m) byMarker[m] = (byMarker[m] ?? 0) + 1;
    else posts.push(r);
  }
  return { posts, rejected: { total: rows.length - posts.length, by_marker: byMarker } };
}

/**
 * Ghi một dòng ops_audit cho lượt có post thử bị gạt — để dòng đối soát đi kèm nói được vì sao.
 * @returns {Promise<boolean>} có ghi hay không
 */
export async function auditRejected(client, source, rejected) {
  if (!rejected || rejected.total === 0) return false;
  await client.query(
    `INSERT INTO ops_audit (actor, action, env, detail) VALUES ($1, 'transform:reject-test', 'local', $2)`,
    [`transform:${source}`, { source, rejected: rejected.total, by_marker: rejected.by_marker }],
  );
  return true;
}

/**
 * Tệp mã vừa đọc stg_zalo_posts vừa ghi sale_offers — đường thứ hai đưa post vào canonical mà
 * không qua loadStgPosts. Bỏ dòng chú thích. Thước AC-3 (phải rỗng).
 * @param {{ path: string, text: string }[]} files
 * @returns {string[]}
 */
export function scanStgWriters(files) {
  const code = (t) => t.split("\n").filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join("\n");
  return files
    .filter((f) => {
      const t = code(f.text);
      return /\bstg_zalo_posts\b/.test(t) && (/\bwriteOffers\(/.test(t) || /INSERT\s+INTO\s+sale_offers\b/i.test(t));
    })
    .map((f) => f.path);
}
