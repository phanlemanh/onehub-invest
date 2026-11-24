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
