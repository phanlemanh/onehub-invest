# Review findings: so-tu-vung-mot-nguon (round 1)

## Trong hợp đồng

- **Test đối chứng VL-AC-5 sẽ đỏ vĩnh viễn trên main sau khi merge (pipeline npm test gãy)**
  AC: AC-6
  file: `pipeline/scripts/vocab-lint.test.mjs:178`
  severity: high
  source: conventions
  detail: Test lấy bản «trước vòng» bằng `git merge-base HEAD origin/main` rồi `git show <base>:pipeline/dq-enum-vocab.mjs`, sau đó khẳng định bản đó còn chỗ viết tay của trục kind. Trên nhánh hiện tại, merge-base là 106cbd3e nên test xanh. Sau khi merge, ở checkout main (launchd chạy từ đây) và mọi nhánh mở sau đó, merge-base chính là commit đã chứa bản dq-enum-vocab.mjs mới: bản này import VOCAB và chỉ có `COT = ["kind","confidence","price_tier","property_type"]`. Đã chạy scanText trên bản hiện tại và nhận về `[]`, nên assert `hits.some(h => h.axis === "kind")` sẽ đỏ. Tệp này nằm trong glob `scripts/*.test.mjs` của `pipeline/package.json` nên `cd pipeline && npm test` sẽ đỏ ở mọi nơi sau merge. Test còn phụ thuộc ref `origin/main`: clone nông hoặc chưa fetch thì execFileSync ném lỗi. Cách sửa: ghim bản cũ vào fixture (chuỗi literal hoặc sha cố định), không suy từ merge-base.

- **Hình dạng 3 (assert «chuỗi có mặt» thay vì QUAN HỆ): emitSeed chỉ được đếm số câu INSERT, không đối chiếu với dòng của 043**
  AC: AC-7
  file: `pipeline/scripts/vocab-db.itest.mjs:139`
  severity: medium
  source: measurement
  detail: Test ở dòng 139–143 chỉ assert `sql.match(/INSERT INTO ref_lookup/g).length === 1` và đếm tương tự cho ref_field_lookup. evals E7 hứa «SELECT ref_lookup bằng tập dòng của emitSeed(sổ thật)». Comment của `seedRows` (dòng 50) cũng nói «Dòng seed mà emitSeed sinh, đọc lại bằng chính DB (chạy seed vào bảng tạm)», nhưng `seedRows` không gọi emitSeed: nó tự dựng lại các dòng từ sổ (`dd_lookup ?? null`, `local === true`, `i + 1`). Kết quả là cả `--emit-seed` lẫn emitSeed không có phép đo nào về nội dung. Nếu emitSeed sinh sai label_vi, sort_order hay standard_lookup_value, test vẫn xanh miễn còn đúng một chuỗi «INSERT INTO». Quan hệ «emitSeed(sổ) == dòng mà 043 nạp» chưa được đo ở đâu.

- **Hình dạng 6 (đo theo checkout thay vì cây đang kiểm): đối chứng VL-AC-5 lấy bản «trước vòng» từ merge-base với origin/main**
  AC: AC-6
  file: `pipeline/scripts/vocab-lint.test.mjs:179`
  severity: medium
  source: measurement
  detail: Dòng 179–182: `git merge-base HEAD origin/main` rồi `git show ${base}:pipeline/dq-enum-vocab.mjs`, sau đó assert bản đó có chỗ trục kind. evals E5b ghim `<diffBase>`, tức một mốc cố định, nhưng test lại đọc ref origin/main của checkout đang chạy. Hôm nay merge-base trùng 106cbd3e nên test xanh. Sau khi PR merge vào main, trên main thì merge-base(HEAD, origin/main) chính là HEAD, nên `git show` trả về dq-enum-vocab.mjs mới. Bản mới đã đọc hằng sinh, và VL-AC-5 ở dòng 169 assert nó có 0 chỗ, nên phép đối chứng sẽ đỏ trong `pipeline npm test` (E6b gom scripts/*.test.mjs). Trên checkout không có origin/main (clone nông, máy khác) thì execFileSync ném lỗi. Như vậy kết quả phụ thuộc trạng thái ref của checkout đang chạy chứ không phải nội dung cây đang kiểm. Cần ghim sha diffBase, hoặc ghim nguyên văn đoạn cũ làm fixture.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Lint sổ từ vựng quét đỏ cả tệp làn ZCode trong pipeline/ và scripts/, trái hợp đồng «không quét làn ZCode»**
  Người dùng thấy gì: Khi bên thu thập dữ liệu viết một danh sách giá trị trong các tệp nhập hoặc thu của họ, bộ kiểm tra từ vựng sẽ báo đỏ dù đó là phần việc của họ. Hiện chưa có tệp nào gặp tình huống này nên chưa ai bị chặn.
  Căn cứ: Chưa ảnh hưởng ai ở hiện tại, chỉ gây vướng khi bên thu thập viết thêm mã; gặp thì thêm ngoại lệ hoặc sửa luật quét sau với chi phí thấp.
  file: `pipeline/lib/vocab-core.mjs`
  severity: medium
  Đề xuất: known-limits

- **dd_lookup của property_type lệch bảng ánh xạ RESO đã chốt (house→Townhouse; commercial ghi giá trị của trục khác)**
  Người dùng thấy gì: Hai loại hình (nhà riêng và thương mại) đang gắn với giá trị chuẩn RESO chưa khớp hẳn nghĩa tiếng Việt. Người dùng không thấy khác biệt trên màn hình, nhưng sau này cần một đợt chỉnh để khớp chuẩn.
  Căn cứ: Nhãn hiển thị vẫn đúng và không mất dữ liệu; sửa sau chỉ cần thêm một đợt cập nhật bảng tra, không gây hại cho người dùng hiện tại.
  file: `pipeline/mappings.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert «chuỗi có mặt» thay vì QUAN HỆ): khối CONTEXT.md chỉ kiểm từng nhãn có mặt đâu đó trong khối**
  Người dùng thấy gì: Bài kiểm khối thuật ngữ trong tài liệu từ vựng có thể không phát hiện nếu một nhãn bị gắn nhầm trục hoặc mất ở trục này nhưng còn ở trục khác. Người đọc tài liệu có thể thấy thuật ngữ thiếu hoặc sai chỗ mà không có cảnh báo.
  Căn cứ: Bộ sinh tự động nên hiếm khi sai kiểu này và lỗi chỉ nằm trong tài liệu, không ảnh hưởng dữ liệu hay cổng; làm chặt bài kiểm sau rất rẻ.
  file: `pipeline/scripts/vocab.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): bỏ qua tệp chép từ kit ở scripts/ không có đối chứng dương**
  Người dùng thấy gì: Bài kiểm chưa chứng minh được rằng thư mục các script thật sự được bộ kiểm tra từ vựng quét. Nếu ai đó vô tình bỏ thư mục này khỏi phạm vi quét, enum viết tay ở đó sẽ lọt qua mà không báo.
  Căn cứ: Rủi ro chỉ xảy ra khi có người sửa cấu hình quét, hậu quả là bỏ sót cảnh báo chứ không hỏng dữ liệu; thêm ca đối chứng sau rất rẻ.
  file: `pipeline/scripts/vocab-lint.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
