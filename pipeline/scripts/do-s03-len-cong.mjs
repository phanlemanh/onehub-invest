// do-s03-len-cong.mjs — phép đo hồ sơ _acceptance/s03-len-cong (SL1). Mọi đo chạy trên DB thử, trong BEGIN…ROLLBACK.
//   node scripts/do-s03-len-cong.mjs            E5 độ đúng loại hình, E8 tập tin không đổi, E11 số lên cổng và sai nặng
//   node scripts/do-s03-len-cong.mjs --mau      chọn mẫu 30 tin theo seed cố định, ghi ra research-local/ chờ tác tử gắn nhãn
//   node scripts/do-s03-len-cong.mjs --ben-doc  E13 ma trận bên đọc khu vực và loại hình
//   node scripts/do-s03-len-cong.mjs --ranh     E12 thước dòng thêm so với nhánh chính
//   node scripts/do-s03-len-cong.mjs --ui-tinh  E14 nhãn trên thẻ và thuật ngữ
// In số đếm, mã nguồn S0x, đường tệp; không in chữ bài, khoá nhóm, tên nguồn thật. Không gọi route ghi nào.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import pg from "pg";

import { khaiSoNhom } from "../khai-so-nhom.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { MIG_069 } from "../lib/nap-061.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { docLoaiHinh, loaiHinhNhom, runTransformZalo } from "../transform-zalo.mjs";

const HERE = import.meta.dirname;
const GOC = join(HERE, "../..");
const RL = join(GOC, "research-local");
const TEP_NHAN = join(RL, "s03-audit-0211/labels_all.json");
const TEP_MAU_AUDIT = join(RL, "s03-audit-0211/sample_full.json");
const TEP_SO = join(RL, "s03-len-cong/so-nhom-nhap.json");
const TEP_MAU = join(RL, "s03-len-cong/mau-30.json");
const TEP_NHAN_MAU = join(RL, "s03-len-cong/nhan-mau-30.json");
const TEP_BEN_DOC = join(GOC, "_acceptance/s03-len-cong/ben-doc.json");
const DB_URL = process.env.DATABASE_URL ?? "";
const KENH_S03 = "stg_zalo_posts".split("_")[1]; // khoá kênh S03 của loadStgPosts, lấy theo tên bảng stg
const SEED = "s03-len-cong-1103";
const DICH_LEN_CONG = 900;
const GAY_LEN_CONG = 50;
const DICH_SAI_NANG = 0.1;
const TRAN_LECH = 0.2;
const in_ = (...a) => process.stdout.write(`${a.join(" ")}\n`);
const git = (...a) => execFileSync("git", ["-C", GOC, ...a], { encoding: "utf8", maxBuffer: 1 << 28 });

function canDbThu() {
  if (!/\/oneinvest_[a-z0-9_]+$/.test(DB_URL)) throw new Error("do-s03-len-cong: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc>");
}
async function trongGiaoDich(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}
/** Transform chạy im: dòng in của nó có thể nhắc tên nhóm. */
async function imLog(fn) {
  const goc = console.log;
  console.log = () => {};
  try { return await fn(); } finally { console.log = goc; }
}

// ---- E5: loại hình trên nhãn audit ----
const veLoai = (v) => (["townhouse", "shophouse", "villa"].includes(v) ? "house" : v);
export const phanTram = (a, b) => (b ? `${Math.round((a / b) * 1000) / 10}%` : "không có mẫu");

