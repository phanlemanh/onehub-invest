// apify-facebook-collector.mjs
// Thu thập tin BĐS từ Facebook Groups qua Apify — KHÔNG dùng account cá nhân.
//
// Kiến trúc:
//   Apify Cloud (scraper + proxy) → chạy theo lịch → webhook/poll → POST :9210
//
// Env cần (lưu ~/.oneinvest/cloud.env):
//   APIFY_TOKEN=apify_api_XXX          — từ https://console.apify.com/settings/integrations
//   APIFY_ACTOR_ID=apify/facebook-groups-scraper
//
// Chạy:
//   node apify-facebook-collector.mjs           — chạy 1 lần (test)
//   node apify-facebook-collector.mjs --poll    — poll kết quả run đang chạy
//
// Danh sách nhóm ĐỌC TỪ DB (source_groups, quản trị qua /ops/sources admin)
// — thêm/xoá nhóm không cần sửa code. Fallback danh sách cũ nếu DB không lên.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FALLBACK_GROUPS = [
  "https://www.facebook.com/groups/1642453779410701", // Bình Thạch TPHCM
  "https://www.facebook.com/groups/151411010405738",  // CHCC Hà Nội
  "https://www.facebook.com/groups/285736614961804",  // BĐS Hà Nội
  "https://www.facebook.com/groups/1573989412657228",
];

// 2510-4 (claudedp): đọc status S05 từ source_registry THEO MÃ (code='S05',
// không literal tên nguồn) — khác 'active' thì bỏ qua thu, KHÔNG gọi mạng,
// exit 0: đang pause mà vẫn gọi Apify chỉ nhận 402 và đốt lượt.
export const s05Skip = (status) => status !== "active";
export async function s05Status() {
  const pg = (await import("pg")).default;
  const c = new pg.Client({
    connectionString:
      process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
  });
  try {
    await c.connect();
    const { rows } = await c.query(`SELECT status FROM source_registry WHERE code = 'S05'`);
    return rows[0]?.status ?? null;
  } finally {
    await c.end().catch(() => {});
  }
}

async function loadGroups() {
  try {
    const pg = (await import("pg")).default;
    const c = new pg.Client({
      connectionString:
        process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
    });
    await c.connect();
    const { rows } = await c.query(
      `SELECT group_key FROM source_groups WHERE source_code = 'S05' AND enabled ORDER BY id`,
    );
    await c.end();
    if (rows.length === 0) throw new Error("0 nhóm bật");
    return rows.map((r) => r.group_key);
  } catch (e) {
    console.warn(`⚠ source_groups DB fail (${e.message}) — dùng fallback ${FALLBACK_GROUPS.length} nhóm`);
    return FALLBACK_GROUPS;
  }
}

const APIFY_API = "https://api.apify.com/v2";
const COLLECTOR_URL = process.env.COLLECTOR_URL ?? "http://localhost:9210";

async function creds() {
  const { readFile } = await import("node:fs/promises");
  const { homedir } = await import("node:os");
  const { join } = await import("node:path");
  const env = await readFile(join(homedir(), ".oneinvest/cloud.env"), "utf8");
  const token = env.match(/APIFY_TOKEN=(\S+)/)?.[1];
  if (!token) throw new Error("thiếu APIFY_TOKEN trong ~/.oneinvest/cloud.env");
  return { token };
}

