# Quét hình thái — man-gan-nhan-mu (preset entity-feature)

## Ngữ cảnh
- Sản phẩm: onehub-invest, Ops Portal — chân sản phẩm: đào repo `[SUY-TỪ-REPO: docs/architecture/classification-enrich-review.md]`
  (F3, F5, §3.5), `[SUY-TỪ-REPO: docs/product/CONTEXT-PRODUCT.md]`, `[SUY-TỪ-REPO: app/src/lib/ops-access.ts]` (bốn vai).
- Chân ngành (công cụ gắn nhãn dữ liệu cùng loại, gọi tên từ hiểu biết chắc): `[NGÀNH: Label Studio]` (số lượt gắn mỗi
  tác vụ, đồng thuận giữa người gắn), `[NGÀNH: Prodigy]` (gắn từng mục một, chồng lấp giữa người gắn),
  `[NGÀNH: Amazon SageMaker Ground Truth]` (số người gắn mỗi đối tượng, gộp nhãn). Thực hành chung: gắn mù không
  hiện dự đoán khi đo, tập chồng lấp để đo đồng thuận, tách dev/test.

## Trục
- Trục A · Vòng đời nhãn: chọn tin vào lát | phân tin cho người | gắn (tạo) | sửa/xoá | đo (tổng hợp) | xuất cho
  bộ chấm   [thước CE: §3.5 + ba công cụ ngành trên]
- Trục B · Người × quyền: người gắn (vai ops+) | người xem số (viewer) | máy (lệnh lấy mẫu, lệnh đo) | cloud
  [thước CE: `QUYEN_OPS` bốn vai + ADR-0015]
- Trục C · Loại tin trong hàng chờ: tin đơn chưa ai gắn | tin trùng chưa ai | tin trùng đã một người | đã đủ
  [thước CE: F5 «20% gắn trùng hai người»]
- Trục D · Nguồn tin: S03 lát OCP1 | S05 | S06 | cặp tin (G3)   [thước CE: §3.5 bảng G0–G3]

## Core (làm ở vòng này)
1. A·chọn × D·S03 — lấy mẫu tất định, khử trùng, gạt post thử, đánh 20% trùng + dev/test (AC-2).
2. A·phân × C (cả bốn) × B·người gắn — tin kế đúng luật, không trả lại tin đã gắn, 409 khi tranh chấp (AC-5).
3. A·gắn × B·người gắn — biểu mẫu chín trường, mù giá trị máy, kiểm miền (AC-3, AC-4, AC-7).
4. A·đo × B·máy + người — view đồng thuận, lệnh đo, bảng trên màn (AC-6).
5. B·viewer, B·cloud — đọc số không ghi; «Chỉ ở máy thu» (AC-7, AC-8).

## Later
- A·sửa/xoá nhãn đã lưu (người gắn nhầm) — khi đội gắn báo cần.
- A·xuất cho bộ chấm — PL9 đọc thẳng bảng.
- D·S05, D·S06, D·cặp G3 — cùng bảng, vòng sau.
- Hàng đợi theo người cụ thể (giao tin cho người được chỉ định) `[NGÀNH: Label Studio]` — khi có người thuê.
- Tin «không đọc được / bỏ qua» `[NGÀNH: Prodigy]` (nút ignore) — hiện ghi bằng «Không phải tin rao» + «Tin không nêu».

## Never
- Hiện dự đoán của máy cho người gắn (chế độ gắn có gợi ý) — phá phép đo mù (§3.5).
- Gộp nhãn bằng bỏ phiếu đa số để thành sự thật — hai người không đủ đa số; PL9 dùng nhãn của tập test như đã gắn.
- Ghi nhãn từ cloud — ngược chiều kéo một chiều (ADR-0015); nếu cần là hàng riêng.

## Cross-cutting áp mọi ô Core
- Tầng A: nhãn gắn `labeler_id` (hồ sơ người dùng app) → chỉ máy thu, không vào sync-cloud/push-ops-facts.
- Trạng thái trống / tải / lỗi; quyền đóng mặc định; không tên nguồn thật (chỉ `S03`).
