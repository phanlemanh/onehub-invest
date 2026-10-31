# Cảm xúc của tin đăng — chữ «ngộp» có báo deal hời không? (31/10/2026)

- **Ý của Mạnh** (31/10): giọng điệu và chữ dùng trong tin rao bán (bán gấp, cắt lỗ, ngộp bank, tặng nhà, không thể rẻ
  hơn…) có thể là chỉ dẫn quan trọng của BĐS giá thấp và chủ sẵn sàng đàm phán. Mạnh chốt hướng: **đo bằng Kev-4B**
  (model quyết định local :8009), không dựa vào regex.
- **Trạng thái**: nghiên cứu + một phép đo thô. Chưa có code, chưa có hàng lộ trình; đề xuất ở §7 chờ Mạnh gật.
- **Cách đo**: DB máy thu :5433, chỉ `SELECT`, đo 31/10 trên `main` `2969d62c`. Kev-4B gọi qua `127.0.0.1:8009`
  (`kev-4b-qwen3`). Không ghi DB, không áp migration. Script chạy lại được ở `research-local/cam-xuc-tin-dang-3110/`
  (gitignored). Tài liệu chỉ gọi nguồn bằng mã `S0x`, không chép văn bản tin.
- Đọc kèm: `investment-pipeline-4-stages.md` §2.3 (giai đoạn 2 cần «tín hiệu gấp»), `s03-boc-tach-cau-truc-3010.md`
  §8 (Kev làm gì tốt, hỏng ở đâu), `decision-models-landscape.md` (họ Kev/Jev).

## 0. Kết luận một đoạn

Chữ kể **hoàn cảnh thật của chủ** (cắt lỗ, ngộp bank, kẹt tiền, định cư/chia tài sản) đi kèm giá/m² **thấp hơn
trung vị cùng phường + loại hình khoảng 6–7%** trên S06. Khoảng tin 95% không chạm 1, và hiệu ứng có ở cả căn hộ,
nhà lẫn đất. Gỡ bớt hai nhiễu (chữ rủi ro pháp lý, người bán là môi giới lớn) thì tín hiệu yếu đi nhưng không mất:
còn ~4,5% với tin sạch pháp lý, và **~10% với người bán ít tin**. Chữ **quảng cáo giá** («thương lượng», dấu chấm
than, tin dài) **không mang tín hiệu**, thậm chí ngược dấu. Kev-4B tách được nhóm hoàn cảnh khỏi nhóm thường trên mẫu
thử 40 tin, nhưng thang điểm bị nén và có bỏ sót, nên cần tập nhãn ~200 tin trước khi tin vào điểm. Phần «chủ dễ
xuống giá» **chưa đo được**: lịch sử đổi giá mới bắt đầu ghi từ 30/10.

## 1. Giả thuyết — tách làm hai

«Deal hời» có hai nghĩa khác nhau, và mỗi nghĩa cần một phép đo riêng:

| | Giả thuyết | Đo bằng | Đo được hôm nay? |
|---|---|---|---|
| **H1 — giá đã thấp** | Tin có tín hiệu áp lực bán rao giá/m² thấp hơn thước khu vực | `price_perm2` ÷ trung vị S06 cùng `area_id` × `property_type` (thước P2, `investment-pipeline-4-stages.md` §2.1) | **Có** (S06); S03 chưa |
| **H2 — chủ dễ xuống giá** | Tin có tín hiệu xuống giá sau đó nhiều hơn / nhanh hơn, hoặc ra khỏi thị trường nhanh hơn | `history_transactional` `price_change` + `OffMarketTimestamp` / `DaysOnMarket` (ADR-0013 §7) | **Chưa**: mới có 93 lần đổi giá, tất cả ngày 30/10 |

Giá rao vẫn chỉ là P2, chưa phải giá giao dịch. H1 đúng cũng mới nghĩa là «rao rẻ hơn», chưa phải «mua được rẻ hơn».

## 2. Tín hiệu — ba họ, không trộn

