---
schema_version: 2
feature_slug: glossary-context
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ded85a49d805032d321f48125901cce0e0beae92
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: glossary-context

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-8 | judgment | PASS |
| E10 | AC-9 | judgment | PASS |
| E11 | AC-10 | script | PASS |
| E12 | AC-10 | test | PASS |

Lệnh đã giải từ `_acceptance/config.yaml` (chạy ở gốc repo): `glossary_*` = `node scripts/glossary/acceptance.mjs <glossary|w6|rebuild|naming-rule|product-page|runner>`; `ui_route_slugs` = `cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs`; `ui_lint_rules` = `cd app && npm run test:lint-rules`. Lệnh nguyên văn của từng lượt nằm ở trường `cmd` trong `run-log.jsonl`.

## Evidence

- eval: E1
  run_id: glossary-context-E1-r2-20261023T001427Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.glossary_terms
  verified_at: 2026-10-23T00:14:27Z
  output: |
    [glossary-context] glossary
      OK  parser kit đọc 75 thuật ngữ, 80 tên bị loại, 8 cụm _Allow_
      OK  7/7 nhóm có thuật ngữ (Địa lý 7 · Tài sản & tin 9 · Giá 9 · Chỉ số 18 · Chiến lược đầu tư 3 · Dữ liệu & nguồn 13 · Cổng & tính năng 16)
      OK  mọi thuật ngữ có định nghĩa cùng dòng
      OK  không tên bị loại nào trùng thuật ngữ chuẩn; không thuật ngữ trùng
    PASS

- eval: E2
  run_id: glossary-context-E2-r2-20261023T001427Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.glossary_w6
  verified_at: 2026-10-23T00:14:27Z
  output: |
    [glossary-context] w6
      OK  should-fire: [w6-mau] W6 contract line 11 uses "tỷ lệ lấp đầy", which CONTEXT.md lists under _Avoid_ for "Công suất" …
      OK  should-fire: [w6-mau] W6 contract line 11 uses "lấp đầy", which CONTEXT.md lists under _Avoid_ for "Công suất" …
      OK  should-NOT-fire: portal-deals-airdna không có W6
      OK  should-NOT-fire: ops-access-hardening không có W6
      OK  should-NOT-fire: ui-standards-reui không có W6
    PASS
  note: hai dòng W6 cùng chỉ một thuật ngữ «Công suất» (hai tên bị loại khớp cùng câu) — đúng tiêu chí «chỉ đúng thuật ngữ Công suất».

- eval: E3
  run_id: glossary-context-E3-r2-20261023T001428Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.glossary_rebuild
  verified_at: 2026-10-23T00:14:28Z
  output: |
    [glossary-context] rebuild
      OK  CONTEXT.md trùng từng byte bản dựng từ terms.mjs
      OK  8 câu Q khớp lựa chọn đã ghi trong decisions.jsonl
    PASS
  note: vòng 2 đổi cả CONTEXT.md lẫn terms.mjs (de50b3e) — bản dựng lại vẫn trùng byte.

- eval: E4
  run_id: glossary-context-E4-r2-20261023T001428Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-10-23T00:14:28Z
  output: |
    ▶ slug URL của cây route thật
      ✔ mọi đoạn tĩnh nằm trong CONTEXT.md hoặc ngoại lệ còn hạn; slug cũ có redirect
    ✔ slug URL của cây route thật
    ℹ tests 11
    ℹ pass 11

- eval: E5
  run_id: glossary-context-E5-r2-20261023T001428Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-10-23T00:14:28Z
  output: |
    ▶ checkRouteSlugs
      ✔ route tiếng Anh có trong CONTEXT.md: xanh
      ✔ route tiếng Việt MỚI: đỏ, nêu đúng đoạn
      ✔ đoạn không phải ASCII kebab: đỏ
    ℹ tests 11
    ℹ pass 11
  note: ca «xanh» dùng seg("yield", "so-sanh", "ops", "deals") với ngoại lệ so-sanh còn hạn (route-slugs.test.mjs:52); ca «đỏ» dùng "tim-kiem" và khẳng định lỗi nêu đúng `"tim-kiem"` (:55-57); ngoại lệ thật so-sanh/phuong-phap/dau-tu hạn 2026-12-31 (:18-20).

