---
schema_version: 1
feature: Vá hẹp bộ đọc tin S03 (diện tích, phòng ngủ, phường theo hướng, số ngữ cảnh, thuê từ 1 tỷ, giá che số, giá không đơn vị) và lưu toà, trục qua phát biểu có sẵn
slug: s03-va-doc-tin
owner: phanlemanh@gmail.com
risk_tier: T2      # máy suy: pipeline/transform-zalo.mjs, pipeline/lib/assert.mjs — không khớp t3_paths
surfaces: [cli]
status: signed-off
approved_by: Mạnh
approved_at: 2026-11-02
design_doc: docs/superpowers/specs/2026-11-02-s03-va-doc-tin-design.md
---

# Acceptance Contract: s03-va-doc-tin

## Context

Audit S03 02/11 (`docs/research/s03-audit-trich-xuat-0211.md`): 43% ô hỏng do bộ đọc, 33% đọc được mà không lưu. Mạnh chốt
«Chọn làm hết», hai PR tách nhau; hàng này là PR không migration. `parsePost` dùng chung nên S05 đi cùng.
Nhãn dùng để đo do tác tử gắn, không phải nhãn vàng.

## Acceptance criteria

- AC-1: Given ma trận viết trước gồm diện tích có phẩy («45,7m2», «31,9 m²», «DT: 68,5m2») và dạng đã đúng («65m²», «43.2m2»,
  «43.2m»; «1.234m2» giữ đúng 1,234 như bản nền), When `parsePost` đọc, Then mỗi dòng ra đúng số của đáp án.
- AC-2: Given ma trận viết trước gồm phòng ngủ viết tắt («2N», «1N+», «2n1wc», «3n2vs», «2 ngủ», «1+», «studio» ra 0), dạng cũ
  («2PN», «3PN», «2 phòng ngủ») và các dòng không phải phòng («2 năm», «3 nữ», «5 ngày», «1 ngõ», «2 nhà», «1+1»), When
  `parsePost` đọc, Then dòng viết tắt và dạng cũ ra đúng số, dòng không phải phòng ra null.
- AC-3: Given chữ có hướng («hướng Tây Nam», «BC Tây Nam», «Tây Nam thoáng») và chữ gọi đích danh («phường Tây Nam», «P. Tây
  Nam», «xã Tây Nam»), When `matchPhuongThiTruong` đối chiếu danh sách có phường Tây Nam, Then dòng hướng ra null, dòng đích danh
  ra đúng phường; phường khác không trùng hướng vẫn khớp.
- AC-4: Given danh sách đóng từ ngữ cảnh (cắt, lỗ, lõm, âm, giảm, hạ, chênh, lời, đã vào, đã đóng, đã thanh toán, vay, cọc, vốn,
  trả trước, gốc, tiến độ, bớt, hỗ trợ, chiết khấu, dòng tiền, thu nhập, lãi, tài chính, ngân sách, tc, ttc, tts, htls), mỗi từ
  một dòng, và các dòng kèm giá thật, When `parsePost` đọc, Then chữ chỉ có số ngữ cảnh ra null; giá thật ra đúng khi có; nhãn
  «giá …» thắng số đứng trước nó; «giá vốn 1,4 tỷ» ra null; «giảm còn 2,5 tỷ» và «chỉ hơn 8 tỷ» là giá; «cắt lỗ 2,9 tỷ» một mình ra
  null vì cùng dạng với «cắt lỗ 1 tỷ» (thà thiếu giá hơn ghi sai); «không vay», «ko vay», «chưa vay», «bán vay» không phải số ngữ cảnh nên
  «ko vay 2ty1», «bán vay full 2.350ty» ra đúng giá; giá viết đủ số đồng theo cùng luật: «cắt 450.000.000», «vay 1.400.000.000» ra null,
  «vay 1.400.000.000 giá 3.200.000.000» ra 3,2 tỷ.
- AC-5: Given bài `rent_lt` giá từ 1 tỷ không đơn vị thời gian (kể cả đúng 1 tỷ), bài có đơn vị tháng gắn với số khác («đang cho thuê 7tr/tháng.
  Giá bán: 2,7 tỷ»), «1 tỷ/tháng», «1 tỷ/th», «1,2 tỷ/năm», «1,2 tỷ mỗi năm», «1,2 tỷ 1 năm», và bán trên 100 tỷ, When chạy transform trên DB thử
  (ROLLBACK), Then bài không đơn vị và bài có đơn vị gắn số khác thành tin bán đúng giá; các bài sau không thành tin và đếm đúng lý do
  `thue-tu-1-ty`, `ban-tren-100-ty`. (cross-layer)
