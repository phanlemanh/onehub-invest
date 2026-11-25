import { strict as assert } from "node:assert";
import { test } from "node:test";

import { loadConfig } from "../collectors/s17-thua-dinh-gia/config.js";
import { ConfigError } from "../collectors/s17-thua-dinh-gia/config.js";
import { RunStopped, S17Client, TemporaryFailure, type Response, type TransportMany, MAX_CONCURRENCY } from "../collectors/s17-thua-dinh-gia/client.js";

/**
 * S17 mốc ngày 2: gửi NHIỀU lời một đợt (đo 24/11: hai lời hồ sơ thửa đồng thời trong trang xong sau 4,9 s
 * thay vì 8,4 s tuần tự; Mạnh cho tăng tốc thận trọng). Mọi khoá của lớp gọi vẫn giữ: trần, nhịp, dừng cả
 * lượt khi bị chặn, hỏi phiên khi lỗi mạng, thử lại đúng luật. Dữ liệu GIẢ, máy chủ .test.
 */

const FAKE_CONFIG = {
  hosts: { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" },
  paths: {
    "parcel-profile": "/v2.x/parcel-profile",
    "project-list": "/v2.x/projects",
    "data-available": "/v2.x/data-available",
    "asset-type": "/v2.x/asset-type",
    balance: "/v2.x/balance",
  },
};

const json = (body: unknown, status = 200): Response => ({ status, contentType: "application/json", body: JSON.stringify(body) });
const loiMang = new TypeError("Failed to fetch");

type Ke = { client: S17Client; sent: string[]; dot: string[][]; slept: number[] };

/** `answer(url)` trả phản hồi hoặc ném lỗi mạng. `many`: có vận chuyển theo đợt hay không. */
function makeClient(
  answer: (url: string, i: number) => Response | Promise<Response>,
  o: { caps?: { calls: number; minutes: number }; paceMs?: number; many?: boolean } = {},
): Ke {
  const sent: string[] = [];
  const dot: string[][] = [];
  const slept: number[] = [];
  let t = 1_000_000;
  const single = async (url: string): Promise<Response> => {
    sent.push(url);
    return answer(url, sent.length);
  };
  const many: TransportMany = async (list) => {
    dot.push(list.map((r) => r.url));
    return Promise.all(
      list.map(async (r) => {
        try {
          return await single(r.url);
        } catch (e) {
          return e as Error;
        }
      }),
    );
  };
  const client = new S17Client({
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    caps: o.caps ?? { calls: 100, minutes: 60 },
    paceMs: o.paceMs ?? 0,
    now: () => t,
    sleep: async (ms: number) => {
      slept.push(ms);
      t += ms;
    },
    transport: single,
    ...(o.many ? { transportMany: many } : {}),
  });
  return { client, sent, dot, slept };
}

const reasonOf = (e: unknown): string => (e instanceof RunStopped ? e.reason : e instanceof TemporaryFailure ? "temporary" : String(e));
const task = (lat: number) => ({ role: "parcel-profile" as const, params: { latitude: lat, longitude: 105.85 } });

test("getJsonMany: gửi theo đợt, mỗi đợt tối đa `concurrency` lời, kết quả đúng thứ tự", async () => {
  const ke = makeClient((url) => json({ status: true, data: { lat: new URL(url).searchParams.get("latitude") } }), { many: true });
  const r = await ke.client.getJsonMany<{ data: { lat: string } }>([task(1), task(2), task(3), task(4), task(5)], 2);
  assert.deepEqual(
    r.map((x) => (x.ok ? x.value.data.lat : "lỗi")),
    ["1", "2", "3", "4", "5"],
  );
  assert.deepEqual(
    ke.dot.map((d) => d.length),
    [2, 2],
    "hai đợt hai lời, lời thứ năm đi riêng",
  );
  assert.equal(ke.sent.length, 5);
  assert.equal(ke.client.calls, 5, "mỗi lời tính vào trần");
});

test("getJsonMany: một lời trong đợt gặp 403 → dừng cả lượt, đợt sau không gửi, mọi lời chưa xong nhận lỗi bị chặn", async () => {
  let i = 0;
  const ke = makeClient(() => (++i === 2 ? json({ message: "denied" }, 403) : json({ status: true, data: { ok: 1 } })), { many: true });
  const r = await ke.client.getJsonMany([task(1), task(2), task(3), task(4), task(5)], 2);
  assert.deepEqual(
    r.map((x) => (x.ok ? "ok" : reasonOf(x.error))),
    ["ok", "blocked", "blocked", "blocked", "blocked"],
  );
  assert.equal(ke.dot.length, 1, "chỉ có đợt đầu tiên được gửi");
  assert.equal(ke.client.blocks, 1);
});

test("getJsonMany: một lời lỗi mạng mà phiên vẫn sống → chỉ lời đó được thử lại một lần rồi nhận lỗi tạm; lời khác vẫn ra kết quả", async () => {
  const ke = makeClient((url) => {
    if (new URL(url).searchParams.get("latitude") === "2") throw loiMang;
    return json({ status: true, data: { ok: 1 } });
  }, { many: true, paceMs: 10 });
  const r = await ke.client.getJsonMany([task(1), task(2), task(3), task(4)], 2);
  assert.deepEqual(
    r.map((x) => (x.ok ? "ok" : reasonOf(x.error))),
    ["ok", "temporary", "ok", "ok"],
  );
  assert.equal(ke.sent.filter((u) => u.includes("latitude=2")).length, 2, "lời lỗi được thử lại đúng một lần");
  assert.equal(ke.client.calls, 7, "4 lời đầu + 2 lần hỏi kiểm phiên (mỗi lần lỗi một lần) + 1 lần thử lại");
  assert.match(String((r[1] as { error: Error }).error.message), /Failed to fetch/, "lỗi tạm giữ lời lỗi gốc của vận chuyển");
});

test("getJsonMany: tôn trọng trần lời gọi — không gửi quá trần, phần vượt nhận lỗi quá trần", async () => {
  const ke = makeClient(() => json({ status: true, data: {} }), { many: true, caps: { calls: 3, minutes: 60 } });
  const r = await ke.client.getJsonMany([task(1), task(2), task(3), task(4), task(5)], 2);
  assert.deepEqual(
    r.map((x) => (x.ok ? "ok" : reasonOf(x.error))),
    ["ok", "ok", "ok", "call-cap", "call-cap"],
  );
  assert.equal(ke.sent.length, 3);
});

test("getJsonMany: lỗi cấu hình (vai chưa khai đường) thì từ chối trước khi gửi lời nào", async () => {
  const ke = makeClient(() => json({ status: true, data: {} }), { many: true });
  await assert.rejects(ke.client.getJsonMany([task(1), { role: "market-price", params: { lat: 1, lng: 2 } }], 2), ConfigError);
  assert.equal(ke.sent.length, 0);
});

test("getJsonMany: không có vận chuyển theo đợt thì gửi tuần tự, kết quả không đổi", async () => {
  const ke = makeClient((url) => json({ status: true, data: { lat: new URL(url).searchParams.get("latitude") } }));
  const r = await ke.client.getJsonMany<{ data: { lat: string } }>([task(1), task(2), task(3)], 2);
  assert.deepEqual(
    r.map((x) => (x.ok ? x.value.data.lat : "lỗi")),
    ["1", "2", "3"],
  );
  assert.equal(ke.dot.length, 0, "không có đợt nào");
});

test("getJsonMany: concurrency ngoài 1–8 (trần chung MAX_CONCURRENCY, Mạnh 25/11) hoặc rỗng thì từ chối", async () => {
  const ke = makeClient(() => json({ status: true, data: {} }), { many: true });
  await assert.rejects(ke.client.getJsonMany([task(1)], 0), ConfigError);
  await assert.rejects(ke.client.getJsonMany([task(1)], MAX_CONCURRENCY + 1), ConfigError);
  assert.deepEqual(await ke.client.getJsonMany([], MAX_CONCURRENCY), [], "đúng trần thì nhận");
});

test("getJsonMany: nghỉ thử lại xong mà đã quá trần thời gian thì không gửi nữa", async () => {
  const ke = makeClient(() => json({ status: false }, 503), { many: true, caps: { calls: 100, minutes: 0.1 } });
  const r = await ke.client.getJsonMany([task(1)], 1);
  assert.equal(((r[0] as unknown) as { error: RunStopped }).error.reason, "time-cap");
  // Lần một (t=0) và lần hai (t=5, còn trong trần 6 giây): mỗi lần một lời (5xx có phản hồi nên không hỏi đối chiếu); nghỉ 15 giây → t=20 quá trần.
  assert.equal(ke.sent.length, 2, "không gửi gì sau khi nghỉ xong đã quá trần");
});

test("getJsonMany: giữ nhịp trước mỗi lời (kể cả lời kiểm phiên) và đúng thang nghỉ trước mỗi lần thử lại", async () => {
  let lan = 0;
  const ke = makeClient(() => {
    if (++lan === 2) throw new TypeError("Failed to fetch");
    return json({ status: true, data: { ok: 1 } });
  }, { many: true, paceMs: 7 });
  const r = await ke.client.getJsonMany([task(1), task(2), task(3)], 2);
  assert.deepEqual(r.map((x) => (x.ok ? "ok" : reasonOf(x.error))), ["ok", "ok", "ok"], "lời lỗi được thử lại một lần rồi thành công");
  assert.deepEqual(ke.slept, [7, 7, 7, 7, 5000, 7], "đợt một: hai nhịp; lời kiểm phiên của lời lỗi: một nhịp; lời thứ ba: một nhịp; thử lại: 5 giây rồi một nhịp");
});

test("getJsonMany: đang bị chặn giữa đợt mà một lời khác lỗi mạng → không gửi thêm lời kiểm phiên nào; mọi lời nhận lỗi dừng", async () => {
  const ke = makeClient((url) => {
    const lat = new URL(url).searchParams.get("latitude");
    if (lat === "1") return json({ message: "denied" }, 403);
    if (lat === "2") throw new TypeError("Failed to fetch");
    return json({ status: true, data: {} });
  }, { many: true });
  const r = await ke.client.getJsonMany([task(1), task(2), task(3), task(4)], 2);
  assert.deepEqual(
    r.map((x) => (x.ok ? "ok" : reasonOf(x.error))),
    ["blocked", "blocked", "blocked", "blocked"],
  );
  assert.equal(ke.sent.filter((u) => u.includes("/data-available") || u.includes("/asset-type")).length, 0, "không gửi lời kiểm phiên nào sau khi bị chặn");
  assert.equal(ke.client.calls, 2, "chỉ hai lời của đợt đầu tiên được gửi");
});

test("getJsonMany: lỗi mạng đứng TRƯỚC 403 trong cùng đợt → không gửi lời kiểm phiên nào; khoá dừng được đặt trước khi phân loại", async () => {
  const ke = makeClient((url) => {
    const lat = new URL(url).searchParams.get("latitude");
    if (lat === "1") throw new TypeError("Failed to fetch");
    if (lat === "2") return json({ message: "denied" }, 403);
    return json({ status: true, data: {} });
  }, { many: true });
  const r = await ke.client.getJsonMany([task(1), task(2), task(3)], 2);
  assert.deepEqual(
    r.map((x) => (x.ok ? "ok" : reasonOf(x.error))),
    ["blocked", "blocked", "blocked"],
  );
  assert.equal(ke.sent.filter((u) => u.includes("/data-available") || u.includes("/asset-type")).length, 0, "403 đã về trong đợt thì không hỏi đối chiếu nữa");
  assert.equal(ke.client.calls, 2);
  const ke2 = makeClient((url) => {
    const lat = new URL(url).searchParams.get("latitude");
    if (lat === "2") return { status: 403, contentType: "text/html", body: "<html>captcha</html>" };
    if (lat === "1") throw new TypeError("Failed to fetch");
    return json({ status: true, data: {} });
  }, { many: true });
  const r2 = await ke2.client.getJsonMany([task(1), task(2)], 2);
  assert.deepEqual(
    r2.map((x) => (x.ok ? "ok" : reasonOf(x.error))),
    ["blocked", "blocked"],
  );
  assert.equal(ke2.sent.length, 2, "trang thử thách trong đợt cũng khoá dừng ngay, không hỏi đối chiếu");
});

test("vận chuyển ném RunStopped (vd trang không còn ở gốc của nguồn): dừng ngay — không thử lại như lỗi mạng, mỗi lời nhận đúng lỗi dừng", async () => {
  const dung = new RunStopped("page-origin", "trang không còn ở gốc của nguồn");
  for (const many of [false, true]) {
    const ke = makeClient(() => {
      throw dung;
    }, { many });
    if (many) {
      const rs = await ke.client.getJsonMany([{ role: "asset-type", params: {} }, { role: "asset-type", params: {} }, { role: "asset-type", params: {} }], 1);
      assert.equal(rs.length, 3);
      for (const r of rs) assert.ok(!r.ok && r.error === dung);
    } else {
      await assert.rejects(() => ke.client.getJson("asset-type", {}), (e: unknown) => e === dung);
    }
    assert.ok(ke.slept.every((ms) => ms < 1000), `không chờ thử lại (các lần nghỉ: ${JSON.stringify(ke.slept)})`);
  }
});
