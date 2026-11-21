# «Con người chỉ nằm biên»: khung, kiểm kê, đánh giá, thiết kế, lộ trình

> Bản chưng cất ngày 21/11/2026 của phiên phân tích «người ở biên» (chỉ đọc). Căn cứ của ROADMAP §3 mục 61. Số đo trên DB
> máy thu lúc 00:40–01:10Z ngày 21/11. Nguồn gọi bằng mã `S0x`. Lát `hai-khu-ghep-b` là lát giữ mù: tài liệu không đọc và
> không nêu đầu ra của đường ống trên lát đó; chỉ dùng số thẻ, tỉ lệ người giữ hay sửa nháp và mốc thời gian. Sổ đối chiếu
> nháp với nhãn lưu và bản làm việc đầy đủ ở máy thu, không vào kho.

Quy ước tên: thang tự chủ gọi là **nấc 0 … nấc 4** (không dùng chữ N vì FRAMING §3.4 đã dùng N0–N4 cho bậc năng lực);
các lát đề xuất gọi là **NB1 … NB4** (không dùng K vì mục 56 đã dùng K1–K5 cho loại căn cứ danh bạ).

## Quyết định của Mạnh (21/11/2026, khoảng 01:05Z)

Lời Mạnh ở phiên phân tích, sau khi đọc tài liệu và bổ sung ba nhận xét: **«Theo khuyến nghị cả bốn câu»**. Nguyên văn bốn câu và khuyến
nghị tại thời điểm quyết nằm ở mục «Bốn câu đã trình Mạnh» cuối tài liệu. Tóm tắt điều đã chốt:

1. Cho chấp thuận lô ở `/ops/review` khi lô đã tách ca biên, đã soát mẫu ngẫu nhiên 75 thẻ và có lệnh rút cả lô. Áp cho
   «Bổ sung tin», bắt đầu ở ô số (số WC, số phòng ngủ); ô loại hình và toà chỉ nhận lô khi mẫu 75 thẻ không có lỗi nào.
   Sửa ROADMAP §3 mục 35 ở câu «duyệt hàng loạt đã loại».
2. Tập mở cổng tự áp (PL21) là nhãn người duyệt nháp kèm hệ số bắt lỗi đo bằng thẻ cài, ghi xuất xứ cạnh mọi số đo. Nhãn
   «máy lưu, người duyệt lô» vào tập khi cách duyệt lô có hệ số bắt lỗi riêng; trước đó dùng theo lời duyệt của Mạnh, báo
   tách. Sửa FRAMING §5 ở chỗ đang để ngỏ «tập mù hay mẫu nháp».
3. Có thẻ cài lỗi 8–10% trong các lát gắn nhãn và lô duyệt từ lát kế; Mạnh biết có, không biết thẻ nào.
4. Thang nấc 0–4, danh sách «không bao giờ quá nấc 1» (ký cổng, tiền, cloud, xoá dữ liệu, luật an toàn, gửi tin nhóm xã hội) và luật
   «máy chỉ bấm Lưu vào lớp chờ, có ghi ai lưu» thành quyết định của kho: một mục ROADMAP §3 mới; luật 7 giữ nguyên câu
   chữ, thêm câu dẫn tới thang; ADR-0007 ghi «trợ lý gắn nhãn trong phiên». Trong lúc chờ NB2: tiếp tục duyệt lô như n2
   với sổ của phiên gắn nhãn làm bản ghi tạm, lát kế có thẻ cài.

Quyết định ghi ở ROADMAP §3 mục 61, FRAMING §5, `AGENTS.md` luật 7 và ADR-0007 (sửa đổi 21/11). Chưa có gì được thi công.
Các ngưỡng ở mục 4.2 (100 thẻ, 3%, 0,7, 70%, 4 tuần) vẫn là đề xuất, chốt ở Cổng Phạm vi
của từng hàng; lên nấc cho từng ô vẫn là một chữ ký riêng.

## Kết luận trước

1. **Hướng của Mạnh đúng, và kho đã đi theo hướng đó ở đường ghi dữ liệu.** Trong 2,01 triệu phát biểu dữ liệu, người ghi
   trực tiếp 2 dòng. Quyết định của người đi vào qua thẻ và luật rồi máy nhân lên: 43 thẻ địa chỉ nhóm Mạnh duyệt đã thay
   50.560 phát biểu của luật.
2. **Hàng duyệt là chỗ nghẽn thật.** `/ops/review` chờ 1.117 thẻ. Bảy ngày qua vào 267 thẻ, **người quyết 0 thẻ** (7 thẻ
   đóng trong tuần đều do bước máy). Cả đời kho người mới quyết 18 thẻ ở hàng này, lần cuối 10/11.
3. **Sáng nay Mạnh đã tự chuyển nấc mà chưa có rào.** Nhóm n1 (110 thẻ) Mạnh nhìn và lưu từng thẻ, trung vị 37 giây mỗi
   thẻ. Nhóm n2 (110 thẻ) có 105 thẻ do trợ lý bấm Lưu, Mạnh duyệt theo lô 10–12 thẻ; mỗi lô duyệt trong 27–64 giây (hai
   lô lâu hơn: 134 và 263 giây), trung vị khoảng 5 giây mỗi thẻ, không lô nào bị sửa. Theo Mạnh, nhanh hơn là vì bảng lô
   sắp có quy tắc nên dễ kiểm hơn màn từng thẻ, và Mạnh tin kết quả hơn (mục 3.1, 4.8). DB không ghi được thẻ nào người
   lưu, thẻ nào máy lưu.
4. **Con số 105/110 của n1 là «tỉ lệ Mạnh giữ nháp», chưa phải «độ đúng của trợ lý».** Khoảng tin cậy 95%: 89,8%–98,0%,
   chưa chạm ngưỡng 95% mà kho đã chốt cho ô định danh (F3). Nhóm n2 không cho thêm số nào: máy lưu đúng nháp của mình
   nên 110/110 trùng nháp là hiển nhiên.
5. **Đo được độ đúng mà Mạnh không phải gắn lại.** Cài 8–10% thẻ mang nháp sai có chủ ý (Mạnh biết có, không biết thẻ nào)
   để đo Mạnh bắt được bao nhiêu phần lỗi; thêm một model thứ hai đọc độc lập để lọc ca biên.
6. **Thang năm nấc, mỗi loại việc một nấc, lên nấc bằng con số, tụt nấc tự động.** Không bao giờ quá nấc 1: ký cổng,
   tiền, ghi dữ liệu trên cloud và xoá dữ liệu, luật an toàn (tầng A, an toàn nhóm xã hội, raw snapshot).
7. **Việc phải làm trước mọi việc khác:** bảng nhãn và bảng thẻ ghi được ai bấm Lưu, model nào, nấc nào, người duyệt lúc
   nào. Thiếu bốn thứ đó thì không tách được nhãn n1 với nhãn n2, và chưa nên duyệt lô thêm ở đâu.
8. **Lát đầu đề xuất (NB1):** hàng tồn 1.018 thẻ «Bổ sung tin». Hàng này gồm 786 thẻ còn đề xuất sống và 232 thẻ từ
   03–05/11 không còn đề xuất nào nối vào. Hơn nửa đề xuất đang chờ là ô «loại hình» (nhóm định danh, ngưỡng 95%), nên
   không phải cả hàng đều «sai thì nhỏ»: bắt đầu duyệt lô ở ô số (số WC, số phòng ngủ), ô loại hình và toà soát mẫu chặt
   hơn.
9. **Ba chỗ đụng luật, đều cần lời riêng của Mạnh, đều có phương án giữ nguyên luật:** luật 7, FRAMING §5 (tập test mù),
   ROADMAP §3 mục 35 (đã loại duyệt hàng loạt). Bốn câu hỏi ở cuối tài liệu.

---

## 1. Framing

### 1.1 Phát biểu lại thành khung kiểm được

Nhận định của Mạnh (21/11): model lớn gắn nhãn chính xác, người nhìn rồi chấp thuận một lượt; model càng giỏi thì phần người
càng nhỏ; áp cho cả gắn nhãn lẫn phê duyệt; «con người chỉ nằm biên».

Viết thành khung kiểm được:

> Với mỗi **loại việc** có người gắn hoặc duyệt, máy làm phần **trong lòng** (ca thường, có tiền lệ, lùi được, độ đúng đã
> đo đạt ngưỡng); người làm phần **biên**. Mức máy được tự làm là một **nấc** gắn với loại việc, lên hay tụt theo **số đo
> trên dữ liệu thật**, không theo cảm nhận và không theo tên model.

### 1.2 «Biên» là gì

Sáu loại ca biên, mỗi loại phải bắt được bằng máy, không dựa vào việc model tự thấy mình không chắc:

