// dem-ma-dai.mjs — s06-vung-moi-len-canonical AC-10: CHỈ ĐỌC — đếm mọi dòng còn trỏ mã thị trường dài
// vn-(thanh-pho|tinh)-<x> ở mọi khoá ngoại tới areas (liệt từ catalog) và các cột chữ area_id/market_id không khoá ngoại.
// Bước chặn trước khi áp 064 ở máy thu: sync đẩy areas lên cloud và xoá dòng không còn ở local, nên cloud phải sạch.
//   DATABASE_URL=… node scripts/s06-vung-moi/dem-ma-dai.mjs          # một DB Postgres (bản chép, máy thu)
//   node scripts/s06-vung-moi/dem-ma-dai.mjs --cloud                  # cloud qua Management API (Mạnh chạy, chỉ đọc)
// Thoát 0 = không còn dòng nào ở khoá ngoại; 1 = còn (một dòng mỗi bảng); 2 = không đọc được. Cột chữ không khoá ngoại
// (area_sources…) chỉ BÁO, không chặn: chúng đi theo local qua sync hay do 064 đổi cùng lượt, không làm sync lỗi/xoá lặng.
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const MA_DAI = "^vn-(thanh-pho|tinh)-";

/** Bảng/cột cần đếm: mọi khoá ngoại tới areas (catalog) ∪ cột chữ area_id/market_id không khoá ngoại; bỏ chính areas.id. */
export async function danhSachCot(exec) {
  const fks = await exec(`
    SELECT c.conrelid::regclass::text AS bang, a.attname AS cot, true AS fk
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
     WHERE c.contype = 'f' AND c.confrelid = 'public.areas'::regclass`);
  const chu = await exec(`
    SELECT c.table_name AS bang, c.column_name AS cot, false AS fk
      FROM information_schema.columns c
      JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name
     WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
       AND c.column_name IN ('area_id', 'market_id') AND c.data_type IN ('text', 'character varying')`);
  const thay = new Map();
  for (const r of [...fks, ...chu]) {
    const k = `${r.bang}.${r.cot}`;
    if (!thay.has(k) || r.fk) thay.set(k, { bang: r.bang, cot: r.cot, fk: r.fk === true || r.fk === "t" });
  }
  return [...thay.values()].sort((a, b) => `${a.bang}.${a.cot}`.localeCompare(`${b.bang}.${b.cot}`));
}

/** @param {(sql: string) => Promise<object[]>} exec */
export async function demMaDai(exec) {
  const cot = await danhSachCot(exec);
  const con = [];
  for (const c of cot) {
    const [{ n }] = await exec(`SELECT count(*)::int AS n FROM ${c.bang} WHERE "${c.cot}" ~ '${MA_DAI}'`);
    if (Number(n) > 0) con.push({ ...c, n: Number(n) });
  }
  return { cot, con };
}

async function main() {
  let exec;
  if (process.argv.includes("--cloud")) {
    const { mgmtExec } = await import("../../pipeline/sync-cloud.mjs");
    const { readFile } = await import("node:fs/promises");
    const { homedir } = await import("node:os");
    const env = await readFile(`${homedir()}/.oneinvest/cloud.env`, "utf8");
    const token = process.env.SUPABASE_MGMT_TOKEN ?? env.match(/SUPABASE_MGMT_TOKEN=(\S+)/)?.[1];
    if (!token) throw new Error("thiếu SUPABASE_MGMT_TOKEN trong ~/.oneinvest/cloud.env");
    exec = mgmtExec(token);
  } else {
    const pg = createRequire(new URL("../../pipeline/package.json", import.meta.url))("pg");
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
    await client.connect();
    exec = async (sql) => (await client.query(sql)).rows;
    process.on("exit", () => client.end());
  }
  const { cot, con } = await demMaDai(exec);
  const chan = con.filter((c) => c.fk);
  for (const c of chan) console.log(`dem-ma-dai: ${c.bang}.${c.cot} còn ${c.n} dòng trỏ mã dài (khoá ngoại — chặn)`);
  for (const c of con.filter((c) => !c.fk)) console.log(`dem-ma-dai: báo ${c.bang}.${c.cot} còn ${c.n} dòng trỏ mã dài (cột chữ — không chặn)`);
  console.log(`dem-ma-dai: ${chan.length ? `${chan.length} khoá ngoại còn mã dài` : "sạch"} — đã đếm ${cot.length} cột`);
  return chan.length ? 1 : 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((rc) => process.exit(rc), (e) => { console.error(`dem-ma-dai: không đọc được — ${e.message}`); process.exit(2); });
}
