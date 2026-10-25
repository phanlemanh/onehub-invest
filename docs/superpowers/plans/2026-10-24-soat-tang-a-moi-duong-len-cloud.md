# Kế hoạch — soat-tang-a-moi-duong-len-cloud (NT2, T3)

Hợp đồng: `_acceptance/soat-tang-a-moi-duong-len-cloud/contract.md` (Cổng Phạm vi duyệt 24/10; Hỏi-1 = A, Hỏi-2 = A).
Design: `docs/superpowers/specs/2026-10-24-soat-tang-a-moi-duong-len-cloud-design.md`. Năm task, tuần tự.

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| (chưa thấy gì) Một bộ soát dùng chung cho mọi đường lên cloud | `pipeline/lib/tier-a-guard.mjs`, `sync-cloud.mjs` (`scanSourceNames`) | AC-6 |
| Bản tin vận hành còn tên thật thì không đi; log có dòng `FACTS CHẶN` | `pipeline/push-ops-facts.mjs` | AC-1…AC-5, AC-10 |
| Đồng bộ dừng khi cloud có cột ngoài danh sách hay dữ liệu người dùng app | `sync-cloud.mjs` (`leakGate`), `check-cloud-sync.mjs` ca `pii-cot` | AC-7 |
| Trang Nguồn dữ liệu trên cloud hiện mã tài khoản thay tên | component/trang `/ops/sources` | AC-9 |
| Người vận hành biết đọc dòng chặn | `docs/ops/runtime-map.md`, ROADMAP | AC-8 |

## Task 1 — bộ soát chung

- Files: `pipeline/lib/tier-a-guard.mjs` (`guardValues(value, entries, { exempt })` → `[{ path, code }]`, `entriesFromTokens`),
  `pipeline/sync-cloud.mjs` (`scanSourceNames` gọi lõi chung, giữ chữ ký và nhánh đóng chặt khi token rỗng),
  `pipeline/scripts/soat-tang-a.test.mjs` (AC-6: bảng ca ON7 qua hai đường; sync token rỗng dừng).
- Verify: `cd pipeline && npm test`; `check-cloud-sync.mjs pii`/`allow` vẫn xanh. Phá thử: lõi bỏ biến thể viết liền →
  ca AC-6 đỏ. `independent: false`.

## Task 2 — push-ops-facts qua bộ soát

- Files: `pipeline/push-ops-facts.mjs` (sau khi dựng payload: `guardValues` với `REG.names`, miễn `zaloGroups[i].name`;
  trúng hay danh sách rỗng → `FACTS CHẶN [tầng A] …`, `process.exitCode = 1`, không `fetch`; `zaloAccounts[i].name = null`;
  cờ `--kho` (chế độ khô: soát, in đường + mã, không gửi)), `pipeline/scripts/soat-tang-a.test.mjs` (AC-1…AC-5 qua
  `capture-ops-facts`, ma trận viết trước AC-3; AC-10 chạy `--kho` trên log/cấu hình thật).
- Verify: `cd pipeline && npm test`; phá thử mỗi ca. `independent: false`.

## Task 3 — leak gate soát cột và bảng tầng A

- Files: `pipeline/sync-cloud.mjs` (`leakGate`: cột cloud của ba bảng ⊆ `CLOUD_ALLOW`; `user_events`, `user_profile`,
  `review_queue` có dòng → đỏ), `pipeline/scripts/check-cloud-sync.mjs` (ca `pii-cot`: cloud sạch xanh · cột cấy trên cloud
  đỏ · cột qua bên ghi thật đỏ, cloud giữ số cũ · `user_events=1` đỏ).
- Verify: `cd pipeline && node scripts/check-cloud-sync.mjs pii-cot` + các ca cloud-sync cũ xanh. `independent: false`.

## Task 4 — ô tài khoản trên /ops/sources (cloud)

- Files: component tài khoản ở `app/src/components/ops/sources/`, `app/tests/soat-tang-a.test.tsx` (render cloud với
  `name: null` → mã tài khoản, không «null»; chiều đỏ).
- Verify: `cd app && npx tsc --noEmit && npm run lint && npm test`. `independent: false`.

## Task 5 — tài liệu

- Files: `docs/ops/runtime-map.md` (mục cloud-sync), `docs/ROADMAP.md` (một dòng). `independent: true`, làm cuối.
