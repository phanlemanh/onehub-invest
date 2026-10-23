---
schema_version: 2
feature_slug: lo-trinh-2310
verdict: PASS
failed_evals: []
reason: vòng 3 — 8/8 eval xanh trên 9f23bf7; baseline origin/main (eea7128) đỏ cả static lẫn mutation; thước AC-1 đã sửa chạy được sau merge (giả lập base=HEAD và gộp thật đều ok) và vẫn đỏ khi đổi khoá quyền chưa commit
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9f23bf7eed49a043edc08eab0a5e80441ff23f4b
human_signoff:
---

# Evidence Report: lo-trinh-2310

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: lo-trinh-2310-E1-20261023T074645
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_static
  verified_at: 2026-10-23T07:46:45Z
  output: |
    $ bash scripts/check-lo-trinh.sh static
    ok   settings.json: bật road-map@acceptance-gate-kit, quyền/hook/khác giữ nguyên như nền
    ok   config: lo_trinh.tep = docs/plan/lo-trinh.json (đọc bằng bộ đọc khoá của kit)
    ok   config: LO-TRINH.html trong t1_skip_globs
    ok   lo-trinh-khoi-tao chạy lại: không đổi gì
    ok   product-map --check: PRODUCT-MAP + LO-TRINH khớp
    ok   răng phủ pham-vi-phan-loai-2310.md: xanh, 37 mã (đúng 37), 0 lỗi, 0 cảnh báo
    ok   răng phủ pham-vi-cam-mau-2310.md: xanh, 14 mã (đúng 14), 0 lỗi, 0 cảnh báo
    ok   4 bản chép kit trùng byte với 2.33.1
    ok   quy định: AGENTS.md đầu tệp + ROADMAP §0 trỏ docs/plan/lo-trinh.json
    LO-TRINH STATIC PASS

- eval: E2
  run_id: lo-trinh-2310-E2-20261023T074646
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_static
  verified_at: 2026-10-23T07:46:46Z
  output: |
    $ bash scripts/check-lo-trinh.sh static
    ok   settings.json: bật road-map@acceptance-gate-kit, quyền/hook/khác giữ nguyên như nền
    ok   config: lo_trinh.tep = docs/plan/lo-trinh.json (đọc bằng bộ đọc khoá của kit)
    ok   config: LO-TRINH.html trong t1_skip_globs
    ok   lo-trinh-khoi-tao chạy lại: không đổi gì
    ok   product-map --check: PRODUCT-MAP + LO-TRINH khớp
    ok   răng phủ pham-vi-phan-loai-2310.md: xanh, 37 mã (đúng 37), 0 lỗi, 0 cảnh báo
    ok   răng phủ pham-vi-cam-mau-2310.md: xanh, 14 mã (đúng 14), 0 lỗi, 0 cảnh báo
    ok   4 bản chép kit trùng byte với 2.33.1
    ok   quy định: AGENTS.md đầu tệp + ROADMAP §0 trỏ docs/plan/lo-trinh.json
    LO-TRINH STATIC PASS

- eval: E3
  run_id: lo-trinh-2310-E3-20261023T074648
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_static
  verified_at: 2026-10-23T07:46:48Z
  output: |
    $ bash scripts/check-lo-trinh.sh static
    ok   settings.json: bật road-map@acceptance-gate-kit, quyền/hook/khác giữ nguyên như nền
    ok   config: lo_trinh.tep = docs/plan/lo-trinh.json (đọc bằng bộ đọc khoá của kit)
    ok   config: LO-TRINH.html trong t1_skip_globs
    ok   lo-trinh-khoi-tao chạy lại: không đổi gì
    ok   product-map --check: PRODUCT-MAP + LO-TRINH khớp
    ok   răng phủ pham-vi-phan-loai-2310.md: xanh, 37 mã (đúng 37), 0 lỗi, 0 cảnh báo
    ok   răng phủ pham-vi-cam-mau-2310.md: xanh, 14 mã (đúng 14), 0 lỗi, 0 cảnh báo
    ok   4 bản chép kit trùng byte với 2.33.1
    ok   quy định: AGENTS.md đầu tệp + ROADMAP §0 trỏ docs/plan/lo-trinh.json
    LO-TRINH STATIC PASS

- eval: E4
  run_id: lo-trinh-2310-E4-20261023T074649
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_static
  verified_at: 2026-10-23T07:46:49Z
  output: |
    $ bash scripts/check-lo-trinh.sh static
    ok   settings.json: bật road-map@acceptance-gate-kit, quyền/hook/khác giữ nguyên như nền
    ok   config: lo_trinh.tep = docs/plan/lo-trinh.json (đọc bằng bộ đọc khoá của kit)
    ok   config: LO-TRINH.html trong t1_skip_globs
    ok   lo-trinh-khoi-tao chạy lại: không đổi gì
    ok   product-map --check: PRODUCT-MAP + LO-TRINH khớp
    ok   răng phủ pham-vi-phan-loai-2310.md: xanh, 37 mã (đúng 37), 0 lỗi, 0 cảnh báo
    ok   răng phủ pham-vi-cam-mau-2310.md: xanh, 14 mã (đúng 14), 0 lỗi, 0 cảnh báo
    ok   4 bản chép kit trùng byte với 2.33.1
    ok   quy định: AGENTS.md đầu tệp + ROADMAP §0 trỏ docs/plan/lo-trinh.json
    LO-TRINH STATIC PASS

