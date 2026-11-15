// ban-chay-e8.mjs — hồ sơ du-an-cua-tin-len-dinh-vi (DV7) E8: dựng bản chạy cho ca nhìn màn.
// Trên DB thử oneinvest_u1_dv7 (bản chép dữ liệu thật của máy thu, db/db-thu.sh): áp 105 của nhánh, làm tươi 600 bằng
// đúng đường CLI của cloud-sync (pipeline/refresh-data-flow.mjs), rồi in số kỳ vọng mà màn phải hiện — đếm ĐỘC LẬP từ
// view offer_project (status mot_du_an theo nguồn, cửa sổ all/7d) và locatedPending đọc từ data_flow_snapshot vừa ghi.
// Không bao giờ chạy trên oneinvest. In lệnh bản chạy (dev :3460 trỏ DB thử) và lệnh tạo tài khoản ops thử.
//   node _acceptance/du-an-cua-tin-len-dinh-vi/probes/ban-chay-e8.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const GOC = join(import.meta.dirname, "../../..");
const DB = process.env.DV7_E8_DB ?? "oneinvest_u1_dv7";
if (!/^oneinvest_[a-z0-9_]+$/.test(DB) || DB === "oneinvest") { console.error(`ban-chay-e8: DB thử sai tên: ${DB}`); process.exit(2); }
const URL = `postgres://oneinvest:oneinvest@localhost:5433/${DB}`;
const pg = createRequire(join(GOC, "app/package.json"))("pg");

const psql = (sql) => execFileSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", "one-invest-db",
  "psql", "-U", "oneinvest", "-h", "localhost", "-d", DB, "-q", "-v", "ON_ERROR_STOP=1"], { input: sql, stdio: ["pipe", "inherit", "inherit"] });

psql(readFileSync(join(GOC, "db/migrations/105_offer_project.sql"), "utf8"));
console.log(`áp 105: xong trên ${DB}`);

execFileSync(process.execPath, [join(GOC, "pipeline/refresh-data-flow.mjs"), join(GOC, "pipeline/sql/600_data_flow.sql")],
  { env: { ...process.env, DATABASE_URL: URL }, stdio: "inherit", cwd: join(GOC, "pipeline") });

const c = new pg.Client({ connectionString: URL });
await c.connect();
try {
  // Đếm độc lập S03 (không đọc view): quy nút lên dự án gốc bằng mảng đường đi, tin có đúng một gốc; cửa sổ theo
  // first_seen giờ VN như 600 (cùng câu với pipeline/scripts/offer-project-that.mjs). S06 đếm thẳng s06_offer_project.
  const DEM = `
    WITH RECURSIVE len(node_id, cur, loai, cha, duong) AS (
      SELECT id, id, node_type, parent_id, ARRAY[id] FROM asset_nodes
      UNION ALL
      SELECT l.node_id, a.id, a.node_type, a.parent_id, l.duong || a.id
        FROM len l JOIN asset_nodes a ON a.id = l.cha
       WHERE l.loai <> 'project' AND NOT a.id = ANY (l.duong)
    ), goc AS (SELECT node_id, cur AS goc FROM len WHERE loai = 'project'),
    tin_goc AS (
      SELECT o.offer_id, o.first_seen, array_agg(DISTINCT g.goc) AS gocs
        FROM sale_offers o, unnest(o.post_ids) b(pid)
        JOIN field_assertions f ON f.subject_key = 'S03:' || b.pid AND f.field = 'project_node_id' AND f.retracted_at IS NULL
        JOIN goc g ON g.node_id::text = f.value
       WHERE o.source = 'S03'
       GROUP BY o.offer_id, o.first_seen)
    SELECT count(*)::int AS all_, count(*) FILTER (WHERE (first_seen AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
             >= (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - 6)::int AS d7
      FROM tin_goc WHERE cardinality(gocs) = 1`;
  const [dl] = (await c.query(DEM)).rows;
  const { rows: snap } = await c.query(`
    SELECT time_window, e->>'source' AS source, (e->>'located')::int AS located, (e->>'locatedPending')::int AS pending
    FROM data_flow_snapshot, jsonb_array_elements(facts->'sources') e
    WHERE time_window IN ('7d', 'all') ORDER BY 1, 2`);
  console.log(`ky_vong S03 located (đếm độc lập): all ${dl.all_} · 7d ${dl.d7}`);
  for (const r of snap) console.log(`snapshot ${r.time_window} ${r.source}: located ${r.located} · locatedPending ${r.pending}`);
  const s03 = (w) => snap.find((r) => r.time_window === w && r.source === "S03")?.located;
  if (s03("all") !== dl.all_ || s03("7d") !== dl.d7) { console.error("ban-chay-e8: snapshot S03 located lệch đếm độc lập"); process.exitCode = 1; }
} finally {
  await c.end();
}
console.log(`ban chay: cd app && DATABASE_URL=${URL} npm run dev -- -p 3460`);
console.log(`tai khoan: DATABASE_URL=${URL} node scripts/dev-ops-account.mjs --vai ops`);
