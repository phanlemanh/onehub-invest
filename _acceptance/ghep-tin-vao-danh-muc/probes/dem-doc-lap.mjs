#!/usr/bin/env node
// dem-doc-lap.mjs — phép đếm ĐỘC LẬP cho AC-8 của hàng PL20 ghep-tin-vao-danh-muc.
//
// Viết lại luật gắn tin căn hộ S03 vào toà, vùng CHỈ từ design doc §3 (mục «Cách hiểu đã chốt»), hợp đồng AC-8,
// CONTEXT.md và lược đồ DB. Không nhập, không đọc hàm gắn của hàng. Nguồn bật: A, B, C, F. Nguồn tắt: D, G.
//
// Cách chạy:
//   DATABASE_URL=postgres://… node _acceptance/ghep-tin-vao-danh-muc/probes/dem-doc-lap.mjs [--ra <tệp>]
// stdout: đúng một dòng JSON. --ra: mỗi tin đã gắn một dòng «offer_id<TAB>muc<TAB>khoá», sắp theo offer_id.
// Thiếu DATABASE_URL hoặc sai tham số: thoát 2. Phiên chỉ đọc, không ghi gì lên DB.
//
// ĐIỂM TÀI LIỆU CÒN MƠ HỒ VÀ CÁCH ĐÃ CHỌN (chọn cách sát chữ nhất, không tra mã của hàng):
//  M1. Tên nằm lồng trong tên dài hơn («Paris» trong «The Paris», «S1» trong «S1.02»). Điểm 4 ghi «tìm mọi tên», không nói
//      ưu tiên tên dài nhất, nên đọc ra CẢ HAI. Hệ quả: «The Paris» là hai vùng, bước 7 không gắn.
//  M2. Một tên chỉ tới nhiều toà hay nhiều vùng trong chữ bài (E1, E2, TC, The Beverly ở GP). Điểm 5 đếm «số toà khác nhau đọc
//      được», nên tính đủ mọi nút của tên: tên hai toà là «nêu từ hai toà», tên hai vùng là «nhiều vùng».
//  M3. «Tên nhiều từ được cách nhau một khoảng trắng» (điểm 4): trong chữ bài các từ cách nhau đúng MỘT ký tự trắng.
//      Không ghép liền từ, không bỏ gạch ngang khi đọc chữ bài; phép bỏ ở điểm 1 chỉ dùng khi so hai tên.
//  M4. Ô tên toà có giá trị khớp một nút và giá trị khác ngoài danh bạ (điểm 9 chỉ nói hai nút khác nhau). Bước 3 đứng trước
//      bước 4 và «dừng ở bậc đầu tiên có kết quả», nên gắn vào nút đó. Có giá trị mơ hồ thì cả ô là mo-ho.
//  M5. Ô khớp cả A lẫn B về cùng một nút: tính nguồn A.
//  M6. Bản đọc ghi tên mơ hồ (một tên nhiều nút): coi như ô đó không ra toà, không ra vùng.
//  M7. Luật không đọc được toà, model nêu từ hai toà: bước 6 đòi «đúng một toà» nên không dừng ở bước 6, đi tiếp bước 7.
//  M8. Luật đọc được vùng, model nêu một toà: bước 6 đứng trước bước 7, dừng ở bậc D (đang tắt), không gắn.
//  M9. Bước 7 «nhiều vùng không gắn» áp cả khi các vùng lồng nhau; luật lồng nhau chỉ nói ở mức tin (view offer_building).
//  M10. Hai vùng lồng nhau trên hai bài của một tin: ra vùng sâu hơn. Vùng chứa toà: nút hiệu lực của toà ở v_toa_nut_vung
//      hoặc một nút tổ tiên của nút đó.
//  M11. theo_nguon ở mức tin: trong các bài gắn đúng nút cuối của tin, lấy nguồn mạnh nhất theo thứ tự A, B, C, F.
//  M12. «Đang sống» là dòng của view sale_offers. Căn hộ là property_type = 'apartment'. Dự án của tin lấy từ view offer_project.
//  M13. Mọi phát biểu block_raw còn hiệu lực đều tính, không lọc theo phương pháp (điểm 9 ghi «mọi phát biểu»).
//  M14. Bí danh của nút vùng là cột asset_nodes.aliases; mọi nút dưới dự án đều là vùng, gồm cả nút node_type = 'building'.
//      Điểm 1 (bản sửa 19/11): nút có meta.nghi = true không nhận tên nhưng vẫn nằm trong cây khi xét toà thuộc vùng nào.
//  M15. ĐÃ CHỐT trong điểm 4: trong chữ bài tên toà phải giữ dấu chấm như tên đã đăng ký; cách bỏ dấu chấm ở điểm 2 chỉ dùng cho ô
//      tên toà và bản đọc. «S1006» ở Grand Park không đọc ra toà S10.06 và cũng không đọc ra vùng S1.
//  M16. «Dạng che số như 15XX08»: chữ số, rồi chữ X, rồi chữ số, mỗi phần 1–4 ký tự. «15XX», «XX08» không tính là đuôi.
//  M17. «Tên vùng không nhận đuôi này»: áp cho cả đuôi dính liền lẫn đuôi sau dấu phân cách. Dấu phân cách là «.» và «-», đúng
//      hai dấu trong ví dụ. «S1.1508» không đọc ra vùng S1; «S1.99» vẫn đọc ra vùng S1 vì 99 chỉ có hai chữ số.
//  M18. Một chuỗi tách được hai cách («Sao Biển 11508» là Sao Biển 1 + 1508 hoặc Sao Biển 11 + 508): theo «tìm mọi tên» đọc ra cả
//      hai toà, nên bài bị chặn ở bước «nêu từ hai toà».

