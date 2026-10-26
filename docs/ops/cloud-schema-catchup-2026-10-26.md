# Bắt kịp schema cloud (Supabase) và DB local — 2026-10-26 (043, 044)

Người chạy: **Mạnh** (luật 2: agent không tự sửa DB production). Agent chỉ đo (chỉ đọc) và soạn SQL.
Bộ kiểm tĩnh hai tệp: `node scripts/check-cloud-catchup.mjs nap-lai-khong-xoa` (mốc, khối đo chỉ đọc, byte bản đã áp).

## 043 — sổ từ vựng một nguồn (PL6) · ĐÃ ÁP 26/10

[`cloud-schema-catchup-2026-10-26-043.sql`](cloud-schema-catchup-2026-10-26-043.sql) là hồ sơ của lần áp ngày 26/10
(giám sát đợt `dot0-cam-mau`). Khối `-- ÁP` là nguyên văn từng byte tệp đã áp (sha256 `5391e044…`). 043 nguyên văn lỗi
trên cloud vì cloud thiếu 3 CHECK của 025, nên tệp thêm ba CHECK `NOT VALID` trước khi chép 043. Khối `-- ĐO TRƯỚC` dùng
khi cần đo lại: CHECK nào đã có, số dòng lệch từng CHECK (phải 0).

## 044 — nạp lại không xoá (PL14) · CHƯA ÁP, KHÔNG CẦN ĐỔI LƯỢC ĐỒ CLOUD

[`cloud-schema-catchup-2026-10-26-044.sql`](cloud-schema-catchup-2026-10-26-044.sql): khối `-- ĐO TRƯỚC` gồm năm câu
chỉ đọc, kèm kết quả đo ngày 26/10. Khối `-- ÁP` **không có câu nào**.

044 đổi lược đồ local: `sale_offers`/`listings` thành view sống trên `sale_offer_records`/`listing_records`. Cloud
không phải đổi theo:
- `pipeline/sync-cloud.mjs` chép hai bảng ấy từ view sống, và chỉ chép `nights`/`listing_stats`/`property_offers` có
  cha sống (`CHILD_OF_LIVE`). Cloud vẫn là bảng thường, chỉ có dòng sống, như hôm nay.
- Cột mới ở lại máy. `retired_at`, `superseded_by`… không có trong `CLOUD_ALLOW` của `sale_offers`; cloud `listings`
  không có các cột ấy, nên sync cảnh báo «lệch schema» rồi bỏ qua.

Đo 26/10 (chỉ đọc qua Management API, chỉ câu SELECT):
- hai bảng là `r`;
- khoá ngoại tới chúng chỉ có `nights` và `listing_stats` → `listings`, đều CASCADE;
- view đọc chúng chỉ có `v_ruler_p2`, `v_ruler_p2_area`;
- 0 cột 044, 0 dòng con mồ côi.

## Thứ tự sau khi PR PL14 merge (bắt buộc — launchd chạy code `main` trên DB local dùng chung)

1. Merge PR vào `main` (làn merge), rồi `git -C ~/dev/onehub-invest pull --ff-only origin main`.
2. **Ngay sau đó**, áp 044 vào DB local từ checkout chính. Áp hai lần để thấy idempotent; lần hai không lỗi.

```bash
cd ~/dev/onehub-invest && docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 < db/migrations/044_nap_lai_khong_xoa.sql
```

   Vì sao không áp trước khi merge: code `main` cũ còn `DELETE FROM listings` (reassign-areas, transform-airbnb).
   Trên DB đã có 044, câu ấy gãy vì khoá ngoại RESTRICT. Ngược lại, code mới trên DB chưa có 044 thì dừng có tiếng
   (`writeOffers: chưa áp migration 044`). Giữa bước 1 và bước 2 không có lượt đêm nào được chạy.
3. Cloud: không áp gì. Chạy khối `-- ĐO TRƯỚC` của tệp 044. Khác kết quả 26/10 ở câu (1)–(4) thì dừng và báo lại.
4. Sau lượt sync 15′ đầu tiên chạy code mới, chạy lại câu (5): số dòng ≈ local, mồ côi = 0.

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -At -c "SELECT (SELECT count(*) FROM sale_offers), (SELECT count(*) FROM listings), (SELECT count(*) FROM sale_offer_records WHERE retired_at IS NOT NULL)"
```

## Hệ quả một lần (đã biết, PL14-Hỏi-2 Mạnh duyệt «đổi khoá ngay»)

Lượt nạp S03/S05 đầu tiên sau bước 2 đổi khoá mọi tin S03/S05: tin khoá cũ (băm nội dung) nghỉ với `retired_reason =
'doi_khoa'` và `superseded_by` trỏ tin khoá mới. Thước đếm 26/10 trên DB local: 269 tin S03 + 28 tin S05; ma trận quyết
định/liên kết mất 0. Trên cloud, `offer_id` của S03/S05 đổi một lần, nên đường dẫn cũ theo `offer_id` của hai nguồn ấy
hết hiệu lực một lần. S06 giữ nguyên khoá (`list_id`).
