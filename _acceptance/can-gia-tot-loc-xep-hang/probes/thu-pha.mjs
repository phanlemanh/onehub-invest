// Bảng thử phá của CG3: trên một worktree tạm ở đúng HEAD, sửa MỘT chỗ mã sản phẩm, chạy lệnh chấm của tiêu chí, ghi ca đỏ và mã thoát, trả lại mã.
// Đột biến chỉ tính là bắt được khi lệnh thoát khác 0 VÀ thông điệp đỏ đúng lời hứa; đỏ vì lý do khác thì dòng ghi HỎNG.
// Dùng: node _acceptance/can-gia-tot-loc-xep-hang/probes/thu-pha.mjs [--write] [--chi AC-3]
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HO_SO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GOC = resolve(HO_SO, "../..");
const REL = "_acceptance/can-gia-tot-loc-xep-hang";
const CHI_TIET = "app/src/lib/deals-chi-tiet.ts", DEALS = "app/src/lib/deals.ts", TRANG = "app/src/app/ops/deals/page.tsx", MOT = "app/src/app/ops/deals/[offerId]/page.tsx";
const LUOI = "app/src/components/ops/deals-grid.tsx", O = "app/src/components/ops/deals-cells.tsx";
const SAU_TRANG = "async function DealsTrangContent";
const LOC_VAI = "dealHang(dealTheoVai(d, { lienHe: xemNoiDung, noiDung: xemNoiDung }), { xemNoiDung, mayThu })";
const DEM_TAB = "for (const { tab } of theoTab) dem[tab] += 1;";

