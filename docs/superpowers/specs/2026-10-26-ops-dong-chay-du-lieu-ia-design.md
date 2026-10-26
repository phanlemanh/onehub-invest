# Dòng chảy dữ liệu v2 + IA cổng Ops — phân tích, hoàn thiện, đề xuất

> Ngày 2026-10-26 · Trạng thái: **Mạnh duyệt cả 5 khuyến nghị ở §5 (26/10)** — DF0 bắt đầu cùng ngày · Nối tiếp proto `/ops/data-flow` (nhánh
> `claude/bold-galileo-985713`, chưa commit). Số liệu: DB local :5433, chỉ SELECT, 26/10 chiều.
> Căn cứ: `docs/product/FRAMING.md` (§3.4 thang B0–B5), `docs/architecture/classification-enrich-review.md`
> (§0.2 B tám thành phần T1–T8, §3.1 năm nguyên lý, §3.3 thang căn cứ H0–H5), `docs/architecture/portals.md`
> (IA Ops — nguyên tắc phân trang), `docs/plan/lo-trinh.json`.

## 0. Một trang

Mạnh nêu bảy ý. Gom lại thành **ba câu hỏi** mà trang Dòng chảy phải trả lời, và **một câu hỏi IA**:

| # | Câu hỏi | Trả lời bằng | Có số hôm nay? |
|---|---|---|---|
| Q1 | Đường ống có đang **làm đúng nguyên tắc** đã đóng gói không? | **Lăng kính nguyên tắc** — tám bất biến T1–T8, mỗi cái một phép kiểm: Đạt · Vi phạm · Chưa đo được (kèm hàng lộ trình) | 5/8 có số, 3/8 «chưa đo được» (đó cũng là thông tin) |
| Q2 | **Từng tin** đáng tin tới đâu, nhiều bằng chứng tới đâu? | **Thẻ điểm tin** trong hồ sơ tin + một cột điểm gọn trong bảng | Có (độ đủ, độ chắc thô, độ tươi, lượng bằng chứng, cờ, ảnh) |
| Q3 | **Thiếu gì để lên bậc** — cho một tin, và cho cả kho? | **Điều kiện lên bậc** trong thẻ điểm (Next Action, ai làm) + **bảng chặn bậc** trên trang | Có |
| IA | Thu thập và Dòng chảy chồng nhau — chia thế nào? | **Ranh giới trang = ranh giới hợp đồng dữ liệu** (`stg_*`): Thu thập là «máy có thu đủ không», Dòng chảy là «thứ đã thu đi tới đâu» | — |

Ba con số làm câu trả lời gấp: **0/269 tin S03 đủ năm trường lõi** (theo đúng định nghĩa B1 của FRAMING, proto đang
gọi chúng là «B1» là quá lỏng); **39/269 tin S03 có giá hoặc diện tích phi lý**; **7/4.290 bài S03 có ảnh đã tải về
máy** (4.290 bài có ảnh nhưng ảnh còn nằm ở CDN nguồn, sẽ hết hạn — vi phạm T1 «bằng chứng giữ trọn»).

## 1. Phân tích từng ý của Mạnh

### 1.1 «Nguyên tắc và phương pháp đã đóng gói — làm sao thấy chúng phản ánh qua data flow?»

Nguyên tắc đã có dạng **kiểm được**: review §0.2 B rút ra tám thành phần, mỗi thành phần có một **bất biến phải giữ**.
Một nguyên tắc chỉ «thấy được» khi nó có một phép đo trả lời đúng/sai trên dữ liệu thật. Vậy lăng kính là bảng tám
dòng, mỗi dòng: bất biến · phép kiểm · kết quả hôm nay · hàng lộ trình làm nó «Đạt».

