# Nhãn bạc S03 — số đo ba backend trên tập vàng 61 bài

Hồ sơ `_acceptance/nhan-bac-model-lon-s03` (KC1), AC-10. Đo ngày 01/11/2026. Lệnh đo:
`npx tsx --env-file=<.env> scripts/nhan-bac-run.ts --model <qwen|haiku|decisions> --gold research-local/s03-gold-61.jsonl`
(ngầm `--thu`, không ghi DB). Prompt `nb-s03-v2` cho Qwen và Haiku; Decisions không dùng prompt mà dùng hai câu hỏi `choice`
(`CAU_HOI_DECISIONS`). Không chép chữ bài nào vào tệp này; trace từng lượt ở `agent/traces/` (gitignored, chỉ post_id +
nhãn + độ trễ + chi phí).

**Tập vàng**: 61 bài do ZCode gán tay (claudedp-3110-20), offer 34 (bán 19 · thuê 15) · inquiry 11 · not_listing 16.
Băm danh sách post_id (sha256 của các post_id đã sắp, nối bằng xuống dòng, 16 ký tự đầu): `9f1ee427822a3f7c`.

## Bảng số

| Backend | Băm tập vàng | Ý định đúng | Bán/thuê đúng trên offer | Yêu cầu bắt | JSON hỏng | Trích giả | p50 | Chi phí 61 bài | Ước hết bài cũ (~38k) |
|---|---|---|---|---|---|---|---|---|---|
| Qwen 3.8 27B local (MTPLX) | `9f1ee427822a3f7c` | 61/61 (100%) | 33/34 (97%) | 11/11 | 0/61 | 1 | 3,01 s | 0 USD | ~31,8 giờ máy một luồng |
| Haiku 5.5 qua Gateway | `9f1ee427822a3f7c` | 57/61 (93%) | 32/34 (94%) | 10/11 | 4/61 | 0 | 1,61 s | 0,0097 USD | ~6,07 USD |
| Decisions `openai/gpt-6-luna-decisions` qua Gateway | `9f1ee427822a3f7c` | 59/61 (97%) | 31/34 (91%) | 10/11 | 0 (không trả JSON) | — (không trích) | 0,34 s | 0,0026 USD | ~1,61 USD |

Chi phí lấy từ `providerMetadata.gateway.cost` của từng lượt (Gateway không cộng phí), ước hết bài cũ = chi phí 61 bài × 38.000 / 61.

## Ô đạt/không theo ngưỡng sống của ô cơ hội

| Backend | Ý định ≥ 95% | Bán/thuê trên offer ≥ 95% | Chi phí hết bài cũ ≤ 10 USD (cloud) |
|---|---|---|---|
| Qwen local | Đạt (100%) | Đạt (97%) | Không áp (local — ghi giờ máy) |
| Haiku 5.5 | Không (93%) | Không (94%) | Đạt (~6,07 USD) |
| Decisions | Đạt (97%) | Không (91%) | Đạt (~1,61 USD) |

Chỉ Qwen local đạt cả hai ngưỡng chất lượng. Chọn backend cho lịch chạy đêm là vòng sau (hợp đồng, mục ngoài phạm vi).

## Ghi chú đo

- **Qwen, lượt đầu** (prompt v1, 00:28Z): 38/61 ý định với 22/61 JSON hỏng — bản chép từ `classify-s03` thiếu
  `chat_template_kwargs.enable_thinking=false` và `temperature 0`, Qwen tiêu hết `maxOutputTokens` cho phần suy nghĩ.
  Sửa ở `dfbd7736`; lượt v1 sau sửa: 61/61, 0 trích giả.
- **Haiku, lượt đầu** (prompt v1): 44/61 ý định, 17/61 không trả JSON — với bài chỉ có ảnh/link Haiku trả văn xuôi xin
  dán chữ bài. Prompt v2 thêm một dòng (bài không có chữ đọc được → not_listing, luôn trả JSON); Haiku còn 4 bài không
  JSON. Không chỉnh prompt thêm: chỉnh tiếp theo tập vàng là học theo chính tập đo.
- **Decisions, lượt đầu**: 61/61 lỗi 400 — mã `openai/gpt-6-luna` (theo tài liệu Decision 07/10) nay là language model;
  danh sách model của Gateway liệt kê bản evaluation là `openai/gpt-6-luna-decisions`. Đổi mã trong `models.ts`.
- Số của ZCode trên cùng 61 bài (31/10, `classify-s03`, Qwen): ý định 60/61, bán/thuê 32/33, JSON hỏng 1/61 — khớp chiều.
- Qwen trong bảng chạy tuần tự một luồng; ZCode đo 4 luồng (p50 11,6 s) — độ trễ không so trực tiếp.
