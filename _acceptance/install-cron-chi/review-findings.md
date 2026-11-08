# Review findings: install-cron-chi (round 2)

Phạm vi đọc: `git diff origin/main..eb60ad59` gồm `scripts/install-cron.sh` (+26/−2) và `scripts/install-cron-chi.test.mjs` (+89).
Mọi phép thử chạy với HOME giả, `launchctl`/`security` giả; không cài job thật, không đụng Keychain thật.

## Trong hợp đồng

(không có finding nào map được vào AC. E1–E5 đều đạt, xem evidence-report.md)

Đã soát và KHÔNG thấy lỗi ở các đường sau:
- **Mảng rỗng dưới `set -u` (bash 3.2 của macOS).** `"${JOBS[@]}"` chỉ được dùng sau khi mảng rỗng đã được gán đủ ba job, nên không có lỗi «unbound variable».
- **Mật khẩu.** `printf '%s' "$BACKUP_PASS" | security … -w` đưa mật khẩu qua stdin; không có `set -x`, không echo giá trị.
- **BACKUP_DIR chỉ vào plist backup.** Điều kiện `[ "$f" = "backup" ]` giữ nguyên như bản cũ.

## Ngoài hợp đồng

(không có. Mục vòng 1 «--chi không kèm tên job thì cài lại cả ba job» đã sửa ở eb60ad59 và nằm trong AC-4.)
