---
slug: s17-bo-thu-mo-rong
at: 2026-11-26T09:30:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | AC-2 và AC-6 không có đột biến; chiều đỏ của E2, E6 chỉ là lời khẳng định | Sửa client để đợt tiếp tục gửi sau 403, hay ghi tiến độ trước khi chốt lô — nếu ca test chỉ kiểm giá trị trả về thì cả bộ vẫn xanh | Thêm đột biến: bỏ dừng khi 403, bỏ ghi chặn lần một/hai, ghi tiến độ trước chốt, bỏ kiểm DUNG | fixed: probe thêm bo-dung-khi-403 (đỏ 6 ca), bo-dung-han-khi-chan-hai-lan (đỏ 1), bo-kiem-tep-dung (đỏ 4), ghi-tien-do-khi-lo-chua-chot (đỏ «projects: chỉ lưu trạng thái khi snapshot đã chốt»); E2, E6 ghim các dòng ấy |
| P1 | evals | Lệnh chấm chỉ đòi tests ≥ 200 và fail 0; không kiểm skipped, todo, hay ca nêu tên có chạy | Nhánh skip hay xoá các ca an toàn; tổng vẫn ≥ 200 nên E2, E6 xanh rỗng | Khoá tests = 263, skipped 0, todo 0; grep từng tên ca nêu ở expected | fixed: probe khoá SO_CA=263, skipped 0, todo 0; 23 ca nêu tên phải có dòng ✔ |
| P1 | contract | AC-8 chỉ chặn src ngoài S17; không cấm đổi package.json, migration, DATA-CONTRACT, plist; không kiểm cờ --bo-doc-so-du vắng | Nhánh mang thêm dependency, migration hay cờ của 4d026c6d2 mà 8 eval vẫn xanh | Danh sách trắng tệp đổi so merge-base; cấm chuỗi bo-doc-so-du | fixed: probe kiểm mọi tệp đổi so merge-base thuộc danh sách trắng (thư mục S17, test S17, hồ sơ, config.yaml, design doc, bản đồ) và cờ --bo-doc-so-du vắng; AC-8 ghi rõ |
| P2 | contract | Coverage gán trần cỡ và lỗi mạng mà GWT của AC-5, AC-2 không nêu | Bỏ trần cỡ ảnh hay nới máy chủ ngoài mà không AC nào đỏ | Thêm mệnh đề vào GWT và ca nêu tên, hoặc bỏ khỏi Coverage | fixed: AC-2 thêm «nhiều lỗi mạng liền nhau → network-down», AC-5 thêm «khai cỡ vượt trần thì bỏ»; hai ca nêu tên vào E2, E5 và danh sách 23 ca |
| P2 | design | Ba mục Out of scope không có dòng descope; QV-AC-5 không giải thích | Cổng Phạm vi thấy thiếu dòng sổ cho 4d026c6d2, bộ nạp stg_s17_*, triển khai máy thu | Thêm dòng descope có căn cứ; ghi QV-AC-5 là gì | fixed: sổ thêm ba dòng descope (4d026c6d2, bộ nạp/migration/DATA-CONTRACT đi DA58, triển khai sau gộp); Notes của hợp đồng nói QV-AC-5 là ca app đỏ sẵn trên main |
