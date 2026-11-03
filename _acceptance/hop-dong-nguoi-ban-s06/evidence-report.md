---
schema_version: 2
feature_slug: hop-dong-nguoi-ban-s06
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 19b7e7a8ec5620fceb4ba9860230008a6903e6fd
human_signoff:
---

# Evidence Report: hop-dong-nguoi-ban-s06

Vòng verify 1, cây `19b7e7a8` (nhánh `feat/s06-hop-dong-nguoi-ban`, merge-base `ee3068da` = origin/main lúc chấm). Phiên chấm không viết mã này. DB local :5433 đang chạy. Không gọi nguồn ngoài, không mở trình duyệt: bộ thu chỉ chạy `--minutes 0`, còn phép đo đường thoát Chrome dùng một tiến trình giả.

Cả 8 eval đều đạt `expected`, và ba đột biến được giao đều bị bắt. Điều người ký cần biết trước khi ký:

- AC-4 đúng ở ca eval gieo, nhưng trái nguyên văn ở ba ca góc phiên chấm tự đo (F1, F2): hai dạng tài khoản đã có số vẫn ra 1 việc, và tài khoản chưa có số mà tin mới nhất hết hạn thì ra 0 việc. Hôm nay hai dạng đầu bằng 0 trên DB; dạng cuối có 3 tài khoản.
- Hai lỗi ngoài hợp đồng mức trung bình nằm ở bộ thu: dừng giữa lượt thì số vừa thu không tới stg, và Chrome ở lại sau một số đường thoát.

Hai mục dưới có nội dung, nên hồ sơ này không xanh-sạch và cần người đọc ở Cổng 2. Chi tiết: `review-findings.md`. Tên slug, run_id và tên tệp giữ nguyên vì cổng đối chiếu theo chúng; phần còn lại gọi nguồn bằng mã S06, S01. Trong trích dẫn, mã thoát nêu trong tên ca được ghi thành `<mã khác 0>`.

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

## Evidence

E1, E2, E3 chạy cùng lệnh `hdnb_nap`; E4 tới E7 chạy cùng lệnh `hdnb_viec`. Mỗi eval có một lượt chạy và một dòng run-log riêng. Trích dẫn giữ các dòng liên quan của lượt đó.

- eval: E1
  run_id: hop-dong-nguoi-ban-s06-E1-r1-20261103T034217Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hdnb_nap
  verified_at: 2026-11-03T03:42:17Z
  output: |
    ✔ schemaVersion: cả hai importer chấp nhận {1..5} — v4 và v5 cùng lúc
    ✔ readSnapshot: manifest v5 + item có seller đọc qua (giữ seller trong payload)
    ✔ readSnapshot: v6 chưa khai vẫn bị từ chối rõ ràng
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0
  note: Ca v6 chỉ gọi bộ nạp S06; với bộ nạp S01, E1 chỉ so hằng số (F3). Phiên chấm chạy thật cả hai với manifest giả, kết quả đúng AC-1 (xem Analyst).

- eval: E2
  run_id: hop-dong-nguoi-ban-s06-E2-r1-20261103T034229Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hdnb_nap
  verified_at: 2026-11-03T03:42:29Z
  output: |
    ✔ đA: nạp v5 có số rồi nạp bản thường MỚI HƠN — phone còn nguyên, mô tả lấy bản mới
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0
  note: Ca này khẳng định số, trạng thái, mã tài khoản, `displayName`, mô tả mới và `captured_at` mới. Không kiểm `seenAt`.

- eval: E3
  run_id: hop-dong-nguoi-ban-s06-E3-r1-20261103T034230Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hdnb_nap
  verified_at: 2026-11-03T03:42:30Z
  output: |
    ✔ đB: lượt lấy số (hienSo) không đổi captured_at/payload, chỉ thêm seller; không đè tên, không xoá số
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0
  note: Vế should-NOT-fire: item lỗi không xoá số. Ca này cũng ghim `phoneStatus` thành `error` trên dòng còn số; xem mục ngoài hợp đồng.

- eval: E4
  run_id: hop-dong-nguoi-ban-s06-E4-r1-20261103T034232Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hdnb_viec
  verified_at: 2026-11-03T03:42:32Z
  output: |
    ✔ tài khoản đã có số ở tin KHÁC tin mới nhất không vào việc
    ✔ đối chứng: tài khoản chưa có số vào việc đúng một lần dù có nhiều tin
    ℹ tests 7
    ℹ pass 7
    ℹ fail 0
  note: Eval gieo số trong stg ở tin không ẩn. Hai dạng khác trái nguyên văn AC-4 ở F1, F2.

- eval: E5
  run_id: hop-dong-nguoi-ban-s06-E5-r1-20261103T034233Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hdnb_viec
  verified_at: 2026-11-03T03:42:33Z
  output: |
    ✔ tin ẩn số không vào việc
    ℹ tests 7
    ℹ pass 7
    ℹ fail 0
  note: Test gieo chuỗi `"true"`, dữ liệu thật là boolean. Phiên chấm đo thêm với boolean thật: vẫn ra 0 việc.

