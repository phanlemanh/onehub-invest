#!/usr/bin/env node
// HT4 E3 (AC-3): thế CI — DB thử dựng từ db/migrations (không có bản chép thật) thì mọi ca PX1-AC-10 bỏ qua có tên, 0 đỏ.
// DB oneinvest_dbv_ht4ci_<pid> tạo rồi xoá. Thoát 0 khi đúng 5 ca bỏ qua với lý do «không có bản chép thật», 0 pass, 0 fail.
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { GOC, taoDbThu, xoaDbThu } from "../../../pipeline/scripts/db-thu-dbv.mjs";

const ten = `oneinvest_dbv_ht4ci_${process.pid}`;
const url = await taoDbThu(ten);
try {
  const r = spawnSync(process.execPath, ["--test", "--test-concurrency=1", "scripts/nap-dvhc-cu.test.mjs"],
    { cwd: join(GOC, "pipeline"), encoding: "utf8", env: { ...process.env, DATABASE_URL: url } });
  const so = (k) => Number(r.stdout.match(new RegExp(`^ℹ ${k} (\\d+)`, "m"))?.[1] ?? -1);
  const boQua = (r.stdout.match(/^﹣ PX1-AC-10 .*# không có bản chép thật/gm) ?? []).length;
  const kq = { skipped: so("skipped"), pass: so("pass"), fail: so("fail"), bo_qua_co_ly_do: boQua };
  console.log(JSON.stringify(kq));
  process.exitCode = kq.skipped === 5 && kq.pass === 0 && kq.fail === 0 && boQua === 5 ? 0 : 1;
} finally {
  await xoaDbThu(ten);
}
