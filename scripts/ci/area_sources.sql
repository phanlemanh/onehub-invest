-- Bảng area_sources cho DB của CI (AU11 `ci-test-module`, Hỏi-1). Bảng có ở DB local nhưng KHÔNG migration nào tạo —
-- migration 012 cập nhật nó nên lỗi trên DB dựng từ db/migrations. Định nghĩa chép từ DB local (pg_dump --schema-only,
-- 25/10). Tệp này chỉ dùng cho CI và gỡ khi migration vá vào (hàng riêng); nguồn sự thật vẫn là db/migrations.
CREATE TABLE IF NOT EXISTS public.area_sources (
    area_id text NOT NULL,
    source text NOT NULL,
    source_area_key text NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb,
    PRIMARY KEY (area_id, source, source_area_key)
);
