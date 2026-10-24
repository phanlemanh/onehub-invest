---
schema_version: 1
feature: "Người vận hành mở «Kiểm chất lượng» trên /ops/quality thấy bản mới nhất của mỗi kiểm theo từng thực thể, số kiểm đếm đúng, và kết quả độ phủ không ghi «Đạt» xanh khi độ phủ 0%"
slug: dq-moi-nhat-moi-kiem
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: draft
design_doc: docs/superpowers/specs/2026-10-24-dq-moi-nhat-moi-kiem-design.md
approved_by:
approved_at:
---

# Acceptance Contract: dq-moi-nhat-moi-kiem

## Context

Bảng «Kiểm chất lượng» trên `/ops/quality` lấy 20 kết quả kiểm mới nhất: một kiểm chạy dày (độ phủ tham chiếu) chiếm hết
20 dòng nên các kiểm khác không hiện, header «20 kiểm» là số dòng cắt, và dòng độ phủ 0% mang «Đạt» xanh vì «đạt» của kiểm
ấy nghĩa là có số tham chiếu tươi. Vòng này lấy bản mới nhất theo từng (kiểm, đối tượng), đếm đúng số loại kiểm, và gắn nhãn
kết quả theo nghĩa thật của từng kiểm. Cổng Đáng `build`: giám sát đợt `dot0-cam-mau` (P4-14) theo lệnh Mạnh 24/10.

Căn cứ: `docs/plan/lo-trinh.json` ON9 · `docs/plan/pham-vi-ops-noi-that-2410.md` OPS-10.

Source input: `_acceptance/dq-moi-nhat-moi-kiem/opportunity.md` · hàng ON9 của lộ trình.

## Criteria

- AC-1: Given nhiều lần kiểm cho cùng một (kiểm, đối tượng) trong 7 ngày, When trang lấy bảng «Kiểm chất lượng», Then mỗi
  (kiểm, đối tượng) có đúng một dòng là lần kiểm mới nhất, và lần kiểm cũ hơn 7 ngày không có.
- AC-2: Given một kiểm có nhiều kết quả mới hơn mọi kiểm khác (nhiều hơn 20 dòng), When trang lấy bảng, Then mọi loại kiểm
  có kết quả trong 7 ngày đều hiện, không loại nào bị đẩy ra ngoài.
- AC-3: Given bảng đã lấy, When trang ghi số ở đầu trang, Then hai mục «<n> kiểm» và «<m> đối tượng» với n là số loại kiểm
  khác nhau và m là số dòng của bảng — không phải số dòng bị cắt — và trang lấy bảng lẫn số qua cùng một nguồn.
- AC-4: Given kết quả kiểm độ phủ tham chiếu, When bảng vẽ ô kết quả, Then «đạt» của kiểm ấy hiện «Có số tham chiếu» và
  «không đạt» hiện «Thiếu số tham chiếu» (chữ và màu theo Hỏi-1), không ô nào của kiểm ấy — ở bất kỳ trạng thái nào —
  mang nhãn «Đạt» hay màu xanh lá; các kiểm khác hiện «Đạt» (xanh lá), «Cảnh báo», «Không đạt», «Bỏ qua» theo trạng thái.
- AC-5: Given dữ liệu thật trên DB local, When chạy phép đo chỉ đọc, Then bảng có từ hai loại kiểm trở lên, mỗi (kiểm, đối
  tượng) một dòng, số kiểm in ra bằng số loại kiểm, có ít nhất một dòng kiểm độ phủ tham chiếu, và không dòng nào của nó
  mang nhãn «Đạt» hay màu xanh lá.
- AC-6: Given người đọc từ điển sản phẩm, When tra «Kiểm chất lượng» và «Có số tham chiếu», Then `CONTEXT.md` có mục cho
  cả hai (nhãn · code · định nghĩa · tránh dùng), nói rõ «có số tham chiếu» không có nghĩa là độ phủ đạt. (judgment)

## Coverage

Bỏ quét morphological-scan — xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Trục liệt tay:

- Trục A — chọn dòng: nhiều lần cùng cặp · cặp khác đối tượng · quá 7 ngày · kiểm chạy dày đè kiểm thưa → AC-1, AC-2
- Trục B — số trên trang: số loại kiểm · số đối tượng → AC-3
- Trục C — nhãn kết quả: kiểm độ phủ tham chiếu (pass/fail) · kiểm khác (pass/warn/fail/skip/lạ) → AC-4
- Trục D — dữ liệu thật + từ điển → AC-5, AC-6
- Later: diễn giải «Chi tiết» tiếng Việt (ON12).
- Never: đổi tên kiểm trong pipeline ở vòng này.

## Đường đo

- Thước: «DB có ≥2 loại kiểm: bảng hiện đủ loại, mỗi (kiểm, thực thể) một dòng mới nhất» · số từ:
  `node scripts/dq-moi-nhat-do.mjs` trên DB local và test `dqLatestSql()` · bảo đảm bởi: AC-1, AC-2, AC-5
- Thước: «dòng độ phủ 0% không mang badge xanh» · số từ: test vẽ bảng (AC-4) và `scripts/dq-moi-nhat-do.mjs` · bảo đảm
  bởi: AC-4, AC-5

## Out of scope

- Diễn giải cột «Chi tiết» sang tiếng Việt (ON12).
- Vùng «Hiệu chuẩn» của /ops/quality (ON10).
- Độ phủ, độ tươi của /ops/quality trên cloud đọc số tổng hợp (AU12).
- Đổi tên hay ý nghĩa kiểm độ phủ tham chiếu trong pipeline (chung tệp với NT7).

## Notes
