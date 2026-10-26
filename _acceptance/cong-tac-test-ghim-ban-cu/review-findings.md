# Review findings: cong-tac-test-ghim-ban-cu (round 2)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Eval E1 tìm chuỗi 'retired+tắt' trong đầu ra, nhưng ca thử đặt tên ô là 'retired+tat' và đối chứng không in gì ra**
  Người dùng thấy gì: Phần mô tả bằng chữ của hồ sơ kiểm cũ nói người chấm sẽ thấy dòng 'retired+tắt' khi đối chứng chạy, nhưng thực tế màn hình không in dòng đó. Phép kiểm vẫn chạy đúng và bắt được lỗi; chỉ có người đối chiếu theo từng chữ mới thấy lệch.
  Căn cứ: Nhẹ: chỉ lệch câu chữ trong hồ sơ, phép kiểm vẫn đúng, người dùng cuối không bị ảnh hưởng và không mất dữ liệu; ghi lại là đủ, sửa chữ sau cũng rẻ.
  file: `_acceptance/cong-tac-khong-ha-nhom-go/evals.yaml`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
