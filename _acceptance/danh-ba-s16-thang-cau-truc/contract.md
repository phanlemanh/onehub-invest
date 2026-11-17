---
schema_version: 1
feature: Ở các dự án có S16, toà S16 vào phân khu của khu chủ đầu tư công bố trên cây danh bạ, S16 thắng về cấu trúc và lệch cấu trúc của nguồn khác thành số đếm thay vì thẻ
slug: danh-ba-s16-thang-cau-truc
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-18
design_doc: docs/superpowers/specs/2026-11-17-danh-ba-s16-thang-cau-truc-design.md
---

# Acceptance Contract: danh-ba-s16-thang-cau-truc

## Context

DA37 là hàng nối tiếp DA33 (đã gộp #476 và áp lên DB máy thu 17/11 15:06Z). Cổng Đáng là «build» theo lời Mạnh «Theo khuyến
nghị cả ba câu» 07:57Z 17/11 (ROADMAP §3 mục 54, Q-B và Q-C; mô hình danh bạ §1.3, §1.3a sửa cùng ngày). Sau DA33, 218 toà mang
bí danh S16 ở năm dự án; 109 toà mới treo thẳng dưới dự án vì luật xếp phân khu lúc đúc chỉ xét nút `building` khớp tên. Cột gốc
`buildings.region_node_id` không đổi được (rào chỉ-thêm 082), nên phân khu hiệu lực đi qua view `v_toa_nut_vung` (097).

Hàng này làm năm việc:

- migration 111 mở rộng `v_toa_nut_vung`: tầng S16 xếp trên S09, toà vào phân khu qua khu S16 của nó;
- lệnh thẻ luật phân khu S16 (dựng thẻ chỉ đọc kèm băm · áp theo băm kèm tên người · đảo), theo khuôn thẻ luật DA32;
- bước S16 của lệnh dựng: căn S08 cùng mã nằm ở toà khác → S16 thắng, căn S08 gộp vào căn S16, thẻ lệch cũ cho nghỉ;
- số lệch cấu trúc theo cặp nguồn thành một view đếm, không ra thẻ từng cái;
- hai mục Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng DA33, gom vào đây: job đêm (Ngoài-6) và đường lùi gặp khẳng định
  (Ngoài-5).

Thiết kế: `docs/superpowers/specs/2026-11-17-danh-ba-s16-thang-cau-truc-design.md`.

## Criteria

### AC-1 — 111 thêm tầng S16 mà không đổi toà không có S16
Given DB của riêng lượt đã áp 001…110 và fixture có toà chỉ S09, toà chỉ gốc, toà có cả S09 và S16,
When áp 111 hai lần,
Then:
- lần hai không lỗi, định nghĩa view không đổi;
- với mọi toà KHÔNG mang bí danh S16, view 111 trả đúng các dòng view 097 trả (`EXCEPT ALL` hai chiều 0 dòng);
- cột `nguon` nhận thêm giá trị `s16_phan_khu`; `region_node_id_goc` vẫn là cột gốc;
- áp lại phần view của 097 trả view về định nghĩa cũ (đường lùi của 111).

### AC-2 — Khu của toà S16 lấy từ bản thu có danh sách khu
Given `stg_s16_toa` có toà ở hai bản thu, một bản kèm danh sách khu (`stg_s16_khu`) và một bản không,
When view đọc khu của toà,
Then:
- khu lấy từ bản thu mà `khu_id` có trong `stg_s16_khu` của cùng bản;
- toà có hai khu khác nhau trong các bản có danh sách khu → không vào tầng S16 (giữ tầng dưới), và được đếm;
- trên dữ liệu thật: 218/218 toà mang bí danh S16 có đúng một khu.

### AC-3 — Thẻ luật phân khu S16: xem, áp theo băm, đảo
Given năm dự án S16 đã nối và danh sách khu S16 của chúng,
When chạy lệnh thẻ luật phân khu S16 ở ba chế độ,
Then:
- `--the` chỉ đọc: theo từng dự án in khu → nút sẵn trùng tên (thành bí danh) hay nút mới, số toà, mẫu; không in mã đăng nhập,
  `toa_id`, `khu_id` hay tên nguồn thật; dòng cuối là băm;
- `--ap --bam <băm> --nguoi <tên>`: băm khớp → mỗi khu đúng một nút `subzone` cha là dự án (đúc mới, hoặc nút sẵn trùng tên chuẩn
  hoá nhận khu S16), một dòng `project_link_rules` nguồn `S16`; băm lệch → 0 dòng ghi;
- áp lại cùng băm → 0 nút mới;
- `--dao <id> --nguoi <tên>`: khu S16 rời mọi nút của dòng luật, view trả toà về tầng dưới; dòng luật ghi người và giờ đảo.

### AC-4 — Phân khu hiệu lực chỉ đổi sau thẻ luật, rồi S16 thắng S09
Given DB đã áp 111 và có toà mang cả S09 lẫn S16,
When đọc `v_toa_nut_vung` trước và sau khi áp thẻ luật,
Then:
- trước áp: 0 dòng `nguon = 's16_phan_khu'`;
- sau áp: toà mang bí danh S16 có `region_node_id` là nút phân khu của khu S16 của nó, kể cả khi S09 cũng xếp nó;
- trên bản chép DB máy thu sau áp thẻ luật: số toà mang bí danh S16 có nút vùng hiệu lực là nút dự án = 0 ở cả năm dự án.

### AC-5 — Căn S08 lệch toà: S16 thắng, không thẻ mới
Given căn S08 mã X ở toà A và căn S16 mã X ở toà B ≠ A, cùng dự án,
When dựng (S08 trước rồi S16, và S16 trước rồi S08, trên hai DB),
Then:
- căn mã X sống đúng một (status `active`), ở toà B, mang bí danh S16;
- căn S08 cũ status `merged`, `merged_into` trỏ căn sống, bí danh S08 giữ trên nó;
- 0 thẻ `can-lech-toa` mới; thẻ `can-lech-toa` đang `pending` của mã ấy chuyển `rejected` kèm ghi chú «S16 thắng cấu trúc»;
- hai thứ tự cho cùng tập (mã → căn sống, bí danh, thẻ).

### AC-6 — Lệch cấu trúc thành số đếm theo cặp nguồn
Given toà và căn có S16 cùng S08 hoặc S09 nói khác về toà, căn thuộc toà, toà thuộc phân khu,
When đọc view đếm lệch cấu trúc,
Then:
- mỗi dòng là (dự án, cặp nguồn, loại lệch, số);
- lệch cấu trúc ở dự án có S16 không sinh thẻ mới;
- trên dữ liệu thật in bảng theo dự án; không in mã căn hay tên nguồn thật;
- có ca lệch tên toà (S08/S09 gọi khác tên S16) trong bảng kỳ vọng;
- đối chứng dương: cùng loại lệch cấu trúc ở dự án KHÔNG có S16 vẫn ra thẻ như luật 1 (đúng một thẻ).

### AC-7 — Rào chỉ-thêm giữ nguyên, dựng lại không sinh gì
Given DB sau AC-3 và AC-5,
When dựng lại hai lần,
Then 0 dòng `buildings` đổi `region_node_id`, 0 khoá toà/trục/căn mới, 0 thẻ mới; thẻ «một mã căn dưới nhiều toà» và «toà S16
trùng tên» không đổi trạng thái.

### AC-8 — Job đêm khai rõ khu và để lại mốc
Given DB có năm khu đã có toà,
When chạy bước vật thể của job đêm (`buocVatTheDem`),
Then:
- tập khu dựng = các khu đã có toà, gồm cả Ocean Park 2, Ocean Park 3, Smart City (assert đủ năm slug);
- lệnh in một dòng mốc giao dịch và số khoá mới của bước S16, để lượt đêm lùi được bằng tệp khoá;
- chiều đỏ: bỏ một khu khỏi tập → ca đỏ nêu slug.

### AC-9 — Đường lùi có đích xử được khẳng định
Given lượt dựng đã ghi khẳng định (`field_assertions`) và căn S08 đã gộp ở AC-5,
When chạy đường lùi có đích của hàng này trên bản chép,
Then khẳng định của lượt được rút (`retracted_at` + lý do), không xoá; căn S08 trở lại `active`, `merged_into` rỗng; căn S16 mới
của lượt gỡ được; thẻ `can-lech-toa` lượt đã cho nghỉ trở lại `pending` với ghi chú cũ; dấu vân tay gồm lược đồ `public` và số
dòng + băm nội dung của `buildings`, `stacks`, `units`, `registry_aliases`, `review_queue`, `field_assertions` (trừ hai cột rút),
`v_toa_nut_vung` trùng bản trước áp; phần dư được phép và được đếm: nút phân khu do luật đúc mang `meta.nghi = true`, dòng
`project_link_rules` có `dao_at`; tệp khoá thiếu dòng `# db` hay của DB khác → từ chối.

### AC-10 — Chuỗi áp trên dữ liệu thật đúng số
Given bản chép DB máy thu sau DA33,
When áp 111, áp thẻ luật với băm của `--the`, dựng năm khu,
Then in bảng theo dự án và so từng ô với bảng kỳ vọng viết trước (số đo 17/11 trên DB máy thu sau DA33):

| Ô | Kỳ vọng |
|---|---|
| Khu S16 trong danh sách | 61 (GP 12, OP1 16, OP2 13, OP3 9, Smart City 11) |
| Nút phân khu mới + nút sẵn nhận khu | = 61 (mỗi khu đúng một nút) |
| Toà mang bí danh S16 có nút vùng là dự án | trước 109 → sau 0 |
| Căn S08 chuyển `merged` | 2 |
| Thẻ `can-lech-toa` chuyển `rejected` | 2 |
| Thẻ `can-mo-ho` / `toa-trung-ten` còn `pending` | 38 / 20 |
| Dòng `buildings` đổi `region_node_id` | 0 |
| Dựng lần hai: khoá mới | 0 |

Lệch một ô (±1) → thoát 1 nêu ô.

## Coverage

Trục (quét bằng morphological-scan, preset entity-feature):
- Thuộc tính cấu trúc × nguồn: toà có trong dự án · căn thuộc toà · toà thuộc phân khu · phân khu có trong dự án × (S16, S08, S09,
  tin S03) — AC-4, AC-5, AC-6; tin S03 ngoài vòng (Out of scope).
- Thời điểm: trước thẻ luật · sau áp · sau đảo — AC-3, AC-4.
- Thứ tự nguồn: S08 trước / S16 trước — AC-5.
- Đường chạy: lệnh tay · job đêm — AC-7, AC-8.
- Lùi: view (AC-1) · thẻ luật (AC-3) · lượt dựng (AC-9).
- Dữ liệu: fixture (AC-1…AC-9) · bản chép thật (AC-2, AC-4, AC-10).

## Đường đo

| Thước (ô cơ hội) | Số từ đâu | AC bảo đảm |
|---|---|---|
| Toà S16 treo thẳng dưới dự án → 0 | `v_toa_nut_vung` trên bản chép | AC-4, AC-10 |
| 2 thẻ lệch S08 ↔ S16 cho nghỉ | `review_queue` loại `can-lech-toa` | AC-5, AC-10 |
| Số lệch cấu trúc theo cặp nguồn | view đếm lệch | AC-6, AC-10 |
| Nút phân khu S16 chỉ nhận toà sau thẻ luật | `v_toa_nut_vung` trước/sau áp | AC-4 |
| 0 dòng buildings đổi region_node_id | băm cột gốc trước/sau | AC-7 |

## Out of scope

- Dự án con từ hậu tố khu S08 (Q-A) — hàng riêng.
- Trang `/ops/registry` đọc phân khu hiệu lực và hiện số lệch — hàng N1 (danh-ba-toa-theo-phan-khu-hieu-luc) đọc view của hàng này.
- Bộ nạp S16 kiểm sha256/schemaVersion (Ngoài-2 DA33) — làn ZCode.
- 38 thẻ «một mã căn dưới nhiều toà» và 20 thẻ «toà S16 trùng tên» — không thuộc Q-B, giữ chờ người (Hỏi ở Cổng Phạm vi).
- Lệch giá, pháp lý, chủ đầu tư, tiến độ — vẫn lên thẻ như luật 1; hàng này không đụng.
- Tin S03 làm nguồn cấu trúc; nút dự án Hà Nội còn thiếu; bảng nối S09.

## Notes
- Số migration 111 do GS giữ sẵn (17/11).
- Áp lên DB máy thu: hồ sơ áp riêng của hàng này; áp thẻ luật là lời riêng của Mạnh («Áp thẻ luật S16 <băm>»), như DA32.
- Số neo sau DA33 áp (17/11 15:06Z): toà 307, căn 111.668, 109 toà S16 mới treo dưới dự án (cột gốc), 60 thẻ S16 = 38 mơ hồ + 20
  trùng tên + 2 lệch toà, 19 toà có hai `khu_id` nếu đọc từ bản thu không kèm danh sách khu; migration 111 giữ sẵn.
- Không đếm trùng với DA36 (N1): N1 đếm toà treo thẳng dưới dự án 163 (cột gốc) → 123 (view), trong đó 109 là toà S16 — phần 109
  này thuộc hàng này; DA36 đếm phần còn lại.
- Nhận diện thẻ cho hàng U2 (the-danh-ba-hien-o-hang-duyet): hàng này KHÔNG đúc loại thẻ mới. Thẻ S16 nó chạm (cho nghỉ 2 thẻ
  `can-lech-toa`) giữ `item_type = 'entity_match'` (ràng buộc cột chỉ nhận `entity_match`, `source_decision`, `agent_output`,
  `data_quality` — đo 17/11), `item_id` dạng `s16:%`, loại ở `evidence->>'loai'`. Hàng U2 nhận diện thẻ danh bạ S16 bằng một vị từ
  `item_id LIKE 's16:%'`.
- Hàng này không hứa thẻ hiện trên `/ops/review`: mọi AC đo trạng thái thẻ trong `review_queue`, không đo trang — trang ẩn mọi
  thẻ `entity_match` đang chờ theo quyết định đóng băng V7 (08/11); hiện thẻ danh bạ là hàng U2.
- Ca app GS-AC-6 đỏ sẵn trên main sau DA33 (probe đếm nhầm 60 thẻ S16) — N1 sửa, không thuộc hàng này.
