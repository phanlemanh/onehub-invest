# Review findings: hop-dong-nguoi-ban-s06 (round 1)

Phạm vi soát: `git diff ee3068da HEAD -- pipeline/import-chotot.mjs pipeline/thu-so-s06.mjs pipeline/bu-seller-v5.mjs`, thêm `pipeline/import-airbnb.mjs`, hai tệp test mới, phần DATA-CONTRACT v5, và nơi đọc bảng snapshot. HEAD `19b7e7a8`. Phiên chấm không viết mã này, không sửa mã hay test. Phép đo chạy trên bản chép trong scratchpad, dữ liệu giả, lược đồ tạm. Số trong «đo trên DB» chỉ là số đếm, không in SĐT.

Không phát hiện nào chặn verdict theo luật eval. F1, F2 trái nguyên văn AC-4 ở các ca góc, nên người ký cần đọc.

## Trong hợp đồng

- **F1 (thấp, không chặn) — hai hình dạng tài khoản đã có số vẫn vào việc, trái nguyên văn AC-4 «ở bất kỳ tin nào».** Đo bằng tiến trình thật `--minutes 0` trên lược đồ tạm:
  - Số chỉ có trong state, ở tin thứ ba của tài khoản, stg chưa có: ra 1 việc. Mã chỉ soi `list_id1` và `list_id2` trong state; số ở tin thứ hai thì ra 0 việc. Chú thích trong mã ghi «state hoặc stg», «BẤT KỲ tin nào».
  - Số trong stg nằm trên tin nay đã ẩn số, tài khoản còn tin khác không ẩn: ra 1 việc, vì truy vấn `tkDaSo` lọc `phone_hidden`.
  - Mức ảnh hưởng: tối đa một lời gọi thừa cho mỗi tài khoản, vì gọi xong số vào stg. Trên DB hôm nay cả hai đều bằng 0: state 678 số, 678 có trong stg; 0 tài khoản chỉ có số ở tin ẩn. Dạng đầu chỉ xuất hiện khi state đi trước stg, xem N1. E4 chỉ gieo dạng số trong stg ở tin không ẩn.
- **F2 (thấp, không chặn) — tài khoản chưa có số, tin mới nhất hết hạn, thì không bao giờ vào việc, trái vế sau của AC-4.** Đo: tài khoản 2 tin, tin mới nhất `het-han` trong state, tin còn lại chưa thử: ra 0 việc. `docViec` chỉ xét `list_id1`, và `het-han` được coi là đã xử lý. State thật của ZCode có 5 tin `het-han` trên 709 tin đã thử, ứng với 3 tài khoản chưa có số, cả 3 đều còn tin khác. Nếu giữ tỉ lệ đó thì khoảng 100 trong 14.392 tài khoản bị rơi; đây là suy từ mẫu nhỏ, chưa đo. Tài khoản quay lại hàng việc khi đăng tin mới.
- **F3 (thấp, không chặn) — E1 không chạy nhánh từ chối của bộ nạp S01.** Đột biến thay chốt phiên bản trong `main()` của `pipeline/import-airbnb.mjs` bằng `if (false)`: E1 vẫn xanh. Test chỉ so hằng số, và ca v6 chỉ gọi bộ nạp S06. Cây thật đúng AC-1: chạy thật cả hai bộ nạp với manifest giả, v1 tới v5 qua được chốt, v6 bị từ chối với thông báo «chưa hỗ trợ».
- **F4 (thấp, không chặn, đã biết) — E8 chỉ đọc chữ SQL, không giữ ngữ nghĩa «không lùi».** Đột biến đổi `OR ... IS NULL` thành `OR TRUE`: E8 vẫn 5/5 xanh. Đây là F1 của hồ sơ `chotot-thieu-moc`, chưa khép. Vì bản sửa này nằm cùng câu UPSERT, phiên chấm đo lại trên HEAD: nạp lượt thường cũ hơn thì số, tên, mô tả và mốc đều giữ.

## Ngoài hợp đồng

- **Dừng giữa lượt thì số vừa thu không tới stg, có thể mất hẳn và phải gọi lại nguồn**
  Người dùng thấy gì: Ngắt lượt thu bằng Ctrl-C hoặc SIGTERM, hay lượt ném lỗi giữa chừng, thì số đã bấm hiện chưa lên dữ liệu. Tới 24 tin gần nhất mất hẳn và sẽ gọi lại nguồn ở lượt sau; phần còn lại nằm trong state, chờ có người chạy `bu-seller-v5.mjs`.
  Căn cứ: Handler tín hiệu chỉ tắt Chrome rồi thoát, không `ghiState`, không ghi bản v5, không nạp. `ghiState` chạy mỗi 25 tin; bản v5 chỉ ghi khi đủ 500; việc nạp chỉ chạy ở cuối lượt bình thường. Kết luận từ đọc mã, chưa đo trên lượt thật. Trên đường bình thường, nếu nạp lỗi thì chỉ in một dòng log và lệnh vẫn thoát sạch.
  file: `pipeline/thu-so-s06.mjs`
  severity: medium
  Đề xuất: new-contract

