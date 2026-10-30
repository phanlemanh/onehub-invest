---
slug: the-duyet-phuong-lech-gia
at: 2026-10-30T08:52:06Z
verdict: findings
p0: 0
p1: 1
p2: 4
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | design + evals (E1) | Bỏ tiền tố `phuong-` sau khi bỏ dấu ăn mất chữ đầu của tên phường bắt đầu bằng «Phương…»; ma trận E1 và probe không có tên lớp này | `phuong-liet` thành `liet`, «Phường Phương Liệt» thành `phuong-liet` → Lệch dù cùng phường | Đếm tên như tiền tố trên `areas`; thêm cặp Phương Liệt/Phương Mai vào E1 kèm chiều đỏ; probe phủ toàn bộ area | fixed: đo `areas` có «Phương Liệt», «Phượng Dực»; design đổi thứ tự (bỏ tiền tố trên chuỗi còn dấu rồi mới bỏ dấu); E1 thêm 3 cặp và chiều đỏ ghim «phuong-liet ↔ Phường Phương Liệt»; E7 phủ mọi area |
| P2 | evals (E7) | Thước của probe dùng chung slugifyName với hàm đang đo, nhận «hay»; nhánh khác phường không có chốt riêng | Dữ liệu thẻ thật chỉ có cặp cùng phường, nhánh Lệch xanh suông; Khớp giả giữa hai phường không bị bắt | Đuôi area.id làm mốc duy nhất; chốt ≥ 1 riêng mỗi nhánh; mọi cặp area khác nhau cùng thị trường phải Lệch | fixed: E7 viết lại — mốc là đuôi area.id, nhánh cùng phường hai dạng ghi trên mọi area, nhánh khác phường trên mọi cặp area cùng parent_id, mỗi nhánh chốt ≥ 1 ghim riêng; AC-6 sửa theo |
| P2 | design + contract (AC-4) | Khoá rỗng khi chuỗi gốc chỉ có tiền tố không được định nghĩa | «P.» ↔ «Phường» cho hai khoá rỗng bằng nhau → Khớp giả | Ma trận chỉ-tiền-tố kỳ vọng không bao giờ Khớp, chiều đỏ ghim | fixed: design và AC-4 định nghĩa khoá rỗng là Thiếu; E4 thêm ma trận 4 cặp chỉ-tiền-tố và chiều đỏ; sổ thêm dòng quyết định |
| P2 | contract (AC-3) + sổ d-4 | AC-3 nói «không bao giờ Khớp chỉ vì cùng số» nhưng vẫn Khớp khi hai chuỗi số giống hệt; d-4 ghi một-lối | Hai tin «Phường 12» ở hai quận vẫn Khớp, Cổng Phạm vi tưởng ô đã phủ | Ghim nhãn cho «Phường 12» ↔ «Phường 12»; viết Then theo lối chọn | fixed: AC-3 viết lại thành «so đúng như trước vòng»; E3 ghim cặp giống hệt là Khớp và so với soGiaTri trên chuỗi gốc; OOS-5 nêu ca cùng số khác quận; dòng sổ mới (supersedes d-4) lấy căn cứ câu Ngoài-1 — vòng chỉ sửa Lệch giả |
| P2 | design (sổ d-3) | d-3 ghi một-lối mà lối area_id chưa chết; câu «cho cùng kết quả» sai ở lớp «Phương…» | Cổng Phạm vi không thấy lối area_id | Thay bằng câu hỏi người hoặc nêu ràng buộc giết từng lối; bỏ câu «cho cùng kết quả» | fixed: dòng sổ mới (supersedes d-3) nêu ràng buộc kiểm được — vùng giám sát giao chỉ là review-can-cu.ts + test, ghi area_id là sửa bên sinh thẻ ở agent/; design bỏ câu «cho cùng kết quả», ghi đường area_id là Later |
