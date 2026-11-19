// do-ban-chep.mjs — E5, E6 che-ten-nguon-khong-lay-tu-dau: đo trên BẢN CHÉP DB máy thu (oneinvest_u1_cten, dựng bằng
// db/db-thu.sh, xoá sau lượt). Áp 112, đặt dòng S16 về tên hai từ + tên miền từ tệp cục bộ GS cấp (CTEN_TEP; thiếu → exit 2),
// rồi đếm bằng CHÍNH hàm nạp + lõi mới. Chỉ in mã và số. DB máy thu chỉ được đọc (checksum ba bảng trước/sau).
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const require = createRequire(path.join(ROOT, "pipeline", "package.json"));
const pg = require("pg");
const { findSourceNames, fold, nameVariants } = await import(path.join(ROOT, "pipeline/lib/mask-source-names.mjs"));
const { docSourceNameEntries } = await import(path.join(ROOT, "pipeline/lib/source-name-entries.mjs"));
const { tokensFromEntries } = await import(path.join(ROOT, "pipeline/lib/tier-a-guard.mjs"));
const { FILL, scanSourceNames } = await import(path.join(ROOT, "pipeline/sync-cloud.mjs"));

const TEP = process.env.CTEN_TEP ?? "/Users/manhphan/dev/onehub-invest/.acceptance-runs/dieu-phoi-dot0-cam-mau/tam/s16-ten-that.json";
if (!existsSync(TEP)) { console.log("cần tệp tên thật S16 (CTEN_TEP) — không đoán"); process.exit(2); }
const s16 = JSON.parse(readFileSync(TEP, "utf8")).find((r) => r.code === "S16");
const BAN = "oneinvest_u1_cten";
const url = (db) => `postgres://oneinvest:oneinvest@localhost:5433/${db}`;
const t0 = Date.now();
let loi = 0;
const ok = (dk, msg) => { console.log(`${dk ? "ĐẠT" : "KHÔNG ĐẠT"} · ${msg}`); if (!dk) loi++; };

const may = new pg.Client({ connectionString: url("oneinvest") });
await may.connect();
const tong = async (c) => {
  const h = createHash("sha256");
  for (const t of ["source_registry", "asset_nodes", "registry_aliases"]) {
    const { rows } = await c.query(`SELECT md5(coalesce(string_agg(md5(x::text), '' ORDER BY md5(x::text)), '')) h, count(*)::int n FROM ${t} x`);
    h.update(`${t}:${rows[0].h}:${rows[0].n};`);
  }
  return h.digest("hex");
};
const truoc = await tong(may);

