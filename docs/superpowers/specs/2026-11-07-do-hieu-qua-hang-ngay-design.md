# DO1 `do-hieu-qua-hang-ngay` — đo hiệu quả hằng ngày (thiết kế)

Hàng DO1 của `docs/plan/lo-trinh.json` (đợt `mo-hinh-pipeline-0711`, T2 theo lộ trình, máy nâng T3 vì cần migration).
Căn cứ: `docs/architecture/mo-hinh-pipeline-mot-can-nha.md` bản 4 §3.2, §3.4, §5 (Mạnh duyệt Q2 ngày 07/11), ROADMAP §3
mục 32–33, bảng mục tiêu số liệu Mạnh duyệt 07/11 (D3, D4, F4, NS3). Cổng Đáng gom về giám sát; không có hồ sơ cơ hội.

## Bài toán

Mỗi thay đổi model, prompt hay luật đọc tin S03 hiện chỉ phán bằng cảm nhận: không có số đo đều. DO1 dựng bốn số, tính
sẵn ở pipeline (luật 10), xem trên `/ops/quality`:

1. **Tỉ lệ giữ nháp theo (cách đọc × ô)** — từ mẫu soát cuốn chiếu 20 bài/ngày.
2. **Ước tỉ lệ tin rao bị bỏ sót** — cùng mẫu soát.
3. **Tín hiệu không cần nhãn** — JSON hỏng, câu trích không có trong bài, độ phủ từng ô, bất đồng giữa cách đọc, tỉ lệ ô
   người sửa trên thẻ.
4. **Dòng chuyển bậc** — bao nhiêu căn và tin lẻ lên, tụt, mới, mất bậc mỗi ngày, vì sao.

Mọi số có phân rã theo phường/xã, dự án, toà, mỗi chiều có ô «chưa gắn».

## Phương án đã chọn

### Cách đọc (khoá đo)

Khoá `cach_doc` là chuỗi ổn định, đổi model hay prompt là đổi khoá — nhờ vậy một thay đổi hiện thành hai dòng cạnh nhau:

- `bo-doc-luat` — giá trị trên tin của pipeline (`sale_offer_records.post_ids` → `sale_offers`), tức bộ đọc luật
  `transform-zalo.mjs` sau phân xử.
- `doc-gop:<model>:<prompt_version>` — `silver_labels.probabilities.o` của PL30 (vd `doc-gop:gateway:anthropic/claude-haiku-5.5:dg3-s03-v3`).
- `doc-chu:<model>:<prompt_version>` — `silver_labels` của đọc chữ (doc-toan-bo), chỉ hai ô ý định tin và bán/thuê.

### Mẫu soát cuốn chiếu

- Lệnh `pipeline/mau-soat-cuon-chieu.mjs --ngay <YYYY-MM-DD>` rút 20 bài S03 nhận trong ngày đó (giờ VN), gạt bài thử bằng
  đúng bộ lọc của transform, khử trùng nội dung, chọn tất định theo hạt giống = ngày, **gồm cả bài máy không nhận là tin
  rao**. Ghi vào `eval_label_items` lát `s03-cuon-chieu` (`stratum` = ngày). Chạy lại cùng ngày: 0 dòng thêm.
- Bài trong mẫu chưa có kết quả đọc gộp → lệnh gọi `doc-gop-s03 chay` cho đúng các bài đó, MỘT lần, TRƯỚC bước chụp nháp,
  với trần tiền ngày (Hỏi-1, mặc định 0,05 USD; chi tính từ `ai_calls` của việc `doc-gop-s03` trong ngày). Chạm trần → dừng gọi,
  thẻ vẫn ghi với nháp đọc gộp `vang`. Chạy lại cùng ngày: 0 lời gọi.
