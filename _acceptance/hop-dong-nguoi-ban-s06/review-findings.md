# Review findings: hop-dong-nguoi-ban-s06 (round 2)

Phạm vi soát: `pipeline/thu-so-s06.mjs` ở HEAD `43eb62a0` (đọc trọn 577 dòng, tập trung các đường ra), ba tệp test của bộ thu (`thu-so-s06.test.mjs`, `thu-so-s06-viec.test.mjs`, `thu-so-s06-e2e.itest.mjs`), và đối chiếu với `review-findings.md` vòng 1. Bộ nạp (`import-chotot.mjs`, `import-airbnb.mjs`), `bu-seller-v5.mjs` và ba tệp test của chúng không đổi từ `19b7e7a8`, nên các mục vòng 1 thuộc bộ nạp được giữ nguyên, không đo lại. Phiên chấm không viết mã này, không sửa mã hay test. Phép đo chạy trên bản chép trong scratchpad, dữ liệu giả, lược đồ tạm; riêng lượt e2e mở Chrome thật ngoài màn hình trên máy chủ giả 127.0.0.1, không gọi nguồn. Không in SĐT.

Không phát hiện nào chặn verdict theo luật eval. Hai mục mức trung bình của vòng 1 ngoài hợp đồng đã hết. F1 vẫn còn nguyên; F2 thu hẹp.

## Trong hợp đồng

- **F1 (thấp, không chặn, còn nguyên từ vòng 1) — hai hình dạng tài khoản đã có số vẫn vào việc, trái nguyên văn AC-4 «ở bất kỳ tin nào».** Đo lại vòng 2 bằng tiến trình thật `--minutes 0` trên lược đồ tạm:
  - Số chỉ có trong state ở tin thứ ba của tài khoản: ra 1 việc (số ở tin thứ hai: ra 0). Dòng 132 tới 135 chỉ soi `list_id1`, `list_id2`.
  - Số trong stg nằm trên tin nay đã ẩn số, tài khoản còn tin khác không ẩn: ra 1 việc, vì truy vấn `tkDaSo` ở dòng 126 tới 130 lọc `phone_hidden`.
  - Mức ảnh hưởng: tối đa một lời gọi thừa mỗi tài khoản, vì gọi xong số vào stg. Vòng 1 đo hôm nay cả hai bằng 0 trên DB. E4 chỉ gieo dạng số trong stg ở tin không ẩn.

- **F2 (thấp, không chặn, thu hẹp) — tài khoản chưa có số mà hai tin mới nhất đều hết hạn thì vẫn không vào việc.** `chonTinChuaHetHan` (dòng 158 tới 165) đã sửa ca vòng 1: tài khoản hai tin, tin mới nhất `het-han`, nay ra 1 việc (đo lại). Còn lại: ba tin trở lên mà hai tin mới nhất đều `het-han`: ra 0 việc; tài khoản một tin `het-han`: ra 0 việc (đúng, hết tin). Hàm chỉ nhìn `list_id1`, `list_id2` do truy vấn ở dòng 105 tới 110 chỉ mang hai id. Mức ảnh hưởng nhỏ hơn vòng 1; chưa đo trên dữ liệu thật vì không chạm state thật.

- **F3 (thấp, không chặn, còn nguyên) — E1 không chạy nhánh từ chối của bộ nạp S01.** Đột biến vòng 1 (thay chốt phiên bản bằng `if (false)`) vẫn xanh; bộ nạp và test không đổi. Cây thật đúng AC-1, đã đo vòng 1.

- **F4 (thấp, không chặn, đã biết, còn nguyên) — E8 chỉ đọc chữ SQL, không giữ ngữ nghĩa «không lùi».** Là F1 của hồ sơ `chotot-thieu-moc`, chưa khép.

