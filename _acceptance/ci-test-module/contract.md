---
schema_version: 1
feature: CI chạy typecheck và test của app, pipeline, agent, data-api trên mọi PR
slug: ci-test-module
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: verified
approved_by: Mạnh
approved_at: 2026-10-25
design_doc: docs/superpowers/specs/2026-10-25-ci-test-module-design.md
lo_trinh_ma: AU11
---

# Acceptance Contract: ci-test-module

## Context

Hàng AU11 (Audit P21: CI chỉ có gate và ui-lint). «Năm job» = `app`, `pipeline`, `agent`, `data-api`, `scripts` trong
`.github/workflows/ci-test.yml`. «Chạy lại cục bộ» = rút lệnh `run:` của từng job từ chính tệp workflow, chạy trong docker
(PostGIS `kartoza/postgis:17-3.5` + node, mạng riêng — không đụng DB thật :5433 của máy) trên một git clone sạch. «Lỗi
cấy» = app/agent/data-api: một lỗi kiểu TS; pipeline/scripts: một lỗi cú pháp `.mjs`. Thăm dò và ba câu Hỏi ở design doc
§1, §4.

## Criteria

- AC-1: Given `.github/workflows/ci-test.yml`, When đọc tĩnh, Then có đúng năm job tên module, trigger đúng tập theo
  Hỏi-3 (khuyến nghị: `pull_request` không lọc `paths`, `push` nhánh `main` và `ci-probe/**`, không gì khác), không tham
  chiếu `secrets.`, không `continue-on-error` / `|| true` / `if:` trên bước typecheck hay test, và mọi job gọi
  `ci-db-init.sh` có khối `services` PostGIS `kartoza/postgis:17-3.5` cổng `5433:5432` kèm healthcheck; chiều đỏ: bản sao
  bỏ một job / thêm `paths` / thêm `push` `'**'` / thêm `secrets.X` / thêm `continue-on-error` / đổi cổng service → luật
  gọi tên.
- AC-2: Given workflow, When đọc lệnh của từng job, Then job TS chạy typecheck của module (app `next typegen` + `tsc`,
  agent `tsc`, data-api `npm run typecheck`), job JS chạy `node --check` trên mọi `.mjs` của module, và job có test chạy
  đúng lệnh test của module (`npm test` ở app/pipeline/agent, `node --test scripts/*.test.mjs`); chiều đỏ: bản sao đổi
  lệnh test thành `true` → luật báo job.
- AC-3: Given một PostGIS dùng một lần dựng trong docker (không bao giờ :5433 của máy), When `scripts/ci-db-init.sh` chạy
  trên DB trống, Then áp mọi `db/migrations/*.sql` theo thứ tự, bảng thiếu theo Hỏi-1, migration lỗi ngoài danh sách đã
  khai làm script thoát ≠ 0 gọi tên tệp, và mỗi migration trong danh sách đã khai được in là còn lỗi thật (áp xanh →
  thoát ≠ 0 «danh sách cũ»); chiều đỏ: migration giả lỗi → thoát ≠ 0 gọi tên; DB đích đã có bảng ở schema public →
  thoát ≠ 0, không áp gì.
- AC-4: Given ca test cần dữ liệu thật ở DB local hoặc công cụ chỉ có trên máy, When chạy với `CI=true` trên DB trống,
  Then ca đó xử lý theo Hỏi-2 (khuyến nghị: bỏ qua kèm lý do, job in số ca bỏ qua) và ở máy local (không `CI`) ca vẫn chạy
  như cũ; tập ca được bỏ qua là danh sách viết trước `scripts/ci-bo-qua.json` (tệp · tên ca · lý do, rút từ thăm dò §1),
  không chứa ca đỏ sẵn trên main (GT-AC-1, job-exit); chiều đỏ: cùng ca không `CI` trên DB trống → vẫn đỏ (helper không
  nuốt lỗi ở local); một lời gọi helper ngoài danh sách → helper thoát lỗi gọi tên ca.
- AC-5: Given `agent` cài sạch (`npm ci`), When `npx tsc --noEmit`, Then exit 0; chiều đỏ: bản cây thiếu
  `@types/json-schema` → TS7016.
- AC-6: Given một git clone sạch của nhánh, đứng trên main đã có bản sửa liên làn `fix/test-scripts-do-sau-87-90`, When
  chạy lại cục bộ cả năm job — lệnh, `node-version`, `env`, `services`, `working-directory` rút từ chính workflow, chạy
  `bash -eo pipefail` với `CI=true`, node dùng chung mạng với PostGIS — Then năm job exit 0, in bảng cấu hình đã dùng,
  thời gian và số ca test/bỏ qua từng job, và tập ca bỏ qua thực tế khớp đúng `scripts/ci-bo-qua.json`.
- AC-7: Given năm bản clone, mỗi bản cấy một lỗi vào đúng một module (loại lỗi ở pipeline/scripts theo Hỏi-4; tệp cấy
  ghim trước), When chạy lại cục bộ năm job trên mỗi bản, Then ma trận 5×5 viết trước: đúng job của module bị cấy đỏ ở
  bước ghi trước, bốn job còn lại xanh (in cả ma trận).
- AC-8: Given CI thật trên GitHub (runner ubuntu amd64 — khác kiến trúc máy local, đo ở đây), When nhánh của vòng này chạy
  trên main đã có bản sửa liên làn, Then năm job xanh; và «đỏ đúng job» trên CI thật theo Hỏi-3 (khuyến nghị: năm nhánh
  `ci-probe/<module>` đẩy lên rồi xoá, đọc kết quả bằng `gh run`; nếu chọn chỉ cục bộ thì ngưỡng SỐNG đo bằng AC-7 và
  `opportunity.md` ghi rõ điều đó).

## Coverage

Trục: {module: app, pipeline, agent, data-api, scripts} × {bước: typecheck, test, DB} × {đo: tĩnh, chạy lại cục bộ, cấy
lỗi, CI thật}. AC-1/AC-2 tĩnh; AC-3 DB; AC-4 ca cần dữ liệu thật; AC-5 agent cài sạch; AC-6 xanh cục bộ; AC-7 ma trận cấy
lỗi 5×5 (loại lỗi JS theo Hỏi-4); AC-8 CI thật (gồm khác kiến trúc arm64/amd64).

## Đường đo

- «Cấy một lỗi kiểu ở mỗi module: CI đỏ đúng job» — AC-7 (cục bộ, ma trận 5×5), AC-8 (CI thật theo Hỏi-3).
- «CI chạy typecheck và test … trên mọi PR» — AC-1, AC-2 (tĩnh), AC-6 (chạy thật), AC-8 (PR thật).

## Out of scope

- Bật năm job thành check bắt buộc trong branch protection (cài đặt GitHub của Mạnh).
- Sửa các ca đỏ sẵn trên main (GT-AC-1, job-exit) — nhánh `fix/test-scripts-do-sau-87-90` của liên làn; AU11 merge sau nó.
- Migration vá `area_sources` / `031` (theo Hỏi-1).
- Build/deploy app trên CI.

## Notes

- Không thêm secret nào vào workflow (điều phối 25/10, P3-70).
- Chạy lại cục bộ chạy trên arm64 (máy local), CI thật trên amd64 — lệch gói native chỉ AC-8 bắt được.