- Lúc rút, lệnh **chụp nháp** của từng cách đọc vào cột mới `eval_label_items.draft` (jsonb): `{ hien: <cach_doc>,
  cach_doc: { <cach_doc>: { trang_thai: "co" | "khong-tin" | "vang", o: { <ô>: <giá trị chuẩn hoá> | null } } }, chup_luc }`.
  Ba trạng thái tách «cách đọc chưa chạy hay lỗi» (`vang`), «đã chạy mà không nhận là tin rao» (`khong-tin`: bộ đọc luật không
  có tin, đọc gộp ra ý định khác `offer`) và «có kết quả» (`co`, ô không nêu là `null`). Giá trị chuẩn hoá bằng đúng hàm chuẩn
  hoá của màn gắn nhãn để so được với `eval_labels`. `hien` = khoá đọc gộp khi có trạng thái `co`, ngược lại `bo-doc-luat`.
  Chụp lúc rút để tỉ lệ giữ nháp và bỏ sót so đúng nháp người đã thấy, không đọc lại `sale_offers` sau đó.
- Màn `/ops/labels` lát `s03-cuon-chieu` dùng biểu mẫu 17+ ô của lát nhóm, **điền sẵn** ô theo nháp của cách đọc `hien`
  (Hỏi-2) kèm huy hiệu «Nháp máy». Ô bảng chọn model giao người (`o.bathrooms: nguoi`) để trống. Người giữ hoặc sửa rồi lưu
  như hiện nay.

### Chỉ số trên mẫu

- **Giữ nháp** = ô người lưu trùng nháp của cách đọc đó (cùng «không nêu», hoặc cùng giá trị sau chuẩn hoá của
  `labels-normalize`). Tính cho MỌI cách đọc có nháp, không chỉ cách đọc hiện — cách đọc không hiện là đối chứng ít neo hơn.
  Theo tuần ISO (giờ VN): tuần này, tuần trước, chênh; kèm n và cận dưới Wilson 95%.
- **Giữ nháp** chỉ tính trên nháp `co`; nháp `khong-tin` không tính giữ cho ô nào (tránh «toàn null» thành giữ giả).
- **Bỏ sót** = trên thẻ người gắn ý định «Tin rao», tỉ lệ nháp `khong-tin` của cách đọc đó trên số thẻ có nháp `co` hoặc
  `khong-tin`; nháp `vang` đếm riêng (`thieu_nhap`). Theo tuần, kèm n và khoảng Wilson.
- **Tỉ lệ ô người sửa** = 1 − giữ nháp của cách đọc `hien` (đây là ô người thật sự thấy và sửa).

### Tín hiệu không cần nhãn (theo ngày, mỗi cách đọc LLM)

Trên mọi dòng `silver_labels` ghi trong ngày (giờ VN):

- JSON hỏng = `json_ok = false` / tổng lời gọi. Một lượt mà mọi lời gọi hỏng vẫn là số (Ngoài-3 của PL30: lệnh thoát 0).
- Câu trích không có trong bài = ô có trích mà `trich_ok = false` / ô có trích.
- Độ phủ từng ô = ô có giá trị / ô được giao; **ô trả sai khuôn đếm riêng** (Ngoài-10 của PL30: sai khuôn bị coi là «không
  suy ra»).
- Bất đồng giữa cách đọc = trên cùng bài, cặp cách đọc cùng có giá trị mà khác nhau / cặp cùng có giá trị, theo ô.
- Ngày không có dòng nào của một cách đọc → `status = 'skip'`, không ghi 0.

### Luồng một ngày (hình cho Hỏi-1, Hỏi-2)

```mermaid
flowchart LR
  A[Chạy đêm xong bac-du-lieu] --> B[mau-soat-cuon-chieu --ngay D: rút 20 bài]
  B --> C{Bài đã có đọc gộp?}
  C -- chưa --> D[Gọi đọc gộp Haiku một lần, trần 0,05 USD/ngày]
  D -- chạm trần --> E[Nháp đọc gộp = vang]
  D --> F[Chụp nháp mọi cách đọc vào draft]
  C -- có --> F
  E --> F
  F --> G{hien}
  G -- có đọc gộp --> H[Màn /ops/labels điền sẵn nháp đọc gộp]
  G -- không --> I[Màn điền sẵn nháp bộ đọc luật]
  H --> J[Mạnh giữ hoặc sửa, Lưu]
  I --> J
  J --> K[do-hang-ngay --write: giữ nháp, bỏ sót, tín hiệu, chuyển bậc vào dq_check_results]
  K --> L[/ops/quality khối Đo hằng ngày, máy thu và cloud]
```

