# Mô hình dòng chảy dữ liệu — bài vào, căn nhà sống qua thời gian, đo hằng ngày

Ngày: 2026-11-07 · Người soạn: Claude (phiên thợ P2, theo lời Mạnh 07/11) · Bản 4 · Trạng thái: **Mạnh duyệt 07/11**
(«Đồng ý với khuyến nghị khi rà soát tài liệu»; Q3 hoãn tới PL21 — §7)

> Lời giao (Mạnh, 07/11): «tổng hợp lại đi từ Phân tích kỹ lưỡng thành mô hình hoàn chỉnh cho toàn bộ pipeline bao gồm cách
> đo lường hiệu quả trong hoạt động hàng ngày tạo ra tin và mô hình một ngôi nhà được phân loại và enrich qua thời gian…
> đưa thành dạng tri thức với tài liệu rõ ràng. Kiểm tra với các mã đang thực hiện hiện nay để bổ sung, sửa đổi».

## Tài liệu này là gì — và không là gì

- **Là căn cứ kiến trúc** (ROADMAP §0: `docs/architecture/` là căn cứ). Tài liệu ghép các quyết định đã chốt thành một
  mô hình đi từ đầu tới cuối, rồi đối chiếu với mã đang chạy.
- **Không là nơi thứ hai** cho thước đo hay thứ tự việc:
  - Thước đo sống ở `docs/product/FRAMING.md` §5 — đã chép từ §3 dưới đây khi Mạnh duyệt (Q1, FRAMING §9 dòng 07/11).
    §3 giữ làm giải thích; số liệu chính thức đọc ở FRAMING.
  - Việc và thứ tự sống ở `docs/plan/lo-trinh.json`. Mục §6 chỉ đọc `dung_tren`, không xếp lại.
- **Chỗ nào đề xuất khác một quyết định đã chốt đều thành câu hỏi ở §7**, không nằm chìm trong bảng.

| Nguồn | Phần lấy vào |
|---|---|
| `docs/product/FRAMING.md` §3, §5 | Ba lớp căn / tin / trường làm giàu · thang bậc B0–B5, N0–N4 · thước đo |
| ADR-0013 | Tin = `Property`, căn = UPI + `Building` · khoá tin bền · mọi giá trị là phát biểu · tám câu luật |
| ADR-0016 | Danh bạ bốn họ (Vùng · Vật thể · Người · Listing) · khoá mờ đúc một lần · gắn mức sâu nhất có bằng chứng · kế thừa năm luật |
| ADR-0007 sửa đổi 06/11 | Ba model cloud cho đọc tin, gửi nội dung bài nguyên văn |
| ADR-0017 + spec danh bạ 03/11 | Quỹ hàng; môi giới xác nhận ra phát biểu `network_confirm` |
| `docs/architecture/classification-enrich-review.md` §3, §0.3 F3, §7.0 | Lớp căn cứ, luật phân xử, ngưỡng tự áp, danh mục có bậc, các Hỏi đã chốt |
| Kho tri thức: đọc tin và ảnh S03, gom tách gộp, gắn căn S03, dòng chảy dữ liệu | Bốn loại phép tính · đơn vị bài đăng · diện tích suy ra · trang `/ops/data-flow` |
| Hồ sơ PL30 `chon-model-theo-o` (đo 06–07/11) | Đọc gộp 17 ô, số đo ba model trên vàng |

## 0. Một trang

**Mô hình trong sáu câu.**

1. Mọi thứ máy hay người biết về một bài là một **phát biểu**: giá trị · lớp căn cứ · cách đọc · câu trích · lúc nào.
   Phát biểu lưu chỉ thêm, theo khoá bất biến của bài gốc.
2. **Cột chuẩn của tin** là bản tính sẵn do **bộ phân xử** dựng từ phát biểu. Không bước nào ghi thẳng.
3. **Một Căn Nhà** là một nút ở **họ Vật thể** (thửa · toà · trục · căn), mang khoá mờ đúc một lần, không chứa giá, loại
   hay bán/thuê. Khu đô thị và phân khu thuộc **họ Vùng**. Tin gắn vào nút vật thể sâu nhất có bằng chứng; việc gắn cũng
   là phát biểu.
4. Căn **giàu lên theo thời gian** bằng phát biểu mới ở mỗi lần xuất hiện: giá, trạng thái, người bán.
   - Trường thuộc căn kế thừa xuống tin dưới dạng phát biểu suy ra, hiện kèm nhãn «suy ra».
   - Trường thuộc tin không quay lên nuôi căn.
