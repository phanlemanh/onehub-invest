## Trong hợp đồng

- **Hình dạng 1 + 3 (đo chỉ dẫn thay vì đầu ra; chuỗi có mặt thay cho quan hệ): nửa transform-chotot của ca quan hệ AC-3 chỉ grep mã nguồn**
  AC: AC-3
  file: `pipeline/lib/thi-truong.test.mjs:77`
  severity: medium
  source: measurement
  detail: E3 hứa một ca quan hệ: «thêm khoá giả vào bản chép module → tập thành phố mà HAI bước tính ra có khoá đó». Với reassign-areas, ca này được đo bằng hành vi (dòng 60-73: import MARKETS từ bản chép). Với transform-chotot thì chỉ có `assert.match(t, /docThiTruongCoPhuong\(client\)/)` và `assert.match(t, /thiTruongCua\(ad\.city_code/)` (dòng 77-78), tức là kiểm văn bản tệp có hai lời gọi. Test không chạy transform với module có khoá hay mã giả, và không kiểm rằng tin mang city_code đó ra được mã thị trường giả. Nếu kết quả `mk` bị bỏ qua (ví dụ `byCity.get(ad.city_code)`) thì test vẫn xanh. Phát hiện này đã có ở review-findings vòng 2 nhưng mã chưa đổi. Lý do thuộc hợp đồng: AC-3 hứa thêm một khoá vào module thì cả hai bước nhận khoá đó; phép đo cho bước chuyển tin chỉ khớp văn bản nên lời hứa này chưa được chứng minh.

- **Hình dạng 3 (chuỗi có mặt trong khi lời hứa là một giá trị đếm): AC-5 «phường HN/HCM vẫn upsert» xanh cả khi upsert 0 dòng**
  AC: AC-5
  file: `scripts/s06-vung-moi/acceptance.mjs:311`
  severity: medium
  source: measurement
  detail: `check(/hanoi: phường upsert/.test(r.out) && /hcmc: phường upsert/.test(r.out), "AC-5 phường Hà Nội/TP.HCM vẫn upsert")` chỉ khớp tiền tố dòng log. reassign-areas.mjs:133 in dòng này với mọi giá trị đếm: `${city}: phường upsert ${out.upserted}/${bounds.length} …`. Vì vậy `hanoi: phường upsert 0/600` cũng làm ca này xanh. E5 hứa phường HN/HCM vẫn được upsert, tức là số upsert > 0, hoặc tập id phường trước bằng sau như AC-4 đã làm ở dòng 289-295. Phép đo hiện tại chỉ xác nhận chuỗi có mặt, không xác nhận giá trị. Lý do thuộc hợp đồng: AC-5 yêu cầu thành phố khác chạy như thường; ca đo xanh cả khi upsert 0 phường nên không chứng minh được điều đó.

- **Hình dạng 5 (tuyên quét một lớp nhưng chỉ có điểm-case): bản sửa r2 cho dem-ma-dai quét cột mảng mà không có ca đo nào**
  AC: AC-10
  file: `scripts/s06-vung-moi/acceptance.mjs:209`
  severity: medium
  source: measurement
  detail: dem-ma-dai.mjs (dòng 2-3, 28, 42) giờ tuyên quét ba lớp cột: khoá ngoại, cột chữ area_id/market_id, và cột mảng market_codes/area_ids. Commit dd99ab00 nêu rõ «lệnh đếm quét cột mảng». Trong modeDem, lớp khoá ngoại có ma trận theo catalog. Lớp không khoá ngoại chỉ có một điểm-case `/báo area_sources\.area_id/` (dòng 209). Lớp cột mảng không có assert nào: không kiểm dòng «báo collection_units.market_codes» dù bản chép có cu0.dai > 0 dòng mã dài (modeMig dòng 91), và không có ma trận cột mảng/cột chữ lấy từ information_schema. Nếu nhánh `c.mang` (EXISTS unnest) hỏng, E12 vẫn xanh. Lý do thuộc hợp đồng: AC-10 nêu rõ cột mảng không khoá ngoại chỉ in dòng báo; không có ca đo nào kiểm hành vi này nên AC-10 chưa được chứng minh ở lớp đó.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Migration 064 changes the public Invest Portal URL of 32 markets without a permanent redirect**
  Người dùng thấy gì: Sau khi áp thay đổi, các đường dẫn cũ của 32 thành phố/tỉnh (ví dụ trang Đà Nẵng, Khánh Hoà) sẽ báo «Không tìm thấy» với ai đã lưu liên kết hay đánh dấu trang. Đường dẫn mới là dạng ngắn như /vn/da-nang.
  Căn cứ: Hậu quả vừa phải: không mất dữ liệu, chỉ gãy liên kết cũ và người dùng tự tìm lại được qua tìm kiếm; thêm chuyển hướng sau này rẻ nhưng nên làm đúng lúc áp, nên đáng đăng một việc riêng.
  file: `db/migrations/064_ma_thi_truong_ngan.sql`
  severity: medium
  Đề xuất: new-contract

