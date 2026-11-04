# Gắn nhãn theo từng nhóm S03 — thiết kế (GC0 `gan-nhan-theo-nhom-s03`)

Ngày: 2026-11-04 · Hàng: GC0, đợt `gan-can-s03-0411` · Hạng: T3 (chạm `db/migrations/**`, `app/src/app/api/v1/ops/**`) ·
Cổng Đáng: `build`, Mạnh 04/11 «Làm luôn GC0» · Nền: PL7 `man-gan-nhan-mu`, `docs/plan/pham-vi-gan-can-s03-0411.md`, ROADMAP §3 mục 30.

## Bài toán

Đo 04/11: `eval_labels` có 0 nhãn người; số độ đúng đều do tác tử Claude gắn. Mạnh mở lượt thử và thấy ba chỗ hỏng:

1. Chỉ nhìn chữ thì không biết tin thuộc đâu: `RB` là Rainbow, nhóm mặc định Grand Park. 2.629/3.583 tin căn hộ không nêu dự án trong chữ.
   Màn đang bảo «ghi theo đúng chữ của tin», nên điều cần dạy cho máy bị mất.
2. Thiếu trường: phân khu, trục, tầng, số WC, cờ «+», bài nhiều căn, người bán, SĐT. Cột WC của S03 đang trống toàn bộ.
3. Không có chỗ ghi lý do, nên có đáp án mà không biết vì sao.

Hàng này mở màn để Mạnh và đội gắn theo từng nhóm và thống kê trường hợp. `GCQ1` dùng kết quả để viết quy ước; `PL13`, `PL20`, `GC2` dùng tập nhãn để chấm.

## Quy tắc gắn mới

Nhãn là **điều người trong nhóm hiểu**, không chỉ điều chữ bài nói. Mỗi giá trị ghi một căn cứ: chữ bài, ngữ cảnh nhóm hay kiến thức nghề.
Chỉ khi người trong nhóm cũng không suy ra được mới chọn «Không suy ra được» (mã `not_stated` giữ nguyên). Bài có trường không đọc được từ chữ thì bắt buộc ghi lý do.

Vì chưa có nhãn người nào nên đổi nghĩa này không làm lẫn dữ liệu cũ. `eval-classify` đọc cùng bảng; với `project`, `building` nó sẽ chấm máy theo chuẩn cao hơn, đúng ý đồ của chuỗi GC.

## Phạm vi

1. **Lưu** — migration mới (số do sổ migration cấp, 072, LL đã cấp trong sổ), chỉ ở máy thu:
   - `eval_labels.field` nhận thêm: `subzone`, `stack`, `floor`, `bathrooms`, `bedrooms_plus`, `multi_unit`, `seller_name`, `seller_phone`.
   - `eval_labels.basis`: `chu_bai` · `ngu_canh_nhom` · `kien_thuc_nghe`; NULL ở dòng `not_stated` và dòng đời trước.
   - `eval_label_items.stratum`: `unit_code` của nhóm trong sổ S03; NULL ở lát đời trước.
   - `eval_label_reasons (item_id, labeler_id, reason, created_at)`: một lý do cho một người trên một bài.
   - `eval_label_cases`: chỉ thêm, gồm `item_id`, `labeler_id`, `case_kind`, `note`, `the_nhom_dung` (đúng, sai, chưa xét), `created_at`.
   - View `eval_label_agreement` thêm tám trường mới.
