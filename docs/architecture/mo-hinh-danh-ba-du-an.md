# Mô hình dòng chảy danh bạ dự án — bản ghi nguồn vào, một dự án sống qua thời gian, đo hằng ngày

Ngày: 2026-11-11 · Người soạn: Claude (phiên Liên làn, theo lời Mạnh 11/11) · **Bản 2** (sau một lượt đọc độc lập: 20 phát hiện, 5
chặn, đã sửa hết) · Trạng thái: **Mạnh duyệt Hỏi-1..5 «Theo khuyến nghị» 11/11** (ROADMAP §3 mục 44)

> Lời giao (Mạnh, 11/11): «Để hoạt động hiệu quả tôi nghĩ cần mô hình hoá, như cách chúng ta đã mô hình cho một ngôi nhà và
> gộp, làm giàu… Hãy framing lại phân tích → hoàn chỉnh → đề xuất.»

## Tài liệu này là gì và không là gì

- Đây là **bản song song** của `docs/architecture/mo-hinh-pipeline-mot-can-nha.md`.
  - Bản đó: **tin → căn**.
  - Bản này: **bản ghi nguồn → dự án**, cùng khuôn: chặng, phân xử, qua thời gian, bậc, đo, bất biến.
- Phần lớn mô hình **đã được chốt**, nhưng nằm rải ở nhiều chỗ:
  - ADR-0016;
  - kế hoạch 08/11 (`docs/plan/ke-hoach-danh-ba-du-an-0811.md`, ROADMAP mục 39);
  - ROADMAP mục 40 (gói 09/11);
  - mục 38 (thông tin dự án công khai);
  - DAZ4 ngày 10/11;
  - lời các hàng DA3, DA15–DA20.

  Bản này **ghép** chúng thành một dòng chảy. Thêm vào chỉ ở §7, và mọi điều mới đều là câu hỏi.
- Mạnh đã duyệt (11/11), bản này nằm ở `docs/architecture/mo-hinh-danh-ba-du-an.md`. Việc và thứ tự vẫn ở
  `docs/plan/lo-trinh.json`.
- Bản này chỉ dùng mã nguồn S0x.

## 0. Một trang

**Mô hình trong sáu câu** (đều đã chốt, kèm căn cứ):

1. **Dự án và phân khu** là nút họ Vùng (`asset_nodes`). Khoá không suy từ nội dung. Vòng đời `active · merged · split · retired`,
   không xoá (ADR-0016 §1, §3).
2. **Bản ghi nguồn → dự án đi qua bảng nối** (DA3):
   - máy đề xuất cặp kèm căn cứ;
   - đội ops duyệt trên thẻ;
   - cặp cùng căn cứ duyệt loạt bằng **thẻ luật**, Mạnh xem mẫu;
   - mỗi cặp đã duyệt thành một bí danh.

   (ROADMAP mục 39, hàng DA3.)
3. **Thuộc tính dự án là phát biểu** `resource_name = Subdivision / Complex` trên nút, có nguồn. Bộ phân xử dựng cột cấp dự án
   (DA15, DA16). Hai nguồn nói trái nhau thì **lên thẻ**, không đè (ADR-0016 §7.4, DA16).
4. **Nút từ bằng chứng tin do người tạo** (DA18, mục 40 Q2). Toà ứng viên chưa cấp UPI tới khi người duyệt.
5. **Gắn tin theo sáu bậc** của kế hoạch §4:
   - mã nguồn;
   - chữ + bí danh;
   - quy ước nhóm, chỉ khi đạt ≥ 95% GC0 (mục 40 Q7);
   - model đề xuất;
   - toạ độ chỉ để xếp thẻ;
   - người.

   Phường kế thừa từ dự án là phường thật, nhãn «suy ra từ dự án» (DA9, mục 40 Q9).
6. **Lên Invest** khi có ít nhất một nguồn danh mục hoặc đã người duyệt cặp nối, có xã/phường, và có tin đang rao hoặc quỹ căn
   (mục 39).

**Đối xứng với Một Căn Nhà** (để đọc mô hình, không phải luật mới):

| Một Căn Nhà | Danh bạ dự án |
|---|---|
| Tin `<S0x>:<id>` | Bản ghi nguồn `<S0x>/<mã dự án nguồn>` (bí danh `ma_nguon`) |
| Căn (họ Vật thể) | Dự án (họ Vùng) |
| Gắn tin vào căn (phát biểu liên kết) | Nối mã nguồn vào dự án (bảng nối DA3 → bí danh) |
| Nhà phố: vật thể tạm, gộp theo bằng chứng | Nút ứng viên (DA18 từ tin; **Hỏi-1** từ danh mục) |
| Bậc B0–B5 | **Hỏi-3**: mức hồ sơ dự án |

