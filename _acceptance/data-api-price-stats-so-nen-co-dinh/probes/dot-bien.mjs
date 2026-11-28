#!/usr/bin/env node
// dot-bien.mjs — PB9 AC-2 (eval E2): chép data-api/ sang thư mục tạm (ngoài kho git, PB2_GIT_ROOT trỏ về gốc kho), chạy
// data-api/test/listing-reso.test.ts ở bốn ô: goc (không đổi) phải xanh; doi-ma (price-stats trả 422 thay 400 khi thiếu
// tham số), doi-than (đổi tên một cột trong thân ?area), moc-sai (hằng mốc trỏ vào main a80d389d9, nơi asset-stats.ts đã là
// route 410) — mỗi ô ca PB2-AC-11 đỏ với đúng thông điệp ghim, các ca khác của tệp xanh. Mỗi ô một DB thử riêng.
// In mỗi ô một dòng JSON, cuối «dot-bien: đủ 4 ô» (thoát 0) hoặc «dot-bien: ô <tên> sai» (thoát 1).
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const MOC = "75f32bd55c15442e5ab0d258b1f998e70aa2072b";
const MAIN_SAU_PB2 = "a80d389d929291e5a81b8ee0cff8ee7421d0676e";

/** Thay đúng một lần; chuỗi không có hoặc có nhiều lần → ô hỏng (thoát 2), không đo giả. */
function thayMot(tep, cu, moi) {
  const s = readFileSync(tep, "utf8");
  const n = s.split(cu).length - 1;
  if (n !== 1) throw new Error(`dot-bien: không cấy được ở ${path.basename(tep)} (chuỗi gặp ${n} lần)`);
  writeFileSync(tep, s.replace(cu, moi));
}

const O = [
  { o: "goc" },
  { o: "doi-ma", tep: "src/routes/price-stats.ts", cu: `"Cần ?area=<id> hoặc ?market=<id>" } },\n      400,`, moi: `"Cần ?area=<id> hoặc ?market=<id>" } },\n      422,`, ghim: /PB2 price-stats khác mã với asset-stats ở nền/ },
  { o: "doi-than", tep: "src/routes/price-stats.ts", cu: "AS median_perm2,\n                    round(s.median_rent::numeric)::bigint AS median_rent\n             FROM market_asset_stats s\n             LEFT JOIN areas a ON a.id = s.area_id\n             WHERE s.area_id = $1", moi: "AS median_perm2_x,\n                    round(s.median_rent::numeric)::bigint AS median_rent\n             FROM market_asset_stats s\n             LEFT JOIN areas a ON a.id = s.area_id\n             WHERE s.area_id = $1", ghim: /PB2 price-stats khác thân asset-stats ở nền/ },
  { o: "moc-sai", tep: "test/listing-reso.test.ts", cu: `const MOC_ASSET_STATS_CU = "${MOC}";`, moi: `const MOC_ASSET_STATS_CU = "${MAIN_SAU_PB2}";`, ghim: /PB2-AC-11 mốc so hỏng/ },
];

const env = { ...process.env, PB2_GIT_ROOT: ROOT };
delete env.DATABASE_URL; // db-thu.sh dựng DB riêng cho từng ô
delete env.TEST_DATABASE_URL_ADMIN;
const caXanh = (ra, c) => new RegExp(`^\\s*✔ ${c}`, "m").test(ra);
const caDo = (ra, c) => new RegExp(`^\\s*✖ ${c}`, "m").test(ra);

let sai = "";
let ma = 0;
for (const o of O) {
  const tam = mkdtempSync(path.join(os.tmpdir(), "pb9-db-"));
  try {
    for (const p of ["src", "test", "package.json", "tsconfig.json"]) cpSync(path.join(ROOT, "data-api", p), path.join(tam, p), { recursive: true });
    symlinkSync(path.join(ROOT, "data-api", "node_modules"), path.join(tam, "node_modules"));
    if (o.tep) {
      try { thayMot(path.join(tam, o.tep), o.cu, o.moi); } catch (e) { console.log(e.message); sai = o.o; ma = 2; break; }
    }
    const r = spawnSync("bash", [path.join(ROOT, "db", "db-thu.sh"), `oneinvest_suite_dapi_psn_${o.o.replace("-", "")}`, "--chay", "sh", "-c",
      `cd '${tam}' && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/listing-reso.test.ts`],
      { cwd: ROOT, env, encoding: "utf8", maxBuffer: 64 << 20 });
    const ra = `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
    const tong = Number(/^ℹ tests (\d+)/m.exec(ra)?.[1] ?? -1);
    const fail = Number(/^ℹ fail (\d+)/m.exec(ra)?.[1] ?? -1);
    const dong = { o: o.o, rc: r.status, tests: tong, fail };
    let dat;
    if (!o.tep) dat = r.status === 0 && fail === 0 && tong > 0 && caXanh(ra, "PB2-AC-11");
    else {
      dong.ac11_do = caDo(ra, "PB2-AC-11");
      dong.ghim = o.ghim.test(ra);
      dat = r.status !== 0 && fail === 1 && dong.ac11_do && dong.ghim;
    }
    dong.dat = dat;
    console.log(JSON.stringify(dong));
    if (!dat) {
      console.log(ra.split("\n").filter((l) => /^\s*[✔✖] |PB2|ℹ (tests|pass|fail)|db-thu|Error/.test(l)).slice(0, 30).join("\n"));
      sai = o.o;
      ma = 1;
    }
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
  if (sai) break;
}
if (sai) {
  console.log(`dot-bien: ô ${sai} sai`);
  process.exitCode = ma;
} else console.log(`dot-bien: đủ ${O.length} ô`);
