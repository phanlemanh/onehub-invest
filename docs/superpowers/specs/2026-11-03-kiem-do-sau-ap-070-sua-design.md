# Sửa kiểm và đo trước khi áp 070

Hồ sơ `kiem-do-sau-ap-070-sua`. Mạnh chọn «mở hợp đồng mới» cho Ngoài-13 và Ngoài-14 của `so-ghep-s06-nhan-danh-ba`. Giám sát chốt làm xong hàng này rồi mới gộp #294 và áp 070, để nhãn sai trên cloud ít giờ nhất. Nhánh dựng trên `174c302a`.

## Hai lỗi

1. **Kiểm `danh-ba-sdt:n3` đỏ giả.** N3 so `sellers` với số khác nhau trên tin. `sellers` chỉ liệt số có bí danh, mà số S06 chỉ nằm trên tin ghép hay tin mất dấu không sinh bí danh. Khi có số như vậy, N3 đỏ dù không có gì hỏng. Hôm nay chưa xảy ra: 590/590 số đều có tin trực tiếp.
2. **Nạp lại migration cũ lỗi sau 070.** 044, 045, 059, 061 dựng view bằng `CREATE OR REPLACE VIEW sale_offers AS SELECT * …`. View sau 070 có thêm cột cuối, nên câu ấy báo «cannot drop columns from view».

## Số đo trên DB thử (03/11, `174c302a`)

Hai bản chép `oneinvest`, một áp 070 và 068, một không. `npm test` của pipeline 457/457 xanh trên bản đã áp.

| Bộ | Chưa áp | Đã áp | Do 070 |
|---|---|---|---|
| `dac-trung-s06.itest` | 8/8 | 0/8 | có |
| `dac-trung-s06-vocab-db` | thoát 0 | thoát 1 | có |
| `do-dac-trung-s06` | 1 dòng đỏ (DT-AC-8 `CLOUD_ALLOW`) | sập ở câu view | có |
| `nap-lai-db.itest` | 12/13 (ND-AC-1) | 2/13 | có |
| `phat-bieu-db.itest` | 15/16 (PD-AC-8) | 1/16 | có |
| `trang-thai-chao.itest`, `bac-du-lieu.itest`, `idem-059` | đỏ | đỏ | không |
| `gop-trung-s03.itest`, `danh-ba-nguoi.itest` | đỏ một ca | đỏ một ca | không |

Đo lại trên bản chép mới chưa áp 070, `do-dac-trung-s06` đỏ thêm DT-AC-7 lượt gốc: đối chứng này cần cột còn rỗng, mà `oneinvest` nay đã đầy cột (100%). Đỏ này do dữ liệu, không do 070.

Ba bộ đầu ở nhóm «không» đỏ vì `field_assertions_field_chk`: 059 siết CHECK trên dữ liệu đã có mã của 061, nên dừng trước khi tới câu view.

## Cách sửa

**N3.** `SQL_N3` đếm số trên tin đáng có dòng `sellers`: tin qua vị từ `TIN_VAO_DANH_BA` (hằng dùng chung với `sellersThieu`, số S06 phải mang dấu `RULE_TRUC_TIEP`), hoặc số đã có bí danh. Vế bí danh chặn đỏ giả chiều ngược: bí danh không rút, nên một số có thể đã có bí danh rồi chỉ còn tin ghép, và `sellers` vẫn liệt nó. N3 đỏ khi và chỉ khi có số đáng có bí danh mà chưa có. Không dùng cột `seller_phone_inferred`, vì kiểm này chạy cả trên DB chưa áp 070.

**Nạp lại.** `lib/nap-view-song.mjs` có `sqlNapLai(client, sql)`: view đã có cột của 070 thì bỏ đúng câu ấy, chưa có thì giữ nguyên từng byte. Nối vào `napDacTrung`, `nap-lai-db.itest`, `phat-bieu-db.itest`. Bỏ câu là an toàn: 070 liệt cột tường minh sau khi 061 thêm xong cột, nên view đã đủ cột của cả bốn tệp.

Không chọn `DROP VIEW … CASCADE`: kéo đổ `sellers` và giữ khoá độc quyền trên DB dùng chung khi test chạy mặc định trên `oneinvest`. Không chọn SAVEPOINT nuốt lỗi: cả tệp là một lệnh, phần sau câu view sẽ không chạy. Không chọn migration mới: 044 đến 061 đã commit, và lỗi chỉ ở đường nạp lại của test.

## Không làm

- Không sửa ba bộ đỏ vì CHECK: đỏ sẵn trước 070, câu view của chúng chưa từng chạy tới. `sqlNapLai` đã phủ văn bản 059; ai sửa lớp CHECK thì nối thêm một dòng.
- Không sửa các ca đỏ không do 070: DT-AC-8 `CLOUD_ALLOW` và ND-AC-1 là thước cũ; PD-AC-8, GT-AC-4, `danh-ba-nguoi.itest` AC-8 đỏ giống nhau trước và sau 070, chưa tra nguyên nhân.
- Không sửa `khoaNguon` (`khoa-nguon-nghi-khi-ddl-sua`, làm sau).
- Không áp 068, 070 lên `oneinvest` hay cloud; giám sát xin Mạnh riêng.
