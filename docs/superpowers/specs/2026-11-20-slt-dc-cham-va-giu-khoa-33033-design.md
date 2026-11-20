# slt-dc-cham-va-giu-khoa-33033 — thiết kế

Hồ sơ: `_acceptance/slt-dc-cham-va-giu-khoa-33033/`. Giao: giám sát đợt `dot0-cam-mau`, 20/11 10:45Z; phán 11:00Z, 11:08Z.

## Vấn đề (đo, không đoán)

`writeAssertions(…, { replaceOwn: true })` rút phát biểu cũ bằng `NOT EXISTS` trên bảng tạm `moi` dựng từ `unnest` bốn mảng. Planner
ước phép nối `k ⋈ field_assertions` ra 1 dòng (thật: bằng cỡ mảng) vì ước bảng tạm 10% và nhân độ chọn ba cột. Với ước ấy, ở một
dải cỡ mảng nó chọn Nested Loop Anti Join quét lại `moi` cho mỗi dòng ngoài — bậc hai. Dải lật phụ thuộc thống kê: DB máy thu lật
giữa 100k–150k, bản chép thống kê tươi giữa 213k–374k. SLT-DC-7/9 gọi transform với suy loại tắt (mảng 213k) nên rơi đúng dải
chậm trên DB của lượt; sản xuất (374k) chạy hash. `ANALYZE` không đổi gì vì ước lượng đến từ mảng tham số.

Hệ quả thứ hai: ca 7/9 hết trần, node:test không huỷ promise, giao dịch vẫn giữ `pg_advisory_xact_lock(33033)` và ca 10 cùng tệp
đứng chờ — cả tệp kéo dài tới khi câu chậm tự xong.

## Phương án

1. **Viết lại câu, bỏ anti join** (chọn): gom khoá mới theo (chủ thể, trường, phương pháp) thành `array_agg(DISTINCT …)`, nối với
   bảng, lọc `value_key <> ALL (vks)` trên từng dòng nối. Mọi kế hoạch (nested loop qua chỉ mục, hash join) đều tuyến tính. Đã đo:
   ≤ 1,7 s ở 2k–374k, tập rút trùng câu cũ. Câu đặt thành hằng xuất `SQL_RUT_THAY` để test EXPLAIN đúng câu chạy thật.
2. `SET LOCAL enable_nestloop = off` quanh câu cũ — loại: tắt nested loop cho cả câu, vẫn phụ thuộc ước lượng, và kế hoạch hash
   của câu cũ vẫn dựng bảng băm hai lần.
3. Bảng tạm + `ANALYZE` trong giao dịch — loại: thêm DDL tạm mỗi lượt, chậm hơn ở mảng nhỏ (S05: 32 dòng mỗi lượt).
4. `ANALYZE`/đổi autovacuum trên máy thu — loại: không chữa (đo), và có thể chính là cú lật cho sản xuất.

## Ca SLT-DC

- `withTx(fn, { signal, tranGiay })`: nghe `signal` của ca (node:test huỷ nó lúc hết trần, đã thử trên Node 24) → cắt phiên DB của
  ca bằng `pg_terminate_backend` từ một kết nối riêng: giao dịch ROLLBACK, 33033 rảnh ngay. Lưới phía máy chủ: `SET LOCAL
  transaction_timeout` = trần + 30 s (Postgres 17, cả máy thu lẫn CI) khi tiến trình test chết hẳn.
- Trần ca theo số đo sau sửa (ghi trong mã). Ca mới `SLT-DC-KHOA` đo cơ chế nhả khoá với cặp hai chiều.

## Phủ ca

Bảng nguồn gọi × cỡ mảng ở `## Coverage` của hợp đồng. Không nguồn sản xuất nào trong dải lật hiện nay; câu mới phủ cả ba dải.
