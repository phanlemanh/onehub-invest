#!/usr/bin/env node
// ui-capture-login.mjs <url> <out.png> — thân của capture.ui (scripts/ui-capture.sh gọi vào đây). Hồ sơ
// hieu-chuan-mot-bo-so (ON10, AC-9): URL có đường /ops thì tự đăng nhập bằng tài khoản ops THỬ (chỉ DB local,
// scripts/dev-ops-account.mjs) rồi mới chụp; URL khác chụp như cũ.
//
//   1. Đăng nhập /login bằng HTTP (khuôn của scripts/dev-ops-login-check.sh: trường ẩn $ACTION_ID_…, 303 + cookie
//      oi_session HttpOnly) → storage state của Playwright trong thư mục tạm 700, tệp 600, xoá khi thoát.
//   2. playwright-cli state-load → goto; trang cuối là /login → thoát 4 (phiên hỏng), không ảnh.
//   3. Che tầng A (scripts/ui-standards/mask-tier-a.js) trước khi chụp; còn lộ → thoát 5, không ảnh.
// Không in mật khẩu, cookie hay tên thật. Biến môi trường: UI_CAPTURE_SCHEME=dark · UI_CAPTURE_SIZE=<rộng>x<cao>.
// Mã thoát: 0 ảnh đã ghi · 2 lối gọi/chế độ sai · 3 thiếu playwright-cli · 4 phiên hỏng · 5 tầng A lộ · 6 không đăng nhập được.
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CRED_FILE = path.join(ROOT, ".claude/ops-test-account.json");
const MASK_JS = path.join(ROOT, "scripts/ui-standards/mask-tier-a.js");

/** Đăng nhập /login của app → storage state (chỉ cookie phiên). Lỗi không bao giờ chứa mật khẩu. */
export async function loginState({ base, email, password, fetchImpl = fetch }) {
  const page = await fetchImpl(`${base}/login`).catch(() => null);
  if (!page?.ok) throw new Error(`không đăng nhập được: GET ${base}/login không trả 200 — app dev chưa chạy?`);
  const aid = (await page.text()).match(/name="(\$ACTION_ID_[0-9a-f]+)"/)?.[1];
  if (!aid) throw new Error("không đăng nhập được: form /login không có trường $ACTION_ID_");
  const form = new FormData();
  form.set(aid, "");
  form.set("email", email);
  form.set("password", password);
  form.set("next", "/ops");
  const res = await fetchImpl(`${base}/login`, { method: "POST", body: form, redirect: "manual" });
  const cookie = res.headers.getSetCookie().find((c) => c.startsWith("oi_session="));
  if (res.status !== 303 || !cookie || !/;\s*httponly/i.test(cookie)) {
    throw new Error(`không đăng nhập được: POST /login trả ${res.status}${cookie ? "" : ", không có cookie phiên"}`);
  }
  const value = cookie.slice("oi_session=".length).split(";")[0];
  return {
    cookies: [{ name: "oi_session", value, domain: new URL(base).hostname, path: "/", expires: -1, httpOnly: true, secure: false, sameSite: "Lax" }],
    origins: [],
  };
}

