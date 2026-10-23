---
schema_version: 2
feature_slug: glossary-context
verdict: REJECT
failed_evals: [E10]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 80011b2785e306c858000bffc2a25c85ef2d9c90
human_signoff:
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
| E10 | AC-9 | judgment | FAIL |
| E11 | AC-10 | script | PASS |
| E12 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: glossary-context-E1-20261023T000938Z
  exit_code: 0
  baseline: n-a
  verifier: scripts/glossary/acceptance.mjs glossary (config:executors.script.glossary_terms)
  verified_at: 2026-10-23T00:09:38Z
  output: |
    [glossary-context] glossary
      OK  parser kit đọc 75 thuật ngữ, 80 tên bị loại, 8 cụm _Allow_
      OK  7/7 nhóm có thuật ngữ (Địa lý 7 · Tài sản & tin 9 · Giá 9 · Chỉ số 18 · Chiến lược đầu tư 3 · Dữ liệu & nguồn 13 · Cổng & tính năng 16)
      OK  mọi thuật ngữ có định nghĩa cùng dòng
      OK  không tên bị loại nào trùng thuật ngữ chuẩn; không thuật ngữ trùng
    PASS

- eval: E2
  run_id: glossary-context-E2-20261023T000938Z
  exit_code: 0
  baseline: n-a
  verifier: scripts/glossary/acceptance.mjs w6 (config:executors.script.glossary_w6)
  verified_at: 2026-10-23T00:09:38Z
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
  run_id: glossary-context-E3-20261023T000938Z
  exit_code: 0
  baseline: n-a
  verifier: scripts/glossary/acceptance.mjs rebuild (config:executors.script.glossary_rebuild)
  verified_at: 2026-10-23T00:09:39Z
  output: |
    [glossary-context] rebuild
      OK  CONTEXT.md trùng từng byte bản dựng từ terms.mjs
      OK  8 câu Q khớp lựa chọn đã ghi trong decisions.jsonl
    PASS

- eval: E4
  run_id: glossary-context-E4-20261023T000945Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_route_slugs (cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs)
  verified_at: 2026-10-23T00:09:45Z
  output: |
    ▶ slug URL của cây route thật
      ✔ mọi đoạn tĩnh nằm trong CONTEXT.md hoặc ngoại lệ còn hạn; slug cũ có redirect
    ✔ slug URL của cây route thật
    ℹ tests 11
    ℹ pass 11

- eval: E5
  run_id: glossary-context-E5-20261023T000945Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_route_slugs (cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs)
  verified_at: 2026-10-23T00:09:45Z
  output: |
    ▶ checkRouteSlugs
      ✔ route tiếng Anh có trong CONTEXT.md: xanh
      ✔ route tiếng Việt MỚI: đỏ, nêu đúng đoạn
      ✔ đoạn không phải ASCII kebab: đỏ
    ℹ tests 11
    ℹ pass 11
  note: ca «xanh» dùng seg("yield", "so-sanh", "ops", "deals") với ngoại lệ so-sanh còn hạn (route-slugs.test.mjs:52); ca «đỏ» dùng "tim-kiem" và khẳng định lỗi nêu đúng `"tim-kiem"` (:55-57); ngoại lệ thật so-sanh/phuong-phap/dau-tu hạn 2026-12-31 (:18-20).

- eval: E6
  run_id: glossary-context-E6-20261023T000946Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_route_slugs (cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs)
  verified_at: 2026-10-23T00:09:46Z
  output: |
      ✔ ngoại lệ quá hạn: đỏ; đúng ngày hạn: chưa đỏ
      ✔ đã đổi route nhưng thiếu redirect: đỏ
      ✔ đã đổi route, có redirect vĩnh viễn: chỉ còn nhắc xoá ngoại lệ
      ✔ redirect tạm (permanent: false) không tính
      ✔ slug cũ đã đổi, đã xoá ngoại lệ, còn redirect 301: xanh
      ✔ ngoại lệ trỏ slug đích chưa có trong CONTEXT.md: đỏ
    ℹ tests 11
    ℹ pass 11
  note: ca quá hạn so today "2027-01-01" (đỏ, /hết hạn/) với "2026-12-31" (rỗng) ở route-slugs.test.mjs:64-65.

- eval: E7
  run_id: glossary-context-E7-20261023T000956Z
  exit_code: 0
  baseline: n-a
  verifier: scripts/glossary/acceptance.mjs naming-rule (config:executors.script.glossary_naming_rule)
  verified_at: 2026-10-23T00:09:56Z
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
  run_id: glossary-context-E8-20261023T000956Z
  exit_code: 0
  baseline: n-a
  verifier: scripts/glossary/acceptance.mjs product-page (config:executors.script.glossary_product_page)
  verified_at: 2026-10-23T00:09:56Z
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
  judged_by: judge-subagent (fresh context, general-purpose, mù diff)
  verdict: PASS
  rationale: Tệp 66 dòng, gạch đầu dòng ngắn, mỗi mục khép bằng dòng «Nguồn:» (CONTEXT-PRODUCT.md:15, 29, 40, 51, 64-65), không chép đoạn dài; không chép số dễ cũ — dòng 37-38 nói rõ «trang này không chép số» và trỏ ROADMAP §2.5 (số ở ROADMAP.md:75-77 không xuất hiện). Bốn giai đoạn, bảy nguồn S01–S07, P1/P2, SPL A/B/C, hai cổng đều khớp nguồn (portals.md:105-120, 144, 172-178, 190-194; investment-pipeline-4-stages.md:36-44, 113; ROADMAP.md:31-32, 59-67, 157). Thiếu nhỏ, không mâu thuẫn: dòng 47 bỏ đường vào Ops qua `OPS_EMAILS` (ROADMAP.md:113-115, portals.md:159) và bỏ bậc P0.

