# DO3 `do-lam-giau` — đo làm giàu hằng ngày (thiết kế)

Hàng DO3 của `docs/plan/lo-trinh.json` (đợt `mo-hinh-pipeline-0711`, nhóm `do-luong`, đứng trên DO1). Cổng Đáng: Mạnh quyết
**build** ngày 08/11, ngưỡng theo đề xuất trong `_acceptance/do-lam-giau/opportunity.md`. Căn cứ: FRAMING §5 (dòng «Độ
đúng — để thấy trôi»: «làm giàu bị sửa/rút»), tài liệu mô hình pipeline §2.3, §3.2, thiết kế DO1
(`docs/superpowers/specs/2026-11-07-do-hieu-qua-hang-ngay-design.md`).

## Bài toán

Làm giàu là giá trị máy thêm vào tin mà tin không tự ghi. Hôm nay chỉ có ba phép đo gần nó, và không cái nào đo độ đúng đều
đặn: C2b đo độ phủ, PL31 đo chi phí, GC2 kiểm ngược một lần lúc dựng (đo tay 04/11, `docs/plan/pham-vi-gan-can-s03-0411.md`).
Ví dụ: 901 tin S03 đang mang số qua người đăng (đếm DB máy thu 08/11), chưa ai biết bao nhiêu số đúng.

DO3 dựng hai nhóm số cho từng đường làm giàu, tính sẵn ở pipeline (luật 10), xem trên `/ops/quality`:

1. **Thay đổi theo ngày**: bao nhiêu giá trị được thêm, đổi, máy rút; bao nhiêu bị người sửa hoặc rút.
2. **Kiểm ngược theo tuần**: giấu giá trị có sẵn, cho đường làm giàu suy lại, so. Ra tỉ lệ đúng kèm cận dưới Wilson 95%.

Mọi số xem được theo thị trường, phường/xã, dự án, toà, có hai ô chưa gắn như DO1.

## Bốn đường làm giàu, hôm nay đứng ở đâu

Đo DB máy thu 08/11 và soát mã:

| Đường (`duong`) | Ghi gì, ở đâu | Hôm nay |
|---|---|---|
| `so-qua-nguoi-dang` | `sale_offer_records.seller_phone` kèm dấu `field_provenance.seller_phone.rule_id = 's03-qua-nguoi-dang'` (`pipeline/lib/gan-sdt-qua-nguoi.mjs`) | **Đang chạy** — 901 tin |
| `quy-uoc-nhom` | `field_assertions` `rule_id = 'loai-hinh-nhom'`, ô `property_type` (`transform-zalo.mjs` → `lib/assert.mjs`) | **Đang chạy** — 34.610 phát biểu, 41 đã rút |
| `dien-tich-suy-ra` | Chưa có mã (GC2, GC3 còn trên lộ trình) | Chưa chạy |
| `danh-muc-cdt` | `field_assertions` `resource_name = 'Building'`, ô `area_id`, `registry_inherit` (`pipeline/danh-ba-vat-the.mjs`) — vật thể toà, chưa xuống tin (PL20 chưa làm) | Chưa xuống tin — 18 toà |

## Phương án đã chọn

### Sổ đường làm giàu

`pipeline/lib/do-lam-giau.mjs` giữ một sổ cố định, mỗi đường một dòng:

- khoá `duong`;
- cách đọc giá trị sống (một câu SQL trả `subject_key`, `value_key`, `offer_id`);
- danh sách `rule_id` thuộc đường;
- hàm kiểm ngược (có thể vắng);
- có đường người sửa hay không.

Đường **đang chạy** khi câu đọc trả ít nhất một giá trị sống trên tin (Hỏi-1). Đường chưa chạy vẫn có dòng đo, ghi
`status = 'skip'` với lý do `chua-chay`, không ghi số 0. Khi GC2 hay PL20 bắt đầu ghi, hàng đó thêm một dòng vào sổ (rule
và câu đọc); DO3 không đoán trước khuôn ghi của chúng.

Giá trị sống từng đường:

- `so-qua-nguoi-dang`: `subject_key = tin:<offer_id>`; `value_key` là băm số (`seller_phone_hash`), không bao giờ là số.
- `quy-uoc-nhom`: dòng `field_assertions` sống có `rule_id` thuộc đường; `subject_key = <subject_key>|<field>`,
  `value_key = value_key` của phát biểu; tin nối qua khoá chủ thể của phát biểu.

### Thay đổi theo ngày — ảnh chụp và dòng đổi

Một migration mới (số xin giám sát qua liên làn) thêm hai bảng, theo đúng khuôn `data_level_unit` / `data_level_change` của
083. Cả hai chỉ ở máy thu, không vào FILL của `sync-cloud.mjs`.