| T | Bất biến (review §0.2 B) | Phép kiểm trên dữ liệu | Hôm nay | Lấp bởi |
|---|---|---|---|---|
| T1 Bằng chứng | Đầy đủ, bất biến, có khoá gốc, **có ảnh** | % bài có ảnh **đã tải về máy** / bài có ảnh; Kev không lọc tin (hook đẩy mọi tin) | **Vi phạm**: 7/4.290 ảnh S03 tải về; Kev đã thành nhãn (PL4 ký) | ZC4 triển khai thật, TV9 |
| T2 Từ vựng | Một sổ, mọi bộ đọc dùng chung | % giá trị ngoài sổ; % `unknown` theo trường | Đạt sổ (CHECK); **`property_type` 269/269 S03 = chưa rõ** | PL6 (xong), NT6 |
| T3 Diễn giải | Phát biểu kèm đoạn trích + phương pháp@phiên bản | % trường lõi có phát biểu có `rule_id` + vị trí đoạn khớp | **Chưa đo được** — chưa có bảng phát biểu | PL15, PL17 |
| T4 Định danh | Khoá không suy từ nội dung đổi được | `offer_id` có phải băm nội dung? số tin gộp ≥ 20 bài | **Vi phạm**: `offer_id` P1 băm `kind|phường|giá|DT|PN`; 33 tin S03 gộp ≥ 20 bài (một tin 95 bài) | PL14, PL24 |
| T5 Thời gian | Mọi phát biểu có thời điểm; lời chào có hiệu lực | Độ trễ đăng → vào kho (p50/p95); % tin có `offer_status` | Nạp lô 00:00 (độ trễ tính bằng giờ); `offer_status` chưa có | PL19, PL22 |
| T6 Đo | Độ tin chỉ từ nhãn, tập test đóng băng | Số ô (cách đọc × trường × nguồn) đã đo, số ô đạt Wilson F3 | **Chưa đo được** — 0 ô | PL7, PL9 |
| T7 Phân xử | Canonical dựng lại được, có provenance | Xoá cache dựng lại có ra y nguyên? | **Chưa đo được** — chưa có bộ phân xử | PL15 |
| T8 Người | Quyết định người sống qua nạp lại | Số quyết định người còn khớp sau lượt nạp; thẻ chờ | 11 thẻ ghép căn chờ; quyết định cũ đã mất 23/10 (L03) | PL16, PL23 |

Kết luận: «Chưa đo được» không phải ô trống — nó là cảnh báo rằng nguyên tắc chưa có máy giữ. Trang hiện nó bằng
badge trung tính + tên hàng lộ trình, không giấu.

### 1.2 «Mỗi tin chất lượng và số lượng khác nhau — scorecard nhỏ trong từng tin»

Tách hai trục Mạnh nói thành năm mục đo được, mỗi mục một dòng trong thẻ điểm:

| Mục | Câu trả lời | Cách tính hôm nay | Cách tính khi PL15 xong |
|---|---|---|---|
| **Độ đủ** (chất lượng) | Đọc được mấy/5 trường lõi? | loại tin · loại hình · giá · diện tích · vị trí (phường) có giá trị | như cũ, cộng toà/mã căn cho căn hộ (D3) |
| **Độ chắc** (chất lượng) | Mỗi trường dựa vào căn cứ bậc nào? | thô: S06 trường cấu trúc = **H1**; S03/S05 bộ đọc regex = **H2 chưa đo**; trống = — | bậc H0–H5 của phát biểu thắng, đã đo / chưa đo |
| **Độ tươi** | Còn sống không? | tuổi từ lần thấy cuối; số ngày từ lần đầu | + `offer_status` (PL19) |
| **Lượng bằng chứng** (số lượng) | Bao nhiêu lời khai đứng sau tin? | số bài gộp · số ảnh · số nguồn · số người bán | + số phát biểu độc lập |
| **Cờ** | Có gì phi lý? | giá/m² > 500 triệu · DT < 10 m² · gộp ≥ 20 bài mà thiếu phường/DT · giá trùng mẫu «số che» | + bất đồng giữa các bậc (PL23) |

Luật hiển thị (theo review §3.1 nguyên lý 4 + Hỏi-3 ngày 26/10): **không hiện «độ tự tin %»**. Thẻ điểm dùng
checklist có/không + bậc căn cứ, không gộp thành một điểm số 0–100 (một điểm tổng sẽ giấu trường nào yếu và dễ
thành «AI tự tin %» trá hình). Bảng tin chỉ hiện **độ đủ x/5 + số cờ** — đủ để xếp, không đủ để lừa.

