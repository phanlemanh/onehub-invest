# Bản phạm vi — Model lớn phân loại kiêm gắn nhãn, chưng cất sang Kev (31/10)

> Nguồn: Mạnh chốt 31/10 «đằng nào cũng phải dùng một model lớn và kết hợp vừa phân loại vừa gắn nhãn chính là cách để
> cải thiện kev». Căn cứ số: `docs/research/s03-boc-tach-cau-truc-3010.md` §8.2 — Kev-4B đúng bán/thuê 57%, Yêu cầu 3/12;
> Qwen 27B local đọc có trích dẫn 95%. S06 có nhãn bán/thuê sẵn từ `ad_type` (12.595 bán · 17.167 thuê, DB máy thu 31/10).
> Mạnh (31/10) cho phép gửi chữ bài ra model cloud; tầng A vẫn không rời máy; luật 7 giữ nguyên.
> Mạnh chốt 31/10: đo Claude Haiku 5.5 và OpenAI Decisions API (gpt-6-luna) trên mẫu 61 bài, so với Qwen 27B local
> (ZCode đo: ý định 98%, bán/thuê 97%); bên đạt và rẻ hơn chạy hết bài cũ, Qwen local chạy hằng ngày.
>
> Việc của người, ra khỏi kho (liệt ở mô tả PR):
> - Mạnh thử với ZCode công cụ phân loại bằng model lớn (GLM hoặc khác) — kết quả chọn model thầy;
> - Mạnh cấp khoá API + bật thanh toán Anthropic và OpenAI cho phép đo KC1/KC3;
> - người gắn tập nhãn vàng ~200–500 bài ở /ops/labels từ lát `s03-loai-tin` (RM1 AC-10) — điều kiện mở KC2.

<!-- <<<PHAM-VI-MA -->
```
dot: kev-chung-cat-3110
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/chu-de/doc-tin-va-anh-s03.md#f8309103b3e889771b9b3a5606cd98bfe0fc13b7, onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9

- `KC1` — model lớn đọc bài S03, ra ý định tin + bán/thuê + câu trích kiểm được, ghi nhãn bạc (không ghi canonical)
- `KC2` — Kev huấn luyện lại đầu quyết định trên S06 (ad_type) + nhãn bạc S03, đo trên tập nhãn vàng (chờ: tập vàng)
- `KC3` — VLM đọc ảnh tin S03 cho bài mà chữ không đủ (thiếu giá, dấu hiệu BĐS, loại hình), ghi thêm vào nhãn bạc nguồn «ảnh»
- `KC4` — đọc bài S03 chỉ có ảnh (chờ: bộ thu giữ bài chỉ có ảnh vào raw/stg)
```
<!-- PHAM-VI-MA>>> -->
