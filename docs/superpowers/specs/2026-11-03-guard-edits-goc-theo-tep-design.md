# guard-edits lấy gốc theo kho chứa tệp

Hồ sơ: `_acceptance/guard-edits-goc-theo-tep/` · PR #281 · hạng T3 (`.claude/hooks/**`).

## Vấn đề

`guard-edits.sh` lấy gốc từ `CLAUDE_PROJECT_DIR`. Tệp nằm ở worktree khác thì `rel` không cắt đúng, nên mẫu `db/migrations/*.sql` không khớp và luật «migration đã commit không được sửa» (AGENTS.md luật #2) bị bỏ qua. Đã tái hiện bằng selftest: bốn ca exit 0.

Kho có nhiều phiên song song ở `.claude/worktrees/`, cộng worktree `~/dev/onehub-invest-zcode` và symlink `~/dev/one-invest`, nên đường tệp không nằm dưới gốc của phiên là chuyện thường.

## Cách làm

1. Đưa thư mục của tệp về đường thật (`pwd -P`), vì `git rev-parse --show-toplevel` trả đường thật. Không có bước này thì đi qua symlink vẫn lọt.
2. Lấy gốc bằng `git -C <thư mục> rev-parse --show-toplevel`, rồi cắt `rel` theo gốc đó. `cat-file` cũng chạy trên gốc đó, nên «đã commit» xét theo HEAD của worktree chứa tệp.
3. Thư mục chưa tồn tại hoặc nằm ngoài git: giữ nguyên đường cũ.

Các lối đã loại:

- **So hậu tố `*/db/migrations/*.sql`, không cần gốc:** vẫn phải biết HEAD của worktree nào để xét «đã commit», nên không bỏ được bước tìm gốc; đồng thời khớp cả thư mục không thuộc kho.

## Bốn điểm cần người quyết (lên thẻ Cổng Phạm vi)

- **Kho khác:** luật migration giờ áp cho mọi kho git có `db/migrations/*.sql` đã commit. Đo trong `~/dev`: chỉ kho này khớp. Luật snapshot và `.airdna-profile` đã áp cho đường ngoài kho từ trước bản sửa, không đổi. Khuyến nghị không thêm điều kiện; AC-9 ghim hành vi. Lối khác: so `git-common-dir` với kho của phiên, thêm vài dòng và một ca kiểm.
- **`typecheck-changed.sh`:** phiếu giao ghi «có cùng lỗi thì sửa». Hook này không nhận đường tệp và không có `rel`, nên không cùng lỗi; nó có điểm mù khác (phiên A, `.mjs` hỏng ở B → exit 0). Input của hook Stop không cho biết phiên đã sửa tệp nào. Vá phải đọc transcript hoặc kiểm mọi worktree, mà như vậy một phiên có thể bị chặn vì việc dở của phiên khác. Khuyến nghị không sửa.
- **Thư mục chưa tồn tại:** phiếu giao ghi giữ đường cũ. Lỗ còn lại: xoá cả thư mục `db/migrations` ở worktree khác rồi ghi lại đúng tên migration đã commit thì hook không chặn. Khuyến nghị giữ theo phiếu giao vì chưa thấy ca thật. Lối khác: đi lên thư mục cha gần nhất còn tồn tại rồi `show-toplevel`, thêm khoảng ba dòng và một ca kiểm, đóng được lỗ này.
- **Thứ tự:** code và selftest có trước hồ sơ, nên cổng T3 mất bảo đảm «evals viết trước code». Khuyến nghị chấp nhận, đổi lấy đầu dò đột biến E6. Lối khác: bỏ code, duyệt evals rồi viết lại — vật gần như chắc chắn giống hệt, tốn thêm một lượt máy.

## Giới hạn đã biết

- Hook chạy theo bản trong `CLAUDE_PROJECT_DIR`, nên phiên ở worktree cũ chỉ có bản sửa sau khi hợp `main`.
- Selftest chưa chạy trong CI; nó là eval của hồ sơ này.

## Đo

Selftest `.claude/hooks/tests/guard-edits.selftest.sh` dựng ba worktree tạm và gọi hook thật. Đầu dò `probes/dot-bien.sh` chứng chiều đỏ trên cùng một worktree tạm: bản lành xanh; bản trước khi sửa và chín đột biến đỏ đúng ca đã ghim. Ca chặn ghim câu của đúng luật, vì lỗi cú pháp bash cũng trả exit 2.

