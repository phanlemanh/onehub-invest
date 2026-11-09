#!/usr/bin/env node
// do-lam-giau.mjs — DO3 (AC-1..AC-8): đo làm giàu hằng ngày theo từng đường vào dq_check_results.
//   node pipeline/do-lam-giau.mjs [--write] [--ngay YYYY-MM-DD]
// Không --write: tính trong giao dịch rồi ROLLBACK, in tóm tắt. --write: khoá advisory 56086 trong giao dịch, gộp dòng đổi của ngày
// (giờ VN) vào enrichment_value_change, thay ảnh chụp enrichment_value_state, ghi lại dòng do3-thay-doi của ngày. Lần đầu mỗi đường
// chỉ lập mốc. Hai bảng 086 chỉ ở máy thu; số gộp lên cloud qua dq_check_results (đã có trong FILL). detail qua chanLo của DO1.
// DB chưa áp 086 → in CHUA-AP-086, không ghi, thoát 0 (bước đêm không đỏ trước khi Mạnh áp). Không gọi model ở mọi đường.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { chanLo, gopOCam, ngayVn, phanRa, tuanIso, tuanTruoc } from "./lib/do-hang-ngay.mjs";
import {
  daCoLamGiau, daLapMoc, docBaiNguoi, docBaiNhom, docGiaTriSong, docNguoiDe, docNguoiRut, docNhanNgay, docViTriTin, SO_MIG,
} from "./lib/do-lam-giau-db.mjs";
import {
  demNguoiDe, demThayDoi, DUONG, gopNgay, kiemNguocNhom, kiemNguocSo, latPhang, NHOM_LAT_THAY_DOI, ngayDauTuan, nguoiSua, PHIEN_BAN_THUOC, soAnh,
  tongKiem, tuSoat,
} from "./lib/do-lam-giau.mjs";
import { chuoiCam, KHOA_LAT_DON_VI } from "./do-hang-ngay.mjs";

// Lát dùng lại đúng hai hàm của DO1 (không bản chép) — test so tham chiếu.
export { KHOA_LAT_DON_VI, phanRa };

