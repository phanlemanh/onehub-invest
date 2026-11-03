# Chọn thị trường cho OneHub Invest — tổng hợp BiggerPockets + AirDNA, đề xuất năng lực và tính năng

Ngày: 2026-11-03 · Trạng thái: **đề xuất, chờ Mạnh đọc** · Loại: căn cứ (ROADMAP §0) — đầu vào cho một lượt cắt
(`/acceptance-gate:cat-luot`), **không phải danh sách việc**; không thêm hàng nào vào `docs/plan/lo-trinh.json`.

Đầu vào:
- `biggerpockets-market-finder-product-analysis.md` (BP)
- `airdna-vietnam-market-explorer-product-analysis.md` (AirDNA)
- Khung đối chiếu: `docs/product/FRAMING.md` (sứ mệnh §0, mục đích §1, hai phía §2, lõi §3, phản mục tiêu §4, thước đo §5),
  ROADMAP §1 hiến pháp + §3 quyết định, `docs/plan/lo-trinh.json` (hàng và mục chờ đã có).

Mỗi đề xuất ghi: phục vụ **phía nào** (nhà đầu tư · môi giới · lõi), **câu hỏi nào** (1–4), **thước đo nào** ở FRAMING §5
sẽ đổi — đúng luật FRAMING §6 dòng cuối.

---

## 0. Kết luận

1. **Hai sản phẩm lớn nhất thế giới về «chọn thị trường» đều yếu đúng ở chỗ OneHub đặt cược: độ tin.**
   - BiggerPockets: số giá cũ dưới nhãn «vừa cập nhật».
   - AirDNA ở Việt Nam: trung bình bị ngoại lai kéo lệch; ranh giới hành chính cũ; các nhà cung cấp lệch nhau gần gấp đôi.

   «Mỗi con số kèm căn cứ, cỡ mẫu, ngày dữ liệu và độ chắc» (FRAMING §3.2) vì thế là **lợi thế định vị**, không chỉ là
   kỷ luật nội bộ.
2. **Ở Việt Nam chưa ai trả lời cả bốn chiến lược trên cùng một phường.** BP chỉ có thuê dài (và không có ở VN); AirDNA
   chỉ có thuê ngắn, không có giá mua nên không có lợi suất. OneHub đã có ba mảnh: giá rao bán, tiền thuê dài (S06/S03)
   và doanh thu thuê ngắn tự thu (S01). Đây là khoảng trống thật, khớp bốn sản phẩm chủ lực ở FRAMING §2.2.
3. **«Chọn thị trường» là cửa vào, không phải nơi tạo giá trị.** BP dùng nó để dẫn sang đội môi giới và gói Pro; AirDNA
   dẫn sang Rentalizer rồi phí đặt giá theo từng căn mỗi tháng. Với OneHub, giá trị nằm ở **nối câu 1 → 2 → 3 trên cùng
   một căn và dẫn về đúng môi giới đang giữ căn** — đúng «hai phía, một lõi».
4. **Người dùng của cả hai hỏi nhiều nhất hai điều mà không bên nào đo: pháp lý và chi phí thật.** Ở VN, pháp lý thuê
   ngắn hạn quyết ở **cấp toà nhà** và đổi theo tháng. Danh bạ toà · trục · căn (D1, D3) cho OneHub chỗ đặt lớp này mà
   đối thủ không có.
5. **Thời gian là tài sản không mua lại được.**
   - Thước giá theo phường hiện bị xoá rồi tính lại mỗi lượt, không giữ lịch sử.
   - Sổ lịch sử từng tin theo RESO (`history_transactional`, PL19) mới có từ 30/10/2026, nên «tăng giá so với năm trước»
     sớm nhất là cuối 2027.
   - Việc rẻ nhất và không hối tiếc là **bắt đầu giữ lịch sử ngay**. Trong lúc chờ, dùng tín hiệu tốc độ mà sổ lịch sử
     đã cho: thời gian rao, tỉ lệ giảm giá, tỉ lệ gỡ tin.

