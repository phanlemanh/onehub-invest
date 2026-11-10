---
schema_version: 2
feature_slug: s03-nap-ho-so
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 48a236bd0c0d1c4dae0d10e1fd31766debdb1f48
human_signoff:
---

# Evidence Report: s03-nap-ho-so

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: s03-nap-ho-so-E1-20261110T102626Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_test
  verified_at: 2026-11-10T10:26:26Z
  output: |
    ✔ HS-1 lượt 00:00: snapshot hồ sơ mới được nạp, con trỏ hồ sơ tiến, chuỗi tin chạy đủ, mã 0 (130.642667ms)
    ℹ tests 9
    ℹ pass 9
    ℹ fail 0
    ℹ skipped 0

- eval: E2
  run_id: s03-nap-ho-so-E2-20261110T102626Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_test
  verified_at: 2026-11-10T10:26:26Z
  output: |
    ✔ HS-2 Ngoài-6 thứ tự: DB thiếu 080 → GIỮ con trỏ hồ sơ, JOB FAIL nap-ho-so mã 4, chuỗi tin vẫn chạy; áp 080 rồi chạy lại → nạp đủ, không trùng (319.060542ms)
    ✔ HS-8 CHUA-AP-080 ở ĐẦU một đầu ra rất lớn (~1 MB) vẫn bị bắt: giữ con trỏ, mã 4 (review: SIGPIPE dưới pipefail) (244.226208ms)
    ℹ pass 9
    ℹ fail 0

- eval: E3
  run_id: s03-nap-ho-so-E3-20261110T102626Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_test
  verified_at: 2026-11-10T10:26:26Z
  output: |
    ✔ HS-3 con trỏ riêng: snapshot hồ sơ mốc CŨ hơn con trỏ tin vẫn được nạp; con trỏ tin không bị kéo theo (144.181667ms)
    ℹ pass 9
    ℹ fail 0

- eval: E4
  run_id: s03-nap-ho-so-E4-20261110T102626Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_test
  verified_at: 2026-11-10T10:26:26Z
  output: |
    ✔ HS-4 nạp hồ sơ hỏng → giữ con trỏ, JOB FAIL nap-ho-so mã 1, chuỗi tin vẫn chạy, khoá được nhả (137.180875ms)
    ℹ pass 9
    ℹ fail 0

- eval: E5
  run_id: s03-nap-ho-so-E5-20261110T102626Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_test
  verified_at: 2026-11-10T10:26:26Z
  output: |
    ✔ HS-5 lượt nhanh cũng nạp hồ sơ (để link hồ sơ lên trong ngày), vẫn bỏ đọc gộp + làm giàu (122.705542ms)
    ℹ pass 9
    ℹ fail 0

- eval: E6
  run_id: s03-nap-ho-so-E6-20261110T102626Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_test
  verified_at: 2026-11-10T10:26:26Z
  output: |
    ✔ HS-6 đối chứng: không có snapshot hồ sơ nào → không gọi nạp hồ sơ, con trỏ hồ sơ ở mốc gốc, mã 0 (140.877875ms)
    ✔ HS-7 snapshot hồ sơ đang ghi (thư mục .partial) không bị nạp (127.293125ms)
    ✔ HS-9 snapshot hồ sơ thiếu manifest: <30′ thì dừng, giữ con trỏ; ≥30′ (mồ côi) thì bỏ qua và nạp tiếp snapshot sau (234.569209ms)
    ℹ pass 9
    ℹ fail 0

- eval: E7
  run_id: s03-nap-ho-so-E7-20261110T102636Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_regress
  verified_at: 2026-11-10T10:26:36Z
  output: |
    ✔ PL34-AC-4 tập tệp: mọi tệp test nhắc {S03}-import-daily đúng bằng bảy tệp kê trước; thiếu một thì đỏ gọi tên (62.779167ms)
    ✔ ZJ-AC-7 sổ vận hành: dòng {S03}-import trong bảng job đêm, lệnh grep trỏ đúng log của plist (0.987541ms)
    ℹ tests 134
    ℹ pass 134
    ℹ fail 0
    ℹ skipped 0
    ℹ duration_ms 71254.253167

- eval: E8
  run_id: s03-nap-ho-so-E8-20261110T102629Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_scope
  verified_at: 2026-11-10T10:26:29Z
  output: |
    SCOPE OK
    (merge-base d7f86974 = #404 đã vào main → HEAD: ngoài _acceptance/, PRODUCT-MAP.md, LO-TRINH.html chỉ còn
     scripts/s03-nap-ho-so.test.mjs và scripts/{S03}-import-daily.sh — không dòng NGOAI PHAM VI)

