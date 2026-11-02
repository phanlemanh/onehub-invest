#!/usr/bin/env node
// nap-lai-nguoi.mjs — thước DB2b `ho-nguoi-theo-nguon` (E7, E8 trên dữ liệu thật): hai lượt chạy trọn chuỗi đêm
// (transform S03 → S05 → S06 rồi bước bait gap + danh bạ Người) trên DB thử chép từ DB local, trong MỘT giao dịch
// ROLLBACK — DB không đổi. Lượt 2 phải ra 0 người/bí danh/vai mới, 0 vai rút, số sống bằng lượt 1.
// Đối chứng cùng dữ liệu, cùng giao dịch (SAVEPOINT): bộ dựng bỏ tra bí danh phải va chỉ mục duy nhất sống của
// registry_aliases — thước thấy được «nhân người» khi bộ dựng không tra bí danh.
// HD13 nguoi-noi-theo-sdt (E8): N1 của do-danh-ba-sdt (tinhSo, tệp không đổi trong vòng) trước lượt 1 = số gộp lượt 1, N1 sau
// = 0, mỗi lần gộp trỏ đúng người tài khoản của người gửi mà thước tự rút bằng SQL (không qua chonGop), 0 người cuối hai SĐT,
// 0 gộp khác nguồn, lượt 2 gộp 0; hai đối chứng trong SAVEPOINT: luật lỏng phải sinh người hai SĐT, gộp sai phải bị kiểm đích bắt.
// cong-tac-gop-nguoi-dem: lượt 0 công tắc tắt (gộp 0, gop_cho = N1 chưa gộp) → bật trong giao dịch → lượt 1 gộp như trên;
// đối chứng bước đêm ép gộp ở lượt 0 (SAVEPOINT) phải gộp > 0.
// Exit 0 = đạt; 1 = lượt 2 khác 0, số lượt 2 khác lượt 1, đối chứng không ném, sellers thiếu người, hay một kiểm HD13 hỏng;
// 2 = lỗi / điều kiện dương không đạt (một nguồn có 0 người). `--doi-chung-hong`: đối chứng gọi bộ dựng CÓ tra bí danh
// (phá thử thước — phải thoát 1).
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { CONG_TAC_GOP, KHOA_DANH_BA, chotDbThuNguoi, dungNguoi, ghiCongTac, sellersThieuNguoi } from "../lib/danh-ba-nguoi.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { napSdtE164 } from "../lib/nap-060.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { NGUON as NGUON_N1, KIEU_BI_DANH_SDT, tinhSo } from "../do-danh-ba-sdt.mjs";
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

// ---- HD13: thước gộp theo SĐT ----
const KENH_N1 = { S03: "zalo", S05: "facebook" };

/** Đầu vào của tinhSo đọc trong giao dịch đang mở (docDuLieu của do-danh-ba-sdt tự BEGIN/COMMIT nên không dùng được ở đây). */
async function soN1(c, { boQuaGop = false } = {}) {
  const { rows: tin } = await c.query(`SELECT source, seller_phone, seller_phone_hash, post_ids FROM sale_offers WHERE source = ANY ($1)`, [NGUON_N1]);
  const bai = {};
  for (const nguon of NGUON_N1) {
    const { posts } = await loadStgPosts(c, KENH_N1[nguon]);
    bai[nguon] = new Map(posts.map((p) => [p.post_id, { sender_id: p.sender_id, text: p.text }]));
  }
  const { rows: biDanh } = await c.query(`SELECT object_key, kind, value, source FROM registry_aliases
                                           WHERE retired_at IS NULL AND kind = ANY ($1) AND source = ANY ($2)`, [KIEU_BI_DANH_SDT, NGUON_N1]);
  const daGop = new Set(boQuaGop ? [] : (await c.query(`SELECT party_key FROM parties WHERE status = 'merged'`)).rows.map((r) => r.party_key));
  const coVai = new Set((await c.query(`SELECT DISTINCT party_key FROM party_roles WHERE retracted_at IS NULL`)).rows.map((r) => r.party_key));
  const kq = tinhSo({ tin, bai, biDanh, daGop, coVai, sellers: 0, sdtTrenTin: 0 });
  return Object.fromEntries(NGUON_N1.map((s) => [s, kq[s].n1.so]));
}

