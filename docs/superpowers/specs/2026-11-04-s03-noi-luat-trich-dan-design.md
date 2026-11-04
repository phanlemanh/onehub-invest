# Nới luật trích dẫn căn hộ S03

Mạnh chọn «Nới, đo trước» ngày 04/11, sau khi lượt chính của `s03-llm-doc-toan-bo` chỉ áp được 6,8%.

## Vấn đề

`kiemTrichLoai` chỉ nhận ba từ: `căn hộ`, `chung cư`, `cc`. Môi giới viết `2PN`, `1N+`, `2n2wc`, `stu`, nên 1.938 đề xuất của model bị bỏ dù câu trích có thật. Mẫu 30 tin đều là căn hộ.

## Đo trước khi sửa

Chỉ đọc, 0 USD, 383 tin có nhãn: luật cũ 175/180 (cận dưới Wilson 0,937), bảng nới 219/224 (0,949). 44 ca thêm đều đúng. Mẫu yếu ở rủi ro nhà phố: chỉ 4/383 nhãn là loại khác căn hộ. Vì vậy thiết kế thêm hai chốt ở dưới và đo lại bằng mã thật ở eval E8.

## Luật mới

Chỉ áp khi model đã nói căn hộ. Nhánh cũ giữ nguyên mã `trich-dan:can-ho`. Nhánh mới mang mã `trich-dan:so-phong`:

- **Dạng nhận:** chữ số 1–5 kèm `pn`, `n`, `phòng ngủ`, có thể kèm `+`, `+1`, và `wc`, `vs`, `w`; cùng `studio`, `stu`.
- **Không nhận:** `1+` (không rõ là gì), `căn` đứng một mình (cũng là «căn nhà»), tên toà, tên dự án.
- **Chốt 1:** câu trích có chữ `nhà` thì không qua nhánh mới.
- **Chốt 2:** thân bài có từ của loại khác (nhà phố, biệt thự, mặt bằng…) thì không qua nhánh mới. Chốt này bỏ oan các bài «view biệt thự»: đo 40/2.550 bài, đều là căn hộ. Đổi lại máy không tự ghi ở đúng dạng bài Mạnh lo. Đây là Hỏi-1.
- **Ngữ cảnh loại trừ:** «cần mua 2PN», «gần…» bị loại như nhánh cũ.

## Xử lại đề xuất đã bỏ

Lệnh mới `doc-toan-bo-s03 --xu-lai-trich`, không gọi model. Mỗi đề xuất `skipped` lý do `khong-tu-khoa`:

1. Lấy nhãn trong `silver_labels` theo băm chữ hiện tại; không có nhãn cùng chữ thì bỏ qua.
2. Chạy lại `quyetTin` với trạng thái hiện tại của tin. Kết quả là `corroborated` thì đổi đề xuất đó sang `queued`, ghi `run_id` mới, mã luật, xoá `ly_do`, thêm `xu_lai_tu_run`, rồi gọi `apply_enrichment`.
3. Kết quả khác thì không đổi gì. Ý định, giá, diện tích không được xét lại ở pha này, và không tạo thẻ.

Không đổi `PROMPT_VERSION`, nên lượt hai dùng lại nhãn và chỉ trả tiền cho bài chưa đọc.

**Cổng mẫu:** thêm `LUAT_VERSION`. Dòng `doc-toan-bo:mau` ghi phiên bản luật. Lượt thật và `--xu-lai-trich` đều đòi dòng mẫu đạt của đúng phiên bản luật hiện tại, nên dòng đạt ngày 03/11 không mở được luật mới.

**Hoàn tác:** `revert_enrichment` theo `run_id` rút phát biểu, phân xử lại ô, nên tin loại suy trở về loại suy, tin `unknown` trở về `unknown`.

## Không làm

Không sửa model, prompt; không đụng giá, diện tích; không đổi giao diện; lượt hai (136 tin) và lượt ghi thật là lời riêng của Mạnh.
