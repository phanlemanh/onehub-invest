#!/usr/bin/env node
// ui-capture-login.mjs <url> <out.png> — thân của capture.ui (scripts/ui-capture.sh gọi vào đây). Hồ sơ
// hieu-chuan-mot-bo-so (ON10, AC-9): URL có đường /ops thì tự đăng nhập bằng tài khoản ops THỬ (chỉ DB local,
// scripts/dev-ops-account.mjs) rồi mới chụp; URL khác chụp như cũ.
//
//   1. Đăng nhập /login bằng HTTP (khuôn của scripts/dev-ops-login-check.sh: trường ẩn $ACTION_ID_…, 303 + cookie
//      oi_session HttpOnly) → storage state của Playwright trong thư mục tạm 700, tệp 600, xoá khi thoát.
//   2. playwright-cli state-load → goto; trang cuối là /login → thoát 4 (phiên hỏng), không ảnh.
//   3. Che tầng A (scripts/ui-standards/mask-tier-a.js, danh sách RỖNG) rồi đọc chữ + thuộc tính trang về Node; Node so
//      với danh sách tên thật (tierALeaks). Tên thật không bao giờ vào argv của lệnh con hay vào trang (hồ sơ
//      buoc-chup-khong-in-ten-that). Còn lộ → thoát 5, không ảnh.
//   4. Mọi lệnh con đi qua step(): lỗi → thoát 7 với lời chung đã xoá tên/mật khẩu/cookie, không argv, không ảnh.
// Không in mật khẩu, cookie hay tên thật. Biến môi trường: UI_CAPTURE_SCHEME=dark · UI_CAPTURE_SIZE=<rộng>x<cao> ·
// UI_CAPTURE_PROBE_WIDE=1 (đối chứng dương cho dòng «bề rộng»).
// Mã thoát: 0 ảnh đã ghi · 2 lối gọi/chế độ sai · 3 thiếu playwright-cli · 4 phiên hỏng · 5 tầng A lộ · 6 không đăng nhập được ·
// 7 một bước chụp lỗi.
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

/** Hàm trang đo vùng cuộn thân trang; `probe` chèn khối 2000px (đối chứng dương) rồi gỡ ngay sau khi đo. */
export function widthProbe(probe) {
  return `() => {
    let el = document.querySelector("h1");
    while (el && !/(auto|scroll)/.test(getComputedStyle(el).overflowY)) el = el.parentElement;
    if (!el) return null;
    let wide = null;
    if (${probe ? "true" : "false"}) { wide = document.createElement("div"); wide.style.cssText = "width:2000px;height:1px"; el.appendChild(wide); }
    const r = { w: innerWidth, c: el.clientWidth, s: el.scrollWidth };
    if (wide) wide.remove();
    return r;
  }`;
}

/**
 * Hàm trang đọc chữ và giá trị thuộc tính, BỎ trọn cây con `[data-tier-a]` (đã che — thuộc tính của nó không lên ảnh) và
 * `<script>`/`<style>`. Dấu `doc-chu-trang` để nhận lệnh. Tên thật KHÔNG đi vào hàm này — Node tự so (tierALeaks).
 */
export const PAGE_TEXT_FN = `() => { /* doc-chu-trang */
  const bo = (el) => el.closest("[data-tier-a],script,style");
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const parts = [];
  while (w.nextNode()) { const t = w.currentNode; if (t.parentElement && !bo(t.parentElement) && t.nodeValue.trim()) parts.push(t.nodeValue); }
  const attrs = [];
  for (const el of document.body.querySelectorAll("*")) { if (bo(el)) continue; for (const a of el.attributes) attrs.push(a.value); }
  return { text: parts.join(" "), attrs };
}`;

/** Đếm tên tầng A (≥ 3 ký tự, không phân biệt hoa thường) còn trong chữ và trong thuộc tính của trang. */
export function tierALeaks(names, page) {
  const ds = names.map((n) => String(n).trim().toLowerCase()).filter((n) => n.length >= 3);
  const text = String(page.text ?? "").toLowerCase();
  const attrs = (page.attrs ?? []).map((a) => String(a).toLowerCase()).join("\n");
  return { leaked: ds.filter((n) => text.includes(n)).length, attrLeaked: ds.filter((n) => attrs.includes(n)).length };
}

/** Lỗi một bước chụp: chỉ mang tên bước và mã — lời ra ngoài không bao giờ chứa argv. */
export class CaptureError extends Error {
  constructor(step, code, detail = "") {
    super(`bước chụp lỗi ở «${step}» (mã ${code})${detail ? `: ${detail}` : ""}`);
    this.step = step;
    this.code = code;
  }
}

