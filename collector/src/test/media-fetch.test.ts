import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { createServer, type Server } from "node:http";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import { createAgentServer } from "../api/server.js";
import { DEFAULTS, hostAllowed, parseHostSuffixes } from "../core/media-fetch.js";

/**
 * N1 media: tin Zalo mang URL ảnh zdn.vn (URL CÓ HẠN) phải được tải về máy
 * ngay lúc flush — lưu trong thư mục snapshot, khai sha256 trong manifest,
 * mapping để ở RawItem.meta (payload giữ NGUYÊN VĂN theo DATA-CONTRACT).
 * Fixture HTTP đóng vai CDN: 1 ảnh đúng, 404, quá dung lượng, treo (timeout),
 * ảnh chậm (chạy chồng flush), redirect trong/out allowlist.
 */
const JPG_A = Buffer.from("fake-jpeg-bytes-A");
// ZC15: byte mở đầu của JPEG XL — codestream trần và hộp ISO-BMFF "JXL "
const JXL_CS = Buffer.concat([Buffer.from([0xff, 0x0a]), Buffer.from("fake-jxl-codestream")]);
const JXL_BOX = Buffer.concat([
  Buffer.from([0x00, 0x00, 0x00, 0x0c]), Buffer.from("JXL "), Buffer.from([0x0d, 0x0a, 0x87, 0x0a]),
  Buffer.from("fake-jxl-box"),
]);
/** ZC15: header accept của yêu cầu ảnh gần nhất mà CDN giả nhận. */
let lastAccept: string | undefined;
let base = ""; // gán sau listen — handler đọc tại lúc có request
const srv: Server = createServer((req, res) => {
  lastAccept = req.headers.accept;
  if (req.url === "/jxl-cs.jpg") {
    res.writeHead(200, { "content-type": "image/jxl" });
    res.end(JXL_CS);
  } else if (req.url === "/jxl-box.jpg") {
    res.writeHead(200, { "content-type": "image/jxl" });
    res.end(JXL_BOX);
  } else if (req.url === "/a.jpg") {
    res.writeHead(200, { "content-type": "image/jpeg", "content-length": String(JPG_A.length) });
    res.end(JPG_A);
  } else if (req.url === "/404.jpg") {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("nope");
  } else if (req.url === "/big.jpg") {
    res.writeHead(200, { "content-type": "image/jpeg" });
    res.end(Buffer.alloc(4096, 7)); // maxBytes test = 2048
  } else if (req.url === "/slow.jpg") {
    // không đáp ứng — để timeout bế tắc
  } else if (req.url === "/slow-img.jpg") {
    // ảnh chậm: giữ flush đang chạy treo để thử chạy chồng (timeoutMs 2000)
    setTimeout(() => {
      res.writeHead(200, { "content-type": "image/jpeg" });
      res.end(JPG_A);
    }, 400);
  } else if (req.url === "/redir-ok.jpg") {
    // redirect nội bộ cùng host — phải tải bình thường
    res.writeHead(302, { location: "/a.jpg" });
    res.end();
  } else if (req.url === "/redir-ip.jpg") {
    // ZC15: host nguồn (localhost) chuyển hướng sang host đích 127.0.0.1 — host
    // đích chỉ được phép khi hậu tố "0.0.1" có trong cấu hình local
    res.writeHead(302, { location: base + "/a.jpg" });
    res.end();
  } else if (req.url === "/redir-out.jpg") {
    // redirect sang hostname khác (localhost ≠ 127.0.0.1 trong allowlist)
    res.writeHead(302, { location: base.replace("127.0.0.1", "localhost") + "/a.jpg" });
    res.end();
  } else if (req.url === "/jpg/broken.jpg") {
    // 2511-3: CDN nguồn trả 400 cho biến thể path có đoạn "/jpg/"
    res.writeHead(400, { "content-type": "text/plain" });
    res.end("bad");
  } else if (req.url === "/broken.jpg") {
    // cùng ảnh sau khi bỏ "/jpg/" — 200 (nội dung JPEG XL ở nguồn thật)
    res.writeHead(200, { "content-type": "image/jxl", "content-length": String(JPG_A.length) });
    res.end(JPG_A);
  } else {
    res.writeHead(403);
    res.end();
  }
});
await new Promise<void>((done) => srv.listen(0, "127.0.0.1", done));
base = `http://127.0.0.1:${(srv.address() as { port: number }).port}`;
after(() => srv.close());

