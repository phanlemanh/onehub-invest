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
// 2610-13 (TV2b): luật chạy nguồn × đơn vị — DUY NHẤT qua đây
import { docTrangThai, isRunnable } from "./lib/vong-doi.mjs";
import { fileURLToPath } from "node:url";



// 2610-13 (TV2b): NHÓM chỉ từ DB qua luật vong-doi (source_groups.status là
// nguồn sự thật từ 047) — KHÔNG còn FALLBACK_GROUPS: DB lỗi → thoát ≠0
// (fail-closed), không còn nhóm active → 0 lượt (không thu mò).
async function loadGroups(client) {
  const src = (await client.query(`SELECT code, status FROM source_registry WHERE code = 'S05'`)).rows[0] ?? null;
  const { rows } = await client.query(
    `SELECT group_key, status FROM source_groups WHERE source_code = 'S05' ORDER BY id`,
  );
  return rows
    .map((r) => ({ key: r.group_key, ...isRunnable(src, { status: r.status }) }))
    .filter((r) => r.run)
    .map((r) => r.key);
}

const APIFY_API = process.env.APIFY_API ?? "https://api.apify.com/v2"; // 2610-13: env cho test nhà cung cấp giả
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
  // 2610-13 (TV2b): cổng DUY NHẤT qua pipeline/lib/vong-doi — trước khi đọc
  // creds/gọi Apify. Từ chối → 0 lời gọi, thoát 0, một dòng mã + lý do.
  // DB lỗi → thoát ≠0 (fail-closed — hết fail-open của 2510-4 theo TV2b).
  const pg = (await import("pg")).default;
  const dbc = new pg.Client({
    connectionString:
      process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
  });
  let GROUPS;
  try {
    await dbc.connect();
    const kq = await docTrangThai(dbc, "S05");
    if (!kq.run) {
      console.log(`S05 ${kq.ly_do} — bỏ qua thu`);
      await dbc.end();
      return;
    }
    GROUPS = await loadGroups(dbc);
    await dbc.end();
  } catch (e) {
    console.error(`S05 vong-doi lỗi — dừng (fail-closed): ${e.message}`);
    process.exit(1);
  }
  if (GROUPS.length === 0) {
    console.log("S05 khong-con-nhom-active — bỏ qua thu (0 nhóm active)");
    return;
  }
  const { token } = await creds();
  console.log(`nhóm thu (vong-doi active): ${GROUPS.length}`);
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
// — test import luật vong-doi từ file này không làm collector chạy theo.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error("❌", e.message);
    process.exit(1);
  });
}
