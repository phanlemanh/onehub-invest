---
schema_version: 1
feature: Người duyệt mở /ops/review và thấy mọi trường kèm căn cứ, ảnh tin và toàn văn tin, không có «AI tự tin %», rồi quyết kèm lý do được ghi audit cùng giao dịch
slug: the-duyet-du-can-cu
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [ui, api]
status: implemented
approved_by: Mạnh
approved_at: 2026-10-30T05:49:10Z
design_doc: docs/superpowers/specs/2026-10-30-the-duyet-du-can-cu-design.md
---

# Acceptance Contract: the-duyet-du-can-cu

## Context

Căn cứ: hàng PL3 của `docs/plan/lo-trinh.json` (mã phủ C0.2, C0.3); RV-L04 thẻ duyệt thiếu căn cứ, RV-L15 audit thủng
(`docs/architecture/classification-enrich-review.md` §2); Mạnh duyệt Cổng Đáng 30/10 («Xếp theo bốn làn»). Đã có trên
main `e182721f`: Q9 gọt độ tự tin (UI1), ảnh từ bảng `media` (NH1 #192), audit trong cùng transaction (TV1), phát biểu
và `field_provenance` cho năm trường trục (PL15). Vòng này đổ căn cứ, toàn văn và lý do vào sheet chi tiết của UI1.

## Criteria

- AC-1: Given thẻ bổ sung tin có trường đề xuất xung đột và không xung đột, When người duyệt mở sheet, Then MỌI trường
  hiện tên trường · giá trị · phương pháp («Luật E1» / «LLM E2») · căn cứ (`basis` đã gọt «tự tin NN%»); trường không có
  `basis` hiện đúng chữ «Chưa ghi căn cứ»; không trường nào thiếu ô căn cứ.
- AC-2: Given thẻ ghép căn, When người duyệt mở sheet, Then sheet có bảng so một hàng cho mỗi trường (giá, diện tích,
  giá/m², phường, phòng ngủ, WC, loại hình, đường, toà, tầng) với giá trị Tin A, Tin B và nhãn So («Khớp» / «Lệch» /
  «Thiếu») do hàm thuần tính; mỗi giá trị của năm trường trục mang lớp căn cứ + phương pháp đọc từ `field_provenance`
  của tin đó theo nhãn CONTEXT.md, trường ngoài trục hoặc không có phát biểu mang chữ «Chưa ghi căn cứ — đọc từ tin».
- AC-3: Given tin S03 có bài gốc dài hơn 300 ký tự và tin S06 có `payload.body`, When mở sheet, Then khối «Toàn văn»
  hiện trọn văn bản đọc từ DB máy thu (S03: bài mới nhất theo `post_ids`; S06: `stg_chotot_ads.payload->>'body'` theo
  `originating_system_key`), giữ xuống dòng, không cắt ký tự, không `line-clamp`; tên nhóm là dòng meta riêng, không
  đứng đầu đoạn tin; tin không có toàn văn ở máy thu hiện «Không có toàn văn ở máy thu».
- AC-4: Given người duyệt vai Vận hành (`xemNoiDungTin` đúng, không phải quản trị) và tin có ảnh đã tải về máy thu, When
  mở sheet, Then dải ảnh hiện ảnh đã tải và `/api/zalo-media` (chế độ snapshot) trả ảnh cho vai đó; ảnh chỉ có URL gốc
  KHÔNG tới trình duyệt vai Vận hành (không `src` mang tên miền nguồn) mà ô ảnh ghi một câu nói ảnh chỉ có ở nguồn; vai
  viewer vẫn nhận 404 từ `/api/zalo-media`. (cross-layer)
- AC-5: Given thẻ ghép căn có `stage_b_score` và thẻ bổ sung tin có `fields[].confidence`, When dựng sheet và trang, Then
  HTML không chứa số điểm Stage B, chữ «Điểm B», «tự tin», hay số phần trăm nào lấy từ `ai_confidence`/`confidence`/
  `stage_b_score`.
- AC-6: Given thẻ ghép căn với `ai_suggestion` = `yes` và cùng thẻ với `no`, When dựng sheet, Then vùng nút quyết định
  của hai bản giống hệt nhau (cùng thứ tự, cùng variant), và suy luận của AI chỉ hiện trong khối «Suy luận của AI — không
  phải căn cứ» đứng sau bảng so; Given thẻ bổ sung tin với `ai_suggestion` = `apply` và cùng thẻ với NULL, When dựng
  sheet, Then vùng nút hai bản giống hệt nhau và không chỗ nào hiện gợi ý; Given lượt bổ sung tin tạo thẻ mới, When
  `syncReview` chạy, Then dòng `review_queue` mới có `ai_suggestion` NULL. (cross-layer)
- AC-7: Given sheet một thẻ chờ, When ô «Lý do» trống hoặc toàn khoảng trắng, Then mọi nút quyết định tắt kèm gợi ý
  «Ghi lý do trước khi quyết»; Given POST `/api/v1/ops/review/:id/decide` thiếu `reason`, `reason` toàn khoảng trắng hay
  dài hơn 1.000 ký tự, When route chạy, Then trả 400 và không dòng nào của `review_queue`, `property_candidates`,
  `enrichment_proposals`, `ops_audit` đổi.
- AC-8: Given thẻ chờ (ghép căn và bổ sung tin) và `reason` hợp lệ, When quyết approved/rejected/deferred, Then trong
  CÙNG transaction `review_queue.decision_note` = lý do đã cắt khoảng trắng và đúng một dòng `ops_audit` action
  `review.decide` có `detail.ly_do` = lý do đó; Given dòng audit hỏng (ép lỗi INSERT), When quyết, Then ROLLBACK:
  `status` vẫn `pending`, `decision_note` vẫn NULL, route trả 500; và trong `app/`, `agent/`, `pipeline/`, `scripts/`
  chỉ đúng một chỗ ghi action `review.decide` — route decide. (cross-layer)
- AC-9: Given vai viewer ở máy thu và nhánh cloud (bảng `review_queue` vắng), When mở /ops/review, Then hai nhánh hiện
  y như trước vòng (chỉ số thẻ chờ, câu báo), và bộ tải toàn văn + căn cứ không chạy truy vấn nào.
- AC-10: Given dev server với dữ liệu `review_queue` local thật, When chụp sheet ghép căn và sheet bổ sung tin ở 390 px và
  1280 px, sáng và tối, Then thấy được bảng so/căn cứ, toàn văn, ô lý do, nút tắt khi trống; 390 px không cuộn ngang
  (`scrollWidth = clientWidth`).

## Coverage

Quét bằng morphological-scan (preset entity-feature, chạy tự động trong đợt). Trục:

- Loại thẻ: ghép căn | bổ sung tin | loại khác — [thước CE: `review_queue_item_type` CHECK của 029; loại khác giữ dòng
  báo của UI1, ngoài vòng]
- Phần của thẻ: trường + căn cứ | ảnh | toàn văn | tín hiệu máy | quyết định + lý do | audit — [thước CE: câu giao PL3 +
  RV-L04 sáu gạch + RV-L15; NGÀNH: màn gộp bản trùng của Salesforce (so từng trường hai bản ghi) và luồng duyệt có
  bình luận của Label Studio (người duyệt bác kèm lời)]
- Vai × môi trường: quản trị local | Vận hành local | viewer local | cloud — [thước CE: `ops-access.ts` bốn vai +
  `ReviewContent` hai nhánh]
- Độ đủ dữ liệu: đủ | trường không phát biểu / giá trị có trước | không toàn văn | ảnh chỉ URL gốc | đã quyết — [thước
  CE: đo 30/10 trên DB local: 50.278 phát biểu `legacy`, S05 không có toàn văn, ảnh S06 `local=0`]

Core → AC-1…AC-10. Later: đoạn trích tô trong toàn văn + phát biểu mọi nguồn + nhãn đo (PL23); duyệt trên cloud
(TV13); phát biểu cho giá/diện tích/phường. Never: sửa evidence hay `ai_suggestion` cũ trong DB (ghi dữ liệu hàng loạt
cần Mạnh gật từng lệnh, F6); hiện điểm hay độ tự tin dưới tên khác (Q9).

## Out of scope

- OOS-1: Thẻ duyệt v2 — phát biểu của mọi nguồn theo lớp, đoạn trích tô trong toàn văn, bất đồng mọi cặp, quyết định
  thành nhãn đo (PL23, dựng trên PL3).
- OOS-2: Duyệt thẻ trên cloud kèm lý do (TV13).
- OOS-3: Sửa `review_queue.evidence` hay `ai_suggestion = 'apply'` của các dòng đã có.
- OOS-4: Phát biểu (căn cứ có lớp) cho giá, diện tích, giá/m², phường, tầng — ngoài trục của PL15.
- OOS-5: Toàn văn cho S05 và nguồn chưa có bài gốc ở máy thu.

## Đường đo

- «100% dòng `review.decide` mới có `ly_do`»: đếm `ops_audit` action `review.decide` từ lúc app ở máy thu chạy bản đã
  gộp (phiên nghiệm thu ghi sha + giờ khởi động lại app máy thu làm mốc; không lấy ngày gộp PR) theo `detail->>'ly_do'`
  rỗng hay không — AC-7 (không gửi được khi trống) và AC-8 (ghi cùng transaction, route là chỗ ghi duy nhất) bảo đảm số
  đếm đúng.
- «≥ 10 thẻ được quyết»: đếm cùng các dòng audit đó — AC-8.
- «0 thẻ phải mở tin gốc ngoài /ops/review»: người duyệt ghi ở phiên nghiệm thu (`/acceptance-gate:uat-session`) —
  AC-1…AC-4 dựng đủ thứ để không phải mở.

## Notes
