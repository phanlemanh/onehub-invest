# Review findings: cong-tac-that (vòng 2)

Phiên chấm mới, cây `9b1c4814`. Đối chứng trên worktree sạch của origin/main `25ce701b`. Mục «Trong hợp đồng» làm trượt vòng
này; mục «Ngoài hợp đồng» không làm trượt AC nào, Mạnh quyết từng mục.

## Trong hợp đồng

- **IC-1 (AC-3, E3) Nửa «được nạp» không chạy chuỗi nạp thật** (còn từ vòng 1)
  Ca (c)+(d) chạy một bản chép câu SQL và bộ lọc của chotot-daily.sh bằng `node -e`. Hai lối chạy script thật thì thay bước đọc
  vùng bằng giá trị cứng (`CITIES="hanoi"` ở v2, shim trả `hanoi` ở job-exit.test).
  Hành vi sản phẩm đúng: phiên chấm chạy chotot-daily.sh thật với vong-doi thật và DB tạm, và nó nạp `hanoi` và `da-nang`
  (vùng mới), bỏ `hcmc` (paused) và `hp` (retired).
  Cách sửa: thêm vào `cong-tac-that-v2.test.mjs` một ca chép chotot-daily.sh, vong-doi.mjs thật và node_modules của pipeline
  vào cây tạm, dùng DB tạm có vùng mới active xen với vùng paused và retired, rồi đòi danh sách import đúng vùng active.
  file: `pipeline/scripts/cong-tac-that-v2.test.mjs`

- **IC-2 (AC-9) Harness au3 chế độ chotot của hồ sơ đã ký đỏ thêm 6 mục**
  `node scripts/au3-nap-bao-loi/acceptance.mjs chotot` đỏ 8 mục trên nhánh và 2 mục trên main. Hàm `sandbox()` chép
  chotot-daily.sh mà không có `pipeline/lib/vong-doi.mjs`, nên cổng S06 mới thoát 1 trước mọi bước nạp. Các eval bị ảnh hưởng:
  `au3-nap-bao-loi` E1/E4/E6 (Mạnh ký 25/10), `khoa-nap-s05-paused` E8 và `snapshot-nguyen-tu` E7 (cùng qua `kns_au3_regress`).
  Đây cùng kiểu lỗi mà job-exit.test vấp ở vòng 1.
  Cách sửa: trong `chototSandbox()`, viết một `pipeline/lib/vong-doi.mjs` giả thoát 0, và một bước đọc vùng giả (hoặc thêm
  hanoi/hcmc vào node giả). Thêm `scripts/au3-nap-bao-loi/acceptance.mjs` vào `scope.sh` kèm dòng revisit, và ghi revisit
  vào `au3-nap-bao-loi/decisions.jsonl`. Hai mục có sẵn trên main (thiếu giả `transform-media` từ NH1) nên sửa cùng lúc, nếu
  không thì ghim lại vẫn đỏ.
  file: `scripts/au3-nap-bao-loi/acceptance.mjs`

- **IC-3 (AC-9) Các mục đỏ có sẵn trên main chặn «ghim lại tất cả xanh»**
  `au3_lock` đỏ 2 mục (zalo-import-daily: khoá PID chết và khoá >2h không nạp lại) và `au3_apify` đỏ 1 mục ((a) DB chết thật
  không thấy dòng retry). Hai cây đỏ giống hệt nhau, nên không do nhánh gây ra. Nhưng `khoa-nap-s05-paused` E1–E3 và E7 cần
  chúng xanh. `kns_scope` (E10) thì đỏ vì diff của nhánh: probe đo phạm vi PR cũ, nên trên nhánh nào khác cũng đỏ.
  Người quyết: (a) sửa harness ngay trong việc này, (b) ghi các mục có sẵn thành Known limits kèm việc riêng, hay (c) ghi
  revisit cho `kns_scope` là «thước phạm vi theo PR, không ghim lại được».
  Văn bản `expected` của `khoa-nap-s05-paused` E4/E5 vẫn ghi fail-open («coi như active»), trong khi probe đã đo fail-closed.
  Nên sửa chữ cho khớp dòng revisit `d-20261029T040511Z-1`.
  file: `_acceptance/khoa-nap-s05-paused/evals.yaml`, `scripts/au3-nap-bao-loi/acceptance.mjs`

## Ngoài hợp đồng

