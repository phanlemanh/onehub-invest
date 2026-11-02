---
schema_version: 1
feature: guard-edits lấy gốc theo kho chứa tệp — luật chặn sửa migration đã commit chạy cả khi tệp ở worktree khác
slug: guard-edits-goc-theo-tep
owner: phanlemanh@gmail.com
risk_tier: T3      # .claude/hooks/** nằm trong t3_paths
surfaces: [config]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-03
design_doc: docs/superpowers/specs/2026-11-03-guard-edits-goc-theo-tep-design.md
---

# Acceptance Contract: guard-edits-goc-theo-tep

## Context

`.claude/hooks/guard-edits.sh` lấy gốc từ `CLAUDE_PROJECT_DIR`, nên khi tệp nằm ở worktree khác, luật chặn sửa migration đã commit (AGENTS.md luật #2) không chạy. Kho có nhiều phiên song song ở `.claude/worktrees/` nên đây là lỗ thật của rào máy, không phải ca hiếm.

Source input: prompt — việc giao từ phiên giám sát, Mạnh bấm mở phiên và bấm dựng hồ sơ T3; PR #281. Code và selftest đã có trên PR trước hồ sơ này (Hỏi-3 ở Cổng Phạm vi); chiều đỏ được AC-6 đo lại.

## Criteria

- AC-1: Given phiên có `CLAUDE_PROJECT_DIR` là worktree A, When sửa một migration đã commit nằm ở worktree anh em hoặc worktree lồng trong `A/.claude/worktrees/` (qua `file_path` hoặc `notebook_path`, có hay không có `CLAUDE_PROJECT_DIR`), Then hook exit 2 kèm câu luật migration, và thông điệp nêu đường tương đối theo worktree chứa tệp.
- AC-2: Given đường tệp đi qua symlink tới worktree (như `~/dev/one-invest`), When sửa migration đã commit, Then hook exit 2 kèm câu luật migration.
- AC-3: Given migration chỉ commit ở HEAD của worktree B, When sửa nó ở B, Then exit 2; When sửa tệp cùng tên ở A mà HEAD của A không có, Then exit 0.
- AC-4: Given các tệp không thuộc diện chặn, When sửa migration mới chưa commit ở worktree khác, tệp ngoài mọi kho git, hoặc tệp trong thư mục chưa tồn tại ngoài `db/migrations`, Then exit 0.
- AC-5: Given các rào đã có, When sửa migration đã commit trong chính worktree của phiên, snapshot hoặc `.airdna-profile` ở worktree khác, hoặc snapshot trong thư mục chưa tồn tại ở worktree của phiên hay worktree anh em, Then vẫn exit 2 kèm câu của đúng luật.
- AC-6: Given một worktree tạm, When chạy selftest trên bản hook lành, trên bản trước khi sửa (`610a924a`) và trên chín đột biến (`pwd -L` · xét HEAD của phiên · chặn mọi migration · bỏ đường cũ · bỏ `notebook_path` · thông điệp đường tuyệt đối · bỏ luật snapshot · bỏ luật `.airdna-profile` · sai thông điệp snapshot), Then bản lành PASS, còn bản cũ và mỗi đột biến đỏ đúng ca đã ghim bằng tên.
- AC-7: Given nhánh so với merge-base của `origin/main`, When liệt kê tệp đổi, Then chỉ có hook, selftest, hồ sơ này, `_acceptance/config.yaml`, tệp máy sinh và design/plan; `.claude/hooks/typecheck-changed.sh` không đổi.
- AC-8: Given selftest chạy trên kho dùng chung có nhiều phiên, When selftest kết thúc, kể cả khi đỏ, Then không còn worktree hay ref tạm trong `git worktree list`, cây làm việc thật không đổi, và selftest cùng đầu dò của vòng không gọi lệnh prune của git.
- AC-9: Given kho git khác có `db/migrations/*.sql` đã commit và thư mục `snapshots/`, When sửa hai loại tệp đó từ phiên của kho này, Then hook exit 2 (hành vi đã trình ở Hỏi-4: migration là mới so với bản cũ, snapshot đã vậy từ trước); đổi quyết định thì ca này đỏ.

## Coverage

- Bỏ coverage-scan — câu giao nêu đích danh một hook với một bảng `case` ba luật (dòng `descope` trong sổ).
- Trục đã soát bằng tay: chỗ của tệp (worktree phiên · anh em · lồng · symlink · thư mục chưa có · ngoài git) → AC-1, AC-2, AC-4, AC-5, AC-9. Trạng thái commit (HEAD cả hai · chỉ HEAD kia · chưa commit) → AC-1, AC-3, AC-4. Luật (migration · snapshot · `.airdna-profile`) → AC-1, AC-5. Khoá đầu vào (`file_path` · `notebook_path`) và biến môi trường (có · không) → AC-1.
- Ô chưa phủ, đã ghi ở Out of scope: thư mục `db/migrations` bị xoá ở worktree khác (Hỏi-2).

## Out of scope

- Phân biệt kho khác bằng `git-common-dir` — trong `~/dev` chỉ kho này có `db/migrations` đã commit (Hỏi-4 ở Cổng Phạm vi).
- Vá điểm mù của `typecheck-changed.sh`: hook Stop không biết phiên đã sửa tệp nào (Hỏi-1 ở Cổng Phạm vi).
- Chặn khi cả thư mục `db/migrations` đã bị xoá ở worktree khác rồi ghi lại tên cũ — đi đường cũ theo phiếu giao (Hỏi-2 ở Cổng Phạm vi).
- Đưa selftest vào CI; chặn sửa migration bằng Bash (`sed`, `mv`) — hook này chỉ canh công cụ Edit/Write.

## Notes

- Hook chạy theo bản trong `CLAUDE_PROJECT_DIR`, nên phiên ở worktree cũ chỉ có bản sửa sau khi hợp `main`.
