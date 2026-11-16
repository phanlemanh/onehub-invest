---
schema_version: 1
feature: Transform S03 ghi dự án, phường, phân khu và bán hay thuê từ thẻ địa chỉ của nhóm lên mọi tin ngay ở lượt nạp, thành phát biểu có căn cứ là thẻ nhóm và phiên bản thẻ; chữ bài nêu rõ dự án khác thì chữ bài thắng; sửa thẻ thì tin cũ của nhóm được tính lại
slug: dong-dau-dia-chi-luc-nap
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-16-dong-dau-dia-chi-luc-nap-design.md
---

# Acceptance Contract: dong-dau-dia-chi-luc-nap

## Context

Lát L2 của cặp TG1 ↔ TG2. TG1 (`_acceptance/the-dia-chi-nhom-s03/`, Mạnh duyệt Cổng Phạm vi 16/11) dựng thẻ địa
chỉ nhóm cho người duyệt và ghi thẳng ở Out of scope: «Đóng dấu thẻ lên tin lúc nạp và tính lại tin cũ khi sửa
thẻ (TG2)». Hàng này làm đúng phần ấy.

Căn cứ: ROADMAP §3 mục 51 · DV6 `_acceptance/du-an-tren-tin-s03-tu-nhom-va-ten/` · DV7
`_acceptance/du-an-cua-tin-len-dinh-vi/` (view `offer_project`) · migration 108 + 109 của TG1 (chưa áp ở đâu).
Bảng phủ ca và mọi số đo: design doc §1, đếm trên DB máy thu mốc 2026-11-16T14:34:44Z.

**Không có migration.** Cặp `inferred + e1_rule` đã hợp lệ (`045_phat_bieu_va_phan_xu.sql:84-86`) và ba trường
`project_node_id`, `subzone_node_id`, `area_id` đã mở cho resource `Property` (`096_truong_du_an_tren_tin.sql:12-13`).

**Phép đo chạy trên bản chép DB máy thu đã áp 108 + 109** — hai bảng thẻ hôm nay chưa tồn tại ở đâu
(`to_regclass('public.group_address_cards')` trả NULL trên máy thu).

## Acceptance Criteria

- **AC-1** (ngưỡng) Given bản chép DB máy thu đã áp 108 + 109, có thẻ đã duyệt cho các nhóm của buổi duyệt,
  When chạy lượt nạp rồi đọc `offer_project`, Then **hai thước, in riêng, mỗi thước một mã thoát**:
  - **(a) thước của hàng, không phụ thuộc người**: **100%** tin thuộc nhóm **có thẻ `da_duyet` sống** được đóng
    dấu — lệnh in tử số và mẫu số của riêng tập ấy. Hàng tự bảo đảm được thước này.
  - **(b) thước của mốc, phụ thuộc buổi duyệt**: tỉ lệ tin S03 đang rao có `status='mot_du_an'` trên mẫu số
    `sale_offers WHERE source='S03'` đạt **ngưỡng chốt ở Cổng Phạm vi (đề xuất 90%)**; mốc nền 5.438/6.637 = 81,93%.

  Cả hai in mốc đo và **số đếm theo bài đầu** (`post_ids[1]`) tách khỏi số đếm theo tin.

- **AC-2** (ma trận trạng thái thẻ) Given sáu ô viết trước — `nhap` sống · `da_duyet` sống (lối «nhận») ·
  `da_duyet` sống (lối «sửa») · `bac` sống · `nhap` đã nghỉ · nhóm không có thẻ, When chạy bước đóng dấu,
  Then **chỉ hai ô `da_duyet` sống** sinh phát biểu; bốn ô còn lại sinh **0 dòng**. Chiều đỏ: đổi một ô `bac`
  thành `da_duyet` trong bản sao thì đúng ô ấy sinh dòng, thông điệp ghim tên ô.

- **AC-3** (chữ bài thắng, cross-layer) Given ma trận viết trước phủ chín ô «chữ bài × thẻ» — chữ im · chữ nêu
  cùng dự án · chữ nêu dự án khác, bắt chéo với thẻ một dự án · thẻ nhiều dự án · không thẻ, When chạy bước đóng
  dấu, Then mỗi bài nhận **đúng một hoặc không** dòng `project_node_id`: chữ bài có căn cứ `chu_bai` kèm đoạn
  trích đã kiểm thắng thẻ; thẻ chỉ thắng khi chữ im **và** thẻ có đúng một dự án; thẻ nhiều dự án không sinh dòng
  nào. Chiều đỏ: ô «chữ nêu dự án khác» mà ra dự án của thẻ thì đỏ, thông điệp ghim mã bài và hai giá trị.

