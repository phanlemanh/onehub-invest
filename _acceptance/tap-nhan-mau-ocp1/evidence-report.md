---
schema_version: 2
feature_slug: tap-nhan-mau-ocp1
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f595ecf65069e1d41293362030392adefab8acad
human_signoff: Mạnh 2026-10-30
---

# Evidence Report: tap-nhan-mau-ocp1

Round 2. Mọi eval máy đều xanh; còn một mục judgment (E9) chờ người ở Cổng 2.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | script | PASS |
| E9 | AC-9 | judgment | UNCERTAIN |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-tap-nhan-mau-ocp1-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnm_pipeline
  verified_at: 2026-10-30T11:11:13Z
  output: |
    node --test pipeline/lib/tap-mau.test.mjs
    ℹ duration_ms 792.494542

- eval: E2
  run_id: minted-tap-nhan-mau-ocp1-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnm_pipeline
  verified_at: 2026-10-30T11:11:13Z
  output: |
    node --test pipeline/lib/tap-mau.test.mjs
    ℹ duration_ms 792.494542

- eval: E3
  run_id: minted-tap-nhan-mau-ocp1-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnm_app
  verified_at: 2026-10-30T11:11:13Z
  output: |
    cd app && node --import tsx --test tests/labels-mau.test.tsx
    ℹ duration_ms 93.766083

- eval: E4
  run_id: minted-tap-nhan-mau-ocp1-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnm_pipeline
  verified_at: 2026-10-30T11:11:13Z
  output: |
    node --test pipeline/lib/tap-mau.test.mjs
    ℹ duration_ms 792.494542

- eval: E5
  run_id: minted-tap-nhan-mau-ocp1-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tnm_db
  verified_at: 2026-10-30T11:11:13Z
  output: |
    node _acceptance/tap-nhan-mau-ocp1/probes/db.mjs
    doi chung: MAU LOT VAO STG (cau dem bat 1 dong)

- eval: E6
  run_id: minted-tap-nhan-mau-ocp1-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tnm_db
  verified_at: 2026-10-30T11:11:13Z
  output: |
    node _acceptance/tap-nhan-mau-ocp1/probes/db.mjs
    doi chung: MAU LOT VAO STG (cau dem bat 1 dong)

- eval: E7
  run_id: minted-tap-nhan-mau-ocp1-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnm_pipeline
  verified_at: 2026-10-30T11:11:13Z
  output: |
    node --test pipeline/lib/tap-mau.test.mjs
    ℹ duration_ms 792.494542

- eval: E8
  run_id: minted-tap-nhan-mau-ocp1-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tnm_pipeline
  verified_at: 2026-10-30T11:11:13Z
  output: |
    node --test pipeline/lib/tap-mau.test.mjs
    ℹ duration_ms 792.494542

- eval: E8b
  run_id: minted-tap-nhan-mau-ocp1-E8b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tnm_db
  verified_at: 2026-10-30T11:11:13Z
  output: |
    node _acceptance/tap-nhan-mau-ocp1/probes/db.mjs
    doi chung: MAU LOT VAO STG (cau dem bat 1 dong)

- eval: E10
  run_id: minted-tap-nhan-mau-ocp1-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tnm_pham_vi
  verified_at: 2026-10-30T11:11:13Z
  output: |
    bash _acceptance/tap-nhan-mau-ocp1/probes/pham-vi.sh
    PHAM VI OK

### Judgment (E9)

Đề xuất panel (máy chỉ đề xuất, người quyết). Ba góc nhìn:

- domain-correctness: UNCERTAIN — Đọc chữ của cả 40 tin theo bảng «Trường lõi». Dự án và toà ghi như tin viết và đúng chữ thường. Giá đúng VND, một giá thì min = max, khoảng giá đúng (ví dụ 5,9–6 tỷ, 2,65–2,85 tỷ). Diện tích, phòng ngủ và «tin không nêu» đều khớp chữ. Không thấy trường nào sai rõ. Còn hai chỗ chưa kết luận được. (1) mau-ocp1-kiem-4 và mau-ocp1-kiem-23, trường property_type: «CĂN BIỆT THỰ» được gắn `house`, nhưng sổ từ vựng trục property_type (vocab.generated.ts) không nằm trong input nên không biết có mã riêng như villa hay không. (2) mau-ocp1-kiem-17, trường building: «Căn H2» được gắn `h2`, nhưng chữ có thể hiểu là mã căn hoặc toà H2. Các tin cùng khuôn (kiem-16, kiem-35) ghi rõ «Vinhomes Ocean Park - H2» và `h2` ở đó đúng.
- operational-feasibility: UNCERTAIN — Không thấy tin nào có trường sai rõ ràng so với bảng «Trường lõi» PL7. Giá, diện tích, số phòng ngủ, đổi VND, min = max và «tin không nêu» đều khớp với chữ trong 40 tin. Nhưng có hai nhóm tin mà chữ có hai cách hiểu và thiết kế không nói cách hiểu nào đúng. (1) Giá trong tin tìm mua/tìm thuê (inquiry), trường `price_min_vnd` và `price_max_vnd`: chữ ghi ngân sách của khách («tc 9 triệu», «tài chính 5,8 tỷ», «tc 10.000.000»), chưa chắc là giá tin; mẫu gắn thành min = max nhưng có thể gắn «tin không nêu» hoặc coi là trần ngân sách (tin mau-ocp1-kiem-0, -9, -19, -28, -38). (2) Trường `building` khi chữ viết «Căn <mã>»: tin -17 («Căn H2»), -36 («Căn PR2») và -7 («căn 3PN GÓC, PR6»); mẫu gắn mã đó là toà (h2, pr2, pr6), nhưng «Căn» có thể là mã căn, và thiết kế để mã căn ra ngoài phạm vi. Điểm nhỏ: `area_m2` ở tin ghi «99.5m», «90.5m», «52.5m», «82.5m» (tin -8, -24, -32, -34) không có «²»; mẫu hiểu là m², hợp lý nên không tính là sai.
- spec-alignment: PASS — Đọc đủ 40 tin trong mau-kiem.jsonl, đối chiếu bảng «Trường lõi» của design PL7: giá quy VND đúng (một giá thì min = max, giá khoảng giữ đủ hai đầu), dự án và toà ghi như tin viết bằng chữ thường, trường nào chữ không nêu thì để «không nêu». Không có tin nào có trường sai, và không có chữ nào hiểu được hai cách.

