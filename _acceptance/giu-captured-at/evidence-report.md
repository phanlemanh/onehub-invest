---
schema_version: 2
feature_slug: giu-captured-at
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: be318a8e1da026a0582d5f52e89d101c716535f4
human_signoff:
---

# Evidence Report: giu-captured-at

Vòng 1, hạng T2. Bộ chấm không viết code (ZCode viết) và không viết hồ sơ. Mỗi eval chạy riêng một lần từ worktree `quirky-archimedes-75aa8c` @ be318a8. Harness dựng DB tạm `acc_capt_*` (chỉ chép schema). Sau E4, bộ chấm đã kiểm: không còn DB `acc_capt_%` nào trong container và không còn tệp `restore-captured-at-*.csv` trong `~/dev/onehub-invest/state/`. DB thật `oneinvest` chỉ bị đọc bằng SELECT trong giao dịch `BEGIN READ ONLY`.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | test | PASS |

## Evidence

- eval: E1
  run_id: giu-captured-at-E1-20261025T033652Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.capt_zalo
  verified_at: 2026-10-25T03:36:53Z
  output: |
    DB tạm: acc_capt_44951_12730 (không phải oneinvest)
    ok   nạp B thành công
    ok   INSERT mới: captured_at = giờ thu snapshot B (manifest.finishedAt), không phải giờ nạp
    ok   should-NOT-fire: nạp lại cùng snapshot → không dòng nào đổi captured_at
    ok   nạp snapshot cũ hơn sau: tin có ở cả hai → captured_at lùi về mốc thu SỚM NHẤT (LEAST)
    ok   tin chỉ có ở B giữ mốc B
    ok   should-NOT-fire: nạp lại B sau A không đẩy mốc lên lại
    ok   không dòng nào mang giờ nạp (now()): 0 dòng trong 1 giờ qua
    ZALO PASS

- eval: E2
  run_id: giu-captured-at-E2-20261025T033700Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.capt_zalo
  verified_at: 2026-10-25T03:37:01Z
  output: |
    DB tạm: acc_capt_46395_20208 (không phải oneinvest)
    ok   should-NOT-fire: nạp lại cùng snapshot → không dòng nào đổi captured_at
    ok   nạp snapshot cũ hơn sau: tin có ở cả hai → captured_at lùi về mốc thu SỚM NHẤT (LEAST)
    ok   tin chỉ có ở B giữ mốc B
    ok   should-NOT-fire: nạp lại B sau A không đẩy mốc lên lại
    ok   không dòng nào mang giờ nạp (now()): 0 dòng trong 1 giờ qua
    ZALO PASS

- eval: E3
  run_id: giu-captured-at-E3-20261025T033707Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.capt_chotot
  verified_at: 2026-10-25T03:37:08Z
  output: |
    DB tạm: acc_capt_47189_27674 (không phải oneinvest)
    ok   nạp snapshot cũ
    ok   INSERT mới: captured_at = giờ thu snapshot (manifest.finishedAt)
    ok   snapshot MỚI hơn: snapshot_id VÀ captured_at cùng tiến
    ok   should-NOT-fire: nạp lại snapshot CŨ sau → snapshot_id và captured_at không lùi
    ok   bất biến: captured_at = collected_at của snapshot dòng đang trỏ (0 dòng lệch)
    ghi nhận: giá sau khi nạp lại snapshot cũ = 1000000000 (snapshot mới 1200000000)
    CHOTOT PASS

- eval: E4
  run_id: giu-captured-at-E4-20261025T033716Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.capt_restore
  verified_at: 2026-10-25T03:37:17Z
  output: |
    DB tạm: acc_capt_48597_36831 (không phải oneinvest)
    ok   --dry: báo 1 dòng zalo sai mốc, không đổi gì
    ok   --apply: có tệp sao lưu CSV trước khi đổi (/Users/manhphan/dev/onehub-invest/state/restore-captured-at-2026-10-25T03-37-17-579Z.csv)
    ok   --apply: dòng sai mốc về đúng giờ thu snapshot
    ok   --undo: trả lại đúng giá trị trước --apply
    ok   --apply lại sau --undo: ra đúng kết quả lần đầu
    RESTORE PASS

- eval: E5
  run_id: giu-captured-at-E5-20261025T033725Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-25T03:37:35Z
  output: |
    ✔ gọi qua symlink (như ~/dev/one-invest) main vẫn chạy — không thoát 0 im lặng
    ✔ AC-1 mười hai lối vào chạy qua symlink
    ✔ mediaFilesOf: gắn snapshotId vào từng phần tử, giữ nguyên field hợp đồng
    ℹ tests 129
    ℹ pass 129
    ℹ cancelled 0
    ℹ skipped 0
    ℹ duration_ms 10105.319375
  note: |
    Toàn bộ 129 test xanh. Test entrypoint-symlink mà ZCode báo đỏ sẵn trên main nay xanh trên nhánh
    (đã gộp origin/main @ ac70fec). Vì không có test đỏ nên không cần đối chiếu worktree origin/main.

## Known limits

