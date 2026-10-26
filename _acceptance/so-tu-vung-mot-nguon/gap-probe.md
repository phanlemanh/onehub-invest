---
slug: so-tu-vung-mot-nguon
at: 2026-10-26T00:52:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design (sổ d-8) | Thêm CHECK cho properties.property_type ghi nguồn mục-tiêu, nhưng câu trích L08 chỉ nêu hiện trạng; số đếm «năm giá trị» lệch sổ sáu giá trị | Mạnh duyệt tưởng 043 chỉ VALIDATE bốn CHECK 025; giá trị mới từ resolve-properties làm hỏng lượt đêm mà không ai quyết | Dòng S1 mới nguồn chỉ-người (Hỏi) thay d-8; sửa số đếm; AC-7/E7 theo Hỏi | human-gate1: Hỏi-2 ở Cổng Phạm vi (dòng sổ chỉ-người supersedes d-8); số đếm sửa «5/6 giá trị»; AC-7 ghi hai nhánh theo Hỏi-2 |
| P1 | contract AC-1 + evals E1 | Nhãn listing_intent/offer_status chỉ ở sổ, contract không có mục Hỏi; E1 không đo label_vi; nhãn bậc FRAMING không eval nào đo | Mạnh ký mà không thấy nhãn; nhãn gõ sai vẫn xanh E1/E2 | Contract thêm mục Hỏi-1 liệt kê đủ nhãn; E1 thêm ma trận nhãn viết trước assert từng byte | fixed: contract thêm mục «Hỏi ở Cổng Phạm vi» (Hỏi-1, Hỏi-2, tách rõ khỏi Hỏi-1..7 của gói OCP1); AC-1 thêm luật nhãn; E1 thêm ma trận 39 dòng trục·code·nhãn |
| P1 | contract AC-5 + evals E5/E5b | Không có ma trận toàn phần của bảng kiểm kê; chỗ lệch đổi giá trị khi chuyển hằng (route thêm unknown, bench bỏ other) không có dòng sổ; ngưỡng k ≤ 10 vô căn cứ; trùng chữ và tệp chép kit có thể làm lint đỏ oan | Lệch L07 vào ngoại lệ lặng lẽ; route nhận unknown mà suite vẫn xanh; tệp kit làm lint đỏ phải nới ngoại lệ | E5b ma trận viết trước; dòng sổ hành vi unknown; ca enrich unknown; danh sách bỏ qua tệp kit + ca trùng chữ | fixed: AC-5 ghim 6 tệp đọc hằng + tập ngoại lệ đóng; E5b so tập ngoại lệ, ca route bỏ unknown + prompt giữ byte; bỏ ngưỡng k; AC-4/E4 thêm ca trùng chữ + tệp chép kit ngoài vùng quét; dòng sổ giữ hành vi (approach) |
| P1 | evals E9 | Fixture FIELD_TARGET viết tay theo khuôn đoán, không round-trip được (tệp ZCode chưa có); không có ca khuôn không nhận | ZCode viết khuôn khác → bộ kiểm đọc 0 mục, thoát 0 mãi — khoá G3 xanh giả | Ca (e) khuôn lạ hoặc 0 mục → thoát 1 «không nhận khuôn»; khuôn gửi ZCode trước khi coi là đo thật | fixed: AC-9 + E9 ca (e); design khai khuôn đọc. deferred: round-trip với tệp thật — dòng sổ revisit «khi zcode/field-targets có tệp đầu tiên», khuôn gửi ZCode qua liên làn sau Cổng Phạm vi |
| P2 | evals E7, E3 | E7 áp lên DB đã có 043 nên nhánh áp đầu không chạy; E3(5) chỉ đòi ba tệp | Lỗi ở nhánh ADD/CREATE bị che bởi trạng thái DB cũ | E7 dựng lại tiền đề trong giao dịch rồi assert; E3(5) đủ bốn đích | fixed: AC-7 + E7 dựng tiền đề (DROP ref_*, DROP chk properties, ADD lại bốn CHECK NOT VALID) và assert trước khi áp; E3(5) nêu đủ 4 đích |
