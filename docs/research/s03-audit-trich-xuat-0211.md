# S03: audit chất lượng trích xuất, từ bài thô tới căn (02/11)

> Ngày 2026-11-02. Trạng thái: **đề xuất, chờ Mạnh quyết** (§8). Chưa sửa code, chưa thêm hàng lộ trình.
> Cách làm: chỉ đọc DB local :5433, dựng lại đường đọc của `pipeline/transform-zalo.mjs` (HEAD `e6543f3a`) và khớp tuyệt đối với
> DB (2.772 khoá = 2.772 tin sống). Bài đăng 18/10–01/11. Số thô ở `research-local/s03-audit-0211/` (gitignored).
> Tên nhóm rút gọn (tầng C). Không chép SĐT, URL; ví dụ chỉ giữ đoạn cần thiết.

## 0. Kết luận

**Regex có phải nguyên nhân chính không? Một phần. Nó là nguyên nhân lớn nhất, nhưng chỉ chiếm chưa tới một nửa, và phần lớn phần đó là luật sai
cụ thể, sửa được ngay, chứ không phải regex «không làm nổi».** Giả thuyết của anh đúng với ý định, giá theo ngữ cảnh và bài nhiều căn.
Nó sai với số phòng và diện tích (lỗi luật), với toà (đọc được mà không lưu), và không liên quan tới dự án, phường, ảnh.

| Nguyên nhân, trên các ô hỏng của bài rao (giá, DT, PN, toà, mã căn, dự án) | Tỉ lệ | Sửa bằng gì |
|---|---|---|
| **Bộ đọc không bắt, đọc sai, đọc thừa** | **43%** | Luật đơn giản sửa được 87% số lỗi giá, DT, PN trên mẫu; phần còn lại cần ngữ nghĩa |
| **Đọc được rồi rơi**: có mã toà mà không lưu, đọc đúng nhưng bài bị loại | **33%** | Lưu trường, sửa điều kiện loại; không liên quan năng lực regex |
| **Thiếu ngữ cảnh**: chữ không nói dự án, chỉ nhóm mới suy được | **18%** | Thẻ nhóm, sổ nhóm |
| **Chữ nêu dự án nhưng chưa có bộ đọc dự án** | **6%** | Bộ đọc hoặc LLM |

Trên toàn bộ các ô đó: đúng và đã lưu 25%, chữ không có thông tin 34%, hỏng 41%. Bảng trên chia phần hỏng 41%, tính ngang nhau giữa sáu trường (§4).

Bốn điều nên biết thêm:

1. **38% số bài (19.520/51.180) chỉ có ảnh**, chữ không có gì để đọc. Regex hay LLM chữ đều không giúp được. 6.149 bài trong số đó không gắn được vào bài chữ nào (§7).
2. **Chất lượng khác hẳn theo họ nhóm, đúng như anh cảm nhận.** Regex đọc đúng số phòng 34/40 ở họ Grand Park nhưng chỉ 7/76 ở họ Ocean Park (§3).
3. **Tin S03 chưa tới được căn nào: `property_offers` S03 = 0.** Regex không phải lý do: ghép cần phường, mà chữ bài rao gần như không ghi phường (0,6%), trong khi 77% phường đang có là đọc nhầm hướng nhà (§1, §2).
4. **Ý thẻ nhóm của anh có giá trị, nhưng ở dự án và toà, không ở giá.** Thẻ đưa toà đọc đúng từ 106 lên 132/155 và không đổi giá, DT, PN. Điểm yếu là mức đúng của dự án suy từ nhóm chưa đo được độc lập (§6).

**Đề xuất (§8):** trước 05/11 vá một lát luật hẹp và lưu mã toà; chạy LLM toàn bộ chữ riêng để đối chiếu (khoảng 5–6 USD), chưa ghi vào dữ liệu; anh biên tập thẻ cho 16 nhóm lớn.
Sau 05/11: tách bài nhiều căn, đọc ảnh mồ côi, ghép danh mục.

**Độ tin của số:** nhãn đối chiếu do tác tử Claude gắn mù, chưa có người gắn (§9). Hướng kết luận vững vì có Qwen và tập vàng 61 của ZCode so chéo; riêng con số tuyệt đối của Haiku có thể lạc quan.

## 1. Phễu hao hụt

