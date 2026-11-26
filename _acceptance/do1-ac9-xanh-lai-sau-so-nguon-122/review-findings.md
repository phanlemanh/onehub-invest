## Trong hợp đồng

- **Probe C (gỡ bộ soát) không gỡ được bộ soát mà ca thật dùng: bản đột biến không bao giờ chạm tới doHangNgay**
  AC: AC-2
  file: `_acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/doi-chung.mjs:36`
  severity: high
  source: bugs
  detail: Bước C chép pipeline/lib/do-hang-ngay.mjs thành lib/do-hang-ngay.dotbien.tmp.mjs (thay dòng `guardValues` → `if (false)`), rồi chỉ đổi import `from "../lib/do-hang-ngay.mjs"` của tệp test (dòng 10, chỉ nạp các hàm thuần boSot, chanLo, trungCam… cho ca thuần). Ca DO1-AC-9 lại kiểm bộ soát qua `doHangNgay(c, { dotBien: `lo:${x}` })`, hàm này import từ `../do-hang-ngay.mjs` (dòng 563). pipeline/do-hang-ngay.mjs lại import `chanLo` từ `./lib/do-hang-ngay.mjs` BẢN THẬT (dòng 20-22), và dòng 321 gọi chanLo → trungCam ở bản thật, nên bộ soát tên nguồn vẫn còn nguyên. Hệ quả: trong lượt C, `assert.rejects(... /^Error: LO /, 'không chặn TEN_THAT_V')` vẫn bị chặn đúng như bình thường, ca xanh (fail 0), điều kiện `c.code !== 0 && c.fail === 1 && includes('không chặn TEN_THAT_V')` sai, probe in 'LOI C go bo soat do' và thoát đỏ. Như đang viết, E2 không thể đạt, nên vế 'ca vẫn đo bộ soát thật' của AC-2 chưa được chứng minh. Cách sửa: tạo thêm một bản chép tạm của pipeline/do-hang-ngay.mjs có import trỏ sang lib đột biến, rồi đổi cả import `../do-hang-ngay.mjs` trong tệp test đột biến; hoặc đột biến thẳng lib thật kèm sao lưu và khôi phục trong finally.
  rationale: AC-2 đòi ca đỏ khi bộ soát tên nguồn bị gỡ; probe gỡ nhầm chỗ nên vế này không được chứng minh.

- **Hình dạng 4 (đối chứng dương hỏng): lượt C «gỡ bộ soát» không chạm bộ soát mà ca DO1-AC-9 detail thật sự gọi**
  AC: AC-2
  file: `_acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/doi-chung.mjs:40`
  severity: high
  source: measurement
  detail: Lượt C (dòng 34-41) là đối chứng duy nhất cho lời hứa AC-2 «ca vẫn đo bộ soát thật». Probe chép lib/do-hang-ngay.mjs thành lib/do-hang-ngay.dotbien.tmp.mjs, gỡ dòng `if (ten.length && guardValues([s], ten).length) return "TEN NGUON"`, rồi chỉ sửa câu import `from "../lib/do-hang-ngay.mjs"` của chính tệp test. Nhưng các assert chặn rò trong ca (`assert.rejects(doHangNgay(c, { ngay: D, dotBien: `lo:${x}` }), /^Error: LO /, `không chặn ${x}`)`, do-hang-ngay.test.mjs khoảng dòng 720) gọi `doHangNgay` lấy từ `../do-hang-ngay.mjs` (dòng 563 của test). Tệp pipeline/do-hang-ngay.mjs (dòng 20-21) tự import `chanLo` từ `./lib/do-hang-ngay.mjs` thật, chưa bị gỡ. Ở đường này, thứ bản đột biến thay chỉ là các hàm thuần mà test import thẳng (trungCam chỉ được dùng với nhãn NGUOI DANG, không phải TEN NGUON). Vì vậy ở lượt C, `doHangNgay(... lo:TEN_THAT_V)` vẫn ném `LO TEN NGUON` và ca xanh. Điều kiện `c.code !== 0 && c.fail === 1 && includes("không chặn TEN_THAT_V")` sẽ không đạt. Hoặc E2 đỏ vì lý do sai, hoặc nếu có lúc đạt thì cũng không do việc gỡ bộ soát. Dù theo cách nào, phép đột biến không chứng minh được ca phát hiện khi bộ soát tên nguồn bị gỡ. Để đột biến chạm đúng đường gọi, cần thay import lib ở pipeline/do-hang-ngay.mjs (chép bản tạm của nó và trỏ test sang bản đó), không phải ở tệp test.
  rationale: Cùng lỗi với mục trên: phép đột biến không chạm đường gọi thật nên AC-2 (ca vẫn đo bộ soát thật) chưa được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe đối chứng ghi tệp tạm khớp glob `scripts/*.test.mjs`, và lối thoát process.exit(3) trong try bỏ qua finally nên tệp tạm bị bỏ lại**
  Người dùng thấy gì: Khi chạy kiểm chứng, có thể có tệp tạm bị bỏ lại hoặc lẫn vào các lượt kiểm chạy song song, làm một lượt khác báo đỏ nhầm. Chỉ ảnh hưởng người chạy kiểm chứng, không ảnh hưởng người dùng sản phẩm.
  Căn cứ: Hậu quả nhẹ và chỉ gặp khi chạy kiểm chứng; xoá tệp thừa hoặc chạy lại là xong, không mất hay lộ dữ liệu, sửa sau cũng rẻ.
  file: `_acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/doi-chung.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lượt B so với origin/main nên sẽ tự đỏ sau khi nhánh này được gộp**
  Người dùng thấy gì: Sau khi bản sửa được gộp, chạy lại bước kiểm chứng này sẽ báo đỏ dù không có gì hỏng. Người kiểm lại về sau có thể tưởng nhầm là có lỗi.
  Căn cứ: Chỉ gây báo đỏ giả khi chạy lại sau gộp, không ảnh hưởng người dùng hay dữ liệu; chỉ cần ghi chú là đủ.
  file: `_acceptance/do1-ac9-xanh-lai-sau-so-nguon-122/probes/doi-chung.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
