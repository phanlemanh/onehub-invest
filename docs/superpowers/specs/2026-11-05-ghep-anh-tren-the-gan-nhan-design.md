# Ghép ảnh trên thẻ gắn nhãn — thiết kế

Giao: Mạnh qua giám sát, 05/11. Hồ sơ `ghep-anh-tren-the-gan-nhan`, dãy P4.

## Vì sao

S03 thu mỗi ảnh thành một bản ghi riêng, không có mã album. `pipeline/lib/gop-anh.mjs` (PL28) đã ghép ảnh vào tin chữ ở `transform-media` và `vlm-anh`, nhưng `label-sample.mjs` và `/ops/labels` chưa dùng. Người gắn thấy một tấm ảnh, không có chữ, trong khi bài thật là một tin chữ kèm nhiều ảnh.

## Số đo 05/11 (chỉ đọc, lát `s03-theo-nhom`, 367 dòng)

- `eval_labels` của lát: 0 dòng.
- 180 bài chỉ có ảnh: 111 có đúng 1 tin chữ trong 120 giây, 22 có nhiều tin chữ, 47 không có. Giám sát đo cùng ba số này.
- 187 bài có chữ, 11 bài trong đó có cụm ảnh, trung bình 3,2 ảnh.
- 133 bài chỉ có ảnh được ghép vào cụm trung bình 4,5 bài ảnh, trung vị 2, lớn nhất 21; 19 bài ở cụm từ 10 trở lên.
- Tính theo tin: 356 đơn vị. 8 đơn vị có từ 2 dòng mẫu trở lên, gồm 19 dòng, tức 11 dòng thừa.
- 95/133 bài ghép có `sale_offers` qua tin chữ, 0/180 có `sale_offers` trực tiếp. Bảng so lượt hai hôm nay không thấy bộ đọc ở các bài này.
- Lệch mẫu: 133/309 tin chữ của lát có ảnh (43%), toàn S03 là 9.979/49.192 (20%).

## Số ghép nhầm, đọc tay 30 cụm (`probes/doc-tay.json`)

Chọn tất định theo băm mã, ba tầng. «Đúng» nghĩa là không thấy mâu thuẫn giữa chữ và ảnh, không phải chứng minh.

| Tầng | Đúng | Sai rõ | Không phán được | Không có tệp ảnh |
|---|---|---|---|---|
| 1 tin chữ, cụm dưới 10 (14) | 7 | 0 | 0 | 7 |
| Nhiều tin chữ (10) | 5 | 2 | 1 | 2 |
| Cụm từ 10 (6) | 4 | 0 | 1 | 1 |
| Cộng (30) | 16 | 2 | 2 | 10 |

Hai ca sai rõ đều ở tầng nhiều tin chữ. Một cụm chứa ảnh của hai căn, vì album đứng trước chú thích của căn sau nên ảnh gần tin trước hơn. Một tin tìm khách bị gán ảnh chào hàng của căn khác. Trên 18 cụm phán được: sai 2 (11%); tầng nhiều tin chữ 2/7. Mẫu nhỏ, chỉ để định hướng.

## Cách làm

1. **Ghép tính sẵn, app chỉ đọc.** `pipeline/label-ghep.mjs` gọi đúng `ganBaiAnh` và `laChiAnh`, ghi cột `eval_label_items.ghep` (jsonb, migration 076). App không import pipeline (`app/src/lib/ai-calls-queries.ts`), nên tính ở app sẽ phải chép luật. Ghi một lần còn giữ cụm ổn định: hai người gắn cùng một bài thấy cùng một cụm dù sau đó thu thêm bài. Không đọc từ bảng `media`: 38/133 bài ghép có tin chữ không thuộc offer nào nên không có dòng ở đó, và bảng ấy gộp nhiều bài vào một offer. Không dùng bảng riêng: mỗi dòng mẫu có đúng một giá trị, cột cùng dòng với `stratum` khỏi thêm phép nối. Lát mới: `label-sample.mjs` ghi luôn khi lấy mẫu.
2. **Khuôn cột:** `{ chu_ref, anh_refs, so_chu_gan, trung_voi }`. `chu_ref` là tin chữ, rỗng khi không có. `anh_refs` là các bài ảnh của cụm theo thời gian. `so_chu_gan` là số tin chữ trong 120 giây, lấy lớn nhất trên mọi bài ảnh của cụm, để dòng đại diện không mất cờ. `trung_voi` là `ref_id` của dòng đại diện khi dòng này cùng cụm với dòng có `item_id` nhỏ hơn.

   | Loại bài | Số dòng | `ghep` |
   |---|---|---|
   | Chỉ ảnh, có tin chữ | 133 | `chu_ref` là tin chữ, `anh_refs` cả cụm |
   | Có chữ, có cụm | 11 | `chu_ref` là chính bài, `anh_refs` cả cụm |
   | Chỉ ảnh, không tin chữ | 47 | `chu_ref` rỗng, `anh_refs` là chính bài, `so_chu_gan` 0 |
   | Có chữ, không cụm | 176 | NULL, đường đọc như trước |

   Nhãn «Ghép suy ra» hiện khi `chu_ref` có và `anh_refs` khác rỗng: 144 dòng trước khi trừ dòng trùng. Lối lùi trên DB: `UPDATE eval_label_items SET ghep = NULL` đưa màn về như cũ.