| Bước | Số | Rơi vì |
|---|---|---|
| `stg_zalo_posts` | 52.543 dòng | |
| Bài thật | **51.180**, 30 nhóm (26 tên sau khi gộp bản ghi cùng nhóm) | 100 dòng S05, 1.263 bài thử |
| Có chữ | **31.660** (7.604 chữ riêng) | **19.520 chỉ có ảnh** |
| Vào tin | **19.592** (3.599 chữ riêng, 473 người gửi) | Yêu cầu 5.245 · không nhận ý định 2.999 · không giá 2.979 · giá phi lý 845 |
| Tin sống | **2.772** (bán 854, thuê 1.918) | Gom repost, nên 19.592 bài chỉ còn 2.772 khoá |
| Căn | **0 `property_offers`** | Chỉ 47 tin đủ điều kiện Stage B, 2 ứng viên `needs_llm` |

Đối chiếu từng lý do loại với nhãn mù:

| Lý do máy loại | Thực tế theo nhãn | Đánh giá |
|---|---|---|
| Yêu cầu | 25/25 đúng là Yêu cầu | Tốt |
| Giá phi lý (thuê ≥ 1 tỷ, 841 bài) | **25/25 là tin rao** (18 bán + thuê, 7 bán) | Bỏ oan: ý định sai, phải sửa chứ không vứt |
| Không giá | **34/39 là tin rao**: che số 26, không có giá 7, không đơn vị 5 | Phần lớn bỏ oan |
| Không nhận ý định | 17 tin rao, 11 Yêu cầu, 7 không phải tin, 4 không rõ (trên 39) | Lẫn lộn, luật khó tách |

Sau khi vào tin, độ tinh khá tốt: 95% [89–100] số chữ riêng vào tin là tin rao thật. Vấn đề chính là **bỏ sót**: chỉ 84% [77–90] tin rao vào được tin.

Gom repost: 15.879 bài lặp y hệt cùng người; trung vị 2 bài mỗi tin, tối đa 190; 415 tin gom nhiều hơn một nội dung, 5 tin từ 20 nội dung trở lên. Tin lớn nhất là bài tổng hợp hằng ngày của một môi giới, gom 49 nội dung thành một căn. Top 10 người gửi chiếm 48,7% số bài vào tin.

## 2. Độ đủ trường theo nhóm

Cấp tin, toàn bộ 2.772 tin:

| Trường | Có | Trường | Có |
|---|---|---|---|
| Giá | 100% (điều kiện vào tin) | Loại hình | 3,6% |
| Diện tích | 33% | Phường | 3,5%, **75/97 là đọc nhầm hướng «Tây Nam»** |
| Số phòng | 67% | Toà (`block_raw`) | 2,1% |
| SĐT | 57% | Mã căn | **0** |
| Ảnh | 52% | Dự án | **0**, không có cột |

**Đọc được mà không lưu:** 1.297 tin (47%) có mã toà hoặc căn trong kết quả parser (`ma`), nhưng trường này không được ghi xuống.

Bảng dưới xếp nhóm tệ nhất trước, theo trung bình %DT, %PN, %SĐT, %ảnh (bốn trường có độ phân hoá; điểm này em tự đặt để xếp thứ tự, không phải thước chuẩn). Chỉ gồm nhóm ≥ 200 bài; 10 nhóm còn lại cộng 381 bài, 39 tin. Giá 100% ở mọi nhóm vì tin không giá bị loại từ trước. Nhóm ít tin (dưới 30) số dao động mạnh.

