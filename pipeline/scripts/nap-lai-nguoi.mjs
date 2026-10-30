#!/usr/bin/env node
// nap-lai-nguoi.mjs — thước DB2b `ho-nguoi-theo-nguon` (E7, E8 trên dữ liệu thật): hai lượt chạy trọn chuỗi đêm
// (transform S03 → S05 → S06 rồi bước bait gap + danh bạ Người) trên DB thử chép từ DB local, trong MỘT giao dịch
// ROLLBACK — DB không đổi. Lượt 2 phải ra 0 người/bí danh/vai mới, 0 vai rút, số sống bằng lượt 1.
// Đối chứng cùng dữ liệu, cùng giao dịch (SAVEPOINT): bộ dựng bỏ tra bí danh phải va chỉ mục duy nhất sống của
// registry_aliases — thước thấy được «nhân người» khi bộ dựng không tra bí danh.
// Exit 0 = đạt; 1 = lượt 2 khác 0, số lượt 2 khác lượt 1, đối chứng không ném, hay sellers thiếu người;
// 2 = lỗi / điều kiện dương không đạt (một nguồn có 0 người). `--doi-chung-hong`: đối chứng gọi bộ dựng CÓ tra bí danh
// (phá thử thước — phải thoát 1).
import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { KHOA_DANH_BA, chotDbThuNguoi, dungNguoi, sellersThieuNguoi } from "../lib/danh-ba-nguoi.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { buocDem } from "../refresh-bait-gap.mjs";
import { runTransformChotot } from "../transform-chotot.mjs";
import { runTransformFb } from "../transform-fb.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const MIG_055 = readFileSync(join(ROOT, "db/migrations/055_danh_ba_nguoi.sql"), "utf8");
const NGUON = ["S03", "S05", "S06"];

/** Số sống theo nguồn: người, bí danh, vai; và tổng dòng party_roles (kể cả đã rút). */
async function demTheoNguon(c) {
  const theo = async (sql) => Object.fromEntries((await c.query(sql)).rows.map((r) => [r.s, r.n]));
  const nguoi = await theo(`SELECT source AS s, count(*)::int AS n FROM parties WHERE status = 'active' GROUP BY 1`);
  const biDanh = await theo(`SELECT source AS s, count(*)::int AS n FROM registry_aliases WHERE retired_at IS NULL GROUP BY 1`);
  const vai = await theo(`SELECT left(subject_key, 3) AS s, count(*)::int AS n FROM party_roles WHERE retracted_at IS NULL GROUP BY 1`);
  const vaiTong = await theo(`SELECT left(subject_key, 3) AS s, count(*)::int AS n FROM party_roles GROUP BY 1`);
  return Object.fromEntries(NGUON.map((s) => [s, { nguoi: nguoi[s] ?? 0, bi_danh: biDanh[s] ?? 0, vai: vai[s] ?? 0, vai_tong: vaiTong[s] ?? 0 }]));
}
const inDem = (d) => NGUON.map((s) => `${s} nguoi=${d[s].nguoi} bi_danh=${d[s].bi_danh} vai=${d[s].vai} vai_tong=${d[s].vai_tong}`).join(" · ");

async function motLuot(c) {
  const log = console.log;
  console.log = () => {};
  try {
    await runTransformZalo(c);
    await runTransformFb(c);
    await runTransformChotot(c);
    return (await buocDem(c, { savepoint: true, runId: `nap-lai-nguoi-${Date.now()}` })).nguoi;
  } finally {
    console.log = log;
  }
}