---

## 1. Lăng kính đối chiếu (rút từ FRAMING và ROADMAP)

| Kim chỉ nam | Câu chữ gốc | Dùng để chấm điều gì |
|---|---|---|
| Sứ mệnh | «kênh duy nhất giúp nhà đầu tư và môi giới hết vất vả tìm dữ liệu, tìm hàng, tính toán thẩm định, quản lý và khai thác dòng tiền» (§0) | Tính năng có làm giảm vất vả ở một trong năm việc không |
| Bốn câu | thị trường nào · căn nào · vốn và dòng tiền · quản lý danh mục (§2.2) | Tính năng trả lời câu nào |
| Lõi tin cậy | sáu chiều; thang bậc căn B0–B5; nhãn «đã xác minh · suy ra · chưa biết» (§3.2, §3.4) | Con số có nói rõ độ chắc không |
| Phản mục tiêu | so sai nhóm; trình bày suy đoán như sự thật; tin vẫn hiện khi đã bán (§4) | Có tái tạo lỗi của đối thủ không |
| Gom vào, không phát ra | môi giới cứ đăng nơi quen; OneHub là nơi hiển thị (§2.1, D-chốt) | Tính năng có bắt môi giới làm thêm việc không |
| Đơn vị nghĩ là căn nhà | hiến pháp #7; khoá sự thật là căn, khoá bằng chứng là id tin (§6) | Tính năng có neo về căn/toà/phường không |
| Đo trước khi build | hiến pháp #8 | Năng lực mới có số chứng minh nhu cầu không |
| Luật 5 | số AirDNA chỉ ở `/ops/quality` | Không đề xuất nào đưa số AirDNA ra ngoài |

---

## 2. Tổng hợp hai báo cáo

### 2.1 Đặt cạnh nhau

| Khía cạnh | BiggerPockets Market Finder | AirDNA «Find a Market» (VN) | OneHub Invest hôm nay |
|---|---|---|---|
| Câu trả lời chính | Vùng đô thị nào hợp dòng tiền / tăng giá (thuê dài) | Tỉnh/thành nào thuê ngắn chạy tốt | Phường nào, căn nào giá tốt (bán, thuê dài, thuê ngắn) |
| Đơn vị | ~400 vùng đô thị Mỹ, không có cấp nhỏ hơn | 43 thị trường trộn tỉnh cũ / thành phố / đảo; Hà Nội 7 khu theo quận cũ | Tỉnh/thành sau sáp nhập → phường; danh bạ toà · trục · căn đang dựng |
| Chỉ số | giá tăng, tỉ lệ thuê/giá, chi trả, dân số, thất nghiệp | điểm thị trường, doanh thu tiềm năng, công suất, giá đêm | giá/m² trung vị, thước phường × loại, lợi suất phường, số tin |
| Độ tin | Không nguồn, không công thức; số cũ dưới nhãn mới | Định nghĩa công khai, nhưng trung bình + ngoại lai; không nói cách xử lý ngoại lai | Bậc B0–B5, phát biểu có căn cứ (`field_assertions`), cờ phi lý; nhãn độ chắc trên cổng là PL27 (chưa giao) |
| Thời gian | Δ năm (nguồn ngoài) | Δ năm, chuỗi 3 năm, 180 ngày tới | Sổ lịch sử tin từ 30/10/2026; thước không giữ lịch sử |
| Phễu / kiếm tiền | Pro $39/tháng + dẫn khách cho môi giới, bên cho vay | Gói nghiên cứu + đặt giá động theo căn/tháng | Chưa thu tiền (UH2 chờ); liên hệ người bán đang mở (TR1) |
| Điểm mạnh nên học | Đi từ ZIP về vùng; đoạn văn sinh từ số; khung dòng tiền / tăng giá / lai; trang tĩnh tốt cho SEO | Bộ lọc phân khúc áp cho mọi số; Δ năm khắp nơi; điểm con cạnh điểm tổng; AI tóm tắt nhận xét khách | — |
| Điểm yếu phải tránh | Số cũ; paywall rò qua đoạn văn; tuyển chọn tay không nêu tiêu chí | Ngoại lai đứng đầu bảng; đơn vị lẫn cấp; điểm pháp lý suy từ hành vi | — |

