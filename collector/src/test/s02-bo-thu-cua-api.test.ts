// s02-bo-thu-cua-api.test.ts — 2511-s02 (cửa API): trình lấy token của bộ thu, call() đi cửa API, lệnh login.
// Bộ thu MỚI không mở trình duyệt khi thu: đọc phiên trên đĩa (airdna-session.ts), tra đổi lấy appToken, gọi API.
// Bị chặn (403/429/trang thử thách) → dừng cả lượt, không lách. Lỗi xác thực → AUTH FAIL [S02] đúng một dòng.
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  LE_HAN_TOKEN_MS,
  LENH_DANG_NHAP,
  LoiBiChan,
  LoiXacThuc,
  airdnaResearch,
  call,
  chanDoanKhongCoPhien,
  argsMoChromeDangNhap,
  dungLaiToken,
  duDungKhong,
  duongChrome,
  thuMucProfile,
  trinhTokenCuaApi,
} from "../collectors/airdna-research.js";

const jwt = (payload: object) =>
  `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.chuky`;
const giay = (ms: number) => Math.floor(ms / 1000);
const NOW = Date.parse("2027-06-15T00:00:00Z"); // mốc cố định — hạn tính theo now truyền vào, không ghim năm
const conHan = (uid = "1", now = Date.now()) => jwt({ uid, exp: giay(now + 600_000) });
const sapHet = () => jwt({ uid: "1", exp: giay(Date.now() + 5_000) });
const demDong = (dong: string[], mau: string) => dong.filter((d) => d.includes(mau)).length;

// ---- duDungKhong / dungLaiToken: khi nào token đủ dùng, khi nào dùng lại token đang giữ
test("2511-s02 duDungKhong: còn hạn hơn lề → DÙNG được; dưới lề, hết hạn, rỗng → KHÔNG", () => {
  assert.equal(duDungKhong(jwt({ uid: "1", exp: giay(NOW + LE_HAN_TOKEN_MS + 5_000) }), NOW), true);
  assert.equal(duDungKhong(jwt({ uid: "1", exp: giay(NOW + LE_HAN_TOKEN_MS - 10_000) }), NOW), false);
  assert.equal(duDungKhong(jwt({ uid: "1", exp: giay(NOW - 1) }), NOW), false);
  assert.equal(duDungKhong("", NOW), false);
  assert.equal(duDungKhong("khong-phai-jwt", NOW), false);
});

test("2511-s02 dungLaiToken: còn hạn và không ép → dùng lại; vừa bị 401 (ép) hoặc hết hạn → KHÔNG", () => {
  assert.equal(dungLaiToken(conHan("1", NOW), false, NOW), true);
  assert.equal(dungLaiToken(conHan("1", NOW), true, NOW), false, "token trông còn hạn nhưng máy chủ vừa từ chối");
  assert.equal(dungLaiToken(jwt({ uid: "1", exp: giay(NOW - 1) }), false, NOW), false);
  assert.equal(dungLaiToken("", false, NOW), false);
});

// ---- trinhTokenCuaApi: mọi lối ra không có token dùng được đều dừng cả lượt, đúng MỘT dòng AUTH FAIL
const logThu = () => {
  const dong: string[] = [];
  return { log: (...a: unknown[]) => void dong.push(a.join(" ")), dong };
};
const phienGia = () => ({ appToken: "jwt-cu-tren-dia", fusionAuthRefreshToken: "rt-gia-cho-test" });

test("2511-s02 trình token: profile chưa đăng nhập (không có bản ghi) → LoiXacThuc sau đúng MỘT dòng AUTH FAIL [S02], chỉ lệnh đăng nhập", async () => {
  const { log, dong } = logThu();
  let daDoi = 0;
  const t = trinhTokenCuaApi(() => null, async () => {
    daDoi++;
    return { appToken: conHan(), refreshToken: "x" };
  }, log);
  await assert.rejects(t.token(), (e: unknown) => e instanceof LoiXacThuc && /chưa đăng nhập/.test((e as Error).message) && (e as Error).message.includes(LENH_DANG_NHAP));
  assert.equal(demDong(dong, "AUTH FAIL [S02]"), 1);
  assert.equal(daDoi, 0, "không gọi nguồn khi không có phiên");
});

