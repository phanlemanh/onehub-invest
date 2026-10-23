---
schema_version: 2
feature_slug: invest-target-map
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f21b35b3363c0a7a2b0f805674e507a9ed48e717
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: invest-target-map

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | judgment | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | judgment | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | judgment | PASS |
| E9 | AC-8 | judgment | PASS |
| E10 | AC-6 | script | PASS |

Eval máy chạy lại ở `f21b35b` (sau chữ ký; các commit từ lượt chấm chỉ là gộp `main` + bỏ nháy trong `cmd` của evals.yaml), mỗi lượt ghi vào `run-log.jsonl` (round 4). Eval judgment do tác tử chấm ngữ cảnh sạch phán ở `abe0b34`; giữa hai commit không file nào nó đọc (routes.md, ROADMAP.md, catalog.md, loop.md, ban-quyet-dinh.html) thay đổi.

## Evidence

- eval: E1
  run_id: invest-target-map-e1-e7-20261023T015313Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-10-23T01:53:12Z
  output: |
    ✔ mọi route có cột Block đích: tên block trong backtick, `chờ (…)`, hoặc `—` cho redirect (2.53425ms)
    ✔ mọi route có cột Slug đích: `giữ` hoặc đường dẫn tiếng Anh trong backtick (0.327084ms)
    ✔ phủ đúng mọi page.tsx dưới app/src/app (không thiếu, không thừa, không trùng) (3.850958ms)
    ℹ tests 154
    ℹ pass 154
    ℹ fail 0

- eval: E2
  run_id: invest-target-map-e2-20261023T015313Z
  exit_code: 0
  baseline: n-a
  verifier: verify.sh
  verified_at: 2026-10-23T01:53:13Z
  output: |
    invest rows 13 chờ 0

- eval: E3
  run_id: invest-target-map-e3-20261023T015313Z
  exit_code: 0
  baseline: n-a
  verifier: verify.sh
  verified_at: 2026-10-23T01:53:13Z
  output: |
    ℹ pass 2
    ℹ fail 1
        `/login` → "giữ"
    routes.md khôi phục sạch
    đột biến bị bắt (test con đỏ, exit 1)

- eval: E4
  judged_by: judge-subagent (fresh context, feature-loop:cham-lenh, commit abe0b34)
  verdict: PASS
  rationale: routes.md:32 ghi shell Invest `app-shell-30` (giữ, chốt 2026-10-23) kèm lý do (top nav 4 mục phẳng, bản đồ cần trọn bề ngang, view track khớp mục lục Insight; dự phòng app-shell-28). Bảng Đợt (routes.md:73–78) có I1 1 route, I2 2, I3 2, I4 2, I5 2, I6 4 = 13, đúng tập 13 dòng Invest không redirect của E2; không lặp, không thiếu; `/[country]/[market]/map` (redirect) đứng ngoài đúng; mọi đợt có ô biểu đồ.

- eval: E5
  run_id: invest-target-map-e5-20261023T015313Z
  exit_code: 0
  baseline: n-a
  verifier: verify.sh
  verified_at: 2026-10-23T01:53:13Z
  output: |
    imgs 61 broken 0 rows 13 badRows 0

- eval: E6
  judged_by: judge-subagent (fresh context, feature-loop:cham-lenh, commit abe0b34)
  verdict: PASS
  rationale: ROADMAP Track 6 có dòng BĐ (bản đồ đích, "✅ Mạnh chọn 23/10 — chờ ký PR") và đủ I1…I6; bảng chỉ còn A, B1, B3, BĐ, I1–I6, B5 — không còn B2/B4; B5 = "Ops còn lại (`/ops/deals`) + gỡ baseline"; đoạn "Cắt lại 23/10" giải thích B2/B4 đi vào I1–I6.

- eval: E7
  run_id: invest-target-map-e1-e7-20261023T015313Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-10-23T01:53:12Z
  output: |
    ✔ mọi route có cột Slug đích: `giữ` hoặc đường dẫn tiếng Anh trong backtick (0.327084ms)
    ℹ pass 154
    ℹ fail 0

