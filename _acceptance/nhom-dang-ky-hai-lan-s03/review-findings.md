## Trong hợp đồng

- **Hình dạng 5 (kèm 4) — vế «sổ và bài toàn khoá trần hoặc khoá lạ → mẫu y hệt» của AC-4 tuyên cả lớp khoá nhưng chỉ thử ba khoá không có dấu hai chấm, nên không đột biến khoá nào làm nó đỏ**
  file: `pipeline/lib/eval-labels.test.mjs:181`
  severity: medium
  AC: AC-4
  source: measurement
  detail: AC-4 và E4 (evals.yaml dòng 35) hứa: sổ cùng bài toàn khoá trần hoặc khoá lạ thì mẫu y hệt so khớp nguyên văn. Ca ở dòng 180-189 chỉ dùng `ka`, `kb`, `conv-c`, và mọi bài đều có khoá trong sổ (dòng 182). Lớp khoá lạ trong chính bảng AC-4 không xuất hiện: `conv:x` (ô 11), `a:b:group:x` (ô 10), `k:group:` (ô 12), khoá không có trong sổ (ô 13). Vì vậy `bo_khong_don_vi` luôn bằng 0 ở cả hai vế, và phép chuẩn hoá khoá không có gì để làm sai. Đã chép nguyên ca này chạy với bản đột biến ở scratchpad: khoá nguyên văn (M1), gộp quá tay `replace(/^.*:/, "")` (M4), bỏ chốt `(?=.)`, và thêm bản bỏ cả tiền tố tới dấu gạch `replace(/^.*[:-]/, "")`. Cả bốn bản đều xanh, giống bản thật. Chiều đỏ của E4 và ca ở dòng 191-201 chỉ áp lên `kiemBangNhomThat`, không chạy lại vế này. Đây là khẳng định về lớp dựa trên vài điểm-case, và phép so «y hệt» chưa từng được thấy đỏ. Phần đơn vị của các dạng khoá này vẫn được bảng 13 ô đo; cái chưa được đo là quan hệ cả mẫu giống so khớp nguyên văn khi có khoá lạ mang dấu hai chấm hoặc khoá ngoài sổ. Round 1 chưa ghi mục này trong run-log.

- **Hình dạng 4 — cận `so[MA.D] <= 30` của «AC-1 khong vuot han muc» không thể đỏ vì fixture chỉ có 24 nội dung, nên ca nhóm lớn đăng ký hai lần không được đo**
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs:87`
  severity: low
  AC: AC-1
  source: measurement
  detail: Theo chú thích fixture ở dòng 49-52, hợp hai dạng khoá của D là 24 nội dung, nên số bài của mọi tầng D không thể vượt 30 dù mã sai thế nào. Vế `so[MA.D] <= 30` vì vậy luôn đúng và không có đối chứng dương. AC-1 hứa hạn mức nhóm lớn 30, và lỗi gốc trong design doc (dòng 15-16) là N004 30 + N022 5 = 35 trên hạn mức 30. Fixture không có nhóm hai dòng nào mà hợp vượt 30, nên triệu chứng đó ở nhóm lớn không tái hiện được. Hai vế còn lại không thay thế được: `so[MA.L1] === 30` là nhóm một dòng, `so[MA.S] === 5` là nhóm nhỏ. `so[MA.D] === 24` ở dòng 90 chỉ ghim số của hợp, cũng dưới hạn mức. Danh sách đột biến ở dòng 110 cũng không có mục nào ghim «loi vuot han muc». Finding round 1 về ma trận đột biến chỉ nói thiếu chiều đỏ ở mức chung; điểm này khác ở chỗ chính fixture khiến vế này không thể đỏ, nên có thêm đột biến cũng không làm nó đỏ.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe thêm mới tên nguồn thật vào khoá snapshot và giá trị nguồn của fixture, thay vì dùng mã S03 (r1 · tệp đã đổi)**
  Người dùng thấy gì: Tệp kiểm thử của vòng này có ghi tên thật của một kênh nguồn vào dữ liệu giả, trong khi kho mã đang công khai và quy ước là chỉ gọi nguồn bằng mã. Người dùng cuối không thấy gì, nhưng tên nguồn nằm lộ trên kho công khai.
  Căn cứ: Hậu quả nhẹ với người dùng vì chỉ là dữ liệu giả trong tệp kiểm thử, nhưng tên nguồn thật đã nằm trên kho công khai; sửa sau rẻ (đổi hai chuỗi) và đã có tiền lệ, đồng thời việc dọn tên nguồn toàn kho đã được hẹn sau 05/11.
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — hai assert âm tính của AC-5 không có chiều đỏ (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm việc chạy lại không làm đổi lát mẫu và không khuyên xoá chưa từng được thử làm đỏ, nên nếu sau này có lỗi thì phép kiểm có thể không báo. Hiện tại hành vi thật vẫn đúng.
  Căn cứ: Không có hậu quả với người dùng hôm nay vì hành vi đúng; chỉ giảm độ tin cậy của phép kiểm về sau, và sửa sau không mất dữ liệu.
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — đầu probe tuyên «mỗi lời hứa có chiều đỏ riêng» nhưng ma trận đột biến chỉ phủ một phần (r1 · tệp đã đổi)**
  Người dùng thấy gì: Tệp kiểm thử tự nói là mọi lời hứa đều có phép thử làm đỏ, nhưng thực tế ba lời hứa chưa có. Người dùng không bị ảnh hưởng; chỉ là độ tin cậy của phép kiểm bị nói quá.
  Căn cứ: Hậu quả nhẹ vì chỉ là chú thích nói quá về độ phủ của phép kiểm, không làm sai dữ liệu hay giao diện; có thể ghi lại hạn chế và bổ sung sau.
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
