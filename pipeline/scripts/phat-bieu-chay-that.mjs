// phat-bieu-chay-that.mjs — PL15 AC-10: ba transform tin rao (S06, S03, S05) + phân xử toàn bộ trên dữ liệu thật của DB
// local, trong MỘT giao dịch ROLLBACK (nạp 045 khi chưa áp, cắt chuyển trước). In giây từng bước; tổng quá trần → exit 1.
//
//   node pipeline/scripts/phat-bieu-chay-that.mjs --thu
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { catChuyen } from "../phat-bieu-cat-chuyen.mjs";
import { runTransformChotot } from "../transform-chotot.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";
import { runTransformFb } from "../transform-fb.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
export const TRAN_GIAY = 300;

async function main(argv) {
  if (!argv.includes("--thu")) { console.error("chay-that: chỉ có chế độ --thu (giao dịch ROLLBACK)"); return 2; }
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  const buoc = [];
  const im = console.log;
  try {
    await c.query("BEGIN");
    try {
      await c.query("SELECT pg_advisory_xact_lock(33033)");
      await napPhatBieu(c, { moCong: false });
      await catChuyen(c, { actor: "chay-that:thu" });
      console.log = () => {};   // log của từng transform — chỉ giữ dòng đo
      const B = [
        ["transform-chotot (S06)", () => runTransformChotot(c)],
        ["transform-zalo (S03)", () => runTransformZalo(c)],
        ["transform-fb (S05)", () => runTransformFb(c)],
        ["phân xử toàn bộ", () => c.query("SELECT resolve_offer_fields(NULL)")],
      ];
      for (const [ten, fn] of B) {
        const t0 = performance.now();
        await fn();
        buoc.push([ten, (performance.now() - t0) / 1000]);
      }
    } finally {
      console.log = im;
      await c.query("ROLLBACK");
    }
  } finally {
    await c.end();
  }
  for (const [ten, s] of buoc) console.log(`  ${ten}: ${s.toFixed(1)} giây`);
  const tong = buoc.reduce((t, [, s]) => t + s, 0);
  console.log(`tổng ${tong.toFixed(1)} giây ${tong <= TRAN_GIAY ? "≤" : ">"} ${TRAN_GIAY}`);
  if (tong > TRAN_GIAY) {
    const cham = [...buoc].sort((a, b) => b[1] - a[1])[0];
    console.log(`chay-that: QUÁ TRẦN — bước chậm nhất: ${cham[0]} (${cham[1].toFixed(1)} giây)`);
    return 1;
  }
  console.log("chay-that --thu: ĐẠT (ROLLBACK)");
  return 0;
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.error(e); process.exit(1); });
