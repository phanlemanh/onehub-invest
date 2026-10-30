# Review findings: khoa-phuong-chung-phuong-so (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **evals E2 mô tả sai cách nạp bản chép judge-entity.ts ở đối chứng đỏ 2**
  Người dùng thấy gì: Chỉ là tài liệu nghiệm thu ghi chưa đúng cách máy dựng bản đối chứng; người dùng không thấy khác biệt nào ở thẻ duyệt hay máy chấm.
  Căn cứ: Nhẹ: không ảnh hưởng dữ liệu hay màn hình nào, chỉ làm người đọc hồ sơ hiểu sai một chi tiết đo, và sửa lại câu chữ sau lúc nào cũng rẻ.
  file: `_acceptance/khoa-phuong-chung-phuong-so/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Bỏ hẳn nhánh khoá-chỉ-số làm Khớp rộng hơn «P.12» = «Phường 12»: «12» trần, «Xã 12», «Thị trấn 12» cũng thành Khớp / cùng phường**
  Người dùng thấy gì: Một xã hay thị trấn trùng số với một phường, hoặc tin chỉ ghi số trần, giờ có thể hiện Khớp trên thẻ duyệt và máy chấm có thể kết luận cùng phường, dễ làm người duyệt ghép nhầm hai căn khác nhau.
  Căn cứ: Mức vừa: có thể dẫn đến ghép căn sai nhưng chỉ khi trùng số giữa các loại đơn vị khác nhau, và thẻ vẫn qua người duyệt nên gỡ được; Mạnh đã hoãn ba dạng này cho hàng sau nên nên xử lý ở hàng riêng.
  file: `app/src/lib/ops/review-can-cu.ts`
  severity: medium
  Đề xuất: new-contract

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
