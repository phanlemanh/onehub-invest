---
schema_version: 1
feature: Người duyệt mở /ops/review và thấy hàng chờ dạng bảng theo solution-agents-5, lọc theo loại thẻ, bấm một hàng mở sheet chi tiết có dải ảnh tin xem được cả ở màn 390px
slug: ops-review-khung-hang-cho
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: signed-off
design_doc: docs/superpowers/specs/2026-10-26-ops-review-khung-hang-cho-design.md
approved_by: Mạnh
approved_at: 2026-10-26T04:18:14Z
---

# Acceptance Contract: ops-review-khung-hang-cho

## Context

Hàng UI1 (phủ GD9) của lộ trình giao diện 23/10: dựng lại KHUNG trang Hàng duyệt `/ops/review` theo
`@reui/solution-agents-5` — hàng chờ dạng `data-grid` trong một `Frame`, lọc theo loại thẻ và trạng thái, bấm một hàng
mở `Sheet` chi tiết chứa nội dung thẻ hiện có và dải ảnh tin, dùng được ở 390 px. Thẻ duyệt không hiện độ tự tin
(Q9, Mạnh duyệt 26/10, «áp ngay cho UI1»). Nội dung thẻ v2 là PL23 (X1 lát OCP1) — UI1 không dựng.

Căn cứ: `docs/plan/lo-trinh.json` hàng UI1 · `opportunity.md` (Cổng Đáng = build) ·
`.claude/skills/onehub-ui/routes.md` dòng `/ops/review` · `docs/plan/BOI-CANH.md` §4 dòng UI1 ·
`docs/architecture/classification-enrich-review.md` Q9 · `.acceptance-runs/dieu-phoi-dot0-cam-mau/lat-ocp1-huong-tiep-can-2610.md` X1.

Source input: docs/plan/lo-trinh.json#UI1

## Criteria

