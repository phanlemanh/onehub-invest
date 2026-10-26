## Trong hợp đồng

- **Hình dạng 5 (tuyên quét lớp nhưng tập khoá chỉ lấy từ một phía): «không lệnh nào đổi nghĩa» chỉ duyệt khoá của bản SAU**
  AC: AC-2
  file: `scripts/auth-error-thu-lai-retry.test.mjs:68`
  severity: medium
  source: measurement
  detail: `kitBeforeAfter(oldText, newText)` lấy `keys = leafKeys(loose(newText))`, tức chỉ các khoá còn ở bản sau rồi so `resolveConfigKey` hai bên. Khoá có ở bản trước mà bản sau đã xoá thì không bao giờ được so, nên một lệnh bị mất hẳn vẫn cho `khac = []`. Ca này có thật trong vòng: commit 5e396cb2 xoá một dòng `sync_pii_mutation`. Test xanh là vì khoá đó lặp (vẫn còn ở dòng 152), chứ không phải vì bộ so bắt được việc xoá. Nếu khoá bị xoá không lặp, test vẫn xanh. AC-2/OOS-3 hứa «mọi khoá ra CÙNG giá trị», vậy tập khoá phải là hợp của hai bản. Chiều đỏ hiện có (dòng 128–133) chỉ cấy việc ĐỔI giá trị, không cấy việc XOÁ khoá, nên lỗ này không bị lộ ra.
  rationale: AC-2 hứa «mọi khoá» ra cùng giá trị ở bản trước vòng và ở HEAD, nên khoá bị xoá mất ở bản sau là đổi nghĩa mà phép đo hiện không bắt được.

- **Hình dạng 6 (đo bản ghim cố định thay vì cây đang kiểm): so 5e396cb2^ với 5e396cb2 chứ không so mốc với HEAD**
  AC: AC-2
  file: `scripts/auth-error-thu-lai-retry.test.mjs:19`
  severity: medium
  source: measurement
  detail: `const FIX_COMMIT = "5e396cb2"`, rồi ca 'AER-AC-2 không lệnh nào đổi nghĩa' chạy `git show ${FIX_COMMIT}^:` và `git show ${FIX_COMMIT}:`. Cả hai đầu so đều là blob lịch sử cố định, không có đầu nào là `_acceptance/config.yaml` của cây đang kiểm. Contract AC-2 viết «ở bản trước vòng (bc6e5120) và ở HEAD». Commit nào sau 5e396cb2 trên nhánh này (hoặc một lượt sửa/rebase về sau) đổi giá trị lệnh trong config.yaml thì ca này vẫn xanh mãi, vì nó chỉ đo lại đúng commit của tác giả. Chú thích ở dòng 17–18 tự nhận HEAD khác mốc nên đã né HEAD. Hệ quả là lời hứa «ở HEAD» không có phép đo nào chạm tới.
  rationale: AC-2 nói rõ so bản trước vòng (bc6e5120) với HEAD, mà ca kiểm lại chỉ so hai blob lịch sử cố định nên lời hứa «ở HEAD» không được đo.

- **Hình dạng 4 (khẳng định âm tính đứng một mình): 'ca AH-AC-4 đã rời tệp test' chỉ là !includes, không có đối chứng dương**
  AC: AC-4
  file: `scripts/auth-error-thu-lai-retry.test.mjs:140`
  severity: low
  source: measurement
  detail: `assert.ok(!read("app/tests/auth-hop-chuan.test.tsx").includes('test("AH-AC-4'), ...)` chỉ khớp đúng một khuôn chữ (nháy kép, không cách). Ca cũ viết lại thành `test('AH-AC-4 …` hoặc `test(\`AH-AC-4…` vẫn qua. Không có đối chứng dương nào dùng cùng bộ khớp để chứng minh nó bắt được ca đang có (ví dụ 'test("AH-AC-3' hay 'test("AH-AC-5' có trong tệp). Ngoài ra evals.yaml E5 tuyên «app/tests/auth-hop-chuan.test.tsx không chứa 'AH-AC-4'», trong khi tệp thật vẫn chứa chuỗi 'AH-AC-4' ở chú thích dòng 154. Nghĩa là test đo một điều hẹp hơn điều eval khai.
  rationale: AC-4 yêu cầu tệp test auth-hop-chuan không còn ca «AH-AC-4», mà phép kiểm chỉ khớp một khuôn chữ hẹp nên ca viết lại kiểu khác vẫn lọt.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (không ghim thông điệp): chiều đỏ YAML chuẩn không kiểm thông điệp '<mã> dòng <n>' mà E2 khai là ghim**
  Người dùng thấy gì: Nếu tệp cấu hình nghiệm thu bị hỏng cú pháp, công cụ vẫn báo lỗi nhưng không ai kiểm được dòng báo có ghi đúng mã lỗi và số dòng hay không. Người sửa có thể phải tự dò vị trí lỗi thay vì đọc thẳng từ thông báo.
  Căn cứ: Chỉ ảnh hưởng độ rõ của thông báo khi tệp cấu hình hỏng, không làm mất hay sai dữ liệu của khách; người sửa vẫn thấy lỗi xuất hiện và tự dò được, còn bổ sung phép kiểm thì rẻ nhưng không cấp bách.
  file: `scripts/auth-error-thu-lai-retry.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