### 2.2 Bảy bài học

**B1 — Chọn thị trường là cửa vào; giá trị nằm ở bước kế.**
- Bằng chứng: BP đặt «Build Your Team» hai lần mỗi trang và khoá số sau Pro. AirDNA xếp thanh trái theo đúng thứ tự
  Research → Adapt Pricing → Performance → Comps, và nguồn thu lặp lại nằm ở đặt giá theo căn.
- Hàm ý: Finder của OneHub phải **dẫn sang tin và căn trong phường**, rồi sang ước lợi suất của căn, rồi sang môi giới giữ
  căn. Đo chuyển bước, không đo lượt xem bản đồ.

**B2 — Độ tin là điểm vỡ chung; đó là khe để OneHub khác biệt.**
- Bằng chứng: Atlanta trên BP +9,7%/năm, Zillow −2,9%. Top listing Hà Nội trên AirDNA giá hàng nghìn USD/đêm. Số listing
  TP.HCM lệch giữa các nhà cung cấp từ 6,2 đến 12,1 nghìn.
- Hàm ý: «nói rõ độ chắc» (chiều 6) và «còn hiệu lực» (chiều 4) phải hiện **trên từng con số tổng hợp**, không chỉ trên
  từng tin. Phản mục tiêu «trình bày suy đoán như sự thật» áp cho cả số trung vị phường.

**B3 — Đơn vị quá thô; quyết định nằm ở khu, phố, toà.**
- Bằng chứng: người dùng BP nói «neighborhood-to-neighborhood, and sometimes street-to-street». AirDNA gom phần lớn Hà Nội
  vào một ô «Hanoi City».
- Hàm ý: phường là sàn, **toà/dự án là đơn vị thật của căn hộ** (D3). Lợi thế cấu trúc này đối thủ không có.

**B4 — Mỗi đối thủ chỉ phục vụ một chiến lược.**
- Bằng chứng: BP gom mọi thứ vào thuê dài. AirDNA ở VN chỉ có 4 chỉ số thuê ngắn, không có giá mua.
- Hàm ý: OneHub đặt **ba lợi suất cạnh nhau trên cùng phường** — thuê ngắn, thuê dài, và chênh giữa hai — cộng tốc độ thị
  trường. Đó là câu trả lời cho «thị trường nào hợp **kiểu đầu tư tôi thích**» (câu 1).

**B5 — Pháp lý và chi phí thật là câu hỏi số một, không ai đo.**
- Bằng chứng: diễn đàn BP hỏi luật chủ nhà, thuế, bảo hiểm. Điểm «Regulation» của AirDNA suy từ hành vi host.
- Ở VN: Luật Nhà ở 2023; TP.HCM cấm 02/2025 rồi cho lại có điều kiện 04/2026; Hà Nội áp nội quy từng toà.
- Hàm ý: một **lớp toà** gồm được thuê ngắn không, phí quản lý, nội quy — mỗi giá trị là một phát biểu có người xác nhận
  và ngày. Hạ tầng `field_assertions` (lớp `fact` / `hitl`) đã chứa được.

**B6 — Thời gian không mua lại được.**
- Bằng chứng: BP và AirDNA mạnh nhờ lịch sử dài (AirDNA từ 2014). OneHub: `market_asset_stats` bị TRUNCATE mỗi lượt
  (`pipeline/sql/500_asset_stats.sql`); `history_transactional` có từ 30/10/2026 và chỉ ở máy thu.
