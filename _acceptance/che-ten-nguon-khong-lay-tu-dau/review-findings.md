# Review findings: che-ten-nguon-khong-lay-tu-dau (round 3)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bộ soát tầng A trước khi gửi cloud bỏ qua khoá trong jsonb (lỏng hơn bản cũ)**
  Người dùng thấy gì: Nếu tên hay định danh nguồn thật nằm ở phần tên trường trong dữ liệu lồng, nó có thể đi lên cloud mà bộ chặn không dừng lại, trong khi trước đây bị chặn.
  Căn cứ: Đây là lỗ hổng làm lộ thông tin nguồn thật (tầng A) ra ngoài máy, người dùng không tự gỡ được sau khi đã lên cloud; sửa lúc này còn rẻ, nên mở việc riêng và hỏi Mạnh vì đụng luật an toàn.
  file: `pipeline/sync-cloud.mjs`
  severity: medium
  Đề xuất: new-contract

- **Bước lùi khoi-phuc-s16.sh dễ gãy: chỉ đọc một dòng grep và viết cứng danh sách cột**
  Người dùng thấy gì: Khi cần lùi, nếu ghi chú của dòng nguồn có xuống dòng thì bước lùi sẽ dừng báo lỗi chứ không khôi phục được; cột thêm sau này cũng không được khôi phục.
  Căn cứ: Hậu quả nhẹ vì bước lùi dừng an toàn, không ghi sai dữ liệu, và chỉ xảy ra khi phải lùi; ghi giới hạn vào hồ sơ là đủ.
  file: `_acceptance/che-ten-nguon-khong-lay-tu-dau/ap-may-thu/khoi-phuc-s16.sh`
  severity: low
  Đề xuất: known-limits

- **tra-s16.mjs viết cứng đường dẫn tuyệt đối vào thư mục nhà của người dùng và không kiểm dòng S16 trong tệp**
  Người dùng thấy gì: Lệnh trả dòng S16 chỉ chạy đúng trên máy có đường dẫn mặc định này, và nếu tệp cấp thiếu dòng hay thiếu định danh thì có thể báo đã trả nhưng ghi thiếu dữ liệu.
  Căn cứ: Chỉ một người chạy lệnh này một lần trên máy thu và có bước kiểm sau bắt được sai lệch; rủi ro thấp, ghi chú để người áp biết là đủ.
  file: `_acceptance/che-ten-nguon-khong-lay-tu-dau/ap-may-thu/tra-s16.mjs`
  severity: low
  Đề xuất: known-limits

- **Phép đo AC-2 so với origin/main sẽ mất ý nghĩa sau khi gộp**
  Người dùng thấy gì: Sau khi gộp, phép kiểm rằng các ca thông thường vẫn che y như cũ sẽ không còn so với bản gốc nên không còn bắt được hỏng hóc về sau.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chỉ làm yếu lưới an toàn cho thay đổi sau này; có thể ghi lại và sửa khi chạm vào phần này.
  file: `pipeline/scripts/ops-nhan-ma-nguon.test.mjs`
  severity: low
  Đề xuất: known-limits

- **assertNoSourceNames không còn soát khoá JSON lồng trong cột jsonb, chặn tầng A hẹp hơn trước**
  Người dùng thấy gì: Bộ chặn trước khi gửi lên cloud không còn nhìn vào tên các trường trong dữ liệu lồng, nên tên nguồn thật đặt ở đó có thể lọt lên cloud.
  Căn cứ: Có nguy cơ lộ tên nguồn thật ra ngoài máy mà người dùng không thu hồi được; đây là chỗ nới ngoài phạm vi Mạnh duyệt nên cần quyết riêng.
  file: `pipeline/sync-cloud.mjs`
  severity: medium
  Đề xuất: new-contract

- **Đối chứng âm tính đứng một mình, fixture lọc tay (hình dạng 4 + 2): cột «tên miền» của ma trận AC-4 vẫn xanh khi hàm nạp đánh rơi token định danh, còn chiều đỏ ghim trên một đầu vào mà ô xanh không dùng**
  Người dùng thấy gì: Bộ kiểm có thể vẫn báo xanh nếu về sau phần nạp định danh nguồn bị bỏ sót, nên có thể không phát hiện được việc che thiếu tên miền.
  Căn cứ: Hiện chức năng vẫn che đúng, chỉ là lưới kiểm yếu hơn mong muốn; ghi giới hạn rồi tăng cường test ở lượt sau.
  file: `pipeline/scripts/source-name-entries.itest.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
