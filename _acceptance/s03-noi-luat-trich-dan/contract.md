---
schema_version: 1
feature: Nới luật trích dẫn căn hộ S03 thêm dạng số phòng và studio, xử lại đề xuất đã bỏ bằng nhãn đã đọc, không gọi model
slug: s03-noi-luat-trich-dan
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-04-s03-noi-luat-trich-dan-design.md
---

# Acceptance Contract: s03-noi-luat-trich-dan

## Context

Lượt chính của `s03-llm-doc-toan-bo` chỉ áp 6,8% vì bảng từ khoá căn hộ có ba từ. Mạnh chọn «Nới, đo trước» ngày 04/11; đo chỉ đọc trên 383 tin đạt 219/224, cận dưới Wilson 0,949. Toàn bộ test dùng DB thử, không gọi model. Ghi vào dữ liệu thật là bước riêng sau chữ ký.

## Criteria

- AC-1: Given model nói căn hộ và thân bài không có từ loại khác, When xét câu trích theo bảng dương dưới, Then đạt với mã `trich-dan:so-phong`; câu có `căn hộ`, `chung cư`, `cc` vẫn mang mã `trich-dan:can-ho`.
  Bảng dương: `2PN` · `5pn` · `3 pn` · `1n+` · `2n2wc` · `2N2VS` · `2n2w` · `1PN+1` · `1 phòng ngủ` · `studio` · `stu`.
- AC-2: Given bảng âm dưới, When xét luật, Then không tự áp và ra đúng lý do ghi cạnh từng ca.
  - Không có dạng nhận, lý do `khong-tu-khoa`: `1+` · `căn` · `10n` · `6pn` · `0pn` · `2 năm` · `3 người` · `3N2Đ` · `stunning` · `toà be1`.
  - Dính chốt, lý do `ngu-canh-loai-tru`: câu `nhà 3pn`, `cần mua 2pn`; câu `3PN` với thân bài có một từ bất kỳ trong danh sách đóng của design doc, mỗi từ một ca, kể cả dạng không dấu.
  - Lý do `tu-khoa-loai-khac`: câu `nhà phố 3pn` không có từ khoá căn hộ. Lý do `trich-gia`: câu không có trong bài.
  - Model nói loại khác căn hộ: không tự áp dù câu trích là `3PN`.
- AC-3: Given đề xuất `skipped` lý do `khong-tu-khoa` do `chayLuot` thật sinh với luật cũ, kèm nhãn cùng chữ, câu trích dạng số phòng, tin có thêm đề xuất ý định, When chạy `--xu-lai-trich`, Then đề xuất thành `applied`, `corroborated_by` là `trich-dan:so-phong`, loại hình của tin là căn hộ, không có lời gọi model, không có thẻ mới, và băm mọi cột của tin trừ loại hình, provenance và mốc cập nhật trước và sau bằng nhau.
- AC-4: Given các ca: đề xuất `skipped` lý do khác; đề xuất đã `reverted`; chữ đã đổi nên không có nhãn cùng băm; tin có ô loại hình do người chốt; tin đã nghỉ; câu trích tên toà; thân bài có `biệt thự`; câu `nhà 3pn`; model nói loại khác, chạy cùng lượt với một ca dương, When chạy `--xu-lai-trich`, Then ca dương được áp, mỗi ca còn lại giữ nguyên trạng thái, tin không đổi.
- AC-5: Given một lượt `--xu-lai-trich` đã xong, When chạy lại lần hai, Then không đề xuất, phát biểu hay dòng nhật ký nào đổi, và số báo áp bằng 0.
- AC-6: Given dòng mẫu đạt không có trường phiên bản; dòng đạt của phiên bản cũ; dòng rớt của `LUAT_VERSION` hiện tại, When chạy `--xu-lai-trich` hoặc lượt thật, Then lệnh từ chối, mã thoát 6, không ghi gì; có dòng đạt của phiên bản hiện tại thì chạy được; `--xu-lai-trich --thu` không qua cổng này, báo số dự kiến và không ghi dòng nào.
- AC-7: Given đề xuất đã áp bởi `--xu-lai-trich` trên tin loại suy và tin `unknown`, When `revert_enrichment` theo `run_id`, Then tin loại suy trở về giá trị và tầng suy cũ, tin `unknown` trở về `unknown`, đề xuất mang `reverted_at`.
- AC-8: Given kết quả sau một lượt, When chạy `--dem`, Then số «AI đã áp» khớp truy vấn đếm độc lập; và bài mới đọc qua lượt thường với câu trích `2PN` được áp theo luật mới, các bộ test của `s03-llm-doc-toan-bo` xanh.
- AC-9: Given 383 tin có nhãn trên DB máy thu, When chạy `--mau 383 --thu` với mã thật, Then chi 0 USD; toàn mẫu cận dưới Wilson ít nhất 0,85 trên ít nhất 100 ca; riêng nhánh `trich-dan:so-phong` ít nhất 30 ca và cận dưới Wilson ít nhất 0,85, thiếu một trong hai thì thoát 5; và `--xu-lai-trich --thu` trên cùng DB in tử số, mẫu số, tỉ lệ AI đã áp dự kiến.

## Coverage

Bỏ quét không gian (dòng `descope` trong sổ) — ba trục liệt tay:

- Trục A — dạng câu trích: số phòng · studio · từ cũ · mơ hồ · loại khác · giả → AC-1, AC-2
- Trục B — đề xuất vào xử lại: đúng diện · lý do khác · đã hoàn tác · chữ đổi · người chốt · tin nghỉ → AC-3, AC-4
- Trục C — vận hành: chạy lại · cổng mẫu · thử · hoàn tác · đếm · lượt thường → AC-5, AC-6, AC-7, AC-8, AC-9
- Later: nhận `1+` và tên toà khi có số đo; đo độc lập rủi ro nhà phố trên tập nhãn nhiều loại hơn.
- Never: AI ghi giá hoặc diện tích; gọi model trong `--xu-lai-trich`.

## Đường đo

- ≥ 50% tin có AI đã áp: `doc-toan-bo-s03 --dem` trên DB máy thu sau lượt ghi thật (AC-8 bảo đảm số đúng). Trước chữ ký có số dự kiến từ AC-9, đếm tay hiện là 1.936/3.708, khoảng 52,2%; AC này chứng số dự kiến, không bảo đảm đạt đích.
- Độ đúng máy áp ≥ 0,85: AC-9.
- Giá, diện tích không đổi: AC-3.

## Out of scope

- Lượt ghi thật trên DB máy thu: bước riêng sau chữ ký của Mạnh, `pg_dump` trước.
- Lượt hai đọc 136 tin còn lại: lời riêng của Mạnh.
- Sửa `PROMPT_VERSION`, gọi lại model cho bài đã đọc.
- Đổi giao diện `/ops/review`; đẩy Supabase.
