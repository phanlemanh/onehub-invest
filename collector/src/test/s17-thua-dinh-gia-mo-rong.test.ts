import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { appendFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ngayKyCuaLink, projectCatalog, projectImages, readKind } from "../collectors/s17-thua-dinh-gia/catalog.js";
import { duoiCua, hostDuocPhep, phanLoiPhanHoi, tenTepCua } from "../collectors/s17-thua-dinh-gia/anh.js";
import { NhatKyTienDo } from "../collectors/s17-thua-dinh-gia/tien-do.js";
import { makeItem } from "../collectors/s17-thua-dinh-gia/kinds.js";
import { BatchWriter, S17_SCHEMA_VERSION, S17_SCHEMA_VERSION_MO_RONG } from "../collectors/s17-thua-dinh-gia/store.js";

/**
 * S17 mốc mở rộng (claudedp-2411-73, Mạnh chốt 25/11): căn và chi tiết căn của TOÀN BỘ dự án có bảng căn, và
 * TOÀN BỘ ảnh dự án vào kho chuẩn. Nền của mốc: trình ghi snapshot nhận tệp nhị phân (quy ước media/* +
 * meta.mediaFiles của DATA-CONTRACT), đọc kho theo manifest, nhật ký tiến độ chỉ-ghi-thêm (trạng thái lưu nguyên
 * khối không chịu nổi khoảng 650.000 căn), và các hàm thuần của pha ảnh. Dữ liệu GIẢ, máy chủ .test.
 */