// ─── 1. Khởi động actor run ───
// 2510-14 v2 (MỞ LẠI): trần + cửa sổ bài mới đều qua env, NaN-safe, tách hàm
// thuần để test không gọi Apify.
// - resultsLimit là trần của actor trên CẢ LƯỢT (tổng mọi startUrls) theo
//   khuôn Apify — với 2 nhóm bật tức tối đa ~50 tin/nhóm mỗi lượt.
// - onlyPostsNewerThan mặc định '4 days': phủ khoảng cách lượt dài nhất của
//   lịch Thứ Ba→Thứ Sáu→Thứ Ba (3–4 ngày) + đệm — '12 hours' cũ chỉ hợp với
//   lịch 4 lượt/ngày, lịch mới sẽ bỏ ~85–90% bài giữa hai lượt.
export const S05_NEWER_THAN_MAC_DINH = "4 days";
export function s05ResultsLimit() {
  const n = Number(process.env.S05_RESULTS_LIMIT);
  return Number.isFinite(n) && n > 0 ? n : 100;
}
export function s05NewerThan() {
  return process.env.S05_NEWER_THAN ?? S05_NEWER_THAN_MAC_DINH;
}
export function buildRunInput(groups) {
  return {
    startUrls: groups.map((url) => ({ url })),
    resultsLimit: s05ResultsLimit(),
    viewOption: "CHRONOLOGICAL", // newest first
    onlyPostsNewerThan: s05NewerThan(),
  };
}

