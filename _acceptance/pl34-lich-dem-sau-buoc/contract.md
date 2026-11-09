---
schema_version: 1
feature: Job nạp Zalo đêm chạy sáu bước — đọc gộp S03 hằng ngày sau nhả khoá nạp, trước enrich; bộ test job Zalo đo đúng bước mới
slug: pl34-lich-dem-sau-buoc
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
design_doc: docs/superpowers/specs/2026-11-09-pl34-lich-dem-sau-buoc-design.md
approved_by: Mạnh
approved_at: 2026-11-09
---

# Acceptance Contract: pl34-lich-dem-sau-buoc

Hàng `pl34-lich-dem-sau-buoc` của đợt dot0-cam-mau (giám sát giao 09/11): phần làn Claude của PL34 lịch đêm. Dòng
`job_run zalo-import-daily doc-gop-hang-ngay bash "$ROOT/pipeline/doc-gop-hang-ngay.sh"` là của ZCode (nhánh
`zcode/pl34-lich-dem` ＠3b7bc85c); hồ sơ này đo nó và thay lời «năm bước» của `enrich-chay-sau-nap/AC-6`.

## Acceptance Criteria

- **AC-1** — Given `scripts/zalo-import-daily.sh` với `node` giả, tệp giả `pipeline/doc-gop-hang-ngay.sh` gọi qua `node`
  giả, và một snapshot Zalo mới, When job chạy lành, Then dãy bước là import-airbnb · transform-zalo · transform-media ·
  refresh-bait-gap · doc-gop-hang-ngay · enrich-run; job thoát 0, không dòng `JOB FAIL`; `doc-gop-hang-ngay` chạy khi khoá
  nạp `pipeline/logs/apify-daily.state.lock` đã nhả; enrich-run chạy trong `agent/` với `LIMIT` = `ENRICH_LIMIT` khi có,
  ngược lại 50; khi nạp hỏng (job thoát 1 trước các bước) thì cả doc-gop-hang-ngay lẫn enrich-run không chạy; khi không có
  snapshot Zalo nào mới hơn state thì job bỏ bước nạp mà vẫn chạy năm bước sau, kể cả doc-gop-hang-ngay, và thoát 0. Thay
  lời `enrich-chay-sau-nap/AC-6`.
- **AC-2** — Given bước doc-gop-hang-ngay thoát n ≠ 0, When job kết thúc, Then stderr có đúng một dòng
  `JOB FAIL [zalo-import-daily] bước doc-gop-hang-ngay mã n`; enrich-run vẫn chạy; job thoát n khi các bước trước lành;
  khi một bước trước hỏng thì job thoát bằng mã của bước hỏng đầu tiên.
- **AC-3** — Given kho ở đầu nhánh, When đọc `scripts/zalo-import-daily.sh`, Then dòng `job_run … doc-gop-hang-ngay` trỏ
  `"$ROOT/pipeline/doc-gop-hang-ngay.sh"` và tệp ấy có trong kho; bản sao tệp bọc trỏ một đường không có trong kho thì
  phép đo đỏ, gọi tên đường đó. Chạy tệp thật đó trong cây job (gọi đúng như dòng `job_run`, `DOC_GOP_BAY_GIO` cố định,
  `node -e` chạy node thật, lời gọi còn lại qua node giả) thì nó gọi `scripts/doc-gop-s03.ts hang-ngay` đúng hai lần trong
  `agent/`: `--ngay` hôm qua rồi hôm kia theo giờ VN, `--tran-ngay-usd 20`, và thoát 0 khi hai lời gọi thoát 0.
- **AC-4** — Given mọi tệp test của kho nhắc `zalo-import-daily` — đúng bảy tệp kê trước: `scripts/` `zalo-import-job`,
  `enrich-buoc-job`, `nap-ts-order`, `zalo-import-job-lan`, `nap-argmax`; `pipeline/scripts/` `media-wiring`,
  `importer-bo-qua-du-lieu-thu` — When chạy trên đầu nhánh, Then cả bảy thoát 0 (kể cả ca ZL-AC-2 chạy lại test job Zalo
  trên nhánh ZCode giả sửa phần nạp), và tập tệp quét được bằng đúng tập kê trước.
- **AC-5** — Given PR gồm commit ZCode và phần làn Claude, When chạy `scripts/pre-merge-check.sh --base origin/main` lúc
  chấm, Then không có dòng `VIOLATION` nào ngoài đúng hai dòng chờ của chính hồ sơ này (`status=implemented but no
  evidence-report.md`, `verdict PASS but human_signoff is empty (Gate 2 pending)`) — không hồ sơ đã ký nào hoá cũ.

## Coverage

- Bỏ quét không gian AC: xem dòng sổ `descope` «bỏ coverage-scan». Không gian là một chiều — bốn tệp test đỏ đã kê đủ từ
  lần chạy thật 09/11 (11 ca), cộng bước mới hỏng/lành và đường tệp thật.

| Trục | Giá trị | AC |
|---|---|---|
| Job | lành · nạp hỏng · không snapshot mới · doc-gop hỏng · bước trước hỏng + doc-gop hỏng · khoá nạp khi doc-gop chạy | AC-1, AC-2 |
| Tệp bước | có trong kho · đường sai · tệp thật chạy trong cây job | AC-3 |
| Bộ test | bảy tệp nhắc tệp bọc · lưới trước-gộp | AC-4, AC-5 |

## Out of scope

- Dòng `job_run` trong `scripts/zalo-import-daily.sh` và lịch launchd — làn ZCode; hồ sơ này không sửa dòng đó.
- Bằng chứng đêm đầu: dòng `{"pl34": …}` usd ≤ 20 trong `pipeline/logs/zalo-import.log` — đo sau gộp, trên đêm thật.
- `scripts/apify-facebook-daily.sh` và nội dung `pipeline/doc-gop-hang-ngay.sh` không đổi.

## Notes

- Đêm không có snapshot Zalo mới thì job chỉ bỏ bước nạp; transform, đọc gộp và enrich vẫn chạy, nên đọc gộp chạy mọi đêm
  (AC-1). Bản nháp trước ghi nhầm «job thoát trước mọi bước» — đính chính ở S3 khi ca kiểm chạy trên tệp bọc thật (sổ `fix`).
- `pipeline/doc-gop-hang-ngay.sh` (ngoài phạm vi) cần `.env` ở gốc kho: thiếu tệp thì `/bin/bash` 3.2 với `set -u` báo
  `ENV_FILE[@]: unbound variable` và bước thoát lỗi. Máy thu có `.env` nên đêm thật không dính; ca PL34-AC-3 đặt `.env` vào
  cây như máy thu.
- Tiêu chí `enrich-chay-sau-nap/AC-6` (Mạnh ký 30/10) ghim «năm bước»; AC-1 thay lời ấy. E8, E11 của hồ sơ cũ vẫn chạy và
  thoát 0 nên không khai `superseded_by` (luật đó cho eval mất vật đo).
