// s07-danh-muc.mjs — bóc raw S07 (nguồn `s07-danh-muc`, DATA-CONTRACT v9) thành dòng `stg_s07_*` (migration 093).
// Làn thu (phiên thu thay ZCode, 11/11). Hàm thuần, không DB, không mạng. Hợp đồng: collector/docs/DATA-CONTRACT.md mục S07.
//
// Ba kind: `project_list_page` (thẻ dự án trên trang danh sách) · `project_catalog` (trang một dự án) ·
// `project_sitemap` (danh sách đường dẫn dự án theo loại hình). Payload là HTML/XML nguyên văn nên có TÊN MIỀN của
// nguồn (tầng A): mọi chuỗi ra khỏi tệp này đã đi qua `boMien()` — link trang thành đường dẫn tương đối, link ảnh
// thành `s07://<máy con>/<đường dẫn>`, tên miền đứng trần trong chữ thành «S07». Tên miền KHÔNG nằm trong mã: suy từ
// chính item (`payload.canonical`, hoặc hậu tố chung của các link trong HTML), hay truyền vào qua tham số.

/** 12 loại hình của nguồn — đoạn đầu đường dẫn là `du-an-<loại hình>[-<khu vực>]`. Dài trước để khớp đúng. */
export const LOAI_HINH_S07 = [
  "khu-nghi-duong-sinh-thai", "trung-tam-thuong-mai", "cao-oc-van-phong", "can-ho-chung-cu", "biet-thu-lien-ke",
  "khu-cong-nghiep", "khu-do-thi-moi", "khu-phuc-hop", "nha-o-xa-hoi", "nha-mat-pho", "shophouse", "khac",
];
export const NGUON_S07 = "s07-danh-muc";

