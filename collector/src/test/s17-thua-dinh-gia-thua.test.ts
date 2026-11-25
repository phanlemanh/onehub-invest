import { strict as assert } from "node:assert";
import { test } from "node:test";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

import { loadConfig } from "../collectors/s17-thua-dinh-gia/config.js";
import { ConfigError } from "../collectors/s17-thua-dinh-gia/config.js";
import { RunStopped, S17Client, type Response, type TransportMany, MAX_CONCURRENCY } from "../collectors/s17-thua-dinh-gia/client.js";
import { S17_NOTES, BatchWriter } from "../collectors/s17-thua-dinh-gia/store.js";
import { emptyState, runPhase, sourceIdSlug, type ParcelArea, type RunState } from "../collectors/s17-thua-dinh-gia/run.js";

/**
 * S17 mốc ngày 2 (claudedp-2411-21), pha thửa ở khu thí điểm: quét lưới toạ độ + gợi ý theo tên đường, khử trùng
 * theo mã địa chính, ghi số thửa và số lời mỗi km². Gửi nhiều lời một đợt (đo 24/11: hồ sơ thửa mất ~4 s một
 * lời; hai lời đồng thời trong trang rút được một nửa thời gian). Dữ liệu GIẢ, máy chủ .test.
 */

const FAKE_CONFIG = {
  hosts: { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" },
  paths: {
    "parcel-profile": "/v2.x/parcel-profile",
    "parcel-suggest": "/v2.x/parcel-suggest",
    "data-available": "/v2.x/data-available",
    "asset-type": "/v2.x/asset-type",
    balance: "/v2.x/balance",
  },
};

const json = (body: unknown, status = 200): Response => ({ status, contentType: "application/json", body: JSON.stringify(body) });

type Thua = { ogc: string; duong: string; soTo: string; soThua: string; dienTich: number };

/** Nguồn giả: mỗi điểm (lat,lng) trúng một thửa hoặc không có; gợi ý trả toạ độ các thửa của một đường. */
function nguon(o: {
  taiDiem: Record<string, Thua | null>;
  goiY: Record<string, Array<{ lat: number; lng: number }>>;
  loiDiem?: string[];
  goiYLoi?: string[];
  chanSau?: number;
}): { client: S17Client; sent: string[]; dot: number[] } {
  const sent: string[] = [];
  const dot: number[] = [];
  let i = 0;
  const answer = (url: string): Response => {
    const u = new URL(url);
    if (o.chanSau !== undefined && ++i > o.chanSau) return json({ message: "denied" }, 403);
    const p = u.pathname;
    const key = `${Number(u.searchParams.get("latitude"))},${Number(u.searchParams.get("longitude"))}`;
    if (p.endsWith("/parcel-profile")) {
      if (o.loiDiem?.includes(key)) throw new TypeError("Failed to fetch");
      const t = o.taiDiem[key];
      if (!t) return json({ status: true, message: null, data: null, pagination: null, extra: {} });
      return json({
        status: true, message: null, pagination: null, extra: {},
        data: { id: "1", properties: { ogc_fid: t.ogc, so_to: t.soTo, so_thua: t.soThua, dien_tich: t.dienTich, vi_tri_duong: t.duong, ma_phuong: "00049", ma_quan: "002", ma_thanh_pho: "01", new_phuong: "Phường giả", ranh_gioi: [[105.85, 21.03]] } },
      });
    }
    if (p.endsWith("/parcel-suggest")) {
      const term = u.searchParams.get("term") ?? "";
      if (o.goiYLoi?.includes(term)) return json({ status: false, message: "not found" }, 404);
      return json({ status: true, message: null, pagination: null, extra: {}, data: [{ name: "nha_pho", label: "Nhà đất", priority: 1, items: (o.goiY[term] ?? []).map((x) => ({ text: term, source: "nha_pho", id: "9", extra: { dien_tich: 18.59, chieu_rong: 4.36, latitude: x.lat, longitude: x.lng, chieu_dai: 9.81 }, sub_text: "Phường giả, Quận giả" })) }] });
    }
    return json({ status: true, message: null, data: { available: 20 }, pagination: null, extra: {} });
  };
  const single = async (url: string): Promise<Response> => {
    sent.push(url);
    return answer(url);
  };
  const many: TransportMany = async (list) => {
    dot.push(list.length);
    return Promise.all(list.map(async (r) => {
      try {
        return await single(r.url);
      } catch (e) {
        return e as Error;
      }
    }));
  };
  const client = new S17Client({
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    caps: { calls: 1000, minutes: 60 },
    paceMs: 0,
    now: () => 1_000_000,
    sleep: async () => undefined,
    transport: single,
    transportMany: many,
  });
  return { client, sent, dot };
}

type Ke = { client: S17Client; sent: string[]; dot: number[] };

const withTmp = async (fn: (dir: string) => Promise<void>): Promise<void> => {
  const dir = await mkdtemp(join(tmpdir(), "s17-thua-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

async function readItems(root: string) {
  const dir = join(root, "vn");
  const out: Array<{ kind: string; sourceId: string; payload: any; meta: any }> = [];
  for (const n of (await readdir(dir)).sort()) {
    for (const f of JSON.parse(await readFile(join(dir, n, "manifest.json"), "utf8")).files) {
      out.push(...JSON.parse(gunzipSync(await readFile(join(dir, n, f.name))).toString("utf8")));
    }
  }
  return out;
}

const khu = (diem: Array<[number, number]>, dienTichKm2 = 0.5): ParcelArea => ({ khuVucId: "vn-hcm-thu-duc", ten: "Khu giả", dienTichKm2, buocM: 30, diem });

function chay(root: string, state: RunState, ke: Ke, parcels: ParcelArea[], o: { concurrency?: number; writer?: BatchWriter } = {}) {
  const w = o.writer ?? new BatchWriter({ root, maxItems: 100, phase: "parcels" });
  let saves = 0;
  const run = () =>
    runPhase({
      phase: "parcels",
      client: ke.client,
      writer: w,
      state,
      save: async () => {
        assert.equal(w.pendingCount, 0, "trạng thái chỉ được lưu khi bộ đệm của trình ghi đã rỗng");
        saves++;
      },
      log: () => undefined,
      now: () => new Date("2026-11-24T10:00:00.000Z"),
      parcels,
      concurrency: o.concurrency ?? 1,
    }).then(async (s) => {
      await w.flush();
      return { summary: s, saves: () => saves, writer: w };
    });
  return { run, writer: w };
}

test("parcels: quét lưới toạ độ, khử trùng theo mã địa chính, ghi bản gộp khu vực với số thửa và số lời mỗi km²", async () => withTmp(async (root) => {
  const A: Thua = { ogc: "100", duong: "Hàng Đào", soTo: "7H", soThua: "41", dienTich: 4.53 };
  const B: Thua = { ogc: "200", duong: "Hàng Bông", soTo: "8H", soThua: "2", dienTich: 88 };
  const ke = nguon({
    taiDiem: { "21,105.85": A, "21.0003,105.85": A, "21.0006,105.85": B, "21.0009,105.85": B, "21.0012,105.85": null, "21.0015,105.85": null },
    goiY: {},
  });
  const state = emptyState();
  const diem: Array<[number, number]> = [[21.0, 105.85], [21.0003, 105.85], [21.0006, 105.85], [21.0009, 105.85], [21.0012, 105.85], [21.0015, 105.85]];
  const r = await chay(root, state, ke, [khu(diem)]).run();
  const items = await readItems(root);
  const thua = items.filter((it) => it.kind === "thua");
  assert.deepEqual(thua.map((it) => it.sourceId).sort(), ["thua-100", "thua-200"], "bốn điểm trúng chỉ còn hai thửa duy nhất");
  assert.equal(thua[0].meta.phuongPhap, "grid");
  assert.equal(thua[0].meta.ogcFid, thua[0].sourceId.replace("thua-", ""));
  assert.equal(thua[0].meta.khuVuc, "vn-hcm-thu-duc");
  assert.equal(thua[0].payload.json.data.properties.ogc_fid, thua[0].meta.ogcFid, "payload là phản hồi gốc bọc trong json");
  const gop = items.filter((it) => it.kind === "thua_khu_vuc");
  assert.equal(gop.length, 1);
  assert.equal(gop[0].sourceId, "khu-vuc-vn-hcm-thu-duc");
  assert.equal(gop[0].payload.soDiemLuoi, 6);
  assert.equal(gop[0].payload.soThuaLuoi, 2);
  assert.equal(gop[0].payload.soTrung, 2, "hai điểm trúng lại thửa đã có");
  assert.equal(gop[0].payload.soKhongCo, 2);
  assert.equal(gop[0].payload.soLoi, 0);
  assert.equal(gop[0].meta.thuaMoiKm2, 4, "2 thửa / 0,5 km²");
  // Tên đường lấy từ hai thửa đã có (Hàng Đào, Hàng Bông) → hai lời gợi ý, mỗi lời không trả mục nào.
  assert.equal(gop[0].payload.soCauGoiY, 2);
  assert.equal(gop[0].meta.loiMoiKm2, 16, "(6 lời lưới + 2 lời gợi ý) / 0,5 km²");
  assert.equal(items.filter((it) => it.kind === "thua_goi_y").length, 2);
  assert.deepEqual(state.parcelSeen.sort(), ["100", "200"]);
  assert.deepEqual(state.parcelKhuDone, ["vn-hcm-thu-duc"]);
  assert.equal(r.summary.failed, 0);
}));

test("parcels: lấy tên đường từ thửa đã có → gợi ý theo tên đường → hỏi hồ sơ ở toạ độ gợi ý (phương pháp suggest)", async () => withTmp(async (root) => {
  const A: Thua = { ogc: "100", duong: "Hàng Đào", soTo: "7H", soThua: "41", dienTich: 4.53 };
  const C: Thua = { ogc: "300", duong: "Hàng Đào", soTo: "7H", soThua: "5", dienTich: 19 };
  const ke = nguon({
    taiDiem: { "21,105.85": A, "21.04,105.85": C },
    goiY: { "Hàng Đào": [{ lat: 21.04, lng: 105.85 }, { lat: 21, lng: 105.85 }] },
  });
  const state = emptyState();
  const r = await chay(root, state, ke, [khu([[21.0, 105.85]])]).run();
  const items = await readItems(root);
  const goiY = items.filter((it) => it.kind === "thua_goi_y");
  assert.deepEqual(goiY.map((it) => it.sourceId), ["goi-y-vn-hcm-thu-duc-hang-dao"]);
  assert.equal(goiY[0].meta.request.term, "Hàng Đào");
  assert.equal(goiY[0].meta.soMuc, 2);
  const thua = items.filter((it) => it.kind === "thua").sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  assert.deepEqual(thua.map((it) => [it.sourceId, it.meta.phuongPhap]), [["thua-100", "grid"], ["thua-300", "suggest"]], "toạ độ gợi ý trùng thửa lưới không ghi lại");
  const gop = items.filter((it) => it.kind === "thua_khu_vuc")[0];
  assert.equal(gop.payload.soCauGoiY, 1);
  assert.equal(gop.payload.soDiemGoiY, 2);
  assert.equal(gop.meta.loiMoiKm2, 8, "1 lời lưới + 1 lời gợi ý + 2 lời hồ sơ gợi ý = 4 lời / 0,5 km²");
  assert.equal(r.summary.failed, 0);
}));

test("parcels: gửi hồ sơ lưới theo đợt với số luồng đã khai", async () => withTmp(async (root) => {
  const taiDiem: Record<string, Thua | null> = {};
  const diem: Array<[number, number]> = [];
  for (let i = 0; i < 9; i++) {
    const lat = Number((21 + i * 0.0003).toFixed(4));
    diem.push([lat, 105.85]);
    taiDiem[`${lat},105.85`] = null;
  }
  const ke = nguon({ taiDiem, goiY: {} });
  const r = await chay(root, emptyState(), ke, [khu(diem)], { concurrency: 4 }).run();
  assert.equal(r.summary.failed, 0);
  assert.deepEqual(ke.dot, [4, 4], "chín điểm: hai đợt bốn lời, lời thứ chín đi riêng");
  assert.equal(ke.sent.length, 9);
}));

test("parcels: điểm hỏi lỗi mạng thì tính là lỗi của điểm đó, ghi lại, đi tiếp; không làm mất khu", async () => withTmp(async (root) => {
  const A: Thua = { ogc: "100", duong: "Hàng Đào", soTo: "7H", soThua: "41", dienTich: 4.53 };
  const ke = nguon({ taiDiem: { "21,105.85": A, "21.0003,105.85": A }, goiY: {}, loiDiem: ["21.0006,105.85"] });
  const state = emptyState();
  const r = await chay(root, state, ke, [khu([[21.0, 105.85], [21.0003, 105.85], [21.0006, 105.85]])]).run();
  const gop = (await readItems(root)).filter((it) => it.kind === "thua_khu_vuc")[0];
  assert.equal(gop.payload.soLoi, 1);
  assert.equal(gop.payload.soThuaLuoi, 1);
  assert.equal(r.summary.failed, 1);
  assert.match(String(state.parcelLoi["vn-hcm-thu-duc|grid|21.0006,105.85"]), /mạng/);
}));

test("parcels: bị chặn giữa chừng thì dừng, điểm chưa xong không được đánh dấu, khu chưa ghi bản gộp", async () => withTmp(async (root) => {
  // Bốn điểm: hai lời đầu qua, lời thứ ba bị 403 → lời thứ tư không được gửi.
  const ke = nguon({ taiDiem: {}, goiY: {}, chanSau: 2 });
  const state = emptyState();
  const w = new BatchWriter({ root, maxItems: 100, phase: "parcels" });
  const e = await chay(root, state, ke, [khu([[21.0, 105.85], [21.0003, 105.85], [21.0006, 105.85], [21.0009, 105.85]])], { writer: w }).run().then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped && e.reason === "blocked", `phải dừng vì bị chặn, nhận ${String(e)}`);
  await w.flush(`dừng: ${e instanceof Error ? e.message : String(e)}`);
  assert.equal(ke.sent.length, 3, "đã bị chặn thì không gửi thêm");
  assert.equal((state.parcelPointDone || []).length, 2, "hai điểm xong trước lúc bị chặn được ghi nhận; hai điểm sau không");
  assert.deepEqual(state.parcelKhuDone, [], "khu chưa có bản gộp");
}));

test("parcels: chạy lại chỉ làm điểm còn lại", async () => withTmp(async (root) => {
  const A: Thua = { ogc: "100", duong: "Hàng Đào", soTo: "7H", soThua: "41", dienTich: 4.53 };
  const state = emptyState();
  const biChan = nguon({ taiDiem: { "21,105.85": A }, goiY: {}, chanSau: 0 });
  const e = await chay(root, state, biChan, [khu([[21.0, 105.85], [21.0003, 105.85]])]).run().then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped && e.reason === "blocked");
  const ke = nguon({ taiDiem: { "21,105.85": A }, goiY: {} });
  const r = await chay(root, state, ke, [khu([[21.0, 105.85], [21.0003, 105.85]])]).run();
  assert.equal(r.summary.failed, 0, "lượt hai chạy được");
  assert.equal(ke.sent.filter((u) => u.includes("parcel-profile")).length, 2, "hỏi lại đúng hai điểm chưa xong");
  assert.deepEqual(state.parcelKhuDone, ["vn-hcm-thu-duc"]);
}));

test("parcels: thiếu khu thí điểm thì từ chối trước khi gọi nguồn", async () => withTmp(async (root) => {
  const ke = nguon({ taiDiem: {}, goiY: {} });
  await assert.rejects(chay(root, emptyState(), ke, []).run(), ConfigError);
  assert.equal(ke.sent.length, 0);
}));

test("parcels: luồng ngoài 1–8 (trần chung MAX_CONCURRENCY) thì từ chối", async () => withTmp(async (root) => {
  const ke = nguon({ taiDiem: {}, goiY: {} });
  await assert.rejects(chay(root, emptyState(), ke, [khu([[21.0, 105.85]])], { concurrency: MAX_CONCURRENCY + 1 }).run(), ConfigError);
  assert.equal(ke.sent.length, 0);
}));

test("parcels: snapshot của pha thửa mang dấu hiệu khuôn 2", async () => withTmp(async (root) => {
  await chay(root, emptyState(), nguon({ taiDiem: {}, goiY: {} }), [khu([[21.0, 105.85]])]).run();
  const dir = join(root, "vn");
  const m = JSON.parse(await readFile(join(dir, (await readdir(dir))[0], "manifest.json"), "utf8"));
  assert.deepEqual(m.coverage.notes, [S17_NOTES]);
}));

test("sourceIdSlug: ASCII, không dấu, ổn định", () => {
  assert.equal(sourceIdSlug("Hàng Đào"), "hang-dao");
  assert.equal(sourceIdSlug("3312A Tòa Park 12"), "3312a-toa-park-12");
  assert.equal(sourceIdSlug("  Điện Biên Phủ "), "dien-bien-phu");
  assert.equal(sourceIdSlug("Nguyễn Du / Lê Lợi"), "nguyen-du-le-loi");
  assert.match(sourceIdSlug("Đặng Văn Bạch"), /^[a-z0-9-]+$/);
});

test("hai khu thí điểm: mỗi khu hỏi lưới của MÌNH rồi gợi ý theo tên đường gặp trong khu mình; mỗi khu một bản gộp; thửa gặp ở cả hai khu chỉ ghi một lần", async () => withTmp(async (root) => {
  const ke = nguon({
    taiDiem: {
      "1,1": { ogc: "100", duong: "Hàng Đào", soTo: "1", soThua: "2", dienTich: 50 },
      "2,2": { ogc: "200", duong: "Lý Thường Kiệt", soTo: "3", soThua: "4", dienTich: 60 },
      "1.5,1.5": { ogc: "300", duong: "Trần Hưng Đạo", soTo: "5", soThua: "6", dienTich: 70 },
    },
    goiY: { "Hàng Đào": [{ lat: 3, lng: 3 }], "Lý Thường Kiệt": [{ lat: 1, lng: 1 }] },
  });
  const state = emptyState();
  const a: ParcelArea = { ...khu([[1, 1]]), khuVucId: "vn-hanoi-hoan-kiem" };
  const b: ParcelArea = { ...khu([[2, 2], [1.5, 1.5]]), khuVucId: "vn-hcmc-an-phu-o-thu-diem" };
  await chay(root, state, ke, [a, b]).run();
  const items = await readItems(root);
  assert.deepEqual(items.filter((it) => it.kind === "thua").map((it) => it.sourceId).sort(), ["thua-100", "thua-200", "thua-300"], "ba thửa, mỗi thửa một item dù thửa 100 gặp lại ở khu hai qua gợi ý");
  assert.deepEqual(items.filter((it) => it.kind === "thua_goi_y").map((it) => it.sourceId), [
    "goi-y-vn-hanoi-hoan-kiem-hang-dao",
    "goi-y-vn-hcmc-an-phu-o-thu-diem-ly-thuong-kiet",
    "goi-y-vn-hcmc-an-phu-o-thu-diem-tran-hung-dao",
  ]);
  const gop = items.filter((it) => it.kind === "thua_khu_vuc");
  assert.deepEqual(gop.map((it) => it.sourceId), ["khu-vuc-vn-hanoi-hoan-kiem", "khu-vuc-vn-hcmc-an-phu-o-thu-diem"]);
  assert.deepEqual([gop[0].payload.soThuaLuoi, gop[0].payload.soCauGoiY, gop[0].payload.soDiemGoiY], [1, 1, 1]);
  assert.deepEqual([gop[1].payload.soThuaLuoi, gop[1].payload.soCauGoiY, gop[1].payload.soDiemGoiY, gop[1].payload.soTrung], [2, 2, 1, 1]);
  assert.deepEqual(state.parcelKhuDone, ["vn-hanoi-hoan-kiem", "vn-hcmc-an-phu-o-thu-diem"]);
}));

test("khu đã có số đo do mã cũ ghi (chưa có trường loi): bản gộp vẫn ra tongLoi là số, không phải null", async () => withTmp(async (root) => {
  const ke = nguon({ taiDiem: {}, goiY: {} });
  const state = emptyState();
  state.parcelKhu["vn-hcm-thu-duc"] = { soDiemLuoi: 0, soDiemGoiY: 0, soThuaLuoi: 0, soThuaGoiY: 0, soTrung: 0, soKhongCo: 0, soLoi: 0, soCauGoiY: 0, soLoiGoiY: 0 } as unknown as (typeof state.parcelKhu)[string];
  await chay(root, state, ke, [khu([[1, 1]])]).run();
  const gop = (await readItems(root)).filter((it) => it.kind === "thua_khu_vuc")[0];
  assert.equal(gop.meta.tongLoi, 1, "một lời hồ sơ cho một toạ độ");
  assert.equal(typeof gop.meta.loiMoiKm2, "number");
}));
