# Review findings: cham-bong-bo-sung-tin (round 2)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **--tran / --gioi-han ở ranh giới CLI không được kiểm: giá trị không phải số thành NaN và trần tiền tắt mà không báo**
  Người dùng thấy gì: Nếu gõ sai số tiền trần (ví dụ dấu phẩy), lượt chấm chạy mà không có trần chi phí và không báo gì, có thể tốn nhiều tiền hơn dự định. Gõ sai giới hạn thẻ thì lượt chạy rỗng nhưng vẫn báo thành công.
  Căn cứ: Chỉ xảy ra khi người chạy gõ sai tham số, lượt là lệnh chạy tay có người xem kết quả, không mất dữ liệu; sửa sau rẻ nhưng hậu quả tối đa là tốn tiền gọi model.
  file: `agent/scripts/cham-bong-bo-sung-tin.ts`
  severity: medium
  Đề xuất: known-limits

- **Ghi sổ gọi không fail-soft như mẫu có sẵn: ghi ai_calls lỗi thì mất lần đọc đã trả tiền và lượt dừng giữa chừng**
  Người dùng thấy gì: Nếu cơ sở dữ liệu chậm hoặc lỗi lúc ghi sổ, lần đọc đã trả tiền bị mất và lượt dừng giữa chừng; chạy lại sẽ phải trả tiền đọc lại.
  Căn cứ: Hậu quả nhẹ: không hỏng dữ liệu tin, chạy lại được, chỉ tốn thêm một ít tiền và thời gian khi cơ sở dữ liệu trục trặc.
  file: `agent/src/enrich/cham-bong/doc.ts`
  severity: medium
  Đề xuất: known-limits

- **--tran không hợp lệ làm mất trần tiền mà không báo; --gioi-han không hợp lệ làm lượt rỗng nhưng vẫn thoát 0**
  Người dùng thấy gì: Gõ sai số tiền trần thì lượt chấm chạy không có trần chi phí mà không cảnh báo; gõ sai giới hạn thì lượt rỗng nhưng vẫn báo xong bình thường.
  Căn cứ: Chỉ do người chạy gõ sai, thấy được ngay qua tổng kết, không mất dữ liệu; rủi ro duy nhất là tốn tiền gọi model nhiều hơn dự định.
  file: `agent/scripts/cham-bong-bo-sung-tin.ts`
  severity: medium
  Đề xuất: known-limits

- **Thiếu token trả về thì lời gọi được tính 0 USD, chi phí bị ghi thiếu và trần có thể không bao giờ chặn**
  Người dùng thấy gì: Khi nhà cung cấp model không trả số token, lời gọi đó bị tính là miễn phí, nên báo cáo chi phí thấp hơn thật và trần có thể không chặn kịp.
  Căn cứ: Hiếm khi xảy ra và chỉ làm số chi phí báo cáo lệch, không ảnh hưởng dữ liệu tin; hoá đơn của nhà cung cấp vẫn là số thật.
  file: `agent/src/enrich/cham-bong/doc.ts`
  severity: low
  Đề xuất: known-limits

- **Chế độ áp: ghi sổ ai_calls lỗi sau một lời gọi model đã trả tiền thì mất luôn kết quả và chi phí**
  Người dùng thấy gì: Khi ghi sổ gọi bị lỗi sau một lần đọc đã trả tiền, kết quả và chi phí lần đó mất, lần chạy lại phải trả tiền đọc lại.
  Căn cứ: Hậu quả nhẹ và tự phục hồi bằng cách chạy lại; chỉ tốn thêm tiền một ít, không đổi hay mất dữ liệu tin.
  file: `agent/src/enrich/cham-bong/doc.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: tuyên ma trận toàn phần 64 ô nhưng chiều o_da_co (và lech với ketCuc) là chiều ma, không đi vào hàm được đo**
  Người dùng thấy gì: Bộ kiểm thử không thật sự soi ảnh hưởng của nhãn tin đã có giá trị, nên nếu sau này có lỗi ở chỗ đó, kiểm thử vẫn báo xanh.
  Căn cứ: Không ảnh hưởng người dùng hôm nay vì kết quả hiện đúng; rủi ro là lỗi tương lai lọt qua, bổ sung kiểm thử sau vẫn rẻ.
  file: `agent/tests/cham-bong-bo-sung-tin.test.ts`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 3: AC-7 hứa ĐÚNG những lời gọi nào (quan hệ danh tính) nhưng chỉ assert số đếm**
  Người dùng thấy gì: Kiểm thử chạy lại chỉ đếm số lời gọi, không xác nhận đúng những lời gọi nào, nên một lỗi chọn nhầm cặp vẫn có thể lọt.
  Căn cứ: Hành vi hiện tại không có dấu hiệu sai; chỉ là lưới an toàn kiểm thử còn lỏng, siết lại sau không tốn nhiều.
  file: `agent/tests/cham-bong-bo-sung-tin.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: AC-2 assert âm tính đứng một mình: chuỗi canh không bao giờ được đưa vào đường đo, không có đối chứng dương**
  Người dùng thấy gì: Một số kiểm thử về việc không để lộ đề xuất cho model không thể đỏ, nên chưa chứng minh được rào này thật sự hoạt động.
  Căn cứ: Không có bằng chứng lộ thật, chỉ là bằng chứng kiểm thử yếu; ảnh hưởng đến độ tin cậy của phép chấm độc lập nên nên ghi lại để bổ sung sau.
  file: `agent/tests/cham-bong-bo-sung-tin.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: AC-9 «chạy báo cáo với model ném lỗi nếu bị gọi» chỉ là assert.doesNotThrow trên một hàm không có đường gọi model**
  Người dùng thấy gì: Kiểm thử khẳng định báo cáo không gọi model chỉ là hình thức, nhưng báo cáo thực tế đọc từ tệp nên không gọi model.
  Căn cứ: Không có hậu quả với người dùng vì báo cáo không có đường gọi model; sửa kiểm thử chỉ là chỉnh hình thức, chi phí vượt xa lợi ích.
  file: `agent/tests/cham-bong-bo-sung-tin.test.ts`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
