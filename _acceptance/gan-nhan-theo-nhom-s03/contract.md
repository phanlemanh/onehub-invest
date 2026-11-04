---
schema_version: 1
feature: Người gắn nhãn mở mẫu của từng nhóm S03 trên /ops/labels, gắn điều người trong nhóm hiểu gồm phân khu, trục, tầng, số WC, bài nhiều căn, người bán, SĐT, mỗi trường ghi căn cứ, bài phải dùng ngữ cảnh ghi lý do, rồi xem máy đọc gì để ghi loại trường hợp, và thấy bảng trường hợp theo nhóm
slug: gan-nhan-theo-nhom-s03
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [ui, api, cli]
status: approved
design_doc: docs/superpowers/specs/2026-11-04-gan-nhan-theo-nhom-s03-design.md
approved_by: Mạnh
approved_at: 2026-11-04
---

# Acceptance Contract: gan-nhan-theo-nhom-s03

## Context

Đo 04/11: 0 nhãn người; 2.629/3.583 tin căn hộ S03 không nêu dự án trong chữ. Mạnh chỉ ra màn gắn nhãn không ghi được điều người trong nhóm hiểu, thiếu trường và không có lý do. Hàng này mở rộng màn của PL7 để Mạnh và đội gắn theo nhóm. Kết quả là đầu vào của `GCQ1`, `PL13`, `PL20`, `GC2`.

## Criteria

- AC-1 (cross-layer): Given DB thử đã có nhãn và mẫu đời trước, When áp migration mới hai lần, Then `eval_labels` nhận tám trường mới và cột `basis`, `eval_label_items` có `stratum`, có bảng lý do và bảng trường hợp, view đồng thuận ra đủ 17 trường, băm dòng cũ không đổi, và không bảng nào trong số đó nằm trong đường đẩy lên cloud.
- AC-2 (cross-layer): Given DB thử có nhóm lớn, nhóm nhỏ, post thử và nội dung trùng giữa hai nhóm, When chạy `label-sample --theo-nhom`, Then mỗi nhóm lớn đủ 30 bài, nhóm nhỏ tới 5 bài, mỗi dòng mang mã nhóm, 20% gắn trùng tính trong từng nhóm, 0 post thử; nội dung trùng thuộc về nhóm xếp trước, nhóm sau bù từ phần còn lại, lệnh in số nội dung bị bỏ vì trùng và số nhóm thiếu; chạy lại thêm 0 dòng; `--thu` không ghi.
- AC-3 (cross-layer): Given vai ops và lát có mẫu, When mở `/ops/labels` không kèm tham số, chọn một nhóm, điền đủ biểu mẫu rồi lưu, Then trang mở đúng lát theo nhóm, chỉ hiện bài của nhóm đã chọn, ở 1440×900 thấy đủ 17 ô, Lý do và nút Lưu mà không cuộn, bài gốc dài vẫn đọc được nguyên văn, một lượt lưu ghi 17 dòng nhãn và một dòng lý do trong một giao dịch, và tiến độ của nhóm tăng.
- AC-4 (cross-layer): Given ma trận căn cứ và giá trị, When lưu, Then toàn «Chữ bài» không cần lý do; có ô căn cứ khác mà lý do trống trả 400 dưới ô Lý do và không ghi dòng nào; «Không suy ra được» lưu `basis` rỗng; căn cứ lạ, SĐT sai khuôn, WC không phải số trả 400 đúng ô; «0912 345 678» lưu thành `+84912345678`; Phân khu «Rainbow» căn cứ «Ngữ cảnh nhóm» kèm lý do trả 200 và đọc lại đúng; dự án, phân khu, toà, trục, diện tích khai «Chữ bài» mà giá trị không có trong chữ bài trả 400 dưới đúng ô với câu «Chữ bài không có giá trị này — chọn căn cứ khác».
- AC-5 (cross-layer): Given bài có giá trị máy ở `sale_offers`, `silver_labels` và thẻ nhóm, When người chưa lưu bài đó mở màn hay gọi API, Then HTML, dữ liệu RSC và API không chứa giá trị máy lẫn thẻ nhóm, gọi lượt hai trả 403; When đã lưu, Then lượt hai hiện Anh gắn, Bộ đọc, AI đọc và thẻ nhóm; bài có nhiều tin thì so với tin đầu tiên và nói rõ tổng số tin; người thứ hai của bài gắn trùng không thấy nhãn, lý do hay ghi chú của người trước ở lượt nào.
- AC-6 (cross-layer): Given người đã lưu nhãn, When ghi trường hợp, xác nhận thẻ nhóm hay bỏ qua, Then băm các dòng `eval_labels` của bài không đổi, trường hợp và trả lời thẻ đúng, sai, chưa xét được thêm mới và đọc lại đúng, không có đường nào sửa nhãn đã lưu, lưu lại nhãn vẫn trả 409, và lỗi khi lưu trường hợp không làm mất nhãn.
- AC-7 (cross-layer): Given lát có nhãn và trường hợp ở nhiều nhóm, When mở bảng trường hợp, Then mỗi nhóm hiện số bài đã gắn, số bài phải dùng ngữ cảnh, số lần theo từng loại trường hợp, khớp đếm SQL độc lập; nhóm chưa gắn ghi «chưa có»; bảng trên màn chỉ có số, không vai nào thấy chữ lý do hay ghi chú ở đó; khổ 390 không tràn ngang trang.
- AC-8: Given lát có lý do và trường hợp, When chạy `label-cases --json`, Then đầu ra theo từng nhóm gồm lý do, trường hợp, trả lời thẻ nhóm và các giá trị căn cứ ngữ cảnh, không chứa định danh người gắn; đây là nơi duy nhất đọc chữ lý do; chuỗi thật lấy mẫu, lưu qua route, xuất, chấm chạy được trên DB thử đã áp migration thật; chạy lại ra y nguyên; lát không tồn tại thoát khác 0 kèm thông điệp.
- AC-9: Given bộ đo cũ, When chạy `eval-classify`, `label-agreement`, các test nhãn cũ trên dữ liệu có cả trường mới, Then chín trường cũ chấm không đổi, trường mới không làm sai số cũ, phút công vẫn tính, và lát `?lat=` đời trước vẫn mở với biểu mẫu đúng.
- AC-10 (cross-layer): Given `VERCEL=1`, chưa đăng nhập, vai viewer, DB lỗi và lát rỗng, When gọi màn và API lượt hai, trường hợp, Then cloud trả «Chỉ ở máy thu» không truy vấn bảng nhãn; chưa đăng nhập, viewer bị chặn ghi; lỗi có «Thử lại»; rỗng có lệnh lấy mẫu; tin vừa có người gắn chuyển tin kế; người đã gắn hết thấy số bài chờ người thứ hai; đúng các trạng thái trong Đặc tả UX.