- **F5 (thấp, không chặn, mới) — nửa sau AC-10 «PID trong tệp không mang đúng profile thì không đụng» chỉ có test ở hàm thuần.** Đột biến thay `if (!(await laChromeBoThu(pid, profileDir)))` bằng `if (false)` trong `tatChrome` (dòng 318): 11 test của `hdnb_duong_ra` và `hdnb_viec` vẫn xanh. `hdnb_e2e` không dựng PID lạ nên không bắt; kết luận từ đọc test, không chạy thêm lượt Chrome cho đột biến này. Cây thật đúng: `laChromeBoThuCuaLenh` đúng, và `tatChrome` gọi nó trước khi kill. Hệ quả nếu hồi quy: có thể tắt nhầm một tiến trình khác khi tệp PID cũ trỏ vào PID đã tái dùng.

## Ngoài hợp đồng

- **Lượt kết thúc bình thường ghi lô cuối hai lần, nạp hai lần**
  Người dùng thấy gì: Hiện chưa thấy gì; số vẫn đúng và `[đối chiếu]` vẫn lệch 0. Mỗi lượt kết thúc với lô còn dưới 500 tin thêm một dòng bản ghi snapshot S06 trên máy thu (và hai dòng log `flush`).
  Căn cứ: Dòng 515 tới 518 gọi `ghiSnapshot(batch, "vn")` mà không `splice`, nên `batch` còn nguyên; dòng 521 `flushTruocThoat` thấy `batch.length > 0` và ghi lần hai. Hai thư mục v5 (hoặc cùng một thư mục nếu cùng giây) đều vào `daFlush` và được nạp; nạp lặp idempotent (UPDATE seller-only, snapshot `ON CONFLICT`). Kết luận từ đọc mã, chưa đo trên lượt thật.
  file: `pipeline/thu-so-s06.mjs`
  severity: low
  Đề xuất: known-limits

- **Handler tín hiệu không dừng vòng thu; flush chạy song song với luồng đang thu**
  Người dùng thấy gì: Sau Ctrl-C hoặc SIGTERM, tin hoàn tất trong lúc flush (tối đa 20 giây) có thể không vào stg ngay; nó nằm trong `state.json` và chờ `bu-seller-v5.mjs`. Tín hiệu đến đúng lúc dòng 521 đang nạp còn khiến hai `importDir` xen kẽ trên cùng một kết nối.
  Căn cứ: Handler ở dòng 566 tới 575 chỉ gọi `_flushTruocThoat` rồi `_tatChrome`, không đặt cờ để `motLuong` thoát vòng. `flushTruocThoat` dùng chung `client` pg. Đường chính của AC-11 đo bằng e2e (iii): số đã thu trước SIGTERM vào stg. Kết luận về xen kẽ từ đọc mã, chưa đo; hiếm và idempotent.
  file: `pipeline/thu-so-s06.mjs`
  severity: low
  Đề xuất: known-limits

- **Hai luồng ghi `state.json` không có thứ tự**
  Người dùng thấy gì: Hiện chưa thấy gì. Nếu dừng đúng lúc, bản cũ hơn có thể đè bản mới, mất tối đa một kết quả khỏi state tới lần ghi kế (state chỉ lệch một tin, không sai số).
  Căn cứ: `ghiState` (dòng 94 tới 100) `stringify` rồi `rename` bất đồng bộ; hai luồng gọi gần nhau có thể `rename` ngược thứ tự. Lần ghi tuần tự cuối lượt (dòng 514) sửa lại. Trên đường SIGTERM không có lần ghi cuối. Kết luận từ đọc mã.
  file: `pipeline/thu-so-s06.mjs`
  severity: low
  Đề xuất: known-limits

- **Các mục vòng 1 không đổi** (bộ nạp không đổi; mã bộ thu ở các dòng liên quan không đổi):
  - Lượt số làm mới mốc lần chạy S06 và số bản ghi 24 giờ trên Ops; lượt cuối ghi hai lần (mục trên) làm mốc này nhiều hơn một dòng. severity: low. Đề xuất: new-contract.
  - Lượt thường v5 không có số làm mất tên, mã tài khoản, trạng thái khi cập nhật dòng đã có (nhánh ELSE của `UPSERT_SQL`); chưa có tác dụng vì lượt thường chưa ghi `seller`. severity: low. Đề xuất: known-limits.
  - Item lượt số không có dòng stg vẫn được báo đã nạp (`n++` sau `UPDATE` không khớp). severity: low. Đề xuất: known-limits.
  - Dòng có số có thể mang `phoneStatus` lỗi và giữ qua các lượt thường. severity: low. Đề xuất: known-limits.
  - Số có thể lấy từ thân trang khi nút «Gọi» và `tel:` rỗng (dòng 241, 246); regex không neo đầu chuỗi. severity: low. Đề xuất: known-limits.
  - `con_lai` và `gio_du_kien_xong` cao hơn thực tế vì `tong` (dòng 531) cộng cả state; `displayName` của item lượt số bị bỏ. severity: low. Đề xuất: wont-fix.