function fresh() {
  return join(tmpdir(), `media-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

/** Cho test: cho phép đúng host fixture, cap/timeout nhỏ để các ca lỗi chạy nhanh. */
const mediaOpts = { allowedHostSuffixes: ["127.0.0.1"], maxBytes: 2048, timeoutMs: 300 };

function msg(text: string, urls: string[], ts: string) {
  return { text, ts, media: urls.map((url) => ({ path: null, url, type: "image/jpeg" })) };
}

function ingestWith(s: Awaited<ReturnType<typeof createAgentServer>>, messages: unknown[]) {
  const r = s.ingest({ agent_id: "a", group: "g", messages }, "Bearer k1");
  assert.equal(r.status, 202, `ingest phải 202, được ${r.status}`);
}

function readItems(root: string, snapshotId: string): any[] {
  const dir = join(root, "hanoi", snapshotId);
  return JSON.parse(gunzipSync(readFileSync(join(dir, "items-0001.json.gz"))).toString());
}

/** Đọc MỌI items-*.json.gz của snapshot theo manifest — phát hiện ghi đôi
 *  (ca flush chồng sẽ sinh items-0002 chứa lại item cũ). */
function readAllItems(root: string, snapshotId: string): { items: any[]; itemCountFiles: number } {
  const dir = join(root, "hanoi", snapshotId);
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const gzNames = manifest.files.filter((f: { name: string }) => f.name.startsWith("items-"));
  const items = gzNames.flatMap((f: { name: string }) =>
    JSON.parse(gunzipSync(readFileSync(join(dir, f.name))).toString()),
  );
  return { items, itemCountFiles: gzNames.length };
}

test("media: URL hợp lệ tải vào media/, khai manifest.files + meta.mediaFiles; payload nguyên vận", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: mediaOpts });
  ingestWith(s, [msg("tin có ảnh", [`${base}/a.jpg`], "2026-10-22T10:00:00Z")]);
  const m = await s.flush();
  assert.ok(m);
  const dir = join(root, "hanoi", m.snapshotId);
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  assert.equal(manifest.schemaVersion, 6) // v6 ma-album: kênh S03 ghi 6;
  const mediaEntry = manifest.files.find((f: { name: string }) => f.name.startsWith("media/"));
  assert.ok(mediaEntry, "manifest phải khai file media kèm sha256/bytes");
  assert.ok(mediaEntry.name.endsWith(".jpg"));
  const onDisk = readFileSync(join(dir, mediaEntry.name));
  assert.equal(onDisk.length, mediaEntry.bytes);
  assert.equal(createHash("sha256").update(onDisk).digest("hex"), mediaEntry.sha256);

  const items = readItems(root, m.snapshotId);
  assert.equal(items[0].meta.mediaFiles.length, 1);
  assert.equal(items[0].meta.mediaFiles[0].url, `${base}/a.jpg`);
  assert.equal(items[0].meta.mediaFiles[0].file, mediaEntry.name);
  // payload NGUYÊN VĂN — không bơm localPath vào payload (mọi diễn giải ở meta)
  assert.deepEqual(items[0].payload.media, [{ path: null, url: `${base}/a.jpg`, type: "image/jpeg" }]);
});

test("media: host ngoài allowlist KHÔNG ra mạng, ghi error host-not-allowed", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: mediaOpts });
  ingestWith(s, [msg("link lạ", ["http://example.com/a.jpg"], "2026-10-22T10:01:00Z")]);
  const m = await s.flush();
  assert.ok(m);
  const dir = join(root, "hanoi", m.snapshotId);
  const items = readItems(root, m.snapshotId);
  assert.equal(items[0].meta.mediaFiles[0].error, "host-not-allowed");
  assert.equal(items[0].meta.mediaFiles[0].file, undefined);
  assert.equal(existsSync(join(dir, "media")), false);
});

test("media: 404 / quá lớn / timeout → error riêng từng URL, tin vẫn vào snapshot (fail-open)", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: mediaOpts });
  ingestWith(s, [
    msg("lỗi đủ loại", [`${base}/404.jpg`, `${base}/big.jpg`, `${base}/slow.jpg`], "2026-10-22T10:02:00Z"),
  ]);
  const m = await s.flush();
  assert.ok(m, "flush không được fail vì media lỗi");
  const items = readItems(root, m.snapshotId);
  const errors = items[0].meta.mediaFiles.map((e: { error: string }) => e.error).sort();
  assert.deepEqual(errors, ["http-404", "timeout", "too-large"]);
  assert.equal(items[0].payload.text, "lỗi đủ loại");
});

test("media: URL trùng trong 1 flush chỉ ghi 1 file, 2 item cùng trỏ", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: mediaOpts });
  const url = `${base}/a.jpg`;
  ingestWith(s, [
    msg("t1", [url], "2026-10-22T10:03:00Z"),
    msg("t2 repost", [url], "2026-10-22T10:04:00Z"),
  ]);
  const m = await s.flush();
  assert.ok(m);
  const dir = join(root, "hanoi", m.snapshotId);
  assert.equal(readdirSync(join(dir, "media")).length, 1);
  const items = readItems(root, m.snapshotId);
  assert.equal(items[0].meta.mediaFiles[0].file, items[1].meta.mediaFiles[0].file);
});

/** Cho ca chạy chồng flush: ảnh chậm 400ms cần timeout rộng hơn mediaOpts. */
const slowOpts = { allowedHostSuffixes: ["127.0.0.1"], maxBytes: 2048, timeoutMs: 2_000 };

test("flush chạy chồng khi ảnh chậm: single-flight — 1 snapshot, không trùng, tin giữa chừng nằm lại", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: slowOpts });
  ingestWith(s, [msg("tin ảnh chậm", [`${base}/slow-img.jpg`], "2026-10-22T11:00:00Z")]);
  const p1 = s.flush(); // bắt đầu — treo ở tải ảnh ~400ms
  const p2 = s.flush(); // interval 60s / POST đủ 50 tin kích chồng đúng lúc này
  ingestWith(s, [msg("tin tới giữa chừng", [`${base}/a.jpg`], "2026-10-22T11:01:00Z")]);
  const [m1, m2] = await Promise.all([p1, p2]);
  assert.equal(m1?.snapshotId, m2?.snapshotId, "hai lời gọi phải chung một kết quả flush");
  assert.equal(readdirSync(join(root, "hanoi")).length, 1, "đúng 1 thư mục snapshot");
  const { items, itemCountFiles } = readAllItems(root, m1!.snapshotId);
  assert.equal(itemCountFiles, 1, "đúng 1 file items-*.gz — chạy chồng không được sinh file thứ hai");
  assert.equal(items.length, 1, "không được ghi trùng item");
  assert.equal(items[0].payload.text, "tin ảnh chậm");
  assert.ok(items[0].meta.mediaFiles[0].file, "ảnh tin đầu vẫn được tải");
  assert.equal(s.stats().buffered, 1, "tin giữa chừng nằm lại buffer");
  // Tin giữa chừng phải vào snapshot LẦN SAU, có ảnh của nó
  const m3 = await s.flush();
  assert.ok(m3 && m3.snapshotId !== m1!.snapshotId);
  const items3 = readItems(root, m3.snapshotId);
  assert.equal(items3.length, 1);
  assert.equal(items3[0].payload.text, "tin tới giữa chừng");
  assert.ok(items3[0].meta.mediaFiles[0].file);
});

test("media: redirect cùng host tải bình thường; redirect ra host ngoài allowlist bị từ chối", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: mediaOpts });
  ingestWith(s, [
    msg("redirect", [`${base}/redir-ok.jpg`, `${base}/redir-out.jpg`], "2026-10-22T11:02:00Z"),
  ]);
  const m = await s.flush();
  assert.ok(m);
  const items = readItems(root, m.snapshotId);
  const okEntry = items[0].meta.mediaFiles.find((e: { url: string }) => e.url.endsWith("/redir-ok.jpg"));
  const outEntry = items[0].meta.mediaFiles.find((e: { url: string }) => e.url.endsWith("/redir-out.jpg"));
  assert.ok(okEntry && okEntry.file, "redirect nội bộ phải tải được");
  assert.equal(outEntry.error, "redirect-host");
  assert.equal(outEntry.file, undefined);
});

// ZC9 (2211-16): host R2 của người đăng S03 vào danh sách cho phép mặc định.
// LỆNH PHÁ (bản chép hỏng): xoá `"r2.dev"` khỏi DEFAULTS.allowedHostSuffixes
// trong src/core/media-fetch.ts → ca này ĐỎ.
test("ZC9: DEFAULTS cho phép suffix r2.dev (ảnh người đăng S03 tự lưu Cloudflare R2)", async () => {
  const ma = readFileSync(join(import.meta.dirname, "../../src/core/media-fetch.ts"), "utf8");
  assert.match(ma, /allowedHostSuffixes:\s*\["zdn\.vn",\s*R2_SUFFIX_ZC9\]/, "DEFAULTS phải gồm zdn.vn + hằng R2");
  assert.match(ma, /R2_SUFFIX_ZC9\s*=\s*"r2\.dev"/, "hằng R2 phải đúng suffix r2.dev");
});

// Đề nghị LL (BÁO claudedp-2211-17): ca HÀNH VI cạnh ca đọc chữ nguồn —
// ranh giới dấu chấm của suffix + host người đăng r2.dev qua được mặc định.
// LỆNH PHÁ (bản chép hỏng): xoá "r2.dev" khỏi DEFAULTS.allowedHostSuffixes
// (hoặc đổi hostAllowed bỏ kiểm ranh giới dấu chấm) → ca này ĐỎ.
test("ZC9-hành-vi: pub-x.r2.dev qua được mặc định; evilr2.dev bị chặn (ranh giới dấu chấm); zpc.zdn.vn trong allowlist", () => {
  const duoi = DEFAULTS.allowedHostSuffixes;
  assert.equal(hostAllowed("pub-x.r2.dev:443", duoi), true, "host người đăng r2.dev phải qua");
  assert.equal(hostAllowed("evilr2.dev", duoi), false, "evilr2.dev KHÔNG khớp suffix r2.dev (ranh giới dấu chấm)");
  assert.equal(hostAllowed("zdn.vn.evil.com", duoi), false, "tròng zdn.vn ở giữa không khớp");
  assert.equal(hostAllowed("f20-zpc.zdn.vn", duoi), true, "CDN zpc nằm trong allowlist — 400 của nó không phải chặn của ta");
});

// ── ZC15 (bổ sung LL 24/11): host đích chuyển hướng qua cấu hình local, Accept, JPEG XL ──

function stateDirWith(lines: string | null): string {
  const d = fresh();
  mkdirSync(d, { recursive: true });
  if (lines !== null) writeFileSync(join(d, "media-host-suffixes.txt"), lines);
  return d;
}

/** ZC15: fixture host — nguồn là localhost (được phép sẵn), host đích là 127.0.0.1 (hậu tố "0.0.1" chỉ từ cấu hình local). */
const mediaOptsNguon = { ...mediaOpts, allowedHostSuffixes: ["localhost"] };
const HAU_TO_DICH = "0.0.1";

test("ZC15: tệp hậu tố trong stateDir mở host đích chuyển hướng; vắng tệp thì redirect-host như cũ", async () => {
  const nguon = base.replace("127.0.0.1", "localhost");
  // chiều xanh: tệp khai hậu tố của host đích
  {
    const root = fresh();
    const s = await createAgentServer({
      snapshotRoot: root, stateDir: stateDirWith(`# host đích ZC15\n${HAU_TO_DICH}\n`),
      city: "hanoi", keys: ["k1"], media: mediaOptsNguon, log: () => {},
    });
    ingestWith(s, [msg("redirect sang host đích", [`${nguon}/redir-ip.jpg`, `${base}/a.jpg`], "2026-11-25T01:00:00Z")]);
    const m = await s.flush();
    assert.ok(m);
    const [viaRedirect, direct] = readItems(root, m.snapshotId)[0].meta.mediaFiles;
    assert.equal(viaRedirect.error, undefined, "có tệp hậu tố: ảnh chuyển hướng sang host đích phải tải được");
    assert.ok(viaRedirect.file);
    const onDisk: Buffer = readFileSync(join(root, "hanoi", m.snapshotId, viaRedirect.file as string));
    assert.ok(onDisk.equals(JPG_A));
    assert.equal(createHash("sha256").update(onDisk).digest("hex"), viaRedirect.sha256);
    assert.equal(direct.error, undefined, "có tệp hậu tố: URL gốc ở host đích phải tải được");
  }
  // chiều đỏ: cùng fixture, stateDir không có tệp
  {
    const root = fresh();
    const s = await createAgentServer({
      snapshotRoot: root, stateDir: stateDirWith(null),
      city: "hanoi", keys: ["k1"], media: mediaOptsNguon, log: () => {},
    });
    ingestWith(s, [msg("redirect sang host đích", [`${nguon}/redir-ip.jpg`, `${base}/a.jpg`], "2026-11-25T01:01:00Z")]);
    const m = await s.flush();
    assert.ok(m);
    const [viaRedirect, direct] = readItems(root, m.snapshotId)[0].meta.mediaFiles;
    assert.equal(viaRedirect.error, "redirect-host", "vắng tệp hậu tố: phải lỗi redirect-host");
    assert.equal(direct.error, "host-not-allowed", "vắng tệp hậu tố: URL gốc host đích phải host-not-allowed");
  }
});

