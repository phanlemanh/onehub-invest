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
| A — bí mật | tên nguồn thật, hồ sơ người dùng app, `review_queue`, `user_events/user_profile` | **chỉ máy local** — cloud chỉ nhận hash hoặc aggregate |
| B — nội bộ | mã `S01`…`S07` | API `/api/v1/*`, trang `/ops/**` |
| C — công khai | nhãn ("Tự thu", "Hiệu chuẩn") · **định danh người bán trên tin rao** (tên, SĐT, ID tài khoản — hoạt động bán hàng/môi giới, Mạnh chốt 2026-10-23) · **tên nhóm cộng đồng S03 thu** (Mạnh chốt 2026-10-24) | Invest Portal, `/phuong-phap`, cloud, API |

- Thêm cột/bảng vào luồng sync hoặc response API → kiểm từng field thuộc tầng nào trước.
- Định danh người bán là tầng C, NHƯNG giá trị nào mang tên nguồn thật (vd `seller_ref` dạng `apify-facebook…`,
  `listing_url` theo domain nguồn) vẫn là tầng A — loại hoặc đổi sang mã `S0x` trước khi rời máy.
- Tên nhóm là tầng C, NHƯNG tên/khoá nhóm nào mang tên nguồn thật (vd khoá nhóm là URL có tên miền nguồn) vẫn
  tầng A. Tên tài khoản thu chưa chốt — giữ như tầng A.
- **S08 (danh mục dự án)**: dữ liệu chỉ dùng nội bộ như nguồn hiệu chuẩn (AGENTS.md cạnh luật 5) — không đưa bảng
  `stg_s08_inventory` hay nội dung nguyên văn của S08 vào sync cloud, response API công khai hay repo public.
- `data-api/` và `app/` được `tools/sync-public.sh` đẩy ra repo PUBLIC: không hostname nội bộ,
  không secret, không query thật nhạy cảm (app dùng stub trong `tools/public-overlay/`).
- Không hardcode literal nguồn — đọc mã từ `source_registry`.