test("2511-s02 trình token: bản ghi có nhưng thiếu refresh token → cũng là chưa đăng nhập, không tra đổi", async () => {
  const { log, dong } = logThu();
  let daDoi = 0;
  const t = trinhTokenCuaApi(() => ({ appToken: "jwt" }), async () => {
    daDoi++;
    return { appToken: conHan(), refreshToken: "x" };
  }, log);
  await assert.rejects(t.token(), LoiXacThuc);
  assert.equal(demDong(dong, "AUTH FAIL [S02]"), 1);
  assert.equal(daDoi, 0);
});

test("2511-s02 trình token: có phiên → tra đổi bằng đúng refresh token trên đĩa, trả appToken, in MỘT dòng 'token OK'", async () => {
  const { log, dong } = logThu();
  const nhan: string[] = [];
  const tok = conHan("a");
  const t = trinhTokenCuaApi(phienGia, async (rt) => {
    nhan.push(rt);
    return { appToken: tok, refreshToken: rt };
  }, log);
  assert.equal(await t.token(), tok);
  assert.deepEqual(nhan, ["rt-gia-cho-test"]);
  assert.equal(dong.length, 1);
  assert.match(dong[0], /token OK \(\d+ chars, hết hạn sau 10 phút\)/);
  assert.equal(demDong(dong, "AUTH FAIL [S02]"), 0);
});

test("2511-s02 trình token: token còn hạn → dùng lại; phiên trên đĩa đọc MỘT lần cho cả lượt", async () => {
  const { log } = logThu();
  let daDoc = 0;
  let daDoi = 0;
  const t = trinhTokenCuaApi(() => (++daDoc, phienGia()), async (rt) => {
    daDoi++;
    return { appToken: conHan(), refreshToken: rt };
  }, log);
  const a = await t.token();
  assert.equal(await t.token(), a);
  assert.equal(await t.token(), a);
  assert.equal(daDoi, 1, "không tra đổi thừa");
  assert.equal(daDoc, 1, "đọc đĩa một lần");
});

test("2511-s02 trình token: sắp hết hạn → tra đổi lại trước khi dùng", async () => {
  const { log } = logThu();
  let soLan = 0;
  const t = trinhTokenCuaApi(phienGia, async (rt) => ({ appToken: ++soLan === 1 ? sapHet() : conHan("b"), refreshToken: rt }), log);
  await t.token();
  assert.equal(soLan, 1);
  await t.token(); // token đang giữ sắp hết hạn → không dùng lại được
  assert.equal(soLan, 2);
});

test("2511-s02 trình token: ép làm mới (sau 401) → không dùng lại token đang giữ dù còn hạn", async () => {
  const { log } = logThu();
  let soLan = 0;
  const t = trinhTokenCuaApi(phienGia, async (rt) => ({ appToken: conHan(String(++soLan)), refreshToken: rt }), log);
  const a = await t.token();
  assert.notEqual(await t.token(true), a);
});

test("2511-s02 trình token: tra đổi bị từ chối (LoiXacThuc 401) → ném lại sau đúng MỘT dòng AUTH FAIL [S02]", async () => {
  const { log, dong } = logThu();
  const t = trinhTokenCuaApi(phienGia, async () => {
    throw new LoiXacThuc(new Error("HTTP 401 ở fetch_id_token — phiên bị từ chối"));
  }, log);
  await assert.rejects(t.token(), (e: unknown) => e instanceof LoiXacThuc && /401/.test((e as Error).message));
  assert.equal(demDong(dong, "AUTH FAIL [S02]"), 1);
});

