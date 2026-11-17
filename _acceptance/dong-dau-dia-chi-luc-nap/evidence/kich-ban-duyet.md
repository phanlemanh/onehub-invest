# Kịch bản duyệt — khai TRƯỚC khi đo

Cổng Phạm vi (Mạnh, 17/11) chốt **không đóng dấu từ thẻ nháp**. Lúc TG1 áp 108 + 109 lên máy thu (17/11 11:30Z),
cả **26 thẻ đều còn nháp** — chưa thẻ nào được người duyệt. Đo thẳng trên máy thu thì số tin được đóng dấu là **0**,
và lượt chấm sẽ đỏ hay xanh vì *trạng thái duyệt* chứ không vì *mã*.

Nên mọi phép đo trên dữ liệu thật của hàng này chạy **hai lượt nạp trên cùng một bản chép DB máy thu**
(`oneinvest_p4_tg2`, dựng lại từ đầu bằng `bash db/db-thu.sh oneinvest_p4_tg2`), cùng một mã:

| Lượt | Thẻ | Nghĩa của con số |
|---|---|---|
| **Nền** | để nguyên như máy thu lúc dựng bản chép — lệnh in **N thẻ đã duyệt lúc đo** | số thật trên máy thu ngay sau khi hàng gộp |
| **Sau kịch bản** | áp đúng một kịch bản khai dưới đây | số khi buổi duyệt làm đúng kịch bản ấy |

## K1 — nhận nguyên nháp

Người bấm «nhận» cho **mọi thẻ nháp còn sống**, không sửa ô nào. Câu áp (chỉ trên bản chép):

```sql
UPDATE group_address_cards SET status = 'da_duyet', decided_by = 'kich-ban-K1', decided_at = now()
 WHERE status = 'nhap' AND retired_at IS NULL;
```

Vì sao K1: đó là buổi duyệt dễ đoán nhất và rút lại được — nháp là đúng thứ máy đề xuất cho người. Nó không phải dự
báo buổi duyệt thật: người có thể sửa hay bác thẻ, và khi ấy số thật sẽ khác số K1. Ngưỡng 90% của AC-1(b) chấm trên
số **sau kịch bản K1**; số **lượt nền** in kèm để không ai đọc nhầm nó thành số trên máy thu.

Khai lúc: 2026-11-17, trước lượt `--chay` đầu tiên. Thêm kịch bản khác là thêm một khối ở đây VÀ một dòng trong
`KICH_BAN` của `pipeline/scripts/dong-dau-dia-chi-that.mjs`, trước khi đo.
