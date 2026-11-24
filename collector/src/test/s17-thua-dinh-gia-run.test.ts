import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

import { loadConfig } from "../collectors/s17-thua-dinh-gia/config.js";
import { S17Client, RunStopped, type Response } from "../collectors/s17-thua-dinh-gia/client.js";
import { S17_NOTES, S17_SCHEMA_VERSION, S17_SOURCE, BatchWriter } from "../collectors/s17-thua-dinh-gia/store.js";
import { assertBalanceUnchanged, hasApartmentTable, makeItem, tileBases } from "../collectors/s17-thua-dinh-gia/kinds.js";
import { emptyState, runPhase, type RunOptions, type RunState } from "../collectors/s17-thua-dinh-gia/run.js";

/**
 * S17 mốc ngày 1 (claudedp-2411-20) — ghi snapshot theo lô nhỏ với schemaVersion 17; các kind của phần
 * chắc (bảng tham chiếu, đơn giá đất theo quận, mặt nạ tile, danh sách + chi tiết + cây toà dự án);
 * dừng giữa chừng không mất phần đã lấy và nối tiếp được. Dữ liệu GIẢ, máy chủ .test.
 */

const FAKE_CONFIG = {
  hosts: { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" },
  paths: {
    "province-catalog": "/v2.x/area-by-code",
    "full-config": "/v2.x/configuration",
    "attribute-dictionary": "/v2.x/static-info",
    "legal-docs": "/v2.x/legal/{type}",
    "asset-type": "/v2.x/asset-type",
    confidence: "/v2.x/confidence",
    "land-purpose": "/v2.x/land-purpose",
    "land-price-by-district": "/v2.x/land-price/{districtCode}",
    "project-list": "/v2.x/projects",
    "project-detail": "/v2.x/projects/{id}",
    "building-tree": "/v2.x/projects/{id}/tree",
    gallery: "/v2.x/gallery/{id}",
    "data-available": "/v2.x/data-available",
    balance: "/v2.x/balance",
  },
};

const json = (body: unknown, status = 200): Response => ({ status, contentType: "application/json", body: JSON.stringify(body) });
const env = (data: unknown) => ({ status: true, message: null, data, pagination: null, extra: {} });
const EMPTY_TILE_BYTES = 1784;

/** Nguồn giả: trả theo URL. `override` thay thế phản hồi theo vị trí lời gọi (tính từ 1). */
function fakeSource(override: Record<number, () => Response> = {}, failWhen?: (url: string) => boolean): { client: S17Client; sent: string[] } {
  const sent: string[] = [];
  const answer = (url: string): Response => {
    const u = new URL(url);
    const p = u.pathname;
    if (p.endsWith("/configuration")) return json(env({ boundaries_conf: { _boundaries_black: "https://tiles.gia.test/data/ranh_thua", _boundaries_qhsdd: "https://tiles.gia.test/data/qhsdd" }, enums: {} }));
    if (p.endsWith("/area-by-code")) {
      const code = u.searchParams.get("area_code");
      // Mã tỉnh trùng do sáp nhập (đo 24/11: 71 mục, 63 mã) — danh mục thật có mục lặp; mục đầu của danh sách quận không có mã
      if (!code) return json(env([{ code: "01", name: "Tỉnh A" }, { code: "79", name: "Thành phố B" }, { code: "01", name: "Tỉnh A (tên cũ)" }]));
      return json(env(code === "01" ? [{ code: null, name: null }, { code: "001", name: "Quận X" }, { code: "002", name: "Quận Y" }] : []));
    }
    if (p.includes("/land-price/")) return json(env(p.endsWith("/001") ? { vt_list: [{ vi_tri: "VT1", item_list: [] }] } : []));
    if (p.includes("/legal/")) return json(env({ type: p.slice(-1) }));
    if (p.endsWith("/projects")) {
      const page = Number(u.searchParams.get("page"));
      const content = page === 0 ? [{ id: 1, name: "A" }, { id: 2, name: "B" }] : [{ id: 3, name: "C" }, { id: 2, name: "B" }];
      return json({ ...env({ projects: { content, totalElements: 3, totalPages: 2 }, boundaries: null }), pagination: null });
    }
    const m = p.match(/\/projects\/(\d+)(\/tree)?$/);
    if (m && !m[2]) return m[1] === "2" ? json({ status: false, message: "not found" }, 404) : json(env({ id: m[1], properties: { id: m[1], ten_du_an: `Dự án ${m[1]}`, is_exists_apartment_info: m[1] === "1", danh_sach_thap: [] } }));
    if (m && m[2]) return json(env([{ ten_toa: "A" }]));
    if (p.includes("/gallery/")) return json(env([{ name: "album" }]));
    return json(env({ ok: true }));
  };
  const client = new S17Client({
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    caps: { calls: 1000, minutes: 60 },
    paceMs: 0,
    now: () => 1_000_000,
    sleep: async () => undefined,
    transport: async (url: string) => {
      sent.push(url);
      const i = sent.length;
      if (override[i]) return override[i]();
      if (failWhen?.(url)) throw new TypeError("Failed to fetch");
      return answer(url);
    },
  });
  return { client, sent };
}

type Snapshot = { manifest: Record<string, any>; items: any[] };

async function readSnapshots(root: string): Promise<Snapshot[]> {
  const dir = join(root, "vn");
  const names = (await readdir(dir)).filter((n) => !n.startsWith(".")).sort();
  const out: Snapshot[] = [];
  for (const n of names) {
    const manifest = JSON.parse(await readFile(join(dir, n, "manifest.json"), "utf8")) as Record<string, any>;
    const items: any[] = [];
    for (const f of manifest.files) {
      const gz = await readFile(join(dir, n, f.name));
      assert.equal(createHash("sha256").update(gz).digest("hex"), f.sha256, "sha256 từng tệp khớp manifest");
      assert.equal(gz.length, f.bytes);
      items.push(...JSON.parse(gunzipSync(gz).toString("utf8")));
    }
    out.push({ manifest, items });
  }
  return out;
}

const withTmp = async (fn: (dir: string) => Promise<void>): Promise<void> => {
  const dir = await mkdtemp(join(tmpdir(), "s17-test-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

const rig = (state: RunState = emptyState()) => {
  const events: Record<string, unknown>[] = [];
  let saves = 0;
  return { state, events, rig: { save: async () => { saves++; }, log: (e: Record<string, unknown>) => { events.push(e); } }, saves: () => saves };
};

// ---------- ghi lô nhỏ ----------

test("BatchWriter: ghi lô nhỏ; mỗi snapshot mang schemaVersion 17, đủ sha256, item nguyên vẹn", async () => withTmp(async (root) => {
  const w = new BatchWriter({ root, maxItems: 10, phase: "test" });
  const input = Array.from({ length: 25 }, (_, i) => makeItem("static_config", `s-${i}`, { i, ten: "Nguyễn Văn A\n" }, { stt: i }, "2026-11-24T03:00:00.000Z"));
  for (const it of input) await w.add(it);
  await w.flush();
  const snaps = await readSnapshots(root);
  assert.equal(snaps.length, 3, "25 item với lô 10 → 3 snapshot");
  assert.deepEqual(snaps.map((s) => s.manifest.counts.items), [10, 10, 5]);
  for (const s of snaps) {
    assert.equal(s.manifest.schemaVersion, S17_SCHEMA_VERSION);
    assert.equal(S17_SCHEMA_VERSION, 17);
    assert.equal(s.manifest.source, S17_SOURCE);
    assert.equal(s.manifest.city, "vn");
    assert.equal(s.manifest.coverage.methods.static_config, s.manifest.counts.items);
    assert.deepEqual(s.manifest.coverage.notes, [S17_NOTES], "mọi snapshot S17 mang cùng một dấu hiệu trong notes");
    assert.equal(s.manifest.error, undefined);
    assert.match(s.manifest.snapshotId, /^vn__s17-thua-dinh-gia__\d{4}-\d{2}-\d{2}T\d{9}(-\d+)?$/, "id snapshot theo khuôn của SnapshotWriter (-n khi đâm trùng mili-giây)");
  }
  assert.deepEqual(snaps.flatMap((s) => s.items), input, "item đọc lại y hệt item đưa vào");
}));

test("BatchWriter: flush cuối có lý do dừng thì ghi manifest.error", async () => withTmp(async (root) => {
  const w = new BatchWriter({ root, maxItems: 100, phase: "test" });
  await w.add(makeItem("du_an_detail", "du-an-1", {}, {}, "2026-11-24T03:00:00.000Z"));
  const id = await w.flush("dừng: nguồn trả 403 ở vai project-detail");
  assert.ok(id);
  const [snap] = await readSnapshots(root);
  assert.match(String(snap.manifest.error), /403/);
  assert.equal(await w.flush(), null, "flush khi không còn gì → null, không sinh snapshot rỗng");
}));

// ---------- hàm thuần ----------

test("tileBases: lấy sáu cơ sở tile từ cấu hình đầy đủ của nguồn", () => {
  const bases = tileBases(env({ boundaries_conf: { _boundaries_black: "https://t.test/data/ranh_thua", _boundaries_qhsdd: "https://t.test/data/qhsdd" } }));
  assert.deepEqual(bases, { ranh_thua: "https://t.test/data/ranh_thua", qhsdd: "https://t.test/data/qhsdd" });
  assert.deepEqual(tileBases(env({})), {});
});

test("hasApartmentTable: đọc cờ có bảng căn; thiếu cờ thì null chứ không suy false", () => {
  assert.equal(hasApartmentTable(env({ properties: { is_exists_apartment_info: true } })), true);
  assert.equal(hasApartmentTable(env({ properties: { is_exists_apartment_info: false } })), false);
  assert.equal(hasApartmentTable(env({ properties: {} })), null);
});

test("assertBalanceUnchanged: số dư giảm thì dừng cả lượt; không đổi thì đi tiếp", () => {
  assert.throws(() => assertBalanceUnchanged(20, 16), RunStopped);
  assert.equal(((): string => { try { assertBalanceUnchanged(20, 16); return ""; } catch (e) { return e instanceof RunStopped ? e.reason : String(e); } })(), "balance-spent");
  assert.doesNotThrow(() => assertBalanceUnchanged(20, 20));
});

// ---------- pha: bảng tham chiếu ----------

test("reference: thu đủ từ điển, danh mục tỉnh và đơn giá đất theo quận; quận không có bảng vẫn ghi", async () => withTmp(async (root) => {
  const { client, sent } = fakeSource();
  const w = new BatchWriter({ root, maxItems: 100, phase: "reference" });
  const r = rig();
  const summary = await runPhase({ phase: "reference", client, writer: w, ...r.rig, state: r.state });
  await w.flush();
  const items = (await readSnapshots(root)).flatMap((s) => s.items);
  const byKind = (k: string) => items.filter((it) => it.kind === k);
  assert.equal(summary.calls, 14, "1 cấu hình + 1 tỉnh + 3 từ điển + 2 pháp lý + 3 bảng nhỏ + 2 danh mục quận (3 mục tỉnh nhưng chỉ 2 mã — không lấy trùng) + 2 đơn giá");
  assert.equal(sent.length, 14);
  assert.equal(byKind("static_config").find((it) => it.sourceId === "static-danh-muc-quan-01")?.meta?.boQuaKhongMa, 1, "mục không có mã bị bỏ và được đếm");
  assert.equal(byKind("static_config").find((it) => it.sourceId === "static-danh-muc-tinh")?.meta?.soTinh, 3);
  assert.deepEqual(byKind("static_config").map((it) => it.sourceId).sort(), [
    "static-cau-hinh-day-du", "static-danh-muc-quan-01", "static-danh-muc-quan-79", "static-danh-muc-tinh", "static-do-tin-cay", "static-giay-to-phap-ly-1", "static-giay-to-phap-ly-2",
    "static-loai-tai-san", "static-muc-dich-su-dung-dat", "static-tu-dien-thuoc-tinh-1", "static-tu-dien-thuoc-tinh-2", "static-tu-dien-thuoc-tinh-3",
  ]);
  assert.ok(!JSON.stringify(items.map((it) => it.sourceId)).match(/[A-Za-z]+\.by\.|configuration|static\.info|property-type|land-purpose/), "sourceId trung tính: không mang tên đường của nguồn");
  assert.deepEqual(byKind("gia_ubnd").map((it) => it.sourceId), ["ubnd-001", "ubnd-002"]);
  assert.equal(byKind("gia_ubnd")[1].meta?.soViTri, 0, "quận không có bảng giá vẫn ghi, ghi rõ 0 vị trí");
  assert.equal(byKind("static_config")[0].meta?.congKhai, true);
  assert.ok(items.every((it) => it.source === S17_SOURCE));
  assert.deepEqual(r.state.priceDone, ["001", "002"]);
}));

// ---------- pha: dự án ----------

test("projects: duyệt hết trang, khử trùng id, lấy chi tiết + cây toà + thư viện; dự án 404 tính thất bại, đi tiếp", async () => withTmp(async (root) => {
  const { client, sent } = fakeSource();
  const w = new BatchWriter({ root, maxItems: 100, phase: "projects" });
  const r = rig();
  const summary = await runPhase({ phase: "projects", client, writer: w, ...r.rig, state: r.state, listSize: 100 });
  await w.flush();
  const items = (await readSnapshots(root)).flatMap((s) => s.items);
  const list = items.filter((it) => it.kind === "du_an_list");
  const detail = items.filter((it) => it.kind === "du_an_detail");
  assert.deepEqual(list.map((it) => it.sourceId), ["trang-1", "trang-2"]);
  assert.equal(list[0].meta?.tongDuAn, 3);
  assert.deepEqual(r.state.projectIds, ["1", "2", "3"], "id 2 lặp ở hai trang chỉ tính một lần");
  assert.deepEqual(detail.map((it) => it.sourceId), ["du-an-1", "du-an-3"]);
  assert.deepEqual(Object.keys(detail[0].payload as object).sort(), ["detail", "filterOptions", "gallery"]);
  assert.equal(detail[0].meta?.coBangCan, true, "dự án 1 có bảng căn");
  assert.equal(detail[1].meta?.coBangCan, false);
  assert.deepEqual(Object.keys(r.state.detailFailed), ["2"]);
  assert.match(String(r.state.detailFailed["2"]), /404/);
  assert.equal(summary.failed, 1);
  assert.equal(sent.length, 2 + 1 + 3 + 3, "2 trang + 1 lời lỗi (dự án 2) + 2 dự án × 3 lời");
}));

test("projects: dừng giữa danh sách thì chạy lại từ trang kế, không lấy lại trang đã có", async () => withTmp(async (root) => {
  const first = fakeSource();
  const state = emptyState();
  // lượt một: trần một lời → lấy trang 0 rồi dừng vì quá trần
  const capped = new S17Client({
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    caps: { calls: 1, minutes: 60 },
    paceMs: 0,
    now: () => 1_000_000,
    sleep: async () => undefined,
    transport: async (url: string) => { first.sent.push(url); return json(env({ projects: { content: [{ id: 1 }, { id: 2 }], totalElements: 3, totalPages: 2 } })); },
  });
  const w1 = new BatchWriter({ root, maxItems: 100, phase: "projects" });
  const r1 = rig(state);
  const e = await runPhase({ phase: "projects", client: capped, writer: w1, ...r1.rig, state }).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped && e.reason === "call-cap", `phải dừng vì quá trần, nhận ${String(e)}`);
  await w1.flush(`dừng: ${e instanceof Error ? e.message : String(e)}`);
  assert.equal(first.sent.length, 1);
  assert.deepEqual(state.projectIds, ["1", "2"], "id của trang đã lấy được giữ lại");
  // lượt hai: trần mới, chỉ gọi trang 1
  const second = fakeSource();
  const w2 = new BatchWriter({ root, maxItems: 100, phase: "projects" });
  const r2 = rig(state);
  const s2 = await runPhase({ phase: "projects", client: second.client, writer: w2, ...r2.rig, state });
  await w2.flush();
  assert.equal(second.sent.filter((u) => u.endsWith("/projects?page=0&query=&size=100")).length, 0, "không lấy lại trang 0");
  assert.equal(second.sent[0], "https://api.gia.test/v2.x/projects?page=1&query=&size=100");
  assert.deepEqual(state.projectIds, ["1", "2", "3"]);
  assert.equal(s2.calls + 1, second.sent.length + 1, "số lời của lượt hai khớp");
}));

test("projects: chạy lại thì không gọi gì nữa khi mọi thứ đã xong (nối tiếp)", async () => withTmp(async (root) => {
  const { client, sent } = fakeSource();
  const w = new BatchWriter({ root, maxItems: 100, phase: "projects" });
  const r = rig();
  await runPhase({ phase: "projects", client, writer: w, ...r.rig, state: r.state });
  await w.flush();
  const w2 = new BatchWriter({ root, maxItems: 100, phase: "projects" });
  await runPhase({ phase: "projects", client, writer: w2, ...r.rig, state: r.state });
  assert.equal(await w2.flush(), null);
  assert.equal(sent.length, 9);
}));

test("projects: bị chặn giữa chừng thì dừng; phần đang dở được chốt kèm lý do, danh sách đã chốt thì giữ nguyên", async () => withTmp(async (root) => {
  // Lời 1–2: hai trang danh sách (chốt ngay). Lời 3–5: ba lời của dự án 1 (còn trong bộ đệm). Lời 6: dự án 2 → 403.
  const { client, sent } = fakeSource({ 6: () => json({ message: "denied" }, 403) });
  const w = new BatchWriter({ root, maxItems: 100, phase: "projects" });
  const r = rig();
  const e = await runPhase({ phase: "projects", client, writer: w, ...r.rig, state: r.state }).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped && e.reason === "blocked", `phải dừng vì bị chặn, nhận ${String(e)}`);
  assert.equal(sent.length, 6, "đã dừng thì không gửi thêm lời nào");
  assert.deepEqual(r.state.projectIds, ["1", "2", "3"], "danh sách đã lấy thì giữ lại");
  assert.equal(w.pendingCount, 1, "dự án 1 đang dở, chưa chốt");
  await w.flush(`dừng: ${e instanceof Error ? e.message : String(e)}`);
  const snaps = await readSnapshots(root);
  const withError = snaps.filter((x) => x.manifest.error);
  assert.equal(withError.length, 1, "đúng một snapshot mang lý do dừng");
  assert.match(String(withError[0].manifest.error), /403/);
  assert.deepEqual(withError[0].items.map((it) => it.sourceId), ["du-an-1"], "phần đang dở không mất");
  assert.equal(snaps.filter((x) => !x.manifest.error).length, 2, "hai trang danh sách đã chốt sạch từ trước");
}));

test("projects: dừng khi không còn gì đang dở thì không sinh snapshot rỗng chỉ để chứa lý do", async () => withTmp(async (root) => {
  const { client } = fakeSource({ 5: () => json({ message: "denied" }, 403) });
  const w = new BatchWriter({ root, maxItems: 100, phase: "projects" });
  const r = rig();
  const e = await runPhase({ phase: "projects", client, writer: w, ...r.rig, state: r.state }).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped && e.reason === "blocked");
  assert.equal(w.pendingCount, 0);
  assert.equal(await w.flush(`dừng: ${e instanceof Error ? e.message : String(e)}`), null);
  assert.equal((await readSnapshots(root)).length, 2);
}));

// ---------- pha: mặt nạ tile ----------

test("tile-mask: tile rỗng 1.784 B và tile 404 không vào mặt nạ; một item mỗi tỉnh, đếm đủ các loại", async () => withTmp(async (root) => {
  const sent: string[] = [];
  let i = 0;
  const client = new S17Client({
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    caps: { calls: 100, minutes: 60 },
    paceMs: 0,
    now: () => 1_000_000,
    sleep: async () => undefined,
    transport: async (url: string) => {
      sent.push(url);
      i++;
      if (url.includes("/configuration")) return json(env({ boundaries_conf: { _boundaries_black: "https://tiles.gia.test/data/ranh_thua" } }));
      if (url.endsWith("/17/1/1.png")) return { status: 200, contentType: "image/png", body: "", bytes: 4200 };
      if (url.endsWith("/17/1/2.png")) return { status: 200, contentType: "image/png", body: "", bytes: EMPTY_TILE_BYTES };
      return { status: 404, contentType: "text/plain", body: "", bytes: 0 };
    },
  });
  const w = new BatchWriter({ root, maxItems: 100, phase: "tile-mask" });
  const r = rig();
  const summary = await runPhase({
    phase: "tile-mask", client, writer: w, ...r.rig, state: r.state, tileZoom: 17,
    grid: [
      { marketId: "vn-a", name: "Tỉnh A", tiles: ["17/1/1", "17/1/2"] },
      { marketId: "vn-b", name: "Thành phố B", tiles: ["17/2/1"] },
    ],
  });
  await w.flush();
  const items = (await readSnapshots(root)).flatMap((s) => s.items);
  assert.equal(summary.calls, 1 + 3, "một lời lấy cơ sở tile + ba tile");
  assert.deepEqual(items.map((it) => it.kind), ["tile_coverage", "tile_coverage"]);
  assert.deepEqual(items.map((it) => it.sourceId), ["coverage-vn-a", "coverage-vn-b"]);
  assert.deepEqual((items[0].payload as { tiles: string[] }).tiles, ["17/1/1"]);
  assert.equal(items[0].meta?.soDiemQuet, 2);
  assert.equal(items[0].meta?.rong, 1);
  assert.equal(items[1].meta?.vang, 1, "tile 404 là vắng");
  assert.deepEqual((items[1].payload as { tiles: string[] }).tiles, []);
  assert.deepEqual(r.state.tileDone, ["vn-a", "vn-b"]);
  assert.ok(sent.slice(1).every((u) => /^https:\/\/tiles\.gia\.test\/data\/ranh_thua\/17\/\d+\/\d+\.png$/.test(u)), "tile chỉ lấy dưới cơ sở của cấu hình nguồn");
}));

test("tile-mask: địa chỉ tile trong lưới sai khuôn thì dừng trước khi gửi lời nào", async () => {
  // Lượt thật 24/11: tệp lưới ghi "x/y" (thiếu mức zoom) — phải lộ ra trước lời gọi đầu, không phải sau một lời.
  const { client, sent } = fakeSource();
  const r = rig();
  const e = await runPhase({
    phase: "tile-mask", client, writer: new BatchWriter({ root: join(tmpdir(), "s17-khong-ghi"), maxItems: 1, phase: "tile-mask" }), ...r.rig, state: r.state, tileZoom: 17,
    grid: [{ marketId: "vn-a", name: "Tỉnh A", tiles: ["103796/61548"] }],
  }).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof Error && /tile/.test(e.message), `phải ném lỗi về địa chỉ tile, nhận ${String(e)}`);
  assert.equal(sent.length, 0, "kiểm lưới trước khi gọi nguồn");
});

