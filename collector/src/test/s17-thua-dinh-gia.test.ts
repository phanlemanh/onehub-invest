import { strict as assert } from "node:assert";
import { test } from "node:test";

import { ConfigError, loadConfig } from "../collectors/s17-thua-dinh-gia/config.js";
import { S17Client, RunStopped, TemporaryFailure, type Caps, type Response } from "../collectors/s17-thua-dinh-gia/client.js";

/**
 * S17 mốc ngày 1 (claudedp-2411-20) — lớp gọi có khoá: mọi lời đi qua vai đã khai, không có đường có
 * hậu tố trả phí, có trần lời gọi, trần thời gian, dừng cả lượt khi bị chặn hay hết phiên.
 * Cấu hình GIẢ (máy chủ .test) — máy chủ và đường thật là tầng A, chỉ ở tệp local.
 */

const FAKE_CONFIG = {
  hosts: { api: "https://api.gia.test", agent: "https://agent.gia.test", web: "https://web.gia.test" },
  paths: {
    "project-list": "/v2.x/projects",
    "project-detail": "/v2.x/projects/{id}",
    "land-price-by-district": "/v2.x/land-price/{districtCode}",
    "asset-type": "/v2.x/asset-type",
    "data-available": "/v2.x/data-available",
    balance: "/v2.x/balance",
  },
};

const json = (body: unknown, status = 200): Response => ({ status, contentType: "application/json", body: JSON.stringify(body) });

type Rig = {
  client: S17Client;
  sent: string[]; // URL đã gửi, theo thứ tự
  slept: number[]; // số ms mỗi lần nghỉ
};

/** Dựng khách với vận chuyển giả. `respond(i, url)` trả phản hồi hoặc ném lỗi mạng. */
function makeClient(
  respond: (i: number, url: string) => Response | Promise<Response>,
  o: { caps?: Caps; paceMs?: number; perCallMs?: number } = {},
): Rig {
  const sent: string[] = [];
  const slept: number[] = [];
  let t = 1_000_000;
  const client = new S17Client({
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    caps: o.caps ?? { calls: 100, minutes: 60 },
    paceMs: o.paceMs ?? 0,
    now: () => t,
    sleep: async (ms: number) => {
      slept.push(ms);
      t += ms;
    },
    transport: async (url: string) => {
      sent.push(url);
      t += o.perCallMs ?? 0;
      return respond(sent.length, url);
    },
  });
  return { client, sent, slept };
}

const reasonOf = (e: unknown): string => (e instanceof RunStopped ? e.reason : `không phải RunStopped: ${String(e)}`);

// ---------- cấu hình ----------

test("loadConfig: từ chối đường có đoạn cp (biến thể trả phí)", () => {
  const text = JSON.stringify({ ...FAKE_CONFIG, paths: { ...FAKE_CONFIG.paths, "project-detail": "/v2.x/projects/cp" } });
  assert.throws(() => loadConfig(text), ConfigError);
});

test("loadConfig: từ chối đường không bắt đầu bằng / hoặc có ..", () => {
  assert.throws(() => loadConfig(JSON.stringify({ ...FAKE_CONFIG, paths: { "project-list": "v2.x/projects" } })), ConfigError);
  assert.throws(() => loadConfig(JSON.stringify({ ...FAKE_CONFIG, paths: { "project-list": "/v2.x/../other" } })), ConfigError);
});

test("loadConfig: thiếu máy chủ api thì không chạy", () => {
  const { api: _omit, ...hostsMissing } = FAKE_CONFIG.hosts;
  assert.throws(() => loadConfig(JSON.stringify({ ...FAKE_CONFIG, hosts: hostsMissing })), ConfigError);
});

// ---------- dựng URL ----------

test("url: tham số được phép xếp theo thứ tự khoá, giá trị được mã hoá", () => {
  const { client } = makeClient(() => json({}));
  assert.equal(client.url("project-list", { query: "Times City", page: 0, size: 100 }), "https://api.gia.test/v2.x/projects?page=0&query=Times%20City&size=100");
});

