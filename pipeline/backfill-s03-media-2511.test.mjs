// backfill-s03-media-2511.test.mjs — test tải bù ảnh S03 (claudedp-2511-51).
// KHÔNG đòi DB thật / mạng ngoài: CDN nguồn là HTTP fixture cục bộ; module
// media-fetch lấy từ collector dist đã build (đồng bộ logic đang chạy thật —
// vắng thì bỏ qua có tên); env dựng tường minh không kế thừa nhạy cảm.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";
import { entryCua, docSuffixes, chepAnhSong, ghiSnapshotBuu } from "./backfill-s03-media-2511.mjs";

const HERE = dirname(new URL(import.meta.url, "file:").pathname);
const GOC = dirname(HERE);
const DIST = join(GOC, "collector", "dist", "core", "media-fetch.js");
const CO_DIST = existsSync(DIST);
const NGAY_HN = "2026-11-24T01:02:03.000Z"; // 08:02 VN 24/11

const Anh = (bytes) => ({ bytes, sha: createHash("sha256").update(bytes).digest("hex") });
const A = Anh(Buffer.from("anh-song-goc")); // ảnh sống của snapshot gốc

function moiTruong() {
  const home = mkdtempSync(join(tmpdir(), "buuanh-"));
  const root = join(home, "snapshots");
  // snapshot gốc: một ảnh sống đã nạp (media/abc123.jpg) — entry trong stg trỏ vào đây
  const snapshotCu = "hanoi__zalo-agent__2026-11-24T090000000";
  mkdirSync(join(root, "hanoi", snapshotCu, "media"), { recursive: true });
  writeFileSync(join(root, "hanoi", snapshotCu, "media", "cu-song.jpg"), A.bytes);

  // CDN nguồn fixture
  const srv = createServer((req, res) => {
    if (req.url === "/jpg/broken.jpg") {
      res.writeHead(400, { "content-type": "text/plain" });
      res.end("bad");
    } else if (req.url === "/broken.jpg") {
      res.writeHead(200, { "content-type": "image/jpeg" });
      res.end(Buffer.from("anh-sau-fallback"));
    } else if (req.url === "/cham.jpg") {
      res.writeHead(403, { "content-type": "text/plain" });
      res.end("forbidden");
    } else if (req.url === "/chet.jpg") {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("gone");
    } else {
      res.writeHead(403);
      res.end();
    }
  });
  return new Promise((done) => srv.listen(0, "127.0.0.1", () => done({ home, root, snapshotCu, base: `http://127.0.0.1:${srv.address().port}`, srv })));
}

const fetchModule = CO_DIST ? await import(pathToFileURL(DIST).href) : null;
const SUFFIX_TEST = ["zdn.vn", "r2.dev", "127.0.0.1"];

test("entryCua ưu tiên entry không lỗi; thiếu entry → null", () => {
  const bai = {
    mediaFiles: [
      { url: "http://x/1.jpg", error: "http-400" },
      { url: "http://x/2.jpg", file: "media/a.jpg", sha256: "s", bytes: 1 },
    ],
  };
  assert.equal(entryCua(bai, "http://x/2.jpg").file, "media/a.jpg");
  assert.equal(entryCua(bai, "http://x/1.jpg").error, "http-400");
  assert.equal(entryCua(bai, "http://x/3.jpg"), null);
});

test("docSuffixes: đọc tệp máy thu, bỏ chú thích, khử trùng lặp", () => {
  const f = join(mkdtempSync(join(tmpdir(), "sfx-")), "sfx.txt");
  writeFileSync(f, "# ghi chú\n  host mot.dev  \nzdn.vn\n");
  assert.deepEqual(docSuffixes(f), ["zdn.vn", "r2.dev", "host mot.dev"]);
  assert.deepEqual(docSuffixes(join(f, "khong-ton-tai")), ["zdn.vn", "r2.dev"]);
});

