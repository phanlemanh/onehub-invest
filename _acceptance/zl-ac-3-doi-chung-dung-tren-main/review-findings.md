# Review findings: zl-ac-3-doi-chung-dung-tren-main (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **dungCayCu tạo worktree trên kho dùng chung rồi commit NGOÀI try/finally, lỗi giữa chừng để lại worktree mồ côi**
  Người dùng thấy gì: Nếu bước dựng cây thử bị lỗi giữa chừng, một thư mục làm việc tạm bị bỏ lại trong kho chung. Việc này chỉ làm rác tích lại ở máy dev và không ảnh hưởng người dùng cuối.
  Căn cứ: Chỉ xảy ra khi bộ test tự lỗi, không mất dữ liệu, dọn tay được và không ảnh hưởng kết quả xanh/đỏ.
  file: `scripts/zalo-import-job-lan.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Danh sách tệp được phép trong probe pham-vi rộng hơn AC-5 của hợp đồng**
  Người dùng thấy gì: Phép kiểm phạm vi cho qua thêm hai tệp máy sinh mà hợp đồng chưa kể tên. Kết quả xanh vì thế chưa chứng minh chặt đúng câu đã ký, nhưng người dùng không bị ảnh hưởng.
  Căn cứ: Hai tệp thừa là tệp máy sinh vô hại, không đổi hành vi sản phẩm; chỉ cần ghi lại chênh lệch hoặc chỉnh chữ hợp đồng sau, rẻ và không gấp.
  file: `_acceptance/zl-ac-3-doi-chung-dung-tren-main/probes/pham-vi.mjs`
  severity: low
  Đề xuất: known-limits

- **dungCayCu tạo worktree ngoài try/finally: commit mô phỏng lỗi thì worktree tạm bị bỏ lại trong kho dùng chung**
  Người dùng thấy gì: Khi bước dựng cây thử lỗi, thư mục làm việc tạm còn treo trong kho chung và phải gỡ tay. Chỉ gây rác ở máy dev, không ảnh hưởng người dùng cuối.
  Căn cứ: Chỉ xảy ra khi bộ test tự lỗi, không mất hay lộ dữ liệu, gỡ tay được; trùng với finding t1 nên gộp ghi một lần.
  file: `scripts/zalo-import-job-lan.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Probe ba-the.mjs không dọn bản clone tạm khi thoát giữa chừng**
  Người dùng thấy gì: Khi phép kiểm ba thế dừng giữa chừng, các bản sao tạm của kho nằm lại trong thư mục tạm của máy. Chỉ tốn đĩa trên máy dev, hệ điều hành dọn dần.
  Căn cứ: Hậu quả chỉ là rác trong thư mục tạm, lỗi vẫn hiện ra rõ, không mất dữ liệu; chi phí sửa vượt xa lợi ích.
  file: `_acceptance/zl-ac-3-doi-chung-dung-tren-main/probes/ba-the.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 5 — pham-vi.mjs tuyên «trong tệp test chỉ đổi vùng ZL-AC-3» nhưng chỉ soát vài điểm có tên, không soát phần bù**
  Người dùng thấy gì: Phép kiểm phạm vi chưa phát hiện được nếu ai đó thêm ca test mới hoặc sửa hằng ở chỗ ngoài ba khối đã kê. Rủi ro là một thay đổi ngoài ý muốn lọt qua mà vẫn báo xanh.
  Căn cứ: Rủi ro nằm ở khả năng lọt thay đổi trong tệp test, không đụng dữ liệu hay người dùng cuối; người duyệt PR vẫn thấy diff, nên ghi lại giới hạn là đủ.
  file: `_acceptance/zl-ac-3-doi-chung-dung-tren-main/probes/pham-vi.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
