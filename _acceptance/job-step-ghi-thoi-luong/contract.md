---
schema_version: 1
feature: Ghi thời lượng từng bước của job nạp — job_step, job_run và buoc_nhanh in một dòng ghim JOB STEP ra stderr (job, bước, mã, giây, cột nhanh), kèm một bước gộp truoc-lan-claude đo phần lấy khoá và nạp của zalo-import-daily.sh; phép đo không mở hay ghi tệp nào
slug: job-step-ghi-thoi-luong
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [pipeline]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-16T10:18:23Z
design_doc: docs/superpowers/specs/2026-11-16-job-step-ghi-thoi-luong-design.md
approved_by:
approved_at:
---

# Acceptance Contract: job-step-ghi-thoi-luong

## Context

Lượt nạp S03 15′ đo 5′11″ / 5′22″ / 7′32″ ở ba lượt đầu (Nhật ký đợt 10/11 13:23Z), trong khi số đo trước khi bật
của `s03-len-nhanh-nac-1` là transform-zalo 62,4 s · transform-media 7,5 s · refresh-bait-gap 6,1 s ≈ 76 s. Chênh
nằm ở đâu thì không đọc được: `scripts/lib/job-step.sh` chỉ in dòng ghim khi bước HỎNG, log launchd không có mốc
giờ nào. Quyết định LT2 «transform tăng dần» chờ đúng con số này (Nhật ký 10/11: «cắt hàng job-step-ghi-thoi-luong
để đo từng bước; transform tăng dần (LT2) chờ số đo»).

Vòng này chỉ làm phép đo: thêm một dòng ghim `JOB STEP` ra stderr và một sổ JSONL
(`pipeline/logs/job-step.jsonl`, đổi đường bằng `JOB_STEP_SO`) cho mọi bước đi qua bộ chạy bước dùng chung, cộng
một bước gộp `truoc-lan-claude` đo phần lấy khoá + nạp của `zalo-import-daily.sh`. Không tối ưu bước nào, không
đổi hành vi, thứ tự hay mã thoát của bước nào.

Ranh giới làn: hàng được sửa `scripts/zalo-import-daily.sh`, nhưng chỉ phần DƯỚI dòng
`# Từ đây trở xuống là làn Claude (AU3 Ngoài-3)` — AC-6 của `s03-len-nhanh-nac-1` đã ghim rằng phần trên dòng ấy
không đổi so với merge-base. Phần trước làn Claude vẫn đo được từ dưới bằng `$SECONDS` của shell.

Căn cứ: AGENTS.md «Phân làn hai agent»; `_acceptance/s03-len-nhanh-nac-1/contract.md` (số đo + AC-6);
`onehub-invest-tri-thuc:wiki/dot/dat-lai-lo-trinh-1511.md` (việc nền làm khi chặn một lát).

## Criteria

- AC-1: Given một lệnh thoát mã 0 chạy qua `job_step <job> <nhãn> …`, When bước kết thúc, Then stderr có ĐÚNG MỘT
  dòng `JOB STEP [<job>] bước <nhãn> mã 0 giây <s>` với `<s>` là số nguyên ≥ 0, và KHÔNG có dòng `JOB FAIL` nào
  cho bước ấy; stdout của lệnh không thêm hay bớt byte nào so với khi gọi lệnh trực tiếp.
- AC-2: Given hai bước trong cùng một lượt — một bước ngủ ≥ 2 giây và một bước chạy tức thì, When cả hai chạy qua
  `job_step`, Then `<s>` của bước ngủ ≥ 2 ở cả dòng `JOB STEP` lẫn ô `giay` của sổ, còn `<s>` của bước tức thì ≤ 1:
  số là số đo thật, không phải hằng.
- AC-3: Given một lệnh thoát mã n ≠ 0 chạy qua `job_step`, Then `job_step` trả đúng n, và stderr mang dòng
  `JOB STEP [<job>] bước <nhãn> mã n giây <s>` TRƯỚC dòng `JOB FAIL [<job>] bước <nhãn> mã n`; dòng `JOB FAIL`
  nguyên văn như trước vòng (phép đo cũ `scripts/job-exit.test.mjs` vẫn xanh).
