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
    gallery: "/v2.x/gallery/{id}",
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
  o: { caps?: Caps; paceMs?: number; perCallMs?: number; shouldStop?: () => boolean } = {},
): Rig {
  const sent: string[] = [];
  const slept: number[] = [];
  let t = 1_000_000;
  const client = new S17Client({
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    caps: o.caps ?? { calls: 100, minutes: 60 },
    paceMs: o.paceMs ?? 0,
    ...(o.shouldStop ? { shouldStop: o.shouldStop } : {}),
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

test("loadConfig: từ chối máy chủ http: — phiên chỉ được gửi qua kết nối mã hoá (lượt soát 24/11: cấu hình sai một chỗ là phiên đi dạng rõ)", () => {
  const sai = (api: string) => loadConfig(JSON.stringify({ ...FAKE_CONFIG, hosts: { ...FAKE_CONFIG.hosts, api } }));
  assert.throws(() => sai("http://api.gia.test"), ConfigError);
  assert.throws(() => sai("api.gia.test"), ConfigError, "phải có đủ giao thức");
  assert.doesNotThrow(() => sai("https://api.gia.test/"));
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

test("lời cần phiên lỗi mạng, lời kiểm phiên cũng lỗi mà lời công khai vẫn chạy: tính là hết phiên", async () => {
  // Nguồn trả 401 không kèm CORS nên trong trang chỉ thấy lỗi mạng. Muốn biết phiên chết thì phải hỏi
  // chính một lời cần phiên — hỏi lời công khai thì không phân biệt được với «riêng bản ghi này lỗi».
  const { client, sent } = makeClient((_i, url) => {
    if (url.endsWith("/data-available") || url.includes("/projects?")) throw new TypeError("Failed to fetch");
    return json({ status: true, data: [] });
  });
  const e = await client.getJson("project-list", { page: 0 }).then(() => null, (x: unknown) => x);
  assert.equal(reasonOf(e), "session-expired");
  assert.deepEqual(sent, ["https://api.gia.test/v2.x/projects?page=0", "https://api.gia.test/v2.x/data-available", "https://api.gia.test/v2.x/asset-type"], "một lời phiên + một lời kiểm phiên + một lời công khai đối chiếu");
});

test("lời cần phiên lỗi mạng mà phiên vẫn sống: thử lại một lần sau 5s rồi tính là lỗi của riêng bản ghi, không dừng lượt", async () => {
  // Lượt thật 24/11 14:23: một lời thư viện ảnh lỗi mạng, bộ thu đoán nhầm là hết phiên và dừng cả lượt ở 1.690/2.508.
  const { client, sent, slept } = makeClient((_i, url) => {
    if (url.includes("/gallery/")) throw new TypeError("Failed to fetch");
    return json({ status: true, data: [] });
  });
  const e = await client.getJson("gallery", { id: 7 }).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof TemporaryFailure, `phải là lỗi của riêng bản ghi, nhận ${String(e)}`);
  assert.equal(sent.filter((u) => u.includes("/gallery/")).length, 2, "hai lần thử lời ấy");
  assert.equal(sent.filter((u) => u.endsWith("/data-available")).length, 2, "mỗi lần hỏi một lời kiểm phiên");
  assert.equal(sent.length, 4);
  assert.deepEqual(slept.filter((ms) => ms > 0), [5000]);
});

test("lời cần phiên lỗi mạng, cả lời kiểm phiên lẫn lời công khai đều lỗi: là mạng, đi hết thang thử lại", async () => {
  const { client, sent, slept } = makeClient(() => {
    throw new TypeError("Failed to fetch");
  });
  const e = await client.getJson("gallery", { id: 7 }).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof TemporaryFailure, `mạng hỏng không được tính là hết phiên, nhận ${String(e)}`);
  assert.equal(sent.length, 12, "4 lần thử, mỗi lần kèm một lời kiểm phiên và một lời công khai");
  assert.deepEqual(slept.filter((ms) => ms > 0), [5000, 15000, 30000]);
});

test("lỗi tạm mang theo LỜI LỖI GỐC của vận chuyển (lượt thật 24/11 18:09: không đọc được số dư trước lượt mà không tra được vì sao)", async () => {
  const { client } = makeClient(() => {
    throw new TypeError("TypeError: Failed to fetch");
  });
  const e = await client.getJson("project-detail", { id: 7 }).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof TemporaryFailure, String(e));
  assert.equal(e.message, 'vai "project-detail" lỗi mạng «TypeError: Failed to fetch» sau 3 lần thử lại');
});

test("lỗi tạm vì 5xx vẫn ghi mã trạng thái; vận chuyển ném chuỗi thì ghi nguyên chuỗi", async () => {
  const sau5xx = await makeClient(() => json({ ok: false }, 503)).client.getJson("project-detail", { id: 7 }).then(() => null, (x: unknown) => x);
  assert.ok(sau5xx instanceof TemporaryFailure);
  assert.match(sau5xx.message, /lỗi HTTP 503 sau 3 lần thử lại$/);
  const chuoi = await makeClient(() => {
    throw "mạng hỏng lạ";
  }).client.getJson("project-detail", { id: 7 }).then(() => null, (x: unknown) => x);
  assert.ok(chuoi instanceof TemporaryFailure);
  assert.match(chuoi.message, /lỗi mạng «mạng hỏng lạ»/);
});

test("yêu cầu dừng (shouldStop) thành true thì dừng cả lượt ở lời kế tiếp: không gửi thêm lời, không tính là bị chặn", async () => {
  let dung = false;
  const { client, sent } = makeClient(() => json({ ok: true }), { shouldStop: () => dung });
  assert.deepEqual(await client.getJson("project-list"), { ok: true });
  dung = true;
  const e = await client.getJson("project-list").then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped, String(e));
  assert.equal(e.reason, "operator-stop");
  assert.equal(await client.getJson("project-list").then(() => null, (x: unknown) => x), e, "đã dừng thì mọi lời sau bị từ chối bằng chính lỗi dừng");
  assert.equal(sent.length, 1, "không gửi thêm lời nào");
  assert.equal(client.blocks, 0, "dừng theo yêu cầu không phải bị chặn");
});

test("yêu cầu dừng giữa một đợt nhiều lời: phần chưa gửi của đợt nhận lỗi dừng, không gửi", async () => {
  let dung = false;
  const { client, sent } = makeClient(() => json({ ok: true }), { shouldStop: () => dung });
  const r = await client.getJsonMany(
    [1, 2, 3, 4].map((id) => ({ role: "project-detail" as const, params: { id } })),
    2,
  );
  assert.deepEqual(r.map((x) => (x.ok ? "ok" : (x.error as RunStopped).reason)), ["ok", "ok", "ok", "ok"]);
  dung = true;
  sent.length = 0;
  const r2 = await client.getJsonMany(
    [5, 6, 7].map((id) => ({ role: "project-detail" as const, params: { id } })),
    2,
  );
  assert.equal(sent.length, 0, "đợt kế không gửi lời nào");
  assert.deepEqual(r2.map((x) => (x.ok ? "ok" : (x.error as RunStopped).reason)), ["operator-stop", "operator-stop", "operator-stop"]);
});

test("lời kiểm phiên trả 403 → dừng cả lượt là BỊ CHẶN và đếm bị chặn; không gửi thêm lời (lượt soát 24/11: phản hồi của lời kiểm phiên chưa bao giờ được phân loại)", async () => {
  const { client, sent } = makeClient((_i, url) => {
    if (new URL(url).pathname.endsWith("/data-available")) return json({ message: "denied" }, 403);
    throw new TypeError("Failed to fetch");
  });
  const e = await client.getJson("gallery", { id: 7 }).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped, String(e));
  assert.equal(e.reason, "blocked");
  assert.equal(client.blocks, 1);
  assert.equal(sent.length, 2, "lời chính và một lời kiểm phiên; dừng ngay");
});