async function doLoaiHinh() {
  for (const t of [TEP_NHAN, TEP_MAU_AUDIT]) if (!existsSync(t)) throw new Error(`E5: thiếu tệp nhãn ${t}`);
  const nhan = new Map(JSON.parse(readFileSync(TEP_NHAN, "utf8")));
  const mau = JSON.parse(readFileSync(TEP_MAU_AUDIT, "utf8"));
  const { posts } = await trongGiaoDich((c) => loadStgPosts(c, KENH_S03));
  const tatCa = posts.map((p) => ({ post_id: p.post_id, conversation_id: p.conversation_id, loai: docLoaiHinh(p.text) }));
  const phieu = loaiHinhNhom(tatCa);

  let coNhan = 0, chuNhan = 0, chuDung = 0, nhanTong = 0;
  for (const m of mau) {
    const dung = veLoai(nhan.get(m.post_id)?.property_type ?? null);
    if (!dung) continue;
    coNhan++;
    const chu = docLoaiHinh(m.text);
    if (chu) { chuNhan++; if (chu === dung) chuDung++; }
    if (chu || phieu.get(m.conv)) nhanTong++;
  }
  // Đối chứng giữ lại: bài nói rõ loại, bỏ bài đó khỏi phiếu nhóm rồi so.
  const theoNhom = new Map();
  for (const p of tatCa) if (p.conversation_id && p.loai) theoNhom.set(p.conversation_id, [...(theoNhom.get(p.conversation_id) ?? []), p.loai]);
  let nhomNhan = 0, nhomDung = 0;
  for (const [k, ds] of theoNhom) {
    for (const lhien of new Set(ds)) {
      const n = ds.filter((x) => x === lhien).length;
      const conLai = ds.map((loai) => ({ conversation_id: k, loai }));
      conLai.splice(ds.indexOf(lhien), 1);
      const doan = loaiHinhNhom(conLai).get(k);
      if (!doan) continue;
      nhomNhan += n;
      if (doan === lhien) nhomDung += n;
    }
  }
  in_("E5 nhãn do tác tử gắn, không phải nhãn vàng");
  in_(`E5 theo chữ: đúng ${chuDung}/${chuNhan} (${phanTram(chuDung, chuNhan)})`);
  in_(`E5 theo nhóm, đối chứng giữ lại trên bài nói rõ loại: đúng ${nhomDung}/${nhomNhan} (${phanTram(nhomDung, nhomNhan)})`);
  in_(`E5 nhận tổng: ${nhanTong}/${coNhan} bài có nhãn loại (${phanTram(nhanTong, coNhan)})`);
  const loi = [];
  if (!chuNhan || chuDung / chuNhan < 0.85) loi.push("theo chữ dưới 85%");
  if (!nhomNhan || nhomDung / nhomNhan < 0.85) loi.push("theo nhóm dưới 85%");
  if (!coNhan || nhanTong / coNhan < 0.5) loi.push("nhận tổng dưới 50%");
  if (loi.length) throw new Error(`SL1-AC-4: ${loi.join("; ")}`);
}

