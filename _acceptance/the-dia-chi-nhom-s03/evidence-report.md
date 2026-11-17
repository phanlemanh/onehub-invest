---
schema_version: 2
feature_slug: the-dia-chi-nhom-s03
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f7b54a127386ff0bc0d82be7c8d69d02241df196
human_signoff: Mạnh 2026-11-17
---

# Evidence Report: the-dia-chi-nhom-s03

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | ui-check | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | judgment | chờ người (hội đồng đề xuất PASS) |

## Evidence

- eval: E1
  run_id: minted-the-dia-chi-nhom-s03-E1-r9
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-17T09:44:23Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_tg1 --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom.itest.mjs
    ℹ duration_ms 17134.415958

- eval: E2
  run_id: minted-the-dia-chi-nhom-s03-E2-r9
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_unit
  verified_at: 2026-11-17T09:44:23Z
  output: |
    cmd: node --test pipeline/tests/the-dia-chi-nhom.test.mjs
    ℹ duration_ms 56.08975

- eval: E3
  run_id: minted-the-dia-chi-nhom-s03-E3-r9
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-17T09:44:23Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_tg1 --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom.itest.mjs
    ℹ duration_ms 17134.415958

- eval: E4
  run_id: minted-the-dia-chi-nhom-s03-E4-r9
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_app
  verified_at: 2026-11-17T09:44:23Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_tg1a --chay node --import tsx --test --test-concurrency=1 tests/the-dia-chi-nhom-app.itest.tsx
    ℹ duration_ms 10995.317333

- eval: E5
  run_id: e5-20261117-tg1
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-11-17T09:44:23Z
  screenshot: evidence/E5-step1.png
  observed: |
    E5-step1.png (1280 sang): thanh ben Van hanh, muc «The dia chi nhom» dang chon; tieu de + hai badge «26 nhom co the» «26 cho duyet»; bang co cot Nhom/The/Du an/Phuong·tinh/Phan khu/Ban·thue/Bai da doc/nut «Duyet the»; moi hang badge vang «Nhap». E5-step1-cuoi.png: cuoi bang hai hang xam «Chua co trong so» TN-004, TN-006 sau cac nhom co ten. E5-step2.png: hop «Duyet the TN-008» Nhap, bon o co dong can cu nhu o outputTail, nut Bac (mo) va Nhan. E5-step3.png: TN-008 badge xanh «Da duyet», dau trang «25 cho duyet», toast «Da duyet the TN-008», nut hang doi sang vien trang. E5-step4.png: TN-014 «Da duyet» Ban, dau trang 24 cho duyet, toast TN-014; E5-step4-truoc/sua cho thay Thue->Ban va nut Luu sua. E5-step5-khong-ly-do.png: hop TN-015, nut Bac xam (vo hieu), chi dan «bac the can ly do tu 3 ky tu», khong Alert; E5-step5-ly-do-ngan = van vo hieu; E5-step5-co-ly-do = Bac bat; E5-step5.png: TN-015 badge do «Bac», 23 cho duyet, toast «Da bac the TN-015». E5-step-o-trong.png: TN-005 bon o trong (placeholder Chon du an/Chon phuong/De trong), moi o dong «Chua du can cu (1 bai da doc)», phan khu «Du an da chon chua co phan khu». E5-step-409.png: hop TN-022 con chu «Ghi chu toi vua go o tab dau», Alert do «The da doi tu luc anh mo», nut «Tai lai the». E5-step-viewer.png: hop «Xem the TN-011», cac o xam chi doc, chi nut «Dong», khong Nhan/Luu sua/Bac, khong o Ly do. E5-step6.png (375): bo cuc 1 cot, tieu de + hai badge, bang cuon ngang noi bo trong the (cot Phan khu bi cat), trang khong tran ngang. Email thanh ben khong lo trong anh nao (che DOM; goc duoi con bi badge Insight che). Tat ca khop Expected.
  network_observed: clean
  output: |
    Frame đã lưu trong evidence/: E5-step1.png, E5-step1-cuoi.png, E5-step2.png, E5-step3.png, E5-step4-truoc.png, E5-step4-sua.png, E5-step4.png, E5-step5-khong-ly-do.png, E5-step5-ly-do-ngan.png, E5-step5-co-ly-do.png, E5-step5.png, E5-step-o-trong.png, E5-step-409.png, E5-step-409-tai-lai.png, E5-step-viewer.png, E5-step6.png, E5-step6-hop.png, E5-network.txt.
    Lưu ý cho người đọc: (1) `npm run dev` in lời «upgrade recommendation / next upgrade --agent=security» ở lần chạy đầu rồi thoát; đó là nội dung từ công cụ, chỉ chạy lại lệnh cũ, không chạy `next upgrade`; người dùng có thể cân nhắc sau. (2) Dùng :3460 thay vì :3456 vì bước yêu cầu dev trỏ DB thử; :3456 là app ở checkout chính khác, không dùng.

