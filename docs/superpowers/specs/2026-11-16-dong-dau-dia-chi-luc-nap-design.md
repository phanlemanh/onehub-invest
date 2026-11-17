# TG2 `dong-dau-dia-chi-luc-nap` — thiết kế

Hàng TG2 (`docs/plan/lo-trinh.json`, nhóm `l02-dong-dau-luc-nap`, đợt `dat-lai-lo-trinh-1511`), hạng **T2**,
đứng trên **DV7** (view `offer_project`) và **TG1** (thẻ địa chỉ nhóm). Lát L2 của cặp L1 ↔ L2: TG1 dựng thẻ cho
người duyệt, TG2 đóng dấu thẻ đã duyệt lên tin **ngay ở lượt nạp**.

Căn cứ: ROADMAP §3 mục 51 (bối cảnh nhóm là mặc định, đóng dấu ở bước nạp) · `_acceptance/the-dia-chi-nhom-s03/`
(Out of scope của TG1 ghi thẳng «Đóng dấu thẻ lên tin lúc nạp và tính lại tin cũ khi sửa thẻ (TG2)») ·
`_acceptance/du-an-tren-tin-s03-tu-nhom-va-ten/` (DV6) · `_acceptance/du-an-cua-tin-len-dinh-vi/` (DV7).

---

## 0. Một trang

Hôm nay dự án của tin S03 được gán bởi **một lệnh chạy tay chạy sau**, không nằm trong chuỗi đêm:
`pipeline/scripts/du-an-tren-tin-s03.mjs` (DV6), hai luật cộng dồn — nhóm chuyên một dự án (`inferred/e1_rule`)
và tên trong chữ bài (`observed/e2_llm`). Phường thì do `transform-zalo.mjs` khớp chữ bài rồi ghi thẳng **cột**
`area_id`/`phuong_raw`, không qua phát biểu. Phân khu chưa có trên tin. Bán/thuê suy từ chữ bài, rồi mới tới
`mucDichNhom` (tên nhóm, hoặc ≥20 bài và ≥85% một loại).

TG2 chuyển cả bốn ô ấy về **một nguồn có người duyệt** — thẻ địa chỉ nhóm — và làm việc đó **tại bước nạp**:

```
stg_zalo_posts ──loadStgPosts──┐
                               ├─► transform-zalo.mjs ──► sale_offer_records + field_assertions
group_address_cards (thẻ sống) ┘        │                      │
   status='da_duyet', retired_at IS NULL│                      └─► offer_project ─► ô Định vị, bậc B2,
                                        │                                           hạng giá cấp dự án, /ops/deals
                                        └─► cột kind (bán/thuê) từ ô purpose của thẻ
```

**TG2 không cần migration.** `045_phat_bieu_va_phan_xu.sql:84-86` cho cặp `inferred + e1_rule` là hợp lệ, và
`096_truong_du_an_tren_tin.sql:12-13` đã mở ba trường `project_node_id`, `subzone_node_id`, `area_id` trên
resource `Property`. Vùng của hàng vì thế đúng như lộ trình khai: `pipeline/transform-zalo.mjs`, `pipeline/lib`,
`pipeline/mappings.yaml` — không chạm `db/migrations/**`, không chạm làn thu.

---

## 1. Bảng phủ ca — đếm trên DB máy thu, mốc 2026-11-16T14:34:44Z

Theo AGENTS.md «Trước khi viết mã cho transform, bước khớp, lời gọi ngoài». Mọi ô là số đếm thật trên
DB máy thu local (cổng 5433, cơ sở `oneinvest`), một giao dịch `REPEATABLE READ READ ONLY`, **không fixture viết tay**.
Bài thử đã gạt bằng đúng khuôn của kho (`pipeline/lib/test-posts.mjs` → `testMarker` + `loadStgPosts`, bản SQL
giữ khớp bởi `pipeline/scripts/dau-bai-thu-sql.test.mjs`): **1.265 / 153.811 bài bị gạt**.

Ba chiều: **loại nhóm** × **chữ bài** × **loại bài**. Mọi ô tính **theo bài đầu của tin** (`post_ids[1]`).

### 1.1 Ô = số tin

