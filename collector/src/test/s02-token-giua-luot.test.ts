// s02-token-giua-luot.test.ts — claudedp-2411-7(a) (chuyển từ 2011-20): token hết hạn GIỮA lượt phải dừng CẢ LƯỢT.
// Trước fix: trong call(), khối catch chỉ ném lại lỗi có chữ đầu «401 sau refresh token»; lỗi «appToken ĐÃ HẾT HẠN»
// do refreshToken() ném rơi vào ctx.failed++ và BỊ NUỐT → lượt chạy nốt, mỗi lời lại 401, lại mở trình duyệt lấy
// token, lại in AUTH FAIL (báo «xong» với cả chục lỗi). Ca «hai market» dưới đây ĐỎ trên main.
// Chạy lẻ: cd collector && npx tsc -p tsconfig.json && node --test dist/test/s02-token-giua-luot.test.js
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { chromium } from "playwright-core";
import type { BrowserContext } from "playwright-core";

import { LoiXacThuc, kiemAppToken, duyetAppToken, thuMotLuot, airdnaResearch } from "../collectors/airdna-research.js";
import type { CollectContext } from "../core/types.js";

const jwt = (payload: object) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.chuky`;
const tokenConHan = () => jwt({ uid: "1", exp: Math.floor(Date.now() / 1000) + 1_800 });
const tokenHetHan = () => jwt({ uid: "1", exp: Math.floor(Date.now() / 1000) - 3_600 });
const goiApi = () => new Response(JSON.stringify({ data: { payload: {} } }), { status: 200 });
const bi401 = () => new Response("{}", { status: 401 });

type Log = (...a: unknown[]) => void;
type KichBan = { fetch: (url: string) => Response } & (
  | { token: (log: Log, lan: number) => string } // lấy token từ hàm giả — chạy hàm lõi thuMotLuot
  | { trinhDuyet: string[] } // giả đúng MỘT chỗ ngoài máy: mỗi lần mở trình duyệt đọc profile trả token kế tiếp — chạy lối vào THẬT collect()
);

/**
 * Chạy MỘT lượt thu giả: HTTP giả theo kịch bản, không nghỉ. Không mở trình duyệt thật, không gọi mạng thật.
 * Ghi lại số lần lấy token (số lần mở trình duyệt ở kịch bản trinhDuyet) để đo «không mở thêm lần nào».
 */
async function chayLuot(markets: string, kichBan: KichBan) {
  const tuMay = "token" in kichBan ? kichBan : null;
  const tuTrinh = "trinhDuyet" in kichBan ? kichBan : null;
  const urlDaGoi: string[] = [];
  const dong: unknown[][] = [];
  let lanLayToken = 0;
  const fetchGoc = globalThis.fetch;
  const moTrinhGoc = chromium.launchPersistentContext;
  const envGoc = ["AIRDNA_MARKETS", "AIRDNA_SUB_LIMIT", "AIRDNA_SUB_LISTINGS"].map((k) => [k, process.env[k]] as const);
  process.env.AIRDNA_MARKETS = markets;
  process.env.AIRDNA_SUB_LIMIT = "0";
  process.env.AIRDNA_SUB_LISTINGS = "0";
  globalThis.fetch = (async (url: string | URL | Request) => {
    const u = String(url);
    urlDaGoi.push(u);
    return kichBan.fetch(u);
  }) as typeof fetch;
  if (tuTrinh) {
    const ds = tuTrinh.trinhDuyet;
    chromium.launchPersistentContext = (async () => {
      // lần mở sau cuối lấy phần tử cuối: profile thật luôn đọc ra cùng một token cũ
      const token = ds[Math.min(lanLayToken, ds.length - 1)];
      lanLayToken++;
      const page = { goto: async () => null, waitForTimeout: async () => {}, evaluate: async () => token };
      return { newPage: async () => page, close: async () => {} } as unknown as BrowserContext;
    }) as typeof chromium.launchPersistentContext;
  }
  const ctx: CollectContext = {
    city: { id: "vn", name: "Việt Nam", country: "vn", center: [105, 21] },
    checkpoint: { get: () => undefined, set: () => {}, save: async () => {} },
    rateLimit: { take: async () => {} },
    log: (...a: unknown[]) => dong.push(a),
    paths: { snapshotRoot: "", stateDir: "" },
  };
  try {
    let kq: Awaited<ReturnType<typeof thuMotLuot>> | null = null;
    let loi: unknown = null;
    try {
      kq = tuTrinh
        ? await airdnaResearch.collect(ctx)
        : await thuMotLuot(ctx, async (log) => tuMay!.token(log, ++lanLayToken));
    } catch (e) {
      loi = e;
    }
    return {
      kq,
      loi,
      urlDaGoi,
      get lanLayToken() {
        return lanLayToken;
      },
      soAuthFail: dong.filter((d) => String(d[0]).includes("AUTH FAIL [S02]")).length,
      soLoiThuong: dong.filter((d) => String(d[0]).trimStart().startsWith("✗")).length,
    };
  } finally {
    globalThis.fetch = fetchGoc;
    chromium.launchPersistentContext = moTrinhGoc;
    for (const [k, v] of envGoc) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

// Mỗi market có 9 lời ở cấp market (market, score, submarkets, 4 chỉ số, listing_count, map_listings).

test("2411-7 token hết hạn SAU VÀI LỜI, hai market → dừng cả lượt ngay: ném lỗi xác thực, đúng MỘT dòng AUTH FAIL, không gọi tiếp", async () => {
  let loiApi = 0; // lời 1–3 trả 200 (token còn hạn); từ lời 4 API trả 401 (token ~5 phút đã hết)
  const r = await chayLuot("1,2", {
    fetch: () => (++loiApi <= 3 ? goiApi() : bi401()),
    // lần làm mới (lấy thứ 2) ném hết hạn: profile vẫn giữ token cũ đã hết hạn, không tự làm mới
    token: (log, lan) => (lan === 1 ? tokenConHan() : duyetAppToken(log, tokenHetHan())),
  });
  assert.ok(r.loi instanceof LoiXacThuc, `phải ném LỖI XÁC THỰC — thực tế ${String(r.loi)}`);
  assert.match(String((r.loi as Error)?.message), /ĐÃ HẾT HẠN/, "giữ đúng chẩn đoán hết hạn của kiemAppToken");
  assert.equal(r.kq, null, "không có kết quả lượt — không thành bản thu «xong» với cả chục lỗi");
  assert.equal(r.urlDaGoi.length, 4, "đúng 4 lời API: 3 lời được rồi lời 401 — không gọi thêm lời nào");
  assert.equal(r.urlDaGoi.filter((u) => u.includes("/market/2/")).length, 0, "chưa chạm tới market thứ hai");
  assert.equal(r.lanLayToken, 2, "lấy token đúng 2 lần: đầu lượt và một lần làm mới rồi dừng — không mở trình duyệt thêm lần nào");
  assert.equal(r.soAuthFail, 1, "đúng MỘT dòng AUTH FAIL [S02] cho cả lượt");
  assert.equal(r.soLoiThuong, 0, "không có dòng «✗» — lỗi xác thực không bị đếm như lỗi thường");
});

test("2411-7 token hết hạn ngay LỜI ĐẦU (401 → làm mới ném hết hạn) → ném lỗi xác thực, không trả null", async () => {
  const r = await chayLuot("1", {
    fetch: () => bi401(),
    token: (log, lan) => (lan === 1 ? tokenConHan() : duyetAppToken(log, tokenHetHan())),
  });
  assert.ok(r.loi instanceof LoiXacThuc);
  assert.equal(r.urlDaGoi.length, 1);
  assert.equal(r.lanLayToken, 2);
  assert.deepEqual([r.soAuthFail, r.soLoiThuong], [1, 0]);
});

test("2411-7 vẫn 401 cả sau khi làm mới token (token còn hạn) → ném LỖI XÁC THỰC kèm đúng một dòng AUTH FAIL", async () => {
  const r = await chayLuot("1", { fetch: () => bi401(), token: () => tokenConHan() });
  assert.ok(r.loi instanceof LoiXacThuc, "401 sau refresh cũng là lỗi xác thực, không dựa vào chữ đầu thông báo");
  assert.match(String((r.loi as Error)?.message), /^401 sau refresh token/);
  assert.equal(r.urlDaGoi.length, 2, "thử lại đúng một lần rồi dừng");
  assert.equal(r.soAuthFail, 1);
});

test("2411-7 hết hạn TRƯỚC lượt (lần lấy token đầu ném) → dừng trước lời gọi API nào", async () => {
  const r = await chayLuot("1,2", { fetch: () => goiApi(), token: (log) => duyetAppToken(log, tokenHetHan()) });
  assert.ok(r.loi instanceof LoiXacThuc);
  assert.equal(r.urlDaGoi.length, 0, "0 lời gọi API");
  assert.equal(r.lanLayToken, 1);
  assert.deepEqual([r.soAuthFail, r.soLoiThuong], [1, 0]);
});

test("2411-7 lỗi THƯỜNG (mạng, 5xx) vẫn bỏ qua có đếm — lượt không dừng, không có AUTH FAIL", async () => {
  let loiApi = 0;
  const r = await chayLuot("1", { fetch: () => (++loiApi === 1 ? new Response("", { status: 500 }) : goiApi()), token: () => tokenConHan() });
  assert.equal(r.loi, null);
  assert.equal(r.kq?.items.length, 8, "một market = 9 lời, một lời hỏng → 8 bản ghi");
  assert.equal(r.kq?.coverage.failed, 1, "lỗi thường được đếm");
  assert.equal(r.lanLayToken, 1, "lỗi 5xx không làm mới token");
  assert.deepEqual([r.soAuthFail, r.soLoiThuong], [0, 1]);
});

test("2411-7 lỗi xác thực là một LỚP RIÊNG: kiemAppToken ném LoiXacThuc cho cả token rỗng lẫn token hết hạn", () => {
  const now = Date.parse("2027-06-15T00:00:00Z");
  assert.throws(() => kiemAppToken("", now), LoiXacThuc);
  assert.throws(() => kiemAppToken(jwt({ uid: "1", exp: Math.floor(now / 1000) - 60 }), now), LoiXacThuc);
  assert.ok(new LoiXacThuc("x") instanceof Error, "vẫn là Error để scheduler và log đọc được message");
  assert.doesNotThrow(() => kiemAppToken(jwt({ uid: "1", exp: Math.floor(now / 1000) + 60 }), now), "token còn hạn thì không ném");
});

// ---- Lối vào THẬT collect() (qua appToken mở profile): cũng phải ném lỗi xác thực.
// Đột biến bọc collect() bằng try/catch trả lượt rỗng → hai ca dưới đây ĐỎ.
// Trình duyệt là chỗ duy nhất được giả; mọi bước khác (duyetAppToken, call, vòng market) đi đường thật.

test("2411-7 lối vào THẬT collect(): profile giữ token hết hạn → ném lỗi xác thực, không thành lượt rỗng", async () => {
  const r = await chayLuot("1,2", { fetch: () => goiApi(), trinhDuyet: [tokenHetHan()] });
  assert.ok(r.loi instanceof LoiXacThuc, `collect() phải ném lỗi xác thực — thực tế ${String(r.loi)}`);
  assert.equal(r.kq, null, "không trả kết quả lượt");
  assert.equal(r.urlDaGoi.length, 0, "dừng trước lời gọi API nào");
  assert.equal(r.lanLayToken, 1, "mở trình duyệt đúng một lần rồi dừng");
  assert.deepEqual([r.soAuthFail, r.soLoiThuong], [1, 0]);
});

test("2411-7 lối vào THẬT collect(), hai market: hết hạn giữa lượt → dừng sau 4 lời, mở trình duyệt đúng 2 lần, một dòng AUTH FAIL", async () => {
  let loiApi = 0; // lời 1–3 trả 200; từ lời 4 trả 401. Lần mở trình duyệt thứ hai (làm mới) vẫn đọc ra token cũ đã hết hạn
  const r = await chayLuot("1,2", {
    fetch: () => (++loiApi <= 3 ? goiApi() : bi401()),
    trinhDuyet: [tokenConHan(), tokenHetHan()],
  });
  assert.ok(r.loi instanceof LoiXacThuc, `collect() phải ném lỗi xác thực — thực tế ${String(r.loi)}`);
  assert.match(String((r.loi as Error)?.message), /ĐÃ HẾT HẠN/);
  assert.equal(r.urlDaGoi.length, 4);
  assert.equal(r.urlDaGoi.filter((u) => u.includes("/market/2/")).length, 0, "không chạm market thứ hai");
  assert.equal(r.lanLayToken, 2);
  assert.deepEqual([r.soAuthFail, r.soLoiThuong], [1, 0]);
});
