@AGENTS.md

## Riêng cho Claude Code

- **Rào chắn máy** (`.claude/settings.json`): sửa `snapshots/`, `.airdna-profile/`, đọc
  `.env`/`*.har` bị deny; hook chặn sửa migration đã commit; hook kiểm TypeScript các file
  vừa đổi trước khi kết thúc lượt. Luật ask chỉ còn `supabase db push` và `sync-public`; `main`
  có branch protection trên GitHub (push thẳng bị từ chối — vào main chỉ qua `gh pr merge`).
  Bị chặn → đọc lý do, đừng tìm đường vòng.
- **Luật theo đường dẫn**: `.claude/rules/` (migration, cổng UI, PII/SPL, an toàn Zalo) tự
  nạp khi chạm file khớp.
- **Skills dự án**: `/verify` (kiểm module đã đổi) · `/new-migration` · `/ops-check`
  (sức khoẻ dữ liệu) · `/sync-public` (chỉ user gọi — đẩy ra repo public).
- Preview app: `.claude/launch.json` (Next.js :3456, data-api :3001).
- Ghi chú riêng máy này: `CLAUDE.local.md` (gitignored).
