---
schema_version: 1
feature: Mỗi thẻ «Bổ sung tin» còn đề xuất có kết quả chấm bóng của hai lần đọc độc lập kèm trích dẫn, thẻ hai lần đọc lệch hay máy bỏ trống được đánh dấu ca biên, và không dòng tin nào đổi
slug: cham-bong-bo-sung-tin
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: verified
approved_by: Mạnh
approved_at: 2026-11-21
design_doc: docs/superpowers/specs/2026-11-21-cham-bong-bo-sung-tin-design.md
---

# Acceptance Contract: cham-bong-bo-sung-tin

## Context

Hàng NB1 của đợt «người ở biên» (ROADMAP §3 mục 61, Mạnh «Theo khuyến nghị cả bốn câu» 21/11). Hàng «Bổ sung tin» ở `/ops/review`
chờ 1.018 thẻ, người quyết 0 trong 7 ngày. Đếm 21/11 trên DB máy thu: 786 thẻ còn 1.078 đề xuất chờ; 232 thẻ không còn đề xuất nào
(chỉ có khối đối chiếu). Hàng này chạy hai lần đọc độc lập trên bài gốc cho từng đề xuất, tính kết cục bằng luật xác định, tách ca
biên — KHÔNG ghi tin, không đóng thẻ, không đổi đề xuất. Người đọc đầu ra: NB5 (bảng lô, chấp thuận lô). Thiết kế: `design_doc`.

## Criteria

- AC-1: Given DB có thẻ «Bổ sung tin» đang chờ với đề xuất chờ ở cả năm ô (loại hình, số WC, phòng ngủ, toà, đường), When chạy lượt
  chấm bóng, Then mỗi thẻ chờ còn đề xuất được đọc đúng một lần bởi mỗi model trong hai model khác nhau thuộc danh sách đã duyệt (đơn
  vị lời gọi là cặp thẻ × model, đọc mọi ô có đề xuất trên thẻ); mỗi đề xuất chờ nhận đúng hai kết quả lấy từ hai lần đọc đó (hai đề
  xuất cùng ô trên một thẻ dùng chung lần đọc); mỗi kết quả có giá trị hoặc rỗng, giá trị khác rỗng kèm đoạn trích và căn cứ một
  câu; thẻ «Để sau» và đề xuất không ở trạng thái chờ không được đọc.
- AC-2: Given một thẻ có đề xuất, When dựng lời nhắc cho từng lần đọc, Then lời nhắc chứa chữ bài gốc đầy đủ (không phải bản cắt 300
  ký tự trên thẻ) trong một khối có ranh giới cố định và tên các ô cần đọc; phần lời nhắc ngoài khối bài KHÔNG chứa giá trị đề xuất,
  model đã đề xuất, hay kết quả của lần đọc kia; mỗi kết quả ghi băm lời nhắc để soát lại.
- AC-3: Given kết quả đọc có trích không có thật trong bài, loại hình ngoài từ vựng, hay số phòng không phải số nguyên, When chấm,
  Then kết quả đó tính là rỗng kèm lý do (`trich-gia`, `ngoai-tu-vung`, `khong-phai-so`).
- AC-4: Given hai kết quả đọc và đề xuất, When tính kết cục, Then đúng một trong `khop` (hai lần đọc bằng nhau và bằng đề xuất),
  `bo_trong`, `lech_hai_lan` (hai giá trị hợp lệ khác nhau, kể cả khi cả hai cùng khác đề xuất), `bac_dong_thuan` (hai lần đọc
  bằng nhau, khác đề xuất), so theo khoá `assertion_value_key`; thêm cờ `lech_tren_the` khi thẻ có ≥ 2 đề xuất giá trị khác nhau
  cho cùng ô, và nhãn phụ `o_da_co` khi tin đã có giá trị bậc `observed` cho ô đó; ca biên là mọi kết cục khác `khop` cộng mọi đề
  xuất mang cờ `lech_tren_the`. Lời gọi lỗi không sinh kết cục (không tính là `bo_trong`).
- AC-5: Given DB trước lượt, When chạy lượt chấm bóng ở chế độ thử và chế độ áp (kể cả lượt dừng giữa chừng hay lỗi model), Then
  mọi bảng trừ `ai_calls` (gồm `sale_offers`, `enrichment_proposals`, `review_queue`, `field_assertions`) sau lượt bằng trước lượt
  từng dòng; ở chế độ thử cả `ai_calls` cũng không đổi; mọi đọc DB chạy trong giao dịch chỉ đọc.
- AC-6: Given một lượt chấm bóng, When mỗi lời gọi model kết thúc (thành công hay lỗi), Then có đúng một dòng sổ gọi theo khuôn
  `ai_calls` (việc `cham-bong-bo-sung-tin`, model có tiền tố đường, token vào/ra, độ trễ, ok/lỗi, `trace` mang mã lượt); chế độ thử
  ghi sổ vào tệp, chế độ áp ghi vào bảng `ai_calls`.
- AC-7: Given lượt đã chạy (trọn, có lời gọi lỗi, hay dừng vì trần), When chạy lại với cùng chữ bài, tập ô, model và phiên bản lời
  nhắc, Then chỉ những cặp thẻ × model chưa có kết quả thành công được gọi lại; cặp đã thành công không gọi lại, không sinh dòng kết
  quả mới và không sinh dòng sổ gọi mới; đổi phiên bản lời nhắc thì đọc lại tất cả.
