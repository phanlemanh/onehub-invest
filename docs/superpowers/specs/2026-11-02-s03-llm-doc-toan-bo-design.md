# LLM đọc toàn bộ chữ S03 ở lớp đề xuất — thiết kế

Hàng LS1, việc 4 của `docs/plan/ra-mat-0511-so-luong-chat-luong.md`. Mốc 04/11. Bản nháp theo khuyến nghị; năm câu Hỏi-1 tới
Hỏi-5 chờ Mạnh ở Cổng Phạm vi. Lời chốt 02/11 ghi áp cả ý định; nháp chỉ áp loại hình, hệ quả ở mục 5.

## Số đo trước khi thiết kế (02/11, chỉ đọc, 0 USD)

Lệnh `agent/scripts/enrich-run.ts` KHÔNG chạy trọn 2.772 tin:

| Chặn | Số |
|---|---|
| Chỉ chọn `kind = sale`, độ tin cao hoặc vừa, còn thiếu trường | tối đa 854/2.772; 1.918 tin thuê bị loại |
| Cửa sổ 30 ngày không bốc lại tin đã thử | 149 tin đang nằm trong cửa sổ (kể cả S05) |
| `LIMIT` mặc định | 50 tin một lượt |
| Cắt chữ | 500 ký tự |
| Model | Qwen local, không có trần tiền, không trích dẫn |

Lệnh `agent/scripts/nhan-bac-run.ts` (KC1) có trần tiền, trích dẫn, kiểm trích dẫn và bảng `silver_labels`, nhưng đi theo bài chứ
không theo tin, chỉ hỏi ý định và bán/thuê, không ghi đề xuất. Chưa chạy thử trên toàn bộ: chạy là tốn tiền hoặc tốn giờ máy.

Hiện trạng: 2.772 tin S03, 2.671 tin loại hình `unknown`, 2.741 tin có chữ dài hơn 20 ký tự, 146 tin có đề xuất (5,3%), 120 tin có
đề xuất đã áp (4,3%), 147 thẻ đang chờ. Kế hoạch ghi ≤ 236 và 114: số hôm nay khác, hợp đồng dùng lệnh đếm mới. Không có cột
`listing_intent` nào ngoài `silver_labels`: «trục chưa có cột» (050).

## Tiền

Giá đo trước đây: Haiku 0,00066–0,00078 USD/bài (`docs/research/s03-audit-trich-xuat-0211.md`). «Khoảng 6 USD» của kế hoạch là số
cho **khoảng 38.000 bài cũ**. Đọc một bài mới nhất của 2.741 tin có chữ thì khoảng **2,2 USD** (ước, chưa đo trên prompt mới).
Hai con số Mạnh cần thấy: trần tổng ~6 USD của kế hoạch, và «chi cloud không quá 5 USD/ngày» của hàng. Nháp: trần lượt đầu 3 USD, nằm
dưới cả hai; 5 USD/ngày giữ làm ngưỡng báo đỏ.

## Thiết kế

Thêm lệnh `agent/scripts/doc-toan-bo-s03.ts`, lõi ở `agent/src/enrich/doc-toan-bo.ts`, dùng lại `chayLo` (trần tiền) và `silver_labels`.

1. **Chọn tin:** mọi tin S03 có chữ, không lọc `kind`, độ tin, trường thiếu; không `LIMIT` mặc định. Tin không chữ đếm riêng.
2. **Đọc:** bài mới nhất của tin, trọn chữ, đã gạt SĐT, email, link; không gửi tên nguồn, tên nhóm thật không gửi. Model trả
   ý định, bán/thuê, loại hình, giá, diện tích, mỗi thứ một câu trích.
3. **Lưu:** một dòng `silver_labels` mỗi bài, phần thêm ở cột `probabilities` với `prompt_version` riêng, cùng cách `vlm-anh-tin-s03` đã
   làm, không migration. Cùng chữ cùng model không gọi lại, nên chạy lại rẻ và dừng giữa chừng được.
