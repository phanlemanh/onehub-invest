---
schema_version: 1
slug: judge-giu-quyet-dinh-nguoi
feature: Chấm lại ghép căn không đổi thẻ người vừa quyết, và so phường theo cùng khoá với thẻ duyệt nên cùng một phường ghi khác kiểu không thành «khác căn»
owner: phanlemanh@gmail.com
stage: decided
decision: build
decided_by: giám sát theo Mạnh ký PL25 Ngoài-6 + Ngoài-8 30/10
decided_at: 2026-10-30T14:07:10Z
prototype:
  base_commit: 14f5851d
  disposition: archive
---

## Vấn đề & ai gặp

Hàng phát sinh từ hai mục ngoài hợp đồng của PL25 (`_acceptance/judge-nguong-la-code/review-findings.md`). Khi ký Cổng
Bằng chứng 30/10, Mạnh chọn «mở hợp đồng mới» cho cả hai và dặn «gom Ngoài-6 và Ngoài-8 thành một hàng sửa».

- **Ngoài-6** — `agent/scripts/judge-run.ts`: lệnh cập nhật thẻ đang chờ không chặn lại `status = 'pending'`. Người
  duyệt bấm quyết đúng lúc máy đang chấm lại cùng thẻ thì gợi ý và lời giải thích của máy bị ghi đè lên thẻ người vừa
  quyết.
- **Ngoài-8** — `agent/src/agents/judge-entity.ts`: `chuanHoaPhuong` bỏ dấu TRƯỚC khi bỏ tiền tố, nên «Phương Liệt»
  mất chữ đầu thành «liet». Nó cũng chưa bỏ «Xã», «Thị trấn», «P.» dính liền. Hệ quả: cùng một phường mà hai tin ghi
  khác kiểu thì luật kết luận cứng «no».

Người gặp: người vận hành duyệt ghép căn ở `/ops/review`. Thực địa DB local 30/10: 2 667 tin bán ghi phường bằng «Xã …».
Thẻ duyệt đã so phường bằng `khoaPhuong` (`app/src/lib/ops/review-can-cu.ts`), nên luật ghép căn đang lệch với chính
nhãn Khớp/Lệch mà người duyệt thấy trên thẻ.

## Giả định chốt sinh tử

| # | Giả định | Nếu sai thì | Phép thử rẻ nhất | Trạng thái |
|---|---|---|---|---|
| 1 | So phường theo đúng khoá của thẻ duyệt không làm hai phường khác nhau thành «cùng phường» | Luật ra «yes» sai | Ma trận cặp tên phường chạy qua cả hai hàm | Chưa thử |
| 2 | Chặn `status = 'pending'` ngay trong câu cập nhật đủ để thẻ người vừa quyết không bị sửa | Thẻ vẫn bị ghi đè | Test đổi trạng thái thẻ giữa lúc chấm | Chưa thử |

## Ngưỡng chết / ngưỡng UAT

Không đo được: đây là việc nội bộ của luồng duyệt và không có người dùng cuối trực tiếp thao tác. Thước là phép đo máy
(xem contract §Đường đo).

## Kết quả prototype

Không dựng prototype — sửa luật và câu SQL, đo bằng test.

## Nguồn ngoài & phạm vi kế thừa

| Món vật liệu | Nguồn (đường dẫn/tên gói) | Phân loại | Kế thừa? | Người ký |
|---|---|---|---|---|
| Khoá tên phường `khoaPhuong` + luật khoá chỉ số | `app/src/lib/ops/review-can-cu.ts` (trong kho) | logic | có | — |

## Cổng 0

- **decision = build** Căn cứ: khi ký PL25 ngày 30/10, Mạnh chọn «Ngoài-6: mở hợp đồng mới; Ngoài-8: mở hợp đồng mới …
  gom Ngoài-6 và Ngoài-8 thành một hàng sửa». Giám sát thêm hàng `judge-giu-quyet-dinh-nguoi` vào dãy P3.
- **disposition = archive** Căn cứ: không có prototype.
- **Ngưỡng UAT chốt cùng lúc ký:** không đo được (việc nội bộ của luồng duyệt).

## Thước đo thành công → ứng viên criterion

- Thẻ người đã quyết giữa lúc chấm không đổi byte nào; bộ đếm không tính thẻ ấy là «cập nhật».
- Kết luận phường của luật trùng nhãn hàng Phường của thẻ duyệt trên mọi cặp tên của ma trận.
