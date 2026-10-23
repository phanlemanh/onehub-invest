---
schema_version: 2
feature_slug: review-card-photos
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: c1adef1629be1d25a5b01d6a6be7dff369e25d84
human_signoff:
---

# Evidence Report: review-card-photos

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-8 | script | PASS |
| E10 | AC-9 | ui-check | PASS |
| E11 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: review-card-photos-E1-r2-20261023T031303Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T03:13:03Z
  output: |
    $ cd app && npm test
    ✔ AC-1 thẻ Cùng căn?: Tin A và Tin B mỗi bên một dải, đúng số ảnh, đúng thứ tự, alt nêu bên + số (167.079208ms)
    ℹ tests 34
    ℹ pass 34
    ℹ fail 0
    Đối chiếu mã test: so src theo thứ tự [FB1, FB2, FB3] cho Tin A, [CHOTOT] cho Tin B; alt «Tin A — ảnh 1..3», «Tin B — ảnh 1».

- eval: E2
  run_id: review-card-photos-E2-r2-20261023T031305Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T03:13:05Z
  output: |
    $ cd app && npm test
    ✔ AC-2 thẻ Bổ sung dữ liệu: một dải dưới đoạn tin, đúng số ảnh (13.700333ms)
    ℹ tests 34
    ℹ pass 34
    ℹ fail 0
    Đối chiếu mã test: đúng 1 group «Ảnh …» trên thẻ agent_output, 2 img cho media.offer 2 ảnh.

- eval: E3
  run_id: review-card-photos-E3-r2-20261023T031308Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T03:13:08Z
  output: |
    $ cd app && npm test
    ✔ AC-3 bấm ảnh n mở hộp thoại «ảnh n/N»; trước/sau chuyển ảnh, tắt ở hai đầu (85.864458ms)
    ℹ tests 34
    ℹ pass 34
    ℹ fail 0
    Đối chiếu mã test: chưa bấm thì dialog null (should-NOT-fire); bấm ảnh 2 → «Tin A · ảnh 2/3» + src ảnh 2; «Ảnh sau» tắt ở 3/3, «Ảnh trước» tắt ở 1/3.
    Vế «đóng được» của AC-3 test không kiểm; đã chứng ở E10 (Esc đóng hộp, có nút Close) — xem Analyst.

- eval: E4
  run_id: review-card-photos-E4-r2-20261023T031310Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T03:13:10Z
  output: |
    $ cd app && npm test
    ✔ AC-4 ảnh lỗi tải → ô «Ảnh hỏng», vẫn bấm được; hộp thoại báo hết hạn; ảnh khác giữ nguyên (21.603333ms)
    ℹ tests 34
    ℹ pass 34
    ℹ fail 0
    Đối chiếu mã test: sự kiện error trên img 1 → dải chỉ còn img 2 (should-NOT-fire giữ nguyên), 1 ô data-state=error chữ «Ảnh hỏng»; bấm ô hỏng mở hộp có câu «Ảnh không tải được — URL gốc có thể đã hết hạn», không có img.

- eval: E5
  run_id: review-card-photos-E5-r2-20261023T031312Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T03:13:12Z
  output: |
    $ cd app && npm test
    ✔ AC-5 mảng rỗng → «không có ảnh»; không có dữ liệu ảnh (không phải admin) → 0 vùng ảnh, 0 img (12.629ms)
    ℹ tests 34
    ℹ pass 34
    ℹ fail 0
    Đối chiếu mã test: offer_a [] → «Tin A: không có ảnh», không group; media undefined cho cả thẻ Cùng căn? lẫn Bổ sung dữ liệu → 0 group, 0 img, không có chữ «không có ảnh».

- eval: E6
  run_id: review-card-photos-E6-r2-20261023T031314Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T03:13:14Z
  output: |
    $ cd app && npm test
    ✔ AC-6 ảnh ngoài: referrerpolicy=no-referrer + lazy; ảnh local đi qua /api/zalo-media, không gắn policy thừa (3.891708ms)
    ℹ tests 34
    ℹ pass 34
    ℹ fail 0
    Đối chiếu mã test: fbcdn + Chợ Tốt mang referrerpolicy no-referrer + loading lazy; ảnh local src ^/api/zalo-media?snapshot= không có referrerpolicy; toàn trang đúng 3 src loader trả (should-NOT-fire).