test("lời kiểm phiên trả 429 → bị chặn; 401 → hết phiên; trang HTML → bị chặn (trang thử thách)", async () => {
  const thuong = (phanHoi: Response) => makeClient((_i, url) => {
    if (new URL(url).pathname.endsWith("/data-available")) return phanHoi;
    throw new TypeError("Failed to fetch");
  });
  const a = thuong(json({ message: "slow down" }, 429));
  assert.equal(((await a.client.getJson("gallery", { id: 7 }).catch((x: unknown) => x)) as RunStopped).reason, "blocked");
  assert.equal(a.client.blocks, 1);
  const b = thuong(json({}, 401));
  assert.equal(((await b.client.getJson("gallery", { id: 7 }).catch((x: unknown) => x)) as RunStopped).reason, "session-expired");
  const c = thuong({ status: 200, contentType: "text/html", body: "<html>captcha</html>" });
  assert.equal(((await c.client.getJson("gallery", { id: 7 }).catch((x: unknown) => x)) as RunStopped).reason, "blocked");
  assert.equal(c.client.blocks, 1);
});

test("lời kiểm phiên trả 5xx → không kết luận được gì về phiên: đi thang thử lại như mạng hỏng, không dừng oan là hết phiên", async () => {
  const { client, sent } = makeClient((_i, url) => {
    const duong = new URL(url).pathname;
    if (duong.endsWith("/data-available")) return json({}, 503);
    if (duong.endsWith("/asset-type")) return json({});
    throw new TypeError("Failed to fetch");
  });
  const e = await client.getJson("gallery", { id: 7 }).then(() => null, (x: unknown) => x);
  assert.ok(e instanceof TemporaryFailure, `phải là lỗi tạm của riêng bản ghi, nhận ${String(e)}`);
  assert.equal(sent.some((u) => u.includes("/asset-type")), false, "lời kiểm phiên 5xx không dẫn tới kết luận hết phiên");
  assert.equal(sent.filter((u) => u.includes("/gallery")).length, 4, "đi hết ba lần thử lại như mạng hỏng — nếu coi 5xx là phiên còn sống thì chỉ thử lại một lần (2 lời)");
});

test("nghỉ thử lại xong mà đã quá trần thời gian thì KHÔNG gửi nữa (lượt soát 24/11: lời gửi ở giây 64,5 với trần 60 giây)", async () => {
  let t = 0;
  const sent: string[] = [];
  const client = new S17Client({
    config: loadConfig(JSON.stringify(FAKE_CONFIG)),
    caps: { calls: 100, minutes: 0.1 },
    paceMs: 0,
    now: () => t,
    sleep: async (ms) => {
      t += ms;
    },
    transport: async (url) => {
      sent.push(url);
      return json({}, 503);
    },
  });
  // 0,1 phút = 6 giây: lỗi ở t=0 → nghỉ 5 giây → gửi lần hai ở t=5 (còn trong trần) → lỗi → nghỉ 15 giây → t=20: quá trần.
  const e = await client.getJson("project-list").then(() => null, (x: unknown) => x);
  assert.ok(e instanceof RunStopped, String(e));
  assert.equal(e.reason, "time-cap");
  assert.equal(sent.length, 2, "không gửi lần thứ ba sau khi nghỉ xong đã quá trần");
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
