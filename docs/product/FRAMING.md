# Framing — OneHub Invest đi đúng hướng

> Ngày 2026-10-23 · Trạng thái: **đã duyệt (Mạnh, 23/10) — tài liệu sống, cập nhật theo thời gian** (nhật ký §9) · Nguồn: ý của Mạnh trong phiên review kiến trúc
> phân loại (23/10); phần đánh dấu **[đề xuất]** do Claude đề xuất, Mạnh duyệt cùng toàn văn ngày 23/10.
> Thứ tự đọc: mục đích → người dùng → «tin cậy» → mục tiêu → thước đo → rồi mới tới cách làm.
> Tài liệu này đứng trên `CONTEXT-PRODUCT.md` (sản phẩm hôm nay) và ROADMAP §1 (hiến pháp kỹ thuật).

## 1. Mục đích

Gom mọi tin đăng của người môi giới trên thị trường thành **một mạng lưới listing đủ tin cậy**, để môi giới
và nhà đầu tư dựa vào đó ra quyết định và làm việc với nhau. Thông tin tin cậy làm **giảm ma sát**, nên
giao dịch đi **nhanh hơn**.

- **Ngôi nhà chỉ có một, tin đăng thì trùng lặp.** Để giảm công sức của mọi người cần một **bản ghi gốc**:
  số nhà, mã căn.
- **Các trường dữ liệu là phần làm giàu** cho bản ghi gốc.
- **Phân loại và enrich không phải là đích.** Chúng có mặt để mỗi tin so được với đúng nhóm của nó (đúng
  căn nhà, đúng phường, đúng loại hình, bán hay thuê), để con số đưa cho nhà đầu tư không đánh lừa họ.

## 2. Hai phía, một lõi

```
Môi giới (cung)                               Nhà đầu tư (cầu)
cứ đăng ở nơi quen thuộc                      4 câu hỏi đầu tư
        │  hệ thống gom vào                            ▲  OneHub Invest hiển thị
        ▼                                              │
   ┌─────────────────── LÕI TIN CẬY ───────────────────┐
   │  căn gốc (số nhà / mã căn)  ◄── nhiều tin đăng     │
   │  trường thuộc căn · trường thuộc tin               │
   │  mỗi giá trị có căn cứ, độ chắc nói rõ             │
   └────────────────────────────────────────────────────┘
```

### 2.0 Mạnh đã chốt (23/10)

| # | Câu hỏi | Trả lời | Hệ quả |
|---|---|---|---|
| D1 | Dùng / mua danh mục chuẩn dự án · toà · mã căn? | **Có** | Căn gốc dựng từ danh mục rồi ghép tin vào, không chỉ suy từ tin. Thêm việc thu danh mục (làn ZCode) và nạp vào cây `asset_nodes` (project → building → căn) |
| D2 | Ai phải tin mạng lưới trước? | **Tất cả** — chỉ là đổi vai; đội làm sản phẩm vừa là nhà đầu tư vừa là môi giới, và sản phẩm xây ra để làm điều đó | Người dùng đầu tiên là chính đội: dùng thật hằng ngày, phản hồi sai ngay trong lúc giao dịch |
| D3 | Loại hình làm trước? | **Căn hộ** — có mã căn, toà; **người môi giới đang giữ chính mã căn** | Mã căn là trường lõi phải trích được từ tin (và từ môi giới); nhà phố đi sau, sống với «suy ra» |
| D4 | Tin nhóm khép (P1) hiện công khai từng tin? | **Công khai** — đội giao dịch trên đó, tốc độ là thứ mong muốn, trao đổi phải **tức thời** | P1 là danh sách chính, không chỉ là tín hiệu. Độ tươi tính bằng **phút**, không phải ngày — trái với nhịp nạp đêm hiện nay. Vẫn giữ SPL: hiện nhãn tầng C, không tên nguồn thật |
| D5 | Giờ công người cho gắn nhãn + duyệt? | **Sẵn sàng thuê người** để bảo đảm, nhưng **kỳ vọng model đem lại độ chính xác để bỏ người nhiều nhất có thể** | Công người là khoản đầu tư để đo và dạy model, không phải chi phí vận hành vĩnh viễn. Thước đo phải có «tỉ lệ tự động ở ngưỡng đúng» và nó phải tăng theo thời gian |

