## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Lỗi đọc users của lược đồ tạm bị nuốt, tập dấu lặng lẽ mất mã người**
  Người dùng thấy gì: Không ảnh hưởng người dùng cuối. Chỉ khi môi trường kiểm thử hỏng, một lớp kiểm có thể lặng lẽ yếu đi mà không báo.
  Căn cứ: Chỉ là bộ kiểm thử nội bộ, chỉ xảy ra khi môi trường dựng đã hỏng và nhiều ca khác đã đỏ trước, không mất dữ liệu và rẻ để ghi lại làm hạn chế đã biết.
  file: `app/tests/the-duyet-du-can-cu.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Lỗi thật của publicBiCham trong after() bị đổi thành null, thông điệp «public đã bị chạm» gây hiểu nhầm**
  Người dùng thấy gì: Không ảnh hưởng người dùng cuối. Khi kiểm thử đỏ vì lý do khác, thông báo có thể dẫn người sửa đi nhầm hướng lúc đầu.
  Căn cứ: Kiểm vẫn đỏ đúng chiều nên không lọt lỗi, chỉ làm người đọc mất thêm thời gian chẩn đoán; hậu quả nhẹ và tự gỡ được.
  file: `app/tests/the-duyet-du-can-cu.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Áp lại migration nay có lock_timeout 5s: lần chờ khoá dài trước kia vẫn qua, giờ lại đỏ và bị gắn nhầm nhãn «không idempotent»**
  Người dùng thấy gì: Không ảnh hưởng người dùng cuối. Nếu một job đêm giữ khoá rất lâu, bộ kiểm có thể đỏ và báo nhầm nguyên nhân.
  Căn cứ: Chỉ xảy ra khi job giữ khoá hơn nửa phút, hiếm; hậu quả là một lần chạy lại kiểm thử, không mất dữ liệu.
  file: `agent/tests/enrich-revert.test.ts`
  severity: low
  Đề xuất: known-limits

- **Ngưỡng thời gian < 400ms ở ca «lỗi không phải tải» có thể chập chờn đúng lúc DB đang tải**
  Người dùng thấy gì: Không ảnh hưởng người dùng cuối. Bộ kiểm có thể thỉnh thoảng đỏ giả khi máy dữ liệu đang bận.
  Căn cứ: Đỏ giả chỉ cần chạy lại là qua, không mất dữ liệu; chưa có số đo cho thấy nó đã xảy ra nên chưa đáng mở việc riêng.
  file: `agent/tests/enrich-revert.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — Fixture viết tay đúng khuôn bên đọc: dấu lượt trong TD-TAI-2 gõ tay khớp regex DAU_LUOT, không rút từ dòng mà lượt thật ghi ra**
  Người dùng thấy gì: Không ảnh hưởng người dùng cuối. Một dòng lọt vào kho công khai mà không mang dấu quen thuộc có thể không bị bộ kiểm bắt.
  Căn cứ: Rủi ro nằm ở độ phủ của bộ kiểm chứ không phải lỗi hiện hữu, và hợp đồng đã chủ ý đổi từ đếm số dòng sang đếm theo dấu; sửa đòi thiết kế lại nên ghi lại là hạn chế đã biết.
  file: `app/tests/the-duyet-du-can-cu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên quét lớp «ma trận sáu dấu» nhưng regex DAU_LUOT có nhiều nhánh hơn số assert**
  Người dùng thấy gì: Không ảnh hưởng người dùng cuối. Một số kiểu dấu nhận diện chưa có kiểm riêng nên nếu viết sai sẽ không được phát hiện.
  Căn cứ: Chỉ là khoảng hở độ phủ của bộ kiểm nội bộ, không mất dữ liệu và có thể bổ sung dần khi cần.
  file: `app/tests/the-duyet-du-can-cu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — Kiểm cuối lượt được đo bằng bản chép của dòng assert, không chạy chính hook after**
  Người dùng thấy gì: Không ảnh hưởng người dùng cuối. Bằng chứng rằng kiểm cuối lượt thật sự đỏ khi kho công khai bị chạm còn gián tiếp.
  Căn cứ: Chỉ là bằng chứng kiểm thử yếu hơn lý tưởng, bản thân kiểm cuối lượt vẫn chạy; không mất dữ liệu và không ảnh hưởng người dùng.
  file: `app/tests/the-duyet-du-can-cu.test.tsx`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
