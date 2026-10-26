---
schema_version: 2
feature_slug: ops-dong-chay-df0
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8df9d81ca00cd5f7d748ecc2a457bbbe47651642
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: ops-dong-chay-df0

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS (mang tu round 1) |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | ui-check | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-8 | judgment | PASS (đề xuất của hội đồng, chờ human_override) |
| E10 | AC-9 | test | PASS |
| E11 | AC-9 | test | PASS (mang tu round 1) |
| E12 | AC-9 | test | PASS (mang tu round 1) |
| E13 | AC-9 | test | PASS (mang tu round 1) |
| E14 | AC-9 | script | PASS (mang tu round 1) |
| E15 | AC-10 | test | PASS |
| E16 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-ops-dong-chay-df0-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay
  verified_at: 2026-10-26T12:47:29Z
  output: |
    cd app && node --import tsx --test tests/ops-dong-chay.test.tsx tests/data-level.test.tsx
    ℹ duration_ms 2916.967917

- eval: E2
  run_id: minted-ops-dong-chay-df0-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay
  verified_at: 2026-10-26T12:47:29Z
  output: |
    cd app && node --import tsx --test tests/ops-dong-chay.test.tsx tests/data-level.test.tsx
    ℹ duration_ms 2916.967917

- eval: E3
  run_id: minted-ops-dong-chay-df0-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay
  verified_at: 2026-10-26T12:47:29Z
  output: |
    cd app && node --import tsx --test tests/ops-dong-chay.test.tsx tests/data-level.test.tsx
    ℹ duration_ms 2916.967917

- eval: E4
  run_id: minted-ops-dong-chay-df0-E4-r1
  exit_code: 0
  verifier: config:executors.test.luong7
  verified_at: 2026-10-26T11:32:02Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-ops-dong-chay-df0-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay
  verified_at: 2026-10-26T12:47:29Z
  output: |
    cd app && node --import tsx --test tests/ops-dong-chay.test.tsx tests/data-level.test.tsx
    ℹ duration_ms 2916.967917

- eval: E6
  run_id: minted-ops-dong-chay-df0-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay
  verified_at: 2026-10-26T12:47:29Z
  output: |
    cd app && node --import tsx --test tests/ops-dong-chay.test.tsx tests/data-level.test.tsx
    ℹ duration_ms 2916.967917

