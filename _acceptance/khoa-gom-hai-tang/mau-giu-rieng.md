# Mẫu giữ riêng của AC-9 — vết dựng (không chứa chữ bài)

- Dựng 20/11 bằng `probes/mau-giu-rieng.mjs` (chỉ đọc DB máy thu), seed `gt5-giu-rieng-2011`, TRƯỚC khi viết hàm gom (Task 4).
- 75 tin S03 đang sống, ≥ 2 bản chữ, có bài từ 12/11, ngoài 120 nhãn audit 09–10/11 · 222 bản chữ · 31.248 ký tự.
- Payload: chữ đã gạt SĐT, URL, đã che tên nguồn bằng `maskSourceNames`; quét lại `findSourceNames` = 0.
- `payload.json` sha256 `156ba0c726e33d34fbbbdeee500ca0f0b0ae66157eb64ec664e4c9212acf8196` — nội dung ở `research-local/s03-gom-tin-giu-rieng-20261120/`
  (gitignored, máy thu).
- Nhãn: Opus và Sonnet gom mù độc lập (Hỏi-2, Mạnh duyệt 20/11; ước chi phí < 0,5 USD, trần 3 USD). Nhãn = chỗ hai model đồng thuận.
- Chấm MỘT lần sau Task 5; hụt ngưỡng thì báo, không chỉnh luật rồi chấm lại.
