# PL20 — Gói lệnh đọc bù của đợt 2 (giám sát chạy)

**Lời duyệt:** Mạnh chốt «Làm cả hai đợt» sau khi biết chi phí khoảng 3 USD, và ký Cổng Phạm vi với trần 5 USD. Dòng sổ phủ lượt này: `d-20261118T074222Z-20`, `d-20261118T074222Z-25`.

**Việc:** model đọc mỗi tin một bài cho các tin Ocean Park 1, Grand Park chưa gắn và chưa có bản đọc `dg3-s03-v3`. Dùng lệnh đọc có sẵn của PL30.

**Ghi vào:** chỉ `silver_labels` và `ai_calls`, trên DB máy thu.

**Tác động phụ đã biết:** lượt nạp S03 đọc ô dự án của bản đọc mới nhất (`docNhanDuAn`), nên bài vừa đọc có thể đổi dự án của tin khi chữ bài nêu rõ dự án khác. Đây là đường chạy bình thường của bản đọc hằng ngày PL34. Bước 2 và bước 7 đo đúng số tin đổi.

Đặt biến trước khi chạy:

```bash
W=/Users/manhphan/dev/onehub-invest/.claude/worktrees/ghep-tin-vao-danh-muc
M=/Users/manhphan/dev/onehub-invest
B=$HOME/onehub-backups/db
TS=$(date -u +%Y%m%dT%H%M%SZ)
PSQL="docker exec -i -e PGPASSWORD=oneinvest -e PGOPTIONS=-cdefault_transaction_read_only=on one-invest-db psql -h 127.0.0.1 -U oneinvest -d oneinvest -X -At"
```

## 1. Lập và kiểm danh sách (chỉ đọc)

```bash
cd "$W/pipeline" && node scripts/ghep-tin-danh-muc-doc-bu.mjs --lap
```

Số chạy thử lúc 18/11: **1.725 bài**, ước 2,50 USD, p95 3,31 USD. Đặt `F` là đường tệp lệnh vừa in, rồi kiểm:

```bash
node scripts/ghep-tin-danh-muc-doc-bu.mjs --kiem "$F"
```

Thoát 0 mới đi tiếp.

## 2. Sao lưu và chụp mốc

```bash
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -h 127.0.0.1 -U oneinvest -d oneinvest -t silver_labels | gzip > "$B/truoc-pl20-doc-bu-$TS.sql.gz"
$PSQL -c "SELECT offer_id, project_node_id FROM offer_project WHERE source = 'S03' ORDER BY 1" > "$B/pl20-offer-project-truoc-$TS.txt"
```

## 3. Nấc thử 20 bài, trần 0,10 USD

```bash
cd "$M/agent" && node --env-file=../.env --import tsx scripts/doc-gop-s03.ts chay --post "$(cd "$W/pipeline" && node scripts/ghep-tin-danh-muc-doc-bu.mjs --in "$F" --dau 20)" --tran-usd 0.10 --run-id pl20-doc-bu-thu
```

## 4. Xét nấc thử

```bash
cd "$W/pipeline" && node scripts/ghep-tin-danh-muc-doc-bu.mjs --kiem-thu pl20-doc-bu-thu --so-bai 20
```

**Thoát 1 thì dừng, không đọc cả lô, báo P4.** Ngưỡng dừng: quá 2 bài không đọc được, hoặc tiền trung bình quá 0,004 USD mỗi bài.

## 5. Đọc cả lô, trần 4,90 USD

```bash
cd "$M/agent" && node --env-file=../.env --import tsx scripts/doc-gop-s03.ts chay --post "$(cd "$W/pipeline" && node scripts/ghep-tin-danh-muc-doc-bu.mjs --in "$F" --bo-dau 20)" --tran-usd 4.90 --run-id pl20-doc-bu-1
```

Lệnh tự dừng khi chạm trần. Chạy lại cùng lệnh không gọi lại bài đã đọc.

## 6. Kiểm sau lượt đọc

```bash
cd "$W/pipeline" && node scripts/ghep-tin-danh-muc-doc-bu.mjs --sau-doc "$F" --run-id pl20-doc-bu-thu,pl20-doc-bu-1 --tran-usd 5
node scripts/ghep-tin-danh-muc-do.mjs --chi-doc
```

Lệnh đầu thoát 0. Lệnh sau in độ phủ mới để so với 46,4% trước lượt đọc.

## 7. Đo số tin đổi dự án (sau lượt nạp 15 phút kế tiếp)

```bash
$PSQL -c "SELECT offer_id, project_node_id FROM offer_project WHERE source = 'S03' ORDER BY 1" > "$B/pl20-offer-project-sau-$TS.txt"
diff "$B/pl20-offer-project-truoc-$TS.txt" "$B/pl20-offer-project-sau-$TS.txt" | grep -c '^[<>]'
```

Báo P4 con số này. Số dòng khác gồm cả tin mới của các lượt nạp trong lúc chờ.

## Cách lùi

Bản đọc mới không ghi vào dữ liệu tin. Nếu cần gỡ, xoá đúng các dòng theo `run_id`; đây là xoá dữ liệu nên **phải có lời riêng của Mạnh**:

```sql
DELETE FROM silver_labels WHERE run_id IN ('pl20-doc-bu-thu', 'pl20-doc-bu-1');
```

## Báo lại cho P4

Số bài đã đọc, số bài lỗi, tiền thật, độ phủ sau lượt đọc, số tin đổi dự án ở bước 7, đường tệp `F`.
