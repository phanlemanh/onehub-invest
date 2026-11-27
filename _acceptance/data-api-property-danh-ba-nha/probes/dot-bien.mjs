#!/usr/bin/env node
// PB6 E9 (AC-9) — đối chứng: ba đột biến trên bản chép tạm của data-api/ phải làm đúng các ca đỏ với thông điệp ghim.
// Chạy trên DB thử: bash db/db-thu.sh oneinvest_suite_dapi_prop_cu --chay node _acceptance/data-api-property-danh-ba-nha/probes/dot-bien.mjs
// Mỗi ô chạy test/properties.test.ts với một hạt riêng (PB6_HAT) trên cùng DB. Thoát 0 = cả bốn ô đúng; 1 = có ô sai;
// 2 = không dựng được bản chép.
import { cpSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const RUN = path.join(ROOT, ".acceptance-runs/data-api-property-danh-ba-nha", `dot-bien-${process.pid}`);

const thay = (tep, a, b) => (s) => {
  if (!s.includes(a)) throw new Error(`dot-bien: không tìm thấy mốc trong ${tep}: ${a.slice(0, 60)}`);
  return s.replace(a, b);
};
const TRA_VE = "  return Object.fromEntries(UNIT_KEY_NAMES.map((n) => [n, v[n] ?? null]));";
const O = [
  { ten: "goc", sua: [], phaiDo: [], phaiXanh: ["PB6-AC-1", "PB6-AC-2", "PB6-AC-3", "PB6-AC-4", "PB6-AC-5", "PB6-AC-6", "PB6-AC-7", "PB6-AC-10"] },
  {
    ten: "khong-mount",
    sua: [["src/app.ts", thay("src/app.ts", 'app.route("/v1/properties", propertiesRoute);', "")]],
    phaiDo: ["PB6-AC-1", "PB6-AC-2", "PB6-AC-3", "PB6-AC-4", "PB6-AC-5", "PB6-AC-7", "PB6-AC-10"],
    ghim: "PB6-AC-1 toà T1 không 200",
  },
  {
    ten: "ghep-bi-danh",
    sua: [["src/routes/properties.ts", thay("src/routes/properties.ts", TRA_VE,
      `  const bd = await pool.query("SELECT value FROM registry_aliases WHERE object_key = $1", [String(u.unit_key)]);
  return { ...Object.fromEntries(UNIT_KEY_NAMES.map((n) => [n, v[n] ?? null])), aliases: bd.rows.map((r) => r.value) };`)]],
    phaiDo: ["PB6-AC-6"],
    ghim: "PB6-AC-6 lộ:",
  },
  {
    ten: "tra-subid",
    sua: [["src/routes/properties.ts", thay("src/routes/properties.ts", TRA_VE,
      `  return { ...Object.fromEntries(UNIT_KEY_NAMES.map((n) => [n, v[n] ?? null])), universalPropertySubId: String(u.unit_key) };`)]],
    phaiDo: ["PB6-AC-2", "PB6-AC-5"],
    ghim: "PB6-AC-5 phát khoá dò được: universalPropertySubId",
  },
];

let sai = 0;
mkdirSync(RUN, { recursive: true });
for (const [i, o] of O.entries()) {
  const dir = path.join(RUN, o.ten, "data-api");
  try {
    cpSync(path.join(ROOT, "data-api"), dir, { recursive: true, filter: (s) => !s.includes(`${path.sep}node_modules`) });
    symlinkSync(path.join(ROOT, "data-api/node_modules"), path.join(dir, "node_modules"));
    for (const [tep, f] of o.sua) writeFileSync(path.join(dir, tep), f(readFileSync(path.join(dir, tep), "utf8")));
  } catch (e) {
    console.error(`dot-bien: không dựng được bản chép ${o.ten}: ${e.message}`);
    process.exit(2);
  }
  const r = spawnSync("node", ["--import", "tsx", "--test", "test/properties.test.ts"], {
    cwd: dir, encoding: "utf8", env: { ...process.env, PB6_HAT: String(70000 + i * 1000 + (process.pid % 1000)) }, maxBuffer: 64 * 1024 * 1024,
  });
  const ra = `${r.stdout}\n${r.stderr}`;
  writeFileSync(path.join(RUN, `${o.ten}.log`), ra);
  const do_ = new Set([...ra.matchAll(/✖ (PB6-AC-\d+)/g)].map((m) => m[1]));
  const xanh = new Set([...ra.matchAll(/✔ (PB6-AC-\d+)/g)].map((m) => m[1]));
  const thieuDo = o.phaiDo.filter((c) => !do_.has(c));
  const thieuXanh = (o.phaiXanh ?? []).filter((c) => !xanh.has(c));
  const thieuGhim = o.ghim && !ra.includes(o.ghim);
  const dung = thieuDo.length === 0 && thieuXanh.length === 0 && !thieuGhim && (o.ten === "goc" ? r.status === 0 : r.status !== 0);
  console.log(JSON.stringify({ o: o.ten, rc: r.status, do: [...do_].sort(), dung, thieuDo, thieuXanh, thieuGhim: thieuGhim ? o.ghim : null }));
  if (!dung) sai++;
}
for (const o of O) rmSync(path.join(RUN, o.ten), { recursive: true, force: true }); // giữ <ô>.log để đọc khi đỏ
console.log(`nhật ký: ${path.relative(ROOT, RUN)}/<ô>.log`);
console.log(sai ? `pha: ${sai} ô sai` : `pha: đủ ${O.length} ô`);
process.exit(sai ? 1 : 0);