- Hàm ý: giữ lịch sử thước ngay. Trong lúc chưa đủ 13 tháng, dùng «nhiệt độ thị trường» lấy từ sổ lịch sử: thời gian rao
  trung vị, tỉ lệ tin giảm giá, tỉ lệ gỡ hoặc đã bán trong 30 ngày. Realtor.com chấm «độ nóng» bằng thời gian rao — cùng
  họ tín hiệu.

**B7 — Dữ liệu thô rẻ; người ta trả tiền cho sự tiện, sự tuyển chọn, sự tin.**
- Bằng chứng: review BP «The value is convenience, not exclusivity». Ở Mỹ dữ liệu Zillow, Redfin miễn phí. AirROI cho xem
  miễn phí tới cấp phường ở VN.
- Hàm ý: chưa thu tiền (UH2 vẫn chờ). Khi thiết kế, đừng để chữ rò số như BP. Ở VN, «tuyển chọn» = **Căn giá tốt đã xác
  minh** (CG1–CG7): đội vận hành gọi người bán trước khi đưa lên.

---

## 3. Đề xuất năng lực nền

Năng lực là thứ dùng chung cho nhiều tính năng; phần lớn thuộc «lõi» (FRAMING §2).

| # | Năng lực | Bằng chứng (bài học) | Câu · phía | Đã có | Khoảng cách | Thước đo (FRAMING §5) |
|---|---|---|---|---|---|---|
| **N1** | **Số kèm căn cứ** — mọi con số tổng hợp trên cổng mang cỡ mẫu n, ngày dữ liệu (không phải ngày tính), bậc độ chắc; dưới ngưỡng thì hiện «chưa đủ mẫu» thay vì con số | B2 | 1–3 · lõi | PL27 hiện độ chắc theo tin; ngưỡng n ≥ 5 của thước; `MAU_MONG_DUOI` ở hiệu chuẩn | Mở rộng PL27 từ tin sang **số tổng hợp** (thước, lợi suất, KPI phường) | Tỉ lệ số trên cổng có đủ n + ngày + bậc (đích 100%) |
| **N2** | **Lịch sử thước + nhiệt độ thị trường** — giữ thước phường × loại theo tuần; tính thời gian rao, tỉ lệ giảm giá, tỉ lệ gỡ/đã bán từ sổ lịch sử | B6 | 1 · nhà đầu tư | `history_transactional` (059, chỉ local); `property_price_history` | Thước không giữ lịch sử; số tổng hợp từ sổ lịch sử chưa lên cloud (chỉ số gộp, không lộ tin) | Số tuần lịch sử liên tục theo phường; độ trễ dữ liệu p50 |
| **N3** | **Luật ngoại lai trước mọi xếp hạng và trung vị** — cắt theo phân vị trong cùng phường × loại; cờ hiện được ở `/ops`; xếp hạng thuê ngắn theo đêm có khách thật, không theo «tiềm năng» | B2 | 1–2 · lõi | Cờ phi lý (427 cờ S06, ra mắt 05/11); ON11 loại tin phi lý ở căn giá tốt | Chưa áp cho xếp hạng listing thuê ngắn và cho lợi suất | Số ngoại lai lọt top N (đích 0) |
| **N4** | **Thước theo phân khúc** — phường × loại × nhóm phòng ngủ tính sẵn, để bộ lọc «căn 1PN» đổi mọi số | B4, bài học AirDNA (bộ lọc áp mọi số) | 1–2 · nhà đầu tư | PL26 thước phường × loại; ô chờ UH1 «bộ lọc theo phòng ngủ» (mở lại khi pipeline tính sẵn) | Tính sẵn theo nhóm PN cho căn hộ HN — đúng điều kiện mở UH1 | Tỉ lệ phường HN có thước đủ mẫu theo nhóm PN |
| **N5** | **Ba lợi suất cùng phường** — thuê dài (tiền thuê P2 / giá), thuê ngắn (doanh thu S01 / giá), chênh giữa hai; S02 chỉ để hiệu chuẩn ở `/ops/quality` | B4 | 1, 3 · nhà đầu tư | Lợi suất phường ở `500_asset_stats.sql`; doanh thu S01 theo listing | Nối doanh thu thuê ngắn theo phường với giá mua cùng phường; ghi rõ «giá rao ≠ giá giao dịch» | Số phường có đủ ba lợi suất; sai số ước thuê khi có số thật |
| **N6** | **Lớp toà / dự án** — được thuê ngắn không, phí quản lý, nội quy, thước toà; mỗi giá trị là phát biểu có người xác nhận + ngày; tụt bậc khi quá hạn | B5 | 1–3 · nhà đầu tư + môi giới | Danh bạ toà DB1 (Ocean Park 1), DBG (Grand Park); `field_assertions` lớp `fact`/`hitl`; CGP1 (thước theo toà, đang chờ) | Thêm trục «pháp lý thuê ngắn» và «phí quản lý» vào phát biểu cấp toà; quy trình xác nhận | Tỉ lệ toà có phát biểu pháp lý còn hạn |
| **N7** | **Đối chiếu đa nguồn có kỷ luật** — tự thu so với nguồn hiệu chuẩn; trên cổng chỉ hiện nhãn tầng C «đã hiệu chuẩn», không hiện số nguồn | B2, luật 5 | 1 · lõi | ON10 hiệu chuẩn một bộ số ở `/ops/quality` | Không lớn; cần gỡ lỗ rò Market Score ở `/api/v1/markets` (thẻ việc riêng đã đề xuất) | 0 số S02 trên đường công khai (test) |

