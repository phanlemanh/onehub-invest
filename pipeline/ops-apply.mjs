#!/usr/bin/env node
// ops-apply.mjs — bộ áp lệnh ở máy thu (TV4 `so-lenh-bo-ap`, ADR-0015 §2–3, §7–8). Một lượt:
//   0 phanh: có tệp `<thư mục cấu hình>/ops-apply.dung` → thoát 0, không gọi cloud, không đổi gì;
//   1 kéo lệnh đã duyệt: GET <cloud>/api/v1/ops/change-requests/pull bằng token máy `ops:pull` (chỉ gọi RA ngoài);
//   2–5 mỗi lệnh: kiemLenh rồi apLenh (một giao dịch, sổ áp chống lặp, kiểm sau hỏng thì hoàn tác) — lib/lenh.mjs;
//   6 báo kết quả NGAY trong lượt qua `push-ops-facts.mjs --chi-lenh` (đường đã có, bộ soát tầng A), không chờ chu kỳ 15′.
// Thoát: 0 xong hoặc phanh · 1 báo kết quả hỏng (sổ áp giữ kết quả, lượt sau báo lại) · 2 thiếu token, cloud lỗi/không tới.
// Env: OPS_APPLY_CLOUD (gốc URL cloud), OPS_APPLY_CONFIG_DIR (mặc định ~/.oneinvest), DATABASE_URL, INGEST_URL.
// Token đọc từ env OPS_MACHINE_TOKEN hoặc `<thư mục cấu hình>/cloud.env` — không bao giờ in ra.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { apLenh } from "./lib/lenh.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CLOUD = (process.env.OPS_APPLY_CLOUD ?? "https://onehub-invest.vercel.app").replace(/\/$/, "");
const CAU_HINH = process.env.OPS_APPLY_CONFIG_DIR ?? path.join(homedir(), ".oneinvest");
const LOCAL_URL = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

function tokenMay() {
  if (process.env.OPS_MACHINE_TOKEN) return process.env.OPS_MACHINE_TOKEN;
  const tep = path.join(CAU_HINH, "cloud.env");
  if (!existsSync(tep)) return undefined;
  return readFileSync(tep, "utf8").match(/OPS_MACHINE_TOKEN=(\S+)/)?.[1];
}

async function keo(token) {
  const c = new AbortController();
  const hen = setTimeout(() => c.abort(), 15_000);
  try {
    const res = await fetch(`${CLOUD}/api/v1/ops/change-requests/pull`, {
      headers: { authorization: `Bearer ${token}` },
      signal: c.signal,
    });
    if (!res.ok) return { loi: `cloud trả ${res.status}` };
    const body = await res.json().catch(() => null);
    if (!body || !Array.isArray(body.commands)) return { loi: "phản hồi kéo sai khuôn (thiếu commands)" };
    return { commands: body.commands };
  } catch (e) {
    return { loi: `cloud không tới được (${e?.name === "AbortError" ? "quá 15 giây" : e?.cause?.code ?? e?.message})` };
  } finally {
    clearTimeout(hen);
  }
}

async function main() {
  if (existsSync(path.join(CAU_HINH, "ops-apply.dung"))) {
    console.log("ops-apply: phanh đang bật (ops-apply.dung) — không kéo lệnh, không áp");
    return 0;
  }
  const token = tokenMay();
  if (!token) {
    console.error("ops-apply: thiếu OPS_MACHINE_TOKEN (token máy ops:pull) — không gọi cloud");
    return 2;
  }
  const { commands, loi } = await keo(token);
  if (loi) {
    console.error(`ops-apply: ${loi} — không áp gì`);
    return 2;
  }
  if (commands.length === 0) {
    console.log("ops-apply: 0 lệnh chờ áp");
    return 0;
  }
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? LOCAL_URL });
  await client.connect();
  const results = [];
  try {
    for (const cmd of commands) {
      if (typeof cmd?.id !== "string" || typeof cmd?.idempotency_key !== "string") {
        console.error("ops-apply: bỏ một lệnh thiếu id hoặc idempotency_key");
        continue;
      }
      results.push(await apLenh(client, cmd));
    }
  } finally {
    await client.end();
  }
  const tam = mkdtempSync(path.join(tmpdir(), "ops-apply-"));
  try {
    const tep = path.join(tam, "ket-qua.json");
    writeFileSync(tep, JSON.stringify({ results }));
    const r = spawnSync(process.execPath, [path.join(DIR, "push-ops-facts.mjs"), "--chi-lenh", tep], {
      env: { ...process.env, OPS_MACHINE_TOKEN: token },
      encoding: "utf8",
    });
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
    const dem = results.reduce((m, k) => ({ ...m, [k.outcome]: (m[k.outcome] ?? 0) + 1 }), {});
    console.log(`ops-apply: ${results.length} lệnh — ${Object.entries(dem).map(([k, n]) => `${k} ${n}`).join(" · ")}`);
    if (r.status !== 0) {
      console.error("ops-apply: báo kết quả hỏng — sổ áp giữ kết quả, lượt sau báo lại");
      return 1;
    }
    return 0;
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
}

main().then((code) => process.exit(code), (e) => {
  console.error(`ops-apply: ${e?.message ?? e}`);
  process.exit(1);
});
