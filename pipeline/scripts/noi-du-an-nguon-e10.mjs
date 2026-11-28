#!/usr/bin/env node
// noi-du-an-nguon-e10.mjs — DA3 bang-noi-ma-du-an E10 (AC-3, phán của người ở Cổng Bằng chứng): danh sách ĐỦ mọi cặp nối của thẻ
// S07 (K2, K3, T), hai phía có địa chỉ và chủ đầu tư, tên ngắn hoặc chung chung xếp lên đầu. CHỈ ĐỌC (phiên read_only).
//   Bên nguồn: bản ghi chuẩn S07 (tên, tỉnh, xã, địa chỉ, chủ đầu tư) của lib/ban-ghi-nguon.mjs.
//   Bên nút: tên nút, tỉnh và xã của nút, hạng, nguồn đúc; nút do S08 đúc thêm địa chỉ và chủ đầu tư của dự án S08 đã nối vào nút.
//   Tệp chỉ mang mã nguồn S0x, không tên nguồn thật, không mã dự án nguồn.
// Chạy: cd pipeline && DATABASE_URL=… node scripts/noi-du-an-nguon-e10.mjs <tệp ra .md>
import { writeFileSync } from "node:fs";

import pg from "pg";

import { docBanGhi, docVung } from "../lib/ban-ghi-nguon.mjs";
import { docNut } from "../lib/khop-du-an.mjs";
import { chuanKhop } from "../lib/noi-du-an-s06-lop.mjs";
import { CATALOG_TIER } from "../lib/vocab.generated.mjs";
import { dungThe } from "../noi-du-an-nguon.mjs";

const RA = process.argv[2];
if (!RA) { console.error("dùng: noi-du-an-nguon-e10.mjs <tệp ra .md>"); process.exit(2); }
const c = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
  options: "-c default_transaction_read_only=on" });
await c.connect();
try {
  const ctx = await docVung(c);
  const bg = new Map((await docBanGhi(c, "S07", ctx)).map((b) => [b.ma, b]));
  const nut = new Map((await docNut(c)).map((n) => [n.id, n]));
  const { rows: vung } = await c.query("SELECT id, name FROM areas");
  const tenVung = new Map(vung.map((r) => [r.id, r.name]));
  const { rows: s08 } = await c.query(`SELECT pl.asset_node_id::int AS node_id, max(p.project_address) AS dia_chi, max(p.investor) AS cdt
      FROM project_links pl JOIN stg_s08_project p ON p.project_id = pl.source_project_id
     WHERE pl.source = 'S08' AND pl.status = 'noi' GROUP BY 1`);
  const s08Nut = new Map(s08.map((r) => [r.node_id, r]));
  const { ds } = await dungThe(c, "S07");
  const noi = ds.filter((d) => d.kq.nga === "noi");
  // Tên chung chung: tên chuẩn ≤ 2 từ, hay mở đầu bằng một từ rất phổ biến — người chấm cần nhìn các cặp này trước.
  const PHO_BIEN = /^(the|eco|central|city|home|park|garden|tower|plaza|residence|sky|green|golden|royal|sun|star|ocean|charm|citi)\b/i;
  const chung = (t) => { const k = chuanKhop(t ?? "") ?? ""; return k.split(/\s+/).filter(Boolean).length <= 2 || PHO_BIEN.test(String(t ?? "").trim()); };
  const o = (x) => String(x ?? "—").replace(/\|/g, "/").replace(/\s+/g, " ").trim() || "—";
  const dong = noi.map((d) => {
    const b = bg.get(d.ma), n = nut.get(d.kq.node_id), sp = s08Nut.get(d.kq.node_id);
    const hang = n?.tier === CATALOG_TIER.xac_minh ? "đã xác minh" : `ứng viên ${n?.nguonDuc ?? "—"}`;
    const xaNut = [...(n?.xa ?? [])].map((x) => tenVung.get(x) ?? x).join(", ");
    return { chung: chung(d.ten), can: d.kq.can_cu, ten: d.ten, cdt: b?.cdt, diaChi: b?.dia_chi, tinh: tenVung.get(d.tinh) ?? d.tinh, xa: tenVung.get(d.xa) ?? d.xa,
      nut: d.tenNut, hang, tinhNut: tenVung.get(n?.tinh) ?? n?.tinh, xaNut, diaChiNut: sp?.dia_chi, cdtNut: sp?.cdt };
  }).sort((a, b) => Number(b.chung) - Number(a.chung) || ["T", "K3", "K2"].indexOf(a.can) - ["T", "K3", "K2"].indexOf(b.can) || a.ten.localeCompare(b.ten, "vi"));
  const dem = (f) => noi.filter(f).length;
  const md = [
    "# E10 — mọi cặp nối của thẻ S07 (DA3), cho người chấm ở Cổng Bằng chứng", "",
    `Tổng ${noi.length} cặp: T ${dem((d) => d.kq.can_cu === "T")} · K3 ${dem((d) => d.kq.can_cu === "K3")} · K2 ${dem((d) => d.kq.can_cu === "K2")}. ` +
      `Tên ngắn hoặc chung chung (xếp đầu): ${dong.filter((x) => x.chung).length}.`, "",
    "Căn cứ: K2 = điểm ≤ 300 m và tên trùng; K3 = cùng xã và tên trùng; T = tên trùng đúng một nút cùng tỉnh. Phía nút: nút do S08 đúc",
    "có địa chỉ và chủ đầu tư của dự án S08 đã nối; nút S06 và nút đã xác minh không mang địa chỉ hay chủ đầu tư trong danh bạ.", "",
    "| # | Chung? | Căn cứ | Tên nguồn S07 | Chủ đầu tư S07 | Địa chỉ S07 | Tỉnh · xã S07 | Nút danh bạ | Hạng nút | Tỉnh · xã nút | Địa chỉ nút (S08) | Chủ đầu tư nút (S08) |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|",
    ...dong.map((x, i) => `| ${i + 1} | ${x.chung ? "chung" : ""} | ${x.can} | ${o(x.ten)} | ${o(x.cdt)} | ${o(x.diaChi)} | ${o(x.tinh)} · ${o(x.xa)} | ${o(x.nut)} | ${x.hang} | ${o(x.tinhNut)} · ${o(x.xaNut)} | ${o(x.diaChiNut)} | ${o(x.cdtNut)} |`),
    "",
  ].join("\n");
  writeFileSync(RA, md);
  console.log(`e10: ${noi.length} cặp (chung ${dong.filter((x) => x.chung).length}) → ${RA}`);
} finally { await c.end(); }
