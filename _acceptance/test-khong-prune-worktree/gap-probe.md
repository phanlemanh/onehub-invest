---
slug: test-khong-prune-worktree
at: 2026-10-27T00:05:00Z
verdict: findings
p0: 1
p1: 2
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals + contract | Gây «remove lỗi» bằng xoá thư mục cây — git 2.54 vẫn trả 0 và tự gỡ metadata, nhánh dự phòng không bao giờ chạy | Bản sửa xanh mà nhánh dự phòng chưa chạy lần nào; bản đột biến không đỏ, E5 đỏ vĩnh viễn | Gây lỗi thật bằng git worktree lock; in mã remove thật | fixed: AC-2/AC-5 ghi cách gây lỗi bằng lock; đầu dò in «remove loi that: rc=…» và bo-worktree.sh đòi dòng chứng nhánh dự phòng đã chạy |
| P1 | evals + contract | Fixture chỉ dựng kho chính và đường thật; selftest/zalo thật chạy từ worktree liên kết, TMP qua symlink; đầu dò ghim một chuỗi lệnh | Thi công đúng design làm đầu dò «DOT BIEN KHONG AP DUOC»; thi công khớp chuỗi thì chạy thật sót metadata | Ma trận kho chính/worktree liên kết, đường symlink; đột biến theo dấu mốc | fixed: ma trận 2×2 + đường symlink trong cả hai đầu dò; đột biến thay khối giữa dấu mốc du-phong; design ghi git-common-dir và so hai đường; d-2 thay bằng dòng mới |
| P1 | evals | lan.sh đo số tuyệt đối sau = 0; không đối chứng dương | Lượt khác chạy cùng tệp hay worktree sót từ lần bị giết làm đỏ oan; bộ đếm sai thì không bao giờ bắt | Đo tập sau trừ tập trước; đối chứng dương trên kho tạm | fixed: lan.sh đo phần chênh của lượt và có worktree mẫu zalo-lan- trong kho tạm |
| P2 | contract | Không AC nào đo zalo test thật sự dùng boWorktree | Chỉ xoá dòng prune, để rmSync trơn — mọi eval vẫn xanh | Import + ≥2 chỗ gọi + không gọi thẳng remove | fixed: AC-3 thêm vế, lan.sh kiểm |
| P2 | evals | paths của E1 hẹp hơn tập bộ soát quét | Prune mới ở .claude/hooks không làm E1 cũ, lượt ghim lại bỏ qua | paths trùng tập soát | fixed: paths E1 = mọi tệp mã theo đuôi |
