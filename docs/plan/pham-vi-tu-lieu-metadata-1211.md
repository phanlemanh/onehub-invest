# Bản phạm vi — Tư liệu và metadata cho model đọc sau (12/11)

> Nguồn: phân tích 12/11 về phân loại, lưu trữ tư liệu đi kèm bài S03 và metadata chung cho bài, ảnh, tư liệu; ghi ở kho tri
> thức riêng, trang `wiki/dot/tu-lieu-metadata-1211.md`. Mạnh yêu cầu ngày 12/11: «Phân tích và đề xuất cho tôi các mã và đưa
> vào lộ trình». Nguồn gọi bằng mã: S03 nhóm cộng đồng.
>
> **Vấn đề.** Thiếu ngữ cảnh và metadata thì sau này không biết ảnh, tài liệu thuộc căn, dự án nào. Đã gặp: 43.828 tin S03 (39,8%)
> là ảnh rời album không nối về bài; khoảng 10.000 ảnh CDN mất hẳn; 154 PDF, 81 bảng tính và ít nhất 492 ảnh tư liệu Drive đã tải
> về máy thu nhưng chưa có bảng, chưa phân loại (DATA-CONTRACT v10 nháp `s03-tu-lieu-drive`).
>
> **Hai loại metadata.** Ngữ cảnh lúc thu (bài, album, người gửi, nhóm, giờ, thư mục, chính tệp) mất là mất hẳn — thuộc làn thu.
> Diễn giải (căn, dự án, loại tư liệu, tiêu đề, trong ảnh là gì) chạy lại được — thuộc pipeline, phải có phiên bản và trích dẫn.
>
> **Chọn model.** Haiku: một lời gọi làm cả loại tư liệu lẫn tiêu đề, tóm tắt, dự án, toà, ngày ban hành kèm trang trích. Gemini
> Decisions không sinh chữ nên không làm được metadata; không đưa vào. Chi phí cả kho tư liệu hiện có dưới 2 USD.
>
> **Bản gốc metadata ở DB máy thu** theo resource Media của RESO DD 2.1 (tra `MediaCategory`, `MediaType`, `ShortDescription`,
> `LongDescription`, `ImageOf` trước khi đặt cột — luật 3); phần mở rộng là `jsonb` theo JSON Schema có `schema_version`; JSONL chỉ
> là bản xuất. Tệp nghi chứa thông tin người mua bị lọc tại máy, không bao giờ tới model hay cloud.
>
> **Đã có hàng, không cắt lại:** `GT0` mã album S03 · `GT2` lớp bài đăng chung · `ZC9` tải ảnh S03 · `NH1` bảng media RESO ·
> `NH2` ảnh hết hạn · `KC3` VLM ảnh S03 · `PL28` gộp tin chỉ ảnh.
>
> **Ngoài phạm vi:** cách thu và tải tệp Drive (làn ZCode, DATA-CONTRACT v10) · lưu mã album ở bước thu (`GT0`) · vector, đồ thị
> (luật 11).

<!-- <<<PHAM-VI-MA -->
```
dot: tu-lieu-metadata-1211
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/dot/tu-lieu-metadata-1211.md#7dabb79f766bb81e538f8601f4f9d5704f1aad53

- `TL1` — bộ nạp đưa snapshot tư liệu Drive S03 (DATA-CONTRACT v10) vào bảng stg, một dòng mỗi tệp theo băm nội dung, nối về bài và nhóm, nạp lại không nhân đôi
- `TL2` — lọc tại máy: tệp nghi chứa thông tin người mua (hợp đồng đã điền) không bao giờ đi tới model hay cloud và lên thẻ soát ở Ops
- `TL3` — phong bì metadata theo RESO Media và Haiku viết tiêu đề, tóm tắt, loại tư liệu, dự án, toà, ngày ban hành kèm trang trích cho tệp đã qua lọc
- `TL4` — người vận hành ở máy thu tìm tư liệu theo dự án và loại, xem tiêu đề, tóm tắt, trang trích, mở tệp và sửa nhãn
- `TL5` — chữ bóc sẵn một lần cho tài liệu và ảnh có chữ, model sau đọc chữ thay vì đọc lại tệp
- `TL6` — lệnh xuất gói JSONL theo phong bì (bài, ảnh, tư liệu) cho một dự án để model đọc
- `TL7` — bảng giá, mặt bằng trong tư liệu thành phát biểu của danh bạ dự án (toà, trục, căn, giá chủ đầu tư)
- `TL8` — ảnh tin có loại ảnh và mô tả ngắn trong phong bì từ kết quả VLM
```
<!-- PHAM-VI-MA>>> -->
