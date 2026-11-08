# Hình tại điểm quyết định — dung-danh-ba-may-thu

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 bước đêm gắn vào refresh-bait-gap (d-20261107T231645Z-4) | 4 bước nối tiếp + 3 nhánh rẽ (chưa áp 082 · chưa có toà · đích ngoài máy) | `buoc-dem.html` |
| Hỏi-2 lần dựng đầu trên máy thu có rào --sao-luu (d-20261107T232228Z-12) | 4 bước nối tiếp (pg_dump → lần đầu --db-that --sao-luu → đo bản chép → chạy lại 0 mã) + 1 nhánh rẽ (thiếu --sao-luu → dừng) | `lan-dung-dau.html` |
| Rào đích ghi (d-20261107T231645Z-2, -3, d-20261107T232228Z-15) | dưới ngưỡng: 1 bảng tra 3 hàng, không chuỗi bước | — |
| Đêm chỉ giữ khu đã dựng (d-20261107T231645Z-5, d-20261107T232228Z-14) | gộp vào hình `buoc-dem` | — |

## Đề bài

### buoc-dem (flowchart)
- Nút: job launchd (zalo-import 00:00 · chotot 05:30, 14:00 · apify-facebook) → `refresh-bait-gap.mjs` main → `buocDem` (bait gap + danh bạ Người, COMMIT) → `buocVatTheDem` (giao dịch riêng).
- Trong `buocVatTheDem`, ba rào theo thứ tự: đích ngoài máy này? → ném lỗi (job đỏ) · chưa áp 082? → «bỏ qua» · chưa có toà nào? → «bỏ qua — chưa dựng lần đầu».
- Qua cả ba → khu = khu đã có toà (khu hoặc cha của phân khu) → `dung()` không từ điển chủ đầu tư → COMMIT; lỗi → ROLLBACK riêng, Người đã commit giữ nguyên, job thoát ≠ 0.
- Nhãn chữ tiếng Việt; AC liên quan: AC-2, AC-4, AC-5, AC-6.

### lan-dung-dau (process, 4 bước + 1 nhánh)
- Bước 1: Cổng Bằng chứng ký + gộp PR. Bước 2: giám sát xin lời Mạnh, `pg_dump` năm bảng → tệp dump. Bước 3: `danh-ba-vat-the.mjs --db-that --sao-luu <tệp> --tu-dien …` trên máy thu. Bước 4: đo — ca `dbv_that` ở nhánh so, lệch rỗng; chạy lại `--db-that` → khoa_moi = 0; ghi một dòng sổ `uat`.
- Nhánh rẽ ở bước 3: thiếu hoặc tệp `--sao-luu` rỗng → lệnh thoát 2, không ghi.
- Sau bước 4: bước đêm tự giữ tươi. AC liên quan: AC-1, AC-8.