| Nhóm | Bài | %chỉ ảnh | Bài vào tin | Tin | %DT | %PN | %SĐT | %ảnh | %toà lưu | %mã không lưu | %phường | %loại | Điểm |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Shophouse Grand Park | 668 | 36 | 110 | 24 | 4 | 79 | 12 | 50 | 0 | 38 | 4 | 0 | 36 |
| Ngọc Giá Đáy | 234 | 61 | 49 | 43 | 65 | 19 | 0 | 70 | 2 | 26 | 7 | 7 | 38 |
| Quỹ phía Đông | 624 | 2 | 438 | 19 | 84 | 0 | 84 | 0 | 5 | 84 | 5 | 0 | 42 |
| Hoàng Phát Grand Park | 3.057 | 46 | 838 | 127 | 7 | 86 | 19 | 58 | 0 | 49 | 2 | 0 | 42 |
| Diamond Land 3 | 489 | 8 | 268 | 49 | 71 | 43 | 69 | 8 | 4 | 49 | 0 | 4 | 48 |
| Yeshomes | 9.758 | 35 | 3.480 | 835 | 17 | 87 | 42 | 47 | 1 | 39 | 1 | 1 | 48 |
| CN Grand Park Q9 | 4.264 | 42 | 1.431 | 211 | 21 | 89 | 48 | 50 | 1 | 41 | 2 | 6 | 52 |
| Cho thuê-CN OCP1 | 602 | 4 | 394 | 10 | 80 | 20 | 80 | 30 | 10 | 80 | 0 | 0 | 52 |
| CN OCP1-F1 | 1.794 | 18 | 978 | 111 | 72 | 9 | 82 | 52 | 5 | 59 | 8 | 7 | 54 |
| Toà S1+S2 OCP | 862 | 9 | 569 | 33 | 61 | 3 | 64 | 91 | 9 | 55 | 6 | 3 | 55 |
| Duy Ka Masteri | 6.113 | 52 | 1.629 | 282 | 68 | 2 | 81 | 70 | 6 | 63 | 10 | 8 | 55 |
| Căn hộ Grand Park N1 | 10.465 | 34 | 5.015 | 610 | 21 | 89 | 64 | 51 | 1 | 42 | 1 | 6 | 56 |
| Chợ Masterise | 1.335 | 34 | 472 | 107 | 73 | 58 | 97 | 7 | 1 | 65 | 2 | 3 | 59 |
| Nhà phố Grand Park | 6.371 | 37 | 3.142 | 181 | 24 | 89 | 66 | 57 | 2 | 49 | 4 | 1 | 59 |
| Đối tác F1 | 860 | 51 | 174 | 27 | 85 | 4 | 74 | 81 | 4 | 59 | 7 | 0 | 61 |
| Hàng Hot VHOP | 3.303 | 62 | 552 | 64 | 86 | 11 | 69 | 89 | 11 | 78 | 27 | 5 | 64 |

Bài rơi theo lý do:

| Nhóm | Yêu cầu | Không nhận ý định | Không giá | Thuê ≥ 1 tỷ |
|---|---:|---:|---:|---:|
| Shophouse Grand Park | 145 | 30 | 58 | 83 |
| Ngọc Giá Đáy | 1 | 26 | 14 | 0 |
| Quỹ phía Đông | 8 | 112 | 53 | 1 |
| Hoàng Phát Grand Park | 457 | 298 | 45 | 12 |
| Diamond Land 3 | 19 | 53 | 0 | 111 |
| Yeshomes | 2.257 | 466 | 131 | 34 |
| CN Grand Park Q9 | 585 | 251 | 74 | 141 |
| Cho thuê-CN OCP1 | 2 | 125 | 55 | 0 |
| CN OCP1-F1 | 7 | 264 | 205 | 19 |
| Toà S1+S2 OCP | 1 | 150 | 62 | 0 |
| Duy Ka Masteri | 33 | 214 | **1.073** | 2 |
| Căn hộ Grand Park N1 | 1.071 | 403 | 257 | 203 |
| Chợ Masterise | 6 | 140 | 76 | 190 |
| Nhà phố Grand Park | 497 | 244 | 107 | 35 |
| Đối tác F1 | 4 | 74 | 171 | 0 |
| Hàng Hot VHOP | 23 | 73 | **581** | 10 |

Đọc bảng:

- **Họ Grand Park thiếu DT** (4–24%) vì môi giới ở đây ít ghi DT, không phải vì regex: nhãn cho thấy chỉ 5/40 bài rao trong mẫu có DT trong chữ.
- **Họ Ocean Park thiếu số phòng** (0–20%) vì viết «1N+1», «2N2WC», «stu». Đây là lỗi regex: 76/80 bài rao mẫu có số phòng trong chữ.
- **Không giá tập trung ở Duy Ka Masteri và Hàng Hot VHOP**: giá che số «3.4x tỷ».
- **Quỹ phía Đông, Cho thuê-CN OCP1** lặp rất nhiều: 438 bài thành 19 tin, 394 bài thành 10 tin.

## 3. Độ chính xác

**Mẫu:** 383 bài, mỗi chữ riêng một suất. Tầng nhóm 255 bài (15 bài cho mỗi nhóm trong 16 nhóm lớn, cộng 15 bài nhóm còn lại, trong đó 174 bài rao). Tầng lý do loại 128 bài. Hai tác tử con gắn mù, chồng 30 bài: đồng thuận 30/30 về ý định, bán/thuê, giá, DT, PN, loại, mã căn; toà 27/30; phường 29/30.

