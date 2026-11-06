# Mô hình hoàn chỉnh của đường ống — tin vào, căn nhà sống qua thời gian, đo hằng ngày

Ngày: 2026-11-07 · Người soạn: Claude (phiên thợ P2, theo lời Mạnh 07/11) · Trạng thái: **chờ Mạnh ký**

> Lời giao (Mạnh, 07/11): «tổng hợp lại đi từ Phân tích kỹ lưỡng thành mô hình hoàn chỉnh cho toàn bộ pipeline bao gồm cách
> đo lường hiệu quả trong hoạt động hàng ngày tạo ra tin và mô hình một ngôi nhà được phân loại và enrich qua thời gian…
> đưa thành dạng tri thức với tài liệu rõ ràng. Kiểm tra với các mã đang thực hiện hiện nay để bổ sung, sửa đổi».

## Tài liệu này là gì

Tài liệu này **ghép các quyết định đã chốt thành một mô hình đi từ đầu tới cuối**, thêm phần còn thiếu là lớp đo
hằng ngày, và đối chiếu với mã đang chạy. Nó không lật quyết định nào.

| Nguồn đã chốt | Phần lấy vào |
|---|---|
| `docs/product/FRAMING.md` §3 | Ba lớp căn / tin / trường làm giàu · thang bậc B0–B5, N0–N4 · thước đo §5 |
| ADR-0013 (`docs/adr/0013-kien-truc-du-lieu-tin-can-reso.md`) | Tin = `Property`, căn = UPI + `Building` · khoá tin bền · mọi giá trị là phát biểu · tám câu luật |
| ADR-0016 (`docs/adr/0016-danh-ba-vat-the-va-nguoi.md`) | Danh bạ bốn họ · khoá mờ đúc một lần · gắn mức sâu nhất có bằng chứng · kế thừa năm luật |
| `docs/architecture/classification-enrich-review.md` | Bản đồ điểm phân loại · thứ bậc căn cứ · tập nhãn từng tầng · thẻ duyệt đủ căn cứ |
| `docs/superpowers/specs/2026-11-03-danh-ba-xac-nhan-toan-quoc-design.md` | Danh bạ nhà kiểu Housing Dictionary, môi giới xác nhận trong Quỹ hàng |
| Kho tri thức: `doc-tin-va-anh-s03`, `gom-tach-gop-tin-s03`, `gan-can-s03`, `dong-chay-du-lieu` | Đọc tin + ảnh, đơn vị bài đăng, gắn căn S03, trang dòng chảy DF0–DF5 |
| Hồ sơ PL30 `chon-model-theo-o` (đo 06–07/11) | Đọc gộp 17 ô, số đo ba model trên vàng |

## 0. Một trang

**Mô hình trong năm câu.**

1. Mọi thứ máy hay người biết về một tin là một **phát biểu**: giá trị · bậc căn cứ · ai/cách nào · câu trích · lúc nào.
   Phát biểu lưu chỉ thêm theo khoá bất biến của bài gốc.
2. **Cột chuẩn của tin** là bản tính sẵn do bộ phân xử dựng từ phát biểu. Không bước nào ghi thẳng.
3. **Căn nhà** là một nút trong danh bạ vật thể (dự án → phân khu → toà → trục → căn). Khoá mờ được đúc một lần, không
   chứa giá, loại hay bán/thuê. Tin gắn vào nút sâu nhất có bằng chứng, và việc gắn cũng là một phát biểu.
4. Căn **làm giàu qua thời gian**: mỗi lần xuất hiện lại là thêm phát biểu (giá, trạng thái, người bán, nội thất), lên
   bậc khi có bằng chứng mới và tụt bậc khi bằng chứng cũ đi. Trường thuộc căn đi xuống tin; trường thuộc tin không
   quay lên nuôi căn.