const truNgay = (ngay, n) => {
  const d = new Date(`${ngay}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

/** Phân rã một tập tin theo mọi chiều của DO1. Tin không còn vị trí (đã xoá khỏi bảng) vào ô chưa gắn. */
export function latTin(offerIds, viTri, { dotBien } = {}) {
  const ra = {};
  for (const [chieu, k] of Object.entries(KHOA_LAT_DON_VI)) {
    if (dotBien === "bo-thi-truong" && chieu === "thi_truong") continue;
    ra[chieu] = phanRa(offerIds, (id) => k(viTri.get(id) ?? {}), () => 1, 30, { dotBien });
  }
  return ra;
}

async function thayAnhChup(client, d, nay, ngay) {
  await client.query("DELETE FROM enrichment_value_state WHERE duong = $1", [d.duong]);
  const ds = [...nay.entries()];
  for (let i = 0; i < ds.length; i += 5000) {
    const lo = ds.slice(i, i + 5000);
    await client.query(
      `INSERT INTO enrichment_value_state (duong, subject_key, value_key, offer_id, seen_on)
       SELECT $1, k, v, o, $5::date FROM unnest($2::text[], $3::text[], $4::text[]) AS x(k, v, o)`,
      [d.duong, lo.map(([k]) => k), lo.map(([, v]) => v.value_key), lo.map(([, v]) => v.offer_id ?? null), ngay]);
  }
}

/**
 * Gộp thay đổi của lượt vào dòng đổi của ngày, trả mọi dòng ngày D của đường (dòng đếm).
 * Đột biến `hai-dong`: đếm trên dòng cũ cộng dòng lượt này, không gộp theo chủ thể.
 */
async function gopVaoNgay(client, d, ngay, doi, { dotBien } = {}) {
  const { rows: cu } = await client.query(
    "SELECT subject_key, from_value, to_value, huong, offer_id FROM enrichment_value_change WHERE snap_date = $1 AND duong = $2", [ngay, d.duong]);
  const theo = new Map(cu.map((r) => [r.subject_key, r]));
  for (const s of doi) {
    const m = gopNgay(theo.get(s.subject_key), s, { dotBien });
    if (!m) {
      await client.query("DELETE FROM enrichment_value_change WHERE snap_date = $1 AND duong = $2 AND subject_key = $3", [ngay, d.duong, s.subject_key]);
      theo.delete(s.subject_key);
      continue;
    }
    const offer = s.offer_id ?? theo.get(s.subject_key)?.offer_id ?? null;
    await client.query(
      `INSERT INTO enrichment_value_change (snap_date, duong, subject_key, from_value, to_value, huong, offer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (snap_date, duong, subject_key) DO UPDATE SET to_value = EXCLUDED.to_value, huong = EXCLUDED.huong, offer_id = EXCLUDED.offer_id`,
      [ngay, d.duong, s.subject_key, m.from_value, m.to_value, m.huong, offer]);
    theo.set(s.subject_key, { subject_key: s.subject_key, ...m, offer_id: offer });
  }
  return dotBien === "hai-dong" ? [...cu, ...doi] : [...theo.values()];
}

/**
 * Một lượt đo DO3 của ngày `ngay` (giờ VN). Ghi ảnh chụp và dòng đổi trong giao dịch của người gọi; `write` ghi dòng dq.
 * @param {import("pg").Client} client đang ở trong giao dịch
 * Kiểm ngược: mỗi đường đang chạy, tuần ISO (giờ VN) của `ngay` chưa có dòng `do3-kiem-nguoc` thì tính và ghi trong CÙNG giao dịch —
 * lượt lỗi giữa chừng rút cả giao dịch, lượt kế trong tuần chạy lại. Đường đang chạy chưa có hàm kiểm ngược ghi skip một lần mỗi tuần.
 * @param {{ ngay?: string, write?: boolean, dotBien?: string, duong?: typeof DUONG, kiemNguoc?: boolean, loiTiem?: string }} [o]
 *   `dotBien` chỉ cho thước (bản đột biến của từng phép đo); `duong` chỉ cho thước thay sổ đường; `kiemNguoc: false` bỏ phần kiểm
 *   ngược (thước của phần thay đổi); `loiTiem` chỉ cho thước — ném lỗi sau khi tính, trước khi ghi.
 * @returns {Promise<{dq: {check_name: string, entity: string, status: string, detail: object}[], chua_ap?: string,
 *   dong?: Record<string, object[]>}>}
 */
export async function doLamGiau(client, { ngay = ngayVn(Date.now()), write = false, dotBien, duong = DUONG, kiemNguoc = true, loiTiem } = {}) {
  if (!(await daCoLamGiau(client))) return { dq: [], chua_ap: SO_MIG };
  const ra = [], dong = {}, tinCam = new Set(), nhanCam = [], dangChay = new Set();
  const { rows: hq } = await client.query(
    `SELECT DISTINCT ON (entity) entity, detail FROM dq_check_results
      WHERE check_name = 'do3-thay-doi' AND detail::jsonb ->> 'ngay' = $1 ORDER BY entity, checked_at DESC`, [truNgay(ngay, 1)]);
  const homQua = new Map(hq.map((r) => [r.entity, JSON.parse(r.detail)]));

  for (const d of duong) {
    const goc = { rule_ids: [...d.rule_ids], phien_ban_thuoc: PHIEN_BAN_THUOC };
    // 1–3. Giá trị sống và ảnh chụp lần trước. Ảnh chụp rỗng chưa nói được đường chưa lập mốc (đường đã lập mốc mà mất hết giá trị
    // cũng để ảnh chụp rỗng), nên hỏi thêm dấu bền `daLapMoc`. «Chưa chạy» (không ô số 0) chỉ khi không giá trị, không ảnh chụp và
    // chưa lập mốc; đã lập mốc thì đi đường so ảnh chụp — mất hết ra máy rút, song 0; giá trị quay lại ra «thêm» (AC-2).
    const nay = await docGiaTriSong(client, d, { dotBien });
    const { rows: tr } = await client.query("SELECT subject_key, value_key, offer_id FROM enrichment_value_state WHERE duong = $1", [d.duong]);
    const lapMoc = tr.length > 0 || await daLapMoc(client, d.duong);
    if (!nay.size && (!lapMoc || dotBien === "mat-het-la-chua-chay")) {
      const so0 = dotBien === "chua-chay-so-0" ? { song: 0, them: 0, doi: 0, may_rut: 0, nguoi_sua: 0 } : {};
      ra.push({ check_name: "do3-thay-doi", entity: d.duong, status: "skip", detail: { ngay, ly_do: "chua-chay", ...so0, ...goc } });
      continue;
    }
    dangChay.add(d.duong);
    if (d.doc === "so-tren-tin") for (const v of nay.values()) tinCam.add(v.offer_id);
    // Ảnh chụp chưa có → lập mốc.
    if (!lapMoc && dotBien !== "lap-moc-co-dong") {
      await thayAnhChup(client, d, nay, ngay);
      ra.push({ check_name: "do3-thay-doi", entity: d.duong, status: "skip", detail: { ngay, ly_do: "lap-moc", song: nay.size, ...goc } });
      continue;
    }
    // 4–6. Người rút trong ngày, so ảnh chụp, gộp vào dòng đổi của ngày, thay ảnh chụp.
    const nguoiRut = await docNguoiRut(client, d, ngay, { dotBien });
    const truoc = new Map(tr.map((r) => [r.subject_key, { value_key: r.value_key, offer_id: r.offer_id }]));
    const dongNgay = await gopVaoNgay(client, d, ngay, soAnh(truoc, nay, nguoiRut, { dotBien }), { dotBien });
    dong[d.duong] = dongNgay;
    await thayAnhChup(client, d, nay, ngay);
    // 7–8. Đếm; người sửa, người rút.
    const dem = demThayDoi(dongNgay);
    const nhan = await docNhanNgay(client, d, ngay, { dotBien });
    nhanCam.push(...nhan);
    for (const n of nhan) if (d.doc === "so-tren-tin") tinCam.add(n.offer_id);
    const ns = d.o_nhan ? nguoiSua(nhan, d.o_nhan, { dotBien }) : { nguoi_sua: 0, nhan_da_so: 0 };
    // Người sửa bằng ghi đè (`hitl`) cộng vào `nguoi_sua`, ghi riêng ở `nguoi_sua_de`; đường không có lối ghi đè không có khoá.
    if (d.nguoi_de) {
      const de = dotBien === "bo-de" ? 0 : demNguoiDe(nay, await docNguoiDe(client, d, ngay, { dotBien }), { dotBien });
      ns.nguoi_sua += de;
      ns.nguoi_sua_de = de;
    }
    const rut = d.nguoi_rut ? { nguoi_rut: nguoiRut.size } : dotBien === "khong-loi-ghi-0" ? { nguoi_rut: 0 } : { duong_nguoi_rut: false };
    // 9. Lát: tin của giá trị sống và tin của dòng đổi.
    const tinSong = [...nay.values()].map((v) => v.offer_id);
    const viTri = await docViTriTin(client, [...tinSong, ...dongNgay.map((r) => r.offer_id)]);
    const theoHuong = (h) => dongNgay.filter((r) => r.huong === h).map((r) => r.offer_id);
    const lat = Object.fromEntries(NHOM_LAT_THAY_DOI.map((n) => [n, latTin(n === "song" ? tinSong : theoHuong(n), viTri, { dotBien })]));
    const detail = { ngay, song: nay.size + (dotBien === "song-lech" ? 1 : 0), ...dem, ...ns, ...rut, lat, ...goc };
    // 10. Tự soát với song của dòng hôm qua.
    const sHq = homQua.get(d.duong)?.song;
    const lech = tuSoat({ ...detail, song_hom_qua: typeof sHq === "number" ? sHq : null, lat: latPhang(lat) });
    if (lech) detail.soat_lech = lech;
    ra.push({ check_name: "do3-thay-doi", entity: d.duong, status: lech || dotBien === "fail-khong-ly-do" ? "fail" : "pass", detail });
  }

  if (kiemNguoc) ra.push(...await kiemNguocTuan(client, duong.filter((d) => dangChay.has(d.duong)), ngay, { dotBien }));
  if (loiTiem) throw new Error(loiTiem);

  // ---- Chặn rò (AC-8) rồi ghi ----
  await chanLoDo3(client, ra, { tinCam, nhanCam, dotBien });
  if (write) {
    // Một dòng mỗi (đường, ngày đo): xoá theo ngày đo ghi trong detail (không theo giờ chạy), nên lượt qua nửa đêm VN không đè ngày cũ.
    if (dotBien !== "dong-lap") {
      await client.query(`DELETE FROM dq_check_results WHERE check_name = 'do3-thay-doi' AND detail::jsonb ->> 'ngay' = $1`, [ngay]);
    }
    for (const r of ra) {
      await client.query(`INSERT INTO dq_check_results (checked_at, check_name, entity, status, detail) VALUES (clock_timestamp(), $1, $2, $3, $4)`,
        [r.check_name, r.entity, r.status, JSON.stringify(r.detail)]);
    }
  }
  return { dq: ra, dong };
}

/** Dòng `do3-kiem-nguoc` của tuần ISO chứa `ngay` cho các đường đang chạy chưa có dòng tuần đó. */
async function kiemNguocTuan(client, dangChay, ngay, { dotBien } = {}) {
  const tuan = tuanIso(ngay), tTruoc = tuanTruoc(tuan, ngay);
  const ra = [];
  let nguoi, nhom;
  for (const d of dangChay) {
    const { rows: co } = await client.query(
      `SELECT 1 FROM dq_check_results WHERE check_name = 'do3-kiem-nguoc' AND entity = $1 AND detail::jsonb ->> 'tuan' = $2 LIMIT 1`, [d.duong, tuan]);
    if (co.length && dotBien !== "lap-tuan") continue;
    if (dotBien === "chi-luot-dau" && ngay !== ngayDauTuan(ngay)) continue;
    if (!d.kiem) {
      const so0 = dotBien === "chua-kiem-so-0" ? { n: 0, dung: 0, sai: 0, khong_ra: 0 } : { ly_do: "chua-co-kiem-nguoc" };
      ra.push({ check_name: "do3-kiem-nguoc", entity: d.duong, status: dotBien === "chua-kiem-so-0" ? "pass" : "skip", detail: { tuan, ...so0, phien_ban_thuoc: PHIEN_BAN_THUOC } });
      continue;
    }
    let k, tinCua;
    if (d.kiem === "so") {
      nguoi ??= await docBaiNguoi(client);
      if (!nguoi) continue; // chưa áp 079: đường số không chạy được
      k = kiemNguocSo(nguoi.bai, nguoi.tins, nguoi.nguoiCuaTaiKhoan, { dotBien });
      tinCua = (id) => id;
    } else {
      nhom ??= await docBaiNhom(client);
      k = kiemNguocNhom(nhom.bai, { dotBien });
      tinCua = (pid) => nhom.tinCuaBai.get(pid) ?? null;
    }
    const { rows: [tr] } = await client.query(
      `SELECT detail FROM dq_check_results WHERE check_name = 'do3-kiem-nguoc' AND entity = $1 AND detail::jsonb ->> 'tuan' = $2
        ORDER BY checked_at DESC LIMIT 1`, [d.duong, tTruoc]);
    const truoc = tr ? JSON.parse(tr.detail) : null;
    const theoKet = { dung: [], sai: [], khong_ra: [] };
    for (const [id, x] of k.ket) theoKet[x].push(tinCua(id));
    const viTri = await docViTriTin(client, Object.values(theoKet).flat());
    const lat = Object.fromEntries(Object.entries(theoKet).map(([x, ids]) => [x, latTin(ids, viTri, { dotBien })]));
    ra.push({
      check_name: "do3-kiem-nguoc", entity: d.duong, status: "pass",
      detail: { tuan, tap_do: k.tap_do, n: k.n, dung: k.dung, sai: k.sai, khong_ra: k.khong_ra, ...tongKiem(k, truoc, { dotBien }), lat, phien_ban_thuoc: PHIEN_BAN_THUOC },
    });
  }
  return ra;
}

/**
 * Chặn rò bằng bộ của DO1: chuỗi cấm = tên nguồn thật (source_registry rỗng → dừng), người gắn nhãn, chữ bài và người đăng của
 * bài đã so nhãn, SĐT + băm SĐT + tên người bán của tin mang số suy. Ô lát mang chữ bài trùng chuỗi cấm gộp vào «khac» trước.
 * Có rò → ném `LO DO3: LO <nhãn>`, không dòng nào được ghi.
 */
export async function chanLoDo3(client, ra, { tinCam, nhanCam, dotBien }) {
  const { rows: tin } = await client.query(
    "SELECT offer_id, seller_phone, seller_phone_hash, seller_name FROM sale_offer_records WHERE offer_id = ANY ($1::text[])",
    [[...tinCam].filter(Boolean)]);
  let cam;
  try {
    cam = await chuoiCam(client, nhanCam.map((n) => ({ item_id: n.item_id, ref_id: n.ref_id })), [], tin);
  } catch (e) { throw new Error(`LO DO3: ${e.message}`); }
  for (const r of tin) if (r.seller_phone_hash) cam.push({ nhan: "SDT", chuoi: r.seller_phone_hash });
  const moi = new Map(cam.map((x) => [`${x.nhan}|${x.chuoi}`, x]));
  cam = [...moi.values()];
  const lo = dotBien?.startsWith("lo:") ? dotBien.slice(3) : dotBien?.startsWith("bo-chan-lo:") ? dotBien.slice(11) : null;
  if (lo) for (const r of ra) r.detail = { ...r.detail, lat: { ...(r.detail.lat ?? {}), lo: { thi_truong: { o: { [lo]: 0 }, tong: 0 } } } };
  for (const r of ra) for (const nhom of Object.values(r.detail.lat ?? {})) gopOCam({ lat: nhom }, cam);
  if (dotBien?.startsWith("bo-chan-lo:")) return;
  for (const r of ra) {
    try { chanLo(r.detail, cam); } catch (e) { throw new Error(`LO DO3: ${e.message}`); }
  }
}

async function main() {
  const a = process.argv.slice(2);
  const write = a.includes("--write");
  const ngay = a.includes("--ngay") ? a[a.indexOf("--ngay") + 1] : ngayVn(Date.now());
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(56086)");
    const kq = await doLamGiau(client, { ngay, write });
    if (kq.chua_ap) {
      await client.query("ROLLBACK");
      console.log(`do-lam-giau ${ngay}: CHUA-AP-${kq.chua_ap} — DB chưa có bảng ảnh chụp làm giàu, lượt này không ghi`);
      return;
    }
    await client.query(write ? "COMMIT" : "ROLLBACK");
    console.log(`do-lam-giau ${ngay}: ${kq.dq.map((r) => `${r.check_name}:${r.entity}=${r.status}${r.detail.ly_do ? `(${r.detail.ly_do})` : ""}`).join(" ")}${write ? "" : " (không ghi)"}`);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally { await client.end(); }
}
const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
