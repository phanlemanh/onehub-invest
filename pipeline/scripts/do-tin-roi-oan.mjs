// do-tin-roi-oan.mjs — hồ sơ _acceptance/s03-thu-lai-tin-roi-oan (PL43), AC-5: thước «tin S03 thu lại» trên dữ liệu thật.
//
//   node pipeline/scripts/do-tin-roi-oan.mjs          chỉ đọc (giao dịch read-only), in số tin S03 sống, tin rò, giá tốt hiện tại
//   node pipeline/scripts/do-tin-roi-oan.mjs --kiem   CHỈ trên DB thử `oneinvest_<…>` (db-thu), trong BEGIN…ROLLBACK, hai lượt trên
//       CÙNG bản chép: «trước» = transform-zalo bằng luật cũ tiêm qua `luatPl43: LUAT_TRUOC_PL43` rồi xếp hạng giá (420); lùi về
//       điểm lưu; «sau» = transform-zalo bằng luật mới rồi 420. Thước là hiệu hai lượt, nên phần trôi dữ liệu của bản chép (raw
//       chưa nạp, tin nghỉ PL14) có ở cả hai bên và không lẫn vào số. Ngưỡng (hợp đồng AC-5): tin sống sau − trước ≥ 150; thước
//       PL42 ở lượt sau: tin rò ≤ 90, tin thuê «giá tốt» rò ≤ 17. Vượt ngưỡng nào thì thoát 1 gọi tên ngưỡng; DB sai thoát 2.
//
// Tệp mẫu chấm tay (AC-6, kho công khai): chữ đã gạt URL/SĐT, chuỗi từ 8 chữ số trở lên thành «#», tên nguồn thật che bằng mã
// (sổ nguồn rỗng thì không ghi, thoát 1). Đầu tệp ghi sha cây và hạt giống. Bốn phần: 20 tin mới ngẫu nhiên · 10 tin mới phần C
// ngẫu nhiên · MỌI tin mới có bài nhãn Haiku `inquiry` · 20 bài còn rơi có dấu hiệu BĐS. Mỗi mục đủ sáu trường (TRUONG_MAU);
// thiếu trường thì ném «mẫu thiếu trường». Chạy làm eval (E5) ghi ra `.acceptance-runs/s03-thu-lai-tin-roi-oan/`; cờ
// `--ghi-evidence` chép thêm bản nộp chấm tay vào `_acceptance/s03-thu-lai-tin-roi-oan/evidence/mau-tin-moi.md`.
import { execFileSync } from "node:child_process";
import { mkdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { laChiAnh } from "../lib/gop-anh.mjs";
import { maskSourceNames } from "../lib/mask-source-names.mjs";
import { NHANH } from "../lib/nhanh-bai-s03.mjs";
import { docSourceNameEntries } from "../lib/source-name-entries.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import {
  LUAT_PL43, LUAT_TRUOC_PL43, coDauHieuBds, gatSo, mucDichNhom, parsePost, runTransformZalo, suyLoai,
} from "../transform-zalo.mjs";
import { xepHangGia } from "../xep-hang-gia.mjs";
import { cheSo, chonNgauNhien, docNhan, khoi, laNhanRo } from "./do-yeu-cau-lot-tin.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const TEP_MAU = path.join(GOC, ".acceptance-runs/s03-thu-lai-tin-roi-oan/mau-tin-moi.md");
export const TEP_MAU_EVIDENCE = path.join(GOC, "_acceptance/s03-thu-lai-tin-roi-oan/evidence/mau-tin-moi.md");
export const HAT_GIONG = "pl43-mau-tin-moi";

/** Ngưỡng hợp đồng AC-5. */
export const NGUONG = Object.freeze({ themToiThieu: 150, roTran: 90, giaTotThueRoTran: 17, mauNgauNhien: 20, mauPhanC: 10, mauConRoi: 20 });
/** Sáu trường bắt buộc của mỗi mục trong tệp mẫu. */
export const TRUONG_MAU = Object.freeze(["ma_tin", "phan_luat", "kind", "price_vnd", "nhan", "chu_bai"]);

// Thứ tự bật dần các phần luật để gán phần cho một bài: phần đầu tiên làm bài có loại. F (đi cặp Yêu cầu) luôn bật — nó chỉ bớt.
const PHAN = [["A", "dauHieu"], ["B", "dienTich"], ["C", "tuMotTy"], ["D", "giaTLe"], ["G", "khauHieu"]];

