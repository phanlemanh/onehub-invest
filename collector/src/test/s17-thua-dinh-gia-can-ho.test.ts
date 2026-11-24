import { strict as assert } from "node:assert";
import { test } from "node:test";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

import { loadConfig } from "../collectors/s17-thua-dinh-gia/config.js";
import { RunStopped, S17Client, type Response } from "../collectors/s17-thua-dinh-gia/client.js";
import { S17_NOTES, BatchWriter } from "../collectors/s17-thua-dinh-gia/store.js";
import { emptyState, runPhase, type RunState } from "../collectors/s17-thua-dinh-gia/run.js";

/**
 * S17 mốc ngày 2 (claudedp-2411-21) pha căn hộ: chứng minh liệt kê TRỌN một toà (số mã duy nhất khớp tổng
 * nguồn công bố, bất chấp thứ tự trang không ổn định), rồi lấy căn của các dự án mẫu. Dữ liệu GIẢ, máy chủ .test.
 * Hình dạng đo 24/11: liệt kê chịu 100 mục một trang; `content[]` có `text` (= mã căn) và `sub_text`.
 */

const FAKE_CONFIG = {
  hosts: { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" },
  paths: {
    "project-detail": "/v2.x/projects/{id}",
    "apartment-list": "/v2.x/apartment-list",
    "apartment-detail": "/v2.x/apartment-detail",
    "data-available": "/v2.x/data-available",
    "asset-type": "/v2.x/asset-type",
    balance: "/v2.x/balance",
  },
};

const json = (body: unknown, status = 200): Response => ({ status, contentType: "application/json", body: JSON.stringify(body) });
const env = (data: unknown) => ({ status: true, message: null, data, pagination: null, extra: {} });

type Nguon = {
  /** Danh sách toà của mọi dự án. */
  toa: string[];
  /** Các trang liệt kê theo toà rồi theo lượt quét: `trang[toà][lot][page]` = mảng mã căn của trang đó. Hết lượt thì lặp lượt cuối. */
  trang: Record<string, string[][][]>;
  tong: number;
  /** Mã căn mà chi tiết trả về khác mã đã gửi. */
  lech?: Record<string, string>;
  /** Mã căn không có chi tiết (404). */
  mat?: string[];
};

/** Đếm lời liệt kê theo toà: mỗi khi trang 0 của một toà được gọi lại thì sang lượt quét kế. */
function dungNguonTheoLot(n: Nguon): { client: S17Client; sent: string[] } {
  const sent: string[] = [];
  const lotCuaToa = new Map<string, number>();
  const client = new S17Client({
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    caps: { calls: 1000, minutes: 60 },
    paceMs: 0,
    now: () => 1_000_000,
    sleep: async () => undefined,
    transport: async (url: string) => {
      sent.push(url);
      const u = new URL(url);
      const p = u.pathname;
      if (p.endsWith("/apartment-list")) {
        const page = Number(u.searchParams.get("page"));
        const thap = u.searchParams.get("thap") ?? "";
        if (page === 0) lotCuaToa.set(thap, (lotCuaToa.get(thap) ?? -1) + 1);
        const cacLot = n.trang[thap] ?? [[]];
        const lot = Math.min(lotCuaToa.get(thap) ?? 0, cacLot.length - 1);
        const codes = (cacLot[lot] ?? [])[page] ?? [];
        // envelope đo 24/11: totalElements, totalPages, content[{text, sub_text}]
        return json({ status: true, message: null, data: { content: codes.map((text) => ({ text, sub_text: `Tháp ${thap}` })), totalElements: n.tong, totalPages: (cacLot[lot] ?? []).length, size: 100, number: page, numberOfElements: codes.length }, pagination: null, extra: {} });
      }
      const m = p.match(/\/projects\/(\d+)$/);
      if (m) return json(env({ id: m[1], properties: { danh_sach_thap: n.toa, is_exists_apartment_info: true } }));
      const maCan = u.searchParams.get("ma_can") ?? "";
      if (p.endsWith("/apartment-detail")) {
        if (n.mat?.includes(maCan)) return json({ status: false, message: "not found" }, 404);
        return json(env({ properties: { ma_can: n.lech?.[maCan] ?? maCan, ma_can_tren_cua: "P12.05.05" } }));
      }
      return json(env({ available: 20 }));
    },
  });
  return { client, sent };
}

const withTmp = async (fn: (dir: string) => Promise<void>): Promise<void> => {
  const dir = await mkdtemp(join(tmpdir(), "s17-canho-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

async function readItems(root: string) {
  const dir = join(root, "vn");
  const out: Array<{ kind: string; sourceId: string; payload: any; meta: any }> = [];
  for (const n of (await readdir(dir)).sort()) for (const f of JSON.parse(await readFile(join(dir, n, "manifest.json"), "utf8")).files) {
    out.push(...JSON.parse(gunzipSync(await readFile(join(dir, n, f.name))).toString("utf8")));
  }
  return out;
}

const chay = (root: string, state: RunState, n: Nguon, o: { projects?: string[]; prove?: string; writer?: BatchWriter; client?: S17Client; listOnly?: boolean } = {}) => {
  const w = o.writer ?? new BatchWriter({ root, maxItems: 100, phase: "apartments" });
  const c = o.client ?? dungNguonTheoLot(n).client;
  let saves = 0;
  return runPhase({
    phase: "apartments",
    client: c,
    writer: w,
    state,
    save: async () => {
      assert.equal(w.pendingCount, 0, "trạng thái chỉ được lưu khi bộ đệm của trình ghi đã rỗng");
      saves++;
    },
    log: () => undefined,
    now: () => new Date("2026-11-24T09:00:00.000Z"),
    projects: o.projects ?? ["1004"],
    proveBuilding: o.prove ?? "P12",
    listOnly: o.listOnly,
  }).then(async (s) => {
    await w.flush();
    return { summary: s, saves: () => saves, writer: w };
  });
};

test("apartments: chứng minh trọn toà — mã duy nhất qua các trang khớp tổng nguồn, rồi lấy chi tiết từng mã", async () => withTmp(async (root) => {
  // Trang có mục trùng nhau (d, f) như đo trong nghiên cứu: phải gộp theo mã.
  // P9 chỉ có 2 mã trong khi nguồn vẫn công bố 7: toà thường không khớp thì vẫn lấy căn theo mã đã có.
  const n: Nguon = { toa: ["P12", "P9"], tong: 7, trang: { P12: [[["a", "b", "c", "d"], ["d", "e", "f"], ["f", "g"]]], P9: [[["x", "y"], []]] } };
  const state = emptyState();
  const r = await chay(root, state, n);
  const items = await readItems(root);
  const theo = (k: string) => items.filter((it) => it.kind === k);
  // P12 khớp ngay lượt một (ba trang). P9 thiếu mã nên quét lượt hai; lượt hai không thêm mã thì dừng.
  assert.deepEqual(theo("can_ho_list").map((it) => it.sourceId), [
    "du-an-1004-toa-p12-trang-1", "du-an-1004-toa-p12-trang-2", "du-an-1004-toa-p12-trang-3",
    "du-an-1004-toa-p9-trang-1", "du-an-1004-toa-p9-trang-2", "du-an-1004-toa-p9-trang-1-lot-2", "du-an-1004-toa-p9-trang-2-lot-2",
  ]);
  assert.equal(theo("can_ho_list")[0].meta.tongCan, 7);
  assert.equal(theo("can_ho_list")[0].meta.request.project_id, "1004");
  const toa = theo("can_ho_toa");
  assert.deepEqual(toa.map((it) => it.sourceId), ["du-an-1004-toa-p12", "du-an-1004-toa-p9"]);
  assert.deepEqual(toa[0].payload.maCan.sort(), ["a", "b", "c", "d", "e", "f", "g"], "toà chứng minh gom đủ 7 mã");
  assert.equal(toa[0].meta.khop, true, "7 mã duy nhất = 7 tổng nguồn công bố");
  assert.equal(toa[0].meta.tongCan, 7);
  assert.equal(toa[0].meta.soLot, 1);
  assert.equal(toa[0].meta.laToaChungMinh, true);
  assert.equal(toa[1].meta.khop, false, "toà thường thiếu mã: ghi rõ không khớp");
  assert.equal(toa[1].meta.laToaChungMinh, false);
  assert.equal(toa[1].meta.soLot, 2);
  assert.equal(theo("can_ho_detail").length, 9, "bảy mã của P12 và hai mã của P9");
  assert.ok(theo("can_ho_detail").every((it) => it.meta.khopMaCan === true));
  assert.equal(theo("can_ho_detail")[0].sourceId, "du-an-1004-can-a");
  assert.deepEqual(Object.keys(theo("can_ho_detail")[0].payload), ["json"], "các kind một phản hồi bọc trong { json } như hợp đồng");
  assert.deepEqual(Object.keys(theo("can_ho_detail")[0].payload.json).sort(), ["data", "extra", "message", "pagination", "status"], "json là phản hồi gốc");
  assert.equal(r.summary.failed, 0);
  assert.deepEqual(state.apartmentDetailDone.length, 9);
  assert.ok(r.saves() >= 1);
}));

test("apartments: thứ tự trang không ổn định — lượt một thiếu mã thì quét lượt hai, vẫn chứng minh khớp", async () => withTmp(async (root) => {
  const n: Nguon = {
    toa: ["P12"],
    tong: 5,
    trang: {
      P12: [
        [["a", "b", "c"], ["c", "d", "d"]], // lượt 1: thiếu e (mục d trôi sang trang hai)
        [["a", "b", "e"], ["c", "d"]], // lượt 2: thấy e
      ],
    },
  };
  const state = emptyState();
  const r = await chay(root, state, n);
  const items = await readItems(root);
  const list = items.filter((it) => it.kind === "can_ho_list");
  assert.deepEqual(list.map((it) => it.sourceId), ["du-an-1004-toa-p12-trang-1", "du-an-1004-toa-p12-trang-2", "du-an-1004-toa-p12-trang-1-lot-2", "du-an-1004-toa-p12-trang-2-lot-2"]);
  const toa = items.filter((it) => it.kind === "can_ho_toa");
  assert.equal(toa[0].meta.khop, true);
  assert.equal(toa[0].meta.soLot, 2, "phải quét hai lượt");
  assert.equal(toa[0].payload.maCan.length, 5);
  assert.equal(items.filter((it) => it.kind === "can_ho_detail").length, 5);
}));

test("apartments: lượt quét không thêm được mã nào thì không quét lượt nữa (trùng dòng là có hệ thống, không phải trôi trang)", async () => withTmp(async (root) => {
  // Đo 24/11: toà P12 trả 719 dòng, 599 mã duy nhất; lượt hai không thêm mã nào.
  const n: Nguon = { toa: ["P12"], tong: 5, trang: { P12: [[["a", "b", "c"], ["c", "d", "d"]], [["a", "b", "c"], ["c", "d", "d"]], [["a", "b", "c"], ["c", "d", "e"]]] } };
  const { client, sent } = dungNguonTheoLot(n);
  const w = new BatchWriter({ root, maxItems: 100, phase: "apartments" });
  const state = emptyState();
  const e = await chay(root, state, n, { client, writer: w }).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped && e.reason === "proof-failed");
  assert.equal(sent.filter((u) => u.includes("/apartment-list")).length, 4, "hai lượt, mỗi lượt hai trang");
  await w.flush();
  const toa = (await readItems(root)).filter((it) => it.kind === "can_ho_toa");
  assert.equal(toa[0].meta.soLot, 2);
}));

test("apartments: toà chứng minh mà lượt sau không thêm mã nữa thì dừng, ghi rõ chênh lệch, KHÔNG lấy căn", async () => withTmp(async (root) => {
  // Lượt hai thêm được một mã (còn hy vọng) nhưng lượt ba không thêm nữa: dừng, vẫn thiếu một mã.
  const n: Nguon = { toa: ["P12"], tong: 6, trang: { P12: [[["a", "b", "c"], ["c", "d", "d"]], [["a", "b", "c"], ["c", "d", "e"]], [["a", "b", "c"], ["c", "d", "e"]]] } };
  const { client, sent } = dungNguonTheoLot(n);
  const state = emptyState();
  const w = new BatchWriter({ root, maxItems: 100, phase: "apartments" });
  const e = await chay(root, state, n, { client, writer: w }).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped && e.reason === "proof-failed", `phải dừng vì không chứng minh được, nhận ${String(e)}`);
  await w.flush(`dừng: ${e instanceof Error ? e.message : String(e)}`);
  assert.equal(sent.filter((u) => u.includes("/apartment-detail")).length, 0, "chưa chứng minh được thì không lấy căn");
  const toa = (await readItems(root)).filter((it) => it.kind === "can_ho_toa");
  assert.equal(toa.length, 1);
  assert.equal(toa[0].meta.khop, false);
  assert.equal(toa[0].meta.soLot, 3);
  assert.equal(toa[0].meta.tongCan, 6);
  assert.equal(toa[0].payload.maCan.length, 5, "chỉ có 5 mã duy nhất trên 6");
}));

test("apartments: mỗi lượt vẫn thêm được mã thì quét tiếp, tối đa tám lượt (đo 24/11: toà P9 thiếu 18 mã sau ba lượt)", async () => withTmp(async (root) => {
  const lot = (codes: string[]) => [codes];
  const n: Nguon = {
    toa: ["P9"],
    tong: 9,
    trang: { P9: [lot(["a"]), lot(["a", "b"]), lot(["a", "b", "c"]), lot(["a", "b", "c", "d"]), lot(["a", "b", "c", "d", "e"]), lot(["a", "b", "c", "d", "e", "f"]), lot(["a", "b", "c", "d", "e", "f", "g"]), lot(["a", "b", "c", "d", "e", "f", "g", "h"])] },
  };
  const { client, sent } = dungNguonTheoLot(n);
  const w = new BatchWriter({ root, maxItems: 100, phase: "apartments" });
  const e = await chay(root, emptyState(), n, { client, writer: w, prove: "P9" }).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped && e.reason === "proof-failed", `tám lượt vẫn thiếu một mã thì dừng, nhận ${String(e)}`);
  assert.equal(sent.filter((u) => u.includes("/apartment-list")).length, 8, "dừng ở lượt tám");
  await w.flush();
  const toa = (await readItems(root)).filter((it) => it.kind === "can_ho_toa");
  assert.equal(toa[0].meta.soLot, 8);
  assert.equal(toa[0].meta.khop, false);
}));

test("apartments: chi tiết trả mã căn khác mã đã gửi thì không ghi item, ghi nhận thất bại, đi tiếp", async () => withTmp(async (root) => {
  const n: Nguon = { toa: ["P12"], tong: 3, trang: { P12: [[["a", "b", "c"]]] }, lech: { b: "zzz" }, mat: ["c"] };
  const state = emptyState();
  const r = await chay(root, state, n);
  const items = await readItems(root);
  assert.deepEqual(items.filter((it) => it.kind === "can_ho_detail").map((it) => it.sourceId), ["du-an-1004-can-a"]);
  assert.equal(r.summary.failed, 2, "một mã lệch và một mã 404");
  assert.match(String(state.apartmentDetailFailed["1004/b"]), /khớp mã căn/);
  assert.match(String(state.apartmentDetailFailed["1004/c"]), /404/);
}));

test("apartments --chi-liet-ke: chỉ liệt kê các toà, không cổng chứng minh, không lấy căn; ghi bản gộp cả dự án", async () => withTmp(async (root) => {
  // Đo 24/11: toà P12 trả 719 DÒNG nhưng chỉ 599 mã duy nhất — cần chế độ chỉ liệt kê để so với số căn của dự án.
  const n: Nguon = {
    toa: ["P12", "P9"],
    tong: 7,
    trang: { P12: [[["a", "b", "c", "d"], ["d", "e", "f"]]], P9: [[["x", "y"], []]] },
  };
  const { client, sent } = dungNguonTheoLot(n);
  const state = emptyState();
  const r = await chay(root, state, n, { client, listOnly: true });
  assert.equal(sent.filter((u) => u.includes("/apartment-detail")).length, 0, "không lấy căn");
  const items = await readItems(root);
  const toa = items.filter((it) => it.kind === "can_ho_toa");
  assert.equal(toa.length, 2, "cả hai toà đều được liệt kê dù không khớp tổng dòng");
  assert.equal(toa[0].meta.khop, false);
  assert.equal(state.apartmentProved, false);
  const duAn = items.filter((it) => it.kind === "can_ho_du_an");
  assert.deepEqual(duAn.map((it) => it.sourceId), ["du-an-1004"]);
  assert.equal(r.summary.items, toa.length + duAn.length, "summary chỉ kể bản gộp, không kể các trang liệt kê");
}));

test("apartments: chạy lại thì không lặp toà và căn đã xong (nối tiếp)", async () => withTmp(async (root) => {
  const n: Nguon = { toa: ["P12"], tong: 3, trang: { P12: [[["a", "b", "c"]]] } };
  const { client, sent } = dungNguonTheoLot(n);
  const state = emptyState();
  await chay(root, state, n, { client });
  const daGoi = sent.length;
  const r2 = await chay(root, state, n, { client });
  assert.equal(sent.length, daGoi, "lượt hai không gọi gì");
  assert.equal(r2.summary.items, 0);
}));

test("apartments: liệt kê trước bằng chế độ chỉ liệt kê rồi chạy đủ thì không liệt kê lại, lấy căn, và không ghi lại bản gộp", async () => withTmp(async (root) => {
  // Cách làm thật 24/11: đo liệt kê trước (--chi-liet-ke), xem số, rồi chạy đủ.
  const n: Nguon = { toa: ["P12"], tong: 3, trang: { P12: [[["a", "b", "c"]]] } };
  const { client, sent } = dungNguonTheoLot(n);
  const state = emptyState();
  await chay(root, state, n, { client, listOnly: true });
  const loiKe = sent.filter((u) => u.includes("/apartment-list")).length;
  const r = await chay(root, state, n, { client });
  assert.equal(sent.filter((u) => u.includes("/apartment-list")).length, loiKe, "không liệt kê lại");
  assert.equal(r.summary.items, 3, "ba căn; không ghi lại bản gộp toà và dự án");
  const items = await readItems(root);
  assert.equal(items.filter((it) => it.kind === "can_ho_du_an").length, 1);
  assert.equal(items.filter((it) => it.kind === "can_ho_toa").length, 1);
  assert.equal(state.apartmentProved, true, "chạy đủ: toà chứng minh khớp mới được tính là chứng minh");
}));

test("apartments: thiếu dự án mẫu thì từ chối trước khi gọi nguồn", async () => withTmp(async (root) => {
  const n: Nguon = { toa: ["P12"], tong: 3, trang: { P12: [[["a", "b", "c"]]] } };
  const { client, sent } = dungNguonTheoLot(n);
  await assert.rejects(chay(root, emptyState(), n, { client, projects: [] }), /dự án/);
  assert.equal(sent.length, 0);
}));

test("snapshot của pha căn hộ mang dấu hiệu khuôn 2", async () => withTmp(async (root) => {
  const n: Nguon = { toa: ["P12"], tong: 3, trang: { P12: [[["a", "b", "c"]]] } };
  await chay(root, emptyState(), n);
  const dir = join(root, "vn");
  const m = JSON.parse(await readFile(join(dir, (await readdir(dir))[0], "manifest.json"), "utf8"));
  assert.deepEqual(m.coverage.notes, [S17_NOTES]);
}));

test("chạy lại sau proof-failed: toà chứng minh vẫn không khớp thì dừng lại ở cổng chứng minh, KHÔNG đi vào lấy căn (lượt soát 24/11: lượt hai gửi 0 lời liệt kê, lấy 4 căn, trả ok)", async () => withTmp(async (root) => {
  const n: Nguon = { toa: ["A"], trang: { A: [[["c1", "c2"]]] }, tong: 5 };
  const ke = dungNguonTheoLot(n);
  const state = emptyState();
  state.apartmentToa["1"] = ["A"];
  state.apartmentCodes["1/A"] = ["c1", "c2"];
  state.apartmentBuildings["1/A"] = { tongDong: 5, soLot: 8, khop: false };
  const e = await chay(root, state, n, { projects: ["1"], prove: "A", client: ke.client }).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped, String(e));
  assert.equal(e.reason, "proof-failed");
  assert.equal(ke.sent.filter((u) => u.includes("/apartment-detail")).length, 0, "chưa chứng minh được thì không lấy căn");
  assert.equal(state.apartmentProved, false);
}));

test("liệt kê rỗng (0 dòng, 0 mã) KHÔNG được tính là khớp: toà chứng minh dừng với lý do «không có gì để chứng minh»", async () => withTmp(async (root) => {
  const n: Nguon = { toa: ["A"], trang: { A: [[[]]] }, tong: 0 };
  const state = emptyState();
  const e = await chay(root, state, n, { projects: ["1"], prove: "A" }).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped, String(e));
  assert.equal(e.reason, "proof-failed");
  assert.match(e.message, /không trả dòng nào/);
  assert.equal(state.apartmentProved, false, "chứng minh rỗng không phải chứng minh");
}));