5. **Tự áp chỉ ở ô đã đo** trên tập test mù đóng băng. Ô chưa đo đi thẻ, hoặc hiện kèm «suy ra» theo nhóm ngưỡng.
6. **Đo hằng ngày** để thấy trôi, thấy rơi và thấy chi phí. North star là phân bố căn theo bậc B0–B5.

**Ba số nền 07/11.**

- 63.298 «căn» đều ở bậc B2, không căn nào B3 trở lên. Các «căn» này là cụm tin S06 có giá trong khoá.
- Tin S03 chưa gắn căn nào: 3.117 tin lẻ ở B0, 1.568 ở B1.
- Danh mục mới có 20 khu đô thị và 3 toà. Danh mục S08 có 39.888 dòng nhưng chưa dựng thành danh bạ.

**Đòn bẩy.**

- Có hai nút thắt, đều phải gỡ:
  - **danh bạ toà–trục–căn**: chỗ để gắn;
  - **đưa đủ năm trường lõi qua phân xử, có cờ «đã đo»**: điều kiện để có căn B3 trở lên.
- Nay bán/thuê, giá, diện tích, khu vực còn ghi thẳng, và cờ «đã đo» bị gán cứng `false`. Vì vậy dù có danh bạ thì
  vẫn 0 căn B3 cho tới khi PL17 và PL21 xong.
- Thêm model hay thêm lượng thu không phải đòn bẩy lúc này.

## 1. Dòng chảy đích — tám chặng

| # | Chặng | Việc | Đầu ra | Khoá | Ai quyết | Làn |
|---|---|---|---|---|---|---|
| C1 | Nhận | Thu đủ, không lọc; raw bất biến | Snapshot raw → `stg_*` | id gốc của nguồn | luật thu | ZCode |
| C2 | Bài đăng | Gom ảnh với chữ; gộp trùng ảnh theo nội dung; gộp bài đăng lại | Đơn vị bài đăng | post gốc `S0x:<id>` | luật xác định | Claude |
| C3 | Đọc | Phân loại, trích, **tách bài nhiều căn**; mọi giá trị kèm câu trích (§1.1) | Phát biểu | bài; căn thứ n của bài nhiều căn có khoá riêng (PL18) | luật · E1 ngữ cảnh · E2 model đọc gộp | Claude |
| C4 | Phát biểu | Lưu chỉ thêm; lớp căn cứ × cách đọc; rút thay vì xoá | `field_assertions` | (chủ thể, trường, cách đọc) | — | Claude |
| C5 | Phân xử | Dựng cột chuẩn của tin theo bốn luật (§1.2) | Cột chuẩn + `field_provenance` | `offer_id` = băm khoá bền | luật xác định + người | Claude |
| C6 | Gắn | Nối tin vào nút vật thể sâu nhất có bằng chứng; chỉ biết khu đô thị thì gắn vùng, không gắn vật thể (§2.2) | Phát biểu liên kết | khoá mờ `bld_`/`stk_`/`unt_` + UPI | luật + model + người | Claude |
| C7 | Làm giàu theo thời gian | Kế thừa năm luật ADR-0016; lịch sử giá, trạng thái, người bán; bậc B0–B5 mỗi ngày | Hồ sơ căn + lịch sử | khoá vật thể | bộ phân xử + nhịp quét | Claude |
| C8 | Phục vụ | Invest, Ops, API chỉ đọc; chiếu bậc thành ba nhãn «đã xác minh / suy ra / chưa biết»; SPL khi rời máy | Trang + API | — | — | Claude |

Tên chặng trên trang Ops giữ theo «Dòng chảy dữ liệu» của CONTEXT: Bài nhận → Đọc được → Tin rao mới → Gắn căn. Tám
chặng ở đây là bản chi tiết của bốn chặng đó.

Người đứng ở ba chỗ:
- gắn nhãn: tập test mù đóng băng để đo, mẫu soát để thấy trôi (§3);
- duyệt thẻ ở C5 và C6: mỗi quyết định là phát biểu lớp sự thật (`hitl`), sống qua nạp lại;
- môi giới xác nhận căn trong Quỹ hàng: ra phát biểu `network_confirm` lớp quan sát. Cần hai công ty độc lập xác nhận
  thì mới thành sự thật, khi đó căn đủ một điều kiện của B4 (spec danh bạ 03/11).

### 1.1 Phân loại và trích — bốn loại phép tính

