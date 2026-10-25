#!/usr/bin/env node
// Kiểm bản khai công cụ MCP app/docs/api/mcp-tools.json theo sổ bề mặt app/src/lib/api-surface.ts (hồ sơ
// mcp-tools-theo-so-be-mat, ON15): mỗi công cụ trỏ một route có trong sổ, phương thức nằm trong sổ, và chế độ khai
// (khoá `auth` của công cụ, vắng thì chế độ mặc định ở khoá `auth` gốc) bằng chế độ sổ. Đo trạng thái cây, không đo diff.
//   node scripts/check-mcp-tools.mjs static    — đo cây thật (exit 0 = đạt, 1 = vi phạm)
//   node scripts/check-mcp-tools.mjs mutation  — bản nguyên ĐẠT, MT1–MT10 TRƯỢT đúng thông điệp (MT4 ĐẠT), W1 làn portal
//   node scripts/check-mcp-tools.mjs historic  — B0: bản khai + sổ ở 1c6389b (trước vòng) phải TRƯỢT; cần lịch sử git
// check-portal-compliance.mjs gọi checkMcpTools trên cây thật (mục 13).
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { loadEntries } from "./check-api-surface.mjs";

export const MCP_MSG = {
  noRoute: "công cụ trỏ route không có trong sổ",
  method: "phương thức công cụ lệch sổ",
  noMode: "công cụ thiếu chế độ",
  badMode: "chế độ công cụ không có trong sổ",
  mode: "chế độ công cụ lệch sổ",
};

// Năm chế độ của ApiMode (app/src/lib/api-surface.ts). Dài trước ngắn để «ops-session» không bị đọc thành «ops».
export const MODES = ["ops-session", "session-or-noop", "public", "ops", "admin"];
const ROOT_MODE = new RegExp(`^(${MODES.join("|")})\\b`);

const MANIFEST = "app/docs/api/mcp-tools.json";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Chế độ mặc định khoá `auth` gốc khai — chuỗi mở đầu bằng tên một chế độ; không phải lời khai chế độ → null. */
export const rootMode = (manifest) =>
  typeof manifest?.auth === "string" ? (manifest.auth.trim().match(ROOT_MODE)?.[1] ?? null) : null;

/** entries: dòng sổ bề mặt; manifest: nội dung mcp-tools.json đã parse. */
export function checkMcpTools({ entries, manifest }) {
  const violations = [];
  const lines = [];
  const declared = new Map(entries.map((e) => [e.route, e]));
  const fallback = rootMode(manifest);
  const tools = Array.isArray(manifest?.tools) ? manifest.tools : [];
  for (const [i, t] of tools.entries()) {
    const name = typeof t?.name === "string" && t.name ? t.name : `tools[${i}]`;
    const route = typeof t?.endpoint === "string" && t.endpoint.startsWith("/api/") ? t.endpoint.slice("/api/".length) : null;
    const e = route === null ? undefined : declared.get(route);
    if (!e) {
      violations.push(`${name}: ${MCP_MSG.noRoute} (${t?.endpoint ?? "thiếu endpoint"})`);
      continue;
    }
    let ok = true;
    if (typeof t.method !== "string" || !e.methods.includes(t.method)) {
      violations.push(`${name}: ${MCP_MSG.method} (khai ${t.method ?? "thiếu method"}, sổ ${e.methods.join("/")})`);
      ok = false;
    }
    const mode = t.auth ?? fallback;
    if (mode == null) {
      violations.push(`${name}: ${MCP_MSG.noMode}`);
      ok = false;
    } else if (!MODES.includes(mode)) {
      violations.push(`${name}: ${MCP_MSG.badMode} (khai ${mode})`);
      ok = false;
    } else if (mode !== e.mode) {
      violations.push(`${name}: ${MCP_MSG.mode} (khai ${mode}, sổ ${e.mode})`);
      ok = false;
    }
    if (ok) lines.push(`${name} → ${route} ${t.method}: ${mode} = sổ ${e.mode}`);
  }
  return { violations, lines, tools: tools.length, fallback };
}

export function loadManifest(r = root) {
  return JSON.parse(readFileSync(path.join(r, MANIFEST), "utf8"));
}

// Bảng đột biến viết trước (design §3, contract mục Coverage). Dựng từ bản khai + sổ thật; chế độ chọn TƯƠNG ĐỐI với
// sổ hiện tại để bảng vẫn áp được khi một route đổi chế độ. Thông điệp null = đối chứng dương (phải 0 vi phạm).
const otherMode = (m) => MODES.find((x) => x !== m);
const modeOf = (entries, t) => entries.find((e) => `/api/${e.route}` === t.endpoint)?.mode;
const clone = (b) => ({ entries: structuredClone(b.entries), manifest: structuredClone(b.manifest) });
const firstTool = (b) => (b.manifest.tools?.length ? b.manifest.tools[0] : null);

