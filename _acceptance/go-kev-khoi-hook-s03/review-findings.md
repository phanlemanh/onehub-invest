# Review findings: go-kev-khoi-hook-s03

## Trong hợp đồng

- **Dòng log mới 'group=… kev=off account=…' làm hỏng việc tách tên nhóm ở hai chỗ đọc log hook: tên nhóm bị dính thêm ' kev=off'**
  file: `collector/openclaw/handler.js:213`
  severity: high
  AC: AC-3
  source: conventions
  detail: Trước đây handler ghi `group=${group} p=0.95 account=…`. Hai chỗ đọc log hook tách tên nhóm bằng regex `/group=(.+?)(?:\s+p=|\s+account=|$)/`, tức là dừng ở ` p=` hoặc ` account=`. Hai chỗ đó là app/src/lib/collections-queries.ts:441 (gateByGroup, cho /ops/collections ở máy thu) và pipeline/lib/ops-flow.mjs:48 (phần nhóm của funnel, đẩy lên cloud qua push-ops-facts). Khuôn mới đặt ` kev=off` vào giữa group và account, nên regex lười đọc lố tới ` account=`. Đã chạy thử: dòng `post 202 {…} group=Nhóm A kev=off account=x` cho ra nhóm `Nhóm A kev=off`. Hậu quả: từ lúc áp, mỗi nhóm S03 tách làm hai dòng (tên cũ từ log cũ, tên '… kev=off' từ log mới). Số đếm seen/passed/accepted theo nhóm và tên nhóm hiện ở /ops sai, cả ở máy thu lẫn cloud. Comment trong handler ghi «KHUÔN LOG CŨ — 5 nơi đọc chuỗi này», còn hợp đồng có trục «các bên đọc dòng log `post <status>`». Dù vậy, hai bên đọc này không được kiểm, và cũng không nằm trong danh sách ngoài phạm vi (KEV2 chỉ gỡ lớp «Cổng Kev :8009»). Cách sửa: đặt `kev=off` sau account/by, hoặc thêm `\s+kev=` vào điểm dừng của cả hai regex, và có ca kiểm cho chỗ này.

- **README áp máy thu ghi sai số ca kiểm (7 bộ log mẫu, handler.test 5/5) so với mã thật (8 bộ, 6 ca)**
  file: `_acceptance/go-kev-khoi-hook-s03/ap-may-thu/README.md:20`
  severity: low
  AC: AC-9
  source: conventions
  detail: Mục 2 «Số chạy thử» ghi `handler.test.mjs` 5/5 và «chấm đúng 7 bộ log mẫu (`kiem.sh`)». Thực tế handler.test.mjs có 6 test (thêm ca «cô-lập»), còn kiem.sh chấm 8 bộ mẫu trong mau/ (dat, con-kev-null, hook-cu, khong-tin, watchdog-cu, watchdog-khong-ok, lockdown-vo, canh-bao-kev). Số chạy thử là một trong năm thứ bắt buộc phải có trong hồ sơ áp. Người áp sẽ đối chiếu số thật với số ghi ở đây, nên số sai làm lệch phép so.

- **Đổi khuôn log 'p=…' thành 'kev=off' làm hỏng phần tách tên nhóm ở hai chỗ đọc log hook: tên nhóm bị dính thêm ' kev=off'**
  file: `collector/openclaw/handler.js:213`
  severity: high
  AC: AC-3
  source: bugs
  detail: Dòng log post bây giờ là `post 202 {…} group=<nhóm> kev=off account=…`. Hai chỗ đọc dòng này đều tách tên nhóm bằng `/group=(.+?)(?:\s+p=|\s+account=|$)/`: pipeline/lib/ops-flow.mjs:48 (parseLog, push-ops-facts.mjs gọi) và app/src/lib/collections-queries.ts:441 (gateByGroup, có chú thích 'tên nhóm dừng ở p= hoặc account='). Vì dòng mới không còn ` p=`, phép khớp lười chạy tới ` account=`, tên nhóm thành '<nhóm> kev=off'. Từ lúc áp, mỗi nhóm trên Ops tách thành một dòng mới: số seen/passed/accepted theo nhóm chia đôi giữa tên cũ và tên '… kev=off', và mọi phép ghép với danh sách nhóm trong cấu hình (collections-queries.ts:505 byLog) đều trượt mà không báo lỗi. Comment trong handler đã nhắc '5 nơi đọc chuỗi này', vậy mà diff không sửa regex nào. Probe khong-con-kev.sh, kiem-sau.sh và các test đều không phát hiện lỗi này. Cách sửa: giữ token `p=null` trong dòng log, hoặc thêm `\s+kev=` vào nhóm dừng của cả hai regex.

- **Hình dạng 1/2: round-trip watchdog dựng dòng nhịp từ CHỮ trong script, không lấy từ đầu ra của writer**
  file: `_acceptance/go-kev-khoi-hook-s03/ap-may-thu/kiem.sh:36`
  severity: medium
  AC: AC-9
  source: measurement
  detail: Hàm nhip() lấy giá trị `KEV_NOTE=` đầu tiên bằng sed, lấy mẫu `echo "$(date -Iseconds) ok — …"` bằng grep, rồi thay chuỗi `$KEV_NOTE`/`$DB_NOTE`. Không có lần nào chạy zalo-watchdog.sh. Phần (c) được mô tả là «round-trip từ WRITER THẬT», nhưng với watchdog nó chỉ đo lại văn bản nguồn: trùng với chốt tĩnh `grep '^KEV_NOTE="kev:off (K1)"$'` của probes/khong-con-kev.sh. Nó không bắt được trường hợp KEV_NOTE bị gán lại về sau hay dòng nhịp không được ghi. Các chuỗi «ok —» và «0 turn mới» là chữ cứng trong mẫu nên luôn qua.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2: fixture viết tay theo khuôn mà writer không bao giờ ghi (mau/watchdog-khong-ok)**
  Người dùng thấy gì: Bộ kiểm sau áp có một ca mẫu dựng theo cảnh không bao giờ xảy ra thật. Nếu watchdog vỡ lớp bảo vệ trên máy thật, bộ kiểm có thể không nhận ra đúng kiểu đó.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của một phép kiểm phụ sau khi áp, không mất dữ liệu, người vận hành vẫn thấy cảnh báo từ nơi khác và sửa sau rẻ.
  file: `_acceptance/go-kev-khoi-hook-s03/ap-may-thu/mau/watchdog-khong-ok/watchdog.log`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1: ca «khoá-đọc» grep mã nguồn handler thay vì kiểm log đầu ra**
  Người dùng thấy gì: Phép kiểm khoá bí mật không bị ghi ra log chỉ đọc mã nguồn, không đọc log thật. Một sửa đổi sau này có thể làm lộ khoá vào log mà bộ kiểm vẫn xanh.
  Căn cứ: Hiện hook không ghi khoá nên chưa có hậu quả; rủi ro chỉ xuất hiện nếu ai đó sửa về sau, và thêm phép kiểm lúc ấy rẻ.
  file: `collector/openclaw/handler.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: assert âm `down.kevHits === 0` rỗng do dựng sẵn (cổng chấm đã đóng)**
  Người dùng thấy gì: Một dòng kiểm trong trường hợp cổng chấm đã đóng luôn đúng nên không có tác dụng. Người dùng không thấy khác biệt nào.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, phép kiểm thật đã nằm ở ca cổng còn sống, sửa không đáng công.
  file: `scripts/kev-nhan/acceptance.mjs`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
