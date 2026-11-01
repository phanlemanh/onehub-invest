## Ngữ cảnh
- Sản phẩm: onehub-invest — đồng bộ máy thu → Supabase (`pipeline/sync-cloud.mjs`) · chân sản phẩm: Ngoài-2 SD3 [SUY-TỪ-REPO: _acceptance/sdt-luu-goc-e164/review-findings.md], lệ catch-up cloud [SUY-TỪ-REPO: docs/ops/cloud-schema-catchup-2026-10-27-050.sql] · chân ngành: Postgres catalog `pg_class.relkind` [NGÀNH: PostgreSQL system catalogs]

## Trục
- Kiểu bảng đích cloud: r | p | v | m | f | vắng   [thước CE: pg_class.relkind của PostgreSQL]
- Phía: đọc máy thu (view) | ghi cloud (bảng) | tài liệu áp cloud   [thước CE: câu đọc/tráo thật của sync-cloud]

## Core (≤20%)
1. Chốt kiểu bảng đích ở pha catalog — chặn trước staging.
2. Đọc view máy thu ra đúng cột cho phép.
3. Tệp catch-up 060 không DDL.

## Later
- Chốt cùng loại cho mọi bảng FILL khác khi một migration sau đổi chúng thành view (chốt đã chung cho FILL).

## Never
- Đổi tên bảng cloud `sellers` — `/ops/quality` cloud đọc tên này.

## Cross-cutting áp mọi ô Core
- Không lệnh nào chạy trên Supabase; mọi phép đo trên DB thử.