5. **Đo hằng ngày bằng bốn tầng**: phễu chặng · độ đúng trên mẫu soát cuốn chiếu · chi phí và độ tươi · phân bố căn theo
   bậc (north star). Mọi thay đổi (model, prompt, luật) được phán bằng các số này.

**Ba số nền 07/11.**

- **63.298 «căn» đều ở bậc B2, không căn nào B3 trở lên.** Các «căn» này thực ra là cụm tin S06 có giá trong khoá.
- **Tin S03 chưa gắn căn nào.** 4.685 tin lẻ S03/S05 đứng ở B0–B1: 3.117 ở B0, 1.568 ở B1.
- **Danh mục vật thể mới có 20 dự án và 3 toà.** Danh mục S08 có 39.888 dòng nhưng chưa dựng thành danh bạ.

**Đòn bẩy.** Định danh căn bền (danh bạ toà–trục–căn) đi trước. Sau đó đọc đủ ô định danh, gắn tin theo mức, và tích
luỹ phát biểu theo thời gian. Thêm model hay thêm lượng thu không phải đòn bẩy lúc này.

## 1. Đường ống đích — tám chặng

| # | Chặng | Việc | Đầu ra | Khoá | Ai quyết | Làn |
|---|---|---|---|---|---|---|
| C1 | Thu | Thu đủ, không lọc; raw bất biến | Snapshot raw → `stg_*` | id gốc của nguồn | luật thu | ZCode |
| C2 | Bài đăng | Gom ảnh với chữ; tách bài nhiều căn; khử trùng chữ và ảnh theo nội dung | Đơn vị bài đăng | post gốc (`S0x:<id>`) | luật xác định | Claude |
| C3 | Đọc | Phân loại (ý định tin, bán/thuê, loại hình) và trích (giá, diện tích, phòng ngủ, WC, dự án, phân khu, toà, trục, tầng, mã căn, người bán), mỗi giá trị kèm câu trích | Phát biểu thô | bài đăng | luật · Bộ đọc · model đọc gộp | Claude |
| C4 | Phát biểu | Lưu chỉ thêm, bậc căn cứ fact / observed / inferred × cách đọc; rút thay vì xoá | `field_assertions` | (chủ thể, trường, cách đọc) | — | Claude |
| C5 | Phân xử | Dựng cột chuẩn của tin theo thứ bậc căn cứ; chỉ tự áp ô đã đo đạt ngưỡng; ô còn lại lên thẻ duyệt | Cột chuẩn + `field_provenance` | `offer_id` = băm khoá bền | luật xác định + người | Claude |
| C6 | Gắn vật thể | Nối tin vào nút sâu nhất có bằng chứng (căn · trục khi che tầng · toà · dự án); ca mơ hồ lên thẻ | Phát biểu liên kết tin → nút | khoá mờ `unt_`/`stk_`/`bld_` + UPI | luật + model + người | Claude |
| C7 | Làm giàu theo thời gian | Kế thừa hai chiều (năm luật ADR-0016); lịch sử giá, trạng thái, người bán; tính bậc B0–B5 mỗi ngày | Hồ sơ căn + lịch sử | khoá vật thể | bộ phân xử + nhịp quét | Claude |
| C8 | Phục vụ | Invest, Ops, API chỉ đọc; chiếu bậc thành ba nhãn «đã xác minh / suy ra / chưa biết»; SPL trước khi rời máy | Trang + API | — | — | Claude |

Người đứng ở ba chỗ:
- gắn nhãn vàng (mẫu cuốn chiếu, xem §3);
- duyệt thẻ ở C5 và C6, mỗi quyết định là một phát biểu bậc fact/hitl, sống qua nạp lại;
- môi giới xác nhận căn trong Quỹ hàng (ADR-0017), đẩy căn lên B4.

### Luật xuyên suốt (giữ nguyên từ ADR, nhắc lại để đọc một chỗ)

