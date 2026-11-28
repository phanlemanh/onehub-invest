# Đường lên cloud che tên nguồn ở mọi cột — thiết kế (HT26)

Hàng HT26 `sync-cloud-che-ten-nguon-moi-cot`, dãy P2, T3, GS cắt 25/11 sau khi bản chép HT18 thấy tên nguồn thật trong chính tập
dữ liệu `pipeline/sync-cloud.mjs` đẩy lên cloud.

## 1. Hiện trạng (đo 25/11)

- **Bộ chặn hiện có** (`assertNoSourceNames`, sync-cloud.mjs:419): soát mọi cột của ĐÚNG ba bảng trong `CLOUD_ALLOW` — `sale_offers`,
  `sellers`, `properties` (chuỗi JSON thô + giá trị đã giải + khoá lồng). 19 bảng FILL còn lại không bị soát. Che ở câu đọc
  (`maskedSourceExpr`) chỉ áp `sale_offers.seller_name`, `seller_phone`.
- **Sự cố 24–25/11** (GS xác nhận qua `pipeline/logs/cloud-sync.log`): 17 lượt `SYNC FAIL [scan] … sale_offers.street_raw` từ 23:34Z
  24/11, lượt tốt cuối 22:57Z — một ô S06 (tin rent_lt, first_seen 17:06Z 24/11) chặn cả lượt; cloud đứng số. Bộ chặn đúng (fail-closed)
  nhưng thiếu bước che nên một ô bẩn làm dừng toàn bộ. GS xin Mạnh lời đặt NULL ô đó; sửa bền ở transform là PL39 (P4).

## 2. Bảng phủ ca (S1, đo chỉ đọc 25/11: kéo cột về máy, đếm bằng findSourceNames; 217 lời gọi, ~240 MB, không ghi đĩa, không gửi mẫu)

Quét rộng 108 cột text/jsonb/text[] của 22 bảng FILL; chỉ 9 cột dưới có trúng. **Sửa 26/11 (phát hiện ở HT29):** 3.743 ô trên cloud
tách thành **3.242 ô rò thật** + **501 hằng máy** — `areas.meta` mang giá trị máy như `osm-phuong` (hằng `NGUON_PHUONG`, 500 dòng, trúng
S04 vì tên nguồn thật là «osm») và `airbnb-discovery` (1 dòng, trúng S01). Che các hằng này làm gãy bên đọc (phuongHopLe, reassign-areas,
nap-dvhc). Cách xử (miễn khớp trọn, hay giữ che và sửa bên đọc) là câu của Mạnh, đang trình.

| bảng.cột (tên cloud) | ô trên cloud | ô ở máy thu | ai đọc phía sau | xử lý |
|---|---|---|---|---|
| ref_calib_listings.metrics | 1575 (S01) | 1575 | không ai đọc | che (khoá/giá trị json → mã) |
| ref_calib_listings.listing_url | 1575 (S01) | 1575 | data-api `/v1/listings/:id` trả `listingUrl` (listings.ts:88,126) | URL đứng riêng → NULL; bên đọc mất link (việc của M5 với data-api) |
| areas.meta | 501 (S04 500, S01 1) — HẰNG MÁY, không phải rò | 501 | data-api markets.ts:51 đọc, không trả; mã so NGUON_PHUONG (phuongHopLe, reassign-areas, nap-dvhc) | chờ Mạnh: miễn khớp trọn (a) hay che + sửa bên đọc (c) |
| dq_check_results.detail | 75 (S02) | 75 | /ops/quality: dq-checks.ts che bằng maskDetail; do-hang-ngay.ts:26,43 đọc KHÔNG che; extraction-quality chỉ rút số | che → mã; do-hang-ngay.ts che như dq-checks |
| listings.photo_urls | 10 (S01) | 10 | thẻ Invest queries.ts:242 (ảnh đầu); api/v1/listings; data-api photos.urls | bỏ phần tử URL trúng; thẻ Invest lấy ảnh kế |
| area_sources.meta | 3 (S02) | 3 | không ai đọc | che |
| ref_calib_listings.title | 3 (S01) | 3 | không ai đọc | che (chữ → mã) |
| listings.name | 1 (S01) | 1 | thẻ Invest queries.ts:242; data-api l.* | che (chữ → mã) |
| sale_offers.street_raw | 0 | 1 (S06) | deals.ts (chữ đường tin rao Invest); review-card.tsx:217 | che (chữ → mã); hết chặn cả lượt |

Ngoài phạm vi, vì: tên cột `airdna_id`, `airdna_market_id`, `airdna_sub_id` trên cloud — tên này kho công khai đã tự in ở AGENTS.md
luật 5; đổi tên cột là DDL cloud + migration + mọi bên đọc → nợ dọn tên nguồn (GS 25/11). `listingUrl` của data-api → việc của M5.

## 3. Cách làm

1. Sau bước đọc (dòng JSON do Postgres sinh), che MỌI ô text/json/mảng của MỌI bảng FILL bằng hàm dùng chung
   `pipeline/lib/che-ten-nguon-gia-tri.mjs` (của HT18, cùng lõi `maskSourceNames`): chữ tự do → mã S0x; URL đứng riêng → NULL; phần tử
   URL trong mảng → bỏ; khoá/giá trị json → mã. Giữ độ chính xác số (JSON.rawJSON như HT18). Số ô che theo bảng.cột in một dòng cảnh
   báo của lượt (không giá trị).
2. Bộ chặn soát MỌI bảng FILL (không còn giới hạn CLOUD_ALLOW), sau che; trúng vẫn dừng trước khi gửi (fail-closed giữ nguyên).
3. `app/src/lib/do-hang-ngay.ts`: che `detail` như `dq-checks.ts` (bên đọc không che duy nhất).
4. Lệnh đo `scripts/do-ten-nguon-cloud.mjs`: bản đóng gói của phép đo S1 (chỉ đọc cloud + máy thu, in số theo bảng.cột) — dùng cho eval
   và đo lại sau áp.

## 4. Áp

Gộp mã thì lượt sync kế tiếp (thay trọn bảng FILL) tự thay 3.242 ô rò thật trên cloud (cộng 501 hằng máy tuỳ lời Mạnh) bằng bản đã che — đó là GHI CLOUD, cần lời riêng của Mạnh
ở bước áp (hồ sơ áp: lệnh, số chạy thử ở máy thu, sao lưu trước, cách lùi, lệnh kiểm sau = `do-ten-nguon-cloud.mjs` ra 0).