- eval: E6
  run_id: hop-dong-nguoi-ban-s06-E6-r1-20261103T034235Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hdnb_viec
  verified_at: 2026-11-03T03:42:35Z
  output: |
    ✔ mặc định không lấy mẫu; --mau N tường minh mới thêm tin thứ hai
    ✔ pha 2 đã bỏ: thoát khác 0, không chạy
    ℹ tests 7
    ℹ pass 7
    ℹ fail 0

- eval: E7
  run_id: hop-dong-nguoi-ban-s06-E7-r1-20261103T034236Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hdnb_viec
  verified_at: 2026-11-03T03:42:36Z
  output: |
    ✔ thiếu S06_WEB_BASE: thoát khác 0, không có miền mặc định
    ✔ mã thu và tài liệu mới không chứa URL ngoài máy (miền nguồn chỉ ở env)
    ℹ tests 7
    ℹ pass 7
    ℹ fail 0
  note: Test chỉ tìm URL có giao thức. Phiên chấm quét thêm tên miền trần trong toàn bộ dòng thêm của diff: 0, không tính thư điện tử của chủ hồ sơ.

- eval: E8
  run_id: hop-dong-nguoi-ban-s06-E8-r1-20261103T034238Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.hdnb_luat_cu
  verified_at: 2026-11-03T03:42:38Z
  output: |
    ✔ upsert có WHERE EXCLUDED.captured_at >= dòng hiện có, đặt SAU mọi SET
    ✔ should-NOT-fire: dấu bằng bị đổi thành > sẽ hổng 'nạp lại cùng snapshot'
    ✔ manifest THIẾU finishedAt → từ chối: <mã khác 0>, KHÔNG sinh dòng NULL, không ghi snapshot
    ✔ dòng NULL CÓ SẴN vẫn cập nhật được bằng snapshot có mốc (không đóng băng ngược)
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0
  note: Làn hồi quy theo đúng AC-8, xanh cả hai phía là dự kiến. Phần «không lùi» chỉ đọc chữ SQL (F4); phiên chấm đo riêng bằng bộ nạp thật.

Network truth: không có eval `ui-check` nào. Cả 8 eval là `script`: n-a (driver).

Dọn dẹp: test dùng lược đồ tạm do chính nó tạo rồi xoá hoặc ROLLBACK. Sau mọi lượt chạy, đọc `pg_namespace` không thấy lược đồ tạm nào còn sót. Tiến trình giả thay Chrome đã được dừng. Cây thật chỉ thêm tệp trong `_acceptance/hop-dong-nguoi-ban-s06/`.

## Known limits

- **AC-4 trái nguyên văn ở ba ca góc, ngoài ca eval gieo (F1, F2).** Số chỉ có trong state ở tin thứ ba: ra 1 việc. Số trong stg nằm trên tin đã ẩn, tài khoản còn tin không ẩn: ra 1 việc. Tin mới nhất `het-han`, tài khoản còn tin khác chưa thử: ra 0 việc. Hai ca đầu tốn tối đa một lời gọi thừa mỗi tài khoản, hôm nay bằng 0 trên DB. Ca thứ ba làm rơi tài khoản khỏi hàng việc, hôm nay có 3 tài khoản. Phiên chấm giữ verdict theo eval và trình cho người quyết định nhận hay trả về.
- E1 không chạy nhánh từ chối của bộ nạp S01: thay chốt phiên bản bằng `if (false)` thì E1 vẫn xanh (F3). Cây thật đúng, đã đo trực tiếp.
- E8 không giữ ngữ nghĩa «không lùi»: đổi `OR ... IS NULL` thành `OR TRUE` thì E8 vẫn xanh (F4, đã biết từ hồ sơ `chotot-thieu-moc`). Cây thật đúng, đã đo trực tiếp.
- Bộ thu chưa chạy thật trên nguồn: test dừng trước khi mở trình duyệt, đúng phạm vi hợp đồng. `pipeline/bu-seller-v5.mjs` không có test, cũng đúng phạm vi; phiên chấm chỉ đọc mã và đo đường nạp nó dùng.
- Chưa chạy toàn bộ `npm test` của `pipeline/`. Đã chạy 11 tệp test có nhắc tới hai bộ nạp, tổng 163 ca đều xanh.

## Ngoài hợp đồng

