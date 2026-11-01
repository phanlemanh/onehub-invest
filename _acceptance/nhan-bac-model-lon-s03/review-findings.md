## Trong hợp đồng

- **Hình dạng 4 (âm-tính-một-mình, ghim thông điệp tự sinh): chiều đỏ NB-AC-6 không chạm hoiBai/chayLo, thông điệp ghim do chính test tạo ra**
  file: `agent/tests/nhan-bac-s03.test.ts:136`
  severity: medium
  AC: AC-6
  source: measurement
  detail: Ca 'chiều đỏ NB-AC-6' gọi thẳng generateText với model ném lỗi, rồi `.catch((e) => { throw new Error(`NB-AC-6 một lỗi dừng cả lượt: ...`) })` và assert.rejects khớp /NB-AC-6 một lỗi dừng cả lượt/. Chuỗi được ghim là chuỗi test vừa tự ném, nên ca này đỏ bất kể mã sản phẩm ra sao. Bộ kiểm ở chiều xanh (dòng 130, assert.ok với 'NB-AC-6 ô «…»') cũng không bao giờ phát ra thông điệp ấy. Vậy không có đột biến nào của hoiBai/chayLo mà ca này bắt được. Thêm nữa, E6 hứa 'lô 6 bài có 1 bài lỗi mạng ở giữa → 6 dòng, bài sau vẫn nhãn; dòng tổng kết đếm lỗi theo loại khớp', nhưng không có ca chayLo nào có bài lỗi; kq.loi cũng không được assert ở đâu.
  Lý do vào hợp đồng: AC-6 đòi lượt chạy tiếp các bài sau và in số lỗi theo loại; không có ca nào chạy lô có bài lỗi nên vế này chưa được chứng minh.

- **Hình dạng 4 (âm-tính-một-mình): 'bảng đo không có chữ bài' chạy trên đầu vào vốn không có chữ bài**
  file: `agent/tests/nhan-bac-s03.test.ts:224`
  severity: medium
  AC: AC-8
  source: measurement
  detail: `assert.ok(!JSON.stringify(b).includes("Căn"), "NB-AC-8 bảng đo có chữ bài")`. Mảng DU (dòng 200–205) và VANG (192–197) không có trường text nào và không chứa chuỗi 'Căn'. doTapVang lại chỉ nhận post_id/listing_intent/kind/…, nên assert này đúng một cách rỗng. Không có đối chứng dương nào đưa chữ bài vào đầu vào rồi chứng minh nó không lọt ra. Lời hứa E8 'đầu ra không chứa chữ bài nào' vì thế chưa được đo.
  Lý do vào hợp đồng: AC-8 đòi bảng đo không in chữ bài; ca kiểm chạy trên đầu vào không có chữ bài nên vế này chưa được chứng minh.

- **Hình dạng 5 (tuyên ma trận nhưng thiếu phần tử) và hình dạng 1 (đo chữ ký hàm thay vì thân yêu cầu): NB-AC-4 có 5/6 ô, ô group_name/sender_name được thay bằng hoiBai.length**
  file: `agent/tests/nhan-bac-s03.test.ts:88`
  severity: medium
  AC: AC-4
  source: measurement
  detail: E4 hứa 'ma trận viết tay 6 bài (…, bài có group_name/sender_name) … không chuỗi …group_name/sender_name/conversation_id nào trong thân'. BAI_PII (dòng 54–60) chỉ có 5 phần tử, nên vòng lặp dòng 67 chỉ chạy 5 ô. Ô thứ sáu được thay bằng `assert.equal(hoiBai.length, 2)`, tức là đo số tham số bắt buộc của hàm chứ không đo thân yêu cầu gửi đi. Còn `assert.equal(stripPII("Nhóm A · Anh Tuấn 0912345678"), "Nhóm A · Anh Tuấn [phone]")` lại cho thấy tên nhóm/người nằm trong chữ bài sẽ đi nguyên văn. Không có ca nào gửi một bài thật kèm group_name/sender_name/conversation_id rồi kiểm thân nhận được ở model giả.
  Lý do vào hợp đồng: AC-4 đòi thân yêu cầu không chứa group_name, sender_name, conversation_id; ô kiểm này bị thay bằng đo số tham số hàm.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Cổng vocab_lint đỏ: 4 chỗ viết tay enum listing_intent/kind ngoài sổ trong nhan-bac-s03.ts**
  Người dùng thấy gì: Danh sách giá trị ý định và bán/thuê bị viết tay thay vì lấy từ sổ từ vựng chung, nên kiểm tra tự động của dự án báo đỏ. Người dùng không thấy lỗi nào, nhưng nếu sổ đổi mà bản viết tay không đổi theo thì nhãn có thể lệch.
  Căn cứ: Không mất dữ liệu và không ảnh hưởng người dùng cuối; chỉ chặn gộp mã, sửa sau rẻ và an toàn.
  file: `agent/src/agents/nhan-bac-s03.ts`
  severity: medium
  Đề xuất: new-contract

