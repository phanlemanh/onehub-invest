# AC-10 — mẫu nhãn người v2 (lối A)

Mẫu v1 (`mau-bai-lac-du-an.md`) bị bồi thẩm E12 chấm «chưa chắc» ở lượt chấm S4 vòng 1, và lý do xác đáng: 96/100 nhãn là
nháp của trợ lý chưa được người duyệt, và định nghĩa «trong hệ VGP» được chốt SAU khi đã thấy nháp — chính định nghĩa ấy lật
kết quả. GS phán đi lối A (tra-loi P4-196, 17/11 16:00Z): rút mẫu MỚI, mọi thứ dưới đây commit TRƯỚC khi rút, không sửa sau.
Mẫu v1 giữ làm tham khảo, KHÔNG dùng cho AC-10.

## Khai trước khi rút

| | |
|---|---|
| Hạt giống | `tg2-ac10-v2-20261117` |
| Cỡ mẫu | **n = 100** |
| Khung rút | **bài nằm trong một tin S03 đang rao** (`sale_offers.post_ids`), thuộc nhóm mà sổ nhóm ghi đúng một dự án — đúng tập bài mà hàng này đóng dấu. Bài Yêu cầu và bài chỉ ảnh không thành tin nên không có trong khung (mẫu v1 rút trên mọi bài, 41/100 bài không có chữ về dự án) |
| Lệnh rút | `node pipeline/scripts/mau-bai-lac-du-an.mjs --rut --n 100 --seed tg2-ac10-v2-20261117 --khung bai-trong-tin` |
| Ngưỡng | cận TRÊN khoảng Wilson 95% ≤ 10% (Cổng Phạm vi 17/11, Hỏi-3); với n = 100 nghĩa là nhiều nhất 4 bài lạc |

## Định nghĩa «lạc» — chốt trước khi gắn nhãn

Một bài **lạc** khi nó THẬT SỰ nói về một dự án khác dự án của nhóm. Bài không nêu dự án nào là **không lạc**.

**Hệ VGP.** Mạnh, 17/11, nguyên văn: «Trong hệ VGP» — trả lời câu «MCP và LBV tính là dự án khác Vinhomes Grand Park chứ?».
Theo danh bạ lúc khai (`asset_nodes`, 17/11):

| Nút | Dự án |
|---|---|
| 16 | Vinhomes Grand Park |
| 304 | Masteri Centre Point |
| 310 | Lumiere Boulevard |

Trong nhóm mà sổ ghi Vinhomes Grand Park, bài về một trong ba nút trên là **không lạc**. Hệ này chỉ áp cho nhóm VGP; nhóm
khác thì «dự án của nhóm» là đúng một nút trong sổ. Luật ở `laLac` + `HE_DU_AN` trong `pipeline/scripts/mau-bai-lac-du-an.mjs`.

## Ai gắn nhãn

1. Trợ lý điền NHÁP từng dòng kèm căn cứ (đoạn chữ bài, dự án của nhóm, dự án bài nêu) — nếp Mạnh chốt 06/11.
2. Mạnh duyệt trên trang duyệt: mỗi dòng «đúng nháp» hay «sửa thành …». Tệp nhãn lưu tên người duyệt và giờ.
3. **Chỉ dòng Mạnh đã bấm mới tính là nhãn người.** Số AC-10 tính trên nhãn đã duyệt; số trên mẫu v1 báo kèm để thấy lệch.

Bảng 100 dòng kèm chữ bài nằm ở `research-local/` (ngoài kho — chữ bài S03 có thể mang tên nguồn thật, tầng A); hồ sơ này chỉ
giữ phần khai trước, 100 mã bài và số tổng hợp.

## Đã rút

Rút lúc 2026-11-17T16:33:45Z, sau commit khai trước `f840af82`, đúng lệnh đã khai. Kho rút: 50.152 bài nằm trong tin, của 13 nhóm
sổ ghi đúng một dự án. Mẫu rơi vào hai nhóm dự án: Vinhomes Grand Park và Vinhomes Ocean Park 1.

