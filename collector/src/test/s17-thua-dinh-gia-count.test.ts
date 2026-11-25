import { strict as assert } from "node:assert";
import { test } from "node:test";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

import { countSnapshots, readSourceSnapshots } from "../collectors/s17-thua-dinh-gia/count.js";
import { makeItem } from "../collectors/s17-thua-dinh-gia/kinds.js";
import { S17_CITY, S17_NOTES, S17_SCHEMA_VERSION, S17_SOURCE, BatchWriter } from "../collectors/s17-thua-dinh-gia/store.js";
import { SnapshotWriter } from "../core/storage.js";

/**
 * Lệnh đếm của mốc ngày 1: mỗi kind một con số đọc từ manifest (không cần DB). Chỉ tính snapshot mang
 * dấu hiệu khuôn 2; bản ghi khuôn 1 lúc dựng bộ thu được đếm riêng và bỏ qua.
 */

const at = "2026-11-24T05:00:00.000Z";
const detail = (id: number, flag: boolean | undefined) => makeItem("du_an_detail", `du-an-${id}`, { detail: { data: { properties: { id } } } }, { request: { id }, coBangCan: flag ?? null }, at);
const listPage = (n: number, ids: number[], total: number) =>
  makeItem("du_an_list", `trang-${n}`, { json: { status: true, data: { projects: { content: ids.map((id) => ({ id })), totalElements: total, totalPages: 2 } } } }, { request: { page: n - 1 }, tongDuAn: total, soTrang: 2 }, at);

