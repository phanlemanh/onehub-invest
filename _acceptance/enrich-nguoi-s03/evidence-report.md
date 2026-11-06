---
schema_version: 2
feature_slug: enrich-nguoi-s03
verdict: REJECT
failed_evals: [SUITE-app_ui]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 34318a485c56d8f1c5d3753316cc6583182e93a6
human_signoff:
---

# Evidence Report: enrich-nguoi-s03

Vòng 1. Mười eval máy và ui-check (E1–E8, E7u) đều đạt. Vòng vẫn bị trả vì một hồi quy mới trong suite `cd app && npm test`:
ca `GT-AC-1` của `app/tests/giai-thich-nhan-chua-xac-minh.test.tsx` đỏ do đổi chữ lời giải thích nhãn số ở
commit 6d06fa35 của chính vòng này. E9 và E10 (judgment) để trống: chờ hội đồng.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E7u | AC-7 | ui-check | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | judgment | chờ hội đồng |
| E10 | AC-10 | judgment | chờ hội đồng |
| SUITE-app_ui | (hồi quy) | suite | FAIL — hồi quy mới GT-AC-1 |

## Evidence

E1–E6 dùng chung một lần chạy lệnh `en_test` (13 ca, 13 đạt, 0 hỏng, khoảng 159 giây). Mỗi eval đọc ca «EN-AC-n» của mình.

- eval: E1
  run_id: enrich-nguoi-s03-E1-20261106T031423Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.en_test
  verified_at: 2026-11-06T03:17:06Z
  output: |
    ✔ EN-AC-1/AC-2 DB: liên lạc của người gửi fixture qua transform + bước đêm thật; lượt 2 bằng 0; số chung rút; bài vắng giữ
    ✔ EN-AC-1 thuần: bảng 7 ô liên lạc
    ✔ EN-AC-1 chiều đỏ: tắt luật số chung thì ô so-chung-hai-nguoi đỏ
    ℹ tests 13 · pass 13 · fail 0

- eval: E2
  run_id: enrich-nguoi-s03-E2-20261106T031423Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.en_test
  verified_at: 2026-11-06T03:17:06Z
  output: |
    ✔ EN-AC-1/AC-2 DB: liên lạc của người gửi fixture qua transform + bước đêm thật; lượt 2 bằng 0; số chung rút; bài vắng giữ
    ✔ EN-AC-2 bảng: CHECK nhận/từ chối, chỉ thêm, rút có lý do
    ℹ tests 13 · pass 13 · fail 0

- eval: E3
  run_id: enrich-nguoi-s03-E3-20261106T031423Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.en_test
  verified_at: 2026-11-06T03:17:06Z
  output: |
    ✔ EN-AC-3 thuần: bảng 8 ô luật chọn số
    ✔ EN-AC-3 chiều đỏ: đảo ưu tiên tin/bài thì ô 1-tin-1-bai đỏ
    ✔ EN-AC-3 DB: Người đã gộp đọc liên lạc ở người cuối chuỗi
    ℹ tests 13 · pass 13 · fail 0

- eval: E4
  run_id: enrich-nguoi-s03-E4-20261106T031423Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.en_test
  verified_at: 2026-11-06T03:17:06Z
  output: |
    ✔ EN-AC-4: gán qua người đăng trên transform thật; S05/S06 không đổi; chạy lại 0; transform lại không làm tin rơi về NULL
    ✔ EN-AC-4 chiều đỏ: transform không gọi bộ gán thì ô nhan-so rơi về NULL
    gán số qua người đăng: đổi 744 · gán 744 (so_tren_tin=663 so_trong_bai=81) · rút 0 · bỏ dấu 0
    gán số qua người đăng: đổi 0 · gán 0 (0) · rút 0 · bỏ dấu 0

- eval: E5
  run_id: enrich-nguoi-s03-E5-20261106T031423Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.en_test
  verified_at: 2026-11-06T03:17:06Z
  output: |
    ✔ EN-AC-5: view 079, rào chưa áp, kiểm DQ so-chua-xac-minh
    ✔ EN-AC-5: DB chưa áp 079 — transform S03 và bước đêm chạy như hôm nay
    ℹ tests 13 · pass 13 · fail 0

- eval: E6
  run_id: enrich-nguoi-s03-E6-20261106T031423Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.en_test
  verified_at: 2026-11-06T03:17:06Z
  output: |
    lien-lac-nguoi: +328 liên lạc (so_trong_bai=39 so_tren_tin=289) · rút 0 số chung · số chung 99 · người gửi chưa có Người 137
    ✔ EN-AC-6: số suy không quay lại làm bằng chứng; chiều đỏ khi bỏ dấu
    ℹ tests 13 · pass 13 · fail 0