/** Kết quả của `playwright-cli eval` nằm giữa dòng «### Result» và mục kế tiếp. */
export function evalResult(text) {
  const m = String(text).match(/### Result\n([\s\S]*?)\n###/);
  if (!m || m[1].trim() === "undefined") return undefined;
  return JSON.parse(m[1]);
}

/**
 * Chụp `url` ra `out`; trả mã thoát. Mọi phụ thuộc tiêm được để test chạy kín: `run(args)` là `playwright-cli -s=<phiên>`,
 * `ensureAccount()`, `readCred()` → {email, password}, `tierANames()` → mảng tên thật. `skipLogin` chỉ để đối chứng bước
 * chụp cũ (không đăng nhập).
 */
export async function capture({ url, out, env = process.env, run, ensureAccount, readCred, tierANames, log = console.log, err = console.error, skipLogin = false }) {
  let size = null;
  if (env.UI_CAPTURE_SIZE) {
    const m = env.UI_CAPTURE_SIZE.match(/^(\d+)x(\d+)$/);
    if (!m) {
      err(`UI_CAPTURE_SIZE phải dạng <rộng>x<cao>, ví dụ 390x844`);
      return 2;
    }
    size = [m[1], m[2]];
  }
  const u = new URL(url);
  const ops = u.pathname === "/ops" || u.pathname.startsWith("/ops/");
  const tmp = mkdtempSync(path.join(tmpdir(), "ui-capture-"));
  chmodSync(tmp, 0o700);
  try {
    run(["open"]);
    if (size) run(["resize", ...size]);
    if (env.UI_CAPTURE_SCHEME) run(["set-color-scheme", env.UI_CAPTURE_SCHEME]);
    if (ops && !skipLogin) {
      ensureAccount();
      const { email, password } = readCred();
      let state;
      try {
        state = await loginState({ base: u.origin, email, password });
      } catch (e) {
        err(e.message);
        return 6;
      }
      const f = path.join(tmp, "state.json");
      writeFileSync(f, JSON.stringify(state), { mode: 0o600 });
      run(["state-load", f]);
      rmSync(f, { force: true });
    }
    run(["goto", url]);
    if (ops) {
      const where = evalResult(run(["eval", "() => location.pathname"]));
      if (typeof where !== "string" || where === "/login" || where.startsWith("/login")) {
        err(`phiên hỏng — trang cuối là ${where ?? "?"}, không chụp`);
        return 4;
      }
      const names = tierANames();
      const mask = readFileSync(MASK_JS, "utf8").trim().replace(/;$/, "");
      const r = evalResult(run(["eval", `() => { window.__TIER_A_NAMES = ${JSON.stringify(names)}; return (\n${mask}\n); }`]));
      if (!r || r.leaked?.length || r.attrLeaked?.length) {
        err(`tầng A còn lộ sau khi che (${r?.leaked?.length ?? "?"} tên) — không chụp`);
        return 5;
      }
      err(`tầng A: đã che ${r.masked}`);
    }
    run(["screenshot", "--full-page", "--filename", out]);
    log(out);
    return 0;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
    try {
      run(["close"]);
    } catch {
      // phiên đã đóng
    }
  }
}

// Lối vào so qua realpath: launchd/người gọi có thể đi qua symlink ~/dev/one-invest (khuôn của scripts/check-api-surface.mjs).
const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [url, out] = process.argv.slice(2);
  if (!url || !out) {
    console.error("usage: ui-capture-login.mjs <url> <out.png>");
    process.exit(2);
  }
  try {
    execFileSync("playwright-cli", ["--version"], { stdio: "ignore" });
  } catch {
    console.error("thiếu playwright-cli: npm i -g @playwright/cli");
    process.exit(3);
  }
  const session = `ui-capture-${process.pid}`;
  const tmpNames = path.join(mkdtempSync(path.join(tmpdir(), "ui-capture-names-")), "names.json");
  const code = await capture({
    url,
    out,
    run: (args) => execFileSync("playwright-cli", [`-s=${session}`, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
    ensureAccount: () => execFileSync("node", [path.join(ROOT, "scripts/dev-ops-account.mjs")], { stdio: "ignore" }),
    readCred: () => JSON.parse(readFileSync(CRED_FILE, "utf8")),
    tierANames: () => {
      execFileSync("node", [path.join(ROOT, "scripts/ui-standards/tier-a-names.mjs"), "--out", tmpNames], { cwd: ROOT, stdio: "ignore" });
      const names = JSON.parse(readFileSync(tmpNames, "utf8"));
      rmSync(path.dirname(tmpNames), { recursive: true, force: true });
      return names;
    },
  });
  process.exit(code);
}
