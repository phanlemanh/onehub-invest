#!/usr/bin/env node
// GT5 khoa-gom-hai-tang — lệnh con đo trên BẢN CHÉP DB máy thu (DATABASE_URL phải là oneinvest_gt5_*; DB chung bị từ chối).
//   chup <tệp.json>                       chụp thành phần tin S03 đang sống: offer_id → post_ids đã sắp
//   so-sanh <a.json> <b.json> bang|khac   so hai bản chụp; bang: thoát 1 ghim offer_id lệch; khac: thoát 1 khi giống hệt
//   cong-tac bat|tat <lý do>              ghi một dòng ops_audit gom-tin:hai-tang
//   treo <truoc.json>                     mọi offer_id của bản chụp trước còn sống hoặc nghỉ có superseded_by; in số treo, thoát 1 ghim id
//   bang-doi <tệp.tsv> <truoc.json> <sau.json>  bảng đổi theo bài khớp hai bản chụp (mọi bài đổi tin có một dòng, không dòng thừa)
//   nhan <nguồn> <đích>                   CREATE DATABASE <đích> TEMPLATE <nguồn> (cả hai oneinvest_gt5_*)
//   xoa <tên>                             DROP DATABASE oneinvest_gt5_* nếu có
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = (await import(join(ROOT, "pipeline/node_modules/pg/lib/index.js"))).default;
const URL_ = process.env.DATABASE_URL ?? "";
const TEN_DB = (u) => u.replace(/\?.*$/, "").split("/").pop();
const laThu = (t) => /^oneinvest_gt5_[a-z0-9_]+$/.test(t);
const [lenh, ...a] = process.argv.slice(2);

const ket = async (fn, url = URL_) => {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try { return await fn(c); } finally { await c.end(); }
};
const docJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const bam = (o) => createHash("sha256").update(JSON.stringify(Object.entries(o).sort())).digest("hex").slice(0, 16);

if (["chup", "cong-tac", "treo"].includes(lenh) && !laThu(TEN_DB(URL_))) {
  console.error(`ĐỎ: DATABASE_URL phải trỏ DB thử oneinvest_gt5_* (đang: ${TEN_DB(URL_) || "vắng"})`); process.exit(2);
}

