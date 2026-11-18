# Review findings: phuong-tu-du-an (round 3)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **pipeline/CLAUDE.md chưa ghi script mới phuong-tu-du-an.mjs vào bảng Key Scripts**
  Người dùng thấy gì: Tài liệu hướng dẫn của pipeline chưa nhắc tới lệnh mới, nên người vận hành sau này có thể không biết lệnh này tồn tại hay cần áp migration nào trước. Hệ thống vẫn chạy đúng.
  Căn cứ: Chỉ thiếu một dòng giới thiệu, không mất hay lộ dữ liệu, bổ sung lúc nào cũng được và rất rẻ.
  file: `pipeline/CLAUDE.md`
  severity: low
  Đề xuất: known-limits

- **Áp lại 099 theo đúng hướng dẫn trong 099 sẽ âm thầm khôi phục bản resolve_offer_area_du_an lỗi khoá ngoại mà 102 đã vá**
  Người dùng thấy gì: Nếu ai đó áp lại bước cũ theo hướng dẫn trong tệp, bản sửa lỗi sau đó bị ghi đè mà không báo. Về sau khi một phường bị dọn, lượt xử lý tin kế tiếp có thể dừng giữa chừng.
  Căn cứ: Chỉ xảy ra khi có người áp lại thủ công, không mất dữ liệu và lỗi hiện ngay khi chạy nên người vận hành tự khắc phục được; ghi lưu ý là đủ cho tới khi có việc riêng.
  file: `db/migrations/099_phuong_tu_du_an.sql`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): phát biểu project_node_id đầu vào chèn tay, không sinh bằng bộ ghi DV6 đang có sẵn**
  Người dùng thấy gì: Phép kiểm dùng dữ liệu dự án dựng tay, nên nếu cách ghi dự án lên bài đổi dạng thì phép kiểm vẫn xanh trong khi thực tế có thể lệch. Người dùng cuối chưa thấy ảnh hưởng ngay.
  Căn cứ: Rủi ro chỉ là phép kiểm bỏ sót lỗi trong tương lai, không làm hỏng dữ liệu hiện tại, và phần ghi dự án đã thuộc việc khác.
  file: `pipeline/scripts/phuong-tu-du-an.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): ca writeOffers kiểm T-W2-MOT «không bị đổi», nhưng tin này không nằm trên đường được phân xử**
  Người dùng thấy gì: Một dòng kiểm trong bộ test luôn đúng dù luật giữ phường có bị gỡ, nên đọc kết quả dễ tưởng nó đang bảo vệ điều đó. Luật này vẫn được kiểm ở chỗ khác.
  Căn cứ: Đã có phép kiểm khác bảo vệ đúng điều này, nên hậu quả với người dùng gần như bằng không và sửa không đem lại thêm an toàn.
  file: `pipeline/scripts/phuong-tu-du-an.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (assertion âm tính đứng một mình): ô không nhận phường chỉ kiểm `fp.nguon != 'du-an'`, trong khi evals hứa field_provenance->'area_id' vắng hẳn**
  Người dùng thấy gì: Phép kiểm yếu hơn lời hứa trong tài liệu đo: một nhãn nguồn sai kiểu khác vẫn có thể lọt qua mà không bị phát hiện. Hiện chưa thấy tin nào bị gắn nhãn sai.
  Căn cứ: Chỉ làm phép kiểm lỏng hơn dự kiến, không làm mất hay sai dữ liệu hiện có, và siết lại sau rất rẻ.
  file: `pipeline/scripts/phuong-tu-du-an.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
