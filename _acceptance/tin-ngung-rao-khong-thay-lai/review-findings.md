## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ca TNR-AC-8 «chưa áp» buộc DB không có 085, nên executor tnr_db sẽ đỏ mãi sau khi áp 085 lên máy thu**
  Người dùng thấy gì: Sau khi áp thay đổi này lên máy thu, một ca kiểm tra sẽ báo đỏ dù tính năng vẫn đúng, nên các lần kiểm lại sau đó có thể bị báo lỗi nhầm.
  Căn cứ: Chỉ làm bộ kiểm tra báo nhầm, không ảnh hưởng dữ liệu hay người dùng, và người vận hành biết lý do nên không gây hại thật.
  file: `pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Ca TNR-AC-8 so với `origin/main`, nên sau khi gộp thì ca này chỉ còn so lệnh với chính nó**
  Người dùng thấy gì: Sau khi gộp, phép so sánh này không còn phát hiện được việc dòng thống kê cũ bị đổi nhầm, và môi trường thiếu bản nhánh chính sẽ báo lỗi.
  Căn cứ: Chỉ làm yếu một lưới bảo vệ về dòng in ra của lệnh, người dùng cuối không thấy gì và có thể sửa sau với chi phí thấp.
  file: `pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Chú thích của executor tnr_pl19 bị lặp, còn sót đoạn mô tả cũ**
  Người dùng thấy gì: Một dòng chú thích trong cấu hình kiểm tra có đoạn mô tả cũ gây khó hiểu cho người đọc; người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ là lỗi trình bày nội bộ, không ảnh hưởng dữ liệu hay hành vi nên không đáng mở việc riêng.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Tin đang ngừng rao mà bị nghỉ (rút bản ghi) thì bật về «Đang chào» và sinh dòng lịch sử «Chào lại» sai**
  Người dùng thấy gì: Một tin đã được đánh dấu ngừng rao rồi bị rút khỏi hệ thống có thể hiện lại là đang chào, kèm dòng lịch sử «chào lại» sai.
  Căn cứ: Gây lịch sử và trạng thái sai cho một số tin nhưng không mất dữ liệu; trường hợp hiếm và hiện chưa tin nào ngừng rao ở N=21, nên xử lý ở việc riêng.
  file: `db/migrations/085_ngung_rao_khong_thay_lai.sql`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 3 (quan hệ suy biến): TNR-AC-6 so trạng thái «như 059» với mốc sinh ra từ chính bang_chung_chao của 085**
  Người dùng thấy gì: Phép kiểm tra rằng tin đã nghỉ giữ nguyên trạng thái có thể không bắt được lỗi nếu phần ghi bằng chứng bị làm hỏng.
  Căn cứ: Chỉ làm yếu lưới kiểm tra, người dùng chưa gặp lỗi thật; có thể củng cố sau mà không ảnh hưởng dữ liệu.
  file: `pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình, chiều đỏ không chạm phép đo): TNR-AC-10 bằng nhau 0=0 vẫn xanh, chiều đỏ chỉ thử hàm so**
  Người dùng thấy gì: Trên một cơ sở dữ liệu không có tin nào đủ điều kiện, phép kiểm số liệu vẫn báo đạt dù chưa đo được gì thật.
  Căn cứ: Chỉ làm giảm sức thuyết phục của phép kiểm, không sai dữ liệu; đo trên dữ liệu máy thu thật sẽ có số khác 0.
  file: `pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình, không ghim chiều đỏ): ô F của TNR-AC-1 và ô Z của TNR-AC-2**
  Người dùng thấy gì: Hai tình huống kiểm tra (tin không có dòng quét, tin nhóm không nối được) chưa chắc bắt được lỗi nếu có người sửa sai luật.
  Căn cứ: Chỉ là lưới kiểm tra hơi lỏng cho hai ca hiếm, không ảnh hưởng người dùng hay dữ liệu hiện tại.
  file: `pipeline/scripts/trang-thai-chao-ngung-rao.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

