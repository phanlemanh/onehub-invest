# Review findings: cong-tac-that (vòng 3)

Phiên chấm mới, cây `59652aaf`. Đối chứng trên worktree sạch của merge-base `25ce701b`. Mục «Trong hợp đồng» làm trượt vòng
này; mục «Ngoài hợp đồng» không làm trượt AC nào, Mạnh quyết từng mục. Đây là vòng cuối, nên hồ sơ chuyển lên người.

Đã đóng từ vòng 2: IC-1 (E3 nay chạy chotot-daily.sh thật, thử chiều đỏ thì đỏ) và IC-2 (au3_chotot xanh 11/11, sửa luôn hai
mục có sẵn trên main). Chữ `expected` của kns E5 đã đổi.

## Trong hợp đồng

- **IC-1 (AC-9, E10) Bản sửa harness au3 làm đỏ bộ pipeline** (mới, do commit vòng 3)
  `pipeline/scripts/entrypoint-symlink.test.mjs` «AC-3 không còn khuôn cũ» đỏ, chỉ ra `scripts/au3-nap-bao-loi/acceptance.mjs`.
  Bộ quét đánh dấu tệp có `argv[1]` và `import.meta.url` trong dòng mã mà không có `realpathSync(process.argv[1])`. Commit
  `59652aaf` sinh hai module giả bằng chuỗi có `process.argv[1]`: dòng 108 (vong-doi giả) và dòng 115 (pg bọc). Tệp đã có
  `import.meta.url` ở dòng 24. Pipeline nhánh 306/307; main 299/299; nhánh vòng 2 307/307.
  Hành vi sản phẩm không đổi: đây là lỗi của harness test, nhưng nó làm đỏ eval E10 và câu «bộ test của pipeline/ xanh» của AC-9.
  Cách sửa (chọn một):
  (a) Viết lại phần nhận diện trong hai module giả mà không dùng chữ `argv[1]`. Vong-doi giả có thể so `process.argv.length > 2`
  hoặc dùng `process.argv.at(1)`. Pg bọc có thể phân biệt `node -e` bằng `process.argv.length === 1`. Kèm một dòng chú thích nói
  vì sao.
  (b) Đưa phần sinh module giả ra tệp mẫu riêng không có `import.meta.url`.
  Đừng thêm tệp vào SKIP của entrypoint-symlink.test: đó là tệp ngoài phạm vi và là thước của hồ sơ khác. Sau khi sửa, chạy lại
  cả `cd pipeline && npm test` lẫn `node scripts/au3-nap-bao-loi/acceptance.mjs chotot`.
  file: `scripts/au3-nap-bao-loi/acceptance.mjs`

- **IC-2 (AC-9) Đỏ có sẵn trên main chặn «ghim lại tất cả xanh»** (còn từ vòng 2, nay đủ danh sách)
  Các mục đỏ giống hệt nhau ở nhánh và main:
  - `au3_apify` 1 mục ((a) DB chết thật);
  - `au3_lock` 2 mục (zalo-import-daily: khoá PID chết, khoá >2h);
  - `au3_r1_probe` («R1: hcmc T07 KHÔNG BAO GIỜ được nạp lại»);
  - `snt_mo_coi` 2 mục (zalo-import-daily (b) mồ côi già, (c) `.partial`).

  Hai thước sau cùng vòng 2 chưa nêu. Nhánh không chạm `zalo-import-daily.sh` hay `apify-facebook-daily.sh`. Các thước đỏ này
  nằm trong `au3-nap-bao-loi` E2/E3/E5/E7/E9/E11, `khoa-nap-s05-paused` E1–E3/E7/E8 và `snapshot-nguyen-tu` E5/E6/E7.
  Riêng `kns_scope` (kns E10) đỏ 18 dòng trên nhánh. Phán xử: đây là đặc tính của thước, không phải hồi quy. Thước có danh sách
  tệp cố định của PR 2510-4/9/14 và đo diff `merge-base..HEAD`, nên trên main diff rỗng thì xanh, trên nhánh nào chạm tệp khác
  thì đỏ. Mười tám tệp bị gọi tên đều là tệp của cong-tac-that.
  Người quyết:
  (a) ghi các đỏ có sẵn thành Known limits kèm một việc riêng sửa harness zalo-import/apify (làn ZCode hoặc làn Claude tuỳ tệp);
  (b) ghi revisit cho `kns_scope` là «thước phạm vi theo PR, chỉ đo trên nhánh gốc»;
  (c) chấp nhận AC-9 theo nghĩa «không thêm đỏ so với main».
  file: `_acceptance/khoa-nap-s05-paused/probes/scope.sh`, `scripts/au3-nap-bao-loi/acceptance.mjs`

## Ngoài hợp đồng

