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
- Nhãn mẫu hai: đường gọi = tác tử con của phiên Claude Code, không qua khoá API trả theo token (0 USD chi thêm). Token: Opus 167.301,
  Sonnet 164.374. Hai model tự báo: Opus mot-can 83 · ro 26 · tim-mua 7 · khong-ro 4; Sonnet mot-can 85 · ro 24 · tim-mua 7 · khong-ro 4.
  Băm nhãn thô (16 ký tự đầu sha256): nhan-opus.json `6a012f9c60debaab` · nhan-sonnet.json `3743df114f1e9962` — ghi TRƯỚC khi chấm.
- Tổng hai mẫu: Opus 406.410 token, Sonnet 397.590 token; 0 USD chi thêm, trong trần 3 USD của Hỏi-2.

## Kết quả chấm (một lần mỗi mẫu)

| Mẫu | Mã | n đồng thuận | Bất đồng | Gộp nhầm trước → sau [Wilson 95%] | Tách nhầm 40 cặp |
|---|---|---:|---:|---|---|
| Một (không còn giữ riêng: 18 tin lỗi đã đọc để chẩn đoán) | bản có lỗi «?» = «?» | 85 | 10,0% | 27,1% → 21,2% [13,8–31,0] | 6 → 6 |
| Hai (tách rời mẫu một) | sau sửa 84c73d751 | 81 | 6,7% | 32,1% → **0,0%** [0,0–4,5] | 6 → 6 |

Báo cáo số: `thuoc-ket-qua.json` (mẫu một), `thuoc-ket-qua-2.json` (mẫu hai); `thuoc.sh --kiem` tính lại từ nhãn thô.

**Số tham khảo, ngoài thước của hợp đồng (đếm sau khi chấm, không dùng để chỉnh luật):** trên mẫu hai, 118 nhóm bản chữ cùng căn theo
nhãn đồng thuận — khoá cũ tách 0 nhóm, khoá mới tách **62 nhóm (52,5%)** ra từ hai tin trở lên. Trên bản chép DB, số tin S03 sống
7.672 → 11.867. Nguồn: luật thiết kế §2 — bản chữ thiếu một trong bốn trường chỉ nhập vào tin ĐỦ bốn trường; bài đăng lại cùng căn sửa
chữ mà thiếu trường đứng riêng. Thước tách nhầm của AC-9 (40 cặp audit, 6 cặp cùng căn) không thấy được lớp này.

## Mẫu giữ riêng THỨ BA (Hỏi-6 lối B, Mạnh «GT5 chọn B» 20/11) — chấm MỘT lần, không lặp

- Dựng 20/11 bằng `probes/mau-giu-rieng.mjs --so 120 --loai-map <map mẫu một> --loai-map <map mẫu hai>`, cùng seed
  `gt5-giu-rieng-2011`: 120 tin trong 531 ứng viên còn lại, 0 tin trùng mẫu một, 0 tin trùng mẫu hai · 372 bản chữ · 47.321 ký tự · quét
  tên nguồn 0.
- `payload.json` sha256 `67f8175b888e7beea29283f3f0d9c8a0b704c18ee221fedc60b13f0bdfc98d5b` · danh sách offer_id (đã sắp) sha256
  `d0d99f79bac2dd55e0fe416009b83d1db4806a7d52c50843c23cf0d649e49c97` — nội dung ở `research-local/s03-gom-tin-giu-rieng-3-20261120/` (gitignored, máy thu).
- Commit này đứng TRƯỚC khi gán nhãn và trước mọi lượt chạy khoá lối B trên mẫu ba. Thước: gộp nhầm < 5%, tách nhóm cùng căn ≤ 35%
  (`GT5_TACH_NHOM=1`), tách nhầm 40 cặp không tăng. Hụt ngưỡng thì DỪNG, không chỉnh luật rồi chấm lại, đưa Mạnh.
- Nhãn mẫu ba: tác tử con của phiên Claude Code (0 USD chi thêm). Token: Opus 152.559, Sonnet 146.749. Hai model tự báo cùng: mot-can 100
  · ro 13 · tim-mua 7 · khong-ro 0. Khuôn kiểm: đủ 120 tin, mỗi id bản chữ đúng một lần. Băm nhãn thô (16 ký tự đầu sha256):
  nhan-opus.json `473684c4ff4dc3fe` · nhan-sonnet.json `d03396b3cedf7401` — ghi TRƯỚC khi chấm.