/** Một dòng stderr đầu tiên của lỗi lệnh con, đã thay mọi chuỗi nhạy cảm bằng ███. */
function redactedLine(e, secrets) {
  let line = String(e?.stderr ?? "").split("\n").find((l) => l.trim()) ?? "";
  for (const s of secrets) {
    if (!s || String(s).length < 3) continue;
    const esc = String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    line = line.replace(new RegExp(esc, "gi"), "███");
  }
  return line.slice(0, 200);
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
  const secrets = []; // tên thật, mật khẩu, cookie — xoá khỏi mọi lời lỗi
  const step = (name, args) => {
    try {
      return run(args);
    } catch (e) {
      throw new CaptureError(name, Number.isInteger(e?.status) ? e.status : 1, redactedLine(e, secrets));
    }
  };
  /** eval rồi đọc khối kết quả; đầu ra không đọc được cũng là lỗi bước (đóng cửa). */
  const evalStep = (name, fn, { allowUndefined = false } = {}) => {
    let v;
    try {
      v = evalResult(step(name, ["eval", fn]));
    } catch (e) {
      if (e instanceof CaptureError) throw e;
      throw new CaptureError(name, 1, "không đọc được kết quả");
    }
    if (v === undefined && !allowUndefined) throw new CaptureError(name, 1, "không có kết quả");
    return v;
  };
  try {
    // Danh sách tên nạp TRƯỚC mọi lệnh con: lời lỗi của bất kỳ bước nào cũng được xoá tên (UC-TA-4).
    let names = [];
    if (ops) {
      try {
        names = tierANames(tmp);
      } catch {
        throw new CaptureError("danh sách tên", 1);
      }
      secrets.push(...names);
    }
    step("open", ["open"]);
    if (size) step("resize", ["resize", ...size]);
    if (env.UI_CAPTURE_SCHEME) step("set-color-scheme", ["set-color-scheme", env.UI_CAPTURE_SCHEME]);
    if (ops && !skipLogin) {
      ensureAccount();
      const { email, password } = readCred();
      secrets.push(password);
      let state;
      try {
        state = await loginState({ base: u.origin, email, password });
      } catch (e) {
        err(e.message);
        return 6;
      }
      secrets.push(...state.cookies.map((c) => c.value));
      const f = path.join(tmp, "state.json");
      writeFileSync(f, JSON.stringify(state), { mode: 0o600 });
      step("state-load", ["state-load", f]);
      rmSync(f, { force: true });
    }
    step("goto", ["goto", url]);
    if (ops) {
      const where = evalStep("eval vị trí", "() => location.pathname", { allowUndefined: true });
      if (typeof where !== "string" || where === "/login" || where.startsWith("/login")) {
        err(`phiên hỏng — trang cuối là ${where ?? "?"}, không chụp`);
        return 4;
      }
      const mask = readFileSync(MASK_JS, "utf8").trim().replace(/;$/, "");
      const r = evalStep("eval che", `() => { window.__TIER_A_NAMES = []; return (\n${mask}\n); }`);
      const page = evalStep("eval đọc chữ", PAGE_TEXT_FN);
      if (typeof page?.text !== "string" || !Array.isArray(page?.attrs)) throw new CaptureError("eval đọc chữ", 1, "kết quả sai dạng");
      const leaks = tierALeaks(names, page);
      if (leaks.leaked || leaks.attrLeaked) {
        const lo = tierALeaks(names, { text: `${page.text}\n${page.attrs.join("\n")}`, attrs: [] }).leaked;
        err(`tầng A còn lộ sau khi che (${lo} tên) — không chụp`);
        return 5;
      }
      err(`tầng A: đã che ${r?.masked ?? 0}`);
    }
    // Bề rộng: đo VÙNG CUỘN của thân trang (cha gần nhất của h1 có overflow-y auto/scroll), không đo document —
    // khung Ops cắt tràn ở gốc nên document.scrollWidth luôn bằng khung (S4 r3 ON10). Nội dung > vùng cuộn = trang cuộn
    // ngang; bảng lưới cuộn trong khung riêng của nó không làm vùng này rộng ra. UI_CAPTURE_PROBE_WIDE=1 chèn một khối
    // 2000px trước khi đo — đối chứng dương: phép đo phải báo nội dung > vùng cuộn.
    const bw = evalStep("eval bề rộng", widthProbe(env.UI_CAPTURE_PROBE_WIDE === "1"), { allowUndefined: true });
    if (bw && Number.isFinite(bw.c) && Number.isFinite(bw.s)) err(`bề rộng: khung ${bw.w}, vùng cuộn ${bw.c}, nội dung ${bw.s}`);
    else err("bề rộng: không đo được");
    step("screenshot", ["screenshot", "--full-page", "--filename", out]);
    log(out);
    return 0;
  } catch (e) {
    if (!(e instanceof CaptureError)) throw e;
    err(`${e.message} — không chụp`);
    return 7;
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
  const code = await capture({
    url,
    out,
    run: (args) => execFileSync("playwright-cli", [`-s=${session}`, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }),
    ensureAccount: () => execFileSync("node", [path.join(ROOT, "scripts/dev-ops-account.mjs")], { stdio: "ignore" }),
    readCred: () => JSON.parse(readFileSync(CRED_FILE, "utf8")),
    // Danh sách tên ghi vào thư mục tạm của capture (quyền 700) — capture dọn nó ở mọi đường thoát.
    tierANames: (dir) => {
      const f = path.join(dir, "names.json");
      execFileSync("node", [path.join(ROOT, "scripts/ui-standards/tier-a-names.mjs"), "--out", f], { cwd: ROOT, stdio: "ignore" });
      return JSON.parse(readFileSync(f, "utf8"));
    },
  });
  process.exit(code);
}
