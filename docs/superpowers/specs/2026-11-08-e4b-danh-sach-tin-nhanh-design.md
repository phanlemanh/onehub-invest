# E4b — danh sách tin công khai dưới 1000 ms (thiết kế)

Hồ sơ `_acceptance/e4b-danh-sach-tin-nhanh/`. Giao: giám sát đợt dot0-cam-mau trả P2-132 (08/11), Mạnh «Đồng ý với các hàng đo
hiệu quả hàng ngày và giao dãy». Mục tiêu: ca `E4b đối chiếu DB máy thu` (`app/tests/tin-rao-doi-chieu.test.tsx`) đo trang đầu
vn-hcmc tin bán ở bốn kiểu sắp dưới 1000 ms trên DB máy thu, có biên an toàn, không nới trần của test.

## Vấn đề

Ca E4b đỏ trên `main` (lượt chấm PL34 vòng 1, d60c3fa1): `newest` 1032 ms, lượt nhanh nhất trong sáu lượt cách nhau 5 giây, dưới
tải của cả bộ test app (`--test-concurrency=8`). Đường nền của hồ sơ này (e21a151e, 08/11 02:31Z) cùng ca đó lại xanh, sát trần:
newest 837 · price-asc 888 · price-desc 771 · perm2-asc 734 ms. Ca xanh hay đỏ tuỳ tải máy lúc chấm, nên mọi hồ sơ T2 chạy suite
app có thể vấp nó.

## Số đo trước khi sửa (08/11, chỉ đọc)

`getPublicOffers("vn-hcmc", kind=sale)` gửi ba nhóm câu song song: `sourceEntries` (hai câu nhỏ), câu trang, câu đếm.

| Đo | Kết quả |
|---|---|
| Thời gian gọi trọn hàm, DB máy thu, máy rảnh, ba lượt mỗi sort | newest 518–696 · price-asc 687–834 · price-desc 651–800 · perm2-asc 646–925 ms |
| EXPLAIN ANALYZE câu trang (newest) | 540–640 ms; trong đó CTE `nhieu_ten` 300–480 ms: quét tuần tự **toàn bộ** `sale_offer_records` (78.492 dòng), sắp rồi gom theo `seller_ref`, chỉ để dùng cho 24 dòng của trang |
| Phần lọc + sắp của trang | quét song song 3 luồng, 110–190 ms |
| Câu đếm | 170 ms, chạy song song với câu trang |
| Cỡ bảng | heap 286 MB trên DB máy thu (14.430 tuple chết) · 120 MB trên bản chép `db-thu.sh` cùng 79 nghìn dòng |

Bộ test app chạy trên bản chép (`db/db-thu.sh … --chay`, chép bằng pg_dump nên gọn), nên phình bảng ở DB máy thu không giải
thích được ca đỏ của suite; phần chung của cả hai DB là CTE `nhieu_ten` quét toàn bảng ở mỗi lời gọi.

So ba cách viết trên DB thử `oneinvest_p2_e4b` (bản chép, đã VACUUM), năm lượt, cùng tham số, kết quả 24 dòng và cờ nhiều tên
khớp từng dòng với câu cũ:

| Cách | Không index | Có index `(seller_ref, seller_name)` |
|---|---|---|
| V1 câu hiện tại | 235–277 ms | 78–94 ms |
| V2 rút trang trước, `nhieu_ten` chỉ xét `seller_ref` của trang | 80–93 ms | 45–51 ms |
| V3 hai câu tuần tự | 164–198 ms | 188–205 ms |

Trên DB máy thu (phình): V1 181–309 ms, V2 155–258 ms ở mức SQL (bộ đệm ấm).

## Phương án

- **A. Chỉ sửa câu (V2)** — T2, không DDL, không cần Mạnh áp DB. Rút trang trước trong CTE `MATERIALIZED`, `nhieu_ten` đếm tên
  trên MỌI tin sống nhưng chỉ cho `seller_ref` có trên trang. Nghĩa không đổi: cờ nhiều tên của một tài khoản là hàm của tài
  khoản đó, không phụ thuộc tài khoản khác.
- **B. Index 085** `sale_offer_records (seller_ref, seller_name) WHERE retired_at IS NULL AND seller_ref IS NOT NULL` — nhanh
  thêm, nhưng là T3 (`db/migrations/**`), và bộ test chép lược đồ từ DB máy thu nên index chỉ có tác dụng sau khi Mạnh áp lên
  DB máy thu (sao lưu trước). Ca E4b vẫn đỏ tới lúc áp, PL34 vẫn kẹt.
- **C. A + B** — để sau khi A đã gỡ chặn.
- **D. VACUUM FULL DB máy thu** — việc vận hành, không phải mã; bảng phình lại sau các lượt transform; không chữa được suite.

**Chọn A.** Chỉ A gỡ chặn PL34 ngay mà không cần bước của người. B đi thành đề xuất riêng (giám sát quyết), số đo ở bảng trên
đã đủ làm căn cứ.

## Thiết kế

`app/src/lib/offers-public.ts`, chỉ hàm `getPublicOffers`:

Bản chọn là V5 (đo thêm 08/11 dưới tải đường nền, sáu lượt, gồm cả câu đếm):