- eval: E7
  run_id: minted-ops-dong-chay-df0-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-26T12:47:29Z
  screenshot: evidence/E7-step1.png
  observed: |
    step1 (1280 sáng, Tất cả): đầu trang «Dòng chảy dữ liệu» + badge 26.844 bài / 11 thẻ chờ duyệt / 0 đề xuất làm giàu; khung «Đường ống» sankey 3 nguồn S03/S05/S06 -> Bài nhận 26.844 -> Đọc được 18.074 67,3% -> Tin rao mới 15.862 -> Gắn căn 98,1% (xanh); nhánh Không đọc được 8.770 (đỏ nhạt), Gộp vào tin đã có 2.212; chữ rõ. Dưới cùng thấy đầu «Chất lượng từng chặng».
    step2 (bấm S03): nút S03 sáng; tiêu đề 10.611 bài; Bài nhận 10.611, Đọc được 2.452 (23,1%), Tin rao mới 267 (9.2 bài/tin), «Gắn căn 0,0%» tô ĐỎ; nhánh Không đọc được 8.159 (đỏ), Gộp vào tin đã có 2.185 (xám), Chưa gắn căn 267 — khớp kỳ vọng.
    step3 (cuộn tới Chất lượng từng chặng): lưới 4 hàng: S06 Khoẻ (100/96/100/100/100%), S03 «Kẹt · đọc» (đọc 23%, đủ trường lõi 0 0%, có phường 2 1%, gắn căn 0 0%), S01 Khoẻ (đọc 80%, lõi/gắn căn —), S05 «Kẹt · trường lõi» (đọc 55%, lõi 0 0%, phường 13 46%, gắn căn 0%); nhãn khớp luật AC-5 khi áp vào tỉ lệ trong ảnh. Dưới là Chặng theo ngày (biểu đồ vùng) cạnh Loại giao dịch (donut 6,2k/9,6k).
    step4 (1280 tối): nền đen, sankey chữ trắng đọc rõ, dòng xanh/đỏ phân biệt, Gắn căn 98,1% xanh; nhóm nút 7 ngày sáng; không lỗi tương phản.
    step5 (bộ lọc Nguồn là S03 -> mở hàng đầu): sheet bên phải: tiêu đề «Bán · 3,2 tỷ ₫ · 81 m²», «S03 · Cộng đồng · lần đầu…», badge «B0 · Có lời khai»; «Trường lõi 3/5» với chip Loại tin/Giá/Diện tích (xanh), Loại hình/Phường (gạch ngang = thiếu); câu «Lên B1 cần đủ năm trường lõi — còn thiếu loại hình, phường.»; các mục Phân loại, Trường đã đọc, Làm giàu và căn; nền mờ phía sau.
    step5b (cuộn sheet): mục «Ảnh tin» với một ô ảnh vuông (phòng khách bếp) có viền, ảnh không méo; dưới là «Bài gốc» với tên nhóm và đoạn văn bài gốc (có URL ảnh).
    step5c (ảnh bị chặn giả lập): mục Ảnh tin hiện ô viền đỏ nhạt với biểu tượng ảnh gạch chéo và chữ «Ảnh hỏng» (không phải ô trống); dưới là «Bài gốc» của tin khác.
    step6 (390 sáng): bố cục một cột, đầu trang, badge, nút khoảng thời gian, khung Đường ống với nút Tất cả/S03/S05/S06; sankey cắt ngang trong khung riêng ở cột «Bài nhận» (cuộn nội bộ); không thấy cuộn ngang cả trang; scrollWidth=390=clientWidth. Chữ đọc được. Mọi frame khớp Expected; không mâu thuẫn.
  network_observed: clean

- eval: E8
  run_id: minted-ops-dong-chay-df0-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay
  verified_at: 2026-10-26T12:47:29Z
  output: |
    cd app && node --import tsx --test tests/ops-dong-chay.test.tsx tests/data-level.test.tsx
    ℹ duration_ms 2916.967917

- eval: E9
  judged_by: judge-subagent (fresh context), hội đồng đề xuất ba lăng kính
  verdict: PASS
  rationale: Ba lăng kính cùng thấy RegionError bọc Suspense(DataFlowSkeleton), nhánh localOnlyTable("stg_zalo_posts") trả LocalOnlyAlert trước getDataFlow, và skeleton theo bố cục năm vùng. Hội đồng chỉ là đề xuất, người quyết ở Cổng 2.
  votes:
    - domain-correctness: PASS — Trong page.tsx, nội dung được bọc `RegionError what="dòng chảy dữ liệu"` > `Suspense fallback={<DataFlowSkeleton />}`. Trong `DataFlowContent`, kiểm `localOnlyTable("stg_zalo_posts")` chạy đầu tiên và trả `LocalOnlyAlert title="Chỉ xem ở máy thu"` trước `getDataFlow`. `DataFlowSkeleton` dựng theo bố cục trang gồm đầu trang, khung đường ống, hai biểu đồ (lưới 8/4) và hai lưới 5 dòng, không phải spinner.
    - operational-feasibility: PASS — Trong page.tsx, RegionError what="dòng chảy dữ liệu" bọc Suspense có fallback là DataFlowSkeleton. DataFlowContent gọi localOnlyTable("stg_zalo_posts") và trả LocalOnlyAlert tiêu đề «Chỉ xem ở máy thu» trước khi gọi getDataFlow. DataFlowSkeleton dựng đúng bố cục trang (đầu trang, khung đường ống, hai biểu đồ chia 8/4, hai lưới 5 hàng), không phải spinner toàn trang. Lăng kính này suy ra localOnlyTable trả đúng khi bảng vắng từ tên hàm và chú thích trong page.tsx, vì file định nghĩa nó không nằm trong danh sách input.
    - spec-alignment: PASS — Trong page.tsx, `RegionError what="dòng chảy dữ liệu"` bọc `Suspense` có `fallback={<DataFlowSkeleton />}`. `DataFlowContent` trả `LocalOnlyAlert title="Chỉ xem ở máy thu"` ngay khi `localOnlyTable("stg_zalo_posts")` đúng, và `getDataFlow` chỉ được gọi sau dòng đó. `DataFlowSkeleton` dựng đủ năm phần theo bố cục trang: khối đầu trang, khung đường ống, hai biểu đồ (xl:col-span-8 và col-span-4), hai lưới 5 dòng. Nó không phải spinner. Lăng kính này không đọc `localOnlyTable`, vì file đó nằm ngoài danh sách input; câu hỏi chỉ xét thứ tự gọi trong page.tsx nên không ảnh hưởng kết luận.
  human_override:  # chi nguoi ghi