- eval: E9
  judged_by: judge-panel (fresh context), đề xuất UNCERTAIN
  verdict: UNCERTAIN
  rationale: Hai trong ba góc nhìn không dám kết luận: chưa rõ «CĂN BIỆT THỰ» thuộc mã house hay mã riêng, «Căn <mã>» là toà hay mã căn, và ngân sách trong tin inquiry có tính là giá hay là «tin không nêu». Không góc nhìn nào chỉ ra trường sai rõ ràng; góc spec-alignment cho PASS.
  required_evidence:
    - Sổ từ vựng trục property_type trong app/src/lib/vocab.generated.ts (đưa vào input của eval). Nếu có mã riêng cho biệt thự, như villa, thì kiem-4 và kiem-23 sai; nếu biệt thự thuộc house thì hai tin này đúng.
    - Hướng dẫn gắn nhãn hoặc quy ước của lát OCP1 nói «Căn H2/PR2» gắn vào building hay không (tài liệu vận hành đưa vào input), để chốt kiem-17 và kiem-36 «Căn PR2» không có hai cách hiểu.
    - Quyết định của Mạnh, ghi vào docs/superpowers/specs/2026-10-30-man-gan-nhan-mu-design.md mục «Trường lõi», về việc ngân sách trong tin inquiry («tc», «tài chính») có tính là giá `price_min_vnd`/`price_max_vnd` hay là «tin không nêu»; có quy tắc này thì phán được tin -0, -9, -19, -28, -38.
    - Quy tắc trong cùng tài liệu về «Căn <mã>» (vd «Căn H2», «Căn PR2»): mã đó là `building` hay là mã căn để ngoài phạm vi; có quy tắc này thì phán được tin -7, -17, -36.
    - Bằng chứng một người gắn độc lập, không thấy cột `nhan`, đã gắn lại 5 tin inquiry có giá và 3 tin «Căn <mã>» ở trên, so khớp với `nhan` hiện có (ví dụ kết quả `pipeline/label-agreement.mjs --lat ocp1` trên các tin này). Nếu họ gắn khớp thì ra PASS.
  human_override: Mạnh 2026-10-30 — Đạt

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-tap-nhan-mau-ocp1-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-30T11:11:13Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-tap-nhan-mau-ocp1-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-30T11:11:13Z

- cmd: cd app && npm test
  run_id: minted-tap-nhan-mau-ocp1-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-30T11:11:13Z

- cmd: cd pipeline && npm test
  run_id: minted-tap-nhan-mau-ocp1-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-30T11:11:13Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-tap-nhan-mau-ocp1-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-30T11:11:13Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-tap-nhan-mau-ocp1-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-30T11:11:13Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Moi field baseline la n-a; danh sach eval khong-phan-biet ben duoi KHONG do duoc o round nay.

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline): none — không có eval nào bị đánh dấu xanh-cả-hai (baseline không đo được nên chưa khẳng định được tính phân biệt của từng eval).

### Baseline khong do

- node --test pipeline/lib/tap-mau.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && node --import tsx --test tests/labels-mau.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node _acceptance/tap-nhan-mau-ocp1/probes/db.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash _acceptance/tap-nhan-mau-ocp1/probes/pham-vi.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic, không có phương sai).

## Iterations

Round 1: REJECT — suite app đỏ (nhánh lệch sau main) và hai phép đo âm tính đứng một mình (E6 danh sách tên, E8b nhánh canonical) thiếu đối chứng dương. Returned to implementation.
Round 2: PENDING-JUDGMENT — mọi eval máy xanh trên f595ecf6 (đã thêm đối chứng dương cho E6 và vế canonical của E8b); E9 chờ người quyết ở Cổng 2.
