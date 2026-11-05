#!/usr/bin/env node
// do-khu-trung-anh.mjs — hồ sơ _acceptance/khu-trung-anh-tin (GT1) AC-4, AC-5, AC-9: số ảnh khác nội dung mỗi tin trước và sau, trên
// dữ liệu thật, trong giao dịch READ ONLY. «Trước» là bảng media hiện tại; «sau» là dòng do cây dựng (dungDong), không ghi. Bảng media
// có thể cũ hơn bảng nạp một lượt, nên so trên tin có ở cả hai phía; tập băm mong đợi lấy từ bảng nạp, độc lập với luật khử.
// Thoát 1 khi mẫu số quá nhỏ, mất băm, còn trùng, S06 lệch, URL lệch, hai lượt dựng khác nhau, hay đối chứng không kêu.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { httpUrl, localFile, shaTep } from "../media-rows.mjs";
import { baiAnhCuaTin, dungDong } from "../transform-media.mjs";

const TRAN = 12;
export const TIN_TOI_THIEU = 1700;
const NGUON_BAI = ["S03", "S05"];

/** Từ các bài của một tin: tệp → băm, tập băm mong đợi, URL chưa có tệp mong đợi. */
export function dauVaoTin(posts) {
  const shaTheoTep = new Map();
  const urlCoTep = new Set();
  const urlCho = new Set();
  for (const p of posts) {
    const files = (Array.isArray(p.media_files) ? p.media_files : []).map((e) => e ?? {});
    for (const e of files) {
      const lf = localFile(e, p.snapshot_id);
      const u = httpUrl(e.url);
      if (lf) {
        if (shaTep(e)) shaTheoTep.set(lf, shaTep(e));
        if (u) urlCoTep.add(u);
      } else if (u) urlCho.add(u);
    }
    for (const m of Array.isArray(p.media) ? p.media : []) {
      const u = httpUrl(m?.url);
      if (u) urlCho.add(u);
    }
  }
  for (const u of urlCoTep) urlCho.delete(u);
  return { shaTheoTep, shaMong: new Set(shaTheoTep.values()), urlMong: urlCho };
}

/** Số ảnh khác nội dung trong trần: ảnh đã tải trước, rồi ảnh chỉ có URL, đúng thứ tự buildMediaImages. */
export function khacTrongTran(dong, shaCuaTep) {
  const coTep = dong.filter((r) => r.local_file);
  const conUrl = dong.filter((r) => !r.local_file && r.media_url);
  const hien = [...coTep, ...conUrl].slice(0, TRAN);
  return new Set(hien.map((r) => (r.local_file ? (shaCuaTep.get(r.local_file) ?? r.local_file) : r.media_url))).size;
}

/** Kiểm thuần. `truoc`, `sau`: offer_id → dòng; `vao`: offer_id → dauVaoTin; s06: hai Map cho S06. Trả mảng lỗi + số đo. */
export function kiem({ truoc, sau, vao, truocS06, sauS06 }) {
  const loi = [];
  const so = { so_duoc: 0, co_tep: 0, bam_mong: 0, bam_truoc_loai: 0, xoa: 0, doi_thu_tu: 0, tin_con_trung: 0, mat_bam: 0, url_lech: 0, s06_lech: 0 };
  for (const [id, d] of vao) {
    const s = sau.get(id) ?? [];
    const t = truoc.get(id);
    if (!t) continue;
    so.so_duoc++;
    if (d.shaMong.size) so.co_tep++;
    so.bam_mong += d.shaMong.size;
    const shaSau = s.filter((r) => r.local_file).map((r) => d.shaTheoTep.get(r.local_file) ?? r.local_file);
    if (new Set(shaSau).size !== shaSau.length) so.tin_con_trung++;
    for (const h of d.shaMong) if (!shaSau.includes(h)) so.mat_bam++;
    for (const r of t) if (r.local_file && !d.shaTheoTep.has(r.local_file)) so.bam_truoc_loai++;
    const urlSau = new Set(s.filter((r) => !r.local_file).map((r) => r.media_url));
    for (const u of d.urlMong) if (!urlSau.has(u)) so.url_lech++;
    // Thừa: URL của tệp đã khử quay lại thành dòng, ảnh trùng lấy lại chỗ trong trần.
    for (const u of urlSau) if (!d.urlMong.has(u)) so.url_lech++;
    const khoaSau = new Map(s.map((r) => [r.media_key, r.media_order]));
    for (const r of t) {
      if (!khoaSau.has(r.media_key)) so.xoa++;
      else if (khoaSau.get(r.media_key) !== r.media_order) so.doi_thu_tu++;
    }
  }
  for (const [id, t] of truocS06) {
    const s = sauS06.get(id);
    if (!s) continue;
    const gon = (ds) => JSON.stringify(ds.map((r) => [r.media_key, r.media_order, r.media_url, r.local_file]));
    if (gon(t) !== gon(s)) so.s06_lech++;
  }
  if (so.co_tep < TIN_TOI_THIEU) loi.push(`mẫu số: chỉ so được ${so.co_tep} tin có tệp (< ${TIN_TOI_THIEU})`);
  if (so.mat_bam) loi.push(`mất băm: ${so.mat_bam}`);
  if (so.tin_con_trung) loi.push(`còn trùng: ${so.tin_con_trung} tin`);
  if (so.s06_lech) loi.push(`S06 lệch: ${so.s06_lech} tin`);
  if (so.url_lech) loi.push(`URL lệch: ${so.url_lech}`);
  return { loi, so };
}

