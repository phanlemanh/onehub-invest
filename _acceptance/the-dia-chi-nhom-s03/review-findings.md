# Review findings: the-dia-chi-nhom-s03 (round 8)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Trang Ops mới /ops/group-cards chưa khai trong docs/architecture/portals.md**
  Người dùng thấy gì: Bảng liệt kê các trang Ops trong tài liệu thiếu một trang mới. Người dùng không thấy gì khác trên màn, chỉ tài liệu cổng chưa đầy đủ.
  Căn cứ: Chỉ là tài liệu thiếu một dòng, không mất dữ liệu, bổ sung sau rất rẻ.
  file: `app/src/app/ops/group-cards/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **kiem-sau.sql chép tay định nghĩa «bài thử» — bản thứ năm ngoài vòng giữ của GN5**
  Người dùng thấy gì: Lệnh kiểm sau khi áp có thể báo sai (đỏ hoặc xanh giả) nếu sau này luật nhận diện bài thử đổi. Hôm nay hai số vẫn khớp.
  Căn cứ: Chỉ ảnh hưởng bước kiểm khi luật đổi trong tương lai, không làm hỏng dữ liệu, người vận hành nhìn ra được lệch số.
  file: `_acceptance/the-dia-chi-nhom-s03/ap-may-thu/kiem-sau.sql`
  severity: medium
  Đề xuất: known-limits

- **Route ghi thẻ không kiểm phân khu thuộc dự án đã chọn (thiếu validation ở biên)**
  Người dùng thấy gì: Gọi thẳng đường ghi có thể lưu thẻ có phân khu của dự án khác. Giao diện không cho chọn như vậy nên người dùng bình thường ít gặp.
  Căn cứ: Dữ liệu sai chỉ xảy ra khi gọi trực tiếp ngoài giao diện, nhưng sẽ đóng dấu địa chỉ mâu thuẫn lên tin ở bước sau nên đáng làm trong việc riêng.
  file: `app/src/lib/the-dia-chi-nhom.ts`
  severity: medium
  Đề xuất: new-contract

- **Route group-cards thiếu chốt «chỉ ở máy thu» như các route bảng local khác; chú thích nói sai mã lỗi**
  Người dùng thấy gì: Trên cloud hoặc máy chưa áp bảng thẻ, đường ghi trả lỗi chung thay vì thông báo rõ chỉ có ở máy thu. Không có dữ liệu bị ghi sai.
  Căn cứ: Chỉ là thông báo lỗi kém rõ trên môi trường không dùng tính năng này, không mất dữ liệu.
  file: `app/src/app/api/v1/ops/group-cards/route.ts`
  severity: medium
  Đề xuất: known-limits

- **ghiNhap: không có chốt khi UPDATE không khớp dòng (người vừa quyết thẻ giữa chừng) → TypeError làm hỏng cả lượt**
  Người dùng thấy gì: Nếu người vận hành vừa nhận hoặc bác một thẻ đúng lúc lệnh dựng nháp chạy, lượt dựng bị huỷ và phải chạy lại. Không mất dữ liệu.
  Căn cứ: Hiếm gặp, hỏng cả lượt nhưng được hoàn lại sạch và chạy lại là xong.
  file: `pipeline/scripts/the-dia-chi-nhom.mjs`
  severity: low
  Đề xuất: known-limits

- **Chú thích trong lib còn trỏ bề mặt cũ (route source-groups, khu «Sổ đơn vị thu» trên /ops/sources)**
  Người dùng thấy gì: Chú thích trong mã nguồn còn chỉ về chỗ cũ. Người dùng không thấy ảnh hưởng.
  Căn cứ: Chỉ gây nhầm cho người đọc mã sau này, không ảnh hưởng người dùng, sửa tiện tay khi chạm tệp.
  file: `app/src/lib/the-dia-chi-nhom.ts`
  severity: low
  Đề xuất: wont-fix

- **coBang dò cột không lọc table_schema**
  Người dùng thấy gì: Trên môi trường thử có nhiều lược đồ, trang có thể đoán sai phiên bản bảng và đọc thiếu một cột. Máy thu thật không bị.
  Căn cứ: Chỉ nằm ở môi trường thử, không chạm dữ liệu thật và dễ nhận ra khi trang báo lỗi.
  file: `app/src/lib/the-dia-chi-nhom.ts`
  severity: low
  Đề xuất: known-limits

- **Sửa tay app/next-env.d.ts — tệp máy sinh, sẽ lật lại khi chạy next dev**
  Người dùng thấy gì: Một tệp tự sinh bị đổi, gây nhiễu khi so sánh thay đổi giữa các nhánh. Người dùng không thấy.
  Căn cứ: Chỉ là nhiễu trong lịch sử thay đổi, tự lật lại khi chạy công cụ, trả về bản gốc rất rẻ.
  file: `app/next-env.d.ts`
  severity: low
  Đề xuất: wont-fix

- **Bất biến «số thẻ sống = số nhóm có bài» vẫn vỡ vĩnh viễn với thẻ đã duyệt/bác**
  Người dùng thấy gì: Về sau, khi một nhóm đã duyệt thẻ rồi hoá ra không còn bài thật, số đếm thẻ và số nhóm sẽ lệch mãi và phép kiểm báo đỏ dù không ai sai.
  Căn cứ: Không xảy ra hôm nay và không mất dữ liệu, nhưng sẽ gây báo động giả kéo dài nên nên xử lý trong việc riêng.
  file: `pipeline/scripts/the-dia-chi-nhom.mjs`
  severity: medium
  Đề xuất: new-contract

- **Nháp thẻ đọc `sale_offer_records` nên đếm cả tin đã NGHỈ vào phiếu bầu phường**
  Người dùng thấy gì: Tin đã nghỉ vẫn được tính khi máy đề xuất phường cho nhóm, nên gợi ý phường có thể lệch ở vài nhóm sát ngưỡng.
  Căn cứ: Chỉ là nháp, người duyệt xem và sửa được trước khi nhận, nên hậu quả nhẹ nhưng đáng sửa để nháp chính xác hơn.
  file: `pipeline/scripts/the-dia-chi-nhom.mjs`
  severity: medium
  Đề xuất: new-contract

- **Route ghi thẻ không kiểm phân khu có thuộc dự án đã chọn**
  Người dùng thấy gì: Gọi thẳng đường ghi có thể lưu phân khu của dự án khác. Giao diện không cho chọn như vậy.
  Căn cứ: Chỉ xảy ra khi gọi ngoài giao diện, nhưng dữ liệu sai sẽ đi tiếp sang bước đóng dấu tin nên nên chặn trong việc riêng.
  file: `app/src/lib/the-dia-chi-nhom.ts`
  severity: low
  Đề xuất: new-contract

- **Hai đường đếm «độc lập» lệch bộ lọc kênh và lệch bản ghi mới nhất**
  Người dùng thấy gì: Phép đếm đối chứng có thể báo đỏ giả trong tương lai khi dữ liệu nguồn đổi hình dạng. Hiện nay khớp.
  Căn cứ: Không mất dữ liệu và chưa xảy ra, nếu đỏ thì người vận hành thấy ngay và tra được.
  file: `pipeline/scripts/the-dia-chi-nhom-that.mjs`
  severity: low
  Đề xuất: known-limits

- **Chú thích đầu tệp và docstring trỏ sai cổng/route**
  Người dùng thấy gì: Chú thích trong mã trỏ sai chỗ. Người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ gây nhầm cho người đọc mã sau, sửa gần như không tốn gì khi chạm tệp.
  file: `app/src/lib/the-dia-chi-nhom.ts`
  severity: low
  Đề xuất: wont-fix

- **Sửa tay tệp máy sinh `next-env.d.ts`**
  Người dùng thấy gì: Tệp tự sinh bị ghim sang đường khác, có thể làm bước kiểm kiểu cuối lượt báo đỏ trên cây làm việc mới. Người dùng không thấy.
  Căn cứ: Chỉ là nhiễu cho người làm, tự sinh lại khi chạy công cụ, không chạm dữ liệu.
  file: `app/next-env.d.ts`
  severity: low
  Đề xuất: wont-fix

- **Fixture VIẾT TAY đúng khuôn bên đọc — căn cứ `muc_dich.ban/thue` không round-trip từ writer**
  Người dùng thấy gì: Nếu phía dựng nháp đổi tên khoá số bán/thuê, màn hình sẽ lặng lẽ hiện «0 bán, 0 thuê» mà bộ thử vẫn xanh.
  Căn cứ: Chỉ lộ khi có người đổi cấu trúc dữ liệu, sai hiển thị nhưng không mất dữ liệu, thêm một phép thử nối hai phía là rẻ.
  file: `app/tests/the-dia-chi-nhom-app.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Fixture/bản chép VIẾT TAY không round-trip — vị từ «bài thử» trong kiem-sau.sql là bản chép thứ năm nằm ngoài bộ giữ GN5**
  Người dùng thấy gì: Bước kiểm sau khi áp có thể báo đỏ hoặc xanh giả nếu luật bài thử đổi mà bản chép không đổi theo.
  Căn cứ: Chỉ ảnh hưởng độ tin của một phép kiểm, không động dữ liệu, người vận hành thấy lệch số.
  file: `_acceptance/the-dia-chi-nhom-s03/ap-may-thu/kiem-sau.sql`
  severity: medium
  Đề xuất: known-limits

