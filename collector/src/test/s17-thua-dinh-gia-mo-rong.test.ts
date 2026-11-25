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

test("projectImages: gom mọi URL ảnh trên máy chủ được phép theo thứ tự gặp, kèm tên nhóm; URL trùng chỉ một lần; máy chủ ngoài bị bỏ và đếm; dự án có link ký sớm nhất đứng trước", async () => withTmp(async (dir) => {
  const w = new BatchWriter({ root: dir, maxItems: 100, phase: "projects" });
  const ky = (ngay: string, p: string) => `https://cdn.gia.test/p/${p}?X-Amz-Date=${ngay}T000000Z&X-Amz-Signature=abc`;
  await w.add(
    chiTiet(
      "8",
      {
        is_exists_apartment_info: true,
        danh_sach_thap: ["A"],
        danh_sach_hinh_anh: [{ photo_url: "https://img.ngoai.test/x.jpg" }],
        mo_ta: '<p>minh hoạ <img src="' + ky("20261124", "3") + '"></p>',
      },
      {
        status: true,
        data: [
          { id: 1, name: "Mặt bằng", photos: [[{ value: ky("20261124", "1") }]] },
          { id: 2, name: "Thực tế", albums: [{ photos: [[{ value: ky("20261119", "2") }, { value: ky("20261124", "1") }]] }] },
        ],
      },
      "2026-11-24T05:00:00.000Z",
    ),
  );
  await w.add(chiTiet("9", { is_exists_apartment_info: true, danh_sach_thap: ["A"] }, { data: [{ id: 3, name: "Toàn cảnh", photos: [[{ value: ky("20261126", "9") }]] }] }, "2026-11-24T05:00:00.000Z"));
  await w.add(chiTiet("11", { is_exists_apartment_info: false }, null, "2026-11-24T05:00:00.000Z"));
  await w.flush();

  const kq = await projectImages(dir, ["cdn.gia.test"]);
  assert.deepEqual(
    kq.duAn.map((d) => [d.id, d.anh.map((a) => [a.url.includes("/p/2") ? "2" : a.url.includes("/p/1") ? "1" : a.url.includes("/p/3") ? "3" : "9", a.nhom, a.ngayKy])]),
    [
      ["8", [["1", ["Mặt bằng", "Thực tế"], "20261124"], ["2", ["Thực tế"], "20261119"], ["3", [], "20261124"]]],
      ["9", [["9", ["Toàn cảnh"], "20261126"]]],
    ],
    "dự án 8 đứng trước dự án 9 vì có link ký sớm hơn (hết hạn sớm hơn); URL 1 gặp hai nhóm nhưng chỉ một lần",
  );
  assert.equal(kq.soUrlMayChuNgoai, 1, "URL ở máy chủ ngoài không lấy, chỉ đếm");
  assert.equal(kq.soUrl, 4);
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
function nguonAnh(tra: (duong: string) => KetQuaNguon) {
  const daGoi: string[] = [];
  const fetchImpl = (async (url: string | URL | Request) => {
    const u = String(url);
    const duong = new URL(u).pathname;
    daGoi.push(duong);
    const k = tra(duong);
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

const chayAnh = (dir: string, fetchImpl: typeof fetch, o: { soFile?: number; luongSong?: number; caps?: { calls: number; minutes: number }; state?: RunState } = {}) => {
  const state = o.state ?? emptyState();
  const w = new BatchWriter({ root: dir, maxItems: 1000, phase: "images", schemaVersion: S17_SCHEMA_VERSION_MO_RONG, maxFiles: o.soFile ?? 2 });
  const log: Record<string, unknown>[] = [];
  const keoDan = new KeoDan({ caps: o.caps ?? { calls: 1000, minutes: 60 }, now: () => new Date("2026-11-25T01:00:00.000Z").getTime() });
  const run = () =>
    runPhase({
      phase: "images",
      client: undefined as never,
      writer: w,
      state,
      save: async () => assert.equal(w.pendingCount + w.pendingFiles, 0, "trạng thái chỉ lưu khi lô đã chốt"),
      log: (e) => log.push(e),
      now: () => new Date("2026-11-25T01:00:00.000Z"),
      snapshotRoot: dir,
      tienDoDir: join(dir, "tien-do"),
      anh: { hostSuffixes: ["cdn.gia.test"], luongSong: o.luongSong ?? 2, maxBytes: 1024 * 1024, timeoutMs: 5000, userAgent: "oneinvest-collector/1", fetchImpl },
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
  assert.ok(items.every((it) => it.kind === "anh_du_an" && /^du-an-\d+-anh-\d+$/.test(it.sourceId)), JSON.stringify(items.map((it) => it.sourceId)));
  const ngoai = items.flatMap((it) => it.meta.mediaFiles).find((m: { url: string }) => m.url.includes("ngoai.test"));
  assert.equal(ngoai.error, "host-not-allowed", "URL máy chủ ngoài được ghi lại kèm lý do");
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
});

// ---------- pha căn hộ toàn bộ dự án ----------

import { S17Client, type Response as PhanHoi, type TransportMany } from "../collectors/s17-thua-dinh-gia/client.js";

const FAKE_CFG_CAN_HO = {
  hosts: FAKE_HOSTS,
  paths: { "apartment-list": "/v2.x/apartment-list", "apartment-detail": "/v2.x/apartment-detail", "data-available": "/v2.x/data-available", "asset-type": "/v2.x/asset-type" },
};

/** Nguồn giả cho pha căn hộ toàn bộ: `trang[dự án][toà][lượt][trang]` = mã căn của trang; `lech[mã]` = mã nguồn trả về thay vì mã đã gửi. */
function nguonCanHo(ds: Record<string, Record<string, string[][][]>>, lech: Record<string, string> = {}, caps = { calls: 10_000, minutes: 60 }) {
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
      if (page === 0) lotCuaToa.set(`${duAn}/${thap}`, (lotCuaToa.get(`${duAn}/${thap}`) ?? -1) + 1);
      const cacLot = ds[duAn]?.[thap] ?? [[]];
      const lot = Math.min(lotCuaToa.get(`${duAn}/${thap}`) ?? 0, cacLot.length - 1);
      const codes = (cacLot[lot] ?? [])[page] ?? [];
      return json({ status: true, message: null, data: { content: codes.map((text) => ({ text, sub_text: `Tháp ${thap}` })), totalElements: cacLot[cacLot.length - 1].flat().length, totalPages: (cacLot[lot] ?? []).length, size: 100, number: page }, pagination: null, extra: {} });
    }
    const maCan = u.searchParams.get("ma_can") ?? "";
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
  assert.deepEqual(s2.s.so, { soDuAnDaXongTruoc: 0, soDuAnXong: 2, soToa: 2, soToaKhop: 2, maDuNhieu: 5, soDaLay: 4, soLoi: 1 });
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
