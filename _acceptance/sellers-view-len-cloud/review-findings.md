# Review findings: sellers-view-len-cloud (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe phạm vi E6 không cho phép sửa docs/ROADMAP.md, nên việc này không ghi được ROADMAP §2/§4 như AGENTS.md yêu cầu**
  Người dùng thấy gì: Sổ lộ trình của dự án chưa ghi rằng cloud vẫn giữ danh sách người bán dạng bảng và còn một bước kiểm trước khi áp lên cloud. Người dùng cuối không bị ảnh hưởng, chỉ người vận hành có thể thiếu ghi chú trạng thái.
  Căn cứ: Chỉ là thiếu một dòng ghi chú trong tài liệu nội bộ, không mất hay lộ dữ liệu, bổ sung sau rất rẻ và không ảnh hưởng chức năng.
  file: `_acceptance/sellers-view-len-cloud/probes/pham-vi.sh`
  severity: low
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình (hình 4): E2c nhận BẤT KỲ lỗi nào khi chèn vào view sellers, không ghim thông điệp, không có đối chứng dương**
  Người dùng thấy gì: Phép thử xác nhận việc chèn vào danh sách người bán dạng view sẽ lỗi có thể xanh vì một lý do khác, nên độ tin cậy của bằng chứng này thấp hơn mức mong muốn. Hành vi đồng bộ cho người dùng không đổi.
  Căn cứ: Chỉ làm bằng chứng kiểm thử kém chặt, không ảnh hưởng dữ liệu hay người dùng, và các ô kiểm khác trong cùng nhóm đã ghim thông điệp lỗi nên rủi ro thấp, có thể siết sau.
  file: `_acceptance/sellers-view-len-cloud/probes/cloud-gia.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
