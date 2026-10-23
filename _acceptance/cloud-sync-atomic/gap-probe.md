---
slug: cloud-sync-atomic
at: 2026-10-23T02:04:00Z
verdict: findings
p0: 1
p1: 4
p2: 2
---

# Phản biện context sạch — cloud-sync-atomic

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals E1, contract AC-1 | E1 không phân biệt tráo nguyên tử với tráo nhanh không nguyên tử: không buộc lần đọc nào rơi vào lúc giao dịch tráo mở; fixture lượt mới có thể trùng lượt cũ; chiều đỏ duy nhất là TRUNCATE (cửa sổ dài) | Code gửi DELETE và INSERT thành hai lời gọi; trên DB mô phỏng khoảng trống vài ms lọt giữa nhịp đọc 100ms nên E1 xanh, trên cloud thật trễ HTTP làm prod lại thấy rỗng | Móc thử giữ giao dịch mở 2s; đếm lần đọc trong lúc giao dịch mở qua pg_stat_activity; chiều đỏ thứ hai gửi từng câu tự COMMIT; fixture cũ khác mới ở mọi bảng + view | fixed: AC-1 + E1 viết lại đúng thước đề xuất (móc thử ≥2s, ≥5 lần đọc trong giao dịch mở, chiều đỏ ĐỎ-ĐÚNG non-atomic, fixture số dòng cũ ≠ mới) |
| P1 | design, contract AC-4, sổ d-1 | Luật xoá dòng giữ-chỗ không còn ở local kéo theo CASCADE xoá saved_markets — xoá dữ liệu người dùng mà sổ ghi máy quyết, kho_dao false | Pipeline local đang dựng lại areas đúng lúc sync đọc, kiểm số staging vẫn khớp, giao dịch COMMIT và CASCADE xoá hết mục đã lưu trên prod | Tách thành câu chỉ-người kho_dao true; thêm ca local areas thiếu một phần/trống | fixed: Hỏi-3 (d-…-10, chi-nguoi, kho_dao true) + chặn tụt 50% trong AC-4/E4 + đọc local một snapshot REPEATABLE READ (d-…-11) |
| P1 | contract AC-2, design bước 5, E2 | AC-2 hứa dọn staging ở lượt kế nhưng design chỉ dọn staging quá 2 giờ; không nói lượt gãy tự xoá staging của mình | E2 chỉ xanh khi fixture lùi giờ tay; hoặc hạ ngưỡng làm xoá nhầm staging của lượt đang chạy chồng | AC-2 ba vế: tự xoá theo run_id khi lỗi bắt được; kill -9 thì dọn khi quá ngưỡng (lùi giờ trên dòng writer thật ghi); staging dưới ngưỡng của lượt khác không bị đụng | fixed: AC-2 (a)–(d) + E2 viết lại đúng ba vế, ngưỡng 2 giờ thống nhất design/contract |
| P1 | evals E6, contract AC-6 | Khẳng định âm «anon không quyền» không có chiều đỏ; DB mô phỏng không chép default ACL của cloud; «chỉ nhắc sync_stage» là đo chuỗi có mặt | Migration thiếu REVOKE vẫn xanh vì DB mô phỏng chưa cấp gì cho anon; trên Supabase payload sale_offers đọc được bằng anon key | Dựng default ACL theo số đo cloud; chiều đỏ bỏ REVOKE; so catalog trước/sau | fixed: AC-6 + E6 (ALTER DEFAULT PRIVILEGES cấp ALL cho anon/authenticated, chiều đỏ ĐỎ-ĐÚNG acl, so catalog ngoài sync_stage) |
| P1 | contract trục B/C, evals | Các ô cloud lệch schema (cột chỉ local, cột chỉ cloud, cột generated, chưa có sync_stage) không có eval chạy thật | Cột generated hoặc thiếu cột làm INSERT trong tráo gãy mọi lượt — cloud đứng im vô hạn; hoặc code có đường lùi tự tạo schema mà hội đồng không thấy | Cấy bốn biến thể vào DB mô phỏng; ca chưa có sync_stage soát nhật ký exec không có DDL | fixed: AC-3 (i)(ii) + AC-2 (c) + E3/E2 cấy biến thể; nhật ký exec soát CREATE/ALTER/DROP/TRUNCATE |
| P2 | contract, evals E3/E5 | Contract/evals chọn sẵn đáp án Hỏi-1, Hỏi-2 | Gate 1 chọn (b) hoặc «để việc riêng» thì AC-3/5/E3/E5 mâu thuẫn | Nhánh theo đáp án | deferred: Notes của contract ghi rõ AC/eval sửa theo đáp án rồi duyệt lại Cổng Phạm vi |
| P2 | evals E7 | Local tĩnh nên không thấy lượt đọc sớm ghi đè lượt đọc muộn | Lượt đọc local sớm hơn COMMIT sau, đè dữ liệu mới hơn | Ghi read_at, từ chối lượt cũ hơn | fixed: sync_stage.swaps + vế mới của AC-7/E7 (d-…-11) |
