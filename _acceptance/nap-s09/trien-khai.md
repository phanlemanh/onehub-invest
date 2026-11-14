# nap-s09 — bước triển khai sau gộp (KHÔNG chạy trong hàng)

Chờ lời Mạnh (GS đã hỏi). Máy thu đã áp 097 (bảng `stg_s09_item` có, đang 0 dòng — đếm lúc chấm E4, 14/11).

1. Nạp bản thu S09 13/11 vào máy thu:
   ```bash
   DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest node pipeline/import-s09.mjs collector/snapshots/vn/vn__s09-du-an__2026-11-13T120908161 --may-thu
   ```
   Kỳ vọng in `S09 nạp: 345/345 dòng …; bỏ 0 thiếu-source-id, 0 kind-lạ, 0 chi-tiet-lỗi`. Chạy lại in `0/345` (không nhân dòng).
   Không có `--may-thu` thì lệnh từ chối mọi DB không phải `oneinvest_suite_*` (thoát 2).
2. **Cảnh báo — bước đêm tự dựng toà S09**: `refresh-bait-gap.mjs` gọi `buocVatTheDem` → `dung()` cho khu đã có toà; khi
   `stg_s09_item` có dòng thì đêm đó bước S09 của DA31 tự đúc toà, phân khu, cụm. Muốn dựng có kiểm soát thì chạy lượt tay
   ngay sau bước 1, trước giờ chạy đêm:
   ```bash
   cd pipeline && node danh-ba-vat-the.mjs --db postgres://oneinvest:oneinvest@localhost:5433/oneinvest --db-that
   ```
3. Số kỳ vọng, câu kiểm sau khi ghi, cách đảo và những thứ không chạy cùng lúc: tờ `U1-DA31-trien-khai.md` (thư mục ghi chú
   chung của đợt dot0-cam-mau), mục 3–5. Tóm tắt: toà nối S09 OP1 115, GP 60; toà S08 nhận bí danh 12 và 34; toà mới đúc 103
   và 26; phân khu 13 và 7; cụm 3 và 9; tổng toà 69 → 198.
4. Đảo bước 1: `DELETE FROM stg_s09_item WHERE snapshot_id = 'vn__s09-du-an__2026-11-13T120908161'` rồi xoá dòng
   `airbnb_snapshots` cùng mã (chỉ khi bước 2 chưa chạy — toà đã đúc thì đảo theo mục 4 của tờ DA31).
