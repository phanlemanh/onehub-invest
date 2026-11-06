---
slug: enrich-nguoi-s03
at: 2026-11-06T00:45:00Z
verdict: findings
p0: 3
p1: 2
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ ghi số suy vào cột seller_phone của tin là máy quyết, trích một dòng code — không quyết được trước lời Mạnh «không vá thẳng vào tin»; lối đọc qua Người lúc phục vụ vẫn sống | Mạnh ký Hỏi-1 đến Hỏi-5, tưởng tin không bị vá; transform ghi seller_phone S03 rồi lên cloud | Thành câu hỏi chi-nguoi có hai lối và giá | human-gate1: Hỏi-6, dòng sổ mới supersedes d-20261106T003908Z-2 |
| P0 | evals | Trạng thái «079 chưa áp, bảng party_contacts chưa có» không AC nào đo; E5 chỉ ghi đè view | Sau khi gộp, launchd chạy transform S03 và buocDem, đọc bảng chưa có, lượt transform hỏng, dungNguoi rollback | Ô mới chạy runTransformZalo và buocDem thật trên lược đồ bản 078, chiều đỏ bỏ rào | fixed: AC-5 thêm Given/Then, E5 thêm ô chua-ap-079 cùng chiều đỏ, design §5 thêm rào bảng chưa có, dòng sổ fix |
| P0 | contract | Dòng bỏ design-pass nói không có trạng thái mới, nhưng thẻ S03 sẽ có hai nhãn cùng chữ — tổ hợp chưa từng có; contract không ghi đã bỏ | Gate 1 duyệt UI bằng chữ mà không biết; người xem lẫn hai nhãn | Hỏi ở Gate 1; E7u chụp nguyên thẻ có hai nhãn và hai popover | human-gate1: Hỏi-7, dòng sổ mới supersedes d-20261106T003908Z-5; fixed: E7u thêm hai ảnh, Notes ghi chưa chạy design-pass |
| P1 | contract | Trục lớp liệt sync/cloud mà không eval nào đo đường lên cloud | Lượt rút chỉ đổi local, cloud giữ số cũ kèm Badge | Ô dry-run chọn dòng của sync-cloud | rejected: sync-cloud không chọn dòng theo dấu — nó dựng lại toàn bộ view sale_offers qua sync_stage mỗi lượt (thêm, sửa, xoá theo khoá), nên gán và rút đi như mọi đổi cột; cột seller_phone_inferred tới cloud đã được E6 của so-ghep-s06-nhan-danh-ba chứng; vòng này không đổi tệp sync |
| P1 | evals | E8 chỉ đòi gan > 0, không đối chiếu số đã dùng để quyết Hỏi-2, Hỏi-3 | Bộ dựng chỉ chạy bậc 1, gán ~150 tin, E8 vẫn xanh | So từng rule và bán/thuê với mốc 06/11, ±15% | fixed: AC-8 và E8 thêm đối chiếu ±15% quy đổi theo số tin sống, ca đột biến tắt rule so_trong_bai |