test("tile-mask: địa chỉ tile tự bị từ chối (không ghép được đường khác)", async () => {
  const { client } = fakeSource();
  await assert.rejects(async () => client.getTile("https://tiles.gia.test/data/ranh_thua", "17/1/1/../../x"), /tile/);
  await assert.rejects(async () => client.getTile("https://tiles.gia.test/data/ranh_thua", "17/1/cp"), /tile/);
  assert.equal((await fakeSource()).sent.length, 0, "hai địa chỉ sai trên không gửi lời nào tới nguồn");
});

// ---------- pha: kiểm phiên ----------

test("session-check: đúng một lời, trả phiên còn sống", async () => {
  const { client, sent } = fakeSource();
  const r = rig();
  const out = await runPhase({ phase: "session-check", client, writer: new BatchWriter({ root: join(tmpdir(), "s17-khong-ghi"), maxItems: 1, phase: "check" }), ...r.rig, state: r.state });
  assert.equal(sent.length, 1);
  assert.equal(out.alive, true);
});

test("session-check: lời phiên và lời kiểm phiên đều lỗi mạng mà lời công khai vẫn chạy → hết phiên, không thử lại", async () => {
  // Lời 1 là lời kiểm phiên, lời 2 là lời đối chiếu phiên; cả hai lỗi, rồi một lời công khai đối chiếu là đủ để kết luận.
  const { client, sent } = fakeSource({ 1: () => { throw new TypeError("Failed to fetch"); }, 2: () => { throw new TypeError("Failed to fetch"); } });
  const r = rig();
  const e = await runPhase({ phase: "session-check", client, writer: new BatchWriter({ root: join(tmpdir(), "s17-khong-ghi"), maxItems: 1, phase: "check" }), ...r.rig, state: r.state }).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped && e.reason === "session-expired");
  assert.equal(sent.length, 3, "một lời phiên + một lời kiểm phiên + một lời công khai đối chiếu, rồi dừng");
});