| loại nhóm | loại bài | im | nêu cùng dự án nhóm | **nêu dự án KHÁC** | nêu tên ngoài danh bạ | tổng |
|---|---|---:|---:|---:|---:|---:|
| **một dự án** (13 nhóm) | tin rao | 2.289 | 137 | 7 | 0 | 2.433 |
| | Yêu cầu | 118 | 1 | 0 | 0 | 119 |
| | bài chỉ ảnh | — | — | — | — | **0** |
| | *chưa có nhãn* | 2.234 | 0 | 0 | 0 | 2.234 |
| | *nhãn khác* | 17 | 0 | 0 | 0 | 17 |
| | **cộng** | 4.658 | 138 | 7 | 0 | **4.803** |
| **nhiều dự án** (3 nhóm) | tin rao | 186 | 47 | 4 | 2 | 239 |
| | Yêu cầu | — | — | — | — | **0** |
| | bài chỉ ảnh | — | — | — | — | **0** |
| | *chưa có nhãn* | 202 | 0 | 0 | 0 | 202 |
| | *nhãn khác* | 3 | 0 | 0 | 0 | 3 |
| | **cộng** | 391 | 47 | 4 | 2 | **444** |
| **chưa khai** (8 nhóm) | tin rao | 621 | 28 | 2 | 1 | 652 |
| | Yêu cầu | 10 | 0 | 0 | 0 | 10 |
| | bài chỉ ảnh | — | — | — | — | **0** |
| | *chưa có nhãn* | 654 | 0 | 0 | 0 | 654 |
| | *nhãn khác* | 2 | 0 | 0 | 0 | 2 |
| | **cộng** | 1.287 | 28 | 2 | 1 | **1.318** |
| **ngoài sổ** (2 nhóm) | tin rao | — | — | — | — | **0** |
| | Yêu cầu | 2 | 0 | 0 | 0 | 2 |
| | **cộng** | 2 | 0 | 0 | 0 | **2** |
| **không nối được nhóm** | tin rao | 63 | 0 | 0 | 0 | 63 |
| | *chưa có nhãn* | 7 | 0 | 0 | 0 | 7 |
| | **cộng** | 70 | 0 | 0 | 0 | **70** |
| | **TỔNG** | **6.408** | **213** | **13** | **3** | **6.637** |

### 1.2 Ô bỏ — «ngoài phạm vi, vì»

- **Hàng «bài chỉ ảnh» rỗng ở cả bốn loại nhóm, và đó không phải thiếu dữ liệu.** Bài chỉ-ảnh đi nhánh
  `anh-da-ghep`/`anh-chua-ghep` của `pipeline/lib/nhanh-bai-s03.mjs`, **không bao giờ** nằm trong `post_ids`, nên
  không tin nào có bài đầu là bài chỉ ảnh. Ca này không đo được từ `sale_offers`; nếu cần thì phải đo từ
  `stg_zalo_posts`, và đó là hàng khác.
- **«nhiều dự án × Yêu cầu» = 0** và **«ngoài sổ × tin rao» = 0**: ô trống thật trên dữ liệu hôm nay, không viết ca.
- **Chiều «loại bài» chỉ phủ một nửa tập**: 3.143 / 6.637 tin (47,4%) có bài đầu **chưa có nhãn bạc**
  (`silver_labels` mới phủ 16.486 / 153.835 bài = 10,7%). Ca kiểm của TG2 vì thế **không được** phụ thuộc
  `listing_intent`; nó phải đúng cả khi nhãn vắng.

### 1.3 Hai con số làm đổi hình dáng hàng

**(a) Luật «chữ bài thắng» chỉ chạm 13 tin trên 6.637 — 0,2%.** 96,5% tin có bài đầu **im**. Hơn nữa DV6 chỉ nhận
nhãn có căn cứ `chu_bai` kèm đoạn trích đã kiểm (`CAN_CU_NHAN`), mà toàn hệ chỉ có **164 bài** mang căn cứ ấy
(các căn cứ khác: `kien_thuc_nghe` 954, `anh` 373, `ngu_canh_nhom` 6.966 — `ngu_canh_nhom` bị luật TG1 loại thẳng).
⇒ Luật này **không đo được bằng tỉ lệ trên mẫu**; nó phải được chấm bằng **ma trận viết trước** có chiều đỏ, và
phải khai là giới hạn đã biết trong hồ sơ.

**(b) Đếm theo bài đầu bỏ qua 60.266 bài.** 4.853 / 6.637 tin (73,1%) gồm từ hai bài trở lên; tin dày nhất 621 bài;
tổng 66.903 bài nằm trong tin. Đây là **bẫy làm tụt ô Định vị**: phát biểu đặt trên từng bài
(`subject_key = 'S03:<post_id>'`), còn `offer_project` gom theo tin và trả `xung_dot` khi tin chạm **từ hai dự án
gốc**. Nếu TG2 đóng dấu dự án của thẻ lên bài im, mà một bài khác của cùng tin lại mang dự án khác, tin ấy chuyển
từ `mot_du_an` sang `xung_dot` và **rơi khỏi ô Định vị**. Hôm nay S03 có `xung_dot` = **0 dòng**, nên mọi dòng
xung đột sinh ra đều là do TG2. ⇒ Thiết kế phải chặn ở gốc (§2.2) và hợp đồng phải có một tiêu chí đo đúng con
số này.

