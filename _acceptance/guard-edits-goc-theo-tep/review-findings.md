# Review findings: guard-edits-goc-theo-tep (round 1)

## Trong hợp đồng

- **Selftest báo đỏ giả khi có phiên khác đang chạy selftest trên kho dùng chung**
  AC: AC-8
  file: `.claude/hooks/tests/guard-edits.selftest.sh:125`
  severity: medium
  source: bugs
  detail: Kiểm cuối `git worktree list | grep -q "onehub-guard-selftest" && fail` khớp worktree tạm của BẤT KỲ lần chạy nào, không riêng lần này, và không so với số trước khi chạy. `git worktree list` dùng chung cho mọi worktree của kho. Vì vậy một selftest khác đang chạy, hoặc một mục tạm còn sót sau khi một lần chạy bị kill, đều làm kiểm này đỏ dù lần chạy hiện tại đã dọn sạch. Đã đo: chạy hai selftest lệch nhau 2 giây, lần đầu rc=1 với `FAIL  worktree tạm còn trong git worktree list` và `FAIL (1 kiểm hỏng)`, sau đó danh sách không còn mục tạm nào. Hậu quả: E8 đỏ giả. Mọi eval dùng geg_selftest (E1–E5, E8, E10) cùng exit 1 và mất `PASS`. `dot-bien.sh` chạy song song thì báo `BAN LANH KHONG XANH`. Mục sót lại còn làm đỏ vĩnh viễn, vì vòng này cấm prune. AC-8 nêu đúng bối cảnh «kho dùng chung có nhiều phiên», và dot-bien.sh đã làm đúng cách bằng `tam_truoc`/`tam_sau`. Cách sửa: chỉ so đúng ba đường `$A`, `$B`, `$C` của lần chạy này (chú ý đường thật do mktemp trả về), hoặc so số lượng trước và sau như dot-bien.sh.
  rationale: AC-8 đặt đúng bối cảnh kho dùng chung có nhiều phiên và đòi kiểm worktree tạm của lần chạy; phép kiểm đếm cả worktree của phiên khác nên báo đỏ giả trong chính bối cảnh đó.

- **Hình dạng 3 — Assert «chuỗi có mặt» trong khi lời hứa là quan hệ «đỏ ĐÚNG ca đã ghim»**
  AC: AC-6
  file: `_acceptance/guard-edits-goc-theo-tep/probes/dot-bien.sh:30`
  severity: medium
  source: measurement
  detail: Hàm `ghim` (dòng 27-34) chỉ kiểm từng chuỗi `  FAIL  <ca>` có mặt, tức tập ca đỏ CHỨA tập ca ghim. AC-6 và card lại hứa «đỏ đúng ca đã ghim», còn d-20261102T220729Z-8 ghi «đột biến pwd -L trong E6 đỏ đúng ca symlink». Không có phép so nào giữa tập FAIL thực tế và tập ghim, nên đột biến làm đỏ tràn lan vẫn in «do, ghim co» như đột biến trúng đích. Đã đo trên máy này: /var là symlink tới private/var và TMP nằm dưới /var. Bản đột biến pwd -L (dòng 50) làm một migration đã commit gọi thẳng trong chính CLAUDE_PROJECT_DIR trả exit 0, còn hook lành trả exit 2 (đo trên kho git tạm riêng). Vậy trên macOS đột biến này đỏ cả những ca không qua `lien-ket`, chứ không riêng ca symlink, mà đầu ra E6 không lộ điều đó. Tương tự, câu trong E5 «dòng ngay worktree của phiên: bản cũ cũng xanh» không được đầu dò nào đo: không có assert ca đó KHÔNG đỏ trên bản cũ.
  rationale: AC-6 đòi mỗi đột biến đỏ đúng ca đã ghim bằng tên, nhưng đầu dò chỉ kiểm ca ghim có mặt trong tập đỏ, không loại trường hợp đỏ tràn lan.