const theoTin = (rows) => {
  const m = new Map();
  for (const r of rows) m.set(r.resource_record_key, [...(m.get(r.resource_record_key) ?? []), r]);
  for (const ds of m.values()) ds.sort((a, b) => a.media_order - b.media_order);
  return m;
};

async function main() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  await c.query("BEGIN READ ONLY");
  try {
    const nguon = [...NGUON_BAI, "S06"];
    const tho = (await c.query(
      `SELECT resource_record_key, originating_system_name, media_key, media_order, media_url, local_file FROM media WHERE originating_system_name = ANY($1::text[])`,
      [nguon],
    )).rows;
    const mot = await dungDong(c, nguon);
    const hai = await dungDong(c, nguon);
    const sapXep = (rs) => JSON.stringify(rs.map((r) => [r.media_key, r.resource_record_key, r.media_order, r.local_file, r.media_url]).sort((a, b) => a[0].localeCompare(b[0])));
    const loiTatDinh = sapXep(mot) === sapXep(hai) ? [] : ["hai lượt dựng khác nhau"];

    const { rows: bai } = await c.query(
      `SELECT o.offer_id, p.snapshot_id, p.media, p.media_files FROM sale_offers o
       CROSS JOIN LATERAL unnest(o.post_ids) AS u(post_id)
       JOIN stg_zalo_posts p ON p.post_id = u.post_id WHERE o.source = ANY($1::text[])`,
      [NGUON_BAI],
    );
    const baiTheoTin = new Map();
    for (const b of bai) baiTheoTin.set(b.offer_id, [...(baiTheoTin.get(b.offer_id) ?? []), b]);
    for (const [id, ds] of await baiAnhCuaTin(c)) baiTheoTin.set(id, [...(baiTheoTin.get(id) ?? []), ...ds]);
    const vao = new Map([...baiTheoTin].map(([id, ds]) => [id, dauVaoTin(ds)]));

    const laBai = (r) => NGUON_BAI.includes(r.originating_system_name);
    const dauVao = {
      truoc: theoTin(tho.filter(laBai)),
      sau: theoTin(mot.filter(laBai)),
      vao,
      truocS06: theoTin(tho.filter((r) => r.originating_system_name === "S06")),
      sauS06: theoTin(mot.filter((r) => r.originating_system_name === "S06")),
    };
    const { loi, so } = kiem(dauVao);
    loi.push(...loiTatDinh);

    // Số trước và sau theo nguồn.
    for (const n of nguon) {
      const t = tho.filter((r) => r.originating_system_name === n);
      const s = mot.filter((r) => r.originating_system_name === n);
      console.log(`${n}: dòng ${t.length} → ${s.length} · dòng có tệp ${t.filter((r) => r.local_file).length} → ${s.filter((r) => r.local_file).length} · tin ${new Set(t.map((r) => r.resource_record_key)).size} → ${new Set(s.map((r) => r.resource_record_key)).size}`);
    }
    console.log(`mẫu số: tin so được ${so.so_duoc} · có tệp ${so.co_tep} · băm mong đợi ${so.bam_mong} · dòng trước có tệp không còn trong bảng nạp ${so.bam_truoc_loai}`);
    console.log(`sẽ xoá ${so.xoa} dòng · đổi thứ tự ${so.doi_thu_tu} dòng · mất băm ${so.mat_bam} · tin còn trùng ${so.tin_con_trung} · URL lệch ${so.url_lech} · S06 lệch ${so.s06_lech} tin`);

    // Số ảnh khác nội dung trong trần 12, trên tin có tệp.
    let tongTruoc = 0;
    let tongSau = 0;
    let tang = 0;
    let vuot = 0;
    let vuotTruoc = 0;
    let vuotSau = 0;
    let vuotDu = 0;
    for (const [id, d] of vao) {
      const t = dauVao.truoc.get(id);
      if (!t || !d.shaMong.size) continue;
      const s = dauVao.sau.get(id) ?? [];
      const a = khacTrongTran(t, d.shaTheoTep);
      const b = khacTrongTran(s, d.shaTheoTep);
      tongTruoc += a;
      tongSau += b;
      if (b > a) tang++;
      if (d.shaMong.size > TRAN) {
        vuot++;
        vuotTruoc += a;
        vuotSau += b;
        if (b === TRAN) vuotDu++;
      }
    }
    console.log(`ảnh khác nội dung trong trần ${TRAN}, cộng trên tin có tệp: ${tongTruoc} → ${tongSau} · ${tang} tin thấy thêm ảnh`);
    console.log(`tin vượt ${TRAN} ảnh khác nhau: ${vuot} tin · trong trần ${vuotTruoc} → ${vuotSau} · ${vuotDu}/${vuot} tin đủ ${TRAN} ảnh khác nhau`);
    if (vuotDu !== vuot) loi.push(`${vuot - vuotDu} tin vượt trần không đủ ${TRAN} ảnh khác nhau`);

    // Bốn đối chứng luôn chạy trên chính dữ liệu thật: phá một chỗ, thước phải kêu đúng tên.
    const tinTep = [...vao].find(([id, d]) => d.shaMong.size && dauVao.sau.get(id)?.some((r) => r.local_file) && dauVao.truoc.has(id))?.[0];
    const tinUrl = [...vao].find(([id, d]) => d.urlMong.size && dauVao.truoc.has(id))?.[0];
    const tinS06 = [...dauVao.sauS06.keys()].find((id) => dauVao.truocS06.has(id));
    const pha = (khoa, id, fn) => ({ ...dauVao, [khoa]: new Map(dauVao[khoa]).set(id, fn(dauVao[khoa].get(id) ?? [])) });
    const DC = [
      ["mất băm", tinTep && pha("sau", tinTep, (ds) => ds.filter((r) => !r.local_file))],
      ["còn trùng", tinTep && pha("sau", tinTep, (ds) => [...ds, { ...ds.find((r) => r.local_file), media_key: "dc" }])],
      ["S06 lệch", tinS06 && pha("sauS06", tinS06, (ds) => ds.slice(1))],
      ["URL lệch", tinUrl && pha("sau", tinUrl, (ds) => ds.filter((r) => r.local_file))],
    ];
    for (const [ten, vaoDc] of DC) {
      if (!vaoDc) loi.push(`đối chứng ${ten}: không có tin để phá`);
      else if (!kiem(vaoDc).loi.some((l) => l.startsWith(ten))) loi.push(`đối chứng ${ten} không kêu — thước không đo`);
    }
    if (!kiem({ ...dauVao, vao: new Map() }).loi.some((l) => l.startsWith("mẫu số"))) loi.push("đối chứng mẫu số không kêu");

    if (loi.length) {
      console.error(`do-khu-trung-anh: ${loi.length} lỗi — ${loi.join("; ")}`);
      process.exitCode = 1;
    } else console.log("do-khu-trung-anh: ĐẠT — không tin nào mất ảnh khác nội dung; năm đối chứng kêu đúng tên");
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