/**
 * Lần gộp (sự kiện gop sau id mốc) mà đích không phải người tài khoản của đúng một người gửi — người gửi rút thẳng từ tin sống
 * mang SĐT ấy + stg_zalo_posts, không qua bộ dựng. Đích đọc ở parties.merged_into và phải bằng related_keys[1] của sự kiện.
 */
async function gopSaiDich(c, sauId) {
  const { rows } = await c.query(`
    WITH ev AS (
      SELECT e.object_key AS ks, e.related_keys[1] AS ka_ev, p.merged_into AS ka, p.source
        FROM registry_events e JOIN parties p ON p.party_key = e.object_key
       WHERE e.kind = 'gop' AND e.id > $1 AND p.status = 'merged'),
    so AS (SELECT ev.*, a.value AS so FROM ev JOIN registry_aliases a ON a.object_key = ev.ks AND a.kind = 'sdt' AND a.retired_at IS NULL),
    gui AS (
      SELECT so.ks, array_agg(DISTINCT z.sender_id) AS nguoi
        FROM so JOIN sale_offer_records o ON o.source = so.source AND o.seller_phone = so.so AND o.retired_at IS NULL
        CROSS JOIN LATERAL unnest(o.post_ids) AS pid
        JOIN LATERAL (SELECT sender_id FROM stg_zalo_posts z
                       WHERE z.post_id = pid AND z.agent_id = CASE so.source WHEN 'S03' THEN 'openclaw-hook' ELSE 'apify-facebook' END
                       ORDER BY captured_at DESC LIMIT 1) z ON z.sender_id IS NOT NULL
       GROUP BY so.ks)
    SELECT so.ks, so.ka, so.ka_ev, gui.nguoi,
           (SELECT array_agg(a.object_key) FROM registry_aliases a
             WHERE a.source = so.source AND a.kind = 'tai_khoan_nguon' AND a.retired_at IS NULL AND a.value = ANY (gui.nguoi)) AS dung
      FROM so LEFT JOIN gui ON gui.ks = so.ks`, [sauId]);
  const sai = rows.filter((r) => r.ka !== r.ka_ev || !r.nguoi || r.nguoi.length !== 1 || !r.dung || r.dung.length !== 1 || r.dung[0] !== r.ka);
  return { so: rows.length, sai: sai.map((r) => r.ks) };
}

/**
 * Người cuối của chuỗi merged_into mang ≥ 2 SĐT (bí danh sdt sống) và lần gộp khác nguồn. HD17 (Hỏi-4): người cuối có
 * trong chuỗi một lần gộp lý do `the-duyet:` (thẻ người đã duyệt) được mang nhiều SĐT — đó là bí danh nối.
 */
async function viPhamMotSdt(c) {
  const haiSdt = (await c.query(`
    WITH RECURSIVE cuoi(k, c) AS (
      SELECT party_key, party_key FROM parties WHERE status <> 'merged'
      UNION ALL SELECT p.party_key, cuoi.c FROM parties p JOIN cuoi ON p.merged_into = cuoi.k WHERE p.status = 'merged')
    SELECT cuoi.c FROM cuoi JOIN registry_aliases a ON a.object_key = cuoi.k AND a.kind = 'sdt' AND a.retired_at IS NULL
    WHERE NOT EXISTS (SELECT 1 FROM cuoi x JOIN registry_events e ON e.object_key = x.k
                       WHERE x.c = cuoi.c AND e.kind = 'gop' AND e.reason LIKE 'the-duyet:%')
    GROUP BY cuoi.c HAVING count(DISTINCT a.value) > 1`)).rows.length;
  const khacNguon = (await c.query(`
    SELECT 1 FROM registry_events e JOIN parties a ON a.party_key = e.object_key JOIN parties b ON b.party_key = e.related_keys[1]
     WHERE e.kind = 'gop' AND a.source <> b.source`)).rows.length;
  return { haiSdt, khacNguon };
}

