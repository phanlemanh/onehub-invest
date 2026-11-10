# Review findings: pl34-lich-dem-sau-buoc (round 1)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thẻ Mạnh đã duyệt ở Cổng 1 nói ngược AC-1 hiện hành (đêm không có snapshot mới); vế AC-1 bị đảo nghĩa sau khi đã niêm mà không xin duyệt lại**
  Người dùng thấy gì: Thẻ người ký đọc nói đêm không có tin mới thì không đọc gộp, nhưng thực tế hệ thống vẫn đọc gộp mọi đêm và tốn tiền model. Người ký có thể ký theo một mô tả sai.
  Căn cứ: Không mất dữ liệu và sửa rất rẻ bằng cách dựng lại thẻ cho khớp, nhưng cần làm trước khi ký để người ký không duyệt nhầm.
  file: `_acceptance/pl34-lich-dem-sau-buoc/card-plain.json`
  severity: medium
  Đề xuất: known-limits

- **Executor pl34_khong_lui (E7/AC-5) xanh giả khi pre-merge-check lỗi nội tại hoặc không chạy được**
  Người dùng thấy gì: Nếu công cụ kiểm trước khi gộp tự hỏng, phép đo vẫn báo xanh nên có thể gộp mà không có lưới an toàn thật sự chạy.
  Căn cứ: Chỉ xảy ra khi công cụ kiểm hỏng giữa chừng, người dùng cuối không thấy ngay, và có thể ghi nhận rồi vá sau bằng một phép đo chặt hơn.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **pl34_khong_lui báo xanh cả khi pre-merge-check.sh chết giữa chừng hay không chạy được**
  Người dùng thấy gì: Phép kiểm trước khi gộp có thể báo đạt dù công cụ kiểm đã chết giữa chừng, nên một vi phạm có thể lọt qua mà không ai biết.
  Căn cứ: Rủi ro thấp vì chỉ khi công cụ kiểm tự hỏng, không ảnh hưởng dữ liệu người dùng, và sửa sau rẻ cùng với phần t2.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên quét LỚP «mọi tệp test của kho nhắc zalo-import-daily» nhưng định nghĩa lớp hẹp hơn lời hứa, bỏ sót một phép đo đã đỏ thật**
  Người dùng thấy gì: Một phép kiểm đã ký của việc nạp Zalo (khoá nạp) nay báo đỏ vì job đêm có bước mới mà môi trường thử của nó chưa có. Các hồ sơ đã ký dựa vào phép kiểm này sẽ đỏ khi chấm lại.
  Căn cứ: Là hồi quy thật nhưng chỉ nằm ở phép kiểm, không mất dữ liệu job đêm; nên sửa môi trường thử trong một việc riêng để các hồ sơ đã ký không hoá cũ.
  file: `scripts/zalo-import-job.test.mjs`
  severity: high
  Đề xuất: new-contract

⚠ Cụm ngoài vùng phủ: 3/4 lỗi rơi vào file không bộ đo nào phủ (_acceptance/pl34-lich-dem-sau-buoc/card-plain.json, _acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
