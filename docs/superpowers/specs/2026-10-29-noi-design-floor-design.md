# noi-design-floor — vùng giao diện liệt kê dương và nối sàn thiết kế S4

Ngày: 2026-10-29 · Dãy U1 · Hạng T2 · Hồ sơ `_acceptance/noi-design-floor/`

## Vì sao

Ý định `y-dinh-design-floor.md` mục 2 (giám sát xếp 29/10 theo lời Mạnh: «nối floor sau khi vùng giao diện trừ được
vendor», «Áp như đề xuất» theo kế hoạch MBP ở phanlemanh/acceptance-gate-kit#308). `design.surface_globs` đang là
`app/src/app/**` + `app/src/components/**`, nên vùng giao diện gồm cả 379 tệp vendor (`ui`, `reui`, `blocks`, `examples`)
mà luật ReUI cấm sửa. Bộ đọc glob của kit 2.35.0 chưa có `!` hay `{a,b}` (K1), nên chỉ trừ được bằng danh sách dương.
`don-hex-tho` (#174) đã dọn hex thô ngoài vendor, nên sàn S4 nối được mà không chặn oan.

## Cách làm

- `design.surface_globs` liệt kê dương: `app/src/app/**`; `app/src/components/*.tsx`; mỗi thư mục con của
  `app/src/components/` không thuộc `VENDOR_DIRS` (`app/eslint.config.mjs`) một dòng `<dir>/**` — hôm nay 13 thư mục.
  Bộ khớp của kit đổi `*` thành một đoạn đường, nên `*.tsx` không lan xuống thư mục con. Số tệp khớp phải từ 619 xuống 240.
- `executors.design.floor` gọi `design-floor-s4.mjs --root .` theo khuôn đường không số của #171
  (`${CLAUDE_PLUGIN_ROOT:-$(node …resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-floor-s4.mjs)}`),
  gỡ ghi chú «CHƯA nối» đã lỗi thời (Ngoài-3 của don-hex-tho).
- Thước `scripts/design-floor-vung.test.mjs` (khoá `executors.test.design_floor_vung`): mọi thư mục con của
  `app/src/components/` nằm trong `surface_globs` hoặc `VENDOR_DIRS`, không bao giờ cả hai; số tệp khớp bằng tổng cũ trừ
  tệp vendor; quét `RE_HEX` trên vùng mới ra 0. Khác việc với `scripts/don-hex-tho.test.mjs` (0 hex ngoài vendor theo
  danh sách vendor cố định) — giám sát dặn ở U1-61.
- Mười vòng DO1 bắt đầu đếm sau khi hàng này gộp; vòng này không phải vòng DO1.

## Đặc tả UX

Không có — vòng chỉ đổi cấu hình kiểm và thêm test.
