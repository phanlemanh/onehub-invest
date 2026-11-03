---
slug: sdt-s06-ghep-tai-khoan
at: 2026-11-02T16:00:00Z
verdict: findings
p0: 4
p1: 1
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Căn cứ S1 sai: rút số và phần hiển thị ghi `kho_dao:false`; Hỏi-1, Hỏi-2 không có trong hợp đồng; băm rời máy không được nói; `pg_dump` bị bỏ; lời khuyên thứ tự tự mâu thuẫn; d-2 và d-4 căn cứ không quyết lựa chọn. | Mạnh ký khi tưởng không gì rời máy; số ghép lên Invest không nhãn sau #274. | Hợp đồng có mục Hỏi kèm lối khác; sổ sửa `kho_dao` và căn cứ. | fixed: thêm mục Quyết định chờ Mạnh (Hỏi-1, 2, 3), AC-9 khai băm, thứ tự viết thành một câu kèm `pg_dump`; sổ thêm dòng supersedes cho d-2, d-4, d-6, d-7, d-8. Câu trả lời của người chờ Gate 1. |
| P0 | evals | E8 không có cận dương: nhánh chưa áp 068 cho mọi số bằng 0 mà vẫn xanh; âm tính không đối chứng. | `--thu` không gán gì, exit 0, PASS. | `--thu` tự áp 068, `ghep > 0` khớp câu đếm độc lập, đối chứng đỏ COMMIT và cấy số. | fixed: AC-8 và E8 viết lại. |
| P0 | evals | Trục sau phân xử không có chuỗi gán, phân xử, gán; fixture tự dựng; E3 một ca đủ xanh; thiếu tag cross-layer; 068 chép thân hàm có thể nuốt logic bản sau. | Upsert hoặc phân xử đổi xuất xứ ở lượt thật mà test vẫn xanh; 067 và 068 đè nhau. | Ca chuỗi qua `runTransformChotot`, tách E3, so mọi khoá với bản trước 068. | fixed: AC-1, AC-3, AC-4 viết lại, tag đủ; 068 đổi thành vá định nghĩa đang chạy thay vì chép thân, vì 067 của SV2 cũng định nghĩa lại hàm. Fixture stg theo hợp đồng v5, dữ liệu thật do E8 đi qua. |
| P0 | contract | Ma trận không có thật, chưa ghim số ô; hai ô chưa quyết; `tu_tin` không được đo quan hệ. | Test chọn 12 ô vẫn xanh; số nhập tay bị đè và dán `fact`. | Bảng ô trong hợp đồng, tích Đề-các, `ghep_lech_tu_tin`. | fixed: bảng 88 ô L1-L9 (trục tài khoản thêm trống mã); chốt: số riêng thắng trực tiếp cũ và ghép, không đè không rõ gốc; E2, E8 đo `tu_tin`. |
| P1 | contract | Vắng `phone_hidden` có thể là chưa biết; thiếu giá trị mã tài khoản trống. | Tin người bán đã ẩn mà chưa gọi nhận số ghép; mã rỗng gom một nhóm. | Nêu nguồn sinh cờ, đo; thêm ô mã trống. | fixed: đo 02/11: cờ có từ lượt thu danh sách, trước khi gọi số, bộ thu loại tin mang cờ ngay ở câu chọn; 7.651 `true`, 44.343 vắng, 0 `false`; mã trống 0 dòng, thêm vào ma trận với kết quả không ghép. |