- AC-6: Given giá che số có đơn vị hoặc nhãn («4.9xx tỷ», «2,3xx tỷ», «giá 36xx», «1.8x tỷ», «3,2** tỷ», «1.9x thu về», «18XX tỷ»,
  «37xx thu nét») và dạng gần giống («2.9 tỷ», «PR6xx20», «Căn 36xx», «Tầng 36xx»), When `parsePost` đọc, Then che số ra số sàn;
  chữ không che không đổi; mã căn và số che không nhãn, không đơn vị ra null. Luật này không đi sau công tắc.
- AC-7: Given giá không đơn vị có nhãn «giá …» ngay trước hoặc «net, nét, thu về, thu nét, btp, bao thuế, allin» ngay sau («Giá: 4100»,
  «Giá: 4.1 thu nét», «1900 btp», «Giá 2.6 allin», tin thuê «Giá 12000» là 12 triệu, «Giá 8.5» là 8,5 triệu) và số không phải giá
  («Bán căn 2PN 2800», «2.65» không nhãn, năm, «1200» trong mã), When `parsePost` đọc, Then mặc định công tắc `giaKhongDonVi` bật:
  ra đúng đáp án, số không phải giá ra null; khi tắt dạng mới ra null, luật cũ của bản nền («Giá: 2.800» ở tin bán) không đổi.
- AC-8: Given bài một mã, nhiều mã cùng toà, nhiều mã khác toà, chỉ toà, toà có đuôi số («S1.03» là tên toà), toà ghi riêng hoặc toà có đuôi số kèm mã toà khác
  («toà S902 và S101», «toà GH2 và toà GH3»), mã bốn phần («S1.03.12.05», «S5.03-22.06», «S605.10.17»), mã nội bộ của sàn
  («S115451», «NTL22688») và không mã; hai bài khác trục cùng nội dung, cả nhánh đủ phường + DT; một tin đã có `offer_id` dính
  chung hai bài khác trục; bài có mã và bài đăng lại thiếu mã; `block_raw` của LLM khác parser, và LLM có mà parser không có; When
  chạy transform trên DB thử (ROLLBACK) rồi đọc phát biểu và tin, Then bài một mã có phát biểu `block_raw`, `unit_number` (`parser`)
  giữ nguyên chữ môi giới và tin mang đúng cặp đó; nhiều mã không có `unit_number`, toà chỉ giữ khi mọi mã cùng toà; toà có đuôi số
  và chỉ toà chỉ có `block_raw`; bài có toà ghi riêng kèm mã toà khác không có `block_raw`; mã bốn phần giữ nguyên cả mã làm `unit_number`, toà là phần
  trước tầng («S1.03», «S5.03», «S605»), hai mã bốn phần khác nhau không có `unit_number`; mã nội bộ và không mã không có dòng; hai trục ra hai tin và mỗi `offer_id` chỉ một `unit_number`;
  bài có mã và bài thiếu mã giữ hai tin (không chứng được cùng căn); parser thắng LLM khi khác, LLM được giữ khi parser không đọc
  ra; nạp lại không nhân dòng. (cross-layer)
