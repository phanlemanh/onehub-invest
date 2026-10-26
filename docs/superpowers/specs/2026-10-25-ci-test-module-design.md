# CI chạy typecheck và test từng module (AU11 · `ci-test-module`) — thiết kế

Hàng AU11 (`docs/plan/lo-trinh.json`, đợt `cam-mau-2310`, nhóm `nen-tang`, hạng T2 — `.github/workflows` ngoài
`t3_paths`). Câu giao: «CI chạy typecheck và test của app, pipeline, agent, data-api trên mọi PR». Ngưỡng (`bat_khi`):
«Cấy một lỗi kiểu ở mỗi module: CI đỏ đúng job». Điều phối duyệt Cổng Đáng `build` (P3-70) kèm: tính cả
`node --test scripts/*.test.mjs` (bài học 25/10: hai bộ test ở scripts/ đỏ trên main mà CI không bắt); ca cần DB chạy
trên service PostGIS dựng trong CI, không trỏ DB thật; không thêm khoá/secret mới khi chưa hỏi Mạnh.

## 1. Hiện trạng (main 7cef730)

CI chỉ có `acceptance-gate` (pre-merge-check + product-map) và `ui-lint` (lint + test luật onehub-ui). Không job nào chạy
`tsc` hay test của app, pipeline, agent, data-api, scripts.

Thăm dò S1 (docker tạm: PostGIS `kartoza/postgis:17-3.5` dựng từ `db/migrations`, node:22, `npm ci` sạch, git clone):

| Module | Typecheck | Test (ca đỏ / tổng) | Lý do đỏ |
|---|---|---|---|
| app | xanh (sau `next typegen`) | 15 / ~372 | 8 ca: bảng `area_sources` vắng · 7 ca: cần dữ liệu thật ở DB local (ruler P2, ảnh khu vực, kiểm chất lượng 7 ngày) |
| pipeline | — (JS) | 10 / ~65 | cần dữ liệu thật (ruler P2, tin nạp) · 1 ca `launchctl` (chỉ macOS) |
| agent | ĐỎ trên cài sạch | 1 / ~30 | thiếu `@types/json-schema` (TS7016 trong `@ai-sdk/provider`) · 1 ca cần tin thật |
| data-api | xanh | — (không có test) | — |
| scripts | — (JS) | ~10 / ~163 | đỏ sẵn trên main (GT-AC-1, job-exit — liên làn đang sửa) · `launchctl`/`playwright-cli` (máy local) |

Migration trên DB trống: `012` lỗi (`area_sources` không do migration nào tạo — bảng chỉ có ở DB local, 43 dòng) và `031`
lỗi (`invalid reference to FROM-clause entry`). Lệch schema ↔ migration là gốc của 8 ca app đỏ.

## 2. Thiết kế

1. **Workflow mới `.github/workflows/ci-test.yml`**: `on: pull_request` (không lọc paths — như `ui-lint`, để check không
   treo «Expected») và `push: branches: [main]`. Năm job tên theo module: `app`, `pipeline`, `agent`, `data-api`,
   `scripts`. Mỗi job: checkout, setup-node 24 (cache npm theo lockfile của module), `npm ci`, typecheck (TS), test.
   Không đọc `secrets.*` nào.
2. **Typecheck**: app `npx next typegen && npx tsc --noEmit`; agent `npx tsc --noEmit`; data-api `npm run typecheck`.
   pipeline và scripts là JS: chạy `node --check` trên mọi `.mjs` của module trước khi chạy test; «lỗi kiểu» ở hai module
   này nghĩa là gì — **Hỏi-4**.
3. **DB trong CI**: service `kartoza/postgis:17-3.5` (cùng ảnh local), `ports: 5433:5432`, user/pass/db `oneinvest` —
   khớp chuỗi kết nối mặc định mà test đang viết cứng (`localhost:5433/oneinvest`). Script `scripts/ci-db-init.sh`
   áp `db/migrations/*.sql` theo thứ tự, fail-closed: migration lỗi ngoài danh sách đã khai (012, 031) → job đỏ. Bảng
   thiếu theo **Hỏi-1**.
4. **agent**: thêm devDependency `@types/json-schema` để `tsc` xanh trên cài sạch (`skipLibCheck` sẽ giấu cả lỗi kiểu
   thật của thư viện khác).
5. **Ca test cần dữ liệu thật / công cụ máy local** theo **Hỏi-2**.
6. **Chứng «CI đỏ đúng job»** theo **Hỏi-3**.

## 3. Phép đo

