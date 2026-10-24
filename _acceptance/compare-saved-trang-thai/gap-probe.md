---
slug: compare-saved-trang-thai
at: 2026-10-24T14:08:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

# Gap-probe — compare-saved-trang-thai

Phản biện context sạch (tác tử tươi, chỉ đọc design doc + contract + evals + decisions.jsonl + claims + opportunity.md).

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract (sổ d-4, d-7) | Breadcrumb «Việt Nam › Đã lưu» và chỗ đặt nút So sánh ghi máy quyết với căn cứ chỉ liên quan; Đã lưu là trang tài khoản, không phải nút địa lý [go-tai-khoan-kiem-id#F2] | Mạnh ký tưởng đã có căn cứ chốt; E4/E5 xanh trên lựa chọn chưa ai duyệt, đổi sau phải mở lại vòng | Chuyển thành câu hỏi ở Cổng 1 hoặc thay căn cứ bằng câu trích quyết đúng | human-gate1: breadcrumb Đã lưu thành Hỏi-1 (d-…141037Z-13); breadcrumb So sánh giữ căn cứ IA (d-…141037Z-12); chỗ đặt nút thay căn cứ bằng định nghĩa PageHeader «actions bên phải» của routes.md (d-…141037Z-14) |
| P0 | contract (sổ d-9, Đường đo) | «Bỏ đường-đo» là đánh đổi giá trị mà sổ ghi máy quyết, căn cứ là ô mẫu trống | Cổng Giá trị đọc bảng ngưỡng toàn ô CHƯA ĐO, quyết release/iterate/kill không có cơ sở | Đưa thành câu hỏi ở Cổng 1 hoặc điền ngưỡng | human-gate1: Hỏi-2 (d-…141037Z-15), khuyến nghị đồng ý bỏ |
| P1 | evals E14 ↔ AC-10 | ui-check không chụp /saved trống (c-empty-11) và /saved tối; tài khoản thử trỏ scratchpad của một phiên | Người chấm phiên khác không đăng nhập được, hoặc c-empty-11 vỡ ở 375/tối mà không ảnh nào thấy | Thêm bước trống 1280 sáng/tối + 375, có dữ liệu 1280 tối; tài khoản ở tệp gitignored trong kho, bước 0 kiểm | fixed: E14 thêm bước 6–10 (có dữ liệu tối, trống ×3, lưu lại) + bước 0; tài khoản dời sang `state/compare-saved-trang-thai/u1-test-account.json` (gitignored) |
| P1 | contract AC-6, evals E7 | When đi qua backend (lỗi DB trong server component async) mà chỉ đo bằng jsdom; không ca nào đo notFound/redirect không bị bắt; Thử lại không bấm [ops-facts-so-tong-hop#F1] | catchError bắt đúng trong jsdom nhưng trên Next thật lỗi nổi lên error.tsx cả trang | Smoke có công tắc lỗi dev/test; ca notFound; ca bấm Thử lại | fixed: E7 thêm ca notFound() không bị bắt; human-gate1: vế Next thật thành Hỏi-3 (d-…141037Z-16) — khuyến nghị nhận design-pass (ảnh compare-loi/saved-loi, Thử lại bấm thật) thay vì gài công tắc lỗi vào code sản phẩm |
| P1 | contract AC-3, AC-4, evals | Hai action vừa dời lên PageHeader không eval nào bấm: đổi tab → nút So sánh; Thêm khu vực → router.replace, đủ 4 tắt | Provider không nối, nút vẫn «So sánh 3» ở tab Phường; Thêm khu vực không đổi URL — E4/E5/E14 vẫn xanh | Ca jsdom bấm tab và chọn khu vực với router giả | fixed: AC-3/AC-4 thêm vế tương tác; eval E17 (CS-AC-3 thêm cột) và E18 (CS-AC-4 tab đổi nút) |
