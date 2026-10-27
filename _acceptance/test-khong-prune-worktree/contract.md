---
schema_version: 1
feature: test gỡ đúng worktree tạm của mình — bỏ git worktree prune trên kho dùng chung (zalo-import-job-lan.test.mjs và selftest hook typecheck-changed)
slug: test-khong-prune-worktree
owner: phanlemanh@gmail.com
risk_tier: T3      # gộp selftest hook .claude/hooks/** (t3_paths) — Hỏi-1 gộp, Mạnh duyệt ở Cổng Phạm vi 2026-10-27
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-10-27
design_doc: docs/superpowers/specs/2026-10-27-test-khong-prune-worktree-design.md
---

# Acceptance Contract: test-khong-prune-worktree

## Context

Căn cứ: hàng `test-khong-prune-worktree` của đợt dieu-phoi-dot0-cam-mau (P4, giám sát thêm 25/10 ~09:40Z): worktree P3 bị
gỡ ~09:35Z chưa rõ nguyên nhân; `scripts/zalo-import-job-lan.test.mjs` dòng 47 chạy `git worktree prune` trên kho dùng chung
khi gỡ worktree tạm lỗi. Prune gỡ metadata của MỌI worktree có thư mục đang vắng — kể cả của phiên khác. Soát toàn kho
thấy chỗ thứ hai: `cleanup()` của `.claude/hooks/tests/typecheck-changed.selftest.sh` prune kho dùng chung MỖI lần chạy
(eval `ui_hook_selftest` của hồ sơ đã ký `ui-standards-reui`, nên chạy ở mọi lượt ghim lại hồ sơ đó).

## Criteria

- AC-1: Given mọi tệp mã đang theo dõi của kho (`.mjs/.js/.cjs/.ts/.tsx/.sh/.py`), When soát lời gọi `worktree prune` ở
  dạng chuỗi lệnh lẫn mảng đối số, Then không còn chỗ nào (trừ đầu dò của chính hồ sơ này); đối chứng dương: bộ soát bắt được
  cả hai dạng trên tệp mẫu.
- AC-2: Given kho git tạm có worktree «của mình» (nằm dưới một đường symlink — đường dựng khác đường thật git ghi) và
  worktree «của phiên khác» với thư mục đang vắng, When `boWorktree` gỡ worktree của mình — ma trận kho {kho chính, worktree
  liên kết (`.git` là tệp)} × gỡ {lỗi thật: worktree bị `git worktree lock`, `remove --force` trả mã ≠ 0; thành công}, Then
  worktree của mình hết khỏi metadata và metadata của worktree kia còn nguyên ở cả 4 ô; ca lỗi in mã `remove` thật để chứng
  nhánh dự phòng đã chạy. Bản sao hàm thay khối giữa dấu mốc `>>> du-phong`/`<<< du-phong` bằng `worktree prune` làm ca đỏ
  với thông điệp ghim «worktree của phiên khác bị gỡ metadata».
- AC-3: Given kho thật, When chạy `node --test scripts/zalo-import-job-lan.test.mjs`, Then 4/4 ca xanh như trước; tệp import
  `boWorktree` từ `./lib/bo-worktree.mjs`, gọi nó ở ≥2 chỗ (`after()` và `finally` của ZL-AC-1) và không còn gọi thẳng
  `"worktree", "remove"`; worktree tạm `zalo-lan-*` MỚI sinh trong lượt (tập sau trừ tập trước) bằng rỗng — chỉ đo phần chênh
  của lượt này vì kho dùng chung có thể có lượt chạy khác cùng lúc. Đối chứng dương: bộ đếm bắt được một worktree mẫu.
- AC-4: Given nhánh so với merge-base của origin/main, When liệt kê tệp đổi, Then chỉ có `scripts/lib/bo-worktree.mjs`,
  `scripts/bo-worktree.test.mjs`, `scripts/zalo-import-job-lan.test.mjs`, `.claude/hooks/tests/typecheck-changed.selftest.sh`,
  hồ sơ này, `_acceptance/config.yaml`, tệp máy sinh, design/plan và dòng ghim lại của hồ sơ bị chạm
  (`zalo-import-so-phan-nap-khong-do-gia`, `ui-standards-reui`); không tệp làn ZCode nào đổi, `typecheck-changed.sh` không đổi.
- AC-5: Given cùng ma trận của AC-2 (kho chính/worktree liên kết × lock/thành công, đường symlink), When chạy hàm `cleanup()`
  của `typecheck-changed.selftest.sh` (rút nguyên văn từ tệp), Then worktree tạm hết và metadata của worktree kia còn nguyên
  ở cả 4 ô; bản sao `cleanup()` thay khối dự phòng giữa dấu mốc bằng `worktree prune` làm ca đỏ với thông điệp ghim. Selftest
  vẫn xanh trọn (2 bước hook như trước).

## Coverage

- Bỏ coverage-scan (dòng sổ descope) — câu giao nêu đích danh một chỗ prune; trục «chỗ prune khác» do AC-1 soát toàn kho
  (đã bắt chỗ thứ hai → AC-5). Trục: không còn prune (AC-1), gỡ đúng một worktree — hàm Node (AC-2) và hàm bash của selftest
  (AC-5), không đổi hành vi + không rác (AC-3), phạm vi (AC-4).

## Out of scope

- Đổi `zalo-import-job-lan.test.mjs` sang `git clone` tạm thay worktree — đổi cách mô phỏng của hồ sơ đã ký, không làm.
- Truy nguyên nhân worktree P3 bị gỡ 25/10 — hàng này chặn một nguồn rủi ro đã thấy, không điều tra sự cố.
- Rào máy (hook) chặn `git worktree prune` trong mọi phiên — cơ chế mới, chưa có số đo; không làm.

## Notes
