---
schema_version: 2
feature_slug: hop-dong-nguoi-ban-s06
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7fcb0775d97fec0af8a7acde313888981235f601
human_signoff: Mạnh 2026-11-03
---

# Evidence Report: hop-dong-nguoi-ban-s06

Vòng verify 2, cây `43eb62a0` (nhánh `feat/s06-hop-dong-nguoi-ban`, đã gộp origin/main). Phiên chấm không viết mã này. DB local :5433 đang chạy. Không gọi nguồn ngoài: bộ thu chỉ chạy `--minutes 0`, hoặc chạy thật qua máy chủ giả trên 127.0.0.1 trong `hdnb_e2e`. Tên slug, run_id và tên tệp giữ nguyên vì cổng đối chiếu theo chúng; phần còn lại gọi nguồn bằng mã S06, S01. Trong trích dẫn, mã thoát nêu trong tên ca được ghi thành `<mã khác 0>`.

Cả 15 eval đều đạt `expected`; mỗi lệnh chung chạy một lần, riêng `hdnb_e2e` đúng một lượt Chrome. `npm test` toàn `pipeline/`: 455 test, 455 đạt, 0 lỗi. Sáu đột biến, đều bị bắt; thêm một đột biến không test nào bắt (xem Analyst). Hai điều người ký cần biết:

- `pipeline/thu-so-s06.mjs` ở HEAD KHÁC `a0a84973` đúng 2 dòng: lối vào chạy được qua symlink (`realpathSync`, commit `7e6e6763`). Phần còn lại giống hệt. Các eval chạy trên HEAD nên bằng chứng áp cho HEAD.
- Hai mục trung bình ngoài hợp đồng của vòng 1 (mất số khi dừng giữa lượt, Chrome ở lại) đã hết; còn các mục mức thấp, xem `review-findings.md`. F1 của vòng 1 vẫn còn nguyên; F2 thu hẹp còn ca từ ba tin trở lên.

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
| E10 | AC-9 | script | PASS |
| E11 | AC-10 | script | PASS |
| E12 | AC-10 | script | PASS |
| E13 | AC-11 | script | PASS |
| E14 | AC-12 | script | PASS |
| E15 | AC-12 | script | PASS |

## Evidence

E1 tới E3 chạy cùng lệnh `hdnb_nap`; E4 tới E7 và E15 cùng `hdnb_viec`; E9, E11, E13 cùng `hdnb_e2e` (một lượt Chrome); E10, E12, E14 cùng `hdnb_duong_ra`. Mỗi eval có một dòng run-log riêng, `"round":2`. Trích dẫn giữ các dòng liên quan.

- eval: E1
  run_id: hop-dong-nguoi-ban-s06-E1-r2-20261103T051625Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hdnb_nap
  verified_at: 2026-11-03T05:16:25Z
  output: |
    ✔ schemaVersion: cả hai importer chấp nhận {1..5} — v4 và v5 cùng lúc
    ✔ readSnapshot: manifest v5 + item có seller đọc qua (giữ seller trong payload)
    ✔ readSnapshot: v6 chưa khai vẫn bị từ chối rõ ràng
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0
  note: Bộ nạp và tệp test không đổi từ vòng 1 (diff rỗng). Ca v6 chỉ gọi bộ nạp S06; với bộ nạp S01, E1 chỉ so hằng số (F3, còn nguyên).

- eval: E2
  run_id: hop-dong-nguoi-ban-s06-E2-r2-20261103T051625Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hdnb_nap
  verified_at: 2026-11-03T05:16:25Z
  output: |
    ✔ đA: nạp v5 có số rồi nạp bản thường MỚI HƠN — phone còn nguyên, mô tả lấy bản mới
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0

- eval: E3
  run_id: hop-dong-nguoi-ban-s06-E3-r2-20261103T051625Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hdnb_nap
  verified_at: 2026-11-03T05:16:25Z
  output: |
    ✔ đB: lượt lấy số (hienSo) không đổi captured_at/payload, chỉ thêm seller; không đè tên, không xoá số
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0
  note: Vế should-NOT-fire: item lỗi không xoá số.

