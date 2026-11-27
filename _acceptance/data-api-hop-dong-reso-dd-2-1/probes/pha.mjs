#!/usr/bin/env node
// pha.mjs — chiều đỏ của PB2 (AC-6, eval E6). Chép data-api/ sang thư mục tạm, lần lượt đặt lại bản merge-base của từng
// route rồi chạy CÙNG lệnh của executor dapi_reso (listing-reso + dong-ba-route): mỗi bản cũ phải đỏ ở đường của mình với
// thông điệp ghim, ca của đường kia phải xanh; bản chép không thay phải xanh. Mỗi ô một DB thử riêng (db/db-thu.sh --chay).
// In ba dòng ô viết trước rồi mỗi ô một dòng JSON, cuối «pha: đủ 4 ô» (thoát 0) hoặc «pha: N ô sai» (thoát 1); không dựng
// được bản cũ → thoát 2.
//
// Bản cũ của listings.ts không có hằng KIND mà app.ts mới nhập — probe nối đúng một dòng `export const KIND` vào bản cũ
// (không đụng thân route) để ô đo route cũ chứ không đo lỗi nhập.
// Căn giá tốt nay là bộ lọc của chính /v1/listings (Mạnh 27/11), nên ở ô listings-cu ca PB2-AC-4, AC-5 (đều gọi /v1/listings)
// đỏ theo, và bốn ca DRL đi qua /v1/listings (DRL-AC-1, 2, 4, 5) cũng đỏ; đường kia của ô này là price-stats (AC-11), openapi
// (AC-10c) và coverage (DRL-AC-3) — sổ quyết định ghi lệch so với bản viết E6.
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, cpSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 64 << 20 });

const PB2 = ["PB2-AC-1", "PB2-AC-2", "PB2-AC-3", "PB2-AC-4", "PB2-AC-5", "PB2-AC-11", "PB2-AC-10c"];
const DRL = ["DRL-AC-1", "DRL-AC-2", "DRL-AC-3", "DRL-AC-4", "DRL-AC-5"];
const O = [
  { o: "goc", db: "goc" },
  {
    o: "listings-cu", db: "list", tep: "listings.ts", noi: '\nexport const KIND = ["sale", "rent_lt", "rent_st"] as const;\n',
    do: ["PB2-AC-1", "PB2-AC-2", "PB2-AC-3", "PB2-AC-4", "PB2-AC-5", "DRL-AC-1", "DRL-AC-2", "DRL-AC-4", "DRL-AC-5"],
    xanh: ["PB2-AC-11", "PB2-AC-10c", "DRL-AC-3"], drl: false,
    ghim: [/PB2 listings[^:\n]* sai tập khoá/, /PB2 listings[^:\n]* sai giá trị/],
  },
  {
    o: "deals-cu", db: "deals", tep: "deals.ts",
    do: ["PB2-AC-5"], xanh: ["PB2-AC-1", "PB2-AC-2", "PB2-AC-3", "PB2-AC-4", "PB2-AC-11", "PB2-AC-10c"],
    ghim: [/PB2 deals còn sống/],
  },
  {
    o: "asset-stats-cu", db: "as", tep: "asset-stats.ts",
    do: ["PB2-AC-11"], xanh: ["PB2-AC-1", "PB2-AC-2", "PB2-AC-3", "PB2-AC-4", "PB2-AC-5", "PB2-AC-10c"],
    ghim: [/PB2 price-stats/],
  },
];
for (const o of O) console.log(JSON.stringify({ o: o.o, mong: o.tep ? { do: o.do, xanh: [...o.xanh, ...(o.drl === false ? [] : ["DRL ×5"])], ghim: o.ghim.map(String) } : "rc 0, fail 0" }));

let goc;
try {
  goc = git("merge-base", "HEAD", "origin/main").trim();
} catch {
  console.log("pha: không dựng được bản cũ (không tìm được merge-base với origin/main)");
  process.exit(2);
}

const env = { ...process.env };
delete env.DATABASE_URL; // để db-thu.sh dựng DB riêng cho từng ô từ bản mẫu
delete env.TEST_DATABASE_URL_ADMIN;

const caXanh = (ra, c) => new RegExp(`^\\s*✔ ${c} `, "m").test(ra);
const caDo = (ra, c) => new RegExp(`^\\s*✖ ${c} `, "m").test(ra);

let sai = 0;
for (const o of O) {
  const tam = mkdtempSync(path.join(os.tmpdir(), "pb2-pha-"));
  try {
    for (const p of ["src", "test", "package.json", "tsconfig.json"]) {
      cpSync(path.join(ROOT, "data-api", p), path.join(tam, p), { recursive: true });
    }
    symlinkSync(path.join(ROOT, "data-api", "node_modules"), path.join(tam, "node_modules"));
    if (o.tep) {
      let cu;
      try {
        cu = git("show", `${goc}:data-api/src/routes/${o.tep}`);
      } catch {
        console.log(`pha: không dựng được bản cũ (${o.tep} không có ở ${goc.slice(0, 9)})`);
        process.exit(2);
      }
      const f = path.join(tam, "src", "routes", o.tep);
      writeFileSync(f, cu);
      if (o.noi) appendFileSync(f, o.noi);
    }
    const r = spawnSync(
      "bash",
      [
        path.join(ROOT, "db", "db-thu.sh"), `oneinvest_suite_dapi_pb2${o.db}`, "--chay", "sh", "-c",
        `cd '${tam}' && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/listing-reso.test.ts test/dong-ba-route.test.ts`,
      ],
      { cwd: ROOT, env, encoding: "utf8", maxBuffer: 64 << 20 },
    );
    const ra = `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
    const fail = Number(/^ℹ fail (\d+)/m.exec(ra)?.[1] ?? -1);
    const dong = { o: o.o, rc: r.status, fail, xanh: [...PB2, ...DRL].filter((c) => caXanh(ra, c)) };
    let dat;
    if (!o.tep) {
      dat = r.status === 0 && fail === 0 && dong.xanh.length === PB2.length + DRL.length;
    } else {
      dong.ghim = o.ghim.map((g) => g.test(ra));
      dong.duong_minh_do = o.do.filter((c) => !caDo(ra, c));
      dong.duong_khac_xanh = [...o.xanh, ...(o.drl === false ? [] : DRL)].filter((c) => !caXanh(ra, c));
      dat = r.status !== 0 && dong.ghim.every(Boolean) && !dong.duong_minh_do.length && !dong.duong_khac_xanh.length;
    }
    dong.dat = dat;
    console.log(JSON.stringify(dong));
    if (!dat) {
      sai++;
      console.log(ra.split("\n").filter((l) => /^\s*[✔✖] |PB2 |DRL |ℹ (tests|pass|fail)|db-thu|Error/.test(l)).slice(0, 30).join("\n"));
    }
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
}
if (sai) {
  console.log(`pha: ${sai} ô sai`);
  process.exit(1);
}
console.log(`pha: đủ ${O.length} ô`);
