# PL20 — Gói lệnh đọc thêm, lượt 2 (giám sát chạy)

**Lời duyệt:** sau khi biết kết quả lượt đọc bù đầu, Mạnh chọn nguyên văn «Đọc thêm, 220 bài» (phương án 1: đọc thêm khoảng 285 bài, khoảng 0,41 USD). Trần tổng của đợt 2 vẫn là 5 USD, lượt đầu đã dùng 2,4745 USD.

**Việc:** model đọc đúng bài mà luật đã đọc ra toà hay vùng nhưng chính bài đó chưa có bản đọc `dg3-s03-v3`, mỗi tin chưa gắn một bài. Dùng lệnh đọc có sẵn của PL30.

**Ghi vào:** chỉ `silver_labels` và `ai_calls`, trên DB máy thu.

**Tác động phụ đã biết:** như lượt đầu, một số tin có thể đổi dự án khi chữ bài nêu rõ dự án khác (lượt đầu: 10 tin trên 1.740 bài). Bước 2 và bước 6 đo số này.

```bash
W=/Users/manhphan/dev/onehub-invest/.claude/worktrees/ghep-tin-vao-danh-muc
M=/Users/manhphan/dev/onehub-invest
B=$HOME/onehub-backups/db
TS=$(date -u +%Y%m%dT%H%M%SZ)
PSQL="docker exec -i -e PGPASSWORD=oneinvest -e PGOPTIONS=-cdefault_transaction_read_only=on one-invest-db psql -h 127.0.0.1 -U oneinvest -d oneinvest -X -At"
```

## 1. Lập và kiểm danh sách (chỉ đọc)

```bash
cd "$W/pipeline" && node scripts/ghep-tin-danh-muc-doc-bu.mjs --lap --vong 2
```

Số chạy thử: **295 bài**, ước 0,43 USD, p95 0,57 USD. Đặt `F` là đường tệp lệnh vừa in, rồi kiểm:

```bash
node scripts/ghep-tin-danh-muc-doc-bu.mjs --kiem "$F" --vong 2
```

Thoát 0 mới đi tiếp.

## 2. Sao lưu và chụp mốc

```bash
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -h 127.0.0.1 -U oneinvest -d oneinvest -t silver_labels | gzip > "$B/truoc-pl20-doc-them-$TS.sql.gz"
$PSQL -c "SELECT offer_id, project_node_id FROM offer_project WHERE source = 'S03' ORDER BY 1" > "$B/pl20-doc-them-offer-project-truoc-$TS.txt"
```

## 3. Đọc, trần 1 USD

Lượt đầu đã qua nấc thử 20 bài với cùng bộ đọc và 1.740 bài không lỗi, nên lượt này không chạy lại nấc thử.

```bash
cd "$M/agent" && node --env-file=../.env --import tsx scripts/doc-gop-s03.ts chay --post "$(cd "$W/pipeline" && node scripts/ghep-tin-danh-muc-doc-bu.mjs --in "$F")" --tran-usd 1 --run-id pl20-doc-bu-2
```

## 4. Kiểm sau lượt đọc

```bash
cd "$W/pipeline" && node scripts/ghep-tin-danh-muc-doc-bu.mjs --sau-doc "$F" --run-id pl20-doc-bu-2 --tran-usd 1
$PSQL -c "SELECT round(sum(cost_usd)::numeric, 4) FROM silver_labels WHERE run_id LIKE 'pl20-doc-bu%'"
```

Lệnh đầu thoát 0. Lệnh sau in tổng tiền của cả hai lượt, phải không vượt 5 USD.

## 5. Đo độ phủ

```bash
node scripts/ghep-tin-danh-muc-do.mjs --chi-doc
```

Ước **51,8%**, với nguồn chỉ có model đang tắt. **Dưới 50% thì báo P4 trước khi làm gì tiếp.**

## 6. Đo số tin đổi dự án (sau lượt nạp 15 phút kế tiếp)

```bash
$PSQL -c "SELECT offer_id, project_node_id FROM offer_project WHERE source = 'S03' ORDER BY 1" > "$B/pl20-doc-them-offer-project-sau-$TS.txt"
diff "$B/pl20-doc-them-offer-project-truoc-$TS.txt" "$B/pl20-doc-them-offer-project-sau-$TS.txt" | grep -c '^[<>]'
```

## Cách lùi

Bản đọc mới không ghi vào dữ liệu tin. Nếu cần gỡ, xoá đúng các dòng theo `run_id`; đây là xoá dữ liệu nên **phải có lời riêng của Mạnh**:

```sql
DELETE FROM silver_labels WHERE run_id = 'pl20-doc-bu-2';
```

## Báo lại cho P4

Số bài đã đọc, số bài lỗi, tiền thật của lượt này và tổng hai lượt, độ phủ ở bước 5, số tin đổi dự án ở bước 6, đường tệp `F`.