- AC-9: Given tập nhãn audit ghim bằng sha256 và toàn bộ bài S03 thật (chỉ đọc), When chạy phép đo với công tắc ở mặc định, Then
  phòng ngủ đúng ≥ 90% toàn tập và ≥ 85% phần giữ lại; 0 bài thật đọc sai diện tích do dấu phẩy; 0 bài thật đọc phường từ hướng;
  giá đúng của bản cây không thấp hơn bản nền, toàn tập và từng họ; công tắc bật không làm giá đúng thấp hơn tắt, toàn tập và từng
  họ, không tăng tin bán dưới 300 triệu, và số giá đúng bật khác tắt; số ô bản nền đúng nay sai ≤ 3; mã căn đúng ≥ 70%, thừa ≤ 10%;
  0 tin mang hai trục; 0 bài thật có giá từ 1 tỷ ở bản nền mất giá vì «không vay» (bài ghi «tài chính», «Tc» mất giá theo AC-4, không tính); 0 bài thật
  đang thành tin bị gạt là thuê từ 1 tỷ; nghỉ ≤ 200, mọc do bộ đọc ≤ 500 (tin bản cây sinh ra mà bản nền chạy trên cùng dữ liệu không sinh), S05 đổi ≤ 25% (trần do Hỏi-1, Mạnh duyệt đổi cách đo mọc
  ngày 02/11 vì kho có bài mới mỗi ngày); không có migration mới; bộ test pipeline xanh; ca DB của hồ sơ đã ký `s03-cam-mau-so-lieu` vẫn xanh, thước `hcm_sai_thi_truong` của hồ sơ đó bằng 0 sau khi
  bỏ tên phường trùng hướng nhà («Tây Nam»); thước `gom_qua_10_nhieu_nguoi` = 1 đã đỏ từ bản nền do dữ liệu mới nên không tính ở hàng này. Bản nền
  ghim sha chạy cùng thước phải trượt `pn`, `dt_phay`, `phuong_huong`. Phép đo in đường tập, sha256, cách chia, sha nền, trạng
  thái công tắc, mẫu số từng thước, số tin, `offer_id` giữ, nghỉ, tổng mọc, mọc do bộ đọc, mọc do bài mới, bài đổi loại, ô `block_raw` thêm và đổi, số bài S05 đổi;
  không in chữ bài. (cross-layer)

### Cách tính thước AC-9

Chỉ tính bài nhãn `intent = offer`. Mẫu số một trường = bài mà nhãn có giá trị trường đó (null gặp null không tính). Giá đúng: lệch ≤ 2%;
nhãn giá che (`price_low`–`price_high`) đúng khi giá nằm trong [low × 0,98; high × 1,02]. Diện tích lệch ≤ 5%. Phòng ngủ bằng. Mã căn đúng:
hai chuỗi bỏ dấu câu, viết hoa, chứa nhau; mẫu số là bài nhãn có `unit_code`. Thừa: bài nhãn không có `unit_code` mà đọc ra trục. Phần giữ lại:
8 hex đầu của sha1(`post_id`) chia 3 dư 0, không muối. Họ theo tên nhóm: `grand-park`, `ocean-park`, `smart-city` theo bảng `HO` trong phép đo,
còn lại `khac`; bảng đóng cùng hợp đồng này.

### Nhánh bỏ giá không đơn vị

Nếu AC-9 trượt `gia_kdv_khong_tut`: bỏ công tắc và dạng mới khỏi hàng, ghi dòng sổ `descope`, sửa AC-7, E7 và thước tương ứng, trình lại Cổng Phạm
vi, báo điều phối. Không hạ ngưỡng.

## Coverage

- Trục A, bảy lỗi đọc theo câu giao hàng SV1: DT · PN · phường · số ngữ cảnh · thuê ≥ 1 tỷ · giá che · giá không đơn vị [AC-1…AC-7]
- Trục B, chiều: đọc đúng dạng lỗi | không đọc nhầm dạng gần giống | dạng cũ không lùi [mỗi ma trận AC-1…AC-7 có đủ ba]
- Trục C, đường sau đọc: chốt khoảng giá [AC-5] · phát biểu và phân xử [AC-8] · khoá gom và khoá dính [AC-8; đếm trên bài thật ở AC-9] · S05 dùng chung [AC-9, có trần]
- Trục D, độ tin của số đo: ma trận viết tay · tập nhãn hai phần ghim sha256 · toàn bộ bài thật [AC-9]
- Bỏ quét hình thái: xem dòng sổ `descope` «bỏ coverage-scan».

## Out of scope

- Tầng và hướng: SV2 (`s03-luu-tang-huong`), cần migration.
- Giá khoảng («1,8–1,9 tỷ») và lưu cận trên giá che số: PL13.
- Tách bài nhiều căn: PL18. Ghép trục vào danh mục, tin S03 tới căn: PL20.
- Đưa `unit_number` lên cloud: sửa `pipeline/sync-cloud.mjs` là T3, để việc riêng.
- Bài toàn chữ kiểu toán học («𝐁𝐀́𝐍»), mẫu một bài: chưa đo tần suất.
- Chạy transform trên DB chung trong vòng này. Sau khi gộp, lượt 00:00 (`scripts/zalo-import-daily.sh`) tự chạy transform từ checkout chính
  theo Hỏi-1; điều phối xếp `reassign-areas` → 300 + 400 trước lượt kiểm cloud của `tin-rao-tren-invest`.
