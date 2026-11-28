#!/usr/bin/env node
// noi-du-an-nguon-that.mjs — DA3 bang-noi-ma-du-an, phép đo trên bản chép DB máy thu (DB của riêng lượt oneinvest_suite_*):
//   bo-chuyen          E1/AC-1: số bản ghi, tỉnh, xã, điểm của năm nguồn so với bộ đo S1 đóng băng (probes/s1/do.mjs, đếm độc
//                      lập với mã của hàng); bảng 63 tỉnh đủ mã trong area_aliases; tỉnh cũ của một bản ghi S07 thật ra null khi bỏ
//                      dòng alias; số trường bị quy ước rỗng giả đổi về trống theo nguồn × trường.
//   ben-doc [--cay-do] E7/AC-7: băm đầu ra các bên đọc ở ba mốc (trước áp, sau áp S07 S10 S16, sau đảo đủ luật; S09 do DA42 nối, DA3 không áp), mọi ghi trong
//                      một giao dịch ROLLBACK. --cay-do cấy một bí danh S09 dạng toà trỏ node:<id> sau áp — phép so phải đỏ.
// Thoát 1 khi lệch, gọi tên nguồn hay bên đọc.
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { docBanGhi, docVung, chuyenS07, NGUON_DANH_MUC, SQL_NGUON, trongGia } from "../lib/ban-ghi-nguon.mjs";
import { napS16TheoKhu } from "../lib/s16-dung.mjs";
import { chuanTen } from "../lib/noi-du-an-s06-lop.mjs";
import { boTienToTinh, maTinhCu, TINH_CU } from "../lib/tinh-cu.mjs";
import { apThe, daoLuat, dungThe } from "../noi-du-an-nguon.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const DO_S1 = join(ROOT, "_acceptance/bang-noi-ma-du-an/probes/s1/do.mjs");
const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  console.error("noi-du-an-nguon-that: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_* (db/db-thu.sh --chay)");
  process.exit(2);
}
const NGUON_AP = ["S07", "S10", "S16"];
const VIEW = ["v_toa_nut_vung", "offer_building", "s06_offer_project", "v_s16_toa", "v_s09_toa"];

