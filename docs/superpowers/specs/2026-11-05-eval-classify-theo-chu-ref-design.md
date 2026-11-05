# eval-classify đọc chữ theo tin ghép — thiết kế

Giao: Mạnh chọn mở hợp đồng mới ở Cổng Bằng chứng `ghep-anh-tren-the-gan-nhan` (Ngoài-1, Ngoài-8), giám sát xếp dãy P4, 05/11.

## Vì sao

Từ `ghep-anh-tren-the-gan-nhan`, người gắn đọc chữ của `ghep.chu_ref`. `docNhanNguoi` trong `pipeline/lib/eval-classify.mjs` vẫn nối chữ theo `ref_id`. Với dòng là bài chỉ có ảnh, chữ đó là URL ảnh: không rỗng nên không vào `mat_chu`, rồi bộ đọc chạy trên URL và bị so với nhãn đọc từ tin chữ. Điểm tụt giả, ghi vào `dq_check_results` không cảnh báo. Lát `s03-theo-nhom`, tách `test`: 176 dòng, 72 có tin chữ ghép, 22 bài ảnh không có tin chữ, 4 dòng trùng cụm. `eval_labels` của lát hôm nay 0 dòng nên chưa có số sai.

## Cách làm

1. `docNhanNguoi` nối chữ theo `coalesce(i.ghep->>'chu_ref', i.ref_id)`, cùng khoá với `baiDeGhi` của app, và lấy thêm cột `ghep`.
2. `gopNhan` xét từng dòng có nhãn: `ghep.trung_voi` có giá trị thì không vào tập chấm, đếm `trung_co_nhan`, vì đơn vị gắn là cả tin và dòng đại diện đã chấm; `ghep` có mà `chu_ref` rỗng là bài ảnh không có tin chữ, không chấm, đếm `khong_chu`; còn lại như cũ.
3. CLI in thêm hai số. Khuôn `detail` của `dq_check_results` không đổi, `/ops/quality` không đổi.
4. `ghep` NULL: kết quả giống hàm trước vòng từng trường, trừ hai số mới bằng 0.

Không có migration: đọc cột đã có từ 076.

## Không làm

- Chặn ghi nhãn vào dòng trùng cụm, đường lấy thêm của `label-sample`: hai việc riêng giám sát đã xếp.
- Lát có bài chỉ ảnh mà `ghep` NULL (lát đời trước): vẫn như cũ, lát đó không qua lệnh ghép.
- Nhãn có căn cứ Ảnh, Nhóm, Nghề vẫn so với bộ đọc chạy trên chữ, như trước vòng này. Giá: điểm lần chấm đầu vẫn có thể thấp giả ở các trường đó; tách theo căn cứ là việc khác, nêu ở thẻ.
- Hiện số dòng loại ở `/ops/quality`: khuyến nghị để việc sau; Hỏi-1 ở Cổng Phạm vi. Sau khi gắn đủ, tối đa 26/176 dòng tách `test` rời khỏi `n`.
