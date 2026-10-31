# Review findings: cong-tac-that (vòng 4)

Phiên chấm mới chạy trên cây `fcbdb1af`. Đối chứng chạy trên worktree sạch của merge-base mới `993d7394`. Mạnh đồng ý mở vòng
4 sau ba vòng REJECT (`d-20261031T012039Z-1`). Mục «Trong hợp đồng» không còn mục nào làm trượt eval. Mục «Ngoài hợp đồng» không
làm trượt AC nào, và Mạnh quyết từng mục.

Đã đóng từ vòng 3:
- **IC-1 (E10)**: harness au3 nhận diện CLI bằng `process.argv.length` (lựa chọn (a) của vòng 3). Không dùng SKIP của
  entrypoint-symlink.test. `cd pipeline && npm test` cho 307/307; ca «AC-3 không còn khuôn cũ» xanh. `au3_chotot` vẫn 11/11.
- **IC-2 (AC-9, đỏ có sẵn)**: đã ghi sổ ba lựa chọn (b) và (c) của vòng 3: revisit `d-20261031T012039Z-1` ở cong-tac-that, và
  revisit `d-20261031T012039Z-2` ở khoa-nap-s05-paused cho `kns_scope`. Lựa chọn (a), việc riêng sửa harness zalo-import/apify,
  đã nêu trong dòng revisit là «sửa ở việc riêng», nhưng chưa có hàng lộ trình hay lời giao nào.
- Chữ `expected` của kns E4 đã khớp với chữ log mới.

## Trong hợp đồng

- **IC-1 (AC-9) Cách đọc «không thêm đỏ so với main» chờ người xác nhận tại Cổng 2** (không làm trượt eval)
  Phiên chấm tự đo lại, không dựa vào lời của người giao. Nhánh thêm 0 đỏ và sửa hai thước đỏ có sẵn trên main (`au3_chotot` 2
  mục, `kns_s05_gate` 2 mục). Năm thước còn đỏ, với output giống hệt main sau khi chuẩn hoá PID và đường tạm: `au3_apify` 1 mục,
  `kns_au3_regress` (cùng mục), `au3_lock` 2 mục, `au3_r1_probe`, `snt_mo_coi` 2 mục. Các thước này thuộc hồ sơ
  `au3-nap-bao-loi` E2/E3/E5/E7/E9/E11, `khoa-nap-s05-paused` E1–E3/E7/E8 và `snapshot-nguyen-tu` E5–E7. Chữ hợp đồng vẫn là
  «tất cả xanh». Dòng revisit ghi «Mạnh xác nhận ở Cổng 2», nên đây là điều người phải tự xác nhận khi ký.
  Người quyết:
  (a) ký `human_signoff` và chấp nhận cách đọc đó; nên kèm một hàng lộ trình hoặc lời giao cho việc sửa harness zalo-import/apify
  (theo bảng làn, `zalo-import-daily.sh` và `apify-facebook-daily.sh` thuộc làn ZCode);
  (b) đòi AC-9 xanh tuyệt đối, tức sửa năm thước trong nhánh này rồi chấm lại.
  file: `scripts/au3-nap-bao-loi/acceptance.mjs`, `_acceptance/au3-nap-bao-loi/probes/r1-nhieu-thi-truong.sh`

## Ngoài hợp đồng

- **OOC-1 Lệnh cài launchd cũ trỏ thẳng vào lượt thu Airbnb, không qua cổng vòng đời** (còn nguyên từ vòng 1)
  Người dùng thấy gì: ai chạy `pipeline/scripts/setup-cron.sh` thì lịch tuần gọi thẳng `weekly-collect.sh`. Khi đó S01 đang tạm
  dừng mà vẫn bị thu, đúng ca việc này muốn chặn.
  Căn cứ: cả hai tệp vẫn còn ở `fcbdb1af`. Plist cũ trỏ `weekly-collect.sh` và đè đúng nhãn `com.oneinvest.collector` đang dùng.
  file: `pipeline/scripts/setup-cron.sh`, `pipeline/scripts/com.oneinvest.collector.plist`
  severity: medium
  Đề xuất: mở hợp đồng mới. Gửi ZCode bằng `tin GIAO` để xoá cặp tệp, hoặc trỏ sang `weekly-with-jitter.sh`.

