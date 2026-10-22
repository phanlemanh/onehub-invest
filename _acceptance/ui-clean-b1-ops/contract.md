---
schema_version: 1
feature: Bộ chuẩn UI/UX ReUI — đợt B1 (dọn cổng Ops tới khi không còn UI tự vẽ tay)
slug: ui-clean-b1-ops
owner: phanlemanh@gmail.com
risk_tier: T2      # không đụng t3_paths (ops-access/auth/api/v1/ops không sửa)
surfaces: [ui, config]
status: draft
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-23-ui-clean-b1-ops-design.md
---

# Acceptance Contract: ui-clean-b1-ops

## Context

Cổng Ops (`/ops/**`) là bề mặt lệch nhiều nhất: 60/138 mục baseline lint UI nằm ở 7 file của nó,
cộng các chỗ tự vẽ tay lint không bắt (panel `div` tự viền, chip tự viền, `setMsg("✓/❌")`,
`window.confirm`). Đợt B1 đưa 6 trang Ops và 5 component `components/ops/*` về đúng khuôn trong
danh mục `onehub-ui` (PageHeader, InsightGrid, StatTiles) và primitive ReUI, không đổi dữ liệu,
query hay API. Kèm hai sửa nhỏ của luật lint đã hoãn từ Phần A.

Source input: `docs/superpowers/specs/2026-10-22-ui-ux-standards-design.md` mục 5 B1 ·
`docs/superpowers/plans/2026-10-22-ui-standards-reui.md` Phần B · design
`docs/superpowers/specs/2026-10-23-ui-clean-b1-ops-design.md`.

Phạm vi file: `app/src/app/ops/**` trừ `ops/deals/**`; `app/src/components/ops/**`;
`app/eslint-plugin-onehub-ui/rules/{no-raw-controls,no-native-dialogs}.mjs` + test. Không sửa
component dùng chung với cổng Invest (`InsightGrid`, `PageHeader`, `StatTiles`).

## Criteria

- AC-1: Given nhánh B1, When chạy `npx eslint . --prune-suppressions` rồi đọc `app/eslint-suppressions.json`, Then không còn khoá nào thuộc phạm vi file của đợt, không file nào trong phạm vi có `eslint-disable` cho luật `onehub-ui/*`, và `npx tsc --noEmit && npm run lint` của `app/` exit 0.
- AC-2: Given các file trong phạm vi, When quét mẫu tự vẽ tay mà lint không bắt (div/span/li/section mang cả `rounded-*` lẫn `border`, state `msg`/`setMsg`, ký tự ✓ ✗ ❌ ✅ ⏸ ↻ × ✕ làm icon trong JSX), Then không còn mẫu nào.
- AC-3: Given 6 trang `/ops`, `/ops/collections`, `/ops/quality`, `/ops/review`, `/ops/sources`, `/ops/design`, When đọc JSX trả về của từng `page.tsx`, Then phần tử con đầu tiên của gốc là `PageHeader`, trang không tự viết `<h1>`, và `/ops/collections` không còn `<section>` nằm trong khối tiêu đề.
- AC-4: Given phạm vi file, When liệt kê cách dựng bảng và ô KPI, Then mọi bảng đi qua `InsightGrid` (không `<table>`, không import `ui/table` hay `reui/data-grid/data-grid` trực tiếp) và mọi hàng KPI đi qua `StatTiles` (không component ô số tự viết).
- AC-5: Given `/ops/sources`, When người dùng bấm xoá một nhóm thu hoặc gỡ một tài khoản Zalo, Then một `AlertDialog` hiện tiêu đề + hậu quả (kèm số bài sẽ xoá khi nhóm có bài) và bấm "Huỷ" đóng hộp mà không gửi request; và trong `components/ops/*` không còn chữ thông báo kết quả nào render từ state — mọi kết quả thao tác đi qua `toast` của sonner (ngoại lệ duy nhất: lỗi tải nhóm Zalo hiện inline trong `Alert` kèm "Thử lại").
- AC-6: Given danh sách lời gọi API chụp từ code trước khi sửa (`scripts/ui-standards/b1-api-snapshot.json`), When trích lại từ code sau khi sửa, Then từng file gọi đúng tập endpoint + method + khoá body như trước (không mất, không thêm).
- AC-7: Given plugin lint `onehub-ui`, When lint `<input type="hidden" …/>`, một `confirm(...)` mà `confirm` là biến/hàm khai báo cục bộ, `<input type="text"/>`, `window.confirm(...)` và `confirm(...)` toàn cục, Then hai mẫu đầu không bị báo còn ba mẫu sau vẫn bị báo đúng luật (`no-raw-controls`, `no-native-dialogs`), và `npm run test:lint-rules` exit 0.
- AC-8: Given `/ops/design`, When mở trang, Then trang dùng PageHeader + khung Frame, trưng bày bản mẫu sống cho từng dòng của bảng "Một loại UI, một cách làm" (ô KPI, bảng, page header, đang tải, lỗi, trống) cùng Badge trạng thái, không import từ `components/examples/` và không còn chữ thuật ngữ dev ("skill", "reui", ".claude", "Gallery").
- AC-9: Given app chạy ở :3456 với phiên đăng nhập Ops và chữ tầng A đã che (`mask-tier-a.js`), When chụp 6 trang ở sáng, tối và bề rộng 390px, Then mỗi trang có đúng một `h1` (nằm trong PageHeader ở đầu vùng nội dung), không cuộn ngang trang ở 390px, không có chỗ chữ/khối đè nhau hay mất tương phản ở chế độ tối, và không ảnh nào chứa tên nguồn thật hay tên nhóm Zalo.
- AC-10: Given đợt đã dọn, When chạy `npm run lint:ui-report`, Then `docs/research/ui-baseline-2026-10.md` có bảng "sau B1" khớp số máy đếm (thư mục `app/ops` và `components/ops` = 0), `catalog.md` có dòng cho các khuôn mới chọn (AlertDialog, Dialog form, Switch, `InsightGrid` mở rộng, OpsSection) và `routes.md` không còn ghi "(chưa có, B1)" ở 6 dòng Ops.
- AC-11: Given các vùng B1 viết lại, When đọc mã của chúng, Then: 3 nút duyệt bị `disabled` trong lúc gửi; bật/tắt nhóm thu lỗi thì Switch quay về giá trị cũ và gọi `toast.error`; hàng chờ duyệt rỗng render `Empty`; bảng nhóm Zalo có Skeleton lúc tải và `Alert` lỗi kèm nút "Thử lại" gọi lại việc tải; form thêm nhóm chặn gửi khi thiếu URL/key hoặc tên; mọi `Switch` và nút chỉ có icon có `aria-label`; mọi ô tầng A mang `data-tier-a`.

