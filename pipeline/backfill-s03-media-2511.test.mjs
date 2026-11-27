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
import { gzipSync, gunzipSync } from "node:zlib";
import { entryCua, docSuffixes, chepAnhSong, ghiSnapshotBuu, sapXepReplay } from "./backfill-s03-media-2511.mjs";

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
    assert.equal(kq.soBai, 1, "bài chỉ-toàn-404 không được viết (giữ nguyên trong stg)");
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

    // items: chỉ bài có url phải tải; mediaFiles ĐỦ theo thứ tự payload.media, entry sống KHÔNG còn snapshotId cũ
    const items = JSON.parse(gunzipSync(readFileSync(join(dirMoi, "items-0001.json.gz"))).toString());
    assert.equal(items.length, 1, "p2 toàn-404 không vào snapshot");
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

test("ghiSnapshotBuu: 403 ở url ĐẦU của bài nhiều ảnh → đúng 1 lời gọi, không gọi tiếp host vừa chặn", { skip: !CO_DIST && "cần collector dist đã build" }, async () => {
  const t = await moiTruong();
  t.srv.close(); // đóng server mặc định — thay bằng server ĐẾM lời gọi
  const dem = { goi: 0 };
  const srv = createServer((req, res) => {
    dem.goi += 1;
    if (req.url === "/m1.jpg") { res.writeHead(403, { "content-type": "text/plain" }); res.end("forbidden"); }
    else { res.writeHead(200, { "content-type": "image/jpeg" }); res.end(Buffer.from("anh-moi-" + req.url)); }
  });
  await new Promise((done) => srv.listen(0, "127.0.0.1", done));
  const base = `http://127.0.0.1:${srv.address().port}`;
  try {
    const bai = [{
      postId: "p-chan-nhieu-anh",
      snapshotId: t.snapshotCu,
      payload: { group: "g", author: "h", text: "t", senderName: null, senderId: null, conversationId: null,
        media: [
          { path: null, url: `${base}/m1.jpg`, type: "image/jpeg" }, // bị 403 — url còn lại KHÔNG được gọi nữa
          { path: null, url: `${base}/m2.jpg`, type: "image/jpeg" },
          { path: null, url: `${base}/m3.jpg`, type: "image/jpeg" },
        ], agent_id: "a" },
      postedAt: NGAY_HN,
      mediaFiles: [], // cả ba url đều phải tải
    }];
    const dirMoi = join(t.root, "hanoi", "hanoi__zalo-agent__2026-11-25T220000000");
    const kq = await ghiSnapshotBuu({ baiHomNgay: bai, rootSnapshots: t.root, dirMoi, fetchModule, suffixes: SUFFIX_TEST, tocDo: 1000 });
    assert.match(kq.maChan, /http-403/);
    assert.equal(dem.goi, 1, `sau mã chặn đầu tiên KHÔNG còn lời gọi nào tới host (đỏ trên 2f0865de9: gọi ${dem.goi})`);
    assert.equal(existsSync(dirMoi), false, "bị chặn → không ghi snapshot");
  } finally {
    srv.close();
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


// ─── Cổng ZC20 (claudedp-2511-52/53) ───

test("(2) raw bất biến: snapshot gốc (tệp + manifest) giữ nguyên băm trước/sau một lượt bù", { skip: !CO_DIST && "cần collector dist đã build" }, async () => {
  const t = await moiTruong();
  try {
    // snapshot gốc: manifest + 1 ảnh sống — sẽ được chepAnhSong ĐỌC trong lượt bù
    const snapshotCu = join(t.root, "hanoi", t.snapshotCu);
    writeFileSync(join(snapshotCu, "manifest.json"), JSON.stringify({ snapshotId: t.snapshotCu, ghiChu: "goc" }));
    const bam = (dir) =>
      readdirSync(dir, { recursive: true }).flatMap((f) => {
        const p = join(dir, f);
        try {
          return [[f, createHash("sha256").update(readFileSync(p)).digest("hex")]];
        } catch {
          return [];
        }
      }).sort();
    const truoc = bam(snapshotCu);

    const bai = [{
      postId: "p-raw",
      snapshotId: t.snapshotCu,
      payload: { group: "g", author: "h", text: "t", senderName: null, senderId: null, conversationId: null,
        media: [
          { path: null, url: `${t.base}/song-goc.jpg`, type: "image/jpeg" }, // sống ở snapshot gốc — entry hợp lệ → chép, KHÔNG gọi CDN
          { path: null, url: `${t.base}/jpg/broken.jpg`, type: "image/jpeg" }, // nhóm /jpg/ 400 — bỏ qua, không đốt lượt
        ], agent_id: "a" },
      postedAt: NGAY_HN,
      mediaFiles: [
        { url: `${t.base}/song-goc.jpg`, file: "media/cu-song.jpg", sha256: A.sha, bytes: A.bytes.length, snapshotId: t.snapshotCu },
        { url: `${t.base}/jpg/broken.jpg`, error: "http-400" },
      ],
    }];
    const dirMoi = join(t.root, "hanoi", "hanoi__zalo-agent__2026-11-25T200000000");
    const kq = await ghiSnapshotBuu({ baiHomNgay: bai, rootSnapshots: t.root, dirMoi, fetchModule, suffixes: SUFFIX_TEST, tocDo: 1000 });
    assert.equal(kq.taiDuoc, 1);
    // ĐỐI CHỨNG DƯƠNG (AC-4 — findings round 1): bước chép PHẢI chạy thật và chạm snapshot gốc
    assert.equal(kq.soChep, 1, "đúng một ảnh chép từ snapshot gốc (đỏ trên 2f0865de9: chưa có số đếm)");
    const manifest = JSON.parse(readFileSync(join(dirMoi, "manifest.json"), "utf8"));
    assert.ok(manifest.files.some((f) => f.sha256 === A.sha), "manifest snapshot bù phải chứa ảnh chép từ snapshot gốc");
    // đối chứng dương đứng rồi mới khẳng định âm tính: snapshot gốc nguyên băm
    assert.deepEqual(bam(snapshotCu), truoc, "snapshot gốc phải nguyên băm sau lượt bù");
    assert.equal(readFileSync(join(snapshotCu, "manifest.json"), "utf8"), JSON.stringify({ snapshotId: t.snapshotCu, ghiChu: "goc" }));
  } finally {
    t.srv.close();
    rmSync(t.home, { recursive: true, force: true });
  }
});

test("(3) trần lời gọi chặn TRƯỚC khi phát: không cửa sổ nào vượt tocDo", { skip: !CO_DIST && "cần collector dist đã build" }, async () => {
  const t = await moiTruong();
  const lucGoi = [];
  t.srv.close(); // đóng server mặc định — thay bằng server đếm giờ gọi
  const srv = createServer((req, res) => {
    lucGoi.push(Date.now());
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("gone");
  });
  await new Promise((done) => srv.listen(0, "127.0.0.1", done));
  const base = `http://127.0.0.1:${srv.address().port}`;
  try {
    const bai = [{
      postId: "p-tran",
      snapshotId: t.snapshotCu,
      payload: { group: "g", author: "h", text: "t", senderName: null, senderId: null, conversationId: null,
        media: Array.from({ length: 9 }, (_, i) => ({ path: null, url: `${base}/c${i}.jpg`, type: "image/jpeg" })), agent_id: "a" },
      postedAt: NGAY_HN,
      mediaFiles: [], // mọi url đều phải tải
    }];
    const dirMoi = join(t.root, "hanoi", "hanoi__zalo-agent__2026-11-25T210000000");
    const batDau = Date.now();
    await ghiSnapshotBuu({ baiHomNgay: bai, rootSnapshots: t.root, dirMoi, fetchModule, suffixes: SUFFIX_TEST, tocDo: 3, cuaSoMs: 400 });
    assert.equal(lucGoi.length, 9);
    const cuaSoMs = 400;
    // cửa sổ TRƯỢT: với mỗi lời, đếm số lời trong [t, t+cuaSoMs) — không vượt tocDo
    let maxCua = 0;
    for (const luc of lucGoi) {
      maxCua = Math.max(maxCua, lucGoi.filter((x) => x >= luc && x < luc + cuaSoMs).length);
    }
    assert.ok(maxCua <= 3, `cửa sổ trượt 400ms không quá 3 lời — thấy ${maxCua} (${JSON.stringify(lucGoi)})`);
  } finally {
    srv.close();
    rmSync(t.home, { recursive: true, force: true });
  }
});

test("(c) dừng mềm giữa bài: bài chưa xong bị BỎ — không bao giờ ghi entry null, dọn thư mục tạm", { skip: !CO_DIST && "cần collector dist đã build" }, async () => {
  const t = await moiTruong();
  t.srv.close();
  const srv = createServer((req, res) => {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("gone");
  });
  await new Promise((done) => srv.listen(0, "127.0.0.1", done));
  const base = `http://127.0.0.1:${srv.address().port}`;
  try {
    const bai = [{
      postId: "p-cut",
      snapshotId: t.snapshotCu,
      payload: { group: "g", author: "h", text: "t", senderName: null, senderId: null, conversationId: null,
        media: Array.from({ length: 9 }, (_, i) => ({ path: null, url: `${base}/c${i}.jpg`, type: "image/jpeg" })), agent_id: "a" },
      postedAt: NGAY_HN,
      mediaFiles: [],
    }];
    const dirMoi = join(t.root, "hanoi", "hanoi__zalo-agent__2026-11-25T220000000");
    const denGio = new Date(Date.now() + 200).toISOString(); // cắt giữa bài (trần 3/400ms → bài cần ~1,2s)
    const kq = await ghiSnapshotBuu({ baiHomNgay: bai, rootSnapshots: t.root, dirMoi, fetchModule, suffixes: SUFFIX_TEST, tocDo: 3, cuaSoMs: 400, denGio });
    assert.equal(kq.snapshotId, null, "bài bị cắt giữa không được ghi snapshot");
    assert.equal(existsSync(dirMoi), false);
    assert.equal(existsSync(join(t.root, "hanoi", ".hanoi__zalo-agent__2026-11-25T220000000.partial")), false, "thư mục tạm được dọn");
  } finally {
    srv.close();
    rmSync(t.home, { recursive: true, force: true });
  }
});

test("sapXepReplay: snapshot bù (coverage.loai=tai-bu-anh-2511) luôn phase cuối, mỗi nhóm giữ thứ tự tên", async () => {
  const home = mkdtempSync(join(tmpdir(), "replay-"));
  const goc = join(home, "snapshots", "hanoi");
  const ten = [
    "hanoi__zalo-agent__2026-11-21T143738670", // bù (đã ghi 25/11)
    "hanoi__zalo-agent__2026-11-21T190000000", // gốc cùng ngày — tên MUỘN hơn bù
    "hanoi__zalo-agent__2026-11-22T140520119", // bù
    "hanoi__zalo-agent__2026-11-22T193000000", // gốc
    "hanoi__zalo-agent__2026-11-25T125516859", // bù
  ];
  for (const [i, d] of ten.entries()) {
    mkdirSync(join(goc, d), { recursive: true });
    const laBuu = i % 2 === 0;
    writeFileSync(join(goc, d, "manifest.json"), JSON.stringify({
      snapshotId: d,
      coverage: laBuu ? { loai: "tai-bu-anh-2511" } : { discovered: 1 },
    }));
  }
  const thuTu = await sapXepReplay(ten.map((d) => join(goc, d)));
  assert.deepEqual(
    thuTu.map((d) => d.split("/").pop()),
    [
      "hanoi__zalo-agent__2026-11-21T190000000",
      "hanoi__zalo-agent__2026-11-22T193000000",
      "hanoi__zalo-agent__2026-11-21T143738670",
      "hanoi__zalo-agent__2026-11-22T140520119",
      "hanoi__zalo-agent__2026-11-25T125516859",
    ],
    "gốc trước (theo tên), cả ba snapshot bù phase cuối",
  );
  // thiếu manifest → nhóm thường, không nổ
  mkdirSync(join(goc, "hanoi__zalo-agent__2026-11-20T000000000"), { recursive: true });
  const thuTu2 = await sapXepReplay([join(goc, "hanoi__zalo-agent__2026-11-20T000000000"), ...thuTu]);
  assert.equal(thuTu2[0].split("/").pop(), "hanoi__zalo-agent__2026-11-20T000000000");
  rmSync(home, { recursive: true, force: true });
});

test("(1) nạp lại raw theo thứ tự tên vẫn giữ ảnh đã bù (tên bù theo giờ chạy xếp sau chót)", { skip: !process.env.DATABASE_URL && "cần DATABASE_URL (npm test pipeline cấp DB riêng lượt)" }, async () => {
  // Ngoài-3 ZC20 (Mạnh «nâng phạm vi sửa ngay», 27/11): ca này nạp và XOÁ dòng — chỉ chạy trên DB thử oneinvest_suite_*,
  // từ chối TRƯỚC mọi kết nối khi DATABASE_URL trỏ DB khác (cùng họ sự cố 21/11). Chốt chung: lib/db-thu-chot.mjs.
  const { lyDoTuChoi } = await import("./lib/db-thu-chot.mjs");
  const lyDo = lyDoTuChoi(process.env.DATABASE_URL);
  if (lyDo) assert.fail(`(1) từ chối — ${lyDo}; ca có lệnh xoá chỉ chạy trên DB thử (db/db-thu.sh oneinvest_suite_<bộ> --chay)`);
  const { execFileSync } = await import("node:child_process");
  const pg = (await import("pg")).default;
  const pid = `buu-test-${Date.now()}`;
  const home = mkdtempSync(join(tmpdir(), "buu-replay-"));
  const root = join(home, "snapshots", "hanoi");
  // ảnh của bản bù
  const anhBuu = Buffer.from("anh-da-bu");
  const shaBuu = createHash("sha256").update(anhBuu).digest("hex");
  const viet = (dir, items) => {
    mkdirSync(dir, { recursive: true });
    const gz = gzipSync(Buffer.from(JSON.stringify(items), "utf8"));
    writeFileSync(join(dir, "items-0001.json.gz"), gz);
    const files = [{ name: "items-0001.json.gz", sha256: createHash("sha256").update(gz).digest("hex"), bytes: gz.length }];
    if (items[0].meta?.mediaFiles?.[0]?.file) {
      mkdirSync(join(dir, dirname(items[0].meta.mediaFiles[0].file)), { recursive: true });
      writeFileSync(join(dir, items[0].meta.mediaFiles[0].file), anhBuu);
      files.push({ name: items[0].meta.mediaFiles[0].file, sha256: shaBuu, bytes: anhBuu.length });
    }
    writeFileSync(join(dir, "manifest.json"), JSON.stringify({
      schemaVersion: 6, snapshotId: dir.split("/").pop(), city: "hanoi", source: "zalo-agent",
      startedAt: NGAY_HN, finishedAt: NGAY_HN, counts: { items: 1, failed: 0 }, coverage: {}, files,
    }));
  };
  const item = (mediaFiles) => ({
    source: "zalo-agent", sourceId: pid, fetchedAt: NGAY_HN,
    payload: { group: "g", author: "h", text: "t", senderName: null, senderId: null, conversationId: null,
      media: [{ path: null, url: "http://u/a.jpg", type: "image/jpeg" }], agent_id: "a" },
    meta: { mediaFiles },
  });
  // bản GỐC (tên 21/11, entry lỗi) và bản BÙ (tên 25/11 kiểu giờ chạy — xếp SAU CHÓT)
  const goc = join(root, "hanoi__zalo-agent__2026-11-21T190000000");
  const buu = join(root, "hanoi__zalo-agent__2026-11-25T100000000");
  viet(goc, [item([{ url: "http://u/a.jpg", error: "http-400" }])]);
  viet(buu, [item([{ url: "http://u/a.jpg", file: "media/buu.jpg", sha256: shaBuu, bytes: anhBuu.length }])]);

  const napor = (dir) =>
    execFileSync(process.execPath, [join(GOC, "pipeline", "import-airbnb.mjs"), dir], {
      encoding: "utf8", cwd: GOC + "/pipeline",
      env: { ...process.env }, // DATABASE_URL của lượt test
    });
  try {
    // nạp lại raw ĐÚNG THỨ TỰ TÊN, chạy HAI LƯỢT (giả lập replay trọn vẹn)
    for (let luot = 0; luot < 2; luot += 1) napor(goc), napor(buu);
    const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await c.connect();
    const { rows } = await c.query("SELECT media_files FROM stg_zalo_posts WHERE post_id = $1", [pid]);
    await c.query("DELETE FROM stg_zalo_posts WHERE post_id = $1", [pid]);
    await c.query("DELETE FROM airbnb_snapshots WHERE snapshot_id IN ($1, $2)", [goc.split("/").pop(), buu.split("/").pop()]);
    await c.end();
    assert.equal(rows.length, 1);
    const mf = rows[0].media_files[0];
    assert.equal(mf.error, undefined, "ảnh bù phải còn nguyên sau replay theo thứ tự tên");
    assert.match(mf.file, /media\/buu\.jpg/);
    assert.equal(mf.snapshotId, "hanoi__zalo-agent__2026-11-25T100000000");
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
