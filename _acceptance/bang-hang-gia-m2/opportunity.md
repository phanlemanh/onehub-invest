---
schema_version: 1
slug: bang-hang-gia-m2
feature: Mỗi tin đang rao có giá/m² hợp lệ mang hạng phần trăm trong nhóm sâu nhất đủ căn (hôm nay phường × loại × bán/thuê, thêm số phòng ngủ khi nhóm vẫn đủ), cùng số căn, trung vị, p20, phần trăm dưới trung vị, nhãn và lý do lùi cấp, do pipeline tính sẵn; /ops/deals và /v1/deals đọc bảng này
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh chốt Q1–Q5 «Căn giá tốt theo vị trí» 09/11 («Chốt theo đề xuất»; CG8 đứng đầu — Q5); giám sát đợt dot0-cam-mau ghi ô
decided_at: 2026-11-09T23:37:30Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Phân tích 09/11: ba thước giá (v_ruler_p2_area, v_ruler_p2, market_asset_stats) lệch nhau và chỉ có cấp phường; Mạnh định nghĩa giá tốt là top 20% giá/m² thấp nhất của nhóm, so với trung vị. Chấm một lần ở pipeline thì mọi tổ hợp vị trí và bộ lọc trả lời tức thì (luật 10).

Hàng CG9 trong `docs/plan/lo-trinh.json` (PR #394, bản phạm vi `docs/plan/pham-vi-can-gia-tot-vi-tri-0911.md`). Gánh CG2 (tin S06 vào danh sách, giữ cờ thiếu SĐT) và CG4 (tin thuê) của đợt can-gia-tot-0311. T3: bảng mới bằng migration (đề xuất offer_price_rank, xin số ở sổ giám sát) và đường lên cloud cho /v1/deals. Bước SQL họ 400 (đề xuất 420_price_rank.sql), chạy sau định vị. Q2, Q4: nhóm từ 10 mới gắn nhãn; trung vị chung P1 + P2, mỗi căn một phiếu (khoá gộp căn DA6 khi có). Ở hàng này chỉ có cấp phường nên nhãn là «rẻ trong phường» (Q1); CG10 bật «giá tốt». Trần 35% → «Cần xác minh» giữ; tin phi lý (ON11) bị loại; bait_gap_pct về nghĩa gốc chênh giá câu. Sửa định nghĩa «Căn giá tốt» và «Thước giá» trong CONTEXT.md cùng hàng này theo Q1–Q3.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Trên DB máy thu: số tin được chấm khớp phép đếm SQL độc lập (09/11: khoảng 8,5 nghìn tin bán và 17 nghìn tin thuê trong nhóm từ 10); chạy lại lần hai không đổi số; nhóm 5–9 căn chỉ có số, không nhãn; nhóm dưới 5 không chấm; tin S03 và S06 chung nhóm, mỗi căn một phiếu; tin thuê có hạng theo giá thuê/m²?
- Kết quả nào là SỐNG: [đề xuất] Trên DB máy thu: số tin được chấm khớp phép đếm SQL độc lập (09/11: khoảng 8,5 nghìn tin bán và 17 nghìn tin thuê trong nhóm từ 10); chạy lại lần hai không đổi số; nhóm 5–9 căn chỉ có số, không nhãn; nhóm dưới 5 không chấm; tin S03 và S06 chung nhóm, mỗi căn một phiếu; tin thuê có hạng theo giá thuê/m²
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