- eval: E4
  run_id: hop-dong-nguoi-ban-s06-E4-r2-20261103T051625Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hdnb_viec
  verified_at: 2026-11-03T05:16:25Z
  output: |
    ✔ tài khoản đã có số ở tin KHÁC tin mới nhất không vào việc
    ✔ đối chứng: tài khoản chưa có số vào việc đúng một lần dù có nhiều tin
    ℹ tests 8
    ℹ pass 8
    ℹ fail 0
  note: Eval gieo số trong stg ở tin không ẩn. F1 của vòng 1 vẫn còn ở hai ca góc, phiên chấm đo lại vòng 2: số chỉ trong state ở tin thứ ba ra 1 việc; số trong stg ở tin nay ẩn ra 1 việc.

- eval: E5
  run_id: hop-dong-nguoi-ban-s06-E5-r2-20261103T051625Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hdnb_viec
  verified_at: 2026-11-03T05:16:25Z
  output: |
    ✔ tin ẩn số không vào việc
    ℹ tests 8
    ℹ pass 8
    ℹ fail 0

- eval: E6
  run_id: hop-dong-nguoi-ban-s06-E6-r2-20261103T051625Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hdnb_viec
  verified_at: 2026-11-03T05:16:25Z
  output: |
    ✔ mặc định không lấy mẫu; --mau N tường minh mới thêm tin thứ hai
    ✔ pha 2 đã bỏ: thoát khác 0, không chạy
    ℹ tests 8
    ℹ pass 8
    ℹ fail 0

- eval: E7
  run_id: hop-dong-nguoi-ban-s06-E7-r2-20261103T051625Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hdnb_viec
  verified_at: 2026-11-03T05:16:25Z
  output: |
    ✔ thiếu S06_WEB_BASE: thoát khác 0, không có miền mặc định
    ✔ mã thu và tài liệu mới không chứa URL ngoài máy (miền nguồn chỉ ở env)
    ℹ tests 8
    ℹ pass 8
    ℹ fail 0
  note: Test chỉ tìm URL có giao thức. Mã mới của vòng 2 không thêm URL hay tên miền; log chỉ in `web=«che»`.

- eval: E8
  run_id: hop-dong-nguoi-ban-s06-E8-r2-20261103T051626Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.hdnb_luat_cu
  verified_at: 2026-11-03T05:16:26Z
  output: |
    ✔ upsert có WHERE EXCLUDED.captured_at >= dòng hiện có, đặt SAU mọi SET
    ✔ should-NOT-fire: dấu bằng bị đổi thành > sẽ hổng 'nạp lại cùng snapshot'
    ✔ manifest THIẾU finishedAt → từ chối: <mã khác 0>, KHÔNG sinh dòng NULL, không ghi snapshot
    ✔ dòng NULL CÓ SẴN vẫn cập nhật được bằng snapshot có mốc (không đóng băng ngược)
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0
  note: Làn hồi quy, xanh cả hai phía là dự kiến. Chỉ đọc chữ SQL (F4, còn nguyên).

- eval: E9
  run_id: hop-dong-nguoi-ban-s06-E9-r2-20261103T051646Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.hdnb_e2e
  verified_at: 2026-11-03T05:16:46Z
  output: |
    ✔ e2e (i) trang có số: thoát 0, [nấc] + [đối chiếu] lệch 0, số vào stg tạm
    ✔ e2e (ii) 429 + Retry-After: thoát 2 ngay, in số giây
    ✔ e2e (iii) SIGTERM giữa lượt: thoát 130, số đã thu vẫn vào stg tạm
    ℹ tests 3
    ℹ pass 3
    ℹ fail 0
  note: Chạy đúng một lần. Ca (ii) khẳng định `DỪNG NGAY` và `Retry-After 120 giây` trong đầu ra của tiến trình thật; ca (i) khẳng định `[nấc]`, `[đối chiếu]`, `lệch 0` và 2 số trong stg tạm. Cả ba kịch bản chạy `--threads 1`.

- eval: E10
  run_id: hop-dong-nguoi-ban-s06-E10-r2-20261103T051626Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.hdnb_duong_ra
  verified_at: 2026-11-03T05:16:26Z
  output: |
    ✔ canDungNgay: 403/429 dừng ngay (kèm nhãn Retry-After); captcha/khong-ra-so/timeout KHÔNG
    ✔ chonTinChuaHetHan: nhảy sang tin kế khi tin mới nhất het-han
    ✔ laChromeBoThuCuaLenh: chứa profileDir thì được tắt; không chứa thì sống
    ℹ tests 3
    ℹ pass 3
    ℹ fail 0