- **AC-4** (bốn ô, đúng chỗ) Given một nhóm có thẻ `da_duyet` đủ bốn ô, When chạy bước đóng dấu, Then dự án,
  phường, phân khu ghi thành **phát biểu** `field_assertions` (`project_node_id`, `area_id`, `subzone_node_id`,
  lớp `inferred`, phương pháp `e1_rule`, `rule_id='dia-chi-the-nhom'`, `method_version='dong-dau-dia-chi@1'`),
  còn bán/thuê ghi vào **cột** `sale_offer_records.kind`; mọi dòng phát biểu mang căn cứ
  `{the: '<card_code>', ban: <version>, nguon_o: 'the'|'chu_bai'}`; **cột `area_id` và `phuong_raw` của tin không
  đổi**. Chiều đỏ: bỏ `ban` khỏi căn cứ thì đỏ, thông điệp ghim tên khoá.

- **AC-5** (sửa thẻ, tính lại) Given nhóm đã đóng dấu ở bản thẻ n, và **bản n+1 đổi giá trị ô dự án**, When người
  sửa thẻ rồi chạy lại lượt nạp mà **không** có bài mới, Then **hai tập đếm riêng**:
  - tin của nhóm mà bài **không** có căn cứ chữ bài: dòng mang `evidence->>'ban' = n` bị **rút** (lý do
    `the-doi-ban`) và dòng theo bản n+1 được chèn;
  - tin của nhóm mà bài **có** căn cứ chữ bài: giữ **0 dòng** từ thẻ, trước và sau như nhau (đúng AC-3).

  Chạy lại lần nữa với thẻ không đổi cho **0 chèn, 0 rút**. Thêm một ca **bản n+1 chỉ đổi ô phường**, giá trị ô dự
  án giữ nguyên: dòng `area_id` phải đổi còn dòng `project_node_id` phải được rút rồi chèn lại đúng một lần.
  Chiều đỏ: bỏ bước rút thì ca «chỉ đổi ô phường» đỏ vì nhóm mang hai dòng `area_id` sống cùng lúc.

- **AC-6** (bài thử) Given một bài mang mỗi một trong bốn dấu thử của `pipeline/lib/test-posts.mjs` được cấy vào
  nhóm có thẻ `da_duyet`, When chạy bước đóng dấu, Then **0 dòng** sinh cho bốn bài ấy, và mọi đường đọc
  `stg_zalo_posts` của hàng đi qua `loadStgPosts` (quét tĩnh: 0 câu `FROM stg_zalo_posts` ngoài `loadStgPosts`
  trong tệp của hàng). Chiều đỏ: cấy một bài thử mà nó **được** đóng dấu thì ca đỏ, thông điệp ghim dấu nào.

- **AC-7** (chưa áp 108/109) Given DB **chưa** có `group_address_cards`, hoặc có bảng mà **chưa** có cột
  `retired_at`, When chạy lượt nạp, Then transform **bỏ bước đóng dấu**, in đúng một dòng nói vì sao, **thoát 0**,
  và mọi hành vi khác của `transform-zalo.mjs` không đổi. Chiều đỏ: thoát khác 0 hoặc nuốt lặng thì ca đỏ.

- **AC-8** (không tụt ô Định vị) Given tập tin đang `mot_du_an` trước khi đóng dấu, When chạy lượt nạp trên bản
  chép, Then **0 tin** rơi từ `mot_du_an` sang `xung_dot` hay sang không-có-dòng; lệnh in số tin `xung_dot` trước
  và sau. Mốc nền: S03 hôm nay có **0 dòng** `xung_dot`, nên mọi dòng xung đột sinh ra đều là của hàng này.

- **AC-9** (raw bất biến, dọn dòng cũ) Given `collector/snapshots/` và hai luật DV6 đang có dòng sống,
  When chạy lượt nạp có đóng dấu, Then không tệp nào dưới `collector/snapshots/` đổi (so băm trước/sau), và dòng
  sống của `du-an-nhom-mot-du-an`, `du-an-ten-bai` trên **đúng những bài vừa đóng dấu** được rút với lý do
  `thay-bang-the-nhom`; bài không đóng dấu giữ nguyên dòng cũ.

- **AC-10** (judgment) Given mẫu nhãn người trên bài của nhóm chuyên một dự án, cỡ mẫu **khai trước khi gắn nhãn**
  và không nhỏ hơn mức chốt ở Cổng Phạm vi (đề xuất n = 100 bài), When đo tỉ lệ bài **lạc dự án** (bài thật sự nói
  về dự án khác dự án của nhóm), Then **cận TRÊN của khoảng Wilson 95% ≤ ngưỡng chốt ở Cổng Phạm vi (đề xuất
  10%)**; báo cáo in tỉ lệ, cả hai cận, cỡ mẫu thật, và một câu kết luận bối cảnh nhóm đủ hay chưa đủ làm mặc
  định; người ký đọc được mỗi số lấy từ đâu mà không mở DB. Cận trên vượt ngưỡng là **chưa đạt**, không phải một
  ghi chú.

- **AC-11** (độ phủ bán/thuê không giảm) Given cột `kind` của tin S03 đang phủ 100% (6.637/6.637) nhờ nhánh
  `boi-canh-nhom`, When chạy lượt nạp có đóng dấu trên bản chép, Then **0 tin mất `kind`** — số tin `kind` rỗng
  sau không lớn hơn trước; lệnh in riêng số tin lấy `kind` từ chữ bài, từ thẻ, và từ nhánh cũ. Chiều đỏ: tắt
  nhánh `boi-canh-nhom` trong bản sao thì lệnh thoát 1 và gọi đúng số tin rỗng sinh ra.