| Họ | Ví dụ | Nằm ở đâu | Ai nhận ra |
|---|---|---|---|
| **A. Hoàn cảnh chủ** (cảm xúc thật) | cắt lỗ · ngộp bank / lãi vay · kẹt tiền / xoay vốn · định cư / xuất cảnh / chia tài sản / ly hôn · đổi chỗ ở | chữ tin (`PublicRemarks`) | **Kev-4B** (`score` áp lực + `choice` lý do) |
| **B. Lời quảng cáo giá** | không thể rẻ hơn · giá sốc · rẻ nhất · tặng nhà · thương lượng · bớt lộc · dấu chấm than | chữ tin | Kev (lớp `quang_cao` của câu lý do); không cộng điểm |
| **C. Hành vi** (đã có trong dữ liệu) | xuống giá giữa các lần đăng · đăng lại (`n_reposts`) · tin treo lâu · người bán đăng nhiều tin · tự khai «giảm X tỷ còn Y tỷ» trong chữ | `history_transactional`, `sale_offers`, `seller_info` | luật xác định (SQL) |

Họ C là thứ đối chứng cho họ A, không phải thứ thay thế: nếu chữ «ngộp» thật, nó phải đi trước hoặc đi cùng hành vi
xuống giá.

## 3. Phép đo thô H1 (31/10, regex làm đại diện tạm cho Kev)

Phạm vi: 10.888 tin bán S06 đang sống, ghép được tin gốc trong `stg_chotot_ads`, trong nhóm phường × loại hình có
≥ 15 tin. Tỉ số = giá/m² ÷ trung vị nhóm. KTC 95% = bootstrap 2.000 lần trên trung vị.

### 3.1 Mức xuất hiện (toàn bộ tin, chưa gộp bài trùng)

| Nhóm chữ | S06 (31.680 tin) | S03 (39.467 bài) |
|---|---|---|
| thương lượng / bớt lộc | 13,4% | 0,3% |
| bán gấp / cần tiền gấp | 4,3% | 1,1% |
| kẹt tiền / định cư / ly hôn | 1,0% | ~0% |
| rẻ nhất / giá sốc / không thể rẻ hơn | 0,8% | 1,1% |
| ngộp bank | 0,6% | ~0% |
| tặng nhà | 0,6% | 0 |
| cắt lỗ / bán lỗ | 0,5% | 2,5% |

### 3.2 Giá so với thước khu vực (S06)

| Nhóm | n | Trung vị tỉ số | KTC 95% | % tin < 0,8 thước |
|---|---|---|---|---|
| không chữ nào | 6.915 | 1,000 | 0,997–1,002 | 23,1 |
| thương lượng | 2.984 | 1,009 | 1,000–1,023 | 22,0 |
| bán gấp | 1.088 | 0,980 | 0,962–1,000 | 25,2 |
| rẻ nhất / giá sốc / tặng nhà | 178 | 0,933 | 0,902–0,967 | 28,1 |
| cắt lỗ | 143 | 0,921 | 0,883–0,962 | 35,7 |
| ngộp bank | 49 | 0,918 | 0,834–1,000 | 32,7 |
| kẹt tiền / định cư | 173 | 0,955 | 0,889–1,000 | 34,7 |
| **gộp hoàn cảnh** (cắt lỗ ∪ ngộp ∪ kẹt tiền) | **352** | **0,935** | **0,900–0,962** | **35,2** |
| ≥ 3 dấu chấm than | 364 | 1,003 | 0,984–1,031 | 19,5 |
| tin dài > 1.500 ký tự | 83 | 1,172 | 1,046–1,303 | 18,1 |
| tự khai «giảm… còn…» | 611 | 0,989 | 0,959–1,001 | 25,7 |

Theo loại hình (hoàn cảnh ↔ không chữ): căn hộ 0,956 ↔ 1,000 · nhà 0,916 ↔ 0,997 · đất 0,923 ↔ 1,004.

### 3.3 Hai nhiễu đã thấy