- eval: E11
  run_id: hop-dong-nguoi-ban-s06-E11-r2-20261103T051646Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.hdnb_e2e
  verified_at: 2026-11-03T05:16:46Z
  output: |
    ✔ e2e (i) trang có số: thoát 0, [nấc] + [đối chiếu] lệch 0, số vào stg tạm
    ✔ e2e (ii) 429 + Retry-After: thoát 2 ngay, in số giây
    ✔ e2e (iii) SIGTERM giữa lượt: thoát 130, số đã thu vẫn vào stg tạm
    ℹ pass 3
    ℹ fail 0
  note: Sau mỗi kịch bản test gọi `kiemSac` (không tiến trình chứa profile của kịch bản, tệp PID trống). Phiên chấm đếm độc lập: tiến trình mang `e2e-s06-state-` và mang `state/thu-so-s06/chrome-profile` là 0 trước và 0 sau lượt chạy này.

- eval: E12
  run_id: hop-dong-nguoi-ban-s06-E12-r2-20261103T051626Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.hdnb_duong_ra
  verified_at: 2026-11-03T05:16:26Z
  output: |
    ✔ laChromeBoThuCuaLenh: chứa profileDir thì được tắt; không chứa thì sống
    ℹ tests 3
    ℹ pass 3
    ℹ fail 0
  note: Chỉ kiểm hàm thuần. Nhánh «PID trong tệp là tiến trình lạ thì không đụng» trong `tatChrome` không có test (F5).

- eval: E13
  run_id: hop-dong-nguoi-ban-s06-E13-r2-20261103T051646Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.hdnb_e2e
  verified_at: 2026-11-03T05:16:46Z
  output: |
    ✔ e2e (iii) SIGTERM giữa lượt: thoát 130, số đã thu vẫn vào stg tạm
    ℹ pass 3
    ℹ fail 0

- eval: E14
  run_id: hop-dong-nguoi-ban-s06-E14-r2-20261103T051626Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.hdnb_duong_ra
  verified_at: 2026-11-03T05:16:26Z
  output: |
    ✔ chonTinChuaHetHan: nhảy sang tin kế khi tin mới nhất het-han
    ℹ tests 3
    ℹ pass 3
    ℹ fail 0
  note: Hàm chỉ nhìn hai tin mới nhất của tài khoản (F2 thu hẹp).

- eval: E15
  run_id: hop-dong-nguoi-ban-s06-E15-r2-20261103T051625Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.hdnb_viec
  verified_at: 2026-11-03T05:16:25Z
  output: |
    ✔ --threads lớn hơn 2: thoát 1; 2 luồng vẫn qua được bước kiểm
    ℹ tests 8
    ℹ pass 8
    ℹ fail 0
  note: Vế should-NOT-fire: 2 luồng qua được trần.

Network truth: không có eval `ui-check` nào. Cả 15 eval là `script`: n-a (driver).

Dọn dẹp: test dùng lược đồ tạm do chính nó tạo rồi xoá. Sau mọi lượt chạy, đọc `pg_namespace` không thấy lược đồ `e2e_s06_*` hay `thu_so_viec_*` nào còn sót. Cây thật chỉ thêm dòng vào `run-log.jsonl` và hai tệp báo cáo trong `_acceptance/hop-dong-nguoi-ban-s06/`. Không chạm `state/thu-so-s06` thật, không gọi nguồn thật.

### Lệnh suite (hồi quy)

- cmd: cd pipeline && npm test
  run_id: hop-dong-nguoi-ban-s06-SUITE-npm-test-r2-20261103T051836Z
  exit_code: 0
  verified_at: 2026-11-03T05:18:36Z
  output: |
    ℹ tests 455
    ℹ suites 26
    ℹ pass 455
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0

Ghi nhận: `thu-so-s06-e2e.itest.mjs` KHÔNG nằm trong `npm test`, vì glob của script là `'scripts/*.test.mjs'` và đuôi `.itest.mjs` không khớp; đầu ra `npm test` không có tệp này. Test này chỉ chạy qua `hdnb_e2e`.

## Known limits

