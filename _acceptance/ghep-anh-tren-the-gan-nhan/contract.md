---
schema_version: 1
feature: Thẻ gắn nhãn hiện tin chữ cùng cả cụm ảnh đã ghép bằng luật PL28, ghi rõ là ghép suy ra, vẫn gắn mù
slug: ghep-anh-tren-the-gan-nhan
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, api, cli]
status: approved
design_doc: docs/superpowers/specs/2026-11-05-ghep-anh-tren-the-gan-nhan-design.md
approved_by: Mạnh
approved_at: 2026-11-05
---

# Acceptance Contract: ghep-anh-tren-the-gan-nhan

## Context

S03 thu mỗi ảnh thành một bản ghi riêng nên thẻ gắn nhãn chỉ thấy một tấm, không có chữ. Luật ghép PL28 đã có nhưng mẫu và màn gắn nhãn chưa dùng. Đo 05/11: `eval_labels` của lát 0 dòng; 180 bài chỉ có ảnh gồm 111 có một tin chữ, 22 nhiều tin chữ, 47 không có; đọc tay 30 cụm thấy 2 cụm sai rõ, cả hai ở ca nhiều tin chữ.

Source input: lời Mạnh 05/11 qua giám sát.

## Criteria

- AC-1: Given mọi bài của lát thử gồm ca một tin chữ, nhiều tin chữ, không tin chữ, có chữ có cụm, có chữ không cụm, thiếu người gửi, cụm có số tin chữ gần lệch nhau, When lệnh ghép chạy, Then `ghep` của từng dòng khớp kết quả gọi trực tiếp `ganBaiAnh`, có chữ không cụm là NULL, số tin chữ gần là lớn nhất trên cụm, và mã app, lệnh ghép không có cửa sổ thời gian riêng.
- AC-2: Given DB thử, When chạy lệnh ghép hai lần rồi lấy mẫu một lát mới, Then lần hai không đổi dòng nào, lát mới có `ghep`, bốn cột `item_id, ref_id, text_hash, stratum` và nhãn đã có không đổi, `--thu` không ghi; đích khác DB thử khi chưa khai rõ thì từ chối. (cross-layer)
- AC-3: Given sáu loại bài với `ghep` do lệnh ghép thật sinh, When tải thẻ, Then dữ liệu trả về đúng chữ của tin chữ, đủ đường ảnh theo thứ tự, cờ ghép, số tin chữ gần; `ghep` NULL thì giống hệt bản trước; phản hồi HTTP của trang không có URL gốc hay mã bài. (cross-layer)
- AC-4: Given các bài trên, When mở thẻ, Then thấy nhãn «Ghép suy ra · N ảnh», chữ và dải ảnh một hàng, cờ nhiều tin chữ khi có, câu «Không có tin chữ trong 2 phút» khi không có, không có nhãn ghép ở bài có chữ không cụm; cụm 21 ảnh vẫn thấy nút Lưu; một ảnh lỗi trong cụm hiện «Ảnh không tải được» kèm Thử lại mà các ảnh khác vẫn xem được; xem lớn chuyển ảnh bằng Trước, Sau, phím mũi tên, Esc đóng; đọc được cả ở khổ 1280 và 375.
- AC-5: Given `?nhan=&anh=i`, When i chạy khắp cụm, Then mỗi ảnh trả đúng tệp đã lưu hoặc lấy hộ, ngoài khoảng trả 404, đường dẫn xấu ở bất kỳ bài nào của cụm vẫn bị chặn, cây snapshot không đổi. (cross-layer)
- AC-6: Given mồi giá trị máy ở mọi bài của cụm và ở tin chữ, When tải thẻ qua HTTP thật, Then không có mồi trước khi lưu; sau khi lưu, bộ đọc và AI đọc lấy theo tin chữ ghép, bài không ghép giống hệt hàm trước vòng trừ trường mới. (cross-layer)
- AC-7: Given bài ghép, When lưu nhãn, Then căn cứ Chữ so với chữ của tin ghép, căn cứ mặc định là Chữ khi có chữ ghép và Ảnh khi không có; trường hợp «Ghép sai» lưu được, giá trị lạ bị từ chối, migration áp hai lần không lỗi và nhãn cũ không đổi. (cross-layer)
- AC-8: Given Hỏi-1 chọn giữ dòng và bỏ dòng trùng cụm khỏi hàng, When gắn hết một nhóm, Then dòng có `trung_voi` không hiện và không tính tiến độ, số dòng của lát không đổi; lát có `ghep` rỗng tính như cũ.
- AC-9: Given 367 bài thật qua kết nối chỉ đọc, When chạy hàm thật không ghi, Then in đúng 133 bài ghép, 22 nhiều tin chữ, 47 không tin chữ, 11 bài có chữ có cụm, 176 NULL, 144 dòng có nhãn ghép, 356 đơn vị, cụm lớn nhất 21, mọi cụm có tin chữ gần từ 2 đều có cờ trên đơn vị đại diện; bảng đọc tay khớp băm đã ghim và cộng đủ 30; `oneinvest` không có dấu vết của lượt đo.
- AC-10: Given mã, hồ sơ, ảnh chứng, When quét, Then không có tên thật, tên miền, URL nguồn, không có chữ hay mã bài thật trong bảng đọc tay; fixture dùng ảnh giả và `example.test`; `collector/` và hook không đổi.

