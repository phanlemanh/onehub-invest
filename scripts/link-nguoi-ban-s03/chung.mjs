// chung.mjs — phần dùng chung của các lệnh chấm link-nguoi-ban-s03 làn Claude: gốc kho, pg mượn từ pipeline/, DB thử riêng.
// Mọi phép đo DB chạy trong MỘT giao dịch trên DB thử oneinvest_lnb_s03 rồi ROLLBACK — không chạm DB oneinvest dùng chung.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DB_THU = "oneinvest_lnb_s03";
const pg = createRequire(join(ROOT, "pipeline", "package.json"))("pg");

/** Dựng DB thử nếu chưa có (chép oneinvest bằng db/db-thu.sh), trả client đã nối. DATABASE_URL đặt sẵn thì dùng, nhưng phải là DB thử. */
export async function noiDbThu() {
  let url = process.env.DATABASE_URL;
  if (!url) {
    execFileSync("bash", [join(ROOT, "db", "db-thu.sh"), DB_THU, "--neu-chua-co"], { stdio: ["ignore", "ignore", "inherit"] });
    url = `postgres://oneinvest:oneinvest@localhost:5433/${DB_THU}`;
  }
  const ten = new URL(url).pathname.slice(1);
  if (!/^oneinvest_[a-z0-9_]+$/.test(ten)) throw new Error(`phép đo chỉ chạy trên DB thử oneinvest_<việc>, không chạy trên ${ten}`);
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  return c;
}

/** Chạy fn trong giao dịch rồi ROLLBACK luôn (kể cả khi đạt). */
export async function trongGiaoDich(fn) {
  const c = await noiDbThu();
  try {
    await c.query("BEGIN");
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

/** Bộ ghi kết quả: kiem(tên, điều kiện) gom lỗi; ketThuc() in tóm tắt, trả mã thoát. Không in giá trị tầng C. */
export function boKiem(ten) {
  const loi = [];
  let dat = 0;
  return {
    kiem(mo, dk) { if (dk) dat++; else loi.push(mo); },
    ketThuc() {
      for (const l of loi) console.log(`HỎNG ${l}`);
      console.log(`${ten}: ${dat} đạt · ${loi.length} hỏng`);
      return loi.length ? 1 : 0;
    },
  };
}