// ---- E8, E11: chạy transform trên DB thử ----
const DOC_TIN = "SELECT offer_id, kind, price_vnd::text, area_m2::text, area_id, post_ids FROM sale_offer_records WHERE source = 'S03' ORDER BY offer_id";
const banSao = async (src, ten) => {
  const f = join(HERE, `../.sl1-${ten}-${process.pid}.mjs`);
  writeFileSync(f, src);
  try { return (await import(pathToFileURL(f).href)).runTransformZalo; } finally { rmSync(f, { force: true }); }
};
const MOC_DOT_BIEN = ".update(repostKey(pr, pr.post))";
export const banDotBien = (src) => {
  if (!src.includes(MOC_DOT_BIEN)) throw new Error("E8: đột biến không khớp mã nguồn");
  return src.replace(MOC_DOT_BIEN, `.update(repostKey(pr, pr.post) + "|" + (thiTruongNhom.get(pr.post.conversation_id) ?? ""))`);
};
export function soTin(nen, co) {
  const a = new Map(nen.map((r) => [r.offer_id, r]));
  const b = new Map(co.map((r) => [r.offer_id, r]));
  const thieu = [...a.keys()].filter((k) => !b.has(k)).length;
  const them = [...b.keys()].filter((k) => !a.has(k)).length;
  let doi = 0;
  for (const [k, r] of a) {
    const s = b.get(k);
    if (s && (s.kind !== r.kind || s.price_vnd !== r.price_vnd || s.area_m2 !== r.area_m2)) doi++;
  }
  return { thieu, them, doi };
}
/** Tin chỉ có khi có sổ phải là tin tách ra nhờ nhóm khai thị trường khớp được phường: có khu vực, mọi bài từng thuộc tin nền. */
export function tinTachNhoSo(nen, co) {
  const baiNen = new Set(nen.flatMap((r) => r.post_ids ?? []));
  const idNen = new Set(nen.map((r) => r.offer_id));
  const them = co.filter((r) => !idNen.has(r.offer_id));
  return { them: them.length, lac: them.filter((r) => !r.area_id || !(r.post_ids ?? []).every((b) => baiNen.has(b))).length };
}
async function luotBanCo(c, chay = runTransformZalo) {
  await napPhatBieu(c);
  await c.query(MIG_069);
  await khaiSoNhom(c, TEP_SO, { ghi: true, out() {} });
  await imLog(() => chay(c));
}
/** Điều kiện VISIBLE đọc thẳng từ mã cổng, một chỗ quyết tin nào hiện. */
export function dieuKienVisible() {
  const src = readFileSync(join(GOC, "app/src/lib/offers-public.ts"), "utf8");
  const loc = readFileSync(join(GOC, "app/src/lib/offers-filters.ts"), "utf8");
  const m = src.match(/const VISIBLE = `([\s\S]*?)`;/);
  if (!m) throw new Error("SL1-AC-9: không đọc được VISIBLE");
  const so = (ten) => {
    const r = loc.match(new RegExp(`export const ${ten} = ([\\d_]+)`));
    if (!r) throw new Error(`SL1-AC-9: không đọc được ${ten}`);
    return r[1].replaceAll("_", "");
  };
  const an = loc.match(/OFFER_HIDDEN_SOURCES = \[([^\]]*)\]/)?.[1].replaceAll('"', "'");
  if (!an) throw new Error("SL1-AC-9: không đọc được OFFER_HIDDEN_SOURCES");
  const sql = m[1]
    .replaceAll("${KIND.sale}", "sale").replaceAll("${KIND.rent_lt}", "rent_lt").replaceAll("${PROPERTY_TYPE.unknown}", "unknown")
    .replace(/\$\{OFFER_HIDDEN_SOURCES[^\n]*?\}\]/, `${an}]`)
    .replace(/\$\{(OFFER_[A-Z_]+)\}/g, (_, t) => so(t));
  if (sql.includes("${")) throw new Error("SL1-AC-9: VISIBLE còn biến chưa thay");
  return sql.split(/\n\s*AND /).map((s) => s.trim());
}
const DK_NGUON = `CASE
  WHEN o.field_provenance #>> '{property_type,tier}' = 'inferred' THEN 'nhom'
  WHEN o.field_provenance #>> '{property_type,method}' = 'e2_llm' THEN 'llm'
  WHEN o.field_provenance #>> '{property_type,method}' = 'e1_rule' THEN 'chu' ELSE 'khac' END`;

