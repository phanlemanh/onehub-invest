# Review findings: uc-ta-5-tmp-rieng (round 2)

Phạm vi đọc vòng 2: `git diff 6045cea..99d20de` (merge-base = origin/main 6045cea). Có hai tệp mã. Tệp
`scripts/ui-capture-login.test.mjs` giữ nguyên như vòng 1. Tệp `scripts/ui-capture-browser.test.mjs` thêm 3 dòng: 2 dòng
chú thích và dòng `s.keepAliveTimeout = 120000; s.headersTimeout = 121000;` trong chuỗi `SERVER_SRC`. Phiên chấm đọc đối
chiếu `capture()`/`loginState()` trong `scripts/ui-capture-login.mjs`. Các phép đo chạy trên bản chép trong scratchpad
(đã xoá) hoặc trên cây làm việc với tệp ghi đè tạm, sau đó khôi phục bằng `git checkout --`. Không commit gì.

## Trong hợp đồng

Vòng 2 (AC-4):

- **Dòng sửa nằm đúng chỗ.** Dòng gán chạy trong chuỗi `SERVER_SRC`, tức là trong tiến trình con phục vụ máy chủ giả.
  Nó nằm trước `s.listen(...)`. Phía bị đóng kết nối là máy chủ, nên sửa ở phía máy chủ là đúng.
- **Thời gian chặn thật giữa hai lần fetch.** Phiên chấm đo trên bản chép có gắn đồng hồ, ở load average khoảng 9.
  Mỗi lệnh `playwright-cli` mất khoảng 0,5 giây, tối đa 0,93 giây. Đo cả tệp có 60 lệnh, tổng 28,6 giây.
  Giữa lần POST /login của lượt chụp trước và lần GET /login của lượt sau có 7–8 lệnh chặn: `state-load`, `goto`, 3–4 lần
  `eval`, `screenshot`, `close` của lượt trước, rồi `open` của lượt sau. Cả chuỗi này chạy đồng bộ, vì `chup()` chỉ
  `await` microtask nên vòng sự kiện không được quay giữa hai lượt. Khoảng cách đo được là 3,2–4,1 giây, đã sát ngưỡng
  5 giây mặc định của Node. Ở tải 13–25 như vòng 1 thì khoảng cách vượt ngưỡng là hợp lý.
- **Tái hiện có chủ đích.** Phiên chấm cho mỗi lệnh `playwright-cli` ngủ đồng bộ thêm 1 giây (`Atomics.wait`) để khoảng
  cách lên 10–12,9 giây. Với máy chủ giả bản main, `UC-BR-6` đỏ ở cả 2 lượt có nhật ký đọc được. Lỗi gốc của `fetch` là
  `ECONNRESET` và thông điệp đúng như vòng 1: «GET /login không trả 200». Với bản HEAD, ở cùng độ trễ, cả 2 lượt xanh 3/3.
  Giả thuyết keep-alive chưa được xác nhận ở vòng 1 nay đã có bằng chứng.
- **120 giây là đủ.** Khoảng cách thật khoảng 4 giây, nên 120 giây cho biên gần 30 lần. Muốn vượt 120 giây thì riêng
  phần đuôi của một lượt chụp cộng phần đầu của lượt kế phải chặn hơn 2 phút. Khi đó ca đã vượt trần thời gian riêng của
  nó (120 s với một lượt, 300 s với sáu lượt), dù trần này cũng chỉ được kiểm khi vòng sự kiện quay lại.
- **headersTimeout lớn hơn keepAliveTimeout (121000 > 120000)** và nhỏ hơn `requestTimeout` mặc định (300000) của Node
  v24.21.0. Đây là nếp khuyến nghị: không để headersTimeout ngắn hơn thời gian giữ kết nối. Không có hại.
- **Không đổi khẳng định.** Diff không thêm, xoá hay sửa dòng `assert` nào (E4 đếm được 0). Không đổi trần thời gian của
  ca, không đổi trang giả, không đổi lời gọi `capture()`.
- **Không làm tiến trình test chậm thoát.** Hook `after` gọi `server.kill()`, nên socket giữ sống phía client đóng theo.
  Chạy riêng tệp này trên HEAD mất 26 giây (thời gian thực, 2 lượt). Bản main mất 29–31 giây ở tải tương đương.
- **Không còn tệp nào cùng rủi ro.** Trong `scripts/*.test.mjs` có ba tệp khác dựng máy chủ: `check-freshness`,
  `job-exit` và `ui-capture-login`. Không tệp nào vừa fetch giữ sống vừa chặn đồng bộ giữa hai lần fetch.
  `ui-capture-login.test.mjs` dùng runner giả, không chặn.

(r1) AC-1 chưa đạt ở vòng 1. Bộ `scripts/` đỏ 4/5 lượt, cả bốn lần ở `UC-BR-6`, có một lần ở `UC-BR-3` (cùng mã 6).
UC-TA-5 xanh 9/9 trên HEAD. Quyết định `d-20261026T050030Z-1` (Mạnh, 26/10) gộp phần sửa UC-BR vào hồ sơ thành AC-4.
Vòng 2: E1 xanh 5/5 lượt, mỗi lượt 180 pass, 0 fail, 0 skipped.

(r1) Đã soát và KHÔNG thấy lỗi ở các đường sau. Diff của `ui-capture-login.test.mjs` không đổi từ vòng 1 nên các điểm này
vẫn đúng:
- TMPDIR được trả lại kể cả khi ca đỏ: `t.after(...)` được đăng ký ngay sau phép gán, và trả về giá trị cũ hoặc xoá biến.
- Không ảnh hưởng ca khác. UC-TA-5 là ca cuối của tệp. `node --test` tách mỗi tệp ra một tiến trình, nên TMPDIR đổi ở
  đây không lan sang `ui-capture-browser.test.mjs`.
