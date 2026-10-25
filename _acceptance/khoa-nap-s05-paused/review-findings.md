# Review findings: khoa-nap-s05-paused (round 1)

Phạm vi đọc: `git diff origin/main...HEAD -- pipeline/ scripts/` tại `c4511d1` (merge-base = origin/main `5104013`):
`pipeline/apify-facebook-collector.mjs` (+73/−8), `pipeline/cron/com.oneinvest.apify-facebook.plist`, hai test
`pipeline/scripts/s05-{paused,b-lich}.test.mjs`, hai tệp bọc `scripts/apify-facebook-daily.sh` và
`scripts/zalo-import-daily.sh`, harness `scripts/au3-nap-bao-loi/acceptance.mjs` (+62). Các phép thử bổ sung chạy trên
repo tạm trong scratchpad, dùng `node`/`sleep` giả, HOME giả và fetch bị chặn. Không phép thử nào gọi Apify, chạy launchctl,
ghi DB oneinvest hay đụng `~/.openclaw`.

## Trong hợp đồng

(không có finding nào map được vào AC — E1–E13 đều đạt `expected`, kể cả các vế should-NOT-fire; xem evidence-report.md)

Đã soát và KHÔNG thấy lỗi ở các đường sau:
- **Trap `rm -rf` khi chưa lấy khoá**: trap chỉ được đặt SAU khi `mkdir` thành công và đã ghi `pid`/`luc`. Đường «bận >5′ →
  exit» thoát trước khi trap tồn tại, nên không xoá khoá của người khác. Harness LOCK có ca «không đụng khoá của PID sống»
  và ca này xanh ở cả hai tệp bọc.
- **PID tái dùng**: nếu PID ghi trong khoá bị một tiến trình CÙNG user tái dùng, `kill -0` báo còn sống, nên tác vụ chờ như
  cũ cho tới mốc 2 giờ. Đó là hướng an toàn: chỉ chậm, không có hai chủ cùng giữ khoá. Nếu PID bị tiến trình của user khác
  tái dùng, `kill -0` gặp EPERM và coi là chết (đã thử với PID 1: khoá được gỡ, tác vụ nạp). Cách xử lý này đúng, vì mọi
  chủ khoá thật đều chạy cùng user launchd, nên EPERM nghĩa là chủ cũ đã chết.
- **`s05Status` khi `DATABASE_URL` trỏ prod**: hàm chỉ chạy `SELECT status … WHERE code='S05'` và không in `real_name` (probe
  E4 kiểm điều này). `loadGroups` trên main vốn đã mở kết nối tới cùng `DATABASE_URL`, nên không có lớp kết nối mới. Tệp
  bọc mặc định dùng :5433, và plist không khai `DATABASE_URL`. Nếu DB đích không có `source_registry`, truy vấn lỗi và
  collector fail-open (xem Known limits).
- **Fail-open khi DB chết**: đúng AC-5. Probe (c) xác nhận có dòng «coi như active» và không coi S05 là paused.
- **Mã thoát cuối lượt**: `node … || THU_RC=$?` không bị `set -u` cắt. Bước nạp và transform vẫn chạy, và cuối lượt trả
  `THU_RC` nếu khác 0, nếu không thì trả `JOB_RC` (ca e của APIFY). Khi S05 paused, collector thoát 0, nên lượt vẫn nạp
  snapshot zalo-agent và transform như trước.
- **Guard `main()` khi chạy qua symlink**: launchd chạy qua `~/dev/one-invest` (symlink), và `ROOT` của tệp bọc giữ đường
  logic. Phép thử gọi collector qua đường symlink tới worktree: `main()` vẫn chạy, in cảnh báo fail-open rồi lỗi creds.
  Vậy guard `realpathSync(argv[1]) === fileURLToPath(import.meta.url)` không làm collector im lặng thoát 0.
- **Kẽ hở hai tác vụ cùng gỡ một khoá cũ** (Out of scope): xác nhận đúng như khai. `go_khoa_cu` đọc `pid` rồi mới
  `rm -rf`, và hai bước này không nguyên tử. Tác vụ B đọc PID chết trước khi A gỡ khoá, nên B có thể xoá khoá A vừa lấy
  rồi tự lấy khoá; lúc đó cả hai cùng nạp. Không thấy hệ quả nào ngoài điều đã khai.