**Ước lượng trên toàn bộ** (tầng nhóm, trọng số theo số chữ riêng của từng nhóm, ngoặc là khoảng tin cậy 95%):

| Trên bài rao có trường đó trong chữ | Regex hiện tại | Vá mô phỏng | Haiku 5.5 | Haiku + thẻ |
|---|---:|---:|---:|---:|
| Ý định (mọi bài) | 87% [81–94] | 88% [81–95] | 95% [90–99] | 91% [85–98] |
| Bán hay thuê | 90% [84–96] | 92% [87–98] | 98% [94–100] | 97% [93–100] |
| Giá đúng | 83% [75–91] | 85% [75–95] | 100% [99–100] | 100% [99–100] |
| Giá sai trong số đã đọc ra | 8% [1–15] | 11% [2–21] | ~0% | ~0% |
| DT đúng | 72% [61–84] | 92% [82–100] | 100% | 100% |
| DT sai trong số đã đọc ra | **22%** [13–30] | 0% | 0% | 0% |
| PN đúng | **59%** [49–70] | 95% [88–100] | 100% | 100% |

Số thô cùng 255 bài, không trọng số: giá 110 · 144 · 160 · 160/163; DT 78 · 107 · 111 · 111/111; PN 48 · 165 · 168 · 168/168; ý định 213 · 221 · 245 · 243/255. Haiku sai đúng 3 ca giá, đều do đoán nhầm bậc («6t8», «4.520 thu nét», «3400 tỷ»), một luật chặn khoảng giá bắt được.

**Theo họ nhóm, số thô** (đúng/có trong chữ). n mỗi nhóm quá nhỏ nên chỉ báo theo họ:

| Họ nhóm | Trường | Regex | Vá | Haiku |
|---|---|---:|---:|---:|
| Grand Park (40 bài rao) | Giá | 37/39 | **33/39** | 39/39 |
| | DT | 4/5 | 4/5 | 5/5 |
| | PN | 34/40 | 38/40 | 40/40 |
| Ocean Park (80) | Giá | **35/71** | 61/71 | 69/71 |
| | DT | **37/65**, 27 sai | 64/65 | 65/65 |
| | PN | **7/76** | 76/76 | 76/76 |
| Smart City (29) | Giá | 25/29 | 29/29 | 29/29 |
| | PN | 5/29 | 29/29 | 29/29 |
| Nhiều dự án (23) | Giá | 12/23 | 20/23 | 22/23 |
| | PN | 2/22 | 21/22 | 22/22 |

**Vá mô phỏng** là bản viết ngoài kho để ước mức cải thiện, không phải code đề xuất, chốt trước khi xem nhãn nhưng sau khi đã xem lỗi trên toàn bộ dữ liệu. Nó làm **giá ở Grand Park tệ đi** (37 xuống 33/39): đoán đơn vị khi chữ không ghi dễ sai. Vì vậy vá giá phải làm hẹp và có test.

**Hai phép so chéo không phụ thuộc nhãn Claude:**

- **Tập vàng 61 bài do ZCode gắn** (chỉ ý định, loại), số LLM lấy từ `s03-nhan-bac-do-3-backend.md`: regex hiện tại 58/61, Qwen 61/61, Decisions 59/61, Haiku 57/61. Nhưng chỉ 25/34 tin rao trong đó vào được tin: 7 rơi vì không giá, 2 vì không nhận ý định.
- **Qwen 3.8 27B local** trên 83 bài: ý định 80/83 so regex 64/83; bán/thuê 43/43 so 32/43; giá 42/42 so 24/42; DT 31/31 so 21/31; PN 43/43 so 14/43. Model khác họ cho kết quả gần Haiku, nên phần lớn lợi thế LLM không phải do cùng họ với người gắn nhãn.
- Phiên kiểm tin đầu ra đọc độc lập 50 tin bán có giá và DT: 15/50 sai giá hoặc DT, cùng các dạng lỗi dưới đây.

**Lỗi trích SAI trên toàn bộ dữ liệu:**

