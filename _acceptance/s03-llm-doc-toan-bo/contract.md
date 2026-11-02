---
schema_version: 1
feature: LLM đọc toàn bộ chữ S03 ở lớp đề xuất, tự áp loại hình khi trích dẫn có thật và qua luật; ý định, giá, diện tích chỉ đối chiếu; bất đồng lên /ops/review
slug: s03-llm-doc-toan-bo
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, ui]
status: verified
design_doc: docs/superpowers/specs/2026-11-02-s03-llm-doc-toan-bo-design.md
approved_by: Mạnh
approved_at: 2026-11-03
---

# Acceptance Contract: s03-llm-doc-toan-bo

## Context

Việc 4 của kế hoạch ra mắt 05/11, Mạnh «Chốt, chuyển việc» 15:41:12Z ngày 02/11; đường ghi và tiền chờ duyệt ở cổng này. Lệnh hiện có
không chạy trọn: `enrich-run` chọn tối đa 854/2.772 tin, 50 tin một lượt, cắt 500 ký tự. Toàn bộ test dùng model giả và DB thử,
không tốn tiền. Lượt chạy thật là bước riêng sau chữ ký.

**Lời chốt 02/11 ghi tự áp cả loại hình và ý định. Nháp này chỉ áp loại hình** (Hỏi-1), vì chưa có cột ý định. Hệ quả: tin Yêu cầu máy nhận ra vẫn
nằm trong dữ liệu tới khi có việc lọc riêng; ước 110–140 thẻ. Chọn thêm cột thì AC-5 đổi thành «cột `listing_intent` được áp, `revert_enrichment` gỡ được»
và thêm khoảng một ngày.

## Criteria

- AC-1: Given DB thử có tin S03 bán, thuê, độ tin thấp, đủ trường, tin S05, tin S03 không chữ, When chạy lệnh không cờ giới hạn, Then
  mọi tin S03 có chữ được đọc đúng một lần kể cả có dấu `enrich:thu` trong 30 ngày, tin S05 không được đọc, tin không chữ được đếm riêng.
- AC-2: Given bài dài 1.500 ký tự có SĐT, email, link, When dựng lời gọi model, Then chữ gửi đi không bị cắt ở 500, không còn SĐT, email,
  link, và không chứa tên nhóm; bài có tên miền nguồn thật trong thân thì tên ấy cũng bị gạt trên chữ đến model.
- AC-3: Given tin `unknown`, model trả căn hộ kèm trích dẫn có thật chứa từ khoá căn hộ, When chạy, Then ô loại hình được
  điền qua `apply_enrichment` với actor máy, đề xuất `corroborated` mang mã luật, không có thẻ. Bảng từ khoá đỏ với ma trận viết trước: «gần X», «cạnh X», «cần mua X», hai loại trong một câu.
- AC-4: Given trích dẫn không có trong chữ, trích dẫn có thật nhưng không chứa từ khoá hoặc chứa từ khoá loại khác, hoặc không trả được
  JSON, When chạy, Then loại hình giữ `unknown`, đề xuất `skipped` ghi lý do khi có giá trị, không thẻ; tin đã có loại hình không đổi; E1 trái
  model vẫn lên thẻ xung đột; model trả loại khác căn hộ, dù trích dẫn đúng, thì không tự điền mà lên thẻ.
- AC-5: Given model nói `inquiry` hoặc `not_listing` kèm trích dẫn có thật, When chạy, Then tin có thẻ mang câu trích, tin không bị nghỉ, không
  cột nào của tin đổi; trích dẫn giả hoặc nói `offer` thì không thẻ.
- AC-6: Given model trả giá và diện tích khác bộ đọc, When chạy, Then băm mọi dòng của cột giá, diện tích trước và sau bằng nhau; lệch quá
  10% giá hoặc 3% diện tích kèm trích dẫn có thật lên thẻ, trong ngưỡng thì không; đọc lỗi thì không thẻ.
- AC-7: Given một tin có E1 trái model, ý định bất đồng và giá lệch, chạy lệnh hai lần, When đếm, Then đúng một thẻ chờ `enrich:<offer_id>`, không đề xuất, nhãn, thẻ
  nhân đôi, không gọi model lần hai cho cùng chữ; duyệt thẻ áp bên được chọn của đề xuất, ghi phán quyết đối chiếu đọc lại được trong `ops_audit`, không đổi
  cột giá, diện tích, `retired_at`; `/ops/review` hiện câu trích, loại bất đồng, hai giá trị (cross-layer).