- AC-4: Given `job_run` gọi lần lượt một bước mã 0, một bước mã 3, một bước mã 4, Then `job_run` luôn trả 0,
  `JOB_RC` bằng 3 (mã hỏng ĐẦU TIÊN, không bị mã sau đè), và mỗi bước trong ba bước đều có đúng một dòng
  `JOB STEP` và đúng một dòng sổ.
- AC-5: Given ba bước chạy qua `job_step`, Then mỗi bước sinh đúng một dòng khớp NGUYÊN khuôn
  `JOB STEP [<job>] bước <nhãn> mã <n> giây <s> nhanh <c>` với `<n>`, `<s>`, `<c>` là số nguyên; và `<c>` = 1 khi
  `S03_LUOT_NHANH=1`, = 0 khi biến không đặt, = 0 khi biến đặt giá trị khác `1` (ví dụ `0`, `true`, chuỗi rỗng).
- AC-6: Given một lượt chạy một bước mã 0 và một bước mã 5 qua `job_step`, When lượt kết thúc, Then cây còn y
  nguyên — ảnh chụp (đường + cỡ + mtime của mọi tệp) trước và sau lượt cho 0 tệp mới và 0 tệp đổi; và khi chạy
  lại cùng lượt ấy với thư mục làm việc và `HOME` đều chmod 0o500 (chỉ đọc), hai bước vẫn trả đúng 0 và 5, cả
  hai dòng `JOB STEP` vẫn in ra stderr, stdout bằng ĐÚNG BYTE stdout của lượt thường, và đầu ra sạch chuỗi
  `Permission denied` lẫn `No such file`.
- AC-7: Given lượt nhanh `zalo-import-daily.sh --luot-nhanh` trên cây giả, When một bước transform (a) xong mã 0,
  (b) hỏng với đầu ra chứa `lock timeout`, (c) hỏng mã 3 vì lý do khác, Then mỗi kết cục sinh đúng một dòng
  `JOB STEP [zalo-import-daily] bước <nhãn> mã <0|1|3> giây <s> nhanh 1`; dòng
  `BỎ LƯỢT [zalo-import-daily] bước <nhãn>: đụng khoá — lượt sau làm` và dòng `JOB FAIL [zalo-import-daily] bước
  <nhãn> mã 3` giữ nguyên văn; mã thoát của tệp bọc ở cả ba kết cục bằng mã thoát trước vòng.
- AC-8: Given lượt nạp chạy qua dòng ranh giới làn Claude, Then stderr có ĐÚNG MỘT dòng
  `JOB STEP [zalo-import-daily] bước truoc-lan-claude …` đứng TRƯỚC mọi dòng `JOB STEP` của bước transform, với
  `giây` đo từ lúc tệp bọc khởi động (cấy một bước ngủ ≥ 2 giây vào vòng nạp thì `giây` ≥ 2; lượt không ngủ thì
  `giây` ≤ 1); và lưới phạm vi làn trên chính cây làm việc đạt: `git diff -U0 origin/main -- scripts/zalo-import-daily.sh`
  không có khối `@@` nào có dòng bắt đầu nhỏ hơn hay bằng số dòng của mốc `# Từ đây trở xuống là làn Claude`
  trong bản `origin/main`, và dòng mốc ấy còn nguyên trong cây.
- AC-9: Given cùng cây giả chạy một lượt nhanh rồi một lượt 00:00, Then dãy lời gọi của node giả (tín hiệu có ở
  CẢ bản `origin/main` lẫn bản sau vòng) và mã thoát của mỗi lượt giống hệt bản `origin/main` — lượt nhanh dừng
  sau `xep-hang-gia`, lượt 00:00 chạy tiếp `doc-gop-hang-ngay` và `enrich-run`; và trên tín hiệu riêng của bản
  sau vòng, mọi dòng `JOB STEP` của lượt nhanh mang `nhanh 1`, mọi dòng của lượt 00:00 mang `nhanh 0`, với
  `truoc-lan-claude` nêu tên là bước CHỈ có ở bản sau vòng nên nằm ngoài phép so đối chứng.
