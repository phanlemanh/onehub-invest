---
schema_version: 1
feature: Dự án, phân khu, toà và mã căn S16 vào danh bạ không sinh toà, căn trùng, và mã căn S16 là neo tin cậy cao nhất khi dựng cây toà → căn
slug: nap-s16-vao-danh-ba
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-11-14
design_doc: docs/superpowers/specs/2026-11-14-nap-s16-vao-danh-ba-design.md
---

# Acceptance Contract: nap-s16-vao-danh-ba

## Context

DA33 là hàng T3 của mốc MN3. Cổng Đáng là «build» theo QĐ7 ngày 14/11 (ROADMAP §3 mục 48, đoạn «Nguồn S16»). S16 là danh mục
do chính chủ đầu tư công bố, gồm 177 dự án, 226 toà và 147.266 cặp (dự án, mã căn) lấy bằng phiên đăng nhập. Mạnh chốt: «Phần
đăng nhập là mã chính từ chủ đầu tư, nên sự tin cậy cao». Danh bạ căn hôm nay có 1.736 căn, đều từ S08, ở hai khu.

Hàng này làm năm việc:

- viết migration 103, gồm bảng stg S16 và nới mã nguồn của bí danh;
- viết hàm dùng chung mà bộ nạp của làn thu gọi;
- thêm bước S16 vào lệnh dựng danh bạ: toà và căn S16 vào năm khu đã nối, S08 thành bí danh của cùng căn;
- sửa bước S08 để không đúc trùng căn đã có từ S16;
- thêm bộ soát để mã đăng nhập không lên cloud.

Thiết kế: `docs/superpowers/specs/2026-11-14-nap-s16-vao-danh-ba-design.md`.

## Criteria

### AC-1 — 103 và hàm dùng chung nạp bản thu không nhân dòng
Given DB của riêng lượt đã áp 001…103 và một fixture tổng hợp viết trước có đủ 11 kind (có một item thiếu sourceId, một kind lạ,
một csv có dòng trùng y hệt),
When nạp fixture qua `dongS16` và các câu chèn của `pipeline/lib/s16-danh-muc.mjs` hai lần,
Then:
- lần một ghi đúng số dòng hợp lệ vào `stg_s16_item`, `stg_s16_khu`, `stg_s16_toa`, `stg_s16_can`, lần hai ghi 0 dòng;
- item hỏng bị bỏ và đếm theo lý do;
- `payload.url` trong stg không còn host;
- áp 103 lần hai không lỗi, lược đồ không đổi;
- một bí danh nguồn `S16` chèn được, nguồn `S1A` vẫn bị từ chối.

### AC-2 — Số trong stg khớp ba bản thu thật
Given DB thử chép từ DB máy thu đã áp 103,
When nạp ba bản thu S16 (pha 1, 2, 3) qua `dongS16`,
Then số dự án, khu, toà, cặp (dự án, mã căn) và nhóm mơ hồ trong stg và view bằng số do một bộ đếm độc lập đọc thẳng snapshot
(không import hàm của hàng). Bộ đếm in bảng hai cột; một ô lệch thì thoát 1 nêu ô.

### AC-3 — Một mã căn, một căn trong S16
Given ma trận viết trước, một ca mỗi ô:
- cùng mã, khác nhãn khu;
- cùng mã, khác hoa thường;
- cùng mã dưới một toà thật và một nhãn gom;
- cùng mã dưới hai toà đều là tiền tố;
- cùng mã dưới hai toà không toà nào là tiền tố,
When gọi hàm chọn toà của căn (cũng là luật của `v_s16_can`),
Then hai ô đầu gộp về một căn, ô ba chọn toà thật, hai ô cuối trả mơ hồ kèm danh sách toà. Mỗi ô một assert.

### AC-4 — Chỉ dự án đã nối vào danh bạ
Given dòng stg tổng hợp của ba dự án S16: hai dự án có trong bảng `NOI_DU_AN_S16`, một không,
When chạy lệnh dựng với `--khu` gồm cả hai khu đã nối,
Then:
- toà, căn chỉ sinh ở hai khu đã nối;
- dự án không nối có 0 dòng danh bạ, và lệnh in số căn bị bỏ của nó;
- bảng `NOI_DU_AN_S16` trong mã đúng bằng bảng năm cặp đã duyệt ở Cổng Phạm vi.

### AC-5 — Toà S16 khớp toà có sẵn hoặc đúc một lần
Given một khu có sẵn toà S08 «S2.08» và dòng stg S16 gồm:
- toà «S2.08» (khớp một);
- toà «SA5» (không khớp, có căn);
- toà nhãn gom «Rainbow» có `toa_id` nhưng 0 căn theo luật tiền tố;
- một toà cùng tên với hai toà có sẵn,
When chạy bước S16,
Then:
- «S2.08» nhận bí danh `ma_nguon` S16 `<du_an>/<toa_id>`, số toà không đổi;
- «SA5» thành đúng một toà mới, bậc theo lời Hỏi-2 (khuyến nghị `xac_minh`), có UPI và nút vùng là phân khu trùng tên hoặc khu;
- «Rainbow» không thành toà, và lệnh đếm nó vào «toà 0 căn»;
- ca khớp hai sinh 0 toà và đúng một thẻ `entity_match`;
- evidence của thẻ không chứa mã căn, `toa_id` hay tên toà S16 (chỉ khoá vật thể và `s16_ref`);
- đếm toà hai UPI bằng 0;
- `toa_id` làm bí danh của hai toà bằng 0.