test("2511-s02 trình token: tra đổi BỊ CHẶN (429) → ném LoiBiChan, in dòng BỊ CHẶN [S02], KHÔNG in AUTH FAIL", async () => {
  const { log, dong } = logThu();
  const t = trinhTokenCuaApi(phienGia, async () => {
    throw new LoiBiChan("BỊ CHẶN ở fetch_id_token (HTTP 429)");
  }, log);
  await assert.rejects(t.token(), LoiBiChan);
  assert.equal(demDong(dong, "BỊ CHẶN [S02]"), 1);
  assert.equal(demDong(dong, "AUTH FAIL [S02]"), 0, "bị chặn không phải lỗi xác thực — không làm thước độ tươi báo đỏ sai");
});

test("2511-s02 trình token: tra đổi lỗi mạng (lỗi thường) → ném lại lỗi đó, dừng lượt, KHÔNG in AUTH FAIL", async () => {
  const { log, dong } = logThu();
  const t = trinhTokenCuaApi(phienGia, async () => {
    throw new Error("fetch_id_token: lỗi mạng sau 3 lần — fetch failed");
  }, log);
  await assert.rejects(t.token(), /lỗi mạng sau 3 lần/);
  assert.equal(demDong(dong, "AUTH FAIL [S02]"), 0, "mạng lag không phải phiên chết");
});

test("2511-s02 trình token: kho trên đĩa hỏng (đọc phiên ném lỗi) → LoiXacThuc sau đúng MỘT dòng AUTH FAIL, giữ chi tiết", async () => {
  const { log, dong } = logThu();
  const t = trinhTokenCuaApi(() => {
    throw new Error("000192.ldb: không đọc được bản ghi phiên — số magic sai");
  }, async () => ({ appToken: conHan(), refreshToken: "x" }), log);
  await assert.rejects(t.token(), (e: unknown) => e instanceof LoiXacThuc && /000192\.ldb/.test((e as Error).message));
  assert.equal(demDong(dong, "AUTH FAIL [S02]"), 1);
});

test("2511-s02 trình token: token vừa tra đổi đã hết hạn hoặc rác → không dùng, AUTH FAIL đúng một dòng", async () => {
  const { log, dong } = logThu();
  const t = trinhTokenCuaApi(phienGia, async (rt) => ({ appToken: jwt({ uid: "1", exp: giay(Date.now() - 1000) }), refreshToken: rt }), log);
  await assert.rejects(t.token(), /ĐÃ HẾT HẠN/);
  assert.equal(demDong(dong, "AUTH FAIL [S02]"), 1);
});

test("2511-s02 trình token: nguồn xoay phiên → lần tra đổi kế dùng refresh token mới", async () => {
  const { log } = logThu();
  const nhan: string[] = [];
  let soLan = 0;
  const t = trinhTokenCuaApi(phienGia, async (rt) => {
    nhan.push(rt);
    return { appToken: conHan(String(++soLan)), refreshToken: soLan === 1 ? "rt-moi" : rt };
  }, log);
  await t.token();
  await t.token(true);
  assert.deepEqual(nhan, ["rt-gia-cho-test", "rt-moi"]);
});

test("2511-s02 chanDoanKhongCoPhien: nói thẳng profile chưa đăng nhập và chỉ đúng lệnh đăng nhập", () => {
  const s = chanDoanKhongCoPhien();
  assert.match(s, /chưa đăng nhập/);
  assert.match(s, /login --source airdna-research/);
});

// ---- call(): một lời API = một rateLimit.take(); lỗi xác thực hoặc bị chặn dừng CẢ LƯỢT
type GoiDi = { url: string; init?: RequestInit };
const fetchGia = (xuLy: (goi: GoiDi, lan: number) => Response | Promise<Response>): typeof fetch => {
  let so = 0;
  return (async (url: string | URL | Request, init?: RequestInit) => xuLy({ url: String(url), init }, so++)) as unknown as typeof fetch;
};
const json = (trangThai: number, than: unknown, headerThem: Record<string, string> = {}) => () =>
  new Response(JSON.stringify(than), { status: trangThai, headers: { "content-type": "application/json", ...headerThem } });