- `enrichment_value_state (duong, subject_key, value_key, offer_id, seen_at)`, khoá `(duong, subject_key)`: giá trị sống lần
  chạy trước.
- `enrichment_value_change (snap_date, duong, subject_key, from_value, to_value, offer_id)`, khoá
  `(snap_date, duong, subject_key)`: một dòng mỗi chủ thể đổi trong ngày (giờ VN).

Lệnh `pipeline/do-lam-giau.mjs --write` so giá trị sống với ảnh chụp, trong một giao dịch có khoá advisory:

- **thêm**: chủ thể mới có giá trị;
- **đổi**: cùng chủ thể, `value_key` khác;
- **máy rút**: chủ thể có trong ảnh chụp mà nay không còn giá trị, trừ chủ thể có phát biểu bị người rút trong ngày (những
  chủ thể ấy chỉ đếm ở «người rút», để một lần người rút không đếm hai lần).

Chạy lại trong ngày (bước đêm chạy mỗi 15′) gộp vào dòng đã có của ngày: giữ `from` đầu ngày, `to` mới nhất; về lại giá trị
đầu ngày thì xoá dòng. Nhờ vậy số của ngày không đếm hai lần. Lần chạy đầu chỉ lập mốc: 0 dòng đổi, dq ghi `skip` «lập mốc».

**Người sửa hoặc rút** đọc từ chỗ đã có, không cần ảnh chụp:

- **người rút**: phát biểu của đường bị rút trong ngày với lý do `hitl-thay` hay `hoan-tac:*` (045), chỉ trên đường mà sổ đường
  khai có lối người rút;
- **người sửa**, hai phần cộng lại:
  - nhãn người (`eval_labels`) gắn trong ngày, cùng ô, trên bài của tin đang mang giá trị của đường, mà khác giá trị đó sau chuẩn
    hoá. Ô `seller_phone` so theo số E.164, ô `property_type` so theo mã loại hình;
  - phát biểu `hitl` (lối người của 045, `apply_enrichment`) ghi trong ngày, cùng chủ thể và ô với giá trị sống của đường, mà khác
    giá trị đó. Phần này ghi riêng ở `nguoi_sua_de`; đường không có lối ghi đè không có khoá này.

Đường không có lối người rút ghi `duong_nguoi_rut: false`. Màn hiện «không có đường người rút», không hiện 0. Hôm nay là cả hai
đường đang chạy: số qua người đăng không có thẻ duyệt; quy ước nhóm có thẻ duyệt, nhưng người sửa bằng cách ghi phát biểu `hitl`
đè lên chứ không rút phát biểu nhóm (`apply_enrichment` chỉ rút phát biểu `hitl` cũ, `revert_enrichment` từ 069 giữ lớp
`inferred`). Mạnh chốt 09/11.

Dòng `do3-thay-doi`, `entity = duong`, `detail` gồm:

- `ngay`, `song` (số giá trị sống cuối ngày), `them`, `doi`, `may_rut`, `nguoi_sua`, `nguoi_sua_de`, `nguoi_rut`;
- `nhan_da_so` (số nhãn người cùng ô trên tin của đường, mẫu số của phần nhãn `nguoi_sua − nguoi_sua_de`);
- phân rã theo lát, `phien_ban_thuoc`.

`status = 'pass'` khi ghi được số. `status = 'fail'` chỉ khi bộ tự soát lệch: `song` hôm nay khác `song` hôm qua + `them` −
`may_rut` − `nguoi_rut`, hoặc tổng ô của một chiều lát khác tổng chung. Detail ghi tên phép soát lệch. Chấm theo đích vẫn là
việc của báo cáo ngày.

### Kiểm ngược theo tuần

Mỗi tuần ISO (giờ VN), lượt nào thấy một đường đang chạy chưa có dòng `do3-kiem-nguoc` của tuần thì chạy kiểm ngược cho
đường đó. Tuần đã có dòng thì lượt sau không ghi thêm. Lượt lỗi giữa chừng rút giao dịch, không để lại dòng, nên lượt kế
chạy lại — mất một lượt không mất cả tuần. Kiểm trên **toàn tập**, không lấy mẫu, không gọi model (ghi chú hàng DO3: «không gọi model khi không
cần»). Cách giấu là **bỏ một ra** (leave-one-out): bằng chứng của chính chủ thể bị giấu không được dùng để suy lại nó.