| Mã | Ca biên | Cách bắt (xác định) |
|---|---|---|
| B1 | Model không chắc | Model bỏ trống hoặc trả «không suy ra được» kèm lý do; không dùng điểm tự tin tự khai (kho đã cấm, review phân loại §3.1 điều 4) |
| B2 | Hai căn cứ mâu thuẫn | Hai model đọc độc lập ra hai đáp án; hoặc chữ bài trái thẻ địa chỉ nhóm; hoặc hai nguồn danh bạ lệch |
| B3 | Chưa có tiền lệ | Giá trị không quy được về danh bạ; nguồn, nhóm, dự án lần đầu xuất hiện; loại căn cứ chưa từng được duyệt |
| B4 | Hiếm mà đắt | Ca thuộc danh sách có tên: nối hoặc tách nút danh bạ, gộp hai căn, đổi dự án của cả một nhóm |
| B5 | Không lùi được, tiền, cloud | Theo ROADMAP §3 mục 50: tiền, DDL hay ghi dữ liệu trên cloud, xoá dữ liệu |
| B6 | An toàn | Tầng A, an toàn nhóm xã hội, raw snapshot, giấy tờ người mua |

(Mã B1–B6 chỉ dùng trong tài liệu này; khác bậc dữ liệu B0–B5 của FRAMING §3.4.)

B1–B4 là biên của **từng ca**: thẻ nào rơi vào thì lên người. B5–B6 là biên của **loại việc**: cả loại việc đó ở lại
với người.

### 1.3 Năm nấc tự chủ

| Nấc | Tên | Máy làm | Người làm | Ai bấm Lưu |
|---|---|---|---|---|
| 0 | Người làm hết | Không | Gắn hoặc duyệt từng ca, không có nháp | Người |
| 1 | Máy nháp, người duyệt từng ca | Điền nháp kèm căn cứ | Nhìn và lưu từng thẻ | Người |
| 2 | Duyệt theo lô | Gắn hết lô vào **lớp chờ**, tách ca biên | Xem ca biên từng thẻ, xem mẫu ngẫu nhiên của phần còn lại, chấp thuận lô một lượt | Máy, sau lời chấp thuận lô |
| 3 | Máy tự áp, người kiểm sau | Tự áp ca trong lòng, ghi nhật ký, lùi được | Quyết ca biên; kiểm mẫu định kỳ sau khi áp | Máy |
| 4 | Máy tự áp, người xem cảnh báo | Như nấc 3 | Chỉ vào khi thước trôi bật đỏ | Máy |

Sáng 21/11: nhóm n1 gắn ở nấc 1. Nhóm n2 gắn ở một dạng nấc 2 chưa có rào: máy lưu sau lời duyệt lô, nhưng lô không
tách ca biên, không có mẫu ngẫu nhiên, không có lớp chờ, không ghi ai lưu.

### 1.4 Khung này KHÔNG nói

- Không nói model đã đủ đúng. Hôm nay chưa có số đo độc lập nào về độ đúng của trợ lý.
- Không nói bỏ người. Ở nấc 4 người vẫn giữ ca biên, quyền lùi và quyền hạ nấc.
- Không nói lên nấc theo tên model. Đổi model là một lần đo lại (FRAMING §5 nguyên tắc 8), không phải lý do lên nấc.
- Không áp cho ký cổng, tiền, cloud, xoá dữ liệu, luật an toàn.
- Không nói nhãn do model gắn và người duyệt có giá trị bằng nhãn người gắn mù. Hai loại nhãn này phải mang dấu khác nhau.
- Không đổi luật nào. Chỗ đụng luật nêu ở mục 3.4 thành câu xin lời riêng.

---

## 2. Phân tích: kiểm kê mọi chỗ có người gắn hoặc duyệt

Mọi số đếm từ DB máy thu, ngày 21/11/2026, đo lại lúc 00:40–01:10Z, qua
`docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -h 127.0.0.1 -U oneinvest -d oneinvest -X -At -c "<câu>"`,
trong giao dịch chỉ đọc. Câu lệnh từng số ở phụ lục A.

### 2.1 Bảng kiểm kê

| # | Chỗ | Khối lượng | Tồn | Vào 7 ngày | Người quyết 7 ngày | Ai đọc đầu ra | Sai thì hỏng gì, lùi được không | Model đang tham gia | Thước độ đúng |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Gắn nhãn đánh giá `/ops/labels` | 1.231 thẻ ở 5 lát; 291 thẻ đã gắn (220 + 50 + 21), 1.794 dòng nhãn, 1 mã người gắn | 940 thẻ chưa gắn (2 lát chưa gắn thẻ nào: 30 và 375) | 220 (lát `hai-khu-ghep-b`, 20/11) | 241 thẻ có nhãn; trong đó 105 thẻ do trợ lý bấm Lưu qua phiên của Mạnh | Bộ chấm của các hàng (PL20 AC-9…), cổng tự áp PL21, màn «Đo hằng ngày» | Thước sai → cổng mở sai hoặc đóng sai. Lùi được: nhãn chỉ thêm, tập đóng băng có băm | Trợ lý phiên gắn nhãn (model lớn) điền nháp ngoài DB; cột `draft` là nháp của đường ống, chụp lúc rút mẫu soát | Chỉ có tỉ lệ giữ nháp. 0 cặp hai người, không có mẫu mù. `eval_labels` chỉ có `labeler_id`: không ghi được ai bấm Lưu (mục 3.5) |
| 2 | Thẻ «Bổ sung tin» (enrich) trên `/ops/review` | 1.027 thẻ | **1.018 chờ**: 786 còn đề xuất sống, 232 (tạo 03–05/11) không còn đề xuất nối vào | 197 (24–58 thẻ mỗi ngày có chạy) | **0** | Cột tin rao (điền chỗ trống), rồi «Một Căn Nhà» | Tuỳ ô: loại hình và toà sai → tin vào sai nhóm so sánh (nhóm A của F3); số WC, phòng ngủ sai → sai một ô. Lùi được: có hàm `revert_enrichment` (migration 036); chưa dòng nào đang ở trạng thái rút | Model local Qwen 27B (E2), luật E1 | Chưa có. 2.285 đề xuất E2 đã tự áp theo đường «chứng thực», 47 E1 tự áp |
| 3 | Thẻ ghép căn, toà trùng tên (`entity_match`) | 79 thẻ | 63 chờ (38 căn mơ hồ, 20 toà trùng tên, 5 cặp) | 58 | 0 (2 thẻ do bước máy đóng) | Danh bạ căn và toà; gộp tin vào căn | Gộp sai hai căn → hỏng giá, hỏng trùng. Lùi khó hơn (tách nút) | Gợi ý AI ở 19 thẻ đời đầu | Chưa có |
| 4 | Thẻ chất lượng danh bạ Người (`data_quality`) | 51 thẻ | 36 chờ | 12 | 0 (5 thẻ hoãn do bước máy dựng danh bạ Người) | Danh bạ Người, SĐT người bán | Gộp sai hai người. Lùi được | Không | Chưa có |
| 5 | Thẻ địa chỉ nhóm S03 `/ops/group-cards` | 48 thẻ | 4 nháp | 48 (dựng 17–19/11) | 44 thẻ (29 nhận nguyên, 14 có sửa, 1 bác) | Đóng dấu dự án, phường lên mọi tin của nhóm lúc nạp (mục 51) | Một thẻ sai → mọi tin của nhóm sai dự án. Lùi được: có lịch sử phiên bản | Nháp do luật dựng, không phải model lớn | Tỉ lệ nhận nguyên nháp 29/44 = 66% (Wilson 95%: 51%–78%) |
| 6 | Thẻ luật danh bạ (`project_link_rules`) | 3 luật, phủ 417 mã (349 + 61 + 7) | 0 | 3 | 3 | Cây Dự án → Phân khu → Toà; mọi tin của các dự án đó | Một luật sai kéo hàng chục toà (đã xảy ra: 7 nút trùng, 50 toà, mục 56). Đảo được (`dao_at`) | Không | Chạy bóng trước khi áp; chưa có ngưỡng (mục 56 còn mở) |
| 7 | Cổng của Acceptance-Gate Kit | 373 hồ sơ có trạng thái: 327 ký, 24 «máy thông» (đều T2, gộp không cần ký), 22 nháp T1 | — | — | — | Việc gộp PR, lời áp máy thu | Tính năng sai vào `main` | Hội đồng chấm bằng model (S4) | Evals máy + bằng chứng; người ký |
| 8 | Lời áp máy thu, lời riêng | Theo mục 50: chữ ký Cổng Bằng chứng kèm lời áp; lời riêng cho tiền, cloud, xoá, luật an toàn | — | 182 câu hỏi tới Mạnh trong 10 ngày trước 15/11 (ROADMAP §3 mục 50) | — | DB máy thu, cloud | Không lùi được ở một số loại | Không | Năm thứ của hồ sơ áp |

Đọc bảng:

- **Người gần như không ghi dữ liệu trực tiếp.** `field_assertions` có 2.010.706 dòng: 1,42 triệu từ trường có cấu trúc
  của nguồn, 376.759 từ luật E1, 160.311 từ bộ tách, 2.388 từ model E2, **2 dòng do người** (`hitl`).
- **Người quyết ở điểm đòn bẩy.** Trong 127.103 phát biểu E1 đã rút, 50.560 dòng rút với lý do «thay bằng thẻ nhóm»:
  43 thẻ địa chỉ nhóm Mạnh duyệt đã thay chừng ấy phát biểu của luật. 76.076 dòng còn lại rút vì lượt chạy
  sau thay lượt trước. Không có dấu hiệu luật E1 sai hàng loạt.