### Dòng chuyển bậc

- Migration (số xin giám sát, dự kiến 083) thêm `data_level_unit` (bậc hiện hành từng đơn vị: `can:<property_id>`,
  `tin:<offer_id>`) và `data_level_change` (một dòng mỗi đơn vị đổi bậc mỗi ngày). Cả hai chỉ ở máy thu.
- Lệnh `pipeline/do-hang-ngay.mjs --write` chạy sau `bac-du-lieu.mjs --write` trong chạy đêm: tính bậc hiện tại bằng đúng hai
  hàm SQL của 056 (`property_data_level`, `offer_data_level`), so với `data_level_unit`, ghi `data_level_change` và cập nhật
  `data_level_unit` trong một giao dịch có khoá advisory.
- Hướng: `len`, `tut`, `moi` (đơn vị mới), `mat` (đơn vị biến mất: tin nghỉ, tin gắn vào căn). Lý do là MẢNG, một dòng mỗi
  đơn vị: mọi trường lõi đổi đủ ↔ thiếu (`thieu-gia`, `du-dien-tich`, …; theo thứ tự năm trường lõi của 056), `gan-can` (tin lẻ
  thành căn), `tin-nghi`, `do-luong` (B2↔B3 theo cờ đã đo). Bảng đếm theo hướng × từng lý do (một dòng hai lý do cộng vào cả
  hai ô) kèm số dòng.
- Lần chạy đầu chỉ lập mốc: `data_level_change` không có dòng, dq ghi `status = 'skip'` kèm «lập mốc».

### Lát phường/xã, dự án, toà

- Phường/xã: `areas` có `region_type = 'ward'` của đơn vị; không có → `chua-gan`.
- Dự án, toà: theo danh bạ vật thể đã có (`asset_nodes` khu đô thị, `buildings` của 082) qua liên kết đơn vị ↔ vật thể khi
  có; hiện 0 liên kết nên gần như mọi đơn vị nằm ở `chua-gan` — ô này hiện rõ, không ẩn.
- Mỗi chiều: tối đa 30 ô lớn nhất + `khac` + `chua-gan`; tổng các ô bằng tổng chung (bất biến có test).

### Lên Ops

Bốn nhóm số ghi vào `dq_check_results` có sẵn (`check_name` = `do1-giu-nhap`, `do1-bo-sot`, `do1-tin-hieu`,
`do1-chuyen-bac`; `entity` = mã nguồn hoặc `tat-ca`; `detail` = JSON chỉ số đếm, tỉ lệ, mã S0x, khoá cách đọc, mã khu vực
và khoá vật thể). Bảng này đã nằm trong FILL của `sync-cloud.mjs` nên lên cloud không cần sửa `sync-cloud.mjs` hay
`push-ops-facts.mjs`. `detail` không chứa chữ bài, câu trích, tên người đăng, `labeler_id` hay tên nguồn thật — có test chặn.

`/ops/quality` thêm khối «Đo hằng ngày» đọc các dòng `do1-*` mới nhất; bảng «Kiểm chất lượng» chung bỏ các dòng `do1-*` để
không lặp JSON thô.

## Bổ sung sau rà soát (Mạnh 07/11 «Đồng ý tất cả theo khuyến nghị»)

### Nguyên tắc đo (ghi vào FRAMING §5 — một chỗ)

1. **Đơn vị và mẫu số** đi cạnh mọi số: giữ nháp đo trên ô của thẻ có nháp `co`; bỏ sót đo trên thẻ người gắn «Tin rao»;
   tín hiệu đo trên lời gọi/ô của ngày; chuyển bậc đo trên đơn vị (căn, tin lẻ).