- AC-1: Given DB local có thẻ `entity_match` và `agent_output` ở cả trạng thái chờ lẫn đã quyết, When người duyệt (quyền ops) mở `/ops/review`, Then trang hiện một `Frame` «Hàng duyệt» chứa `data-grid` với cột Thẻ · Loại · Trạng thái · Tạo lúc (giờ VN); mặc định chỉ thẻ chờ duyệt, xếp mới nhất trước; số thẻ ở đầu Frame bằng số dòng của bộ lọc và khớp DB; nhãn loại tiếng Việt («Ghép căn», «Bổ sung tin»), loại lạ hiện mã nguyên văn.
- AC-2: Given bảng ở AC-1, When người duyệt chọn Loại thẻ (Mọi loại · Ghép căn · Bổ sung tin · Loại khác) và Trạng thái (Chờ duyệt · Đã quyết · Tất cả), Then bảng chỉ còn đúng các thẻ khớp cả hai điều kiện, số ở đầu Frame đổi theo; bộ lọc ra 0 thẻ hiện «Không có thẻ khớp bộ lọc» với một nút «Xoá lọc» đưa về mặc định; riêng khi hàng duyệt chỉ còn thẻ đã quyết, mặc định hiện «Không còn thẻ chờ duyệt» với một nút «Xem thẻ đã quyết» dẫn tới các dòng đó.
- AC-3: Given bảng có thẻ, When người duyệt bấm một hàng (hoặc Tab tới tên thẻ rồi Enter), Then một `Sheet` mở với tên thẻ, badge loại, badge trạng thái và nội dung thẻ hiện có (thẻ ghép căn: hai tin A/B kèm giá, diện tích, giá/m², phường, loại, địa chỉ, Điểm B; thẻ bổ sung tin: đoạn tin + trường đề xuất, trường xung đột hiện hai bên kèm căn cứ; loại lạ: dòng «chưa có giao diện duyệt»); Esc hoặc nút đóng trả về bảng.
- AC-4: Given người duyệt là admin và thẻ có ảnh tin (`loadReviewMedia`), When mở sheet của thẻ đó, Then dải ảnh của đúng thẻ (Tin A/Tin B, hoặc Tin) nằm trong sheet và bấm một ảnh mở hộp phóng to; người không phải admin không thấy dải ảnh; bảng không tải ảnh. (cross-layer)
- AC-5: Given sheet của một thẻ chờ duyệt, When người duyệt bấm nút quyết định, Then trình duyệt gửi đúng route `/api/v1/ops/review/<id>/decide` với đúng body như trước UI1 (`approved`/`rejected`/`deferred`; thẻ xung đột kèm `choices`, «Áp dụng» khoá tới khi mọi trường xung đột đã chọn); thành công → bảng làm mới (thẻ vừa quyết rời bộ lọc «Chờ duyệt») và sheet vẫn mở, hiện badge kết quả, không còn nút; route trả lỗi → dòng lỗi trong sheet, nút bấm lại được. Đo cả trên trình duyệt thật với route `decide` bị chặn và trả phản hồi giả — DB không bị ghi. (cross-layer)
- AC-6: Given thẻ có `ai_confidence` trong DB, When trang render (bảng và sheet của mọi loại thẻ), Then không chỗ nào hiện độ tự tin (không nhãn «tự tin», không con số «N%» nào ngoài các đoạn trích nguyên văn — lý do của máy, đoạn tin, căn cứ — vốn có thể chứa phần trăm chênh giá/diện tích) và giá trị `ai_confidence` không có trong dữ liệu gửi xuống trình duyệt.
- AC-7: Given màn 390 px, When người duyệt mở `/ops/review` rồi mở sheet một thẻ ghép căn có ảnh, Then trang không cuộn ngang (`scrollWidth = clientWidth`), bảng cuộn ngang trong Frame, sheet chiếm trọn bề ngang, tin A/B xếp chồng, dải ảnh thấy được và bấm được.
- AC-8: Given vùng hàng duyệt, When hàng duyệt trống / đang tải / truy vấn lỗi, Then lần lượt: `Empty` «Hàng duyệt trống» có đúng một hành động «Xem thu thập»; Skeleton theo bố cục Frame + thanh lọc + dòng; `RegionError` «Không tải được hàng duyệt» kèm «Thử lại» thay nội dung trang, vỏ Ops (thanh bên) vẫn đứng.
- AC-9: Given môi trường cloud (bảng `review_queue` vắng), When mở `/ops/review`, Then trang vẫn chỉ hiện số thẻ chờ theo loại + mốc đo + thông báo «chỉ có ở máy thu» như ON3; UI1 không thêm đường nào đưa nội dung `review_queue` hay ảnh tin lên cloud.
- AC-10: Given các tệp UI1 đổi, When chạy kiểm máy, Then `tsc` sạch, lint 0 lỗi, `eslint-suppressions.json` không thêm khoá (khoá của `review-card.tsx` giảm), design-gate của `review-queue.tsx` không P0, `routes.md` dòng `/ops/review` ghi khung đã dựng với lọc theo loại thẻ + trạng thái (lọc theo bậc thuộc PL23, không «theo độ tin») và `catalog.md` có dòng `solution-agents-5` trỏ tệp đã chuyển thể.

## Coverage

Quét bằng skill `morphological-scan` (preset entity-feature, chạy trong S1).
Chân sản phẩm: `[SUY-TỪ-REPO: CONTEXT.md]` (Hàng duyệt), `[SUY-TỪ-REPO: app/src/components/ops/review-card.tsx]`,
`[SUY-TỪ-REPO: app/src/lib/ops/review-media.ts]`, `[SUY-TỪ-REPO: docs/architecture/portals.md]`.
Chân ngành: `[NGÀNH: ReUI solution-agents-5 «Action Approval Inbox»]` (hàng chờ + lọc + sheet chi tiết + quyết định),
`[NGÀNH: Linear Triage]` (hộp phân loại, bấm mục mở chi tiết, phím tắt quyết).

- Trục A — Loại thẻ: `entity_match` | `agent_output` thường | `agent_output` xung đột | loại lạ
  [thước CE: 16 dòng `review_queue` local 26/10 (13 ghép căn, 4 bổ sung tin) + ca AC-9/AC-11 của `review-card.test.tsx`]