/** Chạy bộ đo S1 đóng băng trên cùng DB, trả JSON kết quả. */
export function chayDoS1() {
  const r = spawnSync(process.execPath, [DO_S1], { env: { ...process.env, DATABASE_URL: DB_URL }, encoding: "utf8", maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`bộ đo S1 lỗi: ${r.stderr.slice(-400)}`);
  return JSON.parse(r.stdout);
}

async function boChuyen(c) {
  const s1 = chayDoS1();
  const ctx = await docVung(c);
  let loi = 0;
  console.log("| Nguồn | Trường | DA3 | Bộ đo S1 | Hiệu |\n|---|---|---|---|---|");
  for (const n of NGUON_DANH_MUC) {
    const ds = await docBanGhi(c, n, ctx);
    const p = s1.phu[n];
    const cap = [["ban_ghi", ds.length, p.ban_ghi], ["tinh", ds.filter((b) => b.tinh).length, p.tinh_cuoi],
      ["xa", ds.filter((b) => b.xa).length, p.xa_cuoi], ["diem", ds.filter((b) => b.diem).length, p.diem]];
    for (const [t, a, b] of cap) {
      console.log(`| ${n} | ${t} | ${a} | ${b} | ${a - b} |`);
      if (a !== b) { loi++; console.error(`LỆCH ${n} ${t}: DA3 ${a}, bộ đo S1 ${b}`); }
    }
    if (n === "S10" && ds.some((b) => b.tinh || b.ly_do_trong !== "khong-vi-tri")) { loi++; console.error("LỆCH S10: phải toàn khong-vi-tri"); }
  }
  // Bảng 63 tỉnh: mỗi mã có dòng area_aliases.
  const { rows } = await c.query("SELECT DISTINCT old_province_code AS o FROM area_aliases");
  const coMa = new Set(rows.map((r) => r.o));
  const thieu = [...TINH_CU.values()].filter((m) => !coMa.has(m));
  console.log(`bảng tỉnh cũ: ${TINH_CU.size} dòng, mã thiếu trong area_aliases: ${thieu.length}`);
  if (TINH_CU.size !== 63 || thieu.length) { loi++; console.error(`LỆCH bảng tỉnh cũ: ${thieu.join(",")}`); }
  // Tỉnh cũ của một bản ghi S07 thật: bỏ dòng alias của mã ấy thì tỉnh null, không ra tỉnh khác.
  const { rows: s07 } = await c.query(SQL_NGUON.S07);
  const cuoi = (r) => String(r.dia_chi ?? "").split(",").at(-1);
  const cu = s07.find((r) => !r.tinh_diem && !ctx.mktByName.has(chuanTen(boTienToTinh(cuoi(r)))) && maTinhCu(cuoi(r))
    && chuyenS07(r, ctx).tinh_tu === "chu");
  const ma = cu ? maTinhCu(cuoi(cu)) : null;
  if (!cu) { loi++; console.error("LỆCH: không tìm được bản ghi S07 thật mang tên tỉnh cũ"); }
  else {
    await c.query("BEGIN");
    try {
      await c.query("DELETE FROM area_aliases WHERE old_province_code = $1", [ma]);
      const b = chuyenS07(cu, await docVung(c));
      console.log(`tỉnh cũ mã ${ma}: có alias → ${chuyenS07(cu, ctx).tinh}; bỏ alias → ${b.tinh ?? "null"} (${b.ly_do_trong})`);
      if (b.tinh !== null || b.ly_do_trong !== "tinh-cu-khong-anh-xa") { loi++; console.error("LỆCH: bỏ alias mà tỉnh không về null"); }
    } finally { await c.query("ROLLBACK"); }
  }
  // Quy ước rỗng giả đổi bao nhiêu trường (giá trị thô có mà trongGia trả null).
  const TRUONG = { S07: ["ten", "dia_chi", "cdt", "loai"], S08: ["ten", "dia_chi", "cdt", "loai"], S09: ["ten", "dia_chi", "cdt", "loai"], S10: ["ten", "cha_ten"], S16: ["ten", "dia_chi"] };
  for (const n of NGUON_DANH_MUC) {
    const { rows: tho } = await c.query(SQL_NGUON[n]);
    const doi = Object.fromEntries(TRUONG[n].map((t) => [t, tho.filter((r) => r[t] != null && trongGia(r[t]) === null).length]));
    console.log(`rỗng giả ${n}: ${JSON.stringify(doi)}`);
  }
  return loi;
}

/** Băm có sắp xếp đầu ra các bên đọc; in số giây mỗi câu. */
async function chup(c, nhan) {
  const kq = {};
  const bam = async (sql) => (await c.query(`SELECT md5(coalesce(string_agg(x::text, '|' ORDER BY x::text), '')) AS h FROM (${sql}) x`)).rows[0].h;
  for (const v of VIEW) {
    const t0 = Date.now();
    kq[v] = await bam(`SELECT * FROM ${v}`);
    console.log(`${nhan} ${v}: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  const { rows: khu } = await c.query("SELECT id::int FROM asset_nodes WHERE node_type = 'project'");
  const s16 = await napS16TheoKhu(c, khu.map((r) => r.id));
  kq.napS16TheoKhu = JSON.stringify([...s16].sort((a, b) => a[0] - b[0]).map(([k, m]) => [k, [...m.toa].sort(), [...m.truc].sort(), [...m.can].map(([x, y]) => [x, y.unit_key]).sort()]));
  // Bản đồ value → object_key mà s09-dung (S09) và danh-ba-vat-the (S08) đọc; chỉ phần khoá toà, trục, căn (không «du_an/») là phần
  // các bộ ấy tra — khoá «du_an/<mã>» của DA3 không bao giờ trùng khuôn «<pid>/<id>».
  for (const [ten, nguon] of [["s09-dung", "S09"], ["danh-ba-vat-the", "S08"]]) {
    kq[ten] = await bam(`SELECT value, object_key FROM registry_aliases WHERE retired_at IS NULL AND kind = 'ma_nguon' AND source = '${nguon}' AND value NOT LIKE 'du\\_an/%'`);
  }
  return kq;
}

async function benDoc(c, cayDo) {
  await c.query("BEGIN");
  try {
    const truoc = await chup(c, "trước áp");
    const luat = [];
    for (const n of NGUON_AP) {
      const the = await dungThe(c, n);
      const r = await apThe(c, { nguon: n, bam: the.bam, nguoi: "do-ben-doc", giaoDich: "ngoai" });
      luat.push(...r.rules.map((x) => x.id));
    }
    if (cayDo) {
      const { rows: [n] } = await c.query("SELECT id FROM asset_nodes WHERE node_type = 'project' ORDER BY id LIMIT 1");
      await c.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', 'da3-cay-do/toa-x', 'S09')", [`node:${n.id}`]);
    }
    const sauAp = await chup(c, "sau áp");
    for (const id of luat) await daoLuat(c, { ruleId: id, nguoi: "do-ben-doc", giaoDich: "ngoai" });
    const sauDao = await chup(c, "sau đảo");
    let loi = 0;
    for (const k of Object.keys(truoc)) {
      const ok = truoc[k] === sauAp[k] && truoc[k] === sauDao[k];
      console.log(`${ok ? "bằng" : "ĐỔI"} ${k}`);
      if (!ok) { loi++; console.error(`LỆCH bên đọc ${k}: đầu ra đổi qua áp/đảo`); }
    }
    return loi;
  } finally { await c.query("ROLLBACK"); }
}

const [lenh, ...co] = process.argv.slice(2);
const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
try {
  const loi = lenh === "bo-chuyen" ? await boChuyen(c) : lenh === "ben-doc" ? await benDoc(c, co.includes("--cay-do")) : -1;
  if (loi < 0) { console.error("dùng: bo-chuyen | ben-doc [--cay-do]"); process.exitCode = 2; }
  else process.exitCode = loi ? 1 : 0;
} finally { await c.end(); }