- **Chrome ở lại sau lượt trên một số đường thoát, và lượt sau không bao giờ tắt nó**
  Người dùng thấy gì: Cửa sổ Chrome thu số còn chạy sau khi lệnh đã thoát, đúng loại phiền Mạnh đã phàn nàn.
  Căn cứ: `try/finally` tắt Chrome bắt đầu sau bước nối CDP và tạo tab. Đo bằng một tiến trình giả thay Chrome, không mở trình duyệt, không gọi nguồn: ngắt SIGINT trong lúc chờ CDP, lệnh thoát `<mã khác 0>` và tiến trình giả còn sống; CDP không lên sau 30 lần thử, lệnh thoát `<mã khác 0>` và tiến trình giả còn sống. Đường lỗi tạo tab («tab trùng nhau», `newPage` ném) cũng nằm ngoài `try`, kết luận từ đọc mã. Lượt sau nối vào instance sót, `chromeProc` rỗng nên `tatChrome` không làm gì, Chrome ở lại vô thời hạn. Đường ra bình thường, 5 lỗi chặn, và lỗi giữa lượt đều đi qua `finally`.
  file: `pipeline/thu-so-s06.mjs`
  severity: medium
  Đề xuất: new-contract

- **Lượt thu số làm trang vận hành hiện S06 như vừa chạy**
  Người dùng thấy gì: Nếu job thu thường S06 chết nhưng bộ thu số còn chạy, cột lần chạy và số bản ghi 24 giờ trên Ops vẫn trông mới.
  Căn cứ: `importDir` ghi một dòng vào bảng snapshot với nguồn S06 và mốc bằng giờ lượt số. `getSourceFeedHealth`, `sourceRunsFull` và `readRecords24h` lấy `max(collected_at)` và đếm theo nguồn. Đo: `max` nhảy từ 01/11 lên 02/11 trong khi `captured_at` của tin không đổi. DB hôm nay có 13 dòng như vậy, 945 item. SLO độ tươi KHÔNG bị ảnh hưởng, vì nó đi qua snapshot đang gắn với tin và lượt số không đổi `snapshot_id` của tin.
  file: `pipeline/import-chotot.mjs`
  severity: low
  Đề xuất: new-contract

- **Lượt thường v5 không có số bị bỏ tên, mã tài khoản và trạng thái khi cập nhật dòng đã có**
  Người dùng thấy gì: Hiện chưa thấy gì. Khi kênh S06 chuyển lượt thường lên v5 như DATA-CONTRACT dự kiến, khoảng 53 nghìn dòng đã có sẽ không nhận được `accountRef`, `displayName`, `phoneStatus`; chỉ tin mới có.
  Căn cứ: Nhánh ELSE của `UPSERT_SQL` trừ cả năm khoá khỏi bản mới, rồi chỉ lấy lại từ dòng cũ. Đo: cùng một item v5 có `hidden_by_source`, chèn mới thì giữ đủ ba trường, cập nhật dòng từ v4 thì cả ba rỗng. Lượt thường hiện chưa ghi `seller` nên chưa có tác dụng.
  file: `pipeline/import-chotot.mjs`
  severity: low
  Đề xuất: known-limits

- **Item lượt số không có dòng trong stg vẫn được báo là đã nạp**
  Người dùng thấy gì: Log báo nạp đủ trong khi số không vào đâu; `bu-seller-v5.mjs` thấy «thiếu» mãi, mỗi lần chạy sinh thêm một bản bù và một dòng snapshot.
  Căn cứ: `UPDATE` không có dòng khớp nhưng `n++` vẫn tăng. Đo: log «✅ 1 ads», 0 dòng stg, 1 dòng snapshot. Hôm nay lệch bằng 0, vì bộ thu lấy việc từ chính stg; chỉ xảy ra khi dòng stg bị xoá sau khi thu.
  file: `pipeline/import-chotot.mjs`
  severity: low
  Đề xuất: known-limits