### AC-6 — Căn S08 trùng mã thành bí danh, lệch thì lên thẻ
Given một khu có căn S08 «S2.081101» ở toà «S2.08», và dòng stg S16 gồm:
- cùng mã, cùng toà;
- một mã S08 khác mà S16 xếp ở toà khác;
- một mã mới tách được;
- một mã lô không tách được,
When chạy bước S16,
Then:
- căn S08 nhận bí danh S16 và không có căn mới;
- ca lệch toà sinh 0 căn và đúng một thẻ nêu hai toà;
- mã mới thành căn có trục và tầng đúng;
- mã lô thành căn không trục (`stack_key` NULL, `sub_id = unit_key`);
- mã S16 làm bí danh hai căn bằng 0;
- căn có hai bí danh S16 bằng 0.

### AC-7 — Thứ tự S08, S16 không đổi tập căn
Given cùng một bộ dòng S08 và S16 tổng hợp có mã chung, trong đó ít nhất một mã chung mà hai nguồn xếp khác toà,
When dựng trên hai DB riêng: một DB dựng S08 rồi S16, một DB dựng S16 trước rồi nạp thêm dòng S08 và dựng lại,
Then:
- hai DB có cùng tập (mã nguồn → số căn, có bí danh S16 hay không, số thẻ) cho mọi mã chung;
- mã chung cùng toà: đúng một căn, mang cả bí danh S08 lẫn S16;
- mã chung khác toà: cả hai DB đều ra một căn S08 không bí danh S16 hoặc một căn S16 không bí danh S08 theo thứ tự đúc, không căn thứ hai, và đúng một thẻ nêu hai toà.

Chiều đỏ: bỏ bước tra bí danh S16 trong bước S08 thì DB thứ hai có căn trùng; bỏ kiểm toà trong bước S08 thì DB thứ hai gắn bí danh lệch toà và 0 thẻ.

### AC-8 — Dựng lại không sinh gì
Given DB đã dựng S16 một lần,
When dựng thêm hai lần,
Then lần hai và lần ba sinh 0 toà, trục, căn, bí danh và thẻ mới; băm tập `(unit_key, building_key, stack_key, floor)` bằng nhau
cả ba lần.

### AC-9 — Mã đăng nhập không rời máy
Given `sync-cloud.mjs` và DB thử có `stg_s16_*`,
When:
- (a) thêm `stg_s16_can` hoặc `units` vào danh sách đẩy;
- (b) cấy vào một dòng `asset_nodes` một mã căn S16;
- (c) cấy vào một dòng `asset_nodes` một `toa_id` S16;
- (d) cấy một mã căn S16 vào bảng khác trong danh sách đẩy;
- (e) cấy một `toa_id` S16 vào evidence một thẻ rồi gọi `soatS16`,
Then:
- cả năm ca đỏ: bốn ca đầu dừng trước khi gửi, thoát khác 0, nêu bảng và cột; ca (e) `soatS16` trả lỗi nêu đường của giá trị; không ca nào in giá trị;
- payload sạch thì bộ soát xanh;
- tên thật của nguồn không xuất hiện trong mọi tệp hàng này thêm hay đổi; chỉ tệp kê local được phép mang nó.

### AC-10 — Danh bạ dựng từ dữ liệu thật đúng số
Given DB thử chép từ DB máy thu, đã áp 103 và đã nạp ba bản thu,
When dựng danh bạ cho năm khu đã nối,
Then:
- in bảng theo khu: toà S16 nối có sẵn, toà mới, toà 0 căn không đúc, căn S16, căn S08 nhận bí danh S16, thẻ;
- in bảng số căn theo từng toà mới (tên đã che) và số toà mới có dưới 10 căn;
- ở GP và OP1, mỗi mã S08 có trong dự án S16 (1.283 và 153, đo 14/11) rơi vào đúng một trong bốn phần, mỗi phần đếm bằng một SELECT riêng: căn S08 nhận bí danh S16 · thẻ lệch toà · mã thuộc căn mơ hồ · căn thuộc toà S16 đã ra thẻ (khớp nhiều toà, AC-5); tổng bốn phần bằng số mã S08 có trong S16 (đếm lại lúc chạy);
- 0 thẻ S16 có evidence mang token S16; sync-cloud chạy thử (không gửi) trên DB thử sau khi dựng: 0 token S16 trong mọi bảng sẽ đẩy;
- toà hai UPI bằng 0, mã hai căn bằng 0;
- chạy lại ra cùng số và 0 khoá mới.

