# Review findings: s08-lich-tuan (round 2)

Cây `3839846d`, merge-base `cfa59117`. Soát lại bốn finding vòng 1 và phần thay đổi sau khi dựng lại nhánh.

## Trong hợp đồng

- **F2 (thấp, không chặn) — CÒN. `probes/weekly.sh` lỏng hơn AC ở hai vế.** Probe không đổi so với vòng 1. AC-4 đòi «in dòng bỏ qua» nhưng probe chỉ so mã thoát và số lần gọi bộ thu. AC-5 đòi «nạp snapshot mới nhất» nhưng cây giả chỉ có một snapshot. Thử tay lại trên HEAD: cổng trả 3 in «— bỏ qua lượt thu S08»; hai snapshot lệch giờ thì nạp đúng bản mới. Hành vi đúng, probe chưa chứng minh.

## Ngoài hợp đồng

- **Chạy lần hai trong ngày vẫn báo xong dù không thu được gì mới**
  Người dùng thấy gì: Người vận hành đọc log thấy báo xong trong khi không có bản thu mới.
  Căn cứ: Nhẹ: lượt tuần chỉ chạy một lần, số độ tươi vẫn đo theo giờ thu thật nên không che được dữ liệu cũ.
  file: `scripts/s08-danh-muc/s08-weekly.sh`
  severity: low
  Đề xuất: known-limits
- **Tệp lịch tuần còn nằm ngoài git ở máy chạy, chặn lần cập nhật code kế**
  Người dùng thấy gì: Nếu không xử lý, lần cập nhật máy chạy sau merge dừng lại và lượt thu 08/11 có thể không có tệp để chạy.
  Căn cứ: Sửa rẻ nhưng lỡ thì mất một lượt tuần; đã ghi cho bước merge chuyển tệp trước khi cập nhật và kiểm lại trước 08/11 06:30.
  file: `scripts/s08-danh-muc/s08-weekly.sh`
  severity: medium
  Đề xuất: known-limits
- **Tên một ca kiểm còn ghi năm giá trị độ tươi trong khi đã là sáu**
  Người dùng thấy gì: Người dùng không thấy gì khác.
  Căn cứ: Chỉ là chữ trong tên ca kiểm, ca vẫn kiểm đúng sáu giá trị.
  file: `scripts/check-freshness.test.mjs`
  severity: low
  Đề xuất: known-limits

## Ghi chép gốc của phiên chấm (mục ngoài hợp đồng)

Bản chép đúng khuôn thẻ do tác giả viết lại ở mục «Ngoài hợp đồng» trên.

- **F1 (thấp, không chặn) — CÒN. Bộ thu thoát sạch mà không có snapshot mới vẫn bị báo «xong».** `s08-weekly.sh` không đổi logic. Thử lại với bộ thu giả không tạo snapshot: script nạp bản cũ theo `ls -t` và in «✅ S08 tuần: thu + nạp xong». Nhánh dừng ở cap ngày vẫn còn trong `collector/src/core/scheduler.ts`. Chỉ xảy ra khi chạy lần hai trong ngày. Dòng log sai; vòng 1 đã soát việc nạp lại không nhân dòng và SLO đo theo giờ thu cũ.
- **F3 (vận hành, làn merge cần biết) — CÒN.** `git -C ~/dev/onehub-invest status` vẫn có `?? scripts/s08-danh-muc/s08-weekly.sh`, nội dung giống hệt bản trong nhánh (`cmp` xác nhận). Theo mô phỏng vòng 1, `git pull --ff-only` sẽ dừng; vòng này không mô phỏng lại. Phải chuyển tệp trước khi pull, và trả lại đúng chỗ trước lượt launchd 08/11 06:30. launchd đang có nhãn của S08.
- **F4 (rất thấp) — CÒN. Tên test cũ.** `scripts/check-freshness.test.mjs:227` tên «AC-5 bảng SLO đúng năm giá trị giờ», trong khi ghim sáu giá trị.

## Finding mới

Không có.

## Đã soát, không phải finding

- **Ca biên S08 có thật trong đầu ra E1**: `GT-AC-4 S08 tuổi = SLO → fresh` và `SLO+1 → stale`. Cả hai đỏ trên baseline, nên eval có răng.
- **Hai bản freshness** ghi cùng `S08: 192` và cùng `TIME_SOURCE` `airbnb_snapshots.collected_at`.
- **AC-7**: `sync-pii.test.mjs` khẳng định trực tiếp `FILL` không chứa `stg_s08_inventory`.
- **Plist**: lịch là một dict duy nhất, `Weekday=0, Hour=6, Minute=30`, không phải mảng nhiều lịch; trỏ đúng `s08-weekly.sh`.
- **Phép miễn URL DTD của `s08-noi-tiep`** không liên quan tới eval của hồ sơ này, nhưng dính tới plist của hồ sơ này. Xem `_acceptance/s08-noi-tiep/review-findings.md`.