### 1.4 Hiện trạng bốn ô trên tin

| | số tin | tỉ lệ | ghi chú |
|---|---:|---:|---|
| có **dự án** (`offer_project.status='mot_du_an'`) | 5.438 | **81,93%** | `xung_dot` = 0 |
| có **phường** (`area_id` là `submarket`) | 64 | **0,96%** | ô yếu nhất |
| có **phân khu** | — | — | **không có cột nào**; `block_raw` 3.509 (52,9%) là mã toà dạng chữ, chưa nối `asset_nodes` |
| có **bán/thuê** (`kind`) | 6.637 | **100%** | bán 2.537 · thuê 4.100 |

### 1.5 Tin chưa có dự án, theo lớp nhóm — nguồn của ngưỡng

| loại nhóm | tin | đã có dự án | **chưa có** | thẻ nhóm mở khoá được? |
|---|---:|---:|---:|---|
| sổ một dự án | 4.803 | 4.758 | 45 | có (DV6 cũng nhặt được) |
| sổ **chưa khai** | 1.318 | 560 | **758** | **có — đây là phần chính** |
| sổ nhiều dự án | 444 | 120 | 324 | chỉ khi người sửa thẻ còn đúng một dự án |
| ngoài sổ | 2 | 0 | 2 | không |
| **không nối được nhóm** | 70 | 0 | **70** | **không — trần cứng** |
| tổng | 6.637 | 5.438 | 1.199 | |

**Trần cứng 98,9%** (6.567 / 6.637): 70 tin có bài đầu không mang `conversation_id` nên không nhóm nào chạm tới.

**Đường tới 90%**: cần 5.973 tin, thiếu **535**. Ba thẻ của nhóm chưa khai đủ trả: N007 212 + N008 174 + N002 168
= **554 tin** (số của `research-local/duyet-the-nhom-1611/huong-dan-buoi-duyet.md`, đo 14:16Z). Tức ngưỡng 90%
đạt được **không cần** đụng nhóm nhiều dự án.

---

## 2. Thiết kế

### 2.1 Thẻ nào được đóng dấu

Một vị từ, không hơn:

```sql
status = 'da_duyet' AND retired_at IS NULL
```

- «nhận» và «sửa» đều cho `status='da_duyet'` (`app/src/lib/the-dia-chi-nhom.ts:152-165`) — đúng đề nghị «chỉ thẻ
  đã NHẬN hoặc đã SỬA mới đóng dấu».
- `nhap` (người chưa quyết) và `bac` **không** đóng dấu: nháp là phỏng đoán của máy, đóng dấu nó là bỏ qua người.
- Thẻ **nghỉ** không đóng dấu — và hai điều kiện không chồng nhau, vì `109:18-20` đã chặn
  `retired_at IS NULL OR status = 'nhap'`: thẻ người đã quyết không bao giờ rời tập sống.

### 2.2 Thứ tự ưu tiên — **mỗi bài đúng một dự án**

Đây là chỗ chặn bẫy §1.3(b). Với mỗi bài, TG2 chọn **một** giá trị rồi mới ghi:

1. **chữ bài** — nhãn bạc mới nhất có căn cứ `chu_bai` + đoạn trích đã kiểm, khớp đúng một nút dự án → ghi dự án ấy;
2. nếu không → **thẻ nhóm** đã duyệt, ô `du_an` có đúng **một** nút → ghi dự án ấy;
3. nếu không → **không ghi dòng nào** (thẻ hai hay ba dự án: không đoán).

Không cộng dồn hai nguồn trên cùng một bài.

**Sửa 17/11 sau phép đo thật — hoà giải ở mức TIN.** Bản trên để tin thành `xung_dot` khi hai bài khác nhau cho hai dự án
khác nhau và gọi đó là «xung đột thật». Đo trên bản chép (kịch bản K1, 26 thẻ nhận nguyên nháp): **34 bài trong 13 tin**
rơi từ `mot_du_an` sang `xung_dot`, từ mốc 0 — trái AC-8 đã ký. 9 tin là bài **đăng lại chéo nhóm** của hai dự án (cùng căn
rao ở nhóm VOP1 và nhóm dự án khác), 4 tin có **một bài chữ nêu dự án khác thẻ** trong khi các bài còn lại im. Cả hai là
xung đột do chính việc đóng dấu từng bài sinh ra, vì `offer_project` đếm mọi dòng dự án sống của mọi bài trong tin. Nên ô
dự án có thêm bước hai, theo tin (phường, phân khu không bị kéo theo):

