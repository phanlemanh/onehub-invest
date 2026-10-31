## Trong hợp đồng

- **Hình dạng 5 — tuyên quét LỚP («0 offer_id fixture») nhưng danh sách quét chỉ là mẫu tuỳ ý, không chứa định danh fixture P, Q**
  file: `_acceptance/do-the-duyet-du-du-lieu/probes/db.mjs:207`
  severity: medium
  AC: AC-3
  source: measurement
  detail: evals.yaml E3 hứa «quét entity + detail: 0 offer_id fixture». Nhưng quetLot (dòng 208-213) chỉ dò trong `SELECT DISTINCT offer_id FROM sale_offers LIMIT 50` (50 dòng tuỳ ý, không ORDER BY) cộng thêm hằng 'dtd-thu-khong-co'. Hai tin fixture thật P, Q (chọn ở dòng 112-120 bằng ORDER BY offer_id LIMIT 2 trong nguồn đông nhất) được khai bằng const trong khối try của E2 nên không còn trong phạm vi ở E3, và không được đưa vào danh sách quét. Vì vậy nếu detail hoặc entity lọt offer_id của P hay Q, phép quét có thể vẫn xanh, trừ khi hai id này tình cờ nằm trong 50 dòng kia. Đối chứng đỏ ở dòng 215 chỉ chèn đúng hằng 'dtd-thu-khong-co' nên không chứng được rằng tập quét phủ hết các fixture. Phần chặn URL theo regex thì phủ cả lớp, nhưng phần chặn offer_id chỉ là điểm-case/mẫu.
  rationale: AC-3 đòi rõ `detail` chỉ là số đếm, không chứa offer_id; phép quét không phủ hai tin fixture nên chưa chứng minh được điều khoản này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 3 — chỉ assert «có nhãn» (known: true) và regex `.*` trong khi nhãn độ đầy là QUAN HỆ thứ tự giữa khoá và nhãn**
  Người dùng thấy gì: Nếu ai đó vô tình đổi chỗ hai nhãn trong dòng độ đầy dữ liệu, trang chất lượng của vận hành sẽ ghi sai tên cho một con số mà không có cảnh báo nào. Số liệu vẫn đúng, chỉ chú thích bị lệch.
  Căn cứ: Hậu quả nhẹ, chỉ ảnh hưởng chú thích trên trang nội bộ, không mất hay lộ dữ liệu, và chỉ xảy ra khi có người sửa nhãn sau này; có thể sửa sau với chi phí thấp.
  file: `app/tests/dq-the-duyet-label.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — «luật ảnh khớp khuôn của bộ đọc app» được kiểm bằng ca viết tay, không round-trip qua bộ đọc app**
  Người dùng thấy gì: Nếu app sau này đổi cách nhận biết ảnh của thẻ duyệt, số thẻ thiếu ảnh mà bản đo đêm báo có thể lệch khỏi cái người duyệt thực sự nhìn thấy mà test không kêu.
  Căn cứ: Bản đối chiếu với app thật vẫn chạy trên dữ liệu hằng ngày nên sai lệch sẽ lộ ra khi đo; không mất dữ liệu và người dùng không bị ảnh hưởng trực tiếp.
  file: `pipeline/do-the-duyet.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
