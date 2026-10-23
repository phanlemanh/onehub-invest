# Số 034 khi 033 chưa vào main — kết luận thứ tự merge (2026-10-23)

Câu hỏi từ phiên điều phối: `main` đang dừng ở 032; `033_enrichment_proposals.sql` nằm trên
`feat/enrich-qua-de-xuat` (chưa merge); nhánh này thêm 034. Nếu 034 vào trước thì một DB đã chạy 034
rồi mới gặp 033 có sao không?

## Kết luận: AN TOÀN, merge theo thứ tự nào cũng được, không cần đổi số

1. **Repo không có bộ chạy migration theo phiên bản** — không có bảng theo dõi kiểu
   `schema_migrations` ở DB local, không Flyway/knex. Migration được áp tay từng file bằng psql
   (luật `migrations.md`), còn `scripts/setup.sh` lặp `db/migrations/*.sql` theo thứ tự tên. Không có
   cơ chế nào "đã thấy 034 nên bỏ qua 033" → số bị khuyết không làm mất migration.
2. **033 và 034 không phụ thuộc nhau.** 034 chỉ đọc `properties`, `property_offers`, `sale_offers`
   (027/008…). 033 tạo bảng `enrichment_proposals` + hai hàm `apply_enrichment` /
   `decide_enrichment_review`; không ALTER/DROP bảng hay cột nào mà view đọc (UPDATE dữ liệu trong
   hàm không bị view chặn).
3. **Đo thực nghiệm** (DB tạm trong `one-invest-db`, migration 001–032 rồi):
   - thứ tự A: 033 → 034 — cả hai exit 0;
   - thứ tự B: 034 → 033 — cả hai exit 0; chạy lại 034 sau 033 — exit 0;
   - `pg_dump -s` hai DB: **giống hệt** (khác duy nhất token ngẫu nhiên `\restrict` của pg_dump).
   - DB local :5433 đã có cả hai (033 áp từ nhánh enrich, 034 áp ở vòng này).
4. **Cloud**: 033 ghi "KHÔNG sync cloud" — SQL bắt kịp cloud (`docs/ops/cloud-catchup-2026-10-22.sql`)
   không gồm 033 và không cần.
5. **Va chạm khi merge** (`git merge-tree` HEAD × `feat/enrich-qua-de-xuat`): chỉ `PRODUCT-MAP.md`
   (máy sinh — giải bằng chạy lại `product-map.mjs --root .`). `_acceptance/config.yaml` và
   `docs/ROADMAP.md` tự gộp.

Khuyến nghị: giữ số 034, không đổi thứ tự làn. Nếu muốn lịch sử `db/migrations/` trên main liền số
thì merge `feat/enrich-qua-de-xuat` trước — chỉ là thẩm mỹ, không phải điều kiện an toàn.
