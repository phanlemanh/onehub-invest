#!/usr/bin/env node
// Dựng DB cho CI từ db/migrations (AU11 `ci-test-module` AC-3). Chạy trên DB TRỐNG dùng một lần (service PostGIS của
// CI, hoặc docker tạm khi chạy lại cục bộ) — từ chối DB đã có bảng ở schema public, để không bao giờ áp vào DB local
// thật. Thứ tự: tệp SQL riêng cho CI (scripts/ci/*.sql — bảng không migration nào tạo, Hỏi-1) rồi mọi migration theo
// số. Migration lỗi ngoài danh sách đã khai → thoát 2 gọi tên tệp; migration trong danh sách mà áp xanh → thoát 4
// («danh sách cũ»). Chuỗi kết nối: DATABASE_URL, mặc định localhost:5433/oneinvest như test.
// Chạy: node scripts/ci-db-init.mjs [--migrations <thư mục>] [--bootstrap <thư mục>]
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pg = createRequire(path.join(ROOT, "app/package.json"))("pg");

/** Migration đã biết lỗi trên DB trống — mỗi mục phải CÒN lỗi thật, áp xanh là danh sách cũ. */
export const LOI_DA_KHAI = {
  "031_property_master.sql": "invalid reference to FROM-clause entry for table \"properties\" — lỗi tồn đọng trên DB trống",
};

const arg = (name, dflt) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? path.resolve(process.argv[i + 1]) : dflt;
};
const MIG = arg("--migrations", path.join(ROOT, "db/migrations"));
const BOOT = arg("--bootstrap", path.join(ROOT, "scripts/ci"));
const URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const sqlFiles = (dir) => readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const db = new pg.Client({ connectionString: URL });
await db.connect();
let code = 0;
try {
  const { rows } = await db.query(
    // Chỉ bảng thật: ảnh PostGIS cài sẵn extension vào DB mặc định (view geometry_columns…, bảng spatial_ref_sys).
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> 'spatial_ref_sys' ORDER BY 1 LIMIT 5",
  );
  if (rows.length) {
    console.log(`ci-db-init: TỪ CHỐI — DB đích đã có bảng ở public (${rows.map((r) => r.table_name).join(", ")}…); chỉ chạy trên DB trống dùng một lần`);
    process.exitCode = 3;
  } else {
    for (const f of sqlFiles(BOOT)) {
      await db.query(readFileSync(path.join(BOOT, f), "utf8"));
      console.log(`ci-db-init: bootstrap ${f}`);
    }
    let ok = 0;
    for (const f of sqlFiles(MIG)) {
      let err = null;
      try {
        await db.query(readFileSync(path.join(MIG, f), "utf8"));
      } catch (e) {
        err = e.message.split("\n")[0];
      }
      const khai = LOI_DA_KHAI[f];
      if (err && khai) console.log(`ci-db-init: ${f} còn lỗi thật (đã khai): ${err}`);
      else if (err) {
        console.log(`ci-db-init: LỖI ${f}: ${err}`);
        code = code || 2;
      } else if (khai) {
        console.log(`ci-db-init: ${f} áp xanh nhưng còn trong danh sách lỗi đã khai — danh sách cũ`);
        code = code || 4;
      } else ok++;
    }
    console.log(`ci-db-init: áp ${ok} migration xanh, ${Object.keys(LOI_DA_KHAI).length} lỗi đã khai`);
    process.exitCode = code;
  }
} finally {
  await db.end();
}