export const MCP_MUTATIONS = [
  ["MT1", "một công cụ đổi auth sang chế độ khác sổ", MCP_MSG.mode, (b) => {
    const m = clone(b);
    const t = firstTool(m);
    const sm = t && modeOf(m.entries, t);
    if (!sm) return null;
    t.auth = otherMode(sm);
    return m;
  }],
  ["MT2", "công cụ bỏ auth, gốc không khai chế độ", MCP_MSG.noMode, (b) => {
    const m = clone(b);
    const t = firstTool(m);
    if (!t) return null;
    delete t.auth;
    m.manifest.auth = "theo từng công cụ";
    return m;
  }],
  ["MT3", "khuôn bản cũ: gốc khai một chế độ, mọi công cụ bỏ auth", MCP_MSG.mode, (b) => {
    const m = clone(b);
    const t = firstTool(m);
    const sm = t && modeOf(m.entries, t);
    if (!sm) return null;
    for (const x of m.manifest.tools) delete x.auth;
    m.manifest.auth = `${otherMode(sm)} (khai chung cho mọi công cụ)`;
    return m;
  }],
  ["MT4", "gốc khai một chế độ, mọi công cụ giữ auth riêng khớp sổ (ghi đè hợp lệ)", null, (b) => {
    const m = clone(b);
    const t = firstTool(m);
    const sm = t && modeOf(m.entries, t);
    if (!sm) return null;
    for (const x of m.manifest.tools) x.auth = modeOf(m.entries, x) ?? x.auth;
    m.manifest.auth = `${otherMode(sm)} (mặc định)`;
    return m;
  }],
  ["MT5", "endpoint trỏ route không có", MCP_MSG.noRoute, (b) => {
    const m = clone(b);
    const t = firstTool(m);
    if (!t) return null;
    t.endpoint = "/api/v1/khong-co";
    return m;
  }],
  ["MT6", "method ngoài methods của sổ", MCP_MSG.method, (b) => {
    const m = clone(b);
    const t = firstTool(m);
    const e = t && m.entries.find((x) => `/api/${x.route}` === t.endpoint);
    const other = e && ["GET", "POST", "PUT", "PATCH", "DELETE"].find((x) => !e.methods.includes(x));
    if (!other) return null;
    t.method = other;
    return m;
  }],
  ["MT7", "sổ đổi chế độ route của một công cụ, bản khai giữ nguyên", MCP_MSG.mode, (b) => {
    const m = clone(b);
    const t = firstTool(m);
    const e = t && m.entries.find((x) => `/api/${x.route}` === t.endpoint);
    if (!e) return null;
    e.mode = otherMode(e.mode);
    return m;
  }],
  ["MT8", "auth lạ «bearer»", MCP_MSG.badMode, (b) => {
    const m = clone(b);
    const t = firstTool(m);
    if (!t) return null;
    t.auth = "bearer";
    return m;
  }],
  ["MT9", "bỏ endpoint", MCP_MSG.noRoute, (b) => {
    const m = clone(b);
    const t = firstTool(m);
    if (!t) return null;
    delete t.endpoint;
    return m;
  }],
  ["MT10", "bỏ method", MCP_MSG.method, (b) => {
    const m = clone(b);
    const t = firstTool(m);
    if (!t) return null;
    delete t.method;
    return m;
  }],
];

const HISTORIC_SHA = "1c6389b";