/** Một lượt đêm; `chiDem` bỏ ba transform (đối chứng trên dữ liệu lượt trước vừa dựng), `dung` thay bộ dựng (đối chứng). */
async function motLuot(c, { chiDem = false, dung } = {}) {
  const log = console.log;
  console.log = () => {};
  try {
    if (!chiDem) {
      await runTransformZalo(c);
      await runTransformFb(c);
      await runTransformChotot(c);
    }
    return (await buocDem(c, { savepoint: true, runId: `nap-lai-nguoi-${Date.now()}`, ...(dung ? { dung } : {}) })).nguoi;
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
export async function chayNapLaiNguoi(c, { doiChungHong = false, theDuyet = false, out = console.log } = {}) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA_DANH_BA]);
    if (!(await c.query("SELECT to_regclass('public.parties') AS t")).rows[0].t) await c.query(MIG_055);
    await napPhatBieu(c);
    await napSdtE164(c);

    const mocSuKien = Number((await c.query("SELECT coalesce(max(id), 0) AS m FROM registry_events")).rows[0].m);
    const gopCo = Number((await c.query("SELECT count(*) AS n FROM registry_events WHERE kind = 'gop'")).rows[0].n);
    // cong-tac-gop-nguoi-dem: lượt 0 với công tắc tắt (gỡ dòng sẵn có trong giao dịch) → không gộp, báo gop_cho theo nguồn.
    await c.query(`DELETE FROM ops_audit WHERE action = '${CONG_TAC_GOP}'`);
    const k0 = await motLuot(c);
    // N1 «chưa gộp»: sau lượt 0 (người theo SĐT đã có bí danh sdt, chưa ai gộp) — trước lượt 0 bí danh sdt chưa có (060 vừa
    // nạp), nên đếm sớm hơn luôn ra 0. Chỉ đúng khi DB chưa có lần gộp nào (gopCo).
    const n1Truoc = await soN1(c, { boQuaGop: true });
    out(`hd13 gop-co-san: ${gopCo} · n1-chua-gop: ${NGUON_N1.map((s) => `${s}=${n1Truoc[s]}`).join(" ")}`);
    const gop0 = Object.fromEntries(NGUON_N1.map((s) => [s, k0.theo_nguon?.[s]?.gop ?? 0]));
    const cho0 = Object.fromEntries(NGUON_N1.map((s) => [s, k0.theo_nguon?.[s]?.gop_cho ?? 0]));
    out(`cong-tac luot0: ${k0.cong_tac_gop} · gop ${NGUON_N1.map((s) => `${s}=${gop0[s]}`).join(" ")} · gop_cho ${NGUON_N1.map((s) => `${s}=${cho0[s]}`).join(" ")}`);
    // Đối chứng: bước đêm bỏ công tắc (ép gộp) ở lượt 0 → thước phải thấy lượt 0 gộp.
    await c.query("SAVEPOINT cong_tac");
    const ep = await motLuot(c, { chiDem: true, dung: (x, o) => dungNguoi(x, { ...o, gop: true }) });
    await c.query("ROLLBACK TO SAVEPOINT cong_tac");
    out(`doi-chung cong-tac bo-cong-tac: luot0 gop=${ep.gop}${ep.gop > 0 ? " → do (đúng kỳ vọng)" : " → khong do"}`);
    await ghiCongTac(c, { bat: true, lyDo: "nap-lai-nguoi: thước bật trong giao dịch ROLLBACK" });
    const k1 = await motLuot(c);
    const congTac = { k0, gop0, cho0, epGop: ep.gop, k1CongTac: k1.cong_tac_gop };
    const luot1 = await demTheoNguon(c);
    out(`luot1: ${inDem(luot1)}`);
    const n1Sau = await soN1(c);
    const gop1 = Object.fromEntries(NGUON_N1.map((s) => [s, k1.theo_nguon?.[s]?.gop ?? 0]));
    const dich = await gopSaiDich(c, mocSuKien);
    const motSdt = await viPhamMotSdt(c);
    out(`hd13 gop-luot1: ${NGUON_N1.map((s) => `${s}=${gop1[s]}`).join(" ")} · n1-sau: ${NGUON_N1.map((s) => `${s}=${n1Sau[s]}`).join(" ")}`);
    out(`hd13 dich-gop: ${dich.so} lần, sai ${dich.sai.length} · nguoi-hai-sdt: ${motSdt.haiSdt} · gop-khac-nguon: ${motSdt.khacNguon}`);
    out(`hd13 nhieu-nhieu: ${JSON.stringify(k1.nhieu_nhieu)}`);
    const k2 = await motLuot(c);
    const luot2 = await demTheoNguon(c);
    out(`luot2: ${inDem(luot2)}`);
    const ketQua2 = { nguoi_moi: k2.nguoi_moi, bi_danh_moi: k2.bi_danh_moi, vai_moi: k2.vai_moi, vai_rut: k2.vai_rut, gop: k2.gop };
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

    // HD13 đối chứng 1: luật lỏng (bỏ vế người gửi một SĐT) → thước phải thấy người cuối hai SĐT.
    await c.query("SAVEPOINT hd13_long");
    await dungNguoi(c, { runId: "nap-lai-nguoi-hd13-long", motSdtMoiNguoi: false, out: () => {} });
    const long = await viPhamMotSdt(c);
    await c.query("ROLLBACK TO SAVEPOINT hd13_long");
    out(`doi-chung hd13 luat-long: nguoi-hai-sdt=${long.haiSdt}${long.haiSdt > 0 ? " → do (đúng kỳ vọng)" : " → khong do"}`);
    // HD13 đối chứng 2: đổi đích của một lần gộp sang người tài khoản khác cùng nguồn → kiểm đích phải bắt.
    let gopSaiBat = null;
    const mau = (await c.query(`SELECT e.object_key AS ks, p.source FROM registry_events e JOIN parties p ON p.party_key = e.object_key
                                  WHERE e.kind = 'gop' AND e.id > $1 ORDER BY e.id LIMIT 1`, [mocSuKien])).rows[0];
    if (mau) {
      await c.query("SAVEPOINT hd13_sai");
      const khac = (await c.query(`SELECT a.object_key FROM registry_aliases a JOIN parties p ON p.party_key = a.object_key
                                     WHERE a.kind = 'tai_khoan_nguon' AND a.source = $1 AND p.status = 'active'
                                       AND a.object_key <> (SELECT merged_into FROM parties WHERE party_key = $2) LIMIT 1`, [mau.source, mau.ks])).rows[0].object_key;
      await c.query("UPDATE parties SET merged_into = $2 WHERE party_key = $1", [mau.ks, khac]);
      gopSaiBat = (await gopSaiDich(c, mocSuKien)).sai.includes(mau.ks);
      await c.query("ROLLBACK TO SAVEPOINT hd13_sai");
    }
    out(`doi-chung hd13 gop-sai: ${gopSaiBat === null ? "khong co lan gop nao" : gopSaiBat ? "bat (đúng kỳ vọng)" : "khong bat"}`);
    const hd13 = { gopCo, n1Truoc, n1Sau, gop1, dich, motSdt, long, gopSaiBat, congTac };

    const sellersThieu = await sellersThieuNguoi(c);
    out(`sellers_thieu_nguoi: ${sellersThieu.length}${sellersThieu.length ? ` (vd ${sellersThieu.slice(0, 3).join(", ")})` : ""}`);
    // HD17 `--the-duyet`: duyệt «gộp» một thẻ Người có ≥ 2 SĐT → người cuối hai SĐT có sự kiện the-duyet nên không vi phạm;
    // đối chứng: ép gộp hai người theo SĐT khác số mà không sự kiện the-duyet → thước phải thấy người hai SĐT.
    let td = null;
    if (theDuyet) {
      await c.query("SAVEPOINT the_duyet");
      try {
        const { rows: [the] } = await c.query(`SELECT id FROM review_queue WHERE item_type = 'data_quality' AND item_id LIKE 'nguoi:%'
          AND status = 'pending' AND jsonb_array_length(evidence->'sdt') >= 2 ORDER BY id LIMIT 1`);
        if (the) {
          await c.query("UPDATE review_queue SET status = 'approved', decided_by = 'nap-lai-nguoi', decided_at = now() WHERE id = $1", [the.id]);
          const kt = await motLuot(c, { chiDem: true });
          const sau = await viPhamMotSdt(c);
          const { rows: hai } = await c.query(`SELECT a.object_key FROM registry_aliases a JOIN parties p ON p.party_key = a.object_key
            WHERE a.kind = 'sdt' AND a.retired_at IS NULL AND p.status = 'active' AND a.source = 'S03' ORDER BY a.value LIMIT 2`);
          await c.query("UPDATE parties SET status = 'merged', merged_into = $2 WHERE party_key = $1 AND status = 'active'", [hai[0].object_key, hai[1].object_key]);
          const doiChung = await viPhamMotSdt(c);
          td = { the: the.id, theAp: kt.the_ap, haiSdt: sau.haiSdt, khacNguon: sau.khacNguon, haiSdtDoiChung: doiChung.haiSdt };
        } else td = { the: null };
      } finally {
        await c.query("ROLLBACK TO SAVEPOINT the_duyet");
      }
      out(`hd17 the-duyet: ${JSON.stringify(td)}`);
    }
    return { luot1, luot2, ketQua1: k1, ketQua2, bangNhau, doiChungDo, sellersThieu, hd13, theDuyet: td };
  } finally {
    await c.query("ROLLBACK").catch(() => {});
  }
}

