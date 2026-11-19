# Mẫu giữ riêng của AC-9 — vết dựng (không chứa chữ bài)

- Dựng 20/11 bằng `probes/mau-giu-rieng.mjs` (chỉ đọc DB máy thu), seed `gt5-giu-rieng-2011`, TRƯỚC khi viết hàm gom (Task 4).
- 120 tin S03 đang sống, ≥ 2 bản chữ, có bài từ 12/11, ngoài 120 nhãn audit 09–10/11 · 354 bản chữ · 49.300 ký tự. Lượt đầu 75 tin
  (222 bản chữ, sha256 `156ba0c7…`); nới lên 120 theo cùng thứ tự seed TRƯỚC khi chấm, vì n ≥ 60 tin đồng thuận «một căn» không chắc đạt
  với 75 (hai model tự báo 57 và 59 tin «một căn»). 75 tin đầu giữ nguyên từng byte.
- Payload: chữ đã gạt SĐT, URL, đã che tên nguồn bằng `maskSourceNames`; quét lại `findSourceNames` = 0.
- `payload.json` sha256 `82beba6b0bfb0b69ff2c85cebaff1dff40ab870baba3477ab70a29b59f0cc462` — nội dung ở `research-local/s03-gom-tin-giu-rieng-20261120/`
  (gitignored, máy thu).
- Nhãn: Opus và Sonnet gom mù độc lập (Hỏi-2, Mạnh duyệt 20/11; ước chi phí < 1 USD, trần 3 USD). Nhãn = chỗ hai model đồng thuận.
- Chấm MỘT lần sau Task 5; hụt ngưỡng thì báo, không chỉnh luật rồi chấm lại.
