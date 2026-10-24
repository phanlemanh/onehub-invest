# Review findings: ops-mobile-cot-trang-thai (round 1)

## Trong hợp đồng

- **Smoke để sót user admin tạm và phiên trên DB local khi app không lên: batApp nằm ngoài try/finally**
  AC: AC-3
  file: `scripts/smoke-ops-mobile.mjs:214`
  severity: medium
  source: conventions
  detail: Thứ tự trong smoke-ops-mobile.mjs là: `const phien = await phienAdminTam(db, "mob")` (tạo user role='admin' và một phiên 30 phút), rồi `const app = await batApp(ROOT)`, sau đó mới tới `let browser; try { ... } finally { ...; await phien.xoa(); await db.end() }`. Nếu batApp ném lỗi (next dev thoát sớm, hoặc không lên trong 180 giây) thì lệnh không vào try nào. Kết quả: finally không chạy, phien.xoa() không được gọi, dòng 'dọn: N phiên tạm còn lại' không in ra. Dòng users `verify-mob-*` với role admin ở lại DB vĩnh viễn, vì chỉ phiên mới có hạn, user thì không. Ca 'app không lên → exit ≠ 0' lại chính là ca biên mà evals.yaml E3 khai, nên lỗi này nằm đúng trên đường đã khai. Đây cũng là lùi so với khuôn có sẵn: scripts/smoke-ops-nhan.mjs đặt `app = await batApp()` bên trong try (dòng 138–165), nên finally vẫn dọn user và phiên tạm. Cách sửa: đưa batApp và cả phienAdminTam vào try, giữ biến `app`/`phien` có thể null rồi kiểm null trong finally, theo đúng khuôn smoke-ops-nhan.mjs.
  rationale: AC-3 nêu rõ phiên admin tạm phải «tạo và xoá trong cùng lượt»; khi app không lên thì user và phiên tạm bị bỏ lại, trái đúng điều kiện này.

- **Smoke tạo user admin + phiên tạm TRƯỚC try/finally; next dev không lên thì không dọn**
  AC: AC-3
  file: `scripts/smoke-ops-mobile.mjs:492`
  severity: medium
  source: bugs
  detail: Dòng 490–493 chạy `db.connect()`, `phienAdminTam(db, "mob")` (INSERT users role='admin' + sessions) rồi `batApp(ROOT)`, cả ba đều nằm NGOÀI khối try/finally bắt đầu ở dòng 495. batApp ném lỗi khi `next dev` thoát sớm hoặc không lên trong 180 giây (ops-app.mjs dòng 228, 242), và evals E3 coi đây là ca phải đo («app không lên → exit ≠ 0 có tên»). Khi đó top-level await reject, finally không chạy: `phien.xoa()` không được gọi, dòng users `verify-mob-<nonce>` role admin còn lại vĩnh viễn trên DB local, kèm một phiên admin còn hạn 30 phút. `db.end()` cũng không chạy, và dòng «dọn: N phiên tạm còn lại» không được in, nên không ai thấy dữ liệu bị bỏ lại. Tương tự, child process không có handler 'error' (spawn npx ENOENT) cũng làm sập tiến trình mà không dọn. Cách sửa: đưa `batApp` vào trong try (giữ `app` có thể undefined, gọi `app?.tat()` trong finally), hoặc bọc từ ngay sau `phienAdminTam`.
  rationale: Cùng gốc với mục trên: AC-3 đòi phiên admin tạm được xoá trong cùng lượt, nhưng đường app không lên làm sót user admin và phiên.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Smoke 390px chỉ đo trang phân trang đầu (10 hàng), nên «nhãn trọn trong ô ở mọi hàng» chưa đúng như hồ sơ nói**
  Người dùng thấy gì: Trên điện thoại, nhãn trạng thái ở các hàng từ trang 2 trở đi của bảng Ops chưa được kiểm tự động, nên một nhãn dài ở trang sau vẫn có thể bị tràn ô mà không ai báo.
  Căn cứ: Hậu quả nhẹ: nếu có nhãn tràn thì chỉ xấu giao diện ở trang sau, người trực vẫn đọc được và không mất dữ liệu; ghi rõ giới hạn là đủ vì hợp đồng vốn chỉ hứa trang đầu.
  file: `scripts/smoke-ops-mobile.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — hợp đồng nhận phủ cả LỚP nhãn trạng thái («nhãn trạng thái dài nhất») nhưng phép đo chỉ thấy những nhãn mà dữ liệu trong DB local đang có**
  Người dùng thấy gì: Bài kiểm tra trên điện thoại chỉ thử những trạng thái đang có trong dữ liệu máy hôm nay; một trạng thái hiếm với nhãn dài có thể bị tràn khỏi ô khi xuất hiện thật mà không bị phát hiện trước.
  Căn cứ: Hậu quả nhẹ và tự lộ ra khi gặp: chỉ là nhãn bị tràn hay cắt ở một ô, người trực tải lại vẫn thấy trạng thái, và đã có lần nới cột để xử lý đúng ca này; dựng thêm bộ nhãn đầy đủ tốn công hơn nhiều so với thiệt hại.
  file: `scripts/smoke-ops-mobile.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

