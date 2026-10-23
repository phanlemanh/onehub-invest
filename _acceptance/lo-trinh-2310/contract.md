---
schema_version: 1
feature: Lộ trình máy đọc + quy định «mỗi loại thông tin một chỗ» — bật gói road-map, cắt đợt phan-loai-2310 và cam-mau-2310
slug: lo-trinh-2310
owner: phanlemanh@gmail.com
risk_tier: T3      # .claude/settings.json nằm trong t3_paths
surfaces: [config, docs]
status: implemented
approved_by:
approved_at:
---

# Acceptance Contract: lo-trinh-2310

## Context

Việc sắp làm đang nằm ở bốn chỗ (ROADMAP §4, audit §6, review §5, mã giao trên kênh tin) và ROADMAP §4 đã lệch
9 mục (audit R8). Mạnh chốt 23/10: «mỗi loại thông tin một chỗ» — việc phát triển sắp làm và mốc chỉ ở lộ trình máy
đọc `docs/plan/lo-trinh.json` (trang `LO-TRINH.html`, trạng thái máy suy từ hồ sơ), cắt bằng `/acceptance-gate:cat-luot`.
Thay đổi: bật gói `road-map` ở phạm vi kho, khởi tạo lộ trình bằng bước chuẩn của kit, ghi hai đợt
(`phan-loai-2310` từ review phân loại — PL1–PL31 + PH1–PH6; `cam-mau-2310` từ audit Đợt 0/1 — AU1–AU12 + AH1–AH2),
và ghi quy định vào ROADMAP §0 + đầu AGENTS.md.

Source input: hội thoại — Mạnh chọn «Bật gói road-map trước» (cắt lượt), rồi «Đồng ý» quy định một chỗ và ba bước
(ký nhánh lộ trình · cắt thêm Đợt 0/1 audit · ghi quy định) ngày 23/10 (decisions.jsonl).

## Criteria

- AC-1: Given `.claude/settings.json`, When so với nền `main`, Then chỉ thêm `enabledPlugins["road-map@acceptance-gate-kit"] = true`; quyền, hook và mọi khoá khác giữ nguyên.
- AC-2: Given `_acceptance/config.yaml`, When đọc, Then có `lo_trinh.tep: docs/plan/lo-trinh.json` và `LO-TRINH.html` trong `risk_tiers.t1_skip_globs`.
- AC-3: Given kho đã khởi tạo, When chạy lại `lo-trinh-khoi-tao.mjs` của kit, Then nó báo «lộ trình đã sẵn — không đổi gì».
- AC-4: Given kho, When chạy `scripts/product-map.mjs --check`, Then `PRODUCT-MAP.md` và `LO-TRINH.html` khớp hồ sơ.
- AC-5: Given hai bản phạm vi `docs/plan/pham-vi-phan-loai-2310.md` (37 mã) và `docs/plan/pham-vi-cam-mau-2310.md` (14 mã), When chạy răng phủ `cat-luot.mjs` với `docs/plan/lo-trinh.json`, Then cả hai thoát 0, mỗi mã đúng một chỗ, 0 dòng lỗi, 0 dòng cảnh báo.
- AC-6: Given bốn tệp kit chép vào kho (`scripts/lo-trinh.mjs`, `scripts/ho-so-tom-tat.cjs`, `scripts/gio-may.mjs`, `lib/chan-lo-trinh.cjs`), When so với gói kit đang cài, Then trùng từng byte.
- AC-7: Given `AGENTS.md` và `docs/ROADMAP.md`, When đọc, Then đầu AGENTS.md trỏ `docs/plan/lo-trinh.json` cho việc sắp làm + mốc, và ROADMAP §0 có bảng «Mỗi loại thông tin một chỗ» với dòng việc phát triển → `docs/plan/lo-trinh.json`.
- AC-8: Given bản sao lộ trình bị làm hỏng từng kiểu (mã mất chỗ, mã ở hai hàng, việc nền thiếu `bat_khi`, câu giao không mở bằng vai, hàng dùng dữ liệu giả không đứng trên hàng sinh, hàng cỡ 14 tiêu chí), When chạy răng phủ, Then răng đỏ với mọi bản.

## Coverage

- Trục cấu hình: settings (AC-1) · config (AC-2) · idempotent (AC-3).
- Trục trang và dữ liệu lộ trình: trang khớp (AC-4) · phủ mã hai đợt (AC-5) · bản chép kit (AC-6).
- Trục quy định: AGENTS.md + ROADMAP §0 (AC-7).
- Trục thước đo: should-NOT-fire bằng sáu bản đột biến (AC-8).
- Bỏ quét hình thái đầy đủ: thay đổi là cấu hình + tệp ý định; trục lấy từ chính các bước khởi tạo của kit và luật răng phủ.

## Out of scope

- KHÔNG đặt mốc có ngày: nhịp kho đo được trung vị 0 ngày (T2/T3) nên không có căn cứ ngày; mốc do Mạnh đặt sau.
- KHÔNG bật `lo_trinh.chan` (chặn mở việc ngoài kế hoạch) và không bật tự áp chính sách chiến dịch.
- KHÔNG đồng bộ toàn bộ ROADMAP §2.5/§4 với thực tế — đó là hàng AU8; ở đây chỉ thêm ghi chú đầu §4 trỏ lộ trình.
- KHÔNG sửa `pipeline/mappings.yaml` hay code của các hàng PL/AU.

## Notes

- Thước đo: `scripts/check-lo-trinh.sh static|mutation` (biến `AG` chọn bản kit; mặc định bản cài mới nhất).
- Việc của người tách khỏi lộ trình (luật 17/10 của kit), liệt ở «Ra khỏi kho» của mô tả PR.