### 2.1 Phía môi giới — giảm nỗ lực tối đa

- **Gom vào, không phát ra** (Mạnh chốt 23/10): môi giới cứ đăng ở nơi họ vẫn đăng; hệ thống tự gom về, gộp
  trùng, làm giàu. OneHub Invest là **nơi hiển thị**. Hệ thống không đăng tin hộ ra kênh khác (giữ nguyên
  luật an toàn Zalo — AGENTS.md luật 8).
- Họ không phải đăng nhiều nơi, không phải nhập lại, không phải trả lời lặp lại cùng một câu về một căn.
- **Họ được gì** [đề xuất]: tin hiện đúng, gộp đúng, liên hệ dẫn về đúng người đăng (định danh người bán là
  tầng C, công khai — ROADMAP §3.11). Đó là lý do để họ ủng hộ việc bị gom.
- [đề xuất, sau] Môi giới **nhận căn** của mình để xác nhận/sửa — một bậc căn cứ mạnh, chỉ dưới người vận hành.

### 2.2 Phía nhà đầu tư — đủ thông tin để ra quyết định

Sản phẩm chủ lực: đầu tư **dòng tiền**, **ngắn hạn (STR)**, **dài hạn (LTR)**, **kết hợp dòng tiền + tăng giá**.
Sản phẩm trả lời bốn câu:

| # | Câu hỏi | Lõi dữ liệu phải cho được gì [đề xuất] |
|---|---|---|
| 1 | **Thị trường nào?** Thị trường nào hợp kiểu đầu tư tôi thích? A hay B? | Thước giá phường × loại × bán/thuê, không đếm trùng căn; lợi suất STR/LTR; tốc độ tăng giá. Có căn gốc thì đo được **giá cùng một căn qua thời gian** (chỉ số giá lặp lại) và **thời gian căn nằm trên thị trường** — thứ rao vặt thường không cho |
| 2 | **Căn nào?** Trong thị trường đó đang có gì rao bán, căn nào hợp khẩu vị? A hay B? | Mỗi căn một dòng; trường lõi đúng; tin còn hiệu lực; so thước đúng nhóm («Căn giá tốt»); lọc theo khẩu vị |
| 3 | **Vốn và dòng tiền?** Chi phí vốn, dòng tiền dự kiến, IRR, ROI; lãi suất này có vượt ngưỡng chịu đựng của tôi? | Ước giá thuê từ căn so sánh (cùng loại, PN, DT, phường); giá đêm từ listing so sánh; chạy kịch bản lãi suất |
| 4 | **Quản lý danh mục?** Lợi nhuận dòng tiền, tăng giá… | Căn gốc là đơn vị theo dõi; định giá lại định kỳ từ căn so sánh |

Câu 4 thay cho «khai thác sau mua» trong `CONTEXT-PRODUCT.md` §2 — cần cập nhật tài liệu đó khi bản này
được duyệt.

## 3. Lõi dữ liệu

### 3.1 Ba lớp

| Lớp | Là gì | Khoá |
|---|---|---|
| **Căn nhà** (bản ghi gốc) | Mỗi căn đúng một bản ghi | số nhà, mã căn |
| **Tin đăng** | Nhiều tin, có thể trùng, cùng trỏ về một căn | id gốc của nguồn (post, `list_id`…) |
| **Trường làm giàu** | Loại hình, phòng, đường, tầng… | gắn lên căn hoặc lên tin |

[đề xuất] **Trường thuộc căn ≠ trường thuộc tin.**
- *Thuộc căn* (thuộc tính vật lý — đúng một lần là đúng cho mọi tin của căn): loại hình, diện tích, số tầng,
  số phòng, địa chỉ / mã căn, toà, dự án.
- *Thuộc tin* (mỗi tin một giá trị): giá, bán hay thuê, người đăng, ngày đăng, còn hiệu lực.

### 3.2 «Tin cậy» nghĩa là gì [đề xuất — sáu chiều đo được]

