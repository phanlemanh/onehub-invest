---
schema_version: 1
feature: đầu dò của hồ sơ chuyen-huong-ma-thi-truong gỡ đúng worktree tạm của nó, bỏ lệnh prune trên kho dùng chung
slug: chm-dau-do-khong-prune
owner: phanlemanh@gmail.com
risk_tier: T1      # chỉ đổi cách dọn worktree tạm trong một đầu dò; không đổi sản phẩm, dữ liệu, quyền hay luồng
surfaces: [cli]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: chm-dau-do-khong-prune

## Context

Hồ sơ đã ký `test-khong-prune-worktree` (AC-1) chốt: không mã nào gọi `git worktree prune` trên kho dùng chung, vì lệnh đó gỡ
metadata của mọi worktree có thư mục đang vắng, kể cả của phiên khác. `scripts/chuyen-huong-ma-thi-truong/acceptance.mjs` vào
sau hồ sơ ấy và có một lời gọi ở chế độ `app-test`; bộ soát `soat-prune.sh` đang đỏ trên `main` vì dòng này.

Hồ sơ có mặt vì PR chạm `scripts/` (ngoài `t1_skip_globs`). `chuyen-huong-ma-thi-truong` và `test-khong-prune-worktree` không
nằm trong diff PR: cả hai đã cũ theo `verified_commit` trên `main` từ trước bản sửa, do các PR khác. PR này không làm phát sinh
nghĩa vụ ghim lại nào cho chúng.

## Criteria

- AC-1: Given mọi tệp mã đang theo dõi, When chạy `bash _acceptance/test-khong-prune-worktree/probes/soat-prune.sh`, Then in `SOAT OK`.
- AC-2: Given chế độ `app-test` có ca đỏ ở nhánh, When chạy `node scripts/chuyen-huong-ma-thi-truong/acceptance.mjs app-test`, Then nó dựng worktree gốc, so tập ca đỏ, gỡ worktree tạm; `git worktree list` không còn `goc-app`.
- AC-3: Given đồ sót của lượt trước ở đường worktree tạm (thư mục vắng mà metadata còn; cả hai còn; thư mục rác không metadata) trên kho chính lẫn worktree liên kết, When `boWorktree` chạy trước `worktree add`, Then `add` thành công và metadata của worktree phiên khác đang vắng thư mục còn nguyên.

## Out of scope

- OOS-1: Ghim lại `chuyen-huong-ma-thi-truong` hay `test-khong-prune-worktree`: chỉ cần khi có PR chạm hồ sơ của chúng.
- OOS-2: Thêm bộ soát vào CI để chặn lời gọi prune mới: dòng này lọt vào vì `soat-prune.sh` chỉ chạy khi ghim lại hồ sơ của nó. Việc này là quyết định riêng, không thuộc bản sửa này.
