# Review findings: s03-nap-argmax (round 1)

## Trong hợp đồng

- **F1 (thấp, không chặn) — ca «hai khối giống hệt» (AC-3) chỉ so từ `DS_DIR=$(find` tới `done); do`, bỏ sót `TS_RE`.**
  Hai script đều ghi chú «GIỐNG HỆT … hai bản phải không lệch nhau (BÁO 2510-5)» ngay trên `TS_RE`, nhưng `TS_RE` nằm
  TRƯỚC điểm bắt đầu so sánh. Đột biến (c3) trên bản sao: thêm `([0-9]{1})?` vào `TS_RE` của `apify-facebook-daily.sh` thì cả 4
  ca `nap-argmax.test.mjs` vẫn xanh, và `au3 ts-format`, `au3 mo-coi` cũng xanh. Ở HEAD hai bản `TS_RE` giống hệt (đã `diff`
  tay đoạn `TS_RE=` tới `done); do`), nên AC-3 vẫn đúng trên cây thật. Gợi ý cho bên làm: bắt đầu lát cắt của ca «giống hệt»
  từ dòng `TS_RE=` thay vì `DS_DIR=$(find` (ca chạy thật đã bắt đầu từ `TS_RE=`). Phiên chấm không sửa test.
- **F3 (thông tin, không phải lỗi) — hai ca còn lại của AC-3 và AC-2 ghép chặt vào chữ.** Test tách khối theo đúng chuỗi
  cuối `done | sort | while read -r _ d; do echo "$d"; done); do`. Bỏ `sort` (đột biến d) bị bắt, nhưng do «không tách được khối»,
  không do kiểm thứ tự. Hệ quả tốt: mọi sửa đổi ở cuối khối đều ồn ào. Hệ quả hạn chế: ca thứ tự mốc chưa được chứng minh có
  răng riêng. Không đề xuất sửa.

## Ngoài hợp đồng

- **F2 (thấp, không chặn) — danh sách rỗng và lỗi trong chuỗi `| sort | while` vẫn thoát 0.** `zalo-import-daily.sh` dòng 84-94 và
  `apify-facebook-daily.sh` dòng 104-114. Bản sửa bắt được `find` thoát khác 0 (dòng 84-86), đúng AC-2. Nhưng khi `find` thoát 0
  mà ra rỗng (ROOT sai, thư mục `collector/snapshots` bị dọn nhầm), `$(printf … | while … | sort | while …)` ra rỗng, vòng lặp bỏ
  qua, dòng `echo "$MAXTS" > "$STATE"` ghi lại đúng giá trị cũ và job thoát 0: chính kiểu «xanh giả» đã gây sự cố 02/11, chỉ khác
  nguyên nhân. Lỗi của `sort`/`while` bên trong `$(…)` cũng không lan ra (`pipefail` không áp ra ngoài thay thế lệnh). Không
  nằm trong AC (AC-2 chỉ nói «bước liệt kê lỗi»). Gợi ý: nếu `DS_DIR` rỗng trong khi `LAST` đã có mốc thì thoát khác 0.
  Quyết định thuộc người ký.

## Đã soát, không phải finding

Phạm vi soát: `git diff 0d57687f HEAD -- scripts/` (hai script, mỗi script +9 dòng/-1 dòng, cùng test mới) và các dòng ngữ
cảnh quanh khối (khoá, trap, ghi state).

- **`find` qua symlink `ROOT`.** `~/dev/one-invest` là symlink tới `onehub-invest`, và `ROOT` lấy từ `cd … && pwd` nên mang
  đường dẫn logic. Chỉ thành phần cuối của điểm bắt đầu mới có thể bị `find` không theo; `collector/snapshots` là thư mục
  thật (năm thư mục thị trường bên trong cũng thật, không symlink). Đo chỉ đọc qua đường symlink: 11.104 đến 11.110 bản thu
  S03 tuỳ lúc đo (collector đang ghi), tất cả ở độ sâu 2 dưới `hanoi`, 0 ở độ sâu 1; tổng đường dẫn 1.068.013 byte, vượt trần
  1.048.576, nên khuôn glob cũ vẫn gãy trên cây thật hôm nay. Khối mới ra đủ và đúng thứ tự mốc, 0 thư mục bắt đầu bằng dấu chấm.
- **`set -uo pipefail` và khoá state khi thoát 3.** Cả hai script lấy khoá và đặt `trap … EXIT` TRƯỚC `find` (zalo: khoá dòng
  64-68, find dòng 84; apify: khoá dòng 83-87, find dòng 104), nên `exit 3` đi qua trap và gỡ thư mục khoá. Chạy bản sao zalo
  ở ROOT tạm xác nhận: thoát 3, state giữ nguyên, khoá đã gỡ. Bản apify tương đương theo mã (trap dòng 87 xoá `$LOCK_DIR`).
  `exit 3` xảy ra trước `. scripts/lib/job-step.sh` ở zalo nên không in dòng ghim JOB FAIL (giống nhánh khoá bận cũ, thoát 1);
  launchd vẫn thấy mã 3 và stderr. ZJ-AC-3 của `zalo-import-job.test.mjs` xanh.
- **Hai script có khác chỗ nào ảnh hưởng khối mới không.** Đoạn từ `TS_RE=` tới `done); do` giống hệt từng byte (đã `diff`).
  Chỗ khác nằm ngoài khối: apify chạy bước thu và `import_one` dùng `TMPLOG` toàn cục; trap của apify xoá thêm `TMPLOG`; tên
  biến cờ lỗi là `FAILED` ở zalo và `NAP_FAILED` ở apify. Không ảnh hưởng khối liệt kê.
- **`for SNAP in $(…)` có giới hạn nào khác không.** Danh sách từ thay thế lệnh nằm trong bộ nhớ shell, không qua `exec`, nên
  không bị ARG_MAX. `printf` là builtin ở bash 3.2.57 (`/bin/bash`, cùng bản launchd dùng; kiểm bằng cách chạy khối với
  `/bin/bash` trên cây thật: ra đủ). Còn lại là giới hạn cũ, không đổi: tách từ theo khoảng trắng nếu đường dẫn có khoảng trắng
  (cây thật không có), `read -r d` cắt khoảng trắng đầu/cuối.
- **Khác biệt ngữ nghĩa nhỏ giữa glob cũ và `find`.** `find` không theo symlink (glob cũ theo), có thể khớp thư mục ở độ sâu 1
  và thư mục bắt đầu bằng dấu chấm (script đã bỏ loại sau ở dòng 88), và thoát khác 0 nếu một thư mục không đọc được hoặc biến
  mất giữa lúc duyệt (nghiêm hơn glob cũ, đúng ý «lỗi làm đỏ»). Cây thật: 0 symlink, 0 ở độ sâu 1. Thử tái hiện đua tên
  `.partial` ↔ tên cuối khi `find` đang chạy (3.000 thư mục, 150 lượt, vòng đổi tên song song): `find` không thoát khác 0 lần
  nào, nên rủi ro đỏ giả do đua tên là lý thuyết, và nếu xảy ra cũng chỉ làm lượt đó đỏ, state không ghi, lượt sau nạp tiếp.
- **Test chạy 36 giây** (4.000 thư mục tên dài, ca ARG_MAX), thoải mái dưới trần 300 giây của lệnh; ba ca còn lại dưới 1 giây.