1. **Tĩnh** (`scripts/check-ci-test.mjs`): workflow có 5 job đúng tên, đúng lệnh typecheck/test của từng module, trigger
   `pull_request` không `paths`, service PostGIS cổng 5433, không `secrets.`; chiều đỏ trên bản sao đột biến (bỏ job,
   thêm `paths`, thêm secret).
2. **Chạy lại cục bộ** (`scripts/ci-test-local.mjs`): rút từ workflow lệnh `run:`, `node-version`, `env`, `services`,
   `working-directory` của từng job; chạy `bash -eo pipefail` với `CI=true` trong docker (PostGIS kartoza + node dùng chung
   mạng `--network container:` nên `localhost:5433` như runner — không đụng DB thật :5433 của máy) trên một git clone sạch.
   Cả 5 job xanh; tập ca bỏ qua khớp danh sách viết trước. Lệch còn lại: arm64 (máy) so với amd64 (runner) — AC-8.
3. **Cấy lỗi từng module** (cùng script, chế độ `--cay`): app/agent/data-api một lỗi kiểu TS, pipeline/scripts một lỗi
   cú pháp `.mjs` → đúng job đó đỏ, bốn job còn lại xanh (ma trận 5×5 viết trước).
4. **CI thật** theo Hỏi-3.

## 4. Hỏi

- **Hỏi-1 — bảng `area_sources` (không migration nào tạo) trong DB của CI?** Khuyến nghị (a): `scripts/ci-db-init.sh`
  tạo bảng bằng `CREATE TABLE IF NOT EXISTS` đúng định nghĩa ở DB local (một tệp SQL riêng cho CI, ghi rõ «chờ migration
  vá»), và mở một hàng riêng viết migration vá (T3). Lối khác: (b) viết migration 041 ngay trong vòng này — sửa tận gốc
  nhưng nâng hàng lên T3 và chạm sổ số migration của điều phối liên làn; (c) để 8 ca đó đỏ/bỏ qua — mất test thật.
- **Hỏi-2 — ca test cần dữ liệu thật ở DB local hoặc công cụ chỉ có trên máy (launchctl, playwright-cli)?** Khuyến nghị
  (a): một helper chung (`CI=true` + điều kiện thiếu dữ liệu/công cụ) cho ca đó bỏ qua kèm lý do in ra; job in số ca bỏ
  qua, và ở máy local (không `CI`) ca vẫn chạy và vẫn đỏ như nay. Lối khác: (b) danh sách tệp test cho CI chạy — không
  sửa test nhưng tệp mới không tự vào CI; (c) CI chỉ typecheck, test giữ ở làn ghim lại local — rẻ nhất, trái câu giao.
- **Hỏi-4 — «lỗi kiểu» ở pipeline và scripts (JS, không có tsc) nghĩa là gì?** Khuyến nghị (b): một lỗi kiểu thật (gọi
  thuộc tính/hàm không tồn tại) cấy vào tệp có test phủ — bước test làm job đỏ; ma trận ghim tệp cấy, và in rõ rằng tệp
  không có test phủ thì CI không bắt. Lối khác: (a) chỉ lỗi cú pháp, bắt bằng `node --check` — rẻ nhưng không phải «lỗi
  kiểu»; (c) thêm `tsc --allowJs --checkJs` — bắt nhiều hơn nhưng nhiều lỗi sẵn có, việc lớn ngoài câu giao.
- **Hỏi-3 — chứng «CI đỏ đúng job» trên GitHub thật?** Khuyến nghị (a): workflow nhận thêm `push` cho nhánh
  `ci-probe/**`; máy đẩy năm nhánh thăm dò (mỗi nhánh một lỗi cấy), đọc kết quả bằng `gh run`, rồi xoá nhánh — đẩy lên
  kho công khai, lỗi cấy là mã hỏng có chủ đích, tồn tại vài phút. Lối khác: (b) chỉ chứng cục bộ bằng docker (§3.3) và
  CI thật chỉ chạy xanh trên PR này — không đụng GitHub nhưng «đỏ đúng job» chưa thấy trên CI thật; (c) mở năm PR nháp.

## 5. Không làm

- Bật các job mới thành check bắt buộc của branch protection — cài đặt GitHub của Mạnh.
- Sửa các ca đỏ sẵn trên main (GT-AC-1, job-exit) — nhánh `fix/test-scripts-do-sau-87-90` của liên làn; AU11 merge sau.
- Migration vá `area_sources` / `031` (theo Hỏi-1).
- Build/deploy app trên CI.