## Ngoài hợp đồng

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **Cửa sổ '4 days' không có đệm cho khoảng Sáu→Ba: lượt Thứ Ba trễ thì bài đầu khoảng bị bỏ vĩnh viễn**
  Người dùng thấy gì: Không có lỗi hay cảnh báo nào. Nếu lượt Thứ Ba chạy muộn hơn 06:00 (máy ngủ lúc 06:00 và launchd chạy bù khi máy thức, hoặc actor Apify khởi động chậm), các bài S05 đăng trong khoảng từ lượt Thứ Sáu tới «Thứ Sáu + độ trễ» không lượt nào thu được. Ví dụ lượt Thứ Ba chạy lúc 09:00 thì bài đăng thứ Sáu 06:00–09:00 mất.
  Căn cứ: Lịch là `Weekday 2/5 @06:00`, nên khoảng Sáu→Ba dài đúng 96 giờ, bằng đúng `S05_NEWER_THAN=4 days` của plist và hằng `S05_NEWER_THAN_MAC_DINH`. Chú thích ở `apify-facebook-collector.mjs` ghi «3–4 ngày + đệm», nhưng ở khoảng dài nhất không có đệm. AC-9/AC-10 chỉ đòi ≥ 4 ngày nên vẫn đạt. Nạp trùng bài vô hại (ON CONFLICT post_id), nên một cửa sổ rộng hơn chỉ tốn thêm tin trong trần 100.
  file: `pipeline/cron/com.oneinvest.apify-facebook.plist`
  severity: medium
  Đề xuất: new-contract (đặt `S05_NEWER_THAN` 5 ngày hoặc nhiều hơn, cùng đợt triển khai G2 7/11; làn ZCode)

- **Tệp `luc` không phải số thì bash bỏ cả vòng chờ: tác vụ chạy tiếp KHÔNG giữ khoá và ghi đè khoá của chủ đang sống**
  Người dùng thấy gì: Hai tác vụ cùng đọc-nạp-ghi `apify-daily.state`. Đây đúng kiểu mất hoặc sót snapshot mà khoá AU3 sinh ra để chặn, và log chỉ có một dòng lỗi bash.
  Căn cứ: `[ $(( $(date +%s) - luc )) -gt 7200 ]` gặp `luc=12x` thì ra lỗi «value too great for base». Bash không tương tác hủy cả lệnh ghép `until … done` ở cấp đầu rồi chạy lệnh kế tiếp: `echo $$ > "$LOCK_DIR/pid"` ghi đè PID của chủ khoá, rồi tác vụ nạp, rồi trap xoá khoá của chủ. Phép thử trên repo tạm, khoá ghi PID còn sống và `luc=12x`: ở cả hai tệp bọc, tác vụ thoát 0 và nạp 1 snapshot. Ca đúng phải là chờ. Khả năng xảy ra thấp: `luc` do `date +%s` ghi, mất điện thường để lại tệp rỗng, và tệp rỗng thì được bỏ qua đúng. Ca này chủ yếu xảy ra khi có người sửa tay.
  file: `scripts/zalo-import-daily.sh` (cùng khối ở `scripts/apify-facebook-daily.sh`)
  severity: low
  Đề xuất: new-contract (kiểm `luc` và `pid` là số trước khi tính, ví dụ `case $luc in ''|*[!0-9]*) luc=;; esac`; làn ZCode)

- **Khoá không xoá được thì vòng chờ quay bận vô hạn, không sleep, không trần 60 lượt**
  Người dùng thấy gì: Tác vụ nạp không bao giờ kết thúc và chiếm một lõi CPU. Log launchd phình rất nhanh vì mỗi vòng in một dòng «gỡ khoá cũ của PID …» kèm lỗi `rm`.
  Căn cứ: `go_khoa_cu` luôn `return 0` sau `rm -rf`, kể cả khi `rm` thất bại. Vòng `until mkdir …; do go_khoa_cu && continue; …` vì thế không bao giờ tới bộ đếm `i` hay `sleep 5`. Phép thử với thư mục khoá chmod 500 và PID chết: sau 4 giây bị giết, đã có 1112 dòng «gỡ khoá cũ», 0 lần sleep, 0 lần nạp. Bản main thì chờ 5′ rồi thoát. Điều kiện kích hoạt là khoá do user khác tạo (ví dụ một lượt chạy tay bằng sudo) hoặc sai quyền trên `pipeline/logs`.
  file: `scripts/apify-facebook-daily.sh` (cùng khối ở `scripts/zalo-import-daily.sh`)
  severity: low
  Đề xuất: new-contract (trả mã của `rm`, hoặc vẫn tăng `i` khi gỡ; làn ZCode)