| Lỗi | Ví dụ rút gọn | Quy mô |
|---|---|---:|
| DT có phẩy thập phân chỉ đọc phần lẻ | «45,7m2» ra 7 m² | **144/926 tin có DT**. Cả 71/71 tin bán giá/m² > 300 triệu đều do lỗi này |
| Phường khớp nhầm hướng nhà | «hướng Tây Nam» ra phường Tây Nam | **75/97 tin có phường** |
| Giá lấy nhầm số ngữ cảnh | «cắt 450tr», «vốn 1,4 tỷ», «vay 1.4ty», «S702» thành 702 triệu | ~**180 tin** (6,5%), ước theo từ khoá |
| Tin bán xếp thành thuê | «cắt 700tr» thành thuê 700 triệu | 53/1.918 tin thuê có dấu hiệu bán |
| Không phải BĐS lọt thành tin | bán sim, tuyển sales «7 triệu/tháng», bán data | Có; thấp, ~5% theo mẫu |
| Bài tổng hợp gom thành một căn | «1,95 tỷ 31,9m²» gom 49 nội dung | Tin lớn nhất và 3 tin tương tự |

## 4. Kiểm giả thuyết regex: (a) không bắt · (b) chữ không có · (c) bắt rồi rơi

Trên bài rao, tầng nhóm, trọng số theo chữ riêng:

| Trường | Đúng và vào tin | **(a) có trong chữ, không bắt** | Đọc sai | Đọc thừa | **(b) chữ không có** | **(c) đọc được rồi rơi** |
|---|---:|---:|---:|---:|---:|---:|
| Giá | 77,5% | **9,2%** | 7,1% | 0,8% | 2,6% | 2,8% |
| Diện tích | 15,4% | 2,4% | 6,4% | 5,7% | **62,6%** | 7,5% |
| Số phòng | 56,3% | **40,3%** | 0 | 0 | 1,1% | 2,3% |
| Toà | 0 | 30,6% | gộp ở (a) | | 10,2% | **59,2%** (có `ma`, không lưu) |
| Mã căn | 0 | 3,7% | gộp ở (a) | | **88,1%** | 8,2% (có `ma`, không lưu) |
| Dự án | 0 | 15,8% (chưa có luật) | | | 84,1% (43,1% tên nhóm suy được, 41,0% không) | |
| Phường | 0 | 0,6% | 4,8% gán nhầm | | **94,6%** | |

Cộng dồn trên sáu trường đầu: đúng 25%, chữ không có 34%, hỏng 41%; trong phần hỏng: bộ đọc 43%, rơi sau đọc 33%, thiếu ngữ cảnh 18%, chưa có luật dự án 6%.

**Phần (a) có đúng là giới hạn của regex không?** Trên cùng mẫu, vá mô phỏng sửa 180/206 lỗi đọc giá, DT, PN (**87%**), chủ yếu là số phòng viết tắt và phẩy thập phân. Giới hạn thật của regex lộ ở ba chỗ:

- **Giá theo ngữ cảnh:** vá chỉ tăng 83% lên 85% và còn thêm sai; LLM 100%.
- **Ý định:** vá 88%, LLM 95%. Kev cũng chưa thay được: trên tập vàng, ngưỡng p ≥ 0,9 chỉ bắt 22/34 tin rao và nhầm 8.
- **Bài nhiều căn** (§5): luật không tách nổi.

Regex riêng cho từng nhóm không cần: một bộ vá chung đạt 76/76 PN ở Ocean Park, đồng thời PN Grand Park vẫn tăng từ 34 lên 38/40.

## 5. Đặc thù tin môi giới

| Dạng viết | % bài có chữ | % chữ riêng | Hiện xử lý |
|---|---:|---:|---|
| **Số phòng viết tắt** (2n, 1+, stu) | 34,1% | 30,4% | Không ra số ở 29,8% bài. Lỗi lớn nhất, dễ sửa nhất |
| **Giá không đơn vị sau nhãn** («5300 net») | 30,1% | 20,3% | Không đọc |
| **Giá che số** («3.8x tỷ», «36xx») | 10,5% | 4,7% | Không đọc, rơi vào «không giá» (1.787 bài) |
| **Mã che tầng** («PR6xx20») | 9,8% | 4,2% | Đọc được `ma`, không lưu; vẫn dùng được ở mức toà + trục |
| **Bài có ≥ 3 cụm giá** | 5,8% | 9,8% | Một bài thành một tin, một giá |
| Giá khoảng | 2,9% | 4,0% | Không đọc |
| Thương lượng | 1,6% | | |
| **Không dấu** | **0,1%** | | Không phải vấn đề: 26 bài, nhãn 0/383 |

