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
cộng các chỗ tự vẽ tay lint không bắt. Theo chỉ đạo của Mạnh (2026-10-23), B1 đưa cổng Ops sang
shell riêng chuyển thể từ `app-shell-36` và dựng các trang từ block Solutions của ReUI
(`solution-dev-ops-5/-6/-1`, `solution-ai-ops-2`, `solution-agents-5`) theo bảng 2b của design;
trang không có block khớp giữ `InsightGrid`/`StatTiles`. Không đổi dữ liệu, query hay API. Kèm hai
sửa nhỏ của luật lint đã hoãn từ Phần A.

Source input: `docs/superpowers/specs/2026-10-22-ui-ux-standards-design.md` mục 5 B1 ·
`docs/superpowers/plans/2026-10-22-ui-standards-reui.md` Phần B · chỉ đạo Mạnh 2026-10-23 (block
Solutions dev-ops / ai-ops + app-shell) · design `docs/superpowers/specs/2026-10-23-ui-clean-b1-ops-design.md`.

Phạm vi file: `app/src/app/ops/**` trừ `ops/deals/**`; `app/src/components/ops/**`;
`app/src/components/shell/ops-shell/**` (mới) + mục `ops` của `app/src/components/shell/nav.tsx`;
`app/eslint-plugin-onehub-ui/rules/{no-raw-controls,no-native-dialogs}.mjs` + test. Không sửa
component dùng chung với cổng Invest (`PortalShell`, `InsightGrid`, `PageHeader`, `StatTiles`).

## Criteria

