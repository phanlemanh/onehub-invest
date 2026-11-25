#!/usr/bin/env node
// s09-v16-sinh-fixture.mjs — DA56 (nap-s09-quy-can-va-can-cao-tang) việc 1: sinh fixture DATA-CONTRACT v16 của S09 từ KHUÔN bản thu
// thật và bảng kiểm kê khoá của căn.
//   node pipeline/scripts/s09-v16-sinh-fixture.mjs --tu <thư mục chờ chứa vn__s09-danh-ba__*> [--ra pipeline/tests/fixtures/s09-v16]
//        [--kiem-ke pipeline/lib/s09-danh-ba-v16-khoa.json]
// Thư mục chờ có tầng A (URL ảnh trên tên miền CDN của nguồn, toạ độ từng căn): chỉ ĐỌC tại máy. Mọi giá trị chuỗi không phải
// mã liệt kê đều thay bằng giá trị giả lập; URL ảnh → https://cdn.gia-lap.test/…; toạ độ → TOA_DO_GIA_LAP. Script tự quét đầu ra:
// còn chuỗi «http» ngoài tên miền giả lập, hay còn bất kỳ chuỗi gốc nào dài ≥ 6 ký tự không thuộc danh sách giữ nguyên → thoát 1.
// Chỉ in số, không in giá trị.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

export const MIEN_GIA_LAP = "cdn.gia-lap.test";
export const TOA_DO_GIA_LAP = Object.freeze({ lat_cdnt: 1.234567, long_cdnt: 7.654321 });

// Khoá mà giá trị là mã liệt kê công khai của nguồn (không tên riêng, không URL) — giữ nguyên văn để fixture mang đúng khuôn.
const KHOA_GIU_GIA_TRI = new Set([
  "kind", "source", "status", "property_group", "property_type", "classify", "available_for_sale_status", "furniture_status",
  "directions", "views", "positions", "good_price", "number_of_bedrooms_displays", "floor_number", "code", "media_type", "category",
  "facade_directions", "facades", "property_code", "direction_name", "ma",
]);
// Khoá bị bỏ khỏi stg theo bảng kiểm kê (Hỏi-2 duyệt 25/11).
export const KHOA_BO = Object.freeze(["galleries", "geolocation"]);

const doi = (ten) => {
  const i = process.argv.indexOf(ten);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

function docBan(thuMuc) {
  const manifest = JSON.parse(readFileSync(join(thuMuc, "manifest.json"), "utf8"));
  const items = readdirSync(thuMuc)
    .filter((f) => /^items-\d+\.json\.gz$/.test(f))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
    .flatMap((f) => {
      const d = JSON.parse(gunzipSync(readFileSync(join(thuMuc, f))).toString("utf8"));
      return Array.isArray(d) ? d : d.items;
    });
  return { manifest, items };
}

/** Bộ thay giá trị: cùng giá trị gốc → cùng giá trị giả (giữ quan hệ id giữa trang, giữa toà–tầng). */
function taoBoThay() {
  const bang = new Map();
  const goc = new Map();
  const dem = new Map();
  const thay = (khoa, v) => {
    const k = `${khoa}\u0000${v}`;
    if (!bang.has(k)) {
      const n = (dem.get(khoa) ?? 0) + 1;
      dem.set(khoa, n);
      const h = createHash("sha256").update(k).digest("hex").slice(0, 8);
      bang.set(k, /(^|_)id$|Id$/.test(khoa) ? `q${h}-0000-4000-8000-${String(n).padStart(12, "0")}` : `Q ${khoa} ${n}`);
    }
    if (typeof v === "string" && v.length >= 6) goc.set(v, khoa);
    return bang.get(k);
  };
  return { thay, goc };
}

function lamSach(v, khoa, boThay, dem) {
  if (khoa === "geolocation" && v && typeof v === "object") return { ...TOA_DO_GIA_LAP };
  if (khoa === "urls" && Array.isArray(v)) return v.map(() => `https://${MIEN_GIA_LAP}/anh-${++dem.anh}.jpg`);
  if (Array.isArray(v)) return v.map((x) => lamSach(x, khoa, boThay, dem));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, lamSach(x, k, boThay, dem)]));
  if (typeof v !== "string") return v;
  if (KHOA_GIU_GIA_TRI.has(khoa)) { dem.giu.add(v); return v; }
  if (/date|At$/.test(khoa) && !Number.isNaN(Date.parse(v))) return v; // mốc thời gian giữ nguyên
  return boThay.thay(khoa, v);
}

