#!/usr/bin/env node
// Ma trận HÀNH VI của sổ bề mặt API (hồ sơ so-be-mat-api, AC-3) trên app ĐANG CHẠY (mặc định http://localhost:3456, đổi
// bằng BASE_URL). Gọi MỌI route × MỌI phương thức trong app/src/lib/api-surface.ts hai lần — như khách và chỉ mang bearer
// OPS_API_TOKEN — rồi so với chế độ sổ khai. Luật: sổ rộng bằng hoặc hơn mã — mã cho qua một người gọi mà chế độ không
// cho là VI PHẠM; mã chặt hơn sổ chỉ in ghi chú. Đo hành vi nên mã viết kiểu gì cũng bị bắt (đổi khuôn sau dừng-vá S4-r2).
//
// Không ghi gì:
//   - khách gọi mọi phương thức — mọi route kiểm quyền TRƯỚC nên khách dừng ở 401/404, không chạm handler;
//   - bearer chỉ gọi GET, và phương thức ghi ở route mà sổ CẤM bearer (ops-session/admin) hoặc session-or-noop. Ở route
//     sổ đã cho bearer, lời gọi bearer tới phương thức ghi không thể sinh vi phạm mà có thể gây tác dụng phụ thật —
//     sự cố S3 23/10: DELETE /api/v1/ops/zalo/accounts thân rỗng chạy `openclaw channels logout --account ""` (không hỏng
//     gì, để lại 2 dòng ops_audit) — nên KHÔNG gọi, in một dòng «bỏ qua».
// Đoạn động `[id]` thay bằng chuỗi không hợp lệ. Không cần DB (chỉ HTTP). Token lấy từ env OPS_API_TOKEN, thiếu thì app/.env.local.
//   node scripts/smoke-api-matrix.mjs            — sổ thật phải 0 vi phạm
//   node scripts/smoke-api-matrix.mjs --tu-thu   — cùng lời gọi, so với bản sổ CỐ Ý sai: phải bắt đủ lỗi cài sẵn
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.env.BASE_URL ?? "http://localhost:3456").replace(/\/$/, "");
const TU_THU = process.argv.includes("--tu-thu");

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

function opsToken() {
  if (process.env.OPS_API_TOKEN) return process.env.OPS_API_TOKEN;
  const f = path.join(root, "app/.env.local");
  if (!existsSync(f)) return "";
  const line = readFileSync(f, "utf8")
    .split("\n")
    .find((l) => /^\s*OPS_API_TOKEN\s*=/.test(l));
  return line ? line.replace(/^\s*OPS_API_TOKEN\s*=\s*/, "").trim().replace(/^(["'])(.*)\1$/, "$2") : "";
}

// Ai được qua theo chế độ (chỉ hai người gọi đo ở đây: khách, bearer). session-or-noop: cả hai phải nhận đúng 204.
const ALLOWED = {
  public: ["khách", "bearer"],
  ops: ["bearer"],
  "ops-session": [],
  admin: [],
  "session-or-noop": [],
};
// Bị từ chối = 401, hoặc 404 «not found» (route admin giấu sự tồn tại với người không phải admin).
const denied = (r) => r.status === 401 || (r.status === 404 && r.body.trim() === "not found");

/** Vi phạm của một bộ kết quả so với một bản sổ: mỗi phần tử là chuỗi có tên route + phương thức + người gọi. */
export function evaluate(results, entries) {
  const byRoute = new Map(entries.map((e) => [e.route, e]));
  const violations = [];
  const notes = [];
  for (const r of results) {
    const e = byRoute.get(r.route);
    if (!e) continue;
    if (e.mode === "session-or-noop") {
      if (r.status !== 204) violations.push(`${r.route} ${r.method}: ${r.caller} nhận ${r.status}, sổ khai session-or-noop (phải 204)`);
      continue;
    }
    const allowedBySo = ALLOWED[e.mode].includes(r.caller);
    if (!denied(r) && !allowedBySo) violations.push(`${r.route} ${r.method}: mã cho ${r.caller} mà sổ khai ${e.mode} (${r.status})`);
    if (denied(r) && allowedBySo && e.mode !== "public") notes.push(`${r.route} ${r.method}: mã chặt hơn sổ — ${r.caller} bị từ chối (${r.status})`);
  }
  return { violations, notes };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { API_SURFACE } = await import(path.join(root, "app/src/lib/api-surface.ts"));
  const token = opsToken();
  if (!token) {
    console.log("FAIL thiếu OPS_API_TOKEN (env hoặc app/.env.local) — không đo được người gọi bearer");
    process.exit(1);
  }
  const results = [];
  const skipped = [];
  for (const e of API_SURFACE) {
    const url = `${BASE}/api/${e.route.replace(/\[[^\]]+\]/g, "khong-hop-le")}`;
    for (const method of e.methods) {
      for (const caller of ["khách", "bearer"]) {
        if (caller === "bearer" && method !== "GET" && ALLOWED[e.mode].includes("bearer")) {
          skipped.push(`${e.route} ${method}`);
          continue;
        }
        const headers = caller === "bearer" ? { authorization: `Bearer ${token}` } : {};
        const init = { method, redirect: "manual", headers: { ...headers } };
        if (method !== "GET") {
          init.headers["content-type"] = "application/json";
          init.body = "{}";
        }
        const res = await fetch(url, init);
        results.push({ route: e.route, method, caller, status: res.status, body: await res.text() });
      }
    }
  }

  const real = evaluate(results, API_SURFACE);
  if (!TU_THU) {
    for (const r of results) {
      const e = API_SURFACE.find((x) => x.route === r.route);
      if (e.mode !== "public") console.log(`     ${r.route} ${r.method} ${r.caller}: ${r.status}${denied(r) ? " (từ chối)" : ""} — sổ ${e.mode}`);
    }
    for (const n of real.notes) console.log(`note ${n}`);
    for (const k of skipped) console.log(`bỏ qua ${k} bearer — phương thức ghi ở route sổ đã cho bearer (không thể vi phạm, tránh tác dụng phụ)`);
    for (const v of real.violations) check(false, v);
    check(real.violations.length === 0, `ma trận hành vi: ${results.length} lời gọi, ${real.violations.length} lần mã cho người gọi mà sổ không cho`);
  } else {
    // Sổ cố ý sai: một route công khai khai chặt, hai route nhận bearer khai «chỉ quản trị».
    const WRONG = { "v1/markets": "ops", "v1/offers": "admin", "v1/ops/audit": "admin" };
    const wrong = API_SURFACE.map((e) => (WRONG[e.route] ? { ...e, mode: WRONG[e.route] } : e));
    const got = evaluate(results, wrong).violations;
    check(real.violations.length === 0, `bản sổ thật: 0 vi phạm (${real.violations.length})`);
    for (const [route, mode] of Object.entries(WRONG)) {
      const hit = got.find((v) => v.startsWith(`${route} `) && v.includes(`mà sổ khai ${mode}`));
      check(Boolean(hit), `sổ cài sai ${route} → ${mode}: bắt được «${hit ?? "không vi phạm nào"}»`);
    }
    check(got.length >= Object.keys(WRONG).length, `bản sổ sai: bắt ${Object.keys(WRONG).length}/${Object.keys(WRONG).length} lỗi cài sẵn (${got.length} dòng vi phạm)`);
  }
  console.log(fails.length === 0 ? `\napi-matrix${TU_THU ? " tu-thu" : ""}: ĐẠT` : `\napi-matrix${TU_THU ? " tu-thu" : ""}: ${fails.length} lỗi`);
  process.exit(fails.length === 0 ? 0 : 1);
}
