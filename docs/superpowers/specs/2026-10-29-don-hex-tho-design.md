# don-hex-tho — dọn hex thô trong mã giao diện của app

Ngày: 2026-10-29 · Dãy U1 · Hạng T2 · Hồ sơ `_acceptance/don-hex-tho/`

## Vì sao

Kit 2.35.0 đưa sàn thiết kế (design-floor) bậc M1: lượt chấm S4 chặn khi tệp giao diện mà vòng chạm có hex thô. Kho
khai `design.surface_globs` = `app/src/app/**` + `app/src/components/**`. Đo 29/10 trên main `3936e3d0` bằng regex
`RE_HEX` của `design-floor-s4.mjs`: ngoài các thư mục vendor (`ui`, `reui`, `blocks`, `examples`) còn đúng 15 chỗ ở 5
tệp. Mạnh 29/10: «xếp hàng dọn hex thô trước khi nối floor» và «đổi phạm vi don-hex-tho còn ~15 chỗ của app, không
đụng vendor/logo». Ý định: `.acceptance-runs/dieu-phoi-dot0-cam-mau/y-dinh-design-floor.md` mục 1.

| Tệp | Chỗ | Vai |
|---|---|---|
| `components/finder/bins.ts` | 6 | bậc choropleth (blue-200/400/700/900), ô chưa có số sáng/tối |
| `components/finder/choropleth-map.tsx` | 2 | viền khu vực sáng/tối |
| `components/listing/listings-map.tsx` | 3 | nhãn giá kiểu Airbnb: mực, nền, viền |
| `components/mini-map.tsx` | 3 | phường đang xem, phường khác, viền |
| `components/ops/data-flow/flow-journey.tsx` | 1 | mặt nạ quét `#000` |

## Cách làm

1. **Màu bản đồ ra khỏi vùng giao diện.** MapLibre không đọc được biến CSS hay oklch, nên màu bản đồ buộc là hex —
   đổi sang token là không làm được. Hex vẫn ở lại, chỉ dời chỗ: tệp mới `app/src/lib/map-colors.ts` (cạnh
   `lib/map-style.ts`, ngoài `surface_globs`) giữ cả 14 giá trị bản đồ với tên theo vai, đúng từng giá trị cũ, cặp
   sáng/tối giữ nguyên. Bốn tệp giao diện import tên.
   - `bins.ts` tái xuất `BIN_COLORS`, `NO_DATA_COLOR`, `NO_DATA_COLOR_DARK` từ lib: nơi dùng và tài liệu nói «màu bậc ở
     `bins.ts`» vẫn đúng; giá trị chỉ sống một chỗ.
   - `choropleth-map.tsx` dùng `AREA_LINE.light` / `AREA_LINE.dark`.
   - `listings-map.tsx` giữ ba hằng cục bộ `INK`, `PAPER`, `EDGE` nhưng gán từ `LISTING_PIN` (thân hàm không đổi).
   - `mini-map.tsx` dùng `MINI_MAP.active` / `.idle` / `.line`.
2. **Mặt nạ quét** `#000` → `black`: `mask-image` chỉ đọc kênh alpha, `black` và `#000` cùng alpha 1 nên kết quả vẽ
   không đổi. Không cần dời sang lib.
3. **Luật eslint** `MAP_FILES` (`app/eslint.config.mjs`) còn đúng hai tệp lib (`map-style.ts`, `map-colors.ts`): bốn
   tệp giao diện thôi được miễn `onehub-ui/no-hardcoded-color`. Ca selftest của plugin eslint đổi đường tệp miễn từ
   `mini-map.tsx` sang `lib/map-colors.ts`, giữ nguyên ý ca và đối chứng. Danh sách đóng trong
   `.claude/skills/onehub-ui/SKILL.md` và dòng `bins.ts` trong `data-color.md` sửa theo (giám sát duyệt U1-61, U1-62).
4. **Thước riêng** `scripts/don-hex-tho.test.mjs` (khoá `executors.test.hex_tho`): luật eslint chỉ bắt hex trong
   `className`/`style`/khoá `color|fill|stroke…`, không bắt khoá paint MapLibre (`fill-color`, `line-color`) hay chuỗi
   mặt nạ — nên lint không đo được hàng này. Test dùng đúng regex `RE_HEX` của kit.

Không đụng: `components/{ui,reui,blocks,examples}/**` (mã cài sẵn, kể cả logo `ui/svgs`), `noi-design-floor` (nối
`executors.design.floor`, danh sách dương của `surface_globs` — hàng kế).

## Đặc tả UX

Không có. Vòng không đổi gì người dùng thấy: cùng giá trị màu, cùng bố cục — xem sổ quyết định (bỏ đặc-tả-UX, bỏ
design-pass, bỏ ui-observed).
