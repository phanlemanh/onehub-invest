---
slug: s03-thu-lai-tin-roi-oan
at: 2026-11-28T04:10:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ phần C (giá từ 1 tỷ suy là bán) ghi nguồn mục-tiêu; câu trích chỉ loại khả năng thuê, không quyết giữa bán và bỏ; chạm listings/sale; 636/779 bài chưa nhãn | Người duyệt tưởng luật đã ký quyết luôn; số đọc nhầm từ 1 tỷ lên listings/sale; mẫu 20 tin chỉ trúng khoảng 5 tin phần C | Dòng sổ chỉ-người mang supersedes; mẫu phân tầng 10 tin phần C có ngưỡng | human-gate1: dòng sổ mới d-20261127T181241Z-9 (chỉ-người, supersedes -5) thành Hỏi ở Cổng Phạm vi; AC-5/AC-6 thêm 10 tin phần C, ngưỡng ≥ 9/10 |
| P0 | design | Dòng sổ bỏ coverage-scan ghi nguồn mục-tiêu; câu trích AGENTS.md chỉ bắt lập bảng phủ ca, không quyết thay quét hình thái | Dạng viết tắt ngoài 13 bài mẫu vẫn rơi oan mà hồ sơ không gọi tên | Dòng chỉ-người hoặc AC-5 in 20 bài còn rơi có dấu hiệu BĐS | human-gate1: dòng sổ mới d-20261127T181241Z-10 (chỉ-người, supersedes -7); AC-5 in 20 bài còn rơi có dấu hiệu BĐS, AC-6 ghi dạng chữ bỏ sót |
| P1 | contract | AC-5 so trạng thái DB trước với sau một lượt transform, không có lượt luật cũ trên cùng bản chép; phần chênh lẫn trôi dữ liệu | Raw chưa nạp hay tin nghỉ PL14 làm ngưỡng 150 xanh hay đỏ không vì luật | Khối trước = transform bằng luật cũ tiêm trên cùng bản chép | fixed: AC-5 và E5 chạy hai lượt trên cùng bản chép (luật cũ tiêm như AC-4, rồi luật mới), thước là hiệu, in tin rò thêm |
| P1 | evals | E6 đọc tệp evidence còn E5 ghi ra .acceptance-runs; AC-5 hứa ghi evidence | Hội đồng chấm tệp vắng hay bản cũ không khớp lượt E5 | Ghim một đường, tệp mang sha và hạt giống | fixed: AC-5 ghi .acceptance-runs, cờ --ghi-evidence chép bản nộp vào evidence (như PL42); đầu tệp mang sha cây và hạt giống, E6 chép dòng ấy |
| P2 | contract | AC-5 không khai trường bắt buộc của tệp mẫu | Người chấm không thấy chữ bài, không phán được | Liệt trường, thoát 1 «mẫu thiếu trường» | fixed: AC-5 liệt sáu trường mỗi mục và mã thoát «mẫu thiếu trường»; E5 expected ghim |