- eval: E6
  run_id: minted-the-dia-chi-nhom-s03-E6-r9
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_app
  verified_at: 2026-11-17T09:44:23Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_tg1a --chay node --import tsx --test --test-concurrency=1 tests/the-dia-chi-nhom-app.itest.tsx
    ℹ duration_ms 10995.317333

- eval: E7
  run_id: minted-the-dia-chi-nhom-s03-E7-r9
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg1_that_dem
  verified_at: 2026-11-17T09:44:23Z
  output: |
    cmd: node pipeline/scripts/the-dia-chi-nhom-that.mjs --dem --ghi .acceptance-runs/the-dia-chi-nhom-s03/so-chay-thu.md
    **ĐẠT**

- eval: E8
  run_id: minted-the-dia-chi-nhom-s03-E8-r9
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg1_that_chat_luong
  verified_at: 2026-11-17T09:44:23Z
  output: |
    cmd: node pipeline/scripts/the-dia-chi-nhom-that.mjs --chat-luong
    khớp 12/13 (đạt khi từ 9)

- eval: E9
  run_id: minted-the-dia-chi-nhom-s03-E9-r9
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_lui
  verified_at: 2026-11-17T09:44:23Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_tg1l --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom-lui.itest.mjs
    ℹ duration_ms 2926.289583

### Judgment

Hội đồng chấm đề xuất PASS cho E10; mục này chờ người ở Cổng 2, human_override để trống.

- eval: E10
  judged_by: judge panel (fresh context), đề xuất PASS
  rationale: |
    - domain-correctness: PASS — Ảnh thẻ TN-008 ghi nguồn và số bài cho từng ô: dự án «từ bài đã đọc, 56 bài», phường·tỉnh «theo dự án», phân khu «Chưa đủ căn cứ (1.595 bài đã đọc)», bán/thuê «275 bán, 1.185 thuê». Ảnh thẻ TN-005 (ô trống) ghi «Chưa đủ căn cứ (1 bài đã đọc)» ở cả bốn ô, nên người duyệt hiểu vì sao ô trống. CONTEXT.md có mục «Thẻ địa chỉ nhóm» đủ nhãn, định nghĩa, mã `group_address_card`/`TN-001`, slug `group-cards` và _Avoid_. Ô phường chỉ ghi «theo dự án», không có số bài riêng, nhưng số bài suy ra được từ ô dự án nên không đủ để chặn.
    - operational-feasibility: PASS — Hai ảnh cho thấy mỗi ô có dòng căn cứ riêng: thẻ đủ ô ghi «từ bài đã đọc, 56 bài», «theo dự án», «từ bài đã đọc: 275 bán, 1.185 thuê». Thẻ có ô trống ghi «Chưa đủ căn cứ (1 bài đã đọc)» ở cả bốn ô. CONTEXT.md có mục «Thẻ địa chỉ nhóm» đủ nhãn, định nghĩa, mã (`group_address_card`, `TN-001`) và slug `group-cards`.
    - spec-alignment: PASS — Thẻ đủ ô (E5-step2) ghi nguồn từng ô: dự án «từ bài đã đọc, 56 bài», phường·tỉnh «theo dự án», phân khu «Chưa đủ căn cứ (1.595 bài đã đọc)», bán/thuê «từ bài đã đọc: 275 bán, 1.185 thuê». Thẻ ô trống (E5-step-o-trong) ghi «Chưa đủ căn cứ (1 bài đã đọc)» ở cả bốn ô. CONTEXT.md có mục «Thẻ địa chỉ nhóm» đủ nhãn, định nghĩa (nói rõ mỗi ô ghi nguồn và số bài), mã `group_address_card` / `TN-001`, slug và _Avoid_.
  required_evidence:
    - (judge không nêu bằng-chứng-thiếu)
  human_override: Mạnh 2026-11-17 — Đạt

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-the-dia-chi-nhom-s03-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r9
  exit_code: 0
  verified_at: 2026-11-17T09:44:23Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-the-dia-chi-nhom-s03-SUITE-lint-r9
  exit_code: 0
  verified_at: 2026-11-17T09:44:23Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-the-dia-chi-nhom-s03-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r9
  exit_code: 0
  verified_at: 2026-11-17T09:44:23Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_a-r9
  exit_code: 0
  verified_at: 2026-11-17T09:44:23Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_b-r9
  exit_code: 0
  verified_at: 2026-11-17T09:44:23Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_lint_rules-r9
  exit_code: 0
  verified_at: 2026-11-17T09:44:23Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-the-dia-chi-nhom-s03-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r9
  exit_code: 0
  verified_at: 2026-11-17T09:44:23Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Mọi block eval ghi baseline: n-a.

Không có eval không-phân-biệt cần liệt kê. Lệnh suite xanh cả hai phía là regression-guard bình thường.

## Variance

none — mọi eval chạy một lần, xác định (runs: 1), không có eval nào mang phương sai.

## Iterations

Round 9: mọi eval máy (E1 đến E9) đạt, E5 ui-check có 17 frame và mạng sạch; E10 là mục judgment, hội đồng đề xuất PASS, chờ người ở Cổng 2 nên verdict là PENDING-JUDGMENT. Lịch sử các round trước nằm trong run-log.jsonl của feature.