/** Phần luật PL43 đã đưa bài vào tin (A·B·C·D·G), hoặc null khi luật cũ đã nhận hay luật mới cũng không nhận. */
export function phanLuatCua(text, mucDich) {
  const doc = (luat) => {
    const pr = parsePost(text, { luat });
    return suyLoai({ ...pr }, text, mucDich, null, { pl43: luat }).kind;
  };
  let luat = { ...LUAT_TRUOC_PL43, yeuCauCap: true };
  if (doc(LUAT_TRUOC_PL43)) return null;
  for (const [ten, khoa] of PHAN) {
    luat = { ...luat, [khoa]: true };
    if (doc(luat)) return ten;
  }
  return null;
}

/**
 * Kết của lượt: ngưỡng hỏng (xet) cộng lỗi dựng tệp mẫu («mẫu thiếu trường», không che được tên nguồn) — cả hai đều thoát 1
 * (hợp đồng AC-5). Trả { hong, md }; md null khi không dựng được tệp mẫu.
 */
export function ketLuot({ truoc, sau, mau, sha, che }) {
  const hong = xet({ truoc, sau, mau: { ngauNhien: mau.ngauNhien.length, phanC: mau.phanC.length, conRoi: mau.conRoi.length } });
  try {
    return { hong, md: vietMau(mau, { sha, che }) };
  } catch (e) {
    return { hong: [...hong, e.message], md: null };
  }
}
/** Mã thoát của lượt `--kiem`: 0 đạt, 1 hỏng một ngưỡng hay tệp mẫu. */
export const maThoat = (hong) => (hong.length ? 1 : 0);

/** So hai lượt, trả tên các ngưỡng hỏng (rỗng = đạt). `mau` = số mục mỗi phần ngẫu nhiên của tệp mẫu. */
export function xet({ truoc, sau, mau }) {
  const hong = [];
  const them = sau.tin - truoc.tin;
  if (them < NGUONG.themToiThieu) hong.push(`tin S03 thêm ${them} < ${NGUONG.themToiThieu}`);
  if (sau.ro > NGUONG.roTran) hong.push(`tin rò ${sau.ro} > ${NGUONG.roTran}`);
  if (sau.gia_tot_thue_ro > NGUONG.giaTotThueRoTran) hong.push(`tin thuê «giá tốt» rò ${sau.gia_tot_thue_ro} > ${NGUONG.giaTotThueRoTran}`);
  if (mau.ngauNhien < NGUONG.mauNgauNhien) hong.push(`mẫu thiếu: ${mau.ngauNhien} < ${NGUONG.mauNgauNhien} tin mới ngẫu nhiên`);
  if (mau.phanC < NGUONG.mauPhanC) hong.push(`mẫu thiếu: ${mau.phanC} < ${NGUONG.mauPhanC} tin mới phần C`);
  if (mau.conRoi < NGUONG.mauConRoi) hong.push(`mẫu thiếu: ${mau.conRoi} < ${NGUONG.mauConRoi} bài còn rơi`);
  return hong;
}

/**
 * Nội dung tệp mẫu. Mỗi mục là object đủ TRUONG_MAU (giá trị null được, khoá vắng thì ném «mẫu thiếu trường»); `che(text)` trả chữ
 * đã che hoặc null khi không che được tên nguồn (ném).
 */