## Coverage

Quét theo preset test-matrix; trục và ô lấy từ bảng phủ ca của design doc §1 (số đếm thật trên DB máy thu).

- **Trục A — loại nhóm**: một dự án (4.803 tin) · nhiều dự án (444) · chưa khai (1.318) · ngoài sổ (2) ·
  không nối được nhóm (70). Phủ bởi AC-1, AC-3, AC-8.
- **Trục B — chữ bài**: im (6.408) · nêu cùng dự án nhóm (213) · **nêu dự án khác (13)** · nêu tên ngoài danh bạ (3).
  Phủ bởi AC-3. Ô «nêu dự án khác» quá mỏng để đo bằng tỉ lệ ⇒ chấm bằng ma trận viết trước, không bằng mẫu.
- **Trục C — loại bài**: tin rao · Yêu cầu · *bài chỉ ảnh* · chưa có nhãn (3.143 tin, 47,4%). Phủ bởi AC-3, AC-6.
  Ca kiểm **không được** phụ thuộc `listing_intent` vì nhãn mới phủ 10,7% số bài.
- **Trục D — trạng thái thẻ**: `nhap` · `da_duyet` (nhận) · `da_duyet` (sửa) · `bac` · nghỉ · không thẻ. Phủ bởi AC-2.
- **Trục E — phiên bản thẻ**: bản n · bản n+1 · không đổi. Phủ bởi AC-5.
- **Trục F — DB có/không bảng thẻ**: không bảng · có bảng thiếu `retired_at` · đủ. Phủ bởi AC-7.

**Ô bỏ, kèm lý do**:
- «bài chỉ ảnh» ở cả bốn loại nhóm = **0 tin**, không phải thiếu dữ liệu: bài chỉ ảnh đi nhánh album
  (`pipeline/lib/nhanh-bai-s03.mjs`), không bao giờ nằm trong `post_ids` nên không tin nào có bài đầu chỉ ảnh.
  Ngoài phạm vi, vì đo được ca này phải đi từ `stg_zalo_posts` chứ không từ `sale_offers` — hàng khác.
- «nhiều dự án × Yêu cầu» = 0 và «ngoài sổ × tin rao» = 0: ô trống thật trên dữ liệu hôm nay, không viết ca.

## Đường đo

| Thước | Số từ đâu | AC nào bảo đảm |
|---|---|---|
| Tin thuộc nhóm có thẻ đã duyệt được đóng dấu | tử số và mẫu số của riêng tập nhóm có thẻ `da_duyet` sống | AC-1(a) — **ngưỡng 100%**, hàng tự bảo đảm |
| Ô «Định vị» của S03 trên `/ops/data-flow` | `offer_project WHERE source='S03' AND status='mot_du_an'` / `sale_offers WHERE source='S03'` — cùng câu mà `pipeline/sql/600_data_flow.sql:91,98,113` dùng | AC-1(b) — ngưỡng chốt ở Cổng Phạm vi (đề xuất 90%); phụ thuộc buổi duyệt |
| Số tin rơi khỏi ô Định vị | so tập `mot_du_an` trước và sau lượt nạp trên cùng bản chép | AC-8 — **ngưỡng 0 tin** |
| Độ phủ cột `kind` | số tin `kind` rỗng trước và sau lượt nạp | AC-11 — **ngưỡng 0 tin mất `kind`** |
| Tỉ lệ bài lạc dự án | mẫu nhãn người, cỡ mẫu khai trước (đề xuất n = 100) | AC-10 — **cận TRÊN Wilson 95% ≤ ngưỡng chốt (đề xuất 10%)** |

## Out of scope

- Gỡ hay đổi `pipeline/scripts/du-an-tren-tin-s03.mjs` — ngoài `vung` của hàng. Giới hạn đã biết: chạy lại lệnh ấy
  bằng tay sau khi hàng này gộp sẽ ghi lại dòng của hai luật cũ.
- Nối phân khu dạng chữ (`block_raw`, 3.509 tin = 52,9%) vào nút `asset_nodes` — cần khớp mã căn, là PL20.
- Áp 108 + 109 lên DB máy thu — đi cùng chữ ký Cổng Bằng chứng của TG1, không phải của hàng này.
- Sync phát biểu mới hay bảng thẻ lên cloud.
- Ô «bài chỉ ảnh» của bảng phủ ca (xem Coverage).

## Notes

- Executor key cho các eval dưới đây **chưa có** trong `_acceptance/config.yaml`; lượt S1 này không được ghi tệp
  ấy (phạm vi giám sát giao), nên thêm chúng là việc đầu của S3.
- Hàng đứng trên TG1: phép đo AC-1, AC-5, AC-8 chỉ chạy được sau khi TG1 gộp và bản chép đã áp 108 + 109.
