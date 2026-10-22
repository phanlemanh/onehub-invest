---
name: new-migration
description: Tạo migration PostgreSQL mới cho onehub-invest đúng chuẩn — số kế tiếp trong db/migrations, header, idempotent, kiểm RESO, áp vào DB local. Dùng khi cần thêm/đổi bảng, cột, index, view, enum hoặc seed dữ liệu tham chiếu.
argument-hint: "<mô tả ngắn, ví dụ: thêm cột floor cho properties>"
---

# /new-migration — $ARGUMENTS

1. **Số kế tiếp**: `ls db/migrations | sort | tail -1` → NNN + 1, đệm 3 chữ số. Tên
   `db/migrations/NNN_<snake_case_ngắn>.sql`.
2. **Tra RESO trước** khi đặt tên field/enum (ADR-0011, `docs/research/reso-standards.md`).
   Field riêng VN → khai 6 điều kiện trong `pipeline/mappings.yaml` cùng commit.
3. **Header** (theo mẫu 027–032):
   ```sql
   -- NNN_ten.sql — <mã roadmap>: <mục đích một dòng>
   -- <tài liệu nguồn: docs/research/… hoặc ADR>
   -- KHÔNG sync cloud (PII tầng A).   ← chỉ khi bảng chứa SĐT/tên/hồ sơ
   ```
4. **Idempotent**: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE VIEW`,
   `CREATE INDEX IF NOT EXISTS`, seed dùng `ON CONFLICT`. Enum = `CHECK (... IN (...))`.
5. **Áp local 2 lần** (lần 2 chứng minh idempotent):
   ```bash
   docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 < db/migrations/NNN_ten.sql
   ```
6. Cập nhật code đọc/ghi bảng (pipeline, `app/src/lib/queries.ts`, data-api) trong cùng thay đổi.
   Bảng tầng A → đảm bảo `pipeline/sync-cloud.mjs` KHÔNG đẩy nó.
7. **Prod (Supabase)**: không tự áp. Báo user file nào cần áp và hỏi cách áp.

Migration đã commit thì không sửa (hook chặn) — sai thì viết migration mới để sửa, như 032 sửa 026.
