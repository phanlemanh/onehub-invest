---
schema_version: 1
feature: Trang /ops/people cho người vận hành xem danh bạ Người ở máy thu — người theo nguồn S0x, số tin đã đăng, bí danh, nhãn suy luận chỉ hiển thị
slug: danh-ba-nguoi-tren-ops
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: draft
design_doc: docs/superpowers/specs/2026-10-30-danh-ba-nguoi-tren-ops-design.md
---

# Acceptance Contract: danh-ba-nguoi-tren-ops

## Context

Cổng Đáng: build, Mạnh 30/10 «Mở hàng, máy thu» (`LUAT.md` đợt dot0-cam-mau, mục danh-ba-nguoi-tren-ops). Danh bạ Người
(DB2b `ho-nguoi-theo-nguon`, #199, migration 055) đã có ở DB máy thu nhưng chưa có trang xem. Hàng dựng hai trang Ops
đọc thuần, chỉ ở máy thu.

## Criteria

- AC-1: Given app chạy trên cloud (`VERCEL=1`) hoặc DB không có bảng `parties`, When mở `/ops/people` hay `/ops/people/<khoá>`, Then trang hiện cảnh báo «Chỉ ở máy thu» và không truy vấn bảng nào trong bốn bảng danh bạ.
- AC-2: Given lược đồ tạm có migration 055 và ma trận người viết trước (người đang dùng nhiều tin, một tin, không tin; người đã gộp; vai đã rút; bí danh đã nghỉ; hai nguồn), When gọi hàm danh sách, Then mỗi người đang dùng đúng một hàng, người đã gộp không có hàng, số tin bằng số khoá tin khác nhau có vai «Người đăng» chưa rút, số bí danh chỉ đếm bí danh chưa nghỉ, và hàng xếp theo số tin giảm dần.
- AC-3: Given cùng lược đồ tạm, When lọc `source=S05` hoặc tìm `q` theo một phần tên hay tài khoản (khác hoa thường), Then chỉ người khớp được trả và tổng số khớp đúng; `source` không phải mã `S0x` bị bỏ qua (không lọc, không lỗi); danh sách chia trang 100 người theo `?page=` (theo Hỏi-2), trang ngoài khoảng hay sai khuôn về trang 1, và trang `/ops/people` hiện «Trang k/n · m người khớp» cùng ba số đầu trang (người đang dùng, vai sống, người theo nguồn) bằng số kỳ vọng của ma trận.
- AC-4: Given một người có bí danh sống, bí danh đã nghỉ, vai sống và vai đã rút, When mở `/ops/people/<khoá>`, Then trang hiện từng bí danh với nhãn loại tiếng Việt, nguồn, ngày thấy và dấu đã nghỉ; hiện các tin đã đăng (khoá tin, phương pháp, lớp bằng chứng, ngày ghi) chỉ gồm vai sống; và nêu số vai đã rút; khoá sai khuôn `pty_…` hay không tồn tại trả 404.
- AC-5: Given người có từ N tin sống trở lên và người dưới N (N theo Hỏi-1), When xem danh sách và trang người, Then chỉ người từ N tin mang nhãn «Có thể là môi giới» kèm chữ «suy luận»; và sau khi dựng hai trang, số dòng của bốn bảng danh bạ không đổi — mã truy vấn chỉ có `SELECT`.
- AC-6: Given phiên vai Người xem, When mở hai trang, Then thấy mã người, nguồn, số tin, nhãn suy luận nhưng mọi giá trị bí danh (tên, tài khoản, SĐT băm) hiện «Ẩn với vai Người xem»; phiên Vận hành và Quản trị thấy giá trị; phiên không vào được Ops không thấy trang. (cross-layer)
- AC-7: Given hai trang đã dựng trên dữ liệu thử có một bí danh tên chứa tên nguồn thật, When đọc HTML và mã truy vấn, Then nguồn chỉ hiện dạng mã `S0x`; tên nguồn thật không xuất hiện (bí danh ấy hiện bản đã che bằng bộ che chung `maskSourceNames`); mã truy vấn danh bạ không đọc `source_registry`, `real_name`, `users`, `sessions`, `user_events`, `user_profile`; SĐT băm chỉ hiện 8 ký tự đầu.
- AC-8: Given danh bạ rỗng, lọc không khớp, đang tải, truy vấn lỗi, When mở `/ops/people`, Then lần lượt hiện ô trống kèm lệnh dựng danh bạ, ô trống kèm nút «Xoá lọc», khung chờ theo bố cục, và lỗi kèm «Thử lại».
- AC-9: Given route mới, When chạy bộ kiểm route và nav, Then đoạn `people` có dòng `Slug URL` trong `CONTEXT.md`, `/ops/people` và `/ops/people/[partyKey]` có dòng trong bản đồ route của onehub-ui, thanh bên Ops có mục «Danh bạ người», `docs/architecture/portals.md` có dòng trang; test route-slugs và routes-map xanh.
- AC-10: Given dev server của worktree với danh bạ thật ở máy thu, When người chấm mở hai trang ở 1280 px sáng/tối và 390 px bằng tài khoản thử admin rồi viewer, Then bảng đọc được, nhãn suy luận tách khỏi dữ liệu, không cuộn ngang ở 390 px, phiên viewer thật thấy «Ẩn với vai Người xem» thay giá trị bí danh; và đối chiếu chỉ-đọc trên DB máy thu cho tổng người đang dùng, tổng số tin, số người đã gộp có hàng (= 0), loại bí danh không có nhãn (= 0) và tên nguồn thật trong HTML (= 0) khớp số đếm độc lập. (cross-layer)

## Coverage

Quét hình thái tại chỗ (preset entity-feature, thực thể «Người»), ba trục:

- Trục A — Vai phiên: khách | user | viewer | ops | admin [thước CE: `BAC_VAI` của `app/src/lib/ops-access.ts`]
- Trục B — Trạng thái dữ liệu người: đang dùng nhiều tin | một tin | không tin | đã gộp | bí danh nghỉ | vai rút | hai nguồn [thước CE: CHECK và trigger của `db/migrations/055_danh_ba_nguoi.sql`]
- Trục C — Môi trường: máy thu có bảng | máy thu bảng rỗng | cloud | DB thiếu bảng | truy vấn lỗi [thước CE: `localOnlyTable` + `LocalOnlyAlert` của `app/src/lib/ops-queries.ts`, bảng trạng thái của design doc]

Core → AC-1…AC-10: A ở AC-6; B ở AC-2, AC-4, AC-5; C ở AC-1, AC-8. Later: tìm theo SĐT gốc (băm phía máy chủ),
xuất CSV. Never: ghi vào danh bạ từ trang (Out of scope).

## Out of scope

- Danh bạ Người trên cloud và migration Supabase (TV10/SH1; Hỏi-3 của DB2b).
- Gộp, tách, nghỉ người hay bí danh từ trang (ghi `registry_events`).
- Ghi vai suy luận thành phát biểu vào `party_roles` (luật E1, hàng sau).
- Nối khoá tin sang trang chi tiết tin.

## Notes

- Hỏi-2 (phân trang): nếu Mạnh chọn lối khác — trả 500 người nhiều tin nhất khớp lọc — AC-3 đổi Then thành: kết quả cắt ở
  500 người, trang hiện «500/m người khớp — lọc hoặc tìm để thấy người khác», `data-grid` phân trang phía khách 20/50.
- Hỏi-1 (ngưỡng nhãn suy luận): N trong AC-5 lấy theo câu trả lời; nháp dùng 5.
