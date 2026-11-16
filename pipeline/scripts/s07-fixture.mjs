// s07-fixture.mjs — Fixture dùng chung cho hai tệp test của bộ nạp S07 (DATA-CONTRACT v9 mục S07, bảng 093). HTML dưới đây là GIẢ — dựng theo khuôn lớp CSS của trang thật, tên dự
// án, địa chỉ, chủ đầu tư bịa; tên miền là miền thử `nguon-thu.test`, không phải miền của nguồn.
export const MIEN = "nguon-thu.test";
export const W = `https://${MIEN}`;
export const ANH = `https://tep9.${MIEN}`;

// oKhongNhan: thay hẳn khối cấu hình bằng các ô không aria-label theo thứ tự cho sẵn (raw thật có ba dạng: «N ha», «N m²», «N triệu/m²»).
const khoiKhongNhan = (o) => o.map((v) => `<span class="re__prj-card-config-value">${v}</span>`).join(`<span class="re__prj-card-config-dot">·</span>`);
export const theChinh = ({ id, duong = `/du-an-can-ho-chung-cu-quan-a/du-an-mot-pj${id}`, ten = "Dự án Một", cauHinh = true, cdt = true, oKhongNhan = null }) => oKhongNhan
  ? theChinh({ id, duong, ten, cauHinh: false, cdt }).replace(`<div class="re__prj-card-config re__clearfix">`, `<div class="re__prj-card-config re__clearfix">${khoiKhongNhan(oKhongNhan)}`)
  : `
<div class="js__project-card js__card-project-web re__prj-card-full">
 <a href="${duong}" title="${ten}" class="re__clearfix" tracking-id="project-card-plp">
  <div class="re__prj-card-image"><img alt="${ten}" class="lazyload" data-src="${ANH}/crop/240x180/2026/01/02/a-1_wm.jpg"><img class="lazyload" data-src="${ANH}/crop/240x180/2026/01/02/a-2_wm.jpg">
   <div class="re__prj-card-image-feature"><i class="re__icon-image"></i><span>9</span></div></div>
  <div class="re__prj-card-info"><div class="re__prj-card-info-content">
   <div class="re__project-open re__prj-tag-info"> <label>Đang mở bán</label> </div>
   <h3 class="re__prj-card-title"> ${ten} </h3>
   <div class="re__prj-card-config re__clearfix">${cauHinh ? `
    <span class="re__prj-card-config-value">11,93 ha</span><span class="re__prj-card-config-dot">·</span>
    <span class="re__prj-card-config-value" aria-label="1.314 căn hộ" role="tooltip"><span>1.314</span><i class="re__icon-home--sm"></i></span><span class="re__prj-card-config-dot">·</span>
    <span class="re__prj-card-config-value" aria-label="2 tòa nhà" role="tooltip"><span>2</span><i class="re__icon-building--sm"></i></span>` : ""}
   </div>
   <div class="re__prj-card-location" title="Đường Số Một, Phường A &amp; B, Hà Nội"> Đường Số Một, Phường A &amp; B, Hà Nội </div>
   <div class="re__prj-card-summary"> ${ten} là dự án thử, xem thêm tại ${MIEN}. </div>
   <div class="re__prj-card-contact re__clearfix re__full-width">${cdt ? `
    <div class="re__prj-card-contact-avatar" aria-label="Công ty Thử Nghiệm" role="tooltip"><img src="${ANH}/images/avatar/x.png"><span> Công ty Thử Nghiệm </span></div>` : ""}
   </div>
  </div></div>
 </a>
</div>`;
export const trangDanhSach = (the) => `<div class="re__main">
 <div class="re__prj-hightlight"><div class="swiper-container js__swiper-project">
  <div class="swiper-slide"><a href="/du-an-khu-do-thi-moi-tinh-x-tx/noi-bat-pj9001" title="Nổi bật"><img data-src="${ANH}/crop/1.jpg"></a></div>
 </div></div>
 <div class="re__prj-list-full">${the.join("")}</div>
 <div class="re__pagination-group"><a class="re__pagination-number" pid="2" href="/du-an-bat-dong-san/p2">2</a></div>
</div>`;
export const itemDanhSach = (trang, the, meta = {}) => ({
  source: "s07-danh-muc", sourceId: `list-p${trang}`, kind: "project_list_page", fetchedAt: "2026-11-11T02:00:00.000Z",
  payload: { listHtml: trangDanhSach(the) },
  meta: { request: { path: `/du-an-bat-dong-san/p${trang}`, page: trang }, sessionLoggedIn: false, httpStatus: 200, soThe: the.length + 1, ...meta },
});

