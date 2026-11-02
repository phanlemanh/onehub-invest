## Trong hợp đồng

- **Hình dạng 2 — Fixture viết tay đúng khuôn bên đọc: đối chứng 'có ô' dựng đầu ra từ chính danh sách oCan, không đi qua đường đọc thật ở chayItest**
  AC: AC-5
  file: `scripts/chuyen-huong-ma-thi-truong/acceptance.mjs:165`
  severity: medium
  source: measurement
  detail: Dòng 165 đặt `const du = oCan(tt).join("\n")`, rồi dòng 166-167 đưa `du` vào `oThieu`. `oThieu` (dòng 146) chính là `oCan(tt).filter(dau => !out.includes(dau))`. Fixture vì vậy sinh từ cùng danh sách mà bên đọc dùng, không rút từ log của itest (bên viết). Vế 'đủ dòng → không thiếu' (dòng 166) đúng theo cách dựng. Vế 'bỏ từng dòng' (dòng 167) chỉ chứng minh `filter` và `includes` chạy đúng. Hai vế chỉ gọi `oThieu`, không chạm phép gác thật ở dòng 158: `if (phan === "app") for (...) check(!oThieu(out, tt).includes(dau), ...)`. Nếu xoá hoặc đảo dòng 158, hay làm điều kiện `phan` sai, các dòng 'APP đối chứng' vẫn xanh và lệnh vẫn in 'APP PASS'. Ví dụ itest chạy 0 ca và thoát 0 thì không còn gì bắt, trong khi comment dòng 157 nêu đúng ca này. Vì vậy vế AC-5 «acceptance.mjs đỏ khi đầu ra thiếu dòng của một nhóm ô» chưa được đo ở mức lệnh. E5 trong evals.yaml dòng 37 chỉ đòi dòng 'APP đối chứng' xanh. Lượt chạy thật ở dòng 158 có bắt lệch chữ giữa log itest và oCan, nên lỗ hổng nằm ở chiều đỏ của phép gác, không ở chiều xanh. Kết luận này rút từ đọc mã, tôi chưa chạy đột biến xoá dòng 158.
  rationale: AC-5 đòi rõ «acceptance.mjs đỏ khi đầu ra thiếu dòng của một nhóm ô»; finding nói phép gác thật chưa được đo ở chiều đỏ nên vế này của AC-5 chưa được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

(không có mục nào)

## Chưa adversarial-verify (refuter chết)

(không có mục nào)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
