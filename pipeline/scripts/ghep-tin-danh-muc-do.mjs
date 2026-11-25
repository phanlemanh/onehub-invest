#!/usr/bin/env node
// ghep-tin-danh-muc-do.mjs — PL20: chạy khô luật gắn trên DB, phiên chỉ đọc, chỉ in số đếm (không in chữ bài, không in người bán).
//   node pipeline/scripts/ghep-tin-danh-muc-do.mjs --chi-doc [--json]
import pg from "pg";

import { THU_TU_NGUON, docDauVao, tinhGan } from "../lib/ghep-tin-danh-muc-doc.mjs";

const TEN_KHU = { 1: "OP1", 16: "GP" };
const pt = (a, b) => (b ? `${((100 * a) / b).toFixed(1)}%` : "n/a");

async function main() {
  const co = new Set(process.argv.slice(2));
  for (const a of co) if (!["--chi-doc", "--json"].includes(a)) { console.error(`co la: ${a}`); process.exit(2); }
  if (!co.has("--chi-doc")) { console.error("can --chi-doc: lenh nay chi do, khong ghi"); process.exit(2); }
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect();
  try {
    await c.query("SET default_transaction_read_only = on");
    const batDau = Date.now();
    const { dem } = tinhGan(await docDauVao(c));
    const giay = (Date.now() - batDau) / 1000;
    if (co.has("--json")) { console.log(JSON.stringify({ ...dem, giay })); return; }
    console.log(`gan ${dem.gan}/${dem.tong} = ${pt(dem.gan, dem.tong)} · tin ban ${dem.gan_ban}/${dem.ban} = ${pt(dem.gan_ban, dem.ban)}`);
    console.log(`toa ${dem.toa} (${pt(dem.toa, dem.tong)}) · vung ${dem.vung} (${pt(dem.vung, dem.tong)}) · xung dot ${dem.xung_dot} (${pt(dem.xung_dot, dem.gan)} so da gan)`);
    console.log(`theo khu: ${Object.entries(dem.theo_khu).map(([k, v]) => `${TEN_KHU[k] ?? k} ${v}`).join(" · ")}`);
    let luy = 0;
    for (const n of THU_TU_NGUON) { luy += dem.theo_nguon[n] ?? 0; console.log(`  ${n}: +${dem.theo_nguon[n] ?? 0} · luy ke ${luy} = ${pt(luy, dem.tong)}`); }
    console.log(`chua gan: ${Object.entries(dem.ly_do).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(" · ")}`);
    console.log(`thoi gian ${giay.toFixed(1)} giay`);
  } finally {
    await c.end();
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