const withTmp = async (fn: (dir: string) => Promise<void>): Promise<void> => {
  const dir = await mkdtemp(join(tmpdir(), "s17-morong-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

const sha = (b: Buffer): string => createHash("sha256").update(b).digest("hex");

// ---------- trình ghi: tệp nhị phân ----------

test("BatchWriter.addWithFiles: ảnh gốc nằm trong thư mục snapshot dưới media/, manifest khai sha256 và số byte, item đi cùng lô", async () => withTmp(async (dir) => {
  const w = new BatchWriter({ root: dir, maxItems: 10, phase: "images", schemaVersion: S17_SCHEMA_VERSION_MO_RONG });
  const anh = Buffer.from(`ffd8ffe0${"00".repeat(20)}`, "hex");
  const item = makeItem(
    "anh_du_an",
    "du-an-7-anh-1",
    { media: [{ url: "https://cdn.gia.test/a" }] },
    { request: { duAn: "7" }, mediaFiles: [{ url: "https://cdn.gia.test/a", file: "media/abc.jpg", sha256: sha(anh), bytes: anh.length }] },
    "2026-11-25T00:00:00.000Z",
  );
  await w.addWithFiles(item, [{ name: "media/abc.jpg", bytes: anh }]);
  assert.equal(w.pendingCount, 1);
  assert.equal(w.pendingFiles, 1, "ảnh chờ chốt cùng lô");
  const id = (await w.flush()) as string;
  const manifest = JSON.parse(await readFile(join(dir, "vn", id, "manifest.json"), "utf8"));
  assert.equal(manifest.schemaVersion, 18, "mốc mở rộng ghi phiên bản 18");
  const mf = manifest.files.find((f: { name: string }) => f.name === "media/abc.jpg");
  assert.equal(mf.sha256, sha(anh));
  assert.equal(mf.bytes, anh.length);
  assert.deepEqual(await readFile(join(dir, "vn", id, "media/abc.jpg")), anh, "ảnh gốc nguyên vẹn");
  assert.equal(manifest.coverage.methods.anh_du_an, 1);
  assert.equal(w.pendingFiles, 0);
  assert.equal(w.pendingCount, 0);
}));

test("BatchWriter.addWithFiles: đủ số tệp thì chốt ngay (ảnh không nằm lâu trong bộ nhớ); mặc định vẫn là phiên bản 17", async () => withTmp(async (dir) => {
  const w = new BatchWriter({ root: dir, maxItems: 10, phase: "images", maxFiles: 2 });
  const anh = Buffer.from([1, 2, 3]);
  await w.addWithFiles(makeItem("anh_du_an", "du-an-7-anh-1", {}, {}, "2026-11-25T00:00:00.000Z"), [
    { name: "media/a.jpg", bytes: anh },
    { name: "media/b.jpg", bytes: anh },
  ]);
  assert.equal(w.snapshotIds.length, 1, "hai tệp đủ ngưỡng hai tệp một snapshot");
  const manifest = JSON.parse(await readFile(join(dir, "vn", w.snapshotIds[0], "manifest.json"), "utf8"));
  assert.equal(manifest.schemaVersion, S17_SCHEMA_VERSION);
  assert.equal(manifest.files.filter((f: { name: string }) => f.name.startsWith("media/")).length, 2);
  assert.equal(manifest.counts.items, 1, "item bảng đối chiếu đi cùng");
}));

// ---------- đọc kho theo manifest ----------

const chiTiet = (id: string, props: Record<string, unknown>, gallery: unknown, at: string) =>
  makeItem(
    "du_an_detail",
    `du-an-${id}`,
    { detail: { status: true, message: null, data: { id, estate_type: "du_an", properties: { id, ...props } }, pagination: null, extra: {} }, filterOptions: null, gallery },
    { request: { id }, coBangCan: props.is_exists_apartment_info === true },
    at,
  );

test("projectCatalog: lấy bản MỚI NHẤT của mỗi dự án theo fetchedAt, chỉ dự án có bảng căn, xếp theo số căn nguồn khai từ lớn xuống nhỏ", async () => withTmp(async (dir) => {
  const w1 = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  await w1.add(chiTiet("7", { is_exists_apartment_info: false, danh_sach_thap: [], so_can: 0 }, null, "2026-11-24T01:00:00.000Z"));
  await w1.add(makeItem("static_config", "static-a", {}, { congKhai: true }, "2026-11-24T01:00:00.000Z"));
  await w1.flush();
  const w2 = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  await w2.add(chiTiet("7", { is_exists_apartment_info: true, danh_sach_thap: ["B", "A"], so_can: "2.432" }, null, "2026-11-24T05:00:00.000Z"));
  await w2.add(chiTiet("8", { is_exists_apartment_info: true, danh_sach_thap: ["A"], so_can: 9000 }, null, "2026-11-24T05:00:00.000Z"));
  await w2.add(chiTiet("9", { is_exists_apartment_info: true, danh_sach_thap: [], so_can: 5 }, null, "2026-11-24T05:00:00.000Z"));
  await w2.add(chiTiet("10", { is_exists_apartment_info: false, danh_sach_thap: ["A"], so_can: 9999 }, null, "2026-11-24T05:00:00.000Z"));
  await w2.flush();

  const ds = await projectCatalog(dir);
  assert.deepEqual(
    ds.map((d) => [d.id, d.soCan, d.toa]),
    [
      ["8", 9000, ["A"]],
      ["7", 2432, ["B", "A"]],
      ["9", 5, []],
    ],
    "dự án 7 lấy bản sau (có bảng căn); dự án 10 không có bảng căn nên bỏ; dự án 9 giữ lại dù không có tên toà (pha tự ghi nhận)",
  );
}));

test("projectImages: gom mọi URL ảnh theo thứ tự gặp kèm tên nhóm và cờ máy chủ ngoài; URL trùng chỉ một lần; địa chỉ nội bộ bị bỏ; dự án có link ký sớm nhất đứng trước", async () => withTmp(async (dir) => {
  const w = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  const ky = (ngay: string, p: string) => `https://cdn.gia.test/p/${p}?X-Amz-Date=${ngay}T000000Z&X-Amz-Signature=abc`;
  await w.add(
    anh(
      "8",
      {
        is_exists_apartment_info: true,
        danh_sach_thap: ["A"],
        danh_sach_hinh_anh: [{ photo_url: "https://img.ngoai.test/x.jpg)." }],
        mo_ta: '<p>minh hoạ <img src="' + ky("20261124", "3") + '">&nbsp;<img src="http://127.0.0.1/noi-bo/anh"></p>',
      },
      {
        status: true,
        data: [
          { id: 1, name: "Mặt bằng", photos: [[{ value: ky("20261124", "1") }]] },
          { id: 2, name: "Thực tế", albums: [{ photos: [[{ value: ky("20261119", "2") }, { value: ky("20261124", "1") + "&amp;" }]] }] },
        ],
      },
      "2026-11-24T05:00:00.000Z",
    ),
  );
  await w.add(anh("9", { is_exists_apartment_info: true, danh_sach_thap: ["A"] }, { data: [{ id: 3, name: "Toàn cảnh", photos: [[{ value: ky("20261126", "9") }]] }] }, "2026-11-24T05:00:00.000Z"));
  await w.add(anh("11", { is_exists_apartment_info: false }, null, "2026-11-24T05:00:00.000Z"));
  await w.flush();

  const kq = await projectImages(dir, ["cdn.gia.test"]);
  const viet = (d: (typeof kq.duAn)[number]) => [d.id, d.anh.map((a) => [a.url.includes("/p/2") ? "2" : a.url.includes("/p/1") ? "1" : a.url.includes("/p/3") ? "3" : a.url.includes("ngoai") ? "ngoai" : "9", a.nhom, a.ngayKy, a.ngoai])];
  assert.deepEqual(
    kq.duAn.map(viet),
    [
      ["8", [["1", ["Mặt bằng", "Thực tế"], "20261124", false], ["2", ["Thực tế"], "20261119", false], ["ngoai", [], null, true], ["3", [], "20261124", false]]],
      ["9", [["9", ["Toàn cảnh"], "20261126", false]]],
    ],
    "dự án 8 đứng trước dự án 9 vì có link ký sớm hơn (hết hạn sớm hơn); URL 1 gặp hai nhóm (một lần có thực thể &amp; ở đuôi) nhưng chỉ một lần; dấu câu dính đuôi được bỏ; thứ tự theo chỗ gặp trong payload",
  );
  assert.equal(kq.soUrlNgoai, 1, "một URL ở máy chủ ngoài, được đánh dấu chứ không bỏ");
  assert.equal(kq.soUrlCam, 1, "URL ở địa chỉ nội bộ bị bỏ, không bao giờ tải");
  assert.equal(kq.soUrl, 5, "bốn URL của dự án 8 và một của dự án 9");
}));

test("readKind: bỏ snapshot không mang dấu hiệu khuôn 2 và snapshot không khai kind; tệp bị sửa thì từ chối", async () => withTmp(async (dir) => {
  const w = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  await w.add(chiTiet("7", { is_exists_apartment_info: true, danh_sach_thap: ["A"], so_can: 1 }, null, "2026-11-24T05:00:00.000Z"));
  await w.flush();
  const cu = join(dir, "vn", "vn__s17-thua-dinh-gia__20261124T010000000");
  await mkdir(cu, { recursive: true });
  await writeFile(
    join(cu, "manifest.json"),
    JSON.stringify({ schemaVersion: 17, snapshotId: "x", coverage: { notes: ["khuôn 1"], methods: { du_an_detail: 1 } }, files: [] }),
  );
  assert.equal((await readKind(dir, "du_an_detail")).length, 1, "snapshot khuôn 1 không được đọc");
  // Sửa một byte trong tệp items của snapshot thật → sha256 lệch → từ chối, không đọc mò.
  const that = join(dir, "vn", w.snapshotIds[0]);
  const tep = (await readdir(that)).find((x) => x.startsWith("items-")) as string;
  const buf = Buffer.from(await readFile(join(that, tep)));
  buf[buf.length - 1] ^= 0xff;
  await writeFile(join(that, tep), buf);
  await assert.rejects(readKind(dir, "du_an_detail"), /sha256/);
}));

// ---------- hàm thuần của pha ảnh ----------

test("ảnh: đặt tên theo băm URL (cùng URL = cùng tệp), đuôi theo kiểu nội dung; link hết hạn khác bị chặn", () => {
  const u = "https://cdn.gia.test/a/b/c?X-Amz-Date=20261124T000000Z";
  assert.equal(tenTepCua(u, duoiCua("image/jpeg", u)), `media/${sha(Buffer.from(u)).slice(0, 16)}.jpg`);
  assert.equal(duoiCua(undefined, "https://cdn.gia.test/x.png?response-content-type=image%2Fpng"), ".png");
  assert.equal(duoiCua("image/webp", "https://cdn.gia.test/x"), ".webp");
  assert.equal(duoiCua("application/octet-stream", "https://cdn.gia.test/x"), ".bin", "không đoán là jpg");
  assert.equal(ngayKyCuaLink(u), "20261124", "ngày ký của link có chữ ký");
  assert.equal(ngayKyCuaLink("https://cdn.gia.test/x.jpg"), null);
  assert.equal(hostDuocPhep("https://a.cdn.gia.test/x", ["cdn.gia.test"]), true);
  assert.equal(hostDuocPhep("https://notcdn.gia.test/x", ["cdn.gia.test"]), false, "phải khớp đúng đuôi theo từng đoạn");
  assert.equal(phanLoiPhanHoi(403, "application/xml", "<Error><Code>AccessDenied</Code><Message>Request has expired</Message></Error>"), "het-han");
  assert.equal(phanLoiPhanHoi(403, "application/xml", "<Error><Code>SignatureDoesNotMatch</Code></Error>"), "sai-chu-ky");
  assert.equal(phanLoiPhanHoi(403, "application/xml", "<Error><Code>AccessDenied</Code></Error>"), "chan");
  assert.equal(phanLoiPhanHoi(429, "text/html", ""), "chan");
  assert.equal(phanLoiPhanHoi(404, "application/xml", "<Error><Code>NoSuchKey</Code></Error>"), "khong-con");
  assert.equal(phanLoiPhanHoi(200, "image/jpeg", ""), "ok");
  assert.equal(phanLoiPhanHoi(500, "text/html", ""), "loi");
});

// ---------- nhật ký tiến độ chỉ-ghi-thêm ----------

test("NhatKyTienDo: ghi thêm từng dòng, đọc lại đúng thứ tự; dòng cuối bị cụt (gãy giữa chừng) được bỏ qua, dòng hỏng giữa tệp thì báo", async () => withTmp(async (dir) => {
  const duong = join(dir, "con", "du-an-7.jsonl");
  const nhatKy = new NhatKyTienDo(duong);
  assert.deepEqual(await nhatKy.readAll(), [], "chưa có tệp: tiến độ rỗng");
  await nhatKy.append({ a: 1 });
  await nhatKy.append({ a: 2, b: "x" });
  assert.deepEqual(await new NhatKyTienDo(duong).readAll(), [{ a: 1 }, { a: 2, b: "x" }]);
  await appendFile(duong, '{"a":3', "utf8");
  assert.deepEqual(await new NhatKyTienDo(duong).readAll(), [{ a: 1 }, { a: 2, b: "x" }], "dòng cuối cụt bị bỏ");
  // Sau một dòng cụt, ghi thêm phải xuống dòng trước — nếu không, bản mới dính vào dòng hỏng và mất, lượt sau lỗi luôn.
  await new NhatKyTienDo(duong).append({ a: 30 });
  assert.deepEqual(await new NhatKyTienDo(duong).readAll(), [{ a: 1 }, { a: 2, b: "x" }, { biCat: true, goc: '{"a":3' }, { a: 30 }], "mảnh cụt được thay bằng bản ghi «bị cắt», bản mới không dính vào dòng hỏng");
  await appendFile(duong, '}\n{"a":4}\n{"hong\n{"a":5}\n', "utf8");
  await assert.rejects(new NhatKyTienDo(duong).readAll(), /dòng 5/, "dòng hỏng giữa tệp không được bỏ lặng");
}));

// ---------- pha ảnh ----------

import { gunzipSync } from "node:zlib";
import { loadConfig } from "../collectors/s17-thua-dinh-gia/config.js";
import { RunStopped } from "../collectors/s17-thua-dinh-gia/client.js";
import { emptyState, runPhase, type RunState } from "../collectors/s17-thua-dinh-gia/run.js";
import { KeoDan } from "../collectors/s17-thua-dinh-gia/keo-dan.js";

const FAKE_HOSTS = { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" };
const anh = (id: string, props: Record<string, unknown>, gallery: unknown, at: string) => chiTiet(id, props, gallery, at);

type KetQuaNguon = { status?: number; body?: Buffer | string; kieu?: string } | "mang";

/** Nguồn ảnh giả: trả nội dung theo đường dẫn; ghi lại mọi lời. */
function nguonAnh(tra: (duong: string) => KetQuaNguon | Promise<KetQuaNguon>) {
  const daGoi: string[] = [];
  const fetchImpl = (async (url: string | URL | Request) => {
    const u = String(url);
    const duong = new URL(u).pathname;
    daGoi.push(duong);
    const k = await tra(duong);
    if (k === "mang") throw new TypeError("Failed to fetch");
    const status = k.status ?? 200;
    const than = typeof k.body === "string" ? Buffer.from(k.body) : k.body;
    return new Response(status === 200 ? new Uint8Array(than ?? Buffer.from("anh")) : new Uint8Array(than ?? Buffer.alloc(0)), {
      status,
      headers: { "content-type": status === 200 ? (k.kieu ?? "image/jpeg") : (k.kieu ?? "application/xml") },
    });
  }) as unknown as typeof fetch;
  return { fetchImpl, daGoi };
}

async function docSnapshot(dir: string, id: string) {
  const manifest = JSON.parse(await readFile(join(dir, "vn", id, "manifest.json"), "utf8"));
  const items: Array<{ kind: string; sourceId: string; payload: any; meta: any }> = [];
  for (const f of manifest.files) if (f.name.startsWith("items-")) items.push(...JSON.parse(gunzipSync(await readFile(join(dir, "vn", id, f.name))).toString("utf8")));
  return { manifest, items };
}

const chayAnh = (dir: string, fetchImpl: typeof fetch, o: { soFile?: number; luongSong?: number; caps?: { calls: number; minutes: number }; state?: RunState; chiNgoai?: boolean; now?: string | (() => Date); log?: Record<string, unknown>[]; baoMoiMs?: number } = {}) => {
  const GIO = o.now ?? "2026-11-25T01:00:00.000Z";
  const dongHo = (): Date => (typeof GIO === "function" ? GIO() : new Date(GIO));
  const state = o.state ?? emptyState();
  const w = new BatchWriter({ root: dir, maxItems: 1000, phase: "images", schemaVersion: S17_SCHEMA_VERSION_MO_RONG, maxFiles: o.soFile ?? 2 });
  const log = o.log ?? [];
  const keoDan = new KeoDan({ caps: o.caps ?? { calls: 1000, minutes: 60 }, now: () => dongHo().getTime() });
  const run = () =>
    runPhase({
      phase: "images",
      client: undefined as never,
      writer: w,
      state,
      save: async () => assert.equal(w.pendingCount + w.pendingFiles, 0, "trạng thái chỉ lưu khi lô đã chốt"),
      log: (e) => log.push(e),
      now: dongHo,
      snapshotRoot: dir,
      tienDoDir: join(dir, "tien-do"),
      anh: { dnsLookup: async () => ["1.2.3.4"], ...(o.baoMoiMs ? { baoMoiMs: o.baoMoiMs } : {}), hostSuffixes: ["cdn.gia.test"], chiNgoai: o.chiNgoai ?? false, luongSong: o.luongSong ?? 2, maxBytes: 1024 * 1024, timeoutMs: 5000, userAgent: "oneinvest-collector/1", fetchImpl },
      keoDan,
    }).then(async (s) => {
      await w.flush();
      return { s, log, keoDan };
    });
  return { run, writer: w, keoDan };
};

test("pha ảnh: tải ảnh gốc vào snapshot dưới media/ kèm item bảng đối chiếu, ghi tiến độ; chạy lại không tải lại ảnh đã có", async () => withTmp(async (dir) => {
  const w0 = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  await w0.add(anh("8", { is_exists_apartment_info: false, danh_sach_hinh_anh: [{ photo_url: "https://cdn.gia.test/a/1?X-Amz-Date=20261124T000000Z" }, { photo_url: "https://cdn.gia.test/a/2" }] }, { data: [{ name: "Mặt bằng", photos: [[{ value: "https://cdn.gia.test/a/3" }]] }] }, "2026-11-24T05:00:00.000Z"));
  await w0.add(anh("9", { mo_ta: '<img src="https://img.ngoai.test/x.jpg"><img src="https://cdn.gia.test/b/1.png?response-content-type=image%2Fpng">' }, null, "2026-11-24T05:00:00.000Z"));
  await w0.flush();
  const nguon = nguonAnh((duong) => (duong.endsWith("1.png") ? { body: Buffer.from([0x89, 0x50, 0x4e, 0x47]), kieu: "image/png" } : { body: Buffer.from(`anh ${duong}`) }));
  const lan1 = await chayAnh(dir, nguon.fetchImpl).run();
  assert.equal(lan1.s.so?.soFile, 4, "bốn ảnh của hai dự án");
  assert.equal(lan1.s.so?.soDuAnXong, 2);
  assert.equal(lan1.s.failed, 0, "ảnh ở máy chủ ngoài không tính là lỗi của pha, chỉ ghi lý do");
  const thuMuc = (await readdir(join(dir, "vn"))).filter((x) => x.startsWith("vn__") && x !== w0.snapshotIds[0]).sort();
  const tatCa = [];
  for (const id of thuMuc) tatCa.push({ id, ...(await docSnapshot(dir, id)) });
  const soTep = tatCa.flatMap((x) => x.manifest.files.filter((f: { name: string }) => f.name.startsWith("media/")));
  assert.equal(soTep.length, 4, "bốn tệp ảnh trong kho");
  assert.ok(soTep.every((f: { bytes: number; sha256: string }) => f.bytes > 0 && /^[0-9a-f]{64}$/.test(f.sha256)), "manifest khai sha256 và số byte");
  assert.ok(tatCa.every((x) => x.manifest.schemaVersion === 18));
  const items = tatCa.flatMap((x) => x.items);
  assert.ok(items.every((it) => it.kind === "anh_du_an" && /^du-an-\d+-anh-\d+-\d+$/.test(it.sourceId)), JSON.stringify(items.map((it) => it.sourceId)));
  assert.equal(items.flatMap((it) => it.meta.mediaFiles).some((m: { url: string }) => m.url.includes("ngoai.test")), false, "URL máy chủ ngoài không thuộc lượt ảnh của chính nguồn");
  const png = items.flatMap((it) => it.meta.mediaFiles).find((m: { url: string }) => m.url.endsWith("1.png?response-content-type=image%2Fpng") || m.url.includes("1.png"));
  assert.match(String(png.file), /^media\/[0-9a-f]{16}\.png$/, "đuôi theo kiểu nội dung");
  assert.ok(items.flatMap((it) => it.payload.media).every((m: { url: string; nhom?: string[] }) => typeof m.url === "string" && (m.nhom === undefined || m.nhom.includes("Mặt bằng"))), "payload giữ URL và tên nhóm");
  assert.equal(lan1.s.calls, 4);
  // Chạy lại: mọi ảnh đã có → không gọi nguồn nữa.
  const nguon2 = nguonAnh(() => ({ body: Buffer.from("khong nen bi goi") }));
  const lan2 = await chayAnh(dir, nguon2.fetchImpl).run();
  assert.equal(nguon2.daGoi.length, 0, "ảnh đã tải rồi thì không tải lại");
  assert.equal(lan2.s.so?.soDuAnXong, 0);
}));

test("pha ảnh: lỗi của riêng một tệp (hết hạn, không còn) ghi vào bảng đối chiếu và không tải lại; lỗi mạng thì lượt sau thử lại", async () => withTmp(async (dir) => {
  const w0 = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  await w0.add(anh("8", { danh_sach_hinh_anh: [{ photo_url: "https://cdn.gia.test/het-han" }, { photo_url: "https://cdn.gia.test/khong-con" }, { photo_url: "https://cdn.gia.test/mang-do" }, { photo_url: "https://cdn.gia.test/ok" }] }, null, "2026-11-24T05:00:00.000Z"));
  await w0.flush();
  let doMang = true;
  const nguon = nguonAnh((duong) => {
    if (duong.endsWith("het-han")) return { status: 403, body: "<Error><Code>AccessDenied</Code><Message>Request has expired</Message></Error>" };
    if (duong.endsWith("khong-con")) return { status: 404, body: "<Error><Code>NoSuchKey</Code></Error>" };
    if (duong.endsWith("mang-do")) return doMang ? "mang" : {};
    return {};
  });
  const lan1 = await chayAnh(dir, nguon.fetchImpl).run();
  assert.equal(lan1.keoDan.calls, 4);
  const loi1 = (await new NhatKyTienDo(join(dir, "tien-do", "anh-8.jsonl")).readAll()).flatMap((r) => Object.entries((r.loi ?? {}) as Record<string, string>)).map(([, v]) => v).sort();
  assert.deepEqual(loi1, ["het-han", "khong-con"], "lỗi vĩnh viễn được ghi nhận; lỗi mạng thì chưa");
  doMang = false;
  await chayAnh(dir, nguon.fetchImpl).run();
  const loi2 = (await new NhatKyTienDo(join(dir, "tien-do", "anh-8.jsonl")).readAll()).flatMap((r) => Object.entries((r.loi ?? {}) as Record<string, string>)).map(([, v]) => v).sort();
  assert.deepEqual(loi2, ["het-han", "khong-con"], "lượt sau tải được ảnh lỗi mạng, không thử lại ảnh vĩnh viễn");
  assert.equal(nguon.daGoi.filter((x) => x.endsWith("het-han")).length, 1, "ảnh hết hạn không được hỏi lại");
  assert.equal(nguon.daGoi.filter((x) => x.endsWith("mang-do")).length, 2);
}));

test("pha ảnh: máy chủ ảnh trả 403 (không phải hết hạn) là BỊ CHẶN — phần đã tải được chốt, dừng cả lượt với lý do blocked", async () => withTmp(async (dir) => {
  const w0 = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  await w0.add(anh("8", { danh_sach_hinh_anh: [1, 2, 3, 4, 5].map((i) => ({ photo_url: `https://cdn.gia.test/chan/${i}` })) }, null, "2026-11-24T05:00:00.000Z"));
  await w0.flush();
  const nguon = nguonAnh((duong) => (duong.endsWith("/4") ? { status: 403, body: "<Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>" } : {}));
  const lan = chayAnh(dir, nguon.fetchImpl, { soFile: 5, luongSong: 1 });
  const e = await lan.run().then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped, String(e));
  assert.equal(e.reason, "blocked");
  assert.equal(lan.keoDan.blocks, 1);
  assert.equal(nguon.daGoi.length, 4, "dừng ngay tại tệp bị chặn, không tải tệp kế");
  const daLay = (await new NhatKyTienDo(join(dir, "tien-do", "anh-8.jsonl")).readAll()).flatMap((r) => (r.daTai as string[] | undefined) ?? []);
  assert.equal(daLay.length, 3, "ba ảnh đã tải được chốt và ghi nhận trước khi dừng");
  assert.equal(lan.writer.pendingCount + lan.writer.pendingFiles, 0, "không còn gì dở trong bộ đệm");
}));

test("pha ảnh: nhiều lỗi mạng liền nhau thì dừng cả lượt (network-down), không đổ lỗi nguồn ảnh", async () => withTmp(async (dir) => {
  const w0 = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  await w0.add(anh("8", { danh_sach_hinh_anh: Array.from({ length: 12 }, (_, i) => ({ photo_url: `https://cdn.gia.test/m/${i}` })) }, null, "2026-11-24T05:00:00.000Z"));
  await w0.flush();
  const nguon = nguonAnh(() => "mang");
  const e = await chayAnh(dir, nguon.fetchImpl, { soFile: 4, luongSong: 1 }).run().then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped, String(e));
  assert.equal(e.reason, "network-down");
}));

test("pha ảnh: quá trần lời (số tệp) thì dừng ở đúng trần, đã chốt phần đã tải", async () => withTmp(async (dir) => {
  const w0 = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  await w0.add(anh("8", { danh_sach_hinh_anh: Array.from({ length: 8 }, (_, i) => ({ photo_url: `https://cdn.gia.test/t/${i}` })) }, null, "2026-11-24T05:00:00.000Z"));
  await w0.flush();
  const nguon = nguonAnh(() => ({}));
  const r = await chayAnh(dir, nguon.fetchImpl, { soFile: 2, caps: { calls: 5, minutes: 60 } }).run().then(() => null, (x: unknown) => x);
  assert.ok(r instanceof RunStopped, String(r));
  assert.equal(r.reason, "call-cap");
  assert.equal(nguon.daGoi.length, 5, "không gửi quá trần");
}));

test("KeoDan (kéo dài cho pha không dùng API): trần lời, trần thời gian, yêu cầu dừng, và bị chặn thì khoá dừng", () => {
  let t = 1_000_000;
  let dung = false;
  const k = new KeoDan({ caps: { calls: 2, minutes: 1 }, now: () => t, shouldStop: () => dung });
  k.assertRunning();
  k.calls = 2;
  assert.throws(() => k.assertRunning(), (x: unknown) => x instanceof RunStopped && x.reason === "call-cap");
  const k2 = new KeoDan({ caps: { calls: 100, minutes: 1 }, now: () => t, shouldStop: () => dung });
  t += 61_000;
  assert.throws(() => k2.assertRunning(), (x: unknown) => x instanceof RunStopped && x.reason === "time-cap");
  const k3 = new KeoDan({ caps: { calls: 100, minutes: 60 }, now: () => t, shouldStop: () => dung });
  dung = true;
  assert.throws(() => k3.assertRunning(), (x: unknown) => x instanceof RunStopped && x.reason === "operator-stop");
  const k4 = new KeoDan({ caps: { calls: 100, minutes: 60 }, now: () => t });
  const loi = k4.block("máy chủ ảnh trả 403");
  assert.equal(loi.reason, "blocked");
  assert.equal(k4.blocks, 1);
  assert.throws(() => k4.assertRunning(), (x: unknown) => x === loi, "đã dừng thì mọi lời sau bị từ chối bằng chính lỗi dừng");
  assert.equal(k4.block("máy chủ ảnh trả 403 ở một tệp khác, cùng lúc"), loi, "lần chặn thứ hai của cùng lượt trả về chính lỗi dừng đầu");
  assert.equal(k4.blocks, 1, "một lượt chỉ tính MỘT lần chặn");
  const k5 = new KeoDan({ caps: { calls: 1, minutes: 60 }, now: () => t });
  k5.calls = 1;
  assert.throws(() => k5.assertRunning(), (x: unknown) => x instanceof RunStopped && x.reason === "call-cap");
  assert.equal(k5.block("403 về trong đợt đang dừng vì trần").reason, "call-cap", "lý do dừng đầu được giữ");
  assert.equal(k5.blocks, 1, "nhưng lần gặp 403 thật vẫn được đếm");
});

// ---------- pha căn hộ toàn bộ dự án ----------

import { S17Client, type Response as PhanHoi, type TransportMany } from "../collectors/s17-thua-dinh-gia/client.js";

const FAKE_CFG_CAN_HO = {
  hosts: FAKE_HOSTS,
  paths: { "apartment-list": "/v2.x/apartment-list", "apartment-detail": "/v2.x/apartment-detail", "data-available": "/v2.x/data-available", "asset-type": "/v2.x/asset-type" },
};

/** Nguồn giả cho pha căn hộ toàn bộ: `trang[dự án][toà][lượt][trang]` = mã căn của trang; `lech[mã]` = mã nguồn trả về thay vì mã đã gửi. */
type TacDong = { trang?: (duAn: string, thap: string, page: number) => "mem" | "mang" | undefined; can?: (maCan: string) => "mem" | "mang" | undefined };

function nguonCanHo(ds: Record<string, Record<string, string[][][]>>, lech: Record<string, string> = {}, caps = { calls: 10_000, minutes: 60 }, tacDong: TacDong = {}) {
  const sent: string[] = [];
  const lotCuaToa = new Map<string, number>();
  const json = (body: unknown): PhanHoi => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  const answer = (url: string): PhanHoi => {
    const u = new URL(url);
    const p = u.pathname;
    if (p.endsWith("/apartment-list")) {
      const page = Number(u.searchParams.get("page"));
      const thap = u.searchParams.get("thap") ?? "";
      const duAn = u.searchParams.get("project_id") ?? "";
      const tac = tacDong.trang?.(duAn, thap, page);
      if (tac === "mang") throw new TypeError("Failed to fetch");
      if (tac === "mem") return json({ status: false, message: "Quá tải", data: { content: [], totalElements: 0, totalPages: 0 } });
      if (page === 0) lotCuaToa.set(`${duAn}/${thap}`, (lotCuaToa.get(`${duAn}/${thap}`) ?? -1) + 1);
      const cacLot = ds[duAn]?.[thap] ?? [[]];
      const lot = Math.min(lotCuaToa.get(`${duAn}/${thap}`) ?? 0, cacLot.length - 1);
      const codes = (cacLot[lot] ?? [])[page] ?? [];
      return json({ status: true, message: null, data: { content: codes.map((text) => ({ text, sub_text: `Tháp ${thap}` })), totalElements: cacLot[cacLot.length - 1].flat().length, totalPages: (cacLot[lot] ?? []).length, size: 100, number: page }, pagination: null, extra: {} });
    }
    const maCan = u.searchParams.get("ma_can") ?? "";
    const tac = tacDong.can?.(maCan);
    if (tac === "mang") throw new TypeError("Failed to fetch");
    if (tac === "mem") return json({ status: false, message: "Quá tải", data: null });
    return json({ status: true, message: null, data: { properties: { ma_can: lech[maCan] ?? maCan } }, pagination: null, extra: {} });
  };
  const single = async (url: string): Promise<PhanHoi> => {
    sent.push(url);
    return answer(url);
  };
  const many: TransportMany = async (list) =>
    Promise.all(
      list.map(async (r): Promise<PhanHoi | Error> => {
        try {
          return await single(r.url);
        } catch (e) {
          return e as Error;
        }
      }),
    );
  const client = new S17Client({ config: loadConfig(JSON.stringify(FAKE_CFG_CAN_HO)), caps, paceMs: 0, now: () => 1_000_000, sleep: async () => undefined, transport: single, transportMany: many });
  return { client, sent };
}

const chayCanHo = (dir: string, client: S17Client, tatCaDuAn: Record<string, unknown>, state: RunState = emptyState()) => {
  const w = new BatchWriter({ root: dir, maxItems: 100, phase: "apartments-all", schemaVersion: S17_SCHEMA_VERSION_MO_RONG });
  const log: Record<string, unknown>[] = [];
  const run = () =>
    runPhase({
      phase: "apartments-all",
      client,
      writer: w,
      state,
      save: async () => assert.equal(w.pendingCount + w.pendingFiles, 0, "trạng thái chỉ lưu khi lô đã chốt"),
      log: (e) => log.push(e),
      now: () => new Date("2026-11-25T01:00:00.000Z"),
      snapshotRoot: dir,
      tienDoDir: join(dir, "tien-do"),
      tatCaDuAn: { concurrency: 2, ...tatCaDuAn },
    }).then(async (s) => {
      await w.flush();
      return { s, log };
    });
  return { run, writer: w };
};

async function moiKind(dir: string, loaiBo?: string): Promise<Array<{ kind: string; sourceId: string; payload: any; meta: any }>> {
  const out: Array<{ kind: string; sourceId: string; payload: any; meta: any }> = [];
  for (const id of (await readdir(join(dir, "vn"))).sort()) {
    if (loaiBo && id === loaiBo) continue;
    const { items } = await docSnapshot(dir, id);
    out.push(...items);
  }
  return out;
}

test("pha căn hộ toàn bộ: liệt kê toà (trang song song, quét thêm lượt khi thiếu mã), lấy chi tiết theo đợt; dừng giữa chừng rồi chạy lại chỉ làm phần còn lại", async () => withTmp(async (dir) => {
  const w0 = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  await w0.add(chiTiet("7", { is_exists_apartment_info: true, danh_sach_thap: ["A", "B"], so_can: 5 }, null, "2026-11-24T05:00:00.000Z"));
  await w0.add(chiTiet("8", { is_exists_apartment_info: true, danh_sach_thap: [], so_can: 2 }, null, "2026-11-24T05:00:00.000Z"));
  await w0.add(chiTiet("9", { is_exists_apartment_info: false, danh_sach_thap: ["A"], so_can: 99 }, null, "2026-11-24T05:00:00.000Z"));
  await w0.flush();
  // Toà A khớp ngay lượt một. Toà B: lượt một thiếu mã (2 trên 3), lượt hai đủ. Mã «b3» nguồn trả «b30» (khớp đoạn đầu).
  const ds = { "7": { A: [[["a1", "a2"]]], B: [[["b1"], ["b2"]], [["b1"], ["b2", "b3"]]] } };
  const nguon1 = nguonCanHo(ds, { b3: "b30" }, { calls: 8, minutes: 60 });
  const lan1 = chayCanHo(dir, nguon1.client, {});
  const e = await lan1.run().then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped, String(e));
  assert.equal(e.reason, "call-cap", "dừng đúng ở trần 8 lời: 5 lời liệt kê + a1, a2, b1");
  assert.equal(nguon1.sent.filter((u) => u.includes("/apartment-list")).length, 5, "toà A một trang; toà B hai lượt, mỗi lượt hai trang");
  const tienDo1 = await new NhatKyTienDo(join(dir, "tien-do", "can-ho-7.jsonl")).readAll();
  assert.deepEqual(
    tienDo1.map((r) => [r.toa ?? null, r.tongDong ?? null, r.soLot ?? null, r.khop ?? null, (r.daLay as string[] | undefined)?.join(",") ?? null]),
    [["A", 2, 1, true, null], ["B", 3, 2, true, null], [null, null, null, null, "a1,a2"], [null, null, null, null, "b1"]],
  );
  assert.equal(lan1.writer.pendingCount, 0, "không còn gì dở");
  // Lượt hai: không liệt kê lại, chỉ lấy b2, b3; b3 lệch mã → ghi nhận lỗi; rồi bản gộp dự án và đánh dấu xong.
  const nguon2 = nguonCanHo(ds, { b3: "b30" });
  const lan2 = chayCanHo(dir, nguon2.client, {});
  const s2 = await lan2.run();
  assert.equal(nguon2.sent.filter((u) => u.includes("/apartment-list")).length, 0, "không liệt kê lại toà đã có");
  assert.deepEqual(nguon2.sent.map((u) => new URL(u).searchParams.get("ma_can")).sort(), ["b2", "b3"]);
  assert.deepEqual(s2.s.so, { soDuAnDaXongTruoc: 0, soDuAnXong: 2, soToa: 2, soToaKhop: 2, soToaLoi: 0, maDuNhieu: 5, soDaLay: 4, soLoi: 1 });
  const items = await moiKind(dir, w0.snapshotIds[0]);
  const theo = (k: string) => items.filter((it) => it.kind === k);
  assert.deepEqual(theo("can_ho_detail").map((it) => it.sourceId).sort(), ["du-an-7-can-a1", "du-an-7-can-a2", "du-an-7-can-b1", "du-an-7-can-b2"]);
  assert.deepEqual(
    Object.fromEntries(theo("can_ho_list").map((it) => [it.sourceId, it.meta.maMoi])),
    { "du-an-7-toa-a-trang-1": 2, "du-an-7-toa-b-trang-1": 1, "du-an-7-toa-b-trang-2": 2, "du-an-7-toa-b-trang-1-lot-2": 0, "du-an-7-toa-b-trang-2-lot-2": 1 },
    "trang ghi theo đúng số trang; lượt hai mang hậu tố -lot-2; maMoi tính dồn trong lượt theo thứ tự trang",
  );
  assert.deepEqual(
    theo("can_ho_toa").map((it) => [it.sourceId, it.meta.tongCan, it.meta.maDuNhieu, it.meta.soLot, it.meta.khop, it.meta.laToaChungMinh]),
    [["du-an-7-toa-a", 2, 2, 1, true, false], ["du-an-7-toa-b", 3, 3, 2, true, false]],
  );
  const gop = theo("can_ho_du_an");
  assert.deepEqual(
    gop.map((it) => [it.sourceId, it.meta.soToa, it.meta.soToaKhop, it.meta.maDuNhieu, it.meta.soDaLay, it.meta.soKhongLayDuoc, it.meta.soCanNguon, it.meta.moRong]),
    [
      ["du-an-7", 2, 2, 5, 4, 1, 5, true],
      ["du-an-8", 0, 0, 0, 0, 0, 2, true],
    ],
    "dự án 8 không có tên toà: vẫn có bản gộp để bên đọc thấy là đã xét; dự án 9 không có bảng căn nên không đụng tới",
  );
  assert.ok(gop.every((it) => it.payload.toa.length === (it.sourceId === "du-an-7" ? 2 : 0)));
  // Lượt ba: mọi thứ đã xong → không gọi nguồn.
  const nguon3 = nguonCanHo(ds);
  const s3 = await chayCanHo(dir, nguon3.client, {}).run();
  assert.equal(nguon3.sent.length, 0);
  assert.equal(s3.s.so?.soDuAnDaXongTruoc, 2);
}));

test("pha căn hộ toàn bộ: lọc theo số căn nguồn khai, theo danh sách id, và giới hạn số dự án một lượt", async () => withTmp(async (dir) => {
  const w0 = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  for (const [id, soCan] of [["7", 5000], ["8", 1500], ["9", 700], ["10", 50]] as const) {
    await w0.add(chiTiet(id, { is_exists_apartment_info: true, danh_sach_thap: ["A"], so_can: soCan }, null, "2026-11-24T05:00:00.000Z"));
  }
  await w0.flush();
  const ds = Object.fromEntries(["7", "8", "9", "10"].map((id) => [id, { A: [[["x1"]]] }]));
  const lan1 = nguonCanHo(ds);
  const s1 = await chayCanHo(dir, lan1.client, { tuSoCan: 600, denSoCan: 3000, gioiHan: 1 }).run();
  assert.deepEqual([...new Set(lan1.sent.map((u) => new URL(u).searchParams.get("project_id")))], ["8"], "chỉ dự án 8 (1.500 căn) nằm trong khoảng; giới hạn một dự án");
  assert.equal(s1.s.so?.soDuAnXong, 1);
  const lan2 = nguonCanHo(ds);
  await chayCanHo(dir, lan2.client, { ids: ["10", "7"] }).run();
  assert.deepEqual([...new Set(lan2.sent.map((u) => new URL(u).searchParams.get("project_id")))], ["7", "10"], "danh sách id: dự án 7 trước (nhiều căn hơn)");
}));

// ---------- nối vào trình điều khiển ----------

import { executePhase, type ExecResult } from "../collectors/s17-thua-dinh-gia/runner.js";
import { MAX_ANH_LUONG_SONG, TOI_DA_MOT_MAY_CHU_NGOAI } from "../collectors/s17-thua-dinh-gia/pha-anh.js";
import type { RawItem } from "../core/types.js";

const cauHinhAnh = (them: Record<string, unknown> = {}) => loadConfig(JSON.stringify({ hosts: FAKE_HOSTS, paths: {}, anh: { hostSuffixes: ["cdn.gia.test"] }, ...them }));

const chayQuaDieuKhien = (dir: string, phase: "images", fetchImpl: typeof fetch, o: { luongSong?: number; caps?: { calls: number; minutes: number }; config?: ReturnType<typeof loadConfig> } = {}): Promise<ExecResult> =>
  executePhase({
    phase,
    config: o.config ?? cauHinhAnh(),
    transport: async () => {
      throw new Error("pha ảnh không được gọi API của nguồn");
    },
    snapshotRoot: dir,
    statePath: join(dir, "tien-do-anh", "state.json"),
    logPath: join(dir, "tien-do-anh", "log.jsonl"),
    caps: o.caps ?? { calls: 100, minutes: 10 },
    paceMs: 350,
    batchItems: 100,
    checkBalance: false,
    anh: { luongSong: o.luongSong ?? 2, soFile: 10 },
    anhFetch: fetchImpl,
    env: { sleep: async () => undefined, now: () => new Date("2026-11-25T01:00:00.000Z") },
  });

async function duaVaoKho(dir: string, cacMuc: RawItem[]): Promise<string> {
  const w = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  for (const m of cacMuc) await w.add(m);
  return (await w.flush()) as string;
}

test("executePhase pha images: không đọc số dư, không cần phiên, snapshot phiên bản 18, lời của pha ảnh cộng vào kết quả, tiến độ ở thư mục trạng thái của pha", async () => withTmp(async (dir) => {
  const cu = await duaVaoKho(dir, [anh("8", { danh_sach_hinh_anh: [{ photo_url: "https://cdn.gia.test/a/1" }, { photo_url: "https://cdn.gia.test/a/2" }] }, null, "2026-11-24T05:00:00.000Z")]);
  const nguon = nguonAnh(() => ({}));
  const r = await chayQuaDieuKhien(dir, "images", nguon.fetchImpl);
  assert.equal(r.ok, true, String(r.message));
  assert.equal(r.calls, 2, "số lời = số tệp đã tải");
  assert.deepEqual(r.summary?.so, { soDuAnXong: 1, soFile: 2, soByte: r.summary?.so?.soByte, soLoi: 0 });
  const thuMuc = (await readdir(join(dir, "vn"))).filter((x) => x !== cu);
  assert.equal(thuMuc.length, 1, "một snapshot cho hai ảnh");
  const { manifest, items } = await docSnapshot(dir, thuMuc[0]);
  assert.equal(manifest.schemaVersion, 18);
  assert.equal(manifest.files.filter((f: { name: string }) => f.name.startsWith("media/")).length, 2);
  assert.equal(items[0].kind, "anh_du_an");
  assert.ok((await readdir(join(dir, "tien-do-anh"))).includes("anh-8.jsonl"), "tiến độ nằm cùng thư mục trạng thái của pha ảnh");
  await assert.rejects(readFile(join(dir, "tien-do-anh", "DANG-CHAY.lock")), "nhả khoá khi xong");
}));

test("executePhase pha images: mở tới 16 kết nối được — trần riêng của ảnh, khỏi trần 8 của lời API; quá 16 thì từ chối trước khi tải gì", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", Array.from({ length: 8 }, (_, i) => `https://cdn.gia.test/a/${i}`));
  const nguon = nguonAnh(() => ({}));
  const r12 = await chayQuaDieuKhien(dir, "images", nguon.fetchImpl, { luongSong: MAX_ANH_LUONG_SONG });
  assert.equal(r12.ok, true, String(r12.message));
  assert.equal(r12.summary?.so?.soFile, 8);
  assert.equal(MAX_ANH_LUONG_SONG, 16, "trần số kết nối của ảnh");
  assert.equal(TOI_DA_MOT_MAY_CHU_NGOAI, 6, "mỗi máy chủ ngoài: mức trình duyệt thường mở");
  await duaAnhVaoKho(dir, "9", Array.from({ length: 8 }, (_, i) => `https://cdn.gia.test/b/${i}`));
  await assert.rejects(chayQuaDieuKhien(dir, "images", nguon.fetchImpl, { luongSong: MAX_ANH_LUONG_SONG + 1 }), new RegExp(`1 đến ${MAX_ANH_LUONG_SONG}`), "quá trần: từ chối trước khi tải gì");
}));