- AC-10: Given cây sau vòng, When chạy `scripts/job-exit.test.mjs`, `scripts/s03-nap-nhanh.test.mjs`,
  `scripts/zalo-import-job.test.mjs`, `scripts/zalo-import-job-nhe.test.mjs`, `scripts/enrich-buoc-job.test.mjs`,
  Then cả năm bộ đều xanh; và ĐÚNG HAI sửa đổi sau, không hơn, là phần của vòng (yêu cầu N1-87, giám sát duyệt
  16/11): (a) `scripts/job-exit.test.mjs` ca `AC-6 job_step` ô mã 0 nới từ «stderr chỉ có đầu ra của lệnh» thành
  «đầu ra của lệnh rồi ĐÚNG MỘT dòng `JOB STEP`» — hai ô mã 1 và mã 3 không đổi một byte; (b)
  `scripts/zalo-import-job.test.mjs` sổ `TEP_NHAC` thêm đúng một dòng cho `scripts/job-step-thoi-luong.test.mjs`
  và số đếm của `PL34-AC-4` đi từ 10 lên 11, logic quét không đổi. Mọi kỳ vọng khác của năm bộ giữ nguyên:
  `git diff origin/main -- scripts/job-exit.test.mjs scripts/zalo-import-job.test.mjs` chỉ chạm đúng hai chỗ ấy.

## Coverage

Quét bằng `morphological-scan` preset test-matrix; bảng trục, ô Core / Later / Never và thước CE đầy đủ ở
`docs/superpowers/specs/2026-11-16-job-step-ghi-thoi-luong-design.md` §6.

- Trục A — điểm ghi: `job_step` | `job_run` | `buoc_nhanh` | phần trước làn Claude
  [thước CE: bốn điểm gọi đếm được trong `scripts/lib/job-step.sh` + `scripts/zalo-import-daily.sh`]
- Trục B — kết cục bước: mã 0 | mã ≠ 0 | đụng khoá DB
  [thước CE: ba nhánh của `buoc_nhanh` và hai nhánh của `job_step` có sẵn trong mã]
- Trục C — đích ghi: dòng stderr | không đường ghi tệp nào | môi trường không ghi được
  [thước CE: lịch sử lỗi 0311-8 và 2510-8 — đường phụ hỏng từng làm job xanh giả / mất cả mẻ]
- Trục D — chế độ lượt: lượt nhanh | lượt 00:00 | job khác dùng chung `job-step.sh`
  [thước CE: `NHAN_DU` / `NHAN_NHANH` khai sẵn trong `scripts/s03-nap-nhanh.test.mjs`]

Không gian 108 ô, cắt theo lát của trục A. Chín ô Core ↔ AC-1..AC-9; AC-10 là lưới hồi quy của cross-cutting
«dòng cũ không đổi». Ô Later và Never nằm ở §6 của design doc và mục Out of scope dưới đây.

## Out of scope

- Tối ưu bất kỳ bước nào — LT2 «transform tăng dần» là hàng riêng, chờ số của hàng này.
- Bộ tổng hợp số (trung vị, p90 theo bước) thành script và màn hình đọc số — câu `grep` + `awk` một dòng trong
  design doc §4.4 đủ cho quyết định LT2.
- Sổ riêng cho thời lượng và mọi đường ghi tệp khác — hai plist đã đổ stderr vào log riêng của từng lượt nên sổ
  không thêm thông tin nào, chỉ thêm một bề mặt hỏng vào job nạp đêm (design doc §4.2).
- Ghi mili-giây — bước ở đây tính bằng chục giây tới phút; `date +%N` không có trên bash 3.2 của macOS.
- Đo riêng từng tệp trong năm tệp sản xuất khác đang nạp `job-step.sh` (danh sách đếm bằng máy ở design doc
  §4.3) — chúng đi qua cùng `job_step` nên phủ bởi AC-1..AC-4.
- Ghi thời lượng vào DB hay lên Ops; chạm phần thu / nạp của làn ZCode.

## Notes

Số đọc ra từ log launchd có sẵn: `pipeline/logs/s03-nap-15phut.log` (lượt nhanh) và `pipeline/logs/zalo-import.log`
(lượt 00:00) — cả `StandardOutPath` lẫn `StandardErrorPath` của hai plist đều trỏ vào đó.