export function vietMau({ ngauNhien, phanC, roMoi, conRoi }, { sha, hatGiong = HAT_GIONG, che }) {
  const dong = [
    "# Mẫu tin S03 luật PL43 thu lại (AC-6)",
    "",
    `sha: ${sha}`,
    `hat_giong: ${hatGiong}`,
    "",
    "Sinh bởi `pipeline/scripts/do-tin-roi-oan.mjs --kiem` trên bản chép DB máy thu (ROLLBACK). Chữ đã gạt URL và SĐT, chuỗi từ",
    "8 chữ số trở lên thành «#», tên nguồn thật che bằng mã. Mỗi mục: mã tin · phần luật · loại · giá đã đọc · nhãn Haiku · chữ bài.",
    "",
    "Ngưỡng đạt (hợp đồng AC-6): trong 20 tin ngẫu nhiên ít nhất 18 là tin rao bán hay cho thuê thật, giá đúng bậc (tỷ cho bán,",
    "triệu cho thuê); trong 10 tin phần C ít nhất 9 là tin bán thật, giá đúng. Mỗi tin nhãn inquiry ghi «câu tìm lọt» hay «nhãn",
    "model sai»; 20 bài còn rơi ghi dạng chữ nào bị bỏ sót (không có ngưỡng). Dòng sha là cây đã chạy lượt đo.",
    "",
  ];
  const phan = (tieuDe, ds) => {
    dong.push(`## ${tieuDe} (${ds.length})`, "");
    if (!ds.length) dong.push("(không có)");
    for (const m of ds) {
      const thieu = TRUONG_MAU.filter((k) => !(k in m));
      if (thieu.length) throw new Error(`mẫu thiếu trường: ${thieu.join(", ")} (${m.ma_tin ?? "?"})`);
      const t = che(m.chu_bai ?? "");
      if (t == null) throw new Error("không che được tên nguồn — không ghi tệp mẫu");
      const gia = m.price_vnd == null ? "—" : Number(m.price_vnd).toLocaleString("vi-VN");
      dong.push(`- \`${m.ma_tin}\` · phần ${m.phan_luat ?? "—"} · ${m.kind ?? "—"} · ${gia} đ · nhãn ${m.nhan ?? "chưa nhãn"}: ${t.replace(/\s+/g, " ").trim()}`);
    }
    dong.push("");
  };
  phan(`${NGUONG.mauNgauNhien} tin mới chọn ngẫu nhiên`, ngauNhien);
  phan(`${NGUONG.mauPhanC} tin mới phần C (giá từ 1 tỷ, nhóm cả hai) chọn ngẫu nhiên`, phanC);
  phan("Mọi tin mới có bài nhãn inquiry — câu tìm lọt hay nhãn model sai?", roMoi);
  phan(`${NGUONG.mauConRoi} bài còn rơi có dấu hiệu BĐS — dạng chữ nào bị bỏ sót?`, conRoi);
  return `${dong.join("\n")}\n`;
}

// ---------------- DB ----------------

async function imLog(fn) {
  const goc = console.log;
  console.log = () => {};
  try { return await fn(); } finally { console.log = goc; }
}

async function luot(c, nhan, luatPl43) {
  await imLog(() => runTransformZalo(c, { luatPl43 }));
  await xepHangGia(c, { savepoint: true, log: () => {} });
  const k = await khoi(c, nhan);
  const { rows } = await c.query("SELECT offer_id, kind, price_vnd::text FROM sale_offers WHERE source = 'S03'");
  const gia = new Map(rows.map((r) => [r.offer_id, r.price_vnd]));
  const giaTotBan = k.tin.filter((o) => o.kind === "sale" && k.giaTot.has(o.offer_id)).length;
  return { ...k, gia, giaTotBan };
}

const inKhoi = (ten, l) => console.log(
  `${ten}: tin S03 ${l.k.tin} · tin rò ${l.k.ro} · tin thuê ${l.k.thue} · tin thuê «giá tốt» ${l.k.gia_tot_thue} · ` +
  `tin bán «giá tốt» ${l.giaTotBan} · tin thuê «giá tốt» rò ${l.k.gia_tot_thue_ro} · data-flow nhánh Yêu cầu ${l.k.nhanh_yeu_cau} bài`);