1. **Có thật** — tin gắn được vào một căn có thật (số nhà / mã căn; tối thiểu toạ độ + toà).
2. **Duy nhất** — một căn một bản ghi; tin trùng gộp đúng.
3. **Đúng** — trường lõi đúng, mỗi giá trị có căn cứ truy được.
4. **Còn hiệu lực** — còn bán/thuê; giá là giá mới nhất.
5. **Truy được nguồn** — ai đăng, khi nào, ở đâu.
6. **Nói rõ độ chắc** — phân biệt «đã xác minh» · «suy ra» · «chưa biết»; không trình bày suy đoán như sự thật.

### 3.3 Căng thẳng cần tính sớm [đề xuất]

Môi giới thường **cố ý giấu số nhà** để giữ khách. Bản ghi gốc vì thế nhiều khi phải suy từ ảnh, mô tả,
toạ độ, toà — cần trạng thái **«nghi cùng căn»** thay vì ép có/không, và không bao giờ hiển thị số nhà mà
người đăng đã giấu.

## 4. Mục tiêu, không phải mục tiêu, phản mục tiêu

**Mục tiêu** (theo thứ tự)
1. Lõi tin cậy: căn gốc + tin gộp đúng + trường lõi đúng, có căn cứ.
2. Nhà đầu tư trả lời được bốn câu với số không đánh lừa (so đúng nhóm, không đếm trùng).
3. Môi giới không tốn thêm công; tin của họ hiện đúng và dẫn liên hệ về đúng họ.
4. Công duyệt của người ít và bền.

**Không phải mục tiêu (lúc này)**: đúng mọi trường; phủ toàn quốc ngay; đăng tin hộ ra kênh khác.

**Phản mục tiêu** — chạy được vẫn coi là hỏng nếu:
- nhà đầu tư thấy «rẻ 30%» mà thực ra đang so nhà phố với căn hộ;
- tin của môi giới hiện sai, ghi công sai người, hoặc vẫn hiện khi căn đã bán;
- máy trình bày suy đoán như sự thật, hoặc tự ghi giá trị không ai biết dựa vào đâu;
- quyết định của người mất khi nạp lại;
- lộ tầng A (tên nguồn thật, hồ sơ người dùng app).

## 5. Thước đo [đề xuất]

| Tầng | Thước đo | Ghi chú |
|---|---|---|
| **North star** | **Số căn đạt «tin cậy»**: có bản ghi gốc, ≥ 1 tin còn hiệu lực, trường lõi qua ngưỡng đúng | Đếm theo thị trường × loại, **tách hai cột: căn gốc «đã xác minh» · «suy ra»** (độ chắc ≥ ngưỡng). Căn «nghi cùng căn» chưa đếm *(Claude chọn — để số không về 0 khi môi giới giấu số nhà, mà vẫn nói rõ độ chắc)* |
| Lõi (sớm) | Tỉ lệ tin gắn được vào căn · độ đúng gộp trùng · độ đúng trường lõi theo nguồn · độ tươi · tỉ lệ tin thật lọt vào hệ thống | Đo trên tập nhãn (review phân loại §3.5) |
| Môi giới | Số kênh họ không phải tự đăng · tỉ lệ tin của họ hiện đúng và gộp đúng · phản hồi «tin sai» | Phản hồi cần kênh báo sai trên trang hiển thị |
| Nhà đầu tư | Số thị trường đủ thước theo loại · độ đúng danh sách «Căn giá tốt» · sai số ước giá thuê / giá trị khi có số thật | Câu 1–3 |
| Tự động hoá (D5) | **Tỉ lệ giá trị/căn được máy quyết mà vẫn đạt ngưỡng đúng** · số phút người mỗi 100 tin · xu hướng theo tuần | Phải tăng dần; đo trên tập test đóng băng |
| Độ tươi (D4) | **Phút** từ lúc tin đăng ở nguồn tới lúc hiện trên OneHub Invest (p50 / p95) | Mục tiêu cụ thể: câu hỏi mở |
| Giao dịch (trễ) | Thời gian từ tìm tới liên hệ · số liên hệ mỗi căn | Cần sự kiện sản phẩm |
| **Bất biến** (test, không phải tỉ lệ) | 0 quyết định người bị mất qua nạp lại · 0 giá trị máy không có căn cứ · 0 dữ liệu tầng A lên cloud | Chặn ở CI |

