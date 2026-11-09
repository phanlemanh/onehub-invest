# DO1 giữ dấu đổi thang suốt ngày lập mốc — thiết kế

Hàng `do1-giu-dau-doi-thang` (dãy N1, đợt dot0-cam-mau). Gốc: mục Ngoài-4 của `thang-bac-moi-b0-b5`. Ở Cổng 2 ngày
10/11, Mạnh chọn «mở hợp đồng mới» cho mục này. Giám sát gộp thêm Ngoài-5: sửa thước TB-AC-11, vì 087 đã áp trên DB máy thu
(N1-53).

## 1. Lỗi

`pipeline/do-hang-ngay.mjs` chạy trong `scripts/cloud-sync.sh` mỗi 15 phút. Ngày đổi thang, lượt đầu của ngày gặp
`data_level_unit` còn dòng `thang-2310`, nên nó lập mốc lại: ghi dòng `do1-chuyen-bac` dạng `skip` với `ly_do: doi-thang`,
rồi thay bảng đơn vị bằng thang mới.

Lượt thứ hai cùng ngày gặp bảng đơn vị đã toàn thang mới, nên rơi vào nhánh thường:
- tính chuyển bậc giữa lượt một và lượt hai, ghi `data_level_change` cho chính ngày đổi thang;
- xoá dòng `do1-chuyen-bac` của ngày (lệnh DELETE theo `ngay`), rồi ghi dòng `pass` mới.

Dấu `doi-thang` mất. `/ops/quality` thôi hiện câu «lần hạ một lần» và hiện một phần bảng chuyển bậc của ngày đổi thang.
Người đọc dễ hiểu nhầm đó là tụt bậc. Ca lập mốc lần đầu (bảng đơn vị rỗng) bị cùng lỗi: lượt hai cùng ngày ghi dòng
chuyển và mất dấu `lap-moc`.

Thước TB-AC-5 cũ có chạy lại DO1 cùng ngày. Nhưng giữa hai lượt không đơn vị nào đổi bậc, và thước không đọc dấu ở lượt
hai, nên lỗi lọt.

Hiện trạng máy thu, đọc lúc 06:13–06:19 ngày 10/11 (giờ VN; chưa có ảnh chụp `thang-0811` nào — ngày áp sẽ là ngày bac-du-lieu
ghi ảnh chụp thang mới đầu tiên, dự kiến 10/11):
- 087 đã áp, `data_level_unit` còn 76.124 dòng `thang-2310`;
- `data_level_change` ngày 10/11 đã có 1.364 dòng do code cũ ghi lúc 05:56;
- cloud-sync chạy code mới từ 06:11.

Lỗi sẽ xảy ra thật ngay trong ngày. Em đã báo giám sát (N1-54) và khuyên tạm bỏ bước DO1.

## 2. Thiết kế

**Ngày lập mốc giữ là ngày lập mốc suốt cả ngày.** Trước khi so bậc, DO1 xác định `ngay` có phải ngày lập mốc không, theo
thứ tự (luật đầu tiên khớp thắng):
1. Đã có dòng `do1-chuyen-bac` của `ngay` ở trạng thái `skip`, `ly_do ∈ {lap-moc, doi-thang}` → giữ đúng `ly_do` ấy.
2. Bảng đơn vị rỗng → `lap-moc` (luật cũ; đứng trước ngày áp để DB mới dựng không bị gọi nhầm là đổi thang).
3. Bảng còn dòng thang cũ → `doi-thang` (luật cũ).
4. `ngay` bằng ngày áp thang (`tuNgayThang`, ngày nhỏ nhất có ảnh chụp thang mới — định nghĩa AC-5 của hồ sơ trước) → `doi-thang`.
   Lo ca dấu đã bị lượt cũ xoá (máy thu nhận bản sửa trễ trong ngày).
5. Còn lại → so như thường.

Bảng 1 — ma trận viết trước (bảng đơn vị × ngày áp × dấu của ngày → nhãn):

| Bảng đơn vị | Ngày áp | Dấu của ngày | Nhãn | AC |
|---|---|---|---|---|
| rỗng | = D · khác D · không có | không | `lap-moc` | AC-3 |
| thang cũ | = D · khác D · không có | không | `doi-thang` | AC-1 |
| thang mới | = D | không | `doi-thang` | AC-4 |
| thang mới | khác D | không | so thường | AC-2, AC-4 |
| bất kỳ | bất kỳ | `lap-moc` / `doi-thang` | giữ dấu ấy | AC-1, AC-3 |

Ngày lập mốc, mọi lượt đều:
- ghi lại dòng `skip` cùng `ly_do`, `don_vi` của lượt này, kèm `thang`;
- xoá mọi dòng `data_level_change` của chính ngày ấy. Đây là Hỏi-1 (xoá dữ liệu, khó đảo), xem §4; nhánh «giữ» chỉ không ghi thêm.
- thay `data_level_unit` như cũ, để ngày kế so với trạng thái cuối của ngày lập mốc.