test("projects: thư viện ảnh lỗi (phiên vẫn sống) thì vẫn ghi dự án, gallery để null; chi tiết và cây toà mới là bắt buộc", async () => withTmp(async (root) => {
  // Lượt thật 24/11: thư viện ảnh của một dự án lỗi mạng; không được mất hồ sơ và cây toà của dự án ấy.
  const { client } = fakeSource({}, (url) => url.includes("/gallery/"));
  const w = new BatchWriter({ root, maxItems: 100, phase: "projects" });
  const r = rig();
  const summary = await runPhase({ phase: "projects", client, writer: w, ...r.rig, state: r.state });
  await w.flush();
  const detail = (await readSnapshots(root)).flatMap((x) => x.items).filter((it) => it.kind === "du_an_detail");
  assert.deepEqual(detail.map((it) => it.sourceId), ["du-an-1", "du-an-3"], "dự án vẫn được ghi");
  assert.equal(detail[0].payload.gallery, null);
  assert.equal(typeof detail[0].meta?.galleryLoi, "string");
  assert.deepEqual(Object.keys(detail[0].payload.detail).sort(), ["data", "extra", "message", "pagination", "status"], "hồ sơ còn nguyên");
  assert.equal(detail[0].payload.filterOptions.data[0].ten_toa, "A", "cây toà còn nguyên");
  assert.equal(summary.failed, 1, "chỉ dự án 2 (chi tiết 404) tính là thất bại");
  assert.deepEqual(r.state.detailDone, ["1", "3"]);
}));