| Trong một tin | Làm gì |
|---|---|
| hai bài chữ nêu hai dự án khác nhau | bỏ mọi dòng dự án của tin — xung đột của chữ, không phải việc của thẻ |
| đúng một dự án do chữ nêu | chữ thắng trên **cả tin**: bỏ dòng dự án từ thẻ khác giá trị ấy |
| chữ im, thẻ các nhóm trong tin bất đồng | không đoán: bỏ mọi dòng dự án từ thẻ |
| bài khác cùng tin, không được đóng dấu dự án, mang dòng dự án luật khác khác giá trị | bỏ mọi dòng dự án của tin — hàng này chỉ rút dòng luật khác trên bài nó ghi dự án |

Bỏ dòng dự án của một tin nghĩa là bài của tin ấy giữ nguyên dòng DV6 cũ (không bị rút), nên tin ở lại đúng trạng thái
trước hàng này.

Phường và phân khu đi cùng luật: chữ bài trước, thẻ sau, im thì bỏ trống.

**Bán/thuê thì khác, và đây là chỗ dễ làm hỏng nhất.** Cột `kind` hôm nay phủ **100%** (6.637/6.637) nhờ nhánh
`boi-canh-nhom` của `suyLoai` (tên nhóm, hoặc ≥20 bài và ≥85% một loại). Nếu thẻ **thay** nhánh ấy thì mọi nhóm
chưa có thẻ mất `kind` — buổi duyệt ký ba thẻ trên 26 nhóm là hàng nghìn tin rơi khỏi `listings/sale` và
`listings/rent`. Nên ô `purpose` của thẻ **chen vào trước** nhánh cũ, không thay nó:

```
chữ bài  →  purpose của thẻ đã duyệt  →  nhánh boi-canh-nhom (giữ nguyên)  →  bỏ
```

Độ phủ `kind` vì thế chỉ có thể giữ nguyên hoặc tăng, không bao giờ giảm — và hợp đồng đo đúng điều đó (AC-11).

### 2.3 Ghi gì

| ô | đích | lớp · phương pháp | căn cứ |
|---|---|---|---|
| dự án | `field_assertions.project_node_id` | `inferred` · `e1_rule`, rule_id `dia-chi-the-nhom` | `{the: "TN-0xx", ban: <version>, nguon_o: "the"\|"chu_bai"}` |
| phường | `field_assertions.area_id` | như trên | như trên |
| phân khu | `field_assertions.subzone_node_id` | như trên | như trên |
| bán/thuê | **cột** `sale_offer_records.kind` | — (không phải phát biểu) | chen **trước** nhánh `boi-canh-nhom` của `suyLoai`, **không bỏ** nhánh ấy |

`method_version = "dong-dau-dia-chi@1"`. Căn cứ mang **mã thẻ và phiên bản thẻ**, đúng câu giao; muốn dựng lại
bản thẻ lúc đóng dấu thì tra `group_address_card_history` theo `(card_code, version)` — bảng ấy chỉ thêm, không
bao giờ mất bản cũ.

Phường ghi thành **phát biểu**, không ghi đè cột `area_id` mà `ganKhuVuc` đang đặt từ chữ bài: cột là đường cũ của
transform, phát biểu là đường của bộ phân xử (`mappings.yaml:178-183` ghi rõ «Chỉ phát biểu, chưa dựng cột trên tin»).

### 2.4 Sửa thẻ thì tin cũ tính lại

Mỗi lượt nạp, với mỗi nhóm có thẻ sống đã duyệt:

- **rút** dòng sống của rule_id `dia-chi-the-nhom` mà `evidence->>'ban'` **khác** `version` hiện tại của thẻ, lý do
  `the-doi-ban`;
- **chèn** lại theo bản thẻ mới, `WHERE NOT EXISTS` dòng sống cùng (chủ thể, trường, luật, giá trị) — nên chạy lại
  với thẻ không đổi là **0 chèn, 0 rút**.

Không cần nạp bài mới: bước này chạy trên mọi bài của nhóm, nên thẻ sửa lúc 10h thì lượt nạp 11h đã tính lại tin cũ.

### 2.5 Khi DB chưa có bảng thẻ