async function doTapTin() {
  canDbThu();
  if (!existsSync(TEP_SO)) throw new Error(`E8: thiếu sổ nháp ${TEP_SO}`);
  const base = git("merge-base", "HEAD", "origin/main").trim();
  const goc = git("show", `${base}:pipeline/transform-zalo.mjs`);
  const chayNen = await banSao(goc, "nen");
  const khongSo = await trongGiaoDich(async (c) => {
    await napPhatBieu(c);
    await imLog(() => chayNen(c));
    return (await c.query(DOC_TIN)).rows;
  });
  const nen = await trongGiaoDich(async (c) => {
    await napPhatBieu(c);
    await khaiSoNhom(c, TEP_SO, { ghi: true, out() {} });
    await imLog(() => chayNen(c));
    return (await c.query(DOC_TIN)).rows;
  });
  const dk = dieuKienVisible();
  const co = await trongGiaoDich(async (c) => {
    await luotBanCo(c);
    const rows = (await c.query(DOC_TIN)).rows;
    let conLai = (await c.query("SELECT count(*)::int n FROM sale_offers o WHERE o.source = 'S03'")).rows[0].n;
    in_(`E8 S03 trước các chặn: ${conLai} tin`);
    const tich = [];
    for (const d of dk) {
      tich.push(d);
      const { rows: [{ n }] } = await c.query(`SELECT count(*)::int n FROM sale_offers o WHERE o.source = 'S03' AND ${tich.join(" AND ")}`);
      in_(`E8 qua «${d.replace(/\s+/g, " ").slice(0, 60)}»: ${n}/${conLai}`);
      conLai = n;
    }
    return rows;
  });
  const lech = soTin(nen, co);
  in_(`E8 mã nền và mã mới, cùng sổ nháp: ${nen.length} và ${co.length} tin; thiếu ${lech.thieu}, thêm ${lech.them}, đổi giá, diện tích, loại tin ${lech.doi}`);
  if (lech.thieu || lech.them || lech.doi) throw new Error("SL1-AC-7: tập tin lệch bản nền");
  if (soTin(nen, [{ ...nen[0], price_vnd: `${nen[0].price_vnd}1` }, ...nen.slice(1)]).doi !== 1) throw new Error("SL1-AC-7: thước không đỏ khi đổi giá");
  const doSo = soTin(khongSo, nen);
  const tach = tinTachNhoSo(khongSo, nen);
  in_(`E8 riêng tác động của sổ lên mã nền: ${khongSo.length} thành ${nen.length} tin; thiếu ${doSo.thieu}, thêm ${doSo.them}, đổi ${doSo.doi}; tin thêm không phải do tách nhờ khớp phường ${tach.lac}`);
  if (doSo.thieu || doSo.doi || tach.lac) throw new Error("SL1-AC-7: sổ làm mất tin hay đổi giá trị trên mã nền");
  const dotBien = await trongGiaoDich(async (c) => {
    await luotBanCo(c, await banSao(banDotBien(readFileSync(join(HERE, "../transform-zalo.mjs"), "utf8")), "dot-bien"));
    return (await c.query(DOC_TIN)).rows;
  });
  const lb = soTin(nen, dotBien);
  in_(`E8 đối chứng đưa khu vực vào khoá gom: thiếu ${lb.thieu}, thêm ${lb.them}`);
  if (!lb.thieu && !lb.them) throw new Error("SL1-AC-7: thước không đỏ trên bản đưa khu vực vào khoá gom");
}