---

## 4. Đề xuất tính năng

| # | Tính năng | Người dùng thấy gì | Câu · phía | Cần năng lực | Hàng lộ trình liên quan | Nấc |
|---|---|---|---|---|---|---|
| **T1** | **Finder theo chiến lược** | Chọn «Dòng tiền thuê ngắn · Thuê dài · Tăng giá · Lai» → bản đồ và xếp hạng đổi lăng kính; tiêu chí mỗi lăng kính in ngay dưới | 1 · nhà đầu tư | N1, N5 | mở rộng UI8 | Đợt 2 |
| **T2** | **Bản đồ phường có ô xám trung thực** | Tô màu theo phân vị của tập đang xem; ô thiếu mẫu để xám kèm «chưa đủ mẫu (n = …)» | 1 · nhà đầu tư | N1, N3 | UI8 | Đợt 2 |
| **T3** | **Trang phường «30 giây»** | 4 ô số (giá/m², tiền thuê, lợi suất thuê dài/ngắn), mỗi ô có n + ngày + nhãn độ chắc; một đoạn văn sinh từ số theo mẫu (không LLM tự viết số — luật 7); nút sang tin rao và Căn giá tốt trong phường | 1 → 2 · nhà đầu tư | N1, N5 | UI9, CG7 | Đợt 2 |
| **T4** | **So sánh A hay B** | Khay 2–4 phường hoặc toà, cùng lăng kính, cùng phân khúc | 1 · nhà đầu tư | N1, N4 | UI14 | Đợt 2 |
| **T5** | **Nhiệt độ thị trường** | Thời gian rao trung vị, % tin giảm giá, % tin gỡ/đã bán 30 ngày, so 4 và 13 tuần trước | 1 · nhà đầu tư + môi giới | N2 | mới | Đợt 2 (khi N2 đủ 8 tuần) |
| **T6** | **Thẻ toà / dự án** | Được thuê ngắn hạn không (ai xác nhận, ngày nào), phí quản lý, thước giá toà, số tin đang rao, nhiệt độ | 1–3 · nhà đầu tư + môi giới | N6, N2 | mới; dựa DB1/DBG, CGP1 | Đợt 3 |
| **T7** | **Ước lợi suất một căn** | Giá thật của tin + tiền thuê từ căn so sánh + chi phí thật (phí quản lý từ N6, thuế cho thuê, nội thất) + kịch bản lãi suất | 3 · nhà đầu tư | N5, N6 | mở rộng UI3 | Đợt 3 |
| **T8** | **Liên hệ người giữ căn** | Từ phường hoặc toà → tin → môi giới đang giữ căn | 2 · hai phía | — | TR1, SH1 | Đang làm (ra mắt 05/11) |
| **T9** | **Nổi bật tuần này theo luật in rõ** | 5 phường hoặc toà nổi bật theo một luật công khai (vd. lợi suất thuê dài tăng mạnh nhất trong các ô đủ mẫu) — không tuyển tay | 1 · nhà đầu tư | N1, N2 | mới, nhỏ | Đợt 2 |
| **T10** | **Theo dõi và cảnh báo** | Lưu phường/toà; báo khi thước, nhiệt độ hoặc pháp lý đổi | 4 · nhà đầu tư | N2, N6 | UI16; chờ ADR SPL hồ sơ nhà đầu tư (FRAMING §7.1, SH10) | Sau |
| **T11** | **Khách nói gì về phường** | Tóm tắt nhận xét khách từ listing S01, kèm số đánh giá đã đọc | 1 · nhà đầu tư | — | mới; đo trước (luật 11) | Sau |

