---
schema_version: 1
feature: harness của s06-vung-moi-len-canonical chạy được transform-chotot có import gan-sdt-s06.mjs
slug: s06-vung-moi-harness-gan-sdt
owner: phanlemanh@gmail.com
risk_tier: T1      # chỉ sửa bộ kiểm trong scripts/; không đổi pipeline, dữ liệu, quyền hay luồng
surfaces: [cli]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: s06-vung-moi-harness-gan-sdt

## Context

Hồ sơ có mặt vì PR chạm `scripts/` (ngoài `t1_skip_globs`). Đây là mục Ngoài-6 của `_acceptance/sdt-s06-ghep-tai-khoan`,
Mạnh chọn «mở hợp đồng mới» khi ký (`decisions.jsonl` d-20261102T215617Z-29).

PR #283 thêm `import { ganSdtS06 } from "./gan-sdt-s06.mjs"` vào `pipeline/transform-chotot.mjs`. `scripts/s06-vung-moi/acceptance.mjs`
dựng hai cây tạm chỉ symlink một danh sách tệp cố định, thiếu tệp mới nên transform trong cây tạm chết ở bước import. Eval E6, E7 của
`s06-vung-moi-len-canonical` đỏ giả khi chấm lại. Dữ liệu không bị ảnh hưởng.

**Lỗi thứ hai lộ ra khi chạy, không thuộc Ngoài-6.** DB máy thu nay đã có phường Đà Nẵng, Hải Phòng thật trong `areas` (93, 114 dòng). `boRanhGioiMoi`
chỉ bỏ ranh giới trong `stg_osm_boundaries`, nên `reassign-areas.mjs` thấy 2 phường giả trên 93 con hiện có và dừng ở chốt an toàn. E6, E7 vẫn đỏ dù
đã thêm symlink. Sửa cùng hồ sơ vì tiêu chí xong đòi E6, E7 xanh: phường thật trên bản chép được tách khỏi thị trường, DB thật không bị chạm.

Hạng T1 vì tệp đổi chỉ là bộ kiểm, không nằm trong `t3_paths`, và đường dữ liệu không đổi.

## Criteria

- AC-1: Given cây có `pipeline/gan-sdt-s06.mjs` và `transform-chotot.mjs` import tệp đó, When chạy `node scripts/s06-vung-moi/acceptance.mjs transform`, Then lệnh thoát 0 và in `TRANSFORM PASS`.
- AC-2: Given cùng cây, bản harness chưa thêm symlink, When chạy cùng lệnh, Then `đối chứng: transform-chotot của main thoát 0` và `AC-6 bảng offer→area HN/HCM` đỏ; có symlink thì hai mục này xanh.
- AC-3: Given bản gốc đã có phường Đà Nẵng thật trong `areas`, bản harness chưa tách các phường đó, When chạy cùng lệnh, Then `bản chép: reassign nạp phường giả ĐN` đỏ vì chốt an toàn; có bước tách thì mục này và hai ca tin Đà Nẵng xanh.

## Out of scope

- OOS-1: Ghim lại hay sửa hồ sơ đã ký `s06-vung-moi-len-canonical` và `sdt-s06-ghep-tai-khoan`: giữ nguyên.
- OOS-2: Đổi harness sang tự dò import thay cho danh sách cố định: import mới sau này vẫn phải thêm tay vào hai danh sách.
- OOS-3: Ca AC-5 «chưa áp 064» trong chế độ `reassign` (eval khác của hồ sơ đã ký): bản gốc nay đã áp 064 nên không còn mã `vn-thanh-pho-da-nang`, ca dừng ở bước dựng fixture, không do bản sửa này. Các ca AC-4 cùng chế độ xanh.