test("readSourceSnapshots + countSnapshots: đếm từng kind qua manifest, bỏ snapshot khuôn 1, tổng hợp cờ và số đo", async () => {
  const root = await mkdtemp(join(tmpdir(), "s17-dem-"));
  try {
    const w = new BatchWriter({ root, maxItems: 2, phase: "projects" });
    await w.add(listPage(1, [1, 2, 3], 4));
    await w.add(listPage(2, [3, 4, 2], 4));
    await w.add(detail(1, true));
    await w.add(detail(2, false));
    await w.add(detail(3, true));
    await w.add(makeItem("tile_coverage", "coverage-vn-a", { tiles: ["17/1/1"] }, { request: { zoom: 17 }, soDiemQuet: 5, trong: 1, rong: 3, vang: 1, loi: 0 }, at));
    await w.add(makeItem("tile_coverage", "coverage-vn-b", { tiles: [] }, { request: { zoom: 17 }, soDiemQuet: 2, trong: 0, rong: 2, vang: 0, loi: 0 }, at));
    await w.add(detail(4, undefined));
    await w.add(detail(5, false)); // item thứ 9 nằm trong lô dở → lượt chốt cuối có lý do dừng
    await w.flush("dừng: quá trần");

    // Một snapshot khuôn 1 (không mang dấu hiệu) — phải bị bỏ qua và đếm riêng
    const old = new SnapshotWriter(root, S17_CITY, S17_SOURCE, { schemaVersion: S17_SCHEMA_VERSION });
    await old.write([makeItem("static_config", "static-area.by.code", { json: {} }, {}, at)]);
    await old.finalize({ discovered: 1, captured: 1, failed: 0, methods: { static_config: 1 }, notes: ["S17 pha reference"] });

    const dirs = (await readdir(join(root, "vn"))).filter((n) => n.startsWith("vn__s17-thua-dinh-gia__")).sort();
    const snaps = await readSourceSnapshots(root);
    assert.equal(snaps.length, dirs.length, "đọc mọi snapshot S17, kể cả khuôn 1");
    const c = countSnapshots(snaps);

    assert.equal(c.skippedOldScheme, 1);
    assert.equal(c.snapshots, 5, "9 item, lô 2 → 4 snapshot đầy và 1 lô dở (1 item) có lý do dừng");
    assert.deepEqual(c.byKind, { du_an_list: 2, du_an_detail: 5, tile_coverage: 2 });
    assert.equal(c.stopped, 1, "một snapshot có manifest.error");
    assert.deepEqual(c.apartmentTable, { yes: 2, no: 2, unknown: 1 });
    assert.equal(c.projectIdsUnique, 4, "id 2 và 3 lặp giữa hai trang chỉ tính một lần");
    assert.equal(c.tongDuAn, 4, "tổng nguồn công bố");
    assert.deepEqual(c.tile, { provinces: 2, scanned: 7, withData: 1, empty: 5, absent: 1, error: 0 });
    assert.equal(c.firstAt <= c.lastAt, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("countSnapshots: tóm tắt căn hộ và thửa của mốc ngày 2 (toà khớp, căn khớp mã, thửa theo phương pháp, mỗi km²)", () => {
  const mk = (kind: string, sourceId: string, payload: unknown, meta: Record<string, unknown>) => ({ kind, sourceId, payload, meta });
  const c = countSnapshots([
    {
      snapshotId: "a",
      currentScheme: true,
      manifest: { error: undefined, startedAt: "2026-11-24T10:00:00.000Z", coverage: { methods: { can_ho_toa: 2, can_ho_detail: 3, thua: 3, thua_goi_y: 1, thua_khu_vuc: 1 } } } as never,
      items: [
        mk("can_ho_toa", "du-an-1004-toa-p12", { maCan: ["a"] }, { khop: true, tongCan: 719, maDuNhieu: 719 }),
        mk("can_ho_toa", "du-an-1004-toa-p9", { maCan: ["a"] }, { khop: false, tongCan: 519, maDuNhieu: 501 }),
        mk("can_ho_detail", "du-an-1004-can-a", {}, { khopMaCan: true }),
        mk("can_ho_detail", "du-an-1004-can-b", {}, { khopMaCan: true }),
        mk("can_ho_detail", "du-an-1004-can-c", {}, { khopMaCan: false }),
        mk("thua", "thua-1", {}, { phuongPhap: "grid" }),
        mk("thua", "thua-2", {}, { phuongPhap: "grid" }),
        mk("thua", "thua-3", {}, { phuongPhap: "suggest" }),
        mk("thua_goi_y", "goi-y-x", {}, { soMuc: 15 }),
        mk("thua_khu_vuc", "khu-vuc-x", { soThuaLuoi: 2, soThuaGoiY: 1 }, { thuaMoiKm2: 4, loiMoiKm2: 16, tongLoi: 8, soThua: 3, request: { dienTichKm2: 0.5 } }),
      ],
    },
  ]);
  // codes đếm theo số mã thật trong payload.maCan (fixture mỗi toà một mã); rows là tổng dòng nguồn công bố.
  assert.deepEqual(c.apartmentBuilding, { total: 2, khop: 1, codes: 2, rows: 1238 }, "toà khớp: 719/719; toà P9 501/519 không khớp");
  assert.deepEqual(c.apartmentDetail, { ok: 2 }, "chỉ bản khớp mã mới được ghi vào kho; mục không khớp (nếu có) không đếm là «đã lấy»");
  assert.deepEqual(c.parcel, { grid: 2, suggest: 1, areas: 1, areaKm2: 0.5, calls: 8, perKm2: 4, callsPerKm2: 16 }, "mật độ tính theo thửa tìm được bằng lưới (2 thửa / 0,5 km²)");
});

test("countSnapshots: nguồn chưa có gì thì trả số không, không ném", () => {
  const c = countSnapshots([]);
  assert.equal(c.snapshots, 0);
  assert.deepEqual(c.byKind, {});
  assert.equal(c.apartmentTable, null);
  assert.equal(c.tile, null);
});

test("readSourceSnapshots: kiểm sha256 từng tệp trước khi đọc (luật tiêu thụ mục 2)", async () => {
  const root = await mkdtemp(join(tmpdir(), "s17-dem-"));
  try {
    const w = new BatchWriter({ root, maxItems: 10, phase: "x" });
    await w.add(detail(1, true));
    await w.flush();
    const dir = join(root, "vn", (await readdir(join(root, "vn")))[0]);
    const manifest = JSON.parse(await readFile(join(dir, "manifest.json"), "utf8")) as { files: { name: string }[] };
    const file = join(dir, manifest.files[0].name);
    const good = await readFile(file);
    await writeFile(file, Buffer.concat([good, Buffer.from([0])])); // sửa một byte tệp fixture (thư mục tạm của test)
    await assert.rejects(readSourceSnapshots(root), /sha256/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("S17_NOTES ngắn, ổn định để bên đọc lọc", () => {
  assert.match(S17_NOTES, /^S17 khuôn 2 /);
});

// ---------- mốc mở rộng (claudedp-2411-73): ảnh và căn hộ toàn bộ ----------

test("count: ảnh gốc đếm từ manifest (số tệp, số byte) mà KHÔNG đọc nội dung tệp ảnh; lỗi ảnh theo loại; bản gộp căn hộ mở rộng", async () => {
  const root = await mkdtemp(join(tmpdir(), "s17-dem-anh-"));
  try {
    const w = new BatchWriter({ root, maxItems: 10, phase: "images", schemaVersion: 18 });
    const anh = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    await w.addWithFiles(
      makeItem(
        "anh_du_an",
        "du-an-7-anh-1",
        { media: [{ url: "https://cdn.gia.test/a" }, { url: "https://img.ngoai.test/x" }, { url: "https://cdn.gia.test/het" }] },
        { request: { duAn: "7" }, mediaFiles: [{ url: "https://cdn.gia.test/a", file: "media/a.jpg", bytes: 7 }, { url: "https://img.ngoai.test/x", error: "host-not-allowed" }, { url: "https://cdn.gia.test/het", error: "het-han" }] },
        at,
      ),
      [{ name: "media/a.jpg", bytes: anh }],
    );
    await w.flush();
    const w2 = new BatchWriter({ root, maxItems: 10, phase: "apartments-all", schemaVersion: 18 });
    await w2.add(makeItem("can_ho_du_an", "du-an-7", { toa: [] }, { request: { id: "7" }, soToa: 2, soToaKhop: 1, maDuNhieu: 500, soDaLay: 480, soKhongLayDuoc: 20, moRong: true }, at));
    await w2.add(makeItem("can_ho_du_an", "du-an-1004", { toa: [] }, { request: { id: "1004" }, soToa: 4, soToaKhop: 4, maDuNhieu: 2457, soDaLay: 2344, soKhongLayDuoc: 113 }, at));
    await w2.flush();

    const snaps = await readSourceSnapshots(root);
    assert.equal(snaps[0].media?.files, 1, "số tệp ảnh lấy từ manifest");
    assert.equal(snaps[0].media?.bytes, 7);
    const c = countSnapshots(snaps);
    assert.deepEqual(c.images, { files: 1, bytes: 7, items: 1, duAn: 1, loi: { "host-not-allowed": 1, "het-han": 1 } });
    assert.deepEqual(c.apartmentsAll, { duAn: 1, toa: 2, toaKhop: 1, maDuNhieu: 500, soDaLay: 480, soLoi: 20 }, "chỉ bản gộp của mốc mở rộng (moRong), không tính bản của dự án mẫu");
    const day = await readSourceSnapshots(root, { kinds: ["can_ho_du_an"] });
    assert.equal(day[0].items.length, 0, "snapshot không có kind cần đọc thì không mở tệp items");
    assert.equal(day[0].media?.files, 1, "nhưng số ảnh vẫn đếm được từ manifest");
    const chiManifest = await readSourceSnapshots(root, { kinds: [] });
    assert.ok(chiManifest.every((s) => s.items.length === 0));
    assert.equal(countSnapshots(chiManifest).byKind.anh_du_an, 1, "byKind vẫn có từ coverage.methods");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