- Tám câu của ADR-0013 và ba câu ADR-0016 thêm: lớp nào, RESO DD 2.1, khoá bền, ai ghi, nguồn gốc, thời gian, nâng
  bậc nào, SPL, gắn mức sâu nhất có bằng chứng, kế thừa không tự nuôi, vật thể chỉ có từ S08 không lên Invest.
- Luật 7: model chỉ phát biểu kèm câu trích. Quyết định ghi đi qua luật xác định có ngưỡng đo, hoặc qua người.
- Không khoá nào chứa nội dung có thể đổi: giá, diện tích, loại, bán/thuê, phường.

## 2. Mô hình Một Căn Nhà qua thời gian

### 2.1 Định danh

- **Nút vật thể** theo ADR-0016: thửa · toà · trục · căn, quan hệ cha–con không bắt buộc đủ cấp.
- Khoá mờ `bld_`/`stk_`/`unt_` + ULID, đúc một lần. Vòng đời: hoạt động · gộp · tách · nghỉ; không xoá; khoá cũ giữ
  làm bí danh.
- UPI `urn:onehub:upi:1:VN:<tỉnh>:<BuildingKey>`, SubId `<StackKey>:<tầng>`, hoặc `:*` khi tầng bị che.
- **Khung toà làm trước căn.** Ô chưa có bằng chứng không đúc khoá, để tránh căn rác.
- Nguồn dựng khung:
  - danh mục S08 (chỉ nội bộ);
  - từ điển toà, phân khu đã chốt khi gắn nhãn;
  - phát biểu toà và mã căn từ tin.
- Chung cư dựng từ danh mục. Nhà phố và đất bắt đầu mỗi tin một vật thể tạm, rồi gộp theo bằng chứng. Toạ độ chỉ là
  tín hiệu phụ.

### 2.2 Gắn tin vào căn — theo mức

| Mức | Khi nào | Ví dụ S03 | Tỉ lệ trên vàng 48 thẻ |
|---|---|---|---|
| Căn | Có toà + tầng + trục, hoặc mã căn | `PR5.1203` | ~8/48 có tầng |
| Trục (`:*`) | Có toà + trục, tầng che | `LD2XX03` | ~16/48 có trục |
| Toà + loại căn | Có toà, không trục | `S8.02, 2PN, 65 m²` | ~32/48 có toà |
| Dự án / phân khu | Chỉ biết dự án | thẻ nhóm OCP | ~44/48 |

Liên kết là phát biểu theo khoá `<S0x>:<id gốc>`, không phải khoá ngoại tới bảng tin. Gắn nhầm thì rút phát biểu,
và các phát biểu kế thừa đi theo cũng được rút dây chuyền.

### 2.3 Làm giàu theo thời gian

- **Trường thuộc căn** (đúng một lần là đúng cho mọi tin): loại hình, diện tích, số phòng, toà, trục, tầng, dự án,
  hướng. Các trường này đi xuống tin qua phát biểu kế thừa.
- **Trường thuộc tin**: giá, bán/thuê, người đăng, ngày đăng, còn hiệu lực. Không quay lên nuôi căn.
- **Mỗi lần căn xuất hiện lại** (tin mới, đăng lại, nguồn khác) thêm phát biểu có `observed_at`. Từ đó dựng ra:
  - lịch sử giá theo căn;
  - trạng thái (đang rao, đã thuê/bán, off-market = có trong danh bạ nhưng không có tin còn hiệu lực);
  - người bán theo căn;
  - nội thất, tình trạng.
- **Bất đồng** giữa phát biểu (hai tin cùng căn ghi diện tích khác nhau) sinh thẻ duyệt, không lấy số mới nhất đè.

### 2.4 Bậc của căn (FRAMING §3.4, giữ nguyên)

B0 có lời khai → B1 đọc được → B2 gắn căn → B3 đã đo → B4 xác minh → B5 sống.

