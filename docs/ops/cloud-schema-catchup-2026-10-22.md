# Bắt kịp schema cloud (Supabase) — 2026-10-22

Người chạy: **Mạnh** (luật 2: agent không tự sửa DB production).
SQL: [`cloud-catchup-2026-10-22.sql`](cloud-catchup-2026-10-22.sql) — chỉ đổi cấu trúc (DDL + một `NOTIFY` nạp lại
schema cache của PostgREST), không ghi dòng dữ liệu nào; idempotent, một transaction.

## Vì sao

Repo không có bước nào tự áp `db/migrations/` lên cloud: schema cloud được dựng tay qua
Management API, còn `pipeline/sync-cloud.mjs` chỉ TRUNCATE + nạp dữ liệu. Đo ngày 22/10 (chỉ đọc):

| Thứ | Local | Cloud |
|---|---|---|
| `v_ruler_p2_area` | có (tạo tay lúc G-2) | có, định nghĩa giống hệt local |
| `v_ruler_p2` | có (tạo tay) | **không có** |
| cột 030 trên `sale_offers` (`street_raw`, `block_raw`, `floor_raw`, `bathrooms`) | có | **không có** |
| cột 031 trên `properties` (16 cột; cloud chỉ cần 15 — `seller_name` cố ý không tạo) | có | **không có** |
| 032: `asset_nodes.parent_id` | NULL được, không default | NOT NULL + default bigserial |

Hậu quả đang diễn ra: sync 15' **gãy** — 21 lượt liên tiếp tính tới 21:38 ngày 22/10 (≈5 giờ;
`pipeline/logs/cloud-sync.log`): `PGRST204 Could not find the 'bathrooms' column of 'sale_offers'`.
Vì sync TRUNCATE mọi bảng trước rồi mới nạp, cloud hiện **0 dòng** ở `sale_offers`, `sellers`,
`asset_nodes`, `properties`, `property_offers`, `area_sources`, `dq_check_results`, `ref_calib_*`
(đã đếm trực tiếp) → `/ops/deals`, `/dau-tu`, `/api/v1/deals`, `/ops/quality` ở prod trống.

Migration 034 (`db/migrations/034_ruler_p2_views.sql`) đưa hai view vào repo; SQL catch-up gồm
034 + phần DDL của 030/031/032.

## Thứ tự (bắt buộc)

1. **Merge nhánh chứa bản vá `sync-cloud.mjs` vào `main` trước.** launchd chạy sync từ checkout
   chính (`main`). Bản vá thêm `properties: ["seller_name"]` vào `PII_EXCLUDE` — 031 chép tên
   người bán (PII tầng A) vào `properties`; thiếu bản vá thì sync sẽ đẩy cột này lên.
   (SQL catch-up cố ý không tạo cột `seller_name` trên cloud, nên kể cả chạy sai thứ tự thì
   sync chỉ lỗi PGRST204, không lọt — nhưng vẫn chưa xanh.)
2. Kiểm bản vá đã nằm trên `main` của checkout chính (phải in ra một dòng `properties: ["seller_name"]`):

```bash
git -C ~/dev/onehub-invest branch --show-current && grep -n 'properties: \["seller_name"\]' ~/dev/onehub-invest/pipeline/sync-cloud.mjs
```

3. Kiểm xong mới chạy SQL catch-up **từ checkout chính** `~/dev/onehub-invest`, chọn một cách
   (cách thứ hai cần `jq`, có sẵn ở `/usr/bin/jq`):
   - Supabase Dashboard → SQL Editor → dán nội dung file → Run.
   - Hoặc Management API (cùng kênh HTTPS mà sync-cloud dùng). `-f` để lỗi HTTP ra exit khác 0;
     thành công thì API trả `[]` (DDL không trả dòng):

```bash
cd ~/dev/onehub-invest && jq -Rs '{query: .}' docs/ops/cloud-catchup-2026-10-22.sql | curl -fsS -X POST "https://api.supabase.com/v1/projects/smqpqiigzulwpmrsrhci/database/query" -H "Authorization: Bearer $(sed -n 's/^SUPABASE_MGMT_TOKEN=//p' ~/.oneinvest/cloud.env | tr -d '\"'"'"'')" -H "content-type: application/json" --data-binary @-
```

4. Chờ lượt sync 15' kế tiếp, hoặc chạy tay đúng job launchd (chạy code `main`, không phải code
   của worktree nào):

```bash
launchctl kickstart gui/$(id -u)/com.oneinvest.cloud-sync
```

## Kiểm sau khi chạy

- `tail -20 ~/dev/one-invest/pipeline/logs/cloud-sync.log` có dòng `sync xong: <N> dòng, 21 bảng; leak gate PASS`
  (chuỗi in ở `pipeline/sync-cloud.mjs`).
- Số đối chiếu ở local (chạy cùng lúc):

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -At -c "SELECT (SELECT count(*) FROM v_ruler_p2_area), (SELECT count(*) FROM v_ruler_p2), (SELECT count(*) FROM properties)"
```

- SQL trên cloud (SQL Editor, hoặc cùng lệnh `curl` ở bước 3 với câu dưới thay cho file):

```sql
SELECT (SELECT count(*) FROM v_ruler_p2_area) AS ruler_area,   -- ≈ local (150 ngày 22/10)
       (SELECT count(*) FROM v_ruler_p2)      AS ruler_type,   -- ≈ local (238)
       (SELECT count(*) FROM properties)      AS properties,   -- = local
       (SELECT count(*) FROM information_schema.columns
         WHERE table_schema='public' AND table_name='properties'
           AND column_name='seller_name')     AS pii_col,      -- phải = 0
       (SELECT is_nullable || '/' || coalesce(column_default, 'none')
          FROM information_schema.columns
         WHERE table_schema='public' AND table_name='asset_nodes'
           AND column_name='parent_id')       AS parent_id;    -- phải = YES/none (032)
```

## Đã thử trước (local)

- `034` áp 2 lần vào DB local :5433: xanh; kết quả hai view giống hệt trước/sau (md5).
- DB trống dựng từ toàn bộ `db/migrations/*.sql`: hai view tạo được.
- DB mô phỏng cloud (migration 001–029) + SQL catch-up chạy 2 lần: xanh; cột các bảng sync khớp
  local, trừ đúng `properties.seller_name`; `asset_nodes.parent_id` NULL được, không default.
