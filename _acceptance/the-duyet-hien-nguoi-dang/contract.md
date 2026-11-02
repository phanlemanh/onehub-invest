---
schema_version: 1
feature: Người duyệt thấy người đăng của mỗi tin trên thẻ ghép căn (tên, SĐT, số tin đang rao) và nhận ra ngay khi hai tin cùng một người
slug: the-duyet-hien-nguoi-dang
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: signed-off
approved_by: Mạnh
approved_at: 2026-11-02
design_doc: docs/superpowers/specs/2026-11-02-the-duyet-hien-nguoi-dang-design.md
---

# Acceptance Contract: the-duyet-hien-nguoi-dang

## Context

Hàng HD7 (dãy U2), từ audit hàng duyệt 30/10 (H14, H17). Thẻ ghép căn không có người đăng; đo 02/11 trên máy thu, 4/7 thẻ chờ có Tin B của một
tài khoản 2.872 tin đang rao. Người đăng chỉ để hiện: không vào `evidence`, không vào luật `judge-entity`, không đổi route decide.

## Criteria

- AC-1: Given thẻ ghép căn có hai tin sống và cả hai tin có người trong danh bạ, When người duyệt mở thẻ, Then bảng so có đúng một hàng «Người đăng» đứng đầu, mỗi ô hiện tên, SĐT («Chưa có SĐT» khi không có) và căn cứ của vai; mười hàng cũ giữ nguyên thứ tự, giá trị và nhãn So. (cross-layer)
- AC-2: Given một người có vai sống trên ba tin mà một tin đã rời kho (`retired_at` có giá trị) và một vai khác đã rút, When đọc số tin, Then số là 2: chỉ đếm tin khác nhau còn sống, vai còn sống. (cross-layer)
- AC-3: Given ma trận viết trước gồm chung người, chung SĐT khác người cùng nguồn, chung SĐT khác người khác nguồn, cùng nguồn khác người, cùng nguồn một bên chỉ có SĐT, khác nguồn không chung gì, một bên rời kho, một bên không định danh, hai tin nhiều người có một người chung, When tính nhãn So của hàng qua `loadReviewContext` và thẻ thật, Then lần lượt ra Khớp «Cùng người trong danh bạ», Không so được «Cùng SĐT <số>», Không so được «Cùng SĐT <số>», Lệch, Thiếu, Không so được, Thiếu, Thiếu, Khớp kèm tên người chung. (cross-layer)
- AC-4: Given thẻ khác nguồn nhãn Không so được, When chữ cuối của tên người neo Tin B xuất hiện nguyên từ, đúng dấu và chữ đầu viết hoa trong toàn văn Tin A, Then ô So hiện «Tên gọi «X» có trong văn bản Tin A»; tên gọi một ký tự, tên chỉ là một phần của từ khác, từ thường khác dấu («mình») hay viết thường («an ninh»), Tin A không có toàn văn, hay nhãn khác Không so được thì không hiện cờ. (cross-layer)
- AC-5: Given người nhiều tin nhất của một tin có 10 tin đang rao trở lên, When mở thẻ, Then ô bên đó hiện Badge «Đăng n tin» (số ngăn nghìn của người ấy); người neo từ 10 tin thì Badge thay chữ phụ, người neo dưới 10 thì vẫn hiện «m tin đang rao» của người neo; cao nhất 9 tin thì không Badge; áp cho cả Tin A và Tin B.
- AC-6: Given tin có nhiều người gửi, When mở thẻ, Then ô hiện người có bí danh `tai_khoan_nguon` bằng `seller_ref` của tin (S06 bỏ tiền tố `ct:`), kèm «+n người khác»; không người nào khớp `seller_ref` thì hiện người có `party_key` nhỏ nhất; thứ tự vai trong DB không đổi kết quả. (cross-layer)
- AC-7: Given tin không có người trong danh bạ, hoặc bên đã rời kho, hoặc thẻ dựng không có ngữ cảnh người, When mở thẻ, Then lần lượt: ô hiện tên và SĐT trên tin kèm «Chưa có trong danh bạ»; ô «—» và So là Thiếu; không có hàng Người đăng. Nút quyết vẫn chỉ phụ thuộc lý do và tin rời kho; sau khi mở thẻ, `evidence` và mọi bảng không đổi; bộ test PL3, HD6 và viewer xanh không sửa ca nào. (cross-layer)
- AC-8: Given DB máy thu thật (chỉ SELECT), When dựng hàng Người đăng cho mọi thẻ `entity_match` đang chờ và các cặp dựng từ tin sống S05 × S06 của tài khoản lớn nhất, qua `loadReviewContext` thật, Then không cặp S05 ↔ S06 nào ra Lệch, tập cặp có Badge bằng đúng tập cặp theo một truy vấn đếm độc lập và số trên Badge bằng số đếm, ít nhất một cặp có Badge từ 1.000 tin trở lên, và in số cặp theo từng nhãn, số cờ tên gọi, thời gian truy vấn; không có cặp S05 ↔ S06 nào thì đỏ «không đủ mẫu»; người duyệt thấy đúng hàng ấy trên màn thật ở khổ rộng và 375px. (cross-layer)

## Coverage

Quét tay theo bốn trục.

| Trục | Giá trị | AC |
|---|---|---|
| Quan hệ hai tin | chung người · chung SĐT cùng/khác nguồn · cùng nguồn khác người · khác nguồn · thiếu một bên | AC-3, AC-4 |
| Số người trên tin | không · một · nhiều, có/không khớp `seller_ref` | AC-1, AC-6, AC-7 |
| Số tin của người | dưới ngưỡng · đúng ngưỡng · hàng nghìn · tin rời kho · vai đã rút | AC-2, AC-5, AC-8 |
| Nơi đọc | hàm thuần · DB tạm · thẻ jsdom · DB máy thu · màn thật | AC-1, AC-7, AC-8 |

## Đường đo

| Ngưỡng (opportunity.md) | Đo bằng |
|---|---|
| Thẻ S05 ↔ S06 không bao giờ hiện «Lệch» ở hàng Người đăng | AC-3 (ma trận), AC-8 (DB máy thu) |
| Thẻ có Tin B của tài khoản rao hơn nghìn tin hiện badge | AC-5, AC-8 (DB máy thu, màn thật) |

## Out of scope

- Ghi người đăng vào `evidence` và gom cặp cùng Tin A — hàng P3 `judge-evidence-du-truong`.
- Đưa người đăng vào luật `judge-entity` hay Stage B: người đăng chỉ để hiện.
- Gộp người khi thấy cùng SĐT: thẻ Gộp Người của HD17 làm việc đó.
- Đọc tên liên hệ ghi trong văn bản thành phát biểu (audit §3b.3).
- Sửa cách đếm tin của `/ops/people`; đổi thẻ bổ sung tin (`agent_output`); nhánh viewer và cloud của `/ops/review`.
- Sau khi duyệt, sheet tự sang thẻ kế — HD8 `the-duyet-tu-sang-the-ke`.

## Notes

- Ở 375px cột So cuộn ngang trong bảng (38px) vì Badge «Không so được» dài hơn nhãn khác; khổ rộng không bị.
- Cờ tên gọi có dương giả đã biết trên chữ viết hoa trùng tên («hướng Nam», «Hồ Chí Minh»); cờ chỉ là gợi ý, không vào nhãn So.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-02:
  - Ngoài-3: Bộ đọc thẻ duyệt nới kiểu dòng kết quả truy vấn, nên bước kiểm kiểu lỏng hơn ở một chỗ; người duyệt không thấy gì khác.