**Ba số nền 11/11** (DB máy thu, chỉ đọc):
- Danh bạ:
  - 20 nút `project`, đều có xã, 0 có cha;
  - 3 nút `node_type = building`, thực ra là phân khu (DA8 chưa làm);
  - 69 toà `xac_minh`.
- `field_assertions` chưa có phát biểu nào cho dự án (Property 830.642, Building 69).
- Danh mục S08:
  - 177 dự án trong snapshot danh mục 07/11;
  - 152 dự án có quỹ căn trong `stg_s08_inventory`;
  - `s08_project_links` 150 dòng, 8 đã nối.
- Nguồn danh mục khác:
  - S11 có 478 dự án;
  - S07 khoảng 5.843 dự án, chưa thu;
  - S09 thu thử;
  - S12–S15 nháp.

**Đòn bẩy:**
- Hôm nay chỉ S08 có bảng nối, và đó là bảng nối riêng.
- Nhiều thứ chưa dựng: bảng nối đa nguồn (DA3), chỗ ghi thuộc tính dự án (DA15), bộ chuyển thuộc tính danh mục (DA16). Cả ba mới
  là ô cơ hội.
- Thu S07 khi chưa có DA3 thì dữ liệu nằm ở `stg` mà không nối được. Chính vì vậy DAZ3 đã được xếp đứng trên DA3.

## 1. Dòng chảy đích — tám chặng

| # | Chặng | Việc | Đầu ra | Ai quyết | Hàng |
|---|---|---|---|---|---|
| D1 | Nhận | Thu nguyên văn, raw bất biến | snapshot → `stg_*` | luật thu | DAZ3 (S07), DAZ1/DAZ2 (S09), S10, S11–S15 (**chưa có hàng**, DA24 là mục chờ) |
| D2 | Chuẩn hoá bản ghi | Mỗi `stg` danh mục → khuôn chung (§1.1): tên chuẩn hoá, tỉnh, xã (PX1 + bảng ĐVHC cũ↔mới), điểm nguồn, CĐT, mã số DN, cha của nguồn | bản ghi chuẩn (view hoặc bảng phụ, không phải phát biểu) | luật xác định | trong DA3 (đầu vào bộ đề xuất) |
| D3 | Đề xuất cặp | Chặn theo tỉnh; chấm căn cứ (§1.2) | cặp + căn cứ | máy; Haiku chỉ đề xuất ca khó | DA3 |
| D4 | Nối, tạo, gộp, tách | Thẻ luật hoặc thẻ từng cặp → nối, thành bí danh; không khớp → nút ứng viên (DA18 từ tin; Hỏi-1 từ danh mục); gộp, tách, đổi cha | bảng nối, bí danh, sự kiện | người, thẻ luật | DA3, DA7, DA11, DA18, DA19 |
| D5 | Thuộc tính | Bản ghi đã nối → phát biểu trên nút (nguồn S0x, `source_field`); phân xử dựng cột cấp dự án | cột cấp dự án | luật + thẻ | DA15, DA16 |
| D6 | Làm giàu theo thời gian | Snapshot mới → phát biểu mới có `observed_at`; lịch sử trạng thái, tiến độ; quỹ căn thành tin sơ cấp | lịch sử dự án | phân xử + nhịp quét | DA16, DA17 |
| D7 | Đo | Độ đủ hồ sơ theo bảy nhóm; mức gắn tin; phễu | trang Ops | — | DA14, DA20 |
| D8 | Phục vụ | Bí danh → bộ đọc tin (PL13); kế thừa phường (DA9); trang dự án Invest (DA13) | từ điển, phát biểu kế thừa, trang | — | PL13, DA9, DA13 |

**Người đứng ở ba chỗ:**
- thẻ nối và thẻ luật (D4);
- thẻ mâu thuẫn thuộc tính (D5);
- gộp, tách, đổi cha (DA19).

Mạnh xem mẫu thẻ luật. Mẫu soát chỉ để **thấy trôi, không mở cổng** (FRAMING §5): một căn cứ chỉ được duyệt loạt khi người
duyệt thẻ luật của nó.

