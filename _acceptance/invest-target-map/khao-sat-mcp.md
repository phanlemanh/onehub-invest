# Khảo sát MCP reui — bản đồ đích cổng Invest (2026-10-23)

MCP reui nạp được trong phiên (plan **pro**). Lời gọi: `list_block_categories`, `compose_page` (6 ý
định, `surface: "frame"`), `search` theo nhóm (analytics, bookings, travel, dashboard, filter-sidebar,
product-detail, product-grid, form, comparison, wishlist, auth, app-shell, blog, empty-state),
`get_block` (bestFor / whenNotToUse / agentNotes) và `get_thumbnail` cho 2–4 ứng viên mỗi vùng.
Bảng có hình: `ban-quyet-dinh.html` (ảnh render: `figures/ban-quyet-dinh.jpg`).

## compose_page — ý định → kết quả

| Ý định (rút gọn) | Kết quả đáng ghi | Section không có block |
|---|---|---|
| market finder: bảng xếp hạng có thanh điểm + sparkline, choropleth, chọn chỉ số | Dashboard plan: app-shell-12, navbar-6, stats-8, **solution-analytics-2** (alt analytics-1/-6/-4) | Bản đồ (không section map nào được trả); bản đầu dùng ý định dài ra toàn shell/dialog chung chung |
| STR market report: KPI, xu hướng doanh thu/công suất/ADR, cơ cấu loại phòng, bảng phường + listing | Chỉ shell/navbar/sheet/empty-state; dialog `fit: generic` | Không có section analytics/chart nào khớp → chọn bằng `search` |
| rental listing detail: specs, KPI, heatmap 365 đêm, comps | schedule-4, **solution-bookings-1** (alt bookings-3/-4) | Heatmap lịch không có block (đã có bản chuyển thể form-5) |
| listing explorer: lọc, lưới thẻ, bản đồ nhãn giá | data-grid-base-8 (alt **data-grid-base-2**) | Bản đồ nhãn giá; lưới thẻ không được đề xuất (tìm bằng `search` product-grid) |
| landing BĐS: hero tìm kiếm, thị trường nổi bật, cách dùng, FAQ, CTA | navbar-12, hero-15, pricing-8, faq-3, cta-4 | **`unavailableSections: ["how-it-works"]`** — mâu thuẫn: `how-it-works-1` có trong registry và đang dùng |
| methodology & glossary | app-shell `generic`, dialog `generic`, navbar-11, sheet-22 | Không có block tài liệu/thuật ngữ → `search` blog/faq |

## Ứng viên đã đọc `get_block`

| Block | bestFor (rút gọn) | whenNotToUse liên quan |
|---|---|---|
| solution-analytics-1 | lưới backlog có thanh điểm, sparkline, tag, badge ưu tiên + panel sức khoẻ + xu hướng | biểu đồ dẫn dắt có tab chỉ số → dashboard-4; một chỉ số riêng → analytics-8 |
| solution-analytics-2 | hàng nhóm mở rộng theo khu vực, lọc trạng thái, popover cột, dòng tổng | signal có thanh điểm → analytics-1 |
| solution-analytics-8 | trang một chỉ số: hàng 4 KPI, thanh phân rã, timeline thay đổi | 4 ô chuyển 1 đường gọn → **chart-6** |
| solution-bookings-4 | gantt phòng khách sạn giữa hàng ô Công suất/ADR và worklist | lịch theo người → gantt-4; salon → bookings-1 |
| data-grid-advanced-7 | pro forma cho thuê: dòng thu/chi → NOI, dòng tiền, ROI theo năm, sửa tại chỗ | (không có) — dòng nằm trong store client, phải nối API/URL |
| form-11 | form triển khai dưới dải tóm tắt phản chiếu lựa chọn (surface **card**) | checkout → form-2; workspace → form-10 |
| app-shell-30 | không sidebar, nút section trên cùng, 8 tab view dưới tiêu đề có số đếm | cần rail link nhóm cố định → app-shell-28 |

## Đánh giá shell

Giữ `app-shell-30` cho Invest. Lý do (IA §4 + whenNotToUse): 4 mục phẳng cùng nhóm Research, bản đồ
và biểu đồ cần trọn bề ngang, view track khớp mục lục Insight; điều kiện đổi của chính block là "cần rail
link nhóm" — đúng Ops (7 trang, đã sang `app-shell-36` ở B1), không đúng Invest. `app-shell-28` dự
phòng khi > 6 module.

## Ghi chú

- Ảnh hiện trạng chụp từ server riêng của worktree này (`main` f51b01c) chứ không từ :3456 — :3456
  đang là server của nhánh B3 (biểu đồ đang đổi).
- `/saved` cần đăng nhập: ảnh hiện trạng là trang `/login?next=/saved`.
- `/listing/[id]` đang hiện ảnh (kể cả ảnh nguồn AirDNA kèm chữ "Ảnh từ AirDNA") — luật 5; việc gỡ
  thuộc phiên riêng, block đích `product-detail-5` chỉ nhận ảnh tự thu.
- `validate_usage` / `get_audit_checklist` không chạy: phiên này không viết code UI.