- eval: E5
  run_id: lo-trinh-2310-E5-20261023T074650
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_static
  verified_at: 2026-10-23T07:46:50Z
  output: |
    $ bash scripts/check-lo-trinh.sh static
    ok   settings.json: bật road-map@acceptance-gate-kit, quyền/hook/khác giữ nguyên như nền
    ok   config: lo_trinh.tep = docs/plan/lo-trinh.json (đọc bằng bộ đọc khoá của kit)
    ok   config: LO-TRINH.html trong t1_skip_globs
    ok   lo-trinh-khoi-tao chạy lại: không đổi gì
    ok   product-map --check: PRODUCT-MAP + LO-TRINH khớp
    ok   răng phủ pham-vi-phan-loai-2310.md: xanh, 37 mã (đúng 37), 0 lỗi, 0 cảnh báo
    ok   răng phủ pham-vi-cam-mau-2310.md: xanh, 14 mã (đúng 14), 0 lỗi, 0 cảnh báo
    ok   4 bản chép kit trùng byte với 2.33.1
    ok   quy định: AGENTS.md đầu tệp + ROADMAP §0 trỏ docs/plan/lo-trinh.json
    LO-TRINH STATIC PASS

- eval: E6
  run_id: lo-trinh-2310-E6-20261023T074652
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_static
  verified_at: 2026-10-23T07:46:52Z
  output: |
    $ bash scripts/check-lo-trinh.sh static
    ok   settings.json: bật road-map@acceptance-gate-kit, quyền/hook/khác giữ nguyên như nền
    ok   config: lo_trinh.tep = docs/plan/lo-trinh.json (đọc bằng bộ đọc khoá của kit)
    ok   config: LO-TRINH.html trong t1_skip_globs
    ok   lo-trinh-khoi-tao chạy lại: không đổi gì
    ok   product-map --check: PRODUCT-MAP + LO-TRINH khớp
    ok   răng phủ pham-vi-phan-loai-2310.md: xanh, 37 mã (đúng 37), 0 lỗi, 0 cảnh báo
    ok   răng phủ pham-vi-cam-mau-2310.md: xanh, 14 mã (đúng 14), 0 lỗi, 0 cảnh báo
    ok   4 bản chép kit trùng byte với 2.33.1
    ok   quy định: AGENTS.md đầu tệp + ROADMAP §0 trỏ docs/plan/lo-trinh.json
    LO-TRINH STATIC PASS

- eval: E7
  run_id: lo-trinh-2310-E7-20261023T074653
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_static
  verified_at: 2026-10-23T07:46:53Z
  output: |
    $ bash scripts/check-lo-trinh.sh static
    ok   settings.json: bật road-map@acceptance-gate-kit, quyền/hook/khác giữ nguyên như nền
    ok   config: lo_trinh.tep = docs/plan/lo-trinh.json (đọc bằng bộ đọc khoá của kit)
    ok   config: LO-TRINH.html trong t1_skip_globs
    ok   lo-trinh-khoi-tao chạy lại: không đổi gì
    ok   product-map --check: PRODUCT-MAP + LO-TRINH khớp
    ok   răng phủ pham-vi-phan-loai-2310.md: xanh, 37 mã (đúng 37), 0 lỗi, 0 cảnh báo
    ok   răng phủ pham-vi-cam-mau-2310.md: xanh, 14 mã (đúng 14), 0 lỗi, 0 cảnh báo
    ok   4 bản chép kit trùng byte với 2.33.1
    ok   quy định: AGENTS.md đầu tệp + ROADMAP §0 trỏ docs/plan/lo-trinh.json
    LO-TRINH STATIC PASS

- eval: E8
  run_id: lo-trinh-2310-E8-20261023T074654
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_mutation
  verified_at: 2026-10-23T07:46:54Z
  output: |
    $ bash scripts/check-lo-trinh.sh mutation
    ok   đối chứng: bản nguyên vẹn xanh
    ok   đỏ: bỏ mã L19a khỏi PL1 (mã không có chỗ)
    ok   đỏ: mã A1.2 nằm ở hai hàng
    ok   đỏ: việc nền AU1 mất bat_khi
    ok   đỏ: PL7 câu giao không mở bằng vai
    ok   đỏ: PL9 dùng dữ liệu giả mà không đứng trên hàng sinh
    ok   đỏ: AU9 cỡ 14 tiêu chí (phải tách)
    bắt 6/6 bản đột biến
    LO-TRINH MUTATION PASS

Baseline (worktree tạm `/tmp/claude-503/lt-base3` ở origin/main `eea7128`, chép `scripts/check-lo-trinh.sh` vào; đã gỡ):

