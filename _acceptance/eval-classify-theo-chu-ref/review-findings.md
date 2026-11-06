## Trong hợp đồng

- **Hình dạng 4, âm tính một mình: 'oneinvest khong co dau vet' không có đối chứng dương cho bộ đếm dauVet**
  file: `_acceptance/eval-classify-theo-chu-ref/probes/db.mjs:172`
  severity: medium
  AC: AC-6
  source: measurement
  detail: Dòng 172 chỉ assert vetTruoc === 0 && vetSau === 0. dauVet (dòng 42-46) chỉ được gọi trên kết nối `that` (dòng 47, 171), không bao giờ gọi trên DB thử `c` sau khi đã nạp fixture, nên không có gì chứng minh bộ đếm từng trả số dương. Nếu một mẫu LIKE lệch khuôn fixture, phép đo vẫn xanh. Đối chứng 'tro vao oneinvest bi tu choi' (dòng 166) đo việc khác là chặn tên DB, không đo bộ đếm. Bộ đếm cũng bỏ sót bảng phép đo có ghi: airbnb_snapshots với SNAP (dòng 61) không có trong dauVet, trong khi AC-6 hứa DB oneinvest không có dấu vết của phép đo. Vết này chưa nằm trong review-findings round 1.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Dòng chỉ có ảnh mà ghep NULL vẫn bị chấm trên URL ảnh và ghi vào dq_check_results, không có cảnh báo**
  Người dùng thấy gì: Nếu chấm khi chưa chạy bước ghép tin, các bài chỉ có ảnh vẫn bị chấm trên đường dẫn ảnh và cho điểm thấp giả mà không có cảnh báo. Hiện chưa có điểm sai nào được ghi vì chưa có nhãn ở lát đó.
  Căn cứ: Hiện chưa có điểm sai nào lọt vào sổ và chỉ xảy ra khi chấm quên chạy bước ghép; người chấm chạy lại được sau khi ghép nên hậu quả nhẹ, còn sửa thì phải quyết lại một tiêu chí đã ký.
  file: `pipeline/lib/eval-classify.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2, fixture viết tay đúng khuôn bên đọc: dòng vừa trùng vừa không chữ mà writer không thể sinh**
  Người dùng thấy gì: Một ca thử dùng dữ liệu mà bước ghép thật không bao giờ tạo ra, nên ca này chứng minh ít hơn tên gọi của nó. Kết quả chấm thật cho người dùng không bị ảnh hưởng.
  Căn cứ: Không có điểm sai nào đến tay người dùng, chỉ là một ca thử hơi thừa; sửa hay không cũng không đổi kết quả nên không đáng tốn công.
  file: `pipeline/scripts/eval-classify-ghep.test.mjs`
  severity: medium
  Đề xuất: wont-fix

- **Hình dạng 2, fixture viết tay đúng khuôn bên đọc: ca AC-1 tự chép khoá coalesce để dựng chữ**
  Người dùng thấy gì: Một ca thử nhanh tự dựng lại chữ cần kiểm nên không tự bắt được lỗi đọc nhầm nguồn chữ, nhưng phép đo trên dữ liệu thử vẫn bắt được. Người dùng không thấy khác biệt.
  Căn cứ: Lỗi này vẫn bị một phép đo khác bắt lại, nên không có nguy cơ sai điểm lọt ra; chỉ là một lớp kiểm thừa yếu.
  file: `pipeline/scripts/eval-classify-ghep.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4, đối chứng không ghim đúng thứ cần đo: chiều đỏ của E9 (AC-3) chỉ thử bài ảnh a5, không thử dòng trùng cụm**
  Người dùng thấy gì: Trên dữ liệu thử, phép kiểm đối chứng chỉ thử với bài ảnh chứ không thử với dòng trùng cụm. Nếu cờ trùng cụm bị mất, lỗi này có thể chỉ được bắt ở bước kiểm nhỏ hơn.
  Căn cứ: Ý này vẫn có một phép kiểm khác phủ ở mức nhỏ hơn nên khả năng sai điểm lọt ra thấp; bổ sung đối chứng sau này rẻ và không ảnh hưởng người dùng hiện tại.
  file: `_acceptance/eval-classify-theo-chu-ref/probes/db.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4, đối chứng không thử đúng nhánh: các ca 'bo nhanh' đổi dữ liệu chứ không đổi mã**
  Người dùng thấy gì: Hai ca thử đối chứng không chứng minh đúng điều tên của chúng nói, nhưng các ca khác vẫn bắt được lỗi. Người dùng không bị ảnh hưởng.
  Căn cứ: Không mất lớp bảo vệ nào, chỉ là mô tả ca thử hơi quá lời; tốn công sửa mà không đổi gì cho người dùng.
  file: `pipeline/scripts/eval-classify-ghep.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 5, tuyên quét lớp nhưng chỉ có điểm-case: quét tên nguồn lọc bớt token và đối chứng chỉ thử một phần tử**
  Người dùng thấy gì: Phép quét tìm tên nguồn thật trong phần thêm vào chỉ bỏ qua một số từ ngắn và tệp chưa theo dõi, nên có thể bỏ sót một tên lọt vào. Chưa có bằng chứng thực tế là đã có tên nào lọt.
  Căn cứ: Nếu có tên nguồn thật lọt thì đây là chuyện nhạy cảm, nhưng chưa thấy ca nào và kho công khai vẫn có lớp chặn khác; nên ghi lại giới hạn và củng cố phép quét ở lượt sau.
  file: `_acceptance/eval-classify-theo-chu-ref/probes/db.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5, tuyên quét lớp nhưng chỉ có mẫu: quét 'chữ bài thật' có đối chứng vòng tròn**
  Người dùng thấy gì: Phép kiểm xem có chữ bài thật nằm trong phần thêm chỉ so với một mẫu nhỏ, nên một đoạn chữ ngoài mẫu có thể không bị phát hiện. Chưa có bằng chứng là đã có chữ nào lọt vào.
  Căn cứ: Nếu có chữ bài thật lọt lên kho công khai thì khó thu hồi, nhưng chưa thấy dấu hiệu nào và phần thêm vào chủ yếu là mã; nên ghi giới hạn độ phủ của phép quét.
  file: `_acceptance/eval-classify-theo-chu-ref/probes/db.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3, assert chuỗi có mặt trong khi lời hứa là đúng số: dry khớp cả số khác do không có biên**
  Người dùng thấy gì: Phép kiểm số dòng in ra ở chế độ chạy thử khớp lỏng nên về lý thuyết cũng chấp nhận số lớn hơn có cùng chữ số đầu. Số in ra thật hiện đúng.
  Căn cứ: Số liệu người dùng thấy đã đúng và lỗi này chỉ làm phép kiểm lỏng hơn mong muốn; sửa rẻ nhưng không mang lại lợi ích thực tế.
  file: `_acceptance/eval-classify-theo-chu-ref/probes/db.mjs`
  severity: low
  Đề xuất: wont-fix