1. **Rẻ có lý do**: nhóm hoàn cảnh có chữ rủi ro pháp lý (sổ chung, giấy tay, chưa sổ, quy hoạch, tranh chấp, hẻm
   nhỏ) **14,8%**, nhóm thường 8,2%. Bỏ các tin đó thì còn **0,958** (0,925–0,995) ↔ 1,004. Tín hiệu yếu đi khoảng
   một phần ba nhưng vẫn còn.
2. **Môi giới dùng chữ ngộp làm mẫu câu**: tách theo số tin đang đăng của người bán (`seller_info.live_ads`):

   | Người bán | Hoàn cảnh (n, trung vị, KTC) | Không chữ |
   |---|---|---|
   | ≤ 2 tin (gần chính chủ) | 68 · **0,927** (0,852–1,022) | 1,029 |
   | 3–9 tin | 94 · **0,877** (0,780–0,960) | 0,982 |
   | ≥ 10 tin (môi giới lớn) | 190 · 0,956 (0,916–1,005) | 1,000 |

   Khoảng cách với nhóm thường ở người bán ít tin là ~10 điểm, ở môi giới lớn chỉ ~4 điểm. Mẫu thử Kev (§4) cũng
   thấy cụm «kẹt tiền bán gấp» đứng đầu tin của dự án căn hộ, trong khi giá rao cao hơn thước 30–45%.

Diện tích không giải thích được chênh lệch (trung vị 62 m² ↔ 61 m²). Hiệu ứng tập trung ở căn < 100 m²; nhóm
≥ 100 m² không thấy (1,010 ↔ 1,000).

### 3.4 Giới hạn của phép đo thô

- Regex chỉ là đại diện tạm: bắt sót hoàn cảnh không dùng từ khoá, và không hiểu phủ định.
- Thước là trung vị phường × loại hình, chưa trừ vị trí trong phường (mặt tiền ↔ hẻm), tình trạng nhà hay tầng.
- **S03 chưa đo được**: trong 503 tin bán S03 đang sống, hầu hết thiếu `area_id` hoặc `property_type` (phụ thuộc
  việc bóc tách ở `s03-boc-tach-cau-truc-3010.md`). Mà S03 lại là nơi «cắt lỗ» dày nhất (2,5%) và là nguồn P1.
- Một lát cắt thời gian (S06 thu 21–30/10).

## 4. Thử Kev-4B trên 40 tin S06

Hai câu hỏi typed, cùng một lượt gọi `/v1/systemone`:

- `ap_luc` (`score`, 3 mức): không dấu hiệu · chút mong bán nhanh · áp lực rõ, nêu hoàn cảnh cụ thể. Lời dặn chỉ tính
  hoàn cảnh thật, không tính quảng cáo.
- `ly_do` (`choice`): nợ ngân hàng · cần tiền / kẹt vốn · định cư / đổi chỗ ở / chia tài sản · cắt lỗ · chỉ quảng cáo ·
  không nêu.

| Nhóm mẫu (theo regex) | n | Điểm `ap_luc` TB (min–max) | `ly_do` |
|---|---|---|---|
| hoàn cảnh | 20 | 1,57 (1,25–1,95) | cần tiền 13 · không rõ 3 · cắt lỗ 2 · nợ NH 2 |
| chỉ «thương lượng» | 10 | 1,11 (0,90–1,32) | không rõ 10 |
| không chữ nào | 10 | 1,10 (1,00–1,20) | không rõ 9 · cần tiền 1 |

Đọc từng tin:
- **Tốt**: tách được nhóm. Kev xếp toàn bộ tin chỉ có «thương lượng» vào «không nêu lý do», đúng như đoán. Nó còn bắt
  được một tin «gia đình cần chuyển chỗ ở» mà regex bỏ sót.
- **Sót**: một tin ghi rõ «chủ ngộp bank» chỉ được 1,29 và lý do «không rõ». Thang điểm bị nén quanh 1, ít tin nào
  lên gần 2.
- **Chậm hơn số cũ**: ~1 giây/tin với chữ ≤ 1.500 ký tự (số 81 ms trước đây đo trên bài ngắn). Quét ~70 nghìn tin mất
  khoảng 20 giờ: chạy được một mẻ qua đêm, chưa hợp chạy từng tin theo thời gian thực.
