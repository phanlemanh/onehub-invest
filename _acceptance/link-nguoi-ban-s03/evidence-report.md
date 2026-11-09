---
schema_version: 2
feature_slug: link-nguoi-ban-s03
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0610d52ab83f84b70485d4c9d449ca8e9ac7e1d4
human_signoff:
---

# Evidence Report: link-nguoi-ban-s03

Round 3. Nội dung thay toàn bộ round cũ; lịch sử các round nằm ở mục Iterations.

Lý do REJECT: mọi eval của hợp đồng (E1 đến E11a) đều xanh trên máy, nhưng hai lệnh suite không gắn eval đỏ là `cd app && npm test` và `cd pipeline && npm test`. Hai lệnh này nêu ở mục Lệnh suite bên dưới. Danh sách failed_evals để trống vì không eval nào của hợp đồng đỏ.

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
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |
| E11a | AC-11 | script | PASS |
| E11b | AC-11 | judgment | chờ người chốt (đề xuất PASS) |

## Evidence

- eval: E1
  run_id: minted-link-nguoi-ban-s03-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_tra
  verified_at: 2026-11-09T14:23:19Z
  output: |
    lệnh: node scripts/link-nguoi-ban-s03/acceptance.mjs tra
    chạy 1 lần, đạt 1/1, không phương sai

- eval: E2
  run_id: minted-link-nguoi-ban-s03-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_dung
  verified_at: 2026-11-09T14:23:19Z
  output: |
    lệnh: node scripts/link-nguoi-ban-s03/acceptance.mjs dung
    chạy 1 lần, đạt 1/1, không phương sai

- eval: E3
  run_id: minted-link-nguoi-ban-s03-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_thu
  verified_at: 2026-11-09T14:23:19Z
  output: |
    lệnh: node scripts/link-nguoi-ban-s03/acceptance.mjs thu
    chạy 1 lần, đạt 1/1, không phương sai

- eval: E4
  run_id: minted-link-nguoi-ban-s03-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_ranh_gioi
  verified_at: 2026-11-09T14:23:19Z
  output: |
    lệnh: node scripts/link-nguoi-ban-s03/acceptance.mjs ranh-gioi
    chạy 1 lần, đạt 1/1, không phương sai

- eval: E5
  run_id: minted-link-nguoi-ban-s03-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_api
  verified_at: 2026-11-09T14:23:19Z
  output: |
    lệnh: node scripts/link-nguoi-ban-s03/acceptance.mjs api
    ℹ duration_ms 110518.4615

- eval: E6
  run_id: minted-link-nguoi-ban-s03-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_db
  verified_at: 2026-11-09T14:23:19Z
  output: |
    ok   E6-nạp view mới_nhất giữ dòng mới nhất mỗi mã

- eval: E7
  run_id: minted-link-nguoi-ban-s03-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_lien_lac
  verified_at: 2026-11-09T14:23:19Z
  output: |
    lien-lac: 18 đạt · 0 hỏng

- eval: E8
  run_id: minted-link-nguoi-ban-s03-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_chon
  verified_at: 2026-11-09T14:23:19Z
  output: |
    chon: 14 đạt · 0 hỏng

- eval: E9
  run_id: minted-link-nguoi-ban-s03-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_tien_kiem
  verified_at: 2026-11-09T14:23:19Z
  output: |
    lệnh: node scripts/link-nguoi-ban-s03/acceptance.mjs tien-kiem
    chạy 1 lần, đạt 1/1, không phương sai

- eval: E10
  run_id: minted-link-nguoi-ban-s03-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_ten_nguon
  verified_at: 2026-11-09T14:23:19Z
  output: |
    ten-nguon: 11 đạt · 0 hỏng

- eval: E11a
  run_id: minted-link-nguoi-ban-s03-E11a-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_tai_lieu
  verified_at: 2026-11-09T14:23:19Z
  output: |
    tai-lieu: 20 đạt · 0 hỏng

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-link-nguoi-ban-s03-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-09T14:23:19Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-link-nguoi-ban-s03-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-09T14:23:19Z