test("executePhase pha images: cấu hình thiếu máy chủ ảnh thì dừng TRƯỚC khi tải gì", async () => withTmp(async (dir) => {
  await duaVaoKho(dir, [anh("8", { danh_sach_hinh_anh: [{ photo_url: "https://cdn.gia.test/a/1" }] }, null, "2026-11-24T05:00:00.000Z")]);
  const nguon = nguonAnh(() => ({}));
  await assert.rejects(chayQuaDieuKhien(dir, "images", nguon.fetchImpl, { config: loadConfig(JSON.stringify({ hosts: FAKE_HOSTS, paths: {} })) }), /hostSuffixes|ảnh/);
  assert.equal(nguon.daGoi.length, 0);
}));

test("executePhase pha images: bị chặn thì ghi nhận MỘT lần bị chặn; lượt ảnh nhiều luồng kế bị từ chối, một luồng vẫn chạy", async () => withTmp(async (dir) => {
  await duaVaoKho(dir, [anh("8", { danh_sach_hinh_anh: [{ photo_url: "https://cdn.gia.test/chan/1" }] }, null, "2026-11-24T05:00:00.000Z")]);
  const chan = nguonAnh(() => ({ status: 403, body: "<Error><Code>AccessDenied</Code></Error>" }));
  const r1 = await chayQuaDieuKhien(dir, "images", chan.fetchImpl, { luongSong: 2 });
  assert.equal(r1.ok, false);
  assert.equal(r1.stopReason, "blocked");
  assert.equal(r1.blocks, 1);
  assert.equal(JSON.parse(await readFile(join(dir, "tien-do-anh", "state.json"), "utf8")).blockedRuns, 1);
  const tot = nguonAnh(() => ({}));
  const r2 = await chayQuaDieuKhien(dir, "images", tot.fetchImpl, { luongSong: 2 });
  assert.equal(r2.stopReason, "fast-after-block", "nhiều luồng sau một lần bị chặn: chỉ còn một luồng");
  const r3 = await chayQuaDieuKhien(dir, "images", tot.fetchImpl, { luongSong: 1 });
  assert.equal(r3.ok, true, "một luồng vẫn được chạy");
}));

