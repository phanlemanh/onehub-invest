# Kế hoạch — nhom-s03-tren-cloud (ON4, T3)

Hợp đồng: `_acceptance/nhom-s03-tren-cloud/contract.md` (Cổng Phạm vi duyệt 25/10; Hỏi-1 = A, Hỏi-2 = A). Design:
`docs/superpowers/specs/2026-10-25-nhom-s03-tren-cloud-design.md`. Nhánh `claude/nhom-s03-tren-cloud`, đã gộp main 259ff31
(có ON23 #83 và ON5 #85). Sáu task tuần tự — chung `pipeline/push-ops-facts.mjs`, `lib/collections-queries.ts`,
`collections-view.tsx`.

| Người trực thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| Cột «Vào bảng thô» trên bản tin đúng theo nhóm; nhóm qua cổng mà không biết số ghi «—» | `pipeline/lib/ops-flow.mjs`, `app/src/lib/collections-queries.ts`, `collections-tables.tsx` | AC-1, AC-6 |
| «Đang bật N nhóm» đúng ở máy thu (7 thay vì 4); badge «N nhóm bật» trang Nguồn trên máy chủ đếm cùng luật | `app/src/lib/zalo-admin.ts`, `collections-queries.ts`, `scripts/lib/ops-local.mjs`, `push-ops-facts.mjs` | AC-2, AC-6 (Hỏi-2) |
| (chưa thấy gì) Bản tin mang khối `s03`: N, số đếm từng nhóm, tên nhóm — không mã nhóm | `push-ops-facts.mjs`, `scripts/lib/ops-local.mjs`, `app/src/lib/ops-facts.ts`, `app/src/lib/ops-cloud.ts` | AC-3, AC-4, AC-5 (Hỏi-1) |
| Bảng nhóm S03 hiện trên máy chủ; cũ thì «Hoạt động» viền xám; chưa có khối thì ở lại Alert gom | `collections-tables.tsx`, `collections/collections-view.tsx`, `collections/collections-tiles.tsx` | AC-3, AC-4, AC-5, AC-7, AC-8 |
| Phép đo trên trang thật + bản bấm được | `app/tests/nhom-s03-tren-cloud.test.tsx`, `scripts/ops-cloud-proto.mjs`, test ON3 | AC-1…AC-6, AC-9 |
| Tài liệu | `docs/ops/runtime-map.md`, ROADMAP, `.claude/skills/onehub-ui/routes.md` | — |

## Task 1 — đếm «Vào bảng thô» theo nhóm

- Files: `pipeline/lib/ops-flow.mjs` `parseLog` — trên dòng `post 202` cộng `"accepted":n` vào hàng nhóm; nhóm có `post 202`
  mà không dòng nào mang `accepted` → `accepted: null` (cờ nội bộ `acceptedSeen`); funnel tổng không đổi luật.
  `app/src/lib/collections-queries.ts` `gateByGroup` — cùng luật null; `ZaloGroupRow.accepted: number | null`;
  `zaloExtras` của bên ghi giữ null (không `?? 0`). `collections-tables.tsx` — ô «Vào bảng thô» `null` → «—», sắp xếp
  null đứng cuối.
- Verify: `cd pipeline && npm test`; `cd app && npx tsc --noEmit && npm run lint`. `independent: false`.

## Task 2 — một định nghĩa «nhóm bật» (Hỏi-2 = A)

- Files: `app/src/lib/zalo-admin.ts` — tách hàm thuần `effectiveEnabledGroups(z)` → `{ byAccount: Map<id, string[]>, union:
  string[] }` từ `effectiveGroups` + `enabledKeys` có sẵn (không đổi `listZaloAccounts` ngoài việc gọi lại hàm chung).
  `collections-queries.ts` `readZaloAllowlist` — đọc `channels.zalouser`, trả mỗi mã trong `union` với `enabled: true`
  (giữ kiểu `ZaloAllowlistEntry`, chân bảng máy thu như cũ). `scripts/lib/ops-local.mjs` — `readS03Allowlist(cfg)` bản
  `.mjs` cùng luật (kế thừa cấp ngoài khi tài khoản không khai `groups`, `default` đọc `accounts.default.groups ?? groups`,
  bỏ `enabled:false`/`allow:false`, hợp + khử trùng). `push-ops-facts.mjs` — `zaloAccounts[].enabledGroups` lấy từ
  `byAccount` của hàm ấy (bỏ khối đếm tay hiện nay).
- Verify: như task 1. `independent: false`.

## Task 3 — khối `s03` (Hỏi-1 = A)

- Files: `push-ops-facts.mjs` — `s03Block = await measure(...)`: `{ allowlistEnabled: union.length, groups: zalo.groups.map(
  {name, seen, passed, skipped, accepted, realPosts7d, mockPosts7d, isMockOnly, lastSeenAt, lastEventAt}) }`; tên là mã
  nhóm (chuỗi số ≥ 15 chữ số, hay trùng một mã cấu hình bỏ tiền tố `group:`) → `name: null`; không `ownerAccount`; cấu hình
  không đọc được → khối lỗi `{measured_at, error}`. Thêm vào `blocks`. `app/src/lib/ops-facts.ts` — `OPS_FACT_BLOCKS` thêm
  `"s03"`. `app/src/lib/ops-cloud.ts` — `CloudOpsView.s03: { allowlistEnabled: number; groups: CloudS03Group[]; stale:
  boolean } | null` (khối vắng / lỗi / sai khuôn → null; trường đếm vắng hay không phải số → null cho ô ấy).
- Verify: như task 1 + `node pipeline/push-ops-facts.mjs --kho` sạch (bộ soát tầng A). `independent: false`.

## Task 4 — bảng nhóm S03 trên máy chủ

- Files: `collections-tables.tsx` `ZaloGroupsTable` — prop tuỳ chọn `cloud?: { allowlistEnabled: number; stale: boolean }`:
  mô tả dùng N của khối; chân bảng máy chủ ghi «mã nhóm chỉ xem ở máy thu» thay danh sách mã; `stale` → «Hoạt động» viền
  xám (`outline`); `name: null` → «Nhóm chưa có tên». `collections-view.tsx` `CloudCollections` — có `cloud.s03` → dựng
  `#nhom-s03` với hàng của khối; «nhóm S03» rời `MACHINE_ONLY_REGIONS` khi có khối (như cách ON5 làm với «Luồng 7 ngày»).
  `collections-tiles.tsx` — nút ô Cổng S03/nhóm trỏ `#nhom-s03` khi bảng có mặt. `page.tsx` truyền `cloud.s03`.
  Chữ mới thêm vào `tests/ops-nhan/visible-strings.ts` nếu bộ quét ON12 đòi.
- Verify: như task 1. Phục vụ AC-3…AC-5, AC-7, AC-8. `independent: false`.

## Task 5 — phép đo + bản bấm được

- Files: `app/tests/nhom-s03-tren-cloud.test.tsx` — ma trận viết trước của hợp đồng (nhật ký + cấu hình qua `captureOpsFacts
  ({ home, logs })`, HOME tạm); AC-1 gọi `parseLog` và `gateByGroup` (xuất cho test) trên cùng tệp; AC-2 khối `s03` +
  `zaloAccounts` của bản tin thật và `readZaloAllowlist` với HOME tạm; AC-3…AC-5 trang `/ops/collections` THẬT
  `VERCEL=1` qua handler ingest thật; khối lỗi bằng cấu hình hỏng ở HOME tạm (bên ghi thật); khối cũ bằng lùi
  `measured_at` của bản tin thật; AC-6 máy thu + bộ bắt truy vấn. Chiều đỏ: bản sao `ops-flow.mjs` / `ops-local.mjs` /
  component (`mutantChain` như ON3, tệp ẩn `.on4-mut-*`), mỗi bản sao cho đúng số sai ghi trong evals. Sửa test ON3/ON23/ON5
  chỗ hứa «nhóm S03 trỏ Alert» khi bản tin đã có khối `s03`. `scripts/ops-cloud-proto.mjs` — bản tin có khối `s03` với tên
  nhóm giả cho E9.
- Verify: `cd app && npm test`; `cd pipeline && npm test`; phá thử từng ca đỏ. Phục vụ AC-1…AC-6, AC-9. `independent: false`.

## Task 6 — tài liệu

- Files: `docs/ops/runtime-map.md` (bảng trang Ops trên máy chủ đọc gì: dòng nhóm S03, khối `s03`), `docs/adr/0014…`
  không sửa (khối mới theo đúng khuôn), ROADMAP một dòng, `.claude/skills/onehub-ui/routes.md`. `independent: true`, cuối.

## Rủi ro

- Phép đo không chạm `~/.openclaw`: mọi cấu hình và nhật ký ở HOME tạm của `captureOpsFacts`; không gọi lệnh ghi OpenClaw.
- Bản tin cũ (chưa có khối `s03`) trên máy chủ thật trong lúc chờ máy thu cập nhật → bảng không dựng, Alert gom như hôm nay.