- eval: E6
  run_id: glossary-context-E6-r2-20261023T001428Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-10-23T00:14:28Z
  output: |
      ✔ ngoại lệ quá hạn: đỏ; đúng ngày hạn: chưa đỏ
      ✔ đã đổi route nhưng thiếu redirect: đỏ
      ✔ đã đổi route, có redirect vĩnh viễn: chỉ còn nhắc xoá ngoại lệ
      ✔ redirect tạm (permanent: false) không tính
      ✔ slug cũ đã đổi, đã xoá ngoại lệ, còn redirect 301: xanh
      ✔ ngoại lệ trỏ slug đích chưa có trong CONTEXT.md: đỏ
    ℹ tests 11
    ℹ pass 11
  note: ca quá hạn so today "2027-01-01" (đỏ, /hết hạn/) với "2026-12-31" (chưa đỏ) ở route-slugs.test.mjs:64-65.

- eval: E7
  run_id: glossary-context-E7-r2-20261023T001428Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.glossary_naming_rule
  verified_at: 2026-10-23T00:14:28Z
  output: |
      OK  Quy ước có vế: code/API tiếng Anh, RESO khi có
      OK  Quy ước có vế: chữ UI tiếng Việt lấy từ CONTEXT.md
      OK  Quy ước có vế: URL tiếng Anh toàn bộ, ASCII kebab
      OK  Quy ước có vế: ngoại lệ slug địa lý + mã quốc gia
      OK  Quy ước có vế: đổi slug kèm redirect, làm trong đợt dọn
      OK  câu cũ 'URL ASCII không dấu (slugifyName())' đã bỏ
      OK  AGENTS.md trỏ CONTEXT.md
      OK  .claude/skills/onehub-ui/copy-vi.md trỏ CONTEXT.md
      OK  docs/architecture/portals.md trỏ CONTEXT.md
    PASS

- eval: E8
  run_id: glossary-context-E8-r2-20261023T001428Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.glossary_product_page
  verified_at: 2026-10-23T00:14:28Z
  output: |
      OK  docs/product/CONTEXT-PRODUCT.md dài 66 dòng
      OK  ## 1. Người dùng — trỏ docs/architecture/portals.md, AGENTS.md
      OK  ## 2. Pipeline đầu tư 4 giai đoạn (north star) — trỏ docs/research/investment-pipeline-4-stages.md, docs/ROADMAP.md
      OK  ## 3. Thị trường đang phủ — trỏ docs/ROADMAP.md, docs/adr/0008-remove-thailand-scope.md, docs/research/multi-market-data-plan.md, docs/ROADMAP.md
      OK  ## 4. Hai cổng — trỏ .claude/skills/onehub-ui/routes.md, docs/architecture/portals.md, docs/architecture/invest-portal-ia.md
      OK  ## 5. Nguồn dữ liệu và SPL — trỏ docs/ROADMAP.md, docs/adr/0007-collector-operating-principles.md, docs/adr/0011-reso-first-data-law.md, collector/docs/DATA-CONTRACT.md, docs/research/data-sources.md, AGENTS.md
      OK  AGENTS.md trỏ docs/product/CONTEXT-PRODUCT.md
    PASS

