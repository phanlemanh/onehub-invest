# HT23 — `/api/v1/markets` không trả số S02

## Vấn đề
`GET /api/v1/markets` là route `public` (`app/src/lib/api-surface.ts`), không kiểm quyền. Mã route nối `area_sources`
(source `S02`) với bảng điểm thị trường của S02, trả `marketScore` và xếp theo điểm ấy. Trên prod route trả 200, mỗi thị
trường VN mang `marketScore` khác null — số S02 lên API công khai, trái AGENTS.md luật 5 (số S02 chỉ ở `/ops/quality`).
Không thành phần UI nào gọi route này. Bộ soát `scripts/check-api-surface.mjs` với route public chỉ cấm `sale_offers`.

## Thiết kế
1. **Route** `app/src/app/api/v1/markets/route.ts`: bỏ JOIN bảng điểm S02 và `area_sources`; phản hồi mỗi dòng còn
   `id, name, countryCode, listingCount` — bỏ hẳn khoá `marketScore` (không có điểm tự thu thì không có trường; khoá null
   dễ đọc thành «chưa có»). Xếp `listing_count DESC, a.name`. Tham số `country`, `limit`, khuôn `meta` giữ nguyên.
2. **Sổ** `api-surface.ts`: `note` của `v1/markets` thành «danh sách thị trường và số tin; không mang số S02».
3. **Rào** `check-api-surface.mjs`: thông điệp mới `MSG.publicS02` — route `mode: "public"` mà bao đóng import (route + mọi
   module `app/src/lib` nó kéo theo, đã bỏ chú thích) có tên bảng `airdna_*` hoặc `ref_calib_*` thì đỏ. Trừ đúng một tệp:
   `app/src/lib/db.ts` — nơi ĐỊNH NGHĨA bộ đổi tên bảng cho cloud (giống cách rào bearer trừ `ops-access.ts`); không trừ thì
   mọi route đều đỏ. Thêm đột biến: M-a cấy lại câu JOIN vào route markets; M-b route public import `@/lib/queries`
   (có bảng S02); M-c bảng `ref_calib_*` trực tiếp. Mỗi đột biến đỏ đúng thông điệp ghim.
4. Soát mọi route public bằng rào mới: trước sửa chỉ `v1/markets` đỏ (đo 25/11: `asset-stats`, `listings`,
   `listings/[id]/contact` không chạm bảng S02 trong bao đóng).

## Ngoài phạm vi
`/ops/quality` và `lib/queries.ts` (chỉ Ops), `sync-cloud`, DDL, ghi cloud, `data-api/**` (M5 giữ HT19/HT20).

## Đích trên màn
Prod `curl -s 'https://<miền prod>/api/v1/markets?country=vn&limit=5' | jq '[.data[]|select(has("marketScore"))]|length'`:
5 → 0, đo sau khi Vercel triển khai bản gộp. Không có bước áp DB.
