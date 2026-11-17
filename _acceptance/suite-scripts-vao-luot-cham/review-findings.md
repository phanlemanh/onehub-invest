# Review findings: suite-scripts-vao-luot-cham (round 2)

## Trong hợp đồng

- **Dòng tóm tắt mất số ca khi lượt đỏ có nhiều ca hỏng: chỉ giữ 20000 ký tự cuối, mà dòng «ℹ tests/pass/fail» đứng TRƯỚC phần «✖ failing tests»**
  AC: AC-2
  file: `scripts/suite-neu-doi.mjs:226`
  severity: medium
  source: bugs
  detail: Code giữ `raTest = (raTest + b).slice(-20000)` rồi để `tomTatScripts` tìm các dòng `^(?:ℹ|#) tests|pass|fail N`. Với reporter spec của Node 24 (đã chạy thử), các dòng tổng kết ℹ in ra TRƯỚC khối «✖ failing tests:», và khối này in lại mọi ca đỏ kèm stack trace. Lượt đỏ thật có vài chục ca hỏng (ví dụ lượt tái hiện #471/#472 trên đỉnh cũ, hoặc một trận đỏ do DB) dễ có khối này dài hơn 20 KB. Khi đó dòng ℹ bị cắt mất và tests/pass/fail thành null. Lỗi không báo ra đâu cả, dòng `scripts-ci` vẫn được ghi vào run-log với `fail: null`. Điều này trái với cam kết E2 «tệp mẫu đỏ → fail ≥ 1». Ca test chỉ dùng một tệp mẫu nhỏ nên không bao giờ gặp. Cách sửa: giữ phần đầu khối tổng kết, ví dụ dò dòng ℹ trên luồng khi chúng tới rồi lưu lại, thay vì chỉ giữ đuôi.
  rationale: AC-2 đòi dòng cuối là JSON có đủ tests, pass, fail với mọi kết cục xanh hay đỏ; lượt đỏ nhiều ca hỏng cho fail null là sai hợp đồng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Test SSL-AC-2 ghi hồ sơ tạm vào thẳng cây _acceptance/ thật của kho**
  Người dùng thấy gì: Nếu một lượt chạy thử bị ngắt giữa chừng, một thư mục hồ sơ giả có thể nằm lại trong kho và bị các công cụ sinh lộ trình, bản đồ sản phẩm nhìn thấy. Người dùng không thấy lỗi nào trên màn, chỉ có thể gặp một mục lạ trong báo cáo.
  Căn cứ: Hậu quả nhẹ, không mất hay lộ dữ liệu, người vận hành tự xoá thư mục thừa được và chỉ xảy ra khi lượt chạy bị ngắt giữa chừng.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Probe tai-hien.sh dựng worktree trong mktemp ngoài .claude/worktrees và chép .env sang đó**
  Người dùng thấy gì: Khi lượt kiểm tái hiện bị ngắt đột ngột, bản sao tệp cấu hình bí mật có thể nằm lại trong thư mục tạm của máy. Nó vẫn ở trên máy local, không đi đâu khác.
  Căn cứ: Rủi ro thấp vì tệp chỉ nằm trên máy thu, không rời máy, và chỉ xuất hiện khi lượt kiểm bị ngắt; dọn tay là xong.
  file: `_acceptance/suite-scripts-vao-luot-cham/probes/tai-hien.sh`
  severity: low
  Đề xuất: known-limits

- **co-ca.sh không bắt được ca bị bỏ qua: reporter spec của Node 24 không in «# SKIP»**
  Người dùng thấy gì: Lượt kiểm nghiệm có thể báo xanh dù ca chính thực ra bị bỏ qua vì thiếu container DB. Người ký có thể tin là phần tóm tắt và dọn DB đã được đo trong khi chưa hề chạy.
  Căn cứ: Gây tin nhầm ở bằng chứng nghiệm thu nhưng không làm hỏng tính năng cho người dùng cuối; nên sửa riêng vì sửa công cụ kiểm rẻ và không đụng lệnh đã ship.
  file: `_acceptance/suite-scripts-vao-luot-cham/probes/co-ca.sh`
  severity: high
  Đề xuất: new-contract

- **Hình dạng 4 — assertion âm tính một mình: co-ca.sh kiểm «không có # SKIP» bằng chuỗi mà reporter spec không bao giờ in**
  Người dùng thấy gì: Lượt kiểm nghiệm có thể báo xanh giả cho phần tóm tắt, ghi nhật ký và dọn DB khi ca chính bị bỏ qua. Người ký không biết các phần đó chưa được đo.
  Căn cứ: Chỉ làm bằng chứng nghiệm thu kém tin cậy, không ảnh hưởng người dùng cuối; sửa riêng cùng lỗi tương tự rẻ và an toàn.
  file: `_acceptance/suite-scripts-vao-luot-cham/probes/co-ca.sh`
  severity: high
  Đề xuất: new-contract

- **Hình dạng 1 — đo chỉ dẫn thay vì đầu ra: assert «nguyên văn run của job» so bộ đọc với chính tệp nó đọc**
  Người dùng thấy gì: Phép kiểm rằng lệnh chạy đúng nguyên văn các bước của CI khá yếu, nên nếu lệnh bị đổi lúc thực thi thì test có thể không đỏ. Người dùng không thấy tác động trực tiếp.
  Căn cứ: Rủi ro chỉ là bỏ sót một lệch lạc hiếm trong công cụ nội bộ, không mất dữ liệu; có thể ghi nhận và củng cố sau.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/6 lỗi rơi vào file không bộ đo nào phủ (_acceptance/suite-scripts-vao-luot-cham/probes/co-ca.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
