# Kế hoạch — db-tu-khoi-dong (AU7)

Hợp đồng: `_acceptance/db-tu-khoi-dong/contract.md` (duyệt 23/10). Design:
`docs/superpowers/specs/2026-10-23-db-tu-khoi-dong-design.md`.

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| DB local tự chạy lại sau khi Docker khởi động lại, kể cả khi container được dựng lại từ cấu hình | `db/docker-compose.yml` | AC-1 (chính sách trong cấu hình) |
| Có một lệnh kiểm nói thật chuỗi tự khởi động còn nguyên hay không | `scripts/check-db-autostart.sh` | AC-2 → AC-6 (thước hai chiều) |
| Người vận hành đọc được chuỗi tự khởi động và cách kiểm | `docs/ops/runtime-map.md`, `docs/ROADMAP.md` | AC-7 (sổ vận hành) |

## Task 1 — compose khai restart

- Files: `db/docker-compose.yml`
- Việc: thêm `restart: unless-stopped` + một dòng chú thích tiếng Việt trỏ L7, ngay dưới `container_name`.
- Verify: `docker compose -f db/docker-compose.yml config --format json | jq -r .services.db.restart` = `unless-stopped`.
- Phục vụ: E1, E8. `independent: false` (Task 2 đo nó).

## Task 2 — thước `scripts/check-db-autostart.sh`

- Files: `scripts/check-db-autostart.sh`
- Chế độ: `static` · `diff` (so commit f3cff1f, `AU7_BASE` đổi được) · `mutation` (bốn đột biến + bản lành) ·
  `restart` (dind cách ly, hai chiều cùng daemon, StartedAt DB thật + đối chứng dương dind) ·
  `cleanup` (lượt ép lỗi `AU7_FAIL_AFTER=dind`, lượt SIGTERM; không sót `au7-dind-*`) ·
  `live` (chỉ đọc: jq RestartPolicy.Name, `plutil -extract RunAtLoad raw`, `launchctl list`) ·
  `live-selftest` (bản chép plist + inspect thật đã làm hỏng).
- Verify per-task (đo-chiều-đỏ): chạy từng chế độ; `mutation` tự phá-thử; chạy `static` trên bản compose gốc
  (f3cff1f) phải đỏ với thông điệp ghim.
- Phục vụ: E1–E6, E8, E9. `independent: false`.

## Task 3 — tài liệu

- Files: `docs/ops/runtime-map.md` (mục «DB local tự khởi động»), `docs/ROADMAP.md` (§2 as-built + §4 dòng AU7).
- Verify: đọc lại mục, đối chiếu năm điều của E7.
- Phục vụ: E7. `independent: true` nhưng nhỏ — làm tuần tự.