- eval: E7
  run_id: enrich-nguoi-s03-E7-20261106T031720Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.en_api
  verified_at: 2026-11-06T03:17:21Z
  output: |
    ✔ EN-AC-7 hai route thật: tin S03 số qua người đăng mang nhãn, số trực tiếp không
    ✔ EN-AC-7 chiều đỏ: view 070 (chưa nhận dấu S03) thì ca nêu phoneInferred của s03-suy
    ✔ EN-AC-7 lời giải thích nhãn số nói số có thể suy từ tin hoặc bài khác của cùng tài khoản
    ℹ tests 3 · pass 3 · fail 0

- eval: E7u
  run_id: enrich-nguoi-s03-E7u-20261106T031847Z
  exit_code: 0
  verifier: playwright-core (collector/node_modules) + Chrome headless, dev server :3463 trên DB thử oneinvest_en_ui
  verified_at: 2026-11-06T03:19:30Z
  screenshot: evidence/E7u-truoc.png
  frames: [evidence/E7u-truoc.png, evidence/E7u-sau.png, evidence/E7u-hai-nhan.png, evidence/E7u-giai-thich.png, evidence/E7u-giai-thich-tin.png]
  observed: |
    Trang tin thuê S03 Hà Nội (offer_2d735797ab849665, dấu s03-qua-nguoi-dang): khối «Người đăng» có Badge vàng «Chưa xác minh» + ⓘ cạnh nút «Xem số»; sau khi bấm, nút thành link gọi (tel:) với số bị che bằng ô xám, Badge vẫn còn; cùng trang có nhãn cấp tin «Chưa xác minh» dưới giá.
    Rê lên nhãn số: popover «Số chưa xác minh» nói số suy «từ tin hoặc bài khác của cùng tài khoản», kèm «Xem phương pháp»; rê lên nhãn cấp tin: popover «Tin chưa xác minh» nói tin từ nhóm cộng đồng — hai tên khác nhau.
    Không ảnh nào lộ số điện thoại (thân trang trước khi bấm không khớp mẫu SĐT; số sau khi bấm bị che). Ảnh E7u-hai-nhan là cả trang tin (chứa đủ hai nhãn), không phải thẻ trên trang Cho thuê.
  network_observed: clean

- eval: E8
  run_id: enrich-nguoi-s03-E8-20261106T031726Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.en_do
  verified_at: 2026-11-06T03:17:54Z
  output: |
    truoc tin_song=4359 co_so=2553 thue=1363 ban=1190
    sau   tin_song=4359 co_so=3295 thue=1949 ban=1346
    gan   so_tren_tin=662 so_trong_bai=80 thue=586 ban=156 doi=742
    lien_lac moi=324 so_chung=98 khong_nguoi=137 nhieu_so=84
    md5_khop=true
  note: |
    sau − trước = 742 = gan; theo rule và theo bán/thuê khớp đúng mốc 06/11 (662, 80; 586, 156). Đầu ra không khớp mẫu SĐT.
    Kiểm thêm vế «từ chối DB tên oneinvest»: cùng script với DATABASE_URL trỏ DB oneinvest bị từ chối trước khi kết nối, mã thoát 2 như hợp đồng nói.
    Ca đột biến bất biến sai nằm ở ca «EN-AC-8 thuần» của en_test (đạt).

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: enrich-nguoi-s03-SUITE-agent-20261106T032021Z
  exit_code: 0
  verified_at: 2026-11-06T03:20:38Z
  output: |
    ℹ tests 287 · pass 281 · fail 0 · skipped 6
  note: |
    Lượt đầu (run_id enrich-nguoi-s03-SUITE-agent-20261106T031919Z) đỏ đúng một ca «AC-10 migration idempotent» vì
    lock timeout khi nạp lại 044 trên DB dùng chung oneinvest; chạy lại 32 giây sau thì xanh trọn. Vòng không đổi gì ở agent/
    ngoài vocab.generated.ts — xếp là nhiễu khoá DB, không phải hồi quy (xem Variance).

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: enrich-nguoi-s03-SUITE-app_tsc_lint-20261106T032045Z
  exit_code: 0
  verified_at: 2026-11-06T03:21:03Z
  output: |
    ✖ 3 problems (0 errors, 3 warnings) — ba cảnh báo ở tệp ngoài vòng