test("executePhase pha apartments-all: có đọc số dư trước và sau (cần phiên), snapshot phiên bản 18, lựa chọn đi qua", async () => withTmp(async (dir) => {
  const goc = await duaVaoKho(dir, [chiTiet("7", { is_exists_apartment_info: true, danh_sach_thap: ["A"], so_can: 1 }, null, "2026-11-24T05:00:00.000Z")]);
  const json = (body: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  const daHoi: string[] = [];
  const transport = async (url: string) => {
    daHoi.push(new URL(url).pathname);
    if (url.endsWith("/balance")) return json({ status: true, data: { available: 20 } });
    if (url.includes("/apartment-list")) return json({ status: true, data: { content: [{ text: "x1" }], totalElements: 1, totalPages: 1 } });
    return json({ status: true, data: { properties: { ma_can: new URL(url).searchParams.get("ma_can") } } });
  };
  const r = await executePhase({
    phase: "apartments-all",
    config: loadConfig(JSON.stringify({ hosts: FAKE_HOSTS, paths: { balance: "/v2.x/balance", "apartment-list": "/v2.x/apartment-list", "apartment-detail": "/v2.x/apartment-detail" } })),
    transport,
    snapshotRoot: dir,
    statePath: join(dir, "can-ho", "state.json"),
    logPath: join(dir, "can-ho", "log.jsonl"),
    caps: { calls: 50, minutes: 10 },
    paceMs: 0,
    batchItems: 100,
    checkBalance: true,
    concurrency: 2,
    tatCaDuAn: { tuSoCan: 1 },
    env: { sleep: async () => undefined, now: () => new Date("2026-11-25T01:00:00.000Z") },
  });
  assert.equal(r.ok, true, String(r.message));
  assert.equal(r.balanceBefore, 20);
  assert.equal(r.balanceAfter, 20);
  assert.equal(daHoi.filter((x) => x.endsWith("/balance")).length, 2, "đọc số dư trước và sau");
  assert.deepEqual(r.summary?.so?.soDuAnXong, 1);
  const thuMuc = (await readdir(join(dir, "vn"))).filter((x) => x !== goc);
  for (const id of thuMuc) assert.equal((await docSnapshot(dir, id)).manifest.schemaVersion, 18);
  assert.ok((await readdir(join(dir, "can-ho"))).includes("can-ho-7.jsonl"));
}));

// ---------- thứ tự «chốt xong mới ghi tiến độ» khi lô chốt hỏng ----------

/** Trình ghi bị lỗi chốt: `flush()` trả lỗi lần đầu (như đĩa đầy), lần sau chạy bình thường. */
function writerDoiMat(w: BatchWriter): { writer: BatchWriter; soLanChot: () => number } {
  let lan = 0;
  const doiMat = Object.create(w);
  doiMat.flush = async (reason?: string) => {
    lan++;
    if (lan === 1) throw new Error("ENOSPC: hết đĩa");
    return w.flush(reason);
  };
  return { writer: doiMat as BatchWriter, soLanChot: () => lan };
}

test("pha ảnh: lô chốt hỏng thì KHÔNG ghi tiến độ (ảnh chưa xuống đĩa không được coi là đã tải)", async () => withTmp(async (dir) => {
  const w0 = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  await w0.add(anh("8", { danh_sach_hinh_anh: [{ photo_url: "https://cdn.gia.test/a/1" }, { photo_url: "https://cdn.gia.test/a/2" }] }, null, "2026-11-24T05:00:00.000Z"));
  await w0.flush();
  const nguon = nguonAnh(() => ({}));
  const doi = writerDoiMat(new BatchWriter({ root: dir, maxItems: 1000, phase: "images", schemaVersion: S17_SCHEMA_VERSION_MO_RONG, maxFiles: 10 }));
  const keoDan = new KeoDan({ caps: { calls: 100, minutes: 10 }, now: () => new Date("2026-11-25T01:00:00.000Z").getTime() });
  await assert.rejects(
    runPhase({
      phase: "images",
      client: undefined as never,
      writer: doi.writer,
      state: emptyState(),
      save: async () => undefined,
      log: () => undefined,
      now: () => new Date("2026-11-25T01:00:00.000Z"),
      snapshotRoot: dir,
      tienDoDir: join(dir, "tien-do"),
      anh: { hostSuffixes: ["cdn.gia.test"], chiNgoai: false, luongSong: 2, maxBytes: 1024 * 1024, timeoutMs: 5000, userAgent: "x", fetchImpl: nguon.fetchImpl },
      keoDan,
    }),
    /ENOSPC/,
  );
  await assert.rejects(readFile(join(dir, "tien-do", "anh-8.jsonl")), "chưa có tiến độ nào");
}));

test("pha căn hộ toàn bộ: lô chốt hỏng thì KHÔNG ghi tiến độ — lượt sau liệt kê lại từ đầu chứ không tin toà đã liệt kê", async () => withTmp(async (dir) => {
  const w0 = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  await w0.add(chiTiet("7", { is_exists_apartment_info: true, danh_sach_thap: ["A"], so_can: 2 }, null, "2026-11-24T05:00:00.000Z"));
  await w0.flush();
  const ds = { "7": { A: [[["a1", "a2"]]] } };
  const nguon = nguonCanHo(ds);
  const doi = writerDoiMat(new BatchWriter({ root: dir, maxItems: 100, phase: "apartments-all", schemaVersion: S17_SCHEMA_VERSION_MO_RONG }));
  const state = emptyState();
  await assert.rejects(
    runPhase({
      phase: "apartments-all",
      client: nguon.client,
      writer: doi.writer,
      state,
      save: async () => undefined,
      log: () => undefined,
      now: () => new Date("2026-11-25T01:00:00.000Z"),
      snapshotRoot: dir,
      tienDoDir: join(dir, "tien-do"),
      tatCaDuAn: { concurrency: 2 },
    }),
    /ENOSPC/,
  );
  await assert.rejects(readFile(join(dir, "tien-do", "can-ho-7.jsonl")), "chưa có tiến độ nào");
}));

// ---------- thửa mở rộng, T1: bản đồ phủ bước 1 km trong ô 10 km quanh mỗi điểm mặt nạ có dữ liệu ----------

import { luoiBanDo, parcelsMap } from "../collectors/s17-thua-dinh-gia/pha-ban-do.js";

test("luoiBanDo: 11 × 11 điểm cách 1 km (mét Mercator) trong ô 10 km quanh TÂM của tile; điểm giữa đúng tâm tile", () => {
  const { tam, diem } = luoiBanDo("17/104068/57570", 11, 1000);
  assert.equal(diem.length, 121);
  const R = 6378137;
  const n = 2 ** 17;
  const x = ((104068 + 0.5) / n) * 2 * Math.PI * R - Math.PI * R;
  const y = Math.PI * R - ((57570 + 0.5) / n) * 2 * Math.PI * R;
  const lat = (Math.atan(Math.sinh(y / R)) * 180) / Math.PI;
  const lng = (x / R) * (180 / Math.PI);
  assert.ok(Math.abs(tam[0] - lat) < 1e-9 && Math.abs(tam[1] - lng) < 1e-9, `tâm tile: ${tam}`);
  const giua = diem[60];
  assert.ok(Math.abs(giua[0] - lat) < 1e-9 && Math.abs(giua[1] - lng) < 1e-9, "điểm giữa lưới là tâm tile");
  const toM = (p: [number, number]) => ({ x: (p[1] * Math.PI) / 180 * R, y: Math.atanh(Math.sin((p[0] * Math.PI) / 180)) * R });
  const a = toM(diem[0]);
  const b = toM(diem[1]);
  assert.ok(Math.abs(b.x - a.x - 1000) < 1e-3, "bước ngang 1 000 m Mercator");
  const c = toM(diem[11]);
  assert.ok(Math.abs(a.y - c.y - 1000) < 1e-3, "bước dọc 1 000 m Mercator, hàng sau nằm ở phía nam");
  assert.ok(Math.abs(a.x - x + 5000) < 1e-3 && Math.abs(a.y - y - 5000) < 1e-3, "góc trên trái cách tâm 5 km mỗi chiều");
  assert.throws(() => luoiBanDo("104068/57570", 11, 1000), /z\/x\/y/);
});

type DiemBanDo = { taiDiem: Record<string, { ogc: string; duong: string } | null>; loiDiem?: string[] };

/** Nguồn giả cho bản đồ phủ: mỗi toạ độ (làm tròn 6 chữ số) trúng một thửa hoặc không có. */
function nguonBanDo(o: DiemBanDo, caps = { calls: 100_000, minutes: 60 }) {
  const sent: string[] = [];
  const json = (body: unknown): PhanHoi => ({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  const answer = (url: string): PhanHoi => {
    const u = new URL(url);
    const key = `${Number(u.searchParams.get("latitude")).toFixed(6)},${Number(u.searchParams.get("longitude")).toFixed(6)}`;
    if (o.loiDiem?.includes(key)) throw new TypeError("Failed to fetch");
    const t = o.taiDiem[key];
    if (!t) return json({ status: true, message: null, data: null, pagination: null, extra: {} });
    return json({ status: true, message: null, pagination: null, extra: {}, data: { id: "1", properties: { ogc_fid: t.ogc, vi_tri_duong: t.duong, dien_tich: 100 } } });
  };
  const single = async (url: string): Promise<PhanHoi> => {
    sent.push(url);
    return answer(url);
  };
  const many: TransportMany = async (list) =>
    Promise.all(
      list.map(async (r): Promise<PhanHoi | Error> => {
        try {
          return await single(r.url);
        } catch (e) {
          return e as Error;
        }
      }),
    );
  const client = new S17Client({
    config: loadConfig(JSON.stringify({ hosts: FAKE_HOSTS, paths: { "parcel-profile": "/v2.x/parcel-profile", "data-available": "/v2.x/data-available", "asset-type": "/v2.x/asset-type" } })),
    caps,
    paceMs: 0,
    now: () => 1_000_000,
    sleep: async () => undefined,
    transport: single,
    transportMany: many,
  });
  return { client, sent };
}

async function duaMatNgaVaoKho(dir: string, cacTile: Array<{ tile: string; trong: number }>): Promise<void> {
  const w = new BatchWriter({ root: dir, maxItems: 100, phase: "tile-mask" });
  await w.add(
    makeItem(
      "tile_coverage",
      "coverage-vn-a",
      { tiles: cacTile.map((x) => x.tile) },
      { request: { zoom: 17 }, congKhai: true, ten: "Tỉnh giả A", soDiemQuet: 10, trong: cacTile.reduce((n, x) => n + x.trong, 0), rong: 5, vang: 1, loi: 0 },
      "2026-11-24T05:00:00.000Z",
    ),
  );
  await w.flush();
}

const chayBanDo = (dir: string, client: S17Client, o: { concurrency?: number; state?: RunState; caps?: { calls: number; minutes: number } } = {}) => {
  const state = o.state ?? emptyState();
  const w = new BatchWriter({ root: dir, maxItems: 100, phase: "parcels-map", schemaVersion: S17_SCHEMA_VERSION_MO_RONG });
  const log: Record<string, unknown>[] = [];
  const run = () =>
    runPhase({
      phase: "parcels-map",
      client,
      writer: w,
      state,
      save: async () => assert.equal(w.pendingCount + w.pendingFiles, 0, "trạng thái chỉ lưu khi lô đã chốt"),
      log: (e) => log.push(e),
      now: () => new Date("2026-11-25T01:00:00.000Z"),
      snapshotRoot: dir,
      tienDoDir: join(dir, "tien-do"),
      concurrency: o.concurrency ?? 3,
    }).then(async (s) => {
      await w.flush();
      return { s, log, writer: w };
    });
  return { run, writer: w };
};

test("parcels-map: mỗi điểm mặt nạ có dữ liệu → thăm dò 121 điểm; thửa tìm được ghi thành item thua (phuongPhap ban-do); một ô một bản đồ; chạy lại không hỏi lại ô đã xong", async () => withTmp(async (dir) => {
  await duaMatNgaVaoKho(dir, [{ tile: "17/104068/57570", trong: 1 }]);
  const { diem } = luoiBanDo("17/104068/57570", 11, 1000);
  const k = (p: [number, number]) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
  const taiDiem: DiemBanDo["taiDiem"] = {};
  taiDiem[k(diem[0])] = { ogc: "100", duong: "Đường A" };
  taiDiem[k(diem[1])] = { ogc: "100", duong: "Đường A" }; // cùng thửa, điểm kế
  taiDiem[k(diem[70])] = { ogc: "200", duong: "Đường B" };
  const nguon = nguonBanDo({ taiDiem });
  const lan1 = chayBanDo(dir, nguon.client, { concurrency: 4 });
  const s1 = await lan1.run();
  assert.equal(s1.s.calls, 121, "một ô = 121 lời");
  assert.deepEqual(s1.s.so, { soO: 1, soDiem: 121, soDiemCoThua: 3, soThua: 2, soOCoDuLieu: 1 });
  const items = await moiKind(dir);
  const banDo = items.filter((it) => it.kind === "thua_ban_do");
  assert.deepEqual(
    banDo.map((it) => [it.sourceId, it.meta.tile, it.meta.soDiem, it.meta.soCo, it.meta.buocM, it.meta.viTri.length, it.payload.diem.length]),
    [["ban-do-17-104068-57570", "17/104068/57570", 121, 3, 1000, 2, 121]],
  );
  assert.deepEqual(banDo[0].payload.diem.filter((d: [number, number, string | null]) => d[2]), [
    [diem[0][0], diem[0][1], "100"],
    [diem[1][0], diem[1][1], "100"],
    [diem[70][0], diem[70][1], "200"],
  ], "bản đồ ghi toạ độ và mã thửa của điểm trúng");
  assert.deepEqual(
    items.filter((it) => it.kind === "thua").map((it) => [it.sourceId, it.meta.phuongPhap, it.meta.khuVuc, it.meta.ogcFid]),
    [["thua-100", "ban-do", "17-104068-57570", "100"], ["thua-200", "ban-do", "17-104068-57570", "200"]],
    "điểm kế cùng thửa không sinh item lặp",
  );
  const nguon2 = nguonBanDo({ taiDiem });
  const s2 = await chayBanDo(dir, nguon2.client).run();
  assert.equal(nguon2.sent.length, 0, "ô đã xong không hỏi lại");
  assert.equal(s2.s.so?.soO, 0);
}));

test("parcels-map: dừng giữa ô (quá trần) thì chốt phần đã thăm dò và ghi tiến độ; chạy lại làm nốt các điểm còn lại của ô", async () => withTmp(async (dir) => {
  await duaMatNgaVaoKho(dir, [{ tile: "17/104068/57570", trong: 1 }]);
  const nguon1 = nguonBanDo({ taiDiem: {} }, { calls: 10, minutes: 60 });
  const lan1 = chayBanDo(dir, nguon1.client, { concurrency: 1 });
  const e = await lan1.run().then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped, String(e));
  assert.equal(e.reason, "call-cap");
  const td = await new NhatKyTienDo(join(dir, "tien-do", "ban-do-17-104068-57570.jsonl")).readAll();
  assert.equal((td.at(-1)?.daDiem as number[] | undefined)?.length, 10, "mười điểm đã thăm dò (đúng bằng trần 10 lời) được ghi nhận");
  assert.equal(td.at(-1)?.xong, undefined, "chưa đánh dấu ô xong");
  const nguon2 = nguonBanDo({ taiDiem: {} });
  const s2 = await chayBanDo(dir, nguon2.client, { concurrency: 4 }).run();
  assert.equal(s2.s.calls, 111, "121 − 10 điểm còn lại");
  assert.equal(s2.s.so?.soO, 1);
  const td2 = await new NhatKyTienDo(join(dir, "tien-do", "ban-do-17-104068-57570.jsonl")).readAll();
  assert.equal(td2.at(-1)?.xong, true);
  const banDo = (await moiKind(dir)).filter((it) => it.kind === "thua_ban_do");
  assert.equal(banDo.length, 1, "bản đồ của ô chỉ ghi khi ô xong trọn");
  assert.equal(banDo[0].payload.diem.length, 121);
}));

test("parcels-map: điểm lỗi mạng được ghi nhận là lỗi (không hỏi lại), điểm khác vẫn tiếp tục; thửa đã có ở ô khác không ghi lặp", async () => withTmp(async (dir) => {
  await duaMatNgaVaoKho(dir, [{ tile: "17/104068/57570", trong: 1 }, { tile: "17/104069/57570", trong: 1 }]);
  const a = luoiBanDo("17/104068/57570", 11, 1000);
  const b = luoiBanDo("17/104069/57570", 11, 1000);
  const k = (p: [number, number]) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
  const taiDiem: DiemBanDo["taiDiem"] = {};
  taiDiem[k(a.diem[5])] = { ogc: "300", duong: "Đường C" };
  taiDiem[k(b.diem[7])] = { ogc: "300", duong: "Đường C" };
  const nguon = nguonBanDo({ taiDiem, loiDiem: [k(a.diem[6])] });
  const s = await chayBanDo(dir, nguon.client, { concurrency: 2 }).run();
  assert.deepEqual(s.s.so, { soO: 2, soDiem: 242, soDiemCoThua: 2, soThua: 1, soOCoDuLieu: 2 });
  assert.equal(s.s.failed, 1, "một điểm lỗi mạng");
  const items = await moiKind(dir);
  assert.equal(items.filter((it) => it.kind === "thua").length, 1, "thửa 300 chỉ một item dù gặp ở hai ô");
  const oA = items.find((it) => it.sourceId === "ban-do-17-104068-57570")!;
  assert.equal(oA.meta.soLoi, 1);
  assert.equal(oA.payload.diem[6][2], "loi", "bản đồ ghi rõ điểm lỗi");
}));

// ---------- thửa mở rộng, T2/T3: lưới dày trong ô 1 km có dữ liệu ----------

import { cacOCoDuLieu, luoiO, parcelsCell } from "../collectors/s17-thua-dinh-gia/pha-o.js";

test("luoiO: lưới vuông canh ⌊1000/buoc⌋ centimet, cách đều buoc mét, tâm ô là tâm lưới", () => {
  const tam: [number, number] = [21.03, 105.85];
  assert.deepEqual(luoiO(tam, 1000), [tam], "bước 1 km: chỉ tâm ô");
  const R = 6378137;
  const toM = (p: [number, number]) => ({ x: ((p[1] * Math.PI) / 180) * R, y: Math.atanh(Math.sin((p[0] * Math.PI) / 180)) * R });
  const c = toM(tam);
  const d500 = luoiO(tam, 500).map(toM);
  assert.equal(d500.length, 4);
  assert.deepEqual(
    d500.map((p) => [Math.round(p.x - c.x), Math.round(c.y - p.y)]),
    [
      [-250, -250],
      [250, -250],
      [-250, 250],
      [250, 250],
    ],
    "bốn điểm cách tâm 250 m mỗi chiều; hàng trên (bắc) trước",
  );
  const d100 = luoiO(tam, 100);
  assert.equal(d100.length, 100);
  const d30 = luoiO(tam, 30);
  assert.equal(d30.length, 1089, "33 × 33 điểm cho bước 30 m");
  assert.throws(() => luoiO(tam, 0), /buoc/);
  assert.throws(() => luoiO(tam, 1500), /1000/);
});

test("cacOCoDuLieu: ô 1 km nào có thửa ở chính nó hoặc ở một trong tám ô kề (theo bản đồ phủ); dày nhất đứng trước; điểm lỗi không tính là có", async () => withTmp(async (dir) => {
  const { diem } = luoiBanDo("17/104068/57570", 11, 1000);
  const ds = diem.map((p, k) => [p[0], p[1], k === 0 ? "100" : k === 60 ? "200" : k === 61 ? "201" : k === 70 ? "loi" : null] as [number, number, string | null]);
  const w = new BatchWriter({ root: dir, maxItems: 10, phase: "parcels-map", schemaVersion: 18 });
  await w.add(makeItem("thua_ban_do", "ban-do-17-104068-57570", { buocM: 1000, diem: ds }, { request: { zoom: 17 }, tile: "17/104068/57570", soDiem: 121, soCo: 3, soLoi: 1, viTri: [21, 105] }, "2026-11-25T01:00:00.000Z"));
  await w.flush();
  const o = await cacOCoDuLieu(dir);
  const khoa = (x: { tile: string; i: number; j: number }) => `${x.tile}#${x.i},${x.j}`;
  assert.equal(o.length, 16, "góc (0,0) kéo theo 2 × 2 = 4 ô; hai điểm trúng kề nhau (5,5),(6,5) kéo theo ô cột 4–7, hàng 4–6 = 12 ô");
  assert.deepEqual(
    o.slice(0, 3).map((x) => [khoa(x), x.soLanTrung]),
    [["17/104068/57570#5,4", 2], ["17/104068/57570#5,5", 2], ["17/104068/57570#5,6", 2]],
    "sáu ô thấy cả hai điểm trúng đứng trước, xếp theo cột rồi hàng",
  );
  assert.ok(o.some((x) => x.i === 0 && x.j === 0) && o.some((x) => x.i === 1 && x.j === 1), "hai ô kề góc");
  assert.ok(!o.some((x) => x.i === 4 && x.j === 7), "ô chỉ kề điểm «loi» (4,6) chứ chẳng kề điểm trúng nào thì không có dữ liệu");
  assert.ok(Math.abs(o.find((x) => x.i === 5 && x.j === 5)!.tam[0] - diem[60][0]) < 1e-12, "tâm ô là toạ độ điểm bản đồ");
}));

async function duaBanDoVaoKho(dir: string, o: { diemTrung: number[] } = { diemTrung: [60] }): Promise<[number, number][]> {
  const { diem } = luoiBanDo("17/104068/57570", 11, 1000);
  const w = new BatchWriter({ root: dir, maxItems: 10, phase: "parcels-map", schemaVersion: 18 });
  await w.add(makeItem("thua_ban_do", "ban-do-17-104068-57570", { buocM: 1000, diem: diem.map((p, k) => [p[0], p[1], o.diemTrung.includes(k) ? "900" : null]) }, { request: { zoom: 17 }, tile: "17/104068/57570", soDiem: 121, soCo: o.diemTrung.length, soLoi: 0, viTri: [21, 105] }, "2026-11-25T01:00:00.000Z"));
  await w.flush();
  return diem;
}

const chayO = (dir: string, client: S17Client, o: { buocM: number; concurrency?: number; gioiHan?: number; state?: RunState } = { buocM: 500 }) => {
  const state = o.state ?? emptyState();
  const w = new BatchWriter({ root: dir, maxItems: 100, phase: "parcels-cell", schemaVersion: S17_SCHEMA_VERSION_MO_RONG });
  const log: Record<string, unknown>[] = [];
  const run = () =>
    runPhase({
      phase: "parcels-cell",
      client,
      writer: w,
      state,
      save: async () => assert.equal(w.pendingCount + w.pendingFiles, 0, "trạng thái chỉ lưu khi lô đã chốt"),
      log: (e) => log.push(e),
      now: () => new Date("2026-11-25T01:00:00.000Z"),
      snapshotRoot: dir,
      tienDoDir: join(dir, "tien-do"),
      concurrency: o.concurrency ?? 3,
      oLuoi: { buocM: o.buocM, ...(o.gioiHan !== undefined ? { gioiHan: o.gioiHan } : {}) },
    }).then(async (s) => {
      await w.flush();
      return { s, log, writer: w };
    });
  return { run, writer: w };
};

test("parcels-cell: mỗi ô có dữ liệu một lưới dày; thửa ghi một lần dù kề hai ô; mỗi ô một bản gộp; chạy lại không hỏi lại", async () => withTmp(async (dir) => {
  const diem = await duaBanDoVaoKho(dir, { diemTrung: [60] });
  const o = await cacOCoDuLieu(dir);
  const k = (p: [number, number]) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`; // cùng cách làm tròn với nguồn giả
  const taiDiem: DiemBanDo["taiDiem"] = {};
  // Thửa 500 nằm ở một điểm lưới của ô (5,5) và một điểm lưới của ô kề (6,5); thửa 501 ở ô (4,4).
  taiDiem[k(luoiO(o.find((x) => x.i === 5 && x.j === 5)!.tam, 500)[0])] = { ogc: "500", duong: "Đường X" };
  const ke = luoiO(o.find((x) => x.i === 6 && x.j === 5)!.tam, 500);
  taiDiem[k(ke[0])] = { ogc: "500", duong: "Đường X" };
  const xa = luoiO(o.find((x) => x.i === 4 && x.j === 4)!.tam, 500);
  taiDiem[k(xa[3])] = { ogc: "501", duong: "Đường Y" };
  const nguon = nguonBanDo({ taiDiem });
  const lan1 = chayO(dir, nguon.client, { buocM: 500, concurrency: 2 });
  const s1 = await lan1.run();
  assert.equal(o.length, 9);
  assert.equal(s1.s.calls, 36, "9 ô × 4 điểm");
  assert.deepEqual(s1.s.so, { soO: 9, soDiem: 36, soThuaMoi: 2, soTrung: 1, soKhongCo: 33, soLoi: 0 });
  const items = await moiKind(dir);
  assert.deepEqual(
    items.filter((it) => it.kind === "thua").map((it) => [it.sourceId, it.meta.phuongPhap, it.meta.khuVuc]),
    [
      ["thua-501", "luoi", "o-17-104068-57570-4-4"],
      ["thua-500", "luoi", "o-17-104068-57570-5-5"],
    ],
    "ô (4,4) đứng trước (4,5)…; thửa 500 gặp lại ở ô kề (6,5) chỉ tính là trùng",
  );
  const gop = items.filter((it) => it.kind === "thua_o");
  assert.equal(gop.length, 9);
  const o55 = gop.find((it) => it.sourceId === "o-17-104068-57570-5-5")!;
  assert.deepEqual([o55.payload.soDiem, o55.payload.soThuaMoi, o55.payload.soTrung, o55.payload.soKhongCo, o55.meta.request.buocM, o55.meta.tile, o55.meta.o], [4, 1, 0, 3, 500, "17/104068/57570", [5, 5]]);
  const o65 = gop.find((it) => it.sourceId === "o-17-104068-57570-6-5")!;
  assert.deepEqual([o65.payload.soThuaMoi, o65.payload.soTrung], [0, 1]);
  const nguon2 = nguonBanDo({ taiDiem });
  const s2 = await chayO(dir, nguon2.client, { buocM: 500 }).run();
  assert.equal(nguon2.sent.length, 0, "ô đã xong không hỏi lại");
  assert.equal(s2.s.so?.soO, 0);
}));

test("parcels-cell: giới hạn số ô một lượt; dừng giữa ô (quá trần) thì ghi tiến độ và chạy lại làm nốt", async () => withTmp(async (dir) => {
  await duaBanDoVaoKho(dir, { diemTrung: [60] });
  const nguon1 = nguonBanDo({ taiDiem: {} }, { calls: 100, minutes: 60 });
  const s1 = await chayO(dir, nguon1.client, { buocM: 500, gioiHan: 2 }).run();
  assert.equal(s1.s.so?.soO, 2, "chỉ hai ô trong lượt này");
  const nguon2 = nguonBanDo({ taiDiem: {} }, { calls: 5, minutes: 60 });
  const lan2 = chayO(dir, nguon2.client, { buocM: 500, concurrency: 1 });
  const e = await lan2.run().then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped, String(e));
  assert.equal(e.reason, "call-cap");
  const tep = (await readdir(join(dir, "tien-do"))).filter((x) => x.startsWith("o-"));
  const chuaXong: number[] = [];
  for (const t of tep) {
    const td = await new NhatKyTienDo(join(dir, "tien-do", t)).readAll();
    if (!td.some((r) => r.xong === true)) chuaXong.push(((td.at(-1)?.daDiem as number[] | undefined) ?? []).length);
  }
  assert.deepEqual(chuaXong, [1], "đúng một ô đang dở với một điểm đã thăm dò (trần 5 lời: ô một 4 điểm, ô hai 1 điểm)");
  const nguon3 = nguonBanDo({ taiDiem: {} });
  const s3 = await chayO(dir, nguon3.client, { buocM: 500 }).run();
  assert.equal(s3.s.calls, 23, "36 − 13 điểm đã hỏi");
  assert.equal(s3.s.so?.soO, 6, "9 ô = 2 (lượt một) + 1 (lượt hai xong trước khi chạm trần) + 6 (lượt ba)");
  assert.equal((await moiKind(dir)).filter((it) => it.kind === "thua_o").length, 9);
}));

// ---------- sửa theo lượt soát 25/11: tải ảnh an toàn và phân loại lỗi đúng ----------

import { diaChiNoiBo, hashUrl, phanLoaiMayChu, taiAnh } from "../collectors/s17-thua-dinh-gia/anh.js";

const TUY_CHON = { maxBytes: 1024, timeoutMs: 5000, userAgent: "oneinvest-collector/1", duoiNguon: ["cdn.gia.test"], keNgoai: false };

test("phanLoaiMayChu: máy chủ của nguồn, máy chủ ngoài (chỉ khi được bật), và cấm mọi địa chỉ nội bộ hoặc giao thức lạ", () => {
  assert.equal(phanLoaiMayChu("https://a.cdn.gia.test/x", TUY_CHON), "nguon");
  assert.equal(phanLoaiMayChu("https://anh.example.org/x", TUY_CHON), "cam", "máy chủ ngoài chưa được bật thì coi là cấm");
  assert.equal(phanLoaiMayChu("https://anh.example.org/x", { ...TUY_CHON, keNgoai: true }), "ngoai");
  for (const u of [
    "http://localhost/x",
    "http://127.0.0.1/x",
    "http://127.1/x",
    "http://10.1.2.3/x",
    "http://192.168.1.1/x",
    "http://172.16.0.1/x",
    "http://172.31.255.254/x",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/x",
    "http://[fe80::1]/x",
    "http://[fc00::1]/x",
    "http://intranet.local/x",
    "http://may.internal/x",
    "file:///etc/passwd",
    "ftp://cdn.gia.test/x",
    "http://2130706433/x",
    "http://0x7f.0.0.1/x",
    "http://[::ffff:127.0.0.1]/x",
  ]) {
    assert.equal(phanLoaiMayChu(u, { ...TUY_CHON, keNgoai: true, duoiNguon: ["gia.test"] }), "cam", u);
  }
  assert.equal(phanLoaiMayChu("http://172.32.0.1/x", { ...TUY_CHON, keNgoai: true }), "ngoai", "ngoài dải riêng thì là máy chủ ngoài");
  assert.equal(phanLoaiMayChu("http://[::ffff:8.8.8.8]/x", { ...TUY_CHON, keNgoai: true }), "ngoai");
  assert.equal(phanLoaiMayChu("không phải url", TUY_CHON), "cam");
});

/** fetch giả theo đúng lời: trả phản hồi ghi sẵn hoặc chuyển hướng; ghi lại mọi lời kèm các lựa chọn. */
function fetchGia(tra: (url: string, init: RequestInit) => Response | Promise<Response> | never) {
  const daGoi: Array<{ url: string; redirect?: RequestRedirect }> = [];
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    daGoi.push({ url: u, redirect: init?.redirect });
    return tra(u, init ?? {});
  }) as unknown as typeof fetch;
  return { fetchImpl, daGoi };
}

test("taiAnh: chuyển hướng tới máy chủ KHÔNG được phép (hoặc nội bộ) thì dừng, không gửi lời nào tới máy chủ đó; trong máy chủ được phép thì đi tiếp", async () => {
  const cam = fetchGia(() => new Response(null, { status: 302, headers: { location: "https://khac.example.org/a.jpg" } }));
  const r1 = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: cam.fetchImpl });
  assert.equal(r1.loi, "chuyen-huong-cam");
  assert.deepEqual(cam.daGoi.map((x) => x.url), ["https://a.cdn.gia.test/a"], "chỉ lời đầu tiên được gửi");
  const noiBo = fetchGia(() => new Response(null, { status: 302, headers: { location: "http://169.254.169.254/x" } }));
  assert.equal((await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: noiBo.fetchImpl, keNgoai: true })).loi, "chuyen-huong-cam");
  assert.equal(noiBo.daGoi.length, 1);
  const hop = fetchGia((u) => (u.endsWith("/a") ? new Response(null, { status: 302, headers: { location: "https://b.cdn.gia.test/b.jpg" } }) : new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/jpeg" } })));
  const r3 = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: hop.fetchImpl });
  assert.equal(r3.loi, "ok");
  assert.equal(r3.bytes?.length, 3);
  assert.deepEqual(hop.daGoi.map((x) => x.redirect), ["manual", "manual"], "không để fetch tự đi theo chuyển hướng");
  const vong = fetchGia(() => new Response(null, { status: 302, headers: { location: "https://a.cdn.gia.test/a" } }));
  const r4 = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: vong.fetchImpl });
  assert.equal(r4.loi, "qua-nhieu-chuyen-huong");
  assert.ok(vong.daGoi.length <= 6);
});

test("taiAnh: URL ở địa chỉ nội bộ thì không gửi lời nào; phân loại lỗi vĩnh viễn (4xx, quá cỡ, tệp rỗng) và lỗi tạm (5xx, timeout)", async () => {
  const f = fetchGia(() => new Response(new Uint8Array([1])));
  assert.equal((await taiAnh("http://127.0.0.1/a", { ...TUY_CHON, fetchImpl: f.fetchImpl })).loi, "cam-may-chu");
  assert.equal(f.daGoi.length, 0);
  assert.equal((await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: fetchGia(() => new Response("sai", { status: 400 })).fetchImpl })).loi, "http-4xx");
  assert.equal((await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: fetchGia(() => new Response(null, { status: 410 })).fetchImpl })).loi, "khong-con");
  assert.equal((await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: fetchGia(() => new Response(new Uint8Array(2000))).fetchImpl })).loi, "qua-co");
  assert.equal((await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: fetchGia(() => new Response(new Uint8Array(0))).fetchImpl })).loi, "rong", "tệp 0 byte không phải ảnh");
  const loi = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: fetchGia(() => new Response("loi", { status: 503 })).fetchImpl });
  assert.equal(loi.loi, "loi");
  assert.equal(loi.http, 503);
});

test("taiAnh: HTTP 200 nhưng thân là trang HTML là trang thử thách → bị chặn; lỗi mạng phân theo nguyên nhân (DNS, chứng chỉ, timeout)", async () => {
  const html = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: fetchGia(() => new Response("<html>captcha</html>", { status: 200, headers: { "content-type": "text/html" } })).fetchImpl });
  assert.equal(html.loi, "chan");
  assert.equal(html.chiTiet, "trang-html");
  const voi = (code: string, ten: string) =>
    fetchGia(() => {
      const e = new TypeError("fetch failed", { cause: Object.assign(new Error("x"), { code }) });
      e.name = ten;
      throw e;
    }).fetchImpl;
  const congKhai = { dnsLookup: async (): Promise<string[]> => ["1.2.3.4"] }; // máy chủ ngoài được giải tên sang địa chỉ công khai (không hỏi DNS thật)
  assert.equal((await taiAnh("https://anh.example.org/a", { ...TUY_CHON, keNgoai: true, ...congKhai, fetchImpl: voi("ENOTFOUND", "TypeError") })).loi, "may-chu-khong-ton-tai");
  assert.equal((await taiAnh("https://anh.example.org/a", { ...TUY_CHON, keNgoai: true, ...congKhai, fetchImpl: voi("EAI_AGAIN", "TypeError") })).loi, "loi", "tạm thời không phân giải được là lỗi tạm");
  assert.equal((await taiAnh("https://anh.example.org/a", { ...TUY_CHON, keNgoai: true, ...congKhai, fetchImpl: voi("CERT_HAS_EXPIRED", "TypeError") })).loi, "chung-chi");
  assert.equal((await taiAnh("https://anh.example.org/a", { ...TUY_CHON, keNgoai: true, ...congKhai, fetchImpl: voi("ECONNREFUSED", "TypeError") })).loi, "may-chu-khong-tra-loi");
  const hetGio = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: voi("UND_ERR_CONNECT_TIMEOUT", "TypeError") });
  assert.equal(hetGio.loi, "loi");
  assert.equal(hetGio.chiTiet, "timeout");
});

test("diaChiNoiBo: IPv4 dải riêng/đặc biệt và IPv6 (loopback, ULA, link-local, multicast, ánh xạ IPv4, NAT64, 6to4, Teredo, ngoài dải công khai) đều là nội bộ; địa chỉ công khai là false; không đọc được thì coi là cấm", () => {
  const trong = [
    "10.0.0.1", "100.64.0.1", "100.127.255.254", "127.0.0.1", "169.254.169.254", "172.16.0.1", "172.31.255.255", "192.168.1.1", "0.0.0.0", "224.0.0.1", "255.255.255.255",
    "::", "::1", "fc00::1", "fd12:3456::1", "fe80::1", "ff02::1", "::ffff:10.0.0.1", "::ffff:127.0.0.1", "64:ff9b::a00:1", "2002:a00:1::", "2001:db8::1", "2001::1", "100::1", "4000::1", "::10.0.0.1",
  ];
  const ngoai = ["8.8.8.8", "1.1.1.1", "172.32.0.1", "172.15.0.1", "192.169.0.1", "100.63.255.255", "100.128.0.1", "2400:cb00::1", "2606:4700::1", "2001:4860:4860::8888", "::ffff:8.8.8.8", "64:ff9b::808:808", "2002:808:808::1", "2a00:1450:4001:81b::200e"];
  for (const ip of trong) assert.equal(diaChiNoiBo(ip), true, ip);
  for (const ip of ngoai) assert.equal(diaChiNoiBo(ip), false, ip);
  assert.equal(diaChiNoiBo("khong-phai-dia-chi"), true, "không đọc được địa chỉ thì cấm");
});

test("taiAnh: trần tổng bấm giữa lúc đọc thân — thân vẫn chảy đều, thời gian treo dài hơn trần tổng: vẫn bị cắt, chiTiet là timeout", async () => {
  const chay = fetchGia(
    (_u, init) =>
      new Response(
        new ReadableStream({
          async start(c) {
            init.signal?.addEventListener("abort", () => c.error(init.signal?.reason));
            for (let i = 0; i < 200; i++) {
              await new Promise((r) => setTimeout(r, 10));
              if (init.signal?.aborted) return;
              c.enqueue(new Uint8Array(10));
            }
            c.close();
          },
        }),
        { status: 200, headers: { "content-type": "image/jpeg" } },
      ),
  );
  const r = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, stallMs: 5000, timeoutMs: 60, fetchImpl: chay.fetchImpl });
  assert.deepEqual([r.loi, r.chiTiet, r.http], ["loi", "timeout", 200]);
});

test("taiAnh: máy chủ ngoài có tên trỏ tới địa chỉ dải riêng (theo DNS) thì KHÔNG kết nối — kể cả ở bước chuyển hướng; máy chủ của nguồn không cần hỏi DNS; lỗi DNS phân theo nguyên nhân", async () => {
  const f = fetchGia(() => new Response(new Uint8Array([1])));
  const giai = (ds: string[]) => {
    const daHoi: string[] = [];
    return { daHoi, dnsLookup: (async (h: string) => (daHoi.push(h), ds)) as never };
  };
  const r1 = await taiAnh("https://anh.example.org/a.jpg", { ...TUY_CHON, keNgoai: true, fetchImpl: f.fetchImpl, ...giai(["10.0.0.5"]) });
  assert.deepEqual([r1.loi, r1.chiTiet, f.daGoi.length], ["loi", "dns-noi-bo", 0], "chưa từng gửi lời nào; là lỗi tạm vì máy thu sau VPN có thể giải mọi tên ra dải riêng");
  const hon = giai(["1.2.3.4", "192.168.1.1"]);
  assert.equal((await taiAnh("https://anh.example.org/a.jpg", { ...TUY_CHON, keNgoai: true, fetchImpl: f.fetchImpl, dnsLookup: hon.dnsLookup })).loi, "loi", "một trong nhiều địa chỉ là dải riêng thì không kết nối");
  assert.equal(f.daGoi.length, 0, "vẫn chưa gửi lời nào");
  const r3 = await taiAnh("https://anh.example.org/a.jpg", { ...TUY_CHON, keNgoai: true, fetchImpl: f.fetchImpl, ...giai(["2606:4700::1"]) });
  assert.equal(r3.loi, "ok", "địa chỉ công khai thì tải bình thường");
  const chuyen = fetchGia(() => new Response(null, { status: 302, headers: { location: "https://doc.example.net:8443/x" } }));
  const g4 = giai(["127.0.0.1"]);
  const r4 = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, keNgoai: true, fetchImpl: chuyen.fetchImpl, dnsLookup: g4.dnsLookup });
  assert.equal(r4.loi, "chuyen-huong-cam", "bước chuyển hướng tới tên trỏ vào dải riêng: dừng");
  assert.equal(chuyen.daGoi.length, 1);
  assert.deepEqual(g4.daHoi, ["doc.example.net"], "hỏi theo tên máy chủ, không kèm cổng");
  const khongHoi = giai([]);
  const r5 = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: f.fetchImpl, dnsLookup: khongHoi.dnsLookup });
  assert.equal(r5.loi, "ok");
  assert.deepEqual(khongHoi.daHoi, [], "máy chủ của nguồn (cấu hình local) không cần hỏi DNS");
  const ipThang = giai([]);
  assert.equal((await taiAnh("http://1.2.3.4/a.jpg", { ...TUY_CHON, keNgoai: true, fetchImpl: f.fetchImpl, dnsLookup: ipThang.dnsLookup })).loi, "ok", "địa chỉ viết thẳng thì không hỏi DNS");
  assert.deepEqual(ipThang.daHoi, []);
  const r6 = await taiAnh("https://anh.example.org/a.jpg", { ...TUY_CHON, keNgoai: true, fetchImpl: f.fetchImpl, dnsLookup: (async () => { throw Object.assign(new Error("không phân giải được"), { code: "ENOTFOUND" }); }) as never });
  assert.equal(r6.loi, "may-chu-khong-ton-tai", "DNS trả lỗi thì phân loại như lỗi mạng của fetch");
  const r7 = await taiAnh("https://anh.example.org/a.jpg", { ...TUY_CHON, keNgoai: true, fetchImpl: f.fetchImpl, dnsLookup: (async () => { throw Object.assign(new Error("lưu tạm"), { code: "EAI_AGAIN" }); }) as never });
  assert.equal(r7.loi, "loi", "EAI_AGAIN là lỗi tạm");
});

test("taiAnh: lỗi giữa lúc đọc thân (hết giờ, mất kết nối) là lỗi TẠM ghi cho riêng tệp đó — không ném ra ngoài; treo quá lâu không nhận được byte thì bỏ sớm với lý do treo", async () => {
  const thanLoi = (e: Error) =>
    fetchGia(() => new Response(new ReadableStream({ start(c) { c.enqueue(new Uint8Array([1])); c.error(e); } }), { status: 200, headers: { "content-type": "image/jpeg" } }));
  const r1 = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: thanLoi(Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" })).fetchImpl });
  assert.deepEqual([r1.loi, r1.chiTiet, r1.http], ["loi", "timeout", 200], "đổ lượt vì một tệp là lỗi của bộ thu (đã gặp 25/11 sau 1.169 lời)");
  const r2 = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: thanLoi(Object.assign(new Error("mất kết nối"), { code: "ECONNRESET" })).fetchImpl });
  assert.deepEqual([r2.loi, r2.chiTiet], ["loi", "ECONNRESET"]);
  const treo = fetchGia(
    (_u, init) =>
      new Response(
        new ReadableStream({ start(c) { c.enqueue(new Uint8Array([1])); init.signal?.addEventListener("abort", () => c.error(init.signal?.reason)); } }),
        { status: 200, headers: { "content-type": "image/jpeg" } },
      ),
  );
  const t0 = Date.now();
  const r3 = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, stallMs: 30, timeoutMs: 60_000, fetchImpl: treo.fetchImpl });
  assert.deepEqual([r3.loi, r3.chiTiet, r3.http], ["loi", "treo", 200]);
  assert.ok(Date.now() - t0 < 1500, "bỏ theo thời gian treo, không chờ tới trần tổng");
  // tệp chảy đều nhưng chậm (mỗi khối 40 ms, cả tệp lâu hơn thời gian treo) vẫn tải đủ: đồng hồ treo đặt lại sau mỗi khối.
  // Nguồn giả nghe tín hiệu bỏ như fetch thật — đồng hồ treo có bấm giữa chừng hay không là ở đây mà thấy.
  const cham = fetchGia(
    (_u, init) =>
      new Response(
        new ReadableStream({
          async start(c) {
            init.signal?.addEventListener("abort", () => c.error(init.signal?.reason));
            for (let i = 0; i < 6; i++) {
              await new Promise((r) => setTimeout(r, 40));
              if (init.signal?.aborted) return;
              c.enqueue(new Uint8Array(10));
            }
            c.close();
          },
        }),
        { status: 200, headers: { "content-type": "image/jpeg" } },
      ),
  );
  const r4 = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, stallMs: 100, fetchImpl: cham.fetchImpl });
  assert.deepEqual([r4.loi, r4.bytes?.length], ["ok", 60]);
});

test("taiAnh: máy chủ khai content-length lớn hơn trần cỡ thì bỏ ngay (không đọc thân); khai nhỏ nhưng thân dài hơn thì vẫn bị cắt khi vượt trần", async () => {
  let daHuy = false;
  let daKeo = 0;
  const f = fetchGia(
    () =>
      new Response(new ReadableStream({ pull(c) { daKeo++; c.enqueue(new Uint8Array(2000)); }, cancel() { daHuy = true; } }), {
        status: 200,
        headers: { "content-type": "image/jpeg", "content-length": "5000" },
      }),
  );
  const r = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: f.fetchImpl });
  assert.deepEqual([r.loi, daHuy, daKeo <= 1], ["qua-co", true, true], "không kéo dữ liệu, đóng thân ngay");
  const f2 = fetchGia(
    () =>
      new Response(new ReadableStream({ pull(c) { daKeo++; if (daKeo < 5) c.enqueue(new Uint8Array(500)); else c.close(); } }), {
        status: 200,
        headers: { "content-type": "image/jpeg", "content-length": "100" },
      }),
  );
  assert.equal((await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: f2.fetchImpl })).loi, "qua-co");
  const f3 = fetchGia(
    () =>
      new Response(new ReadableStream({ start(c) { c.enqueue(new Uint8Array(1024)); c.close(); } }), {
        status: 200,
        headers: { "content-type": "image/jpeg", "content-length": "1024" },
      }),
  );
  const r3 = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: f3.fetchImpl });
  assert.deepEqual([r3.loi, r3.bytes?.length], ["ok", 1024], "cỡ đúng bằng trần thì vẫn nhận");
});

test("pha ảnh: lô xong ngay thì không có dòng «đang tải» nào — chỉ báo khi thật sự còn tệp đang nhận", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", [1, 2, 3, 4].map((i) => `https://cdn.gia.test/a/${i}`));
  const nguon = nguonAnh(() => ({}));
  const log: Record<string, unknown>[] = [];
  const { s } = await chayAnh(dir, nguon.fetchImpl, { soFile: 4, baoMoiMs: 5, log }).run();
  assert.equal(s.so?.soFile, 4);
  assert.equal(log.filter((e) => e.suKien === "anh-dang-tai").length, 0, "không có tệp nào đang nhận đủ lâu để kịp một khoảng báo");
}));

async function docSnapshotIds(dir: string): Promise<string[]> {
  const { readdir } = await import("node:fs/promises");
  const ra: Array<{ t: string; id: string; so: number }> = [];
  for (const d of (await readdir(join(dir, "vn"))).sort()) {
    const { manifest, items } = await docSnapshot(dir, d);
    const anh = items.filter((it) => it.kind === "anh_du_an");
    assert.ok(anh.length <= 1, `snapshot ${d} có ${anh.length} item ảnh — mỗi lô một snapshot`);
    for (const it of anh) ra.push({ t: String((it as { fetchedAt?: string }).fetchedAt), id: it.sourceId, so: anh.length });
  }
  return ra.sort((a, b) => a.t.localeCompare(b.t) || a.id.localeCompare(b.id)).map((x) => x.id);
}

test("pha ảnh: tệp chậm ở lô này KHÔNG giữ các luồng khác — cùng dự án, các lô sau vẫn tải song song và chốt ngay khi đủ, mỗi lô một snapshot", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `https://cdn.gia.test/a/${i}`));
  // ảnh 1 chậm 300 ms (một tệp gốc to trên đường chậm); còn lại 5 ms. Hai luồng, lô ba ảnh.
  const chan = new Set<number>();
  const nguon = nguonAnh(async (duong) => {
    if (duong.endsWith("/1") && !chan.has(1)) {
      chan.add(1);
      await new Promise((r) => setTimeout(r, 300));
    } else await new Promise((r) => setTimeout(r, 5));
    return {};
  });
  const { s, log } = await chayAnh(dir, nguon.fetchImpl, { soFile: 3, luongSong: 2 }).run();
  assert.equal(s.so?.soFile, 9, "chín ảnh đều có");
  assert.deepEqual(
    log.filter((e) => e.suKien === "anh-lot").map((e) => [e.tu, e.toi]),
    [
      [4, 6],
      [7, 9],
      [1, 3],
    ],
    "lô 4–6 rồi 7–9 chốt TRƯỚC lô 1–3 (đang chờ ảnh chậm)",
  );
  const ids = await docSnapshotIds(dir);
  assert.deepEqual([...ids].sort(), ["du-an-8-anh-1-3", "du-an-8-anh-4-6", "du-an-8-anh-7-9"], "mỗi lô một snapshot, một item, mã theo vị trí");
}));