- eval: E10
  judged_by: judge-subagent (fresh context, general-purpose, mù diff)
  verdict: FAIL
  rationale: ADR lệch — CONTEXT.md:146 định nghĩa ADR (Code `adr`) = doanh thu ÷ đêm đã đặt, khớp 300_metrics.sql:31-33, nhưng app/src/lib/yield.ts:126 đặt `adr` = trung vị `s.price` của listing so sánh, tức giá niêm yết (chính CONTEXT.md:130 nói giá niêm yết «không phải ADR», và CONTEXT.md:141 gọi đầu vào doanh thu năm là giá niêm yết). Lợi suất ròng/Thu nhập ròng dài hạn lệch — yield.ts:120-121 chỉ trừ thuế 10%, không theo định nghĩa Thu nhập ròng CONTEXT.md:186. Doanh thu thiếu quy tắc lấp giá `COALESCE(n.price, l.price_listed)` và loại listing không `price_listed` (300_metrics.sql:4-17, 30, 38). Đêm đã đặt CONTEXT.md:135 nói «chặn vì có khách» nhưng `available = false` gồm cả owner-block (001_init.sql:40). Khớp: Công suất, RevPAR, Lợi suất gộp, Lợi suất ròng/Thu nhập ròng ngắn hạn (300_metrics.sql:34-35, 54-56; yield.ts:109-114, 131-132).
  required_evidence:
    - Sửa một phía rồi chấm lại — (a) ghi chú ở định nghĩa ADR (CONTEXT.md) rằng `adr` trong yield.ts là trung vị giá niêm yết, hoặc đổi tên biến (ngoài phạm vi hợp đồng: «không đổi field code»); (b) ghi `available = false` gồm cả đêm chủ chặn vào định nghĩa Đêm đã đặt; (c) ghi quy tắc lấp giá + loại listing không giá vào Doanh thu; (d) nêu định nghĩa thu nhập ròng dài hạn (chỉ trừ thuế) ở Lợi suất ròng.
  human_override:

- eval: E11
  run_id: glossary-context-E11-20261023T000956Z
  exit_code: 0
  baseline: n-a
  verifier: scripts/glossary/acceptance.mjs runner (config:executors.script.glossary_runner)
  verified_at: 2026-10-23T00:09:56Z
  output: |
    [glossary-context] runner
      OK  route-slugs.test.mjs nằm trong glob của npm run test:lint-rules
      OK  CI ui-lint chạy test:lint-rules và kích hoạt khi CONTEXT.md đổi
      OK  config.yaml có executors.test.ui_route_slugs
    PASS

- eval: E12
  run_id: glossary-context-E12-20261023T000956Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_lint_rules (cd app && npm run test:lint-rules)
  verified_at: 2026-10-23T00:09:57Z
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

- E10 (AC-9) là judgment: giám khảo mù đọc đúng bốn tệp giao; không đọc `pipeline/transform-airbnb.mjs` hay DATA-CONTRACT nên chưa biết đêm owner-block có bị lọc trước khi vào bảng `nights` không. Người chấm đã tự đối chiếu yield.ts:39, 103, 126 và CONTEXT.md:130-146 và xác nhận điểm lệch ADR.
- `db/migrations/001_init.sql:41` ghi giá đêm là «USD/đêm (đã quy đổi)» trong khi phạm vi chỉ VN (VND); CONTEXT.md không nêu đơn vị cho Doanh thu/ADR — comment cũ hay đúng chưa rõ.
- E5/E6 chứng minh trên dữ liệu giả của `checkRouteSlugs` (ca đơn vị); trên cây thật chỉ có E4 (một ca).

## Ngoài hợp đồng

- `docs/architecture/portals.md:18` («AirDNA crosswalk») và `:115` («so AirDNA» trên `/vn/[market]`) còn mô tả AirDNA trên cổng Invest, trái luật 5 AGENTS.md — tài liệu cũ, không do việc này gây ra (giám khảo E9 nêu).
- CONTEXT-PRODUCT.md:47 chỉ ghi điều kiện vào Ops là role ops/admin, thiếu đường `OPS_EMAILS`; tệp không nhắc bậc giá P0 (giám khảo E9 nêu, coi là tóm lược quá tay chứ không phải mâu thuẫn).
- `_acceptance/config.yaml` khai khoá `feature_loop:` hai lần (dòng 9 và cuối tệp) — trình đọc YAML có thể chỉ giữ một khối.

## Analyst

Non-discriminating evals: không đo baseline trong vòng này nên chưa phân loại.

Baseline khong do:
- E1–E8, E11, E12: đề bài vòng VERIFY này không giao chạy A/B trên diffBase; các lệnh trỏ `scripts/glossary/acceptance.mjs` và `route-slugs.test.mjs` là tệp mới của hồ sơ — chạy trên cây cũ không có tệp thì không chứng minh gì.

## Variance

none — mọi eval chạy một lần, tất định.

## Iterations

Round 1: mọi eval máy (E1–E8, E11, E12) đạt trên commit 80011b2; E9 (judgment) PASS; E10 (judgment) FAIL — định nghĩa ADR trong CONTEXT.md lệch `adr` của yield.ts (trung vị giá niêm yết), thu nhập ròng dài hạn và quy tắc mẫu Doanh thu chưa ghi. Trả về bước làm.