2. **«Giữ» với ô số có dung sai**: giá ±1%, diện tích ±1 m² (Mạnh duyệt theo khuyến nghị); ô chữ so sau chuẩn hoá.
3. **Nhóm ô theo F3**: A — `listing_intent`, `kind`, `property_type`, `multi_unit`, `project`, `subzone`, `building`, `stack`,
   `unit_number`; B — `price_min_vnd`, `price_max_vnd`, `area_m2`, `bedrooms`, `bedrooms_plus`, `bathrooms`, `floor`; C — còn
   lại. Đích D4 đọc trên nhóm A.
4. **Phiên bản thước**: mỗi dòng mang `phien_ban_thuoc` (băm danh sách ô + quy tắc chuẩn hoá + dung sai); đổi thước không lẫn
   với đổi model.
5. **Cơ cấu mẫu**: so tuần kèm cơ cấu bán/thuê × loại nhà của hai tuần; lệch cơ cấu không phải máy trôi.
6. **Chênh có ý nghĩa**: chỉ khi hai khoảng Wilson 95% không chồng nhau; in kèm ngưỡng phát hiện được (độ rộng nửa khoảng × 2)
   để biết chênh nhỏ hơn mức nào thì không thấy được.
7. **Tỉ lệ soát**: thẻ đã soát / thẻ đã rút theo tuần; dưới 70% thì cảnh báo — số có thể đẹp giả vì bỏ thẻ khó.
8. **So trước/sau trên cùng bài**: đổi model hay prompt thì chạy khoá mới trên thẻ mẫu soát 4 tuần gần nhất đã có nhãn rồi so
   cặp (`pipeline/so-sanh-cach-doc.mjs`, trần 0,30 USD/lần); so hai tuần khác bài chỉ để thấy trôi.

### Chuyển bậc: đổi khoá và nguồn

Khoá «căn» S06 còn chứa giá (`resolve-properties.mjs`), nên tin đổi giá rời căn P sang căn Q. Lệnh đo nhận ra tin đi từ căn
này sang căn khác (qua `property_offers` hai lần chạy) và gắn lý do `doi-khoa` cho cặp «mất P + mới Q», tách khỏi biến động
thật. Mọi số chuyển bậc phân rã theo nguồn (S03, S05, S06) vì S06 áp đảo.

### Địa lý

- Thêm chiều **thị trường** (cấp đầu — 94% tin S03 chỉ tới đây). Mã thị trường theo bảng `areas` hiện hành.
- **Hai ô chưa gắn**: `khong-tin-hieu` (bài/đơn vị không nêu chỗ ở mức đó) và `chua-co-danh-ba` (có chữ toà/dự án —
  `block_raw`, ô `project`/`building` của nháp — mà danh bạ chưa có vật thể khớp). Ô đầu là việc của bộ đọc, ô sau là việc
  của danh bạ.
- **Dự án theo chữ bài** cho số trên mẫu soát: tên dự án lấy từ nhãn người (ưu tiên) hoặc nháp đọc gộp, nhãn «theo chữ bài,
  chưa qua danh bạ» — có số cho Ocean Park, Grand Park ngay, không chờ PL20.
- **Để sau** (giám sát ghi vào lộ trình): lấy mẫu phân tầng theo khu trọng tâm có trọng số, quyết sau 2 tuần số thật.

## Không làm (ranh giới)

- Chi phí lên bậc (PL31), độ tươi p50/p95 (PL22), lý do rơi từng chặng (DF3), tập test mù đóng băng và cổng tự áp (PL21, Q3
  hoãn), đo gắn căn (DO2), đo làm giàu (DO3), GNH2.
- Bật đọc gộp chạy toàn S03 hằng ngày (lời riêng của Mạnh, Hỏi-1 của PL30).
- Dùng tỉ lệ giữ nháp để mở cổng hay chấm độ đúng: số có neo, chỉ so tuần với tuần và so cách đọc với nhau.

