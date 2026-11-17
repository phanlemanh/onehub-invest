## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chú thích executor s16_db ghi sai tên DB thử (oneinvest_suite_s16_<pid>), itest thật dùng oneinvest_dbv_s16_<pid>**
  Người dùng thấy gì: Người dùng không thấy gì khác: chỉ là dòng ghi chú trong cấu hình chấm ghi nhầm tên cơ sở dữ liệu thử. Người bảo trì có thể hiểu nhầm lúc đọc, nhưng sản phẩm chạy đúng.
  Căn cứ: Hậu quả nhẹ: không mất hay lộ dữ liệu, không ảnh hưởng người dùng, chỉ là chữ ghi chú, và ai gặp có thể tự sửa bất cứ lúc nào khi chạm tệp này.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Bộ nạp S16 không kiểm sha256 của manifest và không kiểm schemaVersion, khác bộ nạp cùng loại (r4)**
  Người dùng thấy gì: Nếu một tệp thu S16 bị sửa hoặc có tệp lạ nằm trong thư mục thu, nó vẫn được nạp và đi tiếp vào danh bạ căn mà không ai phát hiện.
  Căn cứ: Dữ liệu sai có thể lọt vào danh bạ nhưng chỉ khi tệp trên máy thu bị đổi, rủi ro thấp; việc thuộc làn thu nên giao riêng cho họ sửa.
  file: `pipeline/import-s16.mjs`
  severity: medium
  Đề xuất: new-contract

- **Lược đồ 103 đặt tên cột, view, hàm bằng tiếng Việt, trái quy ước đặt tên đã chốt (r4)**
  Người dùng thấy gì: Tên cột trong bảng dữ liệu S16 viết bằng tiếng Việt, lệch quy ước chung; người dùng cuối không thấy gì, chỉ người viết mã thấy không nhất quán.
  Căn cứ: Không ảnh hưởng dữ liệu hay màn hình nào; đổi tên sau khi đã chốt tốn công hơn nhiều so với lợi ích.
  file: `db/migrations/103_stg_s16.sql`
  severity: low
  Đề xuất: wont-fix

- **Chú thích executor s16_db ghi sai tên DB thử (oneinvest_suite_s16_ thay vì oneinvest_dbv_s16_) (r4 · tệp đã đổi)**
  Người dùng thấy gì: Một dòng ghi chú trong cấu hình nghiệm thu nêu sai tên cơ sở dữ liệu thử, có thể làm người đọc hiểu nhầm lệnh chạy ở đâu.
  Căn cứ: Chỉ là chữ ghi chú, không làm mất hay lộ dữ liệu; sửa sau rất rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **go-khoa.sh never turns off the field_assertions delete guard, so any rollback file with field_assertions rows aborts the whole rollback (r4 · tệp đã đổi)**
  Người dùng thấy gì: Nếu phải lùi lần dựng danh bạ S16 trên máy thu mà lần dựng đã ghi một số xác nhận phường hay chủ đầu tư, lệnh lùi sẽ dừng và không gỡ được dòng nào.
  Căn cứ: Chỉ gặp khi phải lùi, không mất dữ liệu vì giao dịch tự hoàn lại, nhưng cần sửa trước khi áp thật để đường lùi dùng được.
  file: `_acceptance/nap-s16-vao-danh-ba/lui/go-khoa.sh`
  severity: medium
  Đề xuất: new-contract

