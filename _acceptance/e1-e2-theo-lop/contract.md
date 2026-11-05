---
schema_version: 1
feature: E1 phát biểu theo lớp; E2 đọc mù ra mảng căn có trích dẫn; mỗi căn của bài nhiều căn S03 thành một tin có khoá riêng
slug: e1-e2-theo-lop
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-05-e1-e2-theo-lop-design.md
---

# Acceptance Contract: e1-e2-theo-lop

## Context

Đọc S03 sai nặng 4/30 bài, đều là bài nhiều căn (khoảng tin cậy 5,3–29,7%). Hiện mỗi bài thành một tin với một giá ngẫu nhiên, tên nhóm vẫn quyết loại hình, E2 bị mồi đáp án của E1. Thi công chờ nhãn `multi_unit` của Mạnh (`eval_labels` 0 dòng). Toàn bộ test dùng DB thử và model giả. Có hai lượt thật riêng, mỗi lượt cần lời của Mạnh: lượt đọc có trần chạy trước Cổng Bằng chứng, chỉ ghi nhãn, để Mạnh đọc tay trên dữ liệu thật; lượt ghi tin chạy sau chữ ký.

## Criteria

- AC-1: Given loại hình E1 lấy từ chữ bài, từ tên nhóm, từ mặc định của khu đô thị, When ghi phát biểu qua cả đường transform và đường `apply_enrichment`, Then chữ bài ra `observed`, hai lớp còn lại ra `inferred` với `rule_id` riêng, và `routeFields` không cho hai lớp đó route `direct`.
- AC-2: Given bài có tên nhóm, tên khu đô thị, khu vực và kết quả E1, When dựng prompt của mọi đường gọi E2, Then chữ gửi đi không chứa giá trị nào trong số đó, và `needsLLM` không còn bỏ lượt đọc vì E1 đã đủ.
- AC-3: Given câu trả lời có một căn, nhiều căn, JSON hỏng, thừa trường `confidence`, When đọc bằng `docTraLoi` mới, Then ra đúng mảng căn; JSON hỏng không ra căn nào; `confidence` không được lưu hay dùng ở bất kỳ đâu trong E2.
- AC-4: Given căn có câu trích giả, câu trích thật nhưng số lệch với parser đọc lại, câu trích thật và số khớp, câu trích chồng lên căn khác, When xét từng giá trị, Then câu giả làm rơi đúng giá trị đó; một căn có số lệch hoặc chồng câu trích thì cả bài không tách và có đúng một thẻ cho người; số khớp thì giá trị được tính. Trích dẫn giả bị loại 100% trên ma trận viết trước.
- AC-5: Given bài có 3 căn đạt điều kiện tách và cổng đã mở, When chạy transform, Then ra đúng 3 tin với khoá `<post_id>#<n>` theo thứ tự câu trích, và mỗi tin mang đúng cặp giá, diện tích của căn đó; hai căn giống hệt vẫn ra hai tin; bài một căn, bài có 2 căn mà một căn thiếu câu trích riêng vẫn ra một tin như cũ.
- AC-6: Given một lượt đã tách, When nạp lại hai lần, Then `offer_id`, số tin, số phát biểu không đổi và không có lời gọi model.
- AC-7: Given tin cũ của bài bị tách, có đề xuất, thẻ chờ và phát biểu của người, When tách, Then tin cũ nghỉ với lý do `tach-nhieu-can` và `superseded_by` trỏ căn đầu; mọi căn nhận khoá mới không trùng; thẻ chờ đóng có lý do; đề xuất và phát biểu cũ còn nguyên làm lịch sử, không chảy sang căn; đường dẫn tin cũ không lỗi 5xx.
- AC-8: Given hai tin chung một bài, có phát biểu cấp bài của parser, E2, người, When phân xử, Then mỗi tin chỉ nhận phát biểu của căn mình; cột loại hình, phòng ngủ chỉ đổi qua `resolve_offer_fields`; xoá cột rồi dựng lại ra y nguyên. Tin không tách có kết quả như trước migration trên cùng dữ liệu.
- AC-9: Given bài nhiều căn được đăng lại nguyên văn, When transform gom, Then mỗi căn gom với chính nó ở bài đăng lại và hai căn không gộp vào nhau; `post_ids` của tin vẫn là mã bài; đọc ảnh và thẻ duyệt của tin không lỗi; bản đồng bộ cloud không mang tên nguồn thật hay tên nhóm trong cột mới.
- AC-10: Given có nhãn `dtb-s03-v2` nhưng chưa có dấu mở cổng, When chạy lệnh transform thật, Then không bài nào bị tách. Given mẫu của `TACH_VERSION` cũ; dưới 125 nhãn `multi_unit` trong lát ngẫu nhiên; dưới 30 nhãn Có hoặc dưới 30 bài máy nhận; cận dưới Wilson của tỉ lệ máy nhận đúng hoặc độ phủ dưới ngưỡng; bảng đọc tay chưa đạt, When xin mở cổng, Then thoát 5, không ghi gì. `--mau` in tỉ lệ bài nhiều căn với hai cận, số Có, số bài máy nhận; `--thu` không qua cổng, không ghi tin hay phát biểu.
- AC-11: Given trần USD và model giả, When lượt đọc chạm trần rồi chạy lại, Then dừng đúng trần, lượt sau đọc tiếp phần còn lại và không đọc lại bài có nhãn tốt. `--bang-doi-chieu` in bài và các căn đã tách kèm `run_id`, ra thư mục gitignored, không ghi DB. Tệp kết quả đọc tay chỉ được tính khi `run_id` khớp nhãn thật, từ 30 bài nhiều căn, và từ 27 bài đúng cả quan hệ căn, giá, diện tích.
- AC-12: Given lượt đã tách và có tin đã áp, When `--hoan-tach <run_id>`, Then tin của căn nghỉ với lý do `hoan-tach`, tin cũ sống lại y nguyên từng cột trừ mốc cập nhật, phát biểu căn bị rút, không dòng nào bị xoá; chạy lại không đổi gì; transform hai lần sau đó không tách lại các bài đó; bản đồng bộ cloud không còn tin căn. Bộ test của `s03-llm-doc-toan-bo` và `phat-bieu-va-phan-xu` xanh.

