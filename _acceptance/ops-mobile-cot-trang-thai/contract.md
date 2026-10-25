---
schema_version: 1
feature: Người trực mở bảng Ops trên điện thoại 390px thấy cột Trạng thái ngay sau cột tên, không phải cuộn ngang mới thấy Hỏng hay Ổn
slug: ops-mobile-cot-trang-thai
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: signed-off
approved_by: Mạnh
approved_at: 2026-10-25
design_doc: docs/superpowers/specs/2026-10-25-ops-mobile-cot-trang-thai-design.md
lo_trinh_ma: ON13
---

# Acceptance Contract: ops-mobile-cot-trang-thai

## Context

Hàng ON13 (OPS-18, gốc G6). Đo thật 25/10 ở 390×844: 5 trong 6 bảng đẩy cột trạng thái khỏi khung nhìn (bảng, vị trí,
ngân sách ở design doc §1–§2). «Sáu bảng» = Sức khoẻ nguồn, Khoá an toàn & hạ tầng thu, Nhóm S03, Máy móc (trang Thu
thập); Kiểm chất lượng, Độ phủ trung thực (trang Chất lượng dữ liệu). «Cột trạng thái» = Trạng thái (4 bảng đầu), Kết quả
(Kiểm chất lượng), Độ phủ trung thực (Độ phủ trung thực). Ngân sách khung ở 390px: `StatusGrid` 348px, `InsightGrid`
316px (đo thật, design doc §1).

## Criteria

- AC-1: Given 6 bảng render thật (SSR) với dữ liệu mẫu, When đọc thứ tự cột của bảng (`<th data-col-id>`), Then cột
  trạng thái đứng ngay sau cột tên ở cả 6 bảng; chiều đỏ: bản sao định nghĩa cột đặt cột trạng thái cuối bảng, và bản sao
  chen đúng một cột vào giữa tên và trạng thái (biên: vị trí thứ 3) → thước báo đúng tên bảng.
- AC-2: Given cùng 6 bảng, When cộng bề rộng cột tên và cột trạng thái từ `<colgroup>`, Then tổng ≤ ngân sách khung của
  loại lưới (StatusGrid 348px, InsightGrid 316px); biên: tổng đúng bằng ngân sách → không báo, vượt 1px → báo; chiều đỏ:
  bản sao đặt cột tên 400px → thước báo đúng tên bảng và tổng.
- AC-3: Given app chạy thật từ worktree với DB local, phiên admin tạm (tạo và xoá trong cùng lượt) và trình duyệt
  Chromium 390×844, When mở /ops/collections và /ops/quality, Then với mỗi bảng trong 6 bảng: bảng có ít nhất 1 hàng (0
  hàng → báo «không có hàng để đo — <bảng>»), khung cuộn chưa cuộn (`scrollLeft = 0`), ô tiêu đề cột trạng thái đứng ngay
  sau ô tên, và ở MỌI hàng trang đầu: ô trạng thái có mép phải ≤ mép phải khung cuộn và ≤ `innerWidth`, nhãn trạng thái
  nằm trọn trong ô (không tràn, `scrollWidth ≤ clientWidth` của ô); trang không cuộn ngang (`scrollWidth` của tài liệu ≤
  390); ô tên Nhóm S03 không bị cắt (theo Hỏi-1 lối khuyến nghị: tên xuống dòng, `scrollWidth ≤ clientWidth`); ảnh chụp hai
  trang được lưu; chiều đỏ: cùng phép đo sau khi chèn CSS (a) làm cột đầu một bảng rộng 400px, (b) ép ô trạng thái một
  bảng còn 60px, (c) chèn một phần tử rộng 500px vào trang → mỗi lần báo đúng bảng hoặc trang.
- AC-4: Given cùng app ở 1280×800 và tập cột gốc ghim trước từ main 4af4dd8 (`data-col-id` của 6 bảng, design doc §3),
  When mở hai trang, Then tập cột của mỗi bảng bằng đúng tập gốc (không thiếu, không trùng — chỉ đổi thứ tự) và cột trạng
  thái vẫn ngay sau cột tên; chiều đỏ: cùng phép đo sau khi gỡ một ô tiêu đề, và sau khi nhân đôi một ô tiêu đề rồi gỡ ô
  khác của một bảng → báo đúng bảng (biên: thiếu đúng một cột).

## Coverage

Bỏ quét hình thái — xem dòng `bỏ coverage-scan` trong sổ. Trục: {định nghĩa cột: thứ tự (AC-1), bề rộng (AC-2)} ·
{trang chạy thật: 390px (AC-3), 1280px không mất cột (AC-4)} × 6 bảng viết trước. Biên: bảng đã đạt sẵn (Sức khoẻ nguồn)
vẫn trong ma trận; khung InsightGrid hẹp hơn StatusGrid 32px; nhãn trạng thái dài nhất; bảng 0 hàng; trang rộng hơn khung.

## Đường đo

- «Ở 390px, cột Trạng thái của 6 bảng nằm trong khung nhìn khi chưa cuộn ngang» — `scripts/smoke-ops-mobile.mjs` trên
  trang chạy thật · AC-3; thước tĩnh giữ trạng thái cây · AC-1, AC-2.

## Out of scope

- Bảng khác của cổng Ops (Luồng 7 ngày, Hiệu chuẩn từng thị trường, Thị trường S02 toàn quốc, danh mục nguồn, nhóm Zalo).
- Khổ nhỏ hơn 390px; giao diện thẻ thay bảng trên điện thoại.
- Ghim cột (column pinning) khi cuộn ngang.

## Notes

- Ngân sách khung đo ở 390×844 trên Chromium; khung đổi (padding Frame) thì phải đo lại và sửa ngân sách trong thước.
- Phiên admin tạm của smoke chỉ tạo trên DB local (từ chối DATABASE_URL không phải localhost).
- Known limits — chọn ở Cổng Bằng chứng 2026-10-25:
  - Ngoài-1: smoke điện thoại vẫn báo đạt khi bước dọn tài khoản admin tạm không xoá hết; số dòng còn lại chỉ in ra log.
  - Ngoài-2: ở 390px smoke chỉ đo các hàng trang đầu của mỗi bảng; nhãn trạng thái ở trang 2 trở đi chưa được đo tự động.
  - Ngoài-3: smoke chỉ đo những nhãn trạng thái đang có trong dữ liệu DB local; một trạng thái hiếm có nhãn dài chưa được đo trước.