- **OOC-1 Lệnh cài launchd cũ trỏ thẳng vào lượt thu Airbnb, không qua cổng vòng đời** (còn nguyên từ vòng 1)
  Người dùng thấy gì: ai chạy `pipeline/scripts/setup-cron.sh` thì lịch tuần gọi thẳng `weekly-collect.sh`. Khi đó S01 tạm
  dừng mà vẫn bị thu, đúng ca mà việc này muốn chặn.
  Căn cứ: cả hai tệp vẫn còn ở `59652aaf`. Plist cũ trỏ `weekly-collect.sh` và đè lên đúng nhãn `com.oneinvest.collector`
  đang dùng. Hậu quả giống sự cố gốc. Xoá hay trỏ lại bây giờ rất rẻ.
  file: `pipeline/scripts/setup-cron.sh`, `pipeline/scripts/com.oneinvest.collector.plist`
  severity: medium
  Đề xuất: mở hợp đồng mới. Gửi ZCode bằng `tin GIAO` để xoá cặp tệp, hoặc trỏ sang `weekly-with-jitter.sh`.

- **OOC-2 Các đường chạy tay của S01 và S02 không qua cổng** (còn nguyên)
  Người dùng thấy gì: chạy tay lượt thu tuần, chạy thử AirDNA hay gọi thẳng collector thì vẫn thu, kể cả khi nguồn đang tạm
  dừng ở /ops.
  Căn cứ: `pipeline/scripts/weekly-collect.sh` và `scripts/airdna-pilot.sh` vẫn có 0 chỗ gọi `vong-doi`. Chỉ xảy ra khi có
  người chủ động chạy tay, nên nhẹ. Nhưng TV4b sẽ hứa «tạm dừng từ cloud».
  file: `pipeline/scripts/weekly-collect.sh`, `scripts/airdna-pilot.sh`
  severity: low
  Đề xuất: ghi Known limits. Ghi trong `docs/ops/runtime-map.md` rằng «chạy tay bỏ qua cổng», rồi xét lại ở TV4b.

- **OOC-3 Vùng S06 đang bật nhưng thiếu mã thành phố vẫn bị nhận lặng lẽ** (còn nguyên)
  Người dùng thấy gì: bật một vùng ở /ops mà thiếu `cityCode` thì vùng vẫn được thu, nhưng snapshot ghi `meta.city` rỗng, và
  tin có thể nạp không gắn thành phố. Thiếu `region_v2` thì đã có dòng `params-hong`.
  Căn cứ: `collect-chotot.mjs` dòng 52 đẩy `cityCode: r.params.cityCode` mà không kiểm, và dòng 184 ghi nó vào meta. Không mất
  dữ liệu cũ, sửa sau rẻ.
  file: `pipeline/collect-chotot.mjs`
  severity: low
  Đề xuất: ghi Known limits. Mở rộng `params-hong` cho trường hợp thiếu `cityCode` khi có việc chạm tệp này, hoặc kiểm ở biểu mẫu
  /ops (TV4b).

- **OOC-4 Dữ liệu mẫu của test vẫn có thể hỏng lặng lẽ** (còn nguyên)
  Người dùng thấy gì: `seed()` bỏ qua mã thoát của từng lệnh `PSQL`, nên một INSERT hỏng vẫn để ca chạy trên bảng rỗng. Lược
  đồ tối giản cũng thiếu CHECK của 047 («paused phải có reason»): ca (a) chèn S05 paused không kèm reason, mà lược đồ thật từ
  chối dòng đó.
  Căn cứ: hồ sơ `khoa-nap-s05-paused` đã vấp đúng kiểu «INSERT hỏng lặng lẽ sau 047». Ở đây các ca dương (nửa dương S05, S06
  thu vùng, và nay danh sách nạp `["hanoi","da-nang"]`) sẽ đỏ nếu seed hỏng, nên rủi ro đo nhầm chỉ còn ở các ca «0 lời gọi».
  file: `pipeline/scripts/cong-tac-that.test.mjs`
  severity: low
  Đề xuất: ghi Known limits. Lần tới chạm tệp này thì `assert.equal(r.status, 0)` trong `seed()`, và thêm `reason` cho dòng
  paused.

- **OOC-5 Cổng S01 của lượt thu tuần hỏi trước khi ngủ ngẫu nhiên tới 30 phút** (còn nguyên)
  Người dùng thấy gì: bấm tạm dừng S01 trong khoảng 30 phút sau 19:30 Chủ nhật, khi launchd đã gọi `weekly-with-jitter.sh`,
  thì lượt tuần đó vẫn thu.
  Căn cứ: cổng `vong-doi S01` ở dòng 10–12, `sleep $((RANDOM % 1800))` ở dòng 14. Cửa sổ hẹp, mỗi tuần một lần, nên nhẹ. Nhưng
  TV4b sẽ cho bấm tạm dừng từ cloud bất kỳ lúc nào.
  file: `pipeline/scripts/weekly-with-jitter.sh`
  severity: low
  Đề xuất: ghi Known limits. Khi làm TV4b, đặt cổng sau `sleep`, hoặc đặt nó trong `weekly-collect.sh`; cách sau cũng giải OOC-2.