execFileSync("bash", [path.join(ROOT, "db/db-thu.sh"), BAN], { stdio: ["ignore", "ignore", "inherit"] });
const c = new pg.Client({ connectionString: url(BAN) });
await c.connect();
try {
  await c.query(readFileSync(path.join(ROOT, "db/migrations/112_source_registry_match_whole.sql"), "utf8"));
  await c.query("UPDATE source_registry SET real_name = $1, source_ids = $2, match_whole = true WHERE code = 'S16'", [s16.real_name, s16.source_ids]);

  // E6: đếm chỗ bị coi là tên S16, với cờ true rồi false (đối chứng)
  const V = { a: "aàáảãạăằắẳẵặâầấẩẫậ", d: "dđ", e: "eèéẻẽẹêềếểễệ", i: "iìíỉĩị", o: "oòóỏõọôồốổỗộơờớởỡợ", u: "uùúủũụưừứửữự", y: "yỳýỷỹỵ" };
  const rx = (v) => [...v].map((ch) => (V[ch] ? `[${V[ch]}]` : ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).join("");
  const dem = async (co) => {
    await c.query("UPDATE source_registry SET match_whole = $1 WHERE code = 'S16'", [co]);
    const es = await docSourceNameEntries(c);
    const e16 = es.filter((e) => e.code === "S16");
    const loc = e16.flatMap((e) => nameVariants(e.realName, { wholeOnly: e.wholeOnly })).filter((v) => v.length >= 4).map(rx).join("|");
    const trung16 = (s) => findSourceNames(s ?? "", es).some((h) => h.code === "S16");
    const out = {};
    const nut = (await c.query("SELECT name FROM asset_nodes WHERE node_type = 'project' AND name ~* $1", [loc])).rows;
    out.nut_du_an = nut.filter((r) => trung16(r.name)).length;
    const al = (await c.query("SELECT value FROM registry_aliases WHERE value ~* $1", [loc])).rows;
    out.bi_danh = al.filter((r) => trung16(r.value)).length;
    let cloud = 0;
    for (const t of FILL) {
      const rows = (await c.query(`SELECT row_to_json(t)::text j FROM ${t} t WHERE row_to_json(t)::text ~* $1`, [loc])).rows;
      cloud += rows.filter((r) => Object.values(JSON.parse(r.j)).some((v) => v != null && trung16(typeof v === "string" ? v : JSON.stringify(v)))).length;
    }
    out.dong_cloud = cloud;
    return { out, es };
  };
  const sai = await dem(false);
  const dung = await dem(true);
  console.log(`S16 cờ false (đối chứng): nút dự án ${sai.out.nut_du_an} · bí danh ${sai.out.bi_danh} · dòng bảng cloud ${sai.out.dong_cloud}`);
  console.log(`S16 cờ true: nút dự án ${dung.out.nut_du_an} · bí danh ${dung.out.bi_danh} · dòng bảng cloud ${dung.out.dong_cloud}`);
  ok(dung.out.nut_du_an === 0 && dung.out.bi_danh === 0 && dung.out.dong_cloud === 0, "E6 cờ true: 0 chỗ bị coi nhầm là tên S16");
  ok(sai.out.nut_du_an >= 8 && sai.out.bi_danh >= 114760 && sai.out.dong_cloud >= 1320, "E6 đối chứng cờ false: số trúng ≥ mốc trước (8 nút, 114.760 bí danh, 1.320 dòng cloud)");
  const tk = tokensFromEntries ? tokensFromEntries(dung.es) : [];
  ok(Boolean(scanSourceNames(`ngõ ${s16.real_name} 3`, tk)), "E6 cấy cụm hai từ có dấu cách → bộ soát sync-cloud bắt");
  const mien = (s16.source_ids ?? []).filter((x) => x.includes("."));
  ok(mien.length >= 1 && mien.every((d) => Boolean(scanSourceNames(`tải ${d} xong`, tk))), "E6 cấy tên miền → bộ soát sync-cloud bắt");

  // E5: log job — dòng CHỈ từ đầu của định danh S05 che được vẫn bị lõi mới bắt (S05 không khai cờ)
  const es = dung.es;
  const s05 = es.filter((e) => e.code === "S05");
  const dir = "/Users/manhphan/dev/onehub-invest/pipeline/logs";
  let chi = 0, bat = 0;
  for (const e of s05) {
    const w = fold(e.realName.trim()).split(/[\s.\-_/]+/).filter(Boolean);
    if (w.length < 2 || w[0].length < 4) continue;
    const du = nameVariants(e.realName, { wholeOnly: true });
    if (s05.some((x) => nameVariants(x.realName, { wholeOnly: true }).includes(w[0]))) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".log"))) {
      for (const line of readFileSync(path.join(dir, f), "utf8").slice(-3_000_000).split("\n")) {
        const fl = fold(line);
        if (!fl.includes(w[0]) || s05.some((x) => nameVariants(x.realName, { wholeOnly: true }).some((v) => fl.includes(v)))) continue;
        chi++;
        if (findSourceNames(line, es).some((h) => h.code === "S05")) bat++;
      }
    }
    void du;
  }
  console.log(`S05: dòng log CHỈ từ đầu che được ${chi} · lõi mới vẫn bắt ${bat}`);
  ok(chi >= 60 && bat === chi, "E5 S05 vẫn che mọi dòng chỉ từ đầu che được (mốc 60)");
} finally {
  await c.end();
  execFileSync("bash", [path.join(ROOT, "db/db-thu.sh"), BAN, "--xoa"], { stdio: "ignore" });
}
const sau = await tong(may);
await may.end();
ok(truoc === sau, "DB máy thu không đổi (checksum source_registry, asset_nodes, registry_aliases)");
console.log(`thời gian ${Math.round((Date.now() - t0) / 1000)} giây`);
process.exit(loi ? 1 : 0);
