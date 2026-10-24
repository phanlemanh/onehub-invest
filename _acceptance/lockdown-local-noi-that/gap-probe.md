---
slug: lockdown-local-noi-that
at: 2026-10-24T05:30:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-3 gộp hai lựa chọn (đọc theo gốc kho; tệp vắng ra «Chưa kiểm được» thay «Hỏng») và ghi máy quyết, trong khi hạ báo động an toàn Zalo từ đỏ xuống xám là việc chỉ người quyết; nhánh «đọc được» không xét dòng ok cũ hay mới. | Sau khi sửa đường dẫn, tệp vắng chỉ còn xảy ra khi watchdog không chạy thật — L4 sang xám đúng lúc watchdog hỏng; watchdog dừng từ hôm qua mà dòng cuối vẫn ok → L1–L4 «Ổn» xanh. | Hỏi-1 cho người (khó đảo); dòng sổ mới thay d-3; AC-4 ghim theo lối đã chọn kèm ca ok cũ. | human-gate1: Hỏi-1 (khuyến nghị lối A) ghi sổ thay d-3; AC-4 viết theo lối A với ca (d) ok cũ hơn 15′ |
| P1 | evals | E4 không đo ca gọi KHÔNG truyền root — đường suy ROOT từ cwd là lỗi gốc mà không được đo. | Test truyền root tạm nên xanh; trang thật vẫn sai khi suy ROOT. | Thêm ca không root với chdir(<tmp>/app) và đối chứng cwd <tmp>. | fixed: AC-4 và E4 chạy ma trận 4 ca × 3 cách gọi (truyền root, cwd app/, cwd gốc) = 12 assert |
| P1 | contract | AC-3 không ghim giá trị đầu ra, không có chiều đỏ, phụ thuộc TZ máy chạy test. | Runner TZ=UTC đỏ oan; test tính tên tệp bằng chính hàm cần đo thì tự khẳng định. | Ghim TZ Asia/Ho_Chi_Minh, 2 dấu → ok false/2; chiều đỏ bản toISOString ra null. | fixed: AC-3 và E3 ghim TZ, giá trị ok false/2, chiều đỏ bản ngày UTC ra null |
| P1 | evals | E5 bỏ mệnh đề «L4b trong nhóm Chưa kiểm được», paths thiếu lockdown-grid.tsx, props tự dựng thay đầu ra thật của hàm. | Hàm trả hình dạng khác props tự dựng, lưới xếp L4b sai nhóm, E5 vẫn xanh. | Round-trip đầu ra getLockdownStatus vào component; assert đủ ba mệnh đề; thêm lockdown-grid.tsx. | fixed: AC-5 và E5 dùng đầu ra thật của getLockdownStatus trên thư mục tạm AC-1/AC-2, ba mệnh đề, thêm lockdown-grid.tsx vào paths |
| P1 | evals | Ca «dùng lastMeaningfulLine» chỉ đo chuỗi có mặt; ma trận 5 mẫu chỉ ghim 2 kết quả, ba mẫu chỉ đo «hai bản bằng nhau». | scheduler() import hàm mà vẫn gán dòng cuối bằng tailFile cũ, E6 xanh; hai bản cùng sai vẫn qua. | Ghim 10 ô giá trị; đo đường đọc thật của cả hai phía trên tệp tạm. | fixed: AC-6 ghim 10 ô; tailLog dời sang pipeline/lib (đo trực tiếp, push-ops-facts dùng nó cho mọi job); E7 đo readSchedulerStatus nhánh local trên gốc tạm |
