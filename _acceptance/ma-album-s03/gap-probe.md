---
slug: ma-album-s03
at: 2026-11-05T15:35:00Z
verdict: findings
p0: 4
p1: 9
p2: 3
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | decisions, contract, evals | Đường `providerUpdate.albumMeta` không tới handler: handler là internal hook, `toInternalMessageReceivedContext` không chiếu trường này. | Mọi phép thử xanh, sau khởi động lại `album_meta` rỗng 100%. | Đầu ra thật của hàm internal đưa vào handler thật. | Đã sửa, đã chạy lại trên runtime: đổi sang mục `media`, AC-1, AC-2, AC-3, E3, sổ dòng 1. |
| P0 | contract, evals | Thứ tự cho gộp trước khi có cột; bộ nạp chạy từ main, lỗi cột dừng chuỗi nạp. | 00:00 đầu sau gộp S03 ngừng nạp, kênh dùng chung bộ nạp hỏng theo. | Bộ nạp mới trên DB chưa có 077 vẫn nạp. | Đã sửa: AC-5, E5, Notes, sổ dòng 11. |
| P1 | contract, evals | Thiếu thứ tự API; kiểm ở stg lệch tới 24 giờ; AC-6 chưa có mẫu số. | Quên build API thì mất khoá mà vẫn xanh; AC-6 báo nhầm khi album vắt ranh. | Item snapshot có `meta.albumMeta` trong 1 giờ; ca album vắt ranh. | Đã sửa: Notes, AC-6, E6. |
| P1 | contract, evals | Tiền kiểm không xét phiên agent dở; không có ca mention gate. | Recovery chạy tiếp lượt dở lúc khởi động lại; bản vá dời điểm phát hook mà grep vẫn xanh. | Ca phiên dở, ca lượt agent 60 phút; ca album không mention. | Đã sửa: AC-1, AC-7, E1, E7. |
| P1 | contract, evals | Diễn tập không chạy monitor mới; validate có thể lệch cấu hình thật; PID không phát hiện bị đá kết nối. | Diễn tập xanh mà lỗi nạp chỉ lộ trên gateway thật, hoặc đá listener đang thu. | Import động monitor; validate trên bản chép cấu hình thật; log thật không có dòng đóng mới. | Đã sửa: AC-7, AC-9, E9. |
| P1 | contract | Đường lùi chỉ có dist; quy trình lùi bật lại gateway đúng lúc runbook cấm khi agent có lượt. | Lỗi handler không cứu được bằng dist; lùi làm sự cố gửi tin nặng thêm. | Hai hành động tách biệt; diff gồm handler, plugin.json. | Đã sửa: AC-3, AC-8, AC-9, Notes, AC-10 thêm runbook. |
| P1 | contract, evals | Phán lùi chỉ thử hàm thuần; hai log lệch múi giờ; chưa có ai canh; mẫu log có thể lộ tên tài khoản thu. | Phán sai 7 giờ, hoặc không ai chạy; fixture lộ tầng A lên kho công khai. | Lệnh đọc hai tệp thật; quét mẫu 0 tên, ID. | Đã sửa: AC-8, E8, Notes. |
| P1 | evals | E4 xanh cả khi chưa có test album; số phiên bản dùng chung giữa các kênh; `JSON.stringify(null)` có thể cho `'null'::jsonb`. | API không giữ trường mà E4 xanh; snapshot số mới làm bộ nạp khác dừng. | Trỏ đích danh tệp test; `SnapshotWriter` thật; `IS NULL`. | Đã sửa: AC-4, AC-5, E4, E5. |
| P0 | contract | Lượt 2. «Agent 0 lượt» dựa vào dòng timing, mà dòng này chỉ in với lượt chậm; bộ canh cũng chỉ dò chuỗi đó. | Lượt nhanh sau khởi động lại: lệnh phán xanh, XONG ghi 0 lượt, bộ canh không kill. | Lượt nhanh không dòng timing vẫn ra `dung-goi-Manh`. | Đã sửa: AC-7, AC-8, E7, E8, Notes, sổ dòng 13. |
| P0 | contract | Lượt 2. AC-8 lùi rồi bật lại khi bộ canh đỏ, kể cả khi bộ canh kill vì cấu hình nguy hiểm hoặc có lượt. | Lệnh phán bật lại đúng lúc phải dừng. | Mẫu kill kèm có lượt. | Đã sửa: AC-8, E8, Notes. |
| P1 | contract | Lượt 2. AC-1 đòi đủ khoá, trong khi có lần gặp không có tổng. | Bỏ mã đúng ở album lớn mà test mẫu đủ khoá vẫn xanh. | Mẫu theo các tập khoá đã thấy. | Đã sửa: AC-1, E1. |
| P1 | contract | Lượt 2. AC-6 chưa định nghĩa mẫu số; nhóm tổng bằng 1 làm loãng; khoá trần có thể đụng. | Album thiếu 3% vẫn báo dưới 2%. | Mẫu số chỉ tổng từ 2; khoá gom ba phần. | Đã sửa: AC-6, E6. |
| P1 | contract | Lượt 2. Notes đòi dòng `listener connected`, không có trong log hay bản chạy. | Mục kiểm không bao giờ đạt, bị bỏ qua. | Dùng `starting ... provider` cộng `post 202`. | Đã sửa: Notes. |
| P2 | contract | Lượt 2. Gateway thử có thể ghi vào log thật mà bộ canh đang quét. | Dòng thử lẫn vào log thật. | Đo độ dài log thật. | Đã sửa: AC-9, E9. |
| P2 | contract | Lượt 2. Không đòi bản build chưa vá khớp bản đang chạy. | Build lại kéo theo thay đổi ngoài bản vá. | Diff build chưa vá với dist. | Đã sửa: AC-7, E7. |
| P2 | contract | Lượt 2. `ev.media` không phải mảng làm handler ném ngoài `try`; thêm dòng `dbg-media` mỗi tin. | Tin mất; log phình. | Ca không phải mảng. | Đã sửa: AC-3, E3. |
