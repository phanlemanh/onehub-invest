## Trong hợp đồng

- **mktemp hỏng thì TMP thành chính ROOT: cleanup gỡ mọi worktree con, xoá cả checkout, vẫn in DOT-BIEN OK và exit 0**
  file: `_acceptance/guard-edits-goc-theo-tep/probes/dot-bien.sh:11`
  severity: high
  AC: AC-8
  source: bugs
  detail: Commit 047df282 thêm `TMP="$(cd "$TMP" && pwd -P)"` ngay sau mktemp mà không kiểm mktemp thành công. Khi mktemp lỗi (TMPDIR không tồn tại hoặc không ghi được, đầy đĩa), TMP rỗng. `cd ""` trong bash 3.2 của macOS trả rc=0 và đứng nguyên (đã đo: `cd /usr; x=$(cd "" && pwd -P)` cho x=/usr). Dòng 6 đã cd về ROOT nên TMP=ROOT, kéo theo WT=ROOT/wt và ST_TMP=ROOT/st. Khi kết thúc, `cleanup` chạy `go_duoi "$ROOT/"`, tức `git worktree remove --force` mọi worktree nằm dưới ROOT, rồi `rm -rf "$ROOT"`. Trước commit này mktemp lỗi chỉ dẫn tới `rm -rf ""`, vô hại. Nếu chạy từ checkout chính, nơi launchd chạy code, thì mọi worktree `.claude/worktrees/*` của các phiên khác nằm trong diện bị gỡ --force, kể cả phần chưa commit, rồi checkout chính bị xoá.

  Đã tái hiện trên clone dùng một lần trong scratchpad, không chạm kho thật: dựng clone sha 047df282 có worktree con `.claude/worktrees/nguoi-khac` chứa tệp chưa commit, chạy với `TMPDIR=<thư mục không tồn tại>`. Kết quả: thư mục clone biến mất hoàn toàn, tệp chưa commit mất theo.

  Lỗi còn bị che: đầu ra vẫn là `duong do: khong con worktree tam cua dau do`, `duong do: khong con ref tam`, `DOT-BIEN OK`, exit=0. Hai kiểm ở dòng 85-86 nằm sau cleanup, `git -C $ROOT` chết với `fatal: cannot change to ...`, nhưng dạng `if git ... | grep -q` coi lỗi git là không khớp nên báo sạch. E6 vì vậy xanh ngay trong lần chạy đã xoá cả kho.

  Hướng sửa: `TMP="$(mktemp -d ...)" || exit 2`, rồi `TMP="$(cd "$TMP" && pwd -P)" || exit 2` và kiểm `[ -n "$TMP" ]`, trước khi đặt trap. Các kiểm rò sau cleanup nên chụp đầu ra git trước và coi git lỗi là đỏ.
  rationale: AC-8 đích danh đầu dò của vòng và đòi cây làm việc thật không đổi sau khi chạy; khi mktemp hỏng đầu dò xoá cả checkout và các worktree con rồi vẫn báo xanh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 — Assertion âm tính một mình: «duong do: khong con worktree tam cua selftest» không thể đỏ vì đầu dò đã tự gỡ worktree trước khi kiểm**
  Người dùng thấy gì: Một dòng kiểm trong bộ thử của rào chắn sửa tệp không thể báo đỏ khi worktree tạm bị sót, vì bước dọn đã chạy trước đó. Người dùng vẫn được bảo vệ như cũ, chỉ là một tín hiệu cảnh báo thừa nên bộ thử kém nhạy hơn vẻ ngoài.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu; còn một tín hiệu rò khác của bộ thử bắt được, và sửa lại sau cũng rẻ.
  file: `_acceptance/guard-edits-goc-theo-tep/probes/dot-bien.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Thiếu ma trận toàn phần: E6 và AC-6 liệt kê chín đột biến, đầu dò có mười một; hai đột biến kiểm rò và ca «lần chạy khác» không có trong evals**
  Người dùng thấy gì: Hồ sơ nghiệm thu ghi chín ca thử còn bộ thử thực tế chạy mười một, nên nếu ai xoá bớt ca phụ thì không có gì báo. Rào chắn sửa migration vẫn chặn đúng như đã cam kết.
  Căn cứ: Chỉ là hồ sơ ghi lệch so với bộ thử, không làm lọt hay mất gì của người dùng; cập nhật hồ sơ sau là việc nhẹ.
  file: `_acceptance/guard-edits-goc-theo-tep/probes/dot-bien.sh`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

