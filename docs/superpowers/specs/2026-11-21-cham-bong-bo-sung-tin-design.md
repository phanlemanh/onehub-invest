# NB1 — Chấm bóng hàng «Bổ sung tin» bằng hai lần đọc độc lập (thiết kế)

Hàng lộ trình NB1 (`docs/plan/lo-trinh.json`, đợt `nguoi-o-bien-2111`). Căn cứ: ROADMAP §3 mục 61 (Mạnh «Theo khuyến nghị cả bốn
câu», 21/11), tài liệu khung `docs/research/nguoi-o-bien-khung-2111.md` (§1.2 ca biên, §2.2 hàng «Bổ sung tin», §4.6 cách B,
§4.8 bảng lô), bản phạm vi `docs/plan/pham-vi-nguoi-o-bien-2111.md`. Người đọc đầu ra phía sau: NB5 (bảng lô, chấp thuận lô).

## Vấn đề

Hàng «Bổ sung tin» ở `/ops/review` có 1.018 thẻ chờ, 7 ngày vào 197, người quyết 0. Mục 61 cho chấp thuận theo lô khi lô đã
tách ca biên. Muốn tách ca biên thì cần biết, cho từng đề xuất, hai lần đọc độc lập nói gì. NB1 làm đúng việc đó, **không ghi gì
vào tin, không đóng thẻ, không đổi đề xuất** (chấm bóng).

## Số xuất phát (đếm trên DB máy thu, 21/11 ~01:40Z, chỉ đọc)

| Đếm | Số |
|---|---|
| Thẻ `agent_output` đang chờ | 1.018 |
| … còn đề xuất `queued` | 786 thẻ, 1.078 đề xuất |
| … không còn đề xuất nào nối vào | 232 thẻ (`fields = []`, chỉ có khối đối chiếu) |
| Thẻ «Để sau» còn đề xuất | 4 thẻ, 4 đề xuất (ngoài phạm vi: không ở trạng thái chờ) |
| Đề xuất chờ theo ô · nguồn | loại hình 509 E2 + 88 E1 · số WC 220 E2 · toà 174 E2 + 4 E1 · phòng ngủ 67 E2 · đường 16 E2 |
| Thẻ có ≥ 2 giá trị khác nhau cho cùng ô | 94 (loại hình 90, toà 4) |
| Đề xuất mà tin đã có giá trị bậc «observed» | phòng ngủ 59/67 · toà 25/178 · loại hình 4/597 (loại hình 520 là bậc «inferred», điền được) |
| Bài đầy đủ đọc được | 786/786 (S03 768 thẻ, S05 18 thẻ); chữ trên thẻ cắt 300 ký tự nên phải đọc bài gốc |
| Độ dài bài | trung vị ~180 ký tự, p95 ~510 |
| Model đã đề xuất | qwen27b 480 thẻ, Haiku qua gateway 306 thẻ |

232 thẻ không còn đề xuất: loại đối chiếu `y_dinh` 123 · `gia` 102 · `dien_tich` 5 · `gia+y_dinh` 2; đề xuất cùng tin: không có
143, đã áp (corroborated/direct) 58, đã bỏ qua (skipped) 29 + 2 hỗn hợp. Sinh từ lượt `doc-toan-bo` 03–05/11 (198) và lượt
`enrich` hằng ngày (34).

## Thiết kế

### 1. Hai lần đọc mù, luật so xác định

Đơn vị lời gọi: **một thẻ × một model** — mỗi thẻ chờ còn đề xuất được gọi đúng hai lần (hai model), mỗi lần đọc mọi ô có đề xuất trên
thẻ. Kết quả ghi theo từng đề xuất; hai đề xuất cùng ô trên một thẻ (94 thẻ, «lệch trên thẻ») dùng chung lần đọc của ô đó.

Mỗi lần đọc nhận: chữ bài gốc đầy đủ (`stg_zalo_posts.text` theo `post_ids` của tin — cả S03 lẫn S05, cùng câu đọc với `agent/src/enrich/run.ts`), tên nhóm, và danh
sách ô cần đọc (chỉ các ô có đề xuất trên thẻ). Lần đọc **không** thấy giá trị đề xuất, không thấy model đã đề xuất, không thấy
lần đọc kia. Mỗi ô trả: giá trị hoặc rỗng, đoạn trích nguyên văn, căn cứ một câu. Không có điểm tự tin (luật 7, review phân loại
§3.1 điều 4).

