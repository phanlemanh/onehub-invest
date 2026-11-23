# Review findings: zl-ac-3-doi-chung-dung-tren-main (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe ba-the.mjs để lại bản clone tạm khi thoát sớm hoặc khi ném lỗi**
  Người dùng thấy gì: Khi công cụ kiểm tra này chạy lỗi giữa chừng, nó để lại vài thư mục tạm trên máy người chạy. Người dùng sản phẩm không bị ảnh hưởng gì, chỉ tốn chút dung lượng.
  Căn cứ: Hậu quả rất nhẹ: chỉ tốn dung lượng ổ trên máy dev, không mất hay lộ dữ liệu, tự xoá tay được và sửa không đáng công.
  file: `_acceptance/zl-ac-3-doi-chung-dung-tren-main/probes/ba-the.mjs`
  severity: low
  Đề xuất: wont-fix

- **pham-vi.mjs không soát phần sau ca ZL-AC-4, dù chú thích nói chỉ vùng ZL-AC-3 được đổi**
  Người dùng thấy gì: Công cụ soát phạm vi thay đổi bỏ sót phần cuối tệp kiểm thử, nên một sửa đổi lọt vào đó sẽ không bị báo. Người dùng cuối không thấy ảnh hưởng, chỉ là lưới an toàn của đội hẹp hơn lời mô tả.
  Căn cứ: Nhẹ với người dùng vì chỉ liên quan tới tệp kiểm thử nội bộ, không mất dữ liệu; lỗ hổng chỉ lộ khi có người sửa cố ý hoặc vô ý đúng chỗ đó và dễ thấy khi xem diff.
  file: `_acceptance/zl-ac-3-doi-chung-dung-tren-main/probes/pham-vi.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên «chỉ đổi vùng ZL-AC-3» nhưng probe chỉ so vài khối điểm, bỏ hở before/after**
  Người dùng thấy gì: Công cụ soát phạm vi không so phần dựng môi trường của bộ kiểm thử, nên sửa ở đó có thể lọt mà vẫn báo giữ nguyên. Người dùng cuối không bị ảnh hưởng, chỉ độ tin cậy của lời khẳng định trong hồ sơ giảm.
  Căn cứ: Hậu quả nhẹ và nằm trong công cụ nội bộ; không mất hay lộ dữ liệu, bộ kiểm thử chính vẫn chạy và lệch sẽ lộ khi đọc diff.
  file: `_acceptance/zl-ac-3-doi-chung-dung-tren-main/probes/pham-vi.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — ô «sua» của ma trận chỉ chấm rc, không chấm quan hệ merge_base = HEAD và pass 5/fail 0 mà E2 hứa**
  Người dùng thấy gì: Công cụ kiểm tra chỉ xét kết quả chạy thành công, không xác nhận đúng thế cây và đúng số ca. Người dùng cuối không bị ảnh hưởng, chỉ có khả năng báo xanh khi thế đo lệch.
  Căn cứ: Hậu quả nhẹ vì thế cây do chính probe dựng và số ca thấy được trong bản in; không mất dữ liệu và rà lại nhanh.
  file: `_acceptance/zl-ac-3-doi-chung-dung-tren-main/probes/ba-the.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