- **Hàng duyệt là chỗ nghẽn thật.** Trong `review_queue`, 40 thẻ đã đóng: 18 do người (lần cuối 10/11), 22 do bước máy.
  Hàng «Bổ sung tin» vào khoảng 28 thẻ mỗi ngày, ra 0.
- **Nháp của model lớn tốt hơn hẳn nháp của luật.** Cùng một người duyệt: nháp của luật ở thẻ địa chỉ nhóm được nhận
  nguyên 66%; nháp của trợ lý ở nhóm n1 được giữ 95%. Hai việc khác nhau nên không so thẳng được, nhưng chiều thì rõ.
- **Kit nghiệm thu đã có sẵn một nấc «máy thông».** 24 hồ sơ T2 gộp không cần chữ ký. Đây là tiền lệ trong chính kho
  cho thang nấc theo rủi ro.

### 2.2 Hàng «Bổ sung tin» gồm những gì

1.082 đề xuất đang chờ, trên 786 thẻ:

| Ô | Số đề xuất | Nguồn | Nhóm F3 | Ngưỡng |
|---|---|---|---|---|
| Loại hình (`property_type`) | 599 (511 model E2, 88 luật E1) | | A, định nhóm | ≥ 0,95 |
| Số WC (`bathrooms`) | 221 | E2 | B, số | ≥ 0,90 |
| Toà (`block_raw`) | 179 (175 E2, 4 E1) | | A, định danh | ≥ 0,95 |
| Số phòng ngủ (`bedrooms`) | 67 | E2 | B, số | ≥ 0,90 |
| Đường (`street_raw`) | 16 | E2 | C, mô tả | ≥ 0,80 |

Xếp ô vào nhóm F3 là của phiên phân tích (WC theo phòng ngủ, toà theo định danh); cần xác nhận ở hợp đồng của hàng.
232 thẻ chờ không còn đề xuất nào nối vào đều tạo 03–05/11. Phiên phân tích chưa mở từng thẻ nên chưa biết chúng là gì (suy đoán: thẻ
đối chiếu hoặc thẻ có đề xuất đã bị bỏ qua); cần kiểm trước khi đóng.

### 2.3 Model đang ở đâu trong đường ống

| Việc | Model | Lượng | Chi phí đo được |
|---|---|---|---|
| Đọc gộp bài S03 (`doc-gop-s03`) | Haiku qua gateway | 22.300 lời gọi thành công trong 7 ngày | `silver_labels`: 30.761 nhãn hết 44,51 USD, tức 0,0014 USD mỗi bài |
| Làm giàu chữ (E2) | Qwen 27B local | 350 lời gọi trong 7 ngày | 0 (máy thu) |
| Nháp gắn nhãn | Model lớn trong phiên gắn nhãn | 220 thẻ ngày 20–21/11 | Nằm trong hạn mức phiên, không đi sổ `ai_calls` |
| Chấm ở Cổng (S4) | Model trong phiên dãy | Theo vòng | Hạn mức phiên |

Hệ quả: quyết định của trợ lý gắn nhãn hôm nay **không có dòng nào trong sổ `ai_calls`** và không có băm đầu vào. Chỗ
duy nhất ghi là sổ CSV của phiên gắn nhãn ở máy thu.

---

## 3. Đánh giá

### 3.1 Bằng chứng hôm nay nói được gì

Đếm từ sổ đối chiếu của phiên gắn nhãn ở máy thu (220 dòng, so nháp với nhãn lưu sau khi bỏ dấu và ký hiệu) và
mốc giờ `labeled_at` trong DB. Nhóm lấy theo cột `stratum`.

| Nhóm | Thẻ | Cách làm | Ai bấm Lưu | Trùng nháp | Mạnh tự quyết | Sửa ngược nháp |
|---|---|---|---|---|---|---|
| n1 | 110 | Trợ lý nháp, Mạnh nhìn từng thẻ | Mạnh: 110 | 105 | 5 | 0 |
| n2 | 110 | 5 thẻ như n1; 11 thẻ trợ lý lưu trước, Mạnh «Duyệt hết» hồi tố; 94 thẻ theo 9 lô, Mạnh duyệt lô rồi trợ lý lưu | Mạnh: 5 · trợ lý: 105 | 110 (hiển nhiên) | 0 | 0 |

Nhóm n1:

- Tỉ lệ giữ nháp 105/110 = 95,5%. Wilson 95%: **89,8%–98,0%**. Sửa ngược 0/110, cận trên 95% là 3,4%.
- 14 thẻ ô Toà là «không nêu», 2 thẻ ô Phân khu là «không nêu»; 94 thẻ có cả hai ô.
- 110 thẻ trong 2 giờ 35 phút. Giãn cách giữa hai lần lưu: trung vị 37 giây, p90 134 giây.
- Nhịp nhanh dần theo năm chặng 22 thẻ: 57 → 46 → 37 → 35 → 31 giây. Có thể do quen tay, có thể do tin nháp hơn; số này
  không tách được hai lý do.

Nhóm n2:

- 9 lô, mỗi lô 10–12 thẻ. Từ lúc trợ lý soạn xong bảng lô tới lúc Mạnh duyệt (theo giờ ghi trong sổ của phiên gắn nhãn): 263,
  47, 48, 134, 29, 37, 27, 36, 64 giây. Chia cho số thẻ: trung vị khoảng 5 giây mỗi thẻ, thấp nhất khoảng 3 giây.
- Không lô nào có thẻ bị sửa hay trả lại.
- Phiên phân tích không biết bảng lô hiện gì cho Mạnh (có chữ bài và ảnh hay chỉ có đề xuất).
- **Lời Mạnh sau khi đọc tài liệu (2026-11-21T00:51Z):** «Tôi xem n2 thì với những gì hiện lên thì hoàn toàn tin cậy». Đây là đánh giá
  của người duyệt trên đúng thứ đã hiện cho Mạnh, và là căn cứ để dùng 105 nhãn n2. Nó chưa phải số đo: chưa có con số nào
  cho biết cách duyệt lô bắt được bao nhiêu phần lỗi nếu có lỗi.
- **Lời Mạnh tiếp theo (2026-11-21T00:54Z):** duyệt từng thẻ phải «đảo mắt liên tục và nhận ra nó là cái gì, tìm ở đâu»; duyệt lô thì
  «mọi thứ được sắp xếp có quy tắc» nên kiểm nhanh hơn nhiều, và độ tin cậy của chính Mạnh cũng cao hơn. Điều này đổi
  cách đọc con số 5 giây: phần lớn chênh lệch 37 → 5 giây là chi phí tìm kiếm trên màn từng thẻ, không phải Mạnh nhìn ít
  đi. Con số này vì vậy không xếp vào rủi ro «người thôi nhìn» (mục 3.3).
- **Lời Mạnh thứ ba (2026-11-21T00:55Z):** duyệt lô «thấy rõ bằng chứng và suy luận», đọc như vậy rất dễ, «nếu Claude sai thì thấy
  ngay». Tức bảng lô sáng nay đã hiện căn cứ và lập luận trên từng dòng, không chỉ kết luận.

Tiền lệ cùng chiều: vòng 06/11 ghi tỉ lệ giữ nháp 98,4% trên lát `s03-theo-nhom`.

Nói được: (a) với việc «đọc bài, quy về toà và phân khu trong danh bạ», nháp của model lớn đủ tốt để người duyệt từng thẻ
hiếm khi phải sửa; (b) năm ca Mạnh tự quyết ở n1 đều là ca trợ lý tự bỏ trống hoặc khác mức chi tiết, tức model đã tự đưa
ca biên lên; (c) tốc độ người tăng rõ: 37 giây mỗi thẻ ở nấc 1, khoảng 5 giây ở duyệt lô.

### 3.2 Chưa nói được gì

1. **Độ đúng của trợ lý.** Giữ nháp = đúng **hoặc** người duyệt không thấy lỗi. Hai phần này chưa tách. Mạnh đã chọn
   không chừa mẫu gắn độc lập («Không, như n1»), nên hôm nay không có số nào tách chúng.
2. **Nhóm n2 không cho số đo nào.** Máy lưu chính nháp của mình thì trùng nháp là hiển nhiên; «0 lô bị sửa» ở nhịp 5
   giây mỗi thẻ là bằng chứng yếu hơn nhiều so với «0 thẻ sửa ngược» ở nhịp 37 giây.
3. **Ngưỡng của kho.** F3 đòi cận dưới ≥ 0,95 cho ô định danh. Cận dưới của n1 là 0,898, kể cả khi coi «giữ» là «đúng».
4. **Loại việc khác.** Bằng chứng là 2 ô (Toà, Phân khu) trên 2 dự án. Chưa nói gì về giá, diện tích, ghép căn, nối nút
   danh bạ, duyệt thẻ luật.
5. **Model.** Trợ lý đổi model giữa nhóm n1. Số 105/110 là của hai model trộn lại.
6. **Độ bền.** Một buổi, một người duyệt.