Kết cục của từng đề xuất do **luật xác định** tính, không do model:

| Kết cục | Điều kiện | Ca biên? |
|---|---|---|
| `khop` | Hai lần đọc có giá trị hợp lệ, bằng nhau, và bằng giá trị đề xuất | không («trong lòng») |
| `bo_trong` (B1) | Ít nhất một lần đọc rỗng, hoặc giá trị không hợp lệ (trích không có thật trong bài, loại hình ngoài từ vựng, số không phải số nguyên) | có |
| `lech_hai_lan` (B2) | Hai lần đọc có giá trị hợp lệ và khác nhau | có |
| `bac_dong_thuan` (B2) | Hai lần đọc bằng nhau nhưng khác giá trị đề xuất | có |
| `lech_tren_the` (B2) | Thẻ có ≥ 2 đề xuất giá trị khác nhau cho cùng ô — đánh dấu thêm, bất kể kết cục trên | có |

Lời gọi lỗi (gateway, hết tiền, lời đáp không đọc được) không sinh kết cục và không tính là `bo_trong`; đề xuất của thẻ đó
nằm ở cột «chưa đủ hai kết quả» của báo cáo cho tới khi chạy lại thành công.

So giá trị theo khoá `assertion_value_key` (migration 045: số bỏ khoảng trắng và số 0 đầu, chữ so không phân biệt hoa thường).
Trích kiểm bằng `trichCoThat` có sẵn (`agent/src/enrich/luat-trich-dan.ts`). Nhãn phụ `o_da_co`: tin đã có giá trị bậc
`observed` cho ô đó, tức áp đề xuất sẽ bị bỏ qua (fill-gap) — không phải ca biên, chỉ để NB5 biết.

B3 (giá trị chưa có trong danh bạ) và B4 không làm ở hàng này (xem Ngoài phạm vi).

### 2. Model, đường gọi, sổ gọi

Hai lần đọc là hai model khác nhau trong danh sách đóng đã duyệt (`MODEL_DUYET` của `agent/src/enrich/doc-gop-s03/cau-hinh.ts`).
Khuyến nghị: **Claude Haiku 5.5 và DeepSeek V4.1 Flash** (Hỏi-1). Gọi qua đường và cờ gửi có sẵn (gateway không giữ dữ liệu,
không huấn luyện, DeepSeek chỉ qua Baseten; Haiku được đi đường Anthropic thẳng). Lời nhắc dùng lại khung đọc năm ô của
`doc-gop-s03` (prompt đã đo trên S03), một model một lời gọi, không gộp.

Mã đặt ở `agent/` (không ở `pipeline/` như vùng ban đầu của hàng) vì cờ gửi, danh sách model đã duyệt và sổ `ai_calls` đều ở đó;
viết lại ở `pipeline/` là chép luật an toàn ra hai chỗ.

Mỗi lời gọi một dòng sổ gọi (`viec = 'cham-bong-bo-sung-tin'`, model có tiền tố đường, token, độ trễ, ok/lỗi), đúng khuôn
`ai_calls` (migration 052).

### 3. Chi phí và trần

Ước: ~1.200 token vào, ~200 token ra mỗi lời gọi; 786 thẻ × 2 lời gọi (1.572 lời gọi) ≈ 0,2 USD (Haiku) + 0,5 USD (DeepSeek) ≈ **0,7 USD** cho
lượt đầy đủ. Trần đề xuất **3 USD mỗi lượt** (Hỏi-2): bộ chạy cộng chi phí theo token thật trả về; lời gọi kế tiếp làm tổng vượt
trần thì dừng trước khi gọi, ghi số đã gọi. Đơn giá lấy từ bảng có sẵn (`agent/config/doc-gop-s03.json`), không đoán.

### 4. Kết quả lưu ở đâu

