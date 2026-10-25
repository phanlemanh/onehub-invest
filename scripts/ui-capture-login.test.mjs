// node --test scripts/ui-capture-login.test.mjs
// Hồ sơ hieu-chuan-mot-bo-so (ON10, AC-9): bước chụp của kho đăng nhập /ops bằng tài khoản ops thử. Chạy kín: máy chủ giả
// bằng node:http theo khuôn form đăng nhập server action của /login, và runner playwright-cli giả ghi lại lệnh.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer } from "node:http";
import { after, before, test } from "node:test";

import { capture, loginState, tierALeaks, widthProbe } from "./ui-capture-login.mjs";

const EMAIL = "ops-test@local.test";
const PASSWORD = "mat-khau-thu-Zq81";
const COOKIE = "a".repeat(64);
let base;
let hits = [];
let server;

before(async () => {
  server = createServer((req, res) => {
    hits.push(`${req.method} ${req.url}`);
    if (req.method === "GET" && req.url === "/login") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(`<form><input type="hidden" name="$ACTION_ID_abc123"/><input name="email"/></form>`);
      return;
    }
    if (req.method === "POST" && req.url === "/login") {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => {
        if (body.includes("$ACTION_ID_abc123") && body.includes(EMAIL) && body.includes(PASSWORD)) {
          res.writeHead(303, { location: "/ops", "set-cookie": `oi_session=${COOKIE}; Path=/; HttpOnly; SameSite=Lax` });
          res.end();
        } else {
          res.writeHead(200, { "content-type": "text/html" });
          res.end("<p>Sai email hoặc mật khẩu</p>");
        }
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

/**
 * Runner giả: ghi lệnh; `eval` trả pathname (`/login` khi chưa nạp phiên), kết quả che (bước che chạy với danh sách
 * rỗng), chữ + thuộc tính trang (lệnh đọc chữ — `leaked` khác rỗng thì chữ trang còn tên «TenThat»), hoặc bề rộng.
 * `failAt` = tên bước để ném lỗi kiểu execFileSync (message mang argv, stderr mang tên/mật khẩu/cookie); `pageRaw` = đầu
 * ra thô của lệnh đọc chữ (đầu ra hỏng). Trạng thái tệp phiên được chụp lại đúng lúc `state-load` thấy nó.
 */
function fakeRun({ leaked = [], width = { w: 390, c: 358, s: 358 }, page = null, pageRaw = null, failAt = null, leakText = "" } = {}) {
  const calls = [];
  let loaded = false;
  let seen = null;
  const buoc = (args) =>
    args[0] !== "eval" ? args[0]
    : args[1].includes("location.pathname") ? "eval vị trí"
    : args[1].includes("__TIER_A_NAMES") ? "eval che"
    : args[1].includes("doc-chu-trang") ? "eval đọc chữ"
    : args[1].includes("scrollWidth") ? "eval bề rộng" : "eval khác";
  const run = (args) => {
    calls.push(args);
    if (failAt && buoc(args) === failAt) {
      const e = new Error(`Command failed: playwright-cli ${args.join(" ")}`);
      e.status = 1;
      e.stderr = `Error: lỗi giả ${leakText}`;
      throw e;
    }
    if (args[0] === "state-load") {
      loaded = true;
      const f = args[1];
      seen = { mode: statSync(f).mode & 0o777, text: readFileSync(f, "utf8"), path: f };
    }
    if (args[0] === "eval") {
      const b = buoc(args);
      if (b === "eval đọc chữ" && pageRaw !== null) return pageRaw;
      const out = b === "eval vị trí"
        ? JSON.stringify(loaded ? "/ops/quality" : "/login")
        : b === "eval bề rộng"
          ? width === null ? "undefined" : JSON.stringify(width)
          : b === "eval đọc chữ"
            ? JSON.stringify(page ?? { text: leaked.length ? "Bảng nguồn TenThat" : "Bảng sạch", attrs: [] })
            : JSON.stringify({ masked: 2, checkedNames: 0, leaked: [], attrLeaked: [] });
      return `### Result\n${out}\n### Ran Playwright code\n`;
    }
    return "";
  };
  return { run, calls, state: () => seen };
}

function deps(over = {}) {
  const logs = [];
  const fr = fakeRun(over);
  return {
    logs,
    fr,
    opts: {
      env: {},
      run: fr.run,
      ensureAccount: () => {},
      readCred: () => ({ email: EMAIL, password: over.password ?? PASSWORD }),
      tierANames: () => ["TenThat"],
      log: (s) => logs.push(String(s)),
      err: (s) => logs.push(String(s)),
      ...over.opts,
    },
  };
}

test("UC-AC-9 loginState trả cookie phiên", async () => {
  const st = await loginState({ base, email: EMAIL, password: PASSWORD });
  const c = st.cookies.find((x) => x.name === "oi_session");
  assert.equal(c?.value, COOKIE);
  assert.equal(c?.httpOnly, true);
  assert.equal(c?.domain, "127.0.0.1");
});

test("UC-AC-9 (a)(b) URL /ops đăng nhập, tệp phiên 600 rồi bị xoá, không lộ mật khẩu/cookie", async () => {
  const d = deps();
  const code = await capture({ url: `${base}/ops/x`, out: "/tmp/khong-ghi.png", ...d.opts });
  assert.equal(code, 0, d.logs.join("\n"));
  const st = d.fr.state();
  assert.ok(st, "không có state-load");
  assert.equal(st.mode, 0o600, "tệp phiên phải quyền 600");
  assert.ok(st.text.includes(COOKIE), "tệp phiên thiếu cookie");
  assert.equal(existsSync(st.path), false, "tệp phiên còn sau khi chụp");
  assert.ok(d.fr.calls.some((a) => a[0] === "screenshot"), "không chụp");
  const all = d.logs.join("\n");
  assert.ok(!all.includes(PASSWORD) && !all.includes(COOKIE), "mật khẩu/cookie ra stdout/stderr");
  assert.ok(all.includes("tầng A: đã che 2"), "thiếu dòng báo che tầng A");
  assert.ok(all.includes("bề rộng: khung 390, vùng cuộn 358, nội dung 358"), "thiếu dòng đo bề rộng vùng cuộn");
});

test("UC-AC-9 (c) mật khẩu sai → không đăng nhập được, không ảnh", async () => {
  const d = deps({ password: "sai-Zq81" });
  const code = await capture({ url: `${base}/ops/x`, out: "/tmp/khong-ghi.png", ...d.opts });
  assert.notEqual(code, 0);
  const all = d.logs.join("\n");
  assert.match(all, /không đăng nhập được/);
  assert.ok(!all.includes("sai-Zq81"), "lời lỗi lộ mật khẩu");
  assert.ok(!d.fr.calls.some((a) => a[0] === "screenshot"), "vẫn chụp khi đăng nhập hỏng");
});

test("UC-AC-9 (d) URL ngoài /ops chụp như cũ, không đăng nhập", async () => {
  hits = [];
  const d = deps();
  const code = await capture({ url: `${base}/vn/hanoi`, out: "/tmp/khong-ghi.png", ...d.opts });
  assert.equal(code, 0);
  assert.equal(hits.filter((h) => h.includes("/login")).length, 0, "URL ngoài /ops vẫn gọi /login");
  assert.ok(!d.fr.calls.some((a) => a[0] === "state-load"));
  assert.ok(d.fr.calls.some((a) => a[0] === "screenshot"));
});

test("UC-AC-9 (e) tầng A còn lộ → không ảnh", async () => {
  const d = deps({ leaked: [0] });
  const code = await capture({ url: `${base}/ops/x`, out: "/tmp/khong-ghi.png", ...d.opts });
  assert.equal(code, 5);
  assert.ok(!d.fr.calls.some((a) => a[0] === "screenshot"), "vẫn chụp khi tầng A lộ");
  assert.ok(!d.logs.join("\n").includes("TenThat"), "lời lỗi in tên thật");
});

test("UC-AC-9 chiều đỏ: không nạp phiên → trang cuối là /login → mã 4", async () => {
  const d = deps({ opts: { skipLogin: true } });
  const code = await capture({ url: `${base}/ops/x`, out: "/tmp/khong-ghi.png", ...d.opts });
  assert.equal(code, 4);
  assert.match(d.logs.join("\n"), /\/login/);
  assert.ok(!d.fr.calls.some((a) => a[0] === "screenshot"));
});

test("UC-AC-9 (f) UI_CAPTURE_SIZE sai dạng → mã 2", async () => {
  const d = deps({ opts: { env: { UI_CAPTURE_SIZE: "abc" } } });
  assert.equal(await capture({ url: `${base}/ops/x`, out: "/tmp/khong-ghi.png", ...d.opts }), 2);
});

test("UC-AC-9 chế độ tối 390", async () => {
  const d = deps({ opts: { env: { UI_CAPTURE_SCHEME: "dark", UI_CAPTURE_SIZE: "390x844" } } });
  assert.equal(await capture({ url: `${base}/ops/x`, out: "/tmp/khong-ghi.png", ...d.opts }), 0);
  assert.ok(d.fr.calls.some((a) => a.join(" ") === "set-color-scheme dark"));
  assert.ok(d.fr.calls.some((a) => a.join(" ") === "resize 390 844"));
});

test("UC-AC-10 dòng bề rộng: nội dung rộng hơn vùng cuộn thì in đúng hai số; không đo được thì nói ra", async () => {
  const tran = deps({ width: { w: 390, c: 358, s: 2358 } });
  assert.equal(await capture({ url: `${base}/ops/x`, out: "/tmp/khong-ghi.png", ...tran.opts }), 0);
  assert.ok(tran.logs.join("\n").includes("bề rộng: khung 390, vùng cuộn 358, nội dung 2358"));
  const mu = deps({ width: null }); // eval trả undefined
  assert.equal(await capture({ url: `${base}/ops/x`, out: "/tmp/khong-ghi.png", ...mu.opts }), 0);
  assert.ok(mu.logs.join("\n").includes("bề rộng: không đo được"), "đo hỏng phải nói ra, không im");
});

test("UC-AC-10 widthProbe: đo vùng cuộn (không đo document), đối chứng dương chèn rồi gỡ khối 2000px", () => {
  const thuong = widthProbe(false);
  assert.match(thuong, /overflowY/);
  assert.doesNotMatch(thuong, /documentElement/);
  assert.match(widthProbe(true), /if \(true\)[\s\S]*2000px[\s\S]*wide\.remove\(\)/);
  assert.match(thuong, /if \(false\)/);
});

// ---- buoc-chup-khong-in-ten-that: tên tầng A ở lại tiến trình Node ----

/** Bộ 3 tên giả viết trước: có dấu, hoa-thường lẫn, có nháy. */
const TEN = ["Nhóm Thử Đặc Biệt", "nGuOn tHu", `Ng'uồn "Kép"`];
const coTen = (s) => TEN.some((t) => String(s).toLowerCase().includes(t.toLowerCase()));

test("UC-TA-1 không tên trong argv (đối chứng dương: đủ ba bước, mã 0)", async () => {
  const d = deps({ page: { text: "Bảng sạch ███", attrs: ["muted"] }, opts: { tierANames: () => TEN } });
  const code = await capture({ url: `${base}/ops/x`, out: "/tmp/khong-ghi.png", ...d.opts });
  assert.equal(code, 0, d.logs.join("\n"));
  const loi = d.fr.calls.filter((a) => a.some(coTen));
  assert.equal(loi.length, 0, `tên tầng A trong argv của eval: ${loi.map((a) => a[0]).join(",")}`);
  const buoc = d.fr.calls.map((a) => (a[0] === "eval" ? (a[1].includes("__TIER_A_NAMES") ? "che" : a[1].includes("doc-chu-trang") ? "doc" : "eval") : a[0]));
  for (const b of ["che", "doc", "screenshot"]) assert.ok(buoc.includes(b), `thiếu bước ${b}: ${buoc.join(",")}`);
});

test("UC-TA-2 tierALeaks ma trận viết trước", () => {
  const ca = [
    [{ text: "Bảng Nhóm Thử Đặc Biệt hôm nay", attrs: [] }, { leaked: 1, attrLeaked: 0 }, "tên trong chữ"],
    [{ text: "sạch", attrs: ["title: nguon thu"] }, { leaked: 0, attrLeaked: 1 }, "tên trong thuộc tính, khác hoa thường"],
    [{ text: "NGUON THU ở đây", attrs: [] }, { leaked: 1, attrLeaked: 0 }, "hoa-thường khác vẫn lộ"],
    [{ text: "ab cd", attrs: [] }, { leaked: 0, attrLeaked: 0 }, "không tên"],
    [{ text: `có Ng'uồn "Kép" trong chữ`, attrs: [`Ng'uồn "Kép"`] }, { leaked: 1, attrLeaked: 1 }, "tên có nháy"],
  ];
  for (const [page, want, nhan] of ca) assert.deepEqual(tierALeaks(TEN, page), want, nhan);
  assert.deepEqual(tierALeaks(["ab", "x("], { text: "ab x( y", attrs: [] }), { leaked: 1, attrLeaked: 0 }, "tên 2 ký tự bỏ qua, ký tự regex không vỡ");
});

test("UC-TA-2 lộ trong chữ → mã 5, lời chỉ có số, không ảnh; chữ sạch → mã 0 có ảnh", async () => {
  const lo = deps({ page: { text: "Bảng Nhóm Thử Đặc Biệt", attrs: ["nGuOn tHu"] }, opts: { tierANames: () => TEN } });
  assert.equal(await capture({ url: `${base}/ops/x`, out: "/tmp/khong-ghi.png", ...lo.opts }), 5);
  const all = lo.logs.join("\n");
  assert.match(all, /tầng A còn lộ .*2 tên/);
  assert.ok(!coTen(all), "lời lỗi in tên thật");
  assert.ok(!lo.fr.calls.some((a) => a[0] === "screenshot"));
  const sach = deps({ page: { text: "Bảng sạch", attrs: [] }, opts: { tierANames: () => TEN } });
  assert.equal(await capture({ url: `${base}/ops/x`, out: "/tmp/khong-ghi.png", ...sach.opts }), 0);
  assert.ok(sach.fr.calls.some((a) => a[0] === "screenshot"));
});

const BUOC_LOI = ["goto", "state-load", "eval che", "eval đọc chữ", "eval bề rộng", "screenshot"];
test("UC-TA-4 lệnh con lỗi ở từng bước → mã 7, lời chung, đầu ra sạch", async () => {
  for (const b of [...BUOC_LOI, "đọc chữ hỏng"]) {
    const over = b === "đọc chữ hỏng" ? { pageRaw: "### Ran Playwright code\nkhông có kết quả\n" } : { failAt: b, leakText: `${TEN[0]} ${PASSWORD} ${COOKIE}` };
    const d = deps({ ...over, opts: { tierANames: () => TEN } });
    let code;
    try {
      code = await capture({ url: `${base}/ops/x`, out: "/tmp/khong-ghi.png", ...d.opts });
    } catch (e) {
      assert.fail(`lỗi thô lọt khỏi capture ở bước ${b}: ${e.message.slice(0, 60)}`);
    }
    assert.equal(code, 7, `bước ${b}`);
    const all = d.logs.join("\n");
    const ten = b === "đọc chữ hỏng" ? "eval đọc chữ" : b;
    assert.ok(all.includes(`bước chụp lỗi ở «${ten}»`), `bước ${b}: ${all}`);
    assert.ok(!coTen(all) && !all.includes(PASSWORD) && !all.includes(COOKIE), `bước ${b} lộ tên/mật khẩu/cookie`);
    if (b !== "screenshot") assert.ok(!d.fr.calls.some((a) => a[0] === "screenshot"), `bước ${b} vẫn chụp`);
  }
});

const demTmp = () => readdirSync(tmpdir()).filter((f) => f.startsWith("ui-capture-")).length;
test("UC-TA-5 dọn tệp tạm ở mọi đường kết thúc", async () => {
  const daGhi = [];
  const nguon = (nem) => (dir) => {
    const f = path.join(dir, "names.json");
    writeFileSync(f, JSON.stringify(TEN));
    daGhi.push(f);
    if (nem) throw new Error(`db chết ${TEN[0]}`);
    return TEN;
  };
  const ca = [
    ["thành công", { page: { text: "sạch", attrs: [] } }, nguon(false), 0],
    ["lộ", { page: { text: TEN[0], attrs: [] } }, nguon(false), 5],
    ["lệnh con lỗi", { failAt: "screenshot" }, nguon(false), 7],
    ["nguồn tên lỗi", {}, nguon(true), 7],
  ];
  for (const [nhan, over, tierANames, ma] of ca) {
    const truoc = demTmp();
    const d = deps({ ...over, opts: { tierANames } });
    assert.equal(await capture({ url: `${base}/ops/x`, out: "/tmp/khong-ghi.png", ...d.opts }), ma, nhan);
    assert.equal(demTmp(), truoc, `${nhan}: thư mục tạm còn`);
    assert.ok(!existsSync(daGhi.at(-1)), `${nhan}: tệp danh sách tên còn`);
    assert.ok(!coTen(d.logs.join("\n")), `${nhan}: lời in tên`);
  }
});