- F1 (vòng 1) còn nguyên, trái nguyên văn AC-4 «ở bất kỳ tin nào»: số chỉ có trong state ở tin thứ ba của tài khoản ra 1 việc; số trong stg nằm trên tin nay ẩn, tài khoản còn tin khác không ẩn, ra 1 việc. Tối đa một lời gọi thừa mỗi tài khoản; hôm nay cả hai bằng 0 trên DB.
- F2 (vòng 1) đã thu hẹp: tài khoản hai tin, tin mới nhất `het-han`, nay ra 1 việc (đúng AC-12). Còn lại: tài khoản có từ ba tin mà hai tin mới nhất đều `het-han`, hoặc chỉ một tin `het-han`, vẫn ra 0 việc, vì `chonTinChuaHetHan` chỉ nhìn hai tin.
- F3, F4 của vòng 1 còn nguyên (bộ nạp và hai tệp test không đổi): E1 không chạy nhánh từ chối của bộ nạp S01; E8 chỉ đọc chữ SQL.
- F5 (mới): nhánh «PID trong tệp không mang profile của bộ thu thì không đụng» chỉ có test ở hàm thuần. Đột biến thay điều kiện kiểm bằng `if (false)` ở `tatChrome`: 11 test của `hdnb_duong_ra` và `hdnb_viec` vẫn xanh, và `hdnb_e2e` không dựng PID lạ.
- Cả ba kịch bản e2e chạy `--threads 1`. Đường hai luồng (hai tab, hai vòng `motLuong` ghi chung state) chưa chạy trên Chrome thật; lượt thật của ZCode dự kiến 2 luồng.
- Không có test cho nhánh «Chrome đang sống trên cổng CDP không phải của bộ thu» (thoát 1) và nhánh nối instance sống hợp lệ. Cả hai đọc mã thấy an toàn: không tắt tiến trình lạ.
- `pipeline/bu-seller-v5.mjs` không có test (đúng phạm vi hợp đồng).

## Ngoài hợp đồng

- Thấp: lượt kết thúc bình thường ghi lô cuối hai lần thành hai bản v5 và nạp hai lần (dòng 515 tới 521 của `thu-so-s06.mjs`); idempotent, thêm tối đa một dòng snapshot mỗi lượt. Đọc mã, chưa đo.
- Thấp: handler tín hiệu không dừng vòng thu; flush chạy song song với luồng đang thu, tin xong trong lúc flush nằm ở state chứ không ở stg tới lần bù.
- Thấp: hai luồng ghi `state.json` không có thứ tự, bản cũ có thể đè bản mới tới lần ghi kế.
- Thấp, không đổi từ vòng 1: lượt số làm mới mốc lần chạy S06 trên Ops; lượt thường v5 không có số làm mất tên, mã tài khoản, trạng thái khi cập nhật dòng đã có; item lượt số không có dòng stg vẫn báo đã nạp; dòng có số giữ `phoneStatus` lỗi; số có thể lấy từ thân trang; `con_lai` cao hơn thực tế. Hai mục vòng 1 mức trung bình (mất số khi dừng giữa lượt, Chrome ở lại) đã hết. Chi tiết: `review-findings.md`.

## Analyst

Non-discriminating evals: E8 xanh trên cả nhánh lẫn baseline (làn hồi quy có chủ ý); phần v6 của E1 xanh trên baseline theo bản chất. E1 tới E7 đỏ trên baseline theo đo vòng 1 (bản `ee3068da`; E4 tới E7 đỏ chỉ vì thiếu tệp, sức phân biệt lấy từ đột biến). Baseline khong do: E9 tới E15 (tệp test `thu-so-s06-e2e.itest.mjs`, `thu-so-s06.test.mjs` và ca `--threads` chưa tồn tại ở `ee3068da`, chạy trên mã cũ không chứng minh gì).

Đột biến trong bản chép ở scratchpad, cây thật không đổi. Bản nguyên chạy lại: xanh.