- eval: E8
  judged_by: judge-subagent (fresh context, feature-loop:cham-lenh, commit abe0b34)
  verdict: PASS
  rationale: routes.md:19–23 và catalog.md:74 ghi nguồn bản đồ đích `mapcn` với ánh xạ Finder `@mapcn/choropleth`, Duyệt listing `@mapcn/store-locator` + clusters, Insight map cơ bản; ban-quyet-dinh.html có mục "Bản đồ — … Mạnh chọn mapcn" với 3 bộ ảnh hiện tại | mapcn | shadcn-map (9 ảnh, 0 hỏng) và bảng "Thuật ngữ cần chốt" 8 dòng; tên component cũ chỉ còn ở nhãn hiện trạng / "thay X".

- eval: E9
  judged_by: judge-subagent (fresh context, feature-loop:cham-lenh, commit abe0b34)
  verdict: PASS
  rationale: loop.md:11–15 có bước tra Mobbin 3–6 màn khi chốt khuôn IA (≥2 khuôn), ghi `mobbin_url`, Mobbin chỉ cho IA (không chép hình), block từ ReUI (riêng bản đồ `mapcn`), không có Mobbin thì chọn từ archetype của `reui/rules/compose.md` kèm lý do.

- eval: E10
  run_id: invest-target-map-e10-20261023T015318Z
  exit_code: 0
  baseline: n-a
  verifier: verify.sh
  verified_at: 2026-10-23T01:53:18Z
  output: |
    ℹ pass 2
    ℹ fail 1
        `/so-sanh` → "/so-sánh"
    routes.md khôi phục sạch
    đột biến bị bắt (test con đỏ, exit 1)

## Known limits

- Đột biến E10 vừa bỏ backtick vừa thêm dấu tiếng Việt, nên một lần đỏ phủ cả hai nhánh mà không tách được nhánh nào bắt. Test chỉ kiểm dạng giá trị Slug đích, không khoá từng ánh xạ (`/compare`, `/methodology`, `/yield`) — các ánh xạ đối chiếu bằng tay (tác tử chấm, lượt abe0b34).
- Test Block đích (`routes-map.test.mjs:61`) cho qua mọi giá trị có ít nhất một cặp backtick trong ô, không kiểm tên block có trong registry.
- 39 thumbnail ứng viên trong E5 tải từ `https://reui.io/thumbnails/…`: "0 ảnh hỏng" phụ thuộc mạng và reui.io giữ đường dẫn.
- E2 đếm theo regex dòng trên routes.md, không đối chiếu với cây `page.tsx`; phần đó do test thứ 3 của E1.

## Analyst

Non-discriminating evals:
- none. E3 phủ nhánh đỏ của cột Block đích, E10 phủ nhánh đỏ của cột Slug đích.

Baseline khong do:
- E1/E7, E2, E3, E10: main chưa có cột Block đích hay Slug đích nên sẽ đỏ hoặc không có test; không dựng cây main để đo.
- E5: tài liệu mới, không có baseline.

## Variance

none — eval máy tất định; riêng E5 phụ thuộc mạng tới reui.io.

## Iterations

Round 1 (ab5d21f): E1–E9 đạt; phát hiện chữ cũ trong HTML, ô biểu đồ I3, đoạn mở đầu routes.md, PRODUCT-MAP ngoài phạm vi, thiếu eval âm cho cột Slug.
Round 2 (abe0b34): sửa theo phát hiện, thêm E10; E1–E10 đạt, 4 eval judgment PASS không UNCERTAIN.
Round 3 (81658532): thay lệnh rời của E2/E3/E5/E10 bằng thước `verify.sh` (hook bằng chứng đòi verifier là script có thật); chạy lại eval máy, đều đạt.
Round 4 (f21b35b, sau chữ ký): bằng chứng hoá cũ vì gộp `main` + bỏ nháy `cmd`; chạy lại eval máy có ghi sổ `run-log.jsonl`, đều đạt.

### Re-pin lần 1 — 2026-10-23, do hoá cũ do chính commit chữ ký
run_id: repin-20261023T015227Z-27417
sha: f21b35b3363c0a7a2b0f805674e507a9ed48e717 · suites: 6 lệnh exit 0 · evals: 6/6 eval máy đạt kỳ vọng · ngoài làn máy: E4 (E4 không khai paths), E6 (E6 không khai paths), E8 (E8 không khai paths), E9 (E9 không khai paths) · AC không có chốt máy: AC-3, AC-5, AC-7, AC-8
