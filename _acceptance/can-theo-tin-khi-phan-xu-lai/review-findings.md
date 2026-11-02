# Review findings: can-theo-tin-khi-phan-xu-lai (round 6)

## Trong hợp đồng

- **Khối sửa một lần của 066 điền cả căn của tin riêng có đề xuất applied, trái AC-4; ô đối chứng của itest không bắt được**
  AC: AC-4
  file: `db/migrations/066_can_theo_tin.sql:256`
  severity: medium
  source: conventions
  detail: AC-4 và E4 trong evals.yaml đòi «căn không gắn tin chung bài thì không đổi». Khối sửa lấy t_subjs từ MỌI đề xuất applied (dòng 256-259) rồi t_offers := offers_chung_chu_the(t_subjs) (dòng 260). offer_subject_keys (045:149) luôn chứa khoá của chính tin, nên tập này gồm cả tin neo không chung bài với ai. t_chung (dòng 261) chỉ dùng để quyết tin đã nghỉ có được đọc hay không (dòng 266), không lọc tin sống. Vì vậy căn của tin riêng còn sống, có đề xuất applied, ô căn trống mà tin mang giá trị (ví dụ tin được gắn căn sau khi áp, do bước dựng căn hằng đêm không ghi ba cột này) sẽ bị điền và thêm dòng log sua-mot-lan-066, đồng thời được tính vào cells và properties của dòng audit. Đối chứng 2 ở pipeline/scripts/can-theo-tin.itest.mjs:331-341 không phủ ca này: nó đánh đề xuất của G thành skipped, nên G rơi khỏi t_subjs vì trạng thái, không phải vì không chung bài. Lời chú thích ở đó («bản khối sửa bỏ bộ lọc tin chung sẽ điền PG») cũng sai, vì khối sửa không có bộ lọc tin chung. DEM_LECH trong rang/ap-hai-lan.mjs:36-43 có cùng phạm vi nên E5 cũng không phát hiện được. Đã kiểm bằng cách đọc code, chưa chạy ca tái hiện. Tác động hiện tại: đếm chỉ đọc trên oneinvest ngày 02/11 cho 0 căn lệch trong tập này (kể cả tin riêng), nên nếu áp ngay thì chưa sai dữ liệu; rủi ro là khoảng lệch phát sinh trước lúc áp lên máy thu và là độ lệch so với hợp đồng đã ký. Hướng xử lý cần người chọn: hoặc giới hạn khối sửa vào căn có tin trong t_chung và thêm ô đối chứng «tin riêng có đề xuất applied, căn trống», hoặc sửa câu AC-4/E4 nếu ý định thật là điền cả tin riêng. Đổi AC cần Mạnh quyết.

- **Khối sửa một lần của 066 ghi cả căn của tin KHÔNG chung bài đăng, trái AC-4**
  AC: AC-4
  file: `db/migrations/066_can_theo_tin.sql:260`
  severity: medium
  source: bugs
  detail: Mục 4 đặt t_offers := offers_chung_chu_the(t_subjs). Vì offer_subject_keys của một tin luôn chứa chính khoá của nó, tập này gồm cả tin có đề xuất applied dù tin đó không chung bài với ai. Điều kiện dòng 266 chỉ dùng t_chung để lọc tin đã nghỉ, nên không loại tin sống riêng. AC-4 ghi «căn không gắn tin chung bài thì không đổi», chú thích dòng 245 cũng nói về căn của tin chung. Đã tái hiện trong BEGIN…ROLLBACK trên DB thử oneinvest_p2_ct. Tin C riêng (tin_that_su_chung(['TST:rv-c']) rỗng) có đề xuất bedrooms=3 áp TRƯỚC khi gắn căn PC. Sau KHOI_SUA_066, PC.bedrooms đổi từ NULL thành 3 và có thêm dòng log sua-mot-lan-066. Lượt chạy này ghi audit {cells: 2, properties: 2}, cả hai căn đều không có tin chung; căn thứ hai là PA ở dưới. Trường hợp tương tự: tin riêng A có đề xuất bathrooms applied rồi mới gắn căn PA, PA.bathrooms cũng bị điền 2. CT-AC-4 không bắt được vì đối chứng 2 (tin G) bị đặt tay status='skipped', nên G không vào t_subjs. Ca «tin riêng có đề xuất applied» chưa được thử. Ảnh hưởng: khi 066 áp lên máy thu, migration sẽ ghi vào dữ liệu thật ngoài phạm vi đã duyệt, và số cells/properties trong ops_audit bị tính cả phần ngoài phạm vi. Hiện chưa có dữ liệu sai: phép đo trên bản chép ghi nhận khối này đổi 0 ô (Treo-1, đo ngày 01/11, trước bản sửa 887918be), nhưng lệch sẽ xuất hiện nếu căn được gắn trước lúc áp. Hướng sửa: lọc po.offer_id = ANY(t_chung) ở mục 4, hoặc người ký chấp nhận và sửa AC-4; đồng thời thêm ô đối chứng tin riêng có đề xuất applied còn giữ status đó.
  rationale: Đã tái hiện: căn của tin riêng bị đổi, trái đúng vế căn không gắn tin chung bài thì không đổi của AC-4.

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ): chiều đỏ 4 ô cùng căn không so giá trị 063 với 066**
  AC: AC-1
  file: `pipeline/scripts/can-theo-tin.itest.mjs:146`
  severity: medium
  source: measurement
  detail: AC-1 hứa «khi PB = PA, giá trị như 063, chỉ khác dòng log». E1 hứa «ở 4 ô CÙNG căn assert PB.bedrooms của 063 = của 066 và chỉ dòng log khác». Mã không có phép so nào giữa hai lượt. Dòng 146-147 chỉ `assert.rejects(kiemAp(...), /CT-AC-1: dòng log thiếu offer_ids của B/)`, tức khớp một chuỗi lỗi. Phép chạy 063 và phép chạy 066 nằm ở hai test khác nhau, không lượt nào chụp kết quả lượt kia. Quan hệ bedrooms chỉ đúng gián tiếp: mỗi lượt qua được dòng 105 (PB = max tính trong chính lượt đó). Vế «chỉ khác dòng log» không được đo: bathrooms, street và các khoá khác của dòng log (src, proposal_ids, actor) không được so giữa 063 và 066. Cần đối chiếu như CT-AC-3 đang làm, tức `deepEqual` kết quả hai lượt sau khi bỏ `offer_ids`.
  rationale: AC-1 hứa khi PB = PA giá trị như 063 chỉ khác dòng log, nhưng bằng chứng không so hai lượt nên vế này chưa được chứng minh.