/** B0: bản khai + sổ ở commit trước vòng, đọc bằng git (không chép tay). Lịch sử vắng → ném lỗi có tên. */
async function loadHistoric() {
  const show = (p) => {
    try {
      return execFileSync("git", ["-C", root, "show", `${HISTORIC_SHA}:${p}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    } catch {
      throw new Error(`thiếu lịch sử git ${HISTORIC_SHA}`);
    }
  };
  const manifest = JSON.parse(show(MANIFEST));
  const dir = mkdtempSync(path.join(os.tmpdir(), "mcp-tools-b0-"));
  try {
    const f = path.join(dir, "api-surface.ts");
    writeFileSync(f, show("app/src/lib/api-surface.ts"));
    const { API_SURFACE } = await import(pathToFileURL(f).href);
    return { entries: API_SURFACE, manifest };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** W1: chạy check-portal-compliance trên bản chép của cây; `manifest` (nếu có) ghi đè bản khai trong bản chép. */
function portalOnCopy(manifest) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "mcp-tools-w1-"));
  try {
    // Chép trọn cây kho biết (đã track + chưa track không bị ignore) — làn portal đọc nhiều thư mục, không đoán từng phụ thuộc.
    const listed = execFileSync("git", ["-C", root, "ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    for (const f of listed.split("\0").filter(Boolean)) {
      if (!existsSync(path.join(root, f))) continue; // tệp đã xoá trên đĩa mà index còn
      mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
      cpSync(path.join(root, f), path.join(dir, f));
    }
    symlinkSync(path.join(root, "app/node_modules"), path.join(dir, "app/node_modules"));
    if (manifest) writeFileSync(path.join(dir, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
    const r = spawnSync(process.execPath, [path.join(dir, "scripts/check-portal-compliance.mjs")], { encoding: "utf8" });
    return { code: r.status, out: `${r.stdout}${r.stderr}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const mode = process.argv[2] ?? "static";
  const fails = [];
  const check = (ok, msg) => {
    console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
    if (!ok) fails.push(msg);
  };
  const base = { entries: await loadEntries(), manifest: loadManifest() };
  const r = checkMcpTools(base);
  const summary = (x) => `mcp-tools: ${x.lines.length}/${x.tools} công cụ khớp sổ`;
  if (mode === "static") {
    for (const l of r.lines) check(true, l);
    for (const v of r.violations) check(false, v);
    console.log(`ok   khoá auth gốc: ${r.fallback ? `khai mặc định ${r.fallback}` : "không khai chế độ chung"}`);
    check(r.violations.length === 0 && r.tools > 0, summary(r));
  } else if (mode === "mutation") {
    check(r.violations.length === 0 && r.tools > 0, `bản nguyên ĐẠT — ${summary(r)}${r.violations.length ? ` (${r.violations.join("; ")})` : ""}`);
    for (const [id, name, want, mutate] of MCP_MUTATIONS) {
      const m = mutate(base);
      if (!m) {
        check(false, `${id} «${name}» không áp được lên bản khai/sổ hiện tại`);
        continue;
      }
      const got = checkMcpTools(m).violations;
      if (want === null) check(got.length === 0, `${id} «${name}» ĐẠT (${got.length} vi phạm${got.length ? `: ${got.join("; ")}` : ""})`);
      else check(got.some((v) => v.includes(`: ${want}`)), `${id} «${name}» TRƯỢT với «${want}»${got.length ? "" : " (không vi phạm nào)"}`);
    }
    const hash = () => createHash("sha256").update(readFileSync(path.join(root, MANIFEST))).digest("hex");
    const before = hash();
    const clean = portalOnCopy(null);
    const firstBad = (out) => out.split("\n").find((l) => l.trim() && !l.startsWith("ok ")) ?? "";
    check(clean.code === 0, `W1 bản chép nguyên → portal-compliance exit 0 (exit ${clean.code}${clean.code ? `: ${firstBad(clean.out)}` : ""})`);
    const mt1 = MCP_MUTATIONS[0][3](base);
    const bad = mt1 ? portalOnCopy(mt1.manifest) : { code: null, out: "" };
    check(
      bad.code === 1 && /FAIL công cụ MCP/.test(bad.out),
      `W1 bản chép với bản khai MT1 → portal-compliance exit 1, dòng FAIL nhắc «công cụ MCP» (exit ${bad.code})`,
    );
    check(hash() === before, `W1 bản khai thật không đổi byte (${MANIFEST})`);
  } else if (mode === "historic") {
    let hist = null;
    try {
      hist = await loadHistoric();
    } catch (e) {
      check(false, String(e.message));
    }
    if (hist) {
      const got = checkMcpTools(hist).violations;
      check(
        got.some((v) => v.startsWith("oneinvest_get_offers: ") && v.includes(`: ${MCP_MSG.mode}`)),
        `B0 «bản khai + sổ ở ${HISTORIC_SHA} (trước vòng)» TRƯỢT với «${MCP_MSG.mode}»${got.length ? ` — ${got.join("; ")}` : " (không vi phạm nào)"}`,
      );
    }
    check(r.violations.length === 0 && r.tools > 0, `B0+ bản khai HEAD với sổ HEAD ĐẠT — ${summary(r)}`);
  } else {
    console.error(`chế độ lạ: ${mode} (static | mutation | historic)`);
    process.exit(2);
  }
  console.log(fails.length === 0 ? `\nmcp-tools ${mode}: ĐẠT` : `\nmcp-tools ${mode}: ${fails.length} lỗi`);
  process.exit(fails.length === 0 ? 0 : 1);
}