| Loại | Trường | Ai làm | Căn cứ bắt buộc |
|---|---|---|---|
| **Phân loại** | ý định tin (rao · yêu cầu · không phải tin rao · chưa rõ), bán/thuê, loại hình, nhiều căn | luật chữ; E1 ngữ cảnh nhóm; E2 model đọc gộp | Câu trích; ngữ cảnh nhóm là suy luận |
| **Trích** | giá (kể cả khoảng, `price_basis`), diện tích, phòng ngủ, cờ «+», WC, tầng, trục, mã căn, người bán, SĐT | luật trước; E2 cho phần còn lại | Câu trích kiểm bằng so chuỗi; không trích được thì xuống suy luận |
| **Nối** | khu đô thị, phân khu, toà, trục, căn | tra danh bạ (Vùng, Vật thể) | Khoá danh bạ + phát biểu liên kết |
| **Suy ra** | trường thuộc căn từ danh mục, diện tích suy ra | đi cây danh bạ | Lớp suy luận, hiện kèm «suy ra» |

- **Một từ vựng** cho mọi nguồn: `pipeline/mappings.yaml`, RESO-first (ADR-0011). Ý định tin là extension `ListingIntent`
  (ADR-0013).
- **Yêu cầu** (bên mua, `inquiry`) và **không phải tin rao** được giữ ở raw và stg, có phát biểu ý định theo khoá bài,
  nhưng không thành tin rao (review Q8; mô hình đối xứng Listing ↔ Yêu cầu, hồ sơ `wanted-thanh-inquiry`).
- **Ba cách đọc độc lập**:
  - luật (parser, mang `rule_id` + vị trí đoạn khớp);
  - E1 ngữ cảnh nhóm (suy luận, trừ nhóm có quy ước đã qua người và đạt eval — sửa Q4 04/11, ngưỡng chốt ở GCQ1);
  - E2 model đọc gộp chữ + ảnh, chạy mù, không thấy đáp án E1 (PL18).
- Độ tự tin model **không bao giờ là căn cứ**: không định tuyến, không hiện trên thẻ (Q9).

### 1.2 Phân xử — lớp căn cứ và bốn luật

Lớp căn cứ đã chốt (PL15): **sự thật › quan sát có trích dẫn › suy luận**.
- Thứ tự tạm trong lớp: `hitl` › trường nguồn; parser › E1 › E2 › giá trị cũ. Thứ tự này dùng tới khi ô được đo.
- Thang chi tiết của review §3.3 là bản mịn của ba lớp này: người · trường nguồn · chữ tường minh · model có trích ·
  ảnh · ngữ cảnh.

Luật phân xử (review §3.3):
1. Lấy lớp cao nhất có phát biểu. Cùng lớp mà đồng thuận thì nhận; bất đồng thì lên thẻ.
2. Lớp thấp trái lớp cao:
   - lớp cao là người hay trường nguồn thì giữ, không thẻ;
   - lớp cao là chữ tường minh hay model có trích, và lớp thấp từ model có trích trở lên, thì lên thẻ.
3. Hai phiếu chỉ là chứng thực khi độc lập, không phiếu nào thấy đáp án của phiếu kia.
4. Ô (cách đọc × trường × phân khúc) chưa đo hoặc dưới ngưỡng thì không tự áp. Hành vi dưới ngưỡng theo nhóm F3:

| Nhóm F3 | Trường | Ngưỡng cận dưới Wilson | Dưới ngưỡng |
|---|---|---|---|
| A · định nhóm, định danh | ý định tin, bán/thuê, loại hình, khu đô thị, phân khu, toà, gắn trục/căn | ≥ 0,95 | Thẻ duyệt; tin vẫn hiện ở B1 «chưa biết» |
| B · số | giá (khoảng), diện tích, phòng ngủ, `price_basis`, tầng, trục, mã căn | ≥ 0,90 | Hiện kèm «suy ra»; ngoại lai lên thẻ |
| C · mô tả | hướng, view, nội thất, đường, trường thuê | ≥ 0,80 | Hiện kèm «suy ra», không thẻ |

Xếp phân khu, tầng, trục, mã căn như bảng trên là đề xuất của tài liệu này. F3 gốc chỉ nêu ví dụ; chốt ở PL21.

## 2. Một Căn Nhà qua thời gian

### 2.1 Định danh và danh bạ

- **Họ Vật thể** (ADR-0016): thửa · toà · trục · căn, quan hệ cha–con không bắt buộc đủ cấp.
  - Khoá mờ `bld_`/`stk_`/`unt_` + ULID, đúc một lần.
  - Vòng đời: hoạt động · gộp · tách · nghỉ; không xoá; khoá cũ giữ làm bí danh.
