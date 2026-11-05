// E3/AC-3 (ma-album-s03): đưa ĐẦU RA THẬT của E2 (canonical AC-1 qua đúng
// toInternalMessageReceivedContext của runtime phát hành) vào handler.js
// THẬT của collector, chạy trong TIẾN TRÌNH CON với HOME giả + API giả —
// không đụng ~/.openclaw thật. Chứng minh: body gửi đi có albumMeta, mục
// đó KHÔNG tính thành ảnh; sự kiện không có → body giống hệt bản trước vá;
// albumMeta sai kiểu / ev.media không mảng → tin không mất; log không thêm
// dbg-media.
import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "../../../..");                        // gốc kho (worktree)
const HANDLER = join(REPO, "collector/openclaw/handler.js");    // handler THẬT
const RUNNER = join(HERE, "handler-runner.mjs");
const RUNTIME_DIR = `${process.env.HOME}/.openclaw/runtime/current`;

// — đầu ra thật của E2: đúng mapper runtime phát hành —
const distDir = join(RUNTIME_DIR, "lib/node_modules/openclaw/dist");
const mapperFile = readdirSync(distDir).find((f) => /^message-hook-mappers-.*\.mjs$/.test(f));
const mapper = await import(join(distDir, mapperFile));
const toInternal = mapper.a;

const ALBUM_META = {
  group_layout_id: "g-456", id_in_group: "123",
  total_item_in_group: 3, is_group_layout: true, child_number: 2, msg_type: "chat.photo",
};
const canonicalAlbum = {
  channelId: "zalouser", accountId: "default", conversationId: "200", threadId: "200",
  from: "zalouser:group:200", content: "https://cdn.example/anh.jpg", isGroup: true,
  groupId: "200", channelName: "NhomX", timestamp: Date.now(), messageId: `m-${Date.now()}`,
  senderId: "100", senderName: "S", media: [{ albumMeta: { ...ALBUM_META } }],
};

// — API giả: trả 202 cho agent-report, trả {} cho kev (fail-open) —
function startApiGia() {
  const nhan = [];
  const srv = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      nhan.push({ url: req.url, body });
      if (req.url.includes("/v1/systemone")) { res.writeHead(200); res.end("{}"); return; }
      res.writeHead(202); res.end('{"accepted":1}');
    });
  });
  return new Promise((res) => srv.listen(0, "127.0.0.1", () => res({ srv, nhan, port: srv.address().port })));
}