test("url: thay đặt chỗ trong đường; vai số dư đi máy chủ phụ", () => {
  const { client } = makeClient(() => json({}));
  assert.equal(client.url("project-detail", { id: 684 }), "https://api.gia.test/v2.x/projects/684");
  assert.equal(client.url("balance", {}), "https://agent.gia.test/v2.x/balance");
});

test("url: tham số ngoài danh sách bị từ chối trước khi gửi", async () => {
  const { client, sent } = makeClient(() => json({}));
  await assert.rejects(client.getJson("project-list", { size: 1, sneaky: 1 }), ConfigError);
  assert.equal(sent.length, 0, "không gửi gì khi tham số không được khai");
});

test("url: thiếu đặt chỗ trong đường thì không dựng được", () => {
  const { client } = makeClient(() => json({}));
  assert.throws(() => client.url("project-detail", {}), ConfigError);
});

test("url: vai chưa khai đường trong cấu hình local thì dừng", () => {
  const { client } = makeClient(() => json({}));
  assert.throws(() => client.url("parcel-profile", {}), ConfigError);
});

// ---------- trần ----------

test("trần lời gọi: lời thứ caps.calls + 1 bị từ chối, không gửi thêm", async () => {
  const { client, sent } = makeClient(() => json({ status: true, data: [] }), { caps: { calls: 3, minutes: 60 } });
  for (let i = 0; i < 3; i++) await client.getJson("asset-type", {});
  const e = await client.getJson("asset-type", {}).then(() => null, (x: unknown) => x);
  assert.equal(reasonOf(e), "call-cap");
  assert.equal(sent.length, 3, "chỉ gửi đúng trần lời gọi");
  assert.equal(client.calls, 3);
});

test("trần thời gian: quá số phút thì dừng dù còn hạn mức lời gọi", async () => {
  const { client, sent } = makeClient(() => json({ status: true, data: [] }), { caps: { calls: 100, minutes: 25 }, perCallMs: 10 * 60_000 });
  for (let i = 0; i < 3; i++) await client.getJson("asset-type", {});
  const e = await client.getJson("asset-type", {}).then(() => null, (x: unknown) => x);
  assert.equal(reasonOf(e), "time-cap");
  assert.equal(sent.length, 3, "mỗi lời 10 phút: sau 3 lời là 30 phút, quá trần 25 phút");
});

// ---------- dừng cả lượt ----------

test("403: dừng cả lượt, mọi lời sau không gửi nữa", async () => {
  const { client, sent } = makeClient((i) => (i === 2 ? json({ message: "denied" }, 403) : json({ status: true })));
  await client.getJson("asset-type", {});
  const e = await client.getJson("asset-type", {}).then(() => null, (x: unknown) => x);
  assert.equal(reasonOf(e), "blocked");
  const e2 = await client.getJson("asset-type", {}).then(() => null, (x: unknown) => x);
  assert.equal(reasonOf(e2), "blocked", "đã bị chặn thì lời kế cũng bị từ chối");
  assert.equal(sent.length, 2, "lời thứ ba không được gửi");
  assert.equal(client.blocks, 1);
});

test("429: cũng dừng cả lượt", async () => {
  const { client, sent } = makeClient(() => json({ message: "slow down" }, 429));
  const e = await client.getJson("asset-type", {}).then(() => null, (x: unknown) => x);
  assert.equal(reasonOf(e), "blocked");
  await client.getJson("asset-type", {}).catch(() => undefined);
  assert.equal(sent.length, 1);
});

test("trang HTML thay cho JSON (trang thử thách): tính là bị chặn", async () => {
  const { client, sent } = makeClient(() => ({ status: 200, contentType: "text/html", body: "<html>captcha</html>" }));
  const e = await client.getJson("asset-type", {}).then(() => null, (x: unknown) => x);
  assert.equal(reasonOf(e), "blocked");
  await client.getJson("asset-type", {}).catch(() => undefined);
  assert.equal(sent.length, 1);
});

test("401: dừng vì hết phiên, mọi lời sau không gửi", async () => {
  const { client, sent } = makeClient(() => json({ status: false }, 401));
  const e = await client.getJson("data-available", {}).then(() => null, (x: unknown) => x);
  assert.equal(reasonOf(e), "session-expired");
  await client.getJson("data-available", {}).catch(() => undefined);
  assert.equal(sent.length, 1);
});

