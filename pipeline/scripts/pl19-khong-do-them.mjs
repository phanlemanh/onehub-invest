// pl19-khong-do-them.mjs — thước E9b của tin-ngung-rao-khong-thay-lai (V6, sửa theo lời Mạnh 09/11 «Sửa E9b theo khuyến
// nghị»): bộ itest PL19 (trang-thai-chao + bac-du-lieu) chạy kèm 085 KHÔNG đỏ thêm ca nào so với bản gốc trên cùng DB.
// Bản gốc hôm nay đỏ sẵn AC-3 «cột và trục» (lệch sổ có từ trước, hàng riêng) — thước so tập ca đỏ, không đòi xanh trọn.
// Ba lượt trên cùng DB (mỗi ca của bộ PL19 tự ROLLBACK): gốc · kèm 085 · kèm bản chép 085 hỏng (đối chứng: bang_chung_chao
// bỏ nhánh tin S06 het_trong_luot — phải đỏ thêm ca gỡ trong lượt). Chạy từ pipeline/ với DATABASE_URL của lượt:
//   bash ../db/db-thu.sh oneinvest_suite_tnr19 --chay node scripts/pl19-khong-do-them.mjs
// Thoát 0 khi kèm 085 không đỏ thêm và đối chứng đỏ thêm; 1 khi ngược lại.
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PIPE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEP_085 = path.join(PIPE, "..", "db/migrations/085_ngung_rao_khong_thay_lai.sql");
const BO = ["scripts/trang-thai-chao.itest.mjs", "scripts/bac-du-lieu.itest.mjs"];
const NHANH_HET = "\n         OR (r.retired_at IS NOT NULL AND r.retired_reason = 'het_trong_luot' AND r.source = 'S06'))";

/** Chạy bộ PL19 (nạp thêm `them` nếu có); trả tập tên ca đỏ. */
function chayBo(them) {
  const env = { ...process.env };
  if (them) env.PL19_NAP_THEM = them; else delete env.PL19_NAP_THEM;
  const r = spawnSync(process.execPath, ["--test", "--test-concurrency=1", "--test-reporter=tap", ...BO],
    { cwd: PIPE, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const tong = r.stdout.match(/^# tests (\d+)$/m);
  if (!tong) throw new Error(`không đọc được kết quả bộ PL19 (mã ${r.status}): ${r.stderr.slice(-500)}`);
  if (them && !r.stdout.includes(`PL19_NAP_THEM: ${path.basename(them)}`)) throw new Error(`bộ PL19 không nạp ${them}`);
  const do_ = new Set([...r.stdout.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1].trim()));
  return { do_, tong: Number(tong[1]) };
}
const them = (a, b) => [...b.do_].filter((x) => !a.do_.has(x));
const tenCa = (s) => [...s].join(" | ") || "—";

const sql = readFileSync(TEP_085, "utf8");
if (!sql.includes(NHANH_HET)) {
  console.error("pl19-khong-do-them: 085 không còn nhánh het_trong_luot của bang_chung_chao — sửa thước theo migration");
  process.exit(1);
}
const tepHong = path.join(PIPE, `.pl19-085-hong-${process.pid}.sql`);
writeFileSync(tepHong, sql.replace(NHANH_HET, ")"));
try {
  const goc = chayBo(null);
  const co085 = chayBo(TEP_085);
  const hong = chayBo(tepHong);
  console.log(`PL19_NAP_THEM: ${path.basename(TEP_085)}`);
  console.log(`pl19-khong-do-them: gốc ${goc.tong} ca, đỏ ${goc.do_.size} (${tenCa(goc.do_)})`);
  console.log(`pl19-khong-do-them: kèm 085 ${co085.tong} ca, đỏ ${co085.do_.size}, đỏ thêm ${them(goc, co085).length} (${tenCa(new Set(them(goc, co085)))})`);
  console.log(`pl19-khong-do-them: đối chứng 085 hỏng đỏ thêm ${them(goc, hong).length} (${tenCa(new Set(them(goc, hong)))})`);
  let ma = 0;
  if (co085.tong !== goc.tong) { console.error("pl19-khong-do-them: số ca kèm 085 khác bản gốc"); ma = 1; }
  if (them(goc, co085).length) { console.error("E9b 085 làm đỏ thêm ca PL19"); ma = 1; }
  if (!them(goc, hong).length) { console.error("E9b đối chứng 085 hỏng không đỏ thêm ca nào — thước không phân biệt"); ma = 1; }
  process.exitCode = ma;
} finally {
  rmSync(tepHong, { force: true });
}