## Coverage

Thước là đo 05/11 trên 367 bài (design doc).

- Loại bài: chỉ ảnh một tin chữ, nhiều tin chữ, không tin chữ (AC-1, AC-3, AC-4) · có chữ có cụm (AC-3) · thiếu người gửi (AC-1).
- Loại bài thứ sáu: có chữ không cụm, 176 dòng, NULL (AC-1, AC-3, AC-4).
- Cỡ cụm: một ảnh, trung vị 2, lớn nhất 21 (AC-4, AC-5, AC-9).
- Trạng thái ảnh: có tệp, thiếu tệp giữa cụm (AC-4).
- Đường đi: lệnh ghép, lấy mẫu, thẻ, ảnh, lưu, đối chiếu (AC-1 đến AC-7).
- Đơn vị mẫu: dòng trùng cụm, lát cũ, lát mới (AC-2, AC-8).
- Ranh giới: mù, tên nguồn, làn ZCode, DB thật (AC-6, AC-9, AC-10).

Later: ghép các bài ảnh không có tin chữ · sửa lệch mẫu bằng trọng số · đếm ghép nhầm từ trường hợp «Ghép sai» · mã album từ làn thu. Never: luật ghép thứ hai ở app.

## Đường đo

- Tỉ lệ ghép nhầm: `probes/doc-tay.json`, AC-9; sau khi gắn nhãn, đếm trường hợp «Ghép sai» (Later).

## Out of scope

- Sửa `collector/`, hook, `ganBaiAnh`, cửa sổ 120 giây.
- Xoá, sinh lại lát, đổi hàm chọn mẫu: chưa có lời Mạnh (Hỏi-1).
- Áp migration và ghi `ghep` lên DB thật: xin giám sát kèm `pg_dump`.
- Giữ số điện thoại khi bỏ link: hàng riêng.

## Notes

- Dùng cổng dev 3463 của dãy P4, DB thử `oneinvest_ghep_nhan`.
- Thứ tự triển khai, cần lời Mạnh (Hỏi-4): sao lưu, áp 076, chạy lệnh ghép `--lat s03-theo-nhom` trên DB thật, ghi vào 191 dòng của lát đã qua Cổng GC0 (176 dòng còn NULL), rồi gộp mã. Lùi: `UPDATE eval_label_items SET ghep = NULL`.
- Migration số 076, giám sát cấp 05/11. Áp lên DB thật cần lời Mạnh ở Cổng Phạm vi (Hỏi-4), kèm sao lưu.
- Thẻ dùng số đếm theo `ganBaiAnh` (cụm trung bình 4,5, lớn nhất 21). Số 6,8 và 57 của giám sát đếm mọi bài ảnh trong ±120 giây, không theo phép gán. Tin 208 ảnh trên bảng `media` là nhiều bài gộp vào một offer, không đi qua đường này.
