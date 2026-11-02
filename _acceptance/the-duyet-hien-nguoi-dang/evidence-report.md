---
schema_version: 2
feature_slug: the-duyet-hien-nguoi-dang
verdict: REJECT
failed_evals: [E12]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0de67894275100e0c78ad423a6988efb2ff6a85e
human_signoff:
---

# Evidence Report: the-duyet-hien-nguoi-dang

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-7 | test | PASS |
| E11 | AC-8 | test | PASS |
| E12 | AC-8 | ui-check | FAIL |
| E13 | AC-1 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-the-duyet-hien-nguoi-dang-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:16:31Z
  output: |
    ℹ duration_ms 2286.742459

- eval: E2
  run_id: minted-the-duyet-hien-nguoi-dang-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:16:31Z
  output: |
    ℹ duration_ms 2286.742459

- eval: E3
  run_id: minted-the-duyet-hien-nguoi-dang-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:16:31Z
  output: |
    ℹ duration_ms 2286.742459

- eval: E4
  run_id: minted-the-duyet-hien-nguoi-dang-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:16:31Z
  output: |
    ℹ duration_ms 2286.742459

- eval: E5
  run_id: minted-the-duyet-hien-nguoi-dang-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:16:31Z
  output: |
    ℹ duration_ms 2286.742459

- eval: E6
  run_id: minted-the-duyet-hien-nguoi-dang-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:16:31Z
  output: |
    ℹ duration_ms 2286.742459

- eval: E7
  run_id: minted-the-duyet-hien-nguoi-dang-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:16:31Z
  output: |
    ℹ duration_ms 2286.742459

- eval: E8
  run_id: minted-the-duyet-hien-nguoi-dang-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_so_song
  verified_at: 2026-11-02T03:16:31Z
  output: |
    ℹ duration_ms 2293.631209

- eval: E9
  run_id: minted-the-duyet-hien-nguoi-dang-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet
  verified_at: 2026-11-02T03:16:31Z
  output: |
    ℹ duration_ms 5033.377709

- eval: E10
  run_id: minted-the-duyet-hien-nguoi-dang-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-11-02T03:16:31Z
  output: |
    ℹ duration_ms 4102.774084

- eval: E11
  run_id: minted-the-duyet-hien-nguoi-dang-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:16:31Z
  output: |
    ℹ duration_ms 2286.742459

- eval: E13
  run_id: minted-the-duyet-hien-nguoi-dang-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.hd6_gate
  verified_at: 2026-11-02T03:16:31Z
  output: |
    design gate (jsdom) chạy trên review-card.tsx và review/review-compare.tsx, không vi phạm nào