## Coverage

Bỏ quét morphological-scan — xem entry `descope` "bỏ coverage-scan" trong `decisions.jsonl`.
Thay vào đó là ma trận đóng **trang × việc** lấy từ spec mục 5 B1 (mỗi ô trỏ AC đo nó):

| Việc (spec B1) | /ops | collections | quality | review | sources | design | AC |
|---|---|---|---|---|---|---|---|
| Bảng tay → data-grid (InsightGrid) | ✓ | ✓ | ✓ | — | ✓ ✓ | ✓ mẫu | AC-1, AC-4 |
| Điều khiển thô → primitive | — | — | — | ✓ | ✓ | — | AC-1 |
| `confirm` → AlertDialog | — | — | — | — | ✓ ✓ | — | AC-5 |
| `setMsg` → sonner | — | — | — | ✓ | ✓ ✓ | — | AC-2, AC-5 |
| Badge tự tô → variant | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | AC-1, AC-2 |
| PageHeader + Frame | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | AC-3, AC-9 |
| Lỗi bố cục (h1 giữa trang / section lồng) | — | ✓ | ✓ | — | — | — | AC-3, AC-9 |
| Trang trưng bày danh mục | — | — | — | — | — | ✓ | AC-8 |
| API giữ nguyên | — | — | — | ✓ | ✓ | — | AC-6 |
| Ba chế độ nhìn (đã che tầng A) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | AC-9 |
| Trạng thái vùng viết lại + a11y nhãn | — | — | — | ✓ | ✓ | — | AC-11 |
| Hai sửa luật lint | (plugin) | | | | | | AC-7 |
| Số đo sau + danh mục | (tài liệu) | | | | | | AC-10 |

## Out of scope

- `/ops/deals`, `/dau-tu`, `investment-simulator.tsx`, `shell/nav.tsx` (đưa `/ops/review` vào nav) — đợt B5, sau khi `fix/portal-deals-airdna` merge.
- Trạng thái tải/trống/lỗi ĐẦY ĐỦ cho mọi vùng dữ liệu (`<Suspense>` + Skeleton đúng bố cục, `Empty` kèm hành động cho mọi bảng) — đợt B4; B1 chỉ làm trạng thái ở vùng nó thay mới.
- Sửa `PageHeader`/`StatTiles` tự thân (vd Badge `size="sm"` trong PageHeader) — đợt B2.
- Đổi query, API, quyền truy cập (`canAccessOps`, `isAdmin`) hay dữ liệu hiển thị; đổi style/brand.
- Chuẩn hoá số qua `lib/format.ts` ở các bảng đã sạch lint (`toFixed`, `toLocaleString` trong collections/quality-tables) — chỉ sửa ở file đợt này viết lại (review-card).

## Notes

- Bước nhìn (AC-9) cần phiên đăng nhập `/ops` trong Browser pane — PR #1 (`feat/dev-ops-account`) chưa merge (Hỏi-3).
- Ảnh chụp LUÔN che chữ tầng A (tên nguồn thật, tên nhóm Zalo, nội dung tin) bằng `scripts/ui-standards/mask-tier-a.js` trước khi chụp (E12, E13, E14). Nếu ở Hỏi-1 Mạnh chọn chụp nguyên trạng thì sửa E12–E14 và dòng này trước khi duyệt Cổng Phạm vi.
- Không bấm nút xác nhận xoá/gỡ trong lúc kiểm (AC-5 chỉ kiểm đường Huỷ): xoá là thao tác khó đảo trên DB local dùng chung.
