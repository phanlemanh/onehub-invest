---
slug: df0-dem-de-xuat-lam-giau
at: 2026-10-26T15:43:17Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Căn cứ d-2/d-3 không quyết nghĩa nhãn: câu trích chỉ cho thấy không có pending; lối chết «nhãn mới» của d-3 không loại lối đếm một số nhưng bỏ dòng queued tuyến review đã có thẻ ở review_queue; chọn nghĩa nhãn là việc chỉ người có. d-4 tự mâu thuẫn (cost_if_wrong nêu trục tuyến) | Đề xuất tuyến review queued cũng có thẻ pending; đầu trang «N đề xuất làm giàu · M thẻ chờ duyệt» đếm trùng, người vận hành đọc số việc chờ phình lên; fixture không có route khác nhau nên E1–E5 vẫn xanh | Dòng Hỏi cho Mạnh; fixture E1 có queued ở mọi tuyến; đột biến lọc theo tuyến phải đỏ | human-gate1: Hỏi-1 (dòng S1 mới thay d-3, khuyến nghị đếm mọi queued); d-2 thay bằng câu trích mặc định queued của migration 033; d-4 thay bằng hai trục trạng thái × tuyến; E1 phủ mọi cặp trạng thái × tuyến + đột biến route <> 'review' |
| P0 | contract | Lối chết của d-7 (bỏ ui-observed) không phải ràng buộc thật; không ca nào đi qua đường route page → getDataFlow → view | Bản sửa đúng hằng nhưng trang lấy số qua lối khác; người vận hành vẫn thấy 0 mà E1–E5 xanh | Viết lại lối chết bằng ràng buộc nêu được, hoặc thêm eval đi qua route thật | fixed: d-7 thay bằng lối chết thật (ghi đề xuất giả vào bảng thật dùng chung thì enrich-run/apply_enrichment có thể áp vào sale_offers — luật 7); thêm AC-6 + E6 judgment trên page.tsx và data-flow-view.tsx |
| P1 | evals | E1 tuyên quét toàn phần trục trạng thái nhưng không có ma trận viết trước (chỉ «≥ 6, có queued») | Migration sau thêm trạng thái chờ mới, ca vẫn xanh trong khi trạng thái mới chưa phân loại | Ghim bảng phân loại 6 trạng thái; tập rút từ CHECK BẰNG tập ghim | fixed: E1 và AC-1 so tập rút từ CHECK bằng bảng phân loại ghim (= 6), lệch đỏ «trạng thái mới chưa phân loại» |
| P1 | design | Design và E5 mâu thuẫn: design chỉ dựng enrichment_proposals trên lược đồ tạm, E5 cần review_queue; trạng thái khác của E5 «rút từ ràng buộc nếu có» để ngỏ viết tay | Thợ theo design thì reviewPending ra 0, E5 đỏ; hoặc tự chế trạng thái bịa | Design thêm review_queue LIKE public kèm CHECK; E5 rút trạng thái từ CHECK | fixed: design §Đo dựng cả review_queue; E5 rút trạng thái từ CHECK review_queue_status_check (có trên DB), bỏ «nếu có», thêm đột biến approved |
| P2 | evals | Số dòng «queued 3, khác 1, 2, …»: tổng 1+2 = 3 nên đếm sai tập vẫn có thể ra 3 | status IN ('skipped','reverted') ra 3 = mong đợi | Số dòng là luỹ thừa 2 riêng | fixed: AC-1/E1 dùng luỹ thừa 2 riêng cho từng trạng thái, mọi tập con cho tổng khác nhau |
