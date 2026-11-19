# Áp lên máy thu — che-ten-nguon-khong-lay-tu-dau

Áp SAU khi PR gộp, từ `main` ở checkout chính, theo chữ ký Cổng Bằng chứng. Giá trị tên thật S16 GS cấp qua tệp cục bộ
`.acceptance-runs/dieu-phoi-dot0-cam-mau/tam/s16-ten-that.json` (git bỏ qua, quyền 600) — không chép vào hồ sơ, không in ra.

1. **Sao lưu trước** (bắt buộc, trước mọi ghi):
   `bash _acceptance/che-ten-nguon-khong-lay-tu-dau/ap-may-thu/sao-luu.sh` → `~/onehub-backups/db/source_registry-<giờ>.sql`
   (`pg_dump -t source_registry --data-only --column-inserts`, chỉ bảng này).
2. **Lệnh áp:**
   - `psql … -f db/migrations/112_source_registry_match_whole.sql` (chạy lại không lỗi);
   - `node _acceptance/che-ten-nguon-khong-lay-tu-dau/ap-may-thu/tra-s16.mjs` — đọc tệp cục bộ, `UPDATE source_registry SET
     real_name, source_ids, match_whole = true WHERE code = 'S16'` trong một giao dịch, in số dòng đổi (phải 1), không in giá trị.
3. **Số chạy thử:** `chay-thu.md` — lượt E5/E6 trên bản chép DB máy thu (`discovery/do-ban-chep.mjs`), điền ở S4.
4. **Cách lùi:** `bash khoi-phuc-s16.sh <tệp sao lưu>` (đặt lại dòng S16 đúng như bản sao lưu — dạng chữa tạm, không viết
   cứng giá trị) rồi `psql … -f lui-cot.sql` (bỏ cột), đúng thứ tự này vì bước khôi phục cần cột còn đó. Áp lại 112 được.
   Cả hai bước đã chạy thật trên DB thử (ca AC-7 của `source-name-entries.itest.mjs`).
5. **Lệnh kiểm sau:**
   - /ops/registry trên máy thu: tên dự án mang thương hiệu S16 hiện nguyên (không còn «S16 …»);
   - lượt cloud-sync kế của job 15′ (sync-cloud không có chế độ chạy khô): `tail -50 ~/dev/onehub-invest/pipeline/logs/cloud-sync.log`
     — lượt không dừng ở pha scan vì tên nguồn, không cột người bán nào bị che thêm so với lượt trước;
   - `node _acceptance/che-ten-nguon-khong-lay-tu-dau/discovery/do-ban-chep.mjs` trên bản chép mới: cờ true 0 chỗ trúng nhầm,
     cấy cụm hai từ và tên miền S16 → bộ soát bắt.
   Lệch số chạy thử → dừng, báo GS, không tự sửa cho khớp.
6. **Xoá tệp tên thật cục bộ** ngay sau bước 5, vì lệnh kiểm sau cần tệp này. Phải lùi thì cũng xoá sau khi lùi xong.