- `matchPhuong` của S05, S06: S05 0 tin, S06 đọc từ trường phường có cấu trúc, không có ca sai để sửa.
- Mã viết liền kiểu «S801»: cách tách toà, trục chưa được kiểm (audit §10).

## Đường đo

- «Phòng ngủ đúng ≥ 90%», «không còn DT sai do dấu phẩy», «không còn phường đọc nhầm từ hướng», «giá không đơn vị không làm tụt
  giá đúng» ← `pipeline/scripts/do-va-doc-tin.mjs` trên tập nhãn audit và bài thật [AC-9].

## Notes
- Known limits — chọn ở Cổng Bằng chứng 2026-11-02:
  - Ngoài-1: Ghi chú trong sổ field vẫn nói mã căn chỉ đến từ một nguồn, trong khi nguồn thứ hai cũng đang cấp. Người đọc sổ có thể hiểu sai nguồn gốc dữ liệu, nhưng số liệu hiển thị không bị ảnh hưởng.
  - Ngoài-3: Các bài sơ cấp chỉ ghi giá theo nhãn như «Giá TTS» sẽ không đọc ra giá và biến mất khỏi danh sách tin. Người dùng không thấy những căn này dù trước đây có hiện.
  - Ngoài-4: Một phép kiểm của đợt trước sẽ báo đỏ giả khi ai đó chạy lại, dù dữ liệu người dùng thấy không sai. (Đã xử lý trong vòng: đột biến CM-AC-8 đã trúng đúng hàm, E11 chứng.)
  - Ngoài-6: Một số ít tin ghi mã căn dài bốn phần có thể bị gán sai toà và sai căn, hai căn khác nhau có thể bị gộp thành một tin. (Đã xử lý trong vòng: mã bốn phần đã đọc đúng ở lượt 4.)
  - Ngoài-7: Hai bài cùng một căn nhưng một bài viết chữ thường có thể thành hai tin riêng thay vì một.
  - Ngoài-8: Con số 0 báo cáo về giá bị mất có thể chưa chứng minh chắc chắn, nên khó tin hoàn toàn rằng không còn bài nào mất giá.
  - Ngoài-9: Tin thuê ghi giá theo năm có thể lọt thành tin bán nếu sau này bộ đọc đổi mà không phép kiểm nào báo.
  - Ngoài-10: Phép đo «không tin nào mang hai căn» có thể không bắt được trường hợp tin gộp nhầm hai căn.
  - Ngoài-12: Phép đo diện tích có thể bỏ sót lỗi với số có hai chữ số lẻ như 63,45m2 nếu bộ đọc hỏng sau này.
  - Ngoài-13: Ai đó có thể xoá bớt ca kiểm mà bộ test vẫn xanh, làm lời đảm bảo yếu đi âm thầm.
  - Ngoài-14: Phép kiểm tự động có thể báo nhầm «có tin mang hai trục» khi một tin có hai bài đăng lại khác nhau về chữ hoa/thường. Người dùng không thấy dữ liệu sai, chỉ có thể gặp một lần kiểm đỏ giả.
  - Ngoài-16: Một bài cho thuê ghi giá theo năm bằng chữ như «1,2 tỷ mỗi năm» có thể bị coi là tin bán giá 1,2 tỷ và hiện trên danh sách bán. Hiện chưa có bài thật nào viết như vậy. (Đã xử lý trong vòng: dạng giá năm đã không còn đổi thành tin bán.)
  - Ngoài-17: Một số bài cho thuê có giá viết kiểu «12000 net» hoặc «8.5x» có thể bị hiểu thành bán nhà giá hàng tỷ. Người xem sẽ thấy một tin bán với giá cao sai hẳn so với thực tế.
  - Ngoài-18: Một bài bán ghi giá che kiểu «25x tỷ» có thể hiện giá chỉ khoảng 250 triệu, thấp hơn rất nhiều so với giá thật. Người xem sẽ thấy căn đó rẻ bất thường.
  - Ngoài-19: Phép kiểm tự động chưa khẳng định giá của bài cho thuê đúng 1 tỷ sau khi đổi thành tin bán; nếu giá ở biên này bị đọc sai thì phép kiểm vẫn xanh. Hiện không có bằng chứng giá thật bị sai.
  - Ngoài-20: Phép đo chất lượng diện tích có thể không bắt được lỗi nếu sau này diện tích dạng «63,45m2» bị đọc sai thành 45. Hiện diện tích những bài như vậy vẫn đọc đúng.
  - Ngoài-21: Phép kiểm cũ về giá tỷ chẵn giờ chỉ còn bắt được lỗi số điện thoại. Nếu giá của loại bài này bị đọc sai thì phép kiểm vẫn báo đạt.
  - Ngoài-22: Hồ sơ nghiệm thu cũ vẫn ghi phép đo rộng hơn thực tế đang chạy. Người đọc hồ sơ có thể tưởng nó kiểm nhiều hơn mức thật.
  - Ngoài-23: Chú thích trong mã nói Mạnh đã duyệt việc nới phép kiểm, nhưng hồ sơ không có bằng chứng người duyệt đúng việc đó. Dấu vết duyệt vì thế có thể gây hiểu nhầm.
  - Ngoài-27: Một số mã căn như PR2.07 bị lưu cả cụm làm tên toà, nên cùng một toà có hai tên và mất mã căn. Khoảng 199 bài thật bị ảnh hưởng.
  - Ngoài-28: Phép kiểm cũ về giá tỷ chẵn luôn báo đạt phần giá và vẫn in câu khẳng định như thể đã đo. Kết quả này có thể làm người đọc yên tâm sai.
  - Ngoài-29: Bài cho thuê ghi giá che kiểu «7.5x triệu» có thể bị đọc thành tin bán 7,5 tỷ. Hiện chưa thấy bài thật nào dính.
  - Ngoài-30: Bài viết không dấu kiểu «hướng tay nam» vẫn có thể bị gán nhầm vào phường Tây Nam. Hiện không có bài thật nào dính.
  - Ngoài-31: Hai bài đăng cùng một căn nhưng khác chữ hoa chữ thường có thể bị tính thành hai tin riêng. Ca kiểm hiện tại không phát hiện điều này.
  - Ngoài-32: Phép đo «không tin nào mang hai trục» chưa từng được chứng minh là có thể báo đỏ. Con số 0 vì thế chưa chắc phản ánh chất lượng thật.
  - Ngoài-33: Phần kiểm giá của phép đo giá tỷ chẵn không thể báo lỗi nữa, kể cả khi giá bị đổi sai. Chỉ còn phần kiểm số điện thoại hoạt động.
  - Ngoài-34: Ca thử về việc bỏ đường dẫn khỏi giá chỉ còn bắt được lỗi ở số điện thoại. Nếu phần gạt đường dẫn hỏng thì ca thử không báo.
  - Ngoài-35: Nếu ai đó lỡ xoá một dòng trong bảng ca thử thì các kiểm tra vẫn xanh. Một dòng kiểm quan trọng có thể mất mà không ai hay.
  - Trong hợp đồng, phép kiểm chưa đủ chặt (lượt 4, Mạnh ký với giới hạn): ca DB của AC-8, AC-5 thiếu một số dạng chỉ kiểm ở mức hàm; E11 không buộc dòng thước vào lượt cây; E5, E8 ghi đòi hỏi rộng hơn lệnh chạy thật.
  - Thước `gom_qua_10_nhieu_nguoi` của `s03-cam-mau-so-lieu` = 1 trên cả bản nền: lượt ghim lại của hai hồ sơ dùng thước này sẽ đỏ tới khi có người xử.
- Mở hợp đồng mới (Ngoài-2): Giá che dính chữ tỷ («36xxtỷ», «3,0xtỷ») không đọc được, bài mất giá im lặng.
- Mở hợp đồng mới (Ngoài-15): Phát biểu parser block_raw/unit_number không được rút khi bộ đọc thôi đọc ra giá trị, nên giá trị cũ thắng LLM mãi.
- Mở hợp đồng mới (Ngoài-25): chinhLoaiThueTy dò «/tháng» trên toàn bài nên bài bán có tiền thuê theo tháng vẫn bị gạt là thuê từ 1 tỷ. Đã xử lý trong vòng: AC-5 đã nâng, sửa ở lượt 3, không cần hàng riêng.
- Mở hợp đồng mới (Ngoài-26): Từ ngữ cảnh «vay» bắt cả «không vay», «ko vay» nên giá thật bị bỏ và tin biến mất. Đã xử lý trong vòng: AC-4 đã nâng, sửa ở lượt 3, không cần hàng riêng.
