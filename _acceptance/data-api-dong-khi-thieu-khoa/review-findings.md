## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **README: ví dụ Docker không truyền DATA_API_KEYS nên container sẽ thoát ngay sau thay đổi**
  Người dùng thấy gì: Người tự dựng API bằng Docker theo đúng hướng dẫn trong README sẽ thấy dịch vụ tắt ngay lúc khởi động. Thông báo lỗi có nói thiếu khoá, nên họ tự biết cần đặt khoá.
  Căn cứ: Hậu quả nhẹ: không mất hay lộ dữ liệu, người dùng thêm khoá rồi chạy lại là xong. Sửa sau rất rẻ vì chỉ là thêm vài dòng hướng dẫn.
  file: `data-api/README.md`
  severity: medium
  Đề xuất: known-limits

- **pha.mjs bỏ lại thư mục tạm khi gọi process.exit(2) bên trong try/finally, trái với điều E7 cam kết**
  Người dùng thấy gì: Khi công cụ kiểm tra gặp lỗi hiếm, nó có thể để lại một thư mục tạm trên máy người chạy kiểm tra. Người dùng cuối của API không bị ảnh hưởng.
  Căn cứ: Chỉ tốn một ít dung lượng tạm, không ảnh hưởng dữ liệu hay người dùng, và hệ điều hành tự dọn thư mục tạm theo thời gian.
  file: `_acceptance/data-api-dong-khi-thieu-khoa/probes/pha.mjs`
  severity: low
  Đề xuất: wont-fix

- **README sửa trong diff vẫn hướng dẫn chạy Docker mà không có DATA_API_KEYS, nên container giờ thoát ngay với mã 1**
  Người dùng thấy gì: Người làm theo hướng dẫn triển khai trong README mà không đặt khoá sẽ thấy dịch vụ tắt hoặc khởi động lại liên tục. Họ sẽ phải tự tìm ra là thiếu khoá.
  Căn cứ: Không mất hay lộ dữ liệu, người dùng tự gỡ được bằng cách thêm khoá. Sửa sau rẻ, chỉ là bổ sung tài liệu.
  file: `data-api/README.md`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình, không ghim thông điệp): ô đỏ pha-ten không đi qua nhánh tệp-đổi → loi**
  Người dùng thấy gì: Công cụ soát tên nguồn thật có thể không báo đỏ nếu chính nó hỏng ngầm ở một bước phân loại. Hiện chưa có tên nguồn nào bị lọt ra.
  Căn cứ: Rủi ro là gián tiếp và chỉ xảy ra khi công cụ soát hỏng thêm lần nữa. Dữ liệu người dùng không bị ảnh hưởng, và vẫn có các lần soát khác ở cổng gộp.
  file: `_acceptance/data-api-dong-khi-thieu-khoa/probes/pham-vi.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): đối chứng của AC-6 không chứng minh đã gom được thân trả về của AC-3 và stdout/stderr của AC-5**
  Người dùng thấy gì: Bài kiểm tra việc khoá API không bị in ra log hay phản hồi có thể bỏ sót một vài kênh đầu ra nếu việc thu thập hỏng ngầm. Hiện không có bằng chứng khoá bị lộ.
  Căn cứ: Không có lộ khoá thật, chỉ là lưới an toàn của test thưa hơn mong muốn. Bổ sung kiểm tra sau này rẻ và không ảnh hưởng người dùng.
  file: `data-api/test/auth-dong.test.ts`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