- **OOC-2 Các đường chạy tay của S01 và S02 không qua cổng** (còn nguyên)
  Người dùng thấy gì: chạy tay lượt thu tuần hay chạy thử AirDNA thì vẫn thu, kể cả khi nguồn đang tạm dừng ở /ops.
  Căn cứ: `pipeline/scripts/weekly-collect.sh` và `scripts/airdna-pilot.sh` vẫn có 0 chỗ gọi `vong-doi`.
  file: `pipeline/scripts/weekly-collect.sh`, `scripts/airdna-pilot.sh`
  severity: low
  Đề xuất: ghi Known limits. Ghi trong `docs/ops/runtime-map.md` rằng «chạy tay bỏ qua cổng», rồi xét lại ở TV4b.

- **OOC-3 Vùng S06 đang bật nhưng thiếu mã thành phố vẫn bị nhận lặng lẽ** (còn nguyên)
  Người dùng thấy gì: bật ở /ops một vùng thiếu `cityCode` thì vùng vẫn được thu, nhưng snapshot ghi `meta.city` rỗng.
  Căn cứ: `collect-chotot.mjs` dòng 52 đẩy `cityCode: r.params.cityCode` mà không kiểm, và dòng 184 ghi giá trị đó vào meta.
  file: `pipeline/collect-chotot.mjs`
  severity: low
  Đề xuất: ghi Known limits. Mở rộng `params-hong` cho ca thiếu `cityCode` khi có việc chạm tệp này, hoặc kiểm ở biểu mẫu /ops
  (TV4b).

- **OOC-4 Dữ liệu mẫu của test vẫn có thể hỏng lặng lẽ** (còn nguyên)
  Người dùng thấy gì: `seed()` bỏ qua mã thoát của từng lệnh `PSQL`. Lược đồ tối giản thiếu CHECK của 047 («paused phải có
  reason»).
  Căn cứ: `pipeline/scripts/cong-tac-that.test.mjs` dòng 73–77. Các ca dương sẽ đỏ nếu seed hỏng, nên rủi ro đo nhầm chỉ còn ở các
  ca «0 lời gọi».
  file: `pipeline/scripts/cong-tac-that.test.mjs`
  severity: low
  Đề xuất: ghi Known limits. Lần tới chạm tệp này thì `assert.equal(r.status, 0)` trong `seed()`, và thêm `reason` cho dòng
  paused.

- **OOC-5 Cổng S01 của lượt thu tuần hỏi trước khi ngủ ngẫu nhiên tới 30 phút** (còn nguyên)
  Người dùng thấy gì: bấm tạm dừng S01 trong khoảng 30 phút sau khi launchd gọi `weekly-with-jitter.sh`, thì lượt tuần đó vẫn
  thu.
  Căn cứ: cổng `vong-doi S01` ở dòng 10–12, `sleep $((RANDOM % 1800))` ở dòng 14.
  file: `pipeline/scripts/weekly-with-jitter.sh`
  severity: low
  Đề xuất: ghi Known limits. Khi làm TV4b, đặt cổng sau `sleep` hoặc trong `weekly-collect.sh`; cách sau giải luôn OOC-2.

Không có OOC mới. Phiên chấm soát delta `993d7394..HEAD` so với delta vòng 3 `25ce701b..59652aaf`, chỉ thấy bốn thay đổi: hai
dòng argv và chú thích của chúng, chữ kns E4, và một dòng revisit kns. Commit gộp `1feeb90a` không đổi tệp nhánh. Có ba điểm
nhỏ ghi ở Known limits của báo cáo, không thành mục riêng: harness au3 phân biệt CLI bằng độ dài argv nên dễ vỡ, scope.sh vòng 3
chưa có dòng revisit ở cong-tac-that, và origin/main đã đi trước 49 commit nên cần repin sau khi gộp.