- **Họ Vùng**: khu đô thị, phân khu (`asset_nodes`). Không phải vật thể.
- **UPI** `urn:onehub:upi:1:VN:<tỉnh>:<BuildingKey>`, SubId `<StackKey>:<tầng>`, hoặc `:*` khi tầng bị che.
- **Khung toà làm trước căn**; ô chưa có bằng chứng không đúc khoá.
- **Dòng danh mục có bậc** (review F2):
  - xác minh (mặt bằng, bảng hàng chủ đầu tư): gắn tin lên B4;
  - suy ra mạnh (từ ba môi giới độc lập trở lên cùng mô tả toà + trục với diện tích, phòng ngủ khớp): gắn trục, B2;
  - một lời khai (một tin): chỉ là ứng viên, không gắn.
- **Nguồn dựng khung**:
  - danh mục S08 (từ 08/11 là thông tin dự án công khai, ROADMAP §3 mục 38);
  - từ điển toà, phân khu đã chốt khi gắn nhãn;
  - phát biểu toà, trục, mã căn từ tin (bộ đọc luật có sẵn; mã căn đủ hơn sau PL13).
- Nhà phố và đất: mỗi tin một vật thể tạm, gộp theo bằng chứng. Toạ độ chỉ là tín hiệu phụ.

### 2.2 Gắn tin theo mức

| Mức | Khi nào | Ví dụ S03 | Có trên vàng 48 thẻ |
|---|---|---|---|
| Căn | Toà + tầng + trục, hoặc mã căn | `PR5.1203` | 8 thẻ có tầng |
| Trục (`:*`) | Toà + trục, tầng che | `LD2XX03` | 16 thẻ có trục |
| Toà (+ loại căn, diện tích để thu hẹp) | Toà, không trục | `S8.02, 2PN, 65 m²` | 32 thẻ có toà |
| Chỉ vùng | Chỉ biết khu đô thị / phân khu | thẻ nhóm OCP | 44 thẻ có khu đô thị |

Liên kết là phát biểu theo khoá `<S0x>:<id gốc>`, không phải khoá ngoại tới bảng tin. Gắn nhầm thì rút phát biểu, và
các phát biểu kế thừa đi theo bị rút dây chuyền.

### 2.3 Làm giàu theo thời gian

- **Trường thuộc căn**: loại hình, diện tích, số phòng, toà, trục, tầng, hướng. Kế thừa xuống tin là phát biểu **suy
  luận** kèm nhãn «suy ra». Không đè giá trị tin tự ghi.
  - **Ngoại lệ diện tích** (ROADMAP §3 mục 30, GC2/GC3): diện tích suy ra chỉ hiện dạng dải kèm «suy ra». Nó không vào
    cột `area_m2`, giá/m² hay thước giá, vì môi giới ghi thông thuỷ hay tim tường khác nhau.
- **Trường thuộc tin**: giá, bán/thuê, người đăng, ngày đăng, còn hiệu lực. Không quay lên nuôi căn (luật kế thừa của
  ADR-0016).
- **Mỗi lần căn xuất hiện lại** (tin mới, đăng lại, nguồn khác) thêm phát biểu có `observed_at`. Từ đó dựng ra:
  - lịch sử giá theo căn;
  - trạng thái: đang rao, đã thuê/bán, off-market (có trong danh bạ nhưng không còn tin hiệu lực);
  - người bán theo căn.
- **Bất đồng** giữa phát biểu cùng căn sinh thẻ, không lấy số mới nhất đè.

### 2.4 Bậc của căn (FRAMING §3.4, chép đủ)

| Bậc | Lên khi | Tụt khi |
|---|---|---|
| B0 Có lời khai | Có tin thô trong raw | — |
| B1 Đọc được | Năm trường lõi (bán/thuê, loại, giá, diện tích, **vị trí**) đã diễn giải, có nguồn gốc | Từ vựng đổi mà chưa đọc lại |
| B2 Gắn căn | Tin đã gắn về một căn, tin trùng đã gộp | Phát biểu mới chỉ ra gắn nhầm |
| B3 Đã đo | Mọi trường lõi đến từ cách đọc có số đo đạt ngưỡng | Đo lại thấy ô dưới ngưỡng |
| B4 Xác minh | Khớp danh mục xác minh hoặc được xác nhận; trường lõi có ít nhất một nguồn sự thật | Danh mục đổi; xác nhận bị rút |
| B5 Sống | B4 + lời chào còn hiệu lực trong cửa sổ độ tươi + có lịch sử giá | Hết cửa sổ độ tươi không có bằng chứng mới |

- «Vị trí» trong mã hiện là `area_id`, kể cả khu vực cấp thị trường (`056_data_level.sql`). Câu «B1 có nên đòi diện
  tích không» đang mở ở `ghi_chu` của GC3.
- Bậc đích: căn hộ có danh mục B5; nhà phố B3; tin S06 dùng làm thước B3.

## 3. Đo hằng ngày (đã chép vào FRAMING §5)

