## Trong hợp đồng

- **Thứ tự S16 trước rồi S08: căn lệch toà biến mất khỏi cả thẻ lẫn view đếm**
  AC: AC-6
  file: `pipeline/lib/s16-dung.mjs:320`
  severity: medium
  source: bugs
  detail: Q-B đổi «lệch → thẻ» thành «lệch → số đếm». Dòng 'can-lech-toa' của v_lech_cau_truc_s16 (111 dòng 75) chỉ đếm `units u WHERE u.status = 'merged'` có merged_into trỏ căn S16, tức chỉ phủ nhánh S08 trước (buocS16 gộp căn S08). Ở nhánh S16 trước, ganLechS16 không tạo căn S08 nào: nó gắn thẳng bí danh S08 vào căn S16 rồi cho nghỉ thẻ, nên không có căn merged. Lệch toà ở thứ tự này không còn thẻ mà cũng không vào view. Dấu vết duy nhất là s08_bi_danh_can_s16 trong tổng kết lượt, không ai lưu. Từ nay, mỗi lần bản thu S08 tới sau S16 (luồng đêm thường gặp), lệch cấu trúc bị bỏ qua mà không báo gì. Hai thứ tự vì thế cũng cho bảng đếm khác nhau, trái với AC-5 «hai thứ tự cho cùng tập». Itest AC-6 chỉ đọc view trên cA (S08 trước) nên không bắt được.
  rationale: AC-6 yêu cầu căn thuộc toà lệch giữa nguồn thành số đếm theo cặp nguồn; ở thứ tự S16 trước, lệch này không vào view.

- **E6 khai các phép kiểm mà itest không có: nhánh S09-S16 của view đếm lệch chưa được kiểm**
  AC: AC-6
  file: `_acceptance/danh-ba-s16-thang-cau-truc/evals.yaml:41`
  severity: medium
  source: bugs
  detail: E6 ghi: fixture có lệch phân khu (S09); có đối chứng dương «cùng lệch ở dự án không có S16 ra đúng một thẻ»; có chiều đỏ «bỏ cặp S09 khỏi view → thiếu cặp S09» và «chặn thẻ theo mọi dự án → mất thẻ ngoài dự án S16». Trong pipeline/scripts/danh-ba-s16-cau-truc.itest.mjs không có ca nào như vậy: grep 'S09-S16', 'thiếu cặp', 'mất thẻ' đều rỗng. Ca view AC-6 chỉ kỳ vọng hai dòng 'ten-toa' S08-S16 và 'khu-nhieu'. Ca thẻ AC-6 dùng 'toa-khop-nhieu' làm đối chứng dương. Vì vậy nhánh UNION đầu tiên (S09-S16 'phan-khu') của v_lech_cau_truc_s16 không được thực thi trong kiểm thử nào, và E6 sẽ báo xanh cho một hành vi không được kiểm. Đây là bằng chứng nghiệm thu sai so với hiện thực.
  rationale: AC-6 đòi lệch từ S09 và đối chứng dương ở dự án không có S16; kiểm thử không phủ các ô này.

- **S16 trước rồi S08: lượt dựng thứ hai có thể đúc trục S08 rỗng (khoá mới ở lần hai)**
  AC: AC-7
  file: `pipeline/lib/danh-ba-vat-the.mjs:110`
  severity: low
  source: bugs
  detail: Ở lượt đầu, nhánh lệch `continue` trước khi tạo trục. ganLechS16 gắn bí danh S08 (vCan) vào căn S16. Sang lượt sau, biDanh.has(vCan) nên canS16 = null; code đi tiếp tới vTruc (dòng 113) và datKhoa(vTruc, 'stk') đúc một trục mới trong toà S08 t.key nếu trục ấy chưa có. Trục mới này không mang căn nào, vì căn chỉ được ganCo/datKhoa với moi:false, trỏ căn S16 ở toà khác. Kết quả trái AC-7 («0 khoá trục mới ở lần dựng lại»). Lỗi chỉ lộ khi mọi căn S08 của trục đó đều lệch toà; fixture hiện tại có Q12-11-01 cùng trục nên không bắt được. Cách sửa: khi biDanh(vCan) trỏ căn ở toà khác t.key thì bỏ qua trục, giống nhánh lệch.
  rationale: AC-7 đòi dựng lại không sinh khoá trục mới nào; finding mô tả lần dựng hai đúc thêm trục.

