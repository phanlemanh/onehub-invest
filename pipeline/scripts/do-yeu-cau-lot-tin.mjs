// do-yeu-cau-lot-tin.mjs — hồ sơ _acceptance/yeu-cau-khong-thanh-tin-thue (PL42), AC-5: thước «bài tìm lọt thành tin rao» trên dữ
// liệu thật. Định nghĩa đếm (hợp đồng AC-5): chỉ tin S03 đang sống (`sale_offers`); «tin rò» = tin có ít nhất một bài mà nhãn
// Haiku hợp lệ mới nhất (json_ok không false) là `inquiry` và nhãn ghi trong cửa sổ 12/11–hết 26/11 (UTC, tái lập đúng mốc đo
// 26/11: 264 tin rò, 51 tin thuê «giá tốt» rò). Nhãn model chỉ là đối chứng đo — luật xác định quyết (luật 7).
//
//   node pipeline/scripts/do-yeu-cau-lot-tin.mjs          chỉ đọc (giao dịch read-only), in một khối số hiện tại — kiểm sau lượt đêm
//   node pipeline/scripts/do-yeu-cau-lot-tin.mjs --kiem   CHỈ trên DB thử `oneinvest_<…>` (db-thu), trong BEGIN…ROLLBACK:
//       khối «trước» trên bản chép (mốc 264 / 51 ± 2, lệch → thoát 1 «mốc lệch»), transform-zalo rồi xếp hạng giá (420), khối
//       «sau»; ngưỡng: tin rò ≤ 85, tin thuê «giá tốt» rò ≤ 16, bài nhãn khác inquiry bị đổi ≤ 10; tin thuê sau = trước − tin
//       thuê rút trọn (xem dưới); ghi tệp mẫu chấm tay (AC-6). Vượt ngưỡng nào thì thoát 1 gọi tên ngưỡng; DB sai thì thoát 2.
//
// «Tin thuê rút trọn» dự đoán TRƯỚC transform bằng luật (mọi bài của tin rơi vào nhánh `yeu-cau` của nhanhCuaBai), rồi đối chiếu
// với kết quả transform thật: tin thuê sau (trong số tin đã sống ở khối trước) phải bằng tin thuê trước trừ số dự đoán — tin
// nghỉ vì lý do khác, hay luật dự đoán sai, đều làm lệch. Tin mới sinh từ bài chưa qua lượt đêm của bản chép in riêng, không vào
// phép so. «Bài bị đổi» = bài nằm trong post_ids của tin sống ở khối trước, không còn trong tin sống nào ở khối sau, và rơi vào
// nhánh `yeu-cau`. Nhánh Yêu cầu của data-flow đếm như 600 (bài S03 không phải bài thử, không trong post_ids của tin sống,
// nhánh `yeu-cau` tính bằng mã hiện tại), đơn vị bài, mọi ngày.
//
// Tệp mẫu (kho công khai): chữ đã gạt URL/SĐT (gatSo), chuỗi từ 8 chữ số trở lên thành «#», tên nguồn thật che bằng mã (sổ
// nguồn local; sổ rỗng thì không ghi, thoát 1). Gồm MỌI bài nhãn khác inquiry bị đổi + 20 bài ngẫu nhiên (hạt giống cố định,
// khử trùng theo chữ) trong bài chưa nhãn bị đổi; dưới 20 thì thoát 1 «mẫu thiếu».
import { mkdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { maskSourceNames } from "../lib/mask-source-names.mjs";
import { NHANH, tinhNhanhBai } from "../lib/nhanh-bai-s03.mjs";
import { docSourceNameEntries } from "../lib/source-name-entries.mjs";
import { gatSo, runTransformZalo } from "../transform-zalo.mjs";
import { xepHangGia } from "../xep-hang-gia.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const TEP_MAU = path.join(GOC, "_acceptance/yeu-cau-khong-thanh-tin-thue/evidence/mau-tin-rut.md");

/** Ngưỡng hợp đồng AC-5. */
export const NGUONG = Object.freeze({ mocRo: 264, mocGiaTotRo: 51, saiMoc: 2, roSau: 85, giaTotRoSau: 16, doiKhac: 10, mauNgauNhien: 20 });
/** Cửa sổ nhãn của định nghĩa «tin rò» (UTC). */
export const CUA_SO = Object.freeze({ tu: new Date("2026-11-12T00:00:00Z"), den: new Date("2026-11-27T00:00:00Z") });
export const HAT_GIONG = "pl42-mau-tin-rut";
const GIA_TOT = "gia-tot";

/** Nhãn của bài là nhãn rò: inquiry, ghi trong cửa sổ. */
export const laNhanRo = (n, cua = CUA_SO) => Boolean(n && n.listing_intent === "inquiry" && n.labeled_at >= cua.tu && n.labeled_at < cua.den);

/**
 * Đếm một khối. `tin`: tin S03 đang sống [{offer_id, kind, post_ids}]; `nhan`: post_id → {listing_intent, labeled_at: Date};
 * `giaTot`: tập offer_id mang nhãn «giá tốt»; `nhanh`: post_id → nhánh; `dung`: tập post_id trong tin sống; `baiS03`: mọi post_id S03.
 */
export function demKhoi({ tin, nhan, giaTot, baiS03 = [], nhanh = new Map() }) {
  const dung = new Set(tin.flatMap((o) => o.post_ids));
  let ro = 0, thue = 0, giaTotThue = 0, giaTotThueRo = 0;
  for (const o of tin) {
    const r = o.post_ids.some((id) => laNhanRo(nhan.get(id)));
    if (r) ro++;
    if (o.kind !== "rent_lt") continue;
    thue++;
    if (giaTot.has(o.offer_id)) { giaTotThue++; if (r) giaTotThueRo++; }
  }
  const nhanhYeuCau = baiS03.filter((id) => !dung.has(id) && nhanh.get(id) === NHANH.yeuCau).length;
  return { tin: tin.length, ro, thue, gia_tot_thue: giaTotThue, gia_tot_thue_ro: giaTotThueRo, nhanh_yeu_cau: nhanhYeuCau };
}

/** Tin dự đoán rút trọn: mọi bài của tin rơi vào nhánh `yeu-cau`. */
export const duDoanRut = (tin, nhanh) => tin.filter((o) => o.post_ids.length && o.post_ids.every((id) => nhanh.get(id) === NHANH.yeuCau));

/**
 * So khối trước/sau, trả tên các ngưỡng hỏng (rỗng = đạt). `doi` = {khac: số bài nhãn khác inquiry bị đổi};
 * `thue` = {con: tin thuê còn sống trong số tin đã sống ở khối trước, rutDuDoan: số tin thuê dự đoán rút trọn};
 * `mau` = {ngauNhien: số bài ngẫu nhiên trong mẫu}.
 */
export function xet({ truoc, sau, doi, thue, mau }) {
  const hong = [...xetMoc(truoc)];
  if (sau.ro > NGUONG.roSau) hong.push(`tin rò sau ${sau.ro} > ${NGUONG.roSau}`);
  if (sau.gia_tot_thue_ro > NGUONG.giaTotRoSau) hong.push(`tin thuê «giá tốt» rò sau ${sau.gia_tot_thue_ro} > ${NGUONG.giaTotRoSau}`);
  if (doi.khac > NGUONG.doiKhac) hong.push(`bài nhãn khác inquiry bị đổi ${doi.khac} > ${NGUONG.doiKhac}`);
  if (thue.con !== truoc.thue - thue.rutDuDoan) hong.push(`tin thuê lệch rút trọn: sau ${thue.con} ≠ trước ${truoc.thue} − rút ${thue.rutDuDoan}`);
  if (mau.ngauNhien < NGUONG.mauNgauNhien) hong.push(`mẫu thiếu: ${mau.ngauNhien} < ${NGUONG.mauNgauNhien} bài chưa nhãn`);
  return hong;
}

/** Khối «trước» tái lập mốc đo 26/11 (± saiMoc). */
export function xetMoc(truoc) {
  const lech = Math.abs(truoc.ro - NGUONG.mocRo) > NGUONG.saiMoc || Math.abs(truoc.gia_tot_thue_ro - NGUONG.mocGiaTotRo) > NGUONG.saiMoc;
  return lech ? [`mốc lệch: tin rò ${truoc.ro} (mốc ${NGUONG.mocRo}), giá tốt thuê rò ${truoc.gia_tot_thue_ro} (mốc ${NGUONG.mocGiaTotRo}), sai số ±${NGUONG.saiMoc}`] : [];
}

/** Bộ sinh số giả ngẫu nhiên có hạt giống (mulberry32 trên băm FNV-1a của chuỗi). */
function sinhSo(hat) {
  let h = 2166136261;
  for (const ch of hat) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `n` phần tử chọn ngẫu nhiên theo hạt giống (xáo Fisher–Yates trên bản sao đã sắp theo `khoa`) — cùng đầu vào, cùng kết quả. */
export function chonNgauNhien(ds, n, hat = HAT_GIONG, khoa = (x) => String(x)) {
  const a = [...ds].sort((x, y) => (khoa(x) < khoa(y) ? -1 : khoa(x) > khoa(y) ? 1 : 0));
  const r = sinhSo(hat);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/** Chuỗi từ 8 chữ số liền trở lên thành «#». */
export const cheSo = (s) => String(s ?? "").replace(/\d{8,}/g, "#");

/** Khử trùng bài theo chữ đã chuẩn hoá khoảng trắng — giữ bài post_id nhỏ nhất. */
export function khuTrungChu(bai) {
  const gap = new Map();
  for (const b of [...bai].sort((x, y) => (x.post_id < y.post_id ? -1 : 1))) {
    const k = (b.text ?? "").replace(/\s+/g, " ").trim().toLowerCase();
    if (!gap.has(k)) gap.set(k, b);
  }
  return [...gap.values()];
}

/**
 * Nội dung tệp mẫu. `che(text)` trả chữ đã che (gatSo, số, tên nguồn) hoặc null khi không che được.
 * @param {{ khac: {offer_id: string, post_id: string, nhan: string, text: string}[], ngauNhien: {offer_id: string, post_id: string, text: string}[] }} m
 */
export function vietMau({ khac, ngauNhien }, che) {
  const dong = [
    "# Mẫu bài bị luật PL42 đổi sang Yêu cầu (AC-6)",
    "",
    "Sinh bởi `pipeline/scripts/do-yeu-cau-lot-tin.mjs --kiem` trên bản chép DB máy thu (ROLLBACK). Chữ đã gạt URL và SĐT,",
    "chuỗi từ 8 chữ số trở lên thành «#», tên nguồn thật che bằng mã. Câu hỏi chấm: mỗi bài có phải câu tìm căn của người cần",
    "thuê hay mua (Yêu cầu), không phải tin rao? Nêu mã tin của bài nào là tin rao thật.",
    "",
    `## Mọi bài nhãn Haiku khác inquiry bị đổi (${khac.length})`,
    "",
  ];
  const mot = (b, nhan) => {
    const t = che(b.text);
    if (t == null) throw new Error("không che được tên nguồn — không ghi tệp mẫu");
    dong.push(`- \`${b.offer_id}\` · nhãn ${nhan}: ${t.replace(/\s+/g, " ").trim()}`);
  };
  for (const b of khac) mot(b, b.nhan);
  if (!khac.length) dong.push("(không có)");
  dong.push("", `## ${ngauNhien.length} bài ngẫu nhiên trong bài chưa nhãn bị đổi (hạt giống «${HAT_GIONG}», khử trùng theo chữ)`, "");
  for (const b of ngauNhien) mot(b, "chưa nhãn");
  return `${dong.join("\n")}\n`;
}

// ---------------- DB ----------------

async function docNhan(c) {
  const { rows } = await c.query(
    `SELECT DISTINCT ON (post_id) post_id, listing_intent, labeled_at FROM silver_labels
      WHERE source_code = 'S03' AND model ILIKE '%haiku%' AND json_ok IS NOT FALSE
      ORDER BY post_id, labeled_at DESC, label_id DESC`);
  return new Map(rows.map((r) => [r.post_id, r]));
}
async function docTin(c) {
  const { rows: tin } = await c.query("SELECT offer_id, kind, post_ids FROM sale_offers WHERE source = 'S03'");
  const { rows: gt } = await c.query("SELECT offer_id FROM offer_price_rank WHERE nhan = $1", [GIA_TOT]);
  return { tin, giaTot: new Set(gt.map((r) => r.offer_id)) };
}

const inKhoi = (ten, k) => console.log(
  `${ten}: tin S03 ${k.tin} · tin rò ${k.ro} · tin thuê ${k.thue} · tin thuê «giá tốt» ${k.gia_tot_thue} (mốc 1.165) · ` +
  `tin thuê «giá tốt» rò ${k.gia_tot_thue_ro} · data-flow nhánh Yêu cầu ${k.nhanh_yeu_cau} bài`);

async function khoi(c, nhan) {
  const { tin, giaTot } = await docTin(c);
  const nhanh = await tinhNhanhBai(c);
  // Bài thử không có nhánh (tinhNhanhBai đọc qua loadStgPosts đã gạt chúng) nên không bao giờ được đếm vào nhánh Yêu cầu.
  const { rows } = await c.query("SELECT DISTINCT post_id FROM stg_zalo_posts");
  return { tin, giaTot, nhanh, k: demKhoi({ tin, nhan, giaTot, baiS03: rows.map((r) => r.post_id), nhanh }) };
}

async function imLog(fn) {
  const goc = console.log;
  console.log = () => {};
  try { return await fn(); } finally { console.log = goc; }
}

async function main() {
  const kiem = process.argv.includes("--kiem");
  const ten = DB_URL.split("?")[0].split("/").pop() ?? "";
  if (kiem && !/^oneinvest_[a-z0-9_]+$/.test(ten)) {
    console.error(`do-yeu-cau-lot-tin --kiem: chỉ chạy trên DB thử oneinvest_<…>, không phải «${ten}»`);
    return 2;
  }
  const c = new pg.Client({ connectionString: DB_URL, ...(kiem ? {} : { options: "-c default_transaction_read_only=on" }) });
  await c.connect();
  try {
    await c.query("BEGIN");
    const nhan = await docNhan(c);
    if (!kiem) {
      inKhoi("hiện tại", (await khoi(c, nhan)).k);
      return 0;
    }
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    const entries = await docSourceNameEntries(c);
    if (!entries.length) {
      console.error("do-yeu-cau-lot-tin: sổ nguồn rỗng — không che được tên nguồn trong tệp mẫu, dừng");
      return 1;
    }
    const truoc = await khoi(c, nhan);
    inKhoi("trước", truoc.k);
    const moc = xetMoc(truoc.k);
    if (moc.length) {
      console.log(`KẾT: hỏng — ${moc.join(" · ")}`);
      return 1;
    }
    const rutDuDoan = duDoanRut(truoc.tin, truoc.nhanh);
    const t0 = Date.now();
    await imLog(() => runTransformZalo(c));
    await xepHangGia(c, { savepoint: true, log: () => {} });
    console.log(`transform-zalo + 420: ${((Date.now() - t0) / 1000).toFixed(0)} giây`);
    const sau = await khoi(c, nhan);
    inKhoi("sau", sau.k);

    const songSau = new Map(sau.tin.map((o) => [o.offer_id, o]));
    const songTruoc = new Set(truoc.tin.map((o) => o.offer_id));
    const thueCon = truoc.tin.filter((o) => songSau.get(o.offer_id)?.kind === "rent_lt").length;
    const thueMoi = sau.tin.filter((o) => o.kind === "rent_lt" && !songTruoc.has(o.offer_id)).length;
    const rutThue = rutDuDoan.filter((o) => o.kind === "rent_lt");
    const rutThat = truoc.tin.filter((o) => !songSau.has(o.offer_id));
    const duDoanSet = new Set(rutDuDoan.map((o) => o.offer_id));
    console.log(`tin rút trọn: dự đoán ${rutDuDoan.length} (thuê ${rutThue.length}) · thật ${rutThat.length} · ` +
      `thật mà không dự đoán ${rutThat.filter((o) => !duDoanSet.has(o.offer_id)).length} · tin thuê mới từ bài chưa qua lượt đêm ${thueMoi}`);
    console.log(`tin thuê «giá tốt» mất hẳn (rút trọn): ${rutThat.filter((o) => o.kind === "rent_lt" && truoc.giaTot.has(o.offer_id)).length}`);

    const dungSau = new Set(sau.tin.flatMap((o) => o.post_ids));
    const chu = new Map((await c.query("SELECT DISTINCT ON (post_id) post_id, text FROM stg_zalo_posts ORDER BY post_id, captured_at DESC")).rows.map((r) => [r.post_id, r.text]));
    const doi = [];
    for (const o of truoc.tin) for (const id of o.post_ids) {
      if (!dungSau.has(id) && sau.nhanh.get(id) === NHANH.yeuCau) doi.push({ offer_id: o.offer_id, post_id: id, text: chu.get(id) ?? "", nhan: nhan.get(id)?.listing_intent ?? null });
    }
    const khac = doi.filter((b) => b.nhan && b.nhan !== "inquiry");
    const chuaNhan = khuTrungChu(doi.filter((b) => !b.nhan));
    const ngauNhien = chonNgauNhien(chuaNhan, NGUONG.mauNgauNhien, HAT_GIONG, (b) => b.post_id);
    console.log(`bài bị đổi sang Yêu cầu: ${doi.length} (nhãn inquiry ${doi.filter((b) => b.nhan === "inquiry").length} · ` +
      `nhãn khác inquiry ${khac.length} · chưa nhãn ${doi.filter((b) => !b.nhan).length}, khác chữ ${chuaNhan.length})`);

    const hong = xet({ truoc: truoc.k, sau: sau.k, doi: { khac: khac.length }, thue: { con: thueCon, rutDuDoan: rutThue.length }, mau: { ngauNhien: ngauNhien.length } });
    if (ngauNhien.length >= NGUONG.mauNgauNhien) {
      const md = vietMau({ khac, ngauNhien }, (t) => maskSourceNames(cheSo(gatSo(t)), entries));
      mkdirSync(path.dirname(TEP_MAU), { recursive: true });
      writeFileSync(TEP_MAU, md);
      console.log(`tệp mẫu: ${path.relative(GOC, TEP_MAU)} (${khac.length} + ${ngauNhien.length} bài)`);
    }
    console.log(hong.length ? `KẾT: hỏng — ${hong.join(" · ")}` : "KẾT: đạt");
    return hong.length ? 1 : 0;
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((m) => process.exit(m), (e) => { console.error(e); process.exit(2); });
}
