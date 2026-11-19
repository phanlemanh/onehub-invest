# AC-10 — tỉ lệ bài lạc dự án (mẫu nhãn người)

Thước này kiểm chính **tiền đề** của hàng: «bối cảnh nhóm là mặc định cho địa chỉ của tin». Nếu bài trong một
nhóm chuyên một dự án lại hay nói về dự án khác, thì đóng dấu dự án của nhóm lên mọi tin là đóng dấu sai.

## Khai TRƯỚC khi gắn nhãn

Ba dòng này được máy ghi lúc rút mẫu, trước khi ai nhìn bài nào. Đổi chúng sau khi gắn nhãn là làm hỏng phép đo.

| | |
|---|---|
| Cỡ mẫu khai trước | **n = 100** |
| Hạt giống | `tg2-ac10-20261117` |
| Rút lúc | 2026-11-16T23:06:35Z |
| Kho rút từ | 112.313 bài của 13 nhóm mà sổ nhóm ghi đúng một dự án |
| Lệnh rút | `node pipeline/scripts/mau-bai-lac-du-an.mjs --rut --n 100 --seed tg2-ac10-20261117` |
| Lệnh tính | `node pipeline/scripts/mau-bai-lac-du-an.mjs --tinh <bảng đã điền>` |

Rút mẫu xác định theo băm (hạt giống + mã bài) nên không ai chọn được bài dễ. Bài đọc qua `loadStgPosts` nên
bài thử đã bị gạt.

**Hạt giống một mình KHÔNG đủ để rút lại đúng mẫu này.** Băm được xếp trên toàn kho, mà kho lớn lên mỗi ngày:
đo 17/11, kho đi từ 112.313 lên 112.474 bài thì cùng hạt giống chỉ còn trùng 99/100 bài. Thứ khoá mẫu là
**danh sách 100 mã bài** ở dưới — mã bài không phải tầng A, nên nó nằm được trong hồ sơ.

## Ngưỡng

Hợp đồng đòi **cận TRÊN của khoảng Wilson 95% ≤ 10%**, không phải tỉ lệ thô ≤ 10%. Với n = 100 điều đó nghĩa là:

| số bài lạc | cận trên Wilson 95% | |
|---|---|---|
| 0 | 3,70% | đạt |
| 4 | 9,84% | đạt |
| 5 | 11,18% | **chưa đạt** |

Nên n = 100 cho phép **nhiều nhất 4 bài lạc**. Dùng Wilson chứ không dùng khoảng chuẩn vì mẫu nhỏ và tỉ lệ gần 0
— khoảng chuẩn cho cận dưới âm và cận trên hẹp giả, đúng hai chỗ phép đo này dễ bị đọc sai. Cỡ mẫu nhỏ bị phạt
đúng: 0 bài lạc trên 20 bài vẫn cho cận trên 16,11%, tức **không** đạt.

## Bảng gắn nhãn — nằm ngoài kho

Bảng 100 dòng kèm đầu bài ở **`research-local/mau-bai-lac-du-an.md`** (gitignored), không ở trong kho: kho này
công khai, còn chữ bài S03 có thể mang tên nguồn thật in sẵn trong bài, và tên nguồn thật là tầng A
(ADR-0007). Chỉ **số tổng hợp** ở dưới mới vào hồ sơ.

## 100 mã bài của mẫu

Rút lúc 2026-11-16T23:06:35Z. Đây là tập cố định mà người gắn nhãn phải chấm, và là thứ
người ký đối chiếu được mà không cần rút lại.

