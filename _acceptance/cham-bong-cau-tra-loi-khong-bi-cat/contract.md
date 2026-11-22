---
schema_version: 1
feature: Lời gọi chấm bóng «Bổ sung tin» có trần token ra theo số ô của thẻ, lời gọi chạm trần được ghi lỗi «bi-cat» tách khỏi «json-hong», để lượt thử 30 thẻ đủ hai kết quả mà không đọc lại phần đã trả tiền
slug: cham-bong-cau-tra-loi-khong-bi-cat
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-22
design_doc: docs/superpowers/specs/2026-11-22-cham-bong-cau-tra-loi-khong-bi-cat-design.md
---

# Acceptance Contract: cham-bong-cau-tra-loi-khong-bi-cat

## Context

Lượt thử thật 1 của NB1 (`cham-bong-bo-sung-tin`, đã gộp #517) ra ĐỎ 28/30: 3/60 lời gọi trả đúng 1.000 token ra (hằng
`MAX_TOKEN_RA`), câu trả lời bị cắt, sổ gọi ghi «json-hong». Chẩn đoán trên 60 lời gọi đã có: token ra tăng theo số ô hỏi trên
thẻ (tương quan 0,74), không theo độ dài bài (0,05). Hàng sửa bộ chạy của NB1; không đổi lời nhắc, không ghi dữ liệu nào. Chi
tiết lượt 1: `luot-1.md`. Thiết kế: `design_doc`.

## Criteria

- AC-1: Given một thẻ có n ô cần đọc (1 ≤ n ≤ 5), When bộ chạy gọi model, Then trần token ra của lời gọi bằng 400 + 600 × n và
  được truyền đúng vào đường Anthropic (`max_tokens`) và đường Gateway (`maxOutputTokens`); không còn hằng 1.000 chung.
- AC-2: Given model dừng vì hết token (Anthropic `stop_reason` = `max_tokens`, Gateway `finishReason` = `length`), When đọc câu
  trả lời, Then lần đọc là lời gọi lỗi lý do `bi-cat` — kể cả khi phần chữ đã có tách được JSON —, sổ gọi ghi `loi: "bi-cat"`
  kèm token thật, lần đọc không vào kho dùng lại và không sinh kết cục.
- AC-3: Given câu trả lời KHÔNG bị cắt mà không tách được JSON, When đọc, Then lỗi vẫn là `json-hong`; câu trả lời không bị cắt
  có JSON đúng vẫn là lần đọc thành công.
- AC-4: Given một lượt có lời gọi lỗi, When lượt kết thúc, Then `tong-ket.json` có `loi_theo_ly_do` đếm số lời gọi lỗi theo lý
  do (`bi-cat`, `json-hong`, lớp lỗi nhà cung cấp) với tổng bằng `loi_goi`, và báo cáo in một dòng đếm ấy.
- AC-5: Given chưa có lời gọi nào của một model, When ước chi lời gọi đầu để kiểm trần tiền, Then ước dùng trần token ra của
  chính thẻ đó (400 + 600 × n), không dùng hằng 1.000.
- AC-6: Given lượt 1 đã lưu lời đọc thành công trong kho với lời nhắc `cb-v1`, When chạy lại cùng chữ bài, tập ô và model sau
  khi sửa, Then khoá dùng lại không đổi (phiên bản lời nhắc vẫn `cb-v1`) nên cặp thẻ × model đã thành công không bị gọi lại.
- AC-7: Given 30 thẻ đầu theo thứ tự ưu tiên trên DB máy thu (chỉ đọc), When tính mức chi cao nhất với trần token ra mới (mọi
  lời gọi chạm trần, token vào ước theo ký tự lời nhắc, bảng giá cấu hình), Then in mức ấy theo từng model và tổng ≤ 0,1 USD
  (trần lệnh của E11 NB1, không đổi).
- AC-8: Given rào chi của lượt dừng trước lời gọi có thể vượt trần (mức chi cao nhất 30 thẻ ~0,085 sát trần 0,1), When in báo
  cáo lượt, Then báo cáo có một dòng nói rõ lượt dừng vì trần kèm trần, số thẻ đủ hai kết quả trên số thẻ, số thẻ còn thiếu và tiền
  đã chi — không để thiếu thẻ trông như lỗi đọc; lượt trọn không có dòng ấy.

## Coverage

Quét theo bốn trục của lời gọi (thước: mỗi ô có AC hay dòng Out of scope):

| Trục | Giá trị | AC |
|---|---|---|
| Số ô trên thẻ | 1 · 2 · 3 · 4 · 5 | AC-1, AC-5, AC-7 |
| Đường gọi | Anthropic · Gateway | AC-1, AC-2 |
| Kết thúc lời gọi | dừng tự nhiên + JSON đúng · dừng tự nhiên + JSON hỏng · hết token (JSON tách được hay không) · lỗi nhà cung cấp | AC-2, AC-3, AC-4 |
| Lượt sau sửa | chạy lại cùng lời nhắc · tiền của 30 thẻ · dừng vì trần | AC-6, AC-7, AC-8 |

Ai đọc đầu ra phía sau: probe E11 của NB1 (`thu-30.sh`, lượt 2 sau gộp); NB5 (bảng lô) đọc tệp kết quả; GS đọc báo cáo lượt.

## Đường đo

- Lượt thử thật 2 (sau gộp, từ main, ngay sau một lượt nạp S03 15′): dòng «thẻ đủ hai kết quả / thẻ chờ còn đề xuất» của báo
  cáo, hôm nay 28/30, đích 30/30, probe `_acceptance/cham-bong-bo-sung-tin/probes/thu-30.sh` in XANH (AC-1, AC-2, AC-6).
- Số lời gọi bị cắt của lượt 2 đọc được trực tiếp: `loi_theo_ly_do.bi-cat` trong `tong-ket.json` (AC-4).
- Tiền lượt 2 ≤ 0,1 USD: dòng chi phí của báo cáo (AC-5, AC-7).

## Out of scope

- Lời nhắc loại hình (lượt 1: loại hình 0/8 khớp) — hàng riêng sau lượt 2 nếu cần.
- Ép lý do ngắn trong lời nhắc (đổi `prompt_version`, đọc lại cả 60 lần đọc đã trả tiền).
- Tự gọi lại lời gọi `bi-cat` với trần cao hơn trong cùng lượt.
- Đổi số 0,1 USD của E11 NB1 (tiêu chí đã ký — cần lời Mạnh).
- Lượt thử thật 2 (lượt tốn tiền, chạy sau gộp theo lời GS — không phải eval của S4).

## Known limits

## Notes
