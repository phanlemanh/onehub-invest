# Review findings: dong-bang-stage-b-resolve (round 3)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E4b (bản tin cloud, báo cáo ngày, HD11 trên DB) tự bỏ qua trong job CI scripts, đi vòng qua cơ chế ci-bo-qua.json**
  Người dùng thấy gì: Phép kiểm số thẻ chờ trong bản tin cloud và báo cáo ngày không tự chạy trên máy kiểm tự động, nên nếu số đếm sai trở lại thì có thể không ai biết ngay.
  Căn cứ: Chỉ làm mất một lớp canh gác tự động, số liệu người dùng thấy hiện vẫn đúng và vẫn kiểm được bằng tay; sửa sau không đắt.
  file: `scripts/ops-local-dong-bang.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hằng STAGE_B_DONG_BANG chen vào giữa chú thích của KHONG_CAP_THI_TRUONG và chính khai báo đó**
  Người dùng thấy gì: Một chú thích trong mã nằm sai chỗ, gây khó đọc cho người bảo trì; người dùng không thấy gì.
  Căn cứ: Không ảnh hưởng dữ liệu hay màn hình nào, chỉ gây hiểu nhầm nhẹ khi đọc mã, nên ghi nhận là đủ.
  file: `pipeline/resolve-properties.mjs`
  severity: low
  Đề xuất: wont-fix

- **Chú thích đáp án của mồi REVIEW đã cũ sau khi đổi mồi**
  Người dùng thấy gì: Một dòng chú thích trong dữ liệu thử còn ghi số cũ; người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ là chữ chú thích trong test, không đổi hành vi nào, sửa hay không đều không tác động tới người dùng.
  file: `pipeline/scripts/ops-facts-fixture.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (âm tính một mình): «?card=G2 mở thẻ G2» chỉ được đo bằng việc KHÔNG có chữ «Không tìm thấy thẻ»**
  Người dùng thấy gì: Phép kiểm việc mở thẻ đã quyết bằng đường dẫn sâu còn lỏng, nếu có lỗi hiển thị lạ thì test vẫn xanh.
  Căn cứ: Hành vi thực tế chưa thấy sai, rủi ro chỉ là bỏ sót lỗi hiển thị về sau và người dùng chỉ cần tải lại; củng cố test sau rất rẻ.
  file: `app/tests/review-dong-bang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): dòng Ghép căn của viewer chỉ đo bằng doesNotMatch, không đo dương các dòng agent_output/data_quality trên bản render**
  Người dùng thấy gì: Phép kiểm số thẻ chờ theo loại cho người xem chỉ chắc phần không hiện thẻ Ghép căn, chưa chắc phần các loại còn lại hiển thị đủ.
  Căn cứ: Số đếm đã được đo đúng ở tầng truy vấn, chỉ thiếu thêm một lớp kiểm trên giao diện; lỗi nếu có thì nhẹ và dễ thấy.
  file: `app/tests/review-dong-bang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): «0 câu chứa review_queue» của DBS-AC-5 không có đối chứng dương cho client gián điệp**
  Người dùng thấy gì: Phép kiểm rằng căn giá tốt không truy vấn thẻ chờ chưa có ca đối chứng chứng tỏ công cụ đếm thực sự bắt được truy vấn.
  Căn cứ: Kết quả hiện đúng, chỉ là độ tin cậy của phép kiểm thấp hơn mức lý tưởng; không ảnh hưởng người dùng và bổ sung sau rẻ.
  file: `app/tests/review-dong-bang.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng điểm-case): «mọi tệp .mjs chép vị từ» thực ra là map 3 tệp viết tay; ma trận câu chỉ đo ≥10**
  Người dùng thấy gì: Phép kiểm đảm bảo mọi nơi dùng chung một quy tắc ẩn thẻ chờ mới chỉ canh ba tệp cố định, tệp thứ tư thêm sau có thể lệch mà không bị bắt.
  Căn cứ: Hiện chưa có lệch thật; rủi ro là về sau thẻ chờ cũ có thể hiện lại ở một chỗ mới, người dùng thấy được và sửa không đắt.
  file: `scripts/ops-local-dong-bang.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: «đối chứng đỏ» của ca sau-khi-gộp là một hằng đúng (diff của commit với chính nó), không chạy cách đo cũ**
  Người dùng thấy gì: Phép kiểm cách đo thay đổi sau khi gộp nhánh chưa chứng tỏ được nó sẽ đỏ khi cách đo bị hỏng.
  Căn cứ: Chỉ ảnh hưởng độ tin của công cụ kiểm nội bộ, không chạm dữ liệu hay màn hình người dùng; sửa rẻ khi có dịp.
  file: `scripts/dong-bang-khong-ghi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay): đường bắt «câu ghi mới» chỉ được chứng trên diff mẫu dựng tay; diff git thật của PR sau chỉ chứng thông điệp migration**
  Người dùng thấy gì: Bộ kiểm vòng không ghi dữ liệu mới thử đường bắt câu ghi bằng dữ liệu mẫu tự dựng, chưa thử trên thay đổi thật.
  Căn cứ: Không ảnh hưởng người dùng; nếu công cụ bắt sót thì còn bước duyệt của người, và bổ sung sau rẻ.
  file: `scripts/dong-bang-khong-ghi.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay): đối chứng đỏ RK-AC-8 là chuỗi đầu ra cũ gõ tay, bộ tìm dòng được nới để bắt đúng chuỗi ấy**
  Người dùng thấy gì: Một ca thử đối chứng cho bộ chấm tự động dùng chuỗi tự gõ thay vì đầu ra thật của bản cũ.
  Căn cứ: Hành vi đóng băng đã có ca khác chạy thật chứng minh; điểm yếu chỉ nằm ở độ chặt của test, không chạm người dùng.
  file: `agent/tests/judge-run.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): «CLI đóng băng không gieo thẻ» đếm 0 thẻ mà không có đối chứng dương; nửa «cặp needs_llm còn nguyên» không được assert**
  Người dùng thấy gì: Phép kiểm bộ chấm tự động không tạo thẻ mới có thể xanh cả khi bộ chấm cũ cũng không tạo thẻ, và chưa kiểm cặp chờ còn nguyên.
  Căn cứ: Không thấy hành vi sai thật, chỉ là phép kiểm lỏng; thẻ lạ nếu xuất hiện thì ops thấy ngay, bổ sung assert sau rẻ.
  file: `agent/tests/judge-run.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): SL1-AC-3 «tin cấp thị trường không thành cặp» mất đối chứng dương**
  Người dùng thấy gì: Phép kiểm tin cấp thị trường không tạo cặp nay không còn phân biệt được luật lọc với việc không có cặp nào, vì việc dựng cặp đã tắt.
  Căn cứ: Đây là hệ quả đã được chấp nhận khi đóng băng; không ảnh hưởng người dùng, và ca sẽ có nghĩa lại khi đường gắn căn mới thay thế.
  file: `pipeline/scripts/s03-len-cong.itest.mjs`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 2/12 lỗi rơi vào file không bộ đo nào phủ (agent/tests/judge-run.test.ts) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