### 1.3 «Ảnh của từng tin»

| Nguồn | Có gì | Hiện được ở đâu |
|---|---|---|
| S06 | 19.912/19.912 tin có `images` (URL nguồn) | Máy thu ngay; cloud sau TV9 (ảnh thu nhỏ lên kho ảnh) |
| S03 | 4.290/9.310 bài có `media` (URL CDN nguồn, **hết hạn**); 7 bài có `media_files` đã tải | Máy thu: file đã tải trước, URL còn sống sau; mất là mất (T1) |
| S05 | 43/100 bài có media | như S03 |
| S01 | `photo_urls` của listing | đã dùng ở Duyệt listing |

Dùng lại dải ảnh đã có (`ops/review-photos.tsx`, chuyển thể `c-attachment-3`) — một loại UI một cách làm. Ảnh là
bằng chứng (T1), nên thẻ điểm đếm «ảnh: n đã lưu / m có trong bài»; tỉ lệ thấp là cờ của **đường thu**, không phải
của tin.

### 1.4 «Thiếu gì để lên cấp? Next Action hay điều kiện cần?»

Cả hai, nhưng phải tách **hai loại thiếu** — đây là điểm then chốt cho người vận hành:

- **Thiếu của tin** (dữ liệu không có trong lời khai): bài không ghi diện tích. Việc kế: không làm được bằng máy;
  chờ bài đăng lại, hoặc người vận hành hỏi người bán. Không tính là nợ hệ thống.
- **Thiếu của hệ thống** (lời khai có, máy chưa đọc được / chưa có năng lực): bài ghi «căn 2PN Sapphire» nhưng
  chưa có bộ đọc toà, chưa có danh mục phường ngoài Hà Nội. Việc kế: **một hàng lộ trình** — cũng chính là bậc năng
  lực N0–N4 của phân khúc (FRAMING §3.4).

Điều kiện lên bậc, đọc thẳng từ FRAMING §3.4 + review §0.2 B («B1 cần T2+T3, B2 cần T4, B3 cần T6, B4 cần nguồn sự
thật, B5 cần T5»):

| Từ → tới | Điều kiện cần (tất cả) | Next Action khi thiếu (ai) |
|---|---|---|
| B0 → B1 | đủ 5 trường lõi, mỗi trường có nguồn gốc | trường có trong bài nhưng máy chưa đọc → **hàng lộ trình** (vd loại hình: NT6/PL17); không có trong bài → **thiếu của tin** |
| B1 → B2 | gắn được căn: có phường/toạ độ + khoá căn không chứa giá | P1 chưa vào resolve → PL24; thiếu phường → danh mục phường đa thị trường |
| B2 → B3 | mọi trường lõi đến từ ô đã đo đạt Wilson F3 | gắn nhãn lát (PL7, người) → đo (PL9) → tự áp (PL21) |
| B3 → B4 | khớp dòng danh mục (mã căn) hoặc người có quyền xác nhận | PL11 + PL20 (căn hộ OCP1); S08 nạp (ZC8) |
| B4 → B5 | còn hiệu lực trong cửa sổ độ tươi + có lịch sử giá | PL19 |

Hai hệ quả:
1. **Bậc trong proto phải sửa nghiêm lại**: proto gọi «đã thành tin» là B1, «gắn căn» là B2. Theo định nghĩa thật,
   S03 hôm nay **toàn bộ ở B0** (0/269 đủ 5 trường lõi); S06 đủ trường lõi và gắn căn → B2 (B3 cần số đo — chưa có).
2. **Bảng chặn bậc** cho cả kho: mỗi hàng = (bậc hiện tại × điều kiện chặn) với số tin, loại thiếu (tin/hệ thống) và
   hàng lộ trình. Ví dụ S03 hôm nay: chặn B1 vì *loại hình* 269 (hệ thống · NT6), *phường* 267 (hệ thống · danh mục
   phường), *diện tích* 150 (phần lớn là thiếu của tin), *giá* 11. Bảng này nối dữ liệu thẳng vào lộ trình: hàng
   nào gỡ nhiều tin nhất lên bậc thì đáng làm trước — đó là thước ưu tiên có số mà hiện nay chưa có.

