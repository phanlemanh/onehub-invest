# db-volume-check-volume-khac-ten — tự kiểm live đo đủ bốn nhánh của `check_du_lieu`

Hàng P2 của đợt `dot0-cam-mau`. Gốc: Ngoài-10 và Ngoài-11 của hồ sơ `db-volume-live-ban-lui`. Ở Cổng Bằng chứng ngày
29/10, Mạnh chọn «mở hợp đồng mới» cho cả hai (`_acceptance/db-volume-live-ban-lui/decisions.jsonl` dòng
`d-20261029T125635Z-22` và `-23`). Giám sát giao hàng này cho P2; vùng là `scripts/db-volume-check.sh`.

## Hiện trạng

`check_du_lieu` (bất biến «dữ liệu DB local nằm trong volume `onehub_pgdata`») trả về một trong **bốn** kết quả:

| Nhánh | Điều kiện | Kết quả |
|---|---|---|
| không đọc được | `data_directory` rỗng | `FAIL không đọc được data_directory của one-invest-db` |
| đúng volume | mount volume tên `onehub_pgdata` chứa `data_directory` | `PASS data_directory <dd> dưới mount volume onehub_pgdata` |
| volume khác tên | mount volume chứa `data_directory` nhưng tên khác | `FAIL data_directory <dd> nằm trong volume <v> (cần onehub_pgdata)` |
| lớp ghi container | không mount volume nào chứa `data_directory` | `FAIL data_directory nằm trong lớp ghi container (…)` |

Ma trận 16 ô của `live-selftest` (hồ sơ `db-volume-live-ban-lui`, AC-4) chỉ dựng hai giá trị trên trục dữ liệu: «đúng
volume» và «lớp ghi container». Bởi vậy hai nhánh «volume khác tên» và «không đọc được» không có phép thử nào. Ai sửa
nhầm để nhánh «volume khác tên» báo xanh thì tự kiểm vẫn ĐẠT. Đó chính là Ngoài-10; Ngoài-11 là cùng lỗi ấy nhìn ở góc
«tuyên quét lớp mà thiếu phần tử».

## Thiết kế

1. **Khối «nhánh dữ liệu» mới trong `run_live_selftest`, đặt sau ma trận 16 ô và không đụng tới nó.** Khối có 4 ô,
   mỗi ô một nhánh của `check_du_lieu`. Mọi ô chạy qua `o_live`, tức đúng bộ đọc mà `live` thật dùng. Trục bản lùi cố
   định ở trạng thái xanh (`mot-dung`, giờ `sau` hạn) nên màu của ô chỉ do nhánh dữ liệu quyết. Kỳ vọng viết trước:
   - `dung` → xanh, ghim `PASS data_directory <dd> dưới mount volume onehub_pgdata`
   - `khac-ten` (volume `db_pgdata` gắn `/var/lib/postgresql`) → đỏ, ghim
     `FAIL data_directory <dd> nằm trong volume db_pgdata (cần onehub_pgdata)`
   - `gan-data` → đỏ, ghim `FAIL data_directory nằm trong lớp ghi container`
   - `khong-doc` → đỏ, ghim `FAIL không đọc được data_directory của one-invest-db`. `data_directory` của ô này KHÔNG
     viết tay: tách lệnh đọc của `live_doc` thành hàm `doc_dd <container>` (`live_doc` gọi `doc_dd "$DB_THAT"`), rồi ô
     gọi `doc_dd` trên một container chắc chắn không tồn tại (`one-invest-db-khong-co-$$`). Đây là round-trip từ chính
     đường đọc thật: truy vấn lỗi phải sinh chuỗi rỗng (gap-probe P2).

   Sau đó đếm ô và ghim `PASS nhánh dữ liệu đủ 4 ô`.
2. **Ma trận 16 ô giữ nguyên từng byte** (`PASS ma trận đủ 16 ô`). Hồ sơ đã ký `db-volume-live-ban-lui` hứa đúng 16 ô
   (AC-4). Ghép trục dữ liệu 4 giá trị vào ma trận thì thành 32 ô, tức đổi lời một tiêu chí đã ký. Hai trục độc lập
   (`o_live` chỉ gọi lần lượt hai hàm), nên tích Descartes không bắt thêm lỗi nào mà khối 4 ô không bắt.
3. **Phá thử bộ đọc ở chế độ `mutation`.** Chép `db-volume-check.sh` sang thư mục tạm, sửa nhánh «volume khác tên» từ
   `fail` thành `pass`, rồi chạy `live-selftest` của bản sao:
   - bản sao phải đỏ, ghim `ô dữ liệu khac-ten lẽ ra đỏ`;
   - `live-selftest` của bản lành phải xanh, ghim `PASS nhánh dữ liệu đủ 4 ô`.

   Lệnh sed không đổi byte nào thì `mutate` tự báo đỏ, giống mọi đột biến khác của tệp. Hai dòng mới chỉ được *thêm*
   vào đầu ra `mutation`, sáu dòng đỏ cũ mà `db-vao-volume` E6 ghim vẫn giữ nguyên.
4. Không thêm chế độ hay khoá executor mới: dùng lại `db_volume_live` và `db_volume_mutation` sẵn có, nên không chạm
   `_acceptance/config.yaml`.

## Câu hỏi cho Mạnh (Hỏi-1): phép phá thử bộ đọc đặt ở đâu?

| Lối | Làm gì | Giá |
|---|---|---|
| **(a) — khuyến nghị** | Đặt trong chế độ `mutation` sẵn có (mục 3 trên) | Đầu ra `mutation` thêm hai dòng; chế độ này gánh thêm vai «phá bộ đọc live» |
| (b) | Mở chế độ mới `live-mutation` + khoá executor `db_volume_live_mutation` | Phải xin `cham-tep` cho `_acceptance/config.yaml`; thêm một chế độ phải giữ đồng bộ |

Bản nháp theo (a). Chọn (b) thì E3 đổi `cmd` sang khoá mới; nội dung phép thử giữ nguyên.

## Ngoài phạm vi

- Nhánh con «mount đúng bằng `data_directory`» (`Destination == dd`) của bộ chọn mount. Ô `dung` chỉ thử nhánh «mount là
  thư mục cha». Để Later: không có Ngoài-n nào nêu nó.
- Ngoài-6 và Ngoài-12 của `db-volume-live-ban-lui` (ô «hai bản đều dừng đúng» chỉ ghim dòng của một bản): Mạnh đã chọn
  ghi Known limits.
- Mọi Known limits khác của hai hồ sơ trước.

## Hồi quy

Vòng này đổi `scripts/db-volume-check.sh`, nên bằng chứng của hai hồ sơ đã ký `db-vao-volume` và `db-volume-live-ban-lui`
sẽ cũ. Ở S3 phải ghim lại cả hai trên cây sau vòng (xin lượt `ghim-lai`; tệp hồ sơ của chúng nằm ngoài vùng hàng, nên đã
xin `cham-tep`).