```
cab546ce68bd35021fe52a6a1011c053
212fe544d2fa3d3dc0e544c64114fb20
0e30f65d0f9fa627428631a276a12368
532cf03f61d1cc61eb373d7814ac039e
06e5f2e27eb8d675389b135e5ada8ea4
4d300e4cafa08f616f642fb1f8e05d39
0c0013b68c345520f8f3cb8ccb57126c
d3ef1cd98d08ba16bdb9cc2bc72f7e4f
202447fdb0d7d57c8f02ee9b5c107f49
fd41446a4a5aee8690e8bd57597c65f6
dc9d6eac09963c2a7d10fdfa4c71646f
b7cc2480a4524cdce59d7eba7efad576
13667f7866825776b8e61212feb8a215
f53fc38e75eb80c4849ecdd78db92176
85815eacfab197b1860267566c248272
2236124896ffcc8c487b087ef5f34a49
97066d90e184a00acf45b8937da079eb
ebfb4e753ffed38b31cc0427a7f136d1
adb6151a27e4f063dbc3bd994a6d4025
941da36985c7ab730a99489836f7db50
c6be49495ebc2de2a3c50b17b710af20
cf8e7698ecd445bc8cd2f18bba216758
b9af6e6e5b3743b04d726aa14a8e2eac
88edbf04b51ab2d4e1756ac86bc04932
5c0700fc81d2d0d20993da0403e141ab
a70557368f575a3909f32302f3ab3897
9fda5fbb7803a0981405441cef9cf26c
b37e9f6db2da9243e3cfaff499201c06
c2a60671ae8cf403c73ce900bd9725ae
1541559e667e8467c1f501628874b400
ad39a222154dea4dca6280368cab131f
02e084bcccc141c906450517436bfae6
3391fd9856a028a2bdd33b4fe9040783
e39e9004d2ada52f0e014a089a9a4713
c75d2ebeb6664a352a84f93b6972088d
905e4ced018a78ce378ca7bb87e4caf8
fde68a29b9851490c97098bd27d5e357
8562ead8100256d2aced6761f0649404
1001f6ae957f6ba55f89ffcb44c0da17
1943b06a9cb18c05de16d54090d9b19c
29b1d1c30dca6f25dfa12628cd620384
debdba0e5b7b15ba69beb06e4e426578
6f99d4c503cc9c8f1ad43ad9d3c65785
c86099098b5ec30f5fba86d7dcb1657e
af318eada21a89dc9f667d4ff617c0e0
f98f78a5b683e0cf6410be7a3ec939a9
2b25b941efec0fae94e3f1af843e3b6a
bfbea5f241243d54d7c288539c0eaa00
7bc2654af5e0fee5df8c4fa7cbcfd77e
d6ea40ced7a8b632dd335b0a6889c17e
900bcb9050201f1f14725ca029570136
ae454aaa1b014d5e8e97b212cb62ff24
32d8455cf6ec70cf9a8657dcacb9a7fb
9a5c20fd54b72252ffcc8fca35944e9b
79c488382142cadfda9505bf5b72bcf3
1ef7da2af68568d9b5cf2c00721dbc29
a13995bce10839ce2b0e08aeddb6d9a2
0cea2e5ce4b553255f250a99627bff07
d8778e61fa2d7232cb90023c75bf169d
b48922f746b2b388b45b0badb004db31
e2b20b7abc75d74c2c2fc889de8ffd73
a5f07f65a87e91fdfdd59b537edf1788
e77d5a88886b60e2fe907aefae45b76d
dde5d841c32f5cd4d4a2da080c201505
cae68a7a032a3974426f7f7b6c1be2f9
d815fda29535ae9a50c489377865a51f
6812b5618f0d18e6366d97948a34546a
b430c5c1d5e351def8b5508503189b0c
474ffa1042dc07d842bd2e91642af814
88926cd104022a17266ea15d1d6a7038
d80aeb927c39a55c478fee3bff17482a
1d1324d17d478ca9230476eed7a24068
266c6cafea3f6323346ab07043439761
7cb4a12ef7e69b46d22839eb8249303c
6dcf0fb47451a15990b00af70638ae0b
870c3d27e22f0fc2cdae91266226e524
a05f9da1418afa1e60c47a714630954d
5ba94bc5a9a0c7f53d2fa7173e4040d5
44822a29b18d86d3bc0f80953cc073b4
c191ab4ed787bd47c3431d4fb60d45b1
31c6e6e03fee187f1d6e5d0b7c2d65b1
00508898d5b1a088aeedfe56fc597ccb
5b330e6cac85991dd339ff7ae575cebf
e02325413c15bdc75e897799f31a77c2
5e7f3ee74a93b1a1fa8610b506308297
fa88c578d85fd02e36757aa1977c4049
87bf3e841ad502dceab6ac6189dfd18c
a6d5d5cdab6fae60e90e6b59d8fa545b
56bedee909bb4a444a4138cf711e38ab
a3484ac6e69108cebb8a8f2f7044ad67
cf526191c360245efe179446d8e841ec
125cc26b4f48c40f76833e103840c36e
604160147e384d1777b1c21f01c94d7e
25eed353b4e470b81f3d8ecc335f56fa
34aa76d1258cc30359bb4bc36950d165
105de9b0fc7d52d5e5a166cd588cad79
63978efa470661d076ca2d9e4279983e
ed783155789d807c1e5be39da045122f
27d74a5f11224712973c3fadf460c6a7
3e8fbf040b4e54f810cef6188b5b78f2
```

## Nháp của trợ lý — CHƯA phải nhãn người

Trợ lý đọc cả 100 bài: **nháp 0/100 bài lạc**. Trong nhóm VGP, mười tám bài nêu MCP hay LBV — thuộc hệ VGP theo định nghĩa đã
khai, không lạc. Một dòng gắn cờ «cần xem kỹ»: bài `02e084bc…` trong nhóm Ocean Park 1 ghi «Mã căn: M2» — nếu M2 là một toà
Masteri trong khu Ocean Park thì theo định nghĩa đã khai bài ấy là lạc; nháp tạm để «không lạc», người quyết.

## Kết quả

**CHỜ MẠNH DUYỆT** trên trang `research-local/duyet-nhan-ac10-v2.html` (ngoài kho). Tệp nhãn tải về được tính bằng:
`node pipeline/scripts/mau-bai-lac-du-an.mjs --tinh-duyet <tệp nhãn> --seed tg2-ac10-v2-20261117`
— lệnh thoát 0 chỉ khi cận trên Wilson ≤ 10% VÀ cả 100 dòng đã được người bấm.