## Đã hết so với vòng 1

- **Dừng giữa lượt mất số** (medium): hết. `ghiState` sau mỗi tin (dòng 500); `finally` flush rồi tắt Chrome (dòng 523 tới 528); handler tín hiệu flush trước khi thoát 130. Chứng minh: e2e (iii) xanh, đột biến (c) đỏ đúng chỗ.
- **Chrome ở lại** (medium): hết. `tatChrome` và `_tatChrome` định nghĩa trước vòng chờ CDP; nhánh CDP không lên tắt trước khi ném (dòng 356 tới 359); `try/finally` bọc cả bước tạo tab (dòng 412). Chứng minh: e2e (i), (ii), (iii) đều sạch Chrome, đột biến (b) đỏ. Nối instance sống chỉ chấp nhận khi dòng lệnh chứa đúng profile; nếu không thì thoát 1 và không đụng tiến trình lạ.
- **Không chờ theo Retry-After, không trần luồng** (low): hết. 403 hoặc 429 dừng cả lượt ngay (thoát 2, in số giây); `--threads` quá 2 thoát 1.

## Đã soát, không phải finding

- **Phạm vi biến:** các khai báo dùng ở `finally` và phần báo cáo cuối (`ketQua`, `errors`, `batch`, `flushTruocThoat`, `mau`, `deadline`, `t0`, `chanLienTiep`, `thu`, `iViec`, `tabs`) nằm ngoài `try`; không còn ReferenceError bị nuốt. `giayMoiTin` dùng được sau `finally`.
- **Flush trùng hay gọi `client` đã đóng:** trên đường bình thường, `finally` chạy lại `flushTruocThoat` khi `batch` đã `splice` rỗng và `daFlush` rỗng nên không đụng `client` đã đóng. Hai lần `client.end()` an toàn (có `.catch`). Ngoại lệ trùng lô cuối ở mục ngoài hợp đồng đầu tiên.
- **Handler tín hiệu khi `_flushTruocThoat` còn null:** bỏ qua flush (lúc đó chưa có số nào) rồi `_tatChrome`; khi `_tatChrome` cũng null thì chưa có Chrome nào do bộ thu spawn. Khi đang chờ CDP: `_tatChrome` đã có và `chromeProc` đã có PID, kill được. Có hạn 20 giây cho flush, 10 giây cho tắt, `process.exit(130)` đúng một lần dù nhận tín hiệu hai lần.
- **`process.exit` ở nhánh Chrome lạ (dòng 377):** nằm trước tab và trước mọi Chrome do bộ thu spawn, không bỏ sót việc dọn; thoát 1, `client` pg bị đóng theo tiến trình.
- **Nhánh nối instance sống:** PID lấy từ tệp, hoặc từ `lsof -sTCP:LISTEN` rồi kiểm dòng lệnh chứa profile; cuối lượt `tatChrome` tắt instance đó, nên instance sót từ lượt lỗi cũ bị dọn ở lượt sau.
- **Kết thúc bằng 429 trong e2e (ii):** thoát 2, in `DỪNG NGAY` và `Retry-After 120 giây`, Chrome sạch.
- **Tên miền:** không URL hay tên miền trần mới trong mã vòng 2; log chỉ in `web=«che»`.
- **Lối vào qua symlink:** HEAD khác `a0a84973` đúng ở điều kiện lối vào (`realpathSync`), không đổi hành vi nào khác.