test("lời cần phiên lỗi mạng mà lời công khai vẫn chạy: tính là hết phiên", async () => {
  // Nguồn trả 401 không kèm CORS nên trong trang chỉ thấy lỗi mạng; đối chiếu với một lời công khai.
  const { client, sent } = makeClient((_i, url) => {
    if (url.endsWith("/data-available")) throw new TypeError("Failed to fetch");
    return json({ status: true, data: [] });
  });
  const e = await client.getJson("data-available", {}).then(() => null, (x: unknown) => x);
  assert.equal(reasonOf(e), "session-expired");
  assert.deepEqual(sent, ["https://api.gia.test/v2.x/data-available", "https://api.gia.test/v2.x/asset-type"], "một lời phiên + một lời công khai đối chiếu");
});

test("lỗi mạng cả hai: thử lại sau 5s, 15s, 30s rồi trả lỗi tạm, không dừng lượt", async () => {
  const { client, sent, slept } = makeClient(() => {
    throw new TypeError("Failed to fetch");
  });
  const e = await client.getJson("data-available", {}).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof TemporaryFailure, `phải là TemporaryFailure, nhận ${String(e)}`);
  assert.equal(sent.length, 8, "4 lần thử lời phiên, mỗi lần kèm một lời công khai đối chiếu");
  assert.deepEqual(slept.filter((ms) => ms > 0), [5000, 15000, 30000]);
});

test("10 lỗi tạm liên tiếp: dừng lượt", async () => {
  const { client } = makeClient(() => {
    throw new TypeError("Failed to fetch");
  });
  let last = "";
  for (let i = 0; i < 10; i++) {
    const e = await client.getJson("asset-type", {}).then(() => null, (x: unknown) => x);
    last = e instanceof RunStopped ? e.reason : e instanceof TemporaryFailure ? "temporary" : String(e);
  }
  assert.equal(last, "network-down");
});

test("lỗi 5xx của lời công khai: thử lại rồi trả lỗi tạm", async () => {
  const { client, sent, slept } = makeClient(() => json({ message: "boom" }, 503));
  const e = await client.getJson("asset-type", {}).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof TemporaryFailure);
  assert.equal(sent.length, 4, "một lần gửi và ba lần thử lại");
  assert.deepEqual(slept.filter((ms) => ms > 0), [5000, 15000, 30000]);
});

// ---------- nhịp và kết quả ----------

test("nhịp: nghỉ đủ trước mỗi lời gửi", async () => {
  const { client, slept, sent } = makeClient(() => json({ status: true, data: [] }), { paceMs: 350 });
  await client.getJson("asset-type", {});
  await client.getJson("asset-type", {});
  assert.deepEqual(slept, [350, 350]);
  assert.equal(sent.length, 2);
});

test("getJson trả body đã phân tích; getRaw trả phản hồi gốc", async () => {
  const body = { status: true, message: null, data: [{ code: "01" }], pagination: null, extra: {} };
  const { client } = makeClient(() => json(body));
  assert.deepEqual(await client.getJson("asset-type", {}), body);
  const raw = await client.getRaw("asset-type", {});
  assert.equal(raw.status, 200);
  assert.equal(JSON.parse(raw.body).data[0].code, "01");
});

test("readBalance: đọc số dư từ body của máy chủ phụ (hình dạng đo 24/11: data.available)", async () => {
  // Phản hồi thật còn nhiều số khác (đã rút, đã hết hạn, đã nạp) — chỉ trường số dư mới tính là số dư.
  const { client, sent } = makeClient(() => json({ status: true, message: null, data: { available: 20, donated: 20, buyed: 0, reward: 0, withdraw: 11, expired: 109, deposited: 140, valid_available: true, detail_by_type: [{}, {}, {}] }, pagination: null, extra: {} }));
  assert.equal(await client.readBalance(), 20);
  assert.deepEqual(sent, ["https://agent.gia.test/v2.x/balance"]);
});

test("readBalance: body không có số dư thì trả lỗi tạm, không đoán số", async () => {
  const { client } = makeClient(() => json({ status: true, data: { detail_by_type: [] } }));
  await assert.rejects(client.readBalance(), TemporaryFailure);
});
