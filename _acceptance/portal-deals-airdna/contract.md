---
schema_version: 1
feature: Vá ranh giới cổng — Căn giá tốt sang Ops, gỡ AirDNA khỏi Mô phỏng đầu tư
slug: portal-deals-airdna
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-22T14:38:01Z
approved_by:
approved_at:
---

# Acceptance Contract: portal-deals-airdna

## Context

Kiểm kê UI 2026-10-22 thấy hai vi phạm luật bất biến trên Invest Portal công khai: trang
Căn giá tốt (`/deals`) hiện SĐT/tên người bán — SPL tầng A (ADR-0007, AGENTS.md luật 6) — và
Mô phỏng đầu tư (`/[country]/[market]/dau-tu`) hiện ADR/công suất AirDNA (luật 5: AirDNA chỉ
hiệu chuẩn ở `/ops/quality`). Bản vá dời Căn giá tốt sang Ops Portal (luật 9, clearance law
trong `docs/architecture/portals.md`), và thay số AirDNA bằng số tự thu. Không đổi giao diện —
bộ chuẩn UI/UX làm ở phiên khác.

Source input: prompt (phiên điều phối kiểm kê UI 2026-10-22 giao việc).

## Criteria

- AC-1: Given một khách chưa đăng nhập, When mở bất kỳ trang Invest nào (ví dụ `/vn`), Then thanh điều hướng Invest không có mục hay link tới `/deals`.
- AC-2: Given một khách chưa đăng nhập, When mở `/deals`, Then bị chuyển sang `/ops/deals`, và `/ops/deals` lại chuyển về `/login` — khách không thấy nội dung trang.
- AC-3: Given một user đăng nhập KHÔNG phải admin vào được Ops, When mở `/ops/deals`, Then trang không hiện SĐT, tên người bán, tên nhóm, nội dung tin hay ảnh tin.
- AC-4: Given admin, DB local có tin P1 kèm SĐT trong 45 ngày, When mở `/ops/deals`, Then thấy SĐT người bán (link gọi `tel:`) như trước bản vá.
- AC-5: Given bất kỳ ai xem `/ops/deals`, When trang hiện, Then nguồn tin chỉ ghi bằng mã tầng B (`S03`, `S05`, `S06`) — không có chữ "Zalo", "Facebook", "Chợ Tốt".
- AC-6: Given khách hoặc user không phải admin, When gọi `/api/zalo-media`, Then nhận 404 trước khi server đọc file; admin qua cổng quyền và vẫn bị chặn path ngoài vùng (403).
- AC-7: Given một khách, When mở `/vn/hanoi/dau-tu`, Then trang không chứa chữ "AirDNA" ở đâu cả và gợi ý ADR/công suất ghi rõ là số tự thu kèm cỡ mẫu.
- AC-8: Given cây mã, When `lib/invest.ts` tính số mặc định, Then không đọc bảng `airdna_*` hay crosswalk S02; ADR/công suất lấy từ `listing_stats` (90 đêm đầu, cùng mô hình `/yield`).
- AC-9: Given môi trường cloud (sync-cloud loại cột `seller_*`, không có `stg_zalo_posts`), When admin mở `/ops/deals` trên prod, Then trang không lỗi mà hiện bản không liên hệ. (judgment)
- AC-10: Given ba file giao diện bị chạm, When chạy cổng thiết kế, Then không có lỗi P0 a11y/contrast, và các khung chụp cho thấy bố cục trang không đổi ngoài chữ nguồn và khối bị ẩn.

## Coverage

- Trục người xem: khách | user thường đăng nhập | admin [thước CE: `users.role` + `canAccessOps`]
- Trục bề mặt: nav Invest | `/deals` | `/ops/deals` | `/api/zalo-media` | `/dau-tu` [thước CE: `nav.tsx` + cây route `app/src/app`]
- Trục môi trường: DB local (có tầng A) | cloud (không tầng A) [thước CE: `PII_EXCLUDE` trong `pipeline/sync-cloud.mjs`]
- Ô cloud × admin chỉ phủ bằng judgment (AC-9): không có prod để chạy thật trong vòng này.

## Out of scope

- Không quyết gộp `/dau-tu` vào `/yield` hay xoá route — để Mạnh chọn (route giữ nguyên, chỉ gỡ AirDNA).
- Không đổi giao diện/bố cục/màu (bộ chuẩn UI/UX ReUI ở phiên khác).
- Không đụng ảnh AirDNA ở `/listing/[id]` ("Ảnh từ AirDNA") — ghi thành việc tiếp theo.
- Không siết `canAccessOps` khi `OPS_EMAILS` trống (mọi user đăng nhập vào được Ops) — thuộc auth (T3), ghi thành việc tiếp theo.
- Không thu hẹp `ALLOWED_PREFIXES` của `/api/zalo-media` (đang cho cả `~/.openclaw`) — ghi thành việc tiếp theo.
- Không sửa `/api/v1/deals` (đã không trả liên hệ) và data-api.

## Notes

- Hợp đồng viết SAU khi code xong (bản vá tuân thủ, phiên điều phối giao kèm tiêu chí trong đề bài). Cổng Phạm vi để ở trạng thái V (`veto_state: mo`): Mạnh veto lúc nào cũng được.
- Ops ở local có tầng A vì dữ liệu chưa rời máy; prod không có cột `seller_*` nên tự rơi về bản không liên hệ (`getDeals` fallback).
- `smoke-portal-compliance.mjs` tạo phiên tạm cho admin có sẵn + một user thường tạm (`*.verify.test`) rồi xoá trong `finally`.