Khuyến nghị (Hỏi-3): **tệp JSONL ở máy thu**, `state/cham-bong-bo-sung-tin/` (gitignored, không lên cloud, không commit), mỗi
dòng một (thẻ, đề xuất, lần đọc) kèm khoá băm đầu vào; một tệp tổng kết theo lượt. Không migration, hàng giữ T2. NB5 cần dữ liệu
trong DB để vẽ bảng lô thì nạp tệp này bằng migration của chính NB5. Lối khác: bảng mới ngay ở NB1 (migration sau 124, số xin
giám sát, hàng thành T3).

Chạy lại cùng đầu vào: khoá = băm(chữ bài, tên nhóm, tập ô cần đọc, model, phiên bản lời nhắc) cho mỗi cặp thẻ × model. Khoá đã
có kết quả **thành công** → không gọi model, không ghi dòng mới. Lời gọi lỗi không lưu vào khoá, nên lần chạy lại chỉ gọi đúng các
cặp lỗi hay chưa chạy (lượt dừng vì trần chạy tiếp được, không tốn lại).

### 5. Không ghi tin

Bộ chạy đọc DB trong giao dịch `READ ONLY`. Thứ duy nhất được ghi vào DB máy thu là dòng sổ `ai_calls` ở lượt áp (mục 6).
Phép đo trên DB của riêng lượt: băm trọn từng dòng của mọi bảng trừ `ai_calls` (gồm `field_assertions`, bảng bộ phân xử đọc để
dựng ô tin) trước và sau, ở cả chế độ thử lẫn chế độ áp — phải bằng nhau. Trên DB máy thu (lượt thử, lượt áp): băm ba bảng tin, đề
xuất, thẻ và đếm `field_assertions`.

### 6. Lượt chạy

- **S4 (chấm):** test trên DB của riêng lượt với model giả lập (xác định); một **lượt thử thật 30 thẻ** trên DB máy thu (chỉ
  đọc) với hai model thật, sổ gọi ghi vào tệp, chi phí ~0,03 USD.
- **Lượt áp (sau khi gộp, từ `main`, theo chữ ký Cổng Bằng chứng — ROADMAP §3 mục 50):** chạy đủ 786 thẻ, ghi `ai_calls` vào DB
  máy thu. Hồ sơ ghi đủ năm thứ: lệnh áp, số chạy thử (lượt 30 thẻ), sao lưu trước (`ai_calls` chỉ thêm dòng; chụp số dòng và
  `max(id)` trước), cách lùi (dòng `ai_calls` mang `trace` của lượt — xoá là lời riêng của Mạnh, mặc định để nguyên), lệnh kiểm sau.

Thứ tự trong lượt: ô số trước (số WC, phòng ngủ), rồi toà, đường, loại hình — để lượt bị dừng giữa chừng vẫn cho ô số trước
(mục 61, câu 1).

### 7. 232 thẻ không còn đề xuất

Chỉ kê, không đóng (đóng thẻ là đổi `review_queue`). Lệnh kê in số theo loại đối chiếu × trạng thái đề xuất cùng tin × lượt sinh,
kèm câu SQL để người đếm lại. Xử lý 232 thẻ (đóng, giữ, chuyển hạng mục) là việc sau, người quyết.

### 8. Báo cáo

Lệnh in bảng: ô × kết cục (khop / từng loại ca biên) × nguồn E1/E2, số `o_da_co`, số lời gọi, token, chi phí. In lại được từ tệp
kết quả, không gọi model.

## Phương án đã loại

- **Model chấm đề xuất (thấy giá trị đề xuất, trả ghi nhận/bác):** đúng chữ tài liệu khung nhưng neo model vào đề xuất; đọc mù rồi
  luật so cho cùng «ghi nhận/bác» mà không neo.
- **Dùng lại nhãn bạc Haiku (`silver_labels`) làm một lần đọc:** rẻ hơn 0,2 USD nhưng khác phiên bản lời nhắc với lần đọc kia; hai
  lần đọc nên cùng lời nhắc.
- **Ghi phát biểu vào `field_assertions`:** bộ phân xử đọc bảng này để dựng ô tin — ghi vào là đổi tin, không còn là bóng.
- **Một model đọc hai lần:** không độc lập.

## Đặc tả UX

Không chạm giao diện (bảng lô là NB5).
