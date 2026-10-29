# db/

- `docker-compose.yml` — DB local PostGIS (`one-invest-db`, cổng 5433, ảnh `kartoza/postgis:17-3.5`, project
  `onehub-db`). Dữ liệu nằm trong volume có tên `onehub_pgdata`, gắn ở `/var/lib/postgresql` (kartoza để dữ liệu ở
  `/var/lib/postgresql/<major>/main`). Tự chạy lại khi Docker khởi động lại (`restart: unless-stopped`).
- `migrations/` — schema, đánh số theo thứ tự chạy; không sửa migration đã commit.
- `db-thu.sh` — DB thử `oneinvest_<dãy>_<việc>` trên cùng server cho phép đo migration chưa merge.
- `check-idempotent*.sh` — migration áp hai lần cho cùng kết quả.

Kiểm và vận hành (chi tiết: `docs/ops/db-volume.md`):

```bash
bash scripts/db-volume-check.sh live          # dữ liệu có nằm trong volume onehub_pgdata không (chỉ đọc)
bash scripts/check-db-autostart.sh live       # tự khởi động lại (chỉ đọc)
bash scripts/db-sao-luu.sh                    # sao lưu → $HOME/onehub-backups/db/<UTC>/ (ngoài kho: có tầng A)
bash scripts/db-khoi-phuc.sh <bản> oneinvest_<tên>   # khôi phục vào DB thử + so số dòng
bash scripts/db-chuyen-volume.sh [--lam|--lui]       # chuyển / lùi (đã chuyển 1 lần; xem sổ)
```