## 6. Hệ quả cho cách làm

- **Khoá của sự thật là căn** (số nhà / mã căn); **khoá của bằng chứng là id gốc của tin**. Review phân loại
  (`docs/architecture/classification-enrich-review.md`) mới có vế thứ hai; cần thêm vế thứ nhất.
- `properties.stable_key` hôm nay là «ô lưới ~55 m + giá + loại» — xa «số nhà / mã căn». Đây là khoảng cách lớn
  nhất so với mục đích.
- **Nhận diện căn ngang hàng với phân loại**, không đứng sau: căn gốc mở khoá câu 1 (giá cùng căn qua thời
  gian) và câu 4 (danh mục).
- **Danh mục trước, suy luận sau** (D1, D3): với căn hộ, căn gốc = một dòng trong danh mục dự án → toà → mã căn;
  việc của phân loại là **ghép tin vào đúng dòng** (trích mã căn, toà, dự án từ tin), không phải tự dựng căn từ
  ô lưới + giá.
- **Tức thời** (D4): đường từ hook Zalo tới cổng Invest phải chạy theo tin, không theo lô đêm; mọi bước phân
  loại trên đường đó phải đủ nhanh, và giá trị chưa chắc vẫn hiện được — kèm nhãn «chưa xác minh» thay vì chờ duyệt.
- **Người dạy, model làm** (D5): mỗi nhãn và mỗi quyết định duyệt là dữ liệu huấn luyện/đo cho model (Kev, LLM
  trích xuất); người tập trung vào ca máy chưa đạt ngưỡng, và phần đó phải co lại.
- Mọi tính năng mới trả lời: phục vụ phía nào (môi giới / nhà đầu tư / lõi), câu hỏi nào (1–4), và thước đo
  nào ở §5 sẽ đổi.

## 7. Câu hỏi mở

1. **Câu 3–4 (vốn, danh mục) có vào đợt lớn này không?** Danh mục cần hồ sơ nhà đầu tư — ADR-0007 xếp hồ sơ
   người dùng app vào tầng A (không rời máy local) trong khi app chạy Vercel + Supabase: vào đợt này thì phải
   sửa luật SPL hoặc kiến trúc trước.
2. **Ngưỡng «trường lõi đúng»** cho north star và cho tự động hoá — bao nhiêu phần trăm trên tập nhãn?
3. **Độ tươi mục tiêu** — bao nhiêu phút từ lúc đăng tới lúc hiện (D4)?
4. **Nguồn danh mục cụ thể** (D1) — chủ đầu tư nào, bản đồ nào, địa chính; mua hay thu; ưu tiên dự án nào trước.
5. **Luật hiển thị tin của môi giới** — hiện gì, ghi công thế nào, gỡ thế nào khi họ yêu cầu.
6. **Kênh phản hồi «tin sai»** — với D2 (đội là người dùng đầu tiên), đặt ngay trên trang hiển thị?

## 8. Claude đã tự chọn (Mạnh kiểm khi đọc)

- North star đếm cả căn gốc «suy ra», tách cột với «đã xác minh» (§5).
- **Listing cho thuê ngắn hạn (S01)** lúc này **không** ghép vào căn gốc: lợi suất STR dùng thước phường × loại.
  Ghép listing Airbnb ↔ tin rao bán (Airbnb không lộ địa chỉ) để đợt sau, khi căn gốc của tin rao đã ổn.
- Trường «thuộc căn» / «thuộc tin» theo danh sách §3.1 — có thể dời một trường khi làm thật.

## 9. Nhật ký thay đổi

Tài liệu sống: mỗi lần đổi mục đích, mục tiêu, thước đo hay quyết định D… thì thêm một dòng ở đây và cập
nhật ROADMAP §3 nếu là quyết định mới.

| Ngày | Đổi gì | Ai |
|---|---|---|
| 2026-10-23 | Bản đầu: mục đích, hai phía một lõi, sáu chiều «tin cậy», thước đo; D1–D5 | Mạnh duyệt · Claude ghi |
