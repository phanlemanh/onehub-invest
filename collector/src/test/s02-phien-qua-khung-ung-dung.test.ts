// s02-phien-qua-khung-ung-dung.test.ts — 2511-s02: ỨNG DỤNG TỰ CẤP LẠI PHIÊN, bộ thu chỉ ĐỌC token còn hạn.
// (Bối cảnh 24/11–25/11: mở route dữ liệu /data/vn bị trang thử thách chặn — ứng dụng không tải, token 15 phút
// không được cấp lại, AUTH FAIL mỗi đêm. Mọi đường dẫn không phải tệp tĩnh trả bộ khung SPA (404) mà không qua
// thử thách; ứng dụng tự gọi fetch_id_token → fetch_app_token rồi ghi token mới vào localStorage.auth.)
// 2511-s02b: vòng sửa sau review độc lập — lệnh login rơi sang nhánh thu; ép làm mới trả lại đúng token bị
// từ chối; lỗi thường từ bước nạp lọt qua lớp dừng cả lượt; tín hiệu «ứng dụng có nạp được khung không».
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  DUONG_MO_UNG_DUNG,
  LE_HAN_TOKEN_MS,
  LoiXacThuc,
  argsMoChromeDangNhap,
  airdnaResearch,
  call,
  chanDoanKhongCoToken,
  chanDoanKhongMoDuocProfile,
  chuoiAppToken,
  dungLaiToken,
  duDungKhong,
  duongChrome,
  phienTu,
  thuDuongKe,
  thuDuongUngVien,
  thuMucProfile,
  type KetQuaMo,
  type MoMotDuong,
} from "../collectors/airdna-research.js";