- **card-plain.json xếp AC-2, AC-3, AC-5, AC-6 vào will_do nên thẻ duyệt in Given/When/Then thô, câu dịch bị bỏ (r1)**
  Người dùng thấy gì: Thẻ duyệt hiển thị bốn tiêu chí bằng câu tiếng Anh thô thay vì câu tiếng Việt đã viết, và đặt nhầm vào nhóm 'sẽ không làm'. Người đọc thẻ khó hiểu hơn, nhưng lệnh chấm chạy đúng.
  Căn cứ: Chỉ làm thẻ khó đọc hơn, không mất hay lộ dữ liệu; một phần do công cụ dựng thẻ nên sửa tại nguồn đó rẻ hơn là sửa tay từng thẻ.
  file: `_acceptance/eval-classify-theo-chu-ref/card-plain.json`
  severity: low
  Đề xuất: known-limits

- **Chú thích executor ecr_db và đầu probe liệt kê thiếu E8, E9 (r1)**
  Người dùng thấy gì: Ghi chú trong cấu hình thiếu hai phép đo, có thể khiến người đọc tưởng hai tiêu chí chưa được đo trên cơ sở dữ liệu. Không ảnh hưởng kết quả chấm.
  Căn cứ: Chỉ là ghi chú sai, không ảnh hưởng người dùng; sửa lúc nào cũng rẻ nên ghi vết là đủ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Dòng chỉ ảnh có ghep NULL vẫn bị chấm trên URL và ghi vào dq_check_results, không có cảnh báo (r1)**
  Người dùng thấy gì: Những bài chỉ có ảnh mà chưa chạy bước ghép vẫn bị chấm trên đường dẫn ảnh, làm điểm bộ đọc thấp giả, và lệnh không cảnh báo gì. Hiện chưa có nhãn nào nên chưa có số sai.
  Căn cứ: Điểm thấp giả chỉ gây hiểu nhầm khi đọc số, không mất dữ liệu, và tự hết khi chạy bước ghép rồi chấm lại; nên ghi thành hạn chế đã biết cho người ký thấy.
  file: `pipeline/lib/eval-classify.mjs`
  severity: low
  Đề xuất: known-limits