## Coverage

- Trục (`coverage-scan.md`): **lượt** mù, xem máy, tổng hợp (AC-3, AC-5, AC-6, AC-7) · **nhóm trường** tin, vị trí, căn, giá, người bán (AC-1, AC-3) · **căn cứ** chữ bài, ngữ cảnh nhóm, kiến thức nghề, không suy ra được (AC-4) · **vai và nơi** ops ở máy thu, viewer, chưa đăng nhập, cloud (AC-10).
- Thước CE: đề bài của Mạnh 04/11, thiết kế PL7, chuẩn gắn nhãn hai người `[NGÀNH: Label Studio]` (overlap, annotator agreement) `[CE chưa kiểm chứng: danh sách loại trường hợp, lượt thử của Mạnh sẽ sửa]`.

## Đường đo

- Ngưỡng ở `opportunity.md`: gắn trọn 30 bài của một nhóm trên màn, không phải dùng bảng tính; bảng trường hợp ra được danh sách để viết quy ước.
  - Đủ trường và lý do: đếm `eval_labels`, `eval_label_reasons` theo nhóm. AC bảo đảm: AC-3, AC-4.
  - Danh sách cho quy ước: `label-cases --json`. AC bảo đảm: AC-7, AC-8.
  - Số phút: `label-agreement` (phút công). AC bảo đảm: AC-9.
  - «Gắn trọn 30 bài»: một người có đủ `eval_labels` cho 30 `item_id` khác nhau của nhóm; bài chờ người thứ hai không tính là thiếu. AC bảo đảm: AC-3, AC-10.
  - «Không phải dùng bảng tính»: câu có/không Mạnh trả lời sau lượt gắn đầu, ghi vào biên bản; máy không đo được.
  - Căn cứ có bị dùng sai không: tỉ lệ ô `project` có căn cứ khác chữ bài trên các bài chữ không nêu dự án, đọc sau lượt đầu.

## Out of scope

- Viết quy ước nhóm, đo quy ước (`GCQ1`) và ghi suy ra (`GCQ2`).
- Nhập bảng tính của lượt thử vào `eval_labels`.
- Gắn từ xa hay đưa nhãn lên cloud (ADR-0015, luật 6).
- Sửa, xoá nhãn đã lưu.
- Nhãn dạng khoảng diện tích: ghi vào Lý do.
- Giữ `?lat=` qua trang đăng nhập: lát mặc định đã giải quyết ca của lát theo nhóm.

## Notes

- Câu chờ Mạnh ở Cổng Phạm vi: Hỏi-1 (thẻ nhóm hiện lúc nào), Hỏi-2 (đội làm ở đâu), Hỏi-4 (nhãn bảng tính), Hỏi-5 (ngưỡng), Hỏi-6 (cỡ mẫu) — sổ quyết định.
- Bố cục: bản D Mạnh chọn 04/11 (`design-pass.md`).
- Bài nhiều căn: gắn cho căn đầu tiên theo thứ tự chữ bài; tin máy so là tin có `offer_id` nhỏ nhất trong các tin chứa bài.
- Dự án, phân khu ghi tên đầy đủ, không ghi bí danh; bí danh ghi vào Lý do. Nếu không thì «RB» và «Rainbow» thành bất đồng giả.
- Số migration 072, LL đã cấp trong sổ (071 dành cho SV2). S4 và đường nền chạy dưới khoá s4, không chạy khi job S06 còn chạy; áp lên DB thật cần Mạnh duyệt kèm `pg_dump`. Mọi phép đo chạy trên DB thử `oneinvest_gcn_nhan`, không chạy migration chưa gộp trên `oneinvest`.
