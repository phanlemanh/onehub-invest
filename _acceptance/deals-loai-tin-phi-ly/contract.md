---
schema_version: 1
feature: "Người vận hành mở «Căn giá tốt» /ops/deals không thấy căn có diện tích hay số phòng phi lý, danh sách không dồn ở trần giảm giá, và thẻ ghi «đăng 1 lần» thay «mới»"
slug: deals-loai-tin-phi-ly
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api, ui]
status: signed-off
design_doc: docs/superpowers/specs/2026-10-24-deals-loai-tin-phi-ly-design.md
approved_by: Mạnh
approved_at: 2026-10-24T12:02:57Z
---

# Acceptance Contract: deals-loai-tin-phi-ly

## Context

«Căn giá tốt» trên `/ops/deals` hôm nay dồn 30/30 thẻ ở mức giảm 40–50%, lẫn tin diện tích/số phòng phi lý (36 m² 3PN)
và tin không có diện tích mà vẫn có giá/m²; nhãn «mới» thật ra nghĩa là «chưa đăng lại». Vòng này thêm một luật loại tin
phi lý xác định ở pipeline có dòng audit, cho trang đọc số giảm đã tính sẵn, đẩy tin giảm sát trần xuống cuối kèm nhãn
«cần xác minh», và sửa nhãn đăng lại. Cổng Đáng `build`: giám sát đợt `dot0-cam-mau` (P4-10) theo lệnh Mạnh 24/10.

Căn cứ: `docs/plan/lo-trinh.json` ON11 · `docs/plan/pham-vi-ops-noi-that-2410.md` OPS-12 · `docs/plan/BOI-CANH.md` §4
dòng ON11 ↔ PL26, UI10.

Source input: `_acceptance/deals-loai-tin-phi-ly/opportunity.md` · hàng ON11 của lộ trình.

## Criteria

- AC-1: Given một tin rao, When chấm bằng luật loại tin phi lý, Then trả đúng lý do theo ma trận viết trước — không có
  diện tích → «thieu-dien-tich»; diện tích ngoài 10–1000 m² → «dien-tich-ngoai-khoang»; quá 10 phòng ngủ →
  «phong-ngu-ngoai-khoang»; diện tích chia số phòng ngủ dưới 20 m² → «phong-qua-nho»; còn lại → không lý do.
- AC-2: Given tin P1 phi lý và tin hợp lý cùng phường có thước, When bước đêm tính giảm giá chạy, Then tin phi lý mất số
  giảm giá (không còn là căn giá tốt), tin hợp lý giữ đúng số giảm, và có đúng một dòng audit `bait-gap:loai-phi-ly`
  nêu tổng, số theo từng lý do và mã các tin bị loại; một tập toàn tin hợp lý thì không ghi dòng nào; số tổng hợp của
  người bán (trung vị giảm giá, số căn giá tốt của người bán) giữ y như khi chưa có luật loại.
- AC-3: Given số giảm giá đã tính sẵn ở pipeline, When trang «Căn giá tốt» lấy danh sách, Then số giảm trên thẻ là đúng
  số đã tính sẵn (trang không tự tính lại), tin không có số giảm không lên danh sách, và ngưỡng 5%–50% vẫn áp.
- AC-4: Given các tin đủ điều kiện có cả tin giảm ≤ 35% và tin giảm > 35% — kể cả khi tin > 35% nhiều hơn số thẻ trang
  lấy —, When trang lấy và sắp danh sách, Then mọi tin ≤ 35% đứng trước mọi tin > 35% (sắp trước khi cắt số thẻ), mỗi
  nhóm giảm dần, và tin > 35% mang cờ cần xác minh.
- AC-5: Given lược đồ như cloud — không có bảng tin Zalo, không có các cột người bán mà cấu hình sync giữ lại máy —,
  When trang lấy danh sách, Then câu truy vấn bản cloud chạy được và cho cùng dãy tin, cùng thứ tự với bản đầy đủ trên
  lược đồ local; và cột số giảm giá nằm trong danh sách cột được đưa lên cloud.
- AC-6: Given thẻ một tin hiện trên trang, When thẻ được vẽ, Then tin rao đăng một lần ghi «đăng 1 lần», tin rao đăng n lần ghi
  «đăng n lần», không thẻ nào còn chữ «mới»; thẻ tin cần xác minh có nhãn «cần xác minh», thẻ tin thường không có.