- README của Kev tự cảnh báo xác suất **chưa hiệu chuẩn trên nguồn mới** (≥ 0,9 cho câu sai ở 8,2% câu hỏi). Phải
  đo trên dữ liệu của mình trước khi chọn ngưỡng.

## 5. Ranh giới kiến trúc (kiểm 8 câu ADR-0013)

1. **Lớp**: tín hiệu thuộc **tin** (`Property`), không thuộc căn. Một căn có thể có tin «ngộp» của môi giới A và tin
   bình thường của môi giới B. Lên căn chỉ dưới dạng tổng hợp (ví dụ «có ít nhất một tin chính chủ có tín hiệu áp lực
   trong 30 ngày»).
2. **RESO DD 2.1**: text tin là `PublicRemarks`. Lookup gần nhất là `SpecialListingConditions` (Short Sale, In
   Foreclosure, Notice Of Default, Auction, Probate…), nhưng các giá trị đó là **điều kiện pháp lý của niêm yết**,
   không phải động cơ của chủ. Chỉ map khi chữ nói đúng sự kiện pháp lý (ví dụ ngân hàng phát mại → `In
   Foreclosure`/`Auction`). Động cơ bán (`SellerMotivation`: điểm + lý do) **không có trong DD** → cần một extension
   mới trong sổ ADR-0013 §9, khai đủ sáu điều kiện ADR-0011. *Khi làm phải tra lại DD 2.1 bản đang dùng, tài liệu
   này chưa tra từng lookup value.*
3. **Khoá**: gắn vào `OriginatingSystemKey` của tin; điểm là phát biểu theo phiên bản text (tin sửa chữ → chấm lại).
4. **Ai ghi**: Kev ghi **`FieldAssertion`** (`Method = kev-4b@<rev>`, `EvidenceTier` = suy luận), không `UPDATE` cột
   chuẩn. Đúng luật 7: LLM chỉ judge/extract.
5. **Bằng chứng**: Kev không trích câu. Với tin vượt ngưỡng, cần một bước nữa lấy **đoạn trích** (câu chứa hoàn
   cảnh): regex/luật hoặc Qwen 27B local có trích dẫn. Không có đoạn trích thì không hiện lên đâu cả.
6. **Thời gian**: điểm có `ObservedTimestamp`; H2 dựa vào `HistoryTransactional` đã chạy từ 30/10.
7. **Nâng bậc**: không nâng bậc dữ liệu căn. Đây là một **thuộc tính suy luận mới** phục vụ giai đoạn 2 (chọn deal).
8. **SPL**: chữ tin đã được lên cloud cho vai `ops` (ADR-0007 sửa 26/10); người bán là tầng C. Điểm và lý do không
   chứa tên nguồn. Kev chạy local, không cần gửi chữ ra ngoài.

Metric (tỉ lệ tin có tín hiệu theo phường, chênh giá trung vị theo nhóm) tính sẵn ở `pipeline/sql`, React chỉ đọc
(luật 10).

## 6. Rủi ro

| Rủi ro | Mức | Cách chặn |
|---|---|---|
| **Rẻ có lý do** (pháp lý, hẻm, hư hỏng): nhãn chỉ báo «rẻ», không báo «hời» | cao | luôn hiện kèm cờ pháp lý; đo H1 sau khi trừ pháp lý (§3.3) |
| **Môi giới dùng chữ ngộp làm mẫu câu** | cao, đã thấy | đặt trọng số theo loại người bán (số tin đang đăng, vai người bán ở danh bạ Người); câu `ly_do` có lớp `quang_cao` |
| **Goodhart**: hiện công khai thì môi giới sẽ chèn chữ để lọt bộ lọc | trung bình | chỉ hiện ở `/ops/**` cho tới khi H2 đứng được; điểm dựa thêm vào hành vi (họ C), không chỉ chữ |
| **Xác suất Kev chưa hiệu chuẩn** trên tin VN | trung bình | tập nhãn ~200 tin, đo Brier/độ chính xác, chọn ngưỡng theo cận dưới Wilson như F3 |
| **Hoàn cảnh riêng tư** (ly hôn, nợ, bệnh) hiện trên trang công khai thì gây hại cho người đang khó khăn, dù người bán là tầng C | trung bình | Invest Portal không bao giờ hiện **lý do**; tối đa một nhãn trung tính kiểu «Có dấu hiệu sẵn sàng thương lượng». Lý do và đoạn trích chỉ ở `/ops/**` |
| Giá rao ≠ giá giao dịch (P2) | nền | H1 chỉ nói về giá rao; cần P0/P1 hoặc cuộc gọi xác minh mới nói được «mua rẻ hơn» |