- **Số dòng `--dry` trên DB thật lớn hơn số sự cố ghi trong hợp đồng.** Bộ chấm chỉ đếm bằng SELECT, trong giao dịch READ ONLY, với đúng điều kiện `captured_at <> collected_at` của script. Kết quả lúc 2026-10-25 ~03:40Z: `stg_zalo_posts` có 5.729/5.729 dòng sẽ đổi, `stg_chotot_ads` có 17.810/17.810 dòng sẽ đổi. Hợp đồng ghi 4.092 / 15.515. Phân tách theo độ lệch:
  - Zalo: 4.186 dòng lệch trên 1 giờ, tức đúng loại dòng của sự cố. 1.543 dòng còn lại lệch dưới 1 giờ, trong đó 842 dòng lệch dưới 30 giây vì độ trễ nạp. 1.260 dòng trong số đó thuộc snapshot `zalo-mock`.
  - Chợ Tốt: 3.922 dòng lệch trên 1 giờ. 13.888 dòng lệch dưới 1 giờ, trong đó có 4.768 dòng sớm hơn `collected_at` từ 1 đến 165 giây. Lý do là importer cũ ghi `it.fetchedAt` khi INSERT.
  - Script coi mọi dòng không bằng ĐÚNG giờ thu là sai. Theo luật đã chốt thì đúng, và hướng đổi luôn là về giờ thu, nên vô hại. Có điều sổ trước/sau sẽ không khớp con số 4.092/15.515, nên người chạy `--apply` cần biết trước.
- **Số dòng sai vẫn tăng chừng nào launchd còn chạy importer cũ.** Checkout chính đứng ở `main` @ ac70fec, bản này chưa có bản sửa. Hiện có 1.232 dòng Zalo và 8.730 dòng Chợ Tốt mang `captured_at` ngày 25/10, sau ngày sự cố. Phải chạy `--apply` SAU khi bản sửa đã merge và launchd đã chạy code mới. Chạy trước thì lượt nạp đêm sẽ đặt lại `now()`.
- **Sao lưu CSV không hoàn tác chính xác tới micro giây.** CSV ghi `captured_at` qua `Date.toISOString()` của node-pg, chỉ giữ tới mili giây. Trên DB thật, 5.723/5.729 dòng Zalo và 13.023/17.810 dòng Chợ Tốt có phần dưới mili giây. Ví dụ PG lưu `03:43:45.361124+00` thì CSV ghi `03:43:45.361Z`. `--undo` vì vậy trả về giá trị lệch dưới 1 ms. Về mặt nghiệp vụ thì không đáng kể. E4 không bắt được điểm này vì harness cũng so ở mức mili giây.
- **`--undo` chạy hai lần là an toàn** (đọc code): lệnh chỉ ghi giá trị cố định từ tệp theo khoá chính, không đọc trạng thái DB, nên lặp lại cho cùng kết quả. Rủi ro chỉ đến từ việc dữ liệu đã đổi giữa `--apply` và `--undo`, xem mục Ngoài hợp đồng.
- **Baseline n-a cho E1–E5.** Lượt chấm này không chạy harness trên importer của `origin/main`, vì đề giao chỉ cho chạy các lệnh `config:`. Hồ sơ ghi kiểm biết-đỏ do người dựng tự làm: zalo đỏ 6 mục, chotot đỏ 4 mục. `restore-captured-at.mjs` chưa có trên main.

## Ngoài hợp đồng

**Nạp lại snapshot Chợ Tốt cũ làm giá/payload lùi, trong khi `snapshot_id` vẫn trỏ snapshot mới**
- Người dùng thấy gì: sau một lượt nạp lại snapshot cũ (đúng kiểu sự cố 24/10, hoặc khi backfill), `transform-chotot.mjs` đọc `price` từ stg rồi `UPDATE sale_offers SET price_vnd = EXCLUDED.price_vnd`. Giá tin trên cổng Invest vì thế lùi về giá cũ cho tới lượt nạp đêm kế tiếp, và không có dấu hiệu nào báo. Harness E3 in đúng chuyện này: giá 1.000.000.000 sau khi nạp lại, trong khi snapshot mới là 1.200.000.000. So với trước bản sửa, mức nhất quán còn kém hơn: trước kia `snapshot_id` đi cùng nội dung (cả hai cùng cũ), nay dòng ghi «snapshot mới» nhưng mang nội dung của snapshot cũ. Ghi chú «trend query join theo snapshot_id» trong importer sẽ quy giá cũ cho snapshot mới.
- Căn cứ: `ON CONFLICT ... DO UPDATE` vẫn ghi đè vô điều kiện `price, price_string, size_m2, subject, ward_name, ward_name_v3, seller, images, payload`. Chỉ `snapshot_id` và `captured_at` có CASE chặn. Trên DB thật lúc này, quét 13 snapshot cho thấy 17.810/17.810 dòng đang trỏ đúng snapshot mới nhất có chứa tin, tức hiện chưa có dòng nào bị lùi.
- file: pipeline/import-chotot.mjs (dòng 70–82); hạ nguồn pipeline/transform-chotot.mjs (dòng 39, 84–86)
- severity: medium (âm thầm, tạm thời, chỉ xảy ra khi nạp lại snapshot cũ; đường nạp đêm `--latest` không dính)
- Đề xuất: new-contract (chặn cả câu UPDATE bằng `... DO UPDATE SET ... WHERE EXCLUDED.captured_at >= stg_chotot_ads.captured_at`, nhưng chỉ làm sau khi đã khôi phục mốc, kẻo mốc đang bị thổi phồng chặn cập nhật hợp lệ)