test("ZC15: parseHostSuffixes lọc dòng hỏng — một nhãn, ký tự lạ, dấu chấm đầu/cuối, chú thích, dòng trống", () => {
  assert.deepEqual(
    parseHostSuffixes("vn\nlocalhost\n.x.com\nx.com.\na_b.com\n# chú thích\n\n Pub.Example.COM \npub.example.com, ,bad"),
    ["pub.example.com"],
  );
  assert.deepEqual(parseHostSuffixes(undefined), []);
  assert.deepEqual(parseHostSuffixes("a.r2.dev # ghi chú, b.example.org"), ["a.r2.dev", "b.example.org"]);
});

test("ZC15: biến môi trường ONEINVEST_MEDIA_HOST_SUFFIXES mở host đích; log chỉ in số, không in tên host", async () => {
  const prev = process.env.ONEINVEST_MEDIA_HOST_SUFFIXES;
  try {
    for (const [env, wantErr] of [[`${HAU_TO_DICH},bad`, undefined], ["", "redirect-host"]] as const) {
      process.env.ONEINVEST_MEDIA_HOST_SUFFIXES = env;
      const lines: string[] = [];
      const root = fresh();
      const s = await createAgentServer({
        snapshotRoot: root, city: "hanoi", keys: ["k1"], media: mediaOptsNguon, log: (l) => lines.push(l),
      });
      ingestWith(s, [msg("env", [`${base.replace("127.0.0.1", "localhost")}/redir-ip.jpg`], `2026-11-25T01:0${env ? 2 : 3}:00Z`)]);
      const m = await s.flush();
      assert.ok(m);
      const e = readItems(root, m.snapshotId)[0].meta.mediaFiles[0];
      assert.equal(e.error, wantErr, `env='${env}'`);
      const log = lines.join("\n");
      assert.match(log, env ? /\+ 1 hậu tố thêm/ : /\+ 0 hậu tố thêm/, "log khởi động phải in số hậu tố thêm");
      assert.ok(!log.includes(HAU_TO_DICH), "log khởi động KHÔNG được in tên host thêm");
    }
  } finally {
    if (prev === undefined) delete process.env.ONEINVEST_MEDIA_HOST_SUFFIXES;
    else process.env.ONEINVEST_MEDIA_HOST_SUFFIXES = prev;
  }
});

