-- 065_silver_labels.sql — KC1 `nhan-bac-model-lon-s03`: bảng nhãn bạc — model lớn gắn ý định tin, bán/thuê, xác suất,
-- câu trích cho từng bài, mỗi dòng ghi model đã gắn. Đề xuất, không phải dữ liệu canonical (luật 7): không cột nào của
-- bảng này được ghi ngược vào stg_* hay sale_offer_records; PL5 về sau đọc chung bảng (cột source_code).
-- Nguồn: docs/superpowers/specs/2026-10-31-nhan-bac-model-lon-s03-design.md · hồ sơ _acceptance/nhan-bac-model-lon-s03
-- (Mạnh duyệt 01/11) · số 065 do giám sát đợt dot0 cấp. Sổ từ vựng: pipeline/mappings.yaml trục listing_intent, kind.
--
-- KHÔNG sync cloud: chỉ máy thu (bảng không vào FILL của pipeline/sync-cloud.mjs). `quote` là đoạn chữ bài đã gạt SĐT,
-- email, link — không có tên nguồn thật.

CREATE TABLE IF NOT EXISTS silver_labels (
  label_id        bigserial   PRIMARY KEY,
  source_code     text        NOT NULL CONSTRAINT silver_labels_source_code CHECK (source_code ~ '^S0[0-9]$'),
  post_id         text        NOT NULL,                       -- định danh bài ở stg (S03: stg_zalo_posts.post_id)
  text_hash       text        NOT NULL,                       -- băm chữ đã chuẩn hoá — bài đổi chữ thì nhãn mới
  model           text        NOT NULL,                       -- vd gateway:anthropic/claude-haiku-5.5, mtplx:qwen3.8-27b-local
  prompt_version  text        NOT NULL,
  listing_intent  text        NOT NULL CONSTRAINT silver_labels_listing_intent
                    CHECK (listing_intent IN ('offer', 'inquiry', 'not_listing', 'unknown')),
  kind            text        CONSTRAINT silver_labels_kind CHECK (kind IS NULL OR kind IN ('sale', 'rent_lt')),
  probability     real        CONSTRAINT silver_labels_probability CHECK (probability IS NULL OR (probability >= 0 AND probability <= 1)),
  probabilities   jsonb,                                      -- phân bố xác suất của backend (Decisions), nếu có
  quote           text,                                       -- câu trích nguyên văn từ chữ đã gạt; NULL khi backend không trích
  quote_ok        boolean,                                    -- trích có trong chữ bài; NULL khi không có trích
  json_ok         boolean     NOT NULL,
  error_kind      text,                                       -- tên lớp lỗi (không chép message), NULL khi ổn
  latency_ms      integer     CONSTRAINT silver_labels_latency CHECK (latency_ms IS NULL OR latency_ms >= 0),
  cost_usd        numeric(12, 8) CONSTRAINT silver_labels_cost CHECK (cost_usd IS NULL OR cost_usd >= 0),
  run_id          text        NOT NULL,
  labeled_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT silver_labels_mot_nhan UNIQUE (source_code, post_id, text_hash, model, prompt_version)
);

CREATE INDEX IF NOT EXISTS silver_labels_post_idx ON silver_labels (source_code, post_id);
CREATE INDEX IF NOT EXISTS silver_labels_model_idx ON silver_labels (model, labeled_at);

COMMENT ON TABLE silver_labels IS 'Nhãn bạc (KC1): model lớn gắn ý định tin + bán/thuê cho từng bài, mỗi dòng một (bài, chữ, model, phiên bản prompt). Đề xuất — không ghi canonical. Chỉ máy thu, KHÔNG sync cloud.';

INSERT INTO ref_field_lookup (table_name, column_name, lookup_name) VALUES
  ('silver_labels', 'listing_intent', 'listing_intent'),
  ('silver_labels', 'kind', 'kind')
ON CONFLICT (table_name, column_name) DO UPDATE SET lookup_name = EXCLUDED.lookup_name;
