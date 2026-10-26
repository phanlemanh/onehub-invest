# Review findings: vong-doi-nguon (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Toggle tắt nhóm retired/completed chuyển sang paused, nên chặn 409 bị vượt sau hai lệnh**
  Người dùng thấy gì: Người vận hành có quyền ops có thể tắt rồi bật lại một nhóm thu đã gỡ hoặc đã hoàn tất, và nhóm đó sống lại dù luật nói không được bật lại.
  Căn cứ: Hậu quả nhẹ đến vừa: cần đăng nhập ops và thao tác cố ý hai bước, không mất dữ liệu, chỉ đặt lại trạng thái nhóm được; sửa sau cũng rẻ nên đáng mở một việc riêng.
  file: `app/src/app/api/v1/ops/source-groups/route.ts`
  severity: medium
  Đề xuất: new-contract

- **Audit toggle ghi ngoài giao dịch qua auditOpsWrite (ghi nền, nuốt lỗi), khác pattern đã có cho đổi trạng thái**
  Người dùng thấy gì: Hiếm khi, nếu ghi nhật ký bị lỗi đúng lúc bật hoặc tắt nhóm, thao tác vẫn báo thành công nhưng không có dòng vết ghi ai đổi từ trạng thái nào sang trạng thái nào.
  Căn cứ: Chỉ xảy ra khi bước ghi nhật ký lỗi, hiếm; trạng thái nhóm vẫn đúng, chỉ thiếu một dòng vết, nên ghi lại là giới hạn đã biết.
  file: `app/src/app/api/v1/ops/source-groups/route.ts`
  severity: low
  Đề xuất: known-limits

- **Toggle tắt hạ nhóm retired/completed xuống paused, rồi toggle bật lại được: chặn 409 bị lách**
  Người dùng thấy gì: Bấm tắt rồi bật trên giao diện (kể cả bấm nhanh hai lần) có thể hồi sinh một nhóm đã gỡ, và nhóm nháp bị đổi thành tạm dừng khi tắt.
  Căn cứ: Không mất dữ liệu và người dùng tự đặt lại được, nhưng nó phá một luật đã nêu rõ nên nên gộp sửa cùng việc ở dòng trùng.
  file: `app/src/app/api/v1/ops/source-groups/route.ts`
  severity: medium
  Đề xuất: new-contract

- **CLI vong-doi: lỗi nạp pg hay dựng Client nằm ngoài try nên thoát 1 thay vì 2 như đã hứa**
  Người dùng thấy gì: Khi máy thiếu thư viện kết nối DB hoặc chuỗi kết nối sai, công cụ kiểm tra nguồn báo lỗi bằng mã lạ thay vì mã lỗi đã hẹn, nên script đêm gọi nó có thể xử lý nhầm.
  Căn cứ: Chỉ xảy ra khi môi trường hỏng và lỗi vẫn hiện rõ, không mất hay lộ dữ liệu; hiện chưa có script nào gọi nó nên ghi lại và xử lý khi bước nối thu đêm được làm.
  file: `pipeline/lib/vong-doi.mjs`
  severity: low
  Đề xuất: known-limits

- **Shape 5 (claims to sweep a class but only tests some cases): E6/AC-6 says delete and set-mode still work after 047, but set-mode is never called**
  Người dùng thấy gì: Đổi chế độ thu của một nhóm chưa được thử trên cấu trúc dữ liệu mới, nên nếu nó hỏng sau bản cập nhật thì bộ kiểm tra vẫn báo xanh.
  Căn cứ: Là lỗ hổng trong bài kiểm tra chứ chưa thấy lỗi thật, chỉ ảnh hưởng thao tác của quản trị viên và làm lại được; ghi lại rồi bổ sung ca kiểm khi tiện.
  file: `app/tests/vong-doi-nguon.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Shape 2 (hand-written fixture shaped like what the reader expects): VD-AC-3 reads back the hand-written DEFAULT 'active', and VD-KHUON compares column names only**
  Người dùng thấy gì: Bài kiểm tra dùng bảng mẫu tự viết, nên nếu bảng thật lệch khỏi mẫu ở giá trị mặc định hay ràng buộc thì bài kiểm vẫn báo xanh.
  Căn cứ: Chưa có lỗi thật, chỉ là mức bảo đảm yếu hơn lời hứa; bảng thật đã được kiểm riêng trên bản chép dữ liệu local nên rủi ro thấp.
  file: `pipeline/scripts/vong-doi.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Shape 5 (claims to sweep a class but only tests some cases): E11/AC-9 lists the 5 constraints plus the trigger source_groups_dong_bo_enabled, but the test asserts only the 5 constraint names**
  Người dùng thấy gì: Bài kiểm trên bản chép dữ liệu thật không xác nhận cơ chế tự giữ hai cột trạng thái khớp nhau đã được tạo, dù các ràng buộc khác đã được kiểm.
  Căn cứ: Cơ chế này đã được kiểm ở bài kiểm khác trên bảng mẫu, và thiếu nó thì ràng buộc khớp sẽ báo lỗi ngay khi ghi, nên rủi ro thấp và dễ thấy.
  file: `pipeline/scripts/vong-doi-local.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Shape 4 (negative-only assertion with no positive control): the group-mapping loop in VD-AC-9 can pass vacuously, because there is no assert that the copied source_groups has rows or has any enabled=false row**
  Người dùng thấy gì: Nếu bản chép bảng nhóm trống hoặc không có nhóm nào đang tắt, bài kiểm vẫn báo xanh mà chưa thật sự thử việc chuyển nhóm tắt sang tạm dừng.
  Căn cứ: Chỉ làm bài kiểm yếu đi trong trường hợp dữ liệu trống, không ảnh hưởng người dùng; chạy lại trên dữ liệu có nhóm tắt là biết ngay.
  file: `pipeline/scripts/vong-doi-local.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
