# Hồ sơ áp VHZ2 lên máy thu

**Ký hồ sơ này = mã vào `main` nhưng bộ canh tự khởi động lại gateway vẫn TẮT. Bật là một bước riêng, chỉ chạy khi có lời Mạnh.**

Hàng không có migration, không ghi DB, không sửa cấu hình gateway, không cài launchd mới. Watchdog đang chạy 5 phút một lần từ checkout chính, nên mã có hiệu lực ngay ở lượt kế sau khi kéo `main`. Vì vậy tệp tắt phải có TRƯỚC khi kéo.

## Công tắc đã được xác minh

- Đường mã: toàn bộ nhánh tự khởi động lại nằm trong khối `if [ "${ZALO_WATCHDOG_P1_TAT:-0}" != "1" ] && [ ! -f "$P1_TAT_TEP" ]` của `scripts/zalo-watchdog.sh`. Có tệp thì không vào khối, không có lời kickstart nào.
- Ca kiểm: `TAT-TEP` của `scripts/watchdog-tu-khoi-dong-gateway/acceptance.mjs`. Có tệp: 0 lời kickstart. Gỡ tệp: 1 lời ở lượt kế. `TAT-ENV` đo tương tự với biến môi trường.
- Giới hạn: khi tắt, watchdog **không ghi dòng log nào nói nhánh đang tắt**. Bằng chứng tắt là tệp còn tồn tại và sổ kickstart không có dòng mới.

## Phần áp: chạy khi gộp, giám sát thực hiện

### Bước 1. Tạo tệp tắt, TRƯỚC khi kéo `main`

```bash
touch ~/dev/onehub-invest/pipeline/logs/zalo-watchdog-p1-tat
```

Kiểm: lệnh dưới phải in `CO TEP`.

```bash
test -f ~/dev/onehub-invest/pipeline/logs/zalo-watchdog-p1-tat && echo "CO TEP"
```

### Bước 2. Sao lưu mốc trước khi áp

Hàng không đổi dữ liệu, nên chỉ cần ghi mốc để so sau khi áp.

```bash
git -C ~/dev/onehub-invest rev-parse HEAD
```

```bash
wc -l ~/dev/onehub-invest/pipeline/logs/zalo-watchdog-p1.log
```

Tệp sổ vắng nghĩa là chưa từng có lần tự khởi động nào, ghi mốc là 0 dòng.

### Bước 3. Gộp PR rồi kéo về

```bash
git -C ~/dev/onehub-invest pull --ff-only origin main
```

### Bước 4. Kiểm sau khi áp, đợi ít nhất 5 phút

Bộ canh vẫn chạy: dòng cuối phải có `ok —` và thời điểm trong 5 phút gần nhất.

```bash
tail -1 ~/dev/onehub-invest/pipeline/logs/zalo-watchdog.log
```

Không có lần kickstart nào: số dòng phải bằng mốc ở bước 2.

```bash
wc -l ~/dev/onehub-invest/pipeline/logs/zalo-watchdog-p1.log
```

Tệp tắt còn nguyên: chạy lại lệnh kiểm của bước 1.

**Số chạy thử:** trên worktree, ca `TAT-TEP` đạt, bộ mặc định 27/27, `mo-lai` 3/3. Kỳ vọng thật sau áp: 0 lời kickstart.

### Cách lùi

Lùi mã: mở PR `git revert` commit gộp, gộp rồi kéo về như bước 3. Tệp tắt giữ nguyên trong lúc lùi.

## Phần bật: CHỈ CHẠY KHI CÓ LỜI MẠNH

Gỡ tệp tắt:

```bash
rm ~/dev/onehub-invest/pipeline/logs/zalo-watchdog-p1-tat
```

Kiểm: lệnh dưới phải in `DA GO`. Lượt 5 phút kế, watchdog vẫn có dòng `ok —`. Chỉ khi kênh S03 treo đủ 10 phút mới có một dòng mới trong `zalo-watchdog-p1.log`, trần 1 lần mỗi 6 giờ.

```bash
test ! -f ~/dev/onehub-invest/pipeline/logs/zalo-watchdog-p1-tat && echo "DA GO"
```

Cách lùi: tạo lại tệp bằng lệnh ở bước 1, có hiệu lực từ lượt 5 phút kế.
