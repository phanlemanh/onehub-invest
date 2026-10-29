---
schema_version: 1
feature: Danh sách tệp bản đồ được dùng hex (MAP_FILES) viết trước chỉ ghim chữ ở một module chung; LB-AC-1 và DHT-AC-5 cùng đọc nó
slug: lb-ac-1-map-files-mot-nguon
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [tooling]
status: approved
veto_state: mo
veto_opened_at: 2026-10-29T10:12:26Z
design_doc: docs/superpowers/specs/2026-10-29-lb-ac-1-map-files-mot-nguon-design.md
---

# Acceptance Contract: lb-ac-1-map-files-mot-nguon

## Context

Căn cứ: Ngoài-8 của hồ sơ `don-hex-tho` — Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 29/10 (sổ
`_acceptance/don-hex-tho/decisions.jsonl`). LB-AC-1 (`app/tests/listings-browse.test.tsx`) và DHT-AC-5
(`scripts/don-hex-tho.test.mjs`) cùng ghim chữ danh sách `MAP_FILES`, nên mỗi lần đổi danh sách tệp bản đồ phải sửa cả hai.

## Criteria

- AC-1: Given module `scripts/lib/map-files-mong.mjs` export đúng danh sách viết trước, When chạy LB-AC-1, Then phần
  `MAP_FILES` kiểm danh sách của `app/eslint.config.mjs` bằng đúng trọn danh sách của module (vế «đúng trọn danh sách viết
  trước» của LB-AC-1 giữ nguyên) và không chứa `src/components/ui/map.tsx`; tệp LB-AC-1 không còn mảng chữ danh sách.
- AC-2: Given mọi tệp `*.test.*` dưới `app/` mà git theo dõi và `scripts/*.test.mjs`, When tìm mảng chữ chứa từ hai phần
  tử trở lên của danh sách module (bất kể nháy kép, nháy đơn hay backtick), Then không tệp nào khớp; bản sao chèn mảng
  chữ vào LB-AC-1 (nháy kép, nháy đơn, backtick) hay vào một tệp dưới `app/eslint-plugin-onehub-ui/tests/` → ca đỏ gọi
  đúng tên tệp.
- AC-3: Given hàm kiểm của DHT-AC-5 `kiemDanhSachBanDo(eslintSrc, skillSrc)` dùng cho cả ca thật lẫn ca đột biến, When
  chạy, Then bản thật không ném; bản sao thêm `src/lib/map-extra.ts` vào cả eslint lẫn `SKILL.md` mà module không đổi →
  hàm DHT-AC-5 và hàm LB-AC-1 cùng ném thông điệp có tên `map-extra.ts`; thêm cùng tệp vào cả module → hai hàm không ném.
- AC-4: Given app và scripts sau vòng, When chạy bộ test app và bộ test scripts, Then xanh.

## Coverage

Bỏ quét không gian tiêu chí — xem sổ quyết định dòng «bỏ coverage-scan»: một chiều (chỗ ghim danh sách); hai chỗ ghim
đã biết có tiêu chí (AC-1, AC-3), AC-2 quét mọi tệp test git theo dõi dưới `app/` và `scripts/` để bắt chỗ ghim khác.

## Out of scope

- OOS-1: Chữ `expected` của eval LB-AC-1 trong hồ sơ đã ký `listings-filters-store-locator` (`evals.yaml` vẫn nói «đúng
  trọn danh sách 5 tệp») — hồ sơ đã ký, ngoài vùng tệp; lệch con số có từ `don-hex-tho`, vế «đúng trọn danh sách» vẫn đo.
- OOS-2: Đổi `MAP_FILES` của `eslint.config.mjs` hay danh sách đóng của `SKILL.md` — vòng chỉ đổi chỗ test đọc danh sách
  viết trước.