| Bản | DB máy thu (phình) | Bản chép gọn |
|---|---|---|
| V1 câu hiện tại + câu đếm song song | 1008–1841 ms | 286–525 ms |
| V2 + câu đếm song song | 462–652 ms | 132–307 ms |
| V4 trang chỉ mang khoá + câu đếm song song | 525–659 ms | 141–231 ms |
| V5 trang chỉ mang khoá, total và withPhone theo hàm cửa sổ, không câu đếm riêng | 325–566 ms | 173–321 ms |

Cả ba bản mới khớp V1 từng dòng (offerId, cờ nhiều tên), V5 khớp total 26.519 và withPhone 23.791.

```sql
WITH khoa AS MATERIALIZED (
  SELECT o.offer_id, o.seller_ref, count(*) OVER () AS total, count(o.seller_phone) OVER () AS with_phone
  FROM sale_offers o JOIN areas a ON a.id = o.area_id
  WHERE <where> ORDER BY <order> LIMIT <limit> OFFSET <offset>
), nhieu_ten AS (
  SELECT seller_ref FROM sale_offers
  WHERE seller_ref IS NOT NULL AND seller_ref <> '' AND lower(btrim(seller_name)) NOT IN ('unknown', '')
    AND seller_ref IN (SELECT seller_ref FROM khoa)
  GROUP BY seller_ref HAVING count(DISTINCT seller_name) >= <OFFER_MANY_NAMES>
)
SELECT <OFFER_COLUMNS>, k.total, k.with_phone
FROM khoa k JOIN sale_offers o ON o.offer_id = k.offer_id JOIN areas a ON a.id = o.area_id
  LEFT JOIN nhieu_ten n ON n.seller_ref = o.seller_ref
ORDER BY <order>
```

- Hàm cửa sổ tính trên toàn tập lọc trước `LIMIT`, nên total và withPhone bằng câu đếm cũ. Trang không dòng: offset 0 nghĩa là
  tập lọc rỗng (total 0, withPhone 0, không cần câu nào thêm); offset lớn hơn 0 thì chạy câu đếm cũ (AC-6).
- Thân `nhieu_ten` sinh từ một hàm duy nhất cùng với hằng `NHIEU_TEN` (trang tin, tin cùng tiêu chí giữ nguyên câu cũ), nên
  hai đường đọc không thể lệch luật đếm tên.
- `OFFER_COLUMNS`, `ORDER`, `whereOf` giữ nguyên. Thứ tự ngoài lặp đúng biểu thức sắp có `offer_id` phá hoà, nên thứ tự dòng
  không đổi.
- Bản phá «đếm sau lọc» của E7 (`app/tests/tin-rao-cong-khai.test.tsx`) chép chuỗi mã của câu cũ; viết lại theo cấu trúc mới, giữ
  nguyên ý phá (đếm tên chỉ trong phường lọc → đỏ `DEM SAU LOC`).

## Không gian tiêu chí (quét hình thái, preset test-matrix)

Ngữ cảnh: chân sản phẩm `[SUY-TỪ-REPO: _acceptance/tin-rao-tren-invest/contract.md]`; chân ngành: «đổi câu truy vấn giữ nghĩa
phải đối chiếu kết quả với câu cũ trên dữ liệu thật» `[NGÀNH: PostgreSQL docs — Using EXPLAIN]`.

Trục:
- Lời hứa: thứ tự + tập dòng | cờ nhiều tên | thời gian | đếm (total, withPhone)
- Dữ liệu: lược đồ tạm có đáp án | DB máy thu
- Đường đọc: trang đầu theo thị trường | lọc phường | trang sâu (offset) | không thị trường
- Bốn kiểu sắp: newest | price-asc | price-desc | perm2-asc

Core: thời gian × DB máy thu × trang đầu × bốn sort (AC-1); thứ tự + tập dòng × DB máy thu × mọi đường đọc ở bốn sort so với câu
cũ (AC-2); cờ nhiều tên × lược đồ tạm × trang cắt ngang tài khoản, lọc phường (AC-3); không nới trần (AC-4); đường đọc trang
tin không đổi (AC-5).
Later: index 085 (B); `getPublicOffer`, `getOfferComps` cũng quét toàn bảng cho `nhieu_ten` (trang tin) — cùng cách sửa, hồ sơ
riêng. Never: đổi đếm `total` sang ước lượng — đổi lời hứa «total bằng đếm độc lập» của E4b.

## Rủi ro

- Biên dưới tải: suite chạy 8 tệp song song. AC-1 đo E4b khi chạy riêng trên DB máy thu; AC-2 chạy trọn suite (E4b dưới tải);
  AC-3 đo biên ở cả hai điều kiện vì ca của nó nằm trong tệp mà suite chạy. Độ rộng biên: giám sát trả P2-133 700 ms, Mạnh chốt ở
  Cổng Phạm vi (phương án khác 500 ms, hoặc index 085 cho dưới 300 ms).
- Đáp án «câu cũ» của AC-3, AC-4 là `offers-public.ts` của commit e21a151e nạp thành module tạm, không chép tay.
- Câu đếm vẫn quét song song toàn tập lọc (170 ms); để nguyên vì đổi nó đổi lời hứa total.
