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
// Danh sách nhóm PUBLIC (không cần login để đọc):
const GROUPS = [
  "https://www.facebook.com/groups/458803055236158",  // MUA BÁN NHÀ ĐẤT HÀ NỘI
  "https://www.facebook.com/groups/285736614961804",  // BẤT ĐỘNG SẢN HÀ NỘI
  "https://www.facebook.com/groups/151411010405738",  // MUA BÁN CHUNG CƯ HÀ NỘI
  "https://www.facebook.com/groups/1642453779410701", // HỘI MUA BÁN NHÀ ĐẤT BÌNH THẠNH TP.HCM
  "https://www.facebook.com/groups/1573989412657228",  // Nhóm user thêm
];

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
async function startRun(token) {
  const input = {
    startUrls: GROUPS.map((url) => ({ url })),
    resultsLimit: 100, // 100 posts/run — đủ cho 4h/lần
    viewOption: "CHRONOLOGICAL", // newest first
    onlyPostsNewerThan: "12 hours",
  };

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
  const { token } = await creds();
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
    const run = await startRun(token);
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

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