test("ghiSnapshotBuu: ảnh sống chép từ snapshot gốc + ảnh /jpg/400 tải lại qua fallback + 404 giữ nguyên; manifest đúng hợp đồng", { skip: !CO_DIST && "cần collector dist đã build" }, async () => {
  const t = await moiTruong();
  try {
    const bai = [
      {
        postId: "p1",
        snapshotId: t.snapshotCu,
        payload: {
          group: "nhom-a",
          author: "hash-a",
          text: "tin co anh",
          senderName: null,
          senderId: null,
          conversationId: null,
          media: [
            { path: null, url: `${t.base}/song-ngoai.jpg`, type: "image/jpeg" }, // sống ở snapshot gốc
            { path: null, url: `${t.base}/jpg/broken.jpg`, type: "image/jpeg" }, // nhóm /jpg/ 400
          ],
          agent_id: "ag1",
        },
        postedAt: NGAY_HN,
        mediaFiles: [
          { url: `${t.base}/song-ngoai.jpg`, file: "media/cu-song.jpg", sha256: A.sha, bytes: A.bytes.length, snapshotId: t.snapshotCu },
          { url: `${t.base}/jpg/broken.jpg`, error: "http-400" },
        ],
      },
      {
        postId: "p2",
        snapshotId: t.snapshotCu,
        payload: {
          group: "nhom-a",
          author: "hash-a",
          text: "tin anh chet",
          senderName: null,
          senderId: null,
          conversationId: null,
          media: [{ path: null, url: `${t.base}/chet.jpg`, type: "image/jpeg" }],
          agent_id: "ag1",
        },
        postedAt: NGAY_HN,
        mediaFiles: [{ url: `${t.base}/chet.jpg`, error: "http-404" }],
      },
    ];
    const dirMoi = join(t.root, "hanoi", "hanoi__zalo-agent__2026-11-25T120000000");
    const kq = await ghiSnapshotBuu({ baiHomNgay: bai, rootSnapshots: t.root, dirMoi, fetchModule, suffixes: SUFFIX_TEST, tocDo: 1000 });
    assert.equal(kq.maChan, undefined);
    assert.equal(kq.snapshotId, "hanoi__zalo-agent__2026-11-25T120000000");
    assert.equal(kq.soBai, 2);
    assert.equal(kq.taiDuoc, 1, "chỉ /jpg/ tải lại được qua fallback");
    assert.ok(!existsSync(join(t.root, "hanoi", ".hanoi__zalo-agent__2026-11-25T120000000.partial")), "không sót thư mục tạm");

    // manifest: khai items + media, sha256 đúng
    const manifest = JSON.parse(readFileSync(join(dirMoi, "manifest.json"), "utf8"));
    assert.equal(manifest.schemaVersion, 6);
    assert.equal(manifest.snapshotId, "hanoi__zalo-agent__2026-11-25T120000000");
    assert.equal(manifest.city, "hanoi");
    assert.equal(manifest.source, "zalo-agent");
    const ten = manifest.files.map((f) => f.name);
    assert.ok(ten.includes("items-0001.json.gz"));
    const mediaKhai = manifest.files.filter((f) => f.name.startsWith("media/"));
    assert.equal(mediaKhai.length, 2, "ảnh sống chép + ảnh fallback tải mới");
    for (const f of manifest.files) {
      const buf = readFileSync(join(dirMoi, f.name));
      assert.equal(createHash("sha256").update(buf).digest("hex"), f.sha256, `sha khớp ${f.name}`);
    }
    // bytes ảnh sống = đúng bytes gốc
    assert.ok(manifest.files.find((f) => f.name === "media/cu-song.jpg"), "ảnh sống được chép sang snapshot mới cùng tên");

    // items: mediaFiles ĐỦ theo thứ tự payload.media, entry sống KHÔNG còn snapshotId cũ
    const items = JSON.parse(gunzipSync(readFileSync(join(dirMoi, "items-0001.json.gz"))).toString());
    assert.equal(items.length, 2);
    const p1 = items.find((x) => x.sourceId === "p1");
    assert.deepEqual(
      p1.meta.mediaFiles.map((e) => e.url),
      p1.payload.media.map((m) => m.url),
      "đúng thứ tự payload.media",
    );
    assert.ok(p1.meta.mediaFiles[0].file, "ảnh sống có file");
    assert.equal(p1.meta.mediaFiles[0].snapshotId, undefined, "không giữ snapshotId cũ — bộ nạp sẽ đóng dấu mới");
    assert.ok(p1.meta.mediaFiles[1].file, "ảnh /jpg/400 tải lại có file");
    assert.equal(p1.meta.mediaFiles[1].error, undefined);
    const p2 = items.find((x) => x.sourceId === "p2");
    assert.equal(p2.meta.mediaFiles[0].error, "http-404", "404 giữ nguyên");
    assert.equal(p2.meta.mediaFiles[0].file, undefined);
    // payload nguyên văn: media trả lại ĐỦ danh sách gốc (không chỉ url cần tải)
    assert.equal(p1.payload.media.length, 2);
  } finally {
    t.srv.close();
    rmSync(t.home, { recursive: true, force: true });
  }
});

