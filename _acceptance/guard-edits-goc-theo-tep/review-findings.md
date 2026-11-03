## Trong hợp đồng

(không có phát hiện nào)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Kiểm rò cuối selftest vẫn dùng dạng git | grep, git lỗi bị báo là sạch**
  Người dùng thấy gì: Bước tự kiểm cuối của rào chặn sửa migration có thể báo 'đã dọn sạch' dù thực ra không kiểm được gì khi công cụ quản lý mã bị lỗi đúng lúc đó. Rào chặn thật vẫn chạy đúng, không ai bị mất dữ liệu.
  Căn cứ: Hậu quả nhẹ: chỉ xảy ra khi công cụ quản lý mã hỏng đúng lúc kiểm, chưa thấy đường nào gây ra, không có rò thật, và sửa sau vẫn rẻ.
  file: `.claude/hooks/tests/guard-edits.selftest.sh`
  severity: low
  Đề xuất: known-limits

- **Chú thích ba executor geg_* trong config.yaml lệch với evals và đầu dò**
  Người dùng thấy gì: Ghi chú mô tả các lệnh kiểm trong tệp cấu hình nghiệm thu nói thiếu vài ca so với thực tế, nên người đọc có thể hiểu sai ca nào dùng lệnh nào. Kết quả cổng nghiệm thu không đổi.
  Căn cứ: Chỉ là chữ giải thích, không đổi kết quả kiểm và không ảnh hưởng người dùng; người đọc tự đối chiếu được nên không đáng mở việc riêng.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Selftest báo «git worktree list sạch» và PASS khi chính lệnh git worktree list lỗi**
  Người dùng thấy gì: Bài tự kiểm của rào chặn sửa migration có thể báo xanh và 'sạch' dù bước kiểm dọn đã không chạy được do công cụ quản lý mã lỗi. Rào chặn thật không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ vì chỉ lộ khi công cụ mã hỏng đúng lúc kiểm và không có rò thật trong lần đo; người dùng chạy lại là thấy được.
  file: `.claude/hooks/tests/guard-edits.selftest.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: «git worktree list sạch» và «cây làm việc thật không đổi» báo OK cả khi git lỗi**
  Người dùng thấy gì: Hai dòng tự kiểm 'không rò thư mục tạm' và 'cây làm việc thật không đổi' vẫn báo xanh khi công cụ quản lý mã lỗi, nên có thể che một sự cố dọn dẹp thật nếu nó xảy ra cùng lúc. Hiện chưa thấy sự cố nào như vậy.
  Căn cứ: Rủi ro thấp: cần hai điều xảy ra đồng thời (công cụ mã lỗi và có rò thật), không làm mất dữ liệu người dùng, và siết lại phép kiểm sau này rất rẻ.
  file: `.claude/hooks/tests/guard-edits.selftest.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — Assert «chuỗi có mặt» trong khi lời hứa là quan hệ thứ tự: lời gác mktemp phải dừng TRƯỚC khi đặt trap**
  Người dùng thấy gì: Đầu dò kiểm nghiệm chưa chứng minh được rằng bước dừng khi không tạo được thư mục tạm nằm đúng thứ tự trước bước dọn dẹp, nên nếu ai đó đảo thứ tự, phép đo vẫn xanh. Lỗi ấy từng có thể xoá nhầm cả kho khi chạy bài kiểm.
  Căn cứ: Hậu quả nếu tái phát nặng (xoá nhầm kho) nhưng chỉ khi có người đảo thứ tự trong công cụ kiểm tra và đúng lúc không tạo được thư mục tạm; không ảnh hưởng người dùng cuối, bản hiện tại đúng và dễ siết phép đo sau.
  file: `_acceptance/guard-edits-goc-theo-tep/probes/dot-bien.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Thiếu ma trận toàn phần: các phép đo mới của db62c3cc không có trong E6, xoá đi E6 vẫn khớp**
  Người dùng thấy gì: Các phép đo mới thêm vào đầu dò kiểm nghiệm chưa được bản mô tả nghiệm thu ghim lại, nên nếu chúng bị xoá nhầm thì cổng nghiệm thu vẫn xanh mà không ai biết. Rào chặn thật cho người dùng không bị ảnh hưởng.
  Căn cứ: Không ảnh hưởng người dùng hiện tại và bản hiện tại đang đúng; nhưng để bảo vệ lâu dài lỗi xoá kho cần thêm vào hợp đồng nghiệm thu, nên đáng làm trong một lượt riêng.
  file: `_acceptance/guard-edits-goc-theo-tep/evals.yaml`
  severity: low
  Đề xuất: new-contract

- **Hình dạng 4 — Assertion âm tính một mình: «duong do: khong con worktree tam cua selftest» không thể đỏ vì đầu dò đã tự gỡ worktree trước khi kiểm (r2 · tệp đã đổi)**
  Người dùng thấy gì: Một dòng kiểm trong bộ thử của rào chắn sửa tệp không thể báo đỏ khi worktree tạm bị sót, vì bước dọn đã chạy trước đó. Người dùng vẫn được bảo vệ như cũ, chỉ là một tín hiệu cảnh báo thừa nên bộ thử kém nhạy hơn vẻ ngoài.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu; còn một tín hiệu rò khác của bộ thử bắt được, và sửa lại sau cũng rẻ.
  file: `_acceptance/guard-edits-goc-theo-tep/probes/dot-bien.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Thiếu ma trận toàn phần: E6 và AC-6 liệt kê chín đột biến, đầu dò có mười một; hai đột biến kiểm rò và ca «lần chạy khác» không có trong evals (r2 · tệp đã đổi)**
  Người dùng thấy gì: Hồ sơ nghiệm thu ghi chín ca thử còn bộ thử thực tế chạy mười một, nên nếu ai xoá bớt ca phụ thì không có gì báo. Rào chắn sửa migration vẫn chặn đúng như đã cam kết.
  Căn cứ: Chỉ là hồ sơ ghi lệch so với bộ thử, không làm lọt hay mất gì của người dùng; cập nhật hồ sơ sau là việc nhẹ.
  file: `_acceptance/guard-edits-goc-theo-tep/probes/dot-bien.sh`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/6 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml, _acceptance/guard-edits-goc-theo-tep/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