// [tiêu chí, việc đột biến làm hỏng, tệp, đoạn gốc, đoạn thay, thông điệp phải đỏ, (tuỳ chọn) chỉ tìm đoạn gốc sau mốc này]
const DOT_BIEN = [
  ["AC-1", "bỏ ưu tiên cấp dự án", DEALS, "ORDER BY g.suspect, (g.cap = 'du_an') DESC, g.hang_pct", "ORDER BY g.suspect, g.hang_pct", /CG3-AC-1 sai thứ tự/],
  ["AC-1", "đảo chiều hạng phần trăm", DEALS, "(g.cap = 'du_an') DESC, g.hang_pct ASC NULLS LAST", "(g.cap = 'du_an') DESC, g.hang_pct DESC NULLS LAST", /CG3-AC-1 sai thứ tự/],
  ["AC-2", "dòng không có lý do vẫn in chữ lý do", O, `{lyDo && <span className="text-muted-foreground max-w-full truncate text-xs" title={lyDo} data-deal-ly-do={r.reason}>{lyDo}</span>}`, `<span className="text-muted-foreground max-w-full truncate text-xs">{lyDo ?? "Chưa chấm được hạng giá"}</span>`, /CG3-AC-2 dòng không có lý do lùi cấp/],
  ["AC-2", "bỏ số căn trong nhóm", O, "{r.n !== null && <span className=\"shrink-0\">· {fmtInt(r.n)} căn</span>}", "", /CG3-AC-2 dòng không có lý do lùi cấp/],
  ["AC-3", "mọi căn thường vào Đủ để gọi", DEALS, DEM_TAB, `for (const { tab } of theoTab) dem[tab === "thieu" ? "du" : tab] += 1;`, /CG3-AC-3 tab du lệch số/],
  ["AC-3", "mọi căn thường vào Còn thiếu", DEALS, DEM_TAB, `for (const { tab } of theoTab) dem[tab === "du" ? "thieu" : tab] += 1;`, /CG3-AC-3 tab du lệch số/],
  ["AC-3", "đếm trong trang thay vì toàn tập", DEALS, DEM_TAB, "for (const { tab } of theoTab.slice(0, thamSo.size)) dem[tab] += 1;", /CG3-AC-3 tab (du|xac-minh|thieu) lệch số/],
  ["AC-3", "xếp tab theo vai không xem nội dung", DEALS, "}, { xemNoiDung: true, mayThu }),", "}, { xemNoiDung: false, mayThu }),", /CG3-AC-3 tab (du|thieu) lệch số/],
  ["AC-3", "ô Tình trạng ghi sai tab", LUOI, `: "Còn thiếu"}</Badge>`, `: "Sai tab"}</Badge>`, /CG3-AC-3 vai Người xem tab thieu: ô Tình trạng ghi sai/],
  ["AC-4", "lọc tab sau khi đã cắt trang", DEALS, "const cua = chon.slice((page - 1) * thamSo.size, page * thamSo.size);", "const cua = nhe.slice((page - 1) * thamSo.size, page * thamSo.size).filter((r) => chon.includes(r));", /CG3-AC-4 tab (du|xac-minh|thieu): /],
  ["AC-4", "bản cloud vẫn đọc bảng ảnh", DEALS, 'const coAnh = cloud ? "false" : `EXISTS', "const coAnh = `EXISTS", /media/],
  ["AC-5", "căn gắn thẳng tỉnh thuộc mọi phường", DEALS, "d.area_id = $4 OR d.cha = $4", "d.area_id = $4 OR d.cha = $4 OR d.cha IS NULL", /CG3-AC-5 .+: sai tập căn/],
  ["AC-5", "bỏ lọc dự án", DEALS, "AND ($5::text IS NULL OR (d.cap = 'du_an' AND d.nut = $5))", "AND ($5::text IS NULL OR $5::text IS NOT NULL)", /CG3-AC-5 .+: sai tập căn/],
  ["AC-6", "bỏ điều kiện bán hay thuê", DEALS, "WHERE h.kind = $1 AND h.nhan IS NOT NULL\n         AND o.last_seen", "WHERE $1::text IS NOT NULL AND h.nhan IS NOT NULL\n         AND o.last_seen", /CG3-AC-6 mặc định phải là tin bán/],
  ["AC-6", "lọc loại hình mất tác dụng với tin thuê", DEALS, "AND h.duoi_trung_vi_pct <= ${NGUONG_LOAI_PCT}\n         AND ($3::text IS NULL OR o.property_type = $3)", "AND h.duoi_trung_vi_pct <= ${NGUONG_LOAI_PCT}\n         AND ($3::text IS NULL OR h.kind <> 'sale' OR o.property_type = $3)", /CG3-AC-6 ô rent × (apartment|house) × .+ sai tập/],
  ["AC-7", "mất khung tải", TRANG, "<Suspense fallback={<DealsSkeleton />}>", "<Suspense fallback={null}>", /CG3-AC-7 trang phải hiện khung tải/],
  ["AC-7", "đổi lọc khi lỗi không làm gì", LUOI, "di = (url) => window.location.assign(url)", "di = () => {}", /CG3-AC-7 đổi Cho thuê khi lỗi phải tải lại trang/],
  ["AC-7", "mất thanh lọc khi lỗi", TRANG, "leading={duAnLa ? undefined : <DealsBoLocKhiLoi thamSo={thamSo} />}", "leading={undefined}", /CG3-AC-7 ca lỗi mất thanh lọc|Cannot read properties of undefined/],
  ["AC-8", "trang gửi đủ liên hệ cho vai Người xem", TRANG, LOC_VAI, "dealHang(d, { xemNoiDung: true, mayThu })", /CG3-AC-8 vai Người xem lộ/, SAU_TRANG],
  ["AC-8", "bỏ bước che liên hệ trong thư viện", DEALS, "const lienHe = vai.lienHe ? {} :", "const lienHe = vai ? {} :", /CG3-AC-8 vai Người xem lộ/],
  ["AC-8", "trang một căn gửi đủ liên hệ", MOT, "dealHang(dealTheoVai(deal, { lienHe: xemNoiDung, noiDung: xemNoiDung }), { xemNoiDung, mayThu })", "dealHang(deal, { xemNoiDung: true, mayThu })", /CG3-AC-8 mở căn ngoài trang lộ/],
  ["AC-8", "đảo điều kiện lời báo cloud", TRANG, "{!mayThu && (", "{mayThu && (", /CG3-AC-8 (máy thu không được báo|lược đồ cloud phải báo)/, SAU_TRANG],
  ["AC-9", "đầu trang còn chữ thước phường", TRANG, "Căn rẻ hơn trung vị của nhóm so sánh, căn cấp dự án đứng đầu.", "Căn rẻ hơn thước phường.", /CG3-AC-9 đầu trang còn chữ «thước phường»/],
  ["AC-9", "bảng còn chữ thước phường", O, "Độ tin: {", "Độ tin thước phường: {", /CG3-AC-9 bảng còn chữ «thước phường»/],
  ["AC-9", "phần trăm dùng dấu chấm", O, "−{soPctVi(pct)}%", "−{pct.toFixed(1)}%", /CG3-AC-9 phần trăm phải dùng dấu phẩy/],
  ["AC-9", "cột nguồn in thêm tên nguồn", LUOI, "{d.source} · {fmtInt(d.nReposts)} lần", "{d.source} ten-nguon-that.example · {fmtInt(d.nReposts)} lần", /CG3-AC-9 cột nguồn chỉ được hiện mã S0x/],
  // Ba lỗ phép đo của lượt chấm 4.
  ["AC-4", "bỏ gộp căn trước khi cắt trang", DEALS, "SELECT DISTINCT ON (l.can_key) l.*\n       FROM loc l", "SELECT l.*\n       FROM loc l", /CG3-AC-4 (tab \w+(-\w+)?: |hợp các trang)/],
  ["AC-6", "lọc Đất trả nhầm Căn hộ", DEALS, "AND h.duoi_trung_vi_pct <= ${NGUONG_LOAI_PCT}\n         AND ($3::text IS NULL OR o.property_type = $3)", "AND h.duoi_trung_vi_pct <= ${NGUONG_LOAI_PCT}\n         AND ($3::text IS NULL OR o.property_type = CASE WHEN $3 = 'land' THEN 'apartment' ELSE $3 END)", /CG3-AC-6 ô sale × land/],
  ["AC-8", "vai Người xem nhận số điện thoại", DEALS, "{ sellerName: null, sellerPhone: null, groupName: null,", "{ sellerName: null, groupName: null,", /CG3-AC-8 (vai Người xem|mở căn ngoài trang) lộ số điện thoại/],
  // Bảy chỗ hụt lượt phản biện độc lập trước lượt chấm 5 xác nhận.
  ["AC-4", "cỡ 25, 50 chỉ hiện 15 căn", DEALS, "const cua = chon.slice((page - 1) * thamSo.size, page * thamSo.size);", "const cua = chon.slice((page - 1) * thamSo.size, page * thamSo.size);\n  cua.splice(15);", /CG3-AC-4 cỡ \d+ tab \w+(-\w+)?: /],
  ["AC-5", "số trên mục cây lệch số của mục", LUOI, "description: `${fmtInt(n.count)} căn`,", "description: `${fmtInt(n.count + 1)} căn`,", /CG3-AC-5 mục (tỉnh|dự án) phải ghi đúng số căn/],
  ["AC-7", "Xoá bộ lọc trên thanh lọc giữ loại hình, giữ trang", LUOI, "onClick={() => onDoi({ location: null, project: null, type: null, page: 1 })}>Xoá bộ lọc", "onClick={() => onDoi({ location: null, project: null })}>Xoá bộ lọc", /CG3-AC-7 Xoá bộ lọc trên thanh lọc/],
  ["AC-2", "dòng thuê theo tháng ghi giá theo m²", LUOI, '{d.pricePerm2 ? chuGiaM2(d.pricePerm2) : "—"}', "{chuGiaM2(d.pricePerm2 ?? d.priceVnd ?? 0)}", /CG3-AC-2 dòng thuê theo tháng/],
  ["AC-3", "chân bảng ghi tổng của Tất cả ở tab khác", LUOI, "/ ${fmtInt(trang.tong)}`", "/ ${fmtInt(trang.dem.all)}`", /CG3-AC-3 tab Còn thiếu: chân bảng/],
  ["AC-3", "bỏ toà khi xét đủ", DEALS, "block: (r.block_raw as string | null) ?? null,\n      street: (r.street_raw", "block: null,\n      street: (r.street_raw", /CG3-AC-3 (căn có toà|bảy căn mất một mục)/],
  ["AC-3", "tin thuê có thước giá/m² bị tính là chưa có thước", DEALS, 'medianPerm2: r.thuoc === "gia-m2" && r.trung_vi !== null ? Number(r.trung_vi) : null,', 'medianPerm2: r.thuoc === "gia-m2" && Number(r.trung_vi) >= 1e6 ? Number(r.trung_vi) : null,', /CG3-AC-3 tab (du|thieu) lệch số tính độc lập \(rent\)/],
  // Các đột biến của lượt soát độc lập trước lượt chấm 4.
  ["AC-1", "đảo mức dưới trung vị khi cùng hạng", DEALS, "g.hang_pct ASC NULLS LAST, g.discount_pct DESC, g.offer_id`", "g.hang_pct ASC NULLS LAST, g.discount_pct ASC, g.offer_id`", /CG3-AC-1 sai thứ tự/],
  ["AC-1", "đảo mã tin khi cùng hạng, cùng mức", DEALS, "g.hang_pct ASC NULLS LAST, g.discount_pct DESC, g.offer_id`", "g.hang_pct ASC NULLS LAST, g.discount_pct DESC, g.offer_id DESC`", /CG3-AC-1 sai thứ tự/],
  ["AC-1", "bỏ hạn 45 ngày", DEALS, "AND o.last_seen >= now() - interval '${NGAY_TOI_DA} days'\n         AND h.duoi_trung_vi_pct >= $2", "AND h.duoi_trung_vi_pct >= $2", /CG3-AC-1 màn phải loại đúng ba căn/],
  ["AC-1", "trang truyền ngưỡng 0", TRANG, "getDeals(undefined, NGUONG_VAO_PCT, { thamSo })", "getDeals(undefined, 0, { thamSo })", /CG3-AC-1 màn phải loại đúng ba căn/],
  ["AC-2", "mất tên dự án của nhóm", DEALS, "nodeName: (r.rank_node_name as string | null) ?? null,", "nodeName: null,", /CG3-AC-2 ô Hạng giá/],
  ["AC-2", "mất lý do lùi cấp từ DB", DEALS, "reason: (r.rank_reason as string | null) ?? null,", "reason: null,", /CG3-AC-2 ô Hạng giá/],
  ["AC-2", "độ tin luôn cao", DEALS, "confidence: r.confidence as string,", 'confidence: "high",', /CG3-AC-2 ô Hạng giá/],
  ["AC-2", "đảo hai nhãn hạng", DEALS, "h.nhan AS rank_label,", "CASE h.nhan WHEN 'gia-tot' THEN 're-trong-phuong' ELSE 'gia-tot' END AS rank_label,", /CG3-AC-2 ô Hạng giá/],
  ["AC-2", "trung vị giá tháng gấp mười lần", O, "fmtInt(d.rank.median / 1e6)} tr/tháng", "fmtInt(d.rank.median / 1e5)} tr/tháng", /CG3-AC-2 trung vị giá tháng/],
  ["AC-2", "mức giảm lấy nhầm hạng phần trăm", DEALS, "h.duoi_trung_vi_pct AS discount_pct,\n              coalesce(h.can_xac_minh, false) AS suspect,\n              h.n AS rank_n", "h.hang_pct AS discount_pct,\n              coalesce(h.can_xac_minh, false) AS suspect,\n              h.n AS rank_n", /CG3-AC-2 mức giảm/],
  ["AC-3", "tab đếm trong trang trên trình duyệt", LUOI, "const demHien = trang ? trang.dem : dem", "const demHien = dem", /CG3-AC-3 tab .+ ghi sai số/],
  ["AC-3", "mọi tab in số Tất cả", LUOI, "fmtInt(demHien[t.value])", "fmtInt(demHien.all)", /CG3-AC-3 tab .+ ghi sai số/],
  ["AC-3", "đầu khoảng luôn là 1", LUOI, "fmtInt(trang.tong === 0 ? 0 : (trang.page - 1) * trang.thamSo.size + 1)", "fmtInt(trang.tong === 0 ? 0 : 1)", /CG3-AC-3 trang giữa phải ghi/],
  ["AC-3", "cuối khoảng không chặn theo tổng", LUOI, "fmtInt(Math.min(trang.page * trang.thamSo.size, trang.tong))", "fmtInt(trang.page * trang.thamSo.size)", /CG3-AC-3 trang cuối phải chặn/],
  ["AC-3", "bỏ đường khi xét đủ", DEALS, "street: (r.street_raw as string | null) ?? null,\n      medianPerm2: r.thuoc", "street: null,\n      medianPerm2: r.thuoc", /CG3-AC-3 (căn có đường|bảy căn mất một mục)/],
  ["AC-3", "bỏ ảnh trên máy thu khi xét đủ", DEALS, "AND (m.local_file IS NOT NULL OR m.media_url IS NOT NULL))`;", "AND (m.media_url IS NOT NULL))`;", /CG3-AC-3 (căn có ảnh trên máy thu|bảy căn mất một mục)/],
  ["AC-3", "cloud xếp tab như máy thu", DEALS, "}, { xemNoiDung: true, mayThu }),", "}, { xemNoiDung: true, mayThu: true }),", /CG3-AC-3 tab (du|thieu) lệch số/],
  ["AC-4", "đổi cỡ trang giữ nguyên trang", LUOI, "page: moi.pageSize === trangHien.pageSize ? moi.pageIndex + 1 : 1, size", "page: moi.pageIndex + 1, size", /CG3-AC-4 đổi cỡ trang phải về trang 1/],
  ["AC-4", "bảng không biết tổng số căn", LUOI, "...(trang ? { rowCount: trang.tong } : {}),", "", /CG3-AC-4 (trang giữa phải sang|phải có nút tới trang cuối)/],
  ["AC-4", "đổi tab giữ nguyên trang", LUOI, "return onDoi?.({ tab: v as Tab, page: 1 })", "return onDoi?.({ tab: v as Tab })", /CG3-AC-4 đổi tab phải về trang 1/],
  ["AC-4", "nhận trang số lẻ", CHI_TIET, "page: Number.isInteger(page) && page >= 1 ? page : 1,", "page: page >= 1 ? page : 1,", /CG3-AC-4 tham số/],
  ["AC-4", "bỏ chuyển trang của căn ngoài trang", TRANG, "if (can && !tho.some((d) => d.offerId === can)) redirect(`/ops/deals/${encodeURIComponent(can)}`);", "", /Missing expected rejection/, SAU_TRANG],
  ["AC-5", "chọn vị trí không về trang 1", LUOI, 'project: loai === "project" ? ma : null, page: 1 })', 'project: loai === "project" ? ma : null })', /CG3-AC-5 chọn (tỉnh|dự án|phường) phải/],
  ["AC-5", "bỏ nhánh Phường", DEALS, '...(phuong.length ? [{ value: `nhom:phuong:${ma}`, label: "Phường", count: t.canPhuong.size, children: phuong }] : []),', "", /CG3-AC-5 tỉnh phải có hai nhánh/],
  ["AC-5", "bỏ nhánh Dự án", DEALS, '...(duAn.length ? [{ value: `nhom:du-an:${ma}`, label: "Dự án", count: t.canDuAn.size, children: duAn }] : []),', "", /CG3-AC-5 tỉnh phải có hai nhánh/],
  ["AC-5", "mục cây hiện mã thô", DEALS, ".map(([k, v]) => ({ value: `${tien}:${k}`, label: v.ten, count: v.can.size }));", ".map(([k, v]) => ({ value: `${tien}:${k}`, label: k, count: v.can.size }));", /CG3-AC-5 nhánh Dự án sai mục/],
  ["AC-5", "chọn mục mới vẫn giữ vị trí cũ", LUOI, 'onDoi({ location: loai === "area" ? ma : null, project: loai === "project" ? ma : null, page: 1 })', 'onDoi({ location: loai === "area" ? ma : thamSo.location, project: loai === "project" ? ma : thamSo.project, page: 1 })', /CG3-AC-5 chọn (tỉnh|dự án|phường) phải/],
  ["AC-5", "ô vị trí không hiện mục đang chọn", LUOI, "value={viTri}\n", 'value=""\n', /CG3-AC-5 ô chọn phải hiện mục đang chọn/],
  ["AC-6", "tab luôn sáng Bán", LUOI, "<Tabs value={thamSo.kind} onValueChange", '<Tabs value="sale" onValueChange', /CG3-AC-6 đang xem thuê thì Cho thuê phải sáng/],
  ["AC-6", "chỉ còn hai loại hình", LUOI, "...LOAI_LOC.map((v) => ({ value: v, label:", "...LOAI_LOC.slice(0, 2).map((v) => ({ value: v, label:", /CG3-AC-6 ô loại hình phải có đủ mọi loại/],
  ["AC-6", "chọn loại hình không có tác dụng", LUOI, "onValueChange={(v) => onDoi({ type: v === TAT_CA ? null : String(v), page: 1 })}", "onValueChange={() => onDoi({ page: 1 })}", /CG3-AC-6 chọn loại hình phải mang type/],
  ["AC-7", "nút Xem tất cả không làm gì", LUOI, 'onClick={() => onDoi?.({ tab: "all", page: 1 })}>Xem tất cả', "onClick={() => {}}>Xem tất cả", /CG3-AC-7 Xem tất cả phải về tab Tất cả/],
  ["AC-7", "nút Xoá bộ lọc không làm gì", LUOI, "onClick={() => onDoi?.({ location: null, project: null, type: null, page: 1 })}>Xoá bộ lọc", "onClick={() => {}}>Xoá bộ lọc", /CG3-AC-7 Xoá bộ lọc phải bỏ vị trí/],
  ["AC-7", "tập rỗng dẫn sai trang", LUOI, 'href="/ops/quality" />}>Xem chất lượng dữ liệu', 'href="/ops" />}>Xem chất lượng dữ liệu', /CG3-AC-7 tập rỗng phải dẫn sang chất lượng dữ liệu/],
  ["AC-7", "lọc dự án rỗng báo tập rỗng", LUOI, "(trang.thamSo.location || trang.thamSo.project || trang.thamSo.type)", "(trang.thamSo.location || trang.thamSo.type)", /CG3-AC-7 lọc .+ ra rỗng phải báo lọc rỗng/],
  ["AC-7", "chỉ lọc loại hình mất nút bỏ lọc", LUOI, "const coLoc = Boolean(viTri || thamSo.type)", "const coLoc = Boolean(viTri)", /CG3-AC-7 chỉ lọc loại hình/],
  ["AC-7", "lỗi hạ tầng rơi về bản cloud", DEALS, "if (!thieuLuocDo(e)) throw e;\n    const { rows } = await pool.query(sql({ cloud: true, coBang }), values);", "const { rows } = await pool.query(sql({ cloud: true, coBang }), values);", /CG3-AC-7 lỗi hạ tầng phải tới khung lỗi/],
  ["AC-8", "vai Người xem nhận tên nhóm", DEALS, "{ sellerName: null, sellerPhone: null, groupName: null, brokerNAds: null, brokerMedianGap: null }", "{ sellerName: null, sellerPhone: null, brokerNAds: null, brokerMedianGap: null }", /CG3-AC-8 vai Người xem lộ «Nhóm Cấy Thử»/],
  ["AC-4", "bản cloud đọc số căn, số nhà", DEALS, '${cloud ? "NULL AS unit_number, NULL AS street_number" : "o.unit_number, o.street_number"},', "o.unit_number, o.street_number,", /unit_number/],
  ["AC-9", "mức giảm màn hẹp dùng dấu chấm", LUOI, "−{soPctVi(d.discountPct ?? 0)}%", "−{d.discountPct ?? 0}%", /CG3-AC-9 phần trăm phải dùng dấu phẩy|33,7/],
];

