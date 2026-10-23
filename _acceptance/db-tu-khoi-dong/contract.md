---
schema_version: 1
feature: DB local tự khởi động lại sau khi Docker hoặc máy khởi động lại
slug: db-tu-khoi-dong
owner: phanlemanh@gmail.com
risk_tier: T2      # db/docker-compose.yml + scripts/ + docs — không chạm t3_paths
surfaces: [config, docs]
status: signed-off
design_doc: docs/superpowers/specs/2026-10-23-db-tu-khoi-dong-design.md
approved_by: Mạnh
approved_at: 2026-10-23
---

# Acceptance Contract: db-tu-khoi-dong

## Context

Hàng AU7 của lộ trình, đợt 0 «Cầm máu». Audit 23/10 dòng L7: tối 22/10 colima khởi động lại và
container DB local `one-invest-db` nằm chết khoảng 8 giờ. Sáng 23/10 restart policy `unless-stopped`
được đặt tay; `db/docker-compose.yml` vẫn không khai `restart:`, nên lần `docker compose up -d` kế
tiếp tạo lại container với policy `no`. Việc này đưa policy vào compose và thêm thước đo
`scripts/check-db-autostart.sh` (static · mutation · restart · live). Ngưỡng sống từ ô cơ hội:
«Khởi động lại Docker: container DB lên lại không cần tay».

Source input: hàng AU7 `docs/plan/lo-trinh.json` + `_acceptance/db-tu-khoi-dong/opportunity.md`
(Mạnh gõ «build», 23/10).

## Criteria

- AC-1: Given `db/docker-compose.yml` của cây, When đọc cấu hình gộp bằng
  `docker compose -f db/docker-compose.yml config`, Then service `db` có `restart: unless-stopped`
  (hoặc `always`); và cấu hình gộp của cây bỏ khoá `restart` bằng đúng từng giá trị cấu hình gộp của
  compose ở commit trước vòng (`f3cff1f`) — ảnh, tên container, cổng, volume, biến môi trường,
  healthcheck không đổi.
- AC-2: Given bốn bản compose hỏng trong thư mục tạm — bỏ dòng `restart`, `restart: "no"`,
  `restart: on-failure`, và một bản giữ `restart` nhưng đổi cổng 5433 → 5434 — When chạy bộ kiểm AC-1
  trên từng bản, Then cả bốn đỏ với thông điệp ghim (`FAIL compose db.restart=<giá trị>` cho ba bản
  đầu, `FAIL compose lệch commit trước vòng` cho bản thứ tư), và bản lành chép cùng thư mục thì xanh.
- AC-3: Given một daemon Docker cách ly (container dind tạm) và container dựng bằng
  `docker compose up -d` từ compose của cây, When dockerd trong đó dừng và lên lại (`docker restart`
  container dind), Then container đó tự về `running` mà không có lệnh nào khác chạm nó.
- AC-4: Given cùng daemon cách ly ở AC-3 và bản compose bỏ dòng `restart`, When dockerd khởi động lại
  như AC-3, Then container ra `exited` — đối chứng rằng AC-3 xanh nhờ dòng `restart` của file chứ
  không nhờ mặc định của Docker.
- AC-5: Given máy này đang chạy, When chạy `live` (chỉ đọc), Then `one-invest-db` đang chạy với
  `HostConfig.RestartPolicy.Name` ∈ {`unless-stopped`, `always`}, và LaunchAgent `homebrew.mxcl.colima`
  có `RunAtLoad` = true (đọc giá trị, không đọc chuỗi có mặt) và đang được `launchctl` nạp — tức máy
  khởi động lại rồi đăng nhập thì colima, dockerd và DB tự lên theo chuỗi. Cùng bộ đọc chạy trên bản
  chép của plist thật và JSON `docker inspect` thật đã làm hỏng (`RunAtLoad` false, policy `no`) thì đỏ.
- AC-6: Given DB thật `one-invest-db` và các container khác trên daemon của máy, When chạy `restart` —
  kể cả khi lượt đo thoát lỗi giữa chừng hoặc bị SIGTERM sau khi đã dựng daemon cách ly — Then `StartedAt`
  của `one-invest-db` (đọc được, không rỗng) không đổi, và không container `au7-dind-*` nào còn sót sau
  khi lệnh thoát.
