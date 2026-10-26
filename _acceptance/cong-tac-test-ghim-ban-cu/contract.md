---
schema_version: 1
feature: Ca thử công tắc nhóm thu đối chứng với bản route trước sửa đã ghim cố định trong kho, nên vẫn xanh sau khi PR #142 gộp
slug: cong-tac-test-ghim-ban-cu
owner: phanlemanh@gmail.com
risk_tier: T2      # máy suy: app/tests/** không thuộc t3_paths
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-10-26-cong-tac-test-ghim-ban-cu-design.md
approved_by:
approved_at:
---

# Acceptance Contract: cong-tac-test-ghim-ban-cu

## Context

Ca thử `app/tests/cong-tac-nhom-go.test.tsx` (#142) lấy bản route trước sửa bằng `git show origin/main:…` lúc chạy; sau
khi #142 gộp, CT-AC-1 và CT-AC-2 đỏ mãi và bộ test app của main đỏ. Vòng này ghim bản cũ thành fixture viết sẵn.

Source input: `_acceptance/cong-tac-test-ghim-ban-cu/opportunity.md`.

## Criteria

- AC-1: Given cây sau sửa, When đọc `app/tests/cong-tac-nhom-go.test.tsx` và fixture `app/tests/fixtures/source-groups-route.truoc-cong-tac.ts.txt`, Then ca thử không gọi git và không nhắc `origin/main` hay `merge-base`; sha256 fixture bằng sha256 của `git show 8fc9603d:app/src/app/api/v1/ops/source-groups/route.ts`.
- AC-2: Given một `git` giả đứng đầu PATH trả route MỚI cho mọi lệnh `git show` (mô phỏng «origin/main sau gộp»), When chạy ca thử công tắc, Then 5/5 ca xanh; đối chứng: bản ca thử TRƯỚC sửa (lấy từ đỉnh #142) chạy cùng PATH giả thì đỏ ở CT-AC-1 hoặc CT-AC-2.

## Coverage

bỏ coverage-scan — xem dòng sổ «bỏ coverage-scan» (một chiều: một phép đối chứng ghim sai chỗ).

## Out of scope

- Ngoài-2, Ngoài-5 của #142 (đã ghi Known limits ở hồ sơ ấy).
- Bộ quét kho bắt mọi test đọc ref nhánh lúc chạy.
- Dời bản chép tạm của route cũ ra khỏi `app/src` (đo: tsc bỏ qua tệp chấm-đầu ở mọi chỗ, eslint quét mọi chỗ — dời không giảm gì).

## Notes

- Vòng sửa tệp ca thử của hồ sơ `cong-tac-khong-ha-nhom-go` nên hồ sơ ấy được ghim lại cùng PR này (làn máy).