| Phân khúc | Bậc đích |
|---|---|
| Căn hộ có danh mục | B5 |
| Nhà phố | B3 |
| Tin S06 dùng làm thước | B3 |

Tụt bậc khi bằng chứng mất: hết cửa sổ độ tươi thì B5 về B4; đo lại dưới ngưỡng thì B3 về B2.

## 3. Đo hiệu quả trong vận hành hằng ngày

Bốn tầng, tính sẵn ở pipeline (luật 10), đẩy lên Ops qua kênh số tổng hợp đã có (`push-ops-facts`). Theo nguồn ×
thị trường × loại hình × ngày. Không có bảng nào đọc nội dung tin lên cloud.

### Tầng 1 — Phễu chặng (bao nhiêu đi qua, rơi ở đâu, vì sao)

| Chặng | Số đo | Định nghĩa |
|---|---|---|
| C1 | Bài thu | Bài thật (đã loại bài thử) |
| C2 | Bài khác nội dung | Sau khử trùng chữ và ảnh |
| C3 | Là tin rao (ước) | Bài khác nội dung × tỉ lệ tin rao đo trên mẫu soát cuốn chiếu |
| C3 | Đọc thành tin | Tin có phát biểu ý định = rao; **recall** = đọc thành tin / là tin rao (ước) |
| C5 | Đạt B1 | Đủ năm trường lõi (DF0): bán/thuê, loại, giá, diện tích, phường |
| C6 | Gắn vật thể theo mức | Số và % tin gắn mức căn / trục / toà / dự án |
| C7 | Căn có ≥2 lần xuất hiện | Độ dày hồ sơ: số phát biểu / căn |
| C8 | Lên cổng | Tin, căn hiện trên Invest |

Mỗi chặng có thêm **lý do rơi** (thiếu giá, thiếu diện tích, không phải tin rao, không gắn được…). Lý do chảy từ phát
biểu, không suy lại.

### Tầng 2 — Độ đúng

- **Mẫu soát cuốn chiếu — theo cách «máy nháp, Mạnh feedback» (Mạnh chốt 06/11, bỏ gắn mù).**
  - Mỗi ngày rút ngẫu nhiên 20 bài đã qua C3, kể cả bài máy không nhận là tin rao. Màn gắn nhãn hiện sẵn giá trị máy
    làm nháp; người giữ hoặc sửa từng ô, như cách gắn nhãn đang làm.
  - Mỗi tuần tính, theo (cách đọc × ô), tỉ lệ giữ nháp với cận dưới Wilson, và tỉ lệ tin rao bị máy bỏ sót.
  - Mẫu này thay lát vàng cố định, chữa lỗ «quy ước viết từ chính thẻ đang đo». Công người ước 10–15 phút/ngày;
    lượt gắn 06/11 giữ 98,4% nháp nên duyệt nhanh.
  - **Giới hạn:** người thấy nháp nên số đo có neo. Nó là tỉ lệ giữ nháp, không phải độ đúng mù, và có thể cao hơn độ
    đúng thật. Dùng để thấy trôi theo tuần và so cách đọc với nhau; không dùng làm bằng chứng độ đúng tuyệt đối. Đo mù
    chỉ quay lại khi Mạnh quyết (ví dụ lúc chốt lớp nhãn bạc GNH2).
- **Độ đúng gắn căn**: trên cùng mẫu, người gắn mức (căn/trục/toà) và nút đúng. So với gắn của máy thì ra tỉ lệ gắn
  đúng và gắn nhầm.
- **Tín hiệu không cần nhãn** (cảnh báo khi trôi quá 2 độ lệch chuẩn so với 14 ngày):
  - tỉ lệ JSON hỏng;
  - tỉ lệ câu trích không có trong bài;
  - độ phủ từng ô;
  - bất đồng giữa hai cách đọc trên ô chung;
  - tỉ lệ ô người sửa trên thẻ.
