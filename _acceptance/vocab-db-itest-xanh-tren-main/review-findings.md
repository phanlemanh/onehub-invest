# Review findings: vocab-db-itest-xanh-tren-main (round 2)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Rang doi-chung chỉ chụp ràng buộc đuôi _chk, bỏ sót _check mà bản sửa vừa thêm vào phạm vi ghi**
  Người dùng thấy gì: Phép đo xác nhận cơ sở dữ liệu thật không đổi sau khi chạy test chưa soi một ràng buộc mà bản sửa mới đụng tới. Nếu có lần ghi rò, nó có thể không bị phát hiện.
  Căn cứ: Test chạy trong giao dịch hoàn tác nên rủi ro thấp, chỉ là phép đo kém chặt; chỉ ảnh hưởng bằng chứng nghiệm thu, không ảnh hưởng người dùng, sửa sau rẻ.
  file: `_acceptance/vocab-db-itest-xanh-tren-main/rang/doi-chung.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lưới chặn của bộ rút chỉ đếm câu INSERT ref_*, câu CHECK sổ thụt lề hoặc nằm trong DO $$ bị bỏ qua mà không báo**
  Người dùng thấy gì: Về sau nếu có thay đổi ràng buộc nằm trong khối lệnh lồng, bộ test có thể so sổ từ vựng với ràng buộc cũ mà không báo rõ vì sao. Hôm nay test vẫn xanh.
  Căn cứ: Chỉ là rủi ro tương lai trong công cụ kiểm thử nội bộ, người dùng không thấy, và khi xảy ra thì test đỏ để người làm phát hiện rồi sửa.
  file: `pipeline/scripts/vocab-db.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Rào «DB thật không đổi» của doi-chung.mjs chỉ chụp ràng buộc đuôi _chk, bỏ sót đúng ràng buộc _check mà lần sửa này bắt đầu đụng tới**
  Người dùng thấy gì: Bước xác nhận cơ sở dữ liệu thật không bị thay đổi không phủ hết các ràng buộc mà test động tới. Một lần ghi rò sẽ khó bị phát hiện.
  Căn cứ: Test chạy trong giao dịch hoàn tác nên hậu quả thật gần như không có, chỉ là bằng chứng nghiệm thu chưa chặt; không mất dữ liệu, sửa sau rẻ.
  file: `_acceptance/vocab-db-itest-xanh-tren-main/rang/doi-chung.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên quét LỚP «mọi ràng buộc» nhưng ảnh chụp DB chỉ lấy đuôi _chk, bỏ sót đúng lớp _check mà vòng này thêm vào**
  Người dùng thấy gì: Bằng chứng rằng cơ sở dữ liệu thật không đổi chỉ phủ một nhóm ràng buộc, chưa phủ nhóm mà bản sửa mới thêm vào. Nó nói rộng hơn phần thực sự đã đo.
  Căn cứ: Chỉ làm bằng chứng nghiệm thu hẹp hơn lời mô tả, không gây mất dữ liệu hay ảnh hưởng người dùng, ghi chú giới hạn là đủ.
  file: `_acceptance/vocab-db-itest-xanh-tren-main/rang/doi-chung.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — bộ rút tuyên «migration mới tự vào» cho lớp INSERT ref_* + CHECK, nhưng phép kiểm đủ chỉ đếm INSERT**
  Người dùng thấy gì: Lời hứa rằng migration mới tự được test nhận chỉ đúng với phần dữ liệu tham chiếu, chưa đúng với các ràng buộc lồng trong khối lệnh. Một ràng buộc như vậy có thể lọt mà không cảnh báo.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của công cụ kiểm thử nội bộ về sau, người dùng không thấy, test hiện tại xanh và lỗi sẽ lộ khi test đỏ.
  file: `pipeline/scripts/vocab-db.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Rào chống bỏ sót của bộ rút chỉ đếm câu INSERT ref_*; câu dựng lại CHECK *_chk nằm trong DO $$ hoặc thụt lề bị bỏ qua mà không báo (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu sau này có bản cập nhật sổ từ vựng viết theo một kiểu nhất định, bộ kiểm tra có thể bỏ sót một phần mà không báo rõ. Khi đó test vẫn đỏ nhưng thông báo không nói đúng nguyên nhân, nên người sửa mất thêm công tìm.
  Căn cứ: Hậu quả nhẹ: hiện chưa xảy ra, nếu xảy ra thì test vẫn đỏ chứ không lọt lỗi âm thầm, người dùng cuối không bị ảnh hưởng, chỉ tốn thêm thời gian dò nguyên nhân.
  file: `pipeline/scripts/vocab-db.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: lời hứa «không nới assertion» là quan hệ nội dung, nhưng phép đo chỉ đếm số lời gọi assert (r1)**
  Người dùng thấy gì: Phép kiểm chứng rằng bản test sửa không bị nới lỏng chỉ đếm số lần kiểm tra chứ không so nội dung. Một lần nới lỏng âm thầm trong tương lai có thể lọt qua mà vẫn báo xanh.
  Căn cứ: Hậu quả nhẹ và chỉ ảnh hưởng nội bộ: hợp đồng chỉ hứa đếm số lần kiểm tra, người ký xem được nội dung thay đổi khi duyệt, và siết chặt hơn có thể làm thành việc riêng sau.
  file: `_acceptance/vocab-db-itest-xanh-tren-main/rang/doi-chung.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/5 lỗi rơi vào file không bộ đo nào phủ (_acceptance/vocab-db-itest-xanh-tren-main/rang/doi-chung.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