- Thư mục riêng được xoá. Sau vòng 2, thư mục tạm của hệ thống không còn `uc-ta-5-*`, `ui-capture-*` hay `uc-browser-*`
  nào.
- Ca vẫn có răng: `os.tmpdir()` đọc lại TMPDIR mỗi lần gọi. E2 vòng 2 vẫn bắt được đột biến bỏ `rmSync(tmp, …)`.
- Không nới khẳng định: bốn `assert` của UC-TA-5 giữ nguyên.

## Ngoài hợp đồng

Vòng 2: không có phát hiện ngoài hợp đồng mới.

- **(r1) Ca UC-BR-6 / UC-BR-3 (bước chụp trên trình duyệt thật) đỏ chập chờn khi cả bộ chạy song song**
  Người dùng thấy gì: người chạy bộ test `scripts/` thấy đỏ ngẫu nhiên ở ca chụp trên trình duyệt, với lời báo «app dev chưa chạy?» dù ca không cần app. Lượt ghim lại nào chạy cả bộ đều có thể vấp, y như lỗi UC-TA-5 vừa sửa.
  Căn cứ: không mất hay lộ dữ liệu, chạy lại thường xanh, nhưng nó chặn đúng việc mà hồ sơ này muốn gỡ (làn ghim lại cần bộ xanh ổn định). Lỗi có sẵn trên main, không do nhánh gây ra. Sửa sớm thì rẻ, để lâu mỗi lượt ghim lại tốn thêm một vòng chạy.
  file: `scripts/ui-capture-browser.test.mjs`
  severity: medium
  Đề xuất: mở việc riêng. Bước đầu là cho `loginState` giữ lại lỗi gốc của `fetch` (hiện bị `.catch(() => null)` nuốt) để biết đó là reset kết nối, hết giờ hay cổng đóng. Giả thuyết chưa kiểm chứng: lỗi xảy ra khi `fetch` dùng lại kết nối keep-alive cũ sau khi `execFileSync` của playwright-cli chặn vòng sự kiện quá thời gian giữ kết nối của máy chủ giả (5 giây). Máy đang tải cao làm các bước đó chậm hơn.
  Quyết định: `d-20261026T050030Z-1` (Mạnh, 26/10) gộp vào hồ sơ thành AC-4/E4. Vòng 2 đã sửa ở máy chủ giả và xác nhận
  giả thuyết keep-alive (`ECONNRESET`, xem «Trong hợp đồng»). Phần «`loginState` nuốt lỗi gốc» vẫn là hạt giống trong
  «Out of scope» của hợp đồng.

## Known limits

- **Baseline E4 không tự tái hiện ở tải lúc chấm.** Phiên chấm ghi đè tạm tệp test bằng bản origin/main rồi chạy 3 vòng,
  mỗi vòng gồm 1 lượt cả bộ và 2 lượt riêng tệp chạy song song (load average 8–11). Kết quả: 3/3 lượt cả bộ xanh
  180/180, 6/6 lượt riêng tệp xanh 3/3, tức 0 lần UC-BR đỏ trên 9 lần chạy tệp đó. Lỗi chỉ tái hiện được khi kéo dài
  thời gian chặn nhân tạo (xem «Trong hợp đồng»). Probe E4 trên baseline thì đỏ như mong đợi, vì nó là phép kiểm tĩnh.
- **E1 vòng 2 chạy ở tải thấp hơn vòng 1.** Load average lúc E1 vòng 2 là 7,1 → 10,6, còn vòng 1 là 13–25. Năm lượt
  xanh ở tải này chưa tự chứng minh rằng ca hết chập chờn ở tải cao. Bằng chứng cho tải cao là phép tái hiện có độ trễ
  nhân tạo: bản main đỏ, bản HEAD xanh.
- **Nhật ký lặp tái hiện bị ghi đè một phần.** Lượt lặp chạy song song 2 bản main và 2 bản HEAD, nhưng tên tệp nhật ký
  trùng nhau nên chỉ đọc được 1 tệp mỗi bản. Tính cả lượt đầu, có 2 lượt đọc được cho mỗi bản: main đỏ 2/2, HEAD xanh
  2/2.
- **Chưa kiểm bằng thực nghiệm vai trò của headersTimeout.** Khung thử nhỏ chặn 65 giây cho kết quả `ok` cả khi để
  headersTimeout mặc định. Nhưng chính đối chứng dương của khung đó (mặc định 5 giây, chặn 8 giây) cũng `ok` ở 7/7
  lượt, nên khung này không phân biệt được gì. Nhận định «headersTimeout > keepAliveTimeout là vô hại» dựa trên tài
  liệu, không dựa trên phép đo.
- **E4 là phép kiểm tĩnh.** Probe grep `keepAliveTimeout = <số>` trong tệp. Nó không kiểm `headersTimeout`, không kiểm
  dòng gán có nằm trong `SERVER_SRC` không, và một dòng chú thích chứa cùng cụm cũng làm nó xanh. Phần hành vi của AC-4
  («không còn lỗi GET /login») dựa trên E1 và phép tái hiện thủ công ở trên.
- (r1) Lời nhắc nhỏ, không ảnh hưởng hành vi: hook `after` của UC-TA-5 đọc `process.env.TMPDIR` lúc chạy chứ không giữ
  đường dẫn trong một hằng.