test("pha ảnh: dừng giữa lô vì quá trần thì phần đã tải của MỌI lô dở đều được chốt, không mất ảnh đã xuống", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", [1, 2, 3, 4, 5, 6].map((i) => `https://cdn.gia.test/a/${i}`));
  // ảnh 1 chậm; ảnh 2, 3, 4 nhanh → hai luồng: luồng A kẹt ở ảnh 1, luồng B lấy 2, 3, 4; đủ trần 4 lời thì dừng, ảnh 1 về sau
  const nguon = nguonAnh(async (duong) => {
    await new Promise((r) => setTimeout(r, duong.endsWith("/1") ? 200 : 5));
    return {};
  });
  const r = await chayAnh(dir, nguon.fetchImpl, { soFile: 3, luongSong: 2, caps: { calls: 4, minutes: 10 } }).run().then(
    () => null,
    (x: unknown) => x,
  );
  assert.ok(r instanceof RunStopped && r.reason === "call-cap");
  assert.deepEqual((await docSnapshotIds(dir)).sort(), ["du-an-8-anh-1-3", "du-an-8-anh-4-4"], "lô một đủ 1–3; lô hai mới có ảnh 4 nên chốt MỘT PHẦN là 4–4 — ảnh đã xuống không mất");
  const lan2 = await chayAnh(dir, nguon.fetchImpl, { soFile: 3, luongSong: 2 }).run();
  assert.equal(lan2.s.so?.soFile, 2, "lượt sau chỉ tải hai ảnh còn thiếu (5 và 6)");
  assert.deepEqual((await docSnapshotIds(dir)).at(-1), "du-an-8-anh-5-6");
}));