/** Đếm các bảng mà thước có thể chạm, trên kết nối riêng (chứng ROLLBACK). Bảng chưa có → null. */
async function demBang(url) {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    const kq = {};
    for (const t of ["parties", "party_roles", "sale_offer_records"]) {
      const co = (await c.query("SELECT to_regclass($1) AS t", [`public.${t}`])).rows[0].t;
      kq[t] = co ? (await c.query(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n : null;
    }
    return kq;
  } finally {
    await c.end();
  }
}

/**
 * Hai lượt + đối chứng trong một giao dịch ROLLBACK.
 * @param {import("pg").Client} c
 */
export async function chayNapLaiNguoi(c, { doiChungHong = false, out = console.log } = {}) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA_DANH_BA]);
    if (!(await c.query("SELECT to_regclass('public.parties') AS t")).rows[0].t) await c.query(MIG_055);
    await napPhatBieu(c);

    const k1 = await motLuot(c);
    const luot1 = await demTheoNguon(c);
    out(`luot1: ${inDem(luot1)}`);
    const k2 = await motLuot(c);
    const luot2 = await demTheoNguon(c);
    out(`luot2: ${inDem(luot2)}`);
    const ketQua2 = { nguoi_moi: k2.nguoi_moi, bi_danh_moi: k2.bi_danh_moi, vai_moi: k2.vai_moi, vai_rut: k2.vai_rut };
    out(`ket-qua luot1: nguoi_moi=${k1.nguoi_moi} bi_danh_moi=${k1.bi_danh_moi} vai_moi=${k1.vai_moi} vai_rut=${k1.vai_rut}`);
    out(`ket-qua luot2: ${Object.entries(ketQua2).map(([k, v]) => `${k}=${v}`).join(" ")}`);
    const bangNhau = JSON.stringify(luot1) === JSON.stringify(luot2);
    out(`bang-nhau: ${bangNhau}`);

    let doiChungDo = false;
    await c.query("SAVEPOINT doi_chung");
    try {
      await dungNguoi(c, { runId: "nap-lai-nguoi-doi-chung", traBiDanh: doiChungHong, out: () => {} });
    } catch (e) {
      doiChungDo = e.code === "23505" && e.table === "registry_aliases";
      if (!doiChungDo) throw e;
    }
    await c.query("ROLLBACK TO SAVEPOINT doi_chung");
    out(doiChungDo
      ? "doi-chung bo-tra-bi-danh: loi trung khoa registry_aliases → do (đúng kỳ vọng)"
      : "doi-chung bo-tra-bi-danh: khong do — thước không thấy nhân người");

    const sellersThieu = await sellersThieuNguoi(c);
    out(`sellers_thieu_nguoi: ${sellersThieu.length}${sellersThieu.length ? ` (vd ${sellersThieu.slice(0, 3).join(", ")})` : ""}`);
    return { luot1, luot2, ketQua1: k1, ketQua2, bangNhau, doiChungDo, sellersThieu };
  } finally {
    await c.query("ROLLBACK").catch(() => {});
  }
}

async function main() {
  const doiChungHong = process.argv.includes("--doi-chung-hong");
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const { rows: [r] } = await c.query("SELECT current_database() AS db, to_regclass('public.parties')::text AS p");
    const chan = chotDbThuNguoi(r.db, Boolean(r.p));
    if (chan) {
      console.error(chan);
      process.exitCode = 2;
      return;
    }
    const truoc = await demBang(DB_URL);
    const kq = await chayNapLaiNguoi(c, { doiChungHong });
    const sau = await demBang(DB_URL);
    for (const t of Object.keys(truoc)) {
      const n = (x) => x ?? "không có bảng";
      console.log(truoc[t] === sau[t] ? `rollback: dem truoc = dem sau — ${t} ${n(truoc[t])}` : `rollback: LECH ${t} ${n(truoc[t])} → ${n(sau[t])}`);
    }
    const thieuNguoi = NGUON.filter((s) => ["nguoi", "bi_danh", "vai"].some((k) => kq.luot1[s][k] === 0));
    if (thieuNguoi.length) {
      console.error(`nap-lai-nguoi: điều kiện dương không đạt — nguồn có 0 người/vai: ${thieuNguoi.join(", ")}`);
      process.exitCode = 2;
      return;
    }
    const loi = [];
    if (Object.values(kq.ketQua2).some((n) => n !== 0)) loi.push("lượt 2 khác 0");
    if (!kq.bangNhau) loi.push("số lượt 2 khác lượt 1");
    if (!kq.doiChungDo) loi.push("đối chứng không ném");
    if (kq.sellersThieu.length) loi.push("sellers thiếu người");
    if (Object.keys(truoc).some((t) => truoc[t] !== sau[t])) loi.push("ROLLBACK không trả DB về như cũ");
    console.log(loi.length ? `nap-lai-nguoi: KHÔNG ĐẠT — ${loi.join(" · ")}` : "nap-lai-nguoi: ĐẠT");
    process.exitCode = loi.length ? 1 : 0;
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(2); });
