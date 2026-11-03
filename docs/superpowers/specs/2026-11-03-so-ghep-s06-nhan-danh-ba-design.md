# Số ghép S06: danh bạ và nhãn trên Invest — thiết kế

Hồ sơ `_acceptance/so-ghep-s06-nhan-danh-ba`. Mở từ Ngoài-1 và Ngoài-4 của `sdt-s06-ghep-tai-khoan` (Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 03/11). Đây là điều kiện trước khi áp 068.

## Vì sao

Vòng `sdt-s06-ghep-tai-khoan` đưa số S06 lên tin, gồm số trực tiếp và số ghép theo tài khoản. Khi soi lại có hai chỗ mô tả đã ký không còn đúng:

1. Số vào danh bạ ngay trong job. Job S06 chạy `transform-chotot` → `refresh-bait-gap` → `buocDem` → `dungNguoi`, và `dungNguoi` đọc cả S06. Lần ghi thật đầu tiên, số S06 thành bí danh `sdt`, hiện ở view `sellers`, băm lên cloud. OOS-2 trên thẻ ký nói ngược lại. Khi số ghép bị rút khỏi tin, bí danh không rút theo.
2. PR #274 đã vào main và đưa `sale_offers.seller_phone` lên cloud, lên Invest. Số ghép vì thế hiện như số thường, không nhãn. Mạnh duyệt Hỏi-3 ngày 02/11: số ghép chỉ hiện khi có nhãn chưa xác minh. `field_provenance` không lên cloud nên cloud không phân biệt được.

Hệ quả: áp 068 lúc này làm cả hai điều trên xảy ra. Mục tiêu vòng này là làm cho việc áp 068 an toàn.

## Số đo chỉ đọc, DB local 03/11

- Stg: 678 tin có số, 590 số khác nhau. Cả 590 số đều có ít nhất một tin trực tiếp trong `sale_offer_records`.
- S06 hiện: 48.499 bản ghi, 0 có số; 15.199 người theo tài khoản; 0 bí danh `sdt`; `sellers` 328 dòng, 0 dòng S06.
- `--thu` của vòng trước: 678 tin trực tiếp, 11.762 tin ghép.

Điều rút ra: **mọi số ghép đều có một tin trực tiếp cùng số**, nên số ghép không mang số mới nào vào danh bạ. Vì vậy không cần cơ chế rút bí danh nếu bí danh chỉ sinh từ số trực tiếp.

## Cách làm

### Danh bạ (Ngoài-1, Ngoài-4)

Danh sách dương: với S06, `rutDinhDanh` chỉ trả `sdt` khi `field_provenance.seller_phone.rule_id = 's06-so-tren-tin'`. Số ghép hay số mất dấu đều cho `sdt = null`. `SQL.tin` đọc thêm `field_provenance`. Kết quả:

- Bí danh và người theo SĐT của S06 chỉ sinh từ số trực tiếp. Số ghép bị rút thì danh bạ không có gì để rút. Bí danh không cần sửa, đúng luật 055 chỉ thêm.
- `sellers` không đổi định nghĩa: chỉ liệt số có bí danh, nên mỗi số ở đó có bằng chứng trực tiếp. `n_ads` vẫn tính cả tin ghép của số ấy, ghi rõ ở AC-3.
- `sellersThieu` bỏ qua tin S06 không mang dấu trực tiếp, nếu không phép đối chiếu của `nap-lai-nguoi` đỏ giả.

### Nhãn trên Invest

- Migration 070: `sale_offers` thêm cột cuối `seller_phone_inferred`, true khi `source = 'S06'`, có số và `rule_id` khác `s06-so-tren-tin`. Tính ngay trong view. Không thêm cột vào `sale_offer_records`, không ghi lại bảng, áp nhanh, đảo ngược rẻ.
- `CLOUD_ALLOW.sale_offers` thêm cột này; `field_provenance` vẫn không lên. Tệp `docs/ops/cloud-schema-catchup-<ngày>-so-ghep.sql` theo đúng khuôn của `tin-rao-tren-invest`.
- API: danh sách trả thêm `phoneInferred`; `/contact` trả thêm `inferred`. Không đổi khoá cũ, không đổi 404. Đọc cột qua `to_jsonb(o) ->> 'seller_phone_inferred'` nên cloud thiếu cột không làm câu lệnh lỗi; có số mà không đọc được giá trị thì coi là true.
- `OfferContact`: có số ghép thì kèm Badge «Chưa xác minh» trước và sau khi bấm.