- **Dòng có số có thể mang `phoneStatus` là lỗi, và giữ trạng thái đó qua các lượt thường**
  Người dùng thấy gì: Hiện chưa thấy gì; số vẫn còn và vẫn được dùng.
  Căn cứ: Đo: item lỗi đè dòng có số thì số còn, trạng thái thành `error`; lượt thường sau đó giữ nguyên cả hai. Bảng DATA-CONTRACT định nghĩa `available` là đã có số, nên hai trường trái nhau. Test đB ghim hành vi này. Hiện không có mã nào đọc `phoneStatus` (grep 0 nơi ngoài bộ nạp và bộ thu), và `gan-sdt-s06.mjs` chỉ đọc `phone`. Trên lượt thật, đường duy nhất gọi lại tài khoản đã có số là `--mau N` tường minh; DB hôm nay 0 dòng như vậy.
  file: `pipeline/import-chotot.mjs`
  severity: low
  Đề xuất: known-limits

- **Bộ thu không chờ theo Retry-After, và số luồng không có trần**
  Người dùng thấy gì: Sau 429, lượt vẫn gọi tiếp sau 8–15 giây cho tới đủ 5 lỗi liền. `--threads` nhận giá trị bất kỳ, trong khi phương án đã duyệt là 2 luồng.
  Căn cứ: Đọc mã: `Retry-After` chỉ thành nhãn trong trạng thái, chú thích ghi rõ không đổi nhịp. `chanLienTiep` dùng chung nên luồng kia thành công thì đếm lại từ đầu. Có thể là chủ ý, nên trình để người chốt.
  file: `pipeline/thu-so-s06.mjs`
  severity: low
  Đề xuất: known-limits

- **Số có thể lấy từ thân trang khi nút không ra số**
  Người dùng thấy gì: Một tin có thể nhận số viết trong phần mô tả thay vì số do nút hiện, mà vẫn tính là có số.
  Căn cứ: Đọc mã, chưa đo trên trang thật: thứ tự ưu tiên có `document.body.innerText` khi `tel:` và nút «Gọi» rỗng; regex không neo đầu chuỗi. Không phân biệt nguồn của số trong state hay stg. ZCode đã đo 72/72 «một tài khoản một số» nhưng phép đo đó không tách đường này.
  file: `pipeline/thu-so-s06.mjs`
  severity: low
  Đề xuất: known-limits

- **Số báo cáo cuối lượt và trường tên của lượt số có lỗi nhỏ**
  Người dùng thấy gì: `con_lai` và `gio_du_kien_xong` cao hơn thực tế; `displayName` do item lượt số mang theo bị bỏ.
  Căn cứ: `tong` cộng cả số tin đã có trong state vào việc còn lại, kết luận từ đọc mã. Đo: item lượt số có `displayName` thật, dòng không có `account_name`: tên vẫn rỗng, vì gói ghi không chứa khoá này nên `$2->>'displayName'` luôn rỗng. Mọi nơi gọi hiện truyền null nên chưa có tác dụng.
  file: `pipeline/thu-so-s06.mjs`
  severity: low
  Đề xuất: wont-fix

## Đã soát, không phải finding

- **Dòng có số, lượt thường cùng `captured_at`:** đo trên lược đồ tạm: số, trạng thái, mã tài khoản, tên giữ; mô tả lấy bản mới. Lượt thường cũ hơn: toàn dòng giữ. Không lỗi.
- **Tin `phone_hidden`:** truy vấn việc và cả đường `--mau` đều đi qua cùng một bộ lọc. Dữ liệu thật ở dạng boolean, 7.722 tin; `->>` ra `true` nên lọc đúng, đã đo với boolean thật lẫn `false`. Đường duy nhất còn lại là stg cũ: nguồn ẩn số sau lượt thu cuối, bộ thu vẫn mở trang một lần, không có nút thì ghi `khong-nut`. Không có đường nào cố lấy số tin đã biết là ẩn.
- **Thử lại `khong-nut`, `trang-khac`:** mỗi lượt gọi lại, không có trần. Đúng lời giao 0211-9, không tính là gọi thừa.
- **Thiếu `finishedAt` ở lượt số:** bị từ chối trước khi ghi, dòng không đổi.
- **Khoá `seller_info`:** dữ liệu thật chỉ có `full_name`, `live_ads`, `avatar`, `sold_ads`; không có `phone`, nên lượt thường không rơi vào nhánh thay nguyên cột.
- **Tên miền:** 0 URL ngoài máy và 0 tên miền trần trong phần diff của nhánh; `S06_WEB_BASE` không vào log, trừ chế độ debug đã che.
- **`--minutes 0` trên DB thật:** 14.392 việc khi chưa có state, trên 15.669 tài khoản. Không mở trình duyệt, không ghi gì.
