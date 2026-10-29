# Review findings: cong-tac-that (vòng 1)

Phiên chấm mới, cây `7d257c00`. Các mục dưới đây không làm trượt AC nào của hợp đồng. Mạnh quyết từng mục.

## Ngoài hợp đồng

- **OOC-1 Lệnh cài launchd cũ trỏ thẳng vào lượt thu Airbnb, không qua cổng vòng đời**
  Người dùng thấy gì: ai chạy lệnh cài lịch cũ của khúc thu tuần thì lịch đó gọi thẳng lượt thu S01. Khi đó S01 tạm dừng mà vẫn bị thu, đúng ca mà việc này muốn chặn.
  Căn cứ: hậu quả giống sự cố gốc (tạm dừng mà vẫn gọi nguồn). Tệp cài này lại đè lên đúng nhãn lịch đang dùng, nên bản cài đúng bị thay mà không ai báo. Xoá hay trỏ lại bây giờ rất rẻ.
  file: `pipeline/scripts/setup-cron.sh`, `pipeline/scripts/com.oneinvest.collector.plist`
  severity: medium
  Đề xuất: xoá cặp tệp cũ, hoặc trỏ plist cũ sang `weekly-with-jitter.sh`. Hai tệp thuộc làn ZCode, nên gửi bằng `tin GIAO`.

- **OOC-2 Các đường chạy tay của S01 và S02 không qua cổng**
  Người dùng thấy gì: chạy tay lượt thu tuần, chạy thử AirDNA hay gọi thẳng collector thì vẫn thu, kể cả khi nguồn đang tạm dừng ở /ops.
  Căn cứ: chỉ xảy ra khi có người chủ động chạy tay, nên nhẹ. Nhưng công tắc «tạm dừng từ cloud» (TV4b) sẽ hứa một điều mà các đường này không giữ.
  file: `pipeline/scripts/weekly-collect.sh`, `scripts/airdna-pilot.sh`
  severity: low
  Đề xuất: ghi rõ trong runtime-map rằng «chạy tay bỏ qua cổng», hoặc chuyển cổng vào `weekly-collect.sh` hay collector CLI ở TV4b.

- **OOC-3 Vùng S06 đang bật nhưng tham số hỏng bị bỏ lặng lẽ**
  Người dùng thấy gì: bật một vùng mới ở /ops mà nhập thiếu mã vùng thì vùng đó không bao giờ được thu, và nhật ký không có dòng nào nói vì sao. Nếu mọi vùng bật đều hỏng như vậy, nhật ký lại báo «không còn vùng active». Nhập thiếu mã thành phố thì tin thu về không gắn thành phố.
  Căn cứ: không mất dữ liệu cũ, nhưng người vận hành không tự phát hiện được. Với ca thiếu mã thành phố, tin mới có thể nạp sai khu. Sửa sau rẻ.
  file: `pipeline/collect-chotot.mjs`
  severity: low
  Đề xuất: với mỗi vùng active thiếu `region_v2` hay `cityCode`, in một dòng gồm mã vùng và lý do `params-hong`. Hoặc kiểm hai trường này ở biểu mẫu /ops.

- **OOC-4 Dữ liệu mẫu của test hỏng lặng lẽ, lược đồ mẫu khác lược đồ thật**
  Người dùng thấy gì: đổi lược đồ nguồn và nhóm (đã xảy ra với 047 và 048) có thể làm bộ test đo nhầm mà vẫn xanh. Máy mới không có sẵn DB thử thì bộ test đỏ, mà lý do lại không rõ.
  Căn cứ: hồ sơ `khoa-nap-s05-paused` đã vấp đúng kiểu «dữ liệu mẫu chèn hỏng lặng lẽ» sau 047. Bộ này lặp lại rủi ro đó và cần một DB dựng tay sẵn.
  file: `pipeline/scripts/cong-tac-that.test.mjs`
  severity: low
  Đề xuất: kiểm mã thoát của từng lệnh psql khi dựng mẫu, tự tạo và xoá DB thử, và dựng lược đồ từ migration 047/048 thay cho bảng tối giản.