import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const GOC_KHO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(resolve(GOC_KHO, "pipeline/package.json"));
const pg = require("pg");
const { testMarker } = await import(pathToFileURL(resolve(GOC_KHO, "pipeline/lib/test-posts.mjs")).href);

const KHU = { "vinhomes-ocean-park-1": "OP1", "vinhomes-grand-park": "GP" };
const PHIEN_BAN_DOC = "dg3-s03-v3";
const THU_TU_NGUON = ["A", "B", "C", "F"];
// Điểm 4: đuôi mã căn là 3–4 chữ số hoặc dạng che số như 15XX08 (chữ đã gập về thường trước khi so).
const DUOI_MA_CAN = "(?:\\d{3,4}|\\d{1,4}x{1,4}\\d{1,4})";
const HET_TEN = "(?![\\p{L}\\p{N}])";

// ---------- So tên (điểm 1) ----------

const boDau = (s) => s.normalize("NFD").replace(/\p{M}+/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D");
/** Khoá so hai tên: bỏ dấu, khoảng trắng, gạch ngang, gạch dưới, viết hoa; giữ dấu chấm. */
const chuanTen = (s) => boDau(String(s)).replace(/[\s\-_]+/g, "").toUpperCase();
/** Dạng dùng khi tìm trong chữ bài: chỉ gập dấu và hoa thường (điểm 4). */
const gapChu = (s) => boDau(String(s)).toLowerCase();
const themVao = (map, khoa, giaTri) => {
  if (!map.has(khoa)) map.set(khoa, new Set());
  map.get(khoa).add(giaTri);
};

// ---------- Danh bạ của một dự án ----------

function dungDanhBa(tenToaTho, tenVungTho) {
  const toaTheoTen = new Map();
  const vungTheoTen = new Map();
  const dangViet = new Set();
  for (const { khoa, ten } of tenToaTho) {
    const k = chuanTen(ten);
    if (k.length < 2 || !/\p{L}/u.test(k)) continue;
    themVao(toaTheoTen, k, khoa);
    dangViet.add(ten);
  }
  for (const { khoa, ten } of tenVungTho) {
    const k = chuanTen(ten);
    if (k.length < 2) continue;
    themVao(vungTheoTen, k, khoa);
    dangViet.add(ten);
  }
  // Điểm 3: tên trùng đúng một toà và đúng một vùng là vùng ở mọi đường đọc, như thể danh bạ không có tên toà đó.
  for (const [k, toa] of [...toaTheoTen]) {
    if (toa.size === 1 && vungTheoTen.get(k)?.size === 1) toaTheoTen.delete(k);
  }
  const toaBoCham = new Map();
  for (const [k, toa] of toaTheoTen) for (const b of toa) themVao(toaBoCham, k.replaceAll(".", ""), b);

  const mauDoc = new Map();
  for (const ten of dangViet) {
    const k = chuanTen(ten);
    const tu = gapChu(ten).trim().split(/\s+/);
    const mau = tu.join(" ");
    if (mauDoc.has(mau)) continue;
    const than = tu.map((t) => t.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")).join("\\s");
    const truoc = `(?<![\\p{L}\\p{N}])${than}`;
    mauDoc.set(mau, {
      k,
      dau: tu[0],
      // Điểm 4: tên toà nhận đuôi mã căn dính liền; tên vùng không nhận đuôi này, dính liền hay sau dấu phân cách.
      reToa: new RegExp(`${truoc}(?:${DUOI_MA_CAN})?${HET_TEN}`, "u"),
      reVung: new RegExp(`${truoc}${HET_TEN}(?![.\\-]${DUOI_MA_CAN}${HET_TEN})`, "u"),
    });
  }
  return { toaTheoTen, vungTheoTen, toaBoCham, mauDoc: [...mauDoc.values()], nhoChu: new Map() };
}

/** Tra một khoá tên: null khi không khớp, { mo_ho } khi nhiều nơi, còn lại là đúng một nút. */
function traKhoa(db, k) {
  const toa = db.toaTheoTen.get(k) ?? new Set();
  const vung = db.vungTheoTen.get(k) ?? new Set();
  const tong = toa.size + vung.size;
  if (tong === 0) return null;
  if (tong > 1) return { mo_ho: true };
  return toa.size === 1 ? { muc: "toa", khoa: [...toa][0] } : { muc: "vung", khoa: [...vung][0] };
}

/** Quy một giá trị về nút theo điểm 1–3: khớp đúng tên (A), rồi hai cách chuẩn hoá cách viết (B). */
function phanGiai(db, giaTri) {
  const k = chuanTen(giaTri);
  if (!k) return null;
  const dung = traKhoa(db, k);
  if (dung) return { ...dung, nguon: "A" };
  const boCham = db.toaBoCham.get(k.replaceAll(".", ""));
  if (boCham) return boCham.size > 1 ? { mo_ho: true, nguon: "B" } : { muc: "toa", khoa: [...boCham][0], nguon: "B" };
  if (k.includes(".")) {
    const truocCham = traKhoa(db, k.slice(0, k.indexOf(".")));
    if (truocCham) return { ...truocCham, nguon: "B" };
  }
  return null;
}

/** Đọc mọi tên trong chữ bài (điểm 4). Trả tập toà và tập vùng đọc được. */
function docChuBai(db, text) {
  const daNho = db.nhoChu.get(text);
  if (daNho) return daNho;
  const chu = gapChu(text);
  const toa = new Set();
  const vung = new Set();
  for (const m of db.mauDoc) {
    if (!chu.includes(m.dau)) continue;
    if (db.toaTheoTen.has(m.k) && m.reToa.test(chu)) for (const b of db.toaTheoTen.get(m.k)) toa.add(b);
    if (db.vungTheoTen.has(m.k) && m.reVung.test(chu)) for (const n of db.vungTheoTen.get(m.k)) vung.add(n);
  }
  const kq = { toa, vung };
  db.nhoChu.set(text, kq);
  return kq;
}

/** Bản đọc của model: chỉ tính ô có căn cứ chu_bai và đoạn trích đã kiểm (§3, điểm 7). */
function docModel(db, banDoc) {
  const toa = new Set();
  const vung = new Set();
  for (const o of ["building", "subzone"]) {
    const c = banDoc?.o?.[o];
    if (!c || c.cc !== "chu_bai" || c.trich_ok !== true) continue;
    if (c.v === null || c.v === undefined || c.v === "") continue;
    const r = phanGiai(db, c.v);
    if (r?.muc === "toa") toa.add(r.khoa);
    if (r?.muc === "vung") vung.add(r.khoa);
  }
  return { toa, vung };
}

const motPhanTu = (s) => (s.size === 1 ? [...s][0] : null);

/** Luật gắn một bài, §3 bước 2–7. Trả { muc, khoa, nguon } hoặc null khi không gắn. */
function ganBai(db, { text, cacO, banDoc }) {
  const chu = docChuBai(db, text);
  // Bước 2: chặn trước mọi nguồn.
  if (chu.toa.size >= 2) return null;
  if (banDoc?.o?.multi_unit?.v === "yes") return null;

  // Bước 3–4: ô tên toà, xét mọi phát biểu còn hiệu lực của bài (điểm 9).
  const giaTri = cacO.filter((v) => chuanTen(v) !== "");
  if (giaTri.length > 0) {
    const kq = giaTri.map((v) => phanGiai(db, v)).filter(Boolean);
    if (kq.some((r) => r.mo_ho)) return null;
    const nut = new Set(kq.map((r) => `${r.muc}|${r.khoa}`));
    if (nut.size !== 1) return null; // hai nút là mo-ho, không nút nào là ngoai-danh-ba; cả hai không rơi xuống bậc sau
    const nguon = kq.some((r) => r.nguon === "A") ? "A" : "B";
    return { muc: kq[0].muc, khoa: kq[0].khoa, nguon };
  }

  const model = docModel(db, banDoc);
  // Bước 5: luật đọc được một toà.
  const toaLuat = motPhanTu(chu.toa);
  if (toaLuat !== null) {
    return model.toa.size === 1 && model.toa.has(toaLuat) ? { muc: "toa", khoa: toaLuat, nguon: "C" } : null;
  }
  // Bước 6: model một mình nêu đúng một toà là bậc D, đang tắt, dừng ở đây (điểm 8).
  if (model.toa.size === 1) return null;
  // Bước 7: mức vùng.
  if (chu.vung.size >= 2) return null;
  const vungLuat = motPhanTu(chu.vung);
  if (vungLuat !== null) {
    return model.vung.size === 1 && model.vung.has(vungLuat) ? { muc: "vung", khoa: vungLuat, nguon: "F" } : null;
  }
  return null; // model một mình nêu vùng là bậc G, đang tắt
}

// ---------- Gộp từ bài lên tin ----------

function gopLenTin(ketQuaBai, toTien, vungCuaToa) {
  if (ketQuaBai.length === 0) return { trang_thai: "chua_gan" };
  const toa = new Set(ketQuaBai.filter((r) => r.muc === "toa").map((r) => r.khoa));
  const vung = new Set(ketQuaBai.filter((r) => r.muc === "vung").map((r) => r.khoa));
  if (toa.size >= 2) return { trang_thai: "xung_dot" };
  let dich;
  if (toa.size === 1) {
    const b = [...toa][0];
    const hieuLuc = vungCuaToa.get(b);
    const chua = new Set(hieuLuc === undefined ? [] : [hieuLuc, ...toTien(hieuLuc)]);
    if ([...vung].some((v) => !chua.has(v))) return { trang_thai: "xung_dot" };
    dich = { muc: "toa", khoa: b };
  } else {
    const sauNhat = [...vung].find((v) => {
      const tren = new Set([v, ...toTien(v)]);
      return [...vung].every((x) => tren.has(x));
    });
    if (sauNhat === undefined) return { trang_thai: "xung_dot" };
    dich = { muc: "vung", khoa: sauNhat };
  }
  const nguonDich = new Set(ketQuaBai.filter((r) => r.muc === dich.muc && r.khoa === dich.khoa).map((r) => r.nguon));
  return { trang_thai: "da_gan", ...dich, nguon: THU_TU_NGUON.find((n) => nguonDich.has(n)) };
}

// ---------- Chạy ----------

function docThamSo(argv) {
  let ra = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--ra" && argv[i + 1]) ra = argv[(i += 1)];
    else {
      console.error(`Tham số không hiểu: ${argv[i]}. Cách dùng: dem-doc-lap.mjs [--ra <tệp>]`);
      process.exit(2);
    }
  }
  return { ra };
}

async function main() {
  const { ra } = docThamSo(process.argv.slice(2));
  if (!process.env.DATABASE_URL) {
    console.error("Thiếu DATABASE_URL.");
    process.exit(2);
  }
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("SET default_transaction_read_only = on");
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");

    const { rows: nutRows } = await client.query(
      "SELECT id::text AS id, parent_id::text AS parent_id, slug, name, aliases, meta->>'nghi' = 'true' AS nghi FROM asset_nodes",
    );
    const nutTheoId = new Map(nutRows.map((n) => [n.id, n]));
    const toTien = (id) => {
      const ra_ = [];
      for (let n = nutTheoId.get(id); n?.parent_id; n = nutTheoId.get(n.parent_id)) ra_.push(n.parent_id);
      return ra_;
    };
    const duAn = new Map(nutRows.filter((n) => KHU[n.slug]).map((n) => [n.id, KHU[n.slug]]));
    if (duAn.size !== Object.keys(KHU).length) throw new Error("Không tìm thấy đủ hai dự án trong asset_nodes.");
    const duAnCuaNut = (id) => [id, ...toTien(id)].find((x) => duAn.has(x));

    const tenVung = new Map([...duAn.keys()].map((id) => [id, []]));
    for (const n of nutRows) {
      if (duAn.has(n.id) || n.nghi) continue; // điểm 1: nút đã nghỉ không nhận tên, cây tổ tiên vẫn giữ nguyên
      const goc = toTien(n.id).find((x) => duAn.has(x));
      if (goc === undefined) continue;
      for (const ten of [n.name, ...(n.aliases ?? [])]) tenVung.get(goc).push({ khoa: n.id, ten });
    }

    const { rows: toaRows } = await client.query(
      `SELECT b.building_key, b.region_node_id::text AS region_node_id, a.value AS ten
       FROM buildings b
       JOIN registry_aliases a ON a.object_key = b.building_key AND a.kind = 'ten' AND a.retired_at IS NULL
       WHERE b.status = 'active'`,
    );
    const tenToa = new Map([...duAn.keys()].map((id) => [id, []]));
    for (const r of toaRows) {
      const goc = duAnCuaNut(r.region_node_id);
      if (goc !== undefined) tenToa.get(goc).push({ khoa: r.building_key, ten: r.ten });
    }
    const danhBa = new Map([...duAn.keys()].map((id) => [id, dungDanhBa(tenToa.get(id), tenVung.get(id))]));

    const { rows: hieuLucRows } = await client.query("SELECT building_key, region_node_id::text AS region_node_id FROM v_toa_nut_vung");
    const vungCuaToa = new Map(hieuLucRows.map((r) => [r.building_key, r.region_node_id]));

    const { rows: tinRows } = await client.query(
      `SELECT o.offer_id, o.post_ids, CASE WHEN p.status = 'mot_du_an' THEN p.project_node_id::text END AS du_an
       FROM sale_offers o
       LEFT JOIN offer_project p ON p.offer_id = o.offer_id
       WHERE o.source = 'S03' AND o.property_type = 'apartment'`,
    );
    const tinTrongKhu = tinRows.filter((t) => duAn.has(t.du_an));
    const maBai = [...new Set(tinTrongKhu.flatMap((t) => t.post_ids))];

    const { rows: baiRows } = await client.query(
      "SELECT post_id, snapshot_id, agent_id, group_name, text FROM stg_zalo_posts WHERE post_id = ANY($1::text[])",
      [maBai],
    );
    const baiTheoMa = new Map(baiRows.map((b) => [b.post_id, b]));

    const { rows: oRows } = await client.query(
      `SELECT subject_key, value FROM field_assertions
       WHERE resource_name = 'Property' AND field = 'block_raw' AND retracted_at IS NULL AND subject_key = ANY($1::text[])`,
      [maBai.map((m) => `S03:${m}`)],
    );
    const oTheoBai = new Map();
    for (const r of oRows) {
      const ma = r.subject_key.slice("S03:".length);
      if (!oTheoBai.has(ma)) oTheoBai.set(ma, []);
      oTheoBai.get(ma).push(r.value);
    }

    const { rows: docRows } = await client.query(
      `SELECT DISTINCT ON (post_id) post_id, probabilities
       FROM silver_labels
       WHERE source_code = 'S03' AND prompt_version = $1 AND json_ok AND probabilities->>'nguon' = 'doc-gop'
         AND post_id = ANY($2::text[])
       ORDER BY post_id, labeled_at DESC, label_id DESC`,
      [PHIEN_BAN_DOC, maBai],
    );
    const docTheoBai = new Map(docRows.map((r) => [r.post_id, r.probabilities]));

    const theoKhu = Object.fromEntries(Object.values(KHU).map((k) => [k, 0]));
    const theoMuc = { toa: 0, vung: 0 };
    const theoNguon = Object.fromEntries(THU_TU_NGUON.map((n) => [n, 0]));
    const dongRa = [];
    let xungDot = 0;

    for (const tin of tinTrongKhu) {
      const db = danhBa.get(tin.du_an);
      const ketQuaBai = [];
      for (const ma of new Set(tin.post_ids)) {
        const bai = baiTheoMa.get(ma);
        if (bai && testMarker(bai)) continue; // điểm 10: bài thử không xét, tin vẫn trong mẫu số
        const r = ganBai(db, { text: bai?.text ?? "", cacO: oTheoBai.get(ma) ?? [], banDoc: docTheoBai.get(ma) });
        if (r) ketQuaBai.push(r);
      }
      const kq = gopLenTin(ketQuaBai, toTien, vungCuaToa);
      if (kq.trang_thai === "xung_dot") xungDot += 1;
      if (kq.trang_thai !== "da_gan") continue;
      theoKhu[duAn.get(tin.du_an)] += 1;
      theoMuc[kq.muc] += 1;
      theoNguon[kq.nguon] += 1;
      dongRa.push([tin.offer_id, kq.muc, kq.khoa]);
    }
    await client.query("ROLLBACK");

    const tuSo = dongRa.length;
    const mauSo = tinRows.length;
    if (ra) {
      dongRa.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
      writeFileSync(ra, dongRa.map((d) => `${d.join("\t")}\n`).join(""));
    }
    console.log(
      JSON.stringify({
        tu_so: tuSo,
        mau_so: mauSo,
        ty_le: mauSo === 0 ? 0 : Math.round((tuSo / mauSo) * 1e6) / 1e6,
        theo_khu: theoKhu,
        theo_muc: theoMuc,
        theo_nguon: theoNguon,
        xung_dot: xungDot,
      }),
    );
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(`dem-doc-lap: ${e.message}`);
  process.exit(1);
});