- eval: E7
  run_id: review-card-photos-E7-r2-20261023T031316Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.review_photos_smoke
  verified_at: 2026-10-23T03:13:16Z
  output: |
    $ BASE_URL=http://localhost:3456 node scripts/smoke-review-photos.mjs   (dev server có cwd …/adoring-moser-77aa4f/app; DB one-invest-db :5433)
    thẻ mẫu #13: Tin A scontent-ord5-2.xx.fbcdn.net · Tin B cdn.chotot.com
    ok   admin tải /ops/review (HTTP 200)
    ok   HTML admin có ảnh Tin A (URL gốc từ stg_zalo_posts.media)
    ok   HTML admin có ảnh Tin B (image_url Chợ Tốt)
    ok   ảnh ngoài trong HTML admin mang referrerpolicy=no-referrer
    ok   ops tải /ops/review (HTTP 200)
    ok   HTML ops vẫn có hàng duyệt
    ok   should-NOT-fire: HTML ops không có URL ảnh của thẻ mẫu
    ok   should-NOT-fire: HTML ops không có URL ảnh tin nào (fbcdn/zdn/chotot/zalo-media)
    dọn: còn 0 tài khoản thử
    SMOKE PASS (rpsmokecb00e8bc)
    Kiểm độc lập của người chấm vòng 2 (script tạm, tài khoản tiền tố graderchk…, đã xoá, còn 0): admin 16 thẻ h3, 67 img ảnh tin; ops 16 thẻ h3, 0 img, 0 lần nhắc URL ảnh; review_queue 16 dòng → ops vẫn tải đủ thẻ.

- eval: E8
  run_id: review-card-photos-E8-r2-20261023T031317Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-23T03:13:17Z
  output: |
    $ cd app && npx tsc --noEmit && npm run lint
    > eslint && node eslint-plugin-onehub-ui/check-bare-disables.mjs
    investment-simulator.tsx 142:6 warning react-hooks/exhaustive-deps
    user-event-beacon.tsx 51:6 warning react-hooks/exhaustive-deps
    use-file-upload.ts 266:5 warning react-hooks/exhaustive-deps
    ✖ 3 problems (0 errors, 3 warnings)   (3 cảnh báo cố ý có sẵn, không thuộc file đổi)
    tsc --noEmit: không in lỗi nào.
    git diff main...HEAD và 9648a03..HEAD -- app/eslint-suppressions.json: cả hai rỗng → baseline không tăng.

- eval: E9
  run_id: review-card-photos-E9-r2-20261023T031328Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.review_photos_design_gate
  verified_at: 2026-10-23T03:13:28Z
  output: |
    $ node …/acceptance-gate/2.32.0/scripts/design-gate.mjs --jsdom app app/src/components/ops/review-photos.tsx
    "target": "app/src/components/ops/review-photos.tsx", "mode": "dom", "verdict": "PASS", "p0_count": 0, "blocking": [], "findings": []

- eval: E11
  run_id: review-card-photos-E11-r2-20261023T031329Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.review_card_design_gate
  verified_at: 2026-10-23T03:13:29Z
  output: |
    $ node …/acceptance-gate/2.32.0/scripts/design-gate.mjs --jsdom app app/src/components/ops/review-card.tsx
    "target": "app/src/components/ops/review-card.tsx", "mode": "dom", "verdict": "PASS", "p0_count": 0, "blocking": []
    findings: single-font (warning, P2)