function ctxThu(getToken: () => string, refreshToken: () => Promise<void>) {
  const dong: string[] = [];
  return {
    ctx: { rateLimit: { take: async () => {} }, log: (...a: unknown[]) => void dong.push(a.join(" ")), failed: 0, getToken, refreshToken },
    dong,
  };
}
type CtxThu = ReturnType<typeof ctxThu>["ctx"];

test("2511-s02 call: làm mới token mà phiên chết → NÉM LoiXacThuc, không gọi API nào, không tính là một lời lỗi", async () => {
  let daGoi = 0;
  const { ctx } = ctxThu(sapHet, async () => {
    throw new LoiXacThuc(new Error("phiên đăng nhập đã hết"));
  });
  await assert.rejects(call("GET", "/v1/market/1", null, ctx, fetchGia(async () => (daGoi++, new Response(null, { status: 200 })))), LoiXacThuc);
  assert.equal(daGoi, 0);
  assert.equal(ctx.failed, 0);
});

test("2511-s02 call: lỗi thường (HTTP 500) → null, tính một lời lỗi — KHÔNG dừng cả lượt", async () => {
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
  const kq = await call("GET", "/v1/market/1", null, ctx, fetchGia(async (goi) => {
    authNhanDuoc = String((goi.init?.headers as Record<string, string>).authorization);
    return json(200, { payload: { id: 1 } })();
  }));
  assert.equal(nLamMoi, 1);
  assert.equal(authNhanDuoc, `Bearer ${hienTai}`);
  assert.equal(kq?.kind, "airdna-v2");
  assert.equal(ctx.failed, 0);
});

test("2511-s02 call: token còn hạn → không làm mới thừa", async () => {
  const { ctx } = ctxThu(conHan, async () => {
    throw new Error("không được gọi làm mới khi token còn hạn");
  });
  assert.equal((await call("GET", "/v1/market/1", null, ctx, fetchGia(json(200, { payload: { id: 1 } }))))?.kind, "airdna-v2");
});

test("2511-s02 call: 401 một lần, làm mới cho token KHÁC → gửi lại bằng token mới và thành công", async () => {
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
  const kq = await call("GET", "/v1/market/1", null, ctx, fetchGia(async (goi) => {
    authDaGui.push(String((goi.init?.headers as Record<string, string>).authorization));
    return authDaGui.length === 1 ? new Response(null, { status: 401 }) : json(200, { payload: { id: 1 } })();
  }));
  assert.ok(kq);
  assert.deepEqual(authDaGui, [`Bearer ${tokA}`, `Bearer ${tokB}`]);
  assert.equal(ctx.failed, 0);
});

test("2511-s02 call: 401 mà làm mới KHÔNG đổi token → không gửi lại, ném LoiXacThuc sau đúng MỘT dòng AUTH FAIL [S02]", async () => {
  let daGui = 0;
  const { ctx, dong } = ctxThu(conHan, async () => {});
  await assert.rejects(
    call("GET", "/v1/market/1", null, ctx, fetchGia(async () => {
      daGui++;
      return new Response(null, { status: 401 });
    })),
    LoiXacThuc,
  );
  assert.equal(daGui, 1);
  assert.equal(demDong(dong, "AUTH FAIL [S02]"), 1);
});

test("2511-s02 call: 403 ở API dữ liệu → ném LoiBiChan sau MỘT dòng BỊ CHẶN [S02]; không phải một lời lỗi lẻ, không gọi gì nữa", async () => {
  let daGui = 0;
  const { ctx, dong } = ctxThu(conHan, async () => {
    throw new Error("403 không được nhầm là hết token — không làm mới");
  });
  await assert.rejects(
    call("POST", "/v1/market/1/metrics/adr", {}, ctx, fetchGia(async () => {
      daGui++;
      return json(403, { error: "forbidden" })();
    })),
    (e: unknown) => e instanceof LoiBiChan && /403/.test((e as Error).message) && /POST \/v1\/market\/1\/metrics\/adr/.test((e as Error).message),
  );
  assert.equal(daGui, 1);
  assert.equal(demDong(dong, "BỊ CHẶN [S02]"), 1);
  assert.equal(demDong(dong, "AUTH FAIL [S02]"), 0);
  assert.equal(ctx.failed, 0, "bị chặn là dừng cả lượt, không phải một lời lỗi");
});