2. **Mẫu theo nhóm** — `label-sample.mjs --lat s03-theo-nhom --seed <s> --theo-nhom --moi-nhom-lon 30 --moi-nhom-nho 5 --so-nhom-lon 10`. Xếp nhóm theo số nội dung khác nhau, giảm dần, hoà theo `unit_code`; chọn tất định trong từng nhóm bằng `chonMau`, 20% gắn trùng tính trong từng nhóm. Nội dung trùng thuộc về nhóm xếp trước, nhóm sau bù từ phần còn lại; lệnh in số nội dung bị bỏ vì trùng và nhóm thiếu. Chạy lại không thêm dòng.
3. **Màn `/ops/labels`** — lát mặc định đổi sang `s03-theo-nhom` (giữ `?lat=` cho lát cũ); thêm bộ chọn nhóm kèm tiến độ; biểu mẫu theo **bản D** Mạnh chọn 04/11 (mục dưới): năm khối hai cột trong một `Frame stacked`, mỗi ô có căn cứ, mặc định «Chữ bài»; ô Lý do trong biểu mẫu. Dự án, phân khu, toà, trục, diện tích khai «Chữ bài» mà chữ bài không có giá trị đó thì bị từ chối, để căn cứ không bị để nhầm mặc định.
4. **Lượt hai** — sau khi lưu mới hiện bảng «Anh gắn · Bộ đọc · AI đọc», thẻ nhóm kèm câu «thẻ đúng không», ô loại trường hợp và ghi chú. Bỏ qua được. Không có đường đổi nhãn đã lưu. Bài có nhiều tin thì so với tin có `offer_id` nhỏ nhất và nói rõ tổng số tin; người gắn gắn căn đầu tiên theo thứ tự chữ.
5. **Bảng trường hợp theo nhóm** trên cùng màn, chỉ có số. Chữ lý do và ghi chú không hiện ở bảng, để người gắn trùng không bị dẫn dắt; chỉ đọc qua lệnh `pipeline/label-cases.mjs --lat <lát> [--nhom <mã>] --json`, xuất lý do, trường hợp, trả lời thẻ cho `GCQ1`, không mang định danh người gắn.
6. **Từ vựng** — «Căn cứ nhãn», «Trường hợp», «Phân khu» nếu thiếu, trong `CONTEXT.md`.

## Bố cục đã chọn: bản D

Mạnh chọn 04/11 sau khi so bốn bản thử trên dữ liệu giả (`_acceptance/gan-nhan-theo-nhom-s03/figures/so-sanh-bon-cach.html`, `design-pass.md`). Mẫu mã: nhánh cục bộ `spike/man-gan-nhan-3-cach`, không đẩy.

- Khung `Frame stacked` theo khuôn `@reui/form-2`, không cài block; đầu Frame dính giữ bài gốc nguyên văn, gấp sau ba dòng, kèm một dòng chú giải căn cứ.
- Năm khối hai cột ở `xl`, một cột dưới đó. Mỗi hàng: nhãn · giá trị · căn cứ · ô «Không suy ra được». Lựa chọn ngắn dùng `ToggleGroup`, bấm một lần; số và chữ dùng `Input`.
- Trạng thái đã chọn dùng nền `primary` qua `className` ở chỗ gọi, không sửa tệp vendor. Ô không suy ra được thì căn cứ không còn trạng thái chọn.
- Chân Frame dính giữ tiến độ ô đã điền và nút Lưu; ô Lý do ở cột trái.
- Số đo bản thử ở 1440×900: đủ 17 ô, Lý do và nút Lưu không cần cuộn, biểu mẫu 657 px, 14 lần bấm cho tin RB so với 24 của khuôn PL7 nối thêm trường.

## Loại trường hợp khởi đầu

`bi-danh` viết tắt · `mac-dinh-nhom` dự án mặc định theo nhóm · `ma-trung-du-an` mã trùng giữa dự án · `nhieu-can` · `che-tang` · `so-ngoai-bai` số điện thoại ngoài chữ · `khong-phai-tin-rao` · `the-nhom-sai` · `khac`.
Danh sách lấy từ phần đọc 30 tin và các ca Mạnh nêu ngày 04/11; lượt thử sẽ sửa nó.

## Lựa chọn đã cân

- Thêm trường theo khuôn một dòng một trường, đúng lý do của PL7, chỉ đổi ràng buộc `CHECK`.
- Lý do và trường hợp ở bảng riêng: trường hợp có nhiều dòng cho một bài và phải chứng được bảng nhãn không đổi; lý do ở `eval_labels` sẽ lọt vào view đồng thuận và bộ chấm.
- Máy đọc lấy ở `sale_offers` qua `post_ids` và `silver_labels` của bài. Chỉ route lượt hai đọc các bảng này, và route kiểm người gọi đã lưu bài đó. Tách truy vấn lượt hai sang tệp riêng để phép đo «mù» giữ được: tệp của lượt một vẫn không đọc bảng máy.
- Đồng thuận 20% tính theo từng nhóm, nên nhóm nhỏ 5 bài có 1 bài trùng; đo chung theo lát vẫn dùng view cũ.
- SĐT lưu dạng `+84…` như ROADMAP §3 mục 24.
- Không nhập bảng tính lượt thử: Mạnh đang dùng nó để lấy số phút và lý do đầu tiên; `research-local` không vào đường đo.