- eval: E10
  run_id: review-card-photos-E10-r2-20261023T031435Z
  exit_code: 0
  verifier: config:dev_server.start
  driver: ego-browser nodejs, task space 7 (đã finish); dev server có sẵn ở http://localhost:3456, tiến trình node có cwd …/adoring-moser-77aa4f/app; phiên admin thử của kho (.claude/ops-test-account.json) còn hiệu lực từ vòng 1, không đăng nhập lại; viewport qua CDP Emulation 1280×900 rồi 390×844, đã clearDeviceMetricsOverride; theme next-themes đổi light/dark qua localStorage, trả lại giá trị gốc «dark»
  verified_at: 2026-10-23T03:14:35Z
  screenshot: evidence/E10-r2-step1.png
  masked: true (blur ảnh tin: 67 img ở step1/2/4/5, 68 img ở step3 gồm ảnh lớn trong hộp thoại)
  observed: |
    Step1 (sáng 1280): thẻ «Cùng căn? binh-thanh 49m² ↔ 51m²» — dưới khối Tin A dải 4 ô ảnh (đã làm mờ), dưới Tin B dải 1 ô; nút Cùng căn/Khác căn/Không chắc bên dưới. Step2: thẻ «Bổ sung dữ liệu: offer_feb6…» có dải 5 ô ngay dưới đoạn tin; hai thẻ Bổ sung khác hiện «Tin: không có ảnh».
    Step3: hộp thoại giữa màn, tiêu đề «Tin A · ảnh 1/4», mô tả «Ảnh từ URL gốc của nguồn — URL có hạn, có thể đã hết.», ảnh lớn ~736px (mờ), «Ảnh trước» xám tắt, «Ảnh sau» bật, nút X đóng góc phải. Step4 (tối 1280): cùng thẻ trên nền tối, dải 4 + 1 ô hiện đúng.
    Step5 (tối 390px): hai khối Tin A/Tin B xếp cạnh nhau hẹp, dải Tin A cuộn ngang trong cột (khoảng 1,5 ô thấy được, có mép mờ), Tin B 1 ô; không thanh cuộn ngang trang. Không ô nào là ảnh vỡ hay «Ảnh hỏng».
  network_observed: no-app-traffic
  output: |
    trước khi làm mờ (sáng 1280, đã cuộn hết vùng cuộn để ảnh lazy tải): 26 dải (24 dải Tin A/Tin B trên 12 thẻ Cùng căn?, 2 dải «Tin»), 67 img ảnh tin, đã tải thật (complete && naturalWidth > 0) 67, ô «Ảnh hỏng» 0
    step3: title «Tin A · ảnh 1/4», img trong hộp tải thật (naturalWidth > 0), nút [Ảnh trước(disabled), Ảnh sau, Close]; Esc → hộp đóng (dialog-content biến mất)
    step4 (tối): 67 img, 64 đã tải, ô «Ảnh hỏng» 0
    step5 (390px): document.documentElement.scrollWidth 390, innerWidth 390, body.scrollWidth 390, vùng cuộn chính scrollWidth 390 = clientWidth 390; dải Tin A overflow-x auto (scrollWidth 420 trong cột 158)
    mạng (evidence/E10-r2-network.txt): 0 fetch/xhr tới origin app (trang SSR, bấm/trước/sau/Esc không gọi mạng), 3 document /ops/review thành công, 0 request lỗi, 0 console error/warning, 0 exception
    khung vòng 1 (evidence/E10-step1..5.png, E10-network.txt) giữ nguyên, không ghi đè

## Known limits

- Dữ liệu local vẫn chưa có ảnh lưu trên máy (đo lại vòng 2: 0/1924 dòng `stg_zalo_posts` có `media_files`): nhánh ảnh local (`/api/zalo-media?snapshot=…`, không gắn referrerpolicy) chỉ được chứng ở test jsdom (E6), chưa thấy trên trang thật.
- Trạng thái «Ảnh hỏng» (AC-4) chỉ chứng ở jsdom (E4) và qua đột biến vòng 1: cả hai vòng, mọi URL fbcdn/Chợ Tốt còn sống nên E10 không gặp ô hỏng nào trên trang thật.
- E9 và E11 (design gate) chạy ở `--mode dom` trên tệp `.tsx`: `design-detect.mjs` đọc thẳng mã nguồn vào JSDOM như HTML, className/prop tính toán không được dựng, nên «0 P0» là tín hiệu yếu cho a11y/contrast; phần nhìn thật nằm ở E10.

## Ngoài hợp đồng

- `review-photos.tsx` giữ tập ảnh hỏng theo CHỈ SỐ (`broken: Set<number>`) trong khi key của ô là `img.src`: nếu `images` đổi thứ tự hoặc độ dài mà component không remount (ví dụ sau `router.refresh()`), dấu «Ảnh hỏng» có thể dính sang ảnh khác. Hiện thẻ được key theo `item.id` nên rủi ro thấp; không thuộc AC nào.
- Ở 390px dải ảnh cuộn ngang trong cột hẹp với `scrollbar-none` (dáng gốc của @reui/c-attachment-3): chỉ thấy khoảng 1,5 ô của Tin A, ô còn lại chỉ lộ qua mép mờ. Không vi phạm AC-9 (trang không cuộn ngang), nhưng là điểm UX đáng xem khi dựng lại trang.
- Lượt đăng nhập E10 vòng 1 tạo một dòng `sessions` cho tài khoản admin thử thường trực của kho (không phải tài khoản tạo mới); vòng 2 dùng lại phiên đó; người chấm không xoá dòng này.

