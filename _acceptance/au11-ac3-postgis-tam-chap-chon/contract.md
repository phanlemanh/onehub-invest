---
schema_version: 1
feature: Ca AU11-AC-3 chờ PostGIS docker tạm qua lần khởi động lại sau khởi tạo rồi mới kết nối, không còn đỏ chập chờn dưới tải
slug: au11-ac3-postgis-tam-chap-chon
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-12-au11-ac3-postgis-tam-chap-chon-design.md
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
- AC-2: Given PostGIS docker tạm vừa chạy, When bước chuẩn bị của tệp test chạy, Then nó chờ tới khi log có lần khởi động lại sau
  khởi tạo. Sau đó `SELECT 1` từ host qua cổng ánh xạ phải thành công hai lần liên tiếp mới cho các ca chạy. Tệp không còn gọi
  `pg_isready` hay ngủ cố định 3 giây. Quá 180 giây thì các ca đỏ với thông điệp gọi tên bước chưa xong, không phải «Connection
  terminated».
- AC-3: Given máy có 8 tiến trình đốt CPU chạy song song, When chạy `node --test scripts/ci-test-module.test.mjs` 10 lần liên
  tiếp, Then cả 10 lần xanh. Probe in thời gian từng lần, và luôn dọn tiến trình đốt CPU cùng container tạm.
- AC-4: Given bộ test của tệp, When chạy, Then năm ca AU11-AC-3 cũ và các ca AU11-AC-4 vẫn xanh với nguyên tên và nguyên thông
  điệp; `scripts/ci-db-init.mjs` không đổi.

## Coverage

Bỏ quét không gian (dòng `descope` trong sổ) — một ca chập chờn đã gọi tên gốc bằng log:

- Trục A — logic chờ: hàm thuần hai chiều trên log thật → AC-1 · bước chờ dùng hàm + kết nối thật → AC-2
- Trục B — dưới tải: 10 lần xanh khi CPU bị đốt → AC-3 · không đổi hành vi các ca khác → AC-4

## Out of scope

- `scripts/ci-db-init.mjs` và hành vi các ca AU11-AC-4.
- Đổi ảnh PostGIS hay cấu hình docker/Colima của máy.
- Các test khác dựng container tạm.

## Notes