const ghi = process.argv.includes("--write");
const iChi = process.argv.indexOf("--chi");
const chi = iChi > 0 ? process.argv[iChi + 1] : null;
const git = (...a) => execFileSync("git", ["-C", GOC, ...a], { encoding: "utf8" }).trim();
const sha = git("rev-parse", "HEAD");
const nha = mkdtempSync(join(tmpdir(), "cg3-thu-pha-"));
const cay = join(nha, "cay");
git("worktree", "add", "--quiet", "--detach", cay, sha);
const dong = [];
let hong = 0;
try {
  for (const m of ["app", "pipeline"]) if (!existsSync(join(cay, m, "node_modules"))) symlinkSync(join(GOC, m, "node_modules"), join(cay, m, "node_modules"));
  const chay = (ac) => {
    const r = spawnSync("bash", [`${REL}/probes/doc.sh`, ac], { cwd: cay, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    return { ma: r.status, ra: `${r.stdout}\n${r.stderr}` };
  };
  for (const ac of [...new Set(DOT_BIEN.map((d) => d[0]))].filter((a) => !chi || a === chi)) {
    const nen = chay(ac);
    if (nen.ma !== 0) throw new Error(`${ac}: lệnh chấm đỏ khi chưa đột biến, mã ${nen.ma}`);
    console.log(`${ac} nền: mã 0`);
    dong.push(`| ${ac} | (không đột biến, đối chứng) | — | xanh | \`bash ${REL}/probes/doc.sh ${ac}\` | 0 | đạt |`);
    for (const [, viec, tep, tu, thanh, mongDo, sau] of DOT_BIEN.filter((d) => d[0] === ac)) {
      const f = join(cay, tep), goc = readFileSync(f, "utf8");
      const j = goc.indexOf(tu, sau ? goc.indexOf(sau) : 0);
      if (j < 0) throw new Error(`${ac} «${viec}»: đột biến không áp được`);
      writeFileSync(f, goc.slice(0, j) + thanh + goc.slice(j + tu.length));
      const r = chay(ac);
      writeFileSync(f, goc);
      const bat = r.ma !== 0 && mongDo.test(r.ra);
      if (!bat) hong += 1;
      console.log(`${bat ? "đạt" : "HỎNG"} ${ac} «${viec}»: mã ${r.ma}`);
      dong.push(`| ${ac} | ${viec} | \`${tep.replace("app/src/", "")}\` | ${String(mongDo).slice(1, -1).replaceAll("|", "\\|")} | \`bash ${REL}/probes/doc.sh ${ac}\` | ${r.ma} | ${bat ? "đạt" : "HỎNG"} |`);
    }
  }
} finally {
  execFileSync("git", ["-C", GOC, "worktree", "remove", "--force", cay]);
  rmSync(nha, { recursive: true, force: true });
}
if (ghi) writeFileSync(join(HO_SO, "thu-pha.md"), `# Bảng thử phá CG3\n\nSinh bằng \`node ${REL}/probes/thu-pha.mjs --write\` trên commit \`${sha}\`. Mỗi dòng sửa một chỗ mã sản phẩm trên worktree tạm rồi chạy lệnh chấm của tiêu chí. «Đạt» là lệnh thoát khác 0 và thông điệp đỏ khớp cột ca đỏ; dòng đối chứng là cùng lệnh khi chưa đột biến.\n\n| Tiêu chí | Đột biến | Tệp | Ca đỏ (thông điệp) | Lệnh | Mã thoát | Kết quả |\n|---|---|---|---|---|---|---|\n${dong.join("\n")}\n\nTổng: ${DOT_BIEN.length} đột biến, ${hong} chưa bắt được.\n`);
console.log(`Tổng: ${dong.length} dòng, ${hong} chưa bắt được`);
process.exit(hong ? 1 : 0);
