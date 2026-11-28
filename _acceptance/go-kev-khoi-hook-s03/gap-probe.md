---
slug: go-kev-khoi-hook-s03
at: 2026-11-24T10:05:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals | E16 chấm kiem-sau.sh chỉ trên log mẫu viết tay; không ca nào lấy log do writer thật sinh | Dòng log thật lệch khuôn viết tay thì bảy ca mẫu xanh mà trên máy thu báo sai (lùi một lần áp tốt, hoặc ĐẠT giả khi hook cũ còn chạy) | Ca round-trip: log sinh bằng handler.js thật đưa qua kiem-sau ra ĐẠT; handler.js của main ra KHÔNG ĐẠT kev null | fixed: ap-may-thu/sinh-log-that.mjs sinh log bằng chính handler.js trong hộp cát; kiem.sh thêm ba ca writer thật (cây → ĐẠT; handler.js của be765e6a5 → KHÔNG ĐẠT còn 3 kev null; watchdog của be765e6a5 → KHÔNG ĐẠT thiếu kev:off), dòng nhịp dựng từ chính chuỗi echo của zalo-watchdog.sh (E16) |
| P0 | design | Dòng sổ coi lối chạy watchdog trong hộp cát là chết, trong khi lối ấy còn sống; chưa ai đo watchdog chạy trọn sau khi gỡ khối canh | Gỡ khối để lại biến không gán dưới set -u; bash -n và grep tĩnh vẫn xanh; lớp an toàn chết từ lúc gộp | Eval chạy bản chép watchdog với HOME tạm và stub PATH, hoặc đổi dòng sổ thành chi-nguoi | human-gate1: dòng sổ thay bằng câu chỉ-người (supersedes) — khuyến giữ chốt tĩnh; kèm sửa: probe thêm mốc watchdog-bien-mo-coi (biến KEV_OK đã gỡ không còn ai đọc, ca phá doc-kev-ok đỏ) và README bước 1.1 kiểm nhịp «ok … kev:off (K1)» trong 5′ sau pull, không thấy sau 10′ thì không áp hook, lùi watchdog |
| P1 | contract | Ngưỡng «agent 0 turn, lockdown 7 lớp nguyên» trong ô cơ hội không có đường đo ở kiem-sau | Gateway khởi động lại mà lockdown vỡ; kiem-sau vẫn ĐẠT vì chỉ đếm post và kev null | Thêm ca đỏ lockdown vỡ, agent có turn | fixed: dòng «ok — …» chỉ được ghi khi mọi lớp qua (alert() thoát trước và ghi KILL), kiem-sau đòi nhịp cuối «ok» + «0 turn mới» và thêm điều kiện 0 dòng KILL mới trong tệp cảnh báo; ca mẫu lockdown-vo và watchdog-khong-ok đỏ đúng lý do (E16) |
| P1 | evals | E16 chỉ kiểm tiêu đề năm mục README, không kiểm nội dung | Mục «Số chạy thử» trống vẫn PASS; người ký tưởng chữ ký phủ việc áp | Mỗi mục có lệnh hay con số; mục 2 có số trước; mục 4 có lệnh chép lại + khởi động lại | fixed: kiem.sh đòi mỗi mục 1–5 có lệnh hay con số, mục 2 có 4.954 và 5.103, mục 3–4 có handler.js.bak-, mục 4 có kickstart, mục 5 có kiem-sau.sh; phá mục 2 thành «sẽ đo» → FAIL README mục 2 (E16) |
| P2 | evals | Không fixture kev-off đi qua bộ nạp; ý «pipeline không lọc theo kev.p» không có phép đo | Một bước nạp ánh xạ kev.model bỏ tin mới; hai nửa bộ test vẫn xanh | Round-trip bộ nạp + chốt grep pipeline với ca cấy | fixed (một phần): probe thêm mốc pipeline-loc-kev (không .sql/.mjs/.js nào trong pipeline/ đọc kev.p, kev.model, meta->'kev'), ca phá cấy DELETE theo meta->'kev'->>'p' đỏ (E17). deferred: round-trip qua DB stg_* — cần DB và bộ nạp S03, nặng hơn giá trị khi grep đã chốt không có bên đọc |
