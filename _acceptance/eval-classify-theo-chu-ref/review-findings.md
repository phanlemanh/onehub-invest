# Review findings: eval-classify-theo-chu-ref (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **card-plain.json xếp AC-2, AC-3, AC-5, AC-6 vào will_do nên thẻ duyệt in Given/When/Then thô, câu dịch bị bỏ**
  Người dùng thấy gì: Thẻ duyệt hiển thị bốn tiêu chí bằng câu tiếng Anh thô thay vì câu tiếng Việt đã viết, và đặt nhầm vào nhóm 'sẽ không làm'. Người đọc thẻ khó hiểu hơn, nhưng lệnh chấm chạy đúng.
  Căn cứ: Chỉ làm thẻ khó đọc hơn, không mất hay lộ dữ liệu; một phần do công cụ dựng thẻ nên sửa tại nguồn đó rẻ hơn là sửa tay từng thẻ.
  file: `_acceptance/eval-classify-theo-chu-ref/card-plain.json`
  severity: low
  Đề xuất: known-limits

- **Chú thích executor ecr_db và đầu probe liệt kê thiếu E8, E9**
  Người dùng thấy gì: Ghi chú trong cấu hình thiếu hai phép đo, có thể khiến người đọc tưởng hai tiêu chí chưa được đo trên cơ sở dữ liệu. Không ảnh hưởng kết quả chấm.
  Căn cứ: Chỉ là ghi chú sai, không ảnh hưởng người dùng; sửa lúc nào cũng rẻ nên ghi vết là đủ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Dòng chỉ ảnh có ghep NULL vẫn bị chấm trên URL và ghi vào dq_check_results, không có cảnh báo**
  Người dùng thấy gì: Những bài chỉ có ảnh mà chưa chạy bước ghép vẫn bị chấm trên đường dẫn ảnh, làm điểm bộ đọc thấp giả, và lệnh không cảnh báo gì. Hiện chưa có nhãn nào nên chưa có số sai.
  Căn cứ: Điểm thấp giả chỉ gây hiểu nhầm khi đọc số, không mất dữ liệu, và tự hết khi chạy bước ghép rồi chấm lại; nên ghi thành hạn chế đã biết cho người ký thấy.
  file: `pipeline/lib/eval-classify.mjs`
  severity: low
  Đề xuất: known-limits

- **Thẻ Cổng Phạm vi xếp AC-2, AC-3, AC-5, AC-6 vào 'Sẽ KHÔNG làm / sẽ chặn' và mất bản dịch của cả bốn**
  Người dùng thấy gì: Thẻ duyệt phạm vi mà Mạnh đã đọc xếp nhầm bốn tiêu chí vào mục 'sẽ không làm' và hiện chúng bằng chữ kỹ thuật thô thay vì lời dễ hiểu. Cách chấm điểm của công cụ không đổi, chỉ có thể khó đọc hơn.
  Căn cứ: Hậu quả nhẹ: chỉ ảnh hưởng chỗ đọc của thẻ, không mất hay sai dữ liệu nào, và thẻ đã được duyệt xong. Phần xếp nhóm sai do bộ vẽ thẻ dùng chung gây ra nên cần gửi cho bên giữ bộ đó chứ không sửa tay ở đây; ghi lại là đủ.
  file: `_acceptance/eval-classify-theo-chu-ref/card.html`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2, fixture viết tay đúng khuôn bên đọc: dòng vừa trùng vừa không chữ không thể sinh từ writer**
  Người dùng thấy gì: Một ca thử mô tả trạng thái dòng mà đường ghi thật không bao giờ tạo ra, nên ca đó chỉ có giá trị phòng thủ, không chứng minh hành vi thực tế. Kết quả chấm cho người dùng không đổi.
  Căn cứ: Chỉ làm bằng chứng kiểm thử yếu đi một chút, không ảnh hưởng số liệu hay dữ liệu thật; ghi lại là đủ.
  file: `pipeline/scripts/eval-classify-ghep.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4, âm tính không đối chứng dương: chiều đỏ của E9 (AC-3) chỉ đo bài ảnh a5, không đo dòng trùng cụm**
  Người dùng thấy gì: Phép đo trên cơ sở dữ liệu thử chưa chứng minh được rằng một cụm trùng bị chấm hơn một lần sẽ bị bắt. Nhưng ca thử thuần túy đã kiểm cùng điều đó.
  Căn cứ: Chỉ là bằng chứng chưa đầy đủ, không phải lỗi gây sai số cho người dùng; có thể bổ sung sau với chi phí thấp.
  file: `_acceptance/eval-classify-theo-chu-ref/probes/db.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5, tuyên quét lớp nhưng thiếu ma trận: quét «chữ bài thật» chỉ là mẫu 7%, hơn nửa mẫu không thể khớp và đối chứng đi vòng qua chỗ mù**
  Người dùng thấy gì: Phép kiểm tra không lọt nội dung bài thật vào hồ sơ chỉ xem được một phần nhỏ mẫu, nên có thể bỏ sót. Hiện chưa phát hiện nội dung nào bị lọt.
  Căn cứ: Nếu lọt thì là lộ nội dung nhưng chưa thấy dấu hiệu nào và hồ sơ gỡ được bằng một lần sửa; nên ghi rõ giới hạn của phép kiểm để người ký biết mức tin cậy.
  file: `_acceptance/eval-classify-theo-chu-ref/probes/db.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5, tuyên quét lớp nhưng thiếu ma trận: quét «tên nguồn» loại 13/19 token của source_registry, đối chứng chỉ thử một phần tử còn lại**
  Người dùng thấy gì: Phép kiểm tra tên nguồn thật chỉ so với một phần danh sách tên nên có thể bỏ sót một số dạng tên. Đối chiếu thủ công cho thấy chưa có tên nào lọt vào hồ sơ.
  Căn cứ: Hiện không có tên nguồn thật nào bị lộ nên hậu quả chưa xảy ra; vì là thông tin nhạy cảm nên cần ghi rõ giới hạn của phép kiểm để người ký biết.
  file: `_acceptance/eval-classify-theo-chu-ref/probes/db.mjs`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/8 lỗi rơi vào file không bộ đo nào phủ (_acceptance/eval-classify-theo-chu-ref/card-plain.json, _acceptance/config.yaml, _acceptance/eval-classify-theo-chu-ref/card.html) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
