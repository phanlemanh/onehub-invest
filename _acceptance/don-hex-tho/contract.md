---
schema_version: 1
feature: Mã giao diện của app hết hex thô ngoài thư mục vendor — màu bản đồ dời sang app/src/lib, mặt nạ quét dùng black, giữ đúng từng giá trị màu
slug: don-hex-tho
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-29T08:52:00Z
design_doc: docs/superpowers/specs/2026-10-29-don-hex-tho-design.md
---

# Acceptance Contract: don-hex-tho

## Context

Căn cứ: lời Mạnh 29/10 «xếp hàng dọn hex thô trước khi nối floor» và «đổi phạm vi don-hex-tho còn ~15 chỗ của app,
không đụng vendor/logo» (ý định `y-dinh-design-floor.md` mục 1 của đợt dot0-cam-mau). Đo trên main `3936e3d0` bằng
`RE_HEX` của `design-floor-s4.mjs` (acceptance-gate 2.35.0): 15 chỗ hex thô ở 5 tệp giao diện ngoài
`components/{ui,reui,blocks,examples}`. MapLibre không đọc biến CSS/oklch nên màu bản đồ phải là hex — vòng dời chúng
ra khỏi vùng giao diện (`design.surface_globs`) chứ không đổi sang token.

## Criteria

- AC-1: Given mọi tệp `.ts`/`.tsx`/`.css` dưới `app/src/app/**` và `app/src/components/**` trừ
  `components/{ui,reui,blocks,examples}/**`, When quét bằng regex `RE_HEX` của design-floor S4, Then không còn chỗ nào.
  Đối chứng dương trên mã thật: cùng phép quét chạy trên năm tệp ở `3936e3d0` báo đúng 15 chỗ (tệp:dòng:giá trị) của
  danh sách đo sẵn, gồm `#000` ba chữ số; và regex của test trùng nguồn `RE_HEX` của kit khi máy có kit 2.35.0.
- AC-2: Given bảng 14 màu bản đồ dưới đây (viết trước, đo trên `3936e3d0`), When nạp `app/src/lib/map-colors.ts`, Then
  mỗi tên mang đúng giá trị của bảng (14 assert trên giá trị lúc chạy).

  | Vai | Tên ở lib | Hex | Nguồn trên 3936e3d0 |
  |---|---|---|---|
  | bậc 1 | `BIN_COLORS[0]` | `#bedbff` | `finder/bins.ts:9` |
  | bậc 2 | `BIN_COLORS[1]` | `#51a2ff` | `finder/bins.ts:9` |
  | bậc 3 | `BIN_COLORS[2]` | `#1447e6` | `finder/bins.ts:9` |
  | bậc 4 | `BIN_COLORS[3]` | `#1c398e` | `finder/bins.ts:9` |
  | ô chưa có số, nền sáng | `NO_DATA_COLOR` | `#e2e8f0` | `finder/bins.ts:10` |
  | ô chưa có số, nền tối | `NO_DATA_COLOR_DARK` | `#3f3f46` | `finder/bins.ts:12` |
  | viền khu vực, nền sáng | `AREA_LINE.light` | `#ffffff` | `finder/choropleth-map.tsx:121` |
  | viền khu vực, nền tối | `AREA_LINE.dark` | `#0a0a0a` | `finder/choropleth-map.tsx:121` |
  | nhãn giá — mực | `LISTING_PIN.ink` | `#18181b` | `listing/listings-map.tsx:22` |
  | nhãn giá — nền | `LISTING_PIN.paper` | `#ffffff` | `listing/listings-map.tsx:23` |
  | nhãn giá — viền | `LISTING_PIN.edge` | `#d4d4d8` | `listing/listings-map.tsx:24` |
  | mini-map — phường đang xem | `MINI_MAP.active` | `#2563eb` | `mini-map.tsx:72` |
  | mini-map — phường khác | `MINI_MAP.idle` | `#93c5fd` | `mini-map.tsx:72` |
  | mini-map — viền | `MINI_MAP.line` | `#1e3a8a` | `mini-map.tsx:83` |