### 3.3 Rủi ro

| Rủi ro | Cơ chế | Mức ở kho hôm nay | Cách bắt |
|---|---|---|---|
| Neo theo nháp | Người thấy nháp hợp lý thì đồng ý; càng về sau càng nhanh | Chưa đo. Dấu hiệu: nhịp n1 giảm 57 → 31 giây qua năm chặng | Thẻ cài lỗi (mục 4.3); theo dõi thời gian mỗi thẻ |
| Người thôi nhìn | Lên nấc rồi không ai kiểm kỹ | Hàng duyệt đã 11 ngày không người nào quyết. Nhịp 37 → 5 giây ở n2 **không** tính là dấu hiệu của rủi ro này: theo người duyệt, đó là do bảng lô dễ kiểm hơn | Tỉ lệ soát < 70% thì cảnh báo (FRAMING §5 nguyên tắc 7); thẻ cài lỗi cho biết bảng lô bắt lỗi tốt tới đâu |
| Bằng chứng do chính model chọn | Bảng hiện đoạn trích và lập luận nên lỗi suy luận lộ ngay; lỗi còn lại là đoạn bài model **không** trích (ví dụ bài nêu hai toà, model trích một) | Bảng lô sáng nay có bằng chứng và suy luận (lời Mạnh). Phần model bỏ sót: chưa đo | Dòng nào cũng mở được thẻ gốc; thẻ cài lỗi gồm cả loại «trích thiếu» (mục 4.3, 4.8) |
| Máy tự nâng nấc | Model hiểu một lời nói thường thành quyền ghi | Đã xảy ra 1 lần sáng 21/11 (mục 3.5): 11 thẻ | Nấc là dữ liệu trong DB, không phải lời trong chat; ở nấc 1 đường ghi nhãn chỉ nhận lần lưu của người |
| Sai cùng hướng | Model gắn nhãn và model của đường ống cùng họ, cùng đọc sai một kiểu viết tắt | Có thật về cấu trúc: đường ống đọc bằng Haiku, trợ lý là model lớn cùng hãng. Mức ảnh hưởng: suy đoán | Model thứ hai khác họ trong ba model đã được phép; so với sự thật cứng (mã căn của chủ đầu tư S16) |
| Đánh giá vòng tròn | Nhãn do model gắn dùng để chấm đường ống cũng dùng model → đường ống trông đúng hơn thật | Lát `hai-khu-ghep-b` chấm PL20 AC-9: 115 nhãn «người lưu sau khi xem nháp», 105 nhãn «máy lưu, người duyệt lô». Trợ lý không đọc đầu ra đường ống, nên vòng chỉ khép qua «cùng họ model» | Ghi xuất xứ nhãn vào tập đóng băng; báo số đo tách theo xuất xứ |
| Trôi theo thời gian | Nguồn đổi cách viết, danh bạ thêm nút, đổi model hay lời nhắc | Đã có khung: mẫu soát cuốn chiếu 20 bài mỗi ngày (FRAMING §5), nhưng lát `s03-cuon-chieu` mới gắn 21/240 thẻ | Giữ mẫu cuốn chiếu; tụt nấc tự động |
| Hiếm mà đắt | Ca 1% nhưng một lần sai kéo cả cụm (thẻ luật DA37: 7 nút, 50 toà) | Đã xảy ra 1 lần | Danh sách B4 có tên, không bao giờ vào lô |

### 3.4 Chỗ đụng luật hiện hành và cách gỡ

| Luật | Câu chữ | Khung mới đụng ở đâu | Phương án giữ nguyên luật | Phương án sửa (cần lời riêng của Mạnh) |
|---|---|---|---|---|
| Luật 7, LLM-off-data-path | LLM chỉ gate, judge, extract kèm audit; ghi dữ liệu qua người hoặc luật xác định | Nấc 3 trở lên cho việc ghi dữ liệu | Model chỉ **phát biểu** kèm trích dẫn; bộ định tuyến là **luật xác định** («hai lần đọc độc lập trùng nhau, ô đã đo đạt ngưỡng F3 → áp»). Đây đúng là thiết kế PL21 đã chốt 23/10; không cần sửa luật 7, chỉ cần mở PL21 | Thêm ngoại lệ có tên như ADR-0018 cho từng loại việc |
| FRAMING §5 | Cổng tự áp dùng **tập test mù đóng băng**; mẫu soát chỉ để thấy trôi. «Tập mù hay mẫu nháp: hoãn, quyết khi mở PL21» | Dùng nhãn «người duyệt nháp» làm tập mở cổng | Giữ tập mù: cần khoảng 73–142 thẻ gắn không nháp cho mỗi ô trọng yếu | Nhận nhãn «người duyệt nháp» làm tập mở cổng **kèm** hệ số bắt lỗi đo bằng thẻ cài lỗi (mục 4.3). Đây là câu hỏi 2 |
| ROADMAP §3 mục 35 | Không gắn mù; «duyệt hàng loạt đã loại ở GD10»; chỉ thẻ luật được quyết cho cả loạt | Nấc 2 (chấp thuận lô) ở `/ops/review` | Ở nấc 1: máy nháp từng thẻ, người bấm từng thẻ (nhanh hơn nhưng vẫn 786 lần bấm) | Cho phép chấp thuận lô khi lô có: ca biên đã tách, mẫu ngẫu nhiên đã soát, lệnh rút cả lô. Đây là câu hỏi 1 |
| Đường quyết thẻ trong mã | `POST /api/v1/ops/review/:id/decide` chỉ nhận người vai ops, không nhận khoá máy, bắt buộc lý do cho từng thẻ | Chấp thuận lô không chạy được trên đường này | Giữ: người bấm từng thẻ | Cần hàng thi công thêm đường chấp thuận lô; lời Mạnh ở câu 1 chưa đủ, phải qua cổng của hàng đó |
| ROADMAP §3 mục 56 | Duyệt theo loại căn cứ một lần; ngưỡng chạy bóng chưa chốt; K4 và ca khó vẫn từng cặp | Không đụng. Khung này cấp con số cho «ngưỡng chạy bóng» còn mở | — | — |
| Luật 6 (tầng A), luật 8 (an toàn nhóm xã hội), raw snapshot | — | Không đụng. Các loại việc này ở lại nấc 0–1 | — | Không đề xuất |
| ADR-0007 sửa 06/11 | Chỉ ba model được nhận bài nguyên văn | Model thứ hai phải nằm trong ba model đó. Trợ lý trong phiên Claude Code đọc bài là thực tế đã có từ 06/11 nhưng chưa được ghi thành ngoại lệ có tên | Model thứ hai chọn trong ba model đã phép | Ghi rõ «trợ lý gắn nhãn trong phiên» vào ADR-0007. Gộp vào câu hỏi 4 |

### 3.5 Ca thật sáng 21/11: từ «nhìn từng thẻ» sang «duyệt lô» trong một giờ

Trình tự, ghép từ ghi chú trong sổ của phiên gắn nhãn, lời phiên giám sát và mốc giờ trong DB (phiên phân tích chỉ đọc cột thời gian và
cột nhóm, không đọc giá trị nhãn):

1. 20/11 21:22Z – 23:57Z: nhóm n1, 110 thẻ, Mạnh lưu từng thẻ.
2. 23:58Z: nhóm n2 bắt đầu; 5 thẻ đầu Mạnh lưu như cũ.
3. 21/11 00:10–00:11Z: sau lời «Duyệt theo lô», trợ lý tự bấm Lưu 11 thẻ **trước** khi Mạnh duyệt. Giám sát dừng lại.
   00:13:33Z Mạnh «Duyệt hết» hồi tố.
4. 00:18Z – 00:29Z: 9 lô, thứ tự đã sửa thành «trợ lý gửi bảng lô → Mạnh duyệt → trợ lý lưu». 94 thẻ. Lát đủ 220/220 lúc
   00:29:05Z.
5. Cả lát chỉ có **một** `labeler_id` (phiên Ops của Mạnh). Trong DB, 105 thẻ trợ lý lưu trông y hệt 115 thẻ Mạnh lưu.
   Muốn tách phải dùng sổ CSV ngoài DB.

Bốn điều rút ra cho khung:

1. **Lời «duyệt theo lô» là một lần đổi nấc mà không ai gọi tên.** Người nói nghĩ «tôi vẫn duyệt», máy hiểu «tôi được
   lưu». Thang nấc có tên là để một câu như vậy có đúng một nghĩa.
2. **Xuất xứ phải nằm trong DB, ngay lúc ghi.** Một tập test mà không biết dòng nào người lưu, dòng nào máy lưu thì không
   dùng được để mở cổng; sổ CSV không phải nhật ký.
3. **Số đo của lát này phải báo tách hai phần:** 115 thẻ Mạnh nhìn từng thẻ rồi lưu; 105 thẻ máy lưu, Mạnh duyệt lô (trong
   đó 11 thẻ duyệt hồi tố). Tỉ lệ giữ nháp chỉ có nghĩa trên phần đầu.
