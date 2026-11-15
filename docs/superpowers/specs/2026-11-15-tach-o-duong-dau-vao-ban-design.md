# Bộ tách ô đường xử lớp đầu vào bẩn + probe dữ liệu thật ra khỏi suite chung — thiết kế

Hàng `tach-o-duong-dau-vao-ban`, T2, đợt dot0-cam-mau. GS giao ngày 15/11 sau khi suite agent đỏ sẵn trên main
d2b4beaf. Hệ quả: mọi lượt chấm và ghim lại của các dãy khác bị chặn.

## 1. Vấn đề

Ca `CD-AC-8 probe ô đường thật` (`agent/tests/judge-entity-duong.test.ts`) đọc `sale_offers.street_raw` trên DB máy thu,
hay trên bản chép của DB đó mà suite agent dùng qua `db/db-thu.sh`. Ca này đòi mọi giá trị có cụm vị trí phải ra Khớp.
Lượt S06 đêm 14/11 mang về giá trị «Hẻm 5 ,,1/ Đường chùa Pháp thạnh»:
- `khoaDuong` bỏ cụm «hẻm 5 ,»;
- bước cắt-từ-dấu-phẩy xoá luôn phần tên phía sau;
- kết quả là khoá rỗng, so ra Thiếu.

Suite `executors.test.agent` thuộc `feature_loop.suite_keys`. Nhãn «đỏ sẵn trên nền» chỉ áp cho eval, nên một dòng dữ
liệu mới chặn cả kho.

Hai lỗi, sửa cả hai:
1. **Bộ tách** không chịu một số lớp đầu vào có thật.
2. **Thiết kế phép đo** đặt một ca đo dữ liệu thật (dữ liệu đổi mỗi đêm) vào suite chung của mọi lượt.

## 2. Bảng phủ ca

Đo trên DB máy thu, chỉ SELECT: 15.413 giá trị `street_raw` khác nhau, 102.345 tin. Bộ đo chạy `khoaDuong` của main.

| Lớp | Giá trị / tin | Hiện tại | Sau sửa |
|---|---|---|---|
| L1 dấu phẩy lặp, khoảng trắng trước phẩy, sau cụm vị trí («Hẻm 5 ,,1/ X») | 1 / 1 (+ 67 / 68 giá trị có « ,» nói chung) | mất tên | tên sau cụm |
| L2 số nhà rồi đến dấu phẩy («208, Nguyễn Hữu Cảnh, Phường 22…») | 3 / 3 | mất tên | đoạn sau số nhà |
| L3 cụm vị trí ngõ/ngách/hẻm/kiệt đứng sau chữ khác («Đường Kiệt 91 Lê Tân Trung», «Số nhà 17 ngõ 60 Dương Khuê») | 55 / 66 (trong đó «Đường» trước cụm 32 / 40) | khoá sai | phần sau cụm cuối cùng |
| L4 bề rộng hẻm có số lẻ («hẻm 3,5m», «Ngõ 2.5m») | 2 / 3 | khoá rác «5m» | là cụm vị trí, không khoá |
| L5 khoảng trắng trước gạch chéo giữa hai số («Hẻm 822 /131A Hương Lộ 2») | 2 / 2 | khoá «131a …» | «822/131A» là một số |

Các lớp đã đúng, giữ nguyên và có ca hồi quy:
- «/» treo sau số (46 giá trị);
- «/» giữa số (390);
- cụm ở đầu (1907);
- từ vị trí không kèm số (222);
- chữ hoa/thường;
- không dấu (HD2);
- đường đánh số («Đường 70, Phường…»: không khoá — đúng thiết kế).

Khoảng trắng thừa đo ra 0, vì nguồn đã gọt sẵn. Mọi ca hỏng thuộc S06.

Ngoài lát này:
- typo từ vị trí («kiêt 90»);
- đuôi rác sau tên («… an lạc bình tân»);
- số nhà dính chữ («175/cô Giang»).
Ba lớp này hoặc vẫn ra khoá có tên đúng phía trước, hoặc cần một bước đọc khác, không phải luật chuỗi.

## 3. Cách sửa bộ tách

Có hai bản chép giống hệt nhau: `agent/src/agents/judge-entity.ts` (luật judge) và `app/src/lib/ops/review-can-cu.ts`
(thẻ duyệt). CD-AC-7 giữ hai bản cùng kết quả, nên sửa cả hai cùng một đoạn.

Các bước thêm vào `khoaDuong`, theo thứ tự, sau `toLowerCase`/Eth:
1. **L4.** «<từ vị trí> N[.,]Mm» → «<từ vị trí> NMm». Bề rộng thành một token cụm, không bị dấu phẩy thập phân cắt.
2. **L5.** `(\d)\s+/(?=\d)` → `$1/`. Chỉ khi cả hai phía là chữ số, nên «1/ Trần Văn Mười» không đổi.
3. **L1.** Dồn chuỗi dấu phẩy và khoảng trắng quanh nó: `\s*,[\s,]*` → «, ».
4. Bỏ cụm vị trí ở đầu: regex cũ, không đổi.
5. **L2.** `^\d[\p{L}\d/-]*\s*,\s*` → «»: một số nhà trần đứng trước dấu phẩy.
6. Cắt từ dấu phẩy: cũ.
7. **L3.** Nếu còn `(^|\s)(ngõ|ngo|ngách|ngach|hẻm|hem|kiệt|kiet)\.?\s*\d[\p{L}\d/-]*`, lấy phần SAU lần khớp cuối.
   - «số» không thuộc bước này, để «Đường số 7» giữ nguyên.
   - Không còn gì sau cụm thì khoá rỗng (Thiếu), như ô «Ngõ 12».
