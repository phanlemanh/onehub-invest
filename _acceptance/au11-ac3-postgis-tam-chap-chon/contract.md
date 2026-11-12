---
schema_version: 1
feature: Ca AU11-AC-3 chờ PostGIS docker tạm qua lần khởi động lại sau khởi tạo rồi mới kết nối, không còn đỏ chập chờn dưới tải
slug: au11-ac3-postgis-tam-chap-chon
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
design_doc: docs/superpowers/specs/2026-11-12-au11-ac3-postgis-tam-chap-chon-design.md
veto_state: mo
veto_opened_at: 2026-11-12T02:12:00Z
---

# Acceptance Contract: au11-ac3-postgis-tam-chap-chon

## Context

Hai lượt ghim lại liền nhau của PR #424 đỏ đúng các ca AU11-AC-3 trong `scripts/ci-test-module.test.mjs`. Lỗi là «Connection
terminated unexpectedly» khi máy tải nặng; chạy riêng thì xanh.

Ảnh `kartoza/postgis` khởi tạo xong thì khởi động lại postgres. Bước chờ cũ dùng `pg_isready` và giấc ngủ 3 giây cố định nên trả
về trước lần khởi động lại.

Giám sát đợt mở hàng này để sửa gốc trước khi ghim lại lần ba.

## Criteria

- AC-1: Given bản ghi log thật rút gọn của container kartoza cắt ở hai thời điểm (trước dòng «Postgres initialisation process
  completed», và sau dòng «ready to accept connections» thứ hai), When gọi hàm `daQuaKhoiDongLai` của
  `scripts/ci-test-module.test.mjs`, Then trả false rồi true. Luật cũ «có dòng ready là xong» trả true ngay ở thời điểm thứ
  nhất; ca ghim thông điệp «BUOC CHO CU TRA VE TRUOC KHI KHOI DONG LAI» cho chiều đỏ ấy.
- AC-2: Given hàm chờ `choPostgisTam({ docLog, chayTruyVan, han })` của tệp test nhận hàm đọc log, hàm truy vấn và thời hạn, When
  chạy với nguồn giả (không docker), Then:
  - log không bao giờ có dòng mốc, hạn 1 giây → ném đúng «chưa thấy khởi động lại sau khởi tạo»;
  - log có mốc, chuỗi kết quả `SELECT 1` là ok, lỗi, ok, ok → hàm chỉ trả về sau lần gọi thứ tư (lỗi đếm lại từ đầu);
  - chuỗi ok, lỗi, ok rồi hết hạn → ném đúng «SELECT 1 chưa ổn định».
  `before()` gọi đúng hàm này với `docker logs <tên> 2>&1` và kết nối thật từ host; tệp không còn `pg_isready` hay ngủ cố định 3
  giây.
- AC-3: Given tải dựng lại được lỗi cũ — số tiến trình đốt CPU bằng `os.availableParallelism()` (in ra), When probe chạy BẢN CŨ
  của tệp (dựng từ `git show origin/main:` ra tệp tạm cạnh tệp thật) tới 10 lần dưới tải, Then có ít nhất một lần đỏ chứa
  «Connection terminated» — không có thì probe thoát khác 0 với «TAI KHONG TAI HIEN LOI CU»; rồi với cùng tải, bản mới chạy 10
  lần liên tiếp đều xanh. Probe lưu `docker logs` thật (gộp stdout và stderr) của một container, gọi `daQuaKhoiDongLai` trên đó
  phải ra true, và dòng mốc trong log thật khớp dòng mốc của bộ log trong test. Probe in thời gian từng lần, luôn dọn tiến trình
  đốt CPU và container tạm.
- AC-4: Given bộ test của tệp, When chạy, Then năm ca AU11-AC-3 cũ ok, không SKIP (đếm từ đầu ra TAP), các ca AU11-AC-4 ok;
  mọi chuỗi thông điệp assert của các ca AU11-AC-3, AU11-AC-4 cũ giữ nguyên so merge-base; `scripts/ci-db-init.mjs` không
  đổi so merge-base.

## Coverage

Bỏ quét không gian (dòng `descope` trong sổ) — một ca chập chờn đã gọi tên gốc bằng log:

- Trục A — logic chờ: hàm thuần hai chiều trên log thật → AC-1 · bước chờ dùng hàm + kết nối thật → AC-2
- Trục B — dưới tải: bản cũ đỏ rồi bản mới 10 lần xanh cùng tải → AC-3 · không đổi hành vi các ca khác → AC-4

## Out of scope

- `scripts/ci-db-init.mjs` và hành vi các ca AU11-AC-4.
- Đổi ảnh PostGIS hay cấu hình docker/Colima của máy.
- Các test khác dựng container tạm.

## Notes