## 7. Đề xuất — đo trước, build sau

Ba bước. Mỗi bước có ngưỡng khai **trước khi** nhìn số; không qua ngưỡng thì dừng.

**Bước 1 — Tập nhãn + đo Kev (T1/T2, chỉ đọc DB, không đổi schema).**
- Rút 200 tin S06 phân tầng (hoàn cảnh / quảng cáo / thường × loại người bán). Mạnh hoặc Qwen 27B có trích dẫn gắn
  nhãn `ap_luc` + `ly_do`; Mạnh duyệt một phần.
- Chạy Kev-4B (và Kev-9B để so); sửa lời câu hỏi nếu thang bị nén.
- **Ngưỡng**: Kev tách «áp lực rõ» khỏi phần còn lại với AUC ≥ 0,85 và độ chính xác `ly_do` ≥ 0,75. Không đạt → thử
  Kev-9B → vẫn không đạt thì dùng Qwen 27B (đắt hơn) hoặc dừng.

**Bước 2 — Đo H1 bằng nhãn Kev trên toàn S06 (mẻ qua đêm, kết quả ở `research-local/`).**
- Lặp §3.2–3.3 với nhãn Kev thay regex, có kiểm pháp lý + loại người bán.
- **Ngưỡng đáng build**: nhóm «áp lực rõ, người bán ≤ 9 tin, sạch pháp lý» có trung vị tỉ số ≤ 0,95 và cận trên
  KTC 95% < 0,98.

**Bước 3 — Đo H2 khi lịch sử đủ dày (≥ 4 tuần `price_change`, sớm nhất cuối tháng 11).**
- So P(xuống giá trong 30 ngày) và thời gian ra khỏi thị trường giữa tin có nhãn và tin không nhãn.
- Song song: S03 vào phép đo khi bóc tách S03 có `area_id` + `property_type` (phụ thuộc hàng bóc tách S03).

**Chỉ sau khi Bước 2 qua ngưỡng mới có việc build**: extension `SellerMotivation` + migration `FieldAssertion`, mẻ
Kev theo lịch đêm, metric ở `pipeline/sql`, một cột/bộ lọc ở bề mặt Ops (danh sách deal). Nhãn UI tiếng Việt thêm
vào `CONTEXT.md` cùng commit với nhãn đầu tiên. Bề mặt Invest Portal là quyết định riêng, sau H2.

### Mục đề xuất cho lộ trình (chưa cắt; đưa vào bằng `/acceptance-gate:cat-luot` khi Mạnh gật)

| Mã đề xuất | Câu giao | Bật khi | Hạng gợi ý |
|---|---|---|---|
| CX1 | Dựng tập nhãn 200 tin S06 và đo Kev-4B/9B cho hai câu `ap_luc` + `ly_do` | AUC, độ chính xác và ma trận nhầm ghi vào `docs/research/`; quyết định model kèm số | T1 (nghiên cứu) |
| CX2 | Đo H1 bằng nhãn Kev trên toàn S06, kiểm pháp lý + loại người bán | Bảng §3.2 làm lại bằng nhãn Kev; kết luận qua/không qua ngưỡng Bước 2 | T1 (nghiên cứu), phụ thuộc CX1 |
| CX3 | Đo H2 (xuống giá / ra khỏi thị trường) | ≥ 4 tuần `price_change`; phụ thuộc CX2 qua ngưỡng | T1, chờ điều kiện |
