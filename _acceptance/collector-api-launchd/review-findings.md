# Review findings: collector-api-launchd (round 1)

Phạm vi đọc: `git diff origin/main...HEAD` tại 13aadd8 (`scripts/install-collector-api.sh` +47,
`pipeline/scripts/install-collector-api.test.mjs` +89, hồ sơ). Đọc kèm khuôn plist `pipeline/cron/com.oneinvest.collector-api.plist`,
launcher `collector/scripts/api-launchd.sh` (cả hai không đổi trong diff), năm script `install-*.sh` cùng khuôn, và các plist
đang cài ở `~/Library/LaunchAgents` (chỉ đọc). Mọi phép thử chạy trên bản chép trong scratchpad với HOME giả và launchctl giả.
Không chạy script với HOME thật, không gọi launchctl, không đụng tiến trình :9210 (chỉ đọc `lsof`/`ps`).

## Trong hợp đồng

(không có finding nào map được vào AC — E1–E5 đều đạt; xem evidence-report.md)

Đã soát và KHÔNG thấy lỗi ở các đường sau:
- Bốn cửa chặn của AC-3 (thiếu khoá, node tuyệt đối không có, thiếu dist, dist cũ hơn main.ts): phiên chấm thử riêng từng ca.
  Cả bốn đều thoát khác 0, in dòng `lỗi: …` đúng nguyên nhân, không ghi plist và không có lời gọi launchctl nào. Probe hồ sơ chỉ
  kiểm «không ghi» ở ca 3a; phép thử này phủ nốt ba ca kia. Mọi `die` nằm trước `mkdir -p "$DEST"`, nên đọc mã cũng ra cùng kết luận.
- `chmod 600` không cản launchd. launchd đọc plist người dùng sở hữu ở quyền 600: `com.oneinvest.chotot.plist` đang cài quyền
  600 và `pipeline/logs/chotot.log` vẫn được ghi lúc 26/10 05:43. Năm script `install-*.sh` khác cũng `chmod 600`.
  Ghi đè plist cũ quyền 644 thì quyền sau là 600 (đã thử).
- Gọi qua symlink: `ROOT="$(cd "$(dirname "$0")/.." && pwd)"` giữ đường logic. Gọi `~/dev/one-invest/scripts/install-collector-api.sh`
  thì plist trỏ `/Users/manhphan/dev/one-invest/...`. Phép thử trên bản chép có symlink cho đúng kết quả đó. Đường này khớp mọi
  plist `com.oneinvest.*` đang cài, và khớp chính plist collector-api cài ngày 19/10. launchd chạy `/bin/bash <đường>`, bash mở
  tệp qua symlink bình thường. Không có tác động lên bộ canh: `zalo-watchdog.sh` đọc `$ROOT/collector/snapshots`, và hai đường
  (symlink hay thật) trỏ cùng một thư mục vật lý. Tiến trình tay hiện tại cũng chạy với `PWD=/Users/manhphan/dev/one-invest/collector`.
- Kiểm tuổi build chỉ so `main.ts`. Probe ghi nhận `src/core` mới hơn dist vẫn KHÔNG bị chặn. Đúng như mục Out of scope của hợp
  đồng đã khai, và bước triển khai luôn `rm -rf dist && npm run build` trước.

## Ngoài hợp đồng

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **Script không từ chối chạy ngoài checkout chính — chạy từ worktree thì plist trỏ vào worktree**
  Người dùng thấy gì: Không thấy gì lúc cài, vì script in «đã ghi … (plutil -lint OK)». Nếu người triển khai gọi script từ một worktree (`.claude/worktrees/…` hay `~/dev/onehub-invest-zcode`), plist trỏ `ProgramArguments` và log vào worktree đó. Khi worktree bị dọn, launchd KeepAlive lặp khởi động hỏng, :9210 tắt, và hook Zalo POST không vào được.
  Căn cứ: `ROOT` suy từ chỗ đặt script (`scripts/install-collector-api.sh:8`), không so với checkout chính. Phép thử trên bản chép: plist mang đúng đường bản chép (`cai-dat.sh` mục (1) cũng dựa vào điều này). Năm script `install-*.sh` khác cùng khuôn, nên đây là nếp có sẵn, không riêng diff này. Nhưng job này KeepAlive và nằm trên đường nhận tin Zalo.
  file: `scripts/install-collector-api.sh`
  severity: low
  Đề xuất: known-limits (ghi rõ vào lời GIAO triển khai: gọi đúng `~/dev/one-invest/scripts/install-collector-api.sh` từ checkout chính và soát đường trong plist in ra trước bootstrap)

