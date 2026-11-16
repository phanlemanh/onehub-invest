# Review findings: tu-vung-du-an-muc-39

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ghi chú của property_type vẫn tả ánh xạ PropertyType sau khi dd đổi sang PropertySubType**
  Người dùng thấy gì: Phần chú thích bên cạnh loại bất động sản còn tả theo cách gọi cũ, nên người đọc tài liệu có thể hiểu sai loại nào ánh xạ sang đâu. Dữ liệu và giao diện đang chạy không bị ảnh hưởng.
  Căn cứ: Chỉ là chú thích trong tài liệu cấu hình, không làm sai số liệu hay màn hình nào, và sửa lại sau rất rẻ.
  file: `pipeline/mappings.yaml`
  severity: medium
  Đề xuất: known-limits

- **Nhãn và chú thích trong app trích CONTEXT.md giờ mâu thuẫn với CONTEXT mới, mà không nằm trong danh sách hoãn**
  Người dùng thấy gì: Một số màn hình Ops vẫn gọi là «Khu đô thị» trong khi từ vựng chuẩn đã đổi thành «Dự án», nên người vận hành thấy hai tên cho cùng một thứ.
  Căn cứ: Chỉ lệch chữ trên màn hình nội bộ, không mất hay sai dữ liệu, và đã có hàng việc riêng để đổi chữ nên gộp thêm các chỗ này vào đó là đủ.
  file: `app/src/lib/dq-labels.ts`
  severity: low
  Đề xuất: new-contract

- **CONTEXT gán tên code cho các extension chưa khai trong mappings.yaml (MarketTier, SalesStatus, HandoverDate, ma_nha_nuoc, project_node_id/subzone_node_id)**
  Người dùng thấy gì: Sổ từ vựng đã ghi sẵn một số tên trường chưa được khai báo chính thức, nên người đọc có thể tưởng chúng đã tồn tại trong hệ thống. Người dùng cuối không thấy gì khác.
  Căn cứ: Chỉ là tài liệu, không ảnh hưởng dữ liệu hay màn hình, và các hàng việc sau sẽ khai báo đúng chỗ.
  file: `CONTEXT.md`
  severity: low
  Đề xuất: known-limits

- **Bảng danh pháp ADR-0011 vẫn xếp «Dự án con» vào subzone, trái với sửa đổi mục 39 ngay phía trên**
  Người dùng thấy gì: Tài liệu quyết định kiến trúc có hai dòng cạnh nhau hiểu «dự án con» khác nhau, dễ làm người đọc lẫn lộn. Không ảnh hưởng hệ thống đang chạy.
  Căn cứ: Bảng này vốn được giữ để lưu vết và đã có chú thích sửa đổi ngay trên, nên rủi ro chỉ là hiểu nhầm khi đọc.
  file: `docs/adr/0011-reso-first-data-law.md`
  severity: low
  Đề xuất: known-limits

- **Thuật ngữ chuẩn mới «Danh mục dự án» vẫn nằm trong _Avoid_ của «Căn cứ nhãn», bộ kiểm glossary thêm một lỗi mới**
  Người dùng thấy gì: Từ vựng chuẩn vừa gọi «Danh mục dự án» là tên đúng, vừa liệt kê nó là chữ nên tránh ở một khối khác, và bộ kiểm từ vựng sẽ báo đỏ. Người dùng cuối không thấy, nhưng đội vận hành có thể bị chặn bởi kiểm tra đỏ.
  Căn cứ: Không mất dữ liệu và sửa chữ rất rẻ, nhưng nếu để nguyên thì kiểm tra từ vựng đỏ thêm một lỗi và khối kia có thể quét nhầm chữ cấm.
  file: `CONTEXT.md`
  severity: medium
  Đề xuất: new-contract

- **Bỏ «chỉ local» khỏi khối S08 trong mappings.yaml làm probe nap.mjs của noi-du-an-s08-khu-do-thi đỏ**
  Người dùng thấy gì: Một bài kiểm cũ của tính năng nối dự án S08 sẽ báo đỏ ở lần chạy lại vì quy tắc công khai đã đổi. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm bằng chứng cũ của tính năng khác hết hạn, không sai dữ liệu, và cần cập nhật bài kiểm theo quyết định công khai mới.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 3 — chỉ assert «chuỗi có mặt» trong khi lời hứa là quan hệ phủ định: Tin sơ cấp «không vào danh sách Bán, thước giá, metrics»**
  Người dùng thấy gì: Bài kiểm từ vựng chỉ xem các chữ có xuất hiện chứ không kiểm ý nghĩa, nên nếu sau này ai viết ngược nghĩa thì kiểm tra vẫn xanh. Hiện nội dung không bị sai.
  Căn cứ: Rủi ro chỉ xảy ra nếu có người sửa sai sau này, không ảnh hưởng người dùng hiện tại, và việc rà soát văn bản bắt được.
  file: `pipeline/scripts/tu-vung-du-an.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — Mức gắn: thang sáu mức bị đo bằng các chuỗi con rời rạc ở bất kỳ đâu trong khối**
  Người dùng thấy gì: Bài kiểm thang sáu mức gắn chỉ dò chữ rời rạc nên có thể bỏ sót việc thiếu một mức. Người dùng cuối không thấy gì.
  Căn cứ: Chỉ làm bài kiểm lỏng hơn mong muốn, không gây sai dữ liệu, và văn bản hiện đúng.
  file: `pipeline/scripts/tu-vung-du-an.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/8 lỗi rơi vào file không bộ đo nào phủ (app/src/lib/dq-labels.ts, _acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