## Coverage

Bỏ quét không gian (dòng `descope` trong sổ) — ba trục liệt tay:

- Trục A — căn cứ của giá trị: chữ bài · tên nhóm · dự án · trích dẫn thật · giả · số lệch → AC-1, AC-2, AC-4
- Trục B — hình dạng bài: một căn · nhiều căn · thiếu trích dẫn · đăng lại · tin cũ có đề xuất → AC-3, AC-5, AC-7, AC-9
- Trục C — vận hành: nạp lại · phân xử · cổng đo · chạm trần · hoàn tác · đồng bộ → AC-6, AC-8, AC-10, AC-11, AC-12
- Later: nhãn từng căn trên `/ops/labels`; bảng `post_units` nếu đổi `TACH_VERSION` làm rung khoá; lớp bài đăng dùng chung (GT2).
- Never: model ghi thẳng giá, diện tích; gọi model khi nạp lại.

## Đường đo

- Không prompt E2 nào chứa đáp án E1: AC-2.
- Trích dẫn giả bị loại 100%: AC-4.
- Bài nhiều căn ra đủ số tin, nạp lại không đổi `offer_id`: AC-5, AC-6.
- Không còn `confidence` tự khai trong E2: AC-3. Bộ đọc đời trước của tin có đề xuất cũ giữ lịch sử, không xoá.
- Tỉ lệ bài nhiều căn, tỉ lệ máy nhận đúng, độ phủ: lệnh `--mau` của AC-10, trên nhãn `multi_unit`. Chưa có nhãn thì chưa có số.
- Độ đúng theo từng căn: tệp đọc tay của AC-11, trên bảng từ lượt đọc thật. Máy kiểm số và `run_id`, người chấm từng bài.

## Out of scope

- Lượt ghi tin thật trên DB máy thu: bước riêng sau chữ ký, `pg_dump` trước, cần lời riêng của Mạnh.
- Áp migration 077 lên máy thu hoặc cloud: cần lời duyệt riêng.
- Đổi luật gom `repostKey`: hàng `GT4`.
- Lớp bài đăng và ghép ảnh: hàng `GT2`, `gop-anh`.
- Sửa `/ops/labels`, `label-sample`: phiên GC đang giữ.
- Tạo bản ghi căn vật lý, nối toà: `GCQ1`, `DB1`.
- Sửa nhãn và đề xuất cũ của tin không tách.

## Notes

- Thi công (S3) chỉ bắt đầu khi đủ điều kiện ở câu hỏi về ngưỡng trên thẻ. Duyệt phạm vi không phải lệnh chạy.
- Số migration 077 giám sát đã dành; DDL thật do Mạnh duyệt riêng.
