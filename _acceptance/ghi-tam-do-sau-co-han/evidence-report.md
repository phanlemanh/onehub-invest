---
schema_version: 2
feature_slug: ghi-tam-do-sau-co-han
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1b25bca464992d97cfe3e47a0cbe1b94cb5bab60
human_signoff: Mạnh 2026-11-27
---

# Evidence Report: ghi-tam-do-sau-co-han

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
| E10 | AC-10 | judgment | PASS (đề xuất của hội đồng, chờ người chốt ở Cổng 2) |

## Evidence

- eval: E1
  run_id: minted-ghi-tam-do-sau-co-han-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T09:13:17Z
  output: |
    đỏ đúng AC-1 «trả lại dòng mã toà của luật»: AC-1 ô loại=true toà=true: lời nhắc còn dòng «Mã tòa phát hiện»

- eval: E2
  run_id: minted-ghi-tam-do-sau-co-han-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T09:13:17Z
  output: |
    đỏ đúng AC-2 «bỏ dấu danh sách toà»: AC-2 tin C (danh sách toà) route corroborated

- eval: E3
  run_id: minted-ghi-tam-do-sau-co-han-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T09:13:17Z
  output: |
    đỏ đúng AC-3 «bỏ kiểm DB đã áp 129»: AC-3 DB chưa 129

- eval: E4
  run_id: minted-ghi-tam-do-sau-co-han-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/ban-chep.sh
  verified_at: 2026-11-27T09:13:17Z
  output: |
    đỏ đúng AC-4 «đảo doc_lap lô đọc toàn bộ»: lô doc-toan-bo-loai-hinh doc_lap lệch — lô: doc-toan-bo-loai-hinh=1993:false:14 truoc-doc-lap-loai-hinh=187:false:14 truoc-doc-lap-toa=110:false:14

- eval: E5
  run_id: minted-ghi-tam-do-sau-co-han-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T09:13:17Z
  output: |
    đỏ đúng AC-5 «rút bỏ lọc theo lô»: AC-5 số giá trị rút

- eval: E6
  run_id: minted-ghi-tam-do-sau-co-han-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T09:13:17Z
  output: |
    đỏ đúng AC-6 «xử lại trích dẫn bỏ xét trường dừng»: AC-6 xử lại trích dẫn vẫn ghi tạm khi lô quá hạn

- eval: E7
  run_id: minted-ghi-tam-do-sau-co-han-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T09:13:17Z
  output: |
    đỏ đúng AC-7 «đạt mà không thôi cờ»: AC-7 lô đạt mà giá trị còn cờ hoặc bị rút

- eval: E8
  run_id: minted-ghi-tam-do-sau-co-han-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T09:13:17Z
  output: |
    đỏ đúng AC-8 «bỏ điều kiện ghi tạm ở B3»: AC-8 căn lên bậc nhờ loại hình ghi tạm

- eval: E9
  run_id: minted-ghi-tam-do-sau-co-han-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T09:13:17Z
  output: |
    đỏ đúng AC-9 «áp corroborated khi ô dừng»: AC-9 áp corroborated khi ô dừng

- eval: E10
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment)
  verdict: PASS
  rationale: Ba thấu kính cùng đề xuất PASS, xem mục Judge panel bên dưới. Đây là đề xuất, người chốt ở Cổng 2.
  human_override: Mạnh 2026-11-27 — Đạt

### Judge panel E10 (đề xuất)