if (lenh === "chup") {
  const tin = await ket(async (c) => (await c.query(
    `SELECT offer_id, post_ids FROM sale_offer_records WHERE source = 'S03' AND retired_at IS NULL ORDER BY offer_id`)).rows);
  const o = Object.fromEntries(tin.map((t) => [t.offer_id, [...t.post_ids].sort()]));
  writeFileSync(a[0], JSON.stringify(o));
  console.log(`chụp ${tin.length} tin · ${tin.reduce((s, t) => s + t.post_ids.length, 0)} bài · băm ${bam(o)}`);
} else if (lenh === "so-sanh") {
  const [A, B] = [docJson(a[0]), docJson(a[1])];
  const thanhPhan = (o) => new Set(Object.values(o).map((p) => p.join(",")));
  const [ta, tb] = [thanhPhan(A), thanhPhan(B)];
  const lechId = [...new Set([...Object.keys(A), ...Object.keys(B)])].filter((k) => (A[k] ?? []).join(",") !== (B[k] ?? []).join(","));
  const lechTP = [...ta].filter((x) => !tb.has(x)).length + [...tb].filter((x) => !ta.has(x)).length;
  console.log(`so sánh: ${Object.keys(A).length} tin → ${Object.keys(B).length} tin · offer_id lệch ${lechId.length} · thành phần lệch ${lechTP}`);
  if (a[2] === "bang" && lechId.length) { console.log(`ĐỎ: thành phần tin khác đường chuẩn, offer_id lệch: ${lechId.slice(0, 5).join(", ")}`); process.exit(1); }
  if (a[2] === "khac" && !lechId.length) { console.log("ĐỎ: bật mà thành phần tin giống hệt đường chuẩn (đối chứng dương hỏng)"); process.exit(1); }
  console.log(a[2] === "bang" ? "đạt: thành phần tin giống hệt" : "đạt: thành phần tin khác (đối chứng dương)");
} else if (lenh === "cong-tac") {
  const bat = a[0] === "bat";
  const id = await ket(async (c) => (await c.query(
    `INSERT INTO ops_audit (actor, action, env, detail) VALUES ('gt5-probe', 'gom-tin:hai-tang', 'local', $1::jsonb) RETURNING id`,
    [JSON.stringify({ bat, ly_do: a[1] ?? "probe" })])).rows[0].id);
  console.log(`công tắc: dòng ${id} bat=${bat}`);
} else if (lenh === "treo") {
  const truoc = Object.keys(docJson(a[0]));
  const r = await ket(async (c) => (await c.query(
    `SELECT offer_id, retired_at, superseded_by FROM sale_offer_records WHERE offer_id = ANY($1::text[])`, [truoc])).rows);
  const co = new Map(r.map((x) => [x.offer_id, x]));
  const treo = truoc.filter((k) => !co.has(k) || (co.get(k).retired_at != null && co.get(k).superseded_by == null));
  const nghi = r.filter((x) => x.retired_at != null).length;
  console.log(`đường nối: ${truoc.length} offer_id cũ · ${nghi} nghỉ · ${treo.length} không có đường nối`);
  if (treo.length) { console.log(`ĐỎ: offer_id cũ không có đường nối: ${treo.slice(0, 5).join(", ")}`); process.exit(1); }
  console.log("đạt: mọi offer_id cũ còn sống hoặc nghỉ có superseded_by");
} else if (lenh === "bang-doi") {
  const dong = readFileSync(a[0], "utf8").trim().split("\n").slice(1).filter(Boolean).map((l) => l.split("\t"));
  const tinCua = (o) => { const m = new Map(); for (const [k, ps] of Object.entries(o)) for (const p of ps) m.set(p, k); return m; };
  const [T, S] = [tinCua(docJson(a[1])), tinCua(docJson(a[2]))];
  const doi = [...S].filter(([p, k]) => (T.get(p) ?? "") !== k).map(([p]) => p);
  const trongBang = new Set(dong.map((d) => d[0]));
  const thieu = doi.filter((p) => !trongBang.has(p));
  const sai = dong.filter(([p, cu, moi]) => (T.get(p) ?? "") !== cu || S.get(p) !== moi).map((d) => d[0]);
  console.log(`bảng đổi: ${dong.length} dòng · bài đổi tin theo hai bản chụp ${doi.length} · thiếu ${thieu.length} · sai ${sai.length}`);
  if (thieu.length || sai.length) { console.log(`ĐỎ: bảng đổi lệch, post_id: ${[...thieu, ...sai].slice(0, 5).join(", ")}`); process.exit(1); }
  console.log("đạt: bảng đổi theo bài khớp hai bản chụp");
} else if (lenh === "nhan" || lenh === "xoa") {
  for (const t of a) if (!laThu(t)) { console.error(`ĐỎ: chỉ nhận DB oneinvest_gt5_* (${t})`); process.exit(2); }
  const quanTri = URL_.replace(/\/[^/?]+(\?|$)/, "/postgres$1") || "postgres://oneinvest:oneinvest@localhost:5433/postgres";
  await ket(async (c) => {
    if (lenh === "xoa") await c.query(`DROP DATABASE IF EXISTS ${a[0]} WITH (FORCE)`);
    else { await c.query(`DROP DATABASE IF EXISTS ${a[1]} WITH (FORCE)`); await c.query(`CREATE DATABASE ${a[1]} TEMPLATE ${a[0]}`); }
  }, quanTri);
  console.log(lenh === "xoa" ? `xoá ${a[0]}` : `nhân ${a[0]} → ${a[1]}`);
} else {
  console.error("lệnh: chup | so-sanh | cong-tac | treo | bang-doi | nhan | xoa"); process.exit(2);
}
