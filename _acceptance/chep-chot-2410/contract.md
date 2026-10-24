---
schema_version: 1
feature: Tài liệu và đánh dấu của kho khớp các chốt 23–24/10 (tên nhóm S03 tầng C, luật S08, luật phép đo Zalo, ROADMAP V9)
slug: chep-chot-2410
owner: phanlemanh@gmail.com
risk_tier: T1      # chép quyết định đã chốt: tài liệu + bỏ một thuộc tính đánh dấu ở hai ô; không đổi dữ liệu, quyền hay luồng
surfaces: [docs, ui]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR cắt lượt là người chốt
lo_trinh_ma: ON1
---

# Acceptance Contract: chep-chot-2410

## Context

Căn cứ: docs/plan/pham-vi-ops-noi-that-2410.md OPS-6, QD1, YC2, YC9b, YC10; quyết định Mạnh 24/10 Câu 1 (tên nhóm là
tầng C) và Câu 2 (tên nguồn thật giữ tầng A).

Hàng T1 của lượt cắt `ops-noi-that-2410`, giao ngay trong PR cắt lượt vì chỉ chép quyết định đã chốt. Hồ sơ này có mặt
vì PR chạm hai tệp trong `app/` và một tệp trong `scripts/` (ngoài `t1_skip_globs`); T1 nằm ngoài các luật của cổng
trước-merge — người gộp PR là người chốt.

## Criteria

- AC-1: Given ADR-0007, When đọc mục «Sửa đổi 2026-10-24», Then ghi tên nhóm S03 là tầng C, tên nguồn thật vẫn tầng A, tên tài khoản thu chưa chốt.
- AC-2: Given AGENTS.md luật 6 và ROADMAP §3, When đọc, Then có câu chốt 24/10 khớp AC-1 (ROADMAP §3 mục 14).
- AC-3: Given `app/src/components/ops/collections-tables.tsx` và `app/src/components/ops/sources/zalo-groups-grid.tsx`, When `git grep -n data-tier-a` hai tệp, Then 0 dòng thuộc tính (chỉ còn chú thích); các ô tầng A khác (registry, source-groups, zalo-accounts) vẫn còn dấu.
- AC-4: Given `scripts/ui-standards/tier-a-names.mjs`, When đọc danh sách che, Then không còn `stg_zalo_posts.group_name`; `source_registry.real_name` và `source_groups` vẫn còn.
- AC-5: Given `.claude/rules/zalo-safety.md`, When đọc, Then có luật «phép đo không gọi phương thức ghi trên route zalo/openclaw — thử ghi chỉ với openclaw giả».
- AC-6: Given AGENTS.md (cạnh luật 5), ROADMAP §3 mục 15 và `.claude/rules/pii-spl.md`, When đọc, Then có luật S08 chỉ đọc, ≤ 1 lần/tuần, chỉ nội bộ, không tái xuất lên cổng công khai, không tên miền thật trong kho.
- AC-7: Given ROADMAP V9, When đọc, Then ghi project Vercel cũ đã xoá 24/10 (cherry-pick 572882d); `cd app && npx tsc --noEmit` xanh.

## Out of scope

- Đổi payload `push-ops-facts.mjs` hay bộ soát tầng A (NT2) — quyết định chỉ nới, không đòi sửa dữ liệu.
- Tên tài khoản thu (chưa chốt) — giữ `data-tier-a` ở `zalo-accounts.tsx`.
- Tiêu đề chuẩn hoá và mô tả nhóm — hàng ON19–ON21.
