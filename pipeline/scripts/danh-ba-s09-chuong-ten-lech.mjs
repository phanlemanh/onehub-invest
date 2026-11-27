#!/usr/bin/env node
// danh-ba-s09-chuong-ten-lech.mjs — DA42 nap-s09-toa-tang-vao-danh-ba: chuông báo CHỈ ĐỌC, chạy sau mỗi lượt nạp S16 mới tới khi
// DA57 (go-bi-danh-ten-toa-s09-khi-s16-lech-tang) gộp. In một số: toà S09 gói 1 còn mang bí danh tên mà đã có thẻ lệch tầng với
// toà S16 cùng tên. Khác 0 → thoát 1 (báo giám sát). Không in tên, mã.
//   DATABASE_URL=postgres://…/oneinvest node pipeline/scripts/danh-ba-s09-chuong-ten-lech.mjs
import pg from "pg";
import { SQL_CHUONG_TEN_LECH } from "../lib/s09-dung.mjs";

const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
await c.connect();
try {
  await c.query("SET default_transaction_read_only = on");
  const { rows: [r] } = await c.query(SQL_CHUONG_TEN_LECH);
  console.log(`danh-ba-s09-chuong-ten-lech: ${r.so_toa} toà S09 mang tên mà lệch tầng với toà S16 cùng tên`);
  process.exitCode = r.so_toa === 0 ? 0 : 1;
} finally {
  await c.end();
}