- eval: E12
  run_id: minted-the-duyet-hien-nguoi-dang-E12-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-02T03:16:31Z
  screenshot: evidence/E12-step1.png
  observed: |
    E12-step1.png (khổ rộng 1440, sheet thẻ #105723 «Cùng căn?», Ghép căn, Chờ duyệt): hàng «Người đăng» đứng ĐẦU bảng so, trên Giá (đúng Hỏi-3 đầu bảng). Tin A hiển thị «—» ở chỗ tên, +84966574566, «1 tin đang rao», «Quan sát có trích dẫn · Bộ đọc tin» (CÓ SĐT nhưng KHÔNG có tên). Tin B: «Người bán huyện Bình Chánh», «Chưa có SĐT», Badge vàng «Đăng 2.872 tin», «Sự thật · Trường có cấu trúc của nguồn». Ô So = «Không so được» (viền xám), không phải «Lệch». Các hàng dưới vẫn Lệch/Khớp/Thiếu đúng chỗ. E12-step1-bang.png (ảnh riêng phần bảng): cùng nội dung. E12-step2.png (375px): bảng bốn cột trong sheet, hàng Người đăng vẫn đầu, Tin B có Badge «Đăng 2.872 tin», cột So bị cắt thành «Không s…» do bảng cuộn ngang bên trong khung của nó; trang không tràn ngang. Đối chiếu Expected: khớp mọi điểm TRỪ «Tin A có tên» — Tin A không có tên (seller_name trong sale_offers = 'unknown', UI hiện «—»).
  network_observed: no-app-traffic
  output: |
    Server dùng chung :3462 đã chạy sẵn; đăng nhập tài khoản vai ops, mở /ops/review, thẻ #105723 qua lọc Loại thẻ = Ghép căn.
    DB :5433 chỉ SELECT: 7 thẻ entity_match chờ; 4 thẻ có Tin B của tài khoản 2.872 tin, cùng một Tin A (nA=1, nB=2872).
    PASS hàng «Người đăng» là hàng đầu bảng; PASS Tin A có SĐT +84966574566.
    FAIL Tin A có tên: hiện «—». Gốc dữ liệu: S05 offer này có seller_name = 'unknown' (giá trị giữ chỗ). Cả 4 thẻ chờ có Tin B nghìn tin đều dùng cùng Tin A này, nên không thẻ thật nào đủ «Tin A có tên + SĐT» cùng «Tin B nghìn tin». Có thể là dữ liệu hoặc mẫu không khớp Expected; người ký quyết (đổi Expected hoặc dùng cặp dựng).
    PASS Tin B có tên «Người bán huyện Bình Chánh»; PASS «Chưa có SĐT»; PASS Badge «Đăng 2.872 tin»; PASS ô So = «Không so được», không phải «Lệch».
    PASS khổ 375px: trang không tràn ngang (bảng cuộn ngang nội bộ, cột So bị cắt «Không s…»).
    Mạng: không có fetch/XHR app, console không lỗi, 3 cảnh báo preload font; log ở evidence/E12-network.txt.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-duyet-hien-nguoi-dang-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-02T03:16:31Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-duyet-hien-nguoi-dang-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-02T03:16:31Z

- cmd: cd app && npm test
  run_id: minted-the-duyet-hien-nguoi-dang-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-02T03:16:31Z

- cmd: cd pipeline && npm test
  run_id: minted-the-duyet-hien-nguoi-dang-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-02T03:16:31Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-duyet-hien-nguoi-dang-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-02T03:16:31Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-duyet-hien-nguoi-dang-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-02T03:16:31Z

Lệnh suite đỏ không gắn eval: `cd app && npm test` (787 ca, 785 qua, 1 hỏng, 1 bỏ qua). Ca hỏng duy nhất là «ON12-AC-1 0 từ _Avoid_ trên chuỗi hiển thị của phạm vi quét» (tests/ops-nhan-theo-context.test.tsx), do `src/components/ops/labels/labels-view.tsx:74` còn chữ «không rõ» trong «nhóm không rõ». Tệp này không thuộc phần diff của tính năng. Lệnh `ui-check:E12` đỏ gắn với eval E12 (xem khối E12).

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »

none — moi eval feature deu red tren baseline (co phan biet) KHÔNG đo được ở round này vì baseline bị chặn hạ tầng; danh sách eval không-phân-biệt để trống.

Baseline khong do:
- cd app && node --import tsx --test tests/the-duyet-hien-nguoi-dang.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- cd app && node --import tsx --test tests/the-so-gia-tri-song.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- cd app && node --import tsx --test tests/the-duyet-du-can-cu.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- for f in app/src/components/ops/review-card.tsx app/src/components/ops/review/review-compare.tsx; do node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-gate.mjs)}/scripts/design-gate.mjs" --jsdom app "$f" || exit $?; done: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E12 failed — Tin A trên màn thật không có tên (seller_name của offer S05 là giá trị giữ chỗ 'unknown', UI hiện «—»), lệch với Expected «Tin A có tên và SĐT». Cả 4 thẻ chờ có Tin B nghìn tin dùng chung Tin A này. Returned to implementation / người ký quyết đổi Expected hoặc cặp mẫu.
