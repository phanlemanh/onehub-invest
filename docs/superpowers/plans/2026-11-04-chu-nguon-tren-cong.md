# Kế hoạch: chu-nguon-tren-cong

Mã đã viết trước Cổng Phạm vi vì lời giao chỉ đổi chữ và có hạn gộp; kế hoạch ghi lại các phần đã làm để S4 đối chiếu. Thiết kế: `docs/superpowers/specs/2026-11-04-chu-nguon-tren-cong-design.md`.

| Task | Tệp | Lệnh kiểm | Phục vụ | independent |
|---|---|---|---|---|
| Thước HTML | `scripts/quet-ten-nguon-html.mjs`, `.test.mjs` | `node --test scripts/quet-ten-nguon-html.test.mjs` | E1, E2, E4b | false |
| Thước mã | `scripts/check-invest-tier-a.mjs` | `node scripts/check-invest-tier-a.mjs` | E3, E3b, E7b | false |
| Chữ về nguồn | `app/src/**` các trang, chân trang, thẻ listing | quét HTML trên bản chạy | E2, E3b, E6 | false |
| Chữ về giá | `(marketing)/page.tsx`, `methodology-definitions.tsx`, `insight-tables.tsx`, `yield`, `comparison.tsx` | `node --import tsx --test tests/chu-nguon-tren-cong.test.tsx` | E4 | false |
| Thuật ngữ | `CONTEXT.md`, `docs/ROADMAP.md` | đọc | — | true |