## Hỏi Mạnh ở Cổng Phạm vi

- **Hỏi-1, thẻ nhóm hiện lúc nào.** Khuyến nghị: chỉ hiện ở lượt hai. Hiện từ lượt một thì nhãn bị thẻ dẫn dắt, và `GCQ1` sẽ đo thẻ bằng chính nhãn đã nhìn thẻ (phép thử 02/11 đã vướng đúng lỗi này: 114/115 chỉ đo mức làm theo thẻ). Giá: người mới vào đội phải tự biết nhóm. Câu giao của hàng và bản đề xuất trước viết «cùng thẻ nhóm», nên đây là thay đổi cần anh gật.
- **Hỏi-2, đội làm ở đâu.** Khuyến nghị: vòng này chỉ trên máy thu, đúng ranh giới bảng nhãn. Ai không ngồi máy thu thì mở việc riêng về đường truy cập; đưa nhãn lên cloud đi ngược ADR-0015 và cần sửa luật.

- **Hỏi-3, đã xong.** Mạnh xem bốn bản bấm được và chọn bản D.
- **Hỏi-4, nhãn trong bảng tính.** Khuyến nghị: không nhập; 30 bài thử chỉ cho số phút và lý do đầu tiên, về sau nhóm đó gắn lại trên màn. Lối khác: thêm lệnh nhập một lần, tốn thêm việc và nhãn thử không có căn cứ từng ô.
- **Hỏi-5, ngưỡng sống chết** ở ô cơ hội là máy đề xuất, anh chưa duyệt riêng. Khuyến nghị: giữ nguyên, sống là gắn trọn 30 bài một nhóm trên màn và ra danh sách viết quy ước.
- **Hỏi-6, cỡ mẫu.** Mức đề xuất là 380 bài, thêm khoảng 76 lượt gắn trùng, tức khoảng 456 lượt × 17 ô, khoảng 7.750 ô. Khuyến nghị: lệnh nhận tham số, chưa chốt con số; đo số phút trên một nhóm rồi mới chốt.

## Ngoài vòng

