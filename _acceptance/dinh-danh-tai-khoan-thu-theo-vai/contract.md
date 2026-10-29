---
schema_version: 1
feature: Người xem và bearer chung không nhận định danh tài khoản thu hay mã nhóm Zalo ở bề mặt Thu thập; mã nhóm không lên cloud
slug: dinh-danh-tai-khoan-thu-theo-vai
owner: phanlemanh@gmail.com
risk_tier: T3      # máy suy: app/src/lib/ops-access.ts, pipeline/push-ops-facts.mjs (t3_paths)
surfaces: [ui, api]
status: verified
approved_by: Mạnh
approved_at: 2026-10-29
design_doc: docs/superpowers/specs/2026-10-29-dinh-danh-tai-khoan-thu-theo-vai-design.md
---

# Acceptance Contract: dinh-danh-tai-khoan-thu-theo-vai

## Context

`GET /api/v1/ops/collections` (quyền `ops.read`: phiên từ vai Người xem trở lên hoặc bearer chung) và trang
`/ops/collections` trả mã tài khoản thu, hồ sơ, mã nhóm Zalo đang bật và tài khoản giữ nhóm cho mọi người gọi; bản tin
máy thu đưa mã nhóm theo từng tài khoản lên cloud. Luật 6 (AGENTS.md, ADR-0007): định danh tài khoản thu không rời máy.
Vòng này che các trường ấy với Người xem và bearer, và thôi đưa mã nhóm lên cloud. Nguồn: Hỏi-1 Cổng Phạm vi
`viewer-khong-thay-the-duyet`.

## Acceptance criteria

- AC-1: Given bảng bảy kiểu người gọi viết trước (user, viewer, ops, admin, owner, email `OPS_EMAILS` với role user,
  bearer chung không phiên), When hỏi `xemDinhDanhThu`, Then đúng ở ops, admin, owner, `OPS_EMAILS` và sai ở user,
  viewer, bearer.
- AC-2: Given bộ dữ liệu Thu thập có hai tài khoản (mã, hồ sơ, nhóm bật), ba mã nhóm trong danh sách cho phép và nhóm
  có tài khoản giữ, When `cheDinhDanhThu` che bộ ấy, Then mỗi tài khoản còn đúng một phần tử với `accountId`, `name`,
  `profile` null, `enabledGroups` rỗng và `soNhomBat` bằng số nhóm bật gốc; danh sách cho phép giữ số phần tử với
  `groupId` null; mọi `ownerAccount` null; chuỗi JSON kết quả không chứa mã nào đã cấy.
- AC-3: Given cùng bộ dữ liệu ở máy thu, When gọi `GET /api/v1/ops/collections` lần lượt bằng bảy kiểu người gọi của
  AC-1, Then mã tài khoản, mã nhóm và tài khoản giữ nhóm có mặt trong phản hồi đúng ở bốn kiểu thấy được và vắng ở
  user… viewer và bearer (user bị từ chối như hôm nay); số phần tử `zaloAccounts`, `zaloAllowlist` bằng nhau giữa người
  thấy và người bị che. (cross-layer)
- AC-4: Given chế độ cloud (`VERCEL=1`) với bản tin có `zaloAccounts` mang mã nhóm, When gọi API bằng viewer, bearer
  và ops, Then viewer và bearer nhận bản đã che, ops nhận mã tài khoản. (cross-layer)
- AC-5: Given trang `/ops/collections` ở máy thu, When dựng cho vai viewer, Then dữ liệu trao cho thành phần client
  không chứa mã nhóm hay tài khoản giữ nhóm, cột tài khoản giữ nhóm hiện «—», và chú thích danh sách cho phép ghi số
  nhóm bật kèm «mã nhóm chỉ hiện cho vai Vận hành trở lên.»; với vai ops trang hiện như hôm nay (đuôi mã nhóm, tài khoản
  giữ nhóm); ở chế độ cloud, dữ liệu trao client cho viewer cũng không chứa mã tài khoản, hồ sơ hay mã nhóm.
- AC-6: Given cấu hình tài khoản có nhóm bật, When `push-ops-facts` dựng bản tin, Then mỗi `zaloAccounts[i]` có
  `enabledGroups` rỗng và `soNhomBat` bằng số nhóm bật; bản sao gửi mã nhóm trong `zaloAccounts[i].enabledGroups` bị bộ
  soát chặn với dòng nêu `zaloAccounts[<i>].enabledGroups`. (theo Hỏi-1 = A)
- AC-7: Given trang `/ops/sources` ở chế độ cloud với bản tin mới (`enabledGroups` rỗng, `soNhomBat` = n), When dựng
  danh sách tài khoản, Then nhãn hiện «n nhóm bật» đúng số, không «0 nhóm bật».
- AC-8: Given cây sau sửa, When chạy bộ test app và bộ test pipeline, Then tất cả xanh (gồm test cũ của Thu thập, bộ
  soát tầng A, tài khoản thu trên `/ops/sources`).
- AC-9: Given tài khoản thử vai viewer và admin trên DB local và app dev chạy từ worktree, When mở `/ops/collections`,
  Then màn viewer có cột tài khoản giữ nhóm toàn «—» và câu chú thích mã nhóm, không đuôi mã nhóm nào; màn admin hiện
  đuôi mã nhóm và tài khoản giữ nhóm. (cross-layer)

## Coverage

- Trục A — kiểu người gọi: user | viewer | ops | admin | owner | `OPS_EMAILS` | bearer chung [thước CE: `QUYEN_OPS` +
  `BAC_VAI` ở `ops-access.ts`; ma trận AC-1, AC-3]
- Trục B — bề mặt: hàm che (AC-2) | API máy thu (AC-3) | API cloud (AC-4) | trang máy thu (AC-5, AC-9) | trang cloud (AC-5) | bản tin cloud
  (AC-6) | trang `/ops/sources` cloud đọc số mới (AC-7) [thước CE: khảo sát trong design doc]
- Trục C — trường: `accountId` | `profile` | `name` | `enabledGroups` | `zaloAllowlist[].groupId` | `ownerAccount`
  [thước CE: kiểu `LocalFacts`, `ZaloAllowlistEntry`, `ZaloGroupRow` ở `collections-queries.ts`]
- Cắt ngang: giữ số phần tử cho người đếm bằng bearer (`audit-all.sh`, AC-3); không hồi quy (AC-8).

## Out of scope

- Tên tài khoản thu (đã chốt tầng A ở hồ sơ `soat-tang-a-moi-duong-len-cloud`).
- Route ghi `POST /api/v1/ops/zalo/*` và trang `/ops/sources` (chỉ admin) ngoài nhãn số nhóm của AC-7.
- Đổi bậc quyền `ops.read` hay quyền bearer của route khác.

## Đường đo

- «0 chỗ Người xem hay bearer đọc được định danh» ← ma trận AC-3 (API máy thu), AC-4 (API cloud), AC-5 (trang), AC-6
  (bản tin) — số từ test app/pipeline; AC-9 cho mắt người.

## Notes

- Mã tài khoản là bí danh cấu hình, không phải định danh thật (kiểm cục bộ 29/10, không in giá trị).
