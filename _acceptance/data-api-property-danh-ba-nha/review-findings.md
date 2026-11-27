## Trong hợp đồng

- **Hình dạng 5: tuyên quét cả lớp thứ tự tên toà S09 → S08 → S16 → S03 nhưng chỉ có một điểm-case (S09 thắng)**
  file: `data-api/test/properties.test.ts:163`
  severity: medium
  AC: AC-1
  source: measurement
  detail: Ca PB6-AC-1 assert `d.buildingName === "Tháp A"` với thông điệp «tên toà không theo thứ tự S09 → S08 → S16 → S03», evals E1 cũng hứa đúng thứ tự đó. Nhưng fixture (dòng ~106) chỉ cấy tên của T1 từ S09, S16 và S03, không cấy dòng nào cho S08, và mọi toà khác chỉ có một nguồn. Vì vậy chỉ đo được ý «S09 đứng đầu». Route đặt `THU_TU_TEN = ["S09","S08","S16","S03"]` (properties.ts:25). Nếu đổi thành S09, S16, S08, S03, hay đẩy S03 lên trên S16, test vẫn xanh, vì thiếu ca có S08 mà không có S09 và thiếu ca có S16 cùng S03 mà không có S09. Lời hứa nói về thứ tự bốn phần tử, nhưng ma trận chỉ có một phần tử.

- **Hình dạng 5: E6 hứa soát «bí danh ten của nguồn bị loại» nhưng không cấy chuỗi canh nào cho phần tử này**
  file: `data-api/test/properties.test.ts:40`
  severity: medium
  AC: AC-6
  source: measurement
  detail: evals.yaml E6 kể ra cả lớp chỗ không được lộ: «chuỗi canh ở bí danh ma_nguon (hai phần), bí danh ten của nguồn bị loại, field_assertions, v_unit_thuoc_tinh.nguon, tên nút nội bộ». Bộ `CANH` (dòng 40–50) có canh cho ma_nguon, căn cứ, nguồn phát biểu và slug nút. Riêng bí danh `ten` của nguồn thua (T1: S16 "A", S03 "toà A") lại là chuỗi thường, không nằm trong `CANH_MOI`. Ca PB6-AC-6 chỉ soát `CANH_MOI` và `KHOA_CAM`, nên route có trả kèm tên toà của S16 hay S03 (chẳng hạn thêm mảng alternateNames dưới một khoá chưa bị cấm) thì vẫn xanh. Lớp được tuyên là 5 chỗ, nhưng chỉ 4 chỗ có phần tử đo.

- **Hình dạng 3: miễn trừ unitNumber xét theo cả thân chứ không theo từng lần xuất hiện, nên lộ chuỗi canh trong thân lookup bị che**
  file: `data-api/test/properties.test.ts:315`
  severity: medium
  AC: AC-6
  source: measurement
  detail: Ca PB6-AC-6 dùng điều kiện `if (t.includes(c) && !t.includes(`"unitNumber":"${c}"`)) loi.push(...)`. Lời hứa là một quan hệ: chuỗi canh chỉ được có mặt ở đúng chỗ unitNumber nhắc lại đầu vào. Assert lại chỉ kiểm hai chuỗi có mặt trong cùng một thân. Thân lookup `theoKhoa` (AC-3, gọi với `CANH.maC1` nguyên văn) đã chứa `"unitNumber":"PB6MA…-0912"`, nên nếu route lộ thêm `maC1` ở một khoá khác trong thân đó (trường mới, mảng mã, mô tả) thì không bị bắt. Muốn đo đúng lời hứa thì phải bỏ đúng một lần xuất hiện cho phép rồi soát phần còn lại, hoặc so số lần xuất hiện.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **data-api/CLAUDE.md cấm đọc offer_building lúc request, nhưng route vẫn đọc nó ngay trong request khi bộ nhớ đệm hết hạn**
  Người dùng thấy gì: Một câu luật trong tài liệu nội bộ nói hơi tuyệt đối so với cách hệ thống thật sự chạy. Khách dùng API không thấy khác biệt nào, chỉ có thể gây hiểu nhầm cho người sửa sau.
  Căn cứ: Chỉ là lệch câu chữ trong tài liệu, không ảnh hưởng dữ liệu hay khách, và sửa lại sau rất rẻ.
  file: `data-api/CLAUDE.md`
  severity: low
  Đề xuất: known-limits

- **error-handler gắn mã BAD_REQUEST cho mọi lỗi 4xx khác 404, kể cả 401/403**
  Người dùng thấy gì: Nếu sau này có lỗi chưa đăng nhập hoặc bị cấm quyền, khách sẽ nhận nhãn lỗi là yêu cầu sai thay vì nhãn đúng nghĩa. Hôm nay chưa có đường nào gây ra điều này.
  Căn cứ: Hiện chưa ai gặp, mã trạng thái HTTP vẫn đúng, và sửa sau rẻ trước khi có khách thật.
  file: `data-api/src/middleware/error-handler.ts`
  severity: low
  Đề xuất: known-limits

- **Route Property phụ thuộc source_registry (tầng A, không bao giờ lên cloud): khi bảng vắng thì 500, khi bảng rỗng thì rào mã nguồn tắt và /lookup trả rỗng mà không báo**
  Người dùng thấy gì: Khi danh bạ được đưa lên cloud, tra cứu có thể báo lỗi chung hoặc trả rỗng cho căn có thật, và việc chặn khách nhập mã của nguồn dữ liệu sẽ im lặng ngừng hoạt động. Hiện chỉ chạy ở máy thu nên chưa ai gặp.
  Căn cứ: Hậu quả nặng hơn lỗi hiển thị vì khách thấy không có căn và rào chặn lộ mã nguồn tắt không báo, nhưng chỉ xảy ra sau khi đồng bộ lên cloud nên nên xử lý cùng hàng đó.
  file: `data-api/src/routes/properties.ts`
  severity: medium
  Đề xuất: new-contract

- **Danh sách mã nguồn giữ trong bộ nhớ suốt đời tiến trình, kể cả khi rỗng; không làm tươi như các bộ đệm khác**
  Người dùng thấy gì: Khi thêm một nguồn dữ liệu mới, API phải khởi động lại mới nhận ra nó. Trước đó tra cứu căn chỉ có ở nguồn mới có thể trả rỗng.
  Căn cứ: Khởi động lại là hết, nguồn mới thêm hiếm và không mất dữ liệu.
  file: `data-api/src/routes/properties.ts`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
