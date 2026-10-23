# DB local tự khởi động lại (AU7 · `db-tu-khoi-dong`) — design

Hàng AU7 của `docs/plan/lo-trinh.json`, đợt 0 «Cầm máu». Gốc: audit 23/10 dòng L7
(`docs/audit/2026-10-23-hien-trang-va-lo-trinh.md`).

## Vấn đề

DB local (`one-invest-db`, PostGIS :5433) là nơi duy nhất giữ tầng A và mọi lượt nạp đêm. Tối 22/10
colima khởi động lại lúc khoảng 21:25 và container nằm chết khoảng 8 giờ tới 05:38 sáng 23/10. Mọi job
đêm gặp `ECONNREFUSED`. Sáng 23/10 restart policy `unless-stopped` được đặt tay bằng `docker update`.
`db/docker-compose.yml` vẫn không khai `restart:`.

Lỗ còn lại: chính sách đang sống chỉ nhờ lần đặt tay. Lần `docker compose up -d` kế tiếp (chạy bằng
`scripts/setup.sh`, `scripts/migrate-export.sh` hoặc tay) sẽ thấy cấu hình compose khác container
và tạo lại container theo file, tức policy `no`. Lần colima khởi động lại sau đó lặp lại sự cố 22/10.

Chuỗi tự khởi động khi máy khởi động lại (đo 23/10, chỉ đọc):

```
đăng nhập macOS → LaunchAgent homebrew.mxcl.colima (RunAtLoad, `colima start -f`)
→ VM colima → dockerd → container có restart policy unless-stopped/always tự chạy lại
```

Mắt xích thiếu duy nhất là policy trong compose.

## Cách làm

1. `db/docker-compose.yml`: thêm `restart: unless-stopped` cho service `db`, kèm một dòng chú thích
   tiếng Việt trỏ L7. Chọn `unless-stopped` (giống cái đang đặt tay) thay vì `always`: người `docker stop`
   có chủ đích thì container không tự bật lại sau lần khởi động Docker kế tiếp.
2. `scripts/check-db-autostart.sh` — thước đo, bốn chế độ, cùng khuôn với `check-supabase-lock.sh`:
   - `static` — đọc cấu hình GỘP thật bằng `docker compose -f db/docker-compose.yml config --format json`
     (không cần daemon), đòi `services.db.restart` ∈ {`unless-stopped`, `always`}. Sai thì in
     `FAIL compose db.restart=<giá trị> (cần unless-stopped|always)`.
   - `mutation` — chép compose ra thư mục tạm, làm hỏng theo ba kiểu (xoá dòng `restart`, `"no"`,
     `on-failure`) rồi chạy chính bộ kiểm `static` trên bản hỏng: cả ba phải đỏ với thông điệp ghim.
     Bản lành cùng thư mục phải xanh (đối chứng dương).
   - `restart` — mô phỏng «Docker khởi động lại» trong một daemon CÁCH LY: container `docker:28-dind`
     tạm (privileged), trong đó `docker compose up -d` bằng compose của cây + một override chỉ thay ảnh
     thành `alpine:3.20 sleep infinity` và bỏ cổng, volume, healthcheck (thứ được đo là restart policy
     của file, không phải PostGIS). Rồi `docker restart` container dind = dockerd bên trong chết và
     lên lại. Đòi: trước = running + policy của file; sau = running, không lệnh tay nào. Cùng lượt, cùng
     daemon: bản compose bỏ dòng `restart` phải ra `exited` (đối chứng âm). Đo `StartedAt` của
     `one-invest-db` thật trước và sau: phải không đổi. Tự dọn container dind (trap). Ảnh thiếu thì
     `docker pull` (lần đầu ~1,5 phút).
   - `live` — CHỈ ĐỌC máy này: `one-invest-db` có policy `unless-stopped|always` và đang chạy;
     LaunchAgent `homebrew.mxcl.colima` có `RunAtLoad=true` và đang nạp trong `launchctl`.
     Không phải eval CI (đọc máy cụ thể).
3. `_acceptance/config.yaml`: bốn khoá `executors.script.db_autostart_*`.
4. `docs/ops/runtime-map.md`: mục «DB local tự khởi động» — chuỗi trên, lệnh kiểm, và ghi rằng
   triển khai KHÔNG cần tạo lại container ngay (policy đang sống đã là `unless-stopped`); lần
   `compose up` kế tiếp sẽ tạo lại container theo file mới với cùng policy (DB gián đoạn vài giây).
5. ROADMAP §2/§4: một dòng as-built.

## Vì sao không diễn tập thật

Khởi động lại colima/dockerd thật dừng cùng lúc `one-invest-db` và 14 container của dự án khác trên
cùng daemon, giữa lúc job launchd có thể đang chạy (luật đợt: thử phá hoại DB phải báo giám sát
trước). Daemon cách ly (dind) đo đúng cơ chế — dockerd dừng rồi lên lại, khôi phục container theo
restart policy — mà không chạm máy thật. Phần máy thật (LaunchAgent colima + policy container) đo
bằng `live` chỉ đọc.

## Không làm

- Không tạo lại `one-invest-db` trong vòng (gián đoạn DB dùng chung, không thêm hành vi).
- Không đổi colima sang LaunchDaemon để chạy trước khi đăng nhập (máy FileVault cần đăng nhập để mở
  khoá đĩa; cấu hình máy ngoài kho).
- Không xử job chạy trước khi DB lên (job thoát ≠ 0 khi DB không tới) — đó là AU3.
- Không đụng plist collector-api/kev (L11, làn ZCode).