3. **Thẻ:** chữ của tin chữ, dải ảnh cả cụm, nhãn «Ghép suy ra» và số ảnh. Dải một hàng cuộn ngang, nên cụm lớn không đẩy biểu mẫu khỏi màn. Xem lớn có nút Ảnh trước, Ảnh sau; phím mũi tên thu khỏi phạm vi sau lượt chấm 2 vì hộp thoại của thư viện chặn phím này. Không cắt bớt ảnh: lớn nhất của lát là 21.
4. **Ca nhiều tin chữ:** vẫn ghép theo tin gần nhất, kèm cờ «Có N tin chữ trong 2 phút, máy chọn tin gần nhất». Ghép sai thì ghi trường hợp «Ghép sai» ở lượt hai, để sau này đếm được từ nhãn người.
5. **Không có tin chữ (47 bài):** hiện ảnh của chính bài, kèm «Không có tin chữ trong 2 phút». Không ghép các bài ảnh với nhau: đó là luật thứ hai.
6. **Lưu nhãn:** căn cứ Chữ so với chữ của tin ghép. Bài có chữ ghép thì căn cứ mặc định là Chữ; không có chữ thì là Ảnh.
7. **Đối chiếu lượt hai:** bộ đọc và AI đọc tra theo `chu_ref` khi có. Bài không ghép giữ nguyên.
8. **Dòng trùng cụm:** theo Hỏi-1. Khuyến nghị: dòng có `trung_voi` không vào hàng gắn và không tính tiến độ, không xoá dòng nào.

Phục vụ ảnh: `/api/zalo-media?nhan=&anh=` duyệt cả cụm theo cột `ghep`, cùng lớp chặn đường dẫn và vai như hiện tại.

## Đặc tả UX

<!-- ux-spec -->
**Thẻ việc:** người gắn đọc một tin đủ chữ và ảnh rồi điền biểu mẫu.

**Khuôn IA đã chọn + căn cứ:** giữ khuôn thẻ một bài của `/ops/labels`, thêm vùng ảnh đã có. Không tra mẫu ngoài: khuôn hiển nhiên.

| Trạng thái | Chỗ | Thấy gì | Thoát |
|---|---|---|---|
| ST-ghep | đầu thẻ | Nhãn «Ghép suy ra · N ảnh», chữ tin chữ, dải ảnh | xem lớn, điền |
| ST-nhieu-chu | đầu thẻ | Thêm cờ «Có N tin chữ trong 2 phút, máy chọn tin gần nhất» | điền, ghi Ghép sai ở lượt hai |
| ST-khong-chu | đầu thẻ | Ảnh của bài, «Không có tin chữ trong 2 phút» | điền |
| ST-cum-lon | dải ảnh | Một hàng cuộn ngang | cuộn, xem lớn |
| ST-lon | hộp xem lớn | «Ảnh n/N», Ảnh trước, Ảnh sau | Esc |
| ST-anh-loi | ô ảnh trong dải | «Ảnh không tải được», Thử lại, các ảnh khác của cụm vẫn xem được | thử lại, chuyển ảnh |
<!-- /ux-spec -->

Khổ hẹp: dải vẫn một hàng, chữ gấp ba dòng như hiện tại.

## Không làm

- Không sửa `collector/` hay hook: làn ZCode, mã album do giám sát lo qua liên làn.
- Không sửa `ganBaiAnh`, không đổi cửa sổ 120 giây, không viết luật ghép thứ hai.
- Không xoá hay sinh lại lát khi chưa có lời Mạnh.
- Không đổi hàm chọn mẫu `chonMauTheoNhom`.
- Giữ số điện thoại khi bỏ link (Ngoài-8 của `anh-tren-the-gan-nhan`): hàng riêng.