async function main() {
  const kiem = process.argv.includes("--kiem");
  const ten = DB_URL.split("?")[0].split("/").pop() ?? "";
  if (kiem && !/^oneinvest_[a-z0-9_]+$/.test(ten)) {
    console.error(`do-tin-roi-oan --kiem: chỉ chạy trên DB thử oneinvest_<…>, không phải «${ten}»`);
    return 2;
  }
  const c = new pg.Client({ connectionString: DB_URL, ...(kiem ? {} : { options: "-c default_transaction_read_only=on" }) });
  await c.connect();
  try {
    await c.query("BEGIN");
    const nhan = await docNhan(c);
    if (!kiem) {
      const k = await khoi(c, nhan);
      console.log(`hiện tại: tin S03 ${k.k.tin} · tin rò ${k.k.ro} · tin thuê «giá tốt» rò ${k.k.gia_tot_thue_ro} · tin thuê «giá tốt» ${k.k.gia_tot_thue}`);
      return 0;
    }
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    const entries = await docSourceNameEntries(c);
    if (!entries.length) {
      console.error("do-tin-roi-oan: sổ nguồn rỗng — không che được tên nguồn trong tệp mẫu, dừng");
      return 1;
    }
    const t0 = Date.now();
    await c.query("SAVEPOINT pl43_truoc");
    const truoc = await luot(c, nhan, LUAT_TRUOC_PL43);
    inKhoi("trước (luật cũ)", truoc);
    await c.query("ROLLBACK TO SAVEPOINT pl43_truoc");
    const sau = await luot(c, nhan, LUAT_PL43);
    inKhoi("sau (luật mới)", sau);
    console.log(`hai lượt transform-zalo + 420: ${((Date.now() - t0) / 1000).toFixed(0)} giây`);

    // Tin mới: tin sống ở lượt sau mà không sống ở lượt trước.
    const songTruoc = new Set(truoc.tin.map((o) => o.offer_id));
    const moi = sau.tin.filter((o) => !songTruoc.has(o.offer_id));
    const { posts } = await loadStgPosts(c, "zalo");
    const baiTheoId = new Map(posts.map((p) => [p.post_id, p]));
    const mucDich = mucDichNhom(posts.map((p) => ({ conversation_id: p.conversation_id, group_name: p.group_name, kind: parsePost(p.text).kind })));
    const mucDichCua = (p) => mucDich.get(p.conversation_id ?? "");
    const muc = moi.map((o) => {
      let phan = null, baiDau = null;
      for (const id of o.post_ids) {
        const p = baiTheoId.get(id);
        if (!p) continue;
        baiDau ??= p;
        phan ??= phanLuatCua(p.text, mucDichCua(p));
      }
      const nhanTin = o.post_ids.some((id) => nhan.get(id)?.listing_intent === "inquiry") ? "inquiry"
        : o.post_ids.map((id) => nhan.get(id)?.listing_intent).find(Boolean) ?? null;
      return { ma_tin: o.offer_id, phan_luat: phan, kind: o.kind, price_vnd: sau.gia.get(o.offer_id) ?? null, nhan: nhanTin, chu_bai: baiDau?.text ?? "", _ro: o.post_ids.some((id) => laNhanRo(nhan.get(id))) };
    });
    const demPhan = {};
    for (const m of muc) demPhan[m.phan_luat ?? "khác"] = (demPhan[m.phan_luat ?? "khác"] ?? 0) + 1;
    const banDuoi1Ty = muc.filter((m) => m.kind === "sale" && m.price_vnd != null && Number(m.price_vnd) < 1e9).length;
    console.log(`tin mới ${moi.length} · theo phần luật ${JSON.stringify(demPhan)} · tin bán mới dưới 1 tỷ ${banDuoi1Ty} · ` +
      `tin rò thêm so với luật cũ ${sau.k.ro - truoc.k.ro} (tin mới chứa bài rò ${muc.filter((m) => m._ro).length})`);

    // Bài còn rơi có dấu hiệu BĐS (luật mới): có chữ, không trong tin sống nào, không nhánh Yêu cầu.
    const dungSau = new Set(sau.tin.flatMap((o) => o.post_ids));
    const conRoiTat = posts.filter((p) => !dungSau.has(p.post_id) && !laChiAnh(p.text) && sau.nhanh.get(p.post_id) !== NHANH.yeuCau && coDauHieuBds(p.text, LUAT_PL43))
      .map((p) => ({ ma_tin: p.post_id, phan_luat: "còn rơi", kind: null, price_vnd: parsePost(p.text, { luat: LUAT_PL43 }).priceVnd, nhan: nhan.get(p.post_id)?.listing_intent ?? null, chu_bai: p.text }));
    const theoMa = (m) => m.ma_tin;
    const mau = {
      ngauNhien: chonNgauNhien(muc, NGUONG.mauNgauNhien, HAT_GIONG, theoMa),
      phanC: chonNgauNhien(muc.filter((m) => m.phan_luat === "C"), NGUONG.mauPhanC, `${HAT_GIONG}-c`, theoMa),
      roMoi: muc.filter((m) => m.nhan === "inquiry"),
      conRoi: chonNgauNhien(conRoiTat, NGUONG.mauConRoi, `${HAT_GIONG}-con-roi`, theoMa),
    };
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: GOC, encoding: "utf8" }).trim();
    const { hong, md } = ketLuot({ truoc: truoc.k, sau: sau.k, mau, sha, che: (t) => maskSourceNames(cheSo(gatSo(t)), entries) });
    const dich = md == null ? [] : process.argv.includes("--ghi-evidence") ? [TEP_MAU, TEP_MAU_EVIDENCE] : [TEP_MAU];
    for (const t of dich) {
      mkdirSync(path.dirname(t), { recursive: true });
      writeFileSync(t, md);
      console.log(`tệp mẫu: ${path.relative(GOC, t)} (${mau.ngauNhien.length} + ${mau.phanC.length} + ${mau.roMoi.length} + ${mau.conRoi.length} mục)`);
    }
    console.log(hong.length ? `KẾT: hỏng — ${hong.join(" · ")}` : "KẾT: đạt");
    return maThoat(hong);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((m) => process.exit(m), (e) => { console.error(e); process.exit(2); });
}