Quy ước nhóm (`GCQ1`) · ghi suy ra (`GCQ2`) · dải diện tích (`GC2`) · nhập bảng tính lượt thử · gắn từ xa · sửa, xoá nhãn đã lưu · nhãn khoảng diện tích (ghi vào Lý do) · S05, S06.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: menu Ops «Xử lý › Gắn nhãn» → `/ops/labels` → chọn nhóm → đọc bài, điền năm khối, ghi lý do khi cần → «Lưu và xem máy đọc» → lượt hai: so với máy, ghi trường hợp → «Sang tin kế» (điểm ra: nhóm hết tin → chọn nhóm khác hoặc xem bảng trường hợp).
- Biên: lát chưa lấy mẫu; nhóm đã gắn hết; tin gắn trùng chờ người thứ hai; bài không có bản máy đọc; nhóm chưa có thẻ; vai viewer; trên cloud.
- Lỗi & quay lại: thiếu lý do hay sai khuôn → lỗi dưới đúng ô, giữ chữ đã gõ; mất kết nối khi lưu → Alert «Lưu lại» như PL7; lưu trường hợp lỗi → nhãn đã an toàn, «Thử lại» hoặc sang tin kế.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| `/ops/labels` Gắn nhãn | gắn đủ trường cho một bài của nhóm, rồi so với máy và ghi trường hợp | menu Ops / tin kế, bảng trường hợp |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-labels-loading | Gắn nhãn | Skeleton đúng bố cục | chờ |
| ST-labels-empty | Gắn nhãn | «Chưa có tin nào của lát để gắn» + lệnh lấy mẫu | chạy lệnh ở máy thu |
| ST-labels-ready | Gắn nhãn | bộ chọn nhóm, bài gốc, năm khối, Lý do | điền, Lưu |
| ST-labels-invalid | Gắn nhãn | lỗi dưới ô sai, kể cả «Có trường không từ chữ bài — ghi lý do» | sửa, Lưu lại |
| ST-labels-review | Gắn nhãn | bảng Anh gắn · Bộ đọc · AI đọc, thẻ nhóm, ô trường hợp | ghi hoặc bỏ qua |
| ST-labels-no-machine | Gắn nhãn | ở cột máy: «Máy chưa đọc bài này» | ghi trường hợp |
| ST-labels-no-card | Gắn nhãn | «Nhóm chưa có thẻ» | ghi trường hợp |
| ST-labels-group-done | Gắn nhãn | «Đã gắn hết nhóm này» + bảng trường hợp | chọn nhóm khác |
| ST-labels-taken | Gắn nhãn | toast «Tin này vừa có người gắn — chuyển tin kế» | tiếp tục |
| ST-labels-wait-second | Gắn nhãn | «Anh đã gắn hết phần của mình; n bài chờ người thứ hai» | chọn nhóm khác |
| ST-labels-multi | Gắn nhãn | «Bài có n tin; đang so với tin đầu» | ghi trường hợp |
| ST-labels-error | Gắn nhãn | Alert lỗi + «Thử lại» | Thử lại |
| ST-labels-viewer | Gắn nhãn | số tiến độ và số đếm, không biểu mẫu, không chữ lý do | — |
| ST-labels-cloud | Gắn nhãn | «Chỉ ở máy thu» | mở Ops ở máy thu |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Căn cứ mặc định «Chữ bài»; đổi sang loại khác làm ô Lý do thành bắt buộc.
- Ở 1440×900 thấy đủ 17 ô, Lý do và nút Lưu mà không cuộn; bài dài gấp sau ba dòng, «Xem hết bài» mở ra.
- «Không suy ra được» khoá ô nhập và ô căn cứ.
- Dự án, phân khu ghi tên đầy đủ; bí danh như `RB` ghi vào Lý do. Câu hướng dẫn nằm dưới ô.
- Bảng so ở khổ hẹp xếp thành từng dòng trường, không tràn ngang trang.
- Khổ hẹp: một cột, đầu Frame có bài gốc dính khi cuộn, chân Frame có nút Lưu dính; từ `xl`: hai cột khối.
- Enter ở ô cuối không tự lưu, vì biểu mẫu dài; phải bấm nút.

### 5. Xuất xứ component

| Component | Nấc | Vì sao |
|---|---|---|
| PageHeader, Frame, Field, Input, Checkbox, Textarea, Button, Tooltip | dùng | đã cài |
| ToggleGroup | dùng | lựa chọn ngắn và căn cứ bấm một lần; nền đã chọn đặt ở chỗ gọi |
| Khung Frame stacked theo `@reui/form-2` | ghép | lấy khuôn, không cài block |
| Combobox hoặc Select nhóm | dùng | 26 nhóm, có tiến độ |
| Badge, Alert (reui) | dùng | khác máy, lỗi |
| Table | dùng | bảng so ≤ 17 dòng, bảng trường hợp theo nhóm ≤ 30 dòng, dưới ngưỡng cần data-grid |
| Empty, Skeleton | dùng | trạng thái vùng dữ liệu |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: (i) đã tra Mobbin 04/11, không có màn gắn nhãn cùng loại nên không rút được gì; (ii) giữ khuôn hàng chờ của `/ops/labels`, `/ops/review`, thêm bộ chọn nhóm làm bậc lọc; bố cục biểu mẫu chốt bằng so bốn bản thử.

### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | Mạnh và đội, vai ops trở lên, trên máy thu |
| Việc chính | Gắn nhãn đúng điều người trong nhóm hiểu và ghi vì sao |
| Tần suất | hiếm: theo đợt đo |
| Dữ liệu | bài gốc S03, nhãn người, kết quả máy |
| Kết quả | tập nhãn người và bảng trường hợp theo nhóm |
<!-- UX-SPEC-TEMPLATE>>> -->
