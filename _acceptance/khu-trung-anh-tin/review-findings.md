## Trong hợp đồng

- **Expected của E6 đòi bảng trước/sau theo nguồn, nhưng do-khu-trung-anh không in các số đó**
  AC: AC-5
  file: `_acceptance/khu-trung-anh-tin/evals.yaml:51`
  severity: low
  source: conventions
  detail: E6 ghi `expected`: «bảng trước và sau theo nguồn (dòng, ảnh khác nội dung, tin còn trùng, ảnh khác nội dung trong trần 12)». Trong `pipeline/scripts/do-khu-trung-anh.mjs`, dòng in theo nguồn chỉ có ba số: dòng, dòng có tệp, tin. Số ảnh khác nội dung trong trần 12 chỉ in một tổng gộp cho mọi tin có tệp. `tin_con_trung` chỉ đo phía sau và cũng gộp, không có số trước. Không có «ảnh khác nội dung» ngoài trần ở cả hai phía, dù AC-5 đòi «số ảnh khác nội dung mỗi tin trước và sau, cả trong trần 12». Theo quy trình cổng nghiệm thu, bằng chứng được chấm theo `expected`, nên E6 hiện hứa nhiều hơn thước thật in ra. Cần chỉnh một trong hai để khớp nhau: thêm các số này vào script theo nguồn, hoặc sửa `expected` đúng với cái script in. Sửa `expected` phải cập nhật lại `evalsHash` trong s4-args.
  rationale: AC-5 đòi in số ảnh khác nội dung mỗi tin trước và sau, cả trong trần 12; thước thật chỉ in tổng gộp nên AC-5 chưa được đo đủ.

- **Hình dạng 3 — lời hứa quan hệ «media_key không đổi so với trước», nhưng đáp án rút từ chính mediaKey đang đo**
  AC: AC-1
  file: `pipeline/scripts/khu-trung-anh.test.mjs:54`
  severity: medium
  source: measurement
  detail: AC-1 và AC-6 hứa media_key của dòng có tệp không đổi so với trước. Dòng 54 so `r.media_key` với `mk(OF, r.local_file, r.media_url)`, trong đó mk là mediaKey import từ media-rows.mjs. Ở itest, dòng cũ (khu-trung-anh.itest.mjs:175) và đáp án (:187, :189) cũng tính bằng mediaKey đó, nên đổi công thức thì hai vế đổi cùng nhau. Đáp án md5 độc lập chỉ có ở KTA-AC-4 (itest:147), và chỉ cho dòng URL của S06. grep không thấy md5 viết tay cho dòng có tệp ở media-canonical.itest.mjs hay gop-anh.itest.mjs. Đã chạy đột biến trên bản chép ở scratchpad: nhánh có tệp đổi thành `${local}|${offerId}`, nhánh URL giữ nguyên. Toàn bộ khu-trung-anh.test.mjs vẫn pass 9/9, không ca nào đỏ. Đổi công thức như vậy sẽ thay khoá mọi dòng có tệp trên bảng thật. Itest không chạy thử đột biến này; theo đọc mã thì KTA-AC-6 cũng xanh vì dòng cũ và đáp án đều dùng mediaKey đột biến. Cần đáp án viết tay kiểu md5(`${offer}|${local}`) cho dòng có tệp.
  rationale: AC-1 hứa media_key của dòng giữ lại không đổi, nhưng đáp án dùng chính công thức đang đo nên đổi công thức vẫn xanh.

