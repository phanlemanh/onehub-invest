#!/usr/bin/env node
// ghep-tin-truc-can-kho.mjs — PL36 AC-9: chạy khô luật gắn trục, căn trên DB (chỉ đọc, không ghi).
// In theo khu: số bài, số tin mức toà, trục, căn, xung đột, số bài theo từng lý do không gắn; in từng tin mức căn kèm mã căn
// nguyên văn, tầng từ mã, tầng danh bạ để người soát. Thoát 1 khi tin mức trục + căn ở OP1 dưới ngưỡng (mặc định 350).
// Chạy: DATABASE_URL=… node scripts/ghep-tin-truc-can-kho.mjs [--nguong 350] [--json]
import pg from "pg";
import { KHU_SLUG } from "../lib/mau-hai-khu.mjs";
import { docDauVao, tinhGan } from "../lib/ghep-tin-truc-can-doc.mjs";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const NGUONG = Number(arg("--nguong", 350));

/** Gộp kết quả bài lên tin, cùng luật với view offer_unit. */
export function gopTin(tinToa, ketQuaBai) {
  const ra = new Map();
  for (const t of tinToa) {
    const kq = (t.post_ids ?? []).map((p) => ketQuaBai.get(p)).filter((x) => x?.muc);
    if (!kq.length) { ra.set(t.offer_id, { muc: "toa" }); continue; }
    const truc = new Set(kq.map((x) => x.stack));
    if (truc.size > 1 || kq.some((x) => x.toa !== t.building_key)) { ra.set(t.offer_id, { muc: "toa", xung_dot: true }); continue; }
    const tang = new Set(kq.filter((x) => x.muc === "can").map((x) => x.tang));
    const can = kq.find((x) => x.muc === "can");
    ra.set(t.offer_id, tang.size === 1 && can ? { muc: "can", stack: can.stack, unit: can.unit, bai: can } : { muc: "truc", stack: [...truc][0] });
  }
  return ra;
}

async function main() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL, options: "-c default_transaction_read_only=on -c statement_timeout=300s" });
  await c.connect();
  try {
    const vao = await docDauVao(c);
    const { ketQuaBai, dem } = tinhGan(vao);
    const { rows: tinToa } = await c.query(
      `SELECT b.offer_id, b.building_key, o.post_ids FROM offer_building b JOIN sale_offers o USING (offer_id)
        WHERE b.status = 'gan' AND b.muc = 'toa'`);
    const { rows: duAn } = await c.query(`SELECT id::text, slug FROM asset_nodes WHERE node_type = 'project' AND slug = ANY ($1)`, [Object.values(KHU_SLUG)]);
    const tenKhu = new Map(duAn.map((d) => [d.id, Object.keys(KHU_SLUG).find((k) => KHU_SLUG[k] === d.slug) ?? d.slug]));
    const khuCuaToa = new Map([...vao.bai.values()].map((b) => [b.toa, b.du_an]));
    const tin = gopTin(tinToa, ketQuaBai);
    const theoKhu = {};
    const canIn = [];
    for (const t of tinToa) {
      const k = tenKhu.get(khuCuaToa.get(t.building_key)) ?? "khac";
      const x = tin.get(t.offer_id);
      const o = (theoKhu[k] ??= { tin_toa: 0, truc: 0, can: 0, xung_dot: 0 });
      o.tin_toa++;
      if (x.xung_dot) o.xung_dot++; else if (x.muc !== "toa") o[x.muc]++;
      if (x.muc === "can") canIn.push({ khu: k, offer_id: t.offer_id, ma: x.bai.can_cu?.ma, tang_ma: x.bai.can_cu?.nguon_tang === "ma" ? x.bai.tang : null, tang_danh_ba: x.bai.tang, unit: x.unit });
    }
    const baiTheoKhu = Object.fromEntries(Object.entries(dem.theo_khu).map(([id, v]) => [tenKhu.get(id) ?? id, v]));
    if (process.argv.includes("--json")) {
      console.log(JSON.stringify({ bai: { ...dem, theo_khu: baiTheoKhu }, tin: theoKhu, can: canIn }, null, 1));
    } else {
      console.log(`Bài có toà: ${dem.tong} · trục ${dem.truc} · căn ${dem.can} · tầng suy từ mã ${dem.tang_tu_ma}`);
      for (const [k, v] of Object.entries(baiTheoKhu)) console.log(`  bài ${k}: ${v.bai} · trục ${v.truc} · căn ${v.can}`);
      console.log(`Lý do không gắn (theo bài): ${Object.entries(dem.ly_do).sort((a, b) => b[1] - a[1]).map(([l, n]) => `${l} ${n}`).join(" · ")}`);
      for (const [k, v] of Object.entries(theoKhu)) console.log(`Tin ${k}: mức toà ${v.tin_toa} → trục ${v.truc} · căn ${v.can} · xung đột ${v.xung_dot}`);
      console.log("Tin mức căn (mã căn · tầng từ mã · tầng danh bạ · căn):");
      for (const x of canIn) console.log(`  ${x.khu} ${x.offer_id} · ${x.ma} · ${x.tang_ma ?? "-"} · ${x.tang_danh_ba} · ${x.unit}`);
    }
    const op1 = theoKhu.op1 ?? theoKhu.OP1 ?? Object.entries(theoKhu).find(([k]) => /op1|ocean/i.test(k))?.[1];
    const soOp1 = op1 ? op1.truc + op1.can : 0;
    if (soOp1 < NGUONG) { console.error(`ĐỎ: OP1 tin mức trục + căn ${soOp1} < ${NGUONG}`); process.exitCode = 1; }
    else console.log(`XANH: OP1 tin mức trục + căn ${soOp1} ≥ ${NGUONG}`);
  } finally { await c.end(); }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
