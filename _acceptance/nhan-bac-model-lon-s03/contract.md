---
schema_version: 1
feature: Lệnh nhãn bạc S03 — model lớn (Claude Haiku 5.5, OpenAI Decisions, Qwen 27B local) đọc bài S03 và ghi ý định tin, bán/thuê, xác suất, câu trích vào bảng nhãn bạc riêng (migration 065), kèm chế độ đo trên tập vàng — không ghi dữ liệu canonical
slug: nhan-bac-model-lon-s03
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [pipeline, db]
status: approved
approved_by: Mạnh
approved_at: 2026-11-01
design_doc: docs/superpowers/specs/2026-10-31-nhan-bac-model-lon-s03-design.md
---

# Acceptance Contract: nhan-bac-model-lon-s03

## Context

Mạnh 31/10 chốt KC1: model lớn vừa phân loại vừa gắn nhãn (nhãn bạc) để cải thiện Kev; đo Claude Haiku 5.5 và OpenAI
Decisions API so với Qwen 27B local (ý định 98%, bán/thuê 97% trên 61 bài — nhánh ZCode `zcode/classify-s03`); cloud
chạy hết bài cũ, Qwen local chạy hằng ngày. Mạnh bỏ luật cấm gửi dữ liệu ra ngoài cho phân loại (31/10); tầng A vẫn
không rời máy; luật 7 giữ (model không ghi canonical). Bảng nhãn bạc riêng (giám sát, migration 065).

## Criteria

- AC-1: Given DB máy thu, When áp migration 065 hai lần, Then có bảng `s03_silver_labels` (cột theo design doc, `listing_intent` khoá ngoại sổ từ vựng, khoá duy nhất post_id + text_hash + model + prompt_version) và lần hai không lỗi; `sync-cloud` không có bảng này trong danh sách đẩy.
- AC-2: Given một lô bài S03 và backend giả, When chạy `nhan-bac-s03.mjs --model <m>`, Then mỗi bài ghi đúng một dòng; chạy lại cùng tham số thêm 0 dòng; bài đổi chữ (text_hash khác) ghi dòng mới; `--thu` ghi 0 dòng.
- AC-3: Given DB máy thu trong transaction ROLLBACK, When chạy lệnh trên lô thật với backend giả, Then số dòng và băm nội dung của `sale_offer_records`, `sale_offers`, `properties`, `listing_records`, `stg_zalo_posts`, `field_assertions` không đổi — chỉ `s03_silver_labels` có dòng mới. (cross-layer)
- AC-4: Given bài có SĐT, email, link zalo và nhóm có tên, When gửi tới backend cloud (giả, ghi lại thân yêu cầu), Then thân yêu cầu không chứa chuỗi SĐT, email, link nào của bài, không chứa `group_name`, `sender_name`, `conversation_id`.
- AC-5: Given trả lời model có câu trích không nằm trong chữ bài (đã gạt), When ghi nhãn, Then `quote_ok = false`; câu trích có thật → `true`; backend Decisions (không trả trích) → `quote` và `quote_ok` rỗng.
- AC-6: Given trả lời JSON hỏng, giá trị lạ, từ chối, lỗi mạng hoặc quá giờ, When ghi nhãn, Then dòng mang `listing_intent = unknown`, `json_ok = false` hoặc `error_kind` đúng loại, và lượt chạy tiếp các bài sau; cuối lượt in số lỗi theo loại.
- AC-7: Given ba backend, When gửi một bài, Then yêu cầu đúng hình: Qwen — chat completions MTPLX; Haiku — SDK `@anthropic-ai/sdk`, model `claude-haiku-5-5`; Decisions — `POST /v1/decisions`, model `gpt-6-luna`, hai câu hỏi `choice` (ý định, loại); trả lời của từng backend đọc ra cùng một hình nhãn.
- AC-8: Given tệp vàng theo khuôn giao diện (JSONL, mỗi dòng `{"post_id","listing_intent","kind"}` — khuôn ZCode xuất theo Hỏi-1) và một backend, When chạy `--gold`, Then in bảng: ý định đúng, bán/thuê đúng trên bài offer, Yêu cầu bắt được, JSON hỏng, trích giả, p50 độ trễ, chi phí ước — không in chữ bài; số khớp đếm độc lập trên cùng đầu ra.
- AC-9: Given `--tran-usd x`, When chi phí ước của bài kế làm tổng vượt x, Then lệnh dừng trước khi gửi bài ấy và in số đã dùng.
- AC-10: Given khoá API Mạnh đặt trong `.env` và tệp vàng 61 bài, When đo thật ba backend, Then số đo của mỗi backend ghi vào `docs/research/s03-nhan-bac-do-3-backend.md` (không chữ bài, kèm băm danh sách post_id của tập vàng) và so với ngưỡng sống của ô cơ hội: ý định ≥ 95%, bán/thuê trên bài offer ≥ 95%, chi phí chạy hết bài cũ (~38k) ≤ 10 USD với backend cloud (Qwen ghi giờ máy) — mỗi vế một ô đạt/không. (judgment)

## Coverage

- Trục A — Backend: Qwen local | Haiku 5.5 | Decisions [thước CE: nhánh ZCode `zcode/classify-s03` + tài liệu API 31/10] → AC-4, AC-5, AC-7, AC-10.
- Trục B — Kết cục một bài: nhãn hợp lệ | trích giả | JSON hỏng / giá trị lạ | từ chối | lỗi mạng / quá giờ [thước CE: báo cáo ZCode — JSON hỏng 1/61, trích giả 1/60] → AC-5, AC-6.
- Trục C — Ghi: bài mới | chạy lại | bài đổi chữ | chạy thử | trần chi phí [thước CE: khoá duy nhất 065, luật 7] → AC-2, AC-3, AC-9.
- Trục D — Dữ liệu rời máy: chữ bài đã gạt | tầng A | trường nhóm/người [thước CE: AGENTS.md luật 6 + quyết định Mạnh 31/10] → AC-4.
- Trục E — Lớp đo: ma trận viết tay + backend giả | DB máy thu ROLLBACK | đo thật trên tập vàng → AC-1..AC-10.

## Out of scope

- Ghi nhãn vào `stg_zalo_posts` hay dữ liệu canonical; thay luật RM1 trong transform — việc PL5 khi tập nhãn vàng xác nhận (luật 7).
- Huấn luyện lại Kev (KC2), VLM đọc ảnh (KC3), bài chỉ ảnh (KC4).
- Lịch chạy đêm (launchd) và chọn backend chạy hằng ngày — vòng sau, theo số đo AC-10.
- Đường Batch API của Haiku (chạy hết bài cũ một lô) — vòng sau; vòng này gửi từng yêu cầu để gạt tầng A và trần chi phí đo được từng bài.
- Đưa bảng nhãn bạc lên cloud.

## Notes

- Lõi prompt, `stripPII`, `parseReply` chép từ nhánh ZCode `zcode/classify-s03` @ce75ba2e (làn Claude sở hữu `pipeline/` phần phân loại; ZCode được ghi nguồn trong mã).
