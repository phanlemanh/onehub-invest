---
schema_version: 1
feature: Tách bộ kiểm pipeline của lượt chấm thành hai nửa chạy song song, mỗi nửa một DB thử, để một lệnh không vượt trần chờ 30 phút của tác tử chấm
slug: tach-suite-pipeline
owner: phanlemanh@gmail.com
risk_tier: T1      # hạ tầng kiểm: thêm hai lệnh test và một ca kiểm thuần; không đổi mã sản phẩm, dữ liệu, quyền hay luồng
surfaces: [cli]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: tach-suite-pipeline

## Context

Hồ sơ có mặt vì PR chạm `pipeline/` và `_acceptance/config.yaml` (ngoài `t1_skip_globs`). `cd pipeline && npm test` chạy 80
tệp tuần tự trên một DB thử: ~21 phút sáng 13/11, vượt 30 phút khi máy có tải sau các hàng gộp trong ngày — đúng trần chờ
lệnh nền của tác tử chấm. DA9 lượt 2 BLOCKED vì vậy. Kit chưa cho khai `long_running` cho suite (kit#501).

Sửa: `pipeline/test-nua.json` chia 80 tệp thành hai nửa theo thời lượng từng tệp; `npm run test:a` / `test:b` chạy mỗi nửa qua
`db/db-thu.sh --chay` trên DB thử tên riêng (`oneinvest_suite_pipeline_a`, `_b`) nên hai nửa chạy song song không đạp nhau.
`npm test` giữ nguyên (CI không đổi). `feature_loop.suite_keys` thay `executors.test.pipeline` bằng `pipeline_a`, `pipeline_b`;
khoá `pipeline` cũ giữ cho eval/hồ sơ đang trỏ tới nó. `pipeline/thoi-luong-tep.mjs` (bật bằng `THOI_LUONG_TEP=<tệp>`) đo thời
lượng tường từng tệp để chia lại khi cần.

## Criteria

- AC-1: Given `test-nua.json` và `scripts.test` của `pipeline/package.json`, When chạy `scripts/chia-nua.test.mjs`, Then hợp
  hai nửa bằng đúng tập tệp `npm test` chạy, không tệp nào sót hay trùng; thêm tệp test mới mà chưa xếp nửa thì ca đỏ.
- AC-2: Given `test:a`, `test:b`, When đọc lệnh, Then mỗi nửa chạy qua `db-thu.sh --chay` trên DB thử tên riêng, khác nhau và
  khác DB của `npm test`.
- AC-3: Given mỗi nửa chạy MỘT MÌNH trên DB thử trống của nó, When chạy, Then xanh (không phụ thuộc trạng thái tệp nửa kia để lại).
- AC-4: Given máy yên, When chạy hai nửa song song, Then mỗi nửa ≤ 12 phút.

## Đo 13/11 (lượt khoá s4 của P2, 16:11–16:42Z, tải 1′ 3,7–4,9, không job thu/nạp)

| Lượt | Nửa A | Nửa B |
|---|---|---|
| Song song, mỗi nửa một DB thử trống | 9,6′ · 205/205 ca xanh | 11,2′ · 568 xanh, 1 bỏ qua, 0 đỏ |
| Một mình, DB thử trống | 8,6′ · 205/205 xanh | 10,6′ · 568 xanh, 1 bỏ qua, 0 đỏ |

- AC-3: mỗi nửa xanh khi chạy một mình trên DB trống của nó — không tệp nào phụ thuộc trạng thái tệp nửa kia để lại.
- AC-4: song song ≤ 12′ mỗi nửa (đích nhận của giám sát đợt: ≤ 15′ trên máy tải vừa). Tổng 774 ca = hai nửa phủ trọn.
- Lượt song song đầu tiên lộ lỗi bộ đo `thoi-luong-tep.mjs` bản đầu (đo thời gian tường theo sự kiện, mà sự kiện tệp con
  về dồn cục): sửa thành cộng thời lượng ca cấp cao nhất, ghi giới hạn ở đầu tệp. Không ảnh hưởng `test:a`/`test:b`.

## Out of scope

- Đổi lệnh `npm test` hay CI.
- Ba tệp `pipeline/*.test.mjs` ngoài mẫu của `npm test` (`do-danh-ba-sdt`, `do-the-duyet`, `noi-du-an-s08`): giữ như cũ.
- Khai `long_running` cho suite ở kit (kit#501).
