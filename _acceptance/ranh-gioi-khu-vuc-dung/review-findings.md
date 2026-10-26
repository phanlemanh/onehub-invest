# Review findings: ranh-gioi-khu-vuc-dung (round 4)

## Trong hợp đồng

- **Hình dạng 5: ma trận AC-10 thiếu market_asset_stats — hợp đồng nêu 3 bảng cache, test chỉ assert 2**
  file: `pipeline/scripts/reassign-areas.test.mjs:309`
  severity: medium
  AC: AC-10
  source: measurement
  detail: Theo contract, AC-10 hứa không dòng nào của khu vực lạc trong `market_metrics`/`area_breakdowns`/`market_asset_stats` bị xoá khi chạy không cờ. Ca 'AU9-AC-10 không cờ…' chỉ lặp `for (const tb of ["market_metrics", "area_breakdowns"])` (dòng 309-310), còn mocLac() không chèn dòng market_asset_stats nào. Như vậy có 3 phần tử được hứa nhưng chỉ 2 được assert. Nếu nhánh không cờ lỡ xoá market_asset_stats (nhánh có cờ xoá bảng này ở reassign-areas.mjs dòng 264), test vẫn xanh. E10 trong evals.yaml cũng đã thu hẹp lời hứa, không nhắc market_asset_stats.
  rationale: AC-10 nêu đích danh ba bảng không được xoá dòng của khu vực lạc, bài kiểm chỉ chứng minh hai nên lời hứa chưa được đo đủ.

- **Hình dạng 5/3: AC-10 hứa log liệt kê khu vực lạc kèm số dòng trỏ vào, test chỉ kiểm chuỗi gợi ý lệnh có mặt**
  file: `pipeline/scripts/reassign-areas.test.mjs:318`
  severity: low
  AC: AC-10
  source: measurement
  detail: Contract AC-10 hứa: «log in danh sách khu vực lạc kèm số dòng trỏ vào và câu lệnh dọn có cờ». Ca không cờ chỉ có `assert.ok(dong.some((d) => d.includes("--xoa-khu-vuc-lac")))`. Hai trong ba phần của lời hứa không được đo: dòng chứa id `vn-hanoi-tinh-moi-au9` và các con số đi kèm. Nếu bỏ hẳn vòng `for (const g of giu) log.warn(...)` (reassign-areas.mjs dòng 250), test vẫn xanh.
  rationale: AC-10 đòi log in danh sách khu vực lạc kèm số dòng trỏ vào; bài kiểm chỉ đo phần câu lệnh gợi ý nên hai phần của lời hứa chưa được đo.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Tên check DQ `area_con_ngoai_cha` lệch quy ước đặt tên của mọi check DQ khác**
  Người dùng thấy gì: Tên của phép kiểm chất lượng dữ liệu mới viết bằng tiếng Việt, khác các phép kiểm còn lại. Người dùng không thấy khác biệt, chỉ gây lộn xộn cho người bảo trì về sau.
  Căn cứ: Hậu quả nhẹ, không mất hay lộ dữ liệu và không ai dùng ngoài đội bảo trì thấy; đổi tên càng muộn càng tốn vì phải giữ cả hai tên cũ lẫn mới, nên ghi lại là hạn chế đã biết.
  file: `pipeline/sql/450_dq_checks.sql`
  severity: medium
  Đề xuất: known-limits

- **Khoá jsonb mới `meta.lac` trên areas đặt tên tiếng Việt, lệch các khoá meta sẵn có**
  Người dùng thấy gì: Cờ đánh dấu khu vực lạc được đặt tên tiếng Việt, khác các cờ cùng loại. Người dùng không thấy gì khác.
  Căn cứ: Chỉ là chuyện đặt tên nội bộ, không ảnh hưởng dữ liệu hay giao diện người dùng; ghi lại để lần dọn quy ước sau xử lý.
  file: `pipeline/lib/osm.mjs`
  severity: low
  Đề xuất: known-limits

- **Cờ «khu vực lạc» chưa được tôn trọng ở một bước gán theo toạ độ khác (transform-hcmc-simple)**
  Người dùng thấy gì: Ở thành phố Hồ Chí Minh, một bước nạp tin vẫn có thể gán vài tin vào khu vực lạc đã bị đánh dấu. Lượt chạy chuẩn sau đó sẽ gán lại cho đúng phường.
  Căn cứ: Hậu quả nhẹ và tự lành ở lượt chạy kế tiếp theo lịch, không mất dữ liệu; sửa sau rẻ nên ghi hạn chế đã biết rồi xử lý khi dọn tiếp.
  file: `pipeline/transform-hcmc-simple.mjs`
  severity: low
  Đề xuất: known-limits

- **Running with --xoa-khu-vuc-lac never marks the stray areas it keeps as 'lac', so transform-airbnb can still assign listings to them**
  Người dùng thấy gì: Sau lượt dọn thủ công, một số khu vực lạc được giữ lại có thể tạm nhận tin Airbnb cho đến lượt chạy theo lịch kế tiếp, khi chúng được đánh dấu lại.
  Căn cứ: Chỉ xảy ra trong khoảng trống ngắn sau lượt dọn tay, không mất dữ liệu và tự lành ở lượt hằng tuần; sửa sau rẻ nên ghi hạn chế đã biết.
  file: `pipeline/reassign-areas.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2: fixture chi tiết DQ area_con_ngoai_cha viết tay theo khuôn bên đọc, rào bên ghi chỉ ghim một phần khuôn**
  Người dùng thấy gì: Nếu sau này ai đổi câu chữ mô tả của phép kiểm khu vực, trang vận hành có thể hiện «chưa diễn giải» mà bài kiểm vẫn không báo đỏ.
  Căn cứ: Chỉ ảnh hưởng chữ hiển thị cho người vận hành, không mất hay sai dữ liệu, và người vận hành thấy ngay nên tự phát hiện; vá sau rẻ.
  file: `app/tests/ops-nhan-theo-context.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1: ca 'transform-airbnb dùng chung điều kiện phường hợp lệ' grep mã nguồn thay vì đo đầu ra**
  Người dùng thấy gì: Bài kiểm xác nhận bước nạp Airbnb dùng đúng điều kiện phường hợp lệ chỉ bằng cách đọc chữ trong mã, nên có thể bỏ sót nếu mã sai hành vi thật.
  Căn cứ: Là lớp bảo vệ phụ ngoài hợp đồng, không ảnh hưởng dữ liệu người dùng; nếu sót thì chỉ lệch ít tin ở khu vực lạc và tự lành khi chạy lại, nên ghi hạn chế đã biết.
  file: `pipeline/scripts/reassign-areas.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4: assert loại trừ khu vực lạc khỏi phuongHopLe() là âm tính một mình, không có đối chứng dương**
  Người dùng thấy gì: Bài kiểm phụ có thể báo xanh dù điểm thử không thật sự rơi vào khu vực lạc, nên khả năng bắt lỗi của nó yếu hơn vẻ ngoài.
  Căn cứ: Chỉ làm yếu một lớp kiểm phụ, không ảnh hưởng dữ liệu hay người dùng; vá sau rẻ nên ghi hạn chế đã biết.
  file: `pipeline/scripts/reassign-areas.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/9 lỗi rơi vào file không bộ đo nào phủ (pipeline/lib/osm.mjs, pipeline/transform-hcmc-simple.mjs, app/tests/ops-nhan-theo-context.test.tsx) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
