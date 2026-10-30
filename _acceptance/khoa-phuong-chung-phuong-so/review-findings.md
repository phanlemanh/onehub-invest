## Trong hợp đồng

Không có finding.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

Không có finding mới ở round này (các mục từ round trước được máy chèn tiếp, mang nhãn round).

- **E2 ghi đối chứng đỏ 2 «nạp bằng stripTypeScriptTypes», nhưng test lại ghi một tệp .ts tạm vào agent/tests rồi import qua tsx (r2)**
  Người dùng thấy gì: Người dùng cuối không thấy gì: việc ghép căn và chấm phường vẫn đúng. Chỉ có người đọc hồ sơ nghiệm thu thấy một câu mô tả không khớp cách kiểm thật, và nếu lượt kiểm bị ngắt giữa chừng thì có thể sót một tệp tạm trong thư mục kiểm.
  Căn cứ: Hậu quả nhẹ, không mất hay lộ dữ liệu của người dùng; tệp tạm nếu sót thì xoá tay được, và sửa lại câu mô tả lúc nào cũng rẻ.
  file: `agent/tests/judge-nguong.test.ts`
  severity: low
  Đề xuất: known-limits

- **evals E2 mô tả sai cách nạp bản chép judge-entity.ts ở đối chứng đỏ 2 (r1)**
  Người dùng thấy gì: Chỉ là tài liệu nghiệm thu ghi chưa đúng cách máy dựng bản đối chứng; người dùng không thấy khác biệt nào ở thẻ duyệt hay máy chấm.
  Căn cứ: Nhẹ: không ảnh hưởng dữ liệu hay màn hình nào, chỉ làm người đọc hồ sơ hiểu sai một chi tiết đo, và sửa lại câu chữ sau lúc nào cũng rẻ.
  file: `_acceptance/khoa-phuong-chung-phuong-so/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Bỏ hẳn nhánh khoá-chỉ-số làm Khớp rộng hơn «P.12» = «Phường 12»: «12» trần, «Xã 12», «Thị trấn 12» cũng thành Khớp / cùng phường (r1)**
  Người dùng thấy gì: Một xã hay thị trấn trùng số với một phường, hoặc tin chỉ ghi số trần, giờ có thể hiện Khớp trên thẻ duyệt và máy chấm có thể kết luận cùng phường, dễ làm người duyệt ghép nhầm hai căn khác nhau.
  Căn cứ: Mức vừa: có thể dẫn đến ghép căn sai nhưng chỉ khi trùng số giữa các loại đơn vị khác nhau, và thẻ vẫn qua người duyệt nên gỡ được; Mạnh đã hoãn ba dạng này cho hàng sau nên nên xử lý ở hàng riêng.
  file: `app/src/lib/ops/review-can-cu.ts`
  severity: medium
  Đề xuất: new-contract

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
