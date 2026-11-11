---
schema_version: 1
feature: Thước gán khu vực tin rao (KDM-AC-3) theo luật khớp xã PX1 — gỡ ca đỏ sẵn làm hồi quy scripts đỏ cho mọi hàng
slug: do-san-sl1-kdm
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-11
design_doc: docs/superpowers/specs/2026-11-10-do-san-sl1-kdm-design.md
---

# Acceptance Contract: do-san-sl1-kdm

## Context

`node --test scripts/*.test.mjs` đỏ trên main ở ca KDM-AC-3: 90 tin S06 trỏ xã danh bạ có `admin_code` (luật khớp tên PX1,
084) mà thước `scripts/kiem-tin-rao-gan-khu-vuc.mjs` chỉ nhận phường OSM — eval hồi quy `executors.test.scripts` của mọi
hàng đỏ oan. Hai ca SL1-AC-5 của itest `s03-len-cong` (cũng đỏ sẵn) tách ra hồ sơ riêng vì cần Mạnh đọc lại một tiêu chí
đã ký (sổ). Thiết kế: `docs/superpowers/specs/2026-11-10-do-san-sl1-kdm-design.md`.

## Criteria

### AC-1 — Thước dùng đúng vị từ của bên ghi
Given DB local đã áp 084,
When `node scripts/kiem-tin-rao-gan-khu-vuc.mjs` (chỉ đọc),
Then «tin trỏ khu vực hợp lệ» là đúng điều kiện `khuVucKhopTen(coDanhBa)` của `pipeline/lib/osm.mjs` mà bên ghi dùng; trên DB
hiện tại S03, S05, S06 đều 0 tin trỏ khu vực không hợp lệ, dòng «kiem-tin-rao-gan: PASS», exit 0. DB chưa áp 084 thì điều kiện
về `phuongHopLe` như cũ.

### AC-2 — Ca thuần ba ô, khớp bên ghi
Given một giao dịch ROLLBACK trên DB local với ba khu vực mồi: xã có `admin_code` không OSM; khu vực không OSM không mã; xã có
`admin_code` mang `meta.lac`; mỗi khu vực một tin trỏ vào,
When test đọc tính hợp lệ của ba tin bằng hàm của thước và bằng câu SQL `khuVucKhopTen` của bên ghi,
Then hai kết quả bằng nhau từng ô (ô một hợp lệ, ô hai không); bản thước dùng `phuongHopLe` khác bên ghi ở ô một, assert ghim
«KDM-PX1»; sau ROLLBACK không còn khu vực mồi nào trong DB.

### AC-3 — KDM-AC-3 xanh lại, ba chiều giữ nghĩa
Given mỗi lượt `--thu` chạy trên DB của riêng lượt chép từ bản mẫu của DB local (`db/db-thu.sh --chay`), không trên DB dùng chung,
When `node --test scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`,
Then KDM-AC-3 xanh: bản thường exit 0 với dòng PASS; `--pha khong-sua` và `--pha mo-loc` vẫn exit 1 và gọi tên tin mồi như hồ
sơ `do-khu-vuc-tu-dung-moi` đã ký.

### AC-4 — Không ghi DB dùng chung
Given `scripts/kiem-tin-rao-gan-khu-vuc.mjs` và `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`,
When quét,
Then với mỗi câu ghi (INSERT, UPDATE, DELETE, DROP) trong hai tệp, lệnh giao dịch thật gần nhất phía trước là `BEGIN` và gần
nhất phía sau là `ROLLBACK`; bản sao có câu ghi trước `BEGIN` đầu tiên, hay ngay sau một `ROLLBACK`, làm phép quét đỏ gọi tên tệp
và dòng; ca `KDM-PX1` tự dựng mọi khu vực nó cần (cả khu vực cha) nên chạy được trên DB trống của CI.

## Coverage

Trục (preset test-matrix cho «thước gán khu vực»):
- Loại khu vực tin trỏ: phường OSM · xã danh bạ có mã · không OSM không mã · xã có mã mang `lac` · lạc OSM (mồi của KDM).
  [thước CE: `khuVucKhopTen` của bên ghi + mồi KDM — AC-1, AC-2, AC-3]
- DB: đã áp 084 · chưa áp 084. [AC-1 — nhánh chưa áp đi qua `coDanhBa` của bên ghi]
- Chỗ đứng của phép đo: chỉ đọc · giao dịch ROLLBACK. [AC-4]
- Hồi quy `scripts/*.test.mjs`: thu khỏi tiêu chí (Known limits, Mạnh chọn 11/11).

Core → AC-1…AC-4. Later: hai ca SL1-AC-5 «áp 069», «hai thứ tự» — hồ sơ riêng chờ Mạnh. Never: sửa 90 tin thật.

## Out of scope

- Hai ca SL1-AC-5 của `pipeline/scripts/s03-len-cong.itest.mjs` (tách hồ sơ riêng, chờ Mạnh đọc lại AC-5 của `s03-len-cong`).
- Sửa dữ liệu, transform, `reassign-areas` hay `khuVucKhopTen` của bên ghi.
- Đổi `executors.test.*` của hồ sơ đã ký; gỡ KDM-AC-3 khỏi `scripts/ci-bo-qua.json`.
- Hồi quy cả bộ `node --test scripts/*.test.mjs` (AC-5 cũ) — thu khỏi tiêu chí, xem Notes.

## Notes
- Known limits — chọn ở Cổng Phạm vi 2026-11-11 (Mạnh: «Thu AC-5, mở PR»):
  - AC-5 cũ (hồi quy `scripts/*.test.mjs` xanh) không có bằng chứng máy: hai lượt chấm đỏ vì ca chập chờn khi máy tải —
    vòng 1 KDM quá giờ (đã sửa), vòng 2 `AU11-AC-3` của `scripts/ci-test-module.test.mjs` «Connection terminated
    unexpectedly» (chạy riêng xanh 5/5, main đỏ cùng chỗ). Các ca của chính hàng (KDM-AC-3, KDM-AC-4, KDM-AC-5, KDM-PX1) đo ở
    E3; CI vẫn chạy bộ scripts trên mọi PR.
