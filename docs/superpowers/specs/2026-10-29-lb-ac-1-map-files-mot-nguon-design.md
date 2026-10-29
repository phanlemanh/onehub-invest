# lb-ac-1-map-files-mot-nguon — danh sách tệp bản đồ chỉ ghim chữ một chỗ

Ngày: 2026-10-29 · Dãy U1 · Hạng T2 · Hồ sơ `_acceptance/lb-ac-1-map-files-mot-nguon/`

## Vì sao

Ngoài-8 của `don-hex-tho` (Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 29/10): test LB-AC-1 của hồ sơ
`listings-filters-store-locator` (`app/tests/listings-browse.test.tsx`) ghim cứng chữ danh sách `MAP_FILES` của
`app/eslint.config.mjs`. Vòng `don-hex-tho` rút danh sách từ 5 xuống 2 tệp thì LB-AC-1 đỏ, phải sửa tay. Cùng danh sách
còn ghim ở DHT-AC-5 (`scripts/don-hex-tho.test.mjs`) và ở danh sách đóng của `.claude/skills/onehub-ui/SKILL.md`. Mỗi lần
đổi danh sách tệp bản đồ là ba chỗ phải sửa đồng bộ.

## Cách làm

- **Module chung** `scripts/lib/map-files-mong.mjs` (ESM thuần, không phụ thuộc) export danh sách viết trước — chỗ ghim
  chữ duy nhất. Không phải tệp test (import tệp *.test.mjs chạy luôn các ca của nó), không suy từ `eslint.config.mjs`
  (phép so sẽ thành hằng đúng).
- **LB-AC-1** import module, giữ nguyên vế «đúng trọn danh sách viết trước» và thêm vế `src/components/ui/map.tsx` (bản
  cài mapcn) không được miễn hex. Phần đọc gói thành `kiemMapFiles(eslintSrc, mong)` để ca đột biến gọi được.
- **DHT-AC-5** import module; phép kiểm gói thành `kiemDanhSachBanDo(eslintSrc, skillSrc)` dùng chung cho ca thật và
  ca đột biến.
- **Ca mới LBM-AC-2** ở `scripts/don-hex-tho.test.mjs`: `git ls-files '*.test.*'` dưới `app/` cộng `scripts/*.test.mjs`
  (gồm test của plugin lint), tìm mảng chữ chứa từ hai phần tử của danh sách bất kể kiểu nháy — 0 tệp. Gốc kho suy từ
  `import.meta.url`.

Không đụng: hồ sơ đã ký `listings-filters-store-locator` (chữ `expected` của eval LB-AC-1 vẫn nói «5 tệp» — OOS-1),
`eslint.config.mjs`, `SKILL.md` (OOS-2). Gap-probe 1 P0 + 3 P1 + 1 P2 đã sửa (gap-probe.md).

## Đặc tả UX

Không có — vòng chỉ đổi test, người dùng không thấy gì khác.
