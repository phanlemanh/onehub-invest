---
schema_version: 1
feature: Vùng giao diện của design-floor liệt kê dương (loại thư mục vendor), có test bắt thư mục sót, và sàn thiết kế S4 được nối
slug: noi-design-floor
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [tooling]
status: verified
veto_state: mo
veto_opened_at: 2026-10-29T10:44:14Z
design_doc: docs/superpowers/specs/2026-10-29-noi-design-floor-design.md
---

# Acceptance Contract: noi-design-floor

## Context

Căn cứ: ý định `y-dinh-design-floor.md` mục 2 của đợt dot0-cam-mau (lời Mạnh 29/10: «nối floor sau khi vùng giao diện trừ
được vendor»; «Áp như đề xuất» theo phanlemanh/acceptance-gate-kit#308). `design.surface_globs` hiện gồm 379 tệp vendor
trong 619 tệp; kit 2.35.0 chưa đọc được glob trừ, nên trừ bằng danh sách dương. `don-hex-tho` (#174) đã dọn hex thô
ngoài vendor.

## Criteria

- AC-1: Given `_acceptance/config.yaml` sau vòng, When đọc `design.surface_globs`, Then danh sách là `app/src/app/**`,
  `app/src/components/*.tsx` và đúng một dòng `app/src/components/<dir>/**` cho mỗi thư mục con không thuộc `VENDOR_DIRS`
  của `app/eslint.config.mjs` (hôm nay 13: auth, charts, compare, finder, insight, listing, marketing, ops, page, saved,
  shell, states, yield); không còn `app/src/components/**`.
- AC-2: Given cây thư mục thật (readdir, chỉ thư mục) dưới `app/src/components/`, When chạy `scripts/design-floor-vung.test.mjs`,
  Then mỗi thư mục nằm trong `surface_globs` hoặc `VENDOR_DIRS` và không thư mục nào ở cả hai; bản sao tạm (mkdtemp, có
  config, `eslint.config.mjs` và thư mục thật `moi-khong-khai/x.tsx`) chạy qua CÙNG hàm liệt kê → ca đỏ «thư mục chưa
  khai: moi-khong-khai»; bản sao thêm `app/src/components/ui/**` vào `surface_globs` → ca đỏ «vừa vùng giao diện vừa
  vendor: ui».
- AC-3: Given tệp git theo dõi, When khớp bằng `pathGlobToRe` NẠP TỪ KIT (`lib/evidence-core.cjs` qua `resolve-plugin.mjs`,
  đường không số), Then số tệp khớp `surface_globs` mới bằng số khớp hai glob cũ trừ số tệp git theo dõi dưới bốn thư mục
  vendor (đo hôm nay: 619 − 379 = 240), và quét `RE_HEX` của kit trên các tệp khớp ra 0 chỗ. Máy local không nạp được kit
  → ca đỏ có thông điệp ghim; CI (`CI=true`, không cài kit) → ca bỏ qua có lời.
- AC-4: Given `executors.design.floor` mới, When đọc và chạy, Then khoá gọi `design-floor-s4.mjs --root .` qua đường không
  số (có `${CLAUDE_PLUGIN_ROOT:-`, không có `/2.35.0/`) và thoát 0 trên cây vòng; `docBac` của kit trả `floor` khác rỗng; đối
  chứng đầu-cuối bằng `chayS4` của kit trên kho git tạm có config mới: thêm tệp có hex thô dưới `components/finder/` → có
  dòng «hex thô» gọi đúng tệp và mã chặn; cùng hex dưới `components/ui/` → không dòng nào; config không còn «CHƯA nối»
  hay «52/619».
- AC-5: Given cây sau vòng, When chạy bộ test scripts (`node --test scripts/*.test.mjs`), Then xanh.

## Coverage

Bỏ quét không gian tiêu chí — xem sổ quyết định dòng «bỏ coverage-scan»: không gian là danh sách thư mục con của
`app/src/components/` (đo bằng máy ở AC-2) và ba khoá cấu hình (AC-1, AC-4); AC-3 đối chiếu số tệp toàn vùng.

## Out of scope

- OOS-1: Bật bậc M2 (`design_floor.tokens`/`registry`) — sau mười vòng DO1 ở M1 (lời Mạnh qua phiên MBP).
- OOS-2: Sửa bộ đọc glob của kit để nhận `!`/`{a,b}` (K1) — việc của kit, gửi qua kênh kit.
- OOS-3: Đếm hay ghi vòng DO1 — bắt đầu sau khi hàng này gộp; vòng này không phải vòng DO1.
