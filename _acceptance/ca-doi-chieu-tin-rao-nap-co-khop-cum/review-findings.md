# Review findings: ca-doi-chieu-tin-rao-nap-co-khop-cum (round 2)

## Trong hợp đồng

Không có finding.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (assertion âm tính một mình): `dau.guard === 0` không có đối chứng dương cho bộ soát đầu ra**
  Người dùng thấy gì: Phép kiểm tên người bán không lộ nguồn vẫn chạy và xanh. Nhưng riêng một bước kiểm phụ chưa có phép thử chứng minh nó thật sự bắt được tên đủ cụm, nên nếu bước đó hỏng ngầm thì test vẫn xanh.
  Căn cứ: Chỉ là test hơi lỏng, người dùng không thấy gì và không mất hay lộ dữ liệu; các phép kiểm chính vẫn có đối chứng hai chiều, nên ghi lại để bổ sung sau là đủ.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm-tính-một-mình: bộ soát đầu ra (guardValues) chỉ được khẳng định «không trúng», không có đối chứng dương (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm tên nguồn lọt ra ngoài chưa có ca chứng minh nó thực sự bắt được một tên đủ cụm, nên nếu phép kiểm này hỏng im lặng thì ca vẫn xanh. Người dùng cuối không bị ảnh hưởng, chỉ là độ tin cậy của một ca kiểm giảm nhẹ.
  Căn cứ: Chỉ là chỗ thiếu một đối chứng trong ca kiểm, không đổi gì trên màn hay dữ liệu của người dùng, và các vế chính của ca đã có đối chứng nên mức độ nhẹ; bổ sung sau cũng rẻ.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

