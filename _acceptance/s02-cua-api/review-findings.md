# Review findings — s02-cua-api (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Rào DB của thước AC-5 chỉ chặn tên 'oneinvest', không theo mẫu danh sách cho phép oneinvest_* của kho**
  Người dùng thấy gì: Phép thử của một tính năng khác có thể ghi nhầm vào cơ sở dữ liệu dùng chung hoặc cơ sở dữ liệu trên cloud nếu địa chỉ kết nối có thêm tham số. Phép thử có hoàn tác sau khi ghi, nhưng việc ghi lên cloud vẫn cần lời riêng của Mạnh.
  Căn cứ: Nặng vừa: phép thử chỉ chạm DB thật khi ai đó trỏ sai địa chỉ, nhưng nếu chạm cloud thì không còn là việc người dùng tự gỡ được. Sửa rẻ, nên đáng làm trong hồ sơ riêng của tính năng đó.
  file: `_acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/nap-db.test.mjs`
  severity: medium
  Đề xuất: new-contract

- **collector/CLAUDE.md nói 403 luôn là BỊ CHẶN, nhưng ở cửa xác thực mã lại coi 403 JSON là AUTH FAIL**
  Người dùng thấy gì: Tài liệu hướng dẫn nói sai một chút về lỗi 403 ở bước đăng nhập. Người vận hành có thể được bảo đăng nhập lại trong khi đáng lẽ phải dừng nguồn thu.
  Căn cứ: Nhẹ: chỉ là chữ trong tài liệu, hành vi thu thật vẫn đúng và dừng an toàn. Người vận hành thử đăng nhập lại là tự gỡ được, và sửa sau rất rẻ.
  file: `collector/CLAUDE.md`
  severity: low
  Đề xuất: known-limits

- **Một lượt mất DB giữa chừng vẫn gọi nguồn nhưng nhật ký ghi 0 lời gọi, nên số «lời gọi/phút» của báo cáo bị đếm thiếu**
  Người dùng thấy gì: Khi mất kết nối DB giữa lượt thu S06, báo cáo đếm thiếu số lời gọi thật đã gửi tới nguồn, nên tốc độ gọi trông thấp hơn thực tế.
  Căn cứ: Nhẹ: chỉ lệch số đo trong báo cáo ở tình huống hiếm, không mất hay sai dữ liệu thu, và số đúng vẫn còn trong tệp trạng thái.
  file: `pipeline/collect-s06-duoi.mjs`
  severity: low
  Đề xuất: known-limits

- **phienCuoi nuốt lỗi đọc nhật ký: một dòng JSON hỏng làm số lượt quay về 0**
  Người dùng thấy gì: Nếu nhật ký lượt thu S06 có một dòng ghi dở, số thứ tự lượt bị đặt lại từ 1 và trùng với lượt cũ mà không có cảnh báo.
  Căn cứ: Nhẹ: chỉ làm số thứ tự lượt trong nhật ký bị trùng ở tình huống hiếm, dữ liệu thu không bị ảnh hưởng và sửa sau rất rẻ.
  file: `pipeline/collect-s06-duoi.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): mọi tệp LevelDB của AC-2 do bộ ghép trong test tự dựng, không round-trip từ một bộ ghi thật**
  Người dùng thấy gì: Bộ kiểm thử tự dựng dữ liệu phiên theo cách hiểu của chính nó, nên nếu hiểu sai định dạng thật của trình duyệt thì vẫn báo xanh. Rủi ro là lượt thu đêm không đọc được phiên và dừng.
  Căn cứ: Nhẹ: giới hạn đã khai rõ và đã có ba lượt chạy thật xác nhận; nếu sai thì lượt thu dừng với một dòng báo lỗi, không mất hay lộ dữ liệu, và Mạnh đăng nhập lại là xong.
  file: `collector/src/test/s02-doc-phien.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): ca nhịp AC-8 chỉ đọc hằng khai báo requestsPerSecond, không đo khoảng cách thật giữa hai lời**
  Người dùng thấy gì: Phép thử chỉ kiểm cấu hình nhịp thu chứ không đo khoảng cách thật giữa hai lời gọi, nên nếu bộ điều nhịp lỗi thì vẫn không bị phát hiện.
  Căn cứ: Nhẹ: bộ điều nhịp là mã có sẵn dùng chung và đếm lời gọi đã được kiểm; nếu lệch thì nguồn trả 429 và lượt thu dừng, không gây hại lâu dài.
  file: `collector/src/test/s02-bo-thu-cua-api.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (đột biến bị bắt mà không ghim ca hay thông điệp): chay-test-dot-bien.mjs coi một đột biến là bị bắt khi có ít nhất một ca bất kỳ đỏ**
  Người dùng thấy gì: Phép thử cấy lỗi chỉ cần có một ca bất kỳ đỏ là coi như bắt được, nên có thể xanh vì lý do khác với lỗi định bắt.
  Căn cứ: Nhẹ: chỉ làm bằng chứng nghiệm thu yếu hơn mức lý tưởng, không ảnh hưởng người dùng; có thể siết sau mà không đụng mã chạy thật.
  file: `_acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): AC-3 của can-gia-tot-ba-vai soát mã nguồn bằng regex, không chạy script**
  Người dùng thấy gì: Phép thử của một tính năng khác chỉ kiểm chữ trong mã có mặt chứ không kiểm hành vi thật, nên bản sửa gọi đúng chữ nhưng làm sai vẫn xanh.
  Căn cứ: Nhẹ: giới hạn đã được khai trong hồ sơ của tính năng đó, không ảnh hưởng người dùng trực tiếp và có thể bổ sung phép chạy thật sau.
  file: `scripts/can-gia-tot-ba-vai-ten-nguon.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): E7/AC-7 grep chữ «AUTH FAIL [S02]» trong mã, và chiều đỏ chỉ thử phép đếm tệp**
  Người dùng thấy gì: Phép thử chỉ kiểm dòng báo lỗi đăng nhập có nằm trong mã, chưa kiểm dòng đó chắc chắn được in ra. Nếu nhánh in bị bỏ sót, thước theo dõi độ tươi có thể không thấy lỗi.
  Căn cứ: Nhẹ: hành vi in ra đã được phủ bởi các ca khác của hợp đồng, nên chỗ hở chỉ nằm ở phép soát chữ; sửa sau rẻ và không ảnh hưởng dữ liệu.
  file: `_acceptance/s02-cua-api/probes/khong-trinh-duyet.sh`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 4/9 lỗi rơi vào file không bộ đo nào phủ (_acceptance/can-gia-tot-ba-vai-ten-nguon-trong/probes/nap-db.test.mjs, pipeline/collect-s06-duoi.mjs, scripts/can-gia-tot-ba-vai-ten-nguon.test.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