- **Cổng tự áp** (PL21): ô (cách đọc × trường × phân khúc) chỉ được tự áp khi cận dưới Wilson trên mẫu soát cuốn chiếu đạt
  ngưỡng F3:
  - nhóm A 0,95: ý định, loại, dự án, toà;
  - nhóm B 0,90: giá, diện tích, phòng ngủ.

  Tụt ngưỡng thì ô tự về thẻ duyệt. Vì mẫu có neo, ngưỡng của cổng này cần Mạnh chốt lại khi làm PL21.

### Tầng 3 — Chi phí và độ tươi

- USD model mỗi bài · mỗi tin B1 · **mỗi căn lên một bậc**, theo phân khúc. Số liệu từ `ai_calls` + `ai_model_prices`,
  chia cho tử số của tầng 1.
- Phút người mỗi 100 tin, gồm thẻ duyệt và mẫu cuốn chiếu.
- Độ trễ p50/p95 cho ba quãng: đăng ở nguồn → B1 · B1 → gắn căn · gắn căn → lên cổng.

### Tầng 4 — North star

- **Phân bố căn theo bậc B0–B5** theo thị trường × loại. Số chính là số căn đạt bậc đích của phân khúc.
- **Dòng chuyển bậc mỗi ngày**: bao nhiêu căn lên, bao nhiêu tụt, vì sao. «Giữ không tụt» đo được bằng dòng này.
- Bậc năng lực N0–N4 của từng phân khúc. Phân khúc lên N3 thì mới mở cổng công khai rộng.

### Bất biến (test trong CI, không phải tỉ lệ)

- 0 quyết định người mất qua nạp lại.
- 0 giá trị máy không có căn cứ.
- 0 dữ liệu tầng A lên cloud.
- 0 khoá vật thể chứa giá, loại hay bán/thuê.

## 4. Hiện trạng 07/11 (DB máy thu, chỉ đọc)

| Chặng | S03 nhóm chat | S06 | Ghi chú |
|---|---|---|---|
| C1 bài thu | 60.976 bài / 7 ngày (~8.700/ngày) | 69.460 tin | Bài thử đã loại |
| C2 khác nội dung | 26.830 (44%) | — | Chưa có đơn vị bài đăng riêng (GT2) |
| C3 là tin rao (ước) | ~79% bài | 100% (có cấu trúc) | Ước từ 48 thẻ vàng, ±10 điểm |
| C3 recall ý định | ~74% (28/38 tin rao trên vàng) | 100% | Bộ đọc luật |
| C3 đọc đúng trên tin đã nhận | giá 90% · DT 100% · PN 97% · toà 76% · WC 34% | — | 29 tin vàng |
| C5 đạt B1 | 33% tin (thiếu diện tích 61%, phường 99%) | 100% | 1.568 tin lẻ B1, 3.117 B0 |
| C6 gắn vật thể | 0 | 99,97% vào **cụm** (không phải căn thật) | 63.298 cụm, khoá chứa giá |
| C7 căn ≥2 tin | — | 5.222 cụm (8%) | Đổi giá thì thành cụm mới |
| Phát biểu | ~112 nghìn dòng: PN, loại hình (35% tin có loại suy từ nhóm), toà, mã căn, trạng thái | hơn 500 nghìn dòng fact/source_field | 5 trường qua phân xử, phần còn lại ghi thẳng |
| Nhãn vàng | 48 thẻ lát `s03-theo-nhom` (+30 `s03-thu-nhom`) | — | Không có mẫu cuốn chiếu |
| Thẻ duyệt chờ | 617 thẻ đề xuất làm giàu | — | 335 thẻ loại hình |
| North star | 63.298 «căn» B2, 0 căn B3+ | | `data_level_snapshot` 06/11 |

Đọc gộp PL30 trên vàng, chưa chạy thật:
- ý định 98%;
- toà 89%;
- dự án, phân khu, trục, tầng 93–98%;
- chi phí khoảng 0,0017 USD/bài. Chạy trên bài khác nội dung thì khoảng 7 USD/ngày.