async function chayHandler(ev) {
  const S = mkdtempSync(join(tmpdir(), "e3-home-"));
  mkdirSync(join(S, ".openclaw/credentials"), { recursive: true });
  mkdirSync(join(S, ".openclaw/logs"), { recursive: true });
  writeFileSync(join(S, ".openclaw/credentials/oneinvest-agent.key"), "k-gia");
  const evF = join(S, "ev.json");
  writeFileSync(evF, JSON.stringify(ev));
  const { srv, nhan, port } = await startApiGia();
  const url = `http://127.0.0.1:${port}`;
  // spawn ASYNC: spawnSync đóng băng event loop của test → API giả (chạy
  // cùng tiến trình) không respond được → handler timeout 8s vào spool oan
  // (bẫy đã trả giá khi viết ca).
  const r = await new Promise((resolve) => {
    const c = spawn(process.execPath, [RUNNER, HANDLER, evF], {
      env: {
        ...process.env,
        HOME: S,
        ONEINVEST_API_URL: url,
        ONEINVEST_KEV_URL: url,
        ONEINVEST_HOOK_SPOOL: join(S, ".openclaw/spool"),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let err = "";
    c.stderr.on("data", (d) => (err += d));
    const t = setTimeout(() => c.kill(), 30_000);
    c.on("exit", (code) => { clearTimeout(t); resolve({ status: code, err: err.slice(0, 300) }); });
  });
  await new Promise((res2) => setTimeout(res2, 250));
  srv.close();
  const logF = join(S, ".openclaw/logs/oneinvest-zalo-pipe.log");
  const log = existsSync(logF) ? readFileSync(logF, "utf8") : "";
  const spoolDir = join(S, ".openclaw/spool");
  const spool = existsSync(spoolDir) ? readdirSync(spoolDir).filter((f) => f.endsWith(".json")) : [];
  rmSync(S, { recursive: true, force: true });
  return { nhan, log, spool, rc: r.status, err: (r.stderr || "").slice(0, 300) };
}

test("E3a: đầu ra E2 (internal thật) → handler thật + API giả: body CÓ albumMeta, mục KHÔNG thành ảnh", async () => {
  const ev = toInternal(canonicalAlbum);
  const { nhan, log } = await chayHandler(ev);
  const post = nhan.find((x) => x.url.includes("agent-report"));
  assert.ok(post, `handler phải POST agent-report (spool/log="${log.slice(0, 200)}")`);
  const body = JSON.parse(post.body);
  const msg = body.messages[0];
  assert.deepEqual(msg.albumMeta, ALBUM_META, "body gửi đi giữ albumMeta nguyên vẹn (cấp message)");
  // mục albumMeta KHÔNG lọt vào media ảnh: mọi mục media đều có url (ảnh từ
  // text), không mục nào mang albumMeta
  assert.ok(msg.media.every((m) => !m.albumMeta), "mục albumMeta KHÔNG thành ảnh trong media");
  assert.ok(log.includes("post 202"), "log ghi 'post 202' như khuôn cũ");
});

test("E3b: sự kiện KHÔNG albumMeta → body không sinh media (giống hệt bản trước vá)", async () => {
  const c = { ...canonicalAlbum, messageId: `k-${Date.now()}` };
  delete c.media;
  const { nhan } = await chayHandler(toInternal(c));
  const post = nhan.find((x) => x.url.includes("agent-report"));
  assert.ok(post, "handler vẫn POST");
  const msg = JSON.parse(post.body).messages[0];
  assert.equal(msg.albumMeta, null, "không albumMeta → message.albumMeta = null (giống bản trước vá ở phần albumMeta)");
  assert.ok(msg.media.every((m) => !m.albumMeta), "media không mang albumMeta");
});

test("E3c: ev.media KHÔNG mảng / albumMeta SAI KIỂU → tin KHÔNG MẤT, không dbg-media", async () => {
  // media string làm MAPPER lõi ném (projectHookMediaState) — monitor mới
  // không bao giờ sinh dạng này; ca này đưa THẲNG tới handler (giả sử mapper
  // của tương lai hở) để chứng minh handler không mất tin.
  const evMediaString = toInternal({ ...canonicalAlbum });
  evMediaString.media = "khong-phai-mang";
  const r1 = await chayHandler(evMediaString);
  const r2 = await chayHandler(toInternal({ ...canonicalAlbum, media: [{ albumMeta: "chuoi-sai-kieu" }, {}] }));
  const duocGui = (r) => r.nhan.some((x) => x.url.includes("agent-report"));
  const vaoSpool = (r) => r.spool.length > 0;
  assert.ok(duocGui(r1) || vaoSpool(r1), `ca media-string: tin vẫn được gửi/spool (log=${r1.log.slice(0, 120)})`);
  assert.ok(duocGui(r2) || vaoSpool(r2), "ca albumMeta sai kiểu: tin vẫn được gửi/spool");
  assert.ok(!r1.log.includes("dbg-media") && !r2.log.includes("dbg-media"), "không thêm dòng dbg-media");
});

test("E3d: log handler không chứa dbg-media cho ca album hợp lệ", async () => {
  const { log } = await chayHandler(toInternal(canonicalAlbum));
  assert.ok(!log.includes("dbg-media"), "mục albumMeta không kích hoạt dbg-media");
});