**Phía môi giới** (FRAMING §2.1 — «họ được gì»):
- T5 và T6 giúp môi giới trả lời khách nhanh hơn — «toà này thuê ngắn được không», «giá đang đi đâu» — mà không phải làm
  thêm việc.
- T8 dẫn khách về đúng người đang giữ căn.
- Đúng «gom vào, không phát ra»: không tính năng nào bắt môi giới nhập thêm.

---

## 5. Thứ tự đề xuất

Từ 22:00 ngày 04/11 chỉ gộp bản vá đường ống (KHM1). Mọi đợt dưới đây bắt đầu **sau ra mắt 05/11**.

| Đợt | Gồm | Vì sao trước | Điều kiện |
|---|---|---|---|
| **1 — Nền không hối tiếc** | N2 (bắt đầu giữ lịch sử thước theo tuần), N1 (mở rộng PL27 sang số tổng hợp), N3 (luật ngoại lai cho xếp hạng và lợi suất), N7 (gỡ lỗ rò `/api/v1/markets`) | Lịch sử bắt đầu càng muộn càng mất; N1 + N3 chặn phản mục tiêu trước khi thêm bề mặt mới | Không cần quyết định mới; N7 là thẻ việc đã đề xuất |
| **2 — Finder trả lời câu 1** | T1, T2, T3, T4, T9; T5 khi N2 đủ 8 tuần; N4 cho căn hộ HN; N5 | Đúng thứ cả hai đối thủ không có ở VN; dựa trên dữ liệu dày nhất (căn hộ HN, S06) | UI8/UI9/UI14 đã có hàng; N4 mở lại UH1 |
| **3 — Nối sang câu 3 qua toà** | N6, T6, T7 | Cần danh bạ toà ổn định và nhịp xác nhận | DB1/DBG giao; Mạnh chốt ai là căn cứ cho pháp lý toà (§8) |
| **Sau** | T10, T11, thu tiền (UH2), điểm OneHub (UH3) | Chờ ADR SPL hồ sơ nhà đầu tư; chờ có mô hình điểm đã đo | Các điều kiện mở lại đã ghi ở lộ trình |

---

## 6. Không làm (và vì sao)