```
$ bash scripts/check-lo-trinh.sh static          # rc=1
FAIL settings.json: thiếu road-map hoặc đổi thứ khác ngoài enabledPlugins
FAIL config: lo_trinh.tep = ''
FAIL config: LO-TRINH.html không nằm trong khối t1_skip_globs
FAIL lo-trinh-khoi-tao còn việc: kho chưa cài road-map ở phạm vi kho — không tạo lộ trình
FAIL product-map --check: PRODUCT-MAP.md khớp hồ sơ xưởng.
grep: docs/plan/pham-vi-phan-loai-2310.md: No such file or directory
FAIL răng phủ pham-vi-phan-loai-2310.md: rc=2, phủ 0 mã, phạm vi  mã, cần 37;
grep: docs/plan/pham-vi-cam-mau-2310.md: No such file or directory
FAIL răng phủ pham-vi-cam-mau-2310.md: rc=2, phủ 0 mã, phạm vi  mã, cần 14;
FAIL bản chép khác kit: scripts/lo-trinh.mjs
FAIL bản chép khác kit: scripts/ho-so-tom-tat.cjs
FAIL bản chép khác kit: scripts/gio-may.mjs
FAIL bản chép khác kit: lib/chan-lo-trinh.cjs
FAIL quy định «một chỗ» thiếu ở AGENTS.md hoặc ROADMAP §0
LO-TRINH STATIC FAIL
$ bash scripts/check-lo-trinh.sh mutation        # rc=1
FAIL thiếu docs/plan/lo-trinh.json — thước đột biến không có gì để đo
LO-TRINH MUTATION FAIL
```

## Known limits

- Sau merge, bước 1 (AC-1) so `.claude/settings.json` với `git merge-base HEAD origin/main` = HEAD, tức chỉ so cây làm việc với commit hiện tại: bắt được đổi quyền/hook **chưa commit** và mất khoá road-map, nhưng một thay đổi quyền **đã commit** lên main về sau vẫn xanh (thử (C) dưới). Trên main, AC-1 là kiểm «road-map còn bật + không trôi cục bộ», không phải kiểm hồi quy quyền so với nền trước nhánh.
- Số mã 37/14 ghim cứng trong `EXPECT`; cắt lượt kế làm đổi số mã của bản phạm vi thì phải sửa script cùng lúc.
- Ghim `KIT_VER=2.33.1`: máy không còn bản cache 2.33.1 thì bước 3, 5, 6 và mutation đỏ dù kho đúng (đỏ đúng chiều, không xanh giả).
- Dòng «ok 4 bản chép kit trùng byte» chỉ in khi chưa bước nào trước đó FAIL (dùng chung biến `fail`) — chỉ ảnh hưởng chữ báo khi đã đỏ, không ảnh hưởng verdict.
- Đọc `t1_skip_globs` bằng awk theo thụt lề 2 dấu cách; đổi kiểu thụt lề của config sẽ làm bước này đỏ (đỏ đúng chiều).
- Baseline in thêm dòng `grep: … No such file or directory` ra stderr khi thiếu tệp phạm vi — chỉ là nhiễu chữ, verdict vẫn đỏ.

## Ngoài hợp đồng

Phản biện điểm vừa sửa (bỏ khoá road-map ở cả hai phía khi so settings) trên worktree tạm của HEAD (`/tmp/claude-503/lt-probe3`, detached 9f23bf7; kho chính không đổi; đã gỡ, không còn nhánh tạm):

- (A) Giả lập sau merge: sửa dòng `base=` của bản script chép trong worktree tạm thành `base=HEAD`, commit tạm (`7ee55c3`) → `static` rc=0, `ok settings.json: … giữ nguyên như nền`, `LO-TRINH STATIC PASS`. Known limit cũ (sau merge báo FAIL) đã hết.
- (B) Cùng nền `base=HEAD`, bỏ `permissions.deny[0]` (`Read(**/.env)`) chưa commit → `FAIL settings.json: thiếu road-map hoặc đổi thứ khác ngoài enabledPlugins` / `LO-TRINH STATIC FAIL`, rc=1. (B2) thêm cả một `allow` lạ → cũng đỏ. (D) bỏ khoá road-map → đỏ.
- (C) Commit luôn thay đổi (B) rồi chạy lại với `base=HEAD` → `ok settings.json` / `STATIC PASS` — đúng như Known limit 1: sau merge thước chỉ bắt trôi chưa commit.
- (E) Gộp thật bằng script gốc (không sửa `base=`): detached ở origin/main `eea7128`, `merge --no-ff 9f23bf7` → merge-base HEAD origin/main = `eea7128` → `ok settings.json`, `STATIC PASS`, rc=0.
- Ghi chú sổ: dòng cuối `decisions.jsonl` (`d-20261023T080500Z-5`, `at` 08:05:00Z) có giờ muộn hơn đồng hồ máy lúc chấm vòng 3 (07:46Z) — giờ ghi tay đặt trước, không ảnh hưởng verdict nhưng làm lệch thứ tự thời gian trong sổ.
