# Ô đường viết không dấu so như dạng có dấu — design

Hàng `duong-thang-n-khong-dau` (dãy U2). Nguồn là Ngoài-4 của `chuan-hoa-o-duong`, cộng ba giới hạn cùng lớp ghi ở mục
Notes của hồ sơ ấy: Ngoài-2, Ngoài-3, Ngoài-5. Mạnh duyệt Cổng Đáng ngày 01/11: «Làm, gộp cả ba».

## Vấn đề

`khoaDuong` giữ dấu tới bước cuối, vì nhánh tiền tố «Đường/Phố» của HD2 cần dấu để phân «Đường» với «Dương». Có hai chỗ
trong hàm chỉ nhận chữ có dấu:

1. **Ngoại lệ «tháng <số>»** (`/^tháng\s+\d/u`). Với «30 thang 4», số 30 bị coi là số nhà, nên khoá sinh thêm cách đọc
   «thang 4». Hệ quả: «30 thang 4» ↔ «2 thang 4» ra Khớp (ghép nhầm hai đường), và «3 thang 2» ↔ «Tháng 2» cũng ra Khớp.
2. **Phép thử «ô chỉ có từ vị trí»** (`/^(?:số|ngõ|ngách|hẻm|kiệt)?$/u`). Ô chỉ ghi «Ngo» hay «Hem» không bị coi là thiếu
   tên đường mà sinh khoá «ngo», nên ra Lệch và bị loại oan.

## Cách làm

Chạy hai phép thử trên chuỗi đã `boDau`, thay vì trên chuỗi còn dấu: ô chỉ có từ vị trí khớp `/^(?:so|ngo|ngach|hem|kiet)?$/`
trên `boDau(t)`, và ngoại lệ «tháng <số>» khớp `/^thang \d/` trên `boDau(phần sau số)`. Cụm vị trí ở đầu chuỗi vốn đã nhận
cả hai dạng có dấu và không dấu. Không thêm hàm mới. Sửa trong `app/src/lib/ops/review-can-cu.ts` rồi chép nguyên văn sang
`agent/src/agents/judge-entity.ts`.

Lối khác là liệt kê thêm dạng không dấu vào hai regex còn dấu (`tháng|thang`). Lối này bị loại vì không gỡ được ô gõ sai
dấu («Ngỏ», «Hẽm»), và phép đo AC-6 trên dữ liệu thật sẽ đỏ đúng ở những ô ấy. Thử trên `boDau` thì mọi biến thể dấu đều
quy về một dạng.

Bất biến đo được: tập khoá của một ô đường không đổi khi bỏ dấu, trừ các ô mà phần còn lại sau khi bỏ cụm vị trí và số nhà
mở đầu bằng «duong »/«pho ». Tiền tố không dấu ở các ô ấy cố ý giữ hai cách đọc theo HD2. Thử nghiệm trên DB máy thu ngày
01/11: 1.203 giá trị đem so, 1.542 giá trị bị loại, 0 lệch sau khi sửa.

## Không làm

- Ngoài-1 («Đường 2» ↔ «Đường 3» ra Thiếu): lớp khác.
- Tên dự án trong ô đường.