Các số tính sẵn ở pipeline (luật 10) và đẩy lên Ops qua kênh số tổng hợp có sẵn (`push-ops-facts`, ADR-0014). Không bảng
nào mang nội dung tin lên cloud.

### 3.1 Phễu dòng chảy — mở rộng `/ops/data-flow` (DF1, DF3)

- Thêm số **bài khác nội dung** (cần GT2 hoặc gộp trùng theo nội dung).
- Thêm tỉ lệ tin rao **bị bỏ sót**, ước từ mẫu soát (§3.2).
- Thêm số tin **gắn theo mức** (căn / trục / toà / chỉ vùng).
- Thêm **lý do rơi** ở mỗi chặng (thiếu giá, thiếu diện tích, yêu cầu, không phải tin rao, không gắn được), lấy từ phát
  biểu. DF3 (bảng chặn bậc theo nút thắt) đã gần ý này, nên làm cùng DF3.

### 3.2 Độ đúng — hai việc tách rời

- **Tập test mù đóng băng — để đo và để mở cổng tự áp** (F3, review §3.5, FRAMING §5).
  - Dùng để chấm cận dưới Wilson cho từng ô; PL21 và bậc B3 dựa trên số này.
  - Tập phải gắn mù và không trộn nhãn lệch mẫu. Ở `research-local/do-mu-s03` mới có danh sách niêm phong và 10 nhãn Opus,
    chưa phải tập người gắn mù.
  - Nhóm A cần khoảng 200 tin mỗi phân khúc, gắn một lần, đo lại mỗi tuần.
  - Đây là chỗ đụng quyết định 06/11 bỏ gắn mù: **Q3 hoãn, quyết lại khi mở PL21**.
- **Mẫu soát cuốn chiếu — để thấy trôi, không để mở cổng** (hàng DO1; độ đúng gắn căn ở DO2, làm giàu ở DO3).
  - Mỗi ngày rút ngẫu nhiên 20 bài từ bài nhận (gồm cả bài máy không nhận là tin rao). Màn hiện nháp máy, người giữ
    hoặc sửa, theo cách «máy nháp, Mạnh feedback» chốt 06/11.
  - Ra tỉ lệ giữ nháp theo (cách đọc × ô) và ước tỉ lệ tin rao bị bỏ sót, theo tuần.
  - Số có neo, nên chỉ dùng so tuần với tuần và so cách đọc với nhau.
  - Công ước 10–15 phút/ngày.
- **Tín hiệu không cần nhãn**, ghi vào `dq_check_results` có sẵn:
  - tỉ lệ JSON hỏng;
  - tỉ lệ câu trích không có trong bài;
  - độ phủ từng ô;
  - bất đồng giữa cách đọc;
  - tỉ lệ ô người sửa trên thẻ.

### 3.3 Chi phí và độ tươi — đã có hàng

- **Chi phí model + phút người để đưa một căn lên mỗi bậc**: thuộc PL31. Số liệu từ `ai_calls` + `ai_model_prices`.
- **Độ tươi p50/p95**: thuộc PL22, thêm hai quãng B1 → gắn căn và gắn căn → lên cổng.

### 3.4 North star

- Phân bố căn theo bậc B0–B5 theo thị trường × loại; số chính là số căn đạt bậc đích (`data_level_snapshot` đã có).
- **Thêm dòng chuyển bậc mỗi ngày** (DO1): bao nhiêu căn lên, tụt, vì sao.
- Bậc năng lực N0–N4 theo phân khúc.

### 3.5 Bất biến (test trong CI)

- 0 quyết định người mất qua nạp lại.
- 0 giá trị máy không có căn cứ.
- 0 dữ liệu tầng A lên cloud. Lời gọi model đọc tin là ngoại lệ có tên theo ADR-0007 sửa 06/11.
- 0 khoá vật thể chứa giá, loại hay bán/thuê.

## 4. Hiện trạng 07/11 (DB máy thu, chỉ đọc)