- domain-correctness: PASS — Tệp ap-may-thu.md có đủ năm thứ. (1) Mục 1 có lệnh pull từ main rồi áp 129 bằng psql trong một giao dịch. (2) Mục 2 có bảng chạy thử trên bản chép, khớp 1.993 · 187 · 110 của AC-4, kèm kết quả áp lần hai không đổi. (3) Mục 3 có pg_dump `enrichment_proposals` và lệnh chép thân hai hàm bị vá. (4) Mục 4 có lệnh lùi `lui-129.sql` và kết quả đã chạy trên bản chép: bảng `ghi_tam_lo` đã gỡ, cột `lo_id`/`ghi_tam` còn 0. (5) Mục 5 có truy vấn kiểm sau áp và số mong đợi: ba lô đúng số, hạn bằng ngày áp + 14, không ô nào dừng, cột đầu của truy vấn đêm kế bằng 0. Lens này chỉ đọc tệp này và contract.md, không mở `evidence/m5-probe-fe6c96e69.txt` nên không đối chiếu được các số đó với tệp bằng chứng.
- operational-feasibility: PASS — ap-may-thu.md có đủ năm thứ. Mục 1 có lệnh áp 129 từ main. Mục 2 có số chạy thử 1.993 · 187 · 110 khớp AC-4, kèm tham chiếu tệp bằng chứng. Mục 3 có lệnh sao lưu. Mục 4 có lệnh lùi và số đã chạy thử trên bản chép (bảng ghi_tam_lo đã gỡ, cột lo_id/ghi_tam còn 0). Mục 5 có lệnh kiểm sau áp kèm số mong đợi. Lens này không mở tệp bằng chứng được tham chiếu vì nó nằm ngoài danh sách input.
- spec-alignment: PASS — Tệp ap-may-thu.md có đủ cả năm thứ. (1) Mục 1 có lệnh áp 129 từ main bằng `psql -1`. (2) Mục 2 có bảng chạy thử trên bản chép DB máy thu, ba lô 1.993, 187 và 110 khớp AC-4, kèm kết quả áp lần hai. (3) Mục 3 có lệnh `pg_dump` bảng `enrichment_proposals` và lệnh chép thân hai hàm bị vá. (4) Mục 4 có lệnh lùi bằng `lui-129.sql`, và ghi kết quả đã chạy thử trên bản chép (bảng `ghi_tam_lo` đã gỡ, cột `lo_id`/`ghi_tam` còn 0). (5) Mục 5 có lệnh kiểm sau khi áp và số mong đợi: ba lô đúng số, hạn bằng ngày áp cộng 14, cột đầu của truy vấn đêm kế bằng 0.

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-ghi-tam-do-sau-co-han-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-27T09:13:17Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-ghi-tam-do-sau-co-han-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-27T09:13:17Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-ghi-tam-do-sau-co-han-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-27T09:13:17Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-ghi-tam-do-sau-co-han-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-27T09:13:17Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-ghi-tam-do-sau-co-han-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-27T09:13:17Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-ghi-tam-do-sau-co-han-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-27T09:13:17Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-ghi-tam-do-sau-co-han-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-27T09:13:17Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 2 trên 715362cc2 (--no-carry); soát 715362cc2-20261127T155515 chỉ đỏ QV-AC-5. Suite agent chạy trong vòng trên đúng loại DB của vòng 1 — db-thu --chay chép DB oneinvest của M5, bản chép máy thu CHƯA áp migration 129 (không có bảng ghi_tam_lo) — thoát 0: SL1-AC-11 nay xanh (vòng 1 đỏ hai ca, N1 vá coLopGhiTam). pipeline_that chạy NGOÀI vòng (HT37): 37/37, fail 0, «bỏ qua 1 ca chỉ máy thu» → ĐẠT; chấm trên M5: ON22-AC-10 không chạy (HT33) — evidence/m5-ngoai-vong-r2.txt. Mọi eval E1–E9 PASS, mọi suite thoát 0; E10 đề xuất PASS chờ người (T3) → PENDING-JUDGMENT. Hai finding medium AC-6 của vòng 1 đã đóng; vòng này không có finding trong hợp đồng. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Mọi eval ghi baseline: n-a vì round này không đo.

Không có eval nào bị liệt kê là không-phân-biệt. Lệnh suite xanh cả hai phía là regression-guard bình thường.

## Variance

none — mọi eval chạy một lần, kết quả đồng nhất.

## Iterations

Round 1: lịch sử xem run-log.jsonl.
Round 2: chín eval máy E1–E9 đạt, bảy lệnh suite đạt; E10 là mục judgment, hội đồng đề xuất PASS, chờ người chốt (human_override để trống) nên verdict là PENDING-JUDGMENT.

### Re-pin lần 1 — 2026-11-28, do ghim lại bằng làn eval
run_id: repin-20261128T091354Z-86616
sha: 1b25bca464992d97cfe3e47a0cbe1b94cb5bab60 · suites: 8 lệnh exit 0 · evals: 9/9 eval máy đạt kỳ vọng · ngoài làn máy: E10 (E10 không khai paths) · AC không có chốt máy: AC-10
