# Review findings: so-be-mat-api (round 1)

## Trong hợp đồng

- **Sổ bề mặt khai sai chế độ: 5 route 'ops-session' và route 'admin' vẫn nhận bearer OPS_API_TOKEN**
  AC: AC-3
  file: `app/src/lib/api-surface.ts:151`
  severity: medium
  source: conventions
  detail: Sổ và bảng ở portals.md quy định 10 định nghĩa `ops-session` = «chỉ người vận hành đăng nhập», `admin` = «chỉ role admin». Mã thật thì khác. v1/ops/review/[id]/decide, v1/ops/source-groups, v1/ops/zalo/accounts, v1/ops/zalo/groups, v1/ops/zalo/login đều có `auth(req)` (hoặc khối tương đương ở dòng 28-31 của decide). Hàm này trả true khi `Authorization: Bearer ${OPS_API_TOKEN}` khớp, trước khi xét `canAccessOps`. Tức là máy giữ token gọi được tạo/xoá tài khoản thu Zalo, bật nhóm, đăng nhập QR và quyết thẻ duyệt. Tương tự, v1/ops/audit/route.ts dòng 14-18 bỏ qua `isAdmin` khi bearer đúng. Theo định nghĩa của chính sổ, cả 6 route là chế độ `ops`. Kiểm tra không bắt được vì check-api-surface.mjs chỉ tìm xem có `canAccessOps(` hay `isAdmin(` trong mã, không kiểm xem còn nhánh bearer hay không. Kết quả là AC-3 «cổng trong mã khớp chế độ» báo ĐẠT nhưng không đúng, còn sổ (nguồn sự thật về bề mặt API theo portals.md) mô tả người gọi chặt hơn thực tế đối với các route ghi/đăng nhập Zalo.
  rationale: AC-3 đòi cổng trong mã phải khớp chế độ sổ khai (ops-session, admin); finding nói mã còn nhánh bearer nên không khớp định nghĩa chế độ, và kiểm sổ vẫn báo đạt. Mục Out of scope chỉ loại việc gom route về canCallOpsApi, không loại việc sổ bắt lệch chế độ.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Kiểm cổng chỉ cần helper xuất hiện một lần trong file, không kiểm từng phương thức đã export**
  Người dùng thấy gì: Nếu ai đó vô tình bỏ bước xác thực ở một thao tác của trang vận hành Zalo (ví dụ xoá tài khoản), bộ kiểm tự động vẫn báo đạt nên lỗ hổng có thể lọt qua mà không ai biết.
  Căn cứ: Rủi ro chỉ xảy ra khi có người sửa nhầm mã sau này, bộ kiểm hiện tại vẫn bắt được trường hợp bỏ hẳn cổng, và việc siết thêm thuộc về vòng riêng chứ không làm hỏng hành vi đang chạy.
  file: `scripts/check-api-surface.mjs`
  severity: low
  Đề xuất: known-limits

- **mcp-tools.json vẫn quảng bá /api/v1/offers là công khai — client MCP sẽ nhận 401**
  Người dùng thấy gì: Các công cụ AI nạp danh mục công cụ của hệ thống vẫn tưởng danh sách tin rao bán là công khai, nên mỗi lần gọi sẽ bị từ chối và người dùng thấy công cụ đó hỏng.
  Căn cứ: Công cụ tin rao hỏng hoàn toàn với người dùng AI nhưng không lộ hay mất dữ liệu, và sửa danh mục rẻ nhưng nằm ngoài những gì đợt này đã ký nên cần một việc nhỏ riêng.
  file: `app/docs/api/mcp-tools.json`
  severity: medium
  Đề xuất: new-contract

- **audit-all.sh vẫn xếp offers/deals đã tạm đóng dưới tiêu đề «E. PUBLIC APIs», trái với đáp án E6**
  Người dùng thấy gì: Báo cáo kiểm tra hệ thống vẫn ghi tin rao bán và giao dịch dưới mục API công khai dù thực tế đã đóng, có thể làm người đọc báo cáo hiểu nhầm; kết quả đo thật vẫn đúng.
  Căn cứ: Chỉ là nhãn trong báo cáo, không ảnh hưởng người dùng cuối hay dữ liệu, và có thể sửa lại bất cứ lúc nào mà không có hậu quả.
  file: `scripts/audit-all.sh`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/4 lỗi rơi vào file không bộ đo nào phủ (app/docs/api/mcp-tools.json, scripts/audit-all.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