### 1.1 Khuôn chung của bản ghi nguồn (D2)

Mỗi nguồn có một bộ chuyển `stg_<nguồn>` → khuôn chung. Bộ đề xuất cặp và DA16 cùng đọc khuôn này. Nguồn mới chỉ cần thêm
một bộ chuyển.

| Trường khuôn | Dùng ở |
|---|---|
| mã nguồn `S0x`, mã dự án nguồn, mã cha của nguồn | khoá bản ghi; căn cứ cha–con |
| tên thương mại, tên pháp lý → tên chuẩn hoá (bỏ dấu, viết thường, bỏ tiền tố thương hiệu) | căn cứ tên |
| địa chỉ nguyên văn (giữ cả hai cấp mới lẫn quận cũ), tỉnh, xã | chặn theo tỉnh; căn cứ xã |
| điểm do nguồn công bố (**Hỏi-2**) | căn cứ khoảng cách |
| CĐT, mã số DN | căn cứ chủ thể |
| loại hình, cao/thấp tầng | tách ca trùng tên |

Lời khai từ tin (mã dự án S06, nhóm S03, tên trên tin) **không** đi qua khuôn này mà qua DA7 và DA18. Lý do là nó mang xã và
toạ độ của tin, mà xã của tin có thể đã kế thừa từ chính dự án (DA9), tức là tự nuôi (ADR-0016 §7.3).

### 1.2 Căn cứ đề xuất cặp (D3)

**Chặn:** cùng tỉnh. Bản ghi chưa có tỉnh thì lên thẻ, không đề xuất.

| Mã | Căn cứ | Đi thẻ luật hay thẻ từng cặp |
|---|---|---|
| K1 | Cùng mã số DN của CĐT + tên chuẩn hoá trùng | thẻ luật |
| K2 | Điểm nguồn cách ≤ 300 m + tên chuẩn hoá trùng | thẻ luật |
| K3 | Cùng xã + tên chuẩn hoá trùng | thẻ luật |
| K4 | Điểm ≤ 1 km + tên trùng một phần (≥ 50% từ) | thẻ từng cặp; Haiku đề xuất kèm căn cứ có thật |
| K5 | Nguồn khai cha–con (cây S07; phân khu S08) | thẻ luật cho quan hệ; loại nút theo luật Q2 mục 39 |

Mỗi thẻ luật Mạnh xem mẫu, đúng như đã chốt. Mẫu soát 20 cặp mỗi tuần cho mỗi căn cứ chỉ để thấy trôi.

**Không bao giờ:**
- nối khi lệch tỉnh;
- nối chỉ theo điểm;
- tự gộp hai nút theo tên (kế hoạch §4).

### 1.3 Phân xử thuộc tính (D5)

- Trường danh mục là phát biểu `source_field`, lớp **sự thật** (045). Hai nguồn danh mục nói trái nhau ở cùng một trường thì
  **lên thẻ** (luật 1; DA16 đã chốt S08 ↔ S09 lệch thì lên thẻ). Không có thứ tự nguồn tự thắng.
- Để thẻ không ngập:
  - so **sau chuẩn hoá** (chữ hoa/thường, làm tròn diện tích theo đơn vị, ngày theo tháng);
  - cùng một kiểu lệch thì gom thành thẻ luật theo (trường × cặp nguồn).
- Pháp lý, CĐT, giá không kế thừa xuống tin (ADR-0016 §7.1). CĐT kế thừa xuống toà (DA15).

### 1.4 Không gian

- **Điểm**: lấy từ nguồn danh mục (**Hỏi-2**), không gọi dịch vụ định vị bên ngoài.
- **Đa giác và tâm từ OSM** thuộc **DA21**, đang là mục chờ theo luật 11. Điều kiện mở là đo được thẻ xếp sai vì thiếu vị trí,
  hoặc DA9 không kiểm được «nằm trọn một xã» (chỉ 500/3.321 xã có ranh giới).
- Số đo thử OSM ngày 11/11 (§5) là đầu vào cho lúc mở DA21, không mở DA21.
- Toạ độ tin trong vùng dự án chỉ dùng để xếp thẻ (kế hoạch §4 bậc 5).

## 2. Một dự án qua thời gian

- **Vòng đời nút**: `active · merged (merged_into) · split · retired` theo ADR-0016 §3. Nút ứng viên là `active` + mức ứng viên
  (DA18).
  - Phát hiện: `registry_events` và `registry_aliases` (055) chỉ nhận khoá `pty|prc|bld|stk|unt`.
  - `registry_aliases.source` chỉ nhận `S01–S09`.
  - Nút dự án và nguồn S10–S15 chưa ghi vào được → cần migration (§6).