- **`so-qua-nguoi-dang`**. Tập gồm tin S03 có số riêng (số trên tin hoặc trong bài, không phải số suy) và có tài khoản người
  đăng ra được Người. Với mỗi tin, dựng lại liên lạc của Người bằng đúng `rutLienLac` + `chonSoNguoi`
  (`pipeline/lib/lien-lac-nguoi.mjs`) trên bài và tin của Người, trừ tin đó, bài sinh ra nó và mọi tin khác của bài ấy (số
  trong chữ bài cũng là bằng chứng của chính tin). Số chọn được là dự đoán. Tập đo này là câu hỏi cho Mạnh (Hỏi-2): nó chỉ
  gồm tin có số riêng, nên là cận lạc quan cho tin không số mà đường thật sự làm giàu; detail ghi `tap_do` để số không bị
  đọc nhầm.
  - `dung`: dự đoán trùng số riêng (E.164);
  - `sai`: dự đoán khác số riêng;
  - `khong_ra`: Người không còn số nào.
- **`quy-uoc-nhom`**. Tập gồm bài S03 không phải bài thử, có loại hình đọc từ chữ (`docLoaiHinh` khác null). Với mỗi bài,
  `loaiHinhNhom` tính lại trên các bài cùng nhóm trừ bài đó.
  - `dung`: trùng loại hình chữ bài;
  - `sai`: khác loại hình chữ bài;
  - `khong_ra`: nhóm không ra loại.

Dòng `do3-kiem-nguoc`, `entity = duong`, `detail` gồm:

- `tuan`, `tap_do`, `n`, `dung`, `sai`, `khong_ra`;
- `ty_le_dung = dung / (dung + sai)`, Wilson 95% `{thap, cao}`, `phu = (dung + sai) / n`;
- so với tuần trước: `chenh` và `co_y_nghia` (hai khoảng không chồng nhau), `nguong_phat_hien`, theo nguyên tắc 6 của FRAMING
  §5;
- phân rã theo lát, `phien_ban_thuoc`.

Đường đang chạy mà chưa có hàm kiểm ngược ghi `skip` «chưa có kiểm ngược». Ngưỡng SỐNG của ô cơ hội đọc được từ đây: thiếu
dòng tuần là thiếu.

### Lát

Dùng lại `KHOA_LAT_DON_VI` và `phanRa` của DO1 (`pipeline/do-hang-ngay.mjs`, `pipeline/lib/do-hang-ngay.mjs`) trên tin của
giá trị:

- **thị trường, phường/xã**: từ `area_id` của tin qua `areas`;
- **dự án**: `properties.project_node` qua `property_offers`;
- **toà**: chưa có liên kết tin → toà (PL20). Tin có `block_raw` vào ô `chua-co-danh-ba`, còn lại vào `khong-tin-hieu`.

Mỗi chiều tối đa 30 ô lớn nhất + `khac` + hai ô chưa gắn. Tổng các ô bằng tổng chung.

### Lên Ops

Hai `check_name` mới `do3-thay-doi`, `do3-kiem-nguoc` ghi vào `dq_check_results`, bảng đã có trong FILL nên lên cloud không
sửa `sync-cloud.mjs`. Nhãn diễn giải thêm ở `app/src/lib/dq-labels.ts` trong cùng PR (luật đợt 30/10).

`detail` chỉ chứa số, tỉ lệ, khoá đường, `rule_id`, mã S0x, mã khu vực, khoá vật thể. Không có SĐT, băm SĐT, tên người
đăng, chữ bài, `labeler_id`, tên nguồn thật. Soát bằng đúng bộ chặn rò của DO1.

`/ops/quality` thêm khối «Làm giàu» ngay dưới «Đo hằng ngày», tải riêng trong `Suspense`, dùng chung tham số lát `?lat-do=`.
Bảng «Kiểm chất lượng» chung bỏ dòng `do3-*`.

### Bước đêm

`scripts/cloud-sync.sh` thêm bước `do-lam-giau` (`node pipeline/do-lam-giau.mjs --write`) ngay sau `do-hang-ngay`. Gộp main
trước khi sửa vì #373 vừa đổi tệp. `scripts/job-exit.test.mjs` cập nhật dãy bước cho khớp. Dòng `fail` không đổi mã thoát;
chỉ lỗi chạy làm job ≠ 0.

## Luồng một ngày

```mermaid
flowchart LR
  A[bac-du-lieu, do-hang-ngay] --> B[do-lam-giau --write]
  B --> C{Đường có giá trị sống?}
  C -- không --> D[do3-thay-doi skip: chua-chay]
  C -- có --> E[So ảnh chụp: thêm, đổi, máy rút]
  E --> F[Đếm người rút, người sửa trong ngày]
  F --> G[do3-thay-doi]
  B --> H{Tuần ISO chưa có dòng kiểm ngược?}
  H -- có --> I[Kiểm ngược bỏ một ra, toàn tập, không gọi model]
  I --> J[do3-kiem-nguoc: đúng, sai, không ra, Wilson]
  G --> K[/ops/quality khối Làm giàu, máy thu và cloud]
  J --> K
```