- **Hình dạng 4 (assertion âm-tính-một-mình): «DB oneinvest không bị chạm» chỉ so số dòng audit**
  AC: AC-5
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs:119`
  severity: medium
  source: measurement
  detail: Vế duy nhất đo AC-5 «DB oneinvest dùng chung không bị chạm» là `if (goc0 !== goc1)`, so số dòng ops_audit `can-theo-tin:*`. Khối sửa của 066 chỉ ghi audit khi `n_o > 0` (066:286). Nếu 066 lỡ áp lên oneinvest khi không còn lệch, hàm vẫn bị thay mà số dòng không đổi, nên phép đo vẫn xanh. Script đã có sẵn `dinhNghia(db)` nhưng không gọi cho oneinvest, và cũng không có đối chứng dương cho thấy phép đo này đỏ được trên DB bị chạm. Finding này đã có trong review-findings.md ở dạng known-limits, và mã vẫn chưa đổi.
  rationale: AC-5 đòi DB oneinvest dùng chung không bị chạm, mà phép đo chỉ so số dòng audit nên không chứng minh được vế này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Răng E5 đếm «căn lệch» rộng hơn phạm vi khối sửa, có thể báo đỏ giả**
  Người dùng thấy gì: Phép kiểm sau này có thể báo lỗi dù dữ liệu vẫn đúng, khiến người ký mất thời gian tra một cảnh báo giả.
  Căn cứ: Chỉ gây báo động nhầm, không làm mất hay sai dữ liệu, và có thể chỉnh lại bất cứ lúc nào khi thật sự gặp.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): ma trận áp/hoàn tác của 066 chỉ đo cột bedrooms**
  Người dùng thấy gì: Số phòng tắm và tên đường của căn chưa được kiểm tự động khi đề xuất bị áp hay hoàn tác, nên một lỗi ở đó có thể lọt qua.
  Căn cứ: Mã cho hai cột này cùng khuôn với số phòng ngủ đã được kiểm, và nếu có sai thì chỉ lệch ô trống, sửa lại bằng một lần chạy bù.
  file: `pipeline/scripts/can-theo-tin.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm-tính-một-mình): các ca «giữ nguyên» không ghim tiền đề dương**
  Người dùng thấy gì: Vài ca thử «giữ nguyên giá trị» có thể xanh dù cơ chế bên dưới không chạy, nên độ tin cậy kém hơn vẻ ngoài.
  Căn cứ: Độ phủ vẫn có từ các ca khác, và đây chỉ là chỗ thắt chặt thêm cho bài thử, không đụng tới dữ liệu người dùng.
  file: `pipeline/scripts/can-theo-tin.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ): «là bản 066» đo bằng /066/ trong thân hàm**
  Người dùng thấy gì: Phép kiểm xác nhận «đã là bản mới» khá lỏng, nên một bản hàm khác vẫn có thể bị coi là đúng.
  Căn cứ: Rủi ro nhỏ vì bản hàm do chính nhóm kiểm soát, và nhận ra sai lệch muộn cũng không làm mất dữ liệu.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): GIEO dựng căn lệch bằng INSERT trực tiếp**
  Người dùng thấy gì: Một phép kiểm dùng dữ liệu dựng tay nên chưa chứng minh được tình huống lệch xảy ra đúng như thực tế.
  Căn cứ: Đường dựng lệch thật đã được kiểm ở chỗ khác, nên phần còn lại chỉ là độ phủ phụ và không ảnh hưởng dữ liệu người dùng.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