test("ZC15: Accept chỉ xin jpeg, png, webp, gif — không xin JPEG XL, không */*", async () => {
  lastAccept = undefined;
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: mediaOpts, log: () => {} });
  ingestWith(s, [msg("accept", [`${base}/a.jpg?accept`], "2026-11-25T01:04:00Z")]);
  assert.ok(await s.flush());
  const acc = lastAccept as string | undefined;
  assert.ok(acc, "CDN giả phải nhận header accept");
  assert.ok(acc.includes("image/jpeg"), `accept phải có image/jpeg, được '${acc}'`);
  assert.ok(!acc.includes("image/jxl"), `accept không được xin image/jxl, được '${acc}'`);
  assert.ok(!acc.includes("*/*"), `accept không được là */*, được '${acc}'`);
});

test("ZC15: JPEG XL lưu nguyên byte với đuôi .jxl; JPEG giữ .jpg", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: mediaOpts, log: () => {} });
  ingestWith(s, [msg("jxl", [`${base}/jxl-cs.jpg`, `${base}/jxl-box.jpg`, `${base}/a.jpg`], "2026-11-25T01:05:00Z")]);
  const m = await s.flush();
  assert.ok(m);
  const files = readItems(root, m.snapshotId)[0].meta.mediaFiles;
  for (const [e, bytes] of [[files[0], JXL_CS], [files[1], JXL_BOX]] as const) {
    assert.equal(e.error, undefined);
    assert.match(e.file, /^media\/[0-9a-f]{16}\.jxl$/, "đuôi .jxl cho byte JPEG XL");
    const onDisk: Buffer = readFileSync(join(root, "hanoi", m.snapshotId, e.file as string));
    assert.ok(onDisk.equals(bytes), "byte JPEG XL phải giữ nguyên");
    assert.equal(e.sha256, createHash("sha256").update(bytes).digest("hex"));
  }
  assert.match(files[2].file, /\.jpg$/, "JPEG vẫn đuôi .jpg");
});