- **The Claude branch ships a ZCode-lane change (collector/) that the contract itself declares out of scope**
  Người dùng thấy gì: Việc thêm Hải Phòng vào danh sách thành phố của bộ thu đi kèm vào lần phát hành này mà chưa qua bước tích hợp riêng của làn thu thập. Người dùng cuối không thấy khác biệt, nhưng người ký cổng nên biết thay đổi này được ký chung.
  Căn cứ: Không ảnh hưởng người dùng và không mất dữ liệu; chỉ cần ghi nhận rõ trong hồ sơ rằng commit này được đưa vào có chủ ý.
  file: `collector/src/config/cities.ts`
  severity: low
  Đề xuất: known-limits

- **064 bỏ sót dq_check_results.entity: 187 dòng truthful-coverage vẫn trỏ mã dài, /ops/quality hiện trùng thị trường trong 7 ngày**
  Người dùng thấy gì: Trang chất lượng dữ liệu của đội vận hành có thể hiện cùng một thị trường hai lần (một dòng tên cũ, một dòng tên mới) trong tối đa 7 ngày sau khi áp. Lịch sử kiểm của 32 thị trường cũng bị tách đôi.
  Căn cứ: Nhẹ: chỉ ảnh hưởng trang vận hành nội bộ, không mất dữ liệu và tự hết sau 7 ngày; sửa sau cũng rẻ nếu muốn gọn hơn.
  file: `db/migrations/064_ma_thi_truong_ngan.sql`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc, không round-trip qua bên ghi): snapshot S04 giả của AC-4/AC-5/AC-6**
  Người dùng thấy gì: Bài kiểm dùng dữ liệu ranh giới phường dựng tay, nên nếu bộ thu đổi định dạng ghi thì bài kiểm vẫn xanh trong khi nạp thật có thể hỏng. Phép đo trên dữ liệu thật ở AC-8 vẫn là chốt chặn.
  Căn cứ: Rủi ro thấp và có chốt chặn bằng dữ liệu thật; nếu hỏng thì lộ ngay khi nạp và chạy lại được, sửa sâu hơn thì tốn công.
  file: `scripts/s06-vung-moi/acceptance.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (đối chứng không ghim thông điệp): «quét đỏ ghim tên tệp» của E3 không ghim tên tệp**
  Người dùng thấy gì: Nếu có người chèn cứng một mã thành phố vào bước chuyển dữ liệu, bài kiểm vẫn đỏ nhưng thông báo có thể không chỉ đúng tệp vi phạm. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Rất nhẹ: chỉ làm việc dò lỗi của lập trình viên chậm hơn một chút, không đụng dữ liệu hay người dùng.
  file: `pipeline/lib/thi-truong.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 5 (số assert không bằng số phần tử): ma trận AC-3 không ghim số khoá THANH_PHO**
  Người dùng thấy gì: Nếu sau này có người thêm khoá thành phố thứ năm mà quên thêm dòng kiểm, bài kiểm vẫn xanh. Hiện không ảnh hưởng đến tin hay phường đang hiển thị.
  Căn cứ: Rất nhẹ: chỉ là kẽ hở của bài kiểm trong tương lai, không ảnh hưởng người dùng hiện tại và sửa lúc nào cũng rẻ.
  file: `pipeline/lib/thi-truong.test.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
