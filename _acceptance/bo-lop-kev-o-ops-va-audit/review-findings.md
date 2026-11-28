# Review findings: bo-lop-kev-o-ops-va-audit (round 1)

## Trong hợp đồng

- **Hình dạng 2 — chiều đỏ của KEV2-AC-6 lấy số viết tay, không chạy bộ đếm đã phá**
  file: `app/tests/kev2-thu-thap.test.tsx:300`
  severity: medium
  AC: AC-6
  source: measurement
  detail: E7 hứa «bản sao bộ đếm bỏ luật lọc kev null → messages = 6, ghim «tin thấy đếm đôi»». Nhưng chiều đỏ ở dòng 300 lại đưa vào `ghim` một số tự dựng: `messages: dong.filter((l) => !/ heartbeat /.test(l)).length` (= 7, chứ không phải 6). Nó không phá `KEV_NULL` trong collections-queries.ts (dòng 188/437) rồi đọc đầu ra của readGateFunnel/gateByGroup. Vì vậy chiều đỏ chỉ chứng minh hàm `ghim` biết ném lỗi với số 7. Nó không chứng minh phép đo bắt được bộ đếm của app khi bộ đếm bỏ luật lọc. Bản scripts/kev2-ops-local.test.mjs dòng 734 làm đúng (dùng banPha trên ops-flow.mjs), còn bản app thì không.
  rationale: AC-6 đòi đối chứng chạy bản sao bộ đếm đã bỏ luật lọc để ghim «tin thấy đếm đôi»; ca này dùng số viết tay nên đối chứng không thật.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chú thích LOCKDOWN_LAYERS tự mâu thuẫn: «Bảy dòng» rồi vẫn ghi «hiện đủ 8 lớp»**
  Người dùng thấy gì: Một dòng ghi chú trong mã nói hai con số khác nhau về số lớp khoá an toàn. Người dùng không thấy gì trên màn, trang vẫn hiện đúng bảy dòng.
  Căn cứ: Không ảnh hưởng gì tới người dùng hay dữ liệu, chỉ gây hiểu nhầm nhẹ cho người đọc mã, và sửa lúc nào cũng rẻ.
  file: `app/src/lib/ops-queries.ts`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 5 — eval tuyên ma trận mỗi loại dòng log, nhưng test chỉ phủ bốn loại**
  Người dùng thấy gì: Phép kiểm số tin thấy ở phễu hook chưa thử hai loại dòng nhật ký (chỉ có ảnh, và đẩy vào hàng chờ). Nếu sau này cách đếm hai loại đó hỏng thì bài kiểm không báo.
  Căn cứ: Số liệu hiện tại vẫn đúng với phần đã đo, rủi ro chỉ nằm ở lần sửa sau và không làm mất dữ liệu; bổ sung mẫu thử về sau không đắt.
  file: `app/tests/kev2-thu-thap.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1/4 — chú thích bảng nhóm đo bằng grep tệp nguồn, chỉ có chiều âm**
  Người dùng thấy gì: Bài kiểm chú thích bảng nhóm chỉ soi chữ trong mã nguồn, không soi trang thật. Nếu chữ «Kev» quay lại bằng cách viết khác thì bài kiểm có thể không bắt được.
  Căn cứ: Chữ trên trang hiện đúng và người dùng không bị ảnh hưởng; đây chỉ là rào chặn quay lại hơi yếu, sửa sau không đắt.
  file: `app/tests/kev2-thu-thap.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — E5 hứa quan hệ «cùng HTML khối máy móc», test chỉ kiểm vắng hàng kev**
  Người dùng thấy gì: Bài kiểm khối Máy móc chỉ xác nhận hàng Kev vắng trên bản tin mới, chưa so với kết quả từ bản tin cũ. Nếu bộ lọc hàng Kev ở máy chủ bị gỡ nhầm thì bài kiểm có thể không đỏ.
  Căn cứ: Trang hiện tại đã đúng và không mất dữ liệu; rủi ro chỉ ở lần sửa sau, người dùng tải lại là thấy ngay, sửa bài kiểm rẻ.
  file: `app/tests/kev2-thu-thap.test.tsx`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

