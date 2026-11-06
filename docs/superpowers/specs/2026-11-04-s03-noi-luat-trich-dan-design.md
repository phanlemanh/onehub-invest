# Nới luật trích dẫn căn hộ S03

Mạnh chọn «Nới, đo trước» ngày 04/11, sau khi lượt chính của `s03-llm-doc-toan-bo` chỉ áp được 6,8%.

## Vấn đề

`kiemTrichLoai` chỉ nhận ba từ: `căn hộ`, `chung cư`, `cc`. Môi giới viết `2PN`, `1N+`, `2n2wc`, `stu`, nên 1.938 đề xuất của model bị bỏ dù câu trích có thật. Mẫu 30 tin đều là căn hộ.

## Đo trước khi sửa

Chỉ đọc, 0 USD, 383 tin có nhãn: luật cũ 175/180 (cận dưới Wilson 0,937), bảng nới 219/224 (0,949). 44 ca thêm đều đúng. Mẫu yếu ở rủi ro nhà phố: chỉ 4/383 nhãn là loại khác căn hộ. Vì vậy thiết kế thêm hai chốt ở dưới và đo lại bằng mã thật ở eval E9, tách riêng nhánh mới.

## Luật mới

Chỉ áp khi model đã nói căn hộ. Nhánh cũ giữ nguyên mã `trich-dan:can-ho`. Nhánh mới mang mã `trich-dan:so-phong`:

- **Dạng nhận:** một chữ số 1–5, có thể cách một khoảng trắng, kèm `pn`, `n`, `phòng ngủ`, có thể kèm `+`, `+1`, và `wc`, `vs`, `w`; cùng `studio`, `stu`. Hai đầu phải là ranh giới từ, nên `2 năm`, `3 người`, `3N2Đ`, `6pn`, `0pn`, `10n`, `stunning` không khớp.
- **Không nhận:** `1+` (không rõ là gì), `căn` đứng một mình (cũng là «căn nhà»), tên toà, tên dự án: 245 đề xuất ở lại, gồm 152 tên toà hoặc dự án, 88 có chữ «căn» mà không có số phòng, 5 dạng `1+`. Đây là Hỏi-2.
- **Chốt 1:** câu trích có từ `nhà` thì không qua nhánh mới, lý do `ngu-canh-loai-tru`.
- **Chốt 2:** thân bài có từ trong danh sách đóng sau thì không qua nhánh mới, lý do `ngu-canh-loai-tru`: nhà phố, nhà riêng, nhà mặt phố, nhà mặt tiền, nhà ngõ, nhà trong ngõ, nhà <số> tầng, biệt thự, liền kề, shophouse, đất nền, lô đất, mảnh đất, đất thổ cư, phòng trọ, nhà trọ, mặt bằng, văn phòng, ki ốt, kiot; cùng dạng không dấu nha pho, nha rieng, biet thu, lien ke, dat nen, phong tro, mat bang, van phong. Chốt này bỏ 9 trong 1.938 đề xuất đã đếm, phần lớn là bài liệt nhiều căn hoặc «view biệt thự». Đổi lại máy không tự ghi ở đúng dạng bài Mạnh lo. Đây là Hỏi-1.
- **Ngữ cảnh loại trừ:** «cần mua 2PN», «gần…» bị loại như nhánh cũ.

## Xử lại đề xuất đã bỏ

Lệnh mới `doc-toan-bo-s03 --xu-lai-trich`, không gọi model. Mỗi đề xuất `skipped` lý do `khong-tu-khoa`:

1. Lấy nhãn trong `silver_labels` theo băm chữ hiện tại; không có nhãn cùng chữ thì bỏ qua.
2. Chạy lại `quyetTin` với trạng thái hiện tại của tin. Kết quả là `corroborated` thì đổi đề xuất đó sang `queued`, ghi `run_id` mới, mã luật, xoá `ly_do`, thêm `xu_lai_tu_run`, rồi gọi `apply_enrichment`.
3. Kết quả khác thì không đổi gì. Ý định, giá, diện tích không được xét lại ở pha này, và không tạo thẻ.

**Tác động đã đếm (chỉ đọc, chưa chạy):** 1.684 trong 1.938 đề xuất qua luật mới, trong đó 94 tin đang `unknown`. AI đã áp từ 252 lên 1.936 trên 3.708 tin, khoảng 52,2%.

Không đổi `PROMPT_VERSION`, nên lượt hai dùng lại nhãn và chỉ trả tiền cho bài chưa đọc.

**Cổng mẫu:** thêm `LUAT_VERSION`. Dòng `doc-toan-bo:mau` ghi phiên bản luật và ghi riêng số của nhánh `trich-dan:so-phong`. Dòng chỉ đạt khi cả toàn mẫu lẫn nhánh mới đạt: nhánh mới ít nhất 30 ca, cận dưới Wilson ít nhất 0,85. Lượt thật và `--xu-lai-trich` đều đòi dòng đạt của đúng phiên bản luật hiện tại, nên dòng đạt ngày 03/11 (không có trường phiên bản) không mở được luật mới. `--thu` chỉ đọc nên không qua cổng này.

**Điểm tiêm cho test:** `chayLuot` và `quyetTin` nhận tuỳ chọn `kiemLoai`, mặc định là luật hiện tại; test truyền luật cũ để `chayLuot` thật sinh dòng `skipped` đúng hình dạng.

**Hoàn tác:** `revert_enrichment` theo `run_id` rút phát biểu, phân xử lại ô, nên tin loại suy trở về loại suy, tin `unknown` trở về `unknown`.

## Không làm

Không sửa model, prompt; không đụng giá, diện tích; không đổi giao diện; lượt hai (136 tin) và lượt ghi thật là lời riêng của Mạnh.