// ---------- theo lượt soát lần hai (25/11): thân phản hồi lỗi, đồng hồ giải tên, máy chủ cuối, bằng chứng đồng hồ, tệp dở ----------

const GIAI_CONG_KHAI = { dnsLookup: async (): Promise<string[]> => ["1.2.3.4"] };

test("taiAnh: thân của phản hồi lỗi (4xx) cũng có đồng hồ treo và trần cỡ — thân đứng yên thì bỏ theo thời gian treo, thân dài thì chỉ đọc đủ khoảng 64 KB", async () => {
  const dung = fetchGia(
    (_u, init) =>
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(new Uint8Array(100));
            init.signal?.addEventListener("abort", () => c.error(init.signal?.reason));
          },
        }),
        { status: 404, headers: { "content-type": "application/xml" } },
      ),
  );
  const t0 = Date.now();
  const r = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, stallMs: 30, timeoutMs: 5000, fetchImpl: dung.fetchImpl });
  assert.deepEqual([r.loi, r.http], ["khong-con", 404], "vẫn phân loại theo status");
  assert.ok(Date.now() - t0 < 1500, "thân đứng yên: bỏ theo thời gian treo, không chờ tới trần tổng");
  let daKeo = 0;
  const dai = fetchGia(
    () => new Response(new ReadableStream({ pull(c) { daKeo++; c.enqueue(new Uint8Array(8192)); } }), { status: 400, headers: { "content-type": "text/plain" } }),
  );
  const r2 = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: dai.fetchImpl });
  assert.deepEqual([r2.loi, daKeo <= 12], ["http-4xx", true], `chỉ đọc khoảng 64 KB chứ không đọc hết thân dài (${daKeo} khối 8 KB)`);
});

test("taiAnh: lời giải tên cũng có đồng hồ — bộ giải không trả lời thì bỏ theo thời gian treo (lỗi tạm), chưa gửi lời nào", async () => {
  const f = fetchGia(() => new Response(new Uint8Array([1])));
  const t0 = Date.now();
  const r = await Promise.race([
    taiAnh("https://anh.example.org/a.jpg", {
      ...TUY_CHON,
      keNgoai: true,
      stallMs: 30,
      timeoutMs: 5000,
      fetchImpl: f.fetchImpl,
      dnsLookup: (() => new Promise<string[]>(() => {})) as never,
    }),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("taiAnh không trả về sau 1,5 giây — lời giải tên không có đồng hồ")), 1500)),
  ]);
  assert.deepEqual([r.loi, r.chiTiet, f.daGoi.length], ["loi", "treo", 0]);
  assert.ok(Date.now() - t0 < 1500, "không chờ tới trần tổng");
});

test("taiAnh: chờ máy chủ trả phần đầu phản hồi được lâu hơn thời gian treo giữa các khối (riêng kết nối và bắt tay); quá hạn riêng thì bỏ", async () => {
  const chamDau = fetchGia(async (_u, init) => {
    await new Promise((r) => setTimeout(r, 80));
    return new Response(new ReadableStream({ start(c) { init.signal?.addEventListener("abort", () => c.error(init.signal?.reason)); c.enqueue(new Uint8Array([1, 2, 3])); c.close(); } }), {
      status: 200,
      headers: { "content-type": "image/jpeg" },
    });
  });
  assert.equal((await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, stallMs: 20, timeoutMs: 5000, fetchImpl: chamDau.fetchImpl })).loi, "ok", "80 ms cho phần đầu vẫn nhận khi thời gian treo giữa các khối là 20 ms");
  const qua = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, stallMs: 20, firstByteMs: 40, timeoutMs: 5000, fetchImpl: chamDau.fetchImpl });
  assert.deepEqual([qua.loi, qua.chiTiet], ["loi", "treo"], "quá hạn riêng của phần đầu phản hồi thì bỏ");
});

test("phanLoaiMayChu: tên máy chủ có dấu chấm cuối là cùng một tên — nội bộ vẫn bị cấm, máy chủ của nguồn vẫn được nhận ra", () => {
  assert.equal(phanLoaiMayChu("http://localhost./x", { duoiNguon: [], keNgoai: true }), "cam");
  assert.equal(phanLoaiMayChu("http://intranet.local./x", { duoiNguon: [], keNgoai: true }), "cam");
  assert.equal(phanLoaiMayChu("https://a.cdn.gia.test./x", TUY_CHON), "nguon");
});

test("taiAnh: kết quả mang lớp máy chủ của BƯỚC CUỐI (nguồn chuyển hướng sang máy chủ ngoài thì máy chủ ngoài là bên trả lời) và lệch đồng hồ theo header Date", async () => {
  const denNgoai = fetchGia((u) =>
    u.startsWith("https://a.cdn.gia.test/")
      ? new Response(null, { status: 302, headers: { location: "https://khac.example.org/x.jpg" } })
      : new Response("<Error><Code>AccessDenied</Code></Error>", { status: 403, headers: { "content-type": "application/xml" } }),
  );
  const r = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, keNgoai: true, fetchImpl: denNgoai.fetchImpl, ...GIAI_CONG_KHAI });
  assert.deepEqual([r.loi, r.mayChuCuoi], ["chan", "ngoai"]);
  const chinhNguon = fetchGia(() => new Response("<Error><Code>AccessDenied</Code></Error>", { status: 403, headers: { "content-type": "application/xml" } }));
  assert.deepEqual([(await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: chinhNguon.fetchImpl })).mayChuCuoi], ["nguon"]);
  const gioMayChu = new Date("2026-11-25T01:00:00.000Z");
  const coDate = fetchGia(() => new Response(new Uint8Array([1]), { status: 200, headers: { "content-type": "image/jpeg", date: gioMayChu.toUTCString() } }));
  const dungGio = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: coDate.fetchImpl, now: () => gioMayChu });
  assert.ok(Math.abs(dungGio.lechChu!) <= 1500, "lệch = giờ máy chủ theo header Date trừ giờ máy thu lúc nhận");
  const nhanhMotNgay = new Date(Date.parse("2026-11-25T01:00:00.000Z") + 86_400_000);
  const lech = await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: coDate.fetchImpl, now: () => nhanhMotNgay });
  assert.ok(Math.abs(lech.lechChu! + 86_400_000) <= 1500, "đồng hồ máy thu nhanh một ngày thì lệch âm khoảng một ngày");
});

test("taiAnh: tín hiệu bỏ từ ngoài — bỏ giữa chừng là lỗi tạm «ngừng»; số byte đã nhận được báo dồn qua trenKhoi", async () => {
  const ac = new AbortController();
  let daBao = 0;
  const cham = fetchGia(
    (_u, init) =>
      new Response(
        new ReadableStream({
          async start(c) {
            init.signal?.addEventListener("abort", () => c.error(init.signal?.reason));
            for (let i = 0; i < 10; i++) {
              await new Promise((r) => setTimeout(r, 20));
              if (init.signal?.aborted) return;
              c.enqueue(new Uint8Array(10));
            }
            c.close();
          },
        }),
        { status: 200, headers: { "content-type": "image/jpeg" } },
      ),
  );
  const loi = taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: cham.fetchImpl, signal: ac.signal, trenKhoi: (n) => { daBao = n; } });
  await new Promise((r) => setTimeout(r, 70));
  ac.abort(new Error("ngừng"));
  const r = await loi;
  assert.deepEqual([r.loi, r.chiTiet], ["loi", "ngung"]);
  assert.ok(daBao >= 20 && daBao <= 60, `đã báo dồn số byte nhận được (${daBao})`);
});

test("pha ảnh: nguồn chuyển hướng sang máy chủ ngoài và máy chủ ngoài trả 403 — KHÔNG tính là nguồn chặn; máy chủ ngoài bị nhớ là chặn, lượt vẫn đi tiếp", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", ["https://cdn.gia.test/r/1", "https://cdn.gia.test/a/2", "https://cdn.gia.test/r/3"]);
  const f = fetchGia((u) => {
    if (u.includes("/r/")) return new Response(null, { status: 302, headers: { location: "https://khac.example.org/x.jpg" } });
    if (u.startsWith("https://khac.example.org/")) return new Response("<Error><Code>AccessDenied</Code></Error>", { status: 403, headers: { "content-type": "application/xml" } });
    return new Response(new Uint8Array([7, 7, 7]), { status: 200, headers: { "content-type": "image/jpeg" } });
  });
  const { s, keoDan } = await chayAnh(dir, f.fetchImpl, { soFile: 10 }).run();
  assert.deepEqual([s.so?.soFile, s.so?.soLoi, keoDan.blocks], [1, 0, 0], "ảnh 2 tải được; lỗi «máy chủ ngoài chặn» không tính vào soLoi; không có lần chặn nào của nguồn");
  const [item] = (await moiKind(dir)).filter((it) => it.kind === "anh_du_an");
  assert.deepEqual(item.meta.mediaFiles.map((x: { error?: string; file?: string }) => (x.file ? "có tệp" : x.error)), ["chan-o-may-chu", "có tệp", "chan-o-may-chu"]);
}));

test("pha ảnh: nguồn trả 403 ở hai tệp cùng lúc — tính MỘT lần chặn; tệp đang tải dở bị bỏ ngay (không chờ nó xong) và không ghi nhận là đã tải", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", [1, 2, 3].map((i) => `https://cdn.gia.test/a/${i}`));
  const f = fetchGia((u, init) => {
    if (u.endsWith("/2")) {
      return new Response(
        new ReadableStream({
          async start(c) {
            init.signal?.addEventListener("abort", () => c.error(init.signal?.reason));
            for (let i = 0; i < 40; i++) {
              await new Promise((r) => setTimeout(r, 10));
              if (init.signal?.aborted) return;
              c.enqueue(new Uint8Array(100));
            }
            c.close();
          },
        }),
        { status: 200, headers: { "content-type": "image/jpeg" } },
      );
    }
    return new Response("<Error><Code>AccessDenied</Code></Error>", { status: 403, headers: { "content-type": "application/xml" } });
  });
  const lan = chayAnh(dir, f.fetchImpl, { soFile: 10, luongSong: 3 });
  const t0 = Date.now();
  const r = await lan.run().then(
    () => null,
    (x: unknown) => x,
  );
  assert.ok(r instanceof RunStopped && r.reason === "blocked");
  assert.ok(Date.now() - t0 < 300, "tệp 2 (400 ms) bị bỏ ngay khi nguồn chặn, không chờ nó xong");
  assert.equal(lan.keoDan.blocks, 1, "hai tệp cùng 403 vẫn chỉ tính một lần chặn");
  assert.equal((await moiKind(dir)).filter((it) => it.kind === "anh_du_an").length, 0, "tệp đang dở không được ghi nhận");
  const nhatKy = await readFile(join(dir, "tien-do", "anh-8.jsonl"), "utf8").catch(() => "");
  assert.ok(!nhatKy.includes("\"dem\""), `tệp bị bỏ vì nguồn chặn không bị tính là một lượt thử lỗi: ${nhatKy}`);
}));

