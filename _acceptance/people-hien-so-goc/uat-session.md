---
schema_version: 1
slug: people-hien-so-goc
feature: Người vận hành mở danh bạ người trên Ops ở máy thu, thấy số gốc của từng người, gọi được bằng một chạm và tìm được người theo SĐT; vai Người xem không thấy số
owner: phanlemanh@gmail.com
stage: held
verdict: iterate
decided_by: Mạnh
decided_at: 2026-11-02T21:53:45Z
---

# Phiên nghiệm thu: people-hien-so-goc

Cờ vàng: chưa lái-thử. Hồ sơ không có `stranger-drive.md`, nên điều kiện «sản phẩm thật đã chạy» không đọc từ nhật ký vấp. Thay vào đó, máy đã chạy phép đo đăng nhập thật ba vai trên máy chủ `:3456` của checkout chính ngày 2026-11-03; phép đo thoát 0.

## Ngưỡng đã khai tại Cổng Đáng (CHÉP NGUYÊN VĂN — cấm sửa sau khi thấy số)

- Câu hỏi phép đo trả lời: Vai Vận hành ở máy thu có thấy, gọi và tìm được số gốc của mọi người có bí danh SĐT, trong khi vai Người xem không nhận được số nào?
- Kết quả nào là SỐNG: Từ «Bật khi» của audit dòng 267, số 165 đổi thành số đo hôm nay: 314/314 người có bí danh `sdt` hiện số với vai `ops` và `admin`; vai `ops` thấy liên hệ trên `/ops/deals`; HTML và JSON của vai `viewer` trên ba bề mặt ấy không chứa chuỗi SĐT nào; tìm một SĐT, gõ `09…` hay `+84…`, ra đúng người.
- Kết quả nào là CHẾT: Trên ba bề mặt của hàng (danh bạ, một người, `/ops/deals`), vai `viewer` nhận được dù một chuỗi SĐT; hoặc tìm theo SĐT ra người sai hay không ra người có số đó.
- Timebox: Theo dự báo hàng SD4, không quá 2,3 giờ máy.

## Người dự

| Tên | Vai | Đại diện cho ai |
|---|---|---|
| Mạnh | Chủ sản phẩm, người ký | Người vận hành dùng danh bạ ở máy thu |

## Chấm kín (thu TRƯỚC mọi thảo luận chung)

| Người | Điểm/nhận xét kín | Sẽ gửi cho khách nào, khi nào |
|---|---|---|
| Mạnh | Điểm 3. «Không sử dụng được, Không biết chính xác ở đâu căn nào, ảnh gì,..., đứng vai trò là người vận hành thì chỉ nhìn thấy được lỗi của hệ thống khi không thu thập được dữ liệu.» «Nếu muốn biết được hiệu quả thực sự cần nhìn như những căn giá tốt, giá tốt thì phải chứng minh nó tốt như thế nào? những metrics chỉ dẫn, so sánh với ngưỡng,....» «Cần nhìn theo mua bán, cho thuê,... khu vực, building, đường (nhà liền thổ), building, các loại filter...Không nhìn theo được điều này thì ko thể sử dụng,...» «Nhìn theo các loại bảng xếp hạng,...» | «Sẽ cho đội vận hành biên tập, sắp xếp để hiển thị và highligh trên cổng người dùng nhà đầu tư,..» «Gắn nhãn giá tốt, tại sao tốt để chỉ dẫn AI,...» (không nêu mốc thời gian) |

## Thảo luận sau khi đã chấm

Không có thảo luận chung: phiên chỉ có một người dự. Sau khi thấy số đo, Mạnh bổ sung: «Có thể liên hệ với người bán trước để làm việc đảm bảo verified cho nhà đầu tư cuối trên cổng invest».

## Số đo thật đặt cạnh ngưỡng

Đo ngày 2026-11-03 trên máy chủ `:3456` và DB máy thu, chỉ đọc: `_acceptance/people-hien-so-goc/probes/html-vai.mjs` thoát 0, `app/tests/danh-ba-nguoi-doi-chieu.test.tsx` 2/2 đạt.

| Thước | Ngưỡng đã khai | Số đo được | SỐNG/CHẾT |
|---|---|---|---|
| Người có bí danh `sdt` hiện số với vai `ops` và `admin` | 314/314 | 333/333 (số người có số đã tăng từ 314; `hàng-hiện-số=333`, đo ở loader) | SỐNG |
| Vai `ops` thấy liên hệ trên `/ops/deals` | Thấy | 16 chuỗi SĐT trong HTML, 8 trong RSC; đăng nhập thật | SỐNG |
| HTML và JSON của vai `viewer` trên ba bề mặt | 0 chuỗi SĐT | 0 trên cả 10 trang mẫu, HTML và RSC; loader `vai-người-xem=0`. Trang mẫu, không phải mọi trang danh bạ (Known limit Ngoài-8) | SỐNG |
| Tìm một SĐT, gõ `09…` hay `+84…`, ra đúng người | Đúng người | 333 số khác nhau tìm đúng người ở loader; sáu dạng gõ của một số thật đều có kết quả trên bản chạy | SỐNG |
| Dùng được trong việc vận hành | Không khai ở Cổng Đáng | Không có thước; chấm kín của Mạnh: điểm 3, «Không sử dụng được» | CHƯA ĐO |

## Quyết định Cổng Giá trị

- **verdict = iterate** Căn cứ: Mạnh chọn «Làm thêm». Mọi ngưỡng đã khai đều SỐNG, không ngưỡng CHẾT nào bị chạm, nhưng chấm kín điểm 3, «Không sử dụng được»; ngưỡng chỉ đo quyền thấy và tìm số, không đo việc dùng được trong vận hành.
- Bước kế: Phần đã giao giữ nguyên trên `main`. Mở vòng kế bằng `/feature-loop:feature-loop <mô tả>`, hồ sơ mới, cho Căn giá tốt dùng được: chứng minh vì sao giá tốt bằng chỉ số và ngưỡng; lọc theo mua bán, cho thuê, khu vực, building, đường; bảng xếp hạng; đội vận hành biên tập, xác minh với người bán rồi hiển thị trên cổng Invest. Bản phạm vi phải chốt quan hệ giữa xác minh và việc SĐT người bán đã được duyệt lên Invest.