## Known limits

- Hai snapshot hồ sơ cùng mốc ở hai thư mục thành phố khác nhau: nếu cái đầu nạp được, cái sau hỏng (hoặc gặp `CHUA-AP-080`) thì con trỏ đã bằng mốc chung, và lượt kế bỏ cái sau vì so `>` nghiêm ngặt (`scripts/{S03}-import-daily.sh:178`). Rủi ro thấp: collector API ghi hồ sơ theo một thành phố và mốc có mili-giây; vòng tin có cùng giới hạn.
- Vòng tin hỏng (`FAILED=1`, gồm cả snapshot tin thiếu manifest <30′) thoát ở `scripts/{S03}-import-daily.sh:154`, trước vòng hồ sơ, nên lượt đó không nạp hồ sơ. Không mất dữ liệu: con trỏ hồ sơ không đổi, lượt sau nạp bù.
- Bộ test không phủ nhánh `find` lỗi khi liệt kê snapshot hồ sơ (`HS_RC=3`, `scripts/{S03}-import-daily.sh:169`); nhánh này chỉ đọc qua code.

## Ngoài hợp đồng

## Analyst

Baseline khong do: E1–E6 — tệp `scripts/s03-nap-ho-so.test.mjs` chưa có trên diffBase d7f86974 (merge-base với origin/main sau khi #404 vào main; eval mới, chạy trên code cũ không chứng minh gì). E7, E8 là lệnh hồi quy và phạm vi, không đo baseline.

Kiểm lại phát hiện vòng 1 trên `git diff HEAD~6..HEAD -- scripts/` (commit 3ee9d09a):
- SIGPIPE ở kiểm `CHUA-AP-080` đã đóng. Dòng 194 nay so khớp trong shell (`[[ "$OUT" == *CHUA-AP-080* ]]`), không còn ống. Người chấm tái hiện bằng bash thật dưới `set -uo pipefail`, đầu ra 20.000 dòng với `CHUA-AP-080` ở dòng đầu: cách cũ (`printf | grep -q`) bắt được 0/5 lần, cách mới 5/5. HS-8 đặt đúng ca đó vào bộ test, qua node giả in khoảng 1 MB. `import_one` chạy trong thay thế lệnh và in bằng `cat`, nên đoạn đó không có ống bị đóng sớm. Các ống còn lại trong vòng hồ sơ (`echo "$ts" | grep -qE`, `printf '%s\n' "$HS_DIRS" | while read`) chỉ mang một dòng hoặc được đọc hết, nên không dính SIGPIPE.
- Mục Known limits vòng 1 «thiếu manifest thì chặn mãi mà không báo» đã hết: dòng 179–186 nay theo vòng tin. Thư mục mới hơn 30′ thì dừng và giữ con trỏ; từ 30′ trở lên thì coi là mồ côi, đặt `HS_MAX` bằng mốc của nó và đi tiếp. HS-9 phủ cả hai nhánh. `HS_MAX="$TS"` gán thẳng là đúng vì danh sách đã sắp tăng dần và chỉ xét mốc lớn hơn `HS_LAST`. Thay đổi này không sinh lỗi mới. Khi dừng vì thư mục <30′, vòng hồ sơ không bật `HS_RC`: đúng chữ AC-6 («dừng và giữ con trỏ»), và tự gỡ sau 30′.
- Mục «test không phủ đầu ra lớn» của vòng 1 đã có HS-8. Mục nhánh `find` lỗi vẫn chưa có test, nên giữ ở Known limits.

## Variance

none — mọi eval chạy một lần, tất định.

## Iterations

Round 1 (verified_commit 580fb821): E1–E8 đạt. Ngoài hợp đồng nêu rủi ro SIGPIPE ở kiểm `CHUA-AP-080` (`printf | grep -q` dưới pipefail làm lọt dòng CHUA khi đầu ra lớn). Known limits nêu: thiếu manifest thì chặn mà không báo, test không phủ đầu ra lớn, không phủ nhánh `find` lỗi, mốc trùng giữa hai thành phố, vòng tin hỏng thì hoãn hồ sơ. Đã trả về sửa (3ee9d09a).
Round 2 (verified_commit 48a236bd, sau khi gộp origin/main có #404): E1–E8 đạt, 9/9 ca hồ sơ và 134/134 ca hồi quy. SIGPIPE đã đóng (tái hiện: cách cũ 0/5, cách mới 5/5). Thiếu manifest xử như vòng tin. Còn ba giới hạn thấp ở Known limits.