| Đột biến | Eval/test bắt | Kết quả |
|---|---|---|
| (a) `canDungNgay` luôn false | E10 | đỏ ở ca 403/429 dừng ngay; bắt được |
| (b) bỏ `await tatChrome()` trong `finally` | E11 (e2e i, ii) | đỏ: «còn tiến trình Chrome chứa profile»; bắt được |
| (c) bỏ gọi `_flushTruocThoat` trong handler tín hiệu | E13 (e2e iii) | đỏ: «số đã thu trước SIGTERM phải được flush»; bắt được |
| (d) trần `--threads` đổi thành 4 | E15 | đỏ: kỳ vọng thoát 1, thực tế thoát 0; bắt được |
| Thêm: `laChromeBoThuCuaLenh` luôn true | E12 | đỏ; bắt được |
| Thêm: `chonTinChuaHetHan` luôn trả tin đầu | E14 | đỏ; bắt được |
| Thêm: bỏ kiểm `laChromeBoThu` trong `tatChrome` (`if (false)`) | không eval nào | 11/11 xanh; KHÔNG bắt được (F5) |

(b) và (c) gộp trong MỘT lượt Chrome: cả ba kịch bản đỏ, đúng chỗ dự kiến; sau lượt này 18 tiến trình Chrome mang `e2e-s06-state-` còn sống, phiên chấm tắt hết, đếm lại 0. Lưu ý cho người chạy test: khi Chrome ở lại, kịch bản (i) treo khoảng 265 giây ở bước đóng máy chủ giả (Chrome giữ kết nối) rồi mới đỏ; chỉ xảy ra khi có lỗi, không ảnh hưởng lượt xanh.

Phép đo thêm của phiên chấm vòng 2 (lược đồ tạm, `--minutes 0`, state tạm):
- F1 số chỉ trong state ở tin thứ ba: 1 việc. Ở tin thứ hai: 0 việc (đúng).
- F1 số trong stg ở tin nay ẩn, còn tin khác không ẩn: 1 việc.
- F2 tài khoản hai tin, tin mới nhất `het-han`: 1 việc (đã sửa). Ba tin, hai tin mới nhất `het-han`: 0 việc. Một tin `het-han`: 0 việc.
- `git diff a0a84973 HEAD -- pipeline/thu-so-s06.mjs`: 2 dòng khác (import `realpathSync` và điều kiện lối vào), do commit `7e6e6763`; `a0a84973` là tổ tiên của HEAD.
- Bộ nạp (`import-chotot`, `import-airbnb`), `bu-seller-v5` và ba tệp test của chúng không đổi từ `19b7e7a8`.

Đọc mã `thu-so-s06.mjs` các đường ra: mọi khai báo `ketQua`, `errors`, `batch`, `flushTruocThoat`, `mau`, `deadline`, `chanLienTiep`, `thu`, `iViec` nằm ngoài `try` (dòng 392 tới 411), `finally` và phần tính `giayMoiTin` dùng được; `_tatChrome` đặt trước vòng chờ CDP nên tín hiệu lúc chờ CDP đã có lối tắt; `_flushTruocThoat` còn null thì handler bỏ qua flush, lúc đó chưa có số nào; `process.exit(1)` ở nhánh Chrome lạ nằm trước khi có tab và Chrome do bộ thu spawn, không bỏ sót gì; flush không gọi `client` đã đóng trên đường bình thường (lô đã `splice`, `daFlush` đã rỗng khi `finally` chạy lại).

## Variance

none — 15 eval tất định; các lượt cùng lệnh cho cùng kết quả.

## Iterations

Round 1: 8/8 eval đạt trên `19b7e7a8`, kèm F1 tới F4 và hai mục trung bình ngoài hợp đồng. Round 2: 15/15 eval đạt trên `43eb62a0`; hai mục trung bình đã hết, F2 thu hẹp, F1 còn.

### Re-pin lần 1 — 2026-11-03, do gộp main sau PR 292, mã bộ thu và bộ nạp không đổi
run_id: repin-20261103T065249Z-13438
sha: 6fd91d9fa783dbd5f71721d13f4f40aa2a211ade · suites: 6 lệnh exit 0 · evals: 15/15 eval máy đạt kỳ vọng

### Re-pin lần 2 — 2026-11-03, do gộp main sau PR 295, 296, 297; hai lượt trước đỏ do deadlock với enrich S03 đang chạy thật, nay enrich đã xong, mã bộ thu và bộ nạp không đổi
run_id: repin-20261103T103624Z-83428
sha: 7fcb0775d97fec0af8a7acde313888981235f601 · suites: 6 lệnh exit 0 · evals: 15/15 eval máy đạt kỳ vọng
