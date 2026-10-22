---
paths:
  - "data-api/**"
  - "app/src/app/api/**"
  - "pipeline/sync-cloud.mjs"
  - "pipeline/push-ops-facts.mjs"
  - "scripts/cloud-sync.sh"
  - "tools/**"
---

# Ranh giới dữ liệu: SPL + PII (ADR-0007, hiến pháp #3)

Code ở các đường dẫn này đưa dữ liệu RA KHỎI máy local (cloud Supabase, API, repo public).

| Tầng | Gì | Được đi đâu |
|---|---|---|
| A — bí mật | tên nguồn thật, SĐT, tên/ID người bán, hồ sơ người dùng, `sale_offers` thô, `review_queue`, `user_events/user_profile` | **chỉ máy local** — cloud chỉ nhận hash hoặc aggregate |
| B — nội bộ | mã `S01`…`S07` | API `/api/v1/*`, trang `/ops/**` |
| C — công khai | nhãn ("Tự thu", "Hiệu chuẩn") | Invest Portal, `/phuong-phap` |

- Thêm cột/bảng vào luồng sync hoặc response API → kiểm từng field thuộc tầng nào trước.
- `data-api/` và `app/` được `tools/sync-public.sh` đẩy ra repo PUBLIC: không hostname nội bộ,
  không secret, không query thật nhạy cảm (app dùng stub trong `tools/public-overlay/`).
- Không hardcode literal nguồn — đọc mã từ `source_registry`.