// ---------- trạng thái chỉ được lưu khi dữ liệu đã xuống đĩa ----------

/** Bọc `save`: mỗi lần lưu, bộ đệm của trình ghi phải rỗng (không nói «đã làm» cho thứ chưa chốt xuống đĩa). */
function savesWhilePending(o: RunOptions & { writer: BatchWriter }): { save: () => Promise<void>; violations: () => number } {
  let bad = 0;
  return {
    save: async () => {
      if (o.writer.pendingCount > 0) bad++;
      await o.save();
    },
    violations: () => bad,
  };
}

test("projects: chỉ lưu trạng thái khi snapshot đã chốt; hết lượt thì mọi thứ đã chốt và đã lưu", async () => withTmp(async (root) => {
  // Nguồn giả: 2 trang danh sách, 3 dự án (dự án 2 lỗi 404) → 2 item chi tiết; lô 5 → chỉ chốt ở cuối lượt.
  const { client } = fakeSource();
  const w = new BatchWriter({ root, maxItems: 5, phase: "projects" });
  const state = emptyState();
  const r = rig(state);
  const guard = savesWhilePending({ writer: w, save: r.rig.save } as unknown as RunOptions & { writer: BatchWriter });
  await runPhase({ phase: "projects", client, writer: w, ...r.rig, save: guard.save, state });
  assert.equal(w.pendingCount, 0, "hết lượt không còn gì trong bộ đệm");
  assert.equal(guard.violations(), 0, "không lần lưu trạng thái nào lúc dữ liệu còn nằm trong bộ đệm");
  assert.deepEqual(state.detailDone, ["1", "3"], "hai dự án lấy được đều được ghi nhận sau khi chốt");
  assert.ok(r.saves() >= 1, "có lưu trạng thái sau khi chốt");
}));

test("projects: chốt snapshot hỏng thì trạng thái KHÔNG nói đã làm việc chưa xuống đĩa", async () => withTmp(async (root) => {
  // Lượt thật 24/11: thư mục snapshot không sang được tiến trình ego → chốt bị lỗi, mà trạng thái vẫn nói đã lấy 4 trang.
  const notADir = join(root, "tep-khong-phai-thu-muc");
  await writeFile(notADir, "x");
  const { client } = fakeSource();
  const writer = new BatchWriter({ root: notADir, maxItems: 100, phase: "projects" });
  const state = emptyState();
  const r = rig(state);
  let saved = 0;
  await assert.rejects(runPhase({ phase: "projects", client, writer, ...r.rig, save: async () => { saved++; }, state }));
  assert.equal(saved, 0, "chưa chốt được gì thì chưa lưu trạng thái");
}));