**Lặp nhiều nhóm:** 2.686/7.604 chữ riêng (21.678 bài) xuất hiện ở hơn một nhóm, 809 chữ ở từ 3 nhóm; 1.205 tin trải hơn một nhóm. Khoá gom đang xử lý ổn phần này. Nhờ lặp nhiều, **LLM chỉ cần đọc mỗi chữ riêng một lần**: 7.604 thay vì 31.660 bài.

**Bài nhiều căn:** 14% [7–21] chữ riêng bài rao theo nhãn, nặng ở Smart City (17/29 bài rao trong mẫu). 1.826 bài có 10.126 cụm giá nhưng chỉ cho 219 tin, nghĩa là đang mất rất nhiều căn. Nguồn tập trung: 109 người gửi, top 5 chiếm 58%. Haiku nhận ra 19/21 bài nhiều căn, không báo nhầm; **chưa thử tách từng căn**.

**Loại hình gần như một màu:** 247/250 bài rao mẫu là căn hộ, nên lợi ích của việc đọc trường này thấp.

## 6. Thử A/B thẻ mô tả nhóm (ý của Mạnh)

**Cách thử:** cùng 255 bài, cùng Haiku 5.5, cùng prompt; nhánh A chỉ có tên nhóm, nhánh B thêm thẻ. Thẻ do Claude viết nháp theo họ nhóm (Grand Park, Ocean Park, Smart City, nhiều dự án) từ số đo toàn bộ dữ liệu, không xem nhãn, **chưa qua anh biên tập**.

| Trên bài rao | A: tên nhóm | B: có thẻ |
|---|---:|---:|
| Toà đọc đúng | 106/155 | **132/155** |
| Mã căn đọc đúng | 21/38 | **29/38** |
| Loại hình đúng | 153/174 | **167/174** |
| Chữ im: gán theo dự án của nhóm | 85/115 | **114/115** |
| Giá, DT, PN | 160/163, 111/111, 168/168 | **như nhau** |
| Ý định | 245/255 | 243/255, **kém 2 bài** |
| Nhóm nhiều dự án: gán bừa dự án khi chữ im | 0/23 | **0/23** |
| Chi phí mỗi bài | 0,00066 USD | 0,00078 USD (+18%) |

**Tên nhóm gây nhầm là chỗ thẻ có ích rõ nhất.** Ở Duy Ka Masteri, 9 trong 12 bài hai nhánh khác dự án nằm ở đây: A lấy «Masteri» từ tên nhóm, B ghi Ocean Park. Bài chỉ có mã, không tên dự án: Cho thuê-CN OCP1 80%, Hàng Hot VHOP 72%, Toà S1+S2 72%, Duy Ka 57%, trong khi Grand Park 10–33%. Đúng ca anh nêu.

**Chiều xấu:**

- 12 bài chữ nêu dự án khác thẻ (ví dụ Masteri Centre Point trong nhóm Grand Park, Sunshine trong nhóm Ocean Park). B giữ đúng theo chữ 6, suy sai theo nhóm 6; A suy sai 4. **Thẻ thêm 2 ca gán sai** («MGC», «era landmark»). 6 ca trên 174 bài rao, tức 3,4% ở nhánh B. Đây là mức xấu nhất: một số tên có thể là dự án con trong cùng đại đô thị, em không tự kiểm được.
- **Con số 114/115 đo mức tuân theo thẻ, không phải mức đúng.** Bài chữ im không có đáp án độc lập.
- Độ thuần theo bài có nêu tên dự án cho thấy nhóm không thuần như tên: Yeshomes 99% Grand Park, Chợ Masterise 96% Smart City, Duy Ka Masteri 78% Ocean Park, CN OCP1-F1 chỉ 64%, Quỹ phía Đông 50%. Số này có thiên lệch: người ta hay ghi tên khi căn **không** thuộc dự án quen của nhóm, nên độ thuần thật ở bài chữ im có thể cao hơn. Danh mục S08 không kiểm được phần này cho Ocean Park vì thiếu nhiều toà và mã trùng nhiều dự án (ví dụ S1 ở 4 dự án, A1 ở 6).