**Script khôi phục và importer Zalo dùng hai luật khác nhau cho mốc khi có snapshot nạp lệch thứ tự**
- Người dùng thấy gì: hiện chưa thấy gì. Giả sử một bài có trong snapshot B (nạp trước) và snapshot A (cũ hơn, nạp sau). Importer đặt `captured_at = LEAST` = giờ của A, còn `snapshot_id` vẫn là B. Sau đó `restore-captured-at.mjs --dry` coi dòng này là «sai» và `--apply` đẩy mốc lên giờ của B. Lần nạp lại A kế tiếp kéo mốc xuống lần nữa. Hai công cụ giằng co nhau, và «Luồng 7 ngày» có thể lệch theo.
- Căn cứ: dòng 36–41 của script khôi phục so với `s.collected_at` của `p.snapshot_id`, còn importer (dòng 107) dùng `LEAST(cũ, EXCLUDED)`. Đúng kịch bản B-trước-A của harness E1 sẽ tạo ra một dòng như vậy. Trên DB thật, quét 1.989 snapshot zalo-agent cho thấy chưa bài nào xuất hiện ở hơn một snapshot, và 4.469/4.469 dòng đang trỏ snapshot sớm nhất. Hiện có 0 dòng bị ảnh hưởng.
- file: pipeline/restore-captured-at.mjs (dòng 33–43), pipeline/import-airbnb.mjs (dòng 107)
- severity: low
- Đề xuất: known-limits

**Script khôi phục đụng cả dòng không thuộc sự cố, gồm dữ liệu mock và dòng chỉ lệch vài giây**
- Người dùng thấy gì: `--apply` trên DB thật sẽ ghi toàn bộ 23.539 dòng (5.729 + 17.810), không chỉ khoảng 8.100 dòng lệch trên 1 giờ. Trong số đó có 1.260 dòng `zalo-mock`. Kết quả là tệp sao lưu và số «đã đổi» trong sổ lớn hơn nhiều so với số sự cố. Giá trị mới vẫn đúng luật.
- Căn cứ: điều kiện `captured_at <> s.collected_at` là bằng nhau tuyệt đối. Không có ngưỡng và không lọc theo nguồn snapshot.
- file: pipeline/restore-captured-at.mjs (dòng 36–52)
- severity: low
- Đề xuất: known-limits

**`--undo` dựa vào sao lưu chỉ có (khoá, captured_at), nên chạy sau một lượt nạp có thể phá bất biến của Chợ Tốt**
- Người dùng thấy gì: giả sử `--apply` xong, nạp đêm cho `snapshot_id` và `captured_at` tiến lên, rồi mới chạy `--undo`. Lúc đó `captured_at` bị trả về giá trị `now()` sai cũ, trong khi `snapshot_id` là snapshot mới. Bất biến `captured_at = collected_at` bị vỡ. Mốc «thu» bị thổi phồng còn có thể khiến CASE của importer bỏ qua một snapshot hợp lệ có giờ thu nằm giữa hai mốc. Ngoài ra, giữa SELECT sao lưu và UPDATE không có khoá dòng hay giao dịch chung. Nếu importer cũ chạy chen vào giữa, UPDATE có thể đổi một dòng không có trong sao lưu.
- Căn cứ: CSV header `table,pk,captured_at` không có `snapshot_id`. `--undo` không kiểm dòng còn khớp trạng thái lúc sao lưu không. `lay` và `doi` là hai câu riêng (dòng 96 và 127).
- file: pipeline/restore-captured-at.mjs (dòng 65–89, 110–134)
- severity: low
- Đề xuất: known-limits

## Analyst

Non-discriminating evals: không xác định được trong lượt này, vì baseline không đo (n-a cho cả 5 eval).

Baseline khong do: lượt chấm chỉ được chạy các lệnh `config:` của evals trên nhánh. Chạy harness trên importer của `origin/main` là ngoài phạm vi được giao. Hồ sơ ghi kiểm biết-đỏ do người dựng tự làm (zalo 6 mục, chotot 4 mục). `pipeline/restore-captured-at.mjs` không tồn tại trên main nên E4 trên baseline không chứng minh gì. E5 là lệnh hồi quy, xanh cả hai phía là điều mong đợi.

## Variance

none — mọi eval chạy một lần, tất định. E1 và E2 dùng chung lệnh, chạy hai lần độc lập và cho kết quả giống hệt nhau.

## Iterations

Round 1: E1–E5 đạt. Ghi 4 phát hiện ngoài hợp đồng (1 medium, 3 low), không phát hiện nào chặn AC.