4. **Loại hình:** tin `unknown` sinh đề xuất `e2_llm`. Trích dẫn có thật trong chữ VÀ chứa từ khoá của đúng loại hình trong bảng luật
   `agent/src/enrich/luat-trich-dan.ts` → `corroborated` `trich-dan:<mã luật>`, áp qua `apply_enrichment`. Không đạt → đề xuất `skipped`
   kèm lý do, không thẻ. E1 trái LLM vẫn lên thẻ như `routeFields` hiện có.
5. **Ý định (Hỏi-1, nháp B):** không thêm cột. Mọi tin đang ở `sale_offers` là tin rao theo bộ đọc, nên LLM nói `inquiry` hoặc
   `not_listing` kèm trích dẫn thật là bất đồng và lên thẻ. Duyệt chỉ ghi phán quyết, không gỡ tin: tin Yêu cầu vẫn trong dữ liệu, kể cả khi S03
   lên cổng, tới khi có việc lọc riêng. Khác lời chốt, nên phải có Mạnh duyệt.
6. **Giá, diện tích:** chỉ so. Lệch quá ngưỡng (giá > 10%, diện tích > 3%, theo `eval-classify-wilson`) lên thẻ; không có cột nào đổi.
7. **Thẻ:** một thẻ mỗi tin, chính thẻ `enrich:<offer_id>`; thêm `evidence.doi_chieu` (câu trích, loại, hai giá trị) và một khối hiện trong `AgentOutputCard`. Trần thẻ mới mặc định 500.
   | Bất đồng | Duyệt | Bác | Lưu |
   |---|---|---|---|
   | Đề xuất loại hình E1 trái LLM | áp bên được chọn | bác cả hai | đề xuất, phát biểu |
   | Ý định, giá, diện tích | không đổi tin | không đổi tin | `ops_audit` |
8. **Đếm:** `--dem` in số tin đã đọc, có đề xuất (riêng `skipped`), có AI đã áp, tỉ lệ cuộc gọi thành công, chi phí theo ngày, số thẻ.
9. **Mẫu:** `--mau N` chạy với tệp nhãn loại hình, in độ đúng, tỉ lệ áp, số thẻ, chi phí; lượt thật từ chối chạy khi chưa có mẫu đạt ngưỡng cho cùng prompt.

Lớp đề xuất không vượt luật 7: máy áp vì trích dẫn nguyên văn và bảng từ khoá xác định, độ tự tin của model không phải căn cứ.
`revert_enrichment` có sẵn là đường lui.

## Không làm

PN, WC, đường, toà từ lượt này chỉ lưu vào nhãn (Hỏi-4), không sinh đề xuất, vì 2.700 tin sẽ thành hàng nghìn thẻ. Lịch đêm cho tin mới, lọc tin
`inquiry` khỏi cổng, đọc nhiều bài của một tin là việc sau.

## Rủi ro

- Bộ nhãn 383 bài (`research-local/s03-audit-0211/labels_all.json`, gitignored) do tác tử Claude gắn, 339 bài căn hộ, chỉ 4 bài loại khác. Đo lại không gọi API: Haiku nói căn hộ đúng 183/183, nói loại khác đúng 1/10. Con số căn hộ yếu vì gần như mọi bài là căn hộ; loại khác vì thế không tự điền, ma trận bẫy và mẫu mới gánh phần còn lại. Mẫu 383 bài ước 0,27 USD.
- Đích 50% chưa đo được khả thi: phụ thuộc số bài có từ khoá loại hình. Bài chỉ có «2PN 14tr» sẽ không áp.
- Số thẻ chưa đo; ý định lệch khoảng 4–5% trên nhãn audit, tức khoảng 110–140 thẻ, chưa kể giá và diện tích. Mẫu 30 tin cho số đầu.
- Tin có nhiều bài chỉ đọc bài mới nhất.