test("media (2511-3): URL /jpg/ bị CDN 400 → fallback bỏ /jpg/ tải được, meta ghi urlFetched; bỏ khối fallback thì ca này đỏ", async () => {
  const root = fresh();
  const s = await createAgentServer({ snapshotRoot: root, city: "hanoi", keys: ["k1"], media: mediaOpts });
  ingestWith(s, [msg("link /jpg/ hỏng", [`${base}/jpg/broken.jpg`], "2026-10-22T10:05:00Z")]);
  const m = await s.flush();
  assert.ok(m);
  const dir = join(root, "hanoi", m.snapshotId);
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const mediaEntry = manifest.files.find((f: { name: string }) => f.name.startsWith("media/"));
  assert.ok(mediaEntry, "fallback phải tải được ảnh khi bỏ /jpg/");
  const items = readItems(root, m.snapshotId);
  const mf = items[0].meta.mediaFiles[0];
  // payload + meta.url giữ URL gốc nguyên văn — fallback chỉ ghi ở urlFetched
  assert.deepEqual(items[0].payload.media, [{ path: null, url: `${base}/jpg/broken.jpg`, type: "image/jpeg" }]);
  assert.equal(mf.url, `${base}/jpg/broken.jpg`);
  assert.equal(mf.urlFetched, `${base}/broken.jpg`);
  assert.equal(mf.file, mediaEntry.name);
  assert.equal(mf.error, undefined);
  // nội dung trên đĩa khớp bytes fixture
  const onDisk = readFileSync(join(dir, mediaEntry.name));
  assert.equal(onDisk.length, JPG_A.length);
});