| Chặng | S03 nhóm chat | S06 | Ghi chú |
|---|---|---|---|
| Bài nhận | 60.976 bài / 7 ngày (~8.700/ngày) | 69.460 tin | Bài thử đã loại |
| Bài khác nội dung | 26.830 (44%) | — | Đếm theo chữ khác nhau; chưa có đơn vị bài đăng (GT2) |
| Là tin rao (ước) | ~79% bài | 100% (có cấu trúc) | Ước từ 48 thẻ vàng, ±10 điểm |
| Bộ đọc nhận đúng tin rao | 28/38 tin rao trên vàng (~74%) | 100% | Bộ đọc tạo 29 tin trên vàng, 28 là tin rao thật |
| Đọc đúng trên 29 tin Bộ đọc tạo | giá 90% · diện tích 100% · phòng ngủ 97% · toà 76% · WC 34% | — | So nhãn vàng có neo |
| Đạt B1 | 33% tin | 100% | Thiếu diện tích 61%. Có khu vực 95%, nhưng tới cấp phường chỉ 1% |
| Gắn vật thể | 0 | 99,97% vào **cụm** (không phải căn) | 63.298 cụm, khoá chứa giá |
| Căn ≥2 tin | — | 5.222 cụm (8%) | Đổi giá thì thành cụm mới |
| Qua phân xử | Phát biểu S03 ~112 nghìn dòng | Hơn 500 nghìn dòng lớp sự thật | 12 cột qua `resolve_offer_fields`, `offer_status` qua `resolve_offer_status`. Bán/thuê, giá, diện tích, khu vực, phường, người bán còn ghi thẳng; cờ «đã đo» gán cứng `false` |
| Nhãn | 48 thẻ lát `s03-theo-nhom`, 30 thẻ `s03-thu-nhom`; danh sách đo mù niêm phong + 10 nhãn Opus | — | Không có mẫu cuốn chiếu, không có tập test đóng băng đủ cỡ |
| Thẻ duyệt chờ | 617 thẻ đề xuất làm giàu | — | 335 thẻ loại hình |
| North star | 63.298 «căn» B2, 0 căn B3+ | | `data_level_snapshot` 06/11 |

Đọc gộp PL30 trên vàng, chưa chạy thật:
- ý định 98%;
- toà 89%;
- khu đô thị, phân khu, trục, tầng 93–98%.

Chi phí khoảng 0,0017 USD/bài:
- trên mọi bài nhận là 13–17 USD/ngày (theo Hỏi-1 của PL30);
- khi có gộp trùng theo nội dung (GT2) là khoảng 7 USD/ngày.

Bật chạy hằng ngày là lời riêng của Mạnh.

## 5. Đối chiếu với mã — giữ · sửa · thiếu

| Thành phần | Hiện trạng (tệp) | Kết luận · hàng |
|---|---|---|
| Raw bất biến, `stg_*` | collector + import | **Giữ** |
| Khoá tin bền | `pipeline/lib/offer-key.mjs` — băm `nguồn|khoá gốc` | **Giữ** |
| Nạp lại không xoá | 039, 044 `retired_at`, `reconcile_stale_offers` | **Giữ** |
| Phát biểu chỉ thêm | 045, 061: 13 trường; `field` CHECK cứng | **Giữ**. **Sửa**: thêm bán/thuê, giá, diện tích, khu vực (PL17); thêm ý định tin theo khoá bài (**chưa có hàng** — đề xuất gộp vào PL17 hoặc PL18); mở `resource_name` Building/Stack/Unit và `method` kế thừa (DB1/PL20, ADR-0016) |
| Bộ đọc luật S03 | `transform-zalo.mjs`; phát biểu qua `pipeline/lib/assert.mjs` chưa có `rule_id`, đoạn khớp | **Giữ**, **sửa**: `rule_id` + đoạn khớp (PL17) |
| Ngữ cảnh nhóm vào cột như quan sát | bán/thuê suy từ nhóm ghi thẳng (`transform-zalo.mjs:509-513, :867`); E1 loại hình `direct` thành lớp quan sát (`context-resolver.ts:93-100,162`, `route.ts:158`) | **Sửa**: thành suy luận (PL18); qua quy ước đã duyệt thì theo GCQ2; ngoại lệ có tên 069 (loại hình suy, một giá trị) |
| Bộ phân xử | 045 `resolve_offer_fields`, 059 `resolve_offer_status`, 063 | **Giữ**. **Sửa**: hiện chỉ ghi cờ `conflict`/`lower_disagree`, chưa sinh thẻ (PL21/PL23); cờ «đã đo» gán cứng `false` (PL21) |
| LLM đọc chữ đang chạy | `agent/src/enrich/doc-toan-bo.ts`: ghi `silver_labels`, kiểm trích bằng so chuỗi; loại hình tự áp khi trích qua luật từ khoá | **Sửa**: tự áp chỉ qua cổng ô đã đo (PL21) |
| Đọc gộp chữ + ảnh, bảng chọn model | PL30 (Cổng Phạm vi), script đo `agent/scripts/doc-gop-3-model-s03.ts` | **Thêm** ở PL30: ghi `silver_labels`. Thành phát biểu ở PL18 (Q5) |
| Hai kho trung gian | `enrichment_proposals` (033) và `silver_labels` (065) song song `field_assertions` | **Sửa**: kết quả máy đọc thành phát biểu (PL18); đề xuất thành hàng đợi trên phát biểu |
| Thẻ duyệt | `run.ts:156-157` còn hiện độ tự tin, trái Q9 | **Sửa** (PL23) |
| Tin nhiều căn | khoá chủ thể `S03:<post_id>` không phân biệt căn trong bài | **Sửa**: E2 ra mảng căn, mỗi căn một khoá (PL18) |
| Lớp «căn» | `resolve-properties.mjs:16-20` khoá có giá; 027, 031, 066 ghi thẳng `properties` | **Thay**: danh bạ vật thể (DB1), `properties` thành view (ADR-0016) |
| Danh bạ vật thể | `asset_nodes` 20 khu đô thị + 3 toà; `stg_s08_inventory` 39.888 dòng; 074 nối khu đô thị S08 (DN1 xong) | **Thiếu**: bảng toà/trục/căn, khoá mờ, bậc dòng danh mục (DB1) |
| Gắn tin vào danh bạ | — | **Thiếu**: PL13 (mã căn, giá khoảng) → PL20 |
| Lịch sử vật thể | 059 `history_transactional` cho tin | **Thiếu** cho vật thể (DB1/DN3) |
| Dòng chảy | `600_data_flow.sql`, `/ops/data-flow` | **Giữ**, **sửa** theo §3.1 (cùng DF3) |
| Bậc | `data_level_snapshot` (056) | **Giữ**, **thêm** dòng chuyển bậc (Q2) |
| Độ đúng | `eval-classify.mjs` (Wilson), `eval_labels`, `label-agreement.mjs`; chạy tay | **Thêm**: tập test mù đóng băng (Q3) + mẫu soát hằng ngày (Q2) |
| Chi phí, độ tươi | `ai_calls`, `check-freshness.mjs` | **Giữ**; mở rộng ở PL31, PL22 |

