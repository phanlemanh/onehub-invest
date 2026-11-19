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

## Chi phí thật của lượt gán nhãn (GS hỏi 20/11)

- Hai lượt gán nhãn chạy bằng tác tử con của phiên Claude Code (model `opus`, `sonnet`), không qua khoá API trả theo token: **0 USD chi
  thêm**, trong trần 3 USD của Hỏi-2.
- Token tác tử con theo báo của phiên: Opus 128.744 (75 tin) + 110.365 (45 tin) = 239.109; Sonnet 125.285 + 107.931 = 233.216.
- Thứ tự an toàn: quét `findSourceNames` trên toàn payload ra 0 TRƯỚC khi tác tử con đọc; tác tử chỉ được đọc đúng tệp payload đã che.

## Mẫu giữ riêng THỨ HAI (GS phán 20/11) — chấm MỘT lần, không lặp

- Vì sao có mẫu hai: lượt chấm mẫu một (27,1% → 21,2%) bắt một lỗi hiện thực (ô trống «?» = «?» ở tầng hai, sửa ở 84c73d751); 18 tin
  gộp nhầm của mẫu một đã được đọc để chẩn đoán, nên mẫu một KHÔNG còn «giữ riêng». Mẫu hai tính hay không tính là phép đo của AC-9 là
  lời của Mạnh ở Cổng Bằng chứng.
- Dựng 20/11 bằng `probes/mau-giu-rieng.mjs --loai-map <map mẫu một>`, cùng seed `gt5-giu-rieng-2011`: 120 tin kế trong 646 ứng viên còn
  lại, 0 tin trùng mẫu một · 368 bản chữ · 64.194 ký tự · quét tên nguồn 0.
- `payload.json` sha256 `18341fbee313249e533cc43b82cd31ef686efbb5cbc4211c674d68bbf999f326` · danh sách offer_id (đã sắp) sha256 `61aea604d03a16a07c2aa0cbc7489383acc2aa502990382fc11bb244eefb5eb5` — nội
  dung ở `research-local/s03-gom-tin-giu-rieng-2-20261120/` (gitignored, máy thu).
- Commit này đứng TRƯỚC mọi lượt chạy khoá mới trên mẫu hai. Hụt ngưỡng nữa thì DỪNG, không mẫu ba, đưa Mạnh.