// ---- E11: số lên cổng, mẫu, sai nặng ----
export function chonMau(rows, tongMau = 30) {
  const nhom = ["chu", "nhom", "llm"].map((k) => rows.filter((r) => r.nguon === k));
  const mau = [];
  let vong = 0;
  while (mau.length < tongMau && nhom.some((n) => n.length > vong)) {
    for (const n of nhom) if (n[vong] && mau.length < tongMau) mau.push(n[vong]);
    vong++;
  }
  return mau;
}
const lechNang = (a, b) => (a == null || b == null ? false : Math.abs(Number(a) - Number(b)) / Number(b) > TRAN_LECH);
/** Một tin sai nặng khi sai bán hay thuê, loại hình, thị trường, hay giá, diện tích lệch trên 20%. */
export function saiNang(m, n) {
  const ly_do = [];
  if (n.kind && n.kind !== m.kind) ly_do.push("kind");
  if (n.property_type && veLoai(n.property_type) !== veLoai(m.property_type)) ly_do.push("loai_hinh");
  if (n.market && n.market !== m.market) ly_do.push("thi_truong");
  if (lechNang(m.price_vnd, n.price_vnd)) ly_do.push("gia");
  if (lechNang(m.area_m2, n.area_m2)) ly_do.push("dien_tich");
  return ly_do;
}
async function docLenCong(c) {
  await luotBanCo(c);
  const dk = dieuKienVisible().join(" AND ");
  const { rows: [so] } = await c.query(`SELECT count(*)::int n, count(*) FILTER (WHERE o.kind = 'sale')::int ban,
      count(*) FILTER (WHERE o.kind = 'rent_lt')::int thue FROM sale_offers o WHERE o.source = 'S03' AND ${dk}`);
  const { rows } = await c.query(
    `SELECT o.offer_id, ${DK_NGUON} AS nguon, o.kind, o.property_type, o.price_vnd::text, o.area_m2::text, o.post_ids,
            coalesce(a.parent_id, a.id) AS market, o.area_id
       FROM sale_offers o LEFT JOIN areas a ON a.id = o.area_id
      WHERE o.source = 'S03' AND ${dk} ORDER BY md5(o.offer_id || '${SEED}')`);
  return { so, rows };
}
async function ghiMau() {
  canDbThu();
  const mau = await trongGiaoDich(async (c) => {
    const { rows } = await docLenCong(c);
    const chon = chonMau(rows);
    const { rows: chu } = await c.query("SELECT DISTINCT ON (post_id) post_id, text, group_name FROM public.stg_zalo_posts WHERE post_id = ANY ($1)", [chon.flatMap((m) => m.post_ids)]);
    const theo = new Map(chu.map((p) => [p.post_id, p]));
    return chon.map((m) => ({ ...m, bai: m.post_ids.map((id) => theo.get(id)).filter(Boolean).map((p) => ({ text: p.text, group_name: p.group_name })) }));
  });
  writeFileSync(TEP_MAU, `${JSON.stringify({ seed: SEED, mau }, null, 1)}\n`);
  const dem = mau.reduce((a, m) => ({ ...a, [m.nguon]: (a[m.nguon] ?? 0) + 1 }), {});
  in_(`mẫu ${mau.length} tin theo seed ${SEED}: ${JSON.stringify(dem)}; ghi vào research-local/, chờ tác tử gắn nhãn`);
}
/** Mẫu đóng băng phải còn khớp lượt này: tin còn lên cổng và giá trị được chấm không đổi. */
export function lechMau(mau, rows) {
  const theo = new Map(rows.map((r) => [r.offer_id, r]));
  const mat = mau.filter((m) => !theo.has(m.offer_id)).length;
  const doi = mau.filter((m) => {
    const r = theo.get(m.offer_id);
    return r && ["kind", "property_type", "price_vnd", "area_m2", "market"].some((k) => r[k] !== m[k]);
  }).length;
  return { mat, doi };
}
const TRAN_MAT_MAU = 3; // Tin rời cổng theo ngày (quá 30 ngày) là bình thường; nhiều hơn thì mẫu đã cũ.
async function doLenCong() {
  canDbThu();
  const { so, rows } = await trongGiaoDich(docLenCong);
  in_(`E11 sổ nhóm: nháp, chưa qua Mạnh duyệt`);
  in_(`E11 S03 lên cổng: ${so.n} tin (bán ${so.ban}, thuê ${so.thue}); đích ${DICH_LEN_CONG}${so.n < DICH_LEN_CONG ? `, hụt ${DICH_LEN_CONG - so.n}, chỉ cảnh báo` : ", đạt"}`);
  if (so.n <= GAY_LEN_CONG) throw new Error(`SL1-AC-9: số lên cổng ${so.n}, không vượt ${GAY_LEN_CONG}, đường gãy`);
  if (!existsSync(TEP_MAU) || !existsSync(TEP_NHAN_MAU)) throw new Error("SL1-AC-9: thiếu mẫu hoặc nhãn mẫu; chạy --mau rồi gắn nhãn");
  const { mau, seed } = JSON.parse(readFileSync(TEP_MAU, "utf8"));
  if (seed !== SEED || mau.length !== 30) throw new Error(`SL1-AC-9: mẫu sai khuôn (seed ${seed}, ${mau.length} tin)`);
  const lech = lechMau(mau, rows);
  in_(`E11 mẫu so với lượt này: rời cổng ${lech.mat}, đổi giá trị ${lech.doi}`);
  if (lech.doi || lech.mat > TRAN_MAT_MAU) throw new Error("SL1-AC-9: mẫu không còn khớp lượt này; chạy lại --mau rồi gắn nhãn");
  const nhan = new Map(JSON.parse(readFileSync(TEP_NHAN_MAU, "utf8")).nhan.map((n) => [n.offer_id, n]));
  const dem = {};
  let cham = 0, sai = 0;
  for (const m of mau) {
    const n = nhan.get(m.offer_id);
    if (!n) throw new Error(`SL1-AC-9: mẫu có tin chưa gắn nhãn (${m.offer_id})`);
    if (n.khong_cham) continue;
    cham++;
    for (const l of saiNang(m, n)) dem[l] = (dem[l] ?? 0) + 1;
    if (saiNang(m, n).length) sai++;
  }
  if (!cham) throw new Error("SL1-AC-9: không chấm được tin nào trong mẫu");
  in_(`E11 nhãn do tác tử gắn, không phải nhãn vàng; seed ${seed}`);
  in_(`E11 sai nặng: ${sai}/${cham} tin (${phanTram(sai, cham)}); đích ${DICH_SAI_NANG * 100}%${sai / cham > DICH_SAI_NANG ? ", vượt đích, chỉ cảnh báo" : ", đạt"}; theo lý do ${JSON.stringify(dem)}`);
}

