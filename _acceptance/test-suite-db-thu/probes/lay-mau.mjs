// lay-mau.mjs — hồ sơ test-suite-db-thu E5. Chạy một lệnh với PGAPPNAME riêng, lấy mẫu pg_stat_activity mỗi 100 ms (chỉ đọc, nối vào
// DB postgres) và đếm kết nối của lượt theo từng database. Thoát theo thước: DB `oneinvest` không có kết nối nào của lượt (đối chứng
// dương: lượt phải có kết nối ở DB khác, không thì bộ đếm không đo gì). In một dòng JSON.
// Giới hạn: kết nối dưới 100 ms và tiến trình con bị bỏ biến môi trường không mang PGAPPNAME nên bộ đếm không thấy; hai đường đó do lưới quét
// tĩnh DT-AC-7 của scripts/db-thu.test.mjs chặn.
// Chạy: node lay-mau.mjs <thư mục> <lệnh…>; CHI_DEM=1 chỉ in số, không xét thước (đo phần «trước»).
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg");
const [cwd, ...lenh] = process.argv.slice(2);
if (!cwd || lenh.length === 0) { console.error("cần <thư mục> <lệnh…>"); process.exit(2); }
const APP = `do-suite-${process.pid}`;
const c = new pg.Client({ connectionString: "postgres://oneinvest:oneinvest@localhost:5433/postgres", application_name: "lay-mau" });
await c.connect();
const thay = new Map(); // datname → Set(pid:backend_start)
const dinh = new Map();
const lay = setInterval(async () => {
  try {
    const { rows } = await c.query(`SELECT datname, pid, backend_start::text AS b FROM pg_stat_activity WHERE application_name = $1`, [APP]);
    const lanNay = new Map();
    for (const r of rows) {
      if (!thay.has(r.datname)) thay.set(r.datname, new Set());
      thay.get(r.datname).add(`${r.pid}:${r.b}`);
      lanNay.set(r.datname, (lanNay.get(r.datname) ?? 0) + 1);
    }
    for (const [d, n] of lanNay) dinh.set(d, Math.max(dinh.get(d) ?? 0, n));
  } catch { /* đang đóng */ }
}, 100);
const t0 = Date.now();
const p = spawn(lenh[0], lenh.slice(1), { cwd, env: { ...process.env, PGAPPNAME: APP }, stdio: ["ignore", "pipe", "inherit"] });
let raw = ""; // chỉ giữ phần đuôi: dòng tổng kết của node --test
p.stdout.on("data", (b) => { process.stdout.write(b); raw = (raw + b).slice(-2000); });
const so = (ten) => Number(raw.match(new RegExp(`ℹ ${ten} (\\d+)`))?.[1] ?? -1);
const ma = await new Promise((r) => p.on("exit", (code, sig) => r(code ?? (sig ? 128 : 1))));
clearInterval(lay);
await new Promise((r) => setTimeout(r, 300));
await c.end();
const moiDb = Object.fromEntries([...thay].map(([d, s]) => [d, s.size]));
const chung = moiDb.oneinvest ?? 0;
const khac = Object.entries(moiDb).filter(([d]) => d !== "oneinvest").reduce((t, [, n]) => t + n, 0);
console.log(JSON.stringify({ lenh: lenh.join(" ").slice(0, 80), exit: ma, ca: { tests: so("tests"), pass: so("pass"), fail: so("fail"), skipped: so("skipped") }, phut: +((Date.now() - t0) / 60000).toFixed(1), ket_noi_db_chung: chung, ket_noi_db_khac: khac, dinh: Object.fromEntries(dinh), moi_db: moiDb }));
if (process.env.CHI_DEM) process.exit(ma);
if (chung !== 0) { console.error(`lượt còn ${chung} kết nối vào DB chung oneinvest`); process.exit(1); }
if (khac === 0) { console.error("thước hỏng: không thấy kết nối nào của lượt ở DB nào"); process.exit(3); }
process.exit(ma);
