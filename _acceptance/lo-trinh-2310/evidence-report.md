---
schema_version: 2
feature_slug: lo-trinh-2310
verdict: PASS
failed_evals: []
reason: vòng 2 — 8/8 eval xanh trên d228ddc; baseline origin/main (eea7128) đỏ cả static lẫn mutation; bốn lỗ vòng 1 đã bịt (thử lại trên bản sao tạm)
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d228ddc126881c71fcd4306410890f458dabf912
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
  run_id: lo-trinh-2310-E1-20261023T074439
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_static
  verified_at: 2026-10-23T07:44:39Z
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
  run_id: lo-trinh-2310-E2-20261023T074441
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_static
  verified_at: 2026-10-23T07:44:41Z
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
  run_id: lo-trinh-2310-E3-20261023T074442
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_static
  verified_at: 2026-10-23T07:44:42Z
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
  run_id: lo-trinh-2310-E4-20261023T074443
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_static
  verified_at: 2026-10-23T07:44:43Z
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
  run_id: lo-trinh-2310-E5-20261023T074445
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_static
  verified_at: 2026-10-23T07:44:45Z
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
  run_id: lo-trinh-2310-E6-20261023T074446
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_static
  verified_at: 2026-10-23T07:44:46Z
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
  run_id: lo-trinh-2310-E7-20261023T074448
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_static
  verified_at: 2026-10-23T07:44:48Z
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
  run_id: lo-trinh-2310-E8-20261023T074449
  exit_code: 0
  baseline: red
  verifier: config:executors.script.lo_trinh_mutation
  verified_at: 2026-10-23T07:44:49Z
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

Baseline (worktree tạm `/tmp/claude-503/lt-base2` ở origin/main `eea7128`, chép `scripts/check-lo-trinh.sh` vào; đã gỡ):

```
$ bash scripts/check-lo-trinh.sh static          # rc=1
FAIL settings.json: thiếu road-map hoặc đổi thứ khác ngoài enabledPlugins
FAIL config: lo_trinh.tep = ''
FAIL config: LO-TRINH.html không nằm trong khối t1_skip_globs
FAIL lo-trinh-khoi-tao còn việc: kho chưa cài road-map ở phạm vi kho — không tạo lộ trình
FAIL product-map --check: PRODUCT-MAP.md khớp hồ sơ xưởng.
FAIL răng phủ pham-vi-phan-loai-2310.md: rc=2, phủ 0 mã, phạm vi  mã, cần 37;
FAIL răng phủ pham-vi-cam-mau-2310.md: rc=2, phủ 0 mã, phạm vi  mã, cần 14;
FAIL bản chép khác kit: scripts/lo-trinh.mjs / scripts/ho-so-tom-tat.cjs / scripts/gio-may.mjs / lib/chan-lo-trinh.cjs
FAIL quy định «một chỗ» thiếu ở AGENTS.md hoặc ROADMAP §0
LO-TRINH STATIC FAIL
$ bash scripts/check-lo-trinh.sh mutation        # rc=1
FAIL thiếu docs/plan/lo-trinh.json — thước đột biến không có gì để đo
LO-TRINH MUTATION FAIL
```

## Known limits

- Bước 1 (AC-1) so `.claude/settings.json` với `git merge-base HEAD origin/main`: chỉ có nghĩa khi nhánh chưa vào main. Sau merge, merge-base = HEAD nên khoá road-map đã có ở cả hai phía và phép so sẽ báo FAIL (cur bỏ khoá ≠ nền còn khoá) — thước này là thước của nhánh, không dùng lại làm kiểm hồi quy sau merge.
- Số mã 37/14 ghim cứng trong `EXPECT`; cắt lượt kế làm đổi số mã của bản phạm vi thì phải sửa script cùng lúc (đúng ý: răng phủ của kit tự nó không phát hiện mã bị xoá đồng thời ở cả hai phía — xem (a) bên dưới).
- Ghim `KIT_VER=2.33.1`: máy không còn bản cache 2.33.1 thì bước 3, 5, 6 và mutation đỏ dù kho đúng (đỏ đúng chiều, không xanh giả).
- Dòng «ok 4 bản chép kit trùng byte» chỉ in khi chưa bước nào trước đó FAIL (dùng chung biến `fail`) — chỉ ảnh hưởng chữ báo khi đã đỏ, không ảnh hưởng verdict.
- Đọc `t1_skip_globs` bằng awk theo thụt lề 2 dấu cách; đổi kiểu thụt lề của config sẽ làm bước này đỏ (đỏ đúng chiều).

## Ngoài hợp đồng

Thử lại bốn lỗ vòng 1 trên worktree tạm của HEAD (`/tmp/claude-503/lt-probe2`, detached d228ddc; kho chính không đổi; đã gỡ):

- (a) Xoá `C0.3` khỏi cả `docs/plan/pham-vi-phan-loai-2310.md` lẫn `PL3.phu`: `cat-luot.mjs` trần vẫn rc=0 (răng phủ kit không bắt), nhưng `static` đỏ — `FAIL răng phủ pham-vi-phan-loai-2310.md: rc=0, phủ 36 mã, phạm vi 36 mã, cần 37` → `LO-TRINH STATIC FAIL`. Lỗ đã bịt.
- (b) Xoá `docs/plan/lo-trinh.json` rồi chạy `mutation`: `FAIL thiếu docs/plan/lo-trinh.json — thước đột biến không có gì để đo` / `LO-TRINH MUTATION FAIL`, rc=1. Thêm (b2): xoá `pham-vi-cam-mau-2310.md` → cũng `MUTATION FAIL`. Ca đối chứng bản nguyên vẹn chạy xanh trước sáu ca đột biến (E8). Lỗ đã bịt.
- (c) Chuyển `- "LO-TRINH.html"` từ `t1_skip_globs` sang cuối `t3_paths`: `FAIL config: LO-TRINH.html không nằm trong khối t1_skip_globs` → `STATIC FAIL` (kèm `product-map --check` cũng báo thiếu miễn trừ). Thêm (c2): để dòng đó thành comment trong khối t1 → cũng đỏ. Lỗ đã bịt.
- (d) Bản kit: thước ghim `2.33.1` thay vì «bản mới nhất»; bốn bản chép trùng byte với 2.33.1 (E6). Lỗ đã bịt.
- `lo_trinh.tep` đọc bằng `scripts/lo-trinh-khoa.cjs` (bộ đọc khoá của kit) thay vì grep dòng.
