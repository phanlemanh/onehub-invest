#!/usr/bin/env node
// ghep-tin-truc-can-do-bi-danh.mjs — PL36 (finding S4 vòng 3, AC-3 + AC-5): đo chỉ đọc đường căn qua bí danh mã căn.
// In: số bài luật xét, mức trục, mức căn; trong các bài mức căn, bao nhiêu căn tìm được qua trục + tầng và bao nhiêu CHỈ qua bí
// danh (căn không có stack_key, floor — trước 138 view offer_unit hạ các bài này về mức trục); số căn active chỉ có bí danh trên cả
// DB và trong các toà của hai khu. Phiên đặt read_only, không ghi gì.
// Chạy: cd pipeline && DATABASE_URL=… node scripts/ghep-tin-truc-can-do-bi-danh.mjs
import pg from "pg";
import { docDauVao, tinhGan } from "../lib/ghep-tin-truc-can-doc.mjs";

const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
await c.connect();
try {
  await c.query("SET default_transaction_read_only = on");
  const dv = await docDauVao(c);
  const { ketQuaBai, dem } = tinhGan(dv);
  let quaTrucTang = 0;
  const chiBiDanh = [];
  for (const [post_id, k] of ketQuaBai) {
    if (k.muc !== "can") continue;
    if ((dv.danhBa.get(k.du_an).can.get(k.stack)?.get(k.tang) ?? []).includes(k.unit)) quaTrucTang++;
    else chiBiDanh.push({ post_id, unit: k.unit });
  }
  const BI_DANH = `u.status = 'active' AND u.stack_key IS NULL AND u.floor IS NULL AND EXISTS (SELECT 1 FROM registry_aliases a
    WHERE a.object_key = u.unit_key AND a.kind = 'ma_nguon' AND a.retired_at IS NULL)`;
  const [{ n: toanDb }] = (await c.query(`SELECT count(*)::int n FROM units u WHERE ${BI_DANH}`)).rows;
  const toa = [...new Set([...dv.danhBa.values()].flatMap((d) => d.tenToa.map((t) => t.key)))];
  const [hk] = (await c.query(`SELECT count(*) FILTER (WHERE u.status = 'active')::int AS can_active,
      count(*) FILTER (WHERE ${BI_DANH})::int AS chi_bi_danh FROM units u WHERE u.building_key = ANY ($1)`, [toa])).rows;
  console.log(JSON.stringify({
    bai: dem.tong, truc: dem.truc, can: dem.can, can_qua_truc_tang: quaTrucTang, can_chi_qua_bi_danh: chiBiDanh.length,
    vi_du_chi_bi_danh: chiBiDanh.slice(0, 5), can_chi_bi_danh_toan_db: toanDb, hai_khu: hk,
  }, null, 1));
} finally { await c.end(); }