## Không làm (ranh giới)

- Ghi giá trị cho diện tích suy ra (GC2, GC3), quy ước nhóm có phiên bản (GCQ1, GCQ2), liên kết tin → toà/trục (PL20). DO3
  chỉ đo những đường đã ghi giá trị.
- Lối người duyệt hay rút số qua người đăng. DO3 chỉ đếm khi lối ấy có.
- Kiểm ngược đường danh mục CĐT ở mức toà (Hỏi-1).
- Chấm đạt/đỏ theo đích (báo cáo ngày).
- Độ phủ (C2b), chi phí (PL31), đo định vị và gắn căn (DO2).

## Rủi ro đã biết

- Kiểm ngược số qua người đăng chỉ đo trên tin **có** số riêng. Tin không số (chính là chỗ đường này làm giàu) có thể khác
  về người đăng, nên số đúng là cận lạc quan. Detail ghi rõ tập đo.
- Loại hình theo nhóm đo trên bài có chữ loại hình. Nhóm toàn bài không ghi loại có thể khác.
- Lát toà gần như toàn chưa gắn cho tới PL20; ô này hiện rõ, không ẩn.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: `/ops/quality` → khối «Làm giàu» → bảng theo đường (hôm nay, 7 ngày) + bảng kiểm ngược tuần này/tuần trước →
  chọn lát (Tổng · Thị trường · Phường/xã · Dự án · Toà) → đọc số.
- Biên: đường chưa chạy; lần đầu (lập mốc); đường không có lối người rút; tuần chưa có kiểm ngược.
- Lỗi & quay lại: đọc `dq_check_results` lỗi → lỗi tại chỗ + «Thử lại»; phần còn lại của trang vẫn đứng.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| `/ops/quality` khối «Làm giàu» | Thấy mỗi đường làm giàu thêm, đổi, bị rút bao nhiêu, và đúng bao nhiêu | Thanh Ops / không ra |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-quality-do3-loading | `/ops/quality` | `Skeleton` cho hai bảng | chờ |
| ST-quality-do3-empty | `/ops/quality` | «Chưa có số đo làm giàu — bước đo chạy sau chạy đêm» + lệnh chạy tay | chạy `node pipeline/do-lam-giau.mjs --write` |
| ST-quality-do3-moc | `/ops/quality` | Dòng đường: «Lần đầu — đã lập mốc, số thay đổi có từ ngày mai» | chờ ngày sau |
| ST-quality-do3-chua-chay | `/ops/quality` | Dòng đường: «Chưa chạy — đường này chưa ghi giá trị lên tin» | không cần |
| ST-quality-do3-khong-nguoi | `/ops/quality` | Ô người rút: «không có đường người rút» thay số 0 | không cần |
| ST-quality-do3-chua-kiem | `/ops/quality` | Bảng kiểm ngược: «Chưa có kiểm ngược tuần <tuần>» | chờ lượt đầu tuần |
| ST-quality-do3-error | `/ops/quality` | Alert lỗi tại chỗ + nút «Thử lại» | bấm Thử lại |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Lát theo tham số URL `?lat-do=` dùng chung với khối «Đo hằng ngày»; mặc định «Tổng».
- Tỉ lệ hiện kèm `n`; `n < 5` hiện «ít mẫu» thay phần trăm. Kiểm ngược hiện tỉ lệ đúng, cận dưới Wilson, dấu «chênh có ý nghĩa».

### 5. Xuất xứ component

| Component | Nấc | Vì sao |
|---|---|---|
| `Frame`/`Card` của trang `/ops/quality` | dùng | khối mới theo archetype của trang |
| `data-grid` (ReUI) | dùng | bảng số |
| `Badge` (reui) | dùng | «chưa chạy», «lập mốc», «ít mẫu», «chênh có ý nghĩa» |
| `Skeleton`, `Alert` (ui) | dùng | tải, lỗi |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: khối thêm vào trang `/ops/quality` vốn là bảng điều khiển số kiểm, cạnh khối «Đo hằng ngày» của DO1.

### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | Người vận hành (Mạnh) |
| Việc chính | Xem mỗi đường làm giàu thêm, đổi, bị rút bao nhiêu và đúng bao nhiêu |
| Tần suất | mỗi ngày, kiểm ngược mỗi tuần |
| Số bản ghi | vài chục dòng |
| Thiết bị | máy tính |
<!-- UX-SPEC-TEMPLATE>>> -->