- eval: E9
  judged_by: judge-subagent (fresh context, general-purpose, mù diff, vòng 2)
  verdict: PASS
  rationale: Đúng dạng tóm tắt + trỏ nguồn — mỗi mục khép bằng dòng «Nguồn:» (CONTEXT-PRODUCT.md:15, 29, 40, 51, 64), không chép đoạn dài. Số dễ cũ (số tin, số căn, độ phủ) chỉ trỏ ROADMAP §2.5 chứ không chép (CONTEXT-PRODUCT.md:37-38 ↔ ROADMAP.md:74-77); số còn lại ổn định («1–2 người» portals.md:32, «bảy nguồn S01–S07» ROADMAP.md:59-67). Bốn giai đoạn khớp investment-pipeline-4-stages.md:14-17, 88-95; trạng thái G3/G4 theo ROADMAP.md:56, 155, 157 (tài liệu pipeline :111 là ảnh chụp 20/10, không mâu thuẫn). «Căn giá tốt chỉ ở Ops» khớp portals.md:144; hai cổng, SPL ba tầng, AirDNA chỉ ở `/ops/quality` khớp portals.md:170, 188-194, 211-213 và ROADMAP.md:23-24, 113-115. Mọi tệp được trỏ đều tồn tại. Ghi chú nhỏ không đổi phán quyết: xem «Ngoài hợp đồng».

- eval: E10
  judged_by: judge-subagent (fresh context, general-purpose, mù diff, vòng 2)
  verdict: PASS
  rationale: ADR khớp — CONTEXT.md:146 «doanh thu ÷ đêm đã đặt» = 300_metrics.sql:31-33, :54; ghi chú CONTEXT.md:148 nói đúng `adr` trong yield.ts là trung vị giá niêm yết (yield.ts:126, :38). Công suất khớp CONTEXT.md:151 (+ :138) ↔ 300_metrics.sql:34, :55; gồm cả đêm chủ chặn khớp 001_init.sql:40 (CONTEXT.md:135). RevPAR khớp CONTEXT.md:158 ↔ 300_metrics.sql:35, :56. Doanh thu khớp CONTEXT.md:141 ↔ 300_metrics.sql:30 (`COALESCE(n.price, l.price_listed)`) và :38 (`price_listed IS NOT NULL`); doanh thu năm khớp yield.ts:103-108. Lợi suất gộp khớp yield.ts:131 (ngắn hạn) và :119 (dài hạn). Lợi suất ròng khớp yield.ts:132 và :121. Thu nhập ròng ngắn hạn khớp yield.ts:109-114, dài hạn (tiền thuê × 12 × (1 − 0,1)) khớp yield.ts:36, :120; chưa trừ nợ vay đúng. Lỗi nhỏ không đổi phán quyết: dòng Code CONTEXT.md:187 chỉ ghi `noi`, còn biến dài hạn là `lt.netIncome` (yield.ts:120).

- eval: E11
  run_id: glossary-context-E11-r2-20261023T001428Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.glossary_runner
  verified_at: 2026-10-23T00:14:28Z
  output: |
    [glossary-context] runner
      OK  route-slugs.test.mjs nằm trong glob của npm run test:lint-rules
      OK  CI ui-lint chạy test:lint-rules và kích hoạt khi CONTEXT.md đổi
      OK  config.yaml có executors.test.ui_route_slugs
    PASS

- eval: E12
  run_id: glossary-context-E12-r2-20261023T001428Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-10-23T00:14:28Z
  output: |
    ▶ parseContextSlugs
      ✔ đọc Slug URL và Slug cũ, bỏ chữ ngoài backtick
    ▶ routes.md của skill onehub-ui
      ✔ phủ đúng mọi page.tsx dưới app/src/app (không thiếu, không thừa, không trùng)
    ℹ tests 152
    ℹ suites 50
    ℹ pass 152
    ℹ fail 0

## Known limits