**Ràng buộc đã chốt:** Q4/H5 quy định tên nhóm và ngữ cảnh là suy luận, chỉ phá hoà, không tự quyết. Thẻ phải đi theo bậc này: ghi dự án từ thẻ thành phát biểu suy luận, không ghi đè chữ bài. Sổ PL12 đã có sẵn chỗ (`market_codes`, `project_node_ids`, `note`) nhưng **rỗng cho cả 30 nhóm**.

**Chưa thử:** thẻ do anh biên tập (có thể tốt hơn nháp này) và thẻ cho VLM.

## 7. Ảnh

- 19.539 bài chỉ-ảnh có người gửi: gắn được vào bài chữ cùng người dưới 2 phút cho vào tin 8.266, không giá 3.818, không nhận 589, giá phi lý 513, Yêu cầu 204. **Mồ côi 6.149 (31%)**, khoảng 1.965 cụm, trong đó 1.709 album còn tệp, tập trung ở các nhóm Grand Park.
- **Ảnh mồ côi (13 tệp khác nhau, mẫu rất nhỏ): cả 13 có chữ trong ảnh ghi giá, PN hoặc toà**, thường là ảnh chụp tin của chính môi giới.
- **Ảnh gắn bài không giá (xem 4 tệp): 1/4 có thông tin**, còn lại là ảnh nội thất. Vậy đọc ảnh để bù giá cho bài chữ có thể lợi ít hơn đọc ảnh mồ côi.
- Thiếu DT có ảnh 966/1.846 tin; thiếu PN có ảnh 479/903.
- KC3 (dãy U1 đang làm) chỉ nhắm bài chữ thiếu dữ kiện. **Bài chỉ-ảnh nằm ở KC4 («Later»)**. Lý do hoãn của KC4 ghi 31/10 là «0 bài không chữ trong stg»; nay stg đã có 19.520 bài, nên nửa đầu điều kiện mở lại đã đạt.

## 8. Đề xuất xếp hạng (Mạnh quyết)

Mức cải thiện lấy trên mẫu; **chi phí thời gian là ước tính**.

| Hạng | Hướng | Cải thiện | Chi phí | Rủi ro | Kịp 05/11 | Hàng có sẵn |
|---|---|---|---|---|---|---|
| **1** | **Vá hẹp bộ đọc + lưu `ma`:** DT phẩy, PN viết tắt, tắt khớp phường theo hướng, số ngữ cảnh không phải giá, «thuê ≥ 1 tỷ» thành bán thay vì vứt, giá che số | PN 59→95%; DT 72→92%, hết DT sai; 144 tin hết DT sai, 75 phường sai biến mất; PN cấp tin 67→94%; tin bán 854→~1.174 (+37%); toà và mã từ 2% lên khoảng 47–53% tin | 1–2 ngày thợ; chạy lại transform; không tốn API | Giá không đơn vị dễ sai bậc (Grand Park 37→33/39; 528 bài bán < 300 triệu trong mô phỏng); đổi khoá gom nên một phần `offer_id` nghỉ và mọc lại | **Có**; nên làm giá che số và không đơn vị sau cùng, có test riêng | PL13, PL17 (lát hẹp, không chờ PL6/PL15) |
| **2** | **LLM đọc mọi chữ riêng ở lớp đề xuất**, kèm trích dẫn, so với bộ đọc; bất đồng dùng để ưu tiên luật và duyệt | Giá, DT, PN khoảng 100%; ý định 95%, bán/thuê 98% trên nhãn; cứu phần vá không tới | Haiku **~5–6 USD** hết bài cũ, **0,5–0,8 USD/ngày** (766–1.009 chữ mới/ngày). Qwen 0 USD, 13–24 giờ máy, 2–3 giờ/ngày. Thêm trường vào lệnh KC1: ~1–2 ngày | Luật 7: LLM không tự ghi dữ liệu. Sai bậc giá (3 ca) cần chặn. `silver_labels` đang 0 dòng | **Chạy đối chiếu: có. Ghi vào tin: không** | KC1 mở rộng, đích PL18 |
| **3** | **Thẻ nhóm + khai sổ PL12** | Toà 68→85%, mã căn 55→76%, loại 88→96%; dự án cho bài chữ im; không đổi giá, DT, PN; ý định −2/255 | Anh biên tập 16 nhóm lớn; +18% chi phí LLM | Thêm gán sai dự án (2 ca trên mẫu, 3,4% tổng); mức đúng chưa đo độc lập; thẻ cũ dần | **Có**; khai sổ độc lập với code, có tác dụng khi hướng 2 chạy | PL12 (đã ký), PL18 E1 |
| 4 | **Đọc ảnh mồ côi**, sau khi có số KC3 | ~1.709 album hiện mất hẳn; có thể thành tin mới (chưa đo) | ~2–5 USD chưa đo (cần số KC3); bộ gom ảnh | Mẫu 13 tệp quá nhỏ; ảnh chụp lại tin đã có có thể chỉ tạo trùng | Không chắc | KC4, mở lại sau KC3 |
| 5 | **Tách bài nhiều căn** | 14% chữ riêng bài rao; 10.126 cụm giá đang chỉ cho 219 tin; hết gom nhầm | Bộ đọc LLM ra mảng căn; đổi khoá offer | Chưa đo độ đúng tách; không rõ căn có còn hàng; dễ phồng số tin | Không | PL18 |
| 6 | **Ghép mã toà vào danh mục, tới căn** | Hiện **0 tin S03 tới căn**. Cận trên 863/1.297 tin có mã khớp tiền tố S08 | Danh mục OCP đầy đủ; xử lý mã trùng bằng dự án (cần hướng 3) | S08 chỉ dùng nội bộ; 150 dự án, trùng tiền tố nhiều; độ đúng chưa đo | Không | PL10, PL20 |