- AC-3: Given bốn tệp giao diện dùng màu bản đồ, When đọc tệp sau vòng, Then bảy neo chỗ dùng (viết trước, phủ đủ 14
  giá trị) mỗi neo trỏ đúng tên vai: `bins.ts` tái xuất `BIN_COLORS`, `NO_DATA_COLOR`, `NO_DATA_COLOR_DARK` từ
  `@/lib/map-colors`; choropleth `"line-color": isDark ? AREA_LINE.dark : AREA_LINE.light`; listings-map `INK`, `PAPER`,
  `EDGE` gán từ `LISTING_PIN.ink/.paper/.edge`; mini-map tô `MINI_MAP.active` cho phường đang xem, `MINI_MAP.idle` cho
  phường khác, viền `MINI_MAP.line`. Đảo một cặp đối nghịch ở bất kỳ tệp nào thì đỏ, ghim neo bị đảo.
- AC-4: Given mặt nạ quét của Sankey dòng chảy (`ops/data-flow/flow-journey.tsx`), When dựng, Then chuỗi mặt nạ là
  `linear-gradient(to right, black 48%, transparent 52%)` — cùng alpha với `#000`, hình vẽ không đổi.
- AC-5: Given `MAP_FILES` trong `app/eslint.config.mjs`, When đọc, Then danh sách đúng bằng
  `[src/lib/map-style.ts, src/lib/map-colors.ts]`, và danh sách đóng «Hex chỉ được dùng trong file bản đồ» của
  `.claude/skills/onehub-ui/SKILL.md` khớp đúng `MAP_FILES`.
- AC-6: Given bộ selftest của plugin eslint onehub-ui, When chạy, Then hex ở `src/lib/map-colors.ts` không bị
  `no-hardcoded-color` báo, cùng mã ở tệp giao diện thường vẫn bị báo (đối chứng), và mọi ca cũ xanh.
- AC-7: Given app sau vòng, When typecheck + lint và design gate trên năm tệp giao diện đã sửa, Then 0 lỗi, design gate
  không P0.
- AC-8: Given các commit của vòng (không gộp, từ `3936e3d0`, chạm tệp riêng của vòng: `_acceptance/don-hex-tho/**`,
  `scripts/don-hex-tho.test.mjs`, `app/src/lib/map-colors.ts`), When liệt tệp mỗi commit đổi, Then không tệp nào dưới
  `app/src/components/{ui,reui,blocks,examples}/**`; commit sau vòng chỉ chạm vendor không bị tính; thiếu ref
  `3936e3d0` thì đỏ có thông điệp, không bỏ qua.

## Coverage

Bỏ quét không gian tiêu chí — xem sổ quyết định dòng «bỏ coverage-scan»: không gian là danh sách đóng 15 chỗ đo sẵn,
mỗi chỗ thuộc đúng một tiêu chí (14 giá trị bản đồ ở AC-2/AC-3, một mặt nạ ở AC-4); AC-1 quét toàn vùng để bắt chỗ sót.

## Out of scope

- OOS-1: Hex trong thư mục vendor (`components/ui/**` gồm logo `ui/svgs`, `reui/**`, `blocks/**`, `examples/**`) — mã
  cài sẵn, luật ReUI cấm sửa; hàng `noi-design-floor` loại vendor khỏi vùng giao diện bằng danh sách dương.
- OOS-2: Nối `executors.design.floor` và đổi `design.surface_globs` — hàng `noi-design-floor` (sau hàng này).
- OOS-3: Đổi màu bản đồ sang token hay bảng màu mới — MapLibre không đọc biến CSS; giá trị giữ nguyên.
- OOS-4: `rgb()`/`hsl()`/`oklch()` thô — sàn M1 chỉ chấm hex.