test("ghiSnapshotBuu: gặp http-403 dừng HẲN — không ghi snapshot, dọn thư mục tạm, báo maChan", { skip: !CO_DIST && "cần collector dist đã build" }, async () => {
  const t = await moiTruong();
  try {
    const bai = [
      {
        postId: "p9",
        snapshotId: t.snapshotCu,
        payload: {
          group: "g",
          author: "h",
          text: "t",
          senderName: null,
          senderId: null,
          conversationId: null,
          media: [{ path: null, url: `${t.base}/cham.jpg`, type: "image/jpeg" }],
          agent_id: "a",
        },
        postedAt: NGAY_HN,
        mediaFiles: [{ url: `${t.base}/cham.jpg`, error: "redirect-host" }],
      },
    ];
    const dirMoi = join(t.root, "hanoi", "hanoi__zalo-agent__2026-11-25T130000000");
    const kq = await ghiSnapshotBuu({ baiHomNgay: bai, rootSnapshots: t.root, dirMoi, fetchModule, suffixes: SUFFIX_TEST, tocDo: 1000 });
    assert.match(kq.maChan, /http-403/);
    assert.equal(existsSync(dirMoi), false, "không ghi snapshot khi bị chặn");
    assert.equal(existsSync(join(t.root, "hanoi", ".hanoi__zalo-agent__2026-11-25T130000000.partial")), false, "thư mục tạm được dọn");
  } finally {
    t.srv.close();
    rmSync(t.home, { recursive: true, force: true });
  }
});

test("cheAnhSong: lệch sha256 → trả null (rơi xuống tải lại); thiếu file → null", { skip: !CO_DIST && "cần collector dist đã build" }, async () => {
  const t = await moiTruong();
  try {
    const ghi = [];
    const ghiFile = async (name, bytes) => {
      ghi.push(name);
      return { sha256: "x", bytes: bytes.length };
    };
    const lech = { url: "u", file: "media/cu-song.jpg", sha256: "sai", bytes: A.bytes.length, snapshotId: t.snapshotCu };
    assert.equal(await chepAnhSong(lech, t.root, ghiFile), null);
    const thieuFile = { url: "u", file: "media/khong-co.jpg", sha256: A.sha, bytes: 1, snapshotId: t.snapshotCu };
    assert.equal(await chepAnhSong(thieuFile, t.root, ghiFile), null);
    const du = { url: "u", file: "media/cu-song.jpg", sha256: A.sha, bytes: A.bytes.length, snapshotId: t.snapshotCu };
    const kq = await chepAnhSong(du, t.root, ghiFile);
    assert.equal(kq.file, "media/cu-song.jpg");
    assert.equal(kq.snapshotId, undefined);
  } finally {
    t.srv.close();
    rmSync(t.home, { recursive: true, force: true });
  }
});