const jwt = (payload: object) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.chuky`;
const giay = (ms: number) => Math.floor(ms / 1000);
const NOW = Date.parse("2027-06-15T00:00:00Z"); // mốc cố định — hạn tính theo now truyền vào, không ghim năm
/** Kết quả quan sát của một đường dẫn — mẫu gọn cho các ca dưới. */
const kq = (duong: string, xacThuc: number[] = [], khungNap = false): KetQuaMo => ({ duong, xacThuc, khungNap });

// ---- duDungKhong: token đủ để dùng ngay bây giờ — còn hạn quá LỀ (hết hạn/rác → false)
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

// ---- dungLaiToken: có dùng lại token đang giữ không
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

// ---- chanDoanKhongCoToken: mọi đường dẫn đều không cho token — nói ĐÚNG nguyên nhân
test("2511-s02 chanDoan: ứng dụng tự cấp lại bị 401 → BỊ TỪ CHỐI + chỉ đúng lệnh đăng nhập", () => {
  const loi = chanDoanKhongCoToken([kq("/favicon.ico", [401], true)]);
  assert.match(loi, /BỊ TỪ CHỐI/);
  assert.match(loi, /login --source /, "phải chỉ lệnh đăng nhập vào ĐÚNG profile");
});

test("2511-s02 chanDoan: bị 403 ở một đường dẫn, đường khác không gọi xác thực → vẫn là bị từ chối phiên", () => {
  const loi = chanDoanKhongCoToken([kq("/a", [403], true), kq("/b")]);
  assert.match(loi, /BỊ TỪ CHỐI/);
});

test("2511-s02 chanDoan: ứng dụng chạy (có lời gọi xác thực 200) nhưng không cấp token → nói vậy, không đổ cho phiên", () => {
  const loi = chanDoanKhongCoToken([kq("/favicon.ico", [200, 200], true)]);
  assert.match(loi, /ứng dụng chạy nhưng không cấp/);
  assert.doesNotMatch(loi, /BỊ TỪ CHỐI/);
});

test("2511-s02 chanDoan: khung không nạp được ở hai đường dẫn → KHÔNG nạp được khung, liệt kê đường dẫn, chỉ lệnh đăng nhập", () => {
  const loi = chanDoanKhongCoToken([kq("/favicon.ico"), kq("/data/vn")]);
  assert.match(loi, /KHÔNG nạp được khung/);
  assert.match(loi, /\/favicon\.ico, \/data\/vn/, "liệt kê các đường dẫn đã thử");
  assert.match(loi, /login --source /, "nguồn chặn hay profile chưa từng đăng nhập cũng phải chỉ lệnh đăng nhập");
});

test("2511-s02 chanDoan: không quan sát được gì → cũng là KHÔNG nạp được khung (không ném)", () => {
  assert.match(chanDoanKhongCoToken([]), /KHÔNG nạp được khung/);
});

// ---- thuDuongKe: sau một đường dẫn không có token, có đáng thử đường kế không
test("2511-s02 thuDuongKe: khung KHÔNG nạp được ở đường dẫn này (thử thách) → thử đường kế", () => {
  assert.equal(thuDuongKe(kq("/favicon.ico")), true);
});

test("2511-s02 thuDuongKe: ứng dụng đã phản hồi (bất kỳ mã xác thực nào) mà không có token → DỪNG, không thử đường khác", () => {
  for (const xs of [[200], [401], [403], [500], [200, 401]]) {
    assert.equal(thuDuongKe(kq("/x", xs)), false, `xacThuc=${JSON.stringify(xs)}`);
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
function ctxThu(getToken: () => string, refreshToken: () => Promise<void>) {
  const dong: string[] = [];
  return {
    ctx: { rateLimit: { take: async () => {} }, log: (...a: unknown[]) => void dong.push(a.join(" ")), failed: 0, getToken, refreshToken },
    dong,
  };
}
type CtxThu = ReturnType<typeof ctxThu>["ctx"];
const fetchGia = (xuLy: (url: string, init?: RequestInit) => Promise<Response>): typeof fetch =>
  xuLy as unknown as typeof fetch;
const conHan = (uid = "1") => jwt({ uid, exp: giay(Date.now() + 600_000) });
const sapHet = () => jwt({ uid: "1", exp: giay(Date.now() + 5_000) });
const guiJson = (trangThai: number, than: unknown) => async () =>
  new Response(JSON.stringify(than), { status: trangThai, headers: { "content-type": "application/json" } });

test("2511-s02 call: làm mới token mà phiên chết → NÉM LoiXacThuc (dừng cả lượt), không nuốt thành một lời gọi lỗi", async () => {
  let daGoi = 0;
  const { ctx } = ctxThu(sapHet, async () => {
    throw new LoiXacThuc(new Error("phiên đăng nhập đã hết"));
  });
  await assert.rejects(
    call("GET", "/v1/market/1", null, ctx, fetchGia(async () => { daGoi++; return new Response(null, { status: 200 }); })),
    LoiXacThuc,
  );
  assert.equal(daGoi, 0, "không gọi API nào khi không có token dùng được");
  assert.equal(ctx.failed, 0, "đây không phải MỘT lời gọi lỗi — là cả lượt dừng");
});

test("2511-s02 call: lỗi thường (HTTP 500) → trả null, tính một lời gọi lỗi — KHÔNG dừng cả lượt", async () => {
  const { ctx } = ctxThu(conHan, async () => {});
  assert.equal(await call("GET", "/v1/market/1", null, ctx, fetchGia(async () => new Response(null, { status: 500 }))), null);
  assert.equal(ctx.failed, 1);
});

test("2511-s02 call: token sắp hết hạn → làm mới TRƯỚC khi gọi, API nhận token mới", async () => {
  let hienTai = sapHet();
  let nLamMoi = 0;
  let authNhanDuoc = "";
  const { ctx } = ctxThu(
    () => hienTai,
    async () => {
      nLamMoi++;
      hienTai = conHan();
    },
  );
  const kqCall = await call("GET", "/v1/market/1", null, ctx, fetchGia(async (_url, init) => {
    authNhanDuoc = String((init?.headers as Record<string, string>).authorization);
    return guiJson(200, { payload: { id: 1 } })();
  }));
  assert.equal(nLamMoi, 1, "làm mới đúng một lần trước lời gọi");
  assert.equal(authNhanDuoc, `Bearer ${hienTai}`, "API nhận token MỚI");
  assert.equal(kqCall?.kind, "airdna-v2");
  assert.equal(ctx.failed, 0);
});

test("2511-s02 call: token còn hạn → không làm mới thừa", async () => {
  const { ctx } = ctxThu(conHan, async () => {
    throw new Error("không được gọi làm mới khi token còn hạn");
  });
  const kqCall = await call("GET", "/v1/market/1", null, ctx, fetchGia(guiJson(200, { payload: { id: 1 } })));
  assert.equal(kqCall?.kind, "airdna-v2");
  assert.equal(ctx.failed, 0);
});

// ================= Vòng sửa sau review độc lập 25/11 (2511-s02b) =================

// ---- P0: lệnh login phải DỪNG sau khi mở cửa sổ — đo đen-trắng qua CLI thật, Chrome thay bằng /usr/bin/true
const CLI = fileURLToPath(new URL("../cli.js", import.meta.url));
function chayCli(args: string[], env: Record<string, string>) {
  return spawnSync(process.execPath, [CLI, ...args], {
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 30_000,
  });
}

test("2511-s02b duongChrome: AIRDNA_CHROME_BIN thắng; thiếu hoặc rỗng thì dùng Chrome ổn định của macOS", () => {
  assert.equal(duongChrome({ AIRDNA_CHROME_BIN: "/x/chrome" }, "/mac-dinh"), "/x/chrome");
  assert.equal(duongChrome({}, "/mac-dinh"), "/mac-dinh");
  assert.equal(duongChrome({ AIRDNA_CHROME_BIN: "" }, "/mac-dinh"), "/mac-dinh");
});

test("2511-s02b lệnh login: mở đúng profile rồi DỪNG — thoát 0, in hướng dẫn, không in Usage, không rơi sang nhánh thu", () => {
  const tmp = mkdtempSync(join(tmpdir(), "s02-login-"));
  try {
    const r = chayCli(["login", "--source", "airdna-research"], { AIRDNA_CHROME_BIN: "/usr/bin/true", AIRDNA_PROFILE_DIR: `${tmp}/` });
    assert.equal(r.status, 0, `stdout=${r.stdout}\nstderr=${r.stderr}`);
    assert.match(r.stdout, /profile bộ thu/, "phải in hướng dẫn đăng nhập");
    assert.doesNotMatch(r.stdout, /one-invest-collector|Usage:/, "không được in Usage");
    assert.doesNotMatch(`${r.stdout}${r.stderr}`, /\] (start|skip|done|FAILED|token OK)/, "không được chạy bộ thu");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("2511-s02b lệnh login: không mở được Chrome → báo lỗi ra stderr, thoát 1, không in Usage", () => {
  const r = chayCli(["login", "--source", "airdna-research"], { AIRDNA_CHROME_BIN: "/khong-ton-at/chrome", AIRDNA_PROFILE_DIR: "/tmp/khong-dung/" });
  assert.equal(r.status, 1, `stdout=${r.stdout}\nstderr=${r.stderr}`);
  assert.ok(r.stderr.length > 0, "phải nói lý do");
  assert.doesNotMatch(r.stdout, /one-invest-collector|Usage:/, "đây là lỗi chạy, không phải lỗi cú pháp lệnh");
});

// ---- P1/P2: xếp đường dẫn (thử đến đâu thì dừng), tách khỏi trình duyệt để đo được hành vi
test("2511-s02b xếp đường: đường đầu có token → dừng, không nạp đường kế", async () => {
  const daNap: string[] = [];
  const { token, ketQua } = await thuDuongUngVien(async (duong, k) => {
    daNap.push(duong);
    k.khungNap = true;
    return "tok-moi";
  });
  assert.equal(token, "tok-moi");
  assert.deepEqual(daNap, ["/favicon.ico"]);
  assert.deepEqual(ketQua.map((x) => x.duong), ["/favicon.ico"]);
});

test("2511-s02b xếp đường: đường đầu bị thử thách (khung không nạp) → thử đường kế", async () => {
  const { token, ketQua } = await thuDuongUngVien(async (duong, k) => {
    if (duong === "/favicon.ico") return "";
    k.khungNap = true;
    return "tok-moi";
  });
  assert.equal(token, "tok-moi");
  assert.deepEqual(ketQua.map((x) => x.duong), ["/favicon.ico", "/robots.txt"]);
});

test("2511-s02b xếp đường: khung nạp được rồi mà không có token → DỪNG, không nạp đường khác (kể cả route dữ liệu)", async () => {
  const daNap: string[] = [];
  const { token } = await thuDuongUngVien(async (duong, k) => {
    daNap.push(duong);
    k.khungNap = true;
    return "";
  });
  assert.equal(token, "");
  assert.deepEqual(daNap, ["/favicon.ico"]);
});

test("2511-s02b xếp đường: mọi đường bị thử thách → thử đủ ba rồi dừng", async () => {
  const { token, ketQua } = await thuDuongUngVien(async () => "");
  assert.equal(token, "");
  assert.deepEqual(ketQua.map((x) => x.duong), ["/favicon.ico", "/robots.txt", "/data/vn"]);
});

test("2511-s02b xếp đường: có token bị từ chối thì đưa nó cho MỌI bước nạp để loại ra", async () => {
  const nhanDuoc: string[] = [];
  await thuDuongUngVien(async (_duong, _k, loaiBo) => {
    nhanDuoc.push(loaiBo);
    return "";
  }, "tok-bi-tu-choi");
  assert.deepEqual(nhanDuoc, DUONG_MO_UNG_DUNG.map(() => "tok-bi-tu-choi"));
});

test("2511-s02b xếp đường: bước nạp trả lại đúng token bị từ chối → coi như không có", async () => {
  const { token } = await thuDuongUngVien(async () => "tok-bi-tu-choi", "tok-bi-tu-choi", 1);
  assert.equal(token, "");
});

// ---- P2#3: mọi lỗi từ bước nạp đều là lỗi dừng cả lượt; P1: không bao giờ trả lại đúng token bị từ chối
const logThu = () => {
  const dong: string[] = [];
  return { log: (...a: unknown[]) => void dong.push(a.join(" ")), dong };
};

test("2511-s02b phienTu: không có token → ném LoiXacThuc sau đúng MỘT dòng AUTH FAIL [S02], kèm chẩn đoán", async () => {
  const { log, dong } = logThu();
  const p = phienTu(async () => "", log);
  await assert.rejects(p.token(), (e: unknown) => e instanceof LoiXacThuc && /KHÔNG nạp được khung/.test((e as Error).message));
  assert.equal(dong.filter((d) => d.includes("AUTH FAIL [S02]")).length, 1);
});

test("2511-s02b phienTu: bước nạp ném lỗi THƯỜNG → vẫn dừng cả lượt bằng LoiXacThuc, đúng một dòng AUTH FAIL", async () => {
  const { log, dong } = logThu();
  const p = phienTu(async () => {
    throw new TypeError("lỗi đọc ngoài dự kiến");
  }, log);
  await assert.rejects(p.token(), (e: unknown) => e instanceof LoiXacThuc && /lỗi đọc ngoài dự kiến/.test((e as Error).message));
  assert.equal(dong.filter((d) => d.includes("AUTH FAIL [S02]")).length, 1);
});

test("2511-s02b phienTu: có token → trả token, in một dòng 'token OK', không AUTH FAIL", async () => {
  const { log, dong } = logThu();
  const tok = conHan("a");
  assert.equal(await phienTu(async () => tok, log).token(), tok);
  assert.equal(dong.length, 1);
  assert.match(dong[0], /token OK/);
});

test("2511-s02b phienTu: sau 401 (ép làm mới) chỉ nạp MỘT đường dẫn và đưa đúng token bị từ chối để loại ra", async () => {
  const { log } = logThu();
  const tokCu = conHan("a");
  const daNap: string[] = [];
  const loaiBoDuoc: string[] = [];
  const mo: MoMotDuong = async (duong, _k, loaiBo) => {
    if (loaiBo) {
      daNap.push(duong);
      loaiBoDuoc.push(loaiBo);
    }
    return tokCu;
  };
  const p = phienTu(mo, log);
  assert.equal(await p.token(), tokCu);
  await assert.rejects(p.token(true), LoiXacThuc); // bước nạp cứ trả lại đúng token cũ
  assert.deepEqual(daNap, ["/favicon.ico"], "đã có token là ứng dụng nạp được rồi — không thử đường khác");
  assert.deepEqual(loaiBoDuoc, [tokCu]);
});

test("2511-s02b phienTu: ép làm mới mà nhận được token KHÁC → trả token mới", async () => {
  const { log } = logThu();
  const tokCu = conHan("a");
  const tokMoi = conHan("b");
  let n = 0;
  const p = phienTu(async () => (++n === 1 ? tokCu : tokMoi), log);
  assert.equal(await p.token(), tokCu);
  assert.equal(await p.token(true), tokMoi);
});

test("2511-s02b chuoiAppToken: chỉ nhận chuỗi — thiếu, số, đối tượng → rỗng (TypeError không lọt ra khỏi bước đọc)", () => {
  assert.equal(chuoiAppToken({ appToken: "abc" }), "abc");
  assert.equal(chuoiAppToken({}), "");
  assert.equal(chuoiAppToken({ appToken: 123 }), "");
  assert.equal(chuoiAppToken({ appToken: { a: 1 } }), "");
  assert.equal(chuoiAppToken(null), "");
});

test("2511-s02b LoiXacThuc: giữ nguyên nhân gốc ở cause", () => {
  const goc = new TypeError("x");
  const e = new LoiXacThuc(goc);
  assert.equal(e.cause, goc);
  assert.equal(e.message, "x");
});

test("2511-s02b không mở được profile: nói rõ khả năng còn cửa sổ Chrome (lệnh login) và việc phải làm, giữ chi tiết gốc", () => {
  const s = chanDoanKhongMoDuocProfile(new Error("Failed to create a Chrome process"), ".airdna-profile");
  assert.match(s, /không mở được profile \.airdna-profile/);
  assert.match(s, /cửa sổ Chrome nào còn mở/);
  assert.match(s, /login --source /);
  assert.match(s, /Failed to create a Chrome process/, "không nuốt chi tiết gốc");
});

test("2511-s02b call: 401 một lần, làm mới cho token KHÁC → gửi lại bằng token mới và thành công", async () => {
  const tokA = conHan("a");
  const tokB = conHan("b");
  let hienTai = tokA;
  const authDaGui: string[] = [];
  const { ctx } = ctxThu(
    () => hienTai,
    async () => {
      hienTai = tokB;
    },
  );
  const kqCall = await call("GET", "/v1/market/1", null, ctx, fetchGia(async (_url, init) => {
    authDaGui.push(String((init?.headers as Record<string, string>).authorization));
    return authDaGui.length === 1 ? new Response(null, { status: 401 }) : guiJson(200, { payload: { id: 1 } })();
  }));
  assert.ok(kqCall, "lời thử lại phải thành công");
  assert.deepEqual(authDaGui, [`Bearer ${tokA}`, `Bearer ${tokB}`]);
  assert.equal(ctx.failed, 0);
});

test("2511-s02b call: 401 mà làm mới KHÔNG đổi token → không gửi lại, ném LoiXacThuc sau đúng MỘT dòng AUTH FAIL [S02]", async () => {
  let daGui = 0;
  const { ctx, dong } = ctxThu(conHan, async () => {});
  await assert.rejects(
    call("GET", "/v1/market/1", null, ctx, fetchGia(async () => {
      daGui++;
      return new Response(null, { status: 401 });
    })),
    LoiXacThuc,
  );
  assert.equal(daGui, 1, "không gửi lại bằng đúng token vừa bị từ chối");
  assert.equal(dong.filter((d) => d.includes("AUTH FAIL [S02]")).length, 1);
});
