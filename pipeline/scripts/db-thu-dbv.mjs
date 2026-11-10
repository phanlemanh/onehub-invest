// db-thu-dbv.mjs — khung DB thử của hồ sơ danh-ba-toa-truc-can (DB1): tạo DB trống trên :5433, dựng lược đồ từ
// db/migrations bằng scripts/ci-db-init.mjs (cùng đường CI), xoá khi xong. Không bao giờ đụng DB `oneinvest`.
// DBV_MIG_THAY=<tệp> thay migration cùng tên bằng bản chép (chiều đỏ của phép đo); hetSo giới hạn migration ≤ số đó.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import pg from "pg";

export const GOC = join(import.meta.dirname, "../..");
export const MAY_CHU = process.env.DBV_PG_SERVER ?? "postgres://oneinvest:oneinvest@localhost:5433";

/** Thư mục migration tạm: chép db/migrations (≤ hetSo nếu có), thay tệp theo DBV_MIG_THAY. */
export function thuMucMigration({ hetSo = null, thay = process.env.DBV_MIG_THAY ?? null } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "dbv-mig-"));
  for (const f of readdirSync(join(GOC, "db/migrations"))) {
    if (!f.endsWith(".sql")) continue;
    if (hetSo !== null && Number(f.slice(0, 3)) > hetSo) continue;
    copyFileSync(join(GOC, "db/migrations", f), join(dir, f));
  }
  if (thay) copyFileSync(thay, join(dir, basename(thay)));
  return dir;
}

async function quanTri(sql) {
  const c = new pg.Client({ connectionString: `${MAY_CHU}/postgres` });
  await c.connect();
  try {
    await c.query(sql);
  } finally {
    await c.end();
  }
}

/** Tạo DB trống `ten`, dựng lược đồ; trả chuỗi kết nối. */
export async function taoDbThu(ten, opts = {}) {
  if (!/^oneinvest_dbv_[a-z0-9_]+$/.test(ten)) throw new Error(`tên DB thử phải mở đầu oneinvest_dbv_: ${ten}`);
  await quanTri(`DROP DATABASE IF EXISTS ${ten} WITH (FORCE)`);
  await quanTri(`CREATE DATABASE ${ten}`);
  const url = `${MAY_CHU}/${ten}`;
  const dir = thuMucMigration(opts);
  try {
    execFileSync(process.execPath, [join(GOC, "scripts/ci-db-init.mjs"), "--migrations", dir], {
      env: { ...process.env, DATABASE_URL: url },
      stdio: ["ignore", "pipe", "pipe"],
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return url;
}

/** Áp một tệp SQL lên DB thử bằng psql trong container (như áp migration ở máy: từng câu, dừng ở lỗi đầu). */
export function apTep(ten, tep) {
  const sql = readFileSync(tep);
  return execFileSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db", "psql", "-U", "oneinvest",
    "-h", "localhost", "-d", ten, "-v", "ON_ERROR_STOP=1", "-q"], { input: sql, stdio: ["pipe", "pipe", "pipe"] }).toString();
}

export async function xoaDbThu(ten) {
  if (!/^oneinvest_dbv_[a-z0-9_]+$/.test(ten)) return;
  await quanTri(`DROP DATABASE IF EXISTS ${ten} WITH (FORCE)`);
}