test("2511-s02 call: 429 ở API dữ liệu → dừng cả lượt (LoiBiChan), đúng một dòng BỊ CHẶN [S02]", async () => {
  const { ctx, dong } = ctxThu(conHan, async () => {});
  await assert.rejects(call("GET", "/v1/market/1", null, ctx, fetchGia(json(429, {}))), LoiBiChan);
  assert.equal(demDong(dong, "BỊ CHẶN [S02]"), 1);
});

test("2511-s02 call: trang thử thách (403 HTML + cf-mitigated: challenge) ở API dữ liệu → LoiBiChan, không đọc thân", async () => {
  const { ctx, dong } = ctxThu(conHan, async () => {});
  const thuThach = () =>
    new Response("<!DOCTYPE html><html><title>Just a moment...</title></html>", { status: 403, headers: { "content-type": "text/html", "cf-mitigated": "challenge" } });
  await assert.rejects(call("GET", "/v1/market/1", null, ctx, fetchGia(thuThach)), LoiBiChan);
  assert.equal(demDong(dong, "BỊ CHẶN [S02]"), 1);
});

test("2511-s02 call: lỗi thường từ bước làm mới → ném lại (không nuốt thành một lời lỗi), không in AUTH FAIL", async () => {
  let daGoi = 0;
  const { ctx, dong } = ctxThu(sapHet, async () => {
    throw new Error("lỗi mạng sau 3 lần — fetch failed");
  });
  await assert.rejects(
    call("GET", "/v1/market/1", null, ctx, fetchGia(async () => (daGoi++, new Response(null, { status: 200 })))),
    /lỗi mạng sau 3 lần/,
  );
  assert.equal(daGoi, 0);
  assert.equal(ctx.failed, 0);
  assert.equal(demDong(dong, "AUTH FAIL [S02]"), 0);
});

test("2511-s02 call: 401 RỒI bước làm mới gặp lỗi thường → ném lại lỗi đó, không nuốt thành một lời lỗi lẻ", async () => {
  let daGui = 0;
  const { ctx, dong } = ctxThu(conHan, async () => {
    throw new Error("fetch_app_token: lỗi mạng sau 3 lần — fetch failed");
  });
  await assert.rejects(
    call("GET", "/v1/market/1", null, ctx, fetchGia(async () => (daGui++, new Response(null, { status: 401 })))),
    /lỗi mạng sau 3 lần/,
  );
  assert.equal(daGui, 1, "không gửi gì thêm khi không có token mới");
  assert.equal(ctx.failed, 0);
  assert.equal(demDong(dong, "AUTH FAIL [S02]"), 0);
});

// ---- lượt thu không còn trình duyệt, nhịp ≥ 5 giây giữa các lời
// tệp test chạy qua dist/test → nguồn ở ../../src/collectors; chạy src/test trực tiếp → ../collectors.
const thuMucTest = dirname(fileURLToPath(import.meta.url));
const thuMucNguon = existsSync(join(thuMucTest, "..", "src", "collectors"))
  ? join(thuMucTest, "..", "src", "collectors")
  : join(thuMucTest, "..", "..", "src", "collectors");

test("2511-s02 lượt thu KHÔNG mở trình duyệt: hai tệp bộ thu S02 không nhập playwright", () => {
  for (const f of ["airdna-research.ts", "airdna-session.ts"]) {
    const nguon = readFileSync(join(thuMucNguon, f), "utf8");
    assert.doesNotMatch(nguon, /from "playwright-core"|launchPersistentContext|chromium\./, `${f} không được mở trình duyệt`);
  }
});

test("2511-s02 nhịp: tối đa 0,2 lời/giây (≥ 5 giây giữa hai lời, chưa kể jitter của scheduler)", () => {
  assert.ok(airdnaResearch.requestsPerSecond <= 0.2, `thực tế ${airdnaResearch.requestsPerSecond}`);
});

