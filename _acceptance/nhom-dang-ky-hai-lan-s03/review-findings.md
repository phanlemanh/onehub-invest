# Review findings: nhom-dang-ky-hai-lan-s03 (round 3)

## Trong hợp đồng

- **Hình dạng 4 — «AC-7 khong vuot han muc» là assert âm tính một mình và không thể đỏ, kể cả với bản đột biến gây đúng lỗi vượt hạn mức**
  AC: AC-7
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs:45`
  severity: medium
  source: measurement
  detail: Dòng 45 tính `vuot` bằng `Number(d[1]) > Number(d[2]) || ![5, 30].includes(Number(d[2]))`, trên chính dòng `nhóm <mã>: chọn <chon>/<can>` mà lệnh in cho từng đại diện. Cả hai vế đều không thể đúng. `chon` sinh từ `chonMau(...).slice(0, n)` với n = `can` (eval-labels.mjs dòng 39, 105-107), nên luôn `chon <= can`. `can` luôn là 5 hoặc 30 vì probe truyền cờ cố định 30/5 (dòng 35). Lỗi gốc của AC-7 là một nhóm vượt hạn mức khi bị tách hai tầng (30 + 5 = 35), nhưng phép đo chỉ xét riêng từng dòng đại diện, không cộng tầng phụ. Đã chạy `chonMauTheoNhom` với hai tầng tách 30 và 5 nội dung ở scratchpad: kết quả `30/30` và `5/5`, công thức cho `vuot=false` ở cả hai. Chiều đỏ ở dòng 60-61 cũng chỉ đọc `dot.tangPhu`, không đọc `dot.vuot`, và E7 trong evals.yaml dòng 59 chỉ ghim 'loi tang phu'. Vì vậy 'ok AC-7 khong vuot han muc' xanh ở mọi trường hợp và chưa từng được thấy đỏ. Lượt trước đã sửa đúng lớp lỗi này cho AC-1 ở mau-hai-khoa.mjs dòng 93 (cộng V + Vp, có 'do M1: loi vuot han muc'), nhưng AC-7 chưa được sửa. Run-log chưa ghi mục này.
  rationale: AC-7 nêu rõ «mỗi đại diện không vượt hạn mức» trên bản sao dữ liệu thật, mà phép đo hiện tại không thể đỏ khi nhóm bị tách hai tầng 30+5, nên vế này của AC-7 chưa được chứng minh.

- **Hình dạng 5 — AC-8 tuyên quét «các tệp vòng này đổi» nhưng dùng danh sách viết tay, bỏ sót ba tệp có trong diff**
  AC: AC-8
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs:66`
  severity: low
  source: measurement
  detail: Chú thích dòng 63 và thông điệp 'AC-8 tep doi 0 khop (N tep)' ở dòng 73 tuyên quét cả lớp tệp vòng này đổi. Nhưng `TEP` ở dòng 66-70 chỉ gồm thư mục hồ sơ của slug cộng năm đường dẫn ghi tay, không rút từ `git diff` nên không có ma trận theo diff thật. Đối chiếu `git diff --name-only 9976fb01...HEAD`: `_acceptance/config.yaml`, `LO-TRINH.html` và `PRODUCT-MAP.md` đều đổi trong vòng này mà không được quét. `_acceptance/config.yaml` chính là tệp vòng này thêm hai executor `ndk_mau`, `ndk_that`. Một khoá thật ghi vào các tệp đó, hay vào bất kỳ tệp mới nào ngoài danh sách, vẫn cho 'ok AC-8 tep doi 0 khop'. Con số `TEP.length` in ra chỉ là độ dài danh sách viết tay, không phải số tệp đã đổi. Đối chứng mồi ở dòng 78-85 chỉ kiểm hàm `quet` trên tệp tạm, không kiểm độ phủ của danh sách.
  rationale: AC-8 đòi quét các tệp vòng này đổi để số khớp khoá thật bằng 0, nhưng danh sách viết tay bỏ sót config.yaml, LO-TRINH.html và PRODUCT-MAP.md có trong diff, nên khoá lọt vào các tệp đó vẫn cho kết quả xanh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **paths của E1–E7 thiếu _dot.mjs, paths của E3, E5, E6 thiếu lib/eval-labels.mjs, nên lượt sửa sau có thể mang màu xanh cũ sang**
  Người dùng thấy gì: Nếu lần sửa sau chỉ chạm vào một vài tệp phụ trợ của bộ kiểm, một số phép kiểm cũ có thể được coi là vẫn đạt mà không chạy lại. Lần này chưa gây sai lệch nào cho người dùng.
  Căn cứ: Chỉ ảnh hưởng độ chắc của lượt kiểm sau chứ không làm sai kết quả lấy mẫu hôm nay, không mất dữ liệu, và thêm hai dòng khai báo khi có lượt sửa hẹp là rẻ.
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — lời hứa quan hệ «hai đầu dò giữ chung khoá riêng DB thử» chỉ được đo ở một đầu dò**
  Người dùng thấy gì: Nếu ai đó vô tình bỏ cơ chế khoá ở một phía, hai bước kiểm có thể đụng nhau trên dữ liệu thử và cho kết quả sai khi chạy lại. Không ảnh hưởng tới dữ liệu thật hay tới người dùng cổng.
  Căn cứ: Chỉ là rủi ro khi chạy bộ kiểm trên máy thử, dữ liệu thật không bị đụng, và sự cố nếu xảy ra sẽ lộ ra ngay ở lần chạy lại.
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs`
  severity: low
  Đề xuất: known-limits

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