function lamSachItem(it, boThay, dem) {
  const meta = lamSach(it.meta ?? {}, "meta", boThay, dem);
  if (meta.duong !== undefined) meta.duong = "/gia-lap";
  const payload = lamSach(it.payload, "payload", boThay, dem);
  // căn cao tầng: name trùng code ở bản thật thì giữ trùng (chỉ name khác code mới thay)
  if (it.kind === "can-cao-tang") {
    payload.data = (payload.data ?? []).map((c, i) => (it.payload.data[i].name === it.payload.data[i].code ? { ...c, name: c.code } : c));
  }
  return { ...it, sourceId: lamSach(it.sourceId, "sourceId", boThay, dem), meta, payload };
}

function ghiBan(thuMucRa, ten, items, mau, ghiChu) {
  const dir = join(thuMucRa, ten);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const buf = gzipSync(Buffer.from(JSON.stringify(items)), { level: 9, mtime: 0 });
  writeFileSync(join(dir, "items-0001.json.gz"), buf);
  const manifest = {
    schemaVersion: 16,
    snapshotId: ten,
    city: "vn",
    source: "s09-danh-ba",
    startedAt: mau.startedAt,
    finishedAt: mau.finishedAt,
    counts: { items: items.length, failed: 0 },
    coverage: { notes: ghiChu },
    files: [{ name: "items-0001.json.gz", sha256: createHash("sha256").update(buf).digest("hex"), bytes: buf.length }],
  };
  writeFileSync(join(dir, "manifest.json"), `${JSON.stringify(manifest, null, 1)}\n`);
  return { ten, items: items.length };
}

/** Chọn căn phủ đủ khoá cấp một: tham lam theo số khoá mới, tối đa `tran` căn. */
function chonCanPhuKhoa(can, tran) {
  const daCo = new Set();
  const chon = [];
  const conLai = [...can];
  while (chon.length < tran && conLai.length) {
    conLai.sort((a, b) => Object.keys(b).filter((k) => !daCo.has(k)).length - Object.keys(a).filter((k) => !daCo.has(k)).length);
    const c = conLai.shift();
    if (chon.length >= 2 && !Object.keys(c).some((k) => !daCo.has(k))) break;
    chon.push(c);
    Object.keys(c).forEach((k) => daCo.add(k));
  }
  return chon;
}

export function kiemKe(cacBan) {
  const khoa = { "quy-can": new Set(), "can-cao-tang": new Set() };
  for (const { items } of cacBan) {
    for (const it of items) {
      if (!khoa[it.kind]) continue;
      for (const c of it.payload?.data ?? []) Object.keys(c).forEach((k) => khoa[it.kind].add(k));
    }
  }
  const ra = {};
  for (const [kind, s] of Object.entries(khoa)) {
    ra[kind] = Object.fromEntries([...s].sort().map((k) => [k, kind === "quy-can" && KHOA_BO.includes(k) ? "bo" : "giu"]));
  }
  return ra;
}