- **Hình dạng 6 (biến thể gần nhất, không khớp nguyên văn: không phải hardcode ROOT) — Đo trạng thái dùng chung của kho thay vì lượt đang kiểm**
  AC: AC-8
  file: `.claude/hooks/tests/guard-edits.selftest.sh:125`
  severity: medium
  source: measurement
  detail: `git -C "$REPO" worktree list | grep -q "onehub-guard-selftest"` khớp worktree tạm của MỌI phiên trên kho dùng chung, không riêng `$TMP` của lượt này. Đã quan sát khi chấm: selftest chạy lúc một dot-bien.sh của phiên khác đang chạy cho kết quả `FAIL worktree tạm còn trong git worktree list` rồi `FAIL (1 kiểm hỏng)`. Mọi ca khác đều OK, và kiểm lại thì các worktree đó còn thư mục, có tiến trình đang chạy, không phải rò. Hệ quả: E1-E5, E8, E10 và dòng `ban lanh: PASS` của E6 có thể đỏ giả khi chạy song song, đúng bối cảnh «kho dùng chung có nhiều phiên» của AC-8. Chiều ngược lại ở dot-bien.sh dòng 13 và 62-63: so đếm `tam_sau > tam_truoc` trên toàn kho, nên phiên khác gỡ worktree của nó có thể che một worktree rò của lượt này (xanh giả). Tôi đối chiếu lúc phiên kia đang chạy, nên lượt selftest của tôi cũng có thể đã làm đỏ giả lượt dot-bien đó: nếu nó báo BAN LANH KHONG XANH hoặc CON WORKTREE TAM quanh 06:19 thì nên chạy lại. Xếp ngoài văn bản sáu hình dạng thì triage có thể bỏ.
  rationale: Cùng gốc với phát hiện đầu tiên: phép kiểm worktree tạm đếm cả worktree của phiên khác trong kho dùng chung, đúng bối cảnh AC-8 nêu.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chú thích ba khoá geg_* trong config.yaml lệch với evals và contract**
  Người dùng thấy gì: Ba dòng ghi chú trong cấu hình nghiệm thu còn ghi số liệu cũ, người đọc sau có thể lần nhầm bộ kiểm nào phục vụ tiêu chí nào. Rào chặn sửa migration vẫn chạy đúng.
  Căn cứ: Hậu quả nhẹ, chỉ gây hiểu lầm khi đọc ghi chú, không ảnh hưởng dữ liệu hay người dùng, và sửa lại bất cứ lúc nào cũng rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Symlink cấp tệp tới migration đã commit vẫn lọt, contract không ghi lỗ này**
  Người dùng thấy gì: Nếu ai đó tạo một lối tắt trỏ thẳng vào tệp migration đã chốt rồi sửa qua lối tắt đó, rào sẽ không chặn. Hiện không có luồng làm việc thật nào tạo lối tắt kiểu này.
  Căn cứ: Rủi ro thấp vì phải cố tình tạo lối tắt và chưa thấy ai làm, nhưng người ký cần được báo rõ để biết rào có lỗ này; sửa thì đụng thêm phần xử lý đường dẫn nên không nhất thiết làm trong vòng này.
  file: `.claude/hooks/guard-edits.sh`
  severity: low
  Đề xuất: known-limits