- **Hình dạng 5 (quét lớp chỉ có điểm-case, không có ma trận viết trước) + hình dạng 4 (chiều đỏ tự làm): AC-8 so tập khu với chính hàm khuDaDung của mã**
  AC: AC-8
  file: `pipeline/scripts/danh-ba-s16-cau-truc.itest.mjs:294`
  severity: high
  source: measurement
  detail: Contract AC-8 và E8 hứa «DB có năm khu đã có toà, tập khu dựng gồm cả Ocean Park 2, Ocean Park 3, Smart City (assert đủ năm slug)». Ca này lấy kỳ vọng `daCo = (await khuDaDung(c)).sort()` (dòng 294), trong khi buocVatTheDem (pipeline/danh-ba-vat-the.mjs:274) cũng lấy tập khu bằng đúng `khuDaDung(c)`. Phép so `assert.deepEqual(khuDung, daCo)` ở dòng 298 vì thế đúng theo định nghĩa: không có danh sách năm slug viết trước, và fixture moiDuLieu chỉ có q-khu-a/q-khu-b. Nếu SQL_KHU_CUA_TOA bỏ sót một khu thì cả hai vế cùng thiếu và ca vẫn xanh. Chiều đỏ ở dòng 309–312 cũng tự khẳng định chính nó: bocHong tự gán `khuDung = thieu` rồi assert `notDeepEqual(khuDung, daCo)`. Nó không làm hỏng mã nào trong buocVatTheDem hay khuDaDung, nên luôn qua và không chứng minh thước bắt được khu thiếu. Tương tự, dòng 302 so `Number(n) === tk.s16.khoa_moi` là so dòng in với chính tổng kết dùng để in ra dòng đó.
  rationale: AC-8 đòi assert đủ năm slug và chiều đỏ nêu slug; ca hiện so với chính hàm của mã nên không đạt.

- **Hình dạng 5 (thiếu ô trong ma trận viết trước): AC-1 không có toà chỉ S09 nên phép so 111 với 097 chỉ phủ nhánh «gốc»**
  AC: AC-1
  file: `pipeline/scripts/danh-ba-s16-cau-truc.itest.mjs:32`
  severity: high
  source: measurement
  detail: E1 hứa «fixture viết trước có toà chỉ S09, toà chỉ gốc, toà có cả S09 và S16», và AC-1 tuyên rằng mọi toà KHÔNG có S16 ra đúng như 097 (EXCEPT ALL hai chiều = 0 ở dòng 70–71). Nhưng fixture() (dòng 32–57) không chèn bí danh S09 nào và không có dòng stg_s09_item nào: bk(1) và bk(4) chỉ là toà gốc, còn bk(2) và bk(3) mang S16. Toà S09+S16 (bk(5)) chỉ được dựng trong fixture2, chạy sau AC-1. Vì vậy các nhánh s09_cum và s09_phan_khu của view 111 với toà không S16 chưa bao giờ được so với 097. Nếu 111 làm đổi cách CTE chon/pk/cum chọn nút cho toà chỉ S09, phép so vẫn ra 0 và ca vẫn xanh.
  rationale: AC-1 Given đòi fixture có toà chỉ S09 để so với 097; fixture thiếu ô này.

