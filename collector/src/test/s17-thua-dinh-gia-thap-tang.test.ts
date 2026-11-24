import { strict as assert } from "node:assert";
import { test } from "node:test";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";

import { loadConfig } from "../collectors/s17-thua-dinh-gia/config.js";
import { ConfigError } from "../collectors/s17-thua-dinh-gia/config.js";
import { S17Client, type Response } from "../collectors/s17-thua-dinh-gia/client.js";
import { S17_NOTES, BatchWriter } from "../collectors/s17-thua-dinh-gia/store.js";
import { emptyState, runPhase, type RunState } from "../collectors/s17-thua-dinh-gia/run.js";

/**
 * S17 mốc ngày 2 (c): dự án thấp tầng. Đo 24/11: cùng một id, chi tiết CÓ cờ for_house=true trả đúng dự án
 * thấp tầng (namespace du_an_nha_dat); KHÔNG có cờ trả một dự án căn hộ khác trùng id (id 1804: «Star Villa
 * Sơn Trà» so với «Nhà công vụ Bộ tổng tham mưu»). Không có lời liệt kê riêng: chỉ khám phá được qua gợi ý
 * theo từ khoá. Dữ liệu GIẢ, máy chủ .test.
 */

const FAKE_CONFIG = {
  hosts: { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" },
  paths: {
    "project-suggest": "/v2.x/project-suggest",
    "project-detail": "/v2.x/projects/{id}",
    "data-available": "/v2.x/data-available",
    "asset-type": "/v2.x/asset-type",
    balance: "/v2.x/balance",
  },
};

const json = (body: unknown, status = 200): Response => ({ status, contentType: "application/json", body: JSON.stringify(body) });
const env = (data: unknown) => ({ status: true, message: null, data, pagination: null, extra: {} });

/** `theoTu[term]` = mục gợi ý; `chiTiet[id]` = bản ghi chi tiết nguồn trả cho id đó. */
function nguon(theoTu: Record<string, Array<{ text: string; source: string; id: string }>>, chiTiet: Record<string, { estate_type: string; ten: string }>): { client: S17Client; sent: string[]; daCoh: string[] } {
  const sent: string[] = [];
  const daCoh: string[] = [];
  const client = new S17Client({
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    caps: { calls: 1000, minutes: 60 },
    paceMs: 0,
    now: () => 1_000_000,
    sleep: async () => undefined,
    transport: async (url: string) => {
      sent.push(url);
      const u = new URL(url);
      if (u.pathname.endsWith("/project-suggest")) {
        if (u.searchParams.get("for_house") === "true") daCoh.push("suggest");
        const term = u.searchParams.get("term") ?? "";
        return json(env([{ name: "du_an", label: "Dự án", priority: 3, items: theoTu[term] ?? [] }]));
      }
      const m = u.pathname.match(/\/projects\/(\d+)$/);
      if (m) {
        const id = m[1];
        const r = chiTiet[id];
        if (!r) return json({ status: false, message: "not found" }, 404);
        if (u.searchParams.get("for_house") === "true") daCoh.push("detail:" + id);
        // Bản ghi thấp tầng chỉ về khi có cờ; không có cờ nguồn trả bản ghi namespace căn hộ trùng id.
        return json(env({ id, estate_type: u.searchParams.get("for_house") === "true" ? r.estate_type : "du_an", loai_du_an: "", tinh_trang: "da_ban_giao", properties: { id, ten_du_an: r.ten, danh_sach_thap: [], is_exists_apartment_info: false } }));
      }
      return json(env({ available: 20 }));
    },
  });
  return { client, sent, daCoh };
}

const withTmp = async (fn: (dir: string) => Promise<void>): Promise<void> => {
  const dir = await mkdtemp(join(tmpdir(), "s17-thap-tang-"));
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

function chay(root: string, state: RunState, ke: ReturnType<typeof nguon>, terms: string[]) {
  const w = new BatchWriter({ root, maxItems: 100, phase: "lowrise" });
  const run = () =>
    runPhase({ phase: "lowrise", client: ke.client, writer: w, state, save: async () => undefined, log: () => undefined, now: () => new Date("2026-11-24T10:00:00.000Z"), lowriseTerms: terms }).then(async (s) => {
      await w.flush();
      return s;
    });
  return { run, writer: w };
}

test("lowrise: gợi ý theo từ khoá có cờ for_house → gom id namespace thấp tầng → chi tiết có cờ; mục ngoài namespace bị bỏ và đếm", async () => withTmp(async (root) => {
  const ke = nguon(
    {
      "Villa": [{ text: "Star Villa Sơn Trà", source: "du_an_nha_dat", id: "1804" }, { text: "Chung cư nào đó", source: "du_an", id: "77" }],
      "Furama": [{ text: "Furama Villas", source: "du_an_nha_dat", id: "1793" }, { text: "Star Villa Sơn Trà", source: "du_an_nha_dat", id: "1804" }],
    },
    { "1804": { estate_type: "du_an_nha_dat", ten: "Star Villa Sơn Trà" }, "1793": { estate_type: "du_an_nha_dat", ten: "Furama Villas" } },
  );
  const state = emptyState();
  const s = await chay(root, state, ke, ["Villa", "Furama"]).run();
  const items = await readItems(root);
  assert.deepEqual(items.filter((it) => it.kind === "du_an_goi_y_thap_tang").map((it) => it.sourceId), ["goi-y-thap-tang-villa", "goi-y-thap-tang-furama"]);
  const ct = items.filter((it) => it.kind === "du_an_thap_tang");
  assert.deepEqual(ct.map((it) => it.sourceId).sort(), ["du-an-nha-dat-1793", "du-an-nha-dat-1804"], "id 1804 gặp ở hai từ khoá chỉ lấy một lần; id 77 ngoài namespace bị bỏ");
  assert.equal(ct[0].meta.estateType, "du_an_nha_dat");
  assert.equal(ct[0].payload.json.data.properties.ten_du_an, ct[0].meta.ten, "payload là phản hồi gốc");
  assert.deepEqual([...ct.find((it) => it.sourceId === "du-an-nha-dat-1804")!.meta.tuCacTuKhoa].sort(), ["Furama", "Villa"]);
  assert.ok(ke.daCoh.length === 4 && ke.daCoh.every((x) => x.startsWith("suggest") || x.startsWith("detail:")), "cả gợi ý lẫn chi tiết đều mang cờ for_house");
  assert.deepEqual(state.lowriseDone.sort(), ["1793", "1804"]);
  assert.equal(s.failed, 0);
  assert.equal(s.so?.ngoaiNamespace, 1);
}));

test("lowrise: chi tiết có cờ mà nguồn vẫn trả bản ghi ngoài namespace thấp tầng → không ghi, tính thất bại", async () => withTmp(async (root) => {
  const ke = nguon({ "Villa": [{ text: "Sai", source: "du_an_nha_dat", id: "9" }] }, { "9": { estate_type: "du_an", ten: "Chung cư" } });
  const state = emptyState();
  const s = await chay(root, state, ke, ["Villa"]).run();
  assert.equal((await readItems(root)).filter((it) => it.kind === "du_an_thap_tang").length, 0);
  assert.equal(s.failed, 1);
  assert.match(String(state.lowriseFailed["9"]), /namespace/);
}));

test("lowrise: chạy lại không lặp từ khoá và dự án đã xong", async () => withTmp(async (root) => {
  const ke = nguon({ "Villa": [{ text: "A", source: "du_an_nha_dat", id: "1" }] }, { "1": { estate_type: "du_an_nha_dat", ten: "A" } });
  const state = emptyState();
  await chay(root, state, ke, ["Villa"]).run();
  const daGoi = ke.sent.length;
  const s = await chay(root, state, ke, ["Villa"]).run();
  assert.equal(ke.sent.length, daGoi);
  assert.equal(s.items, 0);
}));

type Quet = { null: string[]; theoId: Record<string, { estate_type: string; ten: string }>; dot: number[] };

/** Nguồn giả cho quét theo id: `null` = id không có bản ghi thấp tầng (nguồn trả data null); `theoId` = id có bản ghi. */
function nguonQuet(quet: Quet, o: { many?: boolean; chanId?: number } = {}): { client: S17Client; sent: string[]; dot: number[] } {
  const sent: string[] = [];
  const dot: number[] = quet.dot;
  const answer = (url: string): Response => {
    const u = new URL(url);
    const m = u.pathname.match(/\/projects\/(\d+)$/);
    if (!m) return json(env({ available: 20 }));
    const id = m[1];
    if (o.chanId !== undefined && Number(id) === o.chanId) return json({ message: "denied" }, 403);
    if (u.searchParams.get("for_house") !== "true") return json(env({ id, estate_type: "du_an", properties: { ten_du_an: "Căn hộ trùng id" } }));
    const r = quet.theoId[id];
    if (!r) return json(env(null));
    return json(env({ id, estate_type: r.estate_type, loai_du_an: "", tinh_trang: "da_ban_giao", properties: { id, ten_du_an: r.ten, danh_sach_thap: [], is_exists_apartment_info: false } }));
  };
  const single = async (url: string): Promise<Response> => {
    sent.push(url);
    return answer(url);
  };
  const client = new S17Client({
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    caps: { calls: 1000, minutes: 60 },
    paceMs: 0,
    now: () => 1_000_000,
    sleep: async () => undefined,
    transport: single,
    ...(o.many
      ? {
          transportMany: async (list) => {
            dot.push(list.length);
            return Promise.all(list.map(async (r) => {
              try {
                return await single(r.url);
              } catch (e) {
                return e as Error;
              }
            }));
          },
        }
      : {}),
  });
  return { client, sent, dot };
}

const quet = (root: string, state: RunState, ke: ReturnType<typeof nguonQuet>, sweep: { from: number; to: number }, o: { concurrency?: number; writer?: BatchWriter } = {}) => {
  const w = o.writer ?? new BatchWriter({ root, maxItems: 100, phase: "lowrise" });
  const run = () =>
    runPhase({ phase: "lowrise", client: ke.client, writer: w, state, save: async () => undefined, log: () => undefined, now: () => new Date("2026-11-24T10:00:00.000Z"), lowriseSweep: sweep, concurrency: o.concurrency ?? 1 }).then(async (s) => {
      await w.flush();
      return s;
    });
  return { run, writer: w };
};

test("lowrise quét theo id: id rỗng ghi nhận là đã kiểm, id có bản ghi thấp tầng thì ghi item, sai namespace tính lỗi", async () => withTmp(async (root) => {
  const ke = nguonQuet({ null: [], dot: [], theoId: { "7": { estate_type: "du_an_nha_dat", ten: "Biệt thự A" }, "8": { estate_type: "du_an", ten: "Là căn hộ" }, "10": { estate_type: "du_an_nha_dat", ten: "Nhà phố B" } } });
  const state = emptyState();
  const s = await quet(root, state, ke, { from: 7, to: 12 }).run();
  const items = await readItems(root);
  const ct = items.filter((it) => it.kind === "du_an_thap_tang");
  assert.deepEqual(ct.map((it) => it.sourceId), ["du-an-nha-dat-7", "du-an-nha-dat-10"]);
  assert.equal(ct[0].meta.phuongPhap, "id-sweep");
  assert.equal(ct[0].meta.ten, "Biệt thự A");
  assert.deepEqual(state.lowriseSweepChecked.sort((a, b) => a - b), [9, 11, 12], "ba id rỗng");
  assert.equal(s.failed, 1, "id 8 trả namespace căn hộ dù có cờ");
  assert.match(String(state.lowriseFailed["8"]), /namespace/);
  assert.equal(s.so?.khongCoBanGhi, 3);
  // Chạy lại: không gọi gì
  const daGoi = ke.sent.length;
  const s2 = await quet(root, state, ke, { from: 7, to: 12 }).run();
  assert.equal(ke.sent.length, daGoi, "mọi id đã kiểm thì không hỏi lại");
  assert.equal(s2.items, 0);
}));

test("lowrise quét theo id: gửi theo đợt với số luồng đã khai, mỗi lời đều mang cờ for_house", async () => withTmp(async (root) => {
  const ke = nguonQuet({ null: [], dot: [], theoId: {} }, { many: true });
  const s = await quet(root, emptyState(), ke, { from: 1, to: 9 }, { concurrency: 4 }).run();
  assert.equal(s.failed, 0);
  assert.deepEqual(ke.dot, [4, 4], "chín id: hai đợt bốn lời, id thứ chín đi riêng");
  assert.ok(ke.sent.every((u) => u.includes("for_house=true")), "mọi lời chi tiết đều có cờ");
  assert.equal(s.so?.khongCoBanGhi, 9);
}));

test("lowrise quét theo id: bị chặn giữa đợt thì dừng, id chưa kiểm không được đánh dấu", async () => withTmp(async (root) => {
  const ke = nguonQuet({ null: [], dot: [], theoId: {} }, { chanId: 3 });
  const state = emptyState();
  const w = new BatchWriter({ root, maxItems: 100, phase: "lowrise" });
  const e = await quet(root, state, ke, { from: 1, to: 5 }, { writer: w }).run().then(() => null, (x: unknown) => x);
  assert.ok(e instanceof Error, "dừng vì bị chặn");
  assert.ok(ke.sent.length < 5, "không gửi hết");
  assert.deepEqual(state.lowriseSweepChecked, [1, 2], "hai id rỗng xong trước lúc bị chặn được ghi nhận sau khi chốt; id 3–5 không");
}));

test("lowrise quét theo id: dải sai hoặc quá rộng thì từ chối trước khi gọi nguồn", async () => withTmp(async (root) => {
  const ke = nguonQuet({ null: [], dot: [], theoId: {} });
  await assert.rejects(quet(root, emptyState(), ke, { from: 0, to: 5 }).run(), ConfigError);
  await assert.rejects(quet(root, emptyState(), ke, { from: 6, to: 5 }).run(), ConfigError);
  await assert.rejects(quet(root, emptyState(), ke, { from: 1, to: 9000 }).run(), /5\.000/);
  assert.equal(ke.sent.length, 0);
}));

test("lowrise: thiếu từ khoá thì từ chối trước khi gọi nguồn", async () => withTmp(async (root) => {
  const ke = nguon({}, {});
  await assert.rejects(chay(root, emptyState(), ke, []).run(), ConfigError);
  assert.equal(ke.sent.length, 0);
}));

test("lowrise: snapshot mang dấu hiệu khuôn 2", async () => withTmp(async (root) => {
  await chay(root, emptyState(), nguon({ V: [] }, {}), ["V"]).run();
  const dir = join(root, "vn");
  const ds = (await readdir(dir)).filter((n) => !n.startsWith("."));
  assert.ok(ds.length >= 1);
  assert.deepEqual(JSON.parse(await readFile(join(dir, ds[0], "manifest.json"), "utf8")).coverage.notes, [S17_NOTES]);
}));
