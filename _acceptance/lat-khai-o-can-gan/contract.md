---
schema_version: 1
feature: Người gắn nhãn mở một lát có khai danh sách ô cần gắn thì chỉ thấy và chỉ phải điền các ô đó; lát không khai thì màn y như hiện nay
slug: lat-khai-o-can-gan
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, api]
status: draft
design_doc: docs/superpowers/specs/2026-11-18-lat-khai-o-can-gan-design.md
---

# Acceptance Contract: lat-khai-o-can-gan

## Context

Hàng phụ của đợt, gốc P4-213, phục vụ PL20. Lát `hai-khu-ghep-b` chỉ cần ô `building` và `subzone`, trong khi màn đòi đủ 24 ô mỗi bài. Đề bài ước khoảng 3 phút một bài,
tức khoảng 16 giờ 30 phút cho 330 bài. Lát chưa nạp lên DB máy thu nên mọi phép đo dùng lát giả trên DB thử. Không sửa `app/src/app/api/v1/ops/labels/route.ts`. Thiết kế: `design_doc`.

## Criteria

- AC-1: Given lát `hai-khu-ghep-b`, When mở biểu mẫu, Then chỉ có hai ô Toà và «Phân khu hoặc cụm», mỗi ô có lựa chọn «Không suy ra được», không có ô căn cứ, không có ô Lý do, và bộ đếm ghi trên 2 ô.
- AC-2 (cross-layer): Given bốn tổ hợp (có cả hai ô, chỉ toà, chỉ phân khu, không ô nào), When lưu, Then mỗi bài có đúng hai dòng nhãn `building`, `subzone`; ô không nêu ghi `not_stated = true`, giá trị theo `chuanChu`, `basis` rỗng, không có dòng của ô khác.
- AC-3 (cross-layer): Given lượt ghi thiếu hay để trống một trong hai ô, When gửi tới máy chủ, Then trả 400 nêu đúng ô và không ghi dòng nào.
- AC-4 (cross-layer): Given hằng căn cứ tạm của biểu mẫu, When ghi, Then hằng này không trùng căn cứ thật nào, không dòng nào trong DB mang giá trị đó, và lát không khai ô gửi hằng này thì bị từ chối 400.
- AC-5 (cross-layer): Given lát có khai ô, When lưu xong hoặc mở đường dẫn `?xem=<bài>` với bài đã lưu, bài chưa lưu, bài không tồn tại, Then người gắn ở màn gắn của bài kế, trang và dữ liệu gửi xuống trình duyệt không có nháp máy hay bất kỳ giá trị máy đọc nào.
- AC-6: Given bộ chọn nhóm của lát có khai ô, When hiện danh sách, Then các nhóm mang tên trung tính «Phần 1», «Phần 2», «Phần 3»; chữ bài, ảnh, tên nhóm của chính bài đang gắn vẫn hiện.
- AC-7 (cross-layer): Given bài đã lưu đủ hai dòng, When đọc tiến độ, tin kế và bảng đồng thuận, Then bài tính là đã gắn, không quay lại hàng chờ, và bảng đồng thuận chỉ có hai ô của lát.
- AC-8: Given bốn lát đang có (`hai-khu-ghep`, `s03-theo-nhom`, `s03-cuon-chieu` 24 ô; `s03-thu-nhom` 9 ô), When gắn nhãn, Then hành vi không đổi: đủ ô như hiện nay, kiểm căn cứ như hiện nay, các test đã ký xanh mà không sửa ca nào.
- AC-9 (cross-layer): Given lát có khai ô trên bản chạy, When để trống một ô, đang lưu, mất kết nối, hết bài, Then có lỗi ngay dưới ô, nút «Đang lưu…», nút «Thử lại» giữ nguyên chữ đã gõ, trạng thái hết bài; gửi cùng một lượt hai lần vẫn chỉ có hai dòng nhãn; màn đọc được ở sáng, tối, khổ 390 px.
- AC-10 (judgment): Given 5 bài rút ngẫu nhiên có hạt giống từ tập bài thật của lát, When người gắn bấm giờ từ lúc bài hiện tới lúc bài kế hiện, Then `evidence/do-thoi-gian.md` ghi hạt giống, mã bài, số ký tự, số ảnh, số giây từng bài, và trung bình không quá 45 giây.

## Coverage

Đếm trên DB máy thu 18/11. Lát `hai-khu-ghep-b` chưa nạp.

| Trục | Giá trị | Ai đọc đầu ra | AC |
|---|---|---|---|
| Lát | có khai ô: `hai-khu-ghep-b` · không khai: `hai-khu-ghep` 375 bài, `s03-theo-nhom` 366, `s03-cuon-chieu` 180, `s03-thu-nhom` 30 | Biểu mẫu, bộ kiểm | AC-1, AC-8 |
| Tổ hợp ô | cả hai · chỉ toà · chỉ phân khu · không ô nào · thiếu ô | Lệnh chấm của PL20 | AC-2, AC-3 |
| Căn cứ | hằng tạm ở lát có khai · hằng tạm ở lát không khai · căn cứ thật | Bộ kiểm, DB | AC-4, AC-8 |
| Đầu ra máy | nháp · lượt hai · đường dẫn `?xem=` · tên nhóm | Người gắn | AC-5, AC-6 |
| Trạng thái | trống · lỗi ô · đang lưu · mất kết nối · hết bài | Người gắn | AC-9 |

## Đường đo

- Thời gian gắn một bài: người gắn bấm giờ 5 bài rút từ tập bài thật, ghi vào `evidence/do-thoi-gian.md` (AC-10). Mốc so: khoảng 3 phút một bài. Tổng giờ cho 330 bài tính bằng trung bình đo được nhân 330.

## Out of scope

- Sửa `app/src/app/api/v1/ops/labels/route.ts` và thêm cột DB khai ô theo lát.
- Nạp lát `hai-khu-ghep-b` lên DB máy thu: việc của PL20.
- Rút gọn các lát đang có.