### 1.5 «Trang Thu thập và Dòng chảy dữ liệu overlap»

Chồng nhau ở ba chỗ:

| Khối | Thu thập (`/ops/collections`) | Dòng chảy (`/ops/data-flow`) |
|---|---|---|
| Luồng theo ngày | «Luồng 7 ngày» (S03 bài thô + tin rao) và biểu đồ `SyncActivity` | «Chặng theo ngày» (bài → đọc được → tin → căn) |
| Theo nhóm S03 | bảng nhóm: hoạt động, im, «Vào bảng thô» | lưới chất lượng «Theo nhóm thu»: đọc được %, bài/tin |
| Đếm bài S03 | `S03_POSTS_SQL` (lẫn 100 bài S05 + bài thử) | `POSTS_CTE` (gạt bài thử, tách S05) — **hai định nghĩa cho cùng một số** |

Gốc của chồng chéo: hai trang chưa có ranh giới. Ranh giới tự nhiên đã có sẵn trong kiến trúc: **hợp đồng dữ liệu**
(`collector/docs/DATA-CONTRACT.md`, bảng `stg_*`) — cũng là ranh giới làn ZCode ↔ Claude (AGENTS.md).

### 1.6 «Kiến trúc thông tin tổng thể»

`portals.md` đã có luật đúng («mỗi trang một câu hỏi», quan sát ≠ quản trị, một khối một nhà, liên kết chéo) nhưng
bảng route còn theo workstream cũ và có trang chân trời trùng việc (`/ops/pipeline` UH4 = «transform chạy chưa, DQ
gates» — đúng phần Dòng chảy đang làm). Thiếu một trục sắp xếp; đề xuất dùng **chính hành trình dữ liệu** làm trục.

## 2. Hoàn thiện: ba ý Mạnh chưa nói nhưng cần

1. **Ai dùng trang lúc nào.** Người vận hành mở Dòng chảy mỗi sáng sau lượt nạp 00:00 (câu hỏi: «đêm qua vào bao
   nhiêu, kẹt ở đâu, có gì mới bị vi phạm?»); người làm sản phẩm mở bảng chặn bậc khi xếp lộ trình. Hai nhịp → trang
   cần mốc «lượt nạp gần nhất» và so với lượt trước (mũi tên tăng/giảm trên lăng kính và bảng chặn bậc).
2. **Một định nghĩa cho mỗi số.** «Bài nhận», «đọc được», «tin rao mới», «gắn căn», «bậc» phải có MỘT hàm (SQL ở
   `pipeline/sql` theo luật 10) dùng chung cho Thu thập, Dòng chảy, bản tin cloud và audit. Lỗi «bài thô lẫn S05»
   sinh ra chính vì hai trang tự đếm.
3. **Cloud.** Đội làm từ xa (Mạnh chốt 25/10). Số tổng hợp của Dòng chảy (lăng kính, chặn bậc, chặng) đi qua bản tin
   máy thu như khối `luong7` (ADR-0014); nội dung tin, ảnh chỉ khi TV9 xong. Trang phải chạy trên cloud ở mức số tổng
   hợp, không chỉ «Chỉ xem ở máy thu».

## 3. Đề xuất

### 3.1 IA cổng Ops theo hành trình dữ liệu

