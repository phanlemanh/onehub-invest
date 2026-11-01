# Nhãn bạc S03 — số đo ba backend trên tập vàng 61 bài

Hồ sơ `_acceptance/nhan-bac-model-lon-s03` (KC1), AC-10. Lệnh đo:
`npx tsx scripts/nhan-bac-run.ts --model <qwen|haiku|decisions> --gold research-local/s03-gold-61.jsonl` (ngầm `--thu`,
không ghi DB). Prompt `nb-s03-v1`. Không chép chữ bài nào vào tệp này; trace từng lượt ở `agent/traces/` (gitignored, chỉ
post_id + nhãn + độ trễ + chi phí).

**Tập vàng**: 61 bài do ZCode gán tay (claudedp-3110-20), offer 34 (bán 19 · thuê 15) · inquiry 11 · not_listing 16.
Băm danh sách post_id (sha256 của các post_id đã sắp, nối bằng xuống dòng, 16 ký tự đầu): `9f1ee427822a3f7c`.

## Bảng số

| Backend | Băm tập vàng | Ý định đúng | Bán/thuê đúng trên offer | Yêu cầu bắt | JSON hỏng | Trích giả | p50 | Chi phí 61 bài | Ước hết bài cũ (~38k) |
|---|---|---|---|---|---|---|---|---|---|
| Qwen 3.8 27B local (MTPLX) | `9f1ee427822a3f7c` | 61/61 (100%) | 33/34 (97%) | 11/11 | 0/61 | 0 | 2,98 s | 0 USD | ~31,5 giờ máy một luồng (38k × p50) |
| Haiku 5.5 qua Gateway | — | chưa đo | chưa đo | chưa đo | chưa đo | chưa đo | — | — | — |
| Decisions (gpt-6-luna) qua Gateway | — | chưa đo | chưa đo | chưa đo | — (không trả JSON) | — (không trích) | — | — | — |

Haiku và Decisions chưa đo: chưa tìm thấy `AI_GATEWAY_API_KEY` trong tệp env của máy (01/11) — chờ Mạnh chỉ chỗ đặt khoá.

## Ô đạt/không theo ngưỡng sống của ô cơ hội

| Backend | Ý định ≥ 95% | Bán/thuê trên offer ≥ 95% | Chi phí hết bài cũ ≤ 10 USD (cloud) |
|---|---|---|---|
| Qwen local | Đạt (100%) | Đạt (97%) | Không áp (local — ghi giờ máy) |
| Haiku 5.5 | chưa đo | chưa đo | chưa đo |
| Decisions | chưa đo | chưa đo | chưa đo |

## Ghi chú đo

- Lượt Qwen đầu (00:28Z) ra 38/61 ý định với 22/61 JSON hỏng: bản chép từ `classify-s03` thiếu
  `chat_template_kwargs.enable_thinking=false` và `temperature 0`, Qwen tiêu hết `maxOutputTokens` cho phần suy nghĩ.
  Sửa ở `dfbd7736` (bản model `qwen27b-khong-nghi`, chỉ dùng cho nhãn bạc); lượt 00:45Z là số trong bảng.
- Số của ZCode trên cùng 61 bài (31/10, `classify-s03`): ý định 60/61, bán/thuê 32/33, JSON hỏng 1/61 — khớp chiều.
- Qwen trong bảng chạy tuần tự một luồng; ZCode đo 4 luồng (p50 11,6 s) — độ trễ không so trực tiếp.