/** `/du-an-<loại hình>-<khu vực>/<slug>-pj<id>` → { pjId, projectTypeSlug, areaSlug }; không phải trang dự án → null. */
export function tachDuongDan(path) {
  const m = String(path ?? "").match(/^\/du-an-([a-z0-9_-]+)\/[^/?#]*-pj(\d+)$/);
  if (!m) return null;
  const loai = LOAI_HINH_S07.find((l) => m[1] === l || m[1].startsWith(l + "-")) ?? null;
  const khu = loai == null ? m[1] : m[1] === loai ? null : m[1].slice(loai.length + 1);
  return { pjId: Number(m[2]), projectTypeSlug: loai, areaSlug: khu };
}

const RE_URL = /https?:\/\/([a-z0-9.-]+)/gi;

/** Tên miền của nguồn suy từ item: host của `payload.canonical` (bỏ `www.`); không có thì hậu tố chung ngắn nhất
 *  (≥ 2 nhãn, không phải đuôi công cộng) của đa số host xuất hiện trong HTML. Không suy được → null. */
export function mienCua(item) {
  const can = item?.payload?.canonical;
  if (typeof can === "string") {
    const m = can.match(/^https?:\/\/([a-z0-9.-]+)/i);
    if (m) return m[1].toLowerCase().replace(/^www\./, "");
  }
  const html = item?.payload?.listHtml ?? item?.payload?.mainHtml ?? item?.payload?.xml ?? "";
  const dem = new Map();
  for (const m of String(html).matchAll(RE_URL)) {
    const nhan = m[1].toLowerCase().split(".");
    for (let i = 0; i <= nhan.length - 2; i++) {
      const hau = nhan.slice(i).join(".");
      dem.set(hau, (dem.get(hau) ?? 0) + 1);
    }
  }
  // đuôi công cộng hai nhãn («com.vn», «co.uk»…) không phải tên miền của ai — không chọn
  let chon = null, n = 0;
  for (const [hau, c] of dem) {
    if (/^(com|net|org|edu|gov|co|info|biz)\.[a-z]{2,3}$/.test(hau)) continue;
    // cùng số đếm thì lấy hậu tố NGẮN nhất: «tep.abc.vn» và «abc.vn» đếm bằng nhau khi trang chỉ dùng một máy con
    if (c > n || (c === n && hau.length < (chon?.length ?? Infinity))) { chon = hau; n = c; }
  }
  return chon ? chon.replace(/^www\./, "") : null;
}

const thoat = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Bỏ tên miền nguồn khỏi một chuỗi: link trang → tương đối; link máy con (ảnh, tệp tĩnh) → `s07://<máy con>/…`;
 *  tên miền đứng trần → «S07». `mien` null → trả nguyên (bên gọi tự chịu). */
export function boMien(s, mien) {
  if (s == null || !mien) return s ?? null;
  const d = thoat(mien);
  return String(s)
    .replace(new RegExp(`https?://(?:www\\.)?${d}(?=[/"'\\s<)]|$)`, "gi"), "")
    .replace(new RegExp(`https?://([a-z0-9-]+(?:\\.[a-z0-9-]+)*)\\.${d}(?=[/"'\\s<)]|$)`, "gi"), "s07://$1")
    .replace(new RegExp(`(?:[a-z0-9-]+\\.)*${d}`, "gi"), "S07");
}

const THUC_THE = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
/** Giải thực thể HTML thường gặp. */
export function giaiThucThe(s) {
  return String(s ?? "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-z]+);/gi, (m, k) => THUC_THE[k.toLowerCase()] ?? m);
}
/** HTML → chữ: bỏ thẻ, giải thực thể, gộp khoảng trắng; rỗng → null. */
export function chu(html) {
  if (html == null) return null;
  const t = giaiThucThe(String(html).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  return t === "" ? null : t;
}
/** «1.155», «2.300 căn» → 1155, 2300 (số nguyên kiểu VN, dấu chấm nhóm nghìn); có phần lẻ hay không phải số → null. */
export function soNguyenVn(s) {
  const m = String(s ?? "").trim().match(/^(\d{1,3}(?:\.\d{3})+|\d+)(?![\d,])/);
  return m ? Number(m[1].replace(/\./g, "")) : null;
}

/** Nội dung bên trong thẻ `<div …>` mở tại `tu` (chỉ số của dấu `<`), đếm lồng nhau; không khép → tới hết chuỗi. */
export function trongDiv(html, tu) {
  const mo = html.indexOf(">", tu);
  if (tu < 0 || mo < 0) return null;
  const re = /<(\/?)div\b[^>]*>/gi;
  re.lastIndex = mo + 1;
  let sau = 1, m;
  while ((m = re.exec(html))) {
    sau += m[1] ? -1 : 1;
    if (sau === 0) return html.slice(mo + 1, m.index);
  }
  return html.slice(mo + 1);
}
/** Nội dung khối `<div class="… <lop> …">` đầu tiên; không có → null. */
export function khoiLop(html, lop) {
  const m = new RegExp(`<div\\b[^>]*class="[^"]*\\b${thoat(lop)}\\b[^"]*"[^>]*>`, "i").exec(html);
  return m ? trongDiv(html, m.index) : null;
}
const pjTrong = (html, tru) => {
  const out = [];
  for (const m of String(html ?? "").matchAll(/href="[^"]*?\/du-an-[a-z0-9_-]+\/[^"/?#]*-pj(\d+)(?=["?#])/g)) {
    const id = Number(m[1]);
    if (id !== tru && !out.includes(id)) out.push(id);
  }
  return out;
};

/**
 * Bóc thẻ dự án của một item `project_list_page`. Chỉ thẻ chính (`js__project-card`, 10 thẻ/trang); khối «nổi bật»
 * lặp ở mọi trang không tính.
 * @returns {{ the: object[], khongMa: number }}
 */
export function bocTheDanhSach(item, mien = mienCua(item)) {
  const html = String(item?.payload?.listHtml ?? "");
  const trang = Number(item?.meta?.request?.page);
  const the = [];
  let khongMa = 0;
  const khoi = html.split(/<div class="js__project-card\b/).slice(1);
  khoi.forEach((k, i) => {
    const a = k.match(/<a\b[^>]*href="([^"]+)"[^>]*>/);
    const path = a ? boMien(giaiThucThe(a[1]), mien).split(/[?#]/)[0] : null;
    const t = path ? tachDuongDan(path) : null;
    if (!t) { khongMa++; return; }
    const cauHinh = khoiLop(k, "re__prj-card-config") ?? "";
    let dienTich = null, soCan = null, soToa = null;
    for (const m of cauHinh.matchAll(/<span class="re__prj-card-config-value"([^>]*)>([^<]*)/g)) {
      const nhan = giaiThucThe((m[1].match(/aria-label="([^"]*)"/) || [])[1] ?? "");
      if (/căn/i.test(nhan)) soCan = soNguyenVn(nhan);
      else if (/tòa|toà/i.test(nhan)) soToa = soNguyenVn(nhan);
      else if (!nhan && dienTich == null) dienTich = chu(m[2]);
    }
    const anhKhoi = k.slice(0, Math.max(0, k.indexOf("re__prj-card-info")));
    the.push({
      pj_id: t.pjId,
      list_page: Number.isFinite(trang) ? trang : null,
      list_position: i + 1,
      path,
      project_type_slug: t.projectTypeSlug,
      area_slug: t.areaSlug,
      project_name: chu((k.match(/re__prj-card-title">([\s\S]*?)<\/h3>/) || [])[1]) ?? chu((a[0].match(/title="([^"]*)"/) || [])[1]),
      development_status_raw: chu((k.match(/re__prj-tag-info[^"]*">\s*<label>([^<]*)<\/label>/) || [])[1]),
      unparsed_address: boMien(chu((k.match(/re__prj-card-location"[^>]*title="([^"]*)"/) || [])[1]), mien),
      land_area_raw: dienTich,
      number_of_units_total: soCan,
      number_of_buildings_total: soToa,
      builder_name_raw: boMien(chu((k.match(/re__prj-card-contact-avatar[^>]*aria-label="([^"]*)"/) || [])[1]), mien),
      summary_raw: boMien(chu((k.match(/re__prj-card-summary">([\s\S]*?)<\/div>/) || [])[1]), mien),
      image_paths: [...anhKhoi.matchAll(/data-src="([^"]+)"/g)].map((m) => boMien(giaiThucThe(m[1]), mien)),
    });
  });
  return { the, khongMa };
}

function jsonLd(item, loai) {
  for (const s of item?.payload?.ldJson ?? []) {
    try { const j = JSON.parse(s); if (j?.["@type"] === loai) return j; } catch { /* JSON-LD hỏng: bỏ qua */ }
  }
  return null;
}

/**
 * Bóc một item `project_catalog` thành một dòng `stg_s07_project`.
 * @returns {object|null} null khi item không có `mainHtml` hoặc không tách được mã dự án.
 */
export function bocDuAn(item, mien = mienCua(item)) {
  const html = item?.payload?.mainHtml;
  const path = item?.meta?.path;
  const t = tachDuongDan(path);
  if (typeof html !== "string" || !t) return null;
  const bo = (s) => boMien(s, mien);

  // thuộc tính: khối hộp (đủ nhất) rồi tới bảng tổng quan; mảng cặp {label, value} giữ thứ tự nguồn
  const capThuocTinh = [];
  const thuocTinh = {};
  const themCap = (nhan, giaTri) => {
    const k = chu(nhan);
    if (!k || k in thuocTinh) return;
    thuocTinh[k] = bo(chu(giaTri));
    capThuocTinh.push({ label: k, value: thuocTinh[k] });
  };
  for (const m of html.matchAll(/re__project-box-item">\s*<label>([^<]*)<\/label>\s*<span>([\s\S]*?)<\/span>\s*<\/div>/g)) themCap(m[1], m[2]);
  for (const m of html.matchAll(/re__attr-item-label"[^>]*>\s*<h4>([^<]*)<\/h4>\s*<\/td>\s*<td class="re__attr-item-value"[^>]*>([\s\S]*?)<\/td>/g)) themCap(m[1], m[2]);
  const cdt = html.match(/href="([^"]*-ep(\d+))"/);
  const nhan = html.match(/<div class="re__prj-tag-info[^"]*">([\s\S]*?)<\/div>/);
  const trangThai = nhan ? chu((nhan[1].match(/<label>([\s\S]*?)<\/label>/) || [])[1]) : null;
  const ghiChuTrangThai = nhan ? chu(nhan[1].replace(/<label>[\s\S]*?<\/label>/, "")) : null;

  const moTaMo = /<div\b[^>]*class="[^"]*\bre__project-editor\b[^"]*"[^>]*>/i.exec(html);
  const moTa = moTaMo ? trongDiv(html, moTaMo.index) : null;
  const tienIch = khoiLop(html, "re__prj-facilities");
  const lienQuan = khoiLop(html, "re__project-related");

  const ps = String(item?.payload?.paramsScript ?? "");
  const so = (re) => { const m = ps.match(re); const v = m ? Number(m[1]) : NaN; return Number.isFinite(v) ? v : null; };
  let lat = so(/\blatitude:\s*(-?\d+(?:\.\d+)?)/), lng = so(/\blongitude:\s*(-?\d+(?:\.\d+)?)/);
  if (lat === 0 && lng === 0) { lat = null; lng = null; } // nguồn để 0,0 khi chưa có toạ độ

  const bc = jsonLd(item, "BreadcrumbList");
  const faq = jsonLd(item, "FAQPage");
  return {
    pj_id: t.pjId,
    path,
    final_path: item?.meta?.finalPath && item.meta.finalPath !== path ? bo(item.meta.finalPath) : null,
    project_type_slug: t.projectTypeSlug,
    area_slug: t.areaSlug,
    project_name: chu((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1]),
    unparsed_address: bo(chu((html.match(/re__project-address">([\s\S]*?)(?:<a\b|<\/div>)/) || [])[1])),
    breadcrumb: (bc?.itemListElement ?? []).map((e) => ({ position: e.position, name: bo(e.name), path: bo(e.item) || "/" })),
    latitude: lat,
    longitude: lng,
    development_status_raw: trangThai,
    status_note_raw: bo(ghiChuTrangThai),
    attributes: capThuocTinh,
    land_area_raw: thuocTinh["Diện tích"] ?? null,
    number_of_units_raw: thuocTinh["Số căn hộ"] ?? thuocTinh["Số căn"] ?? null,
    number_of_buildings_total_raw: thuocTinh["Số tòa"] ?? thuocTinh["Số toà"] ?? null,
    builder_name_raw: thuocTinh["Chủ đầu tư"] ?? null,
    builder_ref: cdt ? Number(cdt[2]) : null,
    builder_path: cdt ? bo(giaiThucThe(cdt[1])) : null,
    legal_raw: thuocTinh["Pháp lý"] ?? null,
    scale_raw: thuocTinh["Quy mô"] ?? null,
    price_range_raw: thuocTinh["Giá"] ?? null, // chỉ dùng nội bộ (ROADMAP §3 mục 27)
    amenities: tienIch ? [...tienIch.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => chu(m[1])).filter(Boolean) : [],
    description_html: moTa == null ? null : bo(moTa.trim()),
    faq: (faq?.mainEntity ?? []).map((e) => ({ q: bo(chu(e?.name)), a: bo(chu(e?.acceptedAnswer?.text)) })),
    child_pj_ids: (item?.meta?.children ?? []).map((p) => tachDuongDan(p)?.pjId).filter((x) => x != null && x !== t.pjId),
    desc_link_pj_ids: pjTrong(moTa, t.pjId),
    related_pj_ids: pjTrong(lienQuan, t.pjId),
    image_paths: [...html.matchAll(/class="[^"]*\bjs__project-media\b[^"]*"[^>]*href="([^"]+)"/g)].map((m) => bo(giaiThucThe(m[1]))),
    og_image_path: bo(item?.payload?.ogImage ?? null),
    http_status: item?.meta?.httpStatus ?? null,
  };
}

/**
 * Bóc một item `project_sitemap` thành các đường dẫn DỰ ÁN (bỏ trang lọc theo giá, theo tỉnh và tệp chỉ mục).
 * @returns {{ duAn: object[], khac: number, lap: number }} khac = <loc> không phải trang dự án; lap = dự án lặp trong item
 */
export function bocSitemap(item, mien = mienCua(item)) {
  const duAn = [];
  let khac = 0, lap = 0;
  const thay = new Set();
  for (const m of String(item?.payload?.xml ?? "").matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const path = boMien(giaiThucThe(m[1].trim()), mien);
    const t = tachDuongDan(path);
    if (!t) { khac++; continue; }
    if (thay.has(t.pjId)) { lap++; continue; }
    thay.add(t.pjId);
    duAn.push({ pj_id: t.pjId, path, project_type_slug: t.projectTypeSlug, area_slug: t.areaSlug });
  }
  return { duAn, khac, lap };
}

/** Item thu trong phiên đã đăng nhập không được nạp (DATA-CONTRACT S07: `meta.sessionLoggedIn` phải là false).
 *  Trang danh sách và trang dự án THIẾU cờ cũng không nạp (Hỏi-1, Mạnh duyệt 11/11). Sitemap lượt đầu (10/11) không ghi
 *  cờ này — sitemap là tệp công khai, nhận cả khi thiếu cờ. */
export function laPhienKhach(item) {
  const c = item?.meta?.sessionLoggedIn;
  return c === false || (c === undefined && item?.kind === "project_sitemap");
}
