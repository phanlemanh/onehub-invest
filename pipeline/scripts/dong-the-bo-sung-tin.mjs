#!/usr/bin/env node
// dong-the-bo-sung-tin.mjs — NB9: đóng thẻ «Bổ sung tin» theo luật xác định (pipeline/lib/dong-the-bo-sung-tin.mjs).
//   node pipeline/scripts/dong-the-bo-sung-tin.mjs --thu           in số từng nhóm + câu đếm độc lập; giao dịch chỉ đọc
//   node pipeline/scripts/dong-the-bo-sung-tin.mjs --that          đóng trong MỘT giao dịch, ghi tệp lùi
//   node pipeline/scripts/dong-the-bo-sung-tin.mjs --lui <tệp>     lùi một lượt; dòng đã bị đổi sau đó không đè (thoát 3)
// DATABASE_URL trỏ DB. Tệp lùi: .acceptance-runs/dong-the-bo-sung-tin-theo-luat/lui-<lượt>.json (ngoài git); tệp chỉ mang
// tên cuối sau khi COMMIT xong — tệp `.dang-ghi` còn sót là lượt chưa hoàn tất, không dùng để lùi.
import { mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { SQL_DEM_DOC_LAP, dongTrongGiaoDich, luiTrongGiaoDich, phanNhom } from "../lib/dong-the-bo-sung-tin.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const THU_MUC_LUI = path.join(ROOT, ".acceptance-runs", "dong-the-bo-sung-tin-theo-luat");

/** Ranh giới giao dịch; test truyền SAVEPOINT để chạy trong giao dịch ngoài rồi lùi. */
const GD_MAC_DINH = Object.freeze({ begin: "BEGIN", commit: "COMMIT", rollback: "ROLLBACK", beginDoc: "BEGIN TRANSACTION READ ONLY" });

const maLuot = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");

/** Chế độ thử: giao dịch chỉ đọc, trả số. */
export async function chayThu(c, gd = GD_MAC_DINH) {
  await c.query(gd.beginDoc ?? gd.begin);
  try {
    const pn = await phanNhom(c);
    const dem = {};
    for (const [k, sql] of Object.entries(SQL_DEM_DOC_LAP)) dem[k] = Number((await c.query(sql)).rows[0].count);
    return { tongCho: pn.tongCho, ngoaiPhamVi: pn.nhom1.length, nhom2: pn.nhom2.length, soDeXuat: pn.soDeXuat, conLai: pn.conLai, dem };
  } finally {
    await c.query(gd.rollback);
  }
}

/** Chế độ thật: một giao dịch; tệp lùi ghi tên tạm trước COMMIT, đổi tên sau COMMIT. */
export async function chayThat(c, o = {}) {
  const luot = o.luot ?? maLuot();
  const thuMuc = o.thuMuc ?? THU_MUC_LUI;
  mkdirSync(thuMuc, { recursive: true });
  const tep = path.join(thuMuc, `lui-${luot}.json`);
  const gd = o.gd ?? GD_MAC_DINH;
  await c.query(gd.begin);
  let kq;
  try {
    kq = await dongTrongGiaoDich(c, { luot, sauMoiThe: o.sauMoiThe });
    writeFileSync(`${tep}.dang-ghi`, JSON.stringify(kq, null, 1));
    await c.query(gd.commit);
  } catch (e) {
    await c.query(gd.rollback).catch(() => {});
    throw e;
  }
  renameSync(`${tep}.dang-ghi`, tep);
  return { ...kq, tep };
}

/** Lùi một lượt trong một giao dịch. */
export async function chayLui(c, tepLui, gd = GD_MAC_DINH) {
  const tep = JSON.parse(readFileSync(tepLui, "utf8"));
  await c.query(gd.begin);
  try {
    const kq = await luiTrongGiaoDich(c, tep);
    await c.query(gd.commit);
    return kq;
  } catch (e) {
    await c.query(gd.rollback).catch(() => {});
    throw e;
  }
}

async function main(argv) {
  const che = argv.includes("--that") ? "that" : argv.includes("--lui") ? "lui" : argv.includes("--thu") ? "thu" : null;
  if (!che) { console.error("cần --thu, --that hoặc --lui <tệp>"); return 2; }
  if (!process.env.DATABASE_URL) { console.error("thiếu DATABASE_URL"); return 2; }
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    if (che === "thu") {
      const k = await chayThu(c);
      console.log(`thẻ «Bổ sung tin» chờ: ${k.tongCho}`);
      console.log(`nhóm 1 khong-con-de-xuat: ${k.ngoaiPhamVi} thẻ — KHÔNG đóng (thẻ đối chiếu chưa xét, NB5) (câu đếm độc lập: ${k.dem["khong-con-de-xuat"]})`);
      console.log(`nhóm 2 trung-gia-tri-tin: ${k.nhom2} thẻ, ${k.soDeXuat} đề xuất → skipped (câu đếm độc lập: ${k.dem["trung-gia-tri-tin"]})`);
      console.log(`còn chờ sau khi đóng: ${k.conLai}`);
      for (const [n, sql] of Object.entries(SQL_DEM_DOC_LAP)) console.log(`-- ${n}\n${sql}`);
      return k.dem["khong-con-de-xuat"] === k.ngoaiPhamVi && k.dem["trung-gia-tri-tin"] === k.nhom2 ? 0 : 1;
    }
    if (che === "that") {
      const k = await chayThat(c);
      console.log(`đã đóng: nhóm 2 ${k.nhom2} thẻ, ${k.soDeXuat} đề xuất skipped · nhóm 1 không đóng ${k.ngoaiPhamVi} · còn chờ ${k.conLai}`);
      console.log(`tệp lùi: ${k.tep}`);
      return 0;
    }
    const i = argv.indexOf("--lui");
    const tep = argv[i + 1];
    if (!tep) { console.error("--lui cần đường tệp"); return 2; }
    const k = await chayLui(c, tep);
    console.log(`đã lùi: ${k.soThe} thẻ, ${k.soDeXuat} đề xuất`);
    if (k.xungDot.length) { console.log(`xung đột (không đè): ${k.xungDot.join(", ")}`); return 3; }
    return 0;
  } finally {
    await c.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((rc) => { process.exitCode = rc; }, (e) => { console.error(e); process.exitCode = 1; });
}