async function main() {
  const doiChungHong = process.argv.includes("--doi-chung-hong");
  const theDuyet = process.argv.includes("--the-duyet");
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
    const bamN1 = execFileSync("git", ["hash-object", join(ROOT, "pipeline/do-danh-ba-sdt.mjs")], { encoding: "utf8" }).trim();
    console.log(`hd13 tinhSo: pipeline/do-danh-ba-sdt.mjs ${bamN1}`);
    const truoc = await demBang(DB_URL);
    const kq = await chayNapLaiNguoi(c, { doiChungHong, theDuyet });
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
    const h = kq.hd13;
    if (h.gopCo) loi.push(`HD13 DB đã có ${h.gopCo} lần gộp — thước N1 chưa gộp chỉ đúng trên DB chưa gộp`);
    for (const s of NGUON_N1) if (h.gop1[s] !== h.n1Truoc[s]) loi.push(`HD13 gộp lượt 1 ${s}=${h.gop1[s]} khác N1 chưa gộp ${h.n1Truoc[s]}`);
    for (const s of NGUON_N1) if (h.n1Sau[s] !== 0) loi.push(`HD13 N1 sau lượt 1 ${s}=${h.n1Sau[s]}`);
    if (h.dich.sai.length) loi.push(`HD13 gộp sai đích ${h.dich.sai.length}`);
    if (h.motSdt.haiSdt || h.motSdt.khacNguon) loi.push("HD13 người hai SĐT hay gộp khác nguồn");
    if (!(h.long.haiSdt > 0)) loi.push("HD13 đối chứng luật lỏng không đỏ");
    if (h.gopSaiBat !== true) loi.push("HD13 đối chứng gộp sai không bị bắt");
    const ct = h.congTac;
    if (ct.k0.cong_tac_gop !== "tat" || ct.k0.gop !== 0) loi.push(`công tắc lượt 0 ${ct.k0.cong_tac_gop} gộp ${ct.k0.gop}`);
    for (const s of NGUON_N1) if (ct.cho0[s] !== h.n1Truoc[s]) loi.push(`công tắc gop_cho lượt 0 ${s}=${ct.cho0[s]} khác N1 chưa gộp ${h.n1Truoc[s]}`);
    if (!(ct.epGop > 0)) loi.push("đối chứng bỏ công tắc không đỏ");
    if (ct.k1CongTac !== "bat") loi.push(`công tắc lượt 1 ${ct.k1CongTac}`);
    if (Object.keys(truoc).some((t) => truoc[t] !== sau[t])) loi.push("ROLLBACK không trả DB về như cũ");
    const td = kq.theDuyet;
    if (theDuyet && !td?.the) loi.push("HD17 không có thẻ Người ≥ 2 SĐT để thử");
    if (td?.the && !(td.theAp > 0)) loi.push("HD17 thẻ duyệt không áp");
    if (td?.the && (td.haiSdt || td.khacNguon)) loi.push(`HD17 người hai SĐT sau thẻ duyệt ${td.haiSdt}`);
    if (td?.the && !(td.haiSdtDoiChung > 0)) loi.push("HD17 đối chứng hai SĐT không sự kiện the-duyet không đỏ");
    console.log(loi.length ? `nap-lai-nguoi: KHÔNG ĐẠT — ${loi.join(" · ")}` : "nap-lai-nguoi: ĐẠT");
    process.exitCode = loi.length ? 1 : 0;
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(2); });
