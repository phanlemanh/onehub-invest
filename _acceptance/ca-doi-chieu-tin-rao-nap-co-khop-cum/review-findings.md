# Review findings: ca-doi-chieu-tin-rao-nap-co-khop-cum (round 1)

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 — assertion âm-tính-một-mình: bộ soát đầu ra (guardValues) chỉ được khẳng định «không trúng», không có đối chứng dương**
  Người dùng thấy gì: Phép kiểm tên nguồn lọt ra ngoài chưa có ca chứng minh nó thực sự bắt được một tên đủ cụm, nên nếu phép kiểm này hỏng im lặng thì ca vẫn xanh. Người dùng cuối không bị ảnh hưởng, chỉ là độ tin cậy của một ca kiểm giảm nhẹ.
  Căn cứ: Chỉ là chỗ thiếu một đối chứng trong ca kiểm, không đổi gì trên màn hay dữ liệu của người dùng, và các vế chính của ca đã có đối chứng nên mức độ nhẹ; bổ sung sau cũng rẻ.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