- **Cờ --since không lọc được bài nào vì so chuỗi của một đối tượng Date**
  Người dùng thấy gì: Khi người chạy lệnh đặt mốc ngày để chỉ gắn nhãn bài mới, mốc bị bỏ qua và cả bài cũ vẫn được gửi đi tính phí. Trần chi phí vẫn chặn được mức chi tối đa.
  Căn cứ: Hậu quả nhẹ vì trần chi phí vẫn giữ, không mất dữ liệu, người chạy thấy ngay và chạy lại được; sửa sau rẻ.
  file: `agent/scripts/nhan-bac-run.ts`
  severity: medium
  Đề xuất: known-limits

- **`as const` của GATEWAY_MODEL bị nuốt vào trong comment**
  Người dùng thấy gì: Danh sách tên model Gateway không bị khoá chặt về kiểu, nhưng người dùng không thấy khác biệt nào khi chạy.
  Căn cứ: Không có hậu quả nào với người dùng hay dữ liệu; chỉ là sự cẩu thả trong mã, ghi vết là đủ.
  file: `agent/src/runtime/models.ts`
  severity: low
  Đề xuất: wont-fix

- **--since không bao giờ lọc được bài: so chuỗi giữa Date đã String() và chuỗi ISO**
  Người dùng thấy gì: Mốc ngày người chạy đặt để chọn bài mới bị bỏ qua lặng lẽ, nên lô gửi đi có thể gồm cả bài cũ và tiêu phí cloud vào lô không mong muốn.
  Căn cứ: Chi phí vẫn bị trần chặn, không mất dữ liệu, thấy được ngay và chạy lại được; sửa sau rẻ.
  file: `agent/scripts/nhan-bac-run.ts`
  severity: medium
  Đề xuất: known-limits

- **`as const` của GATEWAY_MODEL nằm trong chú thích nên không có tác dụng**
  Người dùng thấy gì: Tên model Gateway không được cố định về kiểu như tác giả muốn, nhưng khi chạy người dùng không thấy gì khác.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu; chi phí sửa nhỏ nhưng lợi ích gần bằng không.
  file: `agent/src/runtime/models.ts`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): trả lời Decisions do test tự viết theo đúng hình hoiBai đọc, không round-trip qua provider Gateway**
  Người dùng thấy gì: Bộ kiểm tự động dùng câu trả lời giả do chính người viết tạo, nên nếu Gateway trả hình khác thì kiểm tự động vẫn xanh. Lỗi chỉ lộ ra khi đo thật.
  Căn cứ: Đo thật trên tập vàng vẫn bắt được lệch hình, không mất dữ liệu và bảng nhãn bạc không đi vào dữ liệu chính; dựng máy chủ giả đầy đủ thì tốn.
  file: `agent/tests/nhan-bac-s03.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (thông điệp ghim không gắn với lỗi cụ thể): chiều đỏ NB-AC-2 bọc mọi lỗi thành thông điệp ghim**
  Người dùng thấy gì: Ca kiểm chứng việc bảng chặn dòng trùng có thể báo đúng ngay cả khi lỗi đến từ nguyên nhân khác. Người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ làm yếu một ca kiểm phụ, hành vi chạy lại đã được ca chính chứng minh; sửa không đáng công.
  file: `agent/tests/nhan-bac-s03-db.itest.ts`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (chiều đỏ không đột biến mã thật): chiều đỏ NB-AC-9 tự viết lại vòng lặp và truyền cứng dungTran=true**
  Người dùng thấy gì: Ca kiểm trần chi phí ở chiều đỏ không chạy qua lệnh thật, nên một lỗi làm lệnh kiểm trần sau khi đã gửi có thể lọt qua kiểm tự động. Khi đó tiền cloud có thể vượt trần một bài.
  Căn cứ: Mức vượt tối đa chỉ một bài, rất nhỏ so với trần; không mất dữ liệu, và đo thật sẽ lộ ra.
  file: `agent/tests/nhan-bac-s03.test.ts`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/11 lỗi rơi vào file không bộ đo nào phủ (agent/src/runtime/models.ts) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
