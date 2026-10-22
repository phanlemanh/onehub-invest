---
schema_version: 1
feature: Gỡ ảnh và chữ AirDNA khỏi trang chi tiết listing (Invest)
slug: listing-airdna-photos
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: verified
veto_state: mo
veto_opened_at: 2026-10-22T14:55:20Z
approved_by:
approved_at:
---

# Acceptance Contract: listing-airdna-photos

## Context

Kiểm kê UI 2026-10-22 thấy trang chi tiết listing `/listing/[id]` (Invest, công khai) mượn ảnh
từ bảng `airdna_listings` khi listing chưa tự thu PDP, kèm dòng chữ "Ảnh từ AirDNA (listing này
chưa tự thu PDP)" và link Airbnb lấy từ AirDNA — vi phạm AGENTS.md luật 5 (AirDNA chỉ để hiệu
chuẩn, chỉ ở `/ops/quality`). Bản vá `fix/portal-deals-airdna` cố ý để route này ngoài phạm vi.
Bản vá này: `getListingDetail` chỉ đọc ảnh tự thu (`listings.photo_urls`), bỏ hẳn hai truy vấn
`airdna_listings`; listing chưa có ảnh tự thu rơi về trạng thái trống hiện có (không lưới ảnh).
Không restyle — bộ chuẩn UI ReUI làm ở phiên khác.

Source input: prompt (phiên điều phối kiểm kê UI 2026-10-22 giao việc).

## Criteria

- AC-1: Given listing có cả ảnh tự thu lẫn ảnh AirDNA khác bộ tự thu, When khách mở `/listing/[id]`, Then mọi ảnh trên trang thuộc bộ tự thu và không có ảnh nào chỉ AirDNA có.
- AC-2: Given listing chưa có ảnh tự thu, When khách mở `/listing/[id]`, Then trang trả 200 và không có ảnh listing nào (trạng thái trống hiện có, không lưới ảnh).
- AC-3: Given bất kỳ listing nào, When khách mở `/listing/[id]`, Then HTML trang không chứa chữ "AirDNA" (gồm dòng "Ảnh từ AirDNA").
- AC-4: Given cây mã, When `getListingDetail` dựng dữ liệu listing, Then không truy vấn bảng `airdna_*`, và kiểu `ListingDetail` không còn trường `photoSource`/`listingUrl` gốc AirDNA.
- AC-5: Given route `app/src/app/(app)/listing` và `app/src/components/listing`, When đọc mã render (bỏ comment), Then không còn chữ AirDNA hay nhánh `photoSource`.
- AC-6: Given khách muốn xem căn gốc, When trang listing hiện, Then vẫn có nút "Mở trên Airbnb" trỏ `https://www.airbnb.com/rooms/<số>` dựng từ id listing (không cần dữ liệu AirDNA).
- AC-7: Given trang listing bị chạm, When chạy cổng thiết kế và tsc/lint, Then không có lỗi P0 a11y/contrast, tsc + lint không lỗi, và khung chụp cho thấy bố cục trang không đổi ngoài việc bỏ dòng chú thích dưới lưới ảnh.

## Coverage

- Trục ảnh của listing: có tự thu + có AirDNA | có tự thu, không AirDNA | không tự thu + có AirDNA | không tự thu, không AirDNA [thước CE: `listings.photo_urls` × `airdna_listings.photo_urls`]
- Ô "không tự thu + có AirDNA" (đúng ca cũ mượn ảnh) KHÔNG có trong DB local (0/506, đo 2026-10-22) → phủ bằng kiểm tĩnh AC-4/AC-5 (mã không còn đường đọc AirDNA) và AC-2 trên căn không ảnh bất kỳ; smoke tự dùng ca đó nếu DB có.
- Trục tầng: truy vấn (`lib/queries.ts`) | render (route + components/listing) | HTML thật [thước CE: dòng chảy app chỉ đọc]

## Out of scope

- Không restyle trạng thái trống hay lưới ảnh (bộ chuẩn UI ReUI làm ở phiên khác).
- Không đụng bảng/pipeline `airdna_listings` hay việc thu PDP tự thu (làn ZCode) — 13 listing chưa có ảnh tự thu vẫn không ảnh cho tới khi thu.
- Không gỡ AirDNA ở `/dau-tu` — đã làm ở `fix/portal-deals-airdna` (chưa merge main).
- Không đổi `/ops/quality` (nơi duy nhất được hiện AirDNA) và `getAirdnaComparison`/`getTruthfulCoverage` (chỉ Ops gọi).
- Không gộp script kiểm vào `scripts/check-portal-compliance.mjs` (file đó chưa có ở main) — gộp khi cả hai nhánh đã vào main.

## Notes

- Hợp đồng viết SAU khi code xong (bản vá tuân thủ do phiên điều phối giao kèm tiêu chí trong đề bài). Cổng Phạm vi ở trạng thái V (`veto_state: mo`): Mạnh veto lúc nào cũng được.
- Link phụ "Xem trên Airbnb ↗" dưới lưới ảnh (URL từ `airdna_listings.listing_url`) bị bỏ cùng; nút "Mở trên Airbnb" ở đầu trang (từ `airbnbUrlOf(id)`) vẫn còn — AC-6.
- `listing_smoke` cần app chạy :3456 TỪ worktree này + DB local :5433.
