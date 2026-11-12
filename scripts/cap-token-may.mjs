#!/usr/bin/env node
// cap-token-may.mjs — cấp hoặc thu hồi token máy theo tên (TV4 `so-lenh-bo-ap`, ADR-0015 §2; so-lenh-sua-sau-tv4).
//
//   node scripts/cap-token-may.mjs --name may-thu-1 --scope ops:pull --qua-mgmt --ghi-cloud-env   # từ máy thu, lên cloud
//   node scripts/cap-token-may.mjs --thu-hoi may-thu-1 --qua-mgmt                                 # thu hồi trên cloud
//   DATABASE_URL=… node scripts/cap-token-may.mjs --name may-thu-1 --scope ops:pull               # DB qua pg, token ra stdout
//   DATABASE_URL=… node scripts/cap-token-may.mjs --thu-hoi may-thu-1
//
// DB chỉ giữ băm sha256 hex của token; token không vào log nào. `--qua-mgmt`: gọi Supabase Management API bằng
// SUPABASE_MGMT_TOKEN trong ~/.oneinvest/cloud.env (máy thu không nối được Postgres cloud trực tiếp). `--ghi-cloud-env`:
// token không in ra mà nối dòng OPS_MACHINE_TOKEN=… vào ~/.oneinvest/cloud.env trên dòng riêng; tệp đã có
// OPS_MACHINE_TOKEN thì từ chối trước khi chạm cloud. Tên trùng một token còn hiệu lực → thoát 2, tệp không đổi.
import { createHash, randomBytes } from "node:crypto";
import { appendFileSync, existsSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const docEnv = (tep) => {
  const o = {};
  if (!existsSync(tep)) return o;
  for (const d of readFileSync(tep, "utf8").split("\n")) {
    const m = d.match(/^\s*(?:export\s+)?([A-Z0-9_]+)=(.*)$/);
    if (m) o[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return o;
};

/** Đường mgmt: một câu SQL không tham số → mảng dòng. Giá trị nội suy đều đã kiểm khuôn chặt trước đó. */
async function execMgmt(home, fetchImpl) {
  const khoa = docEnv(path.join(home, ".oneinvest", "cloud.env")).SUPABASE_MGMT_TOKEN;
  if (!khoa) return null;
  const { mgmtExec } = await import(pathToFileURL(path.join(REPO, "pipeline", "sync-cloud.mjs")).href);
  const exec = mgmtExec(khoa, { fetchImpl, retries: 0 });
  return async (sql) => {
    const r = await exec(sql, { retry: false });
    return Array.isArray(r) ? r : [];
  };
}

/** Đường pg cũ (DB thử, DB máy thu): câu có tham số. */
async function execPg(url) {
  const pg = createRequire(path.join(REPO, "app", "package.json"))("pg");
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  return { q: async (sql, args) => (await c.query(sql, args)).rows, dong: () => c.end() };
}

/**
 * Hàm chính, test gọi trực tiếp. `exec` (tuỳ chọn) thay cả đường mgmt: (sql) => Promise<rows[]>.
 * @returns {Promise<number>} mã thoát
 */
export async function chay({ argv = process.argv.slice(2), home = homedir(), env = process.env, fetchImpl = globalThis.fetch, exec, out = process.stdout, err = process.stderr } = {}) {
  const doc = (ten) => {
    const i = argv.indexOf(ten);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const co = (ten) => argv.includes(ten);
  const bao = (s) => err.write(`cap-token-may: ${s}\n`);
  const ten = doc("--name");
  const thuHoi = doc("--thu-hoi");
  if (!ten === !thuHoi) {
    bao("dùng đúng một trong --name <tên> --scope <s,…> hoặc --thu-hoi <tên>");
    return 2;
  }
  const tenXet = ten ?? thuHoi;
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(tenXet)) {
    bao("tên chỉ gồm chữ thường, số, gạch ngang");
    return 2;
  }
  const quaMgmt = co("--qua-mgmt");
  const ghiEnv = co("--ghi-cloud-env");
  const tepEnv = path.join(home, ".oneinvest", "cloud.env");
  let scopes = [];
  if (ten) {
    scopes = (doc("--scope") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (scopes.length === 0 || scopes.some((s) => !/^[a-z]+:[a-z]+$/.test(s))) {
      bao("thiếu hoặc sai --scope (dạng ops:pull)");
      return 2;
    }
    if (ghiEnv && "OPS_MACHINE_TOKEN" in docEnv(tepEnv)) {
      bao(`${tepEnv} đã có OPS_MACHINE_TOKEN — đã có token; xoá dòng đó (và thu hồi tên cũ) trước khi cấp lại`);
      return 2;
    }
  }

  // Dựng bộ chạy câu SQL theo đường.
  let q;
  let dong = async () => {};
  if (quaMgmt) {
    const e = exec ?? (await execMgmt(home, fetchImpl));
    if (!e) {
      bao(`thiếu SUPABASE_MGMT_TOKEN trong ${tepEnv}`);
      return 2;
    }
    const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
    q = (sql, args) => e(sql.replace(/\$(\d+)/g, (_, i) => {
      const v = args[Number(i) - 1];
      return Array.isArray(v) ? `ARRAY[${v.map(lit).join(",")}]::text[]` : lit(v);
    }));
  } else {
    const url = env.DATABASE_URL;
    if (!url) {
      bao("thiếu DATABASE_URL (hoặc dùng --qua-mgmt)");
      return 2;
    }
    const p = await execPg(url);
    q = p.q;
    dong = p.dong;
  }

  try {
    if (thuHoi) {
      const r = await q(`UPDATE machine_tokens SET revoked_at = now() WHERE name = $1 AND revoked_at IS NULL RETURNING name`, [thuHoi]);
      if (r.length === 0) {
        bao(`không có token còn hiệu lực tên ${thuHoi}`);
        return 2;
      }
      bao(`đã thu hồi ${thuHoi}`);
      return 0;
    }
    const token = `om_${randomBytes(32).toString("hex")}`;
    const bam = createHash("sha256").update(token).digest("hex");
    const r = await q(
      `INSERT INTO machine_tokens (name, token_hash, scopes) VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET token_hash = EXCLUDED.token_hash, scopes = EXCLUDED.scopes,
              created_at = now(), revoked_at = NULL, last_used_at = NULL
       WHERE machine_tokens.revoked_at IS NOT NULL
       RETURNING name`,
      [ten, bam, scopes],
    );
    if (r.length === 0) {
      bao(`tên ${ten} đang có token còn hiệu lực — thu hồi trước`);
      return 2;
    }
    if (ghiEnv) {
      const cu = existsSync(tepEnv) ? readFileSync(tepEnv, "utf8") : "";
      appendFileSync(tepEnv, `${cu && !cu.endsWith("\n") ? "\n" : ""}OPS_MACHINE_TOKEN=${token}\n`, { mode: 0o600 });
      bao(`đã cấp ${ten} (${scopes.join(", ")}) — token ghi vào ${tepEnv}, không in ra`);
    } else {
      out.write(`${token}\n`);
      bao(`đã cấp ${ten} (${scopes.join(", ")}) — token in một lần ở stdout`);
    }
    return 0;
  } finally {
    await dong();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  chay().then((code) => process.exit(code), (e) => {
    console.error(`cap-token-may: ${e.message}`);
    process.exit(1);
  });
}
