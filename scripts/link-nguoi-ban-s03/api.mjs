// api.mjs — E5, lệnh chấm AC-5: test có sẵn của làn ZCode cho API collector nhận lô hồ sơ (POST /s03-ho-so → snapshot S03 riêng).
// Tìm test trong collector/src/test có nhắc đường /s03-ho-so; chưa có → thoát 2 có tên. Có thì chạy bộ test collector (build + node
// --test dist/test) và trả mã thoát.
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { ROOT } from "./chung.mjs";

export async function chay() {
  const dir = join(ROOT, "collector", "src", "test");
  const co = readdirSync(dir).filter((f) => f.endsWith(".test.ts") && readFileSync(join(dir, f), "utf8").includes("/s03-ho-so"));
  if (!co.length) {
    console.error("THIẾU test API collector cho POST /s03-ho-so trong collector/src/test (làn ZCode) — E5 không đo được");
    return 2;
  }
  console.log(`api: test collector ${co.join(", ")}`);
  return spawnSync("npm", ["test"], { cwd: join(ROOT, "collector"), stdio: "inherit" }).status ?? 1;
}