## 6. Thứ tự — đọc từ lộ trình

Theo `dung_tren` của `docs/plan/lo-trinh.json`. Tài liệu không xếp lại thứ tự.

| Chuỗi | Thứ tự |
|---|---|
| Đọc và quy ước S03 | PL30 → PL18 → GCQ1 → GCQ2 → PL13 (PL13 còn cần PL6, GC0, GN1) |
| Bài đăng S03 | GT2 sau GCQ1, GT0 · GT4 sau PL18, GCQ1 |
| Danh bạ | DN1 (xong) → DB1 → PL20 (cần PL13, PL15, DB1) → DN2 → DN3 → DN4 |
| Diện tích suy ra | PL20 → GC2 → GC3 |
| Nền phân xử | PL17 · PL21 · PL23 · PL31 · PL22 |
| Đo hằng ngày (cắt 07/11, #336) | PL30 → DO1 (+ DF1) → DO3; DO1 + DB1 → DO2; PL18 đứng sau DO1 |

**Đường tới hạn tới căn S03 đầu tiên ở B2:** PL30 → DO1 → PL18 → GCQ1 → GCQ2 → PL13 (+ GN1) → PL20, với DB1 sẵn sàng trước PL20.
Lên B3 cần thêm PL17 và PL21.

Chỗ lệch DB1 ↔ PL13 đã quyết ở Q4: DB1 lượt đầu không chờ PL13; câu `ghi_chu` cũ của PL13 bỏ khi giám sát sửa lộ trình.

## 7. Câu hỏi cho Mạnh — đã trả lời 07/11

Mạnh 07/11 (qua giám sát): «Đồng ý với khuyến nghị khi rà soát tài liệu». Kết quả: Q1, Q2, Q4, Q5, Q6, Q7 theo khuyến
nghị; **Q3 hoãn, quyết lại khi mở PL21** (khuyến nghị của giám sát). Hàng đo Q2 đã cắt thành DO1–DO3 (#336).

| Câu | Khuyến nghị | Lối khác — giá |
|---|---|---|
| **Q1** Duyệt tài liệu làm căn cứ kiến trúc của dòng chảy dữ liệu. Khi ký: chép §3 vào FRAMING §5 thay các dòng «[đề xuất]», ghi nhật ký §9 | Duyệt | Giữ thước đo trong tài liệu này — thành chỗ thứ hai, trái bảng «mỗi loại thông tin một chỗ» của ROADMAP §0 |
| **Q2** Thêm một hàng đo, thu hẹp còn **mẫu soát cuốn chiếu + dòng chuyển bậc + tín hiệu không cần nhãn**. Chi phí lên bậc để PL31, độ tươi để PL22, lý do rơi đi cùng DF3. Hàng này **không thay** GNH2; GNH2 vẫn chờ lớp nhãn | Thêm như vậy | Không thêm — thay đổi model, prompt, luật được phán bằng cảm nhận |
| **Q3** Cổng tự áp PL21 và bậc B3 đo trên **tập test mù đóng băng**: gắn mù một lần ~200 tin mỗi phân khúc, khi mở PL21. Gắn hằng ngày vẫn theo cách «nháp + feedback». Đây là ngoại lệ có tên của quyết định 06/11 bỏ gắn mù; kèm: ghi mục ROADMAP §3, sửa «Gắn nhãn» trong CONTEXT, bỏ đo đồng thuận 20% của F5 | Ngoại lệ có tên | (a) Mở cổng trên mẫu nháp có neo — rẻ hơn, nhưng B3 «đã đo» không còn nghĩa là đã đo độc lập · (b) Không mở cổng tự áp — mọi ô đi thẻ, không có căn B3 |
| **Q4** Lượt đầu DB1 dựng khung toà/trục từ S08 + phát biểu toà, trục của bộ đọc luật, không chờ PL13; mã căn từ PL13 bổ sung sau. Khi cắt, bỏ câu `ghi_chu` cũ ở PL13 | Theo khuyến nghị | Giữ `ghi_chu` PL13 — DB1 chờ PL13, đường tới hạn dài thêm một hàng T3 |
| **Q5** Một chỗ dùng kết quả đọc gộp: PL30 ghi `silver_labels`; PL18 biến nó thành phát biểu; GC2/GC3 đọc phát biểu, không đọc `silver_labels`. Sửa Hỏi-2 của PL30 cho khớp trước Cổng Phạm vi | Đồng ý | Giữ Hỏi-2 cũ (GC2/GC3 đọc thẳng `silver_labels`) — hai đường tiêu thụ, khó phân xử |
| **Q6** Ghi mục ROADMAP §3 «đọc tin S03 dùng ba model cloud qua Gateway (ADR-0007 sửa 06/11)» và thêm ngoại lệ vào §1.6 «Local-first AI»; Hỏi-4 cũ (M1 local mặc định, cổng Gateway hoãn tới PH4) coi như đã thay | Ghi | Không ghi — hiến pháp và quyết định sau lệch nhau, hàng sau phải tự đoán |
| **Q7** Từ vựng: «nhãn bạc» = bảng `silver_labels` (như KC1, KC3 đang dùng); GNH2 gọi «nhãn nháp Opus». Thêm vào CONTEXT các thuật ngữ: nhãn bạc, mẫu soát cuốn chiếu, tập test mù đóng băng, bài khác nội dung, đơn vị bài đăng, dòng chuyển bậc | Đồng ý | Đổi tên `silver_labels` thành «kết quả máy đọc» — phải sửa KC1, KC3, ROADMAP §2 |

Đã làm cùng commit với bản 4: ROADMAP §3 mục 32, 33 và §1.6; FRAMING §5, §9; CONTEXT (nhãn bạc, nhãn nháp Opus, mẫu soát
cuốn chiếu, tập test mù đóng băng, bài khác nội dung, đơn vị bài đăng, dòng chuyển bậc; ghi chú «Gắn nhãn»). Sửa hàng
PL13, GNH2 và chữ OOS-2 của PL30 do giám sát và phiên PL30 làm.

## Nhật ký

| Bản | Ngày | Đổi gì |
|---|---|---|
| 1 | 07/11 | Bản đầu |
| 2 | 07/11 | Giữ chuỗi S03 theo lộ trình; đo bằng nháp + feedback; tách `silver_labels` khỏi GNH2 (theo giám sát) |
| 4 | 07/11 | Mạnh duyệt (Q3 hoãn); chép đo vào FRAMING §5; ROADMAP §3 mục 32, 33, §1.6; CONTEXT; trỏ hàng DO1–DO3 |
| 3 | 07/11 | Soát độc lập hai lượt (kỹ thuật so ADR/mã; xung đột so quyết định, lộ trình, từ vựng). Sửa: vật thể khác vùng · cổng tự áp đo trên tập test mù, mẫu nháp chỉ thấy trôi · trạng thái phân xử thật (12 cột + trạng thái tin) · ý định tin, yêu cầu · ngữ cảnh nhóm là suy luận · đủ ba nhóm F3 và bốn luật phân xử · tin nhiều căn ở chặng đọc · diện tích kế thừa không vào cột · đủ luật tụt bậc, điều kiện B4, bậc dòng danh mục · xác nhận Quỹ hàng là quan sát · hàng đo thu hẹp, không trùng PL31, PL22, DF3, GNH2 · GN1 vào chuỗi · chi phí theo hiện trạng · từ vựng theo CONTEXT · bảy câu hỏi |