```
 GIÁM SÁT (đọc)                                                         XỬ LÝ (người phán)      QUẢN TRỊ (ghi cấu hình, admin)
 ┌───────────┐  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐   ┌───────────────┐       ┌─────────────────────┐
 │ Tổng quan │→ │  Thu thập    │→ │ Dòng chảy     │→ │ Chất lượng   │   │ Hàng duyệt    │       │ Nguồn · Đơn vị thu  │
 │ /ops      │  │ /collections │  │ /data-flow    │  │ /quality     │   │ /review       │       │ Quy định ngữ cảnh   │
 │ khoẻ      │  │ máy có thu   │  │ đã thu đi tới │  │ số đưa ra    │   │ Gắn nhãn (PL7)│       │ Mục tiêu phủ        │
 │ không?    │  │ đủ, đúng nhịp│  │ đâu, rơi đâu, │  │ đủ tin để    │   └───────────────┘       └─────────────────────┘
 └───────────┘  │ không?       │  │ thiếu gì để   │  │ dùng chưa?   │            ▲
                │ nguồn→stg_*  │  │ lên bậc?      │  │ thước, phủ,  │            │ thẻ / nhãn
                └──────────────┘  │ stg_*→tin→căn │  │ độ đúng nhãn │   ┌───────────────┐
                       ▲          └───────┬───────┘  └──────────────┘   │ HỒ SƠ (chi tiết)│
                       │ hợp đồng dữ liệu │ bấm một tin / một nút thắt   │ Tin /offers/[id]│
                       └── (ranh giới) ───┴─────────────────────────────►│ Danh sách tin   │
                                                                         │ /offers (TV10)  │
                                                                         └───────────────┘
```

| Trang | Câu hỏi duy nhất | Giữ | Dời đi | Nhận về |
|---|---|---|---|---|
| Tổng quan `/ops` | Hệ thống có khoẻ không? | ô KPI, độ tươi | — | một ô «bậc kho» (phân bố B0–B5) + một ô «nguyên tắc vi phạm» trỏ sang Dòng chảy |
| Thu thập `/ops/collections` | Máy có thu đủ và đúng nhịp không? (nguồn → `stg_*`) | thẻ số nguồn, khoá an toàn, ống S03, xoay vòng, nhóm S03 (hoạt động/im), tác vụ launchd | cột «tin rao (đã đọc)» của Luồng 7 ngày → Dòng chảy | số cuối trang = «Bài nhận» (định nghĩa chung) + link «Xem dòng chảy» |
| **Dòng chảy** `/ops/data-flow` | Thứ đã thu đi tới đâu, rơi ở đâu, thiếu gì để lên bậc? (`stg_*` → tin → căn) | Sankey, nút thắt, chặng theo ngày, loại giao dịch | bảng tin đầy đủ → `/ops/offers` (giữ ở đây một bảng «tin mẫu của nút thắt», 10 dòng, link lọc sẵn) | **lăng kính nguyên tắc**, **bảng chặn bậc**, phân bố bậc; thay chân trời `/ops/pipeline` (UH4) |
| Chất lượng `/ops/quality` | Số đưa ra có đủ tin để dùng chưa? | DQ, hiệu chuẩn S02, độ phủ trung thực, C4 độ đủ theo use case, PL9 độ đúng trên nhãn | — | — (Dòng chảy đo **quá trình**, Chất lượng đo **đầu ra**) |
| **Tin** `/ops/offers` + `/ops/offers/[id]` (mới, = TV10) | Tin này là gì, đáng tin tới đâu, thiếu gì? | — | — | danh sách tin (bộ lọc của proto), hồ sơ tin + **thẻ điểm tin** + ảnh; sheet ở Dòng chảy/Hàng duyệt/Căn giá tốt chỉ là xem nhanh, có nút «Mở hồ sơ» |
| Hàng duyệt, Gắn nhãn | Người phán gì hôm nay? | như cũ | — | link từ bảng chặn bậc («B2 → B3 cần gắn nhãn: mở Gắn nhãn») |
| Căn giá tốt `/ops/deals` | Tín hiệu sản phẩm P1 | như cũ | — | link hồ sơ tin |

Luật mới thêm vào `portals.md` (một dòng): **ranh giới trang Giám sát theo ranh giới dữ liệu** — Thu thập dừng ở
`stg_*`, Dòng chảy bắt đầu ở `stg_*`, Chất lượng đo đầu ra canonical; một số xuất hiện ở hai trang thì cả hai đọc
cùng một hàm và một trang chỉ hiện số bàn giao + link.

### 3.2 Trang Dòng chảy v2 — từ trên xuống