- **Thẻ Cổng Phạm vi xếp AC-2, AC-3, AC-5, AC-6 vào 'Sẽ KHÔNG làm / sẽ chặn' và mất bản dịch của cả bốn (r1)**
  Người dùng thấy gì: Thẻ duyệt phạm vi mà Mạnh đã đọc xếp nhầm bốn tiêu chí vào mục 'sẽ không làm' và hiện chúng bằng chữ kỹ thuật thô thay vì lời dễ hiểu. Cách chấm điểm của công cụ không đổi, chỉ có thể khó đọc hơn.
  Căn cứ: Hậu quả nhẹ: chỉ ảnh hưởng chỗ đọc của thẻ, không mất hay sai dữ liệu nào, và thẻ đã được duyệt xong. Phần xếp nhóm sai do bộ vẽ thẻ dùng chung gây ra nên cần gửi cho bên giữ bộ đó chứ không sửa tay ở đây; ghi lại là đủ.
  file: `_acceptance/eval-classify-theo-chu-ref/card.html`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2, fixture viết tay đúng khuôn bên đọc: dòng vừa trùng vừa không chữ không thể sinh từ writer (r1)**
  Người dùng thấy gì: Một ca thử mô tả trạng thái dòng mà đường ghi thật không bao giờ tạo ra, nên ca đó chỉ có giá trị phòng thủ, không chứng minh hành vi thực tế. Kết quả chấm cho người dùng không đổi.
  Căn cứ: Chỉ làm bằng chứng kiểm thử yếu đi một chút, không ảnh hưởng số liệu hay dữ liệu thật; ghi lại là đủ.
  file: `pipeline/scripts/eval-classify-ghep.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4, âm tính không đối chứng dương: chiều đỏ của E9 (AC-3) chỉ đo bài ảnh a5, không đo dòng trùng cụm (r1)**
  Người dùng thấy gì: Phép đo trên cơ sở dữ liệu thử chưa chứng minh được rằng một cụm trùng bị chấm hơn một lần sẽ bị bắt. Nhưng ca thử thuần túy đã kiểm cùng điều đó.
  Căn cứ: Chỉ là bằng chứng chưa đầy đủ, không phải lỗi gây sai số cho người dùng; có thể bổ sung sau với chi phí thấp.
  file: `_acceptance/eval-classify-theo-chu-ref/probes/db.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5, tuyên quét lớp nhưng thiếu ma trận: quét «chữ bài thật» chỉ là mẫu 7%, hơn nửa mẫu không thể khớp và đối chứng đi vòng qua chỗ mù (r1)**
  Người dùng thấy gì: Phép kiểm tra không lọt nội dung bài thật vào hồ sơ chỉ xem được một phần nhỏ mẫu, nên có thể bỏ sót. Hiện chưa phát hiện nội dung nào bị lọt.
  Căn cứ: Nếu lọt thì là lộ nội dung nhưng chưa thấy dấu hiệu nào và hồ sơ gỡ được bằng một lần sửa; nên ghi rõ giới hạn của phép kiểm để người ký biết mức tin cậy.
  file: `_acceptance/eval-classify-theo-chu-ref/probes/db.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5, tuyên quét lớp nhưng thiếu ma trận: quét «tên nguồn» loại 13/19 token của source_registry, đối chứng chỉ thử một phần tử còn lại (r1)**
  Người dùng thấy gì: Phép kiểm tra tên nguồn thật chỉ so với một phần danh sách tên nên có thể bỏ sót một số dạng tên. Đối chiếu thủ công cho thấy chưa có tên nào lọt vào hồ sơ.
  Căn cứ: Hiện không có tên nguồn thật nào bị lộ nên hậu quả chưa xảy ra; vì là thông tin nhạy cảm nên cần ghi rõ giới hạn của phép kiểm để người ký biết.
  file: `_acceptance/eval-classify-theo-chu-ref/probes/db.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
