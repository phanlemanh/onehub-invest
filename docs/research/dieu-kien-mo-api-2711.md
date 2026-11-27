# Điều kiện mở API dữ liệu (`data-api`) cho bên ngoài — danh sách kiểm (27/11)

> Soạn trên M5 theo lời GS 27/11. GS giữ sổ điều kiện; M5 giữ phần code. Mọi việc ghi «lời riêng của Mạnh» không ai
> làm thay (AGENTS.md «Vẫn cần lời riêng của Mạnh»: tiền, cloud, triển khai, sao lưu ra ngoài máy). Trang này không phải
> kế hoạch đã chốt — GS cắt hàng và trình phần cần quyết.

## Đích

Một khách bên ngoài có khoá gọi được `GET /v1/listings`, `GET /v1/listings/:listingKey`, `GET /v1/deals` trên miền
`data-api` đang chạy, nhận tin theo hình RESO (PB2), không nhận số S02 hay tên nguồn thật nào; không khoá → 401; project
thiếu khoá → 503 và không phục vụ (PB3).

## Danh sách kiểm

| # | Điều kiện | Ai làm | Trạng thái 27/11 | Lệnh kiểm sau |
|---|---|---|---|---|
| 1 | Mã công khai không mang tên nguồn thật (PB5 `data-api-don-ten-nguon` gộp) | M5 code, GS gộp | chờ chấm vòng 1 lại @678c08ec5 | trên `main`: `node scripts/data-api-ten-nguon.mjs` thoát 0 |
| 2 | Bốn đường thị trường không đọc S02 (HT20 `data-api-markets-khong-doc-s02` gộp) — **thiếu điều này thì mở API là đưa điểm S02 ra ngoài (luật 5)**; thay thế tạm: không mount `/v1/markets` khi triển khai | M5 code, Mạnh ký Cổng Phạm vi, GS gộp | thẻ Cổng Phạm vi chờ Mạnh @4693bede0 | `grep -rnE "airdna_\|area_sources\|ref_calib_" data-api/src data-api/api` chỉ còn chú thích |
| 3 | Hình tin chuẩn RESO, mã tin thuê ngắn hạn là HMAC có khoá, không ảnh (PB2 gộp) | M5 code, GS gộp | Cổng Phạm vi ký lại 27/11 @8b189fdf9; S2 đang làm | test `dapi_reso` của hồ sơ PB2 xanh trên `main` |
| 4 | Biến `DATA_API_KEYS` trên project Vercel của data-api (danh sách khoá, mỗi khách một khoá) | **lời riêng của Mạnh** (đặt secret) | chưa có (đo 25/11) | `vercel env ls` thấy tên biến (không in giá trị); gọi không khoá → 401 |
| 5 | Biến khoá bí mật cho mã tin thuê ngắn hạn (PB2 AC-2; tên biến do PB2 chốt ở S2) | **lời riêng của Mạnh** | chưa có (PB2 chưa code) | khởi động production thiếu biến → dừng với thông điệp ghim của PB2 |
| 6 | `DATABASE_URL` của project trỏ cloud (Supabase) **chỉ đọc**, và cloud có đủ bảng/khung nhìn data-api đọc | GS đo; **DDL hay vai chỉ đọc trên cloud = lời riêng của Mạnh** | chưa đo | xem mục «Bảng data-api đọc» dưới |
| 7 | Triển khai project Vercel `onehub-data-api` | **lời riêng của Mạnh** | chưa triển khai (không phục vụ — đo 25/11) | `curl -s <miền>/health` → 200; `curl -s -o /dev/null -w '%{http_code}' <miền>/v1/listings` → 401 |
| 8 | Đẩy `data-api/` ra kho công khai `onehub-data-api` (`tools/sync-public.sh`) | **chỉ Mạnh gọi**, sau điều kiện 1 | chưa (khoá tới khi PB5 gộp) | lưới tên nguồn chạy trên bản kho công khai thoát 0 |
| 9 | Kiểm đầu-cuối sau triển khai | GS | — | gọi có khoá `/v1/listings?kind=sale&limit=5`: 200, khoá phần tử đúng tệp hợp đồng PB2, không khoá `marketScore`, không chuỗi `S02` trong thân; `/v1/markets*` không khoá S02 nào |

## Bảng data-api đọc (đối chiếu cloud ở điều kiện 6)

Đọc từ `data-api/src/routes/*.ts` trên `main` 27/11: `areas`, `listings`, `nights`, `sale_offers`, `offer_price_rank`,
`v_ruler_p2`, `market_asset_stats`; và (tới khi HT20 gộp) `area_sources`, ba bảng S02. Đồng bộ cloud (`pipeline/sync-cloud.mjs`)
có `areas`, `area_sources`, `listings`, `market_asset_stats`, `nights`, `sale_offers`, `offer_price_rank`; bảng S02 lên cloud
dưới tên khác (`ref_calib_*`) nên **trên cloud các đường thị trường cũ sẽ lỗi 500** thay vì trả số — vẫn là lý do làm HT20,
không phải lý do bỏ qua. `v_ruler_p2` là khung nhìn (migration 034, 044, 060): cần đo cloud có khung nhìn này không.

## Ngoài trang này

- API căn (PB6 `data-api-can-tra-theo-ma`, đang soạn S1) — thêm vào danh sách khi Mạnh ký phạm vi.
- Tài khoản khách, đếm lượt, hoá đơn — thuộc bản đề xuất `docs/research/de-xuat-mo-api-2411.md` (chưa là kế hoạch).