- cmd: cd app && npm test
  run_id: minted-link-nguoi-ban-s03-SUITE-npm_test__bd9a35-r3
  exit_code: 1
  verified_at: 2026-11-09T14:23:19Z
  ghi chú: 1098 ca đạt, 1 ca hỏng, 5 bỏ qua. Ca hỏng là ON12-AC-5 «bảng kiểm chất lượng trên DB local diễn giải đủ» (app/tests/ops-nhan-theo-context.test.tsx dòng 352): các dòng kiểm do3-thay-doi và do3-kiem-nguoc trên DB local chưa có diễn giải. Không gắn eval nào.

- cmd: cd pipeline && npm test
  run_id: bxvq7pudk
  exit_code: 1
  verified_at: 2026-11-09T14:23:19Z
  ghi chú: 663 ca đạt, 1 ca hỏng, 1 bỏ qua. Ca hỏng là AC-3 «không còn khuôn cũ» (pipeline/scripts/entrypoint-symlink.test.mjs dòng 134): báo «AC-3 còn lối vào khuôn cũ: scripts/link-nguoi-ban-s03/tich-hop.mjs». Không gắn eval nào.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-link-nguoi-ban-s03-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-09T14:23:19Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-link-nguoi-ban-s03-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-09T14:23:19Z

### Phán đoán (judgment)

- eval: E11b
  judged_by: hội đồng judge (đề xuất, chưa có người chốt)
  proposal: PASS
  panel:
    - domain-correctness: PASS — Mục «Bộ tra hồ sơ người bán S03» ở runtime-map.md có đủ các bước lượt thử, đọc số đếm bốn loại và hai mã đối chứng, bảng xử từng mã tệp chặn, bảng trần, tắt bằng cách xoá `yeu-cau.json` hoặc đặt `chan.txt` không cần khởi động lại, lượt lớn chỉ Mạnh bật qua `luot-lon.txt`, cấm đăng nhập thứ hai, và đoạn «Chưa đo». Runbook trỏ đúng về runtime-map. `s03_ho_so_theo_tai_khoan` trong mappings.yaml khai đủ sáu điều kiện ADR-0011. CONTEXT.md có thuật ngữ «Username người bán».
    - operational-feasibility: PASS — Mục runtime-map có đủ các bước lượt thử, cách đọc số đếm, bảng xử từng mã tệp chặn, bảng trần, cách tắt không cần khởi động lại, chỉ Mạnh bật lượt lớn, cấm đăng nhập thứ hai. Mục «Chưa đo» liệt kê bốn điều chưa đo. Runbook trỏ về mục đó và thêm tiền kiểm. mappings.yaml khai đủ sáu điều kiện ADR-0011.
    - spec-alignment: PASS — runtime-map mục «Bộ tra hồ sơ người bán S03» có đủ các ý AC-11, gồm bảng trần, lượt thử năm bước, bảng xử từng mã tệp chặn, cách tắt, lượt lớn chỉ Mạnh bật, cấm đăng nhập thứ hai và mục «Chưa đo». `rule_id` trong mappings.yaml khai sáu điều kiện ADR-0011, CONTEXT có thuật ngữ «Username người bán».
  human_override:  # chi nguoi ghi

## Known limits

## Ngoài hợp đồng

## Analyst

carried tư round 1 — baseline khong do lai round nay

Không có eval nào bị liệt kê là không-phân-biệt. Hai lệnh suite hồi quy của app và pipeline đỏ không gắn eval (nêu ở mục Lệnh suite); không phải lỗi harness của eval nào.

## Variance

none — mọi eval chạy một lần và đồng nhất (không eval nào có runs lớn hơn 1).

## Iterations

Round 1: lịch sử round 1 giữ ở bản ghi cũ; baseline đo ở round này không lặp lại.
Round 3: mọi eval E1 đến E11a xanh, nhưng hai lệnh suite `cd app && npm test` và `cd pipeline && npm test` đỏ ngoài eval. Trả về triển khai.
