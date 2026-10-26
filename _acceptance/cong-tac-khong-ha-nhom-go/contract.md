---
schema_version: 1
feature: Công tắc bật/tắt nhóm thu ở /ops/sources không hạ nhóm đã gỡ hay đã xong về tạm dừng, không hồi sinh chúng qua tắt rồi bật, và không đổi nhóm nháp thành tạm dừng khi tắt
slug: cong-tac-khong-ha-nhom-go
owner: phanlemanh@gmail.com
risk_tier: T3      # máy suy: app/src/app/api/v1/ops/** (t3_paths)
surfaces: [api]
status: draft
design_doc: docs/superpowers/specs/2026-10-26-cong-tac-khong-ha-nhom-go-design.md
approved_by:
approved_at:
---

# Acceptance Contract: cong-tac-khong-ha-nhom-go

## Context

Hai mục ngoài hợp đồng của TV2a `vong-doi-nguon` (Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng): công tắc của route
`source-groups` ghi `paused` khi tắt bất kể trạng thái cũ, nên tắt rồi bật hồi sinh được nhóm `retired`/`completed`, và
tắt nhóm `draft` đổi nó thành `paused`. Vòng này cho công tắc theo đúng ma trận 5 × 2 mà TV2a đã khai cho đường ghi cũ.

Source input: `_acceptance/cong-tac-khong-ha-nhom-go/opportunity.md`.

## Criteria

- AC-1: Given lược đồ ở khuôn sau 047 + 048 có một nhóm S05 cho mỗi trạng thái (active, paused, draft, retired, completed), When gọi route thật (Bearer) action `toggle` với `enabled` true và false trên từng nhóm (lược đồ dựng lại cho mỗi ô), Then mười ô cho đúng bảng của design doc: trạng thái, lý do, `resume_when`, `enabled`, `updated_at` và số dòng `ops_audit` như bảng khai; ô `unchanged` và ô 409 không ghi dòng nào.
- AC-2: Given một nhóm `retired` (và một nhóm `completed`), When gửi tắt rồi bật, và khi gửi tắt và bật đồng thời, Then nhóm vẫn ở trạng thái cũ, `enabled` false, 0 dòng audit mới. (cross-layer)
- AC-3: Given tắt hay bật một nhóm `retired`/`completed`, When route trả 409, Then thân `{error}` nêu đúng trạng thái: «nhóm đã gỡ …» cho `retired`, «nhóm đã xong …» cho `completed`.
- AC-4: Given cùng năm trạng thái, When ghi bằng đường cũ (UPDATE chỉ đổi `enabled`) và bằng route trên hai lược đồ song song, Then trạng thái cuối của mỗi ô bằng nhau; ô đường cũ ném lỗi tương ứng ô route trả 409.

## Coverage

Quét bằng morphological-scan, preset test-matrix:
- Trục A — trạng thái cũ: active | paused | draft | retired | completed [thước CE: CHECK `source_groups_status_chk` của 047]
- Trục B — hành động: bật | tắt [thước CE: thân action `toggle`]
- Trục C — đường ghi: route mới | đường cũ (UPDATE enabled) [thước CE: design TV2a §ma trận 5 × 2]
- Trục D — nhịp: một lệnh | hai lệnh nối tiếp | hai lệnh đồng thời [thước CE: mục ngoài hợp đồng TV2a «kể cả bấm nhanh hai lần»]
- Cắt ngang: không ghi audit ở ô không đổi; chữ lỗi nêu đúng trạng thái.

## Out of scope

- Chặn ở tầng DB việc đổi `retired`→`paused` qua đường đổi `status` (migration, lệnh TV5/TV6 cần đường này).
- Nhãn «Đã gỡ», «Nháp» trên lưới nhóm thu (giao diện vòng đời, PL12 Ngoài-5 / ON20).
- Công tắc nhóm S03 (TV6).

## Notes

- Giao diện không đổi: lưới nhóm thu đã hoàn công tắc và hiện chữ lỗi máy chủ khi route trả 4xx.
