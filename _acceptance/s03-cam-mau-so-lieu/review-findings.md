# Review findings: s03-cam-mau-so-lieu (round 1)

## Trong hợp đồng

- **Hình dạng 5 (tuyên quét lớp, chỉ có một điểm-case): vế SĐT của AC-1 có một dòng, và dòng đó không phân biệt được gì**
  AC: AC-1
  file: `pipeline/scripts/cam-mau-s03.test.mjs:40`
  severity: medium
  source: measurement
  detail: E1 (evals.yaml dòng 13) hứa ma trận viết trước có «SĐT dạng thường/chấm/cách», nhưng AC1 chỉ có một dòng mang SĐT: ["Cho thuê 65m2 lh 0901.234.567", areaM2, 65], tức chỉ dạng chấm. Không có dòng dạng liền hay dạng cách. Dòng này cũng không đo được bước gạt SĐT. Nếu bỏ PHONE_RE khỏi gatSo thì «65m2» vẫn khớp regex diện tích trước, còn dãy «0901.234.567» không khớp regex giá tỷ, triệu, GIA_DONG (lookbehind (?<![\d.,]) chặn mọi điểm bắt đầu) hay regex PN. Vì vậy cả bảng AC1 vẫn xanh khi transform đọc số trên chữ còn SĐT. Ca đỏ (dòng 51) chỉ đột biến cả dòng `const so = gatSo(text);`, lại chỉ ghim dòng URL «6tY». Không ca nào cho SĐT trở thành giá hay diện tích. Kết quả: nửa lời hứa «không đọc số từ SĐT» chưa có dòng nào làm đỏ được.
  rationale: AC-1 nêu rõ không lấy số từ SĐT, mà ma trận chỉ có một dòng SĐT dạng chấm và dòng ấy vẫn xanh khi bỏ bước gạt SĐT, nên vế SĐT của AC-1 chưa được ghim.

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ): CM-AC-7 không tách được «mới nhất theo posted_at» khỏi «bài có tên xử lý sau cùng»**
  AC: AC-7
  file: `pipeline/scripts/cam-mau-s03.itest.mjs:96`
  severity: medium
  source: measurement
  detail: AC-7 hứa một quan hệ: seller_name là tên của bài có posted_at lớn nhất trong các bài có tên. Fixture xanh lại cho thứ tự xử lý trùng thứ tự thời gian. post_id = `t_${tag}_${++seq}`, loadStgPosts sắp ORDER BY post_id, nên sau ca CM-AC-5 (seq 1–4) ba bài cu/moi/rong được id _5/_6/_7 và posted_at tăng theo đúng thứ tự đó (01:00, 05:00, 06:00). Một bản cài ngây thơ `if (ten) o.sellerName = ten` (bài có tên sau cùng thắng, không so thời gian) cũng ra «B», nên `assert.equal(o?.seller_name, "B")` vẫn xanh. Không có ô nào mà bài mới hơn về thời gian lại được xử lý trước. Ca đỏ (dòng 101–103) đỏ được chỉ nhờ tình cờ: seq bị dùng chung với tên tệp đột biến nên id vượt qua mốc _9 → _10 và thứ tự chữ đảo lại. Chạy riêng ca này, hoặc đổi thứ tự ca, là mất tính phân biệt.
  rationale: AC-7 hứa seller_name lấy từ bài mới nhất có tên, mà ca thử không phân biệt được «mới nhất theo thời gian» với «xử lý sau cùng», nên chính lời hứa của AC-7 chưa được kiểm.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **GIA_TY_LE đọc số đếm đứng sau chữ tỷ thành phần lẻ của giá: «4 tỷ 5 tầng» ra 4,5 tỷ**
  Người dùng thấy gì: Tin bán nhà ghi kiểu «4 tỷ 5 tầng» bị hiểu thành giá 4,5 tỷ, nên giá và đơn giá trên mỗi m² của căn đó hiển thị sai mà không có cảnh báo.
  Căn cứ: Giá sai lọt vào dữ liệu bán thật và nhìn hợp lý nên khó phát hiện, nhưng chỉ ảnh hưởng nhóm tin có kể số tầng sau giá và sửa lại bằng một đợt riêng thì không đắt.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **GIA_DONG lấy đơn giá «45.000.000/m2» làm tổng giá tin bán**
  Người dùng thấy gì: Tin bán đất ghi đơn giá kiểu «45.000.000/m2» bị ghi thành tổng giá 45 triệu, kéo theo đơn giá mỗi m² sai hẳn so với thực tế.
  Căn cứ: Giá sai nặng và không bị chặn bởi trần 100 tỷ, nhưng chỉ xảy ra với một cách viết đơn giá nhất định và có thể sửa gọn trong một việc riêng.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **Lớp nguồn S03 trong mappings.yaml chưa khai các trường staging mới mà transform đã đọc (sender_name → seller_name, conversation_id)**
  Người dùng thấy gì: Tài liệu ánh xạ trường của nguồn S03 chưa ghi hai trường mới, nên người đọc tài liệu sẽ thấy sổ lệch với thực tế; người dùng cuối không thấy gì khác.
  Căn cứ: Chỉ là tài liệu nội bộ lệch, không làm mất hay sai dữ liệu, và bổ sung bất cứ lúc nào cũng rẻ.
  file: `pipeline/mappings.yaml`
  severity: low
  Đề xuất: known-limits

- **GIA_TY_LE đọc số tầng/lầu đứng sau chữ tỷ thành phần lẻ của giá («8 tỷ 4 tầng» ra 8,4 tỷ)**
  Người dùng thấy gì: Tin bán nhà phố ghi «8 tỷ 4 tầng» bị hiểu thành 8,4 tỷ, nên giá hiển thị cao hơn thật và đơn giá mỗi m² sai theo.
  Căn cứ: Giá sai lặng lẽ trên loại tin rất phổ biến là nhà phố, nhưng sửa sau không đắt và dữ liệu được nạp lại được.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **PHONE_RE trong gatSo xoá mất giá tỷ chẵn viết bằng đồng («3.000.000.000» ra null), GIA_DONG mới không bao giờ khớp được ca này**
  Người dùng thấy gì: Tin bán ghi giá tròn tỷ bằng chữ số đồng, ví dụ «3.000.000.000 đ», bị mất giá, nên căn đó hiện không có giá và rơi khỏi các bảng so sánh giá.
  Căn cứ: Mất giá chứ không sai giá, chỉ với một cách viết, và đọc lại từ bài gốc để bù thì không mất dữ liệu gốc.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **dienTichMetTran lấy khoảng cách («gần chợ 200m», «ra hồ 100m») làm diện tích**
  Người dùng thấy gì: Tin có câu như «gần chợ 200m» đôi khi bị lấy 200 làm diện tích căn, kéo theo đơn giá mỗi m² và mức tin cậy bị tính sai.
  Căn cứ: Chỉ ảnh hưởng một phần nhỏ tin có cụm khoảng cách đứng một mình, trước đây diện tích để trống nên hậu quả vừa phải; xử lý triệt để cần luật chặn rộng hơn nên đáng để ghi nhận trước.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