1. Đầu trang: khoảng · **mốc lượt nạp gần nhất** · stats (bài, thẻ chờ, đề xuất làm giàu).
2. **Đường ống** (Sankey, giữ) — nhánh rơi có lý do; bậc cuối đổi thành phân bố bậc nghiêm.
3. **Lăng kính nguyên tắc** (mới) — tám dòng T1–T8: bất biến · phép kiểm · Đạt / Vi phạm / Chưa đo được · hàng lộ
   trình · so lượt trước. Khung: Frame + lưới (cùng họ với lưới chất lượng).
4. **Bảng chặn bậc** (mới) — (nguồn × bậc hiện tại × điều kiện chặn): số tin · thiếu của tin / thiếu của hệ thống ·
   Next Action (hàng lộ trình hoặc màn người) · «gỡ được bao nhiêu tin lên bậc». Sắp mặc định theo số tin gỡ được.
5. **Chất lượng từng chặng** (giữ, đổi «Nút thắt» sang đọc từ bảng chặn bậc để một luật một chỗ).
6. Chặng theo ngày + Loại giao dịch (giữ).
7. **Tin mẫu của nút thắt** — 10 tin, chọn theo hàng đang bấm ở bảng chặn bậc; «Xem tất cả» → `/ops/offers?…`.

### 3.3 Thẻ điểm tin (trong hồ sơ tin, và bản gọn trong bảng)

```
┌ Bán · 6.750 tỷ · 100 m² ──────────────────────── B0 · Có lời khai ┐
│ Lên B1 cần: loại hình ✗ (hệ thống · NT6) · phường ✗ (hệ thống ·    │
│ danh mục phường HCM) · giá ✓ · diện tích ✓ · loại tin ✓            │
├──────────────┬──────────────┬─────────────┬────────────┬──────────┤
│ Độ đủ  3/5   │ Độ chắc      │ Độ tươi     │ Bằng chứng │ Cờ  1    │
│              │ giá H2 chưa đo│ thấy cuối  │ 14 bài     │ giá/m²   │
│              │ DT  H2 chưa đo│ 25/10 23:26│ n ảnh (m lưu)│ 67,5 tỷ│
├──────────────┴──────────────┴─────────────┴────────────┴──────────┤
│ [dải ảnh]  · Bài gốc (toàn văn, tô đoạn khớp khi PL17 xong)        │
└────────────────────────────────────────────────────────────────────┘
```

Khối ReUI: Frame + Badge `-light` cho bậc/cờ, `Item`/checklist cho điều kiện, dải ảnh `c-attachment-3` đã chuyển thể.
Không thêm màu mới ngoài thang `flow*` của proto.

### 3.4 Thứ tự làm (đề xuất cắt lượt — chưa ghi vào `lo-trinh.json`)

| Mã tạm | Giao gì | Tầng | Dựa trên | Ghi chú |
|---|---|---|---|---|
| DF0 | Commit proto + sửa bậc nghiêm (B theo 5 trường lõi) + sửa `S03_POSTS_SQL` lọc theo `agent_id` | T2 | — | **xong 26/10** (`lib/data-level.ts`; «Bài thô» S03 ngày 21/10: 182 → 82, ngày 20/10 và 22/10 bớt mỗi ngày 1 bài nhóm TEST) |
| DF1 | Một định nghĩa số chặng + bậc ở `pipeline/sql` (luật 10), Thu thập và Dòng chảy cùng đọc; khối bản tin cho cloud | T2 | DF0 | xoá chồng chéo số |
| DF2 | Thẻ điểm tin + điều kiện lên bậc (luật thuần trong `lib/`, có test) + ảnh tin ở máy thu | T2 | DF0 | ảnh cloud chờ TV9 |
| DF3 | Bảng chặn bậc + tin mẫu của nút thắt | T2 | DF2 | thước ưu tiên lộ trình |
| DF4 | Lăng kính nguyên tắc T1–T8 | T2 | DF1 | ba dòng «chưa đo được» tới PL7/9/15 |
| DF5 | Dọn IA: bỏ cột tin rao khỏi Thu thập, link hai chiều, `portals.md` thêm luật ranh giới, gạch UH4 | T1 | DF1 | |
| (TV10) | `/ops/offers` + `/ops/offers/[id]` — gộp bảng tin và hồ sơ từ DF2 | T2 | TV9, DF2 | đã có trong lộ trình; mở rộng phạm vi |