```
c6b97c12155d980b7a9be678f0715905
5263c6d4fadc4b35b453564963ac50a8
f64942f2b43cd647cba3663dccee515f
b3c46c8ed28ccbcd9fff3eebe9ee695c
ab05f4147eafba22decb5243dccfeb39
8989744f029d0a4445d178a6eb4f95f3
e7251377078f1d971606c7101233d0db
18c020ee8be791aea4b51fe92f97a8c6
8e21d290aa5debcf26b492d7496d845c
85b112340c4d89374f8055b28d283cff
0c18ad5abe1ae51af86e98496b6264fd
9a34217debc332685885acfbe5cc5396
9c02a55c131ae1949f4b7bbace304b7e
46e1dacea2f57f27135855abdf1af2e8
99f73830aae2ddee5b322bb19b624211
5258f7c011412021beff545895199d97
42183541bb1116f35e27028ecae9672f
b9fd50a7bd1d0662be0d53557e03e04b
1cda32b46567dde35521e5dbb7dba5f2
7df80f526d9746fcb23b18e175972de7
3d948624ff53b27f9cef00ffa7354cac
48a42686a2d0f5287d908c4f943a28f3
ce04937f9d5ec6dbed391549b17d6986
a0dfdd18992de2fb251ac48ffe40b418
27da69c4156fe1ee37325bfffb338aa7
e7bec0e1a9d03905f75e6c467e81229b
85a1455e3a18d57fb72c8ff2f1f6d54b
0c757046736f3323af3539c79606d3b3
493b223fdb56a707bb91a2489cee4abd
15a44480312df00a676d3f28c44249f8
3707f969cf412b4ad1f4ad1c0e8753c2
d5becea1dd3cddce879a17731d55dda5
6cad3859d9f0dcacd20096fd565f881d
13d46ff6d6f1cd7c74fc26665fe4c4d6
65e8586d772085caadf9987675eb78bd
302aa5a9de0cdf386e1984eb136def70
fd90a6cac98523cf594ec7db9e2bcb9a
75c2d16e666edd87897228b502bd4d30
7d8b9c3e5b2eb9de36463f58e06e9978
da6f4662208dc9716e49f20ff27541f4
2203c465be72e5261cc1bdfc7124ef4d
c0691053e6e1177ebf7798dcbfca2093
8f5e44c3e3f44da526f0bb06350dda68
9e7daea7f9c8110ea228fcabafc96d19
7077883f5d75e53aab9040b3b49acfc3
4aedc026ed2f75565ce2f6e9e665cf8e
bbf1876a591dd270c1d95143df8e7648
55d32ef14c0e5dd83427891220051475
efa6d55ae174b44bc7b9f56cdd76dec4
e201fb69939d5ac69d345c131dbd136d
52a8b0c596b6f1c54168ca9a61b1848b
0370e062e15105a698f83e9c24cf6941
b072d718f9f7ad0d9248233d6deb5ae2
ce356f0a96f5a1f31e725cc9df6f6bc3
471f34d997d19609daa8c63506b382f3
2dd8fbadd69065b5517c019f2d19dc39
ecbcfef97b9ac711448678b5ba4ba1dd
327d6dc34e0f91925158b66d2390e6b0
a68bdbfe88efde9140796877c967dcb9
d5d086afa8f220ebc3fe33a3297b2cd5
50e68223ea82c4842e6684f98485c4b9
b0f074fa8b745a973395ded4ed6f76cd
f0220fe5835c38c3209a6058275ae0f7
f6b4b683daeb90507b39fae45ededa6e
15f594919e06d61294cef5ba6b85bf5c
4e9a1a5db3bddcc1ac3c5cf0ea076be1
fd06348cd2c9f3257635ff3f207d2003
147b917a3531046512724614fde46bc3
81799f4a35884d1e07fbb74ea29440a5
3bf0747723f40aa2c8512221f2978c1a
150b1e6cd4a7667fa93123178f15ebf0
48c71da85a6ff27bb734023b3a30e5f0
58a50303fe09cd3e61fd30fc5b003cd0
b9179fd2e744efde902781284653889d
ca9ccec196b4da172057bb96f698bec5
30641f811bde352eeb133c2397fe9bff
e855c61bfa2f8e5782634eda6258a21e
7f9d16850f935b9d1b110e097ddb1a45
84031de4591cc9a04a1de06525f9d03d
87400ee4f1473b8afa62dc1ead39805b
97829242a3e894ba89536523402f9cad
679ea941e54b2da34a70a78c7870da66
64b9cd87a6abdbeb62d05cf05a9ef97f
ef637b4558fb436ac65021846bb384fa
f4d7e069fc3166cf6c066094a6d2ca00
4bb64f3715051c3214154a661b7eedef
4f06dd7569d531a48abf85b442a8fc57
283f9df926cb07076062e002a69117c1
2e8259a1af699c76fbb37e40a8fc293f
1d7adecaa983d91389eb4bb13b3118d6
1eada472197f7269982d0f4fec58e425
c26555aba94ac83fa7a57977f5ae508f
b04d1e0c3d484aa979785b6d4b8d33d5
409145cf667fffd292b1b4ecf5cb84e0
06403b5d60fd14ec5b9d6a6c40968495
d99bf8f69867c9e2a2f6b8583c3a0249
3a5ad7c074b8f11cc0bb5db29c441749
c262066dfba285b4a75afe1738c40ac0
6ff38e230b0053dc10d2566f1df26423
f3a898a8e69f2e27915b0cbafab9cb85
```