- **The nightly job (buocVatTheDem → dung) runs buocS16 on its own as soon as 103 is applied and stg_s16 has data; the apply process does not account for this (r4)**
  Người dùng thấy gì: Job đêm có thể tự dựng toà và căn S16 trước khi người vận hành áp tay, làm số đếm lệch với số chạy thử và khiến việc lùi có chọn lọc để sót dòng.
  Căn cứ: Dữ liệu vẫn đúng nhưng quy trình áp và lùi bị rối nếu job đêm chen vào; cần chốt cách xử lý trước ngày áp.
  file: `pipeline/danh-ba-vat-the.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4 (âm tính một mình): phép soát token trong thẻ S16 không có đối chứng dương cho chính bộ dò (r4 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm tra mã đăng nhập không lọt vào thẻ duyệt có thể không bắt được khi lỗi xảy ra, nên xanh chưa chắc là sạch.
  Căn cứ: Không làm lộ dữ liệu ngay, chỉ giảm độ tin của phép thử; bộ soát khác vẫn chặn trước khi gửi cloud.
  file: `pipeline/scripts/danh-ba-s16.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): soát thẻ trùng tên chỉ bắt token đứng nguyên một chuỗi JSON, không có đối chứng dương (r4 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm tra thẻ toà trùng tên không lộ mã căn chỉ bắt được một dạng lộ, nên có thể bỏ sót khi mã nằm lẫn trong chữ dài hơn.
  Căn cứ: Chỉ giảm độ tin của phép thử, thẻ vẫn nằm trên máy thu; sửa sau không tốn nhiều.
  file: `pipeline/scripts/danh-ba-s16.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): bảng cấm đẩy cloud chỉ thử 2 trên 5 phần tử (r4)**
  Người dùng thấy gì: Chỉ hai trong năm bảng bị cấm đẩy lên cloud được thử, nên gõ sai tên một bảng còn lại sẽ không bị phát hiện.
  Căn cứ: Bộ chặn vẫn hoạt động với hai bảng nhạy nhất; nguy cơ lộ thấp và thêm ca thử sau rất rẻ.
  file: `pipeline/lib/s16-soat.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert «có mặt» thay cho quan hệ): stack_key của căn mới chỉ kiểm truthy (r4 · tệp đã đổi)**
  Người dùng thấy gì: Phép thử chỉ kiểm căn mới có trục, chưa kiểm trục đó đúng toà, nên một lỗi gắn sai trục có thể lọt qua phép thử.
  Căn cứ: Chưa có bằng chứng dữ liệu sai; lần đo trên dữ liệu thật vẫn kiểm, sửa phép thử sau rẻ.
  file: `pipeline/scripts/danh-ba-s16.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (đếm thay cho quan hệ): thẻ khớp hai / lệch toà không được kiểm là nêu đúng hai khoá toà (r4 · tệp đã đổi)**
  Người dùng thấy gì: Phép thử chỉ đếm số khoá trong thẻ duyệt, không kiểm đúng là hai toà liên quan, nên thẻ nêu sai toà có thể không bị bắt.
  Căn cứ: Người duyệt có thể nhìn thấy thẻ sai và bỏ qua được; không mất dữ liệu, sửa phép thử sau rẻ.
  file: `pipeline/scripts/danh-ba-s16.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (giá trị kỳ vọng chép tay, không đọc từ nguồn): NOI_DU_AN_S16 so với bản chép literal thay vì bảng §5.1 (r4 · tệp đã đổi)**
  Người dùng thấy gì: Danh sách năm dự án được nối được so với một bản chép tay chứ không đọc từ tài liệu thiết kế, nên nếu cả hai cùng sai thì không ai biết.
  Căn cứ: Bảng đã được duyệt ở cổng phạm vi và chỉ gồm năm dòng; rủi ro rất thấp, công đổi phép thử vượt lợi ích.
  file: `pipeline/scripts/danh-ba-s16.itest.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (âm tính một mình): kiểm «url không còn host» trên stg không có đối chứng dương cho regex (r4 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm đường dẫn không còn tên máy chủ có thể không bắt được nếu định dạng lưu khác dự kiến, nên xanh chưa chắc là sạch.
  Căn cứ: Chưa thấy dữ liệu sai; bộ soát đẩy cloud vẫn là lớp chặn khác, sửa phép thử sau rẻ.
  file: `pipeline/scripts/danh-ba-s16.itest.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
