# Review findings — do-lam-giau (round 3)

## Trong hợp đồng

(không có finding)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **--ngay không kiểm khuôn, cũng không kiểm ngày quá khứ: lượt --write với ngày cũ ghi dòng đổi hôm nay vào ngày khác và thay luôn ảnh chụp (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu người vận hành chạy tay lệnh đo với ngày cũ hoặc gõ thiếu giá trị ngày, số liệu của hôm nay có thể bị ghi nhầm vào ngày khác và các lượt đo sau lệch theo.
  Căn cứ: Chỉ xảy ra khi có người chạy tay sai tham số, lượt đêm tự động không dính; hậu quả là số đo sai ngày chứ không làm lộ hay mất dữ liệu tin, và chạy lại đúng ngày là sửa được phần lớn.
  file: `pipeline/do-lam-giau.mjs`
  severity: low
  Đề xuất: known-limits

- **Migration 086 đặt tên cột tiếng Việt (`duong`, `huong`), trái luật đặt tên «tên bảng/cột tiếng Anh» (r1)**
  Người dùng thấy gì: Hai cột mới của bảng đo làm giàu mang tên tiếng Việt, lệch quy ước đặt tên tiếng Anh của dự án; người dùng cuối không thấy gì khác.
  Căn cứ: Chỉ là lệch quy ước đặt tên nội bộ, không ảnh hưởng số đo hay người dùng; đổi tên sau khi migration đã áp dụng thì đắt hơn nhiều, nên ghi ngoại lệ rồi giữ nguyên.
  file: `db/migrations/086_lam_giau.sql`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên quét LỚP (mọi nhóm số × mọi chiều lát) nhưng chỉ đặt sàn >= 16, không có ma trận đầy đủ viết trước (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bộ kiểm tra tự động cho phần chia nhỏ số liệu theo khu vực, dự án, toà chưa chặt, nên nếu sau này một nhóm số bị thiếu phần chia thì có thể không bị phát hiện ngay.
  Căn cứ: Số liệu hiện tại không sai, chỉ là lưới an toàn còn lỏng; bổ sung kiểm tra sau này không làm mất dữ liệu và không ảnh hưởng người dùng hôm nay.
  file: `pipeline/scripts/do-lam-giau.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — dòng do3-kiem-nguoc viết tay đúng khuôn Raw của gomLamGiau, không đi vòng từ bộ ghi sang loader (r1)**
  Người dùng thấy gì: Phép thử màn Làm giàu dùng dữ liệu kiểm ngược dựng tay thay vì dữ liệu do bộ ghi thật tạo ra, nên nếu khuôn dữ liệu đổi mà màn hình không theo kịp thì có thể không bị báo.
  Căn cứ: Chỉ làm yếu một lớp kiểm tra, màn hình hiện giờ vẫn hiển thị đúng; nếu sau này lệch thì lỗi hiện ra rõ trên trang và sửa được nhanh.
  file: `app/tests/do-lam-giau.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — đo văn bản nguồn page.tsx bằng regex thay vì đo đầu ra khi loader thật ném lỗi (r1)**
  Người dùng thấy gì: Phép thử trạng thái lỗi của khối Làm giàu chỉ so chữ trong mã nguồn chứ chưa chạy thử thật khi dữ liệu tải hỏng, nên chưa chắc chắn nút Thử lại hoạt động đúng trong tình huống ấy.
  Căn cứ: Nếu có lỗi thì chỉ ảnh hưởng một khối trên trang vận hành nội bộ, người dùng tải lại trang là xong; chi phí viết phép thử đầy đủ cao hơn rủi ro.
  file: `app/tests/do-lam-giau.test.tsx`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