- **Hình dạng 5 (tuyên đếm theo cặp nguồn nhưng thiếu ô): nhánh S09-S16 «phan-khu» của v_lech_cau_truc_s16 không được assert ở đâu**
  AC: AC-6
  file: `pipeline/scripts/danh-ba-s16-cau-truc.itest.mjs:101`
  severity: high
  source: measurement
  detail: E6 hứa fixture có «lệch phân khu (S09) ở dự án có S16», bảng kỳ vọng viết trước có dòng của cặp S09, và có chiều đỏ «bỏ cặp S09 khỏi view thì ca đỏ nêu thiếu cặp S09». Ca «DA37-AC-6 (view)» chạy trước fixture2 nên lúc đó chưa có dữ liệu S09. Bảng kỳ vọng ở dòng 101–104 chỉ có {S08-S16, ten-toa} và {S16, khu-nhieu}. Ca ở dòng 258 chỉ lọc `loai = 'can-lech-toa'`. Grep toàn bộ itest và cả script -that không có chỗ nào assert 'S09-S16' hay loại 'phan-khu'. Nhánh UNION đầu tiên của view 111 (S09 xếp toà vào phân khu khác S16) vì thế không có ô đo, và chiều đỏ bỏ cặp S09 mà E6 hứa không tồn tại.
  rationale: AC-6 đòi đếm lệch theo cặp nguồn gồm S09 và toà thuộc phân khu; nhánh S09-S16 không được kiểm.

- **Hình dạng 4 (assertion âm tính đứng một mình, đối chứng dương lệch đích): AC-6 «0 thẻ ở dự án có S16» không có ca dự án không S16 ra đúng một thẻ**
  AC: AC-6
  file: `pipeline/scripts/danh-ba-s16-cau-truc.itest.mjs:256`
  severity: medium
  source: measurement
  detail: Contract AC-6 yêu cầu «đối chứng dương: cùng loại lệch cấu trúc ở dự án KHÔNG có S16 vẫn ra thẻ như luật 1 (đúng một thẻ)», và E6 thêm chiều đỏ «chặn thẻ theo mọi dự án thì ca đỏ nêu mất thẻ ngoài dự án S16». Ca này chỉ có assert âm `!loai.some(can-lech-toa && pending)` (dòng 256). Thứ đóng vai đối chứng ở dòng 257 lại là thẻ loại khác (toa-khop-nhieu, `n >= 1`) trong cùng dự án DA, tức dự án CÓ S16. Đột biến chặn thẻ lệch cấu trúc ở mọi dự án sẽ không làm ca này đỏ, vì không có dự án nào không S16 được dựng với cùng loại lệch.
  rationale: AC-6 nêu rõ đối chứng dương ở dự án không có S16 ra đúng một thẻ; ca này thiếu.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Áp thẻ luật S16 ghi khu_id vào asset_nodes.meta, bảng này có lên cloud, nên bộ soát S16 của sync-cloud sẽ dừng lượt đồng bộ đêm**
  Người dùng thấy gì: Sau khi áp thẻ luật phân khu, lượt đồng bộ đêm lên cloud có thể bị dừng, nên dữ liệu trên cổng sẽ không cập nhật cho tới khi xử lý. Nếu ai nới bộ soát để cho qua thì mã định danh lấy từ phiên đăng nhập nguồn có thể rời máy.
  Căn cứ: Hậu quả nặng: đồng bộ đêm ngừng hoặc có nguy cơ lộ định danh nội bộ; sửa trước khi áp thẻ luật thì rẻ hơn nhiều so với gỡ rối sau.
  file: `pipeline/phan-khu-s16.mjs`
  severity: high
  Đề xuất: new-contract

- **v_lech_cau_truc_s16 'ten-toa' so tên S09 thô với tên S16 đã chuẩn hoá, nên đếm lệch giả**
  Người dùng thấy gì: Bảng đếm lệch cấu trúc có thể báo thừa một số toà mà thật ra cùng tên, chỉ khác dấu hay khoảng trắng. Người xem số lệch theo cặp nguồn sẽ thấy con số cao hơn thực tế.
  Căn cứ: Chỉ làm số đếm phóng đại, không mất hay lộ dữ liệu, và người dùng chỉ đọc số tham khảo; sửa sau vẫn rẻ.
  file: `db/migrations/111_v_toa_nut_vung_s16.sql`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