DF0 → DF2 → DF3 là lát cho giá trị nhanh nhất (người vận hành thấy ngay tin nào kẹt vì sao). DF1 và DF4 chạy song
song được sau DF0.

## 4. Không làm / phản mục tiêu

- Không gộp thẻ điểm thành một điểm số 0–100; không hiện «độ tự tin %» (Hỏi-3 26/10).
- Không cho kéo thả hay sửa bậc trên trang — bậc do máy tính từ bằng chứng.
- Không để Dòng chảy ghi cấu hình (quan sát ≠ quản trị).
- Không dựng `/ops/pipeline` riêng.
- Không đưa tên nguồn thật hay ảnh lên cloud trước TV9.

## 5. Quyết định (Mạnh duyệt 26/10, nguyên văn: «Duyệt cả 5 khuyến nghị ở §5.»)

1. **Bậc nghiêm**: B1 chỉ khi đủ 5 trường lõi (đúng FRAMING) — S03 hôm nay hiện toàn B0. *Khuyến nghị: đồng ý.*
2. **Ranh giới trang = ranh giới hợp đồng dữ liệu**; cột «tin rao (đã đọc)» rời trang Thu thập. *Khuyến nghị: đồng ý.*
3. **Hồ sơ tin là trang riêng** `/ops/offers/[id]` (slug mới `offers`), sheet chỉ xem nhanh; TV10 mở rộng nhận phần
   này. *Khuyến nghị: đồng ý.*
4. **Ngưỡng tạm** cho cờ (giá/m² > 500 triệu, DT < 10 m², gộp ≥ 20 bài) và nút thắt (30/60%, 50/80%) — dùng tạm tới
   khi PL9 có số đo. *Khuyến nghị: đồng ý tạm.*
5. **Gạch `/ops/pipeline` (UH4)**, giao phần đó cho Dòng chảy. *Khuyến nghị: đồng ý.*

---

# Phụ lục — vòng `ops-dong-chay-df0` (proto + DF0)

Vòng nghiệm thu cho hai commit đã dựng ở nhánh `feat/ops-data-flow` (`c9794e3d` proto, `8a54fcdc` DF0). Phạm vi chốt
bởi §5 ở trên; DF1–DF5 cắt vào lộ trình ở một PR riêng.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: thanh bên Ops nhóm Giám sát «Dòng chảy dữ liệu» → `/ops/data-flow` (mặc định 7 ngày) → đọc đường ống và
  lưới nút thắt → chọn một nguồn trên đường ống hoặc lọc bảng tin → bấm một tin → sheet hồ sơ tin (điểm ra: đóng sheet,
  hoặc nút khoảng «30 ngày» · «Toàn kho» đổi `?window=`).
- Biên: khoảng không có bài nào → đường ống hiện Empty «Chưa có bài trong khoảng này» + «Xem tất cả nguồn»; bộ lọc ra
  0 tin → «Không có tin nào khớp bộ lọc»; tin S06 không có bài gốc → câu «S06 chưa lưu khoá nối ngược tin → bài (TV10)».
