# Review findings: test-khong-prune-worktree (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Nhánh dự phòng so gitdir tuyệt đối: hỏng im lặng khi gitdir là đường tương đối (worktree.useRelativePaths)**
  Người dùng thấy gì: Nếu sau này máy bật chế độ lưu đường dẫn worktree kiểu tương đối, việc dọn worktree tạm của test có thể bỏ sót mà không báo gì. Hiện cấu hình đó chưa bật nên chưa ai gặp.
  Căn cứ: Hiện chưa có hậu quả nào vì cấu hình chưa bật, phần sót chỉ là mục quản trị thừa trong kho, không mất dữ liệu và dọn tay được, nên ghi lại là đủ.
  file: `scripts/lib/bo-worktree.mjs`
  severity: low
  Đề xuất: known-limits

- **Chú thích đầu probe phạm vi ghi «ba tệp mã», trong khi probe và E4 kiểm bốn tệp**
  Người dùng thấy gì: Một dòng ghi chú trong hồ sơ nghiệm thu ghi sai số tệp (ba thay vì bốn), có thể làm người đọc hiểu nhầm phạm vi đôi chút. Kết quả kiểm tra vẫn đúng.
  Căn cứ: Chỉ lệch chữ trong ghi chú, không ảnh hưởng kết quả kiểm hay dữ liệu nào, người đọc đối chiếu với hợp đồng là thấy ngay, nên chấp nhận và ghi vết.
  file: `_acceptance/test-khong-prune-worktree/probes/pham-vi.sh`
  severity: low
  Đề xuất: wont-fix

- **boWorktree nuốt lỗi `worktree remove` và trả "khong-thay" mà nơi gọi bỏ qua: worktree tạm bị bỏ sót mà không ai biết**
  Người dùng thấy gì: Khi việc dọn worktree tạm của test không tìm thấy mục để gỡ, test vẫn xanh và không cảnh báo, nên phần sót lại có thể nằm im trong kho mà không ai hay.
  Căn cứ: Chỉ xảy ra ở cấu hình hiếm chưa bật, phần sót là rác nhỏ trong kho, không làm mất dữ liệu của ai và tự dọn tay được, nên ghi vào giới hạn đã biết là hợp lý.
  file: `scripts/lib/bo-worktree.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