- AC-1: Given nhánh B1, When chạy `npx eslint . --prune-suppressions` rồi đọc `app/eslint-suppressions.json`, Then không còn khoá nào thuộc phạm vi file của đợt, không file nào trong phạm vi có `eslint-disable` cho luật `onehub-ui/*`, và `npx tsc --noEmit && npm run lint` của `app/` exit 0.
- AC-2: Given các file trong phạm vi, When quét mẫu tự vẽ tay mà lint không bắt (div/span/li/section mang cả `rounded-*` lẫn `border`, ký tự ✓ ✗ ❌ ✅ ⏸ ↻ × ✕ làm icon trong JSX), Then không còn mẫu nào.
- AC-3: Given người dùng Ops đã đăng nhập, When mở bất kỳ trang `/ops/**`, Then trang nằm trong shell Ops (chuyển thể `app-shell-36`) có sidebar chia nhóm liệt kê đủ Tổng quan, Thu thập, Chất lượng dữ liệu, Hàng chờ duyệt, Căn giá tốt, Nguồn dữ liệu, Thư viện thiết kế; trang Invest vẫn nằm trong shell cũ (`app-shell-30`) không đổi; và hai dòng chặn quyền của `ops/layout.tsx` giữ nguyên.
- AC-4: Given 6 trang `/ops`, `/ops/collections`, `/ops/quality`, `/ops/review`, `/ops/sources`, `/ops/design`, When đọc JSX trả về của từng `page.tsx`, Then phần tử con đầu tiên của gốc là `PageHeader`, trang không tự viết `<h1>`, và `/ops/collections` không còn `<section>` nằm trong khối tiêu đề.
- AC-5: Given bảng 2b của design, When đọc mã của từng trang, Then mỗi trang dựng từ đúng block đã chọn (file chuyển thể ghi dòng `chuyển thể từ @reui/<block>` và catalog có dòng tương ứng), phần bỏ khỏi block đúng như cột "Phần bỏ"; mọi bảng còn lại đi qua `InsightGrid`; không có `<table>`, `import "@/components/ui/table"` hay `useTable` tự dựng ngoài bản chuyển thể block hoặc `InsightGrid`.
- AC-6: Given `/ops/sources`, When người dùng bấm xoá một nhóm thu hoặc gỡ một tài khoản Zalo, Then một `AlertDialog` hiện tiêu đề + hậu quả (kèm số bài sẽ xoá khi nhóm có bài) và bấm "Huỷ" đóng hộp mà không gửi request; và trong `components/ops/*` không còn chữ thông báo kết quả nào render từ state — mọi kết quả thao tác đi qua `toast` của sonner (ngoại lệ duy nhất: lỗi tải nhóm Zalo hiện inline trong `Alert` kèm "Thử lại").
- AC-7: Given danh sách lời gọi API chụp từ code trước khi sửa (`scripts/ui-standards/b1-api-snapshot.json`), When trích lại từ code sau khi sửa, Then từng chức năng gọi đúng tập endpoint + method + khoá body như trước (không mất, không thêm; đối chiếu theo endpoint vì code có thể dời sang tệp chuyển thể block).
- AC-8: Given plugin lint `onehub-ui`, When lint `<input type="hidden" …/>`, một `confirm(...)` mà `confirm` là biến/hàm khai báo cục bộ, `<input type="text"/>`, `window.confirm(...)` và `confirm(...)` toàn cục, Then hai mẫu đầu không bị báo còn ba mẫu sau vẫn bị báo đúng luật (`no-raw-controls`, `no-native-dialogs`), và `npm run test:lint-rules` exit 0.
- AC-9: Given `/ops/design`, When mở trang, Then trang dùng PageHeader + khung Frame, trưng bày bản mẫu sống cho từng dòng của bảng "Một loại UI, một cách làm" cùng Badge trạng thái và bảng các block Solutions đã chọn (tên, trang dùng, link xem trước), không import từ `components/examples/` và không còn chữ thuật ngữ dev ("skill", "reui", ".claude", "Gallery").
- AC-10: Given app chạy ở :3456 với phiên đăng nhập Ops và chữ tầng A đã che (`mask-tier-a.js`), When chụp 6 trang ở sáng, tối và bề rộng 390px, Then mỗi trang có đúng một `h1` (trong PageHeader ở đầu vùng nội dung), sidebar Ops thu thành menu ở 390px, không cuộn ngang trang, không chữ/khối đè nhau hay mất tương phản ở tối, và không ảnh nào chứa tên nguồn thật hay tên nhóm Zalo.
- AC-11: Given đợt đã dọn, When chạy `npm run lint:ui-report`, Then `docs/research/ui-baseline-2026-10.md` có bảng "sau B1" khớp số máy đếm (thư mục `app/ops` và `components/ops` = 0), `catalog.md` có dòng cho shell Ops và từng block ở bảng 2b (kèm ngoại lệ G4 có tên) và các primitive mới, `routes.md` cập nhật archetype/họ khung 6 dòng Ops và không còn ghi "(chưa có, B1)".
- AC-12: Given các vùng B1 viết lại, When đọc mã của chúng, Then: nút quyết định ở hàng chờ duyệt bị `disabled` trong lúc gửi; bật/tắt nhóm thu hay nhóm Zalo lỗi thì công tắc quay về giá trị cũ và gọi `toast.error`; bảng nhóm Zalo có Skeleton lúc tải và `Alert` lỗi kèm nút "Thử lại" gọi lại việc tải; tạo nhóm thu chặn gửi khi thiếu URL/key hoặc tên; mọi `Switch` và nút chỉ có icon có `aria-label`; mọi ô tầng A mang `data-tier-a`.

## Coverage

Bỏ quét morphological-scan — xem entry `descope` "bỏ coverage-scan" trong `decisions.jsonl`.
Ma trận đóng **trang × việc** lấy từ spec mục 5 B1 + chỉ đạo 2026-10-23 (mỗi ô trỏ AC đo nó):