async function startRun(token, groups) {
  const input = buildRunInput(groups);

  const res = await fetch(
    `${APIFY_API}/acts/apify~facebook-groups-scraper/runs?token=${token}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!res.ok) {
    throw new Error(`Apify start run: ${res.status} ${(await res.text()).slice(0, 200)}`);
  }

  const run = await res.json();
  console.log(`✅ Actor run started: ${run.data.id}`);
  console.log(`   Status: ${run.data.status}`);
  console.log(`   Dataset: ${run.data.defaultDatasetId}`);
  return run.data;
}

// ─── 2. Poll đến khi hoàn thành ───
async function waitForRun(token, runId) {
  const maxWait = 300_000; // 5 phút
  const start = Date.now();

  while (Date.now() - start < maxWait) {
    const res = await fetch(`${APIFY_API}/actor-runs/${runId}?token=${token}`);
    const { data } = await res.json();

    console.log(`   [${((Date.now() - start) / 1000).toFixed(0)}s] ${data.status}`);

    if (data.status === "SUCCEEDED") return data;
    if (data.status === "FAILED" || data.status === "ABORTED") {
      throw new Error(`Run ${data.status}: ${JSON.stringify(data).slice(0, 200)}`);
    }

    await new Promise((r) => setTimeout(r, 5000));
  }

  throw new Error(`Timeout sau ${maxWait / 1000}s`);
}

// ─── 3. Lấy kết quả từ dataset ───
async function getResults(token, datasetId) {
  const res = await fetch(
    `${APIFY_API}/datasets/${datasetId}/items?token=${token}&clean=true&format=json`
  );
  if (!res.ok) throw new Error(`Get dataset: ${res.status}`);
  return res.json();
}

// ─── 4. Parse + đẩy vào collector ───
// Ảnh nằm trong attachments[] (schema actor 2026-10: KHÔNG có field
// `images`). `url` là LINK TRANG ảnh (facebook.com/photo/?fbid=) — không
// nhúng được vào <img>; `thumbnail` là CDN jpg trực tiếp → ưu tiên.
function postImages(post) {
  return (post.attachments ?? [])
    .map((a) => {
      if (a?.thumbnail) return a.thumbnail;
      const u = a?.url ?? "";
      return /\.(jpe?g|png|webp)(\?|$)/i.test(u) ? u : null;
    })
    .filter(Boolean)
    .slice(0, 5);
}

function parsePost(post) {
  const text = post.text ?? "";
  const images = postImages(post);
  const author = post.user?.name ?? post.authorName ?? "unknown";

  return {
    text,
    ts: post.time ?? post.timestamp ?? new Date().toISOString(),
    // Facebook-specific metadata
    senderName: author,
    senderId: post.user?.id ?? post.authorId ?? null,
    group: post.groupTitle ?? "Facebook",
    media: images.map((url) => ({ path: null, url, type: "image/jpeg" })),
    // Extra fields from Apify
    postUrl: post.facebookUrl ?? post.postUrl ?? post.url ?? null,
    likesCount: post.likesCount ?? 0,
    commentsCount: post.commentsCount ?? 0,
    reactionLike: post.topReactionsCount ?? 0,
  };
}

async function pushToCollector(posts) {
  const keyFile = `${process.env.HOME}/.openclaw/credentials/oneinvest-agent.key`;
  const { readFile } = await import("node:fs/promises");
  let auth = "";
  try {
    auth = `Bearer ${(await readFile(keyFile, "utf8")).trim()}`;
  } catch {
    // Collector API có thể không yêu cầu auth khi chạy local không token
  }

  // Group posts theo group name để batch
  const byGroup = new Map();
  for (const p of posts) {
    const g = p.group ?? "Facebook";
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(p);
  }

  let total = 0;
  for (const [group, messages] of byGroup) {
    const body = {
      agent_id: "apify-facebook",
      group,
      messages: messages.map((m) => ({
        text: m.text,
        ts: m.ts,
        senderName: m.senderName,
        senderId: m.senderId,
        media: m.media?.length ? m.media : undefined,
      })),
    };

    const res = await fetch(`${COLLECTOR_URL}/agent-report`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(auth ? { authorization: auth } : {}) },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const result = await res.json();
      total += messages.length;
      console.log(`  ✅ ${group}: ${messages.length} posts → collector`);
    } else {
      console.error(`  ❌ ${group}: ${res.status} ${(await res.text()).slice(0, 100)}`);
    }
  }

  return total;
}

// ─── Main ───
async function main() {
  // 2510-4: pause theo source_registry — kiểm TRƯỚC khi đọc creds/gọi Apify.
  // DB không lên thì coi như active (fail-open) — thu vẫn chạy như trước.
  let status = "active";
  try {
    status = await s05Status();
  } catch (e) {
    console.warn(`⚠ source_registry DB fail (${e.message}) — coi như active, thu bình thường`);
  }
  if (s05Skip(status)) {
    console.log(`S05 paused — bỏ qua thu (status='${status}')`);
    return;
  }
  const { token } = await creds();
  const GROUPS = await loadGroups();
  console.log(`nhóm thu (source_groups): ${GROUPS.length}`);
  const isPoll = process.argv.includes("--poll");

  if (isPoll) {
    // Poll một run đang chạy (truyền run ID qua env)
    const runId = process.env.APIFY_RUN_ID;
    if (!runId) throw new Error("--poll cần APIFY_RUN_ID");
    console.log(`Polling run ${runId}...`);
    const run = await waitForRun(token, runId);
    const posts = await getResults(token, run.defaultDatasetId);
    console.log(`\n📥 ${posts.length} posts từ Apify`);
    const total = await pushToCollector(posts.map(parsePost));
    console.log(`\n✅ Đã đẩy ${total} posts vào collector`);
  } else {
    // Chạy full pipeline
    console.log("🚀 Bắt đầu Apify Facebook Groups Scraper...\n");
    const run = await startRun(token, GROUPS);
    const finished = await waitForRun(token, run.id);
    const posts = await getResults(token, finished.defaultDatasetId);
    console.log(`\n📥 ${posts.length} posts từ ${GROUPS.length} groups`);

    if (posts.length > 0) {
      console.log("\n─── Sample post ───");
      const sample = posts[0];
      console.log(`  Group: ${sample.groupTitle ?? "—"}`);
      console.log(`  Author: ${sample.authorName ?? "—"}`);
      console.log(`  Text: ${(sample.text ?? "").slice(0, 100)}...`);
      console.log(`  Images: ${(sample.images ?? []).length}`);
      console.log(`  Likes: ${sample.likesCount ?? 0}`);

      console.log("\n─── Đẩy vào collector ───");
      const total = await pushToCollector(posts.map(parsePost));
      console.log(`\n✅ Hoàn tất: ${total}/${posts.length} posts vào collector`);
    }
  }
}

// Chỉ chạy main() khi được gọi trực tiếp (khuôn import-airbnb/import-chotot)
// — test import s05Status/s05Skip từ file này không làm collector chạy theo.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error("❌", e.message);
    process.exit(1);
  });
}