| Không làm | Vì sao |
|---|---|
| Hiện số hay điểm AirDNA trên cổng hoặc API công khai | Luật 5; dùng làm thước kiểm ở `/ops/quality` |
| Điểm tổng hộp đen kiểu Market Score | Phản mục tiêu «suy đoán như sự thật»; UH3 chờ mô hình điểm đã đo. Nếu làm thì điểm con có công thức công khai, hiện cạnh điểm tổng |
| Danh sách «chuyên gia chọn» không nêu tiêu chí | Bài học BP; thay bằng T9 (luật in rõ) và Căn giá tốt đã xác minh (CG) |
| Điểm chất lượng sống A–F | Không có nguồn cấp phường tin được ở VN |
| Nhãn «vừa cập nhật» chung cho cả trang | Bài học BP; ngày dữ liệu đi theo từng số (N1) |
| Bộ lọc kiểu Mỹ (trượt tuyết, vườn nho, quân sự) | Thay bằng thứ VN cần: thuê ngắn được không, gần biển, phố cổ, gần sân bay |
| Nội suy số cho ô thiếu mẫu | Để xám, nói thật (T2) |
| Paywall bây giờ | UH2 chưa chốt gói; ghi nhận: nếu thu tiền, không để chữ rò số |

---

## 7. Thước đo cho cả hướng này

| Thước đo | Nhóm FRAMING §5 | Ghi chú |
|---|---|---|
| Tỉ lệ số tổng hợp trên cổng có n + ngày dữ liệu + bậc | Lõi | Đích 100%; kiểm bằng test như bất biến |
| Số thị trường × loại đủ thước; số phường HN có đủ ba lợi suất | Nhà đầu tư | Đã có dạng «số thị trường đủ thước theo loại» |
| Chuyển bước Finder → trang phường → tin/căn → liên hệ | Giao dịch (trễ) | Cần sự kiện sản phẩm (đã ghi ở §5 FRAMING) |
| Độ trễ dữ liệu p50 theo số tổng hợp | Độ tươi | Khác độ tươi từng tin; cả hai đều cần |
| Số ngoại lai lọt top N; 0 số S02 trên đường công khai | Bất biến | Chặn ở CI |
| Tỉ lệ toà có phát biểu pháp lý còn hạn | Năng lực / bậc | Bậc tụt khi quá hạn (FRAMING §3.4) |
| Sai số ước thuê khi có số thật | Nhà đầu tư | Câu 3 |

---

## 8. Câu hỏi cho Mạnh

1. **Ai là căn cứ cho pháp lý thuê ngắn hạn của từng toà** (N6)? Ba đường: đội vận hành gọi ban quản lý; môi giới đang
   giữ căn khai (gắn với SH14 «môi giới nhận căn»); đọc văn bản và nội quy. Khuyến nghị: đội vận hành xác nhận, môi
   giới khai là bậc dưới — khớp thang bậc §3.4.
2. **Lăng kính thuê ngắn trên Finder công khai** khi S01 mới ~800+ căn ở HN và TP.HCM: hiện kèm «chưa đủ mẫu» ở phần lớn
   phường, hay để lăng kính này ở Ops tới khi đủ? Khuyến nghị: hiện, vì nói thật là lợi thế (B2).
3. **Bắt đầu Đợt 1 ngay sau 05/11** bằng một bản phạm vi `docs/plan/pham-vi-chon-thi-truong-*.md` để cắt lượt?

## 9. Nguồn

- `docs/research/biggerpockets-market-finder-product-analysis.md` §0, §3–§8
- `docs/research/airdna-vietnam-market-explorer-product-analysis.md` §0, §3–§8
- `docs/product/FRAMING.md` §0–§7 · `docs/ROADMAP.md` §1, §2.3–§2.5, §3 · `docs/plan/lo-trinh.json` (UI3, UI8, UI9, UI14,
  UI16, PL26, PL27, CG1–CG7, CGP1, DB1, DBG, UH1–UH3, SH1, SH10, SH14, KHM1, ON10, ON11)
- `docs/plan/ra-mat-0511-so-luong-chat-luong.md` §2 · `docs/plan/pham-vi-can-gia-tot-0311.md`
- Code: `pipeline/sql/500_asset_stats.sql` (TRUNCATE) · `db/migrations/059_thoi_gian_hieu_luc.sql`
  (`history_transactional`, `property_price_history`) · `app/src/app/api/v1/markets/route.ts` · `app/src/lib/api-surface.ts`
