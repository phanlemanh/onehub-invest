---
slug: bo-canh-dem-luot-agent
at: 2026-11-05T16:50:00Z
verdict: findings
p0: 2
p1: 8
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract, evals | Kho WAL không kết nối, không tệp phụ đọc bằng `mode=ro` lỗi `unable to open database file`; kho giả của phép thử đều là rollback. | Gateway đóng sạch kết nối, nhịp sau bộ canh báo không đọc được và tắt gateway, lặp lại, mất thu. | Liên làn tái hiện trên kho giả 05/11: `mode=ro` rc 1, `immutable=1` đọc đúng, không sinh tệp. Kho thật lúc đo có tệp phụ. | AC-5, AC-9 thêm ca; kho giả mặc định WAL; ZCode sửa cách đọc. |
| P0 | contract, evals | `.first-done` đặt sau vòng quét, nhánh lần đầu thay mốc đã có. | Lần đầu tắt giữa vòng, bật lại, lượt mới bị tính vào mốc và lọt im lặng. | Theo mã; chưa có ca thử. | AC-2 thêm ca; lần đầu chỉ ghi khi chưa có mốc. |
| P1 | contract, evals | Mốc hỏng rơi vào nhánh WARN, bị thay bằng số mới. | Người sửa mốc gõ sai làm nuốt lượt. | Phản biện tái hiện trên bash 3.2. | AC-6 thêm mốc hỏng, ghi nguyên tử. |
| P1 | evals | Phép thử chưa có bước kiểm bản giả thắng PATH, chưa so trước, sau. | Bản giả thua PATH thì gọi `launchctl`, `pkill` thật. | Đọc mã phép thử. | E9 ghi rõ; ZCode thêm. |
| P1 | evals | Ca sau khi tắt đọc nhật ký cộng dồn. | Lần chạy lại không tắt mà ca vẫn đạt. | Đọc mã phép thử. | E7 đòi xoá nhật ký giữa hai lần. |
| P1 | evals | Thiếu ca: số giảm kèm max tăng, cột đổi tên, lệch khuôn, không ghi mốc, mỗi kho một mốc. | Tiêu chí xanh mà không có phép đo. | Đối chiếu phép thử với tiêu chí. | E3, E4, E5, E6 ghi rõ; ZCode thêm. |
| P1 | contract, evals | Phép kiểm riêng tư gần như rỗng; câu «không ghi vào `~/.openclaw`» sai vì đọc có thể sinh `-shm`. | Lộ nội dung mà phép thử không thấy; hợp đồng khai sai. | Kho giả không có cột nội dung. | AC-7 viết lại, E8 dùng canary. |
| P1 | contract | Có lượt L4d không thấy: `BOOT.md`, incognito. | Tin rằng L4d đếm đủ mọi lượt. | Đọc mã `~/dev/openclaw`, chưa đối chiếu bản chạy. | Notes khai; AC-10 đòi ghi vào tài liệu. |
| P1 | contract, evals | Ca khoá đo trên rollback nên con số 21 giây không áp cho WAL. | Hiểu sai giới hạn. | Phản biện đo: WAL không chặn người đọc. | AC-5, Notes tách hai chế độ. |
| P1 | evals, script | Cách dò bằng ống nối qua `grep -q` dưới `pipefail` trả không khớp khi khối dữ liệu lớn; E2 không chạm đường tắt. | Dòng timing nằm trong khối log lớn bị bỏ sót. | Liên làn tái hiện 400 KB trên bash 3.2: không khớp; khối nhỏ khớp. Chưa đo cỡ khối log thật. | Thêm AC-11, E13, E14. |
| P2 | contract, runbook | Lượt bị `kill -9` có thể khôi phục khi bật lại; thông báo khởi động lại có thể ghi dòng. | Xử mốc xong bật lại vẫn tắt hoặc chạy lại lượt. | Đọc mã, chưa đo. | AC-6 sửa lời; AC-10 đòi kiểm phiên dở. |
| P2 | contract, script | «Mốc thừa vô hại» sai; ghi mốc không nguyên tử; kho biến mất chỉ WARN. | Gộp lại sau lùi tắt gateway ngay; kho đổi chỗ thì L4d mù. | Đọc mã. | Notes sửa bước lùi; AC-6 ghi nguyên tử. Kho biến mất giữ WARN, chấp nhận. |