- **Thẻ Cổng 1 nêu sai số đo làm căn cứ Hỏi-4: 9 tệp openclaw không thuộc luật snapshot**
  Người dùng thấy gì: Thẻ trình ký nói kho khác có 9 tệp bị luật chặn, thực tế là 0, nên người ký có thể hiểu sai mức ảnh hưởng. Kết luận quyết định không đổi, hành vi thật vẫn như đã trình.
  Căn cứ: Quyết định ký vẫn đúng dù số sai, không mất dữ liệu hay chặn nhầm ai, nhưng nên ghi lại để người ký không tin vào con số cũ.
  file: `_acceptance/guard-edits-goc-theo-tep/card.html`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: E3/E4 khai chiều đỏ do E6 đo, nhưng ba dòng exit 0 không có đột biến ghim**
  Người dùng thấy gì: Ba trường hợp rào phải để cho sửa tệp đi qua chưa có phép thử cố tình làm hỏng để chứng minh bộ kiểm sẽ báo đỏ nếu rào chặn nhầm. Rào hiện vẫn cho qua đúng.
  Căn cứ: Rào đang chạy đúng nên người dùng không bị chặn nhầm; chỉ là bằng chứng bộ kiểm biết báo lỗi còn mỏng ở vài ca, sửa sau cũng không muộn.
  file: `_acceptance/guard-edits-goc-theo-tep/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: «không còn ref tạm» không thể đỏ, các dòng dọn dẹp AC-8 không có đối chứng dương**
  Người dùng thấy gì: Phép kiểm xác nhận không còn nhánh tạm sau khi chạy thử có thể không bao giờ báo đỏ, nên nếu sau này có rò rỉ thật thì chưa chắc phát hiện. Hiện chưa thấy rò rỉ nào.
  Căn cứ: Không có hại thực tế đã xảy ra và nếu rò thì chỉ để lại rác tạm trong kho, người dùng tự dọn được; củng cố phép đo là việc tốt nhưng không gấp.
  file: `_acceptance/guard-edits-goc-theo-tep/probes/dot-bien.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên lớp nhưng chỉ có điểm-case: AC-1 nêu tổ hợp 2×2×2, selftest có bốn ca và không có ma trận**
  Người dùng thấy gì: Bộ kiểm chỉ thử bốn trong tám cách kết hợp sửa tệp ở worktree khác, nên vài cách hiếm chưa được kiểm tự động. Chưa có dấu hiệu rào chạy sai ở các cách đó.
  Căn cứ: Rủi ro thấp vì các cách chưa thử dùng chung đường xử lý với cách đã thử, và nếu sai thì rào chỉ để lọt chứ không làm mất dữ liệu ngay.
  file: `.claude/hooks/tests/guard-edits.selftest.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên lớp nhưng chỉ có điểm-case: «kho git khác» chỉ ghim 2 trong 3 luật**
  Người dùng thấy gì: Hành vi của rào với thư mục hồ sơ AirDNA ở kho git khác chưa được bộ kiểm giữ lại, nên đổi hành vi này sau này sẽ không ai bị báo. Hiện rào vẫn chặn đúng.
  Căn cứ: Hiện không ảnh hưởng ai và rào đang đúng; chỉ là một thay đổi tương lai có thể lặng lẽ đổi hành vi mà không bị bắt.
  file: `.claude/hooks/tests/guard-edits.selftest.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên lớp nhưng chỉ có điểm-case: «selftest cùng đầu dò của vòng» chỉ quét danh sách cứng hai tệp**
  Người dùng thấy gì: Phép kiểm cấm dọn dẹp kho dùng chung chỉ soi hai tệp có sẵn, đầu dò viết thêm sau sẽ không được soi. Hiện chưa có tệp nào vi phạm.
  Căn cứ: Chưa có vi phạm thật và hậu quả nếu có là dọn nhầm worktree của phiên khác, nhưng chỉ xảy ra khi có người thêm đầu dò mới; sửa rẻ khi đó.
  file: `_acceptance/guard-edits-goc-theo-tep/probes/pham-vi.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — Fixture viết tay đúng khuôn bên đọc: payload hook dựng tay đúng các khoá hook đọc**
  Người dùng thấy gì: Bộ kiểm dùng dữ liệu đầu vào tự dựng chứ không phải dữ liệu thật do công cụ phát ra, nên nếu công cụ đổi cách gửi thì rào có thể lặng lẽ cho qua mà bộ kiểm vẫn xanh.
  Căn cứ: Không phải lỗi hiện hữu và khuôn dữ liệu đã ổn định từ trước; chỉ cần ghi lại để người ký biết giới hạn của bộ kiểm.
  file: `.claude/hooks/tests/guard-edits.selftest.sh`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/12 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml, _acceptance/guard-edits-goc-theo-tep/card.html, _acceptance/guard-edits-goc-theo-tep/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

