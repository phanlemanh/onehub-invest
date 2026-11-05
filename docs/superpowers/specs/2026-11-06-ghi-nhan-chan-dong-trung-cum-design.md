# Chặn ghi nhãn vào dòng trùng cụm — thiết kế

Giao: Mạnh chọn mở hợp đồng mới ở Cổng Bằng chứng `ghep-anh-tren-the-gan-nhan` (Ngoài-6, Ngoài-13), giám sát xếp việc 2 dãy P4, 06/11.

## Vì sao

`ghep-anh-tren-the-gan-nhan` bỏ dòng trùng cụm (`eval_label_items.ghep->>'trung_voi'` có giá trị) khỏi hàng gắn: `tinKe`, `nhomCuaLat`, `tienDo` đều lọc nó. Nhưng `ghiNhan` trong `app/src/lib/labels-queries.ts` không xét cột này, nên POST `item_id` của một dòng trùng cụm vẫn ghi được nhãn. Nhãn đó thừa: tiến độ, bảng số không đếm, và `eval-classify` loại nó khỏi tập chấm (`trung_co_nhan`). Đường tới: tab mở từ trước khi chạy lại lệnh ghép, hoặc yêu cầu tự dựng. Lát `s03-theo-nhom` hôm nay: 11 dòng trùng cụm, 0 dòng có nhãn, nên chưa có nhãn thừa nào.

## Cách làm

1. Câu `SELECT ... FOR UPDATE` đầu `ghiNhan` lấy thêm `ghep->>'trung_voi'`. Khoá dòng đã có sẵn, nên lệnh ghép (UPDATE cùng dòng) và lượt ghi xếp hàng theo khoá: ghi sau khi `trung_voi` đã commit thì luôn thấy nó.
2. Thứ tự xét: tin không thuộc lát → 400 như cũ; người gọi đã gắn → 409 `DA_GAN_CUA_TOI` như cũ; dòng trùng cụm → 409 với câu mới `TRUNG_CUM`; đủ người → 409 như cũ. Đặt «đã gắn» trước «trùng cụm» để lượt gửi lại sau mất phản hồi vẫn được màn coi là đã lưu, dù dòng vừa thành trùng cụm.
3. `TRUNG_CUM` ở `app/src/lib/labels-normalize.ts`, cạnh `DA_GAN_CUA_TOI`: «Tin này trùng cụm với một tin khác». Màn đã xử mọi 409 khác `DA_GAN_CUA_TOI` bằng kết cục «đã có người»: báo «<câu> — chuyển tin kế» rồi tải tin kế. Không sửa màn, không sửa route.
4. Thêm thuật ngữ «Dòng trùng cụm» vào `CONTEXT.md`, vì câu báo hiện chữ này cho người gắn.

Không migration, không đổi route `app/src/app/api/v1/ops/labels/route.ts` (đường T3), không khởi động lại dev :3456 của main.

## Không làm

- Đường lấy thêm của `label-sample`: việc 3 dãy P4.
- Xoá hay chuyển nhãn đã có trên dòng trùng cụm: hôm nay 0 dòng; nhãn cũ (nếu sau này có) giữ nguyên, `eval-classify` đã loại khỏi chấm.
- Lượt hai (`/api/v1/ops/labels/<itemId>/review`): chỉ mở cho người đã gắn dòng, không tạo nhãn.
- Câu báo riêng trên màn cho ca trùng cụm: dùng đường 409 sẵn có.

## Kiểm

Test mới `app/tests/labels-trung-cum.test.tsx` trên lược đồ tạm như `labels.test.tsx`: ma trận loại dòng × trạng thái gắn viết trước, route thật, ca đồng thời với lệnh ghép giữ khoá, và `guiNhan` của màn trên phản hồi thật. Mỗi phép đo có bản đột biến đỏ trên cùng fixture. Hai test cũ `labels.test.tsx`, `labels-nhom.test.tsx` phải còn xanh.
