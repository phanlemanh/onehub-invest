# HT4 px1-ac-10-so-dung-tin-gan-theo-ten — ca PX1-AC-10 so với giá trị nguồn ghi

Ngày 22/11/2026, dãy P2, T2. Gốc: GS cắt HT4 sau khi P2 phân loại ca đỏ «PX1-AC-10 lệch 1905» (N1, suite pipeline_a, main b28bdbd3d).

## 1. Chẩn đoán (đo 22/11 trên DB thử chép mới từ DB máy thu)

- Ca `PX1-AC-10 gán S06, S03 bằng code mới = area_id đang lưu` (`pipeline/scripts/nap-dvhc-cu.test.mjs`) so trên TOÀN BỘ tin thật của bản chép:
  đưa DB về «chưa 084» rồi đòi bộ gán PX1 (theo tên trong bài, thị trường của nhóm) ra đúng `area_id` đang lưu.
- Lệch 1.908 tin, 100% S03, 0 S06 (1.720 ra khu khác, 188 ra rỗng). Khu đang lưu của cả 1.908 tin có phát biểu `area_id` của
  `registry_inherit / phuong-tu-du-an@1` (DA9/DA45, từ 21/11 05:54Z); 1.904 tin còn có `e1_rule / dia-chi-the-nhom` (TG2, từ 18/11)
  cùng giá trị. Trên DB máy thu không có phát biểu `area_id` nào loại «gán theo tên»: khu theo tên do transform-zalo ghi thẳng vào cột.
- Migration 099 (DA45) đè phường kế thừa lên cột và giữ giá trị nguồn ghi ở `field_provenance.area_id.goc`.
- Kết luận (a): ca giả định dữ liệu. Đường ống tự nhất quán; bộ gán «trước 084» không biết lớp đè sau nó.

## 2. Sửa

So bộ gán PX1 với **G của 099** — giá trị nguồn ghi: G = `goc` khi cột bằng `v` của nhãn `field_provenance.area_id`, ngược lại G = cột.
S06 giữ phép so cũ (0 lệch, không có lớp đè). Định nghĩa dương theo hợp đồng của 099, không liệt kê tên luật để loại, không loại tin nào.
(Lối GS chọn ban đầu — chỉ so tin có phát biểu thắng loại «gán theo tên» — cho tập rỗng vì không có phát biểu như vậy; P2 báo GS 22/11,
GS nhận lối G cùng ngày và thêm chốt khoá goc. Lối khác đã bác: lùi bản chép về trước 099 trong giao dịch cho đúng G nhưng phải đảo
hàm phân xử của 099 trên dữ liệu thật; đếm riêng tin bị đè thay cho so thì bỏ không đo 1.900 tin. Số 1.908 lúc chẩn đoán và 1.900/1.905
lúc đo là ba bản chép ở ba giờ khác nhau, cùng một hiện tượng.)

Ca in và assert:
- số tin đem so: S06, S03, số tin S03 so với G vì cột bị đè, số tin trỏ xã danh bạ đã gỡ (không so); sàn S03 ≥ 1.500 và tập so với G
  ≥ 1.300 (≈ 70% số đo 22/11: 2.177–2.186 và 1.900–1.905);
- đối soát: so với cột như cũ thì mọi tin lệch thuộc tập bị đè (22/11: 1.900 = 1.900, ngoài 0) — G không che lệch vì lý do khác;
- số tin S03 sống có cột bị lớp sau đè, chia theo nhãn `method/nguon` (22/11: `registry_inherit/du-an` 7.835) — mốc;
- lệch = 0;
- mọi tin có nhãn đè còn khoá `goc` (GS 22/11: lối G không được tự mục — lớp sau đè cột mà quên giữ goc thì ca đỏ gọi tên tin;
  giá trị NULL hợp lệ vì cột có thể rỗng trước khi nhận phường).

Chiều đỏ trên cùng bản chép:
- phá ánh xạ tên → khu (mỗi phường trỏ sang phường kế tiếp cùng thị trường) → lệch > 0;
- tập so rỗng → ném «PX1-AC-10 tập so rỗng» (không xanh rỗng); cắt S03 còn 10 tin → ném «tập so S03 10 dưới sàn 1500»;
- bỏ G (so với cột như cũ) → lệch > 0 khi bản chép có tin bị đè;
- xoá khoá `goc` của một tin có nhãn → bộ đọc nêu đúng tin đó.

Thế CI (DB dựng từ migration, < 34 thị trường): mọi ca bỏ qua có tên như cũ.

## 3. Vì sao lọt

Ca đỏ ngầm từ 18–21/11 vì CI bỏ qua ca (không có bản chép thật) và các dãy chạy suite trên bản mẫu DB thử dựng trước khi hai lớp ghi
khu mới (TG2, DA45) vào dữ liệu thật; bản mẫu dựng lại 22/11 05:42Z thì đỏ lộ ra.

## 4. Ngoài phạm vi

- Phép đo AC-9 của PX1 (`pipeline/scripts/nap-dvhc-do.mjs`) cũng so với cột: không sửa ở đây (vùng hàng chỉ có tệp ca thử); ghi việc kế.
- 4 tin có `dia-chi-the-nhom` khác phường kế thừa: hành vi phân xử của DA45, không thuộc ca này.
