# Hình tại điểm quyết định — so-cuoc-goi-ai

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 phạm vi đo (chỉ agent runtime) | 2 nhánh (runtime / Kev gate) — vượt | gộp vào hinh-dong-chay |
| Hỏi-2 chi phí = token × đơn giá | dưới ngưỡng: 1 bước | — |
| Hỏi-3 lưu + hiện (bảng local, trang, khối cloud) | 4 bước nối tiếp, 2 nhánh (máy thu / cloud) — vượt | hinh-dong-chay |
| Hỏi-4 ngưỡng nghiệm thu | dưới ngưỡng: 1 phép so | — |

## Đề bài hinh-dong-chay

- Loại: data flow, trái → phải.
- Nút: judge-entity / enrich-text / smoke-echo → runAgent (ghi sổ fail-soft) → bảng ai_calls + ai_model_prices (DB local, 052) → hàm tổng hợp ngày×việc×model → (a) /ops/ai-calls ở máy thu, (b) push-ops-facts khối aiCalls → ops_heartbeat → /ops/ai-calls trên Vercel.
- Nhánh mờ (ngoài vòng): Kev-4B gate (làn ZCode, GIAO riêng) nét đứt vào ai_calls.
- Nhãn chữ: «chỉ số + tên việc/model, không nội dung prompt» trên mũi tên lên cloud.
- AC liên quan: AC-2, AC-5, AC-6, AC-7.
