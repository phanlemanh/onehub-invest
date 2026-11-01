# Review findings: nhan-bac-model-lon-s03 (round 2)

## Trong hợp đồng

Không có finding.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình 2 — Fixture viết tay đúng khuôn bên đọc: ô 6 của NB-AC-4 tự dựng dòng stg rồi gọi thẳng baiTuDong, không đi qua chonBai/loadStgPosts**
  Người dùng thấy gì: Lệnh gạt thông tin cá nhân trước khi gửi bài ra ngoài được kiểm bằng bài dựng tay, chưa kiểm bằng hàng đọc thật từ cơ sở dữ liệu. Nếu bước ghép chữ bài sau này đổi, bài kiểm vẫn báo xanh dù thông tin nhóm hay người gửi có thể lọt vào yêu cầu.
  Căn cứ: Rủi ro chỉ xuất hiện khi có người sửa bước chọn bài sau này, và đo thật trên tập vàng cùng soát yêu cầu gửi đi vẫn bắt được; ghi lại để lần sửa sau nhớ kiểm lại là rẻ nhất.
  file: `agent/tests/nhan-bac-s03.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình 2 — Fixture viết tay đúng khuôn bên đọc: trả lời Decisions giả được viết đúng các trường mà hoiBai đọc**
  Người dùng thấy gì: Bài kiểm về backend Decisions dùng trả lời giả do chính người viết dựng, nên nếu máy chủ thật trả khác hình thì xác suất và chi phí có thể bị ghi rỗng mà bài kiểm vẫn xanh. Số đo thật trên tập vàng là chỗ duy nhất lộ ra chuyện này.
  Căn cứ: Hậu quả nhẹ vì chỉ làm thiếu cột xác suất và chi phí trong bảng nhãn bạc nội bộ, không mất hay lộ dữ liệu, và chạy lại là sửa được; dựng máy chủ giả đúng chuẩn thì tốn công hơn nhiều.
  file: `agent/tests/nhan-bac-s03.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình 1 — Đo chỉ dẫn thay vì đầu ra: NB-AC-7 Haiku/Decisions chỉ assert modelId/provider của đối tượng model, không kiểm yêu cầu thật được gửi đi**
  Người dùng thấy gì: Chưa có bài kiểm tự động nào chứng minh yêu cầu gửi tới Haiku và Decisions mang đúng khoá và đúng đích trên đường truyền. Chỉ khi chạy đo thật với khoá Gateway mới thấy được lỗi cấu hình ở chỗ này.
  Căn cứ: Nếu sai thì lần đo thật báo lỗi ngay, không mất dữ liệu, không ảnh hưởng người dùng cuối, và tự sửa được bằng cách chạy lại; dựng máy chủ giả cho Gateway đắt hơn hậu quả.
  file: `agent/tests/nhan-bac-s03.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Cổng vocab_lint đỏ: 4 chỗ viết tay enum listing_intent/kind ngoài sổ trong nhan-bac-s03.ts (r1 · tệp đã đổi)**
  Người dùng thấy gì: Danh sách giá trị ý định và bán/thuê bị viết tay thay vì lấy từ sổ từ vựng chung, nên kiểm tra tự động của dự án báo đỏ. Người dùng không thấy lỗi nào, nhưng nếu sổ đổi mà bản viết tay không đổi theo thì nhãn có thể lệch.
  Căn cứ: Không mất dữ liệu và không ảnh hưởng người dùng cuối; chỉ chặn gộp mã, sửa sau rẻ và an toàn.
  file: `agent/src/agents/nhan-bac-s03.ts`
  severity: medium
  Đề xuất: new-contract

- **Cờ --since không lọc được bài nào vì so chuỗi của một đối tượng Date (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi người chạy lệnh đặt mốc ngày để chỉ gắn nhãn bài mới, mốc bị bỏ qua và cả bài cũ vẫn được gửi đi tính phí. Trần chi phí vẫn chặn được mức chi tối đa.
  Căn cứ: Hậu quả nhẹ vì trần chi phí vẫn giữ, không mất dữ liệu, người chạy thấy ngay và chạy lại được; sửa sau rẻ.
  file: `agent/scripts/nhan-bac-run.ts`
  severity: medium
  Đề xuất: known-limits

- **`as const` của GATEWAY_MODEL bị nuốt vào trong comment (r1)**
  Người dùng thấy gì: Danh sách tên model Gateway không bị khoá chặt về kiểu, nhưng người dùng không thấy khác biệt nào khi chạy.
  Căn cứ: Không có hậu quả nào với người dùng hay dữ liệu; chỉ là sự cẩu thả trong mã, ghi vết là đủ.
  file: `agent/src/runtime/models.ts`
  severity: low
  Đề xuất: wont-fix

- **--since không bao giờ lọc được bài: so chuỗi giữa Date đã String() và chuỗi ISO (r1 · tệp đã đổi)**
  Người dùng thấy gì: Mốc ngày người chạy đặt để chọn bài mới bị bỏ qua lặng lẽ, nên lô gửi đi có thể gồm cả bài cũ và tiêu phí cloud vào lô không mong muốn.
  Căn cứ: Chi phí vẫn bị trần chặn, không mất dữ liệu, thấy được ngay và chạy lại được; sửa sau rẻ.
  file: `agent/scripts/nhan-bac-run.ts`
  severity: medium
  Đề xuất: known-limits

- **`as const` của GATEWAY_MODEL nằm trong chú thích nên không có tác dụng (r1)**
  Người dùng thấy gì: Tên model Gateway không được cố định về kiểu như tác giả muốn, nhưng khi chạy người dùng không thấy gì khác.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu; chi phí sửa nhỏ nhưng lợi ích gần bằng không.
  file: `agent/src/runtime/models.ts`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): trả lời Decisions do test tự viết theo đúng hình hoiBai đọc, không round-trip qua provider Gateway (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bộ kiểm tự động dùng câu trả lời giả do chính người viết tạo, nên nếu Gateway trả hình khác thì kiểm tự động vẫn xanh. Lỗi chỉ lộ ra khi đo thật.
  Căn cứ: Đo thật trên tập vàng vẫn bắt được lệch hình, không mất dữ liệu và bảng nhãn bạc không đi vào dữ liệu chính; dựng máy chủ giả đầy đủ thì tốn.
  file: `agent/tests/nhan-bac-s03.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (thông điệp ghim không gắn với lỗi cụ thể): chiều đỏ NB-AC-2 bọc mọi lỗi thành thông điệp ghim (r1)**
  Người dùng thấy gì: Ca kiểm chứng việc bảng chặn dòng trùng có thể báo đúng ngay cả khi lỗi đến từ nguyên nhân khác. Người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ làm yếu một ca kiểm phụ, hành vi chạy lại đã được ca chính chứng minh; sửa không đáng công.
  file: `agent/tests/nhan-bac-s03-db.itest.ts`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (chiều đỏ không đột biến mã thật): chiều đỏ NB-AC-9 tự viết lại vòng lặp và truyền cứng dungTran=true (r1 · tệp đã đổi)**
  Người dùng thấy gì: Ca kiểm trần chi phí ở chiều đỏ không chạy qua lệnh thật, nên một lỗi làm lệnh kiểm trần sau khi đã gửi có thể lọt qua kiểm tự động. Khi đó tiền cloud có thể vượt trần một bài.
  Căn cứ: Mức vượt tối đa chỉ một bài, rất nhỏ so với trần; không mất dữ liệu, và đo thật sẽ lộ ra.
  file: `agent/tests/nhan-bac-s03.test.ts`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
