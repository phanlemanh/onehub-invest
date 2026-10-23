---
schema_version: 1
feature: Dọn luật hỏi quyền rộng — rào push main chuyển sang branch protection GitHub như crm/kit
slug: narrow-ask-rules
owner: phanlemanh@gmail.com
risk_tier: T3      # .claude/settings.json nằm trong t3_paths
surfaces: [config, ci]
status: implemented
approved_by: Mạnh
approved_at: 2026-10-23
---

# Acceptance Contract: narrow-ask-rules

## Context

Mạnh bị hỏi quyền nhiều ở onehub-invest, gần như không bị hỏi ở crm-onehub và acceptance-gate-kit.
So cấu hình: chỉ kho này có `permissions.ask` (6 luật; `git push *`, `vercel *`, `npx vercel *` hỏi
cả ở chế độ bypass), và chỉ kho này KHÔNG bật branch protection cho nhánh chính — crm và kit giao rào
đó cho GitHub. Phát lại 7 ngày transcript: luật cũ hỏi 90 lần, phần lớn là push nhánh riêng và
vercel chỉ đọc. Thay đổi: bỏ ba luật ask rộng (giữ hai luật hiếm, khó đảo), để GitHub chặn push lên
`main`, và sửa những gì cần để branch protection chạy được (ui-lint chạy trên mọi PR; làn merge
dùng `gh pr merge`).

Source input: prompt — phiên điều phối giao (Mạnh đồng ý 2026-10-23); Mạnh chốt lại phạm vi trong
phiên này «Đồng ý» bỏ hook guard-push-deploy, đổi sang branch protection (decisions.jsonl).

## Criteria

- AC-1: Given `.claude/settings.json`, When đọc `permissions.ask`, Then danh sách đúng bằng `bash tools/sync-public.sh *`, `supabase db push *`, `npx supabase db push *` — không còn `git push *`, `vercel *`, `npx vercel *`.
- AC-2: Given `.claude/settings.json`, When đọc `permissions.deny`, Then đủ 9 luật như trước, kể cả `git push --force *` và `git push -f *`.
- AC-3: Given `.claude/settings.json` và `.claude/hooks/`, When đọc, Then hook chỉ còn `guard-edits.sh` (PreToolUse sửa tệp) và `typecheck-changed.sh` (Stop); không có hook xét push/vercel.
- AC-4: Given `.github/workflows/ui-lint.yml`, When một PR không chạm `app/` được mở, Then workflow vẫn chạy (không lọc `paths` ở `pull_request`) — để `ui-lint` làm check bắt buộc mà không treo PR.
- AC-5: Given `AGENTS.md`, When đọc vai điều phối làn merge, Then ghi rõ merge bằng `gh pr merge` và không merge trên máy rồi `git push` lên main.
- AC-6: Given bản sao cấu hình bị làm hỏng từng chỗ (thêm lại ask `git push *`, thêm lại ask `vercel *`, mất ask supabase, mất ask sync-public, mất deny `-f`, ui-lint lọc paths lại, AGENTS.md mất luật merge), When chạy thước đo tĩnh, Then thước đo đỏ với mọi bản.
- AC-7: Given repo `phanlemanh/onehub-invest` trên GitHub, When đọc branch protection của `main`, Then: bắt buộc qua PR, check bắt buộc gồm `gate` và `ui-lint`, admin không được vượt (`enforce_admins`), cấm force-push, cấm xoá nhánh.
- AC-8: Given bộ đánh giá protection, When đưa JSON thiếu từng mục ở AC-7 (hoặc «Branch not protected»), Then bộ đánh giá đỏ; JSON đủ thì xanh.

## Coverage

- Trục luật quyền: ask bỏ (AC-1) · ask giữ (AC-1) · deny giữ (AC-2) · hook (AC-3).
- Trục rào thay thế: GitHub protection từng mục — PR, check, admin, force, xoá (AC-7); bộ đánh giá phân biệt (AC-8).
- Trục để rào chạy được: check bắt buộc không treo PR (AC-4) · làn merge đi đường PR (AC-5).
- Trục thước đo: should-NOT-fire bằng đột biến (AC-6) và fixture (AC-8).
- Bỏ quét morphological đầy đủ: thay đổi là bỏ ba dòng cấu hình + một luật vận hành; trục lấy từ chính danh sách luật quyền và mục protection.

## Out of scope

- KHÔNG tự bật branch protection — đổi cài đặt GitHub là việc Mạnh tự bấm. AC-7 đỏ tới khi Mạnh bật; đó là chủ đích (cổng không cho merge khi rào GitHub chưa có).
- KHÔNG hỏi riêng lệnh Vercel ghi nữa (deploy, `env add`…): như crm/kit, chấp nhận theo quyết định Mạnh 2026-10-23; số đo 7 ngày chỉ có 8 lần, đều trong một phiên dựng prod.
- KHÔNG đổi luật deny, KHÔNG đổi hai luật ask giữ lại.
- KHÔNG đụng `settings.local.json` của checkout chính, KHÔNG đổi chế độ quyền của phiên (bypass/auto).
- KHÔNG đổi workflow `acceptance-gate.yml` (đã chạy trên mọi PR).

## Notes

- Bản đầu của hồ sơ (cùng PR) làm hook PreToolUse `guard-push-deploy` hỏi push main + vercel ghi. Mạnh đổi hướng sau khi so với crm/kit; hook và test của nó đã gỡ khỏi PR.
- Cài đặt đề xuất (Settings → Branches → rule `main`): Require a pull request before merging (0 approval — một người); Require status checks: `gate`, `ui-lint`; Do not allow bypassing the above settings; không tick Allow force pushes / Allow deletions.
- Thước đo: `scripts/check-ask-rules.sh static|mutation|protection|protection-selftest`.