- **Không tạo `pipeline/logs` như năm script cùng khuôn**
  Người dùng thấy gì: Trên checkout chính thì không thấy gì, vì `pipeline/logs` đã có (gitignored, tạo từ trước). Trên bản clone mới hay máy mới, thư mục log chưa có. Theo hành vi đã biết của launchd, job không mở được `StandardOutPath` sẽ không khởi động được (thường thấy là mã EX_CONFIG), trong khi script vẫn báo cài xong.
  Căn cứ: `install-airdna-daily.sh:9`, `install-chotot-daily.sh:9`, `install-airbnb-cron.sh:11`, `install-cron.sh:13` và `install-zalo-heartbeat.sh:8` đều `mkdir -p "$DEST" "$ROOT/pipeline/logs"`. Script này chỉ `mkdir -p "$DEST"` (dòng 40). Phép thử: cài trên bản chép không có `pipeline/logs` thì thoát 0 mà thư mục không được tạo. Phiên chấm không thử hành vi launchd thật (không launchctl).
  file: `scripts/install-collector-api.sh`
  severity: low
  Đề xuất: new-contract (thêm `"$ROOT/pipeline/logs"` vào `mkdir -p` cho khớp khuôn — một dòng, làn ZCode)

- **`sed "s|__ROOT__|$ROOT|g"` hỏng khi đường gốc có `&` hoặc `|`; ca `|` còn để lại plist rỗng trong LaunchAgents**
  Người dùng thấy gì: Với đường có `&`, script thoát 0 và báo «plutil -lint OK», nhưng plist trỏ tới `.../a__ROOT__b/collector/scripts/api-launchd.sh`, một đường không tồn tại (sed thế `&` bằng chuỗi khớp). Với đường có `|`, sed lỗi và script thoát khác 0, nhưng redirect đã tạo `com.oneinvest.collector-api.plist` 0 byte, quyền 644, ngay trong LaunchAgents. Nếu đã có plist cũ thì plist cũ bị cắt rỗng.
  Căn cứ: phép thử trên bản chép, gốc tên `a&b`: 3 dòng còn `__ROOT__`, quyền 600, thoát 0. Gốc tên `a|b`: «bad flag in substitute command», plist 0 byte quyền 644. Script ghi thẳng vào `$OUT` (dòng 41) rồi mới `plutil -lint` (dòng 43), không qua tệp tạm. Đường thật `/Users/manhphan/dev/one-invest` không có ký tự nào như vậy. Năm script cùng khuôn cũng dùng `sed` y hệt.
  file: `scripts/install-collector-api.sh`
  severity: low
  Đề xuất: known-limits (muốn chặt hơn: ghi ra tệp tạm, lint, kiểm không còn `__ROOT__`, rồi `mv` vào LaunchAgents)

## Known limits

- Kiểm tuổi build chỉ so `collector/src/api/main.ts`, đúng Out of scope của hợp đồng. Probe xác nhận tệp nguồn khác mới hơn dist
  không bị chặn.
- Script không gọi launchctl, nhưng plist đã nằm trong `~/Library/LaunchAgents` thì launchd tự nạp ở lần đăng nhập hay khởi động
  máy sau (RunAtLoad + KeepAlive). Plist collector-api cài ngày 19/10 (quyền 644, có `EnvironmentVariables HOME`, không có
  `ExitTimeOut`) vốn đã ở đó với cùng hệ quả. Sau khởi động lại thì tiến trình tay không còn, nên job launchd lên thay mà không
  đi qua quy trình bằng chứng của lời GIAO triển khai.
- Tiến trình :9210 hiện tại (PID 63069, chạy từ 21/10 14:41, `XPC_SERVICE_NAME=0`) không do launchd khởi động, đúng là tiến trình tay.
  Hạ nó và bootstrap là lời GIAO riêng.
- Plist mới bỏ `EnvironmentVariables HOME` so với plist đang cài. `api-launchd.sh` cần `$HOME` (`set -u`). launchd đặt HOME cho
  agent miền gui, và `com.oneinvest.zalo-watchdog.plist` không khai biến môi trường mà `zalo-watchdog.sh` vẫn dùng `$HOME`.
  Khác biệt này có sẵn ở khuôn trên main, không thuộc diff này.
- Script chỉ kiểm tệp khoá có mặt, không kiểm có nội dung. Khoá rỗng thì `main.ts` fail closed và thoát, nên KeepAlive lặp lại.
  Đây là hành vi an toàn, không phải lỗ hở.