- **Trap `rm -rf` không kiểm chủ khoá: tác vụ bị lấy khoá sau 2 giờ, khi kết thúc, xoá khoá của tác vụ mới**
  Người dùng thấy gì: Chưa ai thấy. Nếu xảy ra, tác vụ thứ ba có thể lấy khoá trong khi tác vụ thứ hai còn nạp, và state bị đọc-ghi chéo.
  Căn cứ: AC-3 cho phép lấy khoá của PID còn sống khi khoá quá 2 giờ. Trap EXIT của chủ cũ chạy `rm -rf "$LOCK_DIR"` mà không so `pid` trong khoá với `$$`. Khoá chỉ bao phần nạp, transform-fb và refresh-bait-gap, nên giữ khoá quá 2 giờ là hiếm. Phiên chấm chỉ đọc mã, không dựng phép thử thời gian thật.
  file: `scripts/apify-facebook-daily.sh` (cùng khối ở `scripts/zalo-import-daily.sh`)
  severity: low
  Đề xuất: known-limits (muốn chặt thì trap chỉ xoá khi `pid` trong khoá bằng `$$`)

- **Lỗi bước thu không theo dòng ghim `JOB FAIL [apify-facebook-daily] bước … mã N`**
  Người dùng thấy gì: Người tìm `JOB FAIL` trong `pipeline/logs/apify-facebook.log` (theo quy ước `scripts/lib/job-step.sh`) không thấy lượt hỏng vì bước thu. Dòng duy nhất là «⚠️ bước thu thoát mã N …». Nếu cả bước thu lẫn transform-fb cùng hỏng, mã cuối lượt là mã thu, và mã transform chỉ còn ở dòng JOB FAIL.
  Căn cứ: `apify-facebook-daily.sh` gọi collector bằng `node … || THU_RC=$?`, không qua `job_step`. Đầu `job-step.sh` ghi rằng dòng ghim là «thứ người tìm trong log launchd». AC-6 chỉ đòi «một dòng log mã thu», và dòng hiện có đạt điều đó.
  file: `scripts/apify-facebook-daily.sh`
  severity: low
  Đề xuất: new-contract (gọi bước thu bằng `job_step apify-facebook-daily thu node …` để có dòng ghim, vẫn giữ mã trả cuối lượt)

- **Chú thích đầu tệp bọc còn ghi lịch cũ**
  Người dùng thấy gì: Người đọc `scripts/apify-facebook-daily.sh` thấy «Chạy 4 lần/ngày (6h/lần) … 400 posts/ngày», trái với plist mới (2 lượt/tuần, trần 100).
  Căn cứ: Dòng 5–6 của tệp bọc không đổi trong diff. Plist và collector đã ghi lịch Ba/Sáu.
  file: `scripts/apify-facebook-daily.sh`
  severity: low
  Đề xuất: known-limits (sửa chú thích trong đợt G2)

## Known limits

- Hai tác vụ cùng gặp một khoá cũ có thể cùng gỡ, và tác vụ sau xoá khoá vừa lấy của tác vụ trước (Out of scope, xác nhận
  đúng như khai).
- Khoá rỗng kiểu cũ vẫn phải chờ rồi gỡ tay (Out of scope). Cùng hệ quả còn có thêm một khe nhỏ: kill -9 đúng lúc giữa `mkdir`
  và lúc ghi `pid`/`luc` cũng để lại thư mục rỗng.
- Fail-open: DB không tới, hoặc truy vấn `source_registry` lỗi (kể cả khi bảng không có ở DB mà `DATABASE_URL` trỏ tới), thì
  collector coi S05 là active. Nếu lúc đó S05 đang paused thì một lượt vẫn gọi Apify, nhận 402, và bước thu trả mã khác 0 ở
  cuối lượt. Đây là lựa chọn của AC-5.
- `pg.Client` của `s05Status` không đặt `connectionTimeoutMillis`. Nếu host DB nuốt gói tin thì collector treo tới timeout TCP
  của hệ điều hành rồi mới fail-open; DB local trên localhost từ chối kết nối ngay.
- Trần 100 tin tính trên cả lượt, không tính cho mỗi nhóm (Out of scope).
- SLO độ tươi S05 = 96 giờ (`scripts/lib/freshness.mjs`, đã có trên main) bằng đúng khoảng Sáu→Ba, nên lượt trễ sẽ hiện thành
  cảnh báo độ tươi. Mục này nằm ngoài diff.
- Lịch mới trong plist chỉ có hiệu lực khi plist được bootout và cài lại (lời giao G2, 7/11). Merge không đổi bản plist đang
  cài trên máy; phiên chấm không kiểm bản đó. Cổng paused trong collector thì có hiệu lực ngay khi checkout chính pull về.