test("pha ảnh máy chủ ngoài: nhiều máy chủ khác nhau thì tải song song tới số luồng khai; mỗi máy chủ ngoài không vượt giới hạn riêng", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", ["h1", "h2", "h3", "h4"].flatMap((h) => [1, 2, 3].map((i) => `https://${h}.example.org/${i}.jpg`)));
  const dangChay = new Map<string, number>();
  let toiDa = 0; // tối đa lời đang chạy CÙNG LÚC trong cả lượt
  let dangChayTong = 0;
  const toiDaMotMayChu: number[] = [];
  const f = fetchGia(async (u) => {
    const h = new URL(u).hostname;
    dangChay.set(h, (dangChay.get(h) ?? 0) + 1);
    dangChayTong++;
    toiDaMotMayChu.push(dangChay.get(h)!);
    toiDa = Math.max(toiDa, dangChayTong);
    await new Promise((r) => setTimeout(r, 40));
    dangChayTong--;
    dangChay.set(h, dangChay.get(h)! - 1);
    return new Response(new Uint8Array([1]), { status: 200, headers: { "content-type": "image/jpeg" } });
  });
  const { s } = await chayAnh(dir, f.fetchImpl, { soFile: 12, luongSong: 6, chiNgoai: true }).run();
  assert.equal(s.so?.soFile, 12);
  assert.ok(toiDa >= 4, `nhiều máy chủ phải chạy song song (tối đa quan sát được ${toiDa})`);
  assert.ok(Math.max(...toiDaMotMayChu) <= TOI_DA_MOT_MAY_CHU_NGOAI, `mỗi máy chủ ngoài tối đa sáu lời (tối đa ${Math.max(...toiDaMotMayChu)})`);
}));

const KY_HET_HAN = (ngayGio: string, p: string) => `https://cdn.gia.test/p/${p}?X-Amz-Date=${ngayGio}&X-Amz-Expires=604800&X-Amz-Signature=abc`;
const HET_HAN_THAT = "<Error><Code>AccessDenied</Code><Message>Request has expired</Message></Error>";

test("pha ảnh: chỉ đoán «hết hạn» sau khi có bằng chứng đồng hồ — hỏi thử MỘT link đoán đã hết hạn; máy chủ vẫn trả ảnh (đồng hồ máy thu chạy sai) thì không đoán, hỏi hết", async () => withTmp(async (dir) => {
  // đồng hồ của lượt: 01:00. Link a, b hết hạn 00:50 và 00:51 (đoán là đã hết hạn); link c còn hạn tới 08:00.
  await duaAnhVaoKho(dir, "8", [KY_HET_HAN("20261118T005000Z", "a"), KY_HET_HAN("20261118T005100Z", "b"), KY_HET_HAN("20261118T080000Z", "c")]);
  const vanCon = fetchGia(() => new Response(new Uint8Array([1]), { status: 200, headers: { "content-type": "image/jpeg" } }));
  const lan = await chayAnh(dir, vanCon.fetchImpl, { soFile: 10 }).run();
  assert.deepEqual([lan.s.so?.soFile, lan.keoDan.calls], [3, 3], "máy chủ vẫn còn ảnh: cả ba link đều được hỏi và tải, không link nào bị bỏ oan");
  assert.ok(lan.log.some((e) => e.suKien === "anh-dong-ho" && e.dung === false), "ghi nhận đồng hồ máy thu lệch");
}));

test("pha ảnh: bằng chứng đồng hồ đúng (hỏi thử một link đoán hết hạn, máy chủ bảo đã hết hạn) thì các link đoán hết hạn còn lại không bị hỏi; dòng lô ghi số link đoán", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", [KY_HET_HAN("20261118T005000Z", "a"), KY_HET_HAN("20261118T005100Z", "b"), KY_HET_HAN("20261118T080000Z", "c")]);
  const f = fetchGia((u) =>
    u.includes("/p/a") || u.includes("/p/b")
      ? new Response(HET_HAN_THAT, { status: 403, headers: { "content-type": "application/xml" } })
      : new Response(new Uint8Array([1]), { status: 200, headers: { "content-type": "image/jpeg" } }),
  );
  const { s, keoDan, log } = await chayAnh(dir, f.fetchImpl, { soFile: 10 }).run();
  assert.deepEqual([s.so?.soFile, s.so?.soLoi, keoDan.calls], [1, 2, 2], "link a (hỏi thử) và link c được hỏi; link b đoán theo bằng chứng");
  assert.ok(log.some((e) => e.suKien === "anh-dong-ho" && e.dung === true));
  assert.equal(log.filter((e) => e.suKien === "anh-lot").reduce((n, e) => n + Number(e.soDuDoanHetHan ?? 0), 0), 1, "dòng lô ghi số link đoán hết hạn");
  const [item] = (await moiKind(dir)).filter((it) => it.kind === "anh_du_an");
  assert.deepEqual(item.meta.mediaFiles.map((x: { chiTiet?: string; file?: string }) => x.file ? "có tệp" : x.chiTiet), [HET_HAN_THAT, "du-doan-het-han", "có tệp"]);
}));

test("pha ảnh: trong lúc lô đang tải, theo giờ thật, mỗi khoảng báo một dòng «đang tải» — cho biết bao nhiêu tệp đang nhận; một tệp chậm giữ lô vẫn thấy lượt đang chạy", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", [1, 2].map((i) => `https://cdn.gia.test/a/${i}`));
  const nguon = nguonAnh(async (duong) => {
    await new Promise((r) => setTimeout(r, duong.endsWith("/1") ? 350 : 5));
    return {};
  });
  const log: Record<string, unknown>[] = [];
  const { s } = await chayAnh(dir, nguon.fetchImpl, { soFile: 10, baoMoiMs: 40, log }).run();
  assert.equal(s.so?.soFile, 2);
  const tai = log.filter((e) => e.suKien === "anh-dang-tai");
  assert.ok(tai.length >= 4, `phải có nhiều dòng trong 350 ms (${tai.length} dòng)`);
  assert.ok(tai.every((e) => Number(e.dangTai) >= 1), JSON.stringify(tai));
  assert.ok(tai.length <= 12, `không dồn dòng quá một mỗi khoảng (${tai.length})`);
}));

test("taiAnh: lỗi riêng của một máy chủ ngoài là vĩnh viễn — không nối được kịp, bắt tay TLS hỏng, chứng chỉ không kiểm được; không nối được kịp ở máy chủ của nguồn vẫn là lỗi tạm", async () => {
  const voi = (code: string) =>
    fetchGia(() => {
      const e = new TypeError("fetch failed", { cause: Object.assign(new Error("x"), { code }) });
      e.name = "TypeError";
      throw e;
    }).fetchImpl;
  const ngoai = (code: string) => taiAnh("https://anh.example.org/a.jpg", { ...TUY_CHON, keNgoai: true, ...GIAI_CONG_KHAI, fetchImpl: voi(code) });
  assert.deepEqual(
    [(await ngoai("UND_ERR_CONNECT_TIMEOUT")).loi, (await ngoai("ERR_SSL_SSL/TLS_ALERT_HANDSHAKE_FAILURE")).loi, (await ngoai("UNABLE_TO_VERIFY_LEAF_SIGNATURE")).loi, (await ngoai("UNABLE_TO_GET_ISSUER_CERT_LOCALLY")).loi],
    ["may-chu-khong-tra-loi", "chung-chi", "chung-chi", "chung-chi"],
  );
  assert.deepEqual(
    [(await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: voi("UND_ERR_CONNECT_TIMEOUT") })).loi, (await taiAnh("https://a.cdn.gia.test/a", { ...TUY_CHON, fetchImpl: voi("ERR_SSL_SSL/TLS_ALERT_HANDSHAKE_FAILURE") })).loi],
    ["loi", "chung-chi"],
    "máy chủ của nguồn: không nối được kịp là lỗi tạm (được thử lại); chứng chỉ hỏng thì vĩnh viễn",
  );
});

test("pha ảnh máy chủ ngoài: một máy chủ trả lỗi tạm cho cả hàng chục URL không làm lượt dừng vì «mất mạng» — lỗi liền nhau trên cùng một máy chủ chỉ tính một lần; nhiều máy chủ khác nhau cùng lỗi thì vẫn dừng", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", Array.from({ length: 60 }, (_, i) => `https://chet.example.org/${i}.jpg`));
  const nguon = nguonAnh(() => ({ status: 503, body: "loi tam thoi" }));
  const lan1 = await chayAnh(dir, nguon.fetchImpl, { soFile: 100, luongSong: 4, chiNgoai: true }).run();
  assert.deepEqual([lan1.s.so?.soFile, lan1.s.so?.soDuAnXong, lan1.keoDan.blocks], [0, 0, 0], "lượt đi hết 60 URL của máy chủ đó, không dừng; URL lỗi tạm chưa kết luận nên dự án chưa xong");
  await duaAnhVaoKho(dir, "9", Array.from({ length: 60 }, (_, i) => `https://h${i}.example.org/${i}.jpg`));
  const r = await chayAnh(dir, nguon.fetchImpl, { soFile: 100, luongSong: 4, chiNgoai: true }).run().then(
    () => null,
    (x: unknown) => x,
  );
  assert.ok(r instanceof RunStopped && r.reason === "network-down", "50 máy chủ khác nhau cùng lỗi mạng là mất mạng thật");
}));

test("pha ảnh: URL đã lỗi tạm từ lượt trước KHÔNG tính vào «mất mạng» — cụm URL lỗi kinh niên ở nhiều máy chủ khác nhau không làm lượt dừng (lượt thật 25/11 17:47 dừng oan sau 102 lời)", async () => withTmp(async (dir) => {
  // 55 URL trên 55 máy chủ khác nhau, mỗi URL đã lỗi tạm MỘT lần ở lượt trước; lần này vẫn lỗi tạm.
  const urls = Array.from({ length: 55 }, (_, i) => `https://h${i}.example.org/x/${i}.jpg`);
  await duaAnhVaoKho(dir, "8", urls);
  await new NhatKyTienDo(join(dir, "tien-do", "anh-ngoai-8.jsonl")).append({ dem: Object.fromEntries(urls.map((u) => [hashUrl(u), 1])) });
  const nguon = nguonAnh(() => ({ status: 503, body: "loi tam thoi" }));
  const { s } = await chayAnh(dir, nguon.fetchImpl, { soFile: 100, luongSong: 4, chiNgoai: true }).run();
  assert.equal(s.so?.soFile, 0);
  assert.equal(s.so?.soDuAnXong, 0, "URL lỗi tạm chưa kết luận nên dự án chưa xong");
  const td = (await new NhatKyTienDo(join(dir, "tien-do", "anh-ngoai-8.jsonl")).readAll()).at(-1) as { dem?: Record<string, number> };
  assert.deepEqual([...new Set(Object.values(td.dem ?? {}))], [2], "mỗi URL được đếm lượt thử thứ hai");
}));

test("pha ảnh: trong một dự án, URL còn tươi được tải TRƯỚC, URL đã lỗi tạm từ lượt trước xếp xuống CUỐI", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", [1, 2, 3, 4].map((i) => `https://cdn.gia.test/a/${i}`));
  await new NhatKyTienDo(join(dir, "tien-do", "anh-8.jsonl")).append({ dem: { [hashUrl("https://cdn.gia.test/a/2")]: 1 } });
  const nguon = nguonAnh(() => ({}));
  const { s } = await chayAnh(dir, nguon.fetchImpl, { soFile: 10, luongSong: 1 }).run();
  assert.equal(s.so?.soFile, 4);
  assert.deepEqual(nguon.daGoi, ["/a/1", "/a/3", "/a/4", "/a/2"], "ảnh 2 (đã lỗi một lần) xuống cuối; thứ tự các ảnh tươi giữ nguyên");
}));

test("pha ảnh: một tệp trong lô lỗi giữa lúc đọc thân — các tệp khác vẫn chốt; tệp lỗi được đếm lượt thử, lượt sau tải nốt", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", [1, 2, 3].map((i) => `https://cdn.gia.test/a/${i}`));
  let lan = 0;
  const f = fetchGia((u) => {
    if (u.endsWith("/2") && lan++ === 0) {
      return new Response(
        new ReadableStream({ start(c) { c.enqueue(new Uint8Array([1])); c.error(Object.assign(new Error("mất kết nối"), { code: "ECONNRESET" })); } }),
        { status: 200, headers: { "content-type": "image/jpeg" } },
      );
    }
    return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/jpeg" } });
  });
  const lan1 = await chayAnh(dir, f.fetchImpl, { soFile: 10 }).run();
  assert.deepEqual([lan1.s.so?.soFile, lan1.s.so?.soLoi, lan1.s.so?.soDuAnXong], [2, 0, 0], "hai tệp chốt; tệp lỗi chưa ghi là lỗi; dự án chưa xong");
  const [item] = (await moiKind(dir)).filter((it) => it.kind === "anh_du_an");
  assert.deepEqual(item.meta.mediaFiles.map((x: { file?: string; error?: string }) => (x.file ? "có tệp" : x.error)), ["có tệp", "loi", "có tệp"]);
  const lan2 = await chayAnh(dir, f.fetchImpl, { soFile: 10 }).run();
  assert.deepEqual([lan2.s.so?.soFile, lan2.s.so?.soDuAnXong], [1, 1], "lượt sau chỉ tải tệp còn thiếu rồi đánh dấu xong");
}));

// ---------- pha ảnh sau lượt soát: mã ổn định, giới hạn lần thử, máy chủ ngoài ----------

function nguonAnhUrl(tra: (u: URL) => KetQuaNguon | Promise<KetQuaNguon>) {
  const daGoi: string[] = [];
  const fetchImpl = (async (url: string | URL | Request) => {
    const u = new URL(String(url));
    daGoi.push(u.href);
    const k = await tra(u);
    if (k === "mang") throw new TypeError("Failed to fetch");
    const than = typeof k.body === "string" ? Buffer.from(k.body) : k.body;
    const status = k.status ?? 200;
    return new Response(status === 200 ? new Uint8Array(than ?? Buffer.from("anh")) : new Uint8Array(than ?? Buffer.alloc(0)), {
      status,
      headers: { "content-type": status === 200 ? (k.kieu ?? "image/jpeg") : (k.kieu ?? "application/xml") },
    });
  }) as unknown as typeof fetch;
  return { fetchImpl, daGoi };
}

async function duaAnhVaoKho(dir: string, id: string, cacUrl: string[]): Promise<void> {
  const w = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  await w.add(anh(id, { danh_sach_hinh_anh: cacUrl.map((u) => ({ photo_url: u })) }, null, "2026-11-24T05:00:00.000Z"));
  await w.flush();
}

test("pha ảnh: mã item theo VỊ TRÍ trong danh sách ảnh của dự án — hai lượt khác nhau không trùng mã, nội dung không đè nhau", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", [1, 2, 3, 4, 5].map((i) => `https://cdn.gia.test/a/${i}`));
  const nguon = nguonAnh(() => ({}));
  const lan1 = chayAnh(dir, nguon.fetchImpl, { soFile: 5, caps: { calls: 2, minutes: 10 } });
  const r1 = await lan1.run().then(() => null, (x: unknown) => x);
  assert.ok(r1 instanceof RunStopped && r1.reason === "call-cap");
  const lan2 = chayAnh(dir, nguon.fetchImpl, { soFile: 5 });
  const s2 = await lan2.run();
  assert.equal(s2.s.so?.soFile, 3);
  const ids = (await moiKind(dir)).filter((it) => it.kind === "anh_du_an").map((it) => it.sourceId).sort();
  assert.deepEqual(ids, ["du-an-8-anh-1-2", "du-an-8-anh-3-5"], "lượt một ghi ảnh 1–2, lượt hai ghi ảnh 3–5: hai mã khác nhau");
}));

test("pha ảnh: lỗi tạm được thử lại ở các lượt sau, tới hạn số lượt thì ghi nhận là vĩnh viễn (qua-so-lan-thu)", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", ["https://cdn.gia.test/m/1"]);
  const nguon = nguonAnh(() => "mang");
  for (let lan = 1; lan <= 3; lan++) {
    const r = await chayAnh(dir, nguon.fetchImpl, { caps: { calls: 100, minutes: 10 } }).run();
    assert.equal(r.s.so?.soDuAnXong, 0, `lượt ${lan}: dự án chưa xong vì còn ảnh lỗi tạm`);
  }
  assert.equal(nguon.daGoi.length, 3, "ba lượt, ba lời");
  const r4 = await chayAnh(dir, nguon.fetchImpl, { caps: { calls: 100, minutes: 10 } }).run();
  assert.equal(r4.s.so?.soDuAnXong, 1, "lượt tư: đã quá hạn số lượt, lỗi được ghi nhận, dự án xong");
  assert.equal(nguon.daGoi.length, 3, "lượt tư không gọi nữa");
  const loi = (await moiKind(dir)).flatMap((it) => it.meta.mediaFiles ?? []).map((m: { error?: string }) => m.error);
  assert.deepEqual(loi, ["qua-so-lan-thu"]);
}));

test("pha ảnh máy chủ ngoài: tiến trình riêng chỉ lấy máy chủ ngoài, mã và tệp tiến độ riêng; lượt của chính nguồn không đụng tới ảnh ngoài", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", ["https://cdn.gia.test/x/0", "https://a.example.org/x/1", "https://a.example.org/x/2", "https://b.example.org/y/1", "https://a.example.org/x/3"]);
  const nguon = nguonAnhUrl(() => ({}));
  const ngoai = chayAnh(dir, nguon.fetchImpl, { chiNgoai: true, luongSong: 1, soFile: 2 });
  const s1 = await ngoai.run();
  assert.equal(s1.s.so?.soFile, 4, "bốn ảnh máy chủ ngoài");
  assert.ok(nguon.daGoi.every((u) => u.includes("example.org")), "không gửi lời nào tới máy chủ của nguồn");
  const items = (await moiKind(dir)).filter((it) => it.kind === "anh_du_an");
  assert.deepEqual(
    items.map((it) => [it.sourceId, it.meta.nhomMayChu, it.meta.soFile]),
    [["du-an-8-anh-ngoai-1-2", "ngoai", 2], ["du-an-8-anh-ngoai-3-4", "ngoai", 2]],
  );
  assert.ok((await readdir(join(dir, "tien-do"))).includes("anh-ngoai-8.jsonl"), "tệp tiến độ riêng");
  const cuaNguon = chayAnh(dir, nguon.fetchImpl, { chiNgoai: false, luongSong: 1, soFile: 2 });
  const s2 = await cuaNguon.run();
  assert.equal(s2.s.so?.soFile, 1, "lượt của chính nguồn chỉ lấy một ảnh trên máy chủ của nguồn");
  assert.deepEqual((await moiKind(dir)).filter((it) => it.kind === "anh_du_an" && it.meta.nhomMayChu !== "ngoai").map((it) => it.sourceId), ["du-an-8-anh-1-1"]);
}));