**Không đáng làm:** xử lý không dấu (0,1%); regex riêng theo nhóm (§4); ưu tiên đọc loại hình (99% căn hộ); bổ sung lọc Yêu cầu (25/25 đúng).

**Quyết định cần anh:**

1. Có làm hạng 1 trước 05/11 không, và có gồm giá che số, giá không đơn vị không. Em nghiêng về có, cả hai, có test riêng cho giá; nếu thiếu thời gian thì DT phẩy, PN viết tắt, tắt phường theo hướng là ba việc rẻ nhất, an toàn nhất.
2. Đường ghi của LLM sau 05/11: chỉ đề xuất qua `/ops/review`, hay tự áp khi trích dẫn có thật và qua luật kiểm khoảng giá. Câu này đụng luật 7, chỉ anh quyết. Trước 05/11 em đề nghị chỉ đối chiếu.
3. Anh biên tập thẻ nhóm, hay duyệt nháp em viết. Nháp ở `research-local/s03-audit-0211/the-nhom-nhap.json`.

## 9. Điều chưa đo được, giới hạn

- **Nhãn mẫu do tác tử Claude gắn, chưa có người.** Cùng họ với Haiku nên 100% của Haiku có thể lạc quan; đồng thuận 30 bài chồng cũng không độc lập hoàn toàn. Có Qwen và tập vàng ZCode so chéo, nhưng tập vàng chỉ có ý định và loại. Muốn chốt cần người gắn khoảng 50 bài giá, DT, PN; KC2 cũng cần ≥ 200 nhãn vàng.
- **Cỡ mẫu theo nhóm nhỏ** (15 bài), nên chỉ báo theo họ. Trọng số theo chữ riêng phản ánh độ đa dạng nội dung, không phải số bài; trọng số theo bài cho PN đúng 54%, DT đúng 65%, giá đúng 76% (vào tin và đúng), cùng hướng.
- **Mức đúng của dự án suy từ nhóm** chưa có đáp án độc lập (§6).
- **Thẻ:** chỉ thử nháp của Claude, chỉ trên LLM chữ, chỉ Haiku; chưa có VLM + thẻ.
- **Ảnh:** mẫu 13 + 4 tệp, chỉ đủ gợi hướng. KC3 chưa có số đúng.
- **Tách nhiều căn, gom dưới (cùng căn khác người), số căn thực trong bài tổng hợp:** chưa đo.
- **Cải thiện của vá là mô phỏng** trên bài cũ, chưa chạy transform thật; số tin mới là ước theo khoá gom. Giá trị «~180 tin giá nghi sai» ước theo từ khoá, chưa đọc tay hết.
- `seller_ref` còn là hằng trên DB tới khi PR #265 được nạp lại, nên chưa đo được chất lượng định danh người bán.
- **Chi phí thật của phép đo:** Haiku ~0,41 USD (gồm một lần lỗi cấu hình ~0,05 USD); Qwen dừng ở 83 bài do máy bị dùng chung.