- **Đúc nút**: `asset_nodes.slug` là UNIQUE và suy từ tên (026). Đúc hàng loạt sẽ trùng slug, nên cần luật slug có hậu tố tỉnh
  hoặc mã (§6).
- **Làm giàu**:
  - snapshot mới cho phát biểu mới;
  - nguồn bỏ một giá trị thì phát biểu cũ hết hiệu lực, lịch sử giữ;
  - quỹ căn S08/S10 là tin sơ cấp (DA17).
- **Từ tin đi lên** chỉ có bí danh (sau khi cặp được duyệt) và số đếm precompute (luật 10).
- **Từ dự án đi xuống tin**: phường (DA9), loại hình dự án; là `registry_inherit` kèm «suy ra».

## 3. Đo hằng ngày

Các thước đã có hàng, không thêm north star:
- **Độ đủ hồ sơ** (DA20): mỗi dự án × bảy nhóm, ghi `trống | một nguồn | nhiều nguồn khớp | mâu thuẫn`.
- **Mức gắn tin** (DA14): phân bố tin theo sáu mức (căn, trục, toà, phân khu, dự án, xã) theo nguồn × loại nhà.
- **Phễu danh bạ** (đề xuất thêm vào DA14 hoặc DA20):
  - bản ghi nguồn nhận;
  - chuẩn hoá được (có tỉnh, xã);
  - đã nối · chờ thẻ · ứng viên;
  - lý do rơi.
- **Tín hiệu không cần nhãn**:
  - số thẻ mâu thuẫn mở theo nhóm;
  - nút ứng viên quá 30 ngày;
  - một mã nguồn nối hai nút;
  - độ tươi từng nguồn.

North star vẫn là phân bố căn B0–B5 (FRAMING §5). Danh bạ phục vụ north star qua mức gắn tin.

### 3.1 Bất biến (test trong CI)

- 0 nút bị xoá.
- 0 nối lệch tỉnh; 0 gộp tự động theo tên.
- 0 thuộc tính dự án không có nguồn.
- Nạp lại cùng snapshot không nhân phát biểu, không đổi nút.
- 0 tên nguồn thật ở cloud.
- Gỡ một cặp nối thì rút dây chuyền thuộc tính và kế thừa đi theo.

## 4. Định vị tin nhờ danh bạ

| Bậc gắn tin (kế hoạch §4) | Danh bạ cấp gì |
|---|---|
| 1. Mã có cấu trúc | Cặp mã S06 ↔ dự án đã duyệt (DA7) thành bí danh `ma_nguon` |
| 2. Chữ bài nêu tên | Bí danh mọi nguồn đã nối (tên thương mại, pháp lý, cách viết trên tin), phạm vi tỉnh → PL13 |
| 3. Quy ước nhóm S03 | Chỉ khi nhóm đạt ≥ 95% GC0 (GCQ2) |
| 4. Model | Danh sách dự án trong tỉnh làm ngữ cảnh; chỉ đề xuất |
| 5. Toạ độ | Xếp thẻ (DA21 khi mở) |
| Kế thừa | Phường suy ra (DA9) |

Thêm nguồn danh mục thì **bậc 2 mạnh lên**: mỗi nguồn đã nối thêm bí danh. Đây là đường danh bạ đa nguồn giúp tin định vị
nhiều nhất.

## 5. Đo thử OSM 11/11 (Mạnh «Đo thử OSM»)

- Mẫu: 50 dự án S08 chọn theo băm, đo đủ 50/50.
- Mốc so: điểm ghim trong bản đồ nhúng của S08.
- Tìm điểm từ OSM:
  - theo tên dự án, trúng trong 1 km: 7/50;
  - theo «tên + tỉnh»: 8/50;
  - gộp hai cách: 8/50, cả 8 kết quả đều là vùng (way/relation);
  - theo địa chỉ thì chỉ ra tâm phường: 7/50 trong 1 km, 10/50 trong 3 km;
  - 33/50 dự án không cách nào ra kết quả trong 3 km.
- Khi đã có điểm: 41/50 dự án có vùng mang tên trong 500 m, nhưng chỉ 14/50 (khoảng 28%) có vùng mang tên khớp dự án.
- Kết luận: OSM không thay được điểm do nguồn công bố, khớp với Hỏi-2. Lấy vùng từ OSM chỉ phủ khoảng 28%, nên DA21 giữ ở mục
  chờ như đã chốt.