test("pha ảnh máy chủ ngoài: máy chủ nào chặn (403, trang HTML) thì ghi lý do, bỏ qua máy chủ đó, lượt vẫn đi tiếp; máy chủ bị chặn được nhớ cho các lượt sau", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", ["https://a.example.org/x/1", "https://a.example.org/x/2", "https://b.example.org/y/1", "https://c.example.org/z/1", "https://a.example.org/x/3"]);
  const chan = nguonAnhUrl((u) => (u.hostname.startsWith("a.") ? { status: 403, body: "<Error><Code>AccessDenied</Code></Error>" } : u.hostname.startsWith("c.") ? { body: "<html>captcha</html>", kieu: "text/html" } : {}));
  const r = await chayAnh(dir, chan.fetchImpl, { chiNgoai: true, luongSong: 1, soFile: 10 }).run();
  assert.equal(r.s.calls, 3, "một lời tới a, một lời tới b, một lời tới c; các ảnh còn lại của a không được hỏi");
  assert.equal(r.s.so?.soFile, 1, "chỉ ảnh của máy chủ b");
  assert.equal(r.s.so?.soDuAnXong, 1, "mọi ảnh máy chủ ngoài đã có kết quả (lấy được hoặc ghi lý do), dự án xong ngay lượt này");
  const loi = Object.fromEntries((await moiKind(dir)).filter((it) => it.kind === "anh_du_an").flatMap((it) => it.meta.mediaFiles).map((m: { url: string; error?: string }) => [new URL(m.url).pathname, m.error]));
  assert.deepEqual(loi, { "/x/1": "chan-o-may-chu", "/x/2": "chan-o-may-chu", "/y/1": undefined, "/z/1": "chan-o-may-chu", "/x/3": "chan-o-may-chu" });
  assert.equal(r.keoDan.blocks, 0, "máy chủ ngoài chặn không tính là nguồn chặn");
  const tepBiChan = JSON.parse(await readFile(join(dir, "tien-do", "may-chu-bi-chan.json"), "utf8")) as Record<string, { lyDo: string }>;
  assert.equal(Object.keys(tepBiChan).length, 2, "hai máy chủ bị chặn được nhớ (chỉ theo mã băm của tên máy chủ)");
  assert.ok(Object.keys(tepBiChan).every((k) => /^[0-9a-f]{16}$/.test(k)), "không lưu tên máy chủ thật");
  // Lượt sau: máy chủ a đã mở lại (trả ảnh bình thường) nhưng vẫn bị bỏ qua vì đã ghi nhận bị chặn.
  const mo = nguonAnhUrl(() => ({}));
  const r2 = await chayAnh(dir, mo.fetchImpl, { chiNgoai: true, luongSong: 1, soFile: 10 }).run();
  assert.equal(r2.s.calls, 0);
  assert.equal(r2.s.so?.soDuAnXong, 0, "dự án đã xong từ lượt trước");
}));

test("pha ảnh máy chủ ngoài: máy chủ không còn tồn tại là lỗi vĩnh viễn của từng URL, nhiều ảnh như vậy KHÔNG làm dừng lượt", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", Array.from({ length: 12 }, (_, i) => `https://chet${i}.example.org/x/${i}`));
  const chet = nguonAnhUrl(() => {
    throw new TypeError("fetch failed", { cause: Object.assign(new Error("getaddrinfo ENOTFOUND"), { code: "ENOTFOUND" }) });
  });
  const r = await chayAnh(dir, chet.fetchImpl, { chiNgoai: true, luongSong: 1, soFile: 4 }).run();
  assert.equal(r.s.calls, 12);
  assert.equal(r.s.so?.soDuAnXong, 1);
  const loi = (await moiKind(dir)).flatMap((it) => it.meta.mediaFiles ?? []).map((m: { error?: string }) => m.error);
  assert.deepEqual([...new Set(loi)], ["may-chu-khong-ton-tai"]);
}));

test("pha ảnh máy chủ ngoài: mỗi máy chủ ngoài tối đa sáu lời cùng lúc (mức trình duyệt thường mở) dù lượt khai nhiều luồng hơn", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", Array.from({ length: 16 }, (_, i) => `https://mot.example.org/x/${i}`));
  let dangChay = 0;
  let toiDa = 0;
  const dem = nguonAnhUrl(async () => {
    dangChay++;
    toiDa = Math.max(toiDa, dangChay);
    await new Promise((r) => setTimeout(r, 15));
    dangChay--;
    return {};
  });
  const { s } = await chayAnh(dir, dem.fetchImpl, { chiNgoai: true, luongSong: 12, soFile: 20 }).run();
  assert.equal(s.so?.soFile, 16, "mười sáu ảnh của máy chủ đó đều tải được");
  assert.equal(toiDa, TOI_DA_MOT_MAY_CHU_NGOAI, `nhiều nhất sáu lời cùng lúc tới một máy chủ ngoài (đo ${toiDa})`);
}));

test("pha ảnh: máy chủ của nguồn trả 200 kèm trang HTML là trang thử thách → dừng cả lượt với lý do blocked", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", ["https://cdn.gia.test/a/1"]);
  const html = nguonAnhUrl(() => ({ body: "<html>captcha</html>", kieu: "text/html" }));
  const lan = chayAnh(dir, html.fetchImpl, { luongSong: 1, soFile: 5 });
  const e = await lan.run().then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped, String(e));
  assert.equal(e.reason, "blocked");
}));

test("pha ảnh: ghi nhật ký mỗi lô (số ảnh, số byte, số lỗi) để lượt dừng giữa chừng vẫn thấy được tiến độ", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", [1, 2, 3].map((i) => `https://cdn.gia.test/a/${i}`));
  const nguon = nguonAnh(() => ({}));
  const r = await chayAnh(dir, nguon.fetchImpl, { soFile: 2 }).run();
  const lo = r.log.filter((x) => x.suKien === "anh-lot");
  assert.deepEqual(
    lo.map((x) => [x.nhomMayChu, x.soFile, Number(x.soByte) > 0, x.soLoi]),
    [["nguon", 2, true, 0], ["nguon", 1, true, 0]],
  );
}));

test("executePhase pha images: mất mạng (network-down) KHÔNG ghi nhận là nguồn chặn — lượt ảnh nhiều luồng kế vẫn được chạy", async () => withTmp(async (dir) => {
  await duaVaoKho(dir, [anh("8", { danh_sach_hinh_anh: Array.from({ length: 12 }, (_, i) => ({ photo_url: `https://cdn.gia.test/m/${i}` })) }, null, "2026-11-24T05:00:00.000Z")]);
  const mang = nguonAnh(() => "mang");
  const r1 = await chayQuaDieuKhien(dir, "images", mang.fetchImpl, { luongSong: 2 });
  assert.equal(r1.stopReason, "network-down");
  assert.equal(JSON.parse(await readFile(join(dir, "tien-do-anh", "state.json"), "utf8")).blockedRuns, 0);
  const tot = nguonAnh(() => ({}));
  const r2 = await chayQuaDieuKhien(dir, "images", tot.fetchImpl, { luongSong: 2 });
  assert.notEqual(r2.stopReason, "fast-after-block");
  assert.equal(r2.ok, true);
}));

// ---------- pha căn hộ theo lượt soát: lỗi mềm, lỗi tạm, trang hỏng ----------

test("pha căn hộ toàn bộ: trang sau trả status false → dừng source-error; trang đó không được ghi, toà không được ghi nhận", async () => withTmp(async (dir) => {
  const goc = await duaVaoKho(dir, [chiTiet("7", { is_exists_apartment_info: true, danh_sach_thap: ["A"], so_can: 2 }, null, "2026-11-24T05:00:00.000Z")]);
  const ds = { "7": { A: [[["a1"], ["a2"]]] } };
  const nguon = nguonCanHo(ds, {}, { calls: 500, minutes: 60 }, { trang: (duAn, thap, page) => (page === 1 ? "mem" : undefined) });
  const e = await chayCanHo(dir, nguon.client, {}).run().then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped, String(e));
  assert.equal(e.reason, "source-error");
  const list = (await moiKind(dir, goc)).filter((it) => it.kind === "can_ho_list");
  assert.deepEqual(list.map((it) => it.sourceId), [], "không trang nào của toà được ghi làm dữ liệu khi có trang lỗi mềm");
  assert.equal((await moiKind(dir, goc)).some((it) => it.kind === "can_ho_toa"), false, "toà thiếu trang không có bản gộp");
  await assert.rejects(readFile(join(dir, "tien-do", "can-ho-7.jsonl")), "chưa có gì được ghi nhận");
}));

test("pha căn hộ toàn bộ: chi tiết căn trả status false → dừng source-error; căn đó không ghi, không bị ghi nhầm là lệch mã", async () => withTmp(async (dir) => {
  await duaVaoKho(dir, [chiTiet("7", { is_exists_apartment_info: true, danh_sach_thap: ["A"], so_can: 2 }, null, "2026-11-24T05:00:00.000Z")]);
  const nguon = nguonCanHo({ "7": { A: [[["a1", "a2"]]] } }, {}, { calls: 500, minutes: 60 }, { can: (ma) => (ma === "a2" ? "mem" : undefined) });
  const e = await chayCanHo(dir, nguon.client, { concurrency: 1 }).run().then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped, String(e));
  assert.equal(e.reason, "source-error");
  const td = await new NhatKyTienDo(join(dir, "tien-do", "can-ho-7.jsonl")).readAll();
  assert.equal(JSON.stringify(td).includes("khớp mã căn"), false, "lỗi mềm không bị ghi là lệch mã");
}));

test("pha căn hộ toàn bộ: một trang liệt kê lỗi mạng tạm → toà đó bị bỏ qua trong lượt này, lượt vẫn đi tiếp; toà chưa được ghi nhận nên lượt sau liệt kê lại", async () => withTmp(async (dir) => {
  await duaVaoKho(dir, [chiTiet("7", { is_exists_apartment_info: true, danh_sach_thap: ["A", "B"], so_can: 3 }, null, "2026-11-24T05:00:00.000Z"), chiTiet("8", { is_exists_apartment_info: true, danh_sach_thap: ["A"], so_can: 1 }, null, "2026-11-24T05:00:00.000Z")]);
  const ds = { "7": { A: [[["a1"], ["a2"]]], B: [[["b1", "b2"]]] }, "8": { A: [[["c1"]]] } };
  let hong = true;
  const nguon1 = nguonCanHo(ds, {}, { calls: 500, minutes: 60 }, { trang: (duAn, thap, page) => (hong && duAn === "7" && thap === "A" && page === 1 ? "mang" : undefined) });
  const s1 = await chayCanHo(dir, nguon1.client, {}).run();
  assert.deepEqual(s1.s.so, { soDuAnXong: 1, soDuAnDaXongTruoc: 0, soToa: 1, soToaKhop: 1, soToaLoi: 1, maDuNhieu: 1, soDaLay: 1, soLoi: 0 }, "toà B của dự án 7 lấy đủ; toà A lỗi; dự án 8 xong");
  assert.ok(s1.log.some((x) => x.suKien === "can-ho-toa-loi" && x.toa === "A"));
  const td = await new NhatKyTienDo(join(dir, "tien-do", "can-ho-7.jsonl")).readAll();
  assert.deepEqual(td.filter((r) => typeof r.toa === "string").map((r) => r.toa), ["B"], "toà A chưa được ghi nhận");
  assert.equal(td.some((r) => r.xong === true), false, "dự án 7 chưa xong");
  hong = false;
  const nguon2 = nguonCanHo(ds);
  const s2 = await chayCanHo(dir, nguon2.client, {}).run();
  assert.equal(s2.s.so?.soDuAnXong, 1, "lượt hai: toà A liệt kê lại, dự án 7 xong");
  assert.ok(nguon2.sent.some((u) => u.includes("/apartment-list")), "có liệt kê lại toà A");
}));

test("pha căn hộ toàn bộ: chi tiết căn lỗi mạng tạm chưa được ghi là lỗi; thử lại ở các lượt sau, quá ba lượt thì ghi qua-so-lan-thu", async () => withTmp(async (dir) => {
  await duaVaoKho(dir, [chiTiet("7", { is_exists_apartment_info: true, danh_sach_thap: ["A"], so_can: 2 }, null, "2026-11-24T05:00:00.000Z")]);
  const ds = { "7": { A: [[["a1", "a2"]]] } };
  const nguon = nguonCanHo(ds, {}, { calls: 500, minutes: 60 }, { can: (ma) => (ma === "a1" ? "mang" : undefined) });
  for (let lan = 1; lan <= 3; lan++) {
    const r = await chayCanHo(dir, nguon.client, { concurrency: 1 }).run();
    assert.equal(r.s.so?.soDuAnXong, 0, `lượt ${lan}: còn một căn dở`);
    assert.equal(nguon.sent.filter((u) => u.includes("ma_can=a1")).length, lan * 2, "mỗi lượt gửi hai lời (một lần thử lại sau khi hỏi phiên) rồi tính là lỗi tạm");
  }
  const r4 = await chayCanHo(dir, nguon.client, { concurrency: 1 }).run();
  assert.equal(r4.s.so?.soDuAnXong, 1, "lượt tư: quá hạn số lượt, căn được ghi nhận, dự án xong");
  assert.equal(nguon.sent.filter((u) => u.includes("ma_can=a1")).length, 6, "lượt tư không hỏi lại căn a1");
  const gop = (await moiKind(dir)).find((it) => it.kind === "can_ho_du_an")!;
  assert.deepEqual([gop.meta.soDaLay, gop.meta.soKhongLayDuoc], [1, 1]);
}));

// ---------- link đã hết hạn biết trước: không gửi lời nào ----------

test("projectImages: link ký số ghi cả thời điểm hết hạn (X-Amz-Date + X-Amz-Expires); link thường hay tham số lạ thì không có", async () => withTmp(async (dir) => {
  await duaAnhVaoKho(dir, "8", [
    "https://cdn.gia.test/a.jpg?X-Amz-Date=20261118T010000Z&X-Amz-Expires=604800&X-Amz-Signature=abc",
    "https://cdn.gia.test/b.jpg?X-Amz-Date=20261118T010000Z",
    "https://cdn.gia.test/c.jpg?X-Amz-Date=1900&X-Amz-Expires=604800",
    "https://cdn.gia.test/d.jpg?X-Amz-Date=20261118T010000Z&X-Amz-Expires=nam",
    "https://cdn.gia.test/e.jpg",
  ]);
  const kq = await projectImages(dir, ["cdn.gia.test"]);
  assert.deepEqual(
    kq.duAn[0].anh.map((a) => a.hetHan),
    ["2026-11-25T01:00:00.000Z", null, null, null, null],
    "chỉ link có đủ ngày ký đúng dạng và số giây mới tính được hạn",
  );
}));

test("pha ảnh: link ký số đã quá hạn theo chính tham số của nó thì KHÔNG gửi lời nào — sau khi hỏi thử MỘT link làm bằng chứng; link vừa mới hết hạn (trong khoảng đệm 5 phút), link đúng biên 5 phút, link còn hạn và link thường vẫn được hỏi", async () => withTmp(async (dir) => {
  const ky = (ngayGio: string, p: string) => `https://cdn.gia.test/p/${p}?X-Amz-Date=${ngayGio}&X-Amz-Expires=604800&X-Amz-Signature=abc`;
  await duaAnhVaoKho(dir, "8", [
    ky("20261118T005400Z", "chet"), // hết hạn 2026-11-25T00:54:00Z — sáu phút trước: là link HỎI THỬ
    ky("20261118T005500Z", "chet-2"), // hết hạn 00:55:00Z — đoán theo bằng chứng, không hỏi
    ky("20261118T005800Z", "vua-chet"), // hết hạn 00:58:00Z — hai phút trước: trong khoảng đệm, vẫn hỏi
    ky("20261118T010500Z", "bien"), // hết hạn 01:05:00Z — đúng biên 5 phút: còn trong khoảng đệm, vẫn hỏi
    ky("20261118T080000Z", "con-han"), // hết hạn 2026-11-25T08:00:00Z
    "https://cdn.gia.test/p/thuong.jpg",
  ]);
  const hetHanThat = "<Error><Code>AccessDenied</Code><Message>Request has expired</Message></Error>";
  const nguon = nguonAnh((duong) => (/\/p\/(chet|chet-2|vua-chet)$/.test(duong) ? { status: 403, body: hetHanThat } : {}));
  const { s, keoDan } = await chayAnh(dir, nguon.fetchImpl, { soFile: 10, now: "2026-11-25T01:00:00.000Z" }).run();
  assert.deepEqual(nguon.daGoi, ["/p/chet", "/p/vua-chet", "/p/bien", "/p/con-han", "/p/thuong.jpg"], "hỏi thử một link đoán đã hết hạn; sau đó chỉ không hỏi link đoán hết hạn");
  assert.equal(keoDan.calls, 5, "link đoán hết hạn không tốn lời gọi");
  const [item] = (await moiKind(dir)).filter((it) => it.kind === "anh_du_an");
  const ten = (u: string) => u.match(/\/p\/([a-z0-9-]+)/)![1];
  assert.deepEqual(
    item.meta.mediaFiles.map((x: { url: string; file?: string; error?: string; chiTiet?: string }) => [ten(x.url), x.file ? "có tệp" : x.error, x.chiTiet ?? null]),
    [
      ["chet", "het-han", hetHanThat],
      ["chet-2", "het-han", "du-doan-het-han"],
      ["vua-chet", "het-han", hetHanThat],
      ["bien", "có tệp", null],
      ["con-han", "có tệp", null],
      ["thuong", "có tệp", null],
    ],
  );
  assert.equal(s.so?.soFile, 3);
  assert.equal(s.so?.soLoi, 3);
}));