4. **Bảng lô là bề mặt duyệt tốt hơn màn từng thẻ.** Người duyệt báo: sắp có quy tắc thì kiểm nhanh hơn và tin hơn.
   Đây là phát hiện về giao diện, không phải về model: cùng một nháp, cách bày quyết định người kiểm được bao nhiêu.
   Phần chưa biết là bảng lô bắt được bao nhiêu phần lỗi; thẻ cài lỗi trả lời câu đó, và nhiều khả năng cho bảng lô
   điểm cao hơn màn từng thẻ (suy đoán, chưa đo).

Ca này không làm hỏng việc giữ mù: trợ lý vẫn không đọc đầu ra của đường ống. Việc 105 nhãn này có dùng được cho PL20
AC-9 hay không là quyết định của Mạnh ở cổng của hàng đó; tài liệu này chỉ nêu rằng chúng khác loại với 115 nhãn kia.

### 3.6 So với cách làm chuẩn của ngành

Phần này viết từ hiểu biết chung, **chưa tra lại trên web hôm nay** (máy đang tải cao, và các ý dưới đều là thực hành phổ
biến); nếu Mạnh muốn nguồn dẫn cụ thể, mở một lượt tra riêng.

- **Định tuyến theo ngưỡng tin cậy.** Ngành thường dùng điểm tự tin của model. Kho đã cấm điểm tự khai và thay bằng độ
  đúng đo theo ô (phương pháp × trường × nguồn). Cách của kho chặt hơn; giữ.
- **Kiểm mẫu theo lô (acceptance sampling).** Nhận hay trả cả lô theo một mẫu ngẫu nhiên có cỡ tính trước. Đây là nấc 2.
- **Hai lần đọc độc lập, bất đồng thì lên người.** Điều kiện: hai lần đọc không thấy đáp án của nhau (kho đã có luật
  này: review phân loại §3.3 điều 3).
- **Câu vàng cài sẵn (gold, honeypot).** Nền tảng gắn nhãn cộng đồng cài câu đã biết đáp án để đo người gắn. Áp ngược
  lại ở đây: cài nháp sai để đo người duyệt.
- **Ngân sách lỗi.** Mỗi loại việc có mức sai chấp nhận được; tiêu hết thì ngừng tự động hoá. Kho đã có tiền lệ: GT9
  chấp nhận khoảng 4% tin sai.

Chỗ kho đi trước chuẩn ngành: nhật ký phát biểu có trích dẫn, rút được hàng loạt, tập đóng băng có băm. Chỗ kho đi sau:
chưa có lần đọc thứ hai độc lập, chưa đo người duyệt, chưa ghi ai bấm Lưu.

---

## 4. Hoàn thiện: thiết kế chạy được

### 4.1 Thang nấc theo loại việc

| Loại việc | Hôm nay | Trần đề xuất | Vì sao trần ở đó |
|---|---|---|---|
| Gắn nhãn đánh giá (thước) | Nấc 1; n2 sáng nay là nấc 2 chưa có rào | **Nấc 2** | Thước mà máy tự áp thì không còn là thước. Người phải chấp thuận lô |
| Mẫu soát cuốn chiếu (thấy trôi) | Nấc 1 | Nấc 2 | Như trên |
| Thẻ «Bổ sung tin», ô số và mô tả | Nấc 0 (và đang nghẽn) | **Nấc 3**, sau này nấc 4 | Sai một ô, lùi được, khối lượng lớn |
| Thẻ «Bổ sung tin», ô loại hình và toà | Nấc 0 | Nấc 2; lên nấc 3 khi đạt 0,95 | Nhóm A: sai thì tin vào sai nhóm so sánh |
| Thẻ địa chỉ nhóm S03 | Nấc 1 (nháp của luật) | Nấc 2 | Một thẻ đóng dấu lên cả nhóm; 48 thẻ, không đáng tự áp |
| Ghép căn, toà trùng tên | Nấc 0 | Nấc 2; ca B4 ở nấc 1 | Gộp sai khó tách |
| Thẻ luật danh bạ theo loại căn cứ | Nấc 1 theo nguồn → theo loại căn cứ (mục 56) | Nấc 3 cho căn cứ đã duyệt và đạt ngưỡng chạy bóng; K4 và ca khó ở nấc 1 | Đã chốt hướng ở mục 56 |
| Tin từ bài chỉ có ảnh (GT9) | Đã chốt tự vào kho | Nấc 3 | Đã có ngoại lệ luật 7 |
| Cổng T2 «máy thông» của kit | Nấc 3 | Giữ | Đã chốt |
| Cổng Phạm vi, 1.5, Bằng chứng, Đáng (T3) | Nấc 1 (thẻ quyết định do máy dựng) | **Nấc 1** | Mục 50: Mạnh ở cổng |
| Tiền, cloud, xoá dữ liệu, luật an toàn, gửi tin nhóm xã hội | Nấc 0–1 | **Nấc 1** | B5, B6 |

### 4.2 Điều kiện lên nấc và tụt nấc

Đơn vị đo là **ô** = (loại việc × trường × phân khúc), đúng đơn vị của F3.

| Chuyển | Điều kiện (tất cả) |
|---|---|
| Nấc 1 → 2 | (0) bảng nhãn hoặc thẻ đã ghi được bốn thứ ở mục 4.5 (ai bấm Lưu, model, nấc, giờ người duyệt), và nhãn của máy nằm ở lớp chờ cho tới khi người chấp thuận; (a) ≥ 100 thẻ đã duyệt ở nấc 1 trong ô; (b) tỉ lệ sửa ngược ≤ 3% thô; (c) đã đo hệ số bắt lỗi của người duyệt bằng thẻ cài lỗi và hệ số đó ≥ 0,7; (d) ca biên B1–B4 bắt được bằng máy và có lệnh liệt kê |
| Nấc 2 → 3 | (a) cận dưới Wilson 95% của độ đúng đã hiệu chỉnh ≥ ngưỡng F3 của nhóm trường (A 0,95; B 0,90; C 0,80); (b) hai lô liên tiếp không bị trả; (c) có lệnh rút cả lô đã chạy thử; (d) mỗi quyết định có dòng nhật ký đủ trường (mục 4.5); (e) chỉ cho loại việc lùi được |
| Nấc 3 → 4 | (a) 4 tuần ở nấc 3 không tụt; (b) tỉ lệ soát mẫu hằng tuần ≥ 70%; (c) cảnh báo trôi đã từng bật đúng ít nhất một lần trong thử nghiệm cấy lỗi |
| Tụt một nấc, tự động | Bất kỳ: mẫu kiểm có số lỗi vượt bảng 4.4; tỉ lệ soát < 70% hai tuần liền; đổi model, lời nhắc hay phiên bản thước mà chưa so cặp trên cùng bài; tỉ lệ ca biên của tuần lệch quá hai lần so với 4 tuần trước |
| Về nấc 1 ngay | Một ca B4 lọt vào lô; một lần rút cả lô vì sai; máy lưu trước lời chấp thuận |

Lên nấc là **quyết định của Mạnh ở cổng** (một lần cho mỗi ô), tụt nấc là máy tự làm rồi báo.
Các con số 100 thẻ, 3%, 0,7, 70%, 4 tuần là đề xuất của phiên phân tích, chốt ở Cổng Phạm vi của hàng mang thước.

### 4.3 Đo độ đúng của model mà không đòi người gắn lại toàn bộ

Vấn đề: tỉ lệ sửa quan sát = tỉ lệ lỗi thật × phần lỗi người duyệt bắt được. Biết vế trái, chưa biết hệ số thứ hai.

**Cách A, thẻ cài lỗi (đề xuất chính).** Trong mỗi lô duyệt, 8–10% số thẻ mang một nháp sai có chủ ý, sinh bằng luật xác
định từ danh bạ (đổi sang toà kề, phân khu anh em, bỏ một ô đáng lẽ có). Mạnh biết lô có thẻ cài, không biết thẻ nào. Sau
khi lưu, máy lộ đáp án và đếm.

- Hệ số bắt lỗi `c` = số thẻ cài Mạnh sửa / số thẻ cài.
- Lỗi thật ước tính = tỉ lệ sửa quan sát / `c`.
- Hai loại thẻ cài: «suy luận sai từ trích đúng» (bảng lô lộ ngay) và «trích thiếu phần bài nói khác» (bảng lô khó lộ).
  Đo `c` riêng cho từng loại.
- Cỡ: 30 thẻ cài cho `c` với khoảng ±14 điểm (ví dụ 24/30 → 63%–91%); 60 thẻ cho ±10 điểm. Trên lát 220 thẻ là 20 thẻ
  mỗi lát; gom 2–3 lát.
- Thẻ cài không vào tập nhãn: đáp án đúng của nó đã biết trước, nhãn Mạnh lưu chỉ dùng để tính `c`.
- Ví dụ số trên n1: quan sát 0/110 sửa ngược (cận trên 3,4%); nếu `c` = 0,8 thì lỗi thật có cận trên khoảng 4,2%; nếu
  `c` = 0,5 thì 6,7%. Phép chia này chưa tính độ bất định của chính `c`, nên khoảng thật rộng hơn. Con số `c` quyết định
  105/110 có nghĩa gì.