- **OOC-1 Lệnh cài launchd cũ trỏ thẳng vào lượt thu Airbnb, không qua cổng vòng đời** (còn nguyên từ vòng 1)
  Người dùng thấy gì: ai chạy `pipeline/scripts/setup-cron.sh` thì lịch tuần gọi thẳng `weekly-collect.sh`. Khi đó S01 tạm
  dừng mà vẫn bị thu, đúng ca mà việc này muốn chặn.
  Căn cứ: plist cũ vẫn trỏ `/Users/…/one-invest/pipeline/scripts/weekly-collect.sh` và đè lên đúng nhãn
  `com.oneinvest.collector` đang dùng. Hậu quả giống sự cố gốc. Xoá hay trỏ lại bây giờ rất rẻ.
  file: `pipeline/scripts/setup-cron.sh`, `pipeline/scripts/com.oneinvest.collector.plist`
  severity: medium
  Đề xuất: mở hợp đồng mới. Gửi ZCode bằng `tin GIAO` để xoá cặp tệp, hoặc trỏ sang `weekly-with-jitter.sh`.

- **OOC-2 Các đường chạy tay của S01 và S02 không qua cổng** (còn nguyên)
  Người dùng thấy gì: chạy tay lượt thu tuần, chạy thử AirDNA hay gọi thẳng collector thì vẫn thu, kể cả khi nguồn đang tạm
  dừng ở /ops.
  Căn cứ: `pipeline/scripts/weekly-collect.sh` và `scripts/airdna-pilot.sh` có 0 chỗ gọi `vong-doi`. Chỉ xảy ra khi có người
  chủ động chạy tay, nên nhẹ. Nhưng TV4b sẽ hứa «tạm dừng từ cloud».
  file: `pipeline/scripts/weekly-collect.sh`, `scripts/airdna-pilot.sh`
  severity: low
  Đề xuất: ghi Known limits. Ghi trong `docs/ops/runtime-map.md` rằng «chạy tay bỏ qua cổng», rồi xét lại ở TV4b.

- **OOC-3 Vùng S06 đang bật nhưng thiếu mã thành phố vẫn bị nhận lặng lẽ** (đã thu hẹp)
  Người dùng thấy gì: bật một vùng ở /ops mà thiếu `region_v2` thì nay nhật ký có dòng `S06 <vùng> params-hong`. Còn thiếu
  `cityCode` thì vùng vẫn được thu, nhưng snapshot ghi `meta.city` rỗng, và tin có thể nạp không gắn thành phố.
  Căn cứ: `collect-chotot.mjs` dòng 52 đẩy `cityCode: r.params.cityCode` mà không kiểm. Không mất dữ liệu cũ, sửa sau rẻ.
  file: `pipeline/collect-chotot.mjs`
  severity: low
  Đề xuất: ghi Known limits. Mở rộng dòng `params-hong` cho trường hợp thiếu `cityCode` khi có việc chạm tệp này, hoặc kiểm ở
  biểu mẫu /ops (TV4b).

- **OOC-4 Dữ liệu mẫu của test vẫn có thể hỏng lặng lẽ** (đã thu hẹp)
  Người dùng thấy gì: test nay tự tạo và xoá DB tạm, và dựng `source_groups` là VIEW trên `collection_units` như 048. Phần
  «cần DB dựng tay» và «bảng thường» của vòng 1 đã hết. Nhưng `seed()` bỏ qua mã thoát của từng lệnh `PSQL`, nên một INSERT
  hỏng vẫn để ca chạy trên bảng rỗng. Lược đồ tối giản cũng thiếu CHECK của 047 («paused phải có reason»): ca (a) chèn S05
  paused không kèm reason, mà lược đồ thật từ chối dòng đó.
  Căn cứ: hồ sơ `khoa-nap-s05-paused` đã vấp đúng kiểu «INSERT hỏng lặng lẽ sau 047». Ở đây các ca dương (nửa dương S05, S06
  thu vùng) sẽ đỏ nếu seed hỏng, nên rủi ro đo nhầm chỉ còn ở các ca «0 lời gọi».
  file: `pipeline/scripts/cong-tac-that.test.mjs`
  severity: low
  Đề xuất: ghi Known limits. Lần tới chạm tệp này thì `assert.equal(r.status, 0)` trong `seed()`, và thêm `reason` cho dòng
  paused.

- **OOC-5 Cổng S01 của lượt thu tuần hỏi trước khi ngủ ngẫu nhiên tới 30 phút** (mới)
  Người dùng thấy gì: bấm tạm dừng S01 trong khoảng 30 phút sau 19:30 Chủ nhật, khi launchd đã gọi `weekly-with-jitter.sh`,
  thì lượt tuần đó vẫn thu.
  Căn cứ: cổng `vong-doi S01` đứng trước `sleep $((RANDOM % 1800))`. Cửa sổ hẹp, mỗi tuần một lần, nên nhẹ. Nhưng TV4b sẽ cho
  bấm tạm dừng từ cloud bất kỳ lúc nào.
  file: `pipeline/scripts/weekly-with-jitter.sh`
  severity: low
  Đề xuất: ghi Known limits. Khi làm TV4b, đặt cổng sau `sleep`, hoặc đặt nó trong `weekly-collect.sh`; cách sau cũng giải OOC-2.
