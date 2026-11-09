# Review findings: tin-ngung-rao-khong-thay-lai

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Danh sách nguồn của luật ngừng rao bị khai lần thứ hai trong JS, ngoài chỗ «duy nhất» ngung_rao_sau_ngay**
  Người dùng thấy gì: Nếu sau này thêm một nguồn mới vào luật ngừng rao, dòng báo số liệu của job đồng bộ sẽ lặng lẽ bỏ sót nguồn đó. Tin vẫn được xử lý đúng, chỉ phần báo cáo thiếu.
  Căn cứ: Hậu quả nhẹ: chỉ ảnh hưởng dòng báo cáo, không mất hay sai dữ liệu tin, và hiện chưa có nguồn nào được thêm nên chưa xảy ra.
  file: `pipeline/trang-thai-chao.mjs`
  severity: low
  Đề xuất: known-limits

- **CONTEXT.md gán thêm nghĩa «nghỉ bản ghi» cho «rút», chồng lên nghĩa «rút phát biểu» đã có và đang dùng trong chính diff này**
  Người dùng thấy gì: Chữ «rút» trong từ vựng chuẩn mang hai nghĩa khác nhau, nên người đọc số «rút» trong dòng báo của job hoặc agent đọc theo có thể hiểu nhầm.
  Căn cứ: Chỉ gây nhầm lẫn về chữ nghĩa, không đụng dữ liệu hay giao diện người dùng, và sửa lại từ vựng sau này rẻ.
  file: `CONTEXT.md`
  severity: low
  Đề xuất: known-limits

- **Lệnh tnr_pl19 trong config.yaml có hai chú thích cuối dòng, chú thích cũ không được xoá**
  Người dùng thấy gì: Tệp cấu hình nghiệm thu còn một dòng chú thích cũ mô tả sai thước đo. Người dùng cuối không thấy gì.
  Căn cứ: Chỉ là một dòng chú thích thừa, không ảnh hưởng chạy hay dữ liệu, không đáng mở việc riêng.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **S06: captured_at NULL lặng lẽ lấy ngày đăng làm «lần thấy cuối» qua greatest()**
  Người dùng thấy gì: Một số tin cũ của nguồn S06 thiếu thời điểm quét có thể bị chuyển sang ngừng rao theo ngày đăng chứ không theo lần quét. Tin chỉ ẩn khỏi danh sách đang rao và sẽ hiện lại khi được thấy lại.
  Căn cứ: Ảnh hưởng nhỏ và chưa đo được số tin dính; tin không bị xoá và tự trở lại khi thấy lại nên có thể hoàn tác.
  file: `db/migrations/085_ngung_rao_khong_thay_lai.sql`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): bằng chứng «PL19_NAP_THEM» của E9b là dòng thước tự in và dòng nhắc lại biến môi trường**
  Người dùng thấy gì: Bằng chứng cho thấy bộ kiểm cũ vẫn xanh khi thêm luật mới chưa chứng minh được luật đó thật sự được nạp ở một trong hai bộ kiểm. Kết luận có thể đúng nhưng chưa được kiểm chứng chặt.
  Căn cứ: Không ảnh hưởng người dùng; chỉ làm bằng chứng kiểm thử yếu hơn, và củng cố lại sau mà không mất dữ liệu.
  file: `pipeline/scripts/pl19-khong-do-them.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): TNR-AC-10 so bằng nhau mà không có đối chứng dương, chiều đỏ chỉ chọc vào bộ so**
  Người dùng thấy gì: Phép đối chiếu số tin ngừng rao với số đếm độc lập có thể vẫn xanh khi cả hai cùng ra 0, nên chưa chắc bắt được lệnh in sai.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp; chỉ làm kiểm thử kém nhạy, bổ sung thêm ca sau là rẻ.
  file: `pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): nhánh S05 chỉ có assert «0 phát biểu», không ca nào đòi tin S05 ngừng rao**
  Người dùng thấy gì: Chưa có bài kiểm nào chứng minh tin của nguồn S05 thật sự chuyển sang ngừng rao khi quá hạn. Nếu phần đó hỏng, tin S05 cũ sẽ vẫn hiện là đang rao mà kiểm thử không báo.
  Căn cứ: Hiện số tin S05 bị ảnh hưởng là 0 nên chưa gây hại thật; sai thì tin cũ hiện thừa nhưng không mất dữ liệu.
  file: `pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): AC-6 hứa «tin đã nghỉ, mọi lý do» và «nguồn không có N» mà ma trận không rút từ tập giá trị**
  Người dùng thấy gì: Bài kiểm chưa phủ hết các lý do tin nghỉ và các nguồn không có hạn, nên một lỗi ở ca chưa phủ có thể lọt. Hiện chưa thấy hành vi sai nào.
  Căn cứ: Rủi ro thấp vì chưa có lỗi thật, tin nghỉ không bị xoá; thêm ca kiểm sau là rẻ.
  file: `pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