- eval: E10
  run_id: minted-ops-dong-chay-df0-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-26T12:47:29Z
  output: |
    cd app && npx tsc --noEmit && npm run lint
    (tsc không lỗi; lint kết thúc sạch)

- eval: E11
  run_id: minted-ops-dong-chay-df0-E11-r1
  exit_code: 0
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-10-26T11:32:02Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E12
  run_id: minted-ops-dong-chay-df0-E12-r1
  exit_code: 0
  verifier: config:executors.test.ops_nhan
  verified_at: 2026-10-26T11:32:02Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E13
  run_id: minted-ops-dong-chay-df0-E13-r1
  exit_code: 0
  verifier: config:executors.test.vocab
  verified_at: 2026-10-26T11:32:02Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E14
  run_id: minted-ops-dong-chay-df0-E14-r1
  exit_code: 0
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-26T11:32:02Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E15
  run_id: minted-ops-dong-chay-df0-E15-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay
  verified_at: 2026-10-26T12:47:29Z
  output: |
    cd app && node --import tsx --test tests/ops-dong-chay.test.tsx tests/data-level.test.tsx
    ℹ duration_ms 2916.967917

- eval: E16
  run_id: minted-ops-dong-chay-df0-E16-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dong_chay
  verified_at: 2026-10-26T12:47:29Z
  output: |
    cd app && node --import tsx --test tests/ops-dong-chay.test.tsx tests/data-level.test.tsx
    ℹ duration_ms 2916.967917

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ops-dong-chay-df0-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-26T12:47:29Z

- cmd: cd app && npm test
  run_id: minted-ops-dong-chay-df0-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-26T12:47:29Z

- cmd: cd pipeline && npm test
  run_id: minted-ops-dong-chay-df0-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-26T12:47:29Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ops-dong-chay-df0-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-26T12:47:29Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ops-dong-chay-df0-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-26T12:47:29Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:

- cd app && node --import tsx --test tests/ops-dong-chay.test.tsx tests/data-level.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: none được liệt kê — baseline không đo được ở round này (BLOCKED hạ tầng) nên không kết luận được eval nào xanh cả trên baseline; chưa chứng minh được eval nào đỏ trên baseline.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: REJECT — ba lệnh suite hồi quy (agent, app, pipeline) đỏ và có bốn phát hiện trong hợp đồng (AC-2 hai mục, AC-3, AC-8). Returned to implementation.
Round 2: PASS — mọi eval chạy lại đều xanh, E4 và E11-E14 mang từ round 1 vì delta không chạm paths của eval; baseline không đo được (hạ tầng); verified_at của các khối round 2 là mốc làm tròn ghi lúc soạn báo cáo.
