// node --test scripts/ui-capture-login.test.mjs
// Hồ sơ hieu-chuan-mot-bo-so (ON10, AC-9): bước chụp của kho đăng nhập /ops bằng tài khoản ops thử. Chạy kín: máy chủ giả
// bằng node:http theo khuôn form đăng nhập server action của /login, và runner playwright-cli giả ghi lại lệnh.
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { after, before, test } from "node:test";

import { capture, loginState, widthProbe } from "./ui-capture-login.mjs";

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
 * Runner giả: ghi lệnh; `eval` trả pathname (`/login` khi chưa nạp phiên) hoặc kết quả che tầng A theo `leaked`.
 * Trạng thái tệp phiên được chụp lại đúng lúc `state-load` thấy nó.
 */
function fakeRun({ leaked = [], width = { w: 390, c: 358, s: 358 } } = {}) {
  const calls = [];
  let loaded = false;
  let seen = null;
  const run = (args) => {
    calls.push(args);
    if (args[0] === "state-load") {
      loaded = true;
      const f = args[1];
      seen = { mode: statSync(f).mode & 0o777, text: readFileSync(f, "utf8"), path: f };
    }
    if (args[0] === "eval") {
      const out = args[1].includes("location.pathname")
        ? JSON.stringify(loaded ? "/ops/quality" : "/login")
        : args[1].includes("scrollWidth")
          ? width === null ? "undefined" : JSON.stringify(width)
          : JSON.stringify({ masked: 2, checkedNames: 3, leaked, attrLeaked: [] });
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
