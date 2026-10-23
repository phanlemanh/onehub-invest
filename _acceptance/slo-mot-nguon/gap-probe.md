---
slug: slo-mot-nguon
at: 2026-10-23T15:50:00Z
verdict: findings
p0: 1
p1: 1
p2: 3
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Chưa AC nào nói /ops và /ops/collections trên cloud hiện gì sau merge; dòng sổ bỏ cloud ghi máy quyết | Vercel triển khai, readFreshness trên cloud đọc bảng thô vắng/rỗng → 500 hoặc 0/5 «Chưa có dữ liệu» mà mọi eval chạy DB local vẫn xanh | AC + eval trên lược đồ bảng thô rỗng: không lỗi, trạng thái đã chốt | fixed: thêm AC-9/E9 (bảng thô 0 dòng như leak gate → mảng rỗng, 0/0, không lỗi; chiều đỏ một mã active bảng nạp rỗng → Chưa có dữ liệu); hành vi cloud giữ y như trước nên không phải câu chỉ-người — dòng sổ mới thay dòng bỏ cloud, căn cứ pipeline/sync-cloud.mjs |
| P1 | evals | E5 render trọn /ops nhưng chỉ ô của /ops/collections — page.tsx collections không bị đo | page.tsx collections tự đếm theo feedState, test ô vẫn xanh, người vận hành vẫn thấy hai số | Render trọn trang collections, chiều đỏ khi page đếm khác | fixed: tách CollectionsView (page.tsx chỉ tải + truyền), E5 render trọn /ops và trọn CollectionsView, paths thêm hai tệp; dòng bỏ ui-observed thay bằng căn cứ ràng buộc thật (khoá mới trong config.yaml bảo vệ) |
| P2 | contract | Mã active không SLO chưa có trạng thái mong đợi ở AC-2/AC-3 | Trang Thu thập vẫn cho «Ổn» theo nhánh null cũ | Then của AC-2/AC-3 nêu trạng thái, ca SL-AC-3 khẳng định | fixed: AC-2 không có hàng, AC-3 «Chưa khai SLO» ngoài y |
| P2 | evals | Không đối chứng dương rằng truy vấn đọc lược đồ tạm | SQL có tiền tố public. → cả hai bản đọc DB thật, vẫn khớp | Gieo thành phố canh chỉ có trong lược đồ tạm | fixed: AC-2/AC-3 đòi thấy thành phố canh, E2 bảng mong đợi từng hàng viết trước |
| P2 | contract | AC-8 hứa CLI cùng «con số» x/y mà CLI không có x/y | Tài liệu nói CLI và trang cùng con số — sai mà E8 vẫn đạt | Thu hẹp AC-8 | fixed: AC-8 nói cùng định nghĩa từng hàng, x/y chỉ trên hai trang |