- AC-8: Given trần tiền nhỏ hơn tổng ước, và cờ `--thu`, When chạy, Then lệnh dừng trước bài vượt trần, in đã đọc bao nhiêu còn bao nhiêu, chạy lại đọc
  tiếp phần còn lại; không truyền trần thì trần là 3 USD, model là Haiku; số thẻ mới vượt `--tran-the` (mặc định 500) thì dừng tạo thẻ và báo; `--thu` không ghi dòng nào; lệnh báo lỗi rõ khi không có khoá hoặc không có DB.
- AC-9: Given kết quả sau một lượt có tin `corroborated`, `skipped`, không giá trị, When chạy `--dem`, Then bằng truy vấn đếm độc lập: tử «có đề xuất» là tin S03 sống có
  dòng đề xuất khác `skipped`, tử «có đề xuất kể `skipped`» in riêng, tử «AI đã áp» là tin có đề xuất `e2_llm` `applied`, mẫu là mọi tin S03 sống lúc đếm; chi phí in theo ngày, cờ đỏ khi
  quá 5 USD/ngày; `revert_enrichment` lùi cả lượt trả loại hình về `unknown`; ma trận chỗ gọi và các bộ test xanh.
- AC-10: Given tệp nhãn loại hình có sẵn và cờ `--mau N`, When chạy lệnh với model giả cho nhãn biết trước, Then in độ đúng các ca máy áp kèm cận dưới Wilson, tỉ lệ áp được, số
  thẻ dự kiến, chi phí; thoát khác 0 và không ghi canonical khi dưới ngưỡng `--nguong-dung` (mặc định 0,85 trên ít nhất 100 ca); lượt chạy thật từ chối chạy nếu chưa có dòng mẫu đạt ngưỡng cho cùng `prompt_version`.

## Coverage

Bỏ quét không gian (dòng `descope` trong sổ) — bốn trục liệt tay:

- Trục A — tin vào lượt: bán · thuê · độ tin · đủ trường · S05 · không chữ · đã thử → AC-1
- Trục B — trường: loại hình áp · ý định đối chiếu · giá, diện tích đối chiếu → AC-3, AC-4, AC-5, AC-6
- Trục C — trích dẫn: thật có từ khoá · thật không từ khoá · từ khoá loại khác · giả · hỏng JSON → AC-3, AC-4, AC-5
- Trục D — vận hành: chạy lại · trần · thử · đếm · hoàn tác · mẫu đo độ đúng → AC-7, AC-8, AC-9, AC-10
- Later: lịch đêm cho tin mới; lọc tin `inquiry` khỏi cổng; đọc nhiều bài của một tin; đề xuất PN, WC, đường, toà.
- Never: AI ghi giá hoặc diện tích; gửi tên nguồn thật ra ngoài.

## Đường đo

- ≥ 90% tin có đề xuất; ≥ 50% có AI đã áp; cuộc gọi thành công ≥ 95%; chi cloud ≤ 5 USD/ngày: `doc-toan-bo-s03 --dem` trên DB máy thu sau lượt chạy thật (AC-9
  bảo đảm số đúng). Hợp đồng này chứng lệnh đúng; đạt đích hay không chỉ biết sau lượt chạy thật.
- Giá, diện tích không bị AI ghi đè: AC-6.

## Out of scope

- Lượt chạy thật trên DB máy thu và lượt mẫu trả phí: bước riêng, chỉ khi có lời Mạnh ở Cổng Phạm vi; `pg_dump` trước.
- Lịch đêm cho tin mới (Hỏi-5): sau lượt đầu tin mới không có đề xuất, tỉ lệ giảm dần.
- Cột `listing_intent` và lọc tin Yêu cầu khỏi cổng (Hỏi-1).
- Sinh đề xuất mới cho PN, WC, đường, toà (Hỏi-4).
- Đẩy Supabase; đổi giao diện `/ops/review` ngoài khối đối chiếu trong thẻ.

## Notes
