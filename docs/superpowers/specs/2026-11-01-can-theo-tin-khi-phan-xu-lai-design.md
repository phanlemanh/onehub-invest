# Căn theo tin khi phân xử lại — thiết kế

Hồ sơ: `_acceptance/can-theo-tin-khi-phan-xu-lai/`. Mở từ Ngoài-8 của hồ sơ `phat-bieu-db-do-tren-main` (Mạnh: «mở hợp đồng
mới», 31/10). Migration **066** (sổ liên làn cấp 01/11).

## Vấn đề

063 cho `apply_enrichment` / `revert_enrichment` phân xử lại mọi bản ghi tin chung chủ thể (bài đăng) với đề xuất. Nhưng
chuỗi cập nhật căn (`properties` qua `property_offers`) vẫn chỉ chạy cho căn của **tin trong đề xuất**:

- áp (`063:92-114`): căn nhận ô còn trống `bedrooms`/`bathrooms`/`street` + một dòng `enrichment_log`, chỉ khi
  `ep.id = ANY(applied)`;
- hoàn tác (`063:169-194`): gỡ giá trị và ghi `enrichment_log` chỉ cho căn của `r.offer_id`.

Căn của tin chung bài đăng (gắn căn khác) giữ số cũ, không nhật ký. `resolve-properties.mjs` hằng đêm không bao giờ ghi ba
cột ấy, nên lệch không tự lành. Không có hàng đợi dựng lại căn.

## Làm gì (Hỏi-1..4: Mạnh «Duyệt cả 4» 01/11, sổ d-…-4)

066 thay hai hàm, giữ nguyên thân 063, chỉ đổi **tập căn** nhận cascade:

- **Áp (Hỏi-1):** tập tin nguồn = tin của đề xuất đã áp ∪ `offers_chung_chu_the(chủ thể của chúng)`. Mỗi căn gắn một tin
  trong tập nhận `COALESCE` (chỉ điền ô trống) từ `max()` giá trị phân xử của các tin trong tập gắn căn đó; dòng
  `enrichment_log` thêm khoá `offer_ids` (tin nguồn) và `chung_bai: true` khi căn chỉ gắn tin chung bài.
- **Hoàn tác (Hỏi-2):** cùng điều kiện gỡ của 036 (căn mất giá trị khi bằng đúng giá trị hoàn tác VÀ không tin nào khác
  của căn còn mang nó), áp cho căn của `r.offer_id` ∪ căn của tin chung chủ thể; mỗi căn đó nhận một dòng `enrich-revert`.
- **Sửa một lần (Hỏi-3):** sao lưu :5433 bằng pg_dump TRƯỚC khi áp 066 (khối chạy ngay khi áp). Khối `-- 4. Sửa dữ liệu một lần`: với mỗi đề xuất `applied` có tin chung chủ thể, điền ô trống
  của căn tin chung từ giá trị đã phân xử; ghi một dòng `ops_audit` `can-theo-tin:sua-mot-lan-066` kèm số căn/ô đổi. Chạy
  lại không đổi gì (idempotent: chỉ điền ô trống).
- **Ngoài phạm vi (Hỏi-4):** tin đổi `property_type` bị `resolve-properties` nối sang căn mới mà không gỡ liên kết cũ —
  hàng riêng.

## Đo

Itest mới `pipeline/scripts/can-theo-tin.itest.mjs` (DB thử, BEGIN … ROLLBACK, khoá 33033, nạp 045/059/063 + 066):
ma trận (máy/người × B sống/nghỉ × B cùng căn/khác căn với A), chiều đỏ nạp bản hàm 063. Áp hai lần migration trên DB thử;
DB riêng dựng từ đủ migration.
