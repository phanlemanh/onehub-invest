# Review findings: chuyen-huong-ma-dai-trang-thue

## Trong hợp đồng

- **E5 khai chiều đỏ của check 'có ô:' nhưng lệnh của E5 không tạo được chiều đỏ đó**
  AC: AC-5
  file: `_acceptance/chuyen-huong-ma-dai-trang-thue/evals.yaml:37`
  severity: medium
  source: bugs
  detail: AC-5 và `expected` của E5 đòi `acceptance.mjs` đỏ khi đầu ra thiếu dòng của một nhóm ô. Lệnh của E5 là `config:executors.script.chm_app`, tức `acceptance.mjs app`. Trên vật lành, lệnh này chỉ in các dòng `ok ... có ô: ...`, nên nhánh `FAIL` ở acceptance.mjs dòng 155-156 không chạy. Ba đột biến trong itest chỉ phá mã trang (segment, nhánh chuyển hướng, query), không đột biến nào làm thiếu dòng log. Bằng chứng duy nhất là một lần phá tay: bước Verify của Task 2 trong plan và câu «phá dòng ô» trong gap-probe.md; hồ sơ chưa có run-log. Hệ quả: nếu guard hỏng về sau (ví dụ `check` thành luôn đúng, hoặc chuỗi `out.includes` khớp sai) thì E5 vẫn thoát 0 và in 'APP PASS'. Vế này của AC-5 vì vậy được báo đạt mà không có phép đo chạy lại được. Cách sửa: thêm một ca đối chứng tự động, như cách `cheDoAppTest` đã làm với `caDoMoi`: tách phép kiểm dòng thành hàm thuần, đưa cho nó đầu ra thiếu một dòng và assert báo đúng dòng đó.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