## Kết quả

**1/100 bài lạc · tỉ lệ 1,00% · khoảng Wilson 95%: 0,18% – 5,45% · cận trên ≤ 10%: ĐẠT.**

**Kết luận: bối cảnh nhóm đủ làm mặc định cho dự án của tin**, trên mẫu này và với quyết định dưới.

Lệnh: `node pipeline/scripts/mau-bai-lac-du-an.mjs --tinh research-local/mau-bai-lac-du-an.md`.

### Ai gắn nhãn

Trợ lý đọc cả 100 bài và điền nháp ngày 17/11 (luật «nháp rồi Mạnh duyệt»). Nháp treo trên đúng một câu:
bốn trong năm ca bị đánh lạc là bài rao **Masteri Centre Point** hay **Lumière Boulevard** — hai dự án của
Masterise Homes, nằm trong hoặc sát khu, rao ngay trong nhóm Vinhomes Grand Park.

**Mạnh quyết 17/11, nguyên văn: «Trong hệ VGP».** Bốn ca ấy vì thế không lạc. Chín mươi sáu nhãn còn lại là nháp
của trợ lý, chưa được duyệt từng dòng.

| Cách đọc | bài lạc | Wilson 95% | so ngưỡng |
|---|---|---|---|
| **Theo quyết định của Mạnh** — MCP, LBV trong hệ VGP | **1/100** | 0,18% – **5,45%** | **đạt** |
| Nếu MCP, LBV là dự án khác (đối chứng, không dùng) | 5/100 | 2,15% – 11,18% | chưa đạt |

Ca lạc duy nhất: bài rao «căn hot nhất Ocean park 2 3» (dự án ở Hà Nội) đăng trong nhóm VGP ở TP.HCM.

**Hệ quả của quyết định lên hàng TG2**: bài MCP/LBV trong nhóm VGP sẽ được đóng dấu dự án Vinhomes Grand Park
khi chữ bài im. Bài nào chữ bài nêu rõ MCP hay LBV *và* nhãn bạc khớp được một nút danh bạ riêng thì chữ bài vẫn
thắng (AC-3) — quyết định này không gộp nút danh bạ, chỉ nói rằng đóng dấu VGP lên chúng không tính là sai.

### Giới hạn của chính mẫu này, phải đọc cùng con số

- **41/100 bài không có chữ nào nói về dự án**: 39 bài chỉ có đường dẫn ảnh hoặc video, 2 bài là quảng cáo
  không phải bất động sản (mở tài khoản xe máy điện, bán tài khoản Netflix). Với những bài ấy ta chỉ biết
  **chữ bài không mâu thuẫn**, không biết là đúng. Tính riêng 59 bài có chữ: cách A cho 5/59 = 8,47%, cận trên
  **18,35%** (chưa đạt); cách B cho 1/59 = 1,69%, cận trên **9,00%** (đạt).
- **Mẫu rút trên MỌI bài, trong khi TG2 chỉ đóng dấu bài thuộc một tin.** Bài «Yêu cầu» (khách tìm nhà) và bài
  chỉ ảnh không thành tin nên không bị đóng dấu — mà hai trong năm ca lạc của cách A lại đúng là bài Yêu cầu.
  Nếu Mạnh muốn thước bám đúng tập bị đóng dấu thì phải rút lại mẫu trên tập ấy, với hạt giống mới khai trước.

Cận trên vượt 10% là **chưa đạt**, và kết luận đúng khi ấy là **hàng đổi hướng** — không phải một ghi chú.

Bảng nhãn nháp đầy đủ kèm ghi chú từng ca: `research-local/mau-bai-lac-du-an.md` (ngoài kho).
