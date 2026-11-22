#!/usr/bin/env node
// do-p4.mjs — S1 DA53: đo lại hai số P4 báo bằng chính bộ đọc PL20 (nhánh feat/ghep-tin-vao-danh-muc, đường P4_WT, sha in ra).
// Trước: danh bạ như hiện có. Sau: trong một giao dịch ROLLBACK, gộp 389 vào 48 theo đúng cách apNoi của DA46 (389 nghỉ, cha = 48,
// bí danh nối về 48) rồi đọc lại. Chỉ chạy trên DB thử oneinvest_* khác DB chung (giao dịch có ghi, dù lùi).
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
const P4_WT = process.env.P4_WT ?? "/Users/manhphan/dev/onehub-invest/.claude/worktrees/ghep-tin-vao-danh-muc";
const URL_DB = process.env.DATABASE_URL ?? "";
const ten = URL_DB.split("/").pop();
if (!/^oneinvest_[a-z0-9_]+$/.test(ten ?? "")) { console.error("do-p4: chỉ chạy trên DB thử oneinvest_<…>"); process.exit(2); }
const sha = execFileSync("git", ["-C", P4_WT, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
const pg = createRequire(`${P4_WT}/pipeline/package.json`)("pg");
const { docDauVao, tinhGan } = await import(pathToFileURL(`${P4_WT}/pipeline/lib/ghep-tin-danh-muc-doc.mjs`).href);
const c = new pg.Client({ connectionString: URL_DB });
await c.connect();
const NV = new Set(["chu-nhieu-vung", "model-nhieu-vung"]);
const doMot = async () => {
  const kq = tinhGan(await docDauVao(c));
  let baiNV = 0, baiNV389 = 0;
  for (const [, x] of kq.ketQuaBai) if (NV.has(x.ly_do)) { baiNV++; if (JSON.stringify(x).includes('"389"')) baiNV389++; }
  return { tin: kq.dem.tong, gan: kq.dem.gan, xung_dot: kq.dem.xung_dot, bai_nhieu_vung: baiNV, ly_do: kq.dem.ly_do };
};
const truoc = await doMot();
await c.query("BEGIN");
const { rows: [m] } = await c.query("SELECT aliases, meta FROM asset_nodes WHERE id = 389");
const { rows: [k] } = await c.query("SELECT aliases, meta FROM asset_nodes WHERE id = 48");
const them = (m.aliases ?? []).filter((x) => !(k.aliases ?? []).includes(x));
await c.query("UPDATE asset_nodes SET aliases = $2, meta = jsonb_set(meta, '{s16_khu_ids}', COALESCE(meta->'s16_khu_ids','[]'::jsonb) || $3::jsonb) WHERE id = $1",
  [48, [...(k.aliases ?? []), ...them], JSON.stringify(m.meta?.s16_khu_ids ?? [])]);
await c.query("UPDATE asset_nodes SET parent_id = 48, meta = meta || '{\"nghi\": true, \"s16_khu_ids\": []}'::jsonb WHERE id = 389");
const sau = await doMot();
await c.query("ROLLBACK");
console.log(JSON.stringify({ p4_sha: sha, db: ten, bi_danh_them: them, truoc, sau }, null, 1));
await c.end();