- AC-7: Given `docs/ops/runtime-map.md` sau vòng, When Mạnh hoặc agent đọc mục DB local tự khởi
  động, Then thấy chuỗi tự khởi động (đăng nhập → colima LaunchAgent → dockerd → policy compose), lệnh
  kiểm (`bash scripts/check-db-autostart.sh live`), cách triển khai sau merge (không cần tạo lại
  container ngay; lần `compose up` kế tiếp tự tạo lại, DB gián đoạn vài giây), và giới hạn (cần đăng
  nhập macOS; người `docker stop` có chủ đích thì không tự bật). (judgment)

## Coverage

Quét bằng `morphological-scan` (preset risk-premortem) ở S1. Chân ngành: [NGÀNH: Docker docs «Start
containers automatically» — restart policies `no|on-failure|always|unless-stopped`; Compose spec khoá
`restart`]. Chân sản phẩm: [SUY-TỪ-REPO: docs/audit/2026-10-23-hien-trang-va-lo-trinh.md] dòng L7.

- Trục sự kiện làm DB dừng: dockerd khởi động lại (AC-3, AC-4) · máy khởi động lại + đăng nhập (AC-5)
  · `compose up` tạo lại container (AC-1, AC-2) · tiến trình DB tự chết (Later) · người `docker stop`
  (Never — đúng nghĩa `unless-stopped`) · máy khởi động lại nhưng chưa ai đăng nhập (Never — ngoài kho).
  [thước CE: sự cố L7 + bốn policy của Docker docs]
- Trục tầng giữ cam kết: file compose (AC-1, AC-2) · container đang sống (AC-5) · lớp khởi động colima
  (AC-5) · tài liệu vận hành (AC-7).
- Trục cách chứng: tĩnh trên cấu hình gộp (AC-1) · đột biến (AC-2) · daemon cách ly hai chiều (AC-3,
  AC-4) · đọc máy thật chỉ đọc (AC-5) · diễn tập thật trên daemon máy (Later — xem Out of scope).
- Cross-cutting: phép đo không chạm DB dùng chung (AC-6).

## Đường đo

- Ngưỡng «Khởi động lại Docker: container DB lên lại không cần tay» ← `bash scripts/check-db-autostart.sh
  restart` (AC-3, đối chứng AC-4). Đây là PROXY: dockerd trong daemon cách ly khởi động lại, không phải
  colima của máy. Phần máy thật ← `live` chỉ đọc (AC-5), không chứng hành vi khởi động lại. Nhận proxy
  này làm bằng chứng sống hay hẹn diễn tập thật là câu hỏi cho Mạnh ở Cổng Phạm vi (sổ, dòng chỉ-người).

## Out of scope

- Diễn tập thật `colima restart` trên máy: dừng cùng lúc DB và 14 container dự án khác giữa giờ job
  chạy. Mạnh muốn diễn tập thì chạy tay rồi `bash scripts/check-db-autostart.sh live`.
- Tạo lại `one-invest-db` ngay trong vòng — policy đang sống đã là `unless-stopped`, tạo lại chỉ thêm
  gián đoạn.
- Chuyển colima sang LaunchDaemon chạy trước đăng nhập (cấu hình máy, ngoài kho).
- Job thoát ≠ 0 / cảnh báo khi DB không tới (AU3), plist collector-api/kev (L11, làn ZCode).

## Notes

- Không có bề mặt UI → không design-pass, không đặc tả UX, không eval ui-check (sổ quyết định).
- Known limits — chọn ở Cổng Bằng chứng 2026-10-23:
  - Ngoài-1: Sổ vận hành nêu nhầm `scripts/migrate-export.sh` là nơi sẽ dựng lại container DB; thực ra chỉ `scripts/setup.sh` hoặc lệnh tay mới dựng lại.
  - Ngoài-2: Phép kiểm máy thật mới được thử chiều đỏ cho hai trong bốn điều kiện (chính sách tự khởi động, colima tự bật); «DB đang chạy» và «colima đang nạp» chưa có lượt thử đỏ.