- Thẻ cài phải đo riêng cho từng cách duyệt: `c` ở nhịp 37 giây mỗi thẻ và `c` ở nhịp 5 giây mỗi thẻ là hai số khác nhau.

**Cách B, lần đọc thứ hai độc lập.** Một model khác (trong ba model đã phép, không thấy nháp của trợ lý) đọc cùng thẻ.
Hai lần đọc trùng → «trong lòng»; lệch → ca biên B2, lên người có gắn cờ. Không cho ra độ đúng tuyệt đối (hai model có thể
sai cùng hướng) nhưng thu nhỏ phần người phải nhìn kỹ và cho một thước trôi không cần nhãn.

**Cách C, sự thật cứng.** Ở dự án có mã căn của chủ đầu tư (S16), toà suy từ mã căn trong bài là xác định. So nháp với
giá trị đó ở những bài có mã căn: không cần người. Chỉ phủ một phần bài (chưa đếm phần đó là bao nhiêu).

**Cách D, mẫu mù nhỏ (chỉ khi mở cổng tự áp).** Không phải 1 trong 5. Để chứng minh cận dưới 0,95 cần 73 thẻ gắn không
nháp với 0 lỗi, hoặc 142 thẻ với ≤ 2 lỗi, **một lần cho mỗi ô**, không phải mỗi lát. Mạnh đã từ chối chừa mẫu cho lát hôm
nay; cách D chỉ đặt ra khi một ô xin lên nấc 3, và là nội dung câu hỏi 2.

Khuyến nghị: A + B cho nấc 1 → 2; thêm C ở nơi có; D chỉ ở cửa nấc 2 → 3 nếu Mạnh chọn giữ nguyên FRAMING §5.

### 4.4 Cỡ mẫu người kiểm ở mỗi nấc

Cận dưới Wilson 95% (z = 1,96) của tỉ lệ đúng, với `x` lỗi trên `n` thẻ. Bảng tính bằng mã (phụ lục B), là cỡ mẫu nhỏ
nhất đạt cận dưới:

| Muốn chứng minh cận dưới | 0 lỗi | ≤ 1 lỗi | ≤ 2 lỗi | ≤ 3 lỗi | ≤ 4 lỗi |
|---|---|---|---|---|---|
| ≥ 0,95 (nhóm A) | 73 | 110 | 142 | 173 | 202 |
| ≥ 0,90 (nhóm B) | 35 | 53 | 69 | 84 | 99 |
| ≥ 0,80 (nhóm C) | 16 | 25 | 33 | 40 | 47 |

Bảng F3 chốt 23/10 (100 thẻ 0 lỗi; 150 thẻ ≤ 2; 200 thẻ ≤ 3; 100 thẻ ≤ 4 cho 0,90) đều nằm trên các mức này, tức F3 đã
chọn số tròn an toàn hơn. Hợp đồng của hàng dùng số nào thì chốt ở Cổng Phạm vi.

| Nấc | Người nhìn |
|---|---|
| 1 | 100% thẻ, có nháp; 8–10% là thẻ cài |
| 2 | 100% ca biên + mẫu ngẫu nhiên 75 thẻ của phần «trong lòng» mỗi lô, soát trên **bảng lô sắp theo quy tắc** (mục 4.8), mỗi dòng kèm đoạn trích căn cứ; dòng lạ thì mở thẻ gốc (lô ≤ 75 thẻ thì nhìn hết). Trả lô khi mẫu có ≥ 1 lỗi ở nhóm A, ≥ 3 lỗi ở nhóm B |
| 3 | 100% ca biên + 30 thẻ mỗi tuần mỗi ô, rút ngẫu nhiên từ phần đã tự áp. 0 lỗi trên 30 chỉ chứng minh cận dưới 0,89: mẫu tuần để **thấy trôi**; cộng dồn 4 tuần (120 thẻ, ≤ 1 lỗi → cận dưới 0,954) mới giữ được 0,95 |
| 4 | 100% ca biên + 30 thẻ mỗi tháng mỗi ô + mọi cảnh báo trôi |

### 4.5 Nhật ký cho mỗi quyết định của model

Một dòng mỗi quyết định, chỉ thêm, ở máy thu. Trường tối thiểu:

| Trường | Nội dung |
|---|---|
| `viec`, `o` | Loại việc và ô (trường × phân khúc) |
| `chu_the` | Khoá bất biến của bài, tin hay cặp (khoá gốc của nguồn, không phải băm nội dung) |
| `bam_dau_vao` | sha256 của đúng những gì model thấy: chữ đã chuẩn hoá, danh sách tệp ảnh, phiên bản danh bạ, phiên bản thẻ nhóm |
| `model`, `phien_ban_loi_nhac` | Mã model đầy đủ và phiên bản lời nhắc |
| `gia_tri`, `can_cu`, `trich` | Đáp án, loại căn cứ (chữ, ảnh, nhóm, nghề, danh bạ), đoạn trích; mã kiểm đoạn trích có thật trong bài |
| `doc_thu_hai` | Đáp án của lần đọc độc lập, trùng hay lệch |
| `ca_bien` | Mã B1–B4 nếu có |
| `nac`, `ket_cuc` | Nấc lúc quyết; tự áp, lên người, người giữ, người sửa, rút |
| `lo`, `nguoi`, `luc` | Mã lô, ai chấp thuận lô, thời điểm |

Bốn thứ bắt buộc ở **chính bảng nhãn và bảng thẻ** (không chỉ ở nhật ký), rút từ ca sáng 21/11:

| Cột cần có | Nghĩa | Hôm nay |
|---|---|---|
| Ai bấm Lưu | `nguoi` hay `may`, tách khỏi «ai chịu trách nhiệm nhãn» | `eval_labels` chỉ có `labeler_id`; `review_queue.decided_by` là chữ tự do (đang lẫn mã người, tên bước máy, tên riêng) |
| Model nào | Mã model đầy đủ và phiên bản lời nhắc khi người lưu là máy hoặc khi nháp do máy điền | Không có ở `eval_labels`; có ở `silver_labels` |
| Nấc lúc lưu | 1, 2, 3 | Không có ở đâu |
| Giờ người duyệt | Khác giờ lưu khi máy lưu trước, người duyệt sau; rỗng nghĩa là chưa ai duyệt | `eval_labels` chỉ có `labeled_at` |

Nhãn chưa có giờ người duyệt không được vào tập đóng băng và không được tính vào tỉ lệ giữ nháp.

Giới hạn chưa giải: sáng nay trợ lý lưu **qua chính phiên Ops của Mạnh**, nên chỉ thêm cột là chưa đủ để DB tự biết ai
bấm. Cần một đường lưu riêng cho trợ lý (danh tính riêng, chỉ ghi được vào lớp chờ). Đây là việc của hàng thi công và
chạm quyền truy cập Ops, nên phải qua Cổng Phạm vi.

Kho đã có gần đủ chỗ chứa nhật ký: `field_assertions` (phát biểu, bậc căn cứ, `rule_id`, rút được), `ai_calls` (model,
token), `silver_labels` (model, lời nhắc, trích, `quote_ok`), `ops_audit`. Luật «không thêm cơ chế khi chưa có số đo»
nghiêng về nối vào bảng có sẵn thay vì dựng bảng mới.

Riêng nhãn đánh giá: tập đóng băng (`label-dong-bang.mjs`) thêm xuất xứ cho mỗi dòng: `nguoi_mu`, `nguoi_luu_sau_nhap`,
`may_luu_nguoi_duyet_lo`, kèm model nháp. Bộ chấm in số đo tách theo xuất xứ.

### 4.6 Cách lùi

- Mọi lần tự áp mang mã lô. Một lệnh rút cả lô, đã chạy thử trước khi lên nấc 3 (như điều kiện của GT9).
- Phát biểu của máy không bao giờ đè quyết định của người (bậc H0 thắng mọi bậc, review phân loại §3.3).
- Chạy lại cùng đầu vào không sinh quyết định mới (khoá theo `bam_dau_vao`).
- Lùi nấc không rút dữ liệu đã áp; rút dữ liệu là lệnh riêng, có người bấm.

### 4.7 Chỗ người vẫn quyết từng ca

Ký bốn cổng và phiên nghiệm thu; tiền; DDL và ghi dữ liệu trên cloud; xoá dữ liệu; sửa luật an toàn; mọi việc gửi tin vào nhóm xã hội (luật 8);
duyệt **lần đầu** mỗi loại căn cứ của thẻ luật; nối, tách nút danh bạ khi lệch tỉnh hoặc căn cứ K4 của mục 56; lên nấc cho
một ô; và mọi ca biên B1–B4.

### 4.8 Bảng lô: bề mặt duyệt của nấc 2

Rút từ lời Mạnh sáng 21/11 sau khi duyệt 9 lô của n2. Màn từng thẻ bắt người duyệt tự tìm «đây là gì, nhìn ở đâu» cho
mỗi thẻ; bảng lô đặt cùng một loại thông tin vào cùng một cột, nên mắt chỉ việc dò cái lệch. Năm nguyên tắc đề xuất:

1. **Một dòng một thẻ, cột cố định:** mã thẻ, đoạn trích căn cứ từ bài (nguyên văn), đề xuất từng ô, loại căn cứ (chữ,
   ảnh, nhóm, nghề, danh bạ).
2. **Sắp theo giá trị đề xuất, không theo thứ tự thẻ:** các dòng cùng toà, cùng phân khu đứng cạnh nhau; đoạn trích lệch
   khỏi hàng xóm sẽ lộ ra.
3. **Ca biên tách thành nhóm riêng ở đầu bảng:** ô máy bỏ trống, hai lần đọc lệch nhau, giá trị chưa có trong danh bạ.
4. **Dòng nào cũng mở được thẻ gốc** (chữ bài đầy đủ, ảnh) bằng một lần bấm.
5. **Lô nhỏ:** 10–12 thẻ như sáng nay, hoặc theo nhóm giá trị; chấp thuận từng lô, ghi giờ duyệt từng lô.

Theo lời Mạnh, bảng lô sáng nay đã có điều cốt lõi: bằng chứng và suy luận nằm ngay trên dòng, nên model lập luận sai
thì thấy ngay. Nguyên tắc 1 vì vậy là thứ đã chạy được, cần giữ khi dựng thành màn; nguyên tắc 2 và 3 là đề xuất của phiên phân tích,
chưa thử. Giới hạn còn lại hẹp: bằng chứng trên dòng do chính model chọn, nên loại lỗi bảng không tự lộ là phần bài model
không trích. Thẻ cài lỗi đo trên chính bảng lô và có cả loại «trích thiếu» sẽ cho biết phần đó lớn hay nhỏ.

Hệ quả cho các chỗ khác: `/ops/review` hiện là màn từng thẻ. Nếu bảng lô tốt hơn cho gắn nhãn thì nhiều khả năng cũng
tốt hơn cho «Bổ sung tin» (NB1), và đường chấp thuận lô ở câu 1 nên dựng theo bảng này thay vì thêm nút «duyệt hết» lên
màn cũ.

---

## 5. Đề xuất giải pháp

### 5.1 Lộ trình theo lát

| Lát | Việc | Ô trên màn đổi | Lệnh đo | Luật phải sửa, lời cần có | Chi phí model (ước) |
|---|---|---|---|---|---|
| **NB1** (2–3 ngày cho bước bóng) | Chấm bóng hàng «Bổ sung tin»: model lớn đọc 786 thẻ còn đề xuất, ghi nhận/bác + căn cứ + trích; lần đọc thứ hai độc lập; tách ca biên. **Chưa ghi gì vào tin.** Kiểm 232 thẻ không còn đề xuất. Rồi Mạnh soát ca biên + mẫu 75 thẻ trên bảng lô (mục 4.8) và chấp thuận lô, bắt đầu từ ô số (WC, phòng ngủ: 288 đề xuất) | `/ops/review` hạng mục Bổ sung tin, ô «Chờ duyệt»: 1.018 → còn phần ca biên. Phiên phân tích chưa có số ca biên; ước dưới 150 nếu hai lần đọc trùng nhau trên 85% thẻ. Biết thật sau lượt bóng | `SELECT status, count(*) FROM review_queue WHERE item_type='agent_output' GROUP BY 1` | Bước bóng: không sửa luật, không ghi dữ liệu tin. Bước chấp thuận lô: **lời Mạnh sửa mục 35** (câu 1) **và** một hàng thi công thêm đường chấp thuận lô (đường quyết thẻ hiện chỉ nhận người, từng thẻ, kèm lý do). Ghi lên DB máy thu đi theo chữ ký Cổng Bằng chứng (mục 50) | 20–60 USD cho lượt đầu nếu đi API (786 thẻ × hai lần đọc); 0 USD nếu chạy trong phiên. Đơn giá model lớn chưa kiểm lại hôm nay |
| **NB2** (song song) | Bốn cột xuất xứ ở bảng nhãn, lớp chờ và đường lưu riêng cho trợ lý: **làm trước**. Rồi thẻ cài lỗi trên `/ops/labels`; trợ lý gắn lát kế (ứng viên: `hai-khu-ghep`, 375 thẻ chưa gắn) | Màn gắn nhãn: thêm ô «Hệ số bắt lỗi» (chưa có → một con số kèm khoảng); lát kế 0/375 → 375/375, mỗi thẻ có xuất xứ | `SELECT count(DISTINCT l.item_id) FROM eval_labels l JOIN eval_label_items i USING(item_id) WHERE i.lat='hai-khu-ghep'` | Có migration (thêm cột) nên là hàng qua cổng. Không sửa luật. Cần lời Mạnh đồng ý có thẻ cài (câu 3) | Trong hạn mức phiên |
| **NB3** (sau NB1, NB2) | Mở PL21 cho đúng một ô đầu tiên đạt điều kiện nấc 2 → 3 (ứng viên: số WC hoặc số phòng ngủ của «Bổ sung tin») | `/ops/quality` «Tự động hoá (D5)»: tỉ lệ giá trị máy quyết, 0 → một con số | Theo thước D5 của FRAMING §5 | **Câu 2**: tập mở cổng là tập mù hay nhãn duyệt-nháp có hiệu chỉnh. Luật 7 không cần sửa nếu đi đường «luật xác định» | Khoảng 28 thẻ mỗi ngày × hai lần đọc: dưới 2 USD mỗi ngày |
| **NB4** (sau MS3) | Ngưỡng chạy bóng cho thẻ luật danh bạ theo loại căn cứ (câu còn mở của mục 56), dùng bảng 4.4 | Thẻ luật: nguồn mới áp theo căn cứ đã duyệt | Theo hàng của lớp hợp nhất nguồn | Trình ở Cổng Phạm vi của hàng đó, không phải bây giờ | Không đáng kể |

Vì sao NB1 trước: hàng đó đang nghẽn thật (vào 197, người quyết 0 trong 7 ngày), lùi được, và nó cho ngay gần 800 điểm dữ
liệu về «model lớn duyệt thay người» ở một việc khác với gắn nhãn. NB1 không chạm lát đang giữ mù.

Vì sao NB2 phải đi cùng: sáng nay đã có 105 nhãn do máy lưu mà DB không phân biệt được. Mỗi lát gắn thêm theo kiểu duyệt
lô trước khi có NB2 là thêm nhãn không rõ xuất xứ.

Lưu ý phạm vi: NB1–NB3 không nằm trên đường găng MS3. Theo mục 50, xếp chúng vào lúc nào là việc của giám sát; tài liệu
này chỉ đề xuất nội dung. Điều kiện mở lại của PL23 trong lộ trình («số thẻ chờ duyệt vượt sức duyệt của đội») đã đạt
theo số ở mục 2. Điều kiện mở lại của PL21 («một ô đứng yên hai lượt đo liền, hoặc MS3 đạt») phiên phân tích chưa kiểm.

### 5.2 Phương án thay thế và vì sao không chọn

| Phương án | Vì sao không chọn |
|---|---|
| Lên thẳng nấc 3: model lớn tự duyệt cả hàng, không mẫu | Không có số đo nào đỡ. Vi phạm F3, FRAMING §5 và luật 7 cùng lúc. Một lần sai không ai thấy cho tới khi hỏng thước |
| Tiếp tục duyệt lô như n2 sáng nay mà không thêm gì | Cách duyệt thì giữ (người duyệt thấy dễ và tin hơn). Thiếu hai thứ: DB không ghi ai lưu, và chưa có số đo bảng lô bắt được bao nhiêu phần lỗi. Thêm hai thứ đó là đủ, không cần đổi cách duyệt |
| Giữ nguyên nấc 1 mọi nơi, chỉ nhờ model nháp nhanh hơn | 786 lần bấm cho một hàng, và hàng vẫn vào 28 thẻ mỗi ngày. Không giải quyết nghẽn |
| Đòi tập mù đầy đủ trước mọi bước (1 trong 5, hoặc 200 thẻ mỗi ô) | Mạnh đã từ chối hôm nay; lịch sử từ 06/11 cho thấy cách này không được làm. Thẻ cài lỗi cho một phần thông tin đó với ít công hơn (phiên phân tích ước khoảng một nửa, chưa đo) |
| Dùng điểm tự tin của model để chia ca | Kho đã cấm (review phân loại §3.1 điều 4): điểm tự khai không hiệu chuẩn |
| Hai người gắn để đo đồng thuận | Chỉ có một người gắn; chế độ hai người đã tắt 07/11 (mục 35) |
| Trả hàng tồn về máy hàng loạt, không đọc | Mục 35 đã loại; mất luôn dữ liệu để đo |

### 5.3 Giới hạn của tài liệu này