- cmd: cd app && npm test
  run_id: enrich-nguoi-s03-SUITE-app_ui-20261106T032108Z
  exit_code: 1
  verified_at: 2026-11-06T03:43:54Z
  output: |
    ℹ tests 1020 · pass 1009 · fail 1 · skipped 10
    ✖ GT-AC-1 bấm nhãn trên thẻ ra đúng lời giải thích và đúng mục Phương pháp
      AssertionError [ERR_ASSERTION]: GT-AC-1 «Số chưa xác minh» thiếu lời giải thích
          at app/tests/giai-thich-nhan-chua-xac-minh.test.tsx:103:12
  note: |
    HỒI QUY MỚI, không phải đỏ có từ trước so với main. Ca GT-AC-1 đòi lời giải thích nhãn số chứa «suy từ tin khác».
    Trên diffBase e0d388a6, OFFER_LABEL_HELP.phone.body là «… suy từ tin khác cùng tài khoản …» (khớp). Commit 6d06fa35
    của vòng này đổi thành «… suy từ tin hoặc bài khác của cùng tài khoản …», nên chuỗi «suy từ tin khác» không còn.
    Chạy riêng tệp này hai lần đều cho 3 đạt, 1 hỏng (tất định). Chữ «đỏ sẵn» trong duong-nen.md đo ở sha 8d32780b, đã
    có commit 6d06fa35, nên đó chính là hồi quy này chứ không phải lỗi có từ trước trên main.

- cmd: cd pipeline && npm test
  run_id: enrich-nguoi-s03-SUITE-pipeline-20261106T034428Z
  exit_code: 0
  verified_at: 2026-11-06T04:00:03Z
  output: |
    ℹ tests 606 · suites 26 · pass 606 · fail 0 · skipped 0 (khoảng 935 giây)

- cmd: cd app && npm run test:lint-rules
  run_id: enrich-nguoi-s03-SUITE-ui_lint_rules-20261106T032006Z
  exit_code: 0
  verified_at: 2026-11-06T03:20:06Z
  output: |
    ℹ tests 165 · pass 165 · fail 0

- cmd: node scripts/check-portal-compliance.mjs
  run_id: enrich-nguoi-s03-SUITE-portal_static-20261106T032006Z
  exit_code: 0
  verified_at: 2026-11-06T03:20:06Z
  output: |
    portal-compliance: ĐẠT

### Judgment (chờ hội đồng)

- eval: E9
  judged_by: chờ hội đồng (phiên điều phối chấm và gộp)
  verdict:
  rationale:
  human_override:

- eval: E10
  judged_by: chờ hội đồng (phiên điều phối chấm và gộp)
  verdict:
  rationale:
  human_override:

## Known limits

- Ca «AC-8 thước dư lượng» trong `pipeline npm test` hết giờ 300 giây cả trên main (đối chứng 06/11, duong-nen.md). Lượt này pipeline chạy trọn 606 ca xanh, ca đó không hết giờ — giới hạn có từ trước vẫn giữ trong ghi chú.
- duong-nen.md ghi suite `cd app && npm test` đỏ sẵn; lượt này đo lại cho thấy cái đỏ đó là ca GT-AC-1, do chính vòng này gây ra (đo ở sha 8d32780b, sau commit đổi chữ), nên không xếp vào lỗi có từ trước.
- E7u: tệp mạng thô (một document và một fetch `/api/v1/listings/<id>/contact` tới gốc app, cả hai thành công) chỉ lưu ở scratchpad của phiên chấm, không ghi vào `evidence/` vì phạm vi ghi của tác tử chấm chỉ gồm ảnh E7u-*.png; pre-merge có thể NOTE vì thiếu `evidence/E7u-network.txt`.
- E7u chụp trên trang tin `/listing/<id>` (cả trang chứa hai nhãn), không chụp thẻ trên trang Cho thuê.
- Suite agent lượt đầu đỏ vì lock timeout trên DB dùng chung, lượt lại xanh (xem Variance).

## Ngoài hợp đồng

## Analyst

Baseline khong do: lượt chấm này không chạy eval trên diffBase. Các tệp lệnh của E1–E8 (`enrich-nguoi-s03.test.mjs`, `.itest.mjs`, `app/tests/enrich-nguoi-s03.test.tsx`, `do-lien-lac-nguoi.mjs`) chưa có trên diffBase e0d388a6, nên chạy trên mã cũ không chứng minh gì; mỗi eval có ca chiều đỏ trên bản đột biến cùng fixture (đều đạt).

## Variance

Không eval nào chạy nhiều lần. Suite agent lật một lần: lượt đầu đỏ một ca (AC-10, lock timeout khi nạp lại 044 trên DB dùng chung), lượt lại 32 giây sau xanh trọn. Đánh dấu flaky môi trường, ngoài vùng vật của vòng.

## Iterations

Round 1: mọi eval máy và ui-check đạt (E1–E8, E7u); suite `cd app && npm test` có hồi quy mới GT-AC-1 do đổi chữ lời giải thích nhãn số (commit 6d06fa35) mà không sửa ca test cũ đòi «suy từ tin khác». E9, E10 chờ hội đồng. Trả về vòng code.