- **Hình dạng 4 — âm tính một mình: chiều «thừa» của URL lệch không có đối chứng dương**
  AC: AC-5
  file: `pipeline/scripts/do-khu-trung-anh.mjs:178`
  severity: medium
  source: measurement
  detail: E6 hứa dòng chỉ URL lệch 0 «cả hai chiều (thiếu và thừa)» và có đối chứng ghim 'URL lệch'. Đối chứng ở dòng 178 chỉ làm `ds.filter((r) => r.local_file)`, tức xoá dòng URL, nên chỉ kích nhánh thiếu ở dòng 65. Nhánh thừa ở dòng 67 được thêm để bắt đúng lỗi S4 vòng 1 (URL của tệp đã khử quay lại), nhưng không đối chứng nào đi qua nó. Xoá dòng 67 thì đối chứng 'URL lệch' vẫn kêu và thước vẫn báo ĐẠT, nên «0 thừa» trên dữ liệu thật không chứng minh nhánh này có đo. Cần đối chứng thứ hai thêm vào `sau` một dòng URL ngoài urlMong.
  rationale: AC-5 hứa ảnh chỉ có URL không đổi trên dữ liệu thật; chiều URL thừa không có đối chứng nên 0 lệch không chứng minh được điều đó.

- **Hình dạng 5 — tuyên quét trục «tệp, URL, băm sắp nhỏ hơn» nhưng ma trận AC-9 không có dòng nào cho băm**
  AC: AC-9
  file: `pipeline/scripts/khu-trung-anh.test.mjs:115`
  severity: medium
  source: measurement
  detail: AC-9 và E10 hứa bản giữ và thứ tự vẫn theo post_ids «khi tệp, URL, băm của lần sau sắp nhỏ hơn». Cả 4 dòng AC9 (116-119) chỉ có một băm mỗi dòng và kiemAc9 chỉ xem `mot[0]`, nên trục băm không có phần tử nào và thứ tự giữa các băm không được đo. Dòng duy nhất có nhiều băm trong tệp này là AC-1 dòng 45-46, mà băm xuất hiện lần đầu theo đúng thứ tự tăng dần a, b, c, nên sắp theo băm vẫn ra cùng kết quả. Đã chạy đột biến trên bản chép ở scratchpad: sau lượt 1 thêm `out.sort` theo sha256 rồi đánh số lại media_order. Toàn bộ khu-trung-anh.test.mjs vẫn pass 9/9. Cần dòng có băm lớn đứng trước băm nhỏ (ví dụ b rồi a), assert trên cả danh sách, kèm ca đỏ theo đột biến sắp băm.
  rationale: AC-9 hứa bản giữ và thứ tự theo post_ids dù băm sắp khác đi, nhưng ma trận không có ca nhiều băm nên đột biến sắp theo băm vẫn qua.

- **Hình dạng 4 — âm tính một mình: kiểm doiChieu không lộ băm vẫn xanh khi hàm trả null**
  AC: AC-8
  file: `app/tests/khu-trung-anh.test.tsx:118`
  severity: medium
  source: measurement
  detail: E9 hứa đầu ra thật của tinKe và doiChieu không có băm. kiemKhongBam (108-113) lấy `JSON.stringify(the)` rồi `assert.ok(json)`. Với null, kết quả là chuỗi "null", vẫn truthy, nên hai assert âm phía sau xanh. Dòng 118 không có assert dương nào, trong khi tinKe có `the!.anh.length` ở dòng 117. Ca đỏ ở dòng 120-124 cũng chỉ đi qua tinKe. doiChieu trả null khi `nhan` hoặc `bai` rỗng (labels-luot-hai.ts:44, :52), mà qThe khớp câu SQL bằng regex (dòng 107). Sửa chữ của một trong hai câu SQL đó là stub trả rỗng, doiChieu trả null và ca vẫn xanh mà không đo gì. Cần assert đầu ra doiChieu khác null và có ảnh đã khử, ví dụ `anh.length === 1`, trước khi kiểm âm.
  rationale: AC-8 đòi dữ liệu thẻ gắn nhãn gửi xuống trình duyệt không mang băm; kiểm đối chiếu xanh cả khi hàm trả null nên không đo gì.

