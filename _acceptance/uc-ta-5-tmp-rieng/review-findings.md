# Review findings: uc-ta-5-tmp-rieng (round 1)

Phạm vi đọc: `git diff 6045cea..0097b98` (merge-base = origin/main 6045cea). Tệp mã duy nhất là
`scripts/ui-capture-login.test.mjs` (+7/−2). Đọc đối chiếu `scripts/ui-capture-login.mjs` (hàm `capture()` và `loginState()`)
và `scripts/ui-capture-browser.test.mjs`. Baseline chạy trên cây làm việc: ghi đè tạm tệp test bằng bản origin/main, chạy
xong thì khôi phục bằng `git checkout --`. Không commit gì.

## Trong hợp đồng

- **AC-1 chưa đạt: bộ `scripts/` đỏ 4/5 lượt, nhưng đỏ ở tệp khác, không phải UC-TA-5.** Probe `nam-luot.sh` cho lượt 1–4
  `ℹ fail 1`, cả bốn lần đều là `UC-BR-6 tên lộ trong chữ hay thuộc tính` trong `scripts/ui-capture-browser.test.mjs`. Lượt
  5 xanh 180/180. Trong bốn lượt chạy thêm để lấy thông điệp lỗi, có thêm một lần `UC-BR-3` đỏ. Cả hai ca đỏ cùng một
  kiểu: `capture()` trả mã 6 (`không đăng nhập được: GET http://127.0.0.1:<cổng>/login không trả 200`). Nghĩa là `fetch`
  từ tiến trình test tới máy chủ giả (chạy ở tiến trình con) thất bại, và `loginState` nuốt lỗi gốc bằng `.catch(() => null)`.
  UC-TA-5 xanh ở 9/9 lượt trên HEAD (5 lượt probe cộng 4 lượt chạy thêm).
  Kết luận: phần sửa của nhánh đúng mục tiêu, nhưng AC-1 đòi «cả bộ 0 ca đỏ năm lượt». Tiêu chí đó không đạt được khi
  còn một ca chập chờn khác trong bộ, mà ca đó lại thuộc tệp hợp đồng xếp vào «Out of scope».
  Hướng giải nằm ở người ký: một là mở rộng phạm vi để sửa ca UC-BR (xem «Ngoài hợp đồng»), hai là viết lại AC-1 cho
  đo riêng UC-TA-5 hoặc loại trừ UC-BR có lý do.

Đã soát và KHÔNG thấy lỗi ở các đường sau:
- TMPDIR được trả lại kể cả khi ca đỏ. `t.after(...)` được đăng ký ngay sau dòng gán. node:test chạy hook `after` của ca dù
  thân ca ném lỗi. Nếu chính `mkdtempSync` ném thì phép gán không xảy ra, nên không có gì phải trả. Hook trả về giá trị cũ,
  và xoá biến nếu ban đầu nó không có.
- Không ảnh hưởng ca khác. UC-TA-5 là ca `test(...)` cuối cùng trong `ui-capture-login.test.mjs`. Các ca cấp cao nhất
  trong một tệp chạy tuần tự, và hook `after` của ca chạy xong trước khi ca kế tiếp hay hook `after` cấp tệp bắt đầu.
  Đổi `process.env.TMPDIR` chỉ có tác dụng trong tiến trình con của tệp này: `node --test` tách mỗi tệp ra một tiến trình,
  nên `ui-capture-browser.test.mjs` không thấy thay đổi đó.
- Thư mục riêng được xoá. Sau khoảng 20 lượt chạy bộ, thư mục tạm của hệ thống không còn thư mục `uc-ta-5-*` nào sót lại.
  Tiền tố `uc-ta-5-` khác `ui-capture-` nên không làm lệch phép đếm của ca nào khác.
- Ca vẫn có răng. `os.tmpdir()` đọc lại `TMPDIR` mỗi lần gọi (đã thử: đổi biến môi trường thì giá trị trả về đổi theo).
  `capture()` gọi `mkdtempSync(path.join(tmpdir(), "ui-capture-"))` ngay trong thân hàm, nên thư mục tạm của nó nằm trong
  thư mục riêng, đúng chỗ `demTmp()` đếm. E2 xác nhận điều này: bản đột biến bỏ `rmSync(tmp, …)` làm UC-TA-5 đỏ.
- Không nới khẳng định. Bốn `assert` của UC-TA-5 vẫn giữ nguyên. Diff chỉ thêm `mkdtempSync`/`rmSync` vào import,
  thêm tham số `t` và ba dòng dựng/trả TMPDIR.

## Ngoài hợp đồng

- **Ca UC-BR-6 / UC-BR-3 (bước chụp trên trình duyệt thật) đỏ chập chờn khi cả bộ chạy song song**
  Người dùng thấy gì: người chạy bộ test `scripts/` thấy đỏ ngẫu nhiên ở ca chụp trên trình duyệt, với lời báo «app dev chưa chạy?» dù ca không cần app. Lượt ghim lại nào chạy cả bộ đều có thể vấp, y như lỗi UC-TA-5 vừa sửa.
  Căn cứ: không mất hay lộ dữ liệu, chạy lại thường xanh, nhưng nó chặn đúng việc mà hồ sơ này muốn gỡ (làn ghim lại cần bộ xanh ổn định). Lỗi có sẵn trên main, không do nhánh gây ra. Sửa sớm thì rẻ, để lâu mỗi lượt ghim lại tốn thêm một vòng chạy.
  file: `scripts/ui-capture-browser.test.mjs`
  severity: medium
  Đề xuất: mở việc riêng. Bước đầu là cho `loginState` giữ lại lỗi gốc của `fetch` (hiện bị `.catch(() => null)` nuốt) để biết đó là reset kết nối, hết giờ hay cổng đóng. Giả thuyết chưa kiểm chứng: lỗi xảy ra khi `fetch` dùng lại kết nối keep-alive cũ sau khi `execFileSync` của playwright-cli chặn vòng sự kiện quá thời gian giữ kết nối của máy chủ giả (5 giây). Máy đang tải cao làm các bước đó chậm hơn.

## Known limits

- Không tái hiện được lỗi UC-BR khi có công cụ đo. Một bản chép trong scratchpad có in lỗi gốc của `fetch` đã chạy 3 lượt
  riêng, 1 lượt cả bộ và 3 lượt song song với bộ thật, và không lượt nào đỏ. Vì vậy giả thuyết keep-alive ở trên chưa được
  xác nhận. Tải máy lúc chấm khá cao (load average 13–25, có các phiên khác chạy cùng).
- Baseline E1 chỉ có 4 lượt: UC-TA-5 đỏ 1/4 trên main, thấp hơn mức 3/4 hợp đồng ghi. Tỉ lệ đỏ phụ thuộc tải máy.
- Lời nhắc nhỏ, không ảnh hưởng hành vi: hook `after` gọi `rmSync(process.env.TMPDIR, …)`, tức là đọc biến môi trường
  vào lúc hook chạy chứ không giữ đường dẫn trong một hằng. Thân ca không đổi TMPDIR nên không có lỗi thật, nhưng nếu sau
  này có ca chen vào sửa TMPDIR thì hook sẽ xoá nhầm thư mục.