- Trung bình: dừng giữa lượt (Ctrl-C, SIGTERM, lỗi ném) thì số vừa thu không tới stg; tới 24 tin gần nhất mất hẳn và phải gọi lại nguồn. Kết luận từ đọc mã, chưa đo trên lượt thật.
- Trung bình: Chrome ở lại khi ngắt lúc chờ CDP hoặc CDP không lên; đo bằng tiến trình giả, cả hai ca tiến trình còn sống sau khi lệnh thoát. Lượt sau nối vào instance đó và không bao giờ tắt nó.
- Thấp: lượt số làm mới mốc lần chạy S06 trên Ops, nên che được job thu thường đã chết; SLO độ tươi không bị ảnh hưởng.
- Thấp: lượt thường v5 không có số làm mất tên, mã tài khoản, trạng thái khi cập nhật dòng đã có; chưa có tác dụng vì lượt thường chưa ghi `seller`.
- Thấp: item lượt số không có dòng stg vẫn được log là đã nạp; dòng có số giữ `phoneStatus` lỗi; bộ thu không chờ theo Retry-After; số có thể lấy từ thân trang; hai lỗi vặt ở số báo cáo và trường tên. Xem `review-findings.md`.

## Analyst

Non-discriminating evals: E8 xanh trên cả nhánh lẫn baseline. Đây là làn hồi quy có chủ ý, không phải eval của tính năng. Phần v6 của E1 cũng xanh trên baseline theo bản chất, vì bộ nạp cũ từ chối mọi phiên bản khác 1. Các eval còn lại đều đỏ trên baseline, nhưng nên đọc kèm cách đo dưới đây.

Cách đo baseline: `git archive ee3068da` trong scratchpad, chép hai tệp test mới vào, symlink `node_modules` của `pipeline`.
- `hdnb_nap` nguyên trạng: đỏ ngay lúc nạp tệp test, vì bộ nạp cũ không có export. Lý do này chưa chứng minh hành vi.
- Thêm export, không đổi hành vi: pass 1, fail 4; ca v5 báo «schemaVersion 5 chưa hỗ trợ».
- Nới thêm phiên bản: pass 3, fail 2. đA đỏ đúng lý do ở khẳng định «KHÔNG được xoá phone». đB đỏ vì item mỏng đi vào đường UPSERT và vi phạm NOT NULL. Vậy E2, E3 phân biệt được thật.
- `hdnb_viec`: pass 0, fail 7, vì baseline chưa có `thu-so-s06.mjs`. Đỏ này không tự chứng minh gì; sức phân biệt của E4 tới E7 lấy từ đột biến.
- `hdnb_luat_cu`: pass 5, fail 0.

Đột biến trong bản chép ở scratchpad, cây thật không đổi. Bản nguyên chạy lại: pass 12, fail 0.

| Đột biến | Eval | Kết quả |
|---|---|---|
| (a) bỏ `displayName` khỏi nhánh ELSE của `UPSERT_SQL` | E2 | đỏ ở «KHÔNG được làm mất displayName»; bắt được |
| (b) bỏ bước loại tài khoản đã có số trong `docViec` | E4 | đỏ, 1 việc thay vì 0; bắt được |
| (c) bỏ `phone_hidden` khỏi truy vấn việc | E5 | đỏ, 2 việc thay vì 1; bắt được |
| Thêm: item lỗi ghi `phone: null` | E3 | đỏ; bắt được |
| Thêm: bỏ đường chỉ-người-bán | E3 | đỏ; bắt được |
| Thêm: mẫu mặc định khác 0 | E6 | đỏ; bắt được |
| Thêm: có miền mặc định trong mã | E7 | đỏ cả hai ca; bắt được |
| Thêm: bỏ chốt phiên bản của bộ nạp S01 | E1 | vẫn xanh; KHÔNG bắt được (F3) |
| Thêm: `OR TRUE` trong WHERE của UPSERT | E8 | vẫn xanh; KHÔNG bắt được (F4) |

Phép đo thêm của phiên chấm, không thay eval, dữ liệu giả trên lược đồ tạm trừ khi ghi rõ:
- Dòng có số, lượt thường cùng `captured_at`: số, trạng thái, mã tài khoản, tên giữ; mô tả lấy bản mới. Lượt thường cũ hơn: toàn dòng giữ. Đúng AC-2, AC-8.
- Lượt số thiếu `finishedAt`: bị từ chối, dòng không đổi. Đúng AC-8.
- Bộ nạp S01 chạy thật với manifest giả: v1 tới v5 qua chốt phiên bản, v6 bị từ chối. Bộ nạp S06: v1, v4, v5 nhận, v6 từ chối. Đúng AC-1.
- Trên DB thật, chỉ đọc, chỉ số đếm: `--minutes 0` ra 14.392 việc khi chưa có state; state của ZCode 678 số, cả 678 đều có trong stg; 7.722 tin ẩn số ở dạng boolean, 0 tin trong đó có số.

## Variance

none — 8 eval tất định; các lượt cùng lệnh cho cùng kết quả.

## Iterations

Round 1: 8/8 eval đạt trên `19b7e7a8`. PASS, kèm F1 tới F4 không chặn và các mục ngoài hợp đồng cho người đọc ở Cổng 2.