## Rủi ro đã biết

- 20 bài/ngày cho khoảng Wilson rộng ở từng ô theo phường; lát phường của S03 gần như toàn `chua-gan` (1,1% có phường).
- Neo theo nháp làm tỉ lệ giữ của cách đọc `hien` cao hơn thật; so với cách đọc không hiện để thấy độ neo.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: `/ops/labels` → chọn lát «Mẫu soát cuốn chiếu» → thẻ hiện bài + ô điền sẵn nháp máy → người giữ hoặc sửa từng ô →
  Lưu → thẻ kế (điểm ra: hết 20 thẻ của ngày).
- Suôn sẻ (xem số): `/ops/quality` → khối «Đo hằng ngày» → chọn lát (Tổng · Phường/xã · Dự án · Toà) → đọc bảng.
- Biên: ngày chưa rút mẫu; bài không có nháp đọc gộp (chỉ có bộ đọc luật); lần chạy đầu của chuyển bậc (chỉ lập mốc).
- Lỗi & quay lại: đọc `dq_check_results` lỗi → lỗi tại chỗ + «Thử lại»; lưu nhãn lỗi mạng → giữ nguyên như màn gắn nhãn hiện có.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| `/ops/labels` lát `s03-cuon-chieu` | Giữ hoặc sửa nháp máy của một bài | Thanh Ops / thẻ kế |
| `/ops/quality` khối «Đo hằng ngày» | Thấy số đo tuần này so tuần trước, theo lát | Thanh Ops / không ra |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-quality-do1-loading | `/ops/quality` | `Skeleton` cho bốn bảng | chờ |
| ST-quality-do1-empty | `/ops/quality` | «Chưa có số đo hằng ngày — bước đo chạy sau chạy đêm» + lệnh chạy tay | chạy `node pipeline/do-hang-ngay.mjs --write` |
| ST-quality-do1-moc | `/ops/quality` | Chuyển bậc: «Lần đầu — đã lập mốc, số chuyển có từ ngày mai» | chờ ngày sau |
| ST-quality-do1-skip | `/ops/quality` | Dòng cách đọc: «Không có lượt đọc ngày <d>» thay số 0 | không cần |
| ST-quality-do1-error | `/ops/quality` | Alert lỗi tại chỗ + nút «Thử lại» | bấm Thử lại |
| ST-labels-cc-nhap | `/ops/labels` | Ô điền sẵn + huy hiệu «Nháp máy · <cách đọc>» | giữ hoặc sửa, Lưu |
| ST-labels-cc-empty | `/ops/labels` | «Chưa rút mẫu soát hôm nay» + lệnh rút | chạy `mau-soat-cuon-chieu.mjs` |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Chọn lát bằng tham số URL `?lat-do=` để giữ khi tải lại; mặc định «Tổng».
- Số tỉ lệ hiện kèm `n`; ô có `n < 5` hiện «ít mẫu» thay phần trăm.

### 5. Xuất xứ component

| Component | Nấc | Vì sao |
|---|---|---|
| `Frame`/`Card` của trang `/ops/quality` | dùng | khối mới theo archetype của trang |
| `data-grid` (ReUI) | dùng | bảng số |
| `Badge` (reui) | dùng | «Nháp máy», «ít mẫu», trạng thái |
| `Tabs` (ui) | dùng | chọn lát |
| `label-form-nhom` | mở rộng | nhận giá trị điền sẵn từ nháp |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: khối thêm vào trang `/ops/quality` vốn là bảng điều khiển số kiểm; màn gắn nhãn giữ khuôn danh-sách-chi-tiết hiện có.

### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | Người vận hành (Mạnh) |
| Việc chính | Soát 20 bài/ngày và xem số đo tuần này so tuần trước |
| Tần suất | mỗi ngày |
| Số bản ghi | vài chục |
| Thiết bị | máy tính |
<!-- UX-SPEC-TEMPLATE>>> -->