## Analyst

Baseline khong do: E1–E6 trỏ vào `app/tests/review-photos.test.tsx`, E7 vào `scripts/smoke-review-photos.mjs`, E9 vào `review-photos.tsx`, E11 vào khoá config mới — các tệp/khoá này chưa có trên diffBase (main), chạy trên mã cũ không chứng gì. E8 (tsc + lint) là hàng rào hồi quy, không đo baseline.

Mã nguồn của việc không đổi giữa hai vòng: `git diff --stat 9648a03 c1adef1 -- app/src app/tests scripts/smoke-review-photos.mjs` rỗng; khác biệt là merge main (ngoài file của việc) và phần định nghĩa phép đo trong `_acceptance/` (config thêm `review_photos_design_gate` / `review_card_design_gate`, evals tách E9/E11, sổ quyết định d-20261023T034500Z-3).

Thử đột biến (vòng 1, worktree tạm đã gỡ; mã không đổi nên vẫn áp dụng): mỗi đột biến làm đỏ đúng ca mang nhãn AC tương ứng, các ca khác vẫn xanh (33/34).
- bỏ `referrerPolicy` → ca AC-6 đỏ; bỏ `loading="lazy"` → ca AC-6 đỏ
- bỏ `onError` trên img → ca AC-4 đỏ; đánh dấu hỏng cả dải khi một ảnh lỗi → ca AC-4 đỏ
- bỏ `disabled` ở hai đầu → ca AC-3 đỏ
- bỏ `<ReviewPhotos>` khỏi thẻ Bổ sung dữ liệu → ca AC-2 đỏ
- `images` undefined vẫn render vùng ảnh → ca AC-5 đỏ
- `stripEvidenceImages` không xoá `image_url` → ca «AC-7 (review-card-photos) stripEvidenceImages» trong review-media.test đỏ
- Không chạy được: bỏ hẳn lời gọi `stripEvidenceImages` trong `page.tsx` (cần dev server thứ hai). Suy luận: `evidence.offer_b.image_url` (Chợ Tốt) khi đó theo props của client component vào HTML của ops và dòng should-NOT-fire `cdn.chotot.com` của E7 sẽ bắt.

Chỗ eval/test không khớp trọn hợp đồng:
- AC-3 nói hộp thoại «đóng được», nhưng ca AC-3 jsdom không kiểm việc đóng; E10 bù (Esc đóng hộp, có nút Close) ở cả hai vòng. Nên thêm một assert đóng vào ca AC-3.
- Smoke E7 kiểm «HTML ops vẫn có hàng duyệt» bằng regex `/Cùng căn|Review Queue/`, không đếm thẻ; AC-7 nói «vẫn tải đủ thẻ». Kiểm độc lập của người chấm (cả hai vòng): ops 16 thẻ = admin 16 = review_queue 16.
- Vấn đề vòng 1 «E9 nối paths: mà design-gate chỉ đọc đối số cuối» đã được sửa: E9 và E11 mỗi eval ghim một file đích, target trong output khớp đúng file.

Non-discriminating evals: none measured green-on-both — baseline lane not run (see «Baseline khong do»); mutation probes above show E2–E6 and the strip helper discriminate.

## Variance

none — every eval is deterministic, single run per round.

## Iterations

Round 1 (HEAD 9648a03): người chấm chạy 10 eval, cả 10 xanh; báo E9 chỉ đo file cuối vì design-gate.mjs bỏ qua các đối số trước. Lần ký của Mạnh bị chặn vì làn ghim lại trước chữ ký đỏ ở E9: làn chạy `config:executors.design.gate` trần, không nối `paths:`, nên design-gate thiếu file đích. Trả về sửa định nghĩa phép đo, mã nguồn không đổi.
Round 2 (HEAD c1adef1): E9 ghim `review-photos.tsx`, thêm E11 ghim `review-card.tsx`; chạy lại cả 11 eval, cả 11 xanh; khung E10 chụp mới ở `evidence/E10-r2-step1..5.png`.
