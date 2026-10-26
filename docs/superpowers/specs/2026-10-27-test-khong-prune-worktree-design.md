# test-khong-prune-worktree — test gỡ đúng worktree tạm của mình, không prune kho dùng chung

Hàng P4 của đợt dieu-phoi-dot0-cam-mau (giám sát thêm 25/10 ~09:40Z, ưu tiên 97). Căn cứ: worktree P3 `nice-goodall`
bị gỡ ~09:35Z chưa rõ nguyên nhân; P4 soát thấy `scripts/zalo-import-job-lan.test.mjs` có `git worktree prune` trên kho
dùng chung.

## Vấn đề

`after()` của `scripts/zalo-import-job-lan.test.mjs` gỡ worktree tạm bằng `git worktree remove --force`; lỗi thì xoá thư
mục rồi chạy `git -C <kho> worktree prune`. Kho ở đây là kho thật, dùng chung với mọi phiên Claude, ZCode và launchd. Prune
quét MỌI worktree của kho và gỡ metadata của worktree nào có thư mục đang vắng (ổ chưa gắn, thư mục đang dựng hay dời) — một
test lỗi dọn dẹp có thể gỡ worktree của phiên khác.

Soát toàn kho (mã `.mjs/.js/.cjs/.ts/.tsx/.sh/.py` đang theo dõi) thấy chỗ THỨ HAI, nguy hơn: `cleanup()` của
`.claude/hooks/tests/typecheck-changed.selftest.sh` chạy `git -C <kho> worktree prune` MỖI lần (không chỉ khi lỗi). Selftest
là eval `ui_hook_selftest` của hồ sơ đã ký `ui-standards-reui`, nên mọi lượt ghim lại hồ sơ đó prune kho dùng chung.

**Hỏi-1 (Mạnh quyết ở Cổng Phạm vi):** gộp selftest vào hàng này (nâng T3 vì `.claude/hooks/**` là đường T3) hay tách hàng
T3 riêng. Nháp theo khuyến nghị: gộp.

## Cách sửa

- Hàm dùng chung `scripts/lib/bo-worktree.mjs` → `boWorktree(repo, wt)`: `git worktree remove --force`; lỗi thì xoá thư
  mục cây và CHỈ thư mục quản trị `<git-common-dir>/worktrees/<tên>` có tệp `gitdir` trỏ đúng `<wt>/.git`. Không bao giờ
  prune.
- `zalo-import-job-lan.test.mjs` dùng `boWorktree` ở `after()` (WT) và ở `finally` của ZL-AC-1 (wt2). Hành vi các ca không
  đổi.
- `cleanup()` của selftest hook (bash): `worktree remove --force`; lỗi thì xoá thư mục quản trị có `gitdir` trỏ đúng
  `$WT/.git` (so cả đường thật lẫn đường dựng); bỏ dòng prune. Phần còn lại của selftest và `typecheck-changed.sh` không đổi.
- Test riêng `scripts/bo-worktree.test.mjs` trên kho git tạm: worktree «của phiên khác» có thư mục vắng giữ nguyên metadata
  sau khi gỡ worktree của mình, cả khi `remove` lỗi lẫn khi `remove` thành công.

### Lối đã loại

- **Bỏ hẳn nhánh dự phòng** (để `remove` lỗi thì ném): metadata worktree tạm rơi lại trong kho dùng chung mỗi lần lỗi, sinh
  rác `git worktree list` cho mọi phiên.
- **Đổi test sang `git clone` tạm thay worktree**: đổi cách mô phỏng nhánh ZCode của hồ sơ đã ký
  `zalo-import-so-phan-nap-khong-do-gia`; rộng hơn câu giao.

## Đo

- Soát tĩnh: không mã đang theo dõi nào gọi `worktree prune` (dạng chuỗi lệnh lẫn mảng đối số); đối chứng dương: bộ soát bắt
  được cả hai dạng trên tệp mẫu.
- Hành vi: `bo-worktree.test.mjs` xanh; bản sao hàm có nhánh dự phòng đổi thành prune → ca đỏ với thông điệp ghim.
- Không rác: chạy `zalo-import-job-lan.test.mjs` xanh và `git worktree list` của kho trước = sau.
- Phạm vi: chỉ ba tệp mã + hồ sơ + cấu hình + ghim lại hồ sơ bị chạm.