### Bộ gán chờ nhãn

`ganSdtS06` đọc lại mỗi lượt xem `sale_offers` có cột nhãn chưa, như cách nó đọc phần giữ 068. Chưa có: không ghi số ghép mới, in `CHUA-AP-070`, số trực tiếp vẫn ghi, không ném lỗi. Vì thế áp nhầm 068 trước 070 không làm số ghép lên Invest không nhãn.

### Hỏng theo hướng đóng

Nhãn và danh bạ cùng dựa vào `field_provenance`, nên một migration ghi đè hàm phân xử có thể làm mất dấu (Ngoài-5). Mất dấu thì số S06 mang nhãn và không sinh bí danh, không bao giờ hiện như số chắc chắn. Phần còn lại của Ngoài-5, tin ẩn số giữ số ghép, vẫn là việc riêng.

### Năm mốc triển khai

Ghi ở đầu tệp catch-up. Người chạy: Mạnh.

1. gộp: PR #283 rồi PR này vào main. Cloud chưa có cột, mọi số hiện kèm nhãn, trang không lỗi.
2. kéo về: checkout chính ở máy thu kéo main.
3. áp cloud: khối ĐO TRƯỚC rồi khối ÁP. Áp trước khi kéo về thì leak gate của bản sync cũ dừng lượt đêm.
4. áp 070: `pg_dump` trước, áp trên máy thu, chạy một lượt sync, xem log không còn «lệch schema». Số trực tiếp hết nhãn.
5. áp 068: `pg_dump` trước, áp, để job ghi số, sync, kiểm trang Bán và Cho thuê.

## Điểm giáp với #283

E9 và AC-9 của `sdt-s06-ghep-tai-khoan` hứa `PII_EXCLUDE` còn loại `seller_phone`; #274 đã mở cột này. Hợp main vào #283 làm E9 đỏ. Việc này thuộc PR #283, trình Mạnh riêng, không nằm trong hồ sơ này.

## Không làm

- Nối người theo SĐT S06 vào người theo tài khoản (HD13 chỉ gộp S03, S05). Trang tri thức `nguoi-va-sdt` đã nêu phần lớn người theo SĐT là bản sao không có tin; S06 sẽ thêm khoảng 590 người như vậy. Đo và báo ở AC-9, xử ở vòng riêng.
- Áp 068, 070 lên DB máy thu, ghi thật, áp cloud: bước triển khai có `pg_dump`, Mạnh chạy.
- Ngoài-5 phần tin ẩn số giữ số ghép, Ngoài-6 (harness `s06-vung-moi`): việc riêng.
- Sửa số đếm `n_ads` trong `sellers`, nhãn cấp tin của hàng `s03-len-cong`, xác minh số bằng cách gọi.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: thẻ tin ở trang Bán hoặc Cho thuê → thấy Badge «Chưa xác minh» cạnh nút Xem số → bấm → số hiện thành link gọi, Badge còn nguyên.
- Biên: tin có số trực tiếp thì không có Badge; tin chưa có số giữ chữ «Chưa có số», không Badge.
- Lỗi và quay lại: lấy số lỗi thì nút Thử lại như hiện tại, Badge còn nguyên.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Ô liên hệ trên thẻ tin rao | Cho biết tin có số không, số có chắc không, và lấy số | Thẻ tin / link `tel:` |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-lien-he-chua-co-so | Ô liên hệ | «Chưa có số», không Badge | Không có việc |
| ST-lien-he-truc-tiep | Ô liên hệ | Nút «Xem số», không Badge | Bấm lấy số |
| ST-lien-he-ghep | Ô liên hệ | Badge «Chưa xác minh» + nút «Xem số» | Bấm lấy số |
| ST-lien-he-ghep-da-lay | Ô liên hệ | Badge «Chưa xác minh» + số thành link gọi | Gọi |
| ST-lien-he-ghep-loi | Ô liên hệ | Badge «Chưa xác minh» + nút «Thử lại» | Bấm lại |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Ở 320 px Badge và nút không tràn thẻ; Badge giữ cỡ mặc định, không tự đặt chiều cao.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `reui/badge` `warning-light` | dùng | Trạng thái dùng Badge `-light`, theo luật ReUI |
| `OfferContact` | mở rộng | Thêm một prop và một Badge, không đổi luồng lấy số |
<!-- UX-SPEC-TEMPLATE>>> -->
