# S03 — «<số> năm/nữ» không phải dấu hiệu phòng ngủ «<số>n» (s03-cho-vay-khong-phai-bds)

Ngày: 2026-10-31 · Hạng T2 · Làn U1 · Hàng giám sát mở sau khi Mạnh ký RM1 (s03-nhan-loai-tin-rong) kèm lỗi AC-5.

## Vấn đề

Cửa vào của bộ suy loại tin S03 (`suyLoai` trong `pipeline/transform-zalo.mjs`) đòi bài có giá **và** dấu hiệu BĐS
(`DAU_HIEU_BDS`). Nhánh viết tắt phòng ngủ `\d+\s*n\s*\+?\s*\d?\b` kết thúc bằng `\b` — trong JS `\b` chỉ hiểu chữ ASCII,
nên chữ có dấu ngay sau «n» (ă, ữ, é…) bị coi là ngoài từ và ranh giới vẫn khớp. Kết quả: «1 năm», «3 nữ», «5 nét» đều là
«dấu hiệu BĐS»; bài «Cho vay 500tr thời hạn 1 năm» thành tin thuê (đơn vị giá triệu) và đi vào `sale_offers`.

Tìm thấy ở lượt chấm 2 của RM1 (review-findings «Trong hợp đồng», AC-5), Mạnh ký RM1 kèm lỗi này; giám sát mở hàng sửa.

## Cách sửa

- Chỉ đổi đuôi `\b` của nhánh viết tắt `<số>n[+<số>]` thành lookahead âm `(?![a-zà-ỹđ])` — cùng cách `CO_TY` đã làm
  cho chữ «tỷ». Chữ có dấu sau «n» (năm, nữ, nét, nằm…) không còn khớp. Nhánh `pn|phòng ngủ|wc|vs` GIỮ NGUYÊN `\b`:
  đổi nhánh ấy sẽ nới rộng (bài có «phòng ngủ» trần thành dấu hiệu BĐS) — ngoài việc của hàng này (gap-probe P1).
- Viết tắt hợp lệ vẫn khớp nhờ quay lui: «2n1wc» khớp «2n» (sau là chữ số «1»), «1n1k» khớp «1n», «3n2vs», «2n+1»,
  «2n» cuối câu.
- Không đổi thứ tự quyết của RM1, không đổi `parsePost`, không đổi DB.

## Đo

- Ma trận viết tay: các ô «<số> + chữ có dấu bắt đầu n» (năm, nữ, nét) có giá → không thành tin (nguồn `bo`); ô
  «Cho vay 500tr thời hạn 1 năm» → rỗng; các ô viết tắt («2n1wc», «1n1k», «3n2vs», «2n+1», «Căn 2n 14tr») → vẫn là dấu
  hiệu BĐS và vẫn nhận loại như cũ.
- Mỗi ô so với bản chép giữ `\b` (bản cũ): ô AC-1 cũ khớp, mới không khớp (đối chứng dương từng ô); ô AC-2 hai bản
  bằng nhau («2n1wc», «1n1k», «3n2vs», «2n+1», «Căn 2n 14tr», «căn 2n, giá 14tr», «giá 14tr căn 2n», «1nk giá 3 tỷ»).
- Chiều đỏ: bản chép đặt lại `\b` → ô «Cho vay … 1 năm» đỏ; bản đột biến lookahead dương `(?=[\d+\s])` → ô «căn 2n, giá
  14tr» đỏ; cả hai thông điệp ghim.
- Hồi quy: bộ RM1 (`transform-zalo-loai-tin.test.mjs`) và `pipeline npm test` xanh nguyên.

## Ngoài phạm vi

- Mẫu Yêu cầu «khách thiện chí xem nhà» (Ngoài-4 của RM1, Known limits) — việc riêng.
- Lớp model KC1 thay luật.