- **Đo CHỈ DẪN thay vì ĐẦU RA — AC-9a grep chữ trong sao-luu.sh, không chạy nó**
  Người dùng thấy gì: Bộ thử chỉ soi chữ trong tệp sao lưu chứ chưa chạy nó, nên một lỗi hành vi của bước sao lưu có thể lọt qua.
  Căn cứ: Sao lưu là bước người vận hành chạy và nhìn kết quả trước khi áp, lỗi lộ ra ngay, không mất dữ liệu.
  file: `pipeline/tests/the-dia-chi-nhom-lui.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Assert «chuỗi có mặt» trong khi lời hứa là QUAN HỆ giữa thẻ và nhãn**
  Người dùng thấy gì: Phép thử chỉ kiểm chữ «Chưa có tên» có xuất hiện đâu đó, chưa chắc đúng ở hàng cần hiện.
  Căn cứ: Chỉ là độ chặt của bộ thử, màn hình hiện đúng hôm nay, không ảnh hưởng người dùng.
  file: `app/tests/the-dia-chi-nhom-app.itest.tsx`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

⚠ Cụm ngoài vùng phủ: 5/18 lỗi rơi vào file không bộ đo nào phủ (app/src/app/ops/group-cards/page.tsx, _acceptance/the-dia-chi-nhom-s03/ap-may-thu/kiem-sau.sql, app/next-env.d.ts) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
