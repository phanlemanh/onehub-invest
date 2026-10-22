---
paths:
  - "db/migrations/**"
  - "pipeline/sql/**"
  - "pipeline/mappings.yaml"
  - "collector/docs/DATA-CONTRACT.md"
---

# Schema, SQL và hợp đồng dữ liệu

- **Migration mới = file mới** `db/migrations/NNN_<snake_case>.sql`, NNN = số lớn nhất hiện có + 1
  (dùng `/new-migration`). Migration đã commit thì không sửa — hook sẽ chặn.
- Mở đầu file bằng comment: tên file, mục đích (mã roadmap: G-2, M1…), tài liệu nguồn, và
  dòng `KHÔNG sync cloud (PII tầng A)` nếu bảng chứa SĐT/tên/hồ sơ người dùng.
- **Idempotent**: `CREATE … IF NOT EXISTS`, `CREATE OR REPLACE`, `ON CONFLICT`, `DROP … IF EXISTS`
  — chạy lại không lỗi, không nhân đôi dữ liệu.
- Field/enum mới → tra RESO Data Dictionary trước (ADR-0011, `docs/research/reso-standards.md`).
  Mở rộng riêng VN phải khai đủ 6 điều kiện trong `pipeline/mappings.yaml`. Enum dùng `CHECK`.
- Thêm field vào DATA-CONTRACT → tăng `schemaVersion` trong manifest và để pipeline từ chối
  version chưa hỗ trợ.
- `pipeline/sql/` chạy theo số: 200 → 300 → 400 → 410 → 450 → 500. Rollup cấp market phải
  DELETE trước INSERT (bẫy `ON CONFLICT DO NOTHING` giữ số cũ).
- Áp migration local: `docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 < db/migrations/NNN_x.sql`.
  Áp lên prod (Supabase): **hỏi user**, không tự đẩy.
