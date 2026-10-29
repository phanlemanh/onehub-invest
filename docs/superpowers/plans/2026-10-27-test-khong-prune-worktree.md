# Kế hoạch: test-khong-prune-worktree (T3)

Hồ sơ: `_acceptance/test-khong-prune-worktree/` · design: `docs/superpowers/specs/2026-10-27-test-khong-prune-worktree-design.md`

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| Có một hàm gỡ worktree tạm dùng chung, chỉ gỡ đúng worktree được giao | `scripts/lib/bo-worktree.mjs` | AC-2 (gỡ đúng một worktree) |
| Hàm gỡ có bài kiểm riêng trên kho tạm, kể cả khi gỡ lỗi thật | `scripts/bo-worktree.test.mjs` | AC-2 (ma trận 2×2 + đường tắt) |
| Bài kiểm Zalo thôi dọn worktree toàn kho khi gỡ lỗi | `scripts/zalo-import-job-lan.test.mjs` | AC-1, AC-3 (không prune, không rác) |
| Bài tự kiểm của hook kiểm kiểu thôi dọn worktree toàn kho sau mỗi lần chạy | `.claude/hooks/tests/typecheck-changed.selftest.sh` | AC-1, AC-5 (cleanup gỡ đúng một) |

## Task 1 — hàm `boWorktree` + test riêng

- **Files:** `scripts/lib/bo-worktree.mjs`, `scripts/bo-worktree.test.mjs`
- **Việc:** `boWorktree(repo, wt)`: `git worktree remove --force`; lỗi → khối giữa dấu mốc `// >>> du-phong` / `// <<< du-phong`:
  tìm thư mục quản trị dưới `git rev-parse --git-common-dir`/`worktrees/*` có `gitdir` bằng `<wt>/.git` theo đường dựng hoặc
  đường thật (realpath tính TRƯỚC khi xoá), xoá thư mục cây rồi đúng thư mục quản trị đó. Test: kho git tạm; ma trận kho
  {chính, worktree liên kết} × gỡ {lỗi thật bằng `worktree lock` — in «remove loi that: rc=<mã>», thành công}; worktree tạm
  dưới đường symlink; worktree «phiên khác» thư mục vắng — thông điệp ghim «worktree của phiên khác bị gỡ metadata».
- **Verify per-task:** `node --test scripts/bo-worktree.test.mjs`; `bash _acceptance/test-khong-prune-worktree/probes/bo-worktree.sh`
  (gồm lượt phá-thử khối du-phong → prune).
- **Phục vụ:** E2 · **independent:** true

## Task 2 — `zalo-import-job-lan.test.mjs` dùng `boWorktree`

- **Files:** `scripts/zalo-import-job-lan.test.mjs`
- **Việc:** import `boWorktree` từ `./lib/bo-worktree.mjs`; `after()` → `if (WT) boWorktree(REPO, WT)`; `finally` của ZL-AC-1 →
  `boWorktree(REPO, wt2)`. Bỏ `"worktree", "prune"` và mọi lời gọi thẳng `"worktree", "remove"`. Các ca khác không đổi.
- **Verify per-task:** `node --test scripts/zalo-import-job-lan.test.mjs` 4/4; `probes/lan.sh`.
- **Phục vụ:** E1, E3 · **independent:** false (cần Task 1)

## Task 3 — `cleanup()` của selftest hook

- **Files:** `.claude/hooks/tests/typecheck-changed.selftest.sh`
- **Việc:** `cleanup()`: `worktree remove --force`; lỗi → khối giữa `# >>> du-phong` / `# <<< du-phong`: common dir bằng
  `git rev-parse --git-common-dir` (cd rồi `pwd -P`), so `gitdir` với `$WT/.git` và đường thật (`WT_THAT` tính khi tạo), xoá
  đúng mục đó. Bỏ dòng `worktree prune`. Phần còn lại của selftest và `typecheck-changed.sh` không đổi.
- **Verify per-task:** `probes/selftest-cleanup.sh` (4 kịch bản + phá-thử); `bash .claude/hooks/tests/typecheck-changed.selftest.sh`.
- **Phục vụ:** E1, E5, E6 · **independent:** true

## Sau thi công

- `probes/soat-prune.sh` (E1) và `probes/pham-vi.sh` (E4) trên cây đã commit.
- Ghim lại hồ sơ bị chạm sau S4: `zalo-import-so-phan-nap-khong-do-gia`, `ui-standards-reui`.