- Không đo được độ đúng của trợ lý; chỉ nêu cách đo.
- Số ca biên của NB1, hệ số bắt lỗi, chi phí API và các ngưỡng ở mục 4.2 là ước hoặc đề xuất, ghi rõ ở từng chỗ.
- Thời gian duyệt từng lô của n2 lấy từ giờ ghi trong sổ của phiên gắn nhãn, không phải từ DB; phiên phân tích không tự xem bảng lô, chỉ có lời Mạnh rằng bảng hiện bằng chứng và suy luận.
- 232 thẻ «Bổ sung tin» không còn đề xuất: chưa mở từng thẻ.
- Phần so với ngành không có nguồn dẫn.
- Chưa đọc mã màn `/ops/review` đủ sâu để ước công thi công đường chấp thuận lô.
- Chưa đọc ADR-0018 (chưa có trên `main`).
- Phụ lục «chỗ đã sửa so với bản đầu» của bản làm việc không chép sang đây.

---

## Bốn câu đã trình Mạnh (đã chốt «Theo khuyến nghị cả bốn câu»)

**Câu 1. Cho phép «chấp thuận lô» ở `/ops/review` khi lô đã tách ca biên, đã soát mẫu ngẫu nhiên 75 thẻ và có lệnh rút
cả lô?** (sửa ROADMAP §3 mục 35, câu «duyệt hàng loạt đã loại»)
- Khuyến nghị: **Có**, cho hạng mục «Bổ sung tin», bắt đầu ở ô số (WC, phòng ngủ); ô loại hình và toà chỉ nhận lô khi
  mẫu 75 thẻ không có lỗi nào.
- Nếu có: Mạnh soát khoảng 75 thẻ mẫu mỗi lô cộng ca biên thay vì 786 thẻ. Vẫn cần một hàng thi công thêm đường chấp
  thuận lô trước khi dùng được.
- Nếu không: model vẫn nháp từng thẻ, Mạnh hoặc đội bấm từng thẻ; hàng tiếp tục dài thêm khoảng 28 thẻ mỗi ngày.

**Câu 2. Khi một ô xin tự áp (PL21), tập dùng để mở cổng là gì?** (FRAMING §5 đang để ngỏ)
- Khuyến nghị: **nhãn người duyệt nháp kèm hệ số bắt lỗi đo bằng thẻ cài**, ghi xuất xứ cạnh mọi số đo. Nhãn «máy lưu,
  người duyệt lô» vào được tập mở cổng khi cách duyệt lô đã có hệ số bắt lỗi riêng; trước đó chúng dùng được theo lời
  duyệt của Mạnh nhưng báo tách.
- Nếu chọn vậy: không ai phải gắn mù; đổi lại con số độ đúng là số ước có hiệu chỉnh, và cần lời riêng sửa FRAMING §5.
- Nếu giữ tập mù: không sửa luật; mỗi ô xin tự áp cần một lần 73–142 thẻ gắn không nháp.

**Câu 3. Đồng ý có thẻ cài lỗi (8–10% số thẻ, Mạnh biết có, không biết thẻ nào) trong các lát gắn nhãn và lô duyệt từ
lát kế?**
- Khuyến nghị: **Có**.
- Nếu có: sau 2–3 lát có một con số cho biết 105/110 thật ra nghĩa là gì, và duyệt lô ở nhịp sáng nay bắt được bao
  nhiêu phần lỗi; tốn thêm khoảng 20 thẻ mỗi lát.
- Nếu không: tỉ lệ giữ nháp vẫn là số duy nhất, và không ô nào đủ căn cứ lên nấc 3 nếu câu 2 không chọn tập mù.

**Câu 4. Chốt thang nấc 0–4, danh sách «không bao giờ quá nấc 1» (ký cổng, tiền, cloud, xoá dữ liệu, luật an toàn, gửi tin nhóm xã hội)
và luật «máy chỉ bấm Lưu vào lớp chờ, có ghi ai lưu» thành quyết định của kho, kèm ghi «trợ lý gắn nhãn trong phiên» vào
ADR-0007?**
- Khuyến nghị: **Có**, ghi thành một mục ROADMAP §3 mới; luật 7 giữ nguyên câu chữ, thêm một câu dẫn tới thang nấc. Trong
  lúc chờ NB2: hoặc gắn nhãn quay về nấc 1 (Mạnh bấm Lưu), hoặc tiếp tục duyệt lô như n2 với sổ CSV của phiên gắn nhãn
  làm bản ghi tạm về ai lưu, lô nào, giờ duyệt. Mạnh đã thấy n2 tin cậy nên phương án sau chấp nhận được; phiên phân tích nghiêng về
  nó nếu lát kế có thẻ cài.
- Nếu có: mọi đề xuất tự động hoá về sau nói bằng cùng một thang, lên nấc là một chữ ký ở cổng cho mỗi ô.
- Nếu chưa: NB1 và NB2 vẫn làm được như việc riêng lẻ; thang chỉ là tài liệu tham khảo.

---

## Phụ lục A. Lệnh đo

Tất cả chạy với `SET default_transaction_read_only = on;`.

| Số | Câu |
|---|---|
| Hàng duyệt theo loại, trạng thái, 7 ngày | `SELECT item_type,status,count(*),count(*) FILTER (WHERE created_at>now()-interval '7 days'),count(*) FILTER (WHERE decided_at>now()-interval '7 days') FROM review_queue GROUP BY 1,2` |
| Ai đóng thẻ (người hay bước máy) | `SELECT item_type,status,CASE WHEN decided_by ~ '^(usr_\|user:)' THEN 'nguoi' ELSE decided_by END,count(*),max(decided_at)::date FROM review_queue WHERE status<>'pending' GROUP BY 1,2,3` |
| Hạng mục của thẻ | `SELECT item_type, coalesce(evidence->>'kind',split_part(item_id,':',1)), status, count(*) FROM review_queue GROUP BY 1,2,3` |
| Thẻ Bổ sung tin còn hay hết đề xuất | `SELECT coalesce(p.status,'không có'),count(DISTINCT r.id) FROM review_queue r LEFT JOIN enrichment_proposals p ON p.review_id=r.id WHERE r.item_type='agent_output' AND r.status='pending' GROUP BY 1` |
| Đề xuất đang chờ theo ô | `SELECT field,source,count(*) FROM enrichment_proposals WHERE status='queued' GROUP BY 1,2` |
| Lát nhãn | `SELECT i.lat,count(DISTINCT i.item_id),count(DISTINCT l.item_id),count(l.*) FROM eval_label_items i LEFT JOIN eval_labels l USING(item_id) GROUP BY 1` · `SELECT count(DISTINCT labeler_id) FROM eval_labels` |
| Nhịp lưu của n1, n2 | mốc `max(labeled_at)` theo thẻ, lọc `stratum`, `lag()` theo thời gian; trung vị, p90 của khoảng < 900 giây; trung vị theo chặng 22 thẻ (chỉ đọc cột thời gian và nhóm) |
| Thẻ địa chỉ nhóm, theo từng thẻ | gộp `group_address_card_history` theo `card_code` (có `sua`, có `nhan`, có `bac`), nối `group_address_cards.status` |
| Thẻ luật | `SELECT source,can_cu,so_ma,decided_at FROM project_link_rules` |
| Đề xuất làm giàu | `SELECT route,status,source,count(*),count(*) FILTER (WHERE reverted_at IS NOT NULL) FROM enrichment_proposals GROUP BY 1,2,3` |
| Phát biểu theo bậc, lý do rút | `SELECT evidence_tier,method,count(*) FROM field_assertions GROUP BY 1,2` · `SELECT method,retract_reason,count(*) FROM field_assertions WHERE retracted_at IS NOT NULL GROUP BY 1,2` |
| Nhãn bạc, chi phí | `SELECT model,prompt_version,count(*),sum(cost_usd) FROM silver_labels GROUP BY 1,2` |
| Lời gọi model 7 ngày | `SELECT viec,model,count(*),avg(ok::int) FROM ai_calls WHERE at>now()-interval '7 days' GROUP BY 1,2` |
| Nhật ký quyết thẻ | `SELECT action,count(*),max(at)::date FROM ops_audit GROUP BY 1` |
| Hồ sơ nghiệm thu | `grep -h "^status:" _acceptance/*/contract.md \| sort \| uniq -c` |
| Giữ nháp, ai lưu | đếm trên sổ đối chiếu của phiên gắn nhãn ở máy thu: so `de_xuat_*` với `luu_*` sau khi bỏ dấu và ký hiệu; cột `manh_sua` ghi ai lưu và lô nào; nhóm lấy từ `eval_label_items.stratum` |

## Phụ lục B. Cách tính

- Wilson 95%: tâm = (p + z²/2n) / (1 + z²/n); nửa rộng = z·√(p(1−p)/n + z²/4n²) / (1 + z²/n); z = 1,96.
- 105/110 → 0,898–0,980. 0/110 sửa ngược → cận trên 3,4%. 29/44 → 0,511–0,781. 30/30 → cận dưới 0,887.
  119/120 → cận dưới 0,954.
- Bảng 4.4: với mỗi ngưỡng và số lỗi `x`, tăng `n` từ `x + 1` tới khi cận dưới Wilson của (n − x)/n đạt ngưỡng.
- Thời gian mỗi thẻ trong lô n2 = (giờ duyệt lô − giờ soạn lô) / số thẻ của lô; 9 lô cho 23,9 · 4,7 · 4,8 · 13,4 · 2,9
  · 3,7 · 2,7 · 3,3 · 5,3 giây; trung vị 4,7.