## Coverage

Trục quét theo preset entity-feature và risk-premortem cho «mã căn S16 → căn danh bạ»:

- Dữ liệu vào:
  - đủ 11 kind (AC-1);
  - số khớp bản thu (AC-2);
  - trùng mã và nhãn gom (AC-3).
- Cấp danh bạ:
  - dự án qua bảng nối (AC-4);
  - toà (AC-5);
  - trục, tầng, căn (AC-6).
- Quan hệ với nguồn khác:
  - S08 trùng mã (AC-6);
  - thứ tự S08 và S16 (AC-7);
  - S03 chỉ là ứng viên toà, khớp qua bí danh tên (thiết kế §5.5, không AC riêng).
- Vòng đời:
  - dựng lại (AC-8);
  - dữ liệu thật (AC-10).
- Ranh giới: không rời máy, tầng A (AC-9).

Core: AC-1…AC-10.

Later:
- tin rao S16 thành tin và căn;
- giá chủ đầu tư;
- nút cho chín dự án chưa có nút;
- nút phân khu mới từ S16;
- 47 toà khép một phần.

Never: S16 tự xoá hay gộp căn có sẵn; toà và căn chỉ thêm.

## Đường đo

Ngưỡng ở `opportunity.md` (dòng `bat_khi` của hàng) đo như sau:

- «Số dự án, phân khu, toà, mã căn trong stg khớp manifest bản thu»: AC-2 đo bằng một bộ đếm độc lập đọc thẳng snapshot,
  thay cho so với manifest. E2 in thêm con số của tệp kê cạnh số đếm. Tệp kê ghi 147.268, đếm thẳng 14/11 ra 147.266.
- «0 toà hai UPI, 0 căn hai khoá» và «căn S08 trùng mã căn S16 thành bí danh» đo ở AC-10, trên DB thử chép máy thu.
- «Bằng bộ nạp của làn thu theo DATA-CONTRACT có schemaVersion mới» đo ngoài hàng này, ở bước tích hợp bộ nạp
  `import-s16*`: chạy bộ nạp trên ba bản thu, so số stg với số E2 in, và kiểm `schemaVersion` của DATA-CONTRACT đã tăng
  lên 12.
- «Lệch thì lên thẻ» đo ở AC-6. «Cây toà → căn lấy mã S16 làm khoá và S08 thành bí danh» đo ở AC-6 và AC-7.
- «Mã căn lấy bằng đăng nhập không rời máy» và «mọi thứ rời máy chỉ mang mã S16» đo ở AC-9.
- «Chạy lại không đổi khoá» đo ở AC-8 và AC-10.
- Số trên chính DB máy thu đo sau khi Mạnh cho áp 103, bằng lệnh của AC-10 trỏ vào DB máy thu ở chế độ chỉ đọc số.

## Out of scope

- Áp 103 và chạy dựng trên DB máy thu: cần lời riêng của Mạnh sau khi gộp.
- Thêm dòng S16 vào `source_registry` local: bước triển khai, ghi DB máy thu cần lời Mạnh.
- Bộ nạp `pipeline/import-s16*`: làn thu viết, dùng hàm của hàng này.
- Tin rao S16 thành tin, căn hay giá, và giá chủ đầu tư, quỹ căn S16: hàng sau.
- Chín dự án S16 chưa có nút: chờ thẻ luật theo nguồn (DA3, DA18).
- Nút phân khu mới từ S16: cần lời Mạnh rằng mục 38 áp cho phần công khai của S16.
- Chưa có lời, nên mặc định chỉ nội bộ: hiện mã căn lấy bằng đăng nhập và tin rao S16 lên Invest hay API công khai; thu định kỳ
  bằng phiên đăng nhập.
- 47 toà khép một phần (khoảng 11.868 căn): giữ số đã có.
- Gắn tin → căn theo thứ tự tin cậy S16 > S08 > S03 (GC0–GC3).

## Notes
- Số migration 103 theo lời giao của giám sát.
- Lời giao nói «8 kind»; ba bản thu đo được 11 kind (thiết kế §2). Hợp đồng dữ liệu cần sửa chữ này khi duyệt.
- TẠM DỪNG 14/11 theo lời giám sát đợt (hạn mức tuần): cuối S3, mã xong; lượt đo thật E2 khớp từng ô, E10 xanh 14/11 (bốn phần khớp: GP 1.282 = 1.280 + 2 + 0 + 0, OP1 153 = 117 + 0 + 0 + 36; mã S08 chưa thành căn in riêng: GP 1, OP1 10; dựng lại 0 khoá mới). Lệnh kế khi GS báo: chạy lại `node pipeline/scripts/danh-ba-s16-that.mjs` (thoát 0), đặt contract `status: implemented`, rồi `/feature-loop:feature-loop nap-s16-vao-danh-ba` vào S4.