| Việc | /ops | collections | quality | review | sources | design | AC |
|---|---|---|---|---|---|---|---|
| Shell Ops riêng + nav nhóm (có Hàng chờ duyệt) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | AC-3, AC-10 |
| Trang dựng từ block Solutions đã chọn | ✓ dev-ops-5 | ✓ dev-ops-6/-1 | — giữ grid | ✓ agents-5 | ✓ ai-ops-2/dev-ops-6 | bảng block | AC-5 |
| Bảng tay → data-grid (block hoặc InsightGrid) | ✓ | ✓ | ✓ | — | ✓ | ✓ mẫu | AC-1, AC-5 |
| Điều khiển thô → primitive | — | — | — | ✓ | ✓ | — | AC-1 |
| `confirm` → AlertDialog | — | — | — | — | ✓ ✓ | — | AC-6 |
| `setMsg` → sonner | — | — | — | ✓ | ✓ ✓ | — | AC-6 |
| Badge tự tô → variant | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | AC-1, AC-2 |
| PageHeader đầu trang | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | AC-4, AC-10 |
| Lỗi bố cục (h1 giữa trang / section lồng) | — | ✓ | ✓ | — | — | — | AC-4, AC-10 |
| Trang trưng bày danh mục | — | — | — | — | — | ✓ | AC-9 |
| API giữ nguyên | — | — | — | ✓ | ✓ | — | AC-7 |
| Ba chế độ nhìn (đã che tầng A) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | AC-10 |
| Trạng thái vùng viết lại + a11y nhãn | — | — | — | ✓ | ✓ | — | AC-12 |
| Hai sửa luật lint | (plugin) | | | | | | AC-8 |
| Số đo sau + danh mục + bản đồ route | (tài liệu) | | | | | | AC-11 |

## Out of scope

- `/ops/deals` (trang tự thân; vẫn có mục trong nav Ops mới), `/dau-tu`, `investment-simulator.tsx` — đợt B5.
- Trạng thái tải/trống/lỗi ĐẦY ĐỦ cho mọi vùng dữ liệu (`<Suspense>` + Skeleton đúng bố cục, `Empty` kèm hành động cho mọi bảng) — đợt B4; B1 chỉ làm trạng thái ở vùng nó thay mới.
- Sửa `PageHeader`/`StatTiles`/`PortalShell` tự thân, hay chuyển cổng Invest sang shell khác — đợt B2 / không làm.
- Đổi query, API, quyền truy cập (`canAccessOps`, `isAdmin`) hay dữ liệu hiển thị; đổi style/brand.
- Tính năng mẫu của block không có dữ liệu hay đường ghi thật (biểu đồ đốt ngân sách SLO, 20 lần chạy gần nhất, bộ sửa lịch cron, ghim trang, xoay khoá, export CSV) — bỏ khỏi bản chuyển thể, không làm giả.

## Notes

- Thứ tự: `components/ops/review-card.tsx` và `app/ops/review/page.tsx` làm sau cùng, chờ nhánh `feat/enrich-qua-de-xuat` vào main rồi merge main vào nhánh B1 (enrich sửa review-card và thêm `app/tests/review-card.test.tsx`). Tiêu chí không đổi; phần Duyệt tin chỉ chấm được sau mốc đó.
- Bước nhìn (AC-10) cần phiên đăng nhập `/ops` (Hỏi-3).
- Cài block Pro cần `REUI_LICENSE_KEY` trong `app/.env.local` của worktree này (Hỏi-6); thiếu thì S3 dừng ở bước cài.
- Ảnh chụp LUÔN che chữ tầng A (tên nguồn thật, tên nhóm Zalo, nội dung tin) bằng `scripts/ui-standards/mask-tier-a.js` trước khi chụp (E12, E13, E14). Nếu ở Hỏi-1 Mạnh chọn chụp nguyên trạng thì sửa E12–E14 và dòng này trước khi duyệt Cổng Phạm vi.
- Không bấm nút xác nhận xoá/gỡ trong lúc kiểm (AC-6 chỉ kiểm đường Huỷ): xoá là thao tác khó đảo trên DB local dùng chung.