// ---- lệnh đăng nhập: vào ĐÚNG profile bộ thu, bằng Chrome thường — chỉ mở cửa sổ, Mạnh tự đăng nhập
test("2511-s02 argsMoChromeDangNhap: mở Chrome THƯỜNG với ĐÚNG profile bộ thu, không cờ tự động hoá", () => {
  const args = argsMoChromeDangNhap("/tmp/profile-thu");
  assert.ok(args.includes("--user-data-dir=/tmp/profile-thu"), "phải trỏ đúng thư mục profile");
  assert.match(String(args.at(-1)), /^https:\/\/[\w.-]+\/data\/vn$/, "mở đúng route dữ liệu của ứng dụng");
  for (const a of args) {
    assert.doesNotMatch(a, /enable-automation|remote-debugging|headless|AutomationControlled/, `cờ tự động hoá lọt vào: ${a}`);
  }
});

test("2511-s02 bộ thu có lệnh login — CLI tìm được để Mạnh đăng nhập vào ĐÚNG profile", () => {
  assert.equal(typeof airdnaResearch.login, "function");
});

test("2511-s02 thuMucProfile: AIRDNA_PROFILE_DIR thắng; thiếu hoặc rỗng thì dùng mặc định", () => {
  assert.equal(thuMucProfile({ AIRDNA_PROFILE_DIR: "/ngoai-kho/profile/" }, "/mac-dinh/"), "/ngoai-kho/profile/");
  assert.equal(thuMucProfile({}, "/mac-dinh/"), "/mac-dinh/");
  assert.equal(thuMucProfile({ AIRDNA_PROFILE_DIR: "" }, "/mac-dinh/"), "/mac-dinh/");
});

test("2511-s02 duongChrome: AIRDNA_CHROME_BIN thắng; thiếu hoặc rỗng thì dùng Chrome ổn định của macOS", () => {
  assert.equal(duongChrome({ AIRDNA_CHROME_BIN: "/x/chrome" }, "/mac-dinh"), "/x/chrome");
  assert.equal(duongChrome({}, "/mac-dinh"), "/mac-dinh");
  assert.equal(duongChrome({ AIRDNA_CHROME_BIN: "" }, "/mac-dinh"), "/mac-dinh");
});

// ---- P0 của vòng soát 25/11: lệnh login phải DỪNG sau khi mở cửa sổ — đo đen-trắng qua CLI thật, Chrome thay bằng /usr/bin/true
const CLI = fileURLToPath(new URL("../cli.js", import.meta.url));
function chayCli(args: string[], env: Record<string, string>) {
  return spawnSync(process.execPath, [CLI, ...args], { env: { ...process.env, ...env }, encoding: "utf8", timeout: 30_000 });
}

test("2511-s02 lệnh login: mở đúng profile rồi DỪNG — thoát 0, in hướng dẫn, không in Usage, không rơi sang nhánh thu", () => {
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

test("2511-s02 lệnh login: không mở được Chrome → báo lỗi ra stderr, thoát 1, không in Usage", () => {
  const r = chayCli(["login", "--source", "airdna-research"], { AIRDNA_CHROME_BIN: "/khong-ton-at/chrome", AIRDNA_PROFILE_DIR: "/tmp/khong-dung/" });
  assert.equal(r.status, 1, `stdout=${r.stdout}\nstderr=${r.stderr}`);
  assert.ok(r.stderr.length > 0, "phải nói lý do");
  assert.doesNotMatch(r.stdout, /one-invest-collector|Usage:/, "đây là lỗi chạy, không phải lỗi cú pháp lệnh");
});

test("2511-s02 lệnh login: nguồn KHÔNG có lệnh login → in Usage, thoát 1, không mở gì", () => {
  const r = chayCli(["login", "--source", "example"], { AIRDNA_CHROME_BIN: "/usr/bin/true" });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /Usage:/);
  assert.doesNotMatch(r.stdout, /profile bộ thu/);
});
