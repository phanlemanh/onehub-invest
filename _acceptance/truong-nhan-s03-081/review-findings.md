## Trong hợp đồng

- **Hình dạng 3 (assert «có mặt/đếm» trong khi lời hứa là QUAN HỆ): «chín trường cũ cho cùng kết quả với bản trước vòng» chỉ đo bằng số dòng = 9 và một giá trị kind.n = 2**
  AC: AC-6
  file: `app/tests/eval-classify-can-cu.test.mjs:89`
  severity: high
  source: measurement
  detail: evals.yaml E6 hứa «chín trường cũ cho cùng kết quả với bản trước vòng (so deepEqual với đầu ra chép trong test)». Test (sau khi dời sang app/tests ở vòng này) lại chỉ có `const cu = o.filter((r) => r.phan_khuc === "tat-ca" && !MOI.includes(r.truong)); assert.equal(cu.length, 9); assert.deepEqual(cu.find((r) => r.truong === "kind").n, 2);`. Trong test không có đầu ra trước vòng nào được chép lại, cũng không chạy bản thư viện trước vòng để so. Lời hứa là quan hệ bằng nhau giữa đầu ra trước và sau vòng trên chín trường (nhom, nguong, n, dung, trang_thai, ly_do của từng ô). Phép đo hiện chỉ kiểm có chín dòng và ô kind có n = 2. Vì vậy nếu NHOM_TRUONG hay NGUONG của một trường cũ bị đổi, hoặc gopNhan làm lệch n/dung của trường cũ khác kind, test vẫn xanh. Comment ở dòng 87 («cùng kết quả với phép chấm chỉ trên chín trường đó») cũng không có phép chấm đối chứng nào đi kèm. Vòng 1 đã ghi lỗi này (known-limits) cho đường cũ pipeline/scripts/… Tệp mới dời sang vẫn giữ nguyên chỗ hở.
  rationale: AC-6 có điều khoản «chín trường cũ chấm như trước», và phép đo hiện chỉ đếm dòng nên không chứng minh được điều khoản đó.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Test mới trong pipeline/scripts làm `cd pipeline && npm test` và job CI pipeline đỏ: nạp .ts không qua tsx, dùng DB cố định và container docker (r1)**
  Người dùng thấy gì: Bộ kiểm tra chung của đường ống dữ liệu có thể báo đỏ trên máy dựng tự động vì một bài kiểm mới cần dữ liệu và công cụ không có ở đó. Người dùng cuối không thấy gì, nhưng PR có thể bị chặn.
  Căn cứ: Không ảnh hưởng người dùng và không mất dữ liệu, nhưng làm đỏ cổng kiểm của cả nhóm nên nên xử lý trong một việc riêng.
  file: `pipeline/scripts/eval-classify-can-cu.test.mjs`
  severity: high
  Đề xuất: new-contract

- **Rows for the five new group-C fields are not interpreted on /ops/quality: dq-labels only accepts nhom=A or B (r1)**
  Người dùng thấy gì: Trên trang chất lượng của ops, các dòng kết quả của năm trường nhóm C hiện mã thô và ghi chưa diễn giải thay vì lời giải thích tiếng Việt. Nhân viên ops khó đọc kết quả của các trường này.
  Căn cứ: Chỉ làm khó đọc ở trang nội bộ, số liệu không sai và không mất, sửa sau không tốn nhiều.
  file: `app/src/lib/dq-labels.ts`
  severity: medium
  Đề xuất: new-contract

- **pham-vi.sh swallows a git log failure: the file list falls back to untracked files and the probe can still print PHAM-VI OK (r1)**
  Người dùng thấy gì: Công cụ kiểm phạm vi thay đổi có thể báo ổn khi không đọc được lịch sử thay đổi, nên có thể bỏ sót tệp đổi ngoài phạm vi. Người dùng không bị ảnh hưởng trực tiếp.
  Căn cứ: Chỉ xảy ra khi môi trường thiếu nhánh gốc, người ký vẫn xem lại được, nên ghi lại là đủ.
  file: `_acceptance/truong-nhan-s03-081/probes/pham-vi.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên ma trận 7 trường × 4 ca nhưng chỉ ghim tổng số dòng, 8 ô của ma trận vắng (r1)**
  Người dùng thấy gì: Một số tình huống nhập của bảy trường mới chưa có bài kiểm, nên nếu sau này có lỗi ở đó thì kiểm tự động không bắt được. Hiện chưa thấy người dùng nhập sai bị lưu nhầm.
  Căn cứ: Rủi ro chỉ ở lần sửa sau, hiện chưa gây hại, bổ sung ca kiểm thì rẻ nhưng không gấp.
  file: `app/tests/labels-truong-moi-chuan.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — lời hứa «chín trường cũ cho cùng kết quả với bản trước vòng» chỉ được đo bằng số đếm và một giá trị (r1)**
  Người dùng thấy gì: Việc chấm điểm chín trường cũ có thể đổi kết quả mà kiểm tự động không phát hiện. Số liệu chất lượng trên trang ops có thể lệch âm thầm nếu có lỗi.
  Căn cứ: Chưa có bằng chứng số đã sai, và lỗi nếu có thì chỉ lệch số đo nội bộ, sửa lại được.
  file: `pipeline/scripts/eval-classify-can-cu.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 3 — «lựa chọn bằng đúng VOCAB» chỉ được so bằng số nút (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu nút lựa chọn trên màn gắn nhãn sai tên nhưng đủ số lượng thì kiểm tự động không bắt được. Người gắn nhãn có thể chọn nhầm giá trị.
  Căn cứ: Hiện chưa có lỗi thật được chỉ ra, người gắn nhãn thấy ngay chữ sai trên màn nên rủi ro thấp.
  file: `app/tests/labels-nhom.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — lớp «chọn nhiều» có hai trường mà chỉ đo View, bỏ Phí đã gồm (r1 · tệp đã đổi)**
  Người dùng thấy gì: Ô Phí đã gồm có thể bị đổi thành chọn một giá trị mà kiểm tự động không phát hiện. Người gắn nhãn khi đó không chọn được nhiều khoản phí.
  Căn cứ: Lỗi nếu có thì thấy ngay khi dùng và sửa dễ, hiện chưa có bằng chứng ô đang sai.
  file: `app/tests/labels-nhom.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — phép từ chối trường lạ và căn cứ lạ là assertion âm tính bắt mọi lỗi, không ghim CHECK violation (r1)**
  Người dùng thấy gì: Phép kiểm việc từ chối trường lạ có thể báo đạt dù nguyên nhân từ chối là lỗi khác. Người dùng không thấy ảnh hưởng, chỉ giảm độ tin cậy của bằng chứng.
  Căn cứ: Không chạm dữ liệu hay người dùng, chỉ làm bằng chứng yếu hơn, ghi lại là đủ.
  file: `_acceptance/truong-nhan-s03-081/probes/migration.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