function main() {
  const tu = doi("--tu");
  const ra = doi("--ra") ?? "pipeline/tests/fixtures/s09-v16";
  const tepKiemKe = doi("--kiem-ke") ?? "pipeline/lib/s09-danh-ba-v16-khoa.json";
  if (!tu) {
    console.error("s09-v16-sinh-fixture: thiếu --tu <thư mục chờ>");
    process.exit(2);
  }
  const cacThuMuc = readdirSync(tu).filter((d) => d.startsWith("vn__s09-danh-ba__")).sort();
  const cacBan = cacThuMuc.map((d) => ({ ten: d, ...docBan(join(tu, d)) })).filter((b) => b.manifest.schemaVersion === 16);
  const banQuyCan = cacBan.filter((b) => b.items.some((i) => i.kind === "quy-can"));
  const banTang = cacBan.filter((b) => b.items.some((i) => i.kind === "can-cao-tang"));
  // Bản đủ = bản quỹ căn có trang 0; bản hỏng = bản quỹ căn không có trang 0 ở dự án có căn.
  const banDu = banQuyCan.find((b) => b.items.some((i) => i.meta?.trang === 0 && i.payload?.data?.length));
  const banHong = banQuyCan.find((b) => b !== banDu);
  if (!banDu || !banHong || !banTang.length) {
    console.error("s09-v16-sinh-fixture: thiếu bản đủ, bản hỏng hoặc bản căn cao tầng trong thư mục chờ");
    process.exit(1);
  }

  // (1) bảng kiểm kê từ MỌI căn của MỌI bản thật
  const bang = kiemKe(cacBan);
  writeFileSync(tepKiemKe, `${JSON.stringify(bang, null, 1)}\n`);

  const boThay = taoBoThay();
  const dem = { anh: 0, giu: new Set() };

  // (2) F-du: dự án nhiều trang phủ nhiều khoá nhất (cắt bớt căn, tongNguon khớp số căn giữ) + hai dự án một trang
  const theoDuAn = new Map();
  for (const it of banDu.items) (theoDuAn.get(it.meta.duAnId) ?? theoDuAn.set(it.meta.duAnId, []).get(it.meta.duAnId)).push(it);
  const soKhoa = (its) => new Set(its.flatMap((i) => (i.payload?.data ?? []).flatMap(Object.keys))).size;
  const duAnNhieuTrang = [...theoDuAn.values()].filter((its) => its.length > 1).sort((a, b) => soKhoa(b) - soKhoa(a))[0];
  const duAnMotTrang = [...theoDuAn.values()].filter((its) => its.length === 1 && its[0].payload?.data?.length)
    .sort((a, b) => soKhoa(b) - soKhoa(a)).slice(0, 2);
  const catDuAn = (its, tranMoiTrang) => {
    const trang = [...its].sort((a, b) => a.meta.trang - b.meta.trang).map((it) => ({ ...it, payload: { ...it.payload, data: chonCanPhuKhoa(it.payload.data, tranMoiTrang) } }));
    const tong = trang.reduce((n, it) => n + it.payload.data.length, 0);
    return trang.map((it) => ({ ...it, meta: { ...it.meta, soCanNhan: it.payload.data.length, tongNguon: tong }, payload: { ...it.payload, meta: { ...it.payload.meta, total: tong } } }));
  };
  const nhieu = catDuAn(duAnNhieuTrang, 3);
  const duItems = [...nhieu, ...duAnMotTrang.flatMap((its) => catDuAn(its, 2))].map((it) => lamSachItem(it, boThay, dem));
  // ca hỏng của AC-1: trang rỗng (dự án không căn), item lỗi (code ≠ 200), item thiếu sourceId
  const mauTrang = duItems[0];
  duItems.push(
    { ...mauTrang, sourceId: "q-du-an-rong", meta: { ...mauTrang.meta, duAnId: "q-du-an-rong", trang: 0, soCanNhan: 0, tongNguon: 0 }, payload: { data: [], meta: { ...mauTrang.payload.meta, page: 0, total: 0 } } },
    { ...mauTrang, sourceId: "q-du-an-loi", meta: { ...mauTrang.meta, duAnId: "q-du-an-loi", trang: 0, status: 500, soCanNhan: 0, tongNguon: 0, loi: { ma: "http-500" } }, payload: { data: [], meta: { code: 500, page: 0, size: 0, total: 0 } } },
    { ...mauTrang, sourceId: undefined },
  );

  // (3) F-hong: cùng dự án nhiều trang, chỉ các trang ≥ 1 của bản hỏng (không trang 0), cắt căn; + một trang rỗng
  const idNhieu = duAnNhieuTrang[0].meta.duAnId;
  const hongCuaDuAn = banHong.items.filter((i) => i.meta?.duAnId === idNhieu);
  const hongItems = (hongCuaDuAn.length ? hongCuaDuAn : banHong.items.filter((i) => i.payload?.data?.length).slice(0, 1))
    .map((it) => ({ ...it, payload: { ...it.payload, data: chonCanPhuKhoa(it.payload.data ?? [], 2) } }))
    .map((it) => lamSachItem(it, boThay, dem));
  const rongHong = banHong.items.find((i) => !(i.payload?.data?.length));
  if (rongHong) hongItems.push(lamSachItem(rongHong, boThay, dem));

  // (4) F-tang: một dự án, hai toà × ba tầng có căn; + tầng rỗng, tầng lỗi, một căn name ≠ code
  const tang = banTang[0].items.filter((i) => i.kind === "can-cao-tang");
  const coCan = tang.filter((i) => (i.payload?.code ?? 200) === 200 && i.payload?.data?.length);
  const duAnTang = coCan[0].meta.duAnId;
  const toa = [...new Set(coCan.filter((i) => i.meta.duAnId === duAnTang).map((i) => i.meta.toaId))].slice(0, 2);
  const tangItems = toa.flatMap((t) => coCan.filter((i) => i.meta.toaId === t).slice(0, 3))
    .map((it) => ({ ...it, payload: { ...it.payload, data: it.payload.data.slice(0, 4) } }));
  const mauTang = tangItems[0];
  tangItems.push(
    { ...mauTang, sourceId: "q-tang-rong", meta: { ...mauTang.meta, tangId: "q-tang-rong", soCan: 0 }, payload: { code: 200, data: [] } },
    { ...mauTang, sourceId: "q-tang-loi", meta: { ...mauTang.meta, tangId: "q-tang-loi", status: 500, soCan: 0, loi: { ma: "http-500" } }, payload: { code: 500, data: [] } },
  );
  if (!tangItems.some((i) => i.payload.data.some((c) => c.name !== c.code))) {
    const c = tangItems[0].payload.data[0];
    tangItems[0] = { ...tangItems[0], payload: { ...tangItems[0].payload, data: [{ ...c, name: `${c.code} (ten)` }, ...tangItems[0].payload.data.slice(1)] } };
  }
  const tangSach = tangItems.map((it) => lamSachItem(it, boThay, dem));

  const ketQua = [
    ghiBan(ra, "vn__s09-danh-ba__F-du", duItems, banDu.manifest, "DA56: khuôn bản đủ quỹ căn (dự án nhiều trang + hai dự án một trang, cắt căn) + trang rỗng, item lỗi, item thiếu sourceId; đã thay mọi chuỗi"),
    ghiBan(ra, "vn__s09-danh-ba__F-hong", hongItems, banHong.manifest, "DA56: khuôn bản hỏng quỹ căn (trang từ 1, không trang 0) + một trang rỗng; đã thay mọi chuỗi"),
    ghiBan(ra, "vn__s09-danh-ba__F-tang", tangSach, banTang[0].manifest, "DA56: khuôn căn cao tầng (hai toà × ba tầng) + tầng rỗng, tầng lỗi, căn name khác code; đã thay mọi chuỗi"),
  ];

  // (5) tự quét đầu ra: không chuỗi gốc dài, không http ngoài tên miền giả lập
  let lo = 0;
  for (const { ten } of ketQua) {
    const t = gunzipSync(readFileSync(join(ra, ten, "items-0001.json.gz"))).toString("utf8");
    const http = (t.match(/https?:\/\/[^"]*/g) ?? []).filter((u) => !u.startsWith(`https://${MIEN_GIA_LAP}/`)).length;
    let goc = 0;
    const khoaCon = new Set();
    for (const [s, k] of boThay.goc) if (!dem.giu.has(s) && t.includes(JSON.stringify(s))) { goc++; khoaCon.add(k); }
    if (goc) console.log(`  chuỗi gốc còn ở khoá: ${[...khoaCon].join(", ")}`);
    lo += http + goc;
    console.log(`${ten}: ${JSON.parse(t).length} item · http lạ ${http} · chuỗi gốc còn ${goc}`);
  }
  console.log(`kiểm kê: quy-can ${Object.keys(bang["quy-can"]).length} khoá · can-cao-tang ${Object.keys(bang["can-cao-tang"]).length} khoá`);
  if (lo) process.exit(1);
}

main();