## 5. Đối chiếu với mã — giữ · sửa · thiếu

| Thành phần | Hiện trạng (tệp) | Kết luận |
|---|---|---|
| Raw bất biến, `stg_*` | collector + import | **Giữ** |
| Khoá tin bền | `pipeline/lib/offer-key.mjs` — S03 băm khoá gốc bền, S06 `list_id` | **Giữ** (khớp ADR-0013) |
| Nạp lại không xoá | 039, 044 `retired_at`, `reconcile_stale_offers` | **Giữ** |
| Phát biểu chỉ thêm | 045 `field_assertions`, trigger chặn sửa/xoá | **Giữ**, **sửa**: mở `field` cho bán/thuê, giá, diện tích, tầng, trục, dự án, phân khu, liên kết vật thể (PL17) |
| Bộ phân xử | 045 `resolve_offer_fields`, 063 | **Giữ**, **sửa**: thêm cổng «ô đã đo» (PL21) thay `measured:false` |
| Cột chuẩn ngoài 5 trường | `transform-chotot.mjs:97-110`, `write-offers.mjs` ghi thẳng giá, diện tích, khu vực | **Sửa** dần qua PL17 |
| Bộ đọc luật S03 | `transform-zalo.mjs` | **Giữ** làm một cách đọc (rẻ, đúng trên tin nó nhận) |
| Đọc gộp model | PL30 (đang ở Cổng Phạm vi), `agent/scripts/doc-gop-3-model-s03.ts` | **Thêm**: PL30 chỉ ghi bảng `silver_labels` (kết quả máy đọc); thành phát biểu `observed/e2_llm` kèm câu trích ở PL18 (E2 mù ra mảng phát biểu) |
| Hai kho trung gian | `enrichment_proposals` (033) và bảng `silver_labels` (065) song song với `field_assertions` | **Sửa**: hợp nhất. Kết quả máy đọc → phát biểu (PL18); đề xuất thành khung nhìn hàng đợi trên phát biểu |
| E2 thấy đáp án E1 | `agent/src/enrich/route.ts`, `enrich-text.ts` | **Sửa**: E2 chạy mù (PL18) |
| Thẻ duyệt | `run.ts:144-160` vẫn hiện độ tự tin model | **Sửa**: thẻ theo bậc căn cứ, tô câu trích (PL23) |
| Lớp «căn» | `resolve-properties.mjs:16-20` khoá ô toạ độ + bán/thuê + loại + diện tích + giá; 027, 031, 066 ghi thẳng `properties` | **Thay**: danh bạ vật thể (DB1), `properties` thành view (ADR-0016) |
| Danh mục vật thể | `asset_nodes` 20 dự án + 3 toà; `stg_s08_inventory` 39.888 dòng; 074 nối dự án S08 | **Thiếu**: bảng toà/trục/căn + khoá mờ (DB1) |
| Gắn tin vào danh mục | — | **Thiếu**: PL13 (đọc mã căn) → PL20 (ghép tin vào danh mục) |
| Lịch sử, sự kiện căn | 059 `history_transactional` cho tin | **Thiếu** cho vật thể |
| Phễu Ops | `600_data_flow.sql` → `data_flow_snapshot`, `/ops/data-flow` | **Giữ**, **sửa**: thêm chặng bài khác nội dung, recall ước, gắn theo mức, lý do rơi |
| Bậc căn | `data_level_snapshot` (056) | **Giữ**, **thêm** dòng chuyển bậc mỗi ngày |
| Độ đúng | `pipeline/lib/eval-classify.mjs` (Wilson), `eval_labels`, `label-agreement.mjs`; chạy tay trên lát cố định | **Thêm**: mẫu soát cuốn chiếu hằng ngày + lịch chạy |
| Chi phí | `ai_calls`, `ai_model_prices`, `/ops/ai-calls` | **Giữ**, **thêm** chi phí trên tin B1 và trên căn lên bậc |
| Độ tươi | `check-freshness.mjs`, khối `freshness` | **Giữ**, **thêm** độ trễ ba quãng |

