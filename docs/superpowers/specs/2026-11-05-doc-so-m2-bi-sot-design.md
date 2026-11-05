# Đọc số m² bị sót trong bài S03 — thiết kế (GC1 `doc-so-m2-bi-sot`)

## Vì sao

Đo 04/11: 14 trong 2.175 tin S03 thiếu m² thật ra có số trong chữ bài (`docs/plan/pham-vi-gan-can-s03-0411.md`, hàng GC1). Sửa rẻ, không phụ thuộc chuỗi gắn căn, và mỗi tin có số thì không phải đi đường diện tích suy ra của GC2, GC3.

## Đo lại 05/11, trước khi sửa (DB máy thu, chỉ đọc)

| Loại | Tin thiếu m² (căn hộ và chưa rõ loại) | Bài trên toàn bộ 80.317 bài |
|---|---|---|
| Nhãn «Diện tích» rồi số, không đơn vị («Diện tích: 45.7») | 8 | 37 |
| Chữ kiểu Unicode (số và m2 viết đậm) | 7 | 104 |
| Có chữ m2 nhưng chỉ nằm trong đường link | 3, phải giữ rỗng | |
| «Diện tích: 3pn2wc» | 1, phải giữ rỗng | |

Tổng 15 tin (14 bán, 1 thuê) so với 14 của 04/11: danh sách 04/11 không được lưu, nên danh sách chuẩn là `_acceptance/doc-so-m2-bi-sot/probes/mau-do.json`, viết trước khi sửa bộ đọc.

Danh sách đóng 141 bài đổi ở `probes/mau-bai-doi.json`: mã băm và số, không có chữ bài. Đã đọc tay 27 nhóm bài, tất cả đúng số trong chữ.

## Cách làm

Trong `parsePost`, chỉ khâu diện tích đổi:

1. Đọc như cũ trên chữ cũ trước: `<số> m²`, rồi `<số>m` đứng một mình. Có số thì giữ, nên không giá trị đã đọc nào đổi. Đo nháp thứ tự ngược đã đổi một bài từ 173 sang 200 vì bài có «200M2» đậm ở tiêu đề.
2. Còn rỗng thì đọc lại hai bước đó trên `gatSo(text.normalize("NFKC"))`. NFKC trước `gatSo` để SĐT viết đậm cũng bị gạt; `㎡` và `²` thành `m2`.
3. Còn rỗng thì tới luật mới `dienTichSauNhan`, cũng trên chữ NFKC: nhãn đầy đủ «Diện tích» hoặc «Dien tich», dấu tuỳ chọn, số 1–3 chữ số có thể có phần lẻ. Bỏ qua dấu cách rồi xét ký tự kế tiếp: phải là hết dòng hoặc ký tự không phải chữ, không phải số, nên «65 triệu», «65 pn», «20 x 30» không qua. Không nhận dải (`60-70`, `60 - 70`, `60/70`) và kích thước có `×`. Khoảng 15–500, cùng khoảng của `dienTichMetTran`.

Không thêm cột, không đổi lược đồ. `area_m2` vẫn là số chính tin ghi, đúng ADR-0013 và ROADMAP §3 mục 30.

## Lựa chọn đã loại

- **Nhận cả nhãn «DT»**: «dt» trong chat còn là doanh thu và nằm trong «hdt» (hợp đồng thuê). Câu giao chỉ nói nhãn «Diện tích», và cả 8 tin thật đều ghi đủ.
- **Chuẩn hoá toàn bài**: đo được 303 bài có giá chỉ đọc ra sau khi chuẩn hoá, nên việc đáng làm nhưng đổi giá là đổi thước giá và gom tin, phạm vi khác hẳn câu giao. Tách việc riêng.
- **Chạy transform thật để đo**: giám sát cấm ghi dữ liệu thật ở vòng này, nên đo bằng DB thử `oneinvest_gc1_m2`.

## Ảnh hưởng đã biết

Đo nháp trên DB thử 05/11, transform bản cũ rồi bản mới, 69.477 tin (4.050 tin S03):

| Thay đổi | Số tin |
|---|---|
| `area_m2` từ rỗng sang có số | 15, đúng danh sách |
| `area_m2` đang có số bị đổi hoặc mất | 0 |
| `price_perm2` thêm | 15 |
| `price_perm2` đang có bị đổi | 0 |
| `confidence` đổi | 0 |
| Thành viên nhóm gom đổi | 0 |
| `offer_id` mất hoặc mới | 0 |

126 bài đổi còn lại thuộc tin đã có số từ bài khác, hoặc không thành tin.

- `price_perm2` tính ra cho tin có giá, và `confidence` có thể tăng. Đó là đường cũ, không phải luật mới.
- `repostKey` dùng diện tích nên bài có thể gom khác đi; `offer_id` theo post (PL14, `pipeline/transform-zalo.mjs:825`). E4 đo việc này trên DB thử.
- Tin chỉ có số sau transform đêm kế tiếp sau khi gộp (`scripts/zalo-import-daily.sh:132`). Vòng này không chạy transform thật.

## Phép đo

- Hàm thuần: ca hai chiều trong `pipeline/parse.test.mjs`, kèm phá thử bản sao bộ đọc, mỗi chặn một đột biến (E1, E5, E6, E2).
- So bộ đọc cũ với mới trên toàn bộ bài thật, kết nối chỉ đọc: tập bài đổi đúng bằng danh sách đóng, giá, phòng, SĐT, loại tin không đổi ở bài nào (E3).
- Hai lượt transform, bản cũ rồi bản mới, trên DB thử dựng lại mỗi lần, đúng lệnh chạy đêm: không tin nào có số bị đổi, tập tin đổi đúng bằng danh sách đóng, không nhóm gom nào đổi, mọi kết nối của transform đều vào DB thử (E4).

## Bỏ đặc tả UX

Việc không chạm giao diện: xem dòng `descope` trong sổ.