## 6. Đối chiếu với mã — giữ · sửa · thiếu

| Thứ | Hiện trạng | Việc |
|---|---|---|
| `asset_nodes` | slug UNIQUE suy từ tên (026); có `aliases`, `area_ids`, `meta` | sửa: luật slug khi đúc hàng loạt; trạng thái theo ADR-0016 §3 |
| `s08_project_links` | Bảng nối riêng S08 (074) | DA3 đã chốt: bảng nối mới `noi/chua_noi/tu_choi` + lý do + người duyệt, view thay 074 |
| `field_assertions` | Trigger 082 dành dạng khoá `<S0x>:` cho `Property`; chưa có `Subdivision`/`Complex` | DA15 mở resource, khoá nút |
| `registry_aliases`, `registry_events` | 055: chỉ khoá vật thể/người; `source` chỉ `S01–S09` | thiếu: migration mở cho nút dự án và S10–S15 (cùng DA3 hoặc DA15) |
| `source_registry` | S07, S10–S15 có; **S09 chưa có** | đăng ký S09 (lời Mạnh) |
| PX1, bảng ĐVHC | 084 | dùng ở D2 |
| Bộ chuyển khuôn chung | chưa có | thiếu (trong DA3) |

## 7. Điều mới — chỉ ở đây, đều là câu hỏi (Mạnh duyệt cả năm «Theo khuyến nghị», 11/11)

| # | Câu | Khuyến nghị | Đụng gì |
|---|---|---|---|
| Hỏi-1 | Bản ghi danh mục không khớp nút nào: máy **đúc nút ứng viên** hàng loạt. Nút chỉ được nối tin và lên Invest sau khi qua **thẻ luật theo nguồn** («mọi dự án S07 có xã, không khớp nút nào → nhận làm dự án», Mạnh xem mẫu) hoặc người duyệt. | Có. 5.843 thẻ từng cái không duyệt nổi; thẻ luật giữ người trong vòng | Thêm vào DA18 (nay chỉ người tạo nút từ tin). **Siết** điều kiện Invest mục 39: «có nguồn danh mục» đổi thành «có nguồn danh mục đã qua thẻ luật» |
| Hỏi-2 | Điểm do nguồn danh mục công bố (S07 trong trang, S08 trong bản đồ nhúng) dùng làm điểm dự án, ghi nguồn S0x? | Có. Không gọi dịch vụ định vị; rủi ro điều khoản Mạnh chốt | DA16 đã có toạ độ toà S09; mở thêm điểm dự án |
| Hỏi-3 | Thêm **mức hồ sơ dự án** (thang tổng, cạnh độ đủ DA20): Có tên → Có nguồn → Có xã → Đối chiếu (≥ 2 nguồn khớp) → Có pháp lý (nguồn nhà nước) → Đang bán. Mã M0–M5, khác nhãn B0–B5. | Có, như thước phụ ở Ops; không thành north star | Thêm vào DA20; CONTEXT thêm thuật ngữ |
| Hỏi-4 | Thu S07 (DAZ3) **trước** DA3, ưu tiên Hà Nội + HCM thay cho «dự án có tin mà chưa nối» (cần DA3)? | Có. Thu chậm (≥ 10 s/trang, ~16 giờ); xong thì DA3 có dữ liệu ngay | Đổi `dung_tren` của DAZ3 |
| Hỏi-5 | Khuôn chung bản ghi nguồn (§1.1) làm **trong DA3**, không mở hàng riêng? | Có. Đó là đầu vào của bộ đề xuất cặp | Lời DA3 thêm một vế |

**Đã sửa so với bản 1:**
- bỏ việc mở cổng tự nối bằng mẫu soát;
- bỏ việc máy tự đúc nút từ tin;
- bỏ việc đặt phát biểu trên khoá bản ghi nguồn, vì đụng khoá `Property`;
- bỏ thứ tự nguồn tự thắng;
- bỏ north star mới;
- bỏ OSM khỏi phần làm ngay (thuộc DA21);
- bỏ căn cứ «mã nhà nước» (DA24b đã bỏ);
- bỏ căn cứ vòng tròn;
- đổi nhãn bậc để khỏi trùng B0–B5;
- sửa mã hàng: S07 là DAZ3; S10–S15 chưa có hàng.