`transform-zalo.mjs` chạy trên nhiều DB (máy thu, bản chép, DB của lượt test) và **108/109 chưa áp ở đâu cả** —
`to_regclass('public.group_address_cards')` hôm nay trả NULL trên máy thu. Nên bước đóng dấu tự dò: không có bảng,
hoặc không có cột `retired_at`, thì **bỏ bước, in đúng một dòng, thoát 0** — cùng khuôn mà `xep-hang-gia.mjs:54-74`
đã dùng cho view `offer_project` và bảng 106/107.

### 2.6 Bài thử — đường đọc duy nhất

Mọi đường đọc `stg_zalo_posts` của hàng này đi qua `loadStgPosts`. Đây không phải lời nhắc suông: thư viện DV6
(`pipeline/lib/du-an-tren-tin-s03.mjs:171-191`) đọc thẳng `stg_zalo_posts` **không lọc bài thử**, và đúng lớp lỗi
ấy đã làm TG1 mất hai vòng chấm (AC-7, sửa ở commit `1eccf666`). Hợp đồng có một tiêu chí riêng cho nó, với chiều
đỏ: cấy một bài mang dấu thử vào nhóm có thẻ thì bài ấy **không** được đóng dấu.

---

## 3. Quan hệ với lệnh DV6 đang có

`pipeline/scripts/du-an-tren-tin-s03.mjs` ghi hai rule_id (`du-an-nhom-mot-du-an`, `du-an-ten-bai`); nó chạy tay,
không nằm trong chuỗi đêm, và `--ghi` trên máy thu còn chờ lời riêng của Mạnh.

TG2 **rút** dòng sống của hai luật ấy trên đúng những bài nó đóng dấu (lý do `thay-bang-the-nhom`), để một bài
không mang hai giá trị. Hai luật đồng ý với nhau ở 13 nhóm sổ-một-dự-án (ô `du_an` của thẻ lấy thẳng từ sổ khi sổ
ghi đúng một dự án), nên phần lệch chỉ nằm ở nhóm mà người **sửa** thẻ khác sổ — và ở đó người phải thắng.

Giới hạn đã biết: chạy lại lệnh DV6 bằng tay sau đó sẽ ghi lại dòng của hai luật cũ. Gỡ hẳn lệnh ấy nằm ngoài vùng
hàng này (`pipeline/scripts/` không thuộc `vung`) — hàng sau.

---

## 4. Ngoài phạm vi

- Gỡ hoặc đổi `pipeline/scripts/du-an-tren-tin-s03.mjs` (ngoài `vung`).
- Nối phân khu dạng chữ (`block_raw`, 3.509 tin) vào nút `asset_nodes` — cần khớp mã căn, là PL20.
- Ô «bài chỉ ảnh» của bảng phủ ca — không đo được từ `sale_offers` (§1.2).
- Áp 108/109 lên DB máy thu — việc của TG1, đi cùng chữ ký Cổng Bằng chứng của TG1.
- Sync bảng thẻ hay phát biểu mới lên cloud.

## 5. Câu hỏi cho Cổng Phạm vi

- **Hỏi-1 — ngưỡng ô Định vị.** Khuyến nghị **90% tin đang rao**, đo bằng `offer_project.status='mot_du_an'` trên
  mẫu số `sale_offers` nguồn S03. Căn cứ: hiện 81,93% (5.438/6.637); trần cứng 98,9%; ba thẻ của nhóm chưa khai
  mang 554 tin, thừa so với 535 tin còn thiếu. Ngưỡng này **phụ thuộc người duyệt thẻ** — TG2 chỉ bảo đảm mọi thẻ
  đã duyệt đều được đóng dấu; nếu buổi duyệt chỉ ký hai thẻ thì số không tới 90%.
- **Hỏi-2 — thẻ nháp.** Khuyến nghị **không** đóng dấu thẻ `nhap`. Lối khác: đóng dấu nháp với lớp `inferred` rồi
  thay khi người quyết — mở khoá ~758 tin ngay mà không cần ai ngồi duyệt, nhưng đó là bỏ qua người ở đúng chỗ
  hàng TG1 vừa dựng ra để có người.
- **Hỏi-3 — ngưỡng bài lạc dự án.** Thước này kiểm chính tiền đề của hàng («bối cảnh nhóm là mặc định»), nên nó
  cần một **số**, không chỉ một bảng. Khuyến nghị: **cận trên Wilson 95% của tỉ lệ bài lạc ≤ 10%**, cỡ mẫu tối
  thiểu **n = 100 bài**, khai trước khi gắn nhãn. Lối khác: ≤5% thì chắc hơn nhưng cần mẫu lớn hơn và có thể
  không đạt — và nếu không đạt thì kết luận đúng là *không* coi bối cảnh nhóm là mặc định, tức hàng này đổi hướng.
