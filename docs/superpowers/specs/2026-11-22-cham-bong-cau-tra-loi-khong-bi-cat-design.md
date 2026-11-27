# Câu trả lời chấm bóng không bị cắt — thiết kế

Hàng `cham-bong-cau-tra-loi-khong-bi-cat` (dãy N1, GS cắt 22/11 sau lượt thử thật 1 của NB1 `cham-bong-bo-sung-tin`). Hồ sơ
`_acceptance/cham-bong-cau-tra-loi-khong-bi-cat/`. Lượt thử 1 và chẩn đoán: `_acceptance/cham-bong-cau-tra-loi-khong-bi-cat/luot-1.md`.

## Vấn đề

Lượt thử thật 1 (30 thẻ, `cb-2026-11-22T052458782Z`) ra ĐỎ 28/30: 3/60 lời gọi lỗi `json-hong`, cả ba trả đúng 1.000 token ra
= hằng `MAX_TOKEN_RA` của `agent/src/enrich/cham-bong/doc.ts`. Câu trả lời bị cắt giữa chừng nên JSON không đọc được, và sổ gọi
ghi «json-hong» như một câu trả lời sai khuôn — không ai phân biệt được «model trả rác» với «máy cắt câu trả lời».

## Chẩn đoán (60 lời gọi đã có, 0 lời gọi mới)

- Token ra tăng theo SỐ Ô hỏi trên thẻ, không theo độ dài bài: tương quan token ra ~ số ô 0,74; ~ độ dài JSON trả về 0,79;
  ~ token vào 0,05. Trung vị: 1 ô 160, 2 ô 294, 3 ô 932, 4 ô 980.
- Ba lời gọi bị cắt: hai thẻ 3 ô (4 đề xuất), một thẻ 2 ô. Trần 1.000 quá sát: Haiku p90 964, DeepSeek p90 939.
- Token ra ≈ 4–5 lần (độ dài JSON / 3,2): chữ Việt có dấu tốn token, và phần «can_cu»/«trich» dài (DeepSeek chép cả dòng bài).

## Lựa chọn

1. **Trần token ra theo số ô của thẻ**: `tranTokenRa(soO) = 400 + 600 × soO` (1 ô 1.000 · 2 ô 1.600 · 3 ô 2.200 · 4 ô 2.800 ·
   5 ô 3.400). Mỗi lời gọi nhận đúng trần của thẻ ở cả hai đường (Anthropic `max_tokens`, Gateway `maxOutputTokens`).
2. **Lời gọi chạm trần nhận ra bằng lý do dừng**: Anthropic `stop_reason === "max_tokens"`, Gateway `finishReason === "length"`
   → kết quả lỗi `bi-cat` (sổ gọi `loi: "bi-cat"`), không vào kho, không sinh kết cục — kể cả khi phần chữ đã có vẫn tách được
   JSON. Câu trả lời không bị cắt mà JSON hỏng vẫn là `json-hong`.
3. **Ước chi lời gọi đầu** (trần tiền của lượt) dùng trần token ra của thẻ thay vì hằng 1.000.
4. **Tổng kết đếm lỗi theo lý do** (`loi_theo_ly_do` trong `tong-ket.json`, một dòng trong báo cáo) để báo cáo lượt nói được
   bao nhiêu lời gọi bị cắt.
5. **KHÔNG đổi lời nhắc** (`prompt_version` giữ `cb-v1`): khoá dùng lại không đổi, nên 57 lần đọc đã trả tiền ở lượt 1 được
   dùng lại; lượt 2 trên cùng 30 thẻ chỉ gọi lại 3 cặp lỗi. Ép lý do ngắn (lựa chọn b của GS) đổi `prompt_version` → đọc lại
   cả 60, và chưa có số đo cho thấy cần — để sau lượt 2 nếu `bi-cat` còn xuất hiện.

## Tiền

Mức chi cao nhất của 30 thẻ đầu (mọi lời gọi chạm trần mới, bảng giá cấu hình): ~0,085 USD ≤ trần 0,1 USD của E11 — probe
`thu-30.sh` giữ nguyên. Số đo trên DB máy thu: eval E2 của hồ sơ (in theo từng model).

## Ngoài phạm vi

- Lời nhắc loại hình (lượt 1: loại hình 0/8 khớp — Haiku luôn rỗng, DeepSeek suy «apartment» từ «2PN»/«căn») — hàng riêng sau
  lượt 2 nếu cần.
- Chạy lại tự động lời gọi `bi-cat` với trần cao hơn trong cùng lượt.
- Đổi số 0,1 USD của E11 (tiêu chí đã ký).

## Đặc tả UX

Không chạm UI (bỏ bằng dòng `descope` trong sổ).