## 6. Thứ tự — theo lộ trình đã chốt, cộng hai việc mới

Chuỗi S03 giữ đúng lộ trình (#335, Mạnh chốt 05/11). Tài liệu này không đổi thứ tự của chuỗi; chỉ thêm hai việc nằm
ngoài chuỗi (Q2, Q3).

| Chuỗi | Thứ tự (theo `dung_tren` của lộ trình) | Ghi chú |
|---|---|---|
| S03 đọc và quy ước | PL30 → PL18 → GCQ1 → GCQ2 → PL13 | PL18 trước GCQ1; PL13 cần GCQ2 và PL30 |
| S03 bài đăng | GT2 (sau GCQ1, GT0) · GT4 (sau PL18, GCQ1) | GT4 đứng sau PL18 vì tách sai thì khoá gộp sai |
| Danh bạ căn | DN1 (xong) → **DB1** → PL20 (cần PL13 + DB1) → DN2 → DN3 → DN4 | DB1 chỉ cần DN1, nên bắt đầu được ngay (Q3) |
| Diện tích suy ra | PL20 → GC2 → GC3 | |
| Nền phát biểu | PL17 (parser ghi phát biểu) · PL21 (tự áp theo số đo) · PL23 (thẻ duyệt v2) | Dựa PL15/PL16 đã xong; xếp theo lộ trình |
| **Mới** | `do-hieu-qua-hang-ngay`: mẫu soát cuốn chiếu + phễu mở rộng + dòng chuyển bậc + chi phí trên bậc | Q2; không chặn chuỗi nào, nên đứng sớm để các hàng sau có số so |

Đường tới hạn của Một Căn Nhà: PL30 → PL18 → GCQ1 → GCQ2 → PL13 → PL20 (∥ DB1) → GC2, DN2. DB1 bắt đầu ngay thì không
thành chỗ chờ khi PL13 xong.

## 7. Quyết định cho Mạnh

| Câu | Khuyến nghị | Lối khác — giá |
|---|---|---|
| **Q1** Duyệt tài liệu này làm mô hình chuẩn của đường ống, các tài liệu nguồn giữ làm chi tiết | Duyệt | Giữ rải rác như hiện nay — mỗi hàng tự ghép lại, dễ lệch |
| **Q2** Thêm hàng `do-hieu-qua-hang-ngay`, độ đúng đo bằng mẫu soát 20 bài/ngày theo cách «máy nháp, Mạnh feedback» (~10–15 phút/ngày), không quay lại gắn mù | Thêm, theo cách nháp + feedback | (a) Không thêm — chọn model, prompt, luật theo cảm nhận, không biết phân bố bậc có tụt · (b) Quay lại gắn mù — số không neo nhưng đảo quyết định 06/11, ~30 phút/ngày và Mạnh thấy vất vả |
| **Q3** DB1 bắt đầu ngay, song song chuỗi S03, không chờ PL13 | Bắt đầu ngay | Chờ tới khi PL13 xong — PL20 phải đợi DB1, đường tới hạn dài thêm cỡ một hàng T3 |
| **Q4** PL30 chỉ ghi bảng `silver_labels` (kết quả máy đọc, như Hỏi-2 của PL30); thành phát biểu ở PL18 theo lộ trình. Bảng này khác «lớp nhãn bạc» GNH2 (nhãn Opus trong `eval_labels`), việc Mạnh chưa chốt | Đồng ý | PL30 ghi thẳng phát biểu — PL30 lớn hơn, chồng phần việc của PL18 |

Thứ tự và cắt hàng do giám sát điều phối sau khi Mạnh ký (yêu cầu P2-122, P2-123).