- Không đo baseline A/B trên diffBase: mọi eval máy mang `baseline: n-a` (lý do ở «Analyst»), nên chưa có bằng chứng máy rằng từng eval phân biệt được cây cũ với cây mới.
- E5/E6 chứng minh trên dữ liệu giả của `checkRouteSlugs` (ca đơn vị); trên cây route thật chỉ có E4 (một ca).
- E9/E10 là judgment: giám khảo mù chỉ đọc đúng bốn tệp giao mỗi eval; E10 không đọc `pipeline/transform-airbnb.mjs`, `410` listing_stats hay DATA-CONTRACT, nên phần «Công suất 90 đêm» và cách `nights` được nạp không nằm trong phạm vi đối chiếu.

## Ngoài hợp đồng

- CONTEXT.md:187 — dòng Code của «Thu nhập ròng» chỉ ghi `noi`; biến dài hạn trong code là `lt.netIncome` (yield.ts:120). Nên bổ sung tên này (giám khảo E10 nêu; không đổi phán quyết).
- CONTEXT-PRODUCT.md:56 gọi S05 thuộc nhóm «công khai» trong khi investment-pipeline-4-stages.md:124 và portals.md:144 xếp S05 vào tầng P1 — dễ đọc nhầm với định nghĩa P2 «giá công khai» ở :59 (giám khảo E9 nêu).
- CONTEXT-PRODUCT.md:47 chỉ ghi điều kiện vào Ops là role ops/admin, thiếu đường `OPS_EMAILS` (ROADMAP.md:113-115) — thiếu ý, không mâu thuẫn.
- `docs/architecture/portals.md:115` («so AirDNA» trên `/vn/[market]`) còn mô tả AirDNA trên cổng Invest, trái luật 5 AGENTS.md — tài liệu cũ, không do việc này gây ra.
- `db/migrations/001_init.sql:41` ghi giá đêm «USD/đêm (đã quy đổi)» trong khi phạm vi chỉ VN (VND); CONTEXT.md không nêu đơn vị cho Doanh thu/ADR.
- `_acceptance/config.yaml` khai khoá `feature_loop:` hai lần (dòng 9 và cuối tệp) — trình đọc YAML có thể chỉ giữ một khối; `executors.script.product_map` và `executors.design.*` trỏ kit 2.32.0 trong khi kit đang dùng là 2.33.1 (hook ghi báo cáo cũng chạy từ 2.32.0).

## Analyst

Non-discriminating evals: không đo baseline trong vòng này nên chưa phân loại.

Baseline khong do:
- E1–E8, E11, E12: đề bài vòng VERIFY này không giao chạy A/B trên diffBase; các lệnh trỏ `scripts/glossary/acceptance.mjs` và `route-slugs.test.mjs` là tệp mới của hồ sơ — chạy trên cây cũ không có tệp thì không chứng minh gì.

## Variance

none — mọi eval chạy một lần, tất định.

## Iterations

Round 1: mọi eval máy (E1–E8, E11, E12) đạt trên commit 80011b2; E9 (judgment) PASS; E10 (judgment) trượt — định nghĩa chỉ số trong CONTEXT.md lệch code: Đêm đã đặt chưa ghi gồm cả đêm chủ chặn, Doanh thu thiếu quy tắc lấy mẫu (lấp giá niêm yết, loại listing không giá), `adr` trong yield.ts là trung vị giá niêm yết, thu nhập ròng dài hạn chưa nêu. Trả về bước làm.
Round 2: trên commit de50b3e (sửa CONTEXT.md + terms.mjs) mọi eval máy đạt (E3 vẫn trùng byte); giám khảo mù mới chấm E9 PASS, E10 PASS — bốn điểm lệch vòng 1 đã được định nghĩa/ghi chú khớp code.

### Re-pin lần 1 — 2026-10-23, do hoá cũ do merge main (PR listing-airdna-photos) sau verify
run_id: repin-20261023T002309Z-10984
sha: ded85a49d805032d321f48125901cce0e0beae92 · suites: 2 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng · ngoài làn máy: E9 (E9 không khai paths), E10 (E10 không khai paths) · AC không có chốt máy: AC-9