export const trangDuAn = ({ id, lat = "21.0024", lng = "105.9641" }) => ({
  mainHtml: `<div class="re__main"><div class="project-main-info">
 <div class="re__project-heading"><h1 class="re__project-name">Khu đô thị Thử &amp; Nghiệm</h1>
  <div class="re__project-address">Đường Số Hai, Xã Thử, Hà Nội. <a href="#tab-location" class="js__project-tab">Xem bản đồ</a></div></div>
 <div class="re__project-album-container" id="tab-img"><div class="re__project-album" id="project-photos">
  <div class="js__project-media re__project-album__media" href="${ANH}/2026/01/02/lon-1_wm.jpg"><img src="${ANH}/crop/609x360/2026/01/02/lon-1_wm.jpg"></div>
  <div class="js__project-media re__project-album__media" href="${ANH}/2026/01/02/lon-2_wm.jpg"></div></div></div>
 <div class="re__prj-tag-info re__project-na"> <label>Đang cập nhật</label> <span>Khởi công ngày 16/9/2026</span> </div>
 <div class="js__project-attr-box re__project-attr-box"><table><tbody class="re__project-attr"><tr>
  <td class="re__attr-item-label" itemprop="name"><h4>Diện tích</h4></td> <td class="re__attr-item-value" itemprop="value">420 ha</td></tr></tbody></table></div>
 <div class="re__project-main-content"><div class="js__prj-detail-content re__detail-content re__project-editor"><p>Dự án gồm <a href="${W}/du-an-can-ho-chung-cu-quan-a/phan-khu-mot-pj7001"><strong>Phân khu Một</strong></a>
  và <a href="/du-an-can-ho-chung-cu-quan_1-a/phan-khu-hai-pj7002">Phân khu Hai</a>, xem <a href="${W}/du-an-khu-do-thi-moi-quan-a/khu-do-thi-thu-pj${id}">trang này</a>.</p>
  <div class="hop"><div>Toà T1, T2</div></div><figure><img src="${ANH}/2026/01/02/mb.jpg"></figure></div>
 <div class="js__project-box-info re__project-box-info"><div class="re__project-box-wrap">
  <div class="re__project-box-item"> <label>Giá</label> <span>10,5 - 33 triệu/m²</span> </div>
  <div class="re__project-box-item"> <label>Diện tích</label> <span>420 ha</span> </div>
  <div class="re__project-box-item"> <label>Số căn hộ</label> <span>1.155 căn</span> </div>
  <div class="re__project-box-item"> <label>Số tòa</label> <span>66 tòa</span> </div>
  <div class="re__project-box-item"> <label>Chủ đầu tư</label> <span> <a class="re__link-pr" href="${W}/dau-tu-du-an/cong-ty-thu-ep1876"> Công ty Thử </a> </span> </div>
  <div class="re__project-box-item"> <label>Pháp lý</label> <span>Sở hữu lâu dài</span> </div>
  <div class="re__project-box-item"> <label>Quy mô</label> <span>2.300 căn, 66 tòa</span> </div></div></div>
 <div class="re__project-toogle re__prj-facilities"><div class="js__toogle-label">Tiện ích</div><div class="js__toogle-detail"><ul><li><span class="baidoxe"></span>Bãi đỗ xe</li><li><span></span>Hồ bơi</li></ul></div></div>
 </div></div>
 <div class="re__project-related" id="tab-other"><div class="re__project-related-container"><h2>Dự án liên quan</h2>
  <div class="re__prj-card-compact"><a title="Khác" href="/du-an-can-ho-chung-cu-quan-b/du-an-khac-pj8001"><img data-src="${ANH}/crop/k.jpg"></a></div></div></div>
</div>`,
  canonical: `${W}/du-an-khu-do-thi-moi-quan-a/khu-do-thi-thu-pj${id}`,
  title: "Dự án Khu đô thị Thử", description: "Thông tin dự án thử", ogImage: `${ANH}/2026/01/02/lon-1_wm.jpg`,
  ldJson: [
    JSON.stringify({ "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Trang chủ", item: W }, { "@type": "ListItem", position: 2, name: "Hà Nội", item: `${W}/du-an-khu-do-thi-moi-ha-noi` }] }),
    JSON.stringify({ "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Giá bán?", acceptedAnswer: { "@type": "Answer", text: `<p>Xem tại <a href="${W}/x">${MIEN}</a></p>` } }] }),
    "{hỏng",
  ],
  paramsScript: `var paramsMap = { mapId: "project-map", latitude: ${lat}, longitude: ${lng}, title: "x", serverResource: "${ANH}", legacyId: ${id} };`,
});
export const itemDuAn = (id, opt = {}, meta = {}) => ({
  source: "s07-danh-muc", sourceId: `pj${id}`, kind: "project_catalog", fetchedAt: "2026-11-11T02:05:00.000Z",
  payload: trangDuAn({ id, ...opt }),
  meta: { pjId: id, path: `/du-an-khu-do-thi-moi-quan-a/khu-do-thi-thu-pj${id}`, finalPath: `/du-an-khu-do-thi-moi-quan-a/khu-do-thi-thu-pj${id}`,
    loaiHinh: "khu", sessionLoggedIn: false, httpStatus: 200, bytesFull: 1000, mainBytes: 500, children: [], ...meta },
});
export const itemSitemap = (meta = {}) => ({
  source: "s07-danh-muc", sourceId: "sitemap-nha-o-xa-hoi", kind: "project_sitemap", fetchedAt: "2026-11-10T23:25:00.000Z",
  payload: { xml: `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${W}/du-an-nha-o-xa-hoi</loc></url>
<url><loc>${W}/du-an-nha-o-xa-hoi/gia-duoi-5-trieu-m2</loc></url><url><loc>${W}/du-an-nha-o-xa-hoi-quan-a/noxh-mot-pj101</loc></url>
<url><loc>${W}/du-an-nha-o-xa-hoi-thi-xa_1-tx/noxh-hai-pj102</loc></url><url><loc>${W}/du-an-nha-o-xa-hoi-quan-a/noxh-mot-pj101</loc></url></urlset>` },
  meta: { request: { path: "/sitemap/projects-du-an-nha-o-xa-hoi.xml" }, loaiHinh: "nha-o-xa-hoi", soUrl: 5, ...meta },
});