**Lệnh sửa ngày đổi thang đã qua.** `node pipeline/do-hang-ngay.mjs --sua-ngay-doi-thang [--write]`. Ngày đổi thang đã qua
mà còn dòng chuyển bậc, hoặc mất dấu, thì DO1 thường không sửa được, vì DO1 chỉ chạy cho ngày hiện tại. Lệnh này:
- lấy ngày đổi thang = `tuNgayThang`;
- in ngày D và số dòng; đã có dấu `doi-thang` ở một ngày khác D thì từ chối (thoát 2) và in hai ngày — chặn ca ngày áp lệch
  ngày đổi thang thật;
- xoá `data_level_change` của đúng ngày đó, và chỉ của ngày đó (Hỏi-2; nhánh «giữ»: bỏ bước xoá);
- ghi lại dòng `do1-chuyen-bac` `skip` `doi-thang` của ngày đó, kèm `thang`;
- không đụng `data_level_unit`, không đụng ngày nào khác.

Không cờ thì chạy trong ROLLBACK và in số dòng sẽ xoá. `--write` mới ghi. Chưa áp 087, hoặc chưa có ảnh chụp thang mới, thì
lệnh in một dòng có tên và thoát 0, không ghi gì. Chạy `--write` trên máy thu là lời riêng của Mạnh sau khi gộp, có pg_dump
trước (OOS-2).

**Thước TB-AC-11.** DB của lượt chép từ máy thu, nên nay đã có 087 và điều kiện «lược đồ chưa áp 087» đỏ vĩnh viễn. Thước
mới dựng lược đồ cloud ngay trong giao dịch:
- tập đối tượng suy từ tệp: hàm có `CREATE … FUNCTION` trong 087 mà không migration trước nào tạo (hôm nay: `offer_located`,
  `offer_unit_key`, `unit_data_level`, `data_level_units`; `offer_data_level` có từ 056 nên giữ), cộng cột `ADD COLUMN` của 087
  (`scale` ở hai bảng); DROP trong giao dịch;
- chèn tường minh một dòng DO1 mang `thang` (đối chứng dương: khối hiện dòng thang), rồi một dòng đời trước không `thang`
  mới hơn — khối không hiện;
- chiều đỏ là đột biến chính câu truy vấn bản ghi của app (bọc hàm query, đổi `o.offer_id` đầu tiên thành
  `offer_located(o.offer_id)`), mong lỗi 42883;
- kiểm như cũ, rồi ROLLBACK.

App không gọi hàm nào của 087 (`levelOf` tính trong TS), nên giả lập này đúng với cloud. Riêng dòng DO1 từ máy thu: cloud
nhận `dq_check_results` qua sync, nên trên cloud sẽ có dòng mang `thang`. Đó là hành vi đúng, AC-7 của hồ sơ trước đã đo.

## 3. Vật chạm

- `pipeline/do-hang-ngay.mjs`: hàm xác định ngày lập mốc; dọn `data_level_change` ngày lập mốc; lệnh
  `--sua-ngay-doi-thang`; đột biến cho chiều đỏ.
- `pipeline/scripts/do-hang-ngay-doi-thang.itest.mjs` (mới): thước DD-AC-1…5, DD-AC-8, chạy trên DB của riêng lượt, 087
  trong giao dịch.
- `app/tests/thang-bac-db.itest.tsx`: sửa TB-AC-11 (DD-AC-7); thêm ca DD-AC-6, gồm DO1 thật hai lượt cùng ngày, `loadDo1`
  và khối «Đo hằng ngày».
- `_acceptance/config.yaml`: thêm `executors.test.do1_dd`.
- `pipeline/CLAUDE.md`: dòng `do-hang-ngay.mjs` thêm lệnh sửa.

Không đổi giao diện. `app/src/app/ops/quality/**` có trong vùng, nhưng không chạm: khối DO1 đã đọc `ly_do` và `thang`.
Không migration.

## 4. Câu chỉ người có

- **Hỏi-1 (khó đảo: xoá dữ liệu).** Ngày lập mốc, mỗi lượt DO1 xoá mọi dòng `data_level_change` của chính ngày ấy, kể cả
  dòng có sẵn trước bản sửa (máy thu: 1.364 dòng code cũ ghi sáng 10/11, cộng dòng các lượt sau). Khuyến nghị: xoá — bảng do
  DO1 tự tính, AC-5 của hồ sơ trước đã chốt «ngày đổi thang không có dòng chuyển», và dòng thang cũ lẫn vào ngày đổi thang
  là thứ làm người đọc tưởng tụt bậc. Lối khác: giữ dòng có sẵn, chỉ không ghi thêm — giá: ngày 10/11 trên `/ops/quality`
  vẫn hiện 1.364 dòng chuyển thang cũ dưới dấu «đổi thang». Ảnh hưởng AC-4, AC-5.
- **Hỏi-2 (khó đảo: xoá dữ liệu).** Lệnh `--sua-ngay-doi-thang --write` xoá dòng chuyển của ngày đổi thang đã qua. Khuyến
  nghị: xoá, cùng lý do Hỏi-1; mặc định không ghi, `--write` chạy trên máy thu vẫn là lời riêng (OOS-2). Lối khác: lệnh chỉ
  ghi lại dấu — giá: phải dọn tay bằng SQL nếu sau này muốn sạch. Ảnh hưởng AC-8.

## 5. Đặc tả UX

Bỏ, vì không đổi giao diện (dòng descope trong sổ). Câu hiển thị của khối DO1 giữ nguyên. Hàng này chỉ làm dấu còn đó để
khối hiện được nó.