// ---- E13: ma trận bên đọc ----
const MAU_BEN_DOC = /sale_offers|market_asset_stats|property_type|field_provenance/;
const PHAM_VI_DOC = ["pipeline", "app/src", "data-api/src", "agent/src", "db/migrations"];
// Tệp `.sl1-*` chưa theo dõi là bản đột biến của bài kiểm đang chạy song song (E9, E2), tự xoá khi xong; tệp đã commit vẫn quét.
const TEP_TAM_DO = /(^|\/)\.sl1-[^/]*$/;
export const boTepTam = (ds) => ds.filter((f) => !TEP_TAM_DO.test(f));
const dongGit = (...args) => git(...args).split("\n").filter(Boolean);
const chuaTheoDoi = (...duong) => boTepTam(dongGit("ls-files", "-o", "--exclude-standard", ...duong));
export function kiemBenDoc(tepCo, maTran) {
  const co = new Set(tepCo);
  const bietHet = new Set(Object.values(maTran).flat());
  const loi = [];
  for (const f of tepCo) if (!bietHet.has(f)) loi.push(`SL1-AC-3 tệp lạ, chưa có kết luận trong ma trận: ${f}`);
  for (const f of bietHet) if (!co.has(f)) loi.push(`SL1-AC-3 tệp trong ma trận không còn khớp mẫu: ${f}`);
  return loi;
}
function benDoc() {
  const ds = [...dongGit("ls-files", "-c", ...PHAM_VI_DOC), ...chuaTheoDoi(...PHAM_VI_DOC)]
    .filter((f) => !f.includes("/node_modules/") && existsSync(join(GOC, f)))
    .filter((f) => { try { return MAU_BEN_DOC.test(readFileSync(join(GOC, f), "utf8")); } catch { return false; } });
  const { ket_luan: maTran } = JSON.parse(readFileSync(TEP_BEN_DOC, "utf8"));
  const loi = kiemBenDoc(ds, maTran);
  if (kiemBenDoc([...ds, "pipeline/tep-gia.mjs"], maTran).length !== loi.length + 1) throw new Error("SL1-AC-3: đối chứng thêm tệp giả không đỏ");
  const tamGia = "app/src/app/api/v1/offers/.sl1-route-1-gia.ts";
  if (kiemBenDoc(boTepTam([...ds, tamGia]), maTran).length !== loi.length) throw new Error("SL1-AC-3: đối chứng tệp tạm không được lọc");
  in_(`E13 quét ${ds.length} tệp; đối chứng thêm tệp giả ra đỏ, tệp tạm đột biến được lọc`);
  for (const [k, v] of Object.entries(maTran)) in_(`E13 ${v.length} tệp: ${k}`);
  if (loi.length) throw new Error(loi.join("\n"));
}