- AC-8: Given trần chi phí của lượt, When lời gọi kế tiếp làm tổng chi phí (tính từ token thật và bảng giá token của model) vượt trần, Then lượt
  dừng trước lời gọi đó, ghi số thẻ đã chấm, số còn lại và tổng chi phí; thẻ được chấm theo thứ tự ô ưu tiên cao nhất mà thẻ có đề
  xuất: số WC, phòng ngủ, toà, đường, loại hình.
- AC-9: Given tệp kết quả, When chạy lệnh báo cáo, Then in bảng ô × kết cục × nguồn (E1, E2) với số ca biên, số `o_da_co`, số đề
  xuất chưa có đủ hai kết quả vì lời gọi lỗi hay chưa chạy (cột riêng), số thẻ có đủ hai kết quả trên số thẻ chờ còn đề xuất lúc chạy,
  số lời gọi, token và chi phí; in lại được từ tệp mà không gọi model; tổng các ô bằng số đề xuất chờ.
- AC-10: Given 232 thẻ đang chờ không còn đề xuất nào nối vào, When chạy lệnh kê, Then in số thẻ theo loại đối chiếu × trạng thái đề
  xuất cùng tin × lượt sinh, tổng bằng số thẻ đếm độc lập bằng câu SQL in kèm, và không thẻ nào đổi trạng thái.

## Coverage

Quét không gian tiêu chí theo chín trục đếm trên DB máy thu (thước: mọi ô của mỗi trục có ít nhất một AC hay một dòng Out of scope):

| Trục | Giá trị (số đếm máy thu 21/11) | AC |
|---|---|---|
| Ô | loại hình 597 · số WC 220 · toà 178 · phòng ngủ 67 · đường 16 | AC-1, AC-4, AC-9 |
| Nguồn đề xuất | E2 model 986 · E1 luật 92 | AC-9 |
| Trạng thái thẻ / đề xuất | chờ + đề xuất chờ 786 thẻ · «Để sau» 4 · chờ không đề xuất 232 | AC-1, AC-10 |
| Kết cục hai lần đọc | khớp · rỗng (thật / trích giả / ngoài từ vựng / không phải số) · lệch nhau · đồng thuận bác | AC-3, AC-4 |
| Mâu thuẫn trên thẻ | 94 thẻ ≥ 2 giá trị một ô | AC-4 |
| Giá trị tin hiện có | trống · inferred · observed (phòng ngủ 59, toà 25, loại hình 4) | AC-4 (`o_da_co`) |
| Nguồn bài | S03 768 thẻ · S05 18 thẻ | AC-1, AC-2 |
| Sự cố lượt | lỗi model · vượt trần · chạy lại | AC-5, AC-6, AC-7, AC-8 |
| Ghi | tin · đề xuất · thẻ · sổ gọi | AC-5, AC-6 |

Ai đọc đầu ra phía sau: NB5 (bảng lô «Bổ sung tin», tách ca biên, mẫu 75 thẻ); Mạnh ở bảng lô; lệnh đếm của hàng NB3 (nấc 2 → 3).

## Đường đo

Ngưỡng của ô cơ hội (lấy từ `bat_khi` của hàng), đo sau lượt áp trên DB máy thu:

- Số thẻ chờ còn đề xuất có đủ hai kết quả đọc (hôm nay 0/786, đích 786/786): dòng «thẻ đủ hai kết quả / thẻ chờ còn đề xuất» của
  lệnh báo cáo (AC-9), đọc từ tệp kết quả của lượt áp (AC-1, AC-7).
- Số ca biên theo ô (hôm nay chưa có, đích một con số mỗi ô): bảng ô × kết cục của lệnh báo cáo (AC-4, AC-9).
- 0 dòng tin, 0 đề xuất đổi trạng thái: băm ba bảng và đếm `field_assertions` trước và sau lượt áp (AC-5).
- Mỗi lời gọi một dòng `ai_calls`: số dòng `viec = 'cham-bong-bo-sung-tin'` của mã lượt bằng số lời gọi trong tệp (AC-6).
- 232 thẻ phân loại theo lý do kèm lệnh đếm: lệnh kê (AC-10).
- Chạy lại cùng đầu vào không sinh kết quả mới: chạy lệnh áp lần hai, đếm lời gọi = 0 (AC-7).

## Out of scope

- Ghi bất cứ gì vào tin, đề xuất hay thẻ: chấp thuận, bác, đóng thẻ, áp đề xuất (NB5 và người).
- Bảng lô và đường chấp thuận lô ở `/ops/review` (NB5).
- Ca biên B3 (giá trị toà chưa có trong danh bạ) và B4 (nối, tách nút danh bạ): cần bộ khớp danh bạ, để NB5 hay hàng sau.
- Đóng, giữ hay chuyển 232 thẻ không còn đề xuất: chỉ kê.
- Bảng mới trong DB cho kết quả bóng (theo Hỏi-3: tệp ở máy thu; NB5 nạp vào DB bằng migration của nó).
- Thẻ cài lỗi, hệ số bắt lỗi của người duyệt (NB7), xuất xứ nhãn (NB2).

## Known limits

## Notes
