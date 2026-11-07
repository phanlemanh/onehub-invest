# Review findings: install-cron-chi (round 1)

Phạm vi đọc: `git diff origin/main..16c1eaf9` gồm `scripts/install-cron.sh` (+26/−2) và `scripts/install-cron-chi.test.mjs` (+89).
Mọi phép thử chạy với HOME giả, `launchctl`/`security` giả; không cài job thật, không đụng Keychain thật.

## Trong hợp đồng

(không có finding nào map được vào AC. E1–E5 đều đạt, xem evidence-report.md)

Đã soát và KHÔNG thấy lỗi ở các đường sau:
- **Mảng rỗng dưới `set -u` (bash 3.2 của macOS).** `"${JOBS[@]}"` chỉ được dùng sau khi mảng rỗng đã được gán đủ ba job, nên không có lỗi «unbound variable».
- **Mật khẩu.** `printf '%s' "$BACKUP_PASS" | security … -w` đưa mật khẩu qua stdin; không có `set -x`, không echo giá trị.
- **BACKUP_DIR chỉ vào plist backup.** Điều kiện `[ "$f" = "backup" ]` giữ nguyên như bản cũ.

## Ngoài hợp đồng

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **Cờ --chi không kèm tên job thì cài lại cả ba job**
  Người dùng thấy gì: Gõ `bash scripts/install-cron.sh --chi` (quên tên job) thì script cài lại đủ collector, smoke, backup — tức là khởi động lại job thu đang chạy, đúng điều cờ này sinh ra để tránh. Phiên chấm đã thử trên HOME giả: thoát 0, ba plist được ghi.
  Căn cứ: Lệnh Mạnh sẽ gõ luôn kèm `backup`, nên không chạm ca này; sửa là một dòng (`--chi` trơn → thoát 2) nhưng không chặn việc cài sao lưu.
  file: `scripts/install-cron.sh`
  severity: low
  Đề xuất: known-limits
