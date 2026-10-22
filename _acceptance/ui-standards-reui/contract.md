---
schema_version: 1
feature: Bộ chuẩn UI/UX ReUI — Phần A (setup: skill + MCP ReUI, skill onehub-ui, lint chặn tự vẽ tay, cắm vào kit)
slug: ui-standards-reui
owner: phanlemanh@gmail.com
risk_tier: T3      # đụng .claude/hooks/** (t3_paths)
surfaces: [config, ci, docs]
status: draft
approved_by:
approved_at:
---

# Acceptance Contract: ui-standards-reui

## Context

UI của `app/` đang lệch nhau và có chỗ tự vẽ tay. Mạnh chốt: dựa hẳn vào luật chính chủ
ReUI; thành công = không còn tự vẽ tay, chọn đúng block/component. Phần A dựng **máy và
luật**: skill + MCP ReUI (vendor), skill mỏng `onehub-ui`, plugin lint `onehub-ui` có
baseline chỉ-giảm, hook Stop + CI, cắm `onehub-ui` vào hai ổ cắm của kit. Phần B (dọn)
đi sau, mỗi đợt một vòng riêng.

Tiêu chí lấy từ kế hoạch đã duyệt TRƯỚC khi thi công (plan Task 9 Step 2 + Review Focus),
không viết theo code đã có.

Source input: `docs/superpowers/specs/2026-10-22-ui-ux-standards-design.md` ·
`docs/superpowers/plans/2026-10-22-ui-standards-reui.md`

## Criteria

- AC-1: Given repo đã cài installer ReUI, When đọc `.mcp.json` và các file cấu hình agent do installer sinh, Then có server `reui` trỏ `https://mcp.reui.io/api/mcp` và KHÔNG file nào đã commit chứa header `Authorization`, `reui_pat_` hay giá trị `REUI_LICENSE_KEY`.
- AC-2: Given Mạnh đã bỏ entry `reui` phạm vi local và đăng nhập OAuth cho entry dự án, When chạy `claude mcp list` từ gốc repo, Then `reui` ở phạm vi dự án báo Connected.
- AC-3: Given cấu hình lint của `app/`, When lint một file feature mới trong `src/` chứa từng mẫu tự vẽ tay của bảng Task 3 (bảng tay, điều khiển thô, hộp thoại native, màu palette thô cho trạng thái/không cặp dark:, hex cứng, `text-[Npx]`, motion cấm, `asChild`, emoji làm icon, ngoại lệ thiếu lý do), Then mỗi mẫu bị báo đúng luật `onehub-ui/*` tương ứng.
- AC-4: Given cùng cấu hình, When lint mã tuân chuẩn (Badge variant, cặp `text-violet-600 dark:text-violet-400`, `duration-200`, `render` prop, ngoại lệ có lý do) và When lint hex trong một file thuộc danh sách bản đồ, Then KHÔNG có báo cáo `onehub-ui/*` nào (riêng file bản đồ: hex không bị báo nhưng `<table>` vẫn bị báo); và các thư mục vendor `ui/ reui/ blocks/ examples/` không chịu luật `onehub-ui`.
- AC-5: Given baseline `app/eslint-suppressions.json`, When nhánh hiện tại chạy `npm run lint`, Then exit 0; và When một vi phạm mới xuất hiện ở file đã có mục suppress, Then lint đỏ; và When số đếm của một luật trong baseline tăng so với base, Then `check-baseline-growth` exit 1 (đổi tên file giữ nguyên số đếm thì exit 0).
- AC-6: Given hook Stop `.claude/hooks/typecheck-changed.sh`, When agent kết thúc lượt với một file UI vừa đổi chứa vi phạm `onehub-ui`, Then hook exit 2 và in tên luật; When file đó sạch, Then hook exit 0.
- AC-7: Given skill `onehub-ui`, When so `routes.md` với mọi `page.tsx` dưới `app/src/app`, Then hai tập khớp nhau (thiếu hoặc thừa một route thì test đỏ).
- AC-8: Given `_acceptance/config.yaml`, When bộ đọc config của kit giải `feature_loop.ui_standards_skill` và `design_pass.ds_skill`, Then cả hai trả `onehub-ui` và `.claude/skills/onehub-ui/SKILL.md` tồn tại với `name: onehub-ui`.
- AC-9: Given repo sau Phần A, When đọc `AGENTS.md`, `app/CLAUDE.md`, `app/DESIGN_RULES.md`, `.claude/rules/ui.md`, Then mỗi file trỏ tới `onehub-ui` (và AGENTS.md có đúng một khối `reui-agent-rules`), và `invest-portal-ia.md` §3.3 không còn dặn `loading.tsx` cấp segment.
- AC-10: Given `docs/research/ui-baseline-2026-10.md`, When chạy lại `npm run lint:ui-report`, Then tổng vi phạm báo cáo bằng tổng số đếm trong `eslint-suppressions.json` và bằng con số ghi trong tài liệu (số đo "trước" của case study).

## Coverage

- Bỏ coverage-scan — tiêu chí lấy nguyên từ kế hoạch đã duyệt (Task 9 Step 2 + 5 dòng Review Focus); không mở rộng phạm vi.

## Out of scope

- Dọn vi phạm hiện có (Phần B, B1–B5): baseline 138 vi phạm còn nguyên là đúng ý ở Phần A.
- `tools/sync-public.sh`, `tools/public-overlay/**` và chuyện license repo public — Mạnh quyết sau.
- Đổi màu thương hiệu / style (`base-nova`, `--primary` neutral giữ nguyên).
- Kiểm thị giác giao diện (ui-check): Phần A không đổi giao diện người dùng, trừ một dòng chữ con trỏ trên `/ops/design` (B1 dọn trang này).
- Nhánh `fix/portal-deals-airdna`: chỉ ghi quy trình tích hợp ở ROADMAP Track 6, không merge ở đây.

## Notes

- AC-2 cần Mạnh làm tay trước khi verify: `claude mcp remove reui -s local` rồi `claude mcp login reui`.
- Các phép thử AC-3/4/6 chạy trên bản tạm (ESLint `lintText`, worktree tạm) — không sửa cây làm việc.
