// s02-phien-qua-khung-ung-dung.test.ts — 2511-s02: ỨNG DỤNG TỰ CẤP LẠI PHIÊN, bộ thu chỉ ĐỌC token còn hạn.
// (Bối cảnh 24/11–25/11: mở route dữ liệu /data/vn bị trang thử thách chặn — ứng dụng không tải, token 15 phút
// không được cấp lại, AUTH FAIL mỗi đêm. Mọi đường dẫn không phải tệp tĩnh trả bộ khung SPA (404) mà không qua
// thử thách; ứng dụng tự gọi fetch_id_token → fetch_app_token rồi ghi token mới vào localStorage.auth.)
import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  DUONG_MO_UNG_DUNG,
  LE_HAN_TOKEN_MS,
  LoiXacThuc,
  argsMoChromeDangNhap,
  airdnaResearch,
  call,
  chanDoanKhongCoToken,
  dungLaiToken,
  duDungKhong,
  thuDuongKe,
  thuMucProfile,
} from "../collectors/airdna-research.js";

const jwt = (payload: object) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.chuky`;
const giay = (ms: number) => Math.floor(ms / 1000);
const NOW = Date.parse("2027-06-15T00:00:00Z"); // mốc cố định — hạn tính theo now truyền vào, không ghim năm

// ---- duDungKhong: token đủ để dùng = còn hạn hơn LỀ (đọc xong phải kịp gọi API)
test("2511-s02 duDungKhong: còn hạn hơn lề → DÙNG được", () => {
  assert.equal(duDungKhong(jwt({ uid: "1", exp: giay(NOW + LE_HAN_TOKEN_MS + 5_000) }), NOW), true);
});

test("2511-s02 duDungKhong: sắp hết hạn (dưới lề) → KHÔNG dùng — không trả token vừa đọc xong đã chết", () => {
  assert.equal(duDungKhong(jwt({ uid: "1", exp: giay(NOW + LE_HAN_TOKEN_MS - 10_000) }), NOW), false);
});

test("2511-s02 duDungKhong: đã hết hạn / rỗng / rác → KHÔNG dùng", () => {
  assert.equal(duDungKhong(jwt({ uid: "1", exp: giay(NOW - 1) }), NOW), false);
  assert.equal(duDungKhong("", NOW), false);
  assert.equal(duDungKhong("khong-phai-jwt", NOW), false);
});

// ---- dungLaiToken: có dùng lại token đang giữ không, hay phải mở lại ứng dụng
test("2511-s02 dungLaiToken: token đang giữ còn hạn, không ép → dùng lại (không mở lại ứng dụng)", () => {
  const conHan = jwt({ uid: "1", exp: giay(NOW + 10 * 60_000) });
  assert.equal(dungLaiToken(conHan, false, NOW), true);
});

test("2511-s02 dungLaiToken: vừa bị 401 (ép làm mới) → KHÔNG dùng lại dù token trông còn hạn", () => {
  const conHan = jwt({ uid: "1", exp: giay(NOW + 10 * 60_000) });
  assert.equal(dungLaiToken(conHan, true, NOW), false);
});

test("2511-s02 dungLaiToken: token đang giữ đã hết hạn hoặc rỗng → KHÔNG dùng lại", () => {
  assert.equal(dungLaiToken(jwt({ uid: "1", exp: giay(NOW - 1) }), false, NOW), false);
  assert.equal(dungLaiToken("", false, NOW), false);
});

// ---- chanDoanKhongCoToken: sau khi mọi đường dẫn đều không cho token — nói ĐÚNG nguyên nhân
test("2511-s02 chanDoan: ứng dụng tự cấp lại bị 401 → PHIÊN ĐÃ HẾT + chỉ đúng lệnh đăng nhập", () => {
  const loi = chanDoanKhongCoToken([{ duong: "/favicon.ico", xacThuc: [401] }]);
  assert.match(loi, /phiên đăng nhập ĐÃ HẾT/);
  assert.match(loi, /login --source airdna-research/, "phải chỉ lệnh đăng nhập vào ĐÚNG profile");
});

test("2511-s02 chanDoan: bị 403 ở một đường dẫn, đường khác không gọi xác thực → vẫn là bị từ chối phiên", () => {
  const loi = chanDoanKhongCoToken([
    { duong: "/a", xacThuc: [403] },
    { duong: "/b", xacThuc: [] },
  ]);
  assert.match(loi, /ĐÃ HẾT/);
});

test("2511-s02 chanDoan: ứng dụng chạy (có lời gọi xác thực 200) nhưng không cấp token → nói vậy, không đổ cho phiên", () => {
  const loi = chanDoanKhongCoToken([{ duong: "/favicon.ico", xacThuc: [200, 200] }]);
  assert.match(loi, /ứng dụng chạy nhưng không cấp/);
  assert.doesNotMatch(loi, /ĐÃ HẾT/);
});

test("2511-s02 chanDoan: không thấy lời gọi xác thực nào ở mọi đường dẫn → ứng dụng KHÔNG khởi động", () => {
  const loi = chanDoanKhongCoToken([
    { duong: "/favicon.ico", xacThuc: [] },
    { duong: "/data/vn", xacThuc: [] },
  ]);
  assert.match(loi, /KHÔNG khởi động/);
  assert.match(loi, /\/favicon\.ico, \/data\/vn/, "liệt kê các đường dẫn đã thử");
  assert.match(loi, /login --source airdna-research/, "profile chưa từng đăng nhập cũng ra y hệt — vẫn phải chỉ lệnh đăng nhập");
});

test("2511-s02 chanDoan: không quan sát được gì → cũng là KHÔNG khởi động (không ném)", () => {
  assert.match(chanDoanKhongCoToken([]), /KHÔNG khởi động/);
});

// ---- thuDuongKe: sau một đường dẫn không có token, có đáng thử đường kế không
test("2511-s02 thuDuongKe: ứng dụng KHÔNG khởi động ở đường dẫn này → thử đường kế", () => {
  assert.equal(thuDuongKe({ duong: "/favicon.ico", xacThuc: [] }), true);
});

test("2511-s02 thuDuongKe: ứng dụng đã chạy (có phản hồi xác thực, bất kỳ mã nào) mà không có token → DỪNG, không thử đường khác", () => {
  for (const xs of [[200], [401], [403], [500], [200, 401]]) {
    assert.equal(thuDuongKe({ duong: "/x", xacThuc: xs }), false, `xacThuc=${JSON.stringify(xs)}`);
  }
});

// ---- DUONG_MO_UNG_DUNG: thứ tự ứng viên
test("2511-s02 DUONG_MO: route dữ liệu (bị thử thách) đứng CUỐI, không trùng, đều là đường dẫn tương đối", () => {
  assert.equal(DUONG_MO_UNG_DUNG.at(-1), "/data/vn", "/data/vn chỉ là phương án cuối");
  assert.equal(new Set(DUONG_MO_UNG_DUNG).size, DUONG_MO_UNG_DUNG.length, "không đường dẫn lặp");
  for (const d of DUONG_MO_UNG_DUNG) assert.match(d, /^\/[\w./-]*$/, `đường dẫn tương đối hợp lệ: ${d}`);
});

// ---- lệnh đăng nhập: vào ĐÚNG profile bộ thu, bằng Chrome thường
test("2511-s02 argsMoChromeDangNhap: mở Chrome THƯỜNG với ĐÚNG profile bộ thu, không cờ tự động hoá", () => {
  const args = argsMoChromeDangNhap("/tmp/profile-thu");
  assert.ok(args.includes("--user-data-dir=/tmp/profile-thu"), "phải trỏ đúng thư mục profile");
  const url = String(args.at(-1));
  assert.match(url, /^https:\/\/[\w.-]+\/data\/vn$/, "mở đúng route dữ liệu của ứng dụng");
  for (const a of args) {
    assert.doesNotMatch(a, /enable-automation|remote-debugging|headless|AutomationControlled/, `cờ tự động hoá lọt vào: ${a}`);
  }
});

test("2511-s02 bộ thu có lệnh login — CLI tìm được để Mạnh đăng nhập vào ĐÚNG profile", () => {
  assert.equal(typeof airdnaResearch.login, "function");
});

// ---- profile: nằm ngoài kho mà không cần symlink (ROADMAP mục 60: gom profile về một gốc ngoài kho)
test("2511-s02 thuMucProfile: AIRDNA_PROFILE_DIR thắng; thiếu hoặc rỗng thì dùng mặc định", () => {
  assert.equal(thuMucProfile({ AIRDNA_PROFILE_DIR: "/ngoai-kho/profile/" }, "/mac-dinh/"), "/ngoai-kho/profile/");
  assert.equal(thuMucProfile({}, "/mac-dinh/"), "/mac-dinh/");
  assert.equal(thuMucProfile({ AIRDNA_PROFILE_DIR: "" }, "/mac-dinh/"), "/mac-dinh/");
});

// ---- call(): lỗi xác thực phải DỪNG CẢ LƯỢT; token sắp hết hạn thì làm mới trước khi gọi
type CtxThu = ReturnType<typeof ctxThu>;
function ctxThu(getToken: () => string, refreshToken: () => Promise<void>) {
  return { rateLimit: { take: async () => {} }, log: () => {}, failed: 0, getToken, refreshToken };
}
const fetchGia = (xuLy: (url: string, init?: RequestInit) => Promise<Response>): typeof fetch =>
  xuLy as unknown as typeof fetch;
const conHan = () => jwt({ uid: "1", exp: giay(Date.now() + 600_000) });
const sapHet = () => jwt({ uid: "1", exp: giay(Date.now() + 5_000) });

test("2511-s02 call: làm mới token mà phiên chết → NÉM LoiXacThuc (dừng cả lượt), không nuốt thành một lời gọi lỗi", async () => {
  let daGoi = 0;
  const ctx: CtxThu = ctxThu(sapHet, async () => {
    throw new LoiXacThuc(new Error("phiên đăng nhập ĐÃ HẾT"));
  });
  await assert.rejects(
    call("GET", "/v1/market/1", null, ctx, fetchGia(async () => { daGoi++; return new Response(null, { status: 200 }); })),
    LoiXacThuc,
  );
  assert.equal(daGoi, 0, "không gọi API nào khi không có token dùng được");
  assert.equal(ctx.failed, 0, "đây không phải MỘT lời gọi lỗi — là cả lượt dừng");
});

test("2511-s02 call: lỗi thường (HTTP 500) → trả null, tính một lời gọi lỗi — KHÔNG dừng cả lượt", async () => {
  const ctx: CtxThu = ctxThu(conHan, async () => {});
  assert.equal(await call("GET", "/v1/market/1", null, ctx, fetchGia(async () => new Response(null, { status: 500 }))), null);
  assert.equal(ctx.failed, 1);
});

test("2511-s02 call: token sắp hết hạn → làm mới TRƯỚC khi gọi, API nhận token mới", async () => {
  let hienTai = sapHet();
  let nLamMoi = 0;
  let authNhanDuoc = "";
  const ctx: CtxThu = ctxThu(
    () => hienTai,
    async () => {
      nLamMoi++;
      hienTai = conHan();
    },
  );
  const kq = await call("GET", "/v1/market/1", null, ctx, fetchGia(async (_url, init) => {
    authNhanDuoc = String((init?.headers as Record<string, string>).authorization);
    return new Response(JSON.stringify({ payload: { id: 1 } }), { status: 200, headers: { "content-type": "application/json" } });
  }));
  assert.equal(nLamMoi, 1, "làm mới đúng một lần trước lời gọi");
  assert.equal(authNhanDuoc, `Bearer ${hienTai}`, "API nhận token MỚI");
  assert.equal(kq?.kind, "airdna-v2");
  assert.equal(ctx.failed, 0);
});

test("2511-s02 call: token còn hạn → không làm mới thừa", async () => {
  const ctx: CtxThu = ctxThu(conHan, async () => {
    throw new Error("không được gọi làm mới khi token còn hạn");
  });
  const kq = await call("GET", "/v1/market/1", null, ctx, fetchGia(async () => new Response("{}", { status: 200, headers: { "content-type": "application/json" } })));
  assert.equal(kq?.kind, "airdna-v2");
  assert.equal(ctx.failed, 0);
});
