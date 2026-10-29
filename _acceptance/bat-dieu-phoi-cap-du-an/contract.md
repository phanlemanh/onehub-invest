---
schema_version: 1
feature: Bật gói dieu-phoi ở cấp kho — thêm dieu-phoi@acceptance-gate-kit vào enabledPlugins của .claude/settings.json, cùng nguồn marketplace với các gói kit khác, không đổi gì khác
slug: bat-dieu-phoi-cap-du-an
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [config]
status: signed-off
approved_by: Mạnh
approved_at: 2026-10-29
design_doc: docs/superpowers/specs/2026-10-29-bat-dieu-phoi-cap-du-an-design.md
---

# Acceptance Contract: bat-dieu-phoi-cap-du-an

## Context

Mạnh «Duyệt cả 8» 29/10, hàng P3 `bat-dieu-phoi-cap-du-an`: chẩn đoán đợt báo «hook-phien thiếu» vì `.claude/settings.json`
của kho bật bốn gói kit mà thiếu `dieu-phoi`. Hạng T3 vì `.claude/settings.json` nằm trong `risk_tiers.t3_paths` (giám sát
xác nhận P3-108).

## Acceptance criteria

- AC-1: Given `.claude/settings.json` của nhánh và bản ở commit nền `0103d246`, When so, Then `enabledPlugins` có thêm đúng
  khoá `dieu-phoi@acceptance-gate-kit` = `true`, và bỏ khoá ấy đi thì hai bản giống hệt (quyền, hook, mọi khoá khác, thứ tự
  khoá giữ nguyên).
- AC-2: Given khoá mới, When đọc manifest marketplace `acceptance-gate-kit` (`~/.claude/plugins/marketplaces/acceptance-gate-kit/.claude-plugin/marketplace.json`, chỉ đọc), Then manifest có gói tên đúng `dieu-phoi`, hậu tố khoá trùng tên marketplace như bốn gói kit có sẵn, và nguồn `acceptance-gate-kit` trong `extraKnownMarketplaces` không đổi so với nền.
- AC-3: Given diff của nhánh từ `merge-base(origin/main, HEAD)`, When liệt kê tệp đổi ngoài `_acceptance/**`, `docs/**`, `PRODUCT-MAP.md`, `LO-TRINH.html`, Then tập ấy là tập con của {`.claude/settings.json`, `_acceptance/config.yaml`}, và `_acceptance/config.yaml` chỉ thêm đúng một dòng — khoá `executors.script.bdp_settings` (sau khi gộp, tập rỗng vẫn đạt).
- AC-4: Given thước của AC-1–AC-3 chạy trên dữ liệu bị phá — khoá mang giá trị `false`, thiếu khoá, đổi thêm một quyền, khoá mang hậu tố marketplace khác, khoá đúng hậu tố nhưng tên gói không có trong manifest, diff có thêm tệp `scripts/x.sh`, `config.yaml` thêm hai dòng — When chạy, Then mỗi bản phá đỏ với thông điệp gọi đúng chỗ sai; dữ liệu thật xanh trên cùng hàm.

## Coverage

Bỏ quét không gian tiêu chí — xem dòng sổ `descope` «bỏ coverage-scan». Trục tự kê: nội dung khoá (AC-1) × gói có thật
trong marketplace (AC-2) × phạm vi thay đổi của nhánh (AC-3) × chiều đỏ của thước (AC-4) × hiệu lực trên phiên mới (OOS-1,
Hỏi-1 ở Cổng Phạm vi).

## Out of scope

- OOS-1: Máy không đo hiệu lực trên phiên mới (`chan-doan --phien` ra `hook-phien du`) ở lượt chấm — người kiểm ở Cổng Bằng
  chứng bằng một phiên mới trên máy chưa bật `dieu-phoi` ở phạm vi user (theo khuyến nghị Hỏi-1; Mạnh chọn khác thì sửa).
- OOS-2: Không sửa `scripts/check-lo-trinh.sh` (ca settings so merge-base, đỏ trên nhánh, tự xanh sau gộp) — hồ sơ riêng.
- OOS-3: Không đổi `~/.claude/settings.json` hay cấu hình máy nào khác (không có thước máy cho vế này — tệp nằm ngoài kho).

## Notes

- Ranh giới hàng: `.claude/settings.json`; thêm `_acceptance/config.yaml` một dòng (giám sát duyệt P3-109).
- Known limits — chọn ở Cổng Bằng chứng 2026-10-29:
  - Ngoài-1: thẻ Cổng Phạm vi hiện AC-4 bằng chữ hợp đồng chưa dịch (bản dịch xếp nhầm vào wont_do trong card-plain.json).
  - Ngoài-2: bản phá «tên gói lạ» chỉ đỏ ở phép so tên cứng `dieu-phoi`; chưa có bản phá chứng minh riêng vế tra tên gói trong manifest.