8. Phần còn lại như cũ: «thang» → «tháng», ô chỉ còn từ vị trí, hai cách đọc số nhà, tiền tố Đường/Phố.

## 4. Probe dữ liệu thật ra khỏi suite chung (khuyến nghị C)

Ca `CD-AC-8 probe ô đường thật` chuyển nguyên văn sang `agent/probes/o-duong-that.test.ts`:
- tên ca giữ nguyên;
- bộ tách độc lập trong ca giữ nguyên;
- cách đọc DB giữ nguyên.

Glob của suite `npm test` là `tests/*.test.ts`, nên ca này ra khỏi suite chung. Ca `CD-AC-8 bộ tách` (không DB) ở lại.

Ca CD-AC-8 chỉ chọn giá trị có cụm ở ĐẦU chuỗi (1814 giá trị), nên một mình nó không thấy L2, L3. Tệp probe vì thế
thêm ca `CD-AC-12 probe lớp ô đường thật`:
- mỗi lớp L1–L5 chọn bằng regex riêng (cụm ở bất kỳ vị trí);
- so khoá với bộ tách độc lập theo lớp;
- 0 lệch, in số chọn theo lớp.

Phạm vi phủ của probe vì thế là: cụm đầu cộng năm lớp đã đo. Một lớp thứ sáu chưa ai đặt tên thì probe không thấy; cái
đó chỉ lộ khi có người nhìn thẻ duyệt hay đo lại bảng phủ ca.

Mục «Ô đường thật» là script riêng `scripts/o-duong-that.sh`. Script chạy probe và in ✅ hay ❌, thoát 0 hay 1. Cờ
`O_DUONG_DOT_BIEN=1` chạy probe bằng bản luật đột biến, để kiểm được nhánh ❌. `audit-all.sh` gọi script và đổi mã
thoát thành `pass`/`fail`.

Số đo nền của phép kiểm suite (CD-AC-10): suite agent còn bốn ca probe dữ liệu thật khác, chưa đỏ:
- KD-AC-6 phần b;
- hai ca LT-AC-6 (dấu `t.skip` «cần DB máy thu»);
- ca đếm tin của context-resolver (không dấu).

CD-AC-10 khoá số theo dấu bằng danh sách nợ: judge-entity-khong-dau 1, judge-luat 2, tệp khác 0. Thêm probe mới vào
suite là đỏ. Dời bốn ca kia là Hỏi-2.

Nhiều tệp suite khác có đọc `sale_offers`/`review_queue` để tự ghi fixture trên DB của lượt. Vì vậy phép kiểm theo
dấu probe, không theo tên bảng.

Ba chỗ chạy probe:
1. `executors.test.judge_entity_duong` chạy cả hai tệp (`tests/judge-entity-duong.test.ts probes/o-duong-that.test.ts`).
   Ba hồ sơ đã ký dùng executor này: chuan-hoa-o-duong, duong-thang-n-khong-dau, che-do-thu-tren-ops. Eval của chúng
   vẫn đo đúng ca probe như lúc ký. Eval đỏ do dữ liệu mới thì nhãn «đỏ sẵn trên nền» của kit áp được, vì đó là eval,
   không phải suite.
2. `scripts/audit-all.sh` thêm mục «Ô đường thật»: chạy probe trên DB máy thu, ✅ kèm số giá trị và đếm theo lớp, ❌ kèm
   giá trị lệch. **Người đọc**: `/ops-check` (skill vận hành buổi sáng, bước 2 chạy `audit-all.sh`). Phiên vận hành
   hay Mạnh thấy ❌ thì mở hàng sửa bộ tách cho lớp mới.
3. Eval của chính hồ sơ này (AC-7): probe xanh trên DB máy thu mới nhất. Đây là điểm xong GS đặt.

Suite chung có thêm ca `CD-AC-10`: không tệp nào trong glob suite agent đọc bảng dữ liệu thật (`sale_offers`,
`review_queue`). Ca này canh để probe không bị đưa lại vào suite.

### Lựa chọn cho người (Hỏi-1)

| | Cách | Giá |
|---|---|---|
| **C (khuyến nghị)** | Suite chạy ca cố định chép từ các lớp đã đo, cứng 0 lệch; probe thật ở ba chỗ trên, cứng 0 lệch nhưng không chặn làn ghim | Giá trị mới thuộc cụm đầu hay năm lớp đã đo chỉ lộ ở /ops-check hôm sau hoặc ở lượt ghim của ba hồ sơ dùng executor; lớp chưa đặt tên thì không probe nào thấy; ai đó phải đọc ❌ và mở hàng |
| A | Giữ probe trong suite chung, cứng 0 | Mỗi lớp mới của nguồn làm đỏ mọi lượt chấm và ghim của cả kho cho tới khi có người sửa (sự cố 15/11) |
| B | Giữ trong suite, ngưỡng tỉ lệ (vd ≤ 0,1% giá trị lệch) | Vẫn dao động theo dữ liệu; một lớp mới nhỏ lọt dưới ngưỡng không ai thấy; ngưỡng là số phải chốt và giữ |

## 5. Ngoài phạm vi

- Ba lớp nêu cuối §2. Đọc tên đường bằng model, sửa dữ liệu nguồn.
- Thu thập S06 (làn ZCode).
- Cảnh báo chủ động (issue riêng tư) khi probe ❌: /ops-check là kênh đọc hiện có. Đẩy cảnh báo là việc riêng.