- Lỗi & quay lại: truy vấn lỗi → RegionError «Không tải được dòng chảy dữ liệu» + «Thử lại», vỏ Ops vẫn đứng; máy chủ
  (bảng nạp thô vắng) → LocalOnlyAlert «Chỉ xem ở máy thu».

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Dòng chảy dữ liệu `/ops/data-flow` | Cho thấy bài đã thu đi tới đâu, rơi ở chặng nào, nguồn nào kẹt | thanh bên Ops / sheet hồ sơ tin |
| Sheet hồ sơ tin | Cho biết tin đang ở bậc nào, thiếu trường lõi nào để lên bậc kế, bài gốc nói gì | hàng bảng «Tin mới nhất» / về trang |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-dongchay-loading | Dòng chảy | DataFlowSkeleton theo bố cục: đầu trang, khung đường ống, hai biểu đồ, hai lưới | chờ |
| ST-dongchay-ready | Dòng chảy | Đầu trang (số bài · thẻ chờ duyệt · đề xuất làm giàu) → Đường ống → Chất lượng từng chặng → Chặng theo ngày + Loại giao dịch → Tin mới nhất | đọc, chọn nguồn, lọc, bấm tin |
| ST-dongchay-empty | Dòng chảy | Đường ống: Empty «Chưa có bài trong khoảng này» + «Xem tất cả nguồn»; lưới: «Chưa có nguồn nào có bài trong khoảng này» | đổi khoảng / nguồn |
| ST-dongchay-error | Dòng chảy | RegionError «Không tải được dòng chảy dữ liệu» + «Thử lại» | thử lại |
| ST-dongchay-cloud | Dòng chảy | LocalOnlyAlert «Chỉ xem ở máy thu» | mở cổng Ops trên máy thu |
| ST-hoso-b0 | Sheet hồ sơ tin | Badge «B0 · Có lời khai», «Trường lõi x/5» với badge ✓/– từng trường, câu «Lên B1 cần đủ năm trường lõi — còn thiếu …» | đọc bài gốc, đóng |
| ST-hoso-b2 | Sheet hồ sơ tin | Badge «B2 · Gắn căn», «Trường lõi 5/5», câu «Lên B3 cần số đo trên nhãn …» | đóng |
| ST-hoso-anh | Sheet hồ sơ tin | (admin) Dải ảnh của tin — ảnh đã tải trước, rồi đường dẫn gốc, tối đa 12; ảnh hết hạn «Ảnh hỏng»; bấm mở hộp phóng to | xem ảnh, đóng |
| ST-hoso-khong-anh | Sheet hồ sơ tin | (admin) «Ảnh tin: không có ảnh» khi các bài của tin không mang ảnh | đóng |
| ST-hoso-s06-anh | Sheet hồ sơ tin | «Chưa gắn được ảnh: S06 chưa lưu khoá nối ngược tin → quảng cáo (TV10).» | đóng |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Khoảng thời gian là trạng thái URL (`?window=7d|30d|all`, mặc định 7d); chọn nguồn trên đường ống và bộ lọc bảng
  là trạng thái trình duyệt, không ghi URL.
- 390 px: trang không cuộn ngang; đường ống cuộn ngang trong khung như block gốc; lưới ẩn bớt cột theo breakpoint.
- Chuyển động: chỉ phần của chart-49 (quét vào, hạt chảy) — tắt khi giảm chuyển động; nút tạm dừng/phát lại.

### 5. Xuất xứ component

| Component | Nấc | Vì sao (1 dòng) |
|---|---|---|
| `@reui/chart-49` → `flow-sankey`, `flow-journey` | mở rộng | Thêm nhánh «gộp trùng» màu trung tính, bỏ nút 0, chú thích «Gắn căn» đỏ khi dưới 80% |
| `@reui/solution-analytics-3` → `stage-trend-chart`, `kind-mix-chart`, `quality-grid`, `records-grid` | ghép | Chặng không chồng (bỏ stackId), Risk → «Nút thắt», bánh ba loại giao dịch |
| `@reui/filters`, `Sheet` (khuôn solution-agents-5) | dùng | Một loại UI một cách làm — cùng thanh chip Duyệt listing, cùng sheet Hàng duyệt |
| `ReviewPhotos` (chuyển thể `c-attachment-3`) + `buildOfferImages` của Hàng duyệt | dùng | Một loại UI một cách làm — cùng dải ảnh, cùng luật ghép ảnh và luật chỉ admin (Mạnh sửa ở Cổng Phạm vi 26/10) |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: `.claude/skills/onehub-ui/routes.md` — các trang Giám sát của Ops (`/ops`, `/ops/collections`) đều Dashboard
grid trong họ Frame; `compose_page` của ReUI cho cùng ý định trả khuôn dashboard (stats → chart → data-grid).
<!-- UX-SPEC-TEMPLATE>>> -->
