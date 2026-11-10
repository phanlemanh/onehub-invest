---
schema_version: 1
feature: Thước gán khu vực tin rao (KDM-AC-3) theo luật khớp xã PX1 — gỡ ca đỏ sẵn làm hồi quy scripts đỏ cho mọi hàng
slug: do-san-sl1-kdm
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-10T21:05:00Z
approved_by:
approved_at:
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
Given DB local hiện tại,
When `node --test scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`,
Then KDM-AC-3 xanh: bản thường exit 0 với dòng PASS; `--pha khong-sua` và `--pha mo-loc` vẫn exit 1 và gọi tên tin mồi như hồ
sơ `do-khu-vuc-tu-dung-moi` đã ký.

### AC-4 — Không ghi DB dùng chung
Given `scripts/kiem-tin-rao-gan-khu-vuc.mjs` và `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`,
When quét,
Then mọi câu ghi (INSERT, UPDATE, DELETE, DROP) trong hai tệp nằm sau một `BEGIN` và trước `ROLLBACK` của cùng kết nối; bản sao
có một câu ghi ngoài giao dịch làm phép quét đỏ gọi tên tệp và dòng.

### AC-5 — Hồi quy
Given `scripts/*.test.mjs`,
When chạy,
Then xanh.

## Coverage

Trục (preset test-matrix cho «thước gán khu vực»):
- Loại khu vực tin trỏ: phường OSM · xã danh bạ có mã · không OSM không mã · xã có mã mang `lac` · lạc OSM (mồi của KDM).
  [thước CE: `khuVucKhopTen` của bên ghi + mồi KDM — AC-1, AC-2, AC-3]
- DB: đã áp 084 · chưa áp 084. [AC-1 — nhánh chưa áp đi qua `coDanhBa` của bên ghi]
- Chỗ đứng của phép đo: chỉ đọc · giao dịch ROLLBACK. [AC-4]
- Hồi quy. [AC-5]

Core → AC-1…AC-5. Later: hai ca SL1-AC-5 «áp 069», «hai thứ tự» — hồ sơ riêng chờ Mạnh. Never: sửa 90 tin thật.

## Out of scope

- Hai ca SL1-AC-5 của `pipeline/scripts/s03-len-cong.itest.mjs` (tách hồ sơ riêng, chờ Mạnh đọc lại AC-5 của `s03-len-cong`).
- Sửa dữ liệu, transform, `reassign-areas` hay `khuVucKhopTen` của bên ghi.
- Đổi `executors.test.*` của hồ sơ đã ký; gỡ KDM-AC-3 khỏi `scripts/ci-bo-qua.json`.

## Notes