- AC-7: Given dữ liệu thật trên DB local, When chạy bước tính giảm giá rồi lấy danh sách trong giao dịch huỷ ngay sau
  đó, Then danh sách không còn tin thiếu diện tích hay phòng quá nhỏ, đầu danh sách không phải tin giảm > 35% khi DB còn
  tin đủ điều kiện ≤ 35%, số tin bị loại theo từng lý do và số giảm của 5 tin đầu được in ra; DB không đổi sau lượt đo.
- AC-8: Given người đọc từ điển sản phẩm, When tra «cần xác minh» và «đăng 1 lần», Then `CONTEXT.md` có mục thuật ngữ
  cho tin cần xác minh (nhãn · code · định nghĩa · tránh dùng) khớp nghĩa trên thẻ. (judgment)

## Coverage

Bỏ quét morphological-scan — xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Trục liệt tay trên thực thể
«tin trong danh sách Căn giá tốt»:

- Trục A — trường làm tin phi lý: diện tích vắng · diện tích ngoài khoảng · số phòng ngoài khoảng · diện tích/phòng quá
  nhỏ [thước CE: OPS-12 — SUY-TỪ-REPO `docs/plan/pham-vi-ops-noi-that-2410.md`] → AC-1, AC-2
- Trục B — chỗ số giảm giá sống: pipeline tính · trang đọc · bản cloud [thước CE: luật 10 AGENTS.md — SUY-TỪ-REPO] →
  AC-2, AC-3, AC-5 (số tổng hợp người bán giữ nguyên: AC-2)
- Trục C — thứ tự: tin thường · tin sát trần · ngưỡng 5%/50% [thước CE: guard `≤ 50` của `app/src/lib/deals.ts` —
  SUY-TỪ-REPO] → AC-3, AC-4
- Trục D — chữ trên thẻ: số lần đăng · cờ cần xác minh · từ điển [thước CE: luật đặt tên AGENTS.md — SUY-TỪ-REPO] →
  AC-6, AC-8
- Trục E — dữ liệu thật: phép đo trên DB local, không để lại dòng nào → AC-7
- Later: thước phường × loại hình (PL26) — khi có, ngưỡng m²/phòng và ngưỡng nghi ngờ có thể theo loại hình.
- Never: luật loại bằng model (luật 7 — LLM ngoài đường dữ liệu).

## Đường đo

- Thước: «tin 36 m² 3PN hay thiếu diện tích không lên danh sách, có dòng audit lý do» · số từ: `node scripts/deals-phi-ly-do.mjs`
  trên DB local (đếm theo lý do) và test `refreshBaitGap` (dòng `ops_audit`) · bảo đảm bởi: AC-1, AC-2, AC-7
- Thước: «đầu danh sách không còn dồn ở mức trần guard» · số từ: `node scripts/deals-phi-ly-do.mjs` (giảm giá của 5 tin
  đầu, in ra) · bảo đảm bởi: AC-4, AC-7

## Out of scope

- Thước theo phường × loại hình (PL26).
- Khung trang, lọc, phân trang, đếm và câu chữ người bán tầng C của `/ops/deals` (UI10 / OPS-16).
- Sửa parser S03 cho diện tích, số phòng (làn trích xuất).
- Đưa «Căn giá tốt» lên cổng Invest.

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-10-24:
  - Ngoài-1: nếu bước tính đêm hỏng giữa chừng, vài căn có diện tích hay số phòng phi lý có thể hiện lại trên «Căn giá tốt» tới lượt đêm sau.
  - Ngoài-2: mục «Chênh giá câu» trong từ điển và giải thích cột trong mappings.yaml chưa ghi rằng tin phi lý bị bỏ số giảm.
  - Ngoài-3: nhãn % giảm và nút gọi trên thẻ còn kiểu cũ, chưa theo bộ thành phần chuẩn — để UI10 làm lại trang.
  - Ngoài-4: khi truy vấn đầy đủ gặp lỗi bất ngờ, trang lặng lẽ hiện danh sách không có liên hệ, ảnh, nội dung tin.
