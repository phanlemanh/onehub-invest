# Kế hoạch: chuyen-huong-ma-thi-truong

Design: `docs/superpowers/specs/2026-11-01-chuyen-huong-ma-thi-truong-design.md` · Hợp đồng: `_acceptance/chuyen-huong-ma-thi-truong/`

Các task tuần tự (cùng chạm `maNgan`, nên không tách song song).

## T1 — hàm đổi mã hai bản (phục vụ E1)
- Files: `app/src/lib/ma-thi-truong.ts`, `data-api/src/lib/ma-thi-truong.ts`
- `maNgan(id)` = `id.replace(/^vn-(thanh-pho|tinh)-/, "vn-")`; data-api thêm `giaiMaKhuVuc(id)` (một truy vấn
  `id = ANY` chỉ khi `maNgan(id) !== id`, ưu tiên mã nguyên văn), app thêm bản `giaiMaKhuVuc` dùng `pool` của app.
- Verify: `cd app && npx tsc --noEmit`; `cd data-api && npm run typecheck`. independent: false

## T2 — trang theo đường (E2–E4)
- Files: `app/src/app/(app)/[country]/[market]/page.tsx`, `listings/page.tsx`, `[submarket]/page.tsx`
- Không thấy mã → nếu `maNgan` khác và mã ngắn có → `permanentRedirect` (giữ đoạn con + query). Còn lại như cũ.
- Verify: tsc + lint. independent: false

## T3 — trang theo tham số (E5)
- Files: `app/src/app/(app)/[country]/page.tsx`, `yield/page.tsx`, `compare/page.tsx`
- Khớp mã nguyên văn trước, rồi `maNgan`. Verify: tsc + lint. independent: false

## T4 — API app + data-api (E6–E8)
- Files: `app/src/app/api/v1/{listings,asset-stats,deals,offers}/route.ts`, `data-api/src/routes/{markets,listings,asset-stats,deals}.ts`
- `giaiMaKhuVuc` ở đầu route trước khi đưa mã vào truy vấn. Verify: tsc app + data-api. independent: false

## T5 — phép đo (E1–E9)
- Files: `scripts/chuyen-huong-ma-thi-truong/acceptance.mjs`, `app/tests/chuyen-huong-ma-thi-truong.itest.tsx`
- DB thử `oneinvest_n1_chm_truoc` (pg_dump -s + dữ liệu areas/area_sources của DB máy thu) và `_sau` (createdb -T
  rồi áp tệp 064 + chèn phường, listing, tin, asset stats dưới `vn-da-nang`). Mỗi chế độ (`ma`, `app`, `api`) có lượt
  phá-thử ghim thông điệp (MEASURE-BIRTH). Verify: chạy ba chế độ xanh + ba lượt phá đỏ đúng thông điệp.