- Trục B — Trạng thái: chờ | đã quyết (approved · rejected · deferred) [thước CE: cột `status` + `DONE_LABEL`]
- Trục C — Bề mặt × môi trường: local desktop | local 390 px | cloud [thước CE: ADR-0014/ON3, `localOnlyTable`]
- Trục D — Quyền: admin (thấy ảnh) | ops không admin [thước CE: `loadReviewMedia` → `isAdmin`]
- Cross-cutting: bảng · lọc · sheet · ảnh · quyết định · trống/tải/lỗi · Q9 · chuẩn UI.

Core → AC-1…AC-10 (ô A×B×C-desktop qua AC-1/2/3/5; A×D qua AC-4; C-390 qua AC-7; C-cloud qua AC-9; Q9 qua AC-6).
Later (`decisions.jsonl` descope): lọc theo bậc căn cứ → PL23 · nội dung thẻ v2, bỏ `ai_suggestion`, căn cứ mọi trường → PL23 ·
trả lại hàng loạt có lý do → GD10 · trường lý do khi quyết + audit trong giao dịch → C0.3 · tìm kiếm, phân trang server (16 thẻ).
Never: duyệt hàng loạt (routes.md «chỉ trả lại hàng loạt») · hiện độ tự tin (Q9) · `review_queue` lên cloud (tầng A).
`[GIẢ ĐỊNH]`: cỡ hàng duyệt còn nhỏ (≤ vài trăm thẻ) nên lọc/sắp phía client đủ — sai thì phân trang server ở vòng sau.

## Đường đo

Ô Cổng Đáng không khai ngưỡng UAT (mục «Ngưỡng chết / ngưỡng UAT» để trống) → không có thước nghiệm thu; bỏ bằng dòng
`descope` «bỏ đường-đo — …» trong `decisions.jsonl`.

## Out of scope

- Thẻ duyệt v2 (phát biểu theo bậc, đoạn trích tô trong toàn văn, bất đồng mọi cặp) và lọc theo bậc — PL23.
- Bỏ `ai_suggestion` mặc định, hiện `basis` mọi trường — PL23 (C0.2 phần ngoài Q9).
- Duyệt hay trả lại hàng loạt — UI12 `ops-review-tra-lai-hang-loat` (GD10: chỉ trả lại hàng loạt, có lý do).
- Lý do khi quyết, audit trong giao dịch — C0.3; route `decide` không đổi (T3).
- Ảnh local chưa từng hiện, loader không kiểm tệp — Known limits của `review-card-photos`, PL3 → PL23.

## Notes

- Đụng hồ sơ đã ký `enrich-qua-de-xuat` AC-9 («bảng field · giá trị · độ tin cậy»): theo Q9, ca test kiểm «85%» đổi
  thành kiểm vắng «%» — Hỏi-1 ở Cổng Phạm vi.
- Sau khi UI1 xong cần một lượt ghim lại các hồ sơ đã ký có `paths` chạm tệp review (liệt ở design doc).
- Smoke trình duyệt bấm nút quyết định với route `/api/v1/ops/review/*/decide` bị chặn (Playwright `page.route`, phản hồi giả)
  — không request nào tới server, `review_queue`/`sale_offers` không đổi (đếm trước/sau); jsdom đo thêm ma trận body.
- Known limits — chọn ở Cổng Bằng chứng 2026-10-26:
  - Ngoài-1: Bộ gọt độ tự tin bám đúng khuôn chữ căn cứ hiện nay của agent; nếu agent đổi cách viết, con số có thể hiện lại trên thẻ mà test không báo.
  - Ngoài-2: Test căn cứ bên AI tính giá trị kỳ vọng bằng chính hàm gọt, nên nếu căn cứ bị cắt quá tay về sau thì không có cảnh báo.
  - Ngoài-3: Các nhãn mới «Ghép căn», «Bổ sung tin», «Loại thẻ», «Đã quyết», «Loại khác» chưa có mục trong CONTEXT.md.
  - Ngoài-4: Test ngăn chi tiết thẻ ghép căn chưa phân biệt được tin A với tin B (dữ liệu mẫu hai bên giống nhau).
  - Ngoài-5: Smoke trình duyệt đo dev server :3460 mà không xác minh server đó chạy từ đúng worktree đang nghiệm thu.
