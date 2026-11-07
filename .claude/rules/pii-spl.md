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
- **Tên, SĐT người bán lên cloud và cổng Invest** (Mạnh chốt 2026-11-02, sửa đổi ADR-0007): `sale_offers.seller_name`,
  `seller_phone` được sync, giá trị chứa tên nguồn thật về `NULL` trong câu đọc của sync. Trên API công khai chỉ hai route
  `/api/v1/listings*` (sổ bề mặt khoá `publicOffers`) đọc tin rao qua `lib/offers-public.ts`; số chỉ ở route `contact`, không
  ở danh sách hay HTML. S02, S08 không tính là tin hiển thị được.
- Định danh người bán là tầng C, NHƯNG giá trị nào mang tên nguồn thật (vd `seller_ref` dạng `apify-facebook…`,
  `listing_url` theo domain nguồn) vẫn là tầng A — loại hoặc đổi sang mã `S0x` trước khi rời máy.
- Tên nhóm là tầng C, NHƯNG tên/khoá nhóm nào mang tên nguồn thật (vd khoá nhóm là URL có tên miền nguồn) vẫn
  tầng A. Tên tài khoản thu chưa chốt — giữ như tầng A.
- **S08 (danh mục dự án)**: không đưa nguyên bảng `stg_s08_inventory` vào sync cloud, response API công khai hay repo
  public. **Từ 2026-11-08 (Mạnh chốt, AGENTS.md luật 5 sửa đổi, ROADMAP §3 mục 38) thông tin dự án là công khai**: tên,
  địa chỉ, chủ đầu tư, pháp lý, quy mô, phân khu, toà, trục, căn từ S07, S08, S09 được lên cloud và Invest qua danh bạ, đã
  thay tên nguồn bằng mã. Giá chủ đầu tư và trạng thái quỹ căn S08 vẫn chỉ nội bộ tới khi Mạnh chốt.
- `data-api/` và `app/` được `tools/sync-public.sh` đẩy ra repo PUBLIC: không hostname nội bộ,
  không secret, không query thật nhạy cảm (app dùng stub trong `tools/public-overlay/`).
- Không hardcode literal nguồn — đọc mã từ `source_registry`.
