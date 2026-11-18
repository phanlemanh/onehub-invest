# PL20 — Gói lệnh nạp lát nhãn `hai-khu-ghep-b` (giám sát chạy)

**Lời duyệt:** Mạnh ký Cổng Phạm vi (`/acceptance-gate:approve ghep-tin-vao-danh-muc duyệt`) với hai khuyến nghị trên thẻ: chấm ba nhóm nguồn, tối đa 330 bài. Hợp đồng ghi rõ chữ ký phủ lượt nạp lát này.

**Điều kiện chạy:** lượt đọc bù đã xong bước 6 và 7 của `goi-lenh-doc-bu.md`, và đã qua ít nhất một lượt nạp S03 sau khi đọc xong, để đầu ra của máy ổn định.

**Ghi vào:** chỉ `eval_label_items`, lát `hai-khu-ghep-b`, trên DB máy thu. Không điền nháp, không gọi model.

```bash
W=/Users/manhphan/dev/onehub-invest/.claude/worktrees/ghep-tin-vao-danh-muc
B=$HOME/onehub-backups/db
TS=$(date -u +%Y%m%dT%H%M%SZ)
PSQL="docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -h 127.0.0.1 -U oneinvest -d oneinvest -X -At"
```

## 1. Rút mẫu và đóng băng đầu ra máy (chỉ đọc)

```bash
cd "$W/pipeline" && node scripts/ghep-tin-danh-muc-lat-nhan.mjs --rut --seed pl20-b-1
```

Đặt `F` là đường tệp lệnh vừa in. Đọc dòng `thieu`:

- Thoát 0: đủ 110 bài mỗi nhóm, đi tiếp.
- Nhóm `n1` hoặc `n2` thiếu: **dừng, báo P4**.
- Chỉ nhóm `n3` thiếu: đi tiếp và báo P4 số thiếu. Nhóm này không đủ cỡ thì nguồn D, G sẽ tắt.

Số chạy thử trước lượt đọc bù: `n1` 110, `n2` 110, `n3` 44 (thiếu 66). Số thật lấy sau lượt đọc.

## 2. Sao lưu

```bash
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -h 127.0.0.1 -U oneinvest -d oneinvest -t eval_label_items | gzip > "$B/truoc-pl20-lat-nhan-$TS.sql.gz"
```

## 3. Nạp lát

```bash
cd "$W/pipeline" && node scripts/ghep-tin-danh-muc-lat-nhan.mjs --nap "$F"
```

Chạy lại không nhân dòng. Lát đã có bài ngoài tệp đóng băng thì lệnh dừng, không ghi gì.

## 4. Kiểm sau

```bash
$PSQL -c "SELECT stratum, split, count(*), count(draft) AS co_nhap FROM eval_label_items WHERE lat = 'hai-khu-ghep-b' GROUP BY 1, 2 ORDER BY 1"
```

Đúng khi mỗi nhóm có số bài bằng tệp đóng băng, `split` là `test`, `co_nhap` bằng 0.

## Cách lùi

Lát mới không ảnh hưởng lát khác. Nếu cần gỡ khi chưa có nhãn nào, xoá đúng lát này; đây là xoá dữ liệu nên **phải có lời riêng của Mạnh**:

```sql
DELETE FROM eval_label_items WHERE lat = 'hai-khu-ghep-b' AND NOT EXISTS (SELECT 1 FROM eval_labels l WHERE l.item_id = eval_label_items.item_id);
```

## Sau khi nạp

Màn gắn nhãn theo thứ tự: `/ops/labels?lat=hai-khu-ghep-b&nhom=n1`, rồi `nhom=n2`, rồi `nhom=n3`. Phép chấm chỉ đọc ô Toà và ô Phân khu, nhưng màn hiện đòi điền đủ 17 ô mỗi bài.

## Báo lại cho P4

Số bài mỗi nhóm, băm và đường tệp `F`, kết quả bước 4.
