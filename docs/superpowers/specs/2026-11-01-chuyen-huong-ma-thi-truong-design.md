# chuyen-huong-ma-thi-truong — link mã thị trường cũ vẫn mở được sau migration 064

Ngày: 2026-11-01 · Hạng: T2 · Dãy: N1 (liên làn) · Nhánh: `feat/chuyen-huong-ma-thi-truong` (đặt trên #252)

## Vì sao

Migration 064 (hàng `s06-vung-moi-len-canonical`, PR #252) đổi khoá 32 thị trường cấp tỉnh từ mã dài
`vn-(thanh-pho|tinh)-<x>` sang mã ngắn `vn-<x>`. Mã thị trường lộ ra ngoài ở hai chỗ:

- URL cổng Invest: `/vn/<x>` với `<x>` = mã bỏ tiền tố quốc gia (`/vn/thanh-pho-da-nang`), các trang con
  `/listings`, `/<phường>`, `/map`, `/dau-tu`, và tham số `?market=` (Finder), `?area=`/`?market=` (Ước tính lợi suất),
  `?areas=` (So sánh).
- API công khai của app (Vercel): `?market=`/`?area=` của `/api/v1/listings`, `/api/v1/asset-stats`,
  `/api/v1/deals`, `/api/v1/offers`.
- data-api công khai (gói riêng): `/v1/markets/:id` (+ `/submarkets`, `/insights`), `?market=`/`?area=` của
  `/v1/listings`, `/v1/asset-stats`, `/v1/deals`.

Cổng 2 của s06 ghi Ngoài-1 «mở hợp đồng mới»; Mạnh 01/11 chọn «Chờ chuyển hướng»: 064 chỉ áp lên DB máy thu sau khi
hàng này gộp. Giám sát giao dãy N1 cùng ngày, ưu tiên cao (đích ra mắt 05/11).

## Ràng buộc quyết định thiết kế

Thứ tự triển khai đã chốt: **hàng này gộp (Vercel deploy ngay) → sau đó mới áp 064** (cloud đổi theo trong ≤15′).
Nên code phải đúng ở CẢ HAI trạng thái DB:

| Trạng thái | `/vn/thanh-pho-da-nang` | `/vn/da-nang` |
|---|---|---|
| Trước 064 (DB còn mã dài) | phải mở trang như hôm nay | (không có trang — 404 như hôm nay) |
| Sau 064 (DB mã ngắn) | chuyển hướng vĩnh viễn → `/vn/da-nang` | mở trang |

Redirect tĩnh trong `app/next.config.ts` (lối giám sát nêu, luật slug AGENTS.md) bắn ở cả hai trạng thái: trước 064 nó
đưa link đang chạy tới `/vn/da-nang` chưa tồn tại → 404 trên MỌI trang tỉnh cho tới khi 064 áp. Lối đó trái đúng ý
«chờ chuyển hướng» (không để link gãy), nên chết. Luật slug của AGENTS.md nói về đổi slug TĨNH của route (tiếng Việt →
tiếng Anh), không phải mã dữ liệu trong đoạn động.

**Lối chọn: chuyển hướng có điều kiện ở tầng trang** — tra mã như nhận được; KHÔNG thấy, và mã có dạng dài, thì tra mã
ngắn; thấy thì chuyển sang đường mã ngắn (giữ đoạn con và query) — `permanentRedirect()` (308) hay `redirect()` (307)
theo Hỏi-1; công cụ tìm kiếm đối xử 308 như 301. Muốn đúng mã 301 thì phải đi qua `app/src/proxy.ts` (đường T3, cổng
auth `/ops`) — không đáng chạm cổng auth cho một redirect.

## Thiết kế

Một luật đổi mã, giống hệt 064: `regexp_replace(id, '^vn-(thanh-pho|tinh)-', 'vn-')`.

### app

- `app/src/lib/ma-thi-truong.ts` — `maNgan(id)`: mã dài → mã ngắn, mã khác trả nguyên. Thuần.
- Trang theo đường (`[country]/[market]/page.tsx`, `listings/page.tsx`, `[submarket]/page.tsx`): tra như hôm nay;
  không thấy mà `maNgan(id) !== id` và mã ngắn có trong `areas` (cùng cấp: thị trường; trang phường thì phường giải được
  dưới mã ngắn) → `permanentRedirect` sang `/<country>/<mã ngắn bỏ tiền tố>[/<đoạn con>][?query]`. Không thấy cả hai →
  404 như hôm nay (không chuyển hướng tới chỗ không có).
- Trang theo tham số (Finder `?market=`, Lợi suất `?area=`/`?market=`, So sánh `?areas=`): khớp mã như nhận được
  trước, không khớp thì khớp `maNgan`. Không chuyển hướng (trang đã hiện đúng thị trường).
- API `/api/v1/{listings,asset-stats,deals,offers}`: `giaiMaKhuVuc(id)` (cùng luật với bản data-api dưới) ở đầu route,
  trước khi đưa mã vào truy vấn.
- `/map` (redirect sẵn sang Finder `?market=<x>`) và `/dau-tu` (next.config → `/yield?area=…`) chảy qua hai trang trên,
  không sửa riêng.

### data-api

- `data-api/src/lib/ma-thi-truong.ts` — bản chép `maNgan` (data-api là gói riêng, sang repo public bằng subtree; không
  import chéo từ app) + `giaiMaKhuVuc(id)`: `maNgan(id) === id` → trả nguyên, không truy vấn; ngược lại một truy vấn
  `SELECT id FROM areas WHERE id = ANY([id, ngắn])`, ưu tiên mã nguyên văn nếu còn, rồi mã ngắn, không có cả hai →
  trả nguyên (route trả 404/rỗng như hôm nay).
- Gọi ở đầu mọi route nhận mã: `/v1/markets/:id`, `/:id/submarkets`, `/:id/insights`, `?market=`/`?area=` của
  listings, asset-stats, deals. Kết quả trả `id` thật trong DB (mã ngắn sau 064) — client đọc được mã mới.
- Không chạm `data-api/src/middleware/**` (đường T3).

## Đo

Không dựng dev server. DB thử trên :5433 (luật db-thu), dựng từ một bản gốc: lược đồ đầy đủ (`pg_dump -s`) + dữ liệu
`areas`/`area_sources` chép từ DB máy thu (còn mã dài — 064 chưa áp ở đó).

- **trước** = bản gốc + một phường, listing, tin bán, tin thuê, dòng `market_asset_stats`, deal dưới
  `vn-thanh-pho-da-nang` (như thể đã nạp phường trước 064).
- **sau** = bản gốc áp CHÍNH tệp 064 (bản gốc chưa có tham chiếu nên rào của 064 cho qua), rồi chèn cùng bộ dữ liệu dưới
  `vn-da-nang` (trạng thái sau khi nạp phường).

Ca app gọi thẳng hàm trang (server component) và handler route với `DATABASE_URL` trỏ DB thử, bắt lỗi `NEXT_REDIRECT`
(đích + mã) và `NEXT_HTTP_ERROR_FALLBACK;404`; ca data-api gọi `app.request()` của Hono. 32 mã dài lấy từ DB máy thu
lúc chạy. Ma trận route × tham số viết trước (5 ô app, 9 ô data-api); mỗi ô phải không rỗng khi gọi bằng mã ngắn rồi
mới so byte với mã dài. Đột biến đặt trên BẢN CHÉP tệp (bỏ lời gọi đổi mã, hay luôn tra) — không sửa tệp thật. Ca đếm
truy vấn so với mốc của bản chép route ở gốc hàng, kèm đối chứng dương (mã dài phát sinh thêm truy vấn).

Hai lựa chọn chờ Mạnh ở Cổng Phạm vi (sổ quyết định): **Hỏi-1** 308 vĩnh viễn hay 307 tạm — lùi 064 sau khi 308 đã bắn
thì trình duyệt đã lưu chuyển hướng vẫn tới trang mã ngắn (404) tới khi hết bộ nhớ đệm; **Hỏi-2** bí danh mã cũ ở API
công khai giữ bao lâu (máy khuyên không hạn, không cơ chế hết hạn).

## Ngoài phạm vi

- Áp 064 (Mạnh duyệt riêng, sau hàng này).
- Gỡ nhánh tra mã dài trong `marketNameOf` (Ngoài-2 của s06) — sau khi 064 áp.
- `/ops/**` (nội bộ, đăng nhập; link nội bộ sinh từ DB nên tự đúng sau 064).
- Bản đồ trang (sitemap) — app chưa có.
- Kiểm HTTP thật qua dev server / Vercel (khai giới hạn; ca gọi hàm trang).
