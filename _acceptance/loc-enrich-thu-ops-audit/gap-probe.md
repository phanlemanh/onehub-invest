---
slug: loc-enrich-thu-ops-audit
at: 2026-10-30T09:11:39Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Sổ d-10 bỏ «trang UI nhật ký» bằng nguồn mục-tiêu, nhưng câu trích nói sửa ở «màn Ops» — câu trích không quyết việc bỏ trang, trong khi chưa màn nào hiện nhật ký [gop-tin-chi-anh-o-transform#F1] | Mạnh ký vì tưởng màn nhật ký Ops sẽ sạch; sau gộp không có màn nào, thay đổi chỉ chạm API | Dòng chỉ-người Hỏi-3 supersedes phần UI của d-10 | human-gate1: Hỏi-3 (dòng sổ -12 supersedes d-10; phần còn lại của d-10 ghi lại ở dòng -13) |
| P0 | contract | Sổ d-4 «chỉ lọc enrich:thu» ghi một-lối nhưng chỉ loại lối lọc tiền tố; lối lọc theo actor không phải người còn sống [ho-nguoi-theo-nguon#F2] | Nếu nhật ký thao tác nghĩa là việc người làm, luồng máy khác ghi dày vẫn đẩy người ra mà E3 xanh | Dòng chỉ-người supersedes d-4, hoặc căn cứ mới làm lối kia chết | fixed: đo ops_audit thật 30/10 — actor người có năm khuôn (user, ops-user, usr_*, vis-ops-*, hitl), lọc theo actor ẩn thao tác người thật; máy khác ~40 dòng/9 ngày so với enrich:thu 50/đêm — dòng sổ -11 supersedes d-4 với căn cứ đo; AC-1 dùng các khuôn actor thật, AC-3 dùng ma trận action thật |
| P1 | evals | E1, E2 so «theo id» trong khi rows không có id | Ca tự chế cách so, dòng trùng hay sai vẫn qua | Khoá duy nhất detail.seq, so bộ (at, action, detail.seq) | fixed: evals.yaml E1, E2 so theo detail.seq, đếm đúng 5 hoặc 100 |
| P1 | evals | Chiều đỏ dựng route cũ bằng git show lúc chạy — CI clone nông thì lỗi hạ tầng [d-20261030T074734Z-34] | Bốn ca đỏ giả ở CI, hoặc bị bọc bỏ qua lặng | Fixture route cũ commit sẵn kèm sha; vắng fixture thì đỏ có tên | fixed: evals.yaml dùng fixture app/tests/fixtures/audit-route-truoc-loc/route.ts.txt chép từ 4cfd7cd1, vắng thì đỏ có tên |
| P2 | evals | E4 ghim tuyệt đối «chỉ admin 200» chưa đo trên route cũ | Route cũ khác dự đoán thì E4 đỏ dù quyền không đổi, đẩy người sửa quyền | Bỏ ghim tuyệt đối, giữ quan hệ bằng nhau | fixed: AC-4, E4 chỉ giữ quan hệ bằng nhau + đối chứng ô admin 200 kèm rows |