// ---- E12: thước dòng thêm ----
const TEP_CAM = [/^pipeline\/sync-cloud\.mjs$/, /^collector\/openclaw\//, /^app\/src\/app\/api\/v1\/ops\/zalo\//, /^app\/src\/app\/ops\/sources\//];
const TOKEN = /[\p{L}\p{N}_.\-/]+/gu;
/** Dòng mang tên thật: token trần bằng đúng tên luôn đỏ; định danh dài hơn chứa tên chỉ đỏ khi kho chưa từng có nó. */
export function kiemDong(dong, ten, coSan) {
  const loi = [];
  const thuong = dong.toLowerCase();
  for (const { code, realName } of ten) {
    if (!thuong.includes(realName.toLowerCase())) continue;
    for (const tok of dong.match(TOKEN) ?? []) {
      if (!tok.toLowerCase().includes(realName.toLowerCase())) continue;
      if (tok.toLowerCase() === realName.toLowerCase() || !coSan(tok)) loi.push(code);
    }
  }
  return [...new Set(loi)];
}
function dongThem(base) {
  const out = [];
  let tep = null, so = 0;
  for (const d of git("diff", "-U0", base, "--", ".").split("\n")) {
    if (d.startsWith("+++ ")) { tep = d.slice(6); continue; }
    const m = d.match(/^@@ -\S+ \+(\d+)/);
    if (m) { so = Number(m[1]); continue; }
    if (d.startsWith("+") && tep) out.push({ tep, so: so++, dong: d.slice(1) });
  }
  for (const f of chuaTheoDoi()) {
    readFileSync(join(GOC, f), "utf8").split("\n").forEach((dong, i) => out.push({ tep: f, so: i + 1, dong }));
  }
  return out;
}
async function ranh() {
  canDbThu();
  const base = git("merge-base", "HEAD", "origin/main").trim();
  const doi = [...new Set(git("diff", "--name-only", base).split("\n").filter(Boolean).concat(chuaTheoDoi()))];
  const loi = [];
  for (const f of doi) if (TEP_CAM.some((r) => r.test(f))) loi.push(`SL1-AC-10 tệp cấm đổi: ${f}`);
  if (spawnSync("git", ["-C", GOC, "check-ignore", "-q", "research-local/s03-len-cong/so-nhom-nhap.json"]).status !== 0) loi.push("SL1-AC-10 sổ nháp không bị ignore");
  const { ten, khoa, tenNhom } = await trongGiaoDich(async (c) => ({
    ten: (await c.query(`SELECT DISTINCT code, x FROM (SELECT code, real_name AS x FROM source_registry
       UNION ALL SELECT code, unnest(source_ids) FROM source_registry) t WHERE length(x) >= 3`)).rows.map((r) => ({ code: r.code, realName: r.x })),
    khoa: (await c.query("SELECT group_key FROM collection_units WHERE source_code = 'S03' AND length(group_key) >= 8")).rows.map((r) => r.group_key),
    tenNhom: (await c.query("SELECT DISTINCT group_name FROM stg_zalo_posts WHERE length(group_name) >= 8")).rows.map((r) => r.group_name),
  }));
  if (!ten.length) throw new Error("SL1-AC-10: source_registry rỗng, không đo được");
  const dong = dongThem(base);
  const nho = new Map();
  const coSan = (tok) => {
    if (!nho.has(tok)) {
      const laTep = spawnSync("git", ["-C", GOC, "cat-file", "-e", `${base}:${tok}`]).status === 0;
      nho.set(tok, laTep || spawnSync("git", ["-C", GOC, "grep", "-qF", tok, base, "--", "."]).status === 0);
    }
    return nho.get(tok);
  };
  const THA = /^(PRODUCT-MAP\.md|LO-TRINH\.html)$/; // máy sinh từ hồ sơ khác của nhánh chính
  const dem = { dong: 0 };
  const chuoi = new Set();
  for (const { tep, so, dong: d } of dong) {
    if (THA.test(tep)) continue;
    dem.dong++;
    for (const code of kiemDong(d, ten, coSan)) loi.push(`SL1-AC-10 ${tep}:${so} mang tên thật của ${code}`);
    for (const k of khoa) if (d.includes(k)) loi.push(`SL1-AC-10 ${tep}:${so} mang khoá nhóm`);
    for (const k of tenNhom) if (d.includes(k)) loi.push(`SL1-AC-10 ${tep}:${so} mang tên nhóm`);
    for (const m of d.matchAll(/["'`]([^"'`]{40,})["'`]/g)) chuoi.add(JSON.stringify([tep, so, m[1].slice(0, 200)]));
  }
  await trongGiaoDich(async (c) => {
    for (const j of chuoi) {
      const [tep, so, s] = JSON.parse(j);
      const { rows } = await c.query("SELECT 1 FROM stg_zalo_posts WHERE position($1 in text) > 0 LIMIT 1", [s]);
      if (rows.length) loi.push(`SL1-AC-10 ${tep}:${so} mang chữ bài thật`);
    }
  });
  // Đối chứng: tên thật chèn vào dòng thêm giả thì đỏ; định danh có sẵn không đỏ.
  if (!kiemDong(`const x = "${ten[0].realName}";`, ten, () => false).length) loi.push("SL1-AC-10: thước không đỏ khi chèn tên thật");
  if (kiemDong(`const x = "co_${ten[0].realName}_co";`, ten, () => true).length) loi.push("SL1-AC-10: thước đỏ với định danh có sẵn");
  in_(`E12 quét ${dem.dong} dòng thêm, ${doi.length} tệp đổi, ${chuoi.size} chuỗi dài; đối chứng tên thật ra đỏ, định danh có sẵn không đỏ`);
  if (loi.length) throw new Error([...new Set(loi)].join("\n"));
}

// ---- E14: nhãn trên thẻ ----
export function kiemUi(the, context) {
  const loi = [];
  if (!/import \{ Badge \} from "@\/components\/reui\/badge"/.test(the)) loi.push("thẻ không import Badge từ @/components/reui/badge");
  if (!/<Badge variant="warning-light">Chưa xác minh<\/Badge>/.test(the)) loi.push("thẻ thiếu Badge warning-light cỡ mặc định, không className");
  if (!/\*\*Chưa xác minh\*\*/.test(context)) loi.push("CONTEXT.md thiếu thuật ngữ «Chưa xác minh»");
  return loi;
}
function uiTinh() {
  const the = readFileSync(join(GOC, "app/src/components/listing/offer-card.tsx"), "utf8");
  const ctx = readFileSync(join(GOC, "CONTEXT.md"), "utf8");
  const loi = kiemUi(the, ctx);
  const doi = the.replace('<Badge variant="warning-light">', '<Badge variant="warning-light" className="text-lg">');
  if (doi === the || !kiemUi(doi, ctx).length) loi.push("đối chứng thêm className không đỏ");
  in_("E14 Badge warning-light, không className, có thuật ngữ; đối chứng thêm className ra đỏ");
  if (loi.length) throw new Error(`SL1-AC-8: ${loi.join("; ")}`);
}

const a = process.argv.slice(2);
if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) {
  try {
    if (a.includes("--ben-doc")) benDoc();
    else if (a.includes("--ui-tinh")) uiTinh();
    else if (a.includes("--ranh")) await ranh();
    else if (a.includes("--mau")) await ghiMau();
    else {
      canDbThu();
      await doLoaiHinh();
      await doTapTin();
      await doLenCong();
    }
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    process.exitCode = 1;
  }
}
