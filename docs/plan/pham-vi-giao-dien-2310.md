# Bản phạm vi — giao diện còn lại sau B1/B3 (23/10)

> Nguồn: khảo sát giao diện 23/10 trên main `d30974d` (lượt cắt chung, Mạnh duyệt «cắt lộ trình chung MECE»):
> `.claude/skills/onehub-ui/routes.md` (block đích + slug đích, đợt I1–I6), spec/kế hoạch chuẩn UI 22/10 Phần B,
> ROADMAP §4 Track 6, `docs/architecture/invest-portal-ia.md`, `docs/architecture/portals.md`, mục Ngoài phạm vi
> của `_acceptance/ui-clean-b1-ops/`, `_acceptance/review-card-photos/`, `_acceptance/invest-target-map/`.
> Baseline lint đo từ `app/eslint-suppressions.json`: 82 vi phạm / 19 tệp; GD1–GD11 + GD17 phủ đủ 82, mỗi tệp đúng một mã.
> Đã loại vì trùng hàng có sẵn: nội dung thẻ duyệt (PL3, PL23), màn gắn nhãn (PL7), độ đúng /ops/quality (PL9),
> sổ nhóm (PL12), logic «Căn giá tốt» (PL26), độ chắc trên Invest (PL27), chi phí AI (PL29, PL31), SLO lệch (AU6),
> ranh giới Hà Nội (AU9). B2/B4 đã giải thể vào I1–I6 (ROADMAP Track 6); phần Ops của B4 là GD12.
> Bối cảnh khi mở vòng: `docs/plan/BOI-CANH.md`.

<!-- <<<PHAM-VI-MA -->
```
dot: giao-dien-2310
dang: lan-va
nguon: onehub-invest-tri-thuc:wiki/dot/giao-dien-2310.md#f830f50fb600a2c51b8d9e3550ad75932690cfa4

- `GD1` — Finder /[country]: solution-analytics-1 + @mapcn/choropleth, PageHeader, trạng thái «đang thu thập», đủ tải/trống/lỗi
- `GD2` — Insight thị trường + phường: khung solution-analytics-8, KPI của block, @mapcn/map, neo mục lục tiếng Anh, mục trống không bị ẩn
- `GD3` — /listing/[id]: product-detail-5, ảnh tự thu, lịch form-5, Skeleton + Empty
- `GD4` — duyệt listing: filters + filter-sidebar-5, @mapcn/store-locator gom cụm, lọc theo khung nhìn
- `GD5` — /yield: data-grid-advanced-7 cho chi phí và dòng tiền vốn vay; /dau-tu chuyển 301 về /yield; gỡ investment-simulator
- `GD6` — So sánh /compare (301 từ /so-sanh) và Đã lưu có PageHeader và trạng thái
- `GD7` — trang chủ và /methodology (301 từ /phuong-phap): faq-3, hết màu cứng, error.tsx nhóm marketing, global-error.tsx
- `GD8` — đăng nhập/đăng ký auth-4/auth-5 hết chuyển động cấm, gradient tự chọn, chữ tuỳ ý; error.tsx nhóm (auth)
- `GD9` — /ops/review khung hàng chờ data-grid theo solution-agents-5, sheet chi tiết, dải ảnh trong sheet, lọc theo loại thẻ
- `GD10` — /ops/review trả lại hàng loạt có lý do và ghi audit (không duyệt hàng loạt)
- `GD11` — /ops/deals dọn theo block data-grid, PageHeader, đủ trạng thái; cột tầng A vẫn chỉ admin
- `GD12` — Ops /ops, /ops/collections, /ops/quality, /ops/sources có Suspense + Skeleton đúng bố cục, Empty có hành động, lỗi tại chỗ có Thử lại
- `GD13` — khay So sánh từ bảng xếp hạng Finder
- `GD14` — nút Chia sẻ giữ đủ tham số trên Insight, Listing, Lợi suất
- `GD15` — Đã lưu thêm listing và báo cáo lợi suất (4 tab)
- `GD16` — /ops/audit cho admin: mọi thao tác ops:write, lọc được, kèm lý do duyệt
- `GD17` — gỡ baseline lint: xoá eslint-suppressions.json, lint UI 0, bảng trước/sau ui-baseline đủ cột
- `GDH1` — bộ lọc dùng chung theo số phòng ngủ và loại phòng
- `GDH2` — khoá theo gói (empty-state-5 + pricing-7)
- `GDH3` — điểm One Invest dạng radial
- `GDH4` — /ops/pipeline
- `GDH5` — /ops/agents phần hoạt động agent
- `GDH6` — /ops/backups
- `GDH7` — /ops/console (trigger)
```
<!-- PHAM-VI-MA>>> -->
