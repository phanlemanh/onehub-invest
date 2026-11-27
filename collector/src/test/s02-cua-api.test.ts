// s02-cua-api.test.ts — 2511-s02 (cửa API): tra đổi refresh token lấy appToken bằng đúng hai lời ứng dụng gửi,
// rồi trình lấy token của bộ thu và call() đi cửa API. (Bối cảnh 24/11–26/11: mở route dữ liệu trong trình duyệt
// bị trang thử thách chặn, token 15 phút không được cấp lại, AUTH FAIL mỗi đêm. Bộ thu mới KHÔNG mở trình duyệt.)
// Mọi phản hồi HTTP trong tệp này do fetch giả dựng — không gọi mạng, không dùng phiên thật.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { AUTH_API, CLIENT_ID, LoiBiChan, LoiXacThuc, doiToken, phanLoaiPhanHoi } from "../collectors/airdna-session.js";

const jwt = (payload: object) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.chuky`;
const giay = (ms: number) => Math.floor(ms / 1000);
const RT = "refresh-gia-cho-test-khong-phai-that-0123456789abcdef";
const ID_TOKEN = jwt({ sub: "id", exp: giay(Date.now() + 900_000) });
const APP_TOKEN = jwt({ uid: "1", exp: giay(Date.now() + 900_000) });

type GoiDi = { url: string; init?: RequestInit };
/** fetch giả: đếm số lần gọi trên mỗi bộ (lan = 0, 1, 2…) — gọi mạng thật thì không có gì thay được. */
const fetchGia = (xuLy: (goi: GoiDi, lan: number) => Response | Promise<Response>): typeof fetch => {
  let so = 0;
  return (async (url: string | URL | Request, init?: RequestInit) => xuLy({ url: String(url), init }, so++)) as unknown as typeof fetch;
};
const json = (trangThai: number, than: unknown, headerThem: Record<string, string> = {}) => () =>
  new Response(JSON.stringify(than), { status: trangThai, headers: { "content-type": "application/json", ...headerThem } });
const html = (trangThai: number, headerThem: Record<string, string> = {}) => () =>
  new Response("<!DOCTYPE html><html><title>Just a moment...</title></html>", { status: trangThai, headers: { "content-type": "text/html; charset=UTF-8", ...headerThem } });

function cuaThu(fetchImpl: typeof fetch) {
  let take = 0;
  return {
    doi: { rateLimit: { take: async () => void take++ }, fetchImpl },
    soTake: () => take,
  };
}

// ---------------------------------------------------------------- phanLoaiPhanHoi — phân loại phản hồi
test("2511-s02 phân loại: 2xx → ok", () => {
  assert.equal(phanLoaiPhanHoi({ trangThai: 200, cfMitigated: null, kieuNoiDung: "application/json" }), "ok");
  assert.equal(phanLoaiPhanHoi({ trangThai: 204, cfMitigated: null, kieuNoiDung: "" }), "ok");
});

test("2511-s02 phân loại: 429, hoặc đầu cf-mitigated: challenge, hoặc lỗi kèm trang HTML → bi-chan (dừng, không lách)", () => {
  assert.equal(phanLoaiPhanHoi({ trangThai: 429, cfMitigated: null, kieuNoiDung: "application/json" }), "bi-chan");
  assert.equal(phanLoaiPhanHoi({ trangThai: 403, cfMitigated: "challenge", kieuNoiDung: "text/html" }), "bi-chan");
  assert.equal(phanLoaiPhanHoi({ trangThai: 503, cfMitigated: null, kieuNoiDung: "text/html; charset=UTF-8" }), "bi-chan");
});

test("2511-s02 phân loại: đầu cf-mitigated: challenge ĐỨNG MỘT MÌNH (thân không phải HTML, kể cả mã 200) → vẫn bi-chan", () => {
  assert.equal(phanLoaiPhanHoi({ trangThai: 403, cfMitigated: "challenge", kieuNoiDung: "application/json" }), "bi-chan");
  assert.equal(phanLoaiPhanHoi({ trangThai: 200, cfMitigated: "challenge", kieuNoiDung: "application/json" }), "bi-chan");
});

test("2511-s02 phân loại: 401/403 phản hồi JSON → xac-thuc (phiên chết, cần đăng nhập lại)", () => {
  assert.equal(phanLoaiPhanHoi({ trangThai: 401, cfMitigated: null, kieuNoiDung: "application/json" }), "xac-thuc");
  assert.equal(phanLoaiPhanHoi({ trangThai: 403, cfMitigated: null, kieuNoiDung: "application/json" }), "xac-thuc");
});

test("2511-s02 phân loại: 5xx JSON → tam-thoi (được thử lại); 4xx khác → loi", () => {
  assert.equal(phanLoaiPhanHoi({ trangThai: 500, cfMitigated: null, kieuNoiDung: "application/json" }), "tam-thoi");
  assert.equal(phanLoaiPhanHoi({ trangThai: 503, cfMitigated: null, kieuNoiDung: "application/json" }), "tam-thoi");
  assert.equal(phanLoaiPhanHoi({ trangThai: 404, cfMitigated: null, kieuNoiDung: "application/json" }), "loi");
  assert.equal(phanLoaiPhanHoi({ trangThai: 400, cfMitigated: null, kieuNoiDung: "application/json" }), "loi");
});

// ---------------------------------------------------------------- doiToken — hai lời tra đổi
test("2511-s02 doiToken: đúng hai lời, đúng thứ tự — fetch_id_token {refresh_token, client_id} rồi fetch_app_token Bearer id_token → appToken; mỗi lời một take()", async () => {
  const cacGoi: GoiDi[] = [];
  const { doi, soTake } = cuaThu(fetchGia(async (goi) => {
    cacGoi.push(goi);
    return goi.url.endsWith("/v1/fetch_id_token") ? json(200, { id_token: ID_TOKEN })() : json(200, { token: APP_TOKEN, status: "OK" })();
  }));
  const kq = await doiToken(RT, doi);
  assert.equal(kq.appToken, APP_TOKEN);
  assert.equal(kq.refreshToken, RT, "nguồn không xoay phiên → giữ nguyên refresh token");
  assert.equal(cacGoi.length, 2);
  assert.equal(cacGoi[0].url, `${AUTH_API}/v1/fetch_id_token`);
  assert.equal(cacGoi[1].url, `${AUTH_API}/v1/fetch_app_token`);
  assert.deepEqual(JSON.parse(String(cacGoi[0].init?.body)), { refresh_token: RT, client_id: CLIENT_ID });
  assert.deepEqual(JSON.parse(String(cacGoi[1].init?.body)), {}, "tài khoản thường không giả danh → thân rỗng");
  assert.equal((cacGoi[0].init?.headers as Record<string, string>).authorization, undefined, "lời đầu không mang Bearer");
  assert.equal((cacGoi[1].init?.headers as Record<string, string>).authorization, `Bearer ${ID_TOKEN}`);
  for (const goi of cacGoi) assert.equal(goi.init?.method, "POST");
  assert.equal(soTake(), 2, "mỗi lời một rateLimit.take()");
});

test("2511-s02 doiToken: 401 ở lời đầu → LoiXacThuc, KHÔNG gửi lời hai, thông điệp không chứa refresh token", async () => {
  let daGoi = 0;
  const { doi } = cuaThu(fetchGia(async () => {
    daGoi++;
    return json(401, { error: "invalid_grant" })();
  }));
  await assert.rejects(doiToken(RT, doi), (e: unknown) => e instanceof LoiXacThuc && /401/.test((e as Error).message) && !(e as Error).message.includes(RT));
  assert.equal(daGoi, 1);
});

test("2511-s02 doiToken: 403 phản hồi JSON (không phải thử thách) → LoiXacThuc", async () => {
  const { doi } = cuaThu(fetchGia(json(403, { error: "forbidden" })));
  await assert.rejects(doiToken(RT, doi), LoiXacThuc);
});

test("2511-s02 doiToken: 429 → LoiBiChan, dừng ngay sau một lời, không thử lại", async () => {
  let daGoi = 0;
  const { doi, soTake } = cuaThu(fetchGia(async () => {
    daGoi++;
    return json(429, { error: "too_many" })();
  }));
  await assert.rejects(doiToken(RT, doi), LoiBiChan);
  assert.equal(daGoi, 1, "bị chặn thì không gửi thêm lời nào");
  assert.equal(soTake(), 1);
});

test("2511-s02 doiToken: trang thử thách ở lời hai (403 + cf-mitigated: challenge, HTML) → LoiBiChan", async () => {
  const { doi } = cuaThu(fetchGia((goi) => (goi.url.endsWith("/v1/fetch_id_token") ? json(200, { id_token: ID_TOKEN })() : html(403, { "cf-mitigated": "challenge" })())));
  await assert.rejects(doiToken(RT, doi), LoiBiChan);
});

test("2511-s02 doiToken: phản hồi HTML ở lời một (dù là 5xx) → coi là bị chặn, KHÔNG thử lại", async () => {
  let daGoi = 0;
  const { doi } = cuaThu(fetchGia(async () => {
    daGoi++;
    return html(503)();
  }));
  await assert.rejects(doiToken(RT, doi), LoiBiChan);
  assert.equal(daGoi, 1);
});

test("2511-s02 doiToken: 200 nhưng thân thiếu id_token → LoiXacThuc và KHÔNG gửi lời hai (ứng dụng coi là đã đăng xuất)", async () => {
  let daGoi = 0;
  const { doi, soTake } = cuaThu(fetchGia(async () => {
    daGoi++;
    return json(200, { error: "no_token" })();
  }));
  await assert.rejects(doiToken(RT, doi), LoiXacThuc);
  assert.equal(daGoi, 1, "không có id_token thì không có gì để gửi lời hai");
  assert.equal(soTake(), 1);
});

test("2511-s02 doiToken: lỗi mạng MỘT lần rồi thành công → thử lại được; mỗi lần thử một take()", async () => {
  const { doi, soTake } = cuaThu(fetchGia(async (goi, lan) => {
    if (goi.url.endsWith("/v1/fetch_id_token") && lan === 0) throw new TypeError("fetch failed");
    return goi.url.endsWith("/v1/fetch_id_token") ? json(200, { id_token: ID_TOKEN })() : json(200, { token: APP_TOKEN })();
  }));
  assert.equal((await doiToken(RT, doi)).appToken, APP_TOKEN);
  assert.equal(soTake(), 3, "lời đầu hai lần + lời hai một lần");
});

test("2511-s02 doiToken: 500 hai lần rồi 200 → thử lại được, không tính là lỗi xác thực", async () => {
  const { doi } = cuaThu(fetchGia(async (goi, lan) => (goi.url.endsWith("/v1/fetch_id_token") && lan < 2 ? json(500, {})() : json(200, { id_token: ID_TOKEN, token: APP_TOKEN })())));
  assert.equal((await doiToken(RT, doi)).appToken, APP_TOKEN);
});

test("2511-s02 doiToken: lỗi mạng hết ba lần → ném lỗi THƯỜNG (tạm thời, không phải xác thực), đúng ba lời", async () => {
  let daGoi = 0;
  const { doi, soTake } = cuaThu(fetchGia(async () => {
    daGoi++;
    throw new TypeError("fetch failed");
  }));
  await assert.rejects(doiToken(RT, doi), (e: unknown) => !(e instanceof LoiXacThuc) && !(e instanceof LoiBiChan) && /fetch failed/.test((e as Error).message));
  assert.equal(daGoi, 3);
  assert.equal(soTake(), 3);
});

test("2511-s02 doiToken: nguồn XOAY refresh token → trả refresh token mới để dùng tiếp trong lượt", async () => {
  const rtMoi = "refresh-moi-gia-cho-test-0123456789abcdef";
  const { doi } = cuaThu(fetchGia((goi) => json(200, goi.url.endsWith("/v1/fetch_id_token") ? { id_token: ID_TOKEN, refresh_token: rtMoi } : { token: APP_TOKEN })()));
  const kq = await doiToken(RT, doi);
  assert.equal(kq.refreshToken, rtMoi);
  assert.equal(kq.appToken, APP_TOKEN);
});

test("2511-s02 doiToken: refresh token rỗng → LoiXacThuc ngay, không gọi mạng", async () => {
  let daGoi = 0;
  const { doi, soTake } = cuaThu(fetchGia(async () => {
    daGoi++;
    return json(200, {})();
  }));
  await assert.rejects(doiToken("", doi), LoiXacThuc);
  assert.equal(daGoi, 0);
  assert.equal(soTake(), 0);
});

test("2511-s02 doiToken: mỗi lời có thời gian chờ (AbortSignal) — nguồn treo không treo lượt", async () => {
  const tinHieu: unknown[] = [];
  const { doi } = cuaThu(fetchGia(async (goi) => {
    tinHieu.push(goi.init?.signal);
    return json(200, { id_token: ID_TOKEN, token: APP_TOKEN })();
  }));
  await doiToken(RT, doi);
  assert.equal(tinHieu.length, 2);
  for (const s of tinHieu) assert.ok(s instanceof AbortSignal, "mỗi lời phải mang AbortSignal");
});
