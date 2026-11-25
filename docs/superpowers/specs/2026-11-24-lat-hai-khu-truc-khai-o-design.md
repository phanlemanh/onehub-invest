# HT21 lat-hai-khu-truc-khai-o — lát nhãn trục hai-khu-truc chỉ hiện Toà + Trục

Hàng nền của PL36 (AC-10). Lát `hai-khu-truc` (110 bài Ocean Park 1 có mã căn dạng trục, GS nạp lên DB máy thu 24/11) chưa khai ô
trong `O_THEO_LAT` (`app/src/lib/labels-normalize.ts`), nên màn `/ops/labels` hiện đủ 17 ô, mỗi ô đòi căn cứ — khoảng 3 phút mỗi
bài, 110 bài ≈ 5,5 giờ của Mạnh. Lát khai ô (khuôn hồ sơ `lat-khai-o-can-gan`, lát `hai-khu-ghep-b`) chỉ hiện các ô khai, không căn
cứ từng ô, không Lý do, không lượt hai — nhịp duyệt khoảng 1–1,5 giờ.

Thay đổi: thêm `"hai-khu-truc": ["building", "stack"]` vào `O_THEO_LAT` và nhãn ô Trục «Trục (hai số cuối của số căn)» vào
`NHAN_THEO_LAT` (quy ước «Mã căn» của CONTEXT.md, Mạnh chốt 24/11). Không đổi hành vi lát khác. Lát có khai không đòi căn cứ, nên
luật «căn cứ Chữ bài phải đọc được trong chữ» không chặn 7 bài viết mã liền (`S2.091710`).

Đo: ca test dựng biểu mẫu thật của lát (hai ô, có «Không suy ra được», không căn cứ, không Lý do), đối chứng lát không khai vẫn đủ ô,
và chiều đỏ — bản bỏ dòng khai thì lát hết khai ô. Không UI mới (dùng nguyên biểu mẫu lát có khai đã ký), không DB.