- **Hình dạng 4 — âm tính một mình: kiểm tĩnh «không đọc đĩa, không gọi mạng» không có ca đỏ và regex import bỏ lọt**
  AC: AC-2
  file: `pipeline/scripts/khu-trung-anh.test.mjs:99`
  severity: low
  source: measurement
  detail: AC-2 hứa hàm không đọc đĩa, không gọi mạng. evals.yaml dòng 4 ghi mỗi ma trận có ca đỏ ghim thông điệp. Dòng 99 chỉ nhận import dạng `^import .* from "…";$`, nên `import x from 'node:fs'` (nháy đơn), import không có dấu chấm phẩy, import nhiều dòng và `import("node:fs")` đều không vào `nhap`, deepEqual ở dòng 100 vẫn xanh. Dòng 101 `doesNotMatch(/\bfetch\(/)` là assert âm đơn lẻ, không ghim thông điệp. Cả hai đều không có ca đỏ trên bản sao đột biến như các phần khác của tệp, nên chưa chứng minh được kiểm tĩnh này sẽ kêu.
  rationale: AC-2 hứa hàm không đọc đĩa, không gọi mạng; kiểm tĩnh hiện bỏ lọt nhiều dạng import nên lời hứa chưa được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **kta_db và kta_app_db cùng dựng lại một DB thử mà không dùng --neu-chua-co (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi hai bài kiểm chạy cùng lúc, một bài có thể xoá DB thử của bài kia và báo đỏ giả. Người dùng thật không bị ảnh hưởng.
  Căn cứ: Chỉ làm kết quả kiểm chập chờn cho đội, không mất dữ liệu; chạy lại là qua, sửa sau rẻ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hai lệnh chấm kta_db và kta_app_db cùng xoá rồi dựng lại một DB thử, chạy song song sẽ đụng nhau (r1 · tệp đã đổi)**
  Người dùng thấy gì: Hai bài kiểm chạy song song có thể giẫm lên DB thử của nhau và báo đỏ giả. Người dùng không thấy gì.
  Căn cứ: Chỉ gây nhiễu khi kiểm, không mất dữ liệu; chạy lại được và sửa sau rẻ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Link của ảnh đã khử trùng bị đếm thành «liên kết khác» trên thẻ gắn nhãn (r1)**
  Người dùng thấy gì: Trên thẻ gắn nhãn, bài có hai ảnh giống hệt có thể hiện dòng «có 1 liên kết khác» thừa. Hiện chưa bài nào gặp.
  Căn cứ: Chỉ là dòng chữ thừa, không mất dữ liệu, hôm nay chưa có bài nào dính; người gắn nhãn bỏ qua được.
  file: `app/src/lib/labels-anh.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — không ghim số dòng ma trận, số trong eval lệch số trong test, ca đỏ chỉ chứng minh dòng đầu (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bộ kiểm có thể vẫn xanh dù một số dòng trong ma trận bị xoá hay chưa từng được chứng minh đỏ. Người dùng chưa thấy ảnh hưởng.
  Căn cứ: Chỉ làm bộ kiểm lỏng hơn mong muốn, dữ liệu không mất; bổ sung dòng ma trận sau không đắt.
  file: `_acceptance/khu-trung-anh-tin/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — «số offer có ảnh không giảm» so với bản nền trước PL28, không so với trước khử trùng (r1)**
  Người dùng thấy gì: Phép đo có thể không phát hiện nếu khử trùng làm vài tin mất hết ảnh so với bản đang chạy. Chưa có dấu hiệu xảy ra.
  Căn cứ: Thước AC-5 đã kiểm mỗi tin còn đủ băm nên rủi ro thấp; chỉ là phép đo bổ sung thiếu mốc.
  file: `pipeline/scripts/do-gop-anh.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — fixture media_files viết tay, không rút từ bên ghi mediaFilesOf (r1 · tệp đã đổi)**
  Người dùng thấy gì: Các ca thử trên DB dùng dữ liệu ảnh dựng tay thay vì đi từ bên thu về, nên nếu khuôn dữ liệu bên thu đổi, bộ kiểm có thể không nhận ra. Hiện khuôn đang khớp.
  Căn cứ: Khuôn hiện khớp và phép đo trên dữ liệu thật bắt được phần lớn sai lệch; chỉ là lỗ hổng bộ kiểm, sửa sau không gấp.
  file: `pipeline/scripts/khu-trung-anh.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
