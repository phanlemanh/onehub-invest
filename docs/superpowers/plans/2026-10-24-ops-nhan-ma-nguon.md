# Kế hoạch — ops-nhan-ma-nguon (ON7, T3)

Hợp đồng: `_acceptance/ops-nhan-ma-nguon/contract.md` (Cổng Phạm vi duyệt 24/10; Hỏi-1 = đo giá trị, giữ khoá). Design:
`docs/superpowers/specs/2026-10-24-ops-nhan-ma-nguon-design.md`. Năm task, tuần tự — thước trước, vật sau.

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| (chưa thấy gì — thước đứng trước) Bộ kiểm cổng biết chỗ nào trong Ops còn tên thật | `scripts/lib/tier-a-source-names.mjs`, `scripts/check-portal-compliance.mjs`, ma trận + test | AC-3 |
| Dòng log cuối của job hiện mã thay tên; mất DB thì dòng trống | hai bộ che (pipeline + app) + bảng ca | AC-7 |
| Trang Thu thập, Chất lượng dữ liệu chỉ hiện «S0x · vai trò»; kênh S03 đứt dẫn sang Nguồn dữ liệu | `lib/source-labels.ts`, 9 component, 2 trang, `CONTEXT.md` | AC-1, AC-2, AC-6, AC-8 |
| Bảng job (local và cloud) không còn tên thật trong nhãn, id, dòng log | `pipeline/push-ops-facts.mjs`, `lib/collections-queries.ts` | AC-4, AC-5 |
| Thước đo đầu ra thật: HTML trang, bản tin máy thu | `app/tests/…`, `pipeline/scripts/…` | AC-1, AC-2, AC-4, AC-5, AC-6 |

## Task 1 — thước tĩnh + ma trận viết trước

- Files: `scripts/lib/tier-a-source-names.mjs` (rút `code, real_name` từ `INSERT INTO source_registry` trong
  `db/migrations/*.sql`; biến thể tên: đủ, từ đầu khi ≥ 4 ký tự, bỏ dấu, viết liền), `scripts/check-portal-compliance.mjs`
  (mục mới: quét chữ hiển thị bằng TypeScript AST mượn `app/node_modules/typescript` — JsxText, giá trị thuộc tính JSX,
  chuỗi/template trong `{…}` của JSX, giá trị thuộc tính đối tượng có khoá hiển thị; báo mã + tệp:dòng, không in tên),
  `scripts/fixtures/ops-tier-a-matrix.json` (dựng từ cây gốc 460e61a TRƯỚC khi sửa component, soát tay từng dòng là chữ
  hiển thị), `scripts/ops-nhan-ma-nguon.test.mjs` (ma trận trên tệp cây gốc · ba chiều đỏ · cây lành).
- Verify: `node --test scripts/ops-nhan-ma-nguon.test.mjs` xanh; `node scripts/check-portal-compliance.mjs` ĐỎ ở mục
  mới (vật chưa sửa — đúng chiều đỏ). `independent: false`. Phục vụ E3, E3b.

## Task 2 — bộ che dòng log

- Files: `pipeline/lib/mask-source-names.mjs`, `app/src/lib/mask-source-names.ts` (chỉ cú pháp kiểu xoá được — Node 24
  nạp thẳng), `pipeline/scripts/mask-source-names.cases.json`, phần AC-7 của `pipeline/scripts/ops-nhan-ma-nguon.test.mjs`
  (chạy hai bản trên cùng bảng; danh sách rỗng → `null`).
- Verify: `cd pipeline && npm test` xanh; phá thử: bỏ ranh giới từ ở một bản → ca «tên ba ký tự giữa từ» đỏ.
  `independent: false`. Phục vụ E7.

## Task 3 — nhãn nguồn trên UI

- Files: `app/src/lib/source-labels.ts` (`sourceLabel`, `getSourceRoles`), `components/ops/collections-tables.tsx`,
  `collections/{attention-list,collections-tiles,collections-view,pipe-panels,sync-activity}.tsx`, `quality-tables.tsx`,
  `design/catalog-samples.tsx`, `app/ops/{collections,quality}/page.tsx` (đọc vai trò, truyền xuống), `CONTEXT.md`
  (thuật ngữ «Nhãn nguồn»). Đọc skill `reui` + `onehub-ui` trước khi sửa; chỉ đổi chuỗi + một liên kết `next/link`.
- Verify: `cd app && npx tsc --noEmit && npm run lint`; `node scripts/check-portal-compliance.mjs` xanh. `independent: false`.
  Phục vụ E1, E2, E3, E6, E8.

## Task 4 — nhãn, id, dòng log của job

- Files: `pipeline/push-ops-facts.mjs` (`ONEINVEST_ROOT ?? ROOT`; id `s02-daily`/`s01-weekly`/`s01-smoke`; nhãn qua mã +
  vai trò từ `source_registry` cùng client; `lastLine` qua bộ che), `app/src/lib/collections-queries.ts`
  (`readSchedulerStatus` nhánh local: cùng id/nhãn, bộ che, DB lỗi → `lastLine: null`).
- Verify: `node --check pipeline/push-ops-facts.mjs`; `cd app && npx tsc --noEmit`. `independent: false`. Phục vụ E4, E5.

## Task 5 — thước đầu ra thật

- Files: `app/tests/ops-nhan-ma-nguon.test.tsx` (AC-1 hai lượt render + neo + chiều đỏ; AC-2 `/ops/quality` DB local và
  `/ops/collections` cloud dùng payload do `push-ops-facts` thật đẩy trong ca; AC-5 cây log tạm + DB lành/DB chết; AC-6 ba
  môi trường), `pipeline/scripts/ops-nhan-ma-nguon.test.mjs` (AC-4: bước thật + máy chủ thu, quét mọi giá trị trừ hai đường
  miễn, hai chiều đỏ trên bản sao).
- Verify: `cd app && npm test`, `cd pipeline && npm test`, `node --test scripts/*.test.mjs`, `node
  scripts/check-portal-compliance.mjs` cùng xanh; phá thử mỗi ca mới một lần. `independent: false`.

Tài liệu (ROADMAP §2.2 một dòng) đi cùng Task 5.
