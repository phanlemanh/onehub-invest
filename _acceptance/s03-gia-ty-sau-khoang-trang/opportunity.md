---
schema_version: 1
slug: s03-gia-ty-sau-khoang-trang
feature: Transform S03 giữ giá tỷ chẵn viết bằng đồng khi ngay sau giá là khoảng trắng/xuống dòng rồi tới số 1–2 chữ số («3.000.000.000\n50m2») — bước gạt SĐT đang nuốt cả cụm nên giá ra null
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T03:27:34Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Hàng phát sinh từ Ngoài-3 của `_acceptance/s03-gia-ty-chan-dong` (PR #191 đã gộp 30/10, main `ec899d03`). Vòng ấy dạy
bước gạt SĐT `gatSo` của `pipeline/transform-zalo.mjs` bỏ qua đuôi nhóm nghìn của giá («3.000.000.000»). Nhưng regex SĐT
cho phép một ký tự cách (dấu cách, xuống dòng, gạch) giữa hai chữ số, nên khi ngay sau giá là khoảng trắng rồi một số
1–2 chữ số («3.000.000.000\n50m2», «Bán 2.000.000.000 2PN») nó bắt cả cụm «000.000.000\n50» thành một SĐT 11 số — cụm
không còn là đuôi nhóm nghìn thuần nên bị gạt, giá ra null, và số đứng sau (diện tích, số phòng) cũng mất. Đo 30/10
trên bài thật: 0 bài đang dính, nhưng tin viết kiểu này về sau sẽ mất giá im lặng.

Cổng Đáng: Mạnh chọn «mở hợp đồng mới» cho mục này ở Cổng Bằng chứng s03-gia-ty-chan-dong, câu ký nguyên văn
«/acceptance-gate:signoff s03-gia-ty-chan-dong … Ngoài-3: mở hợp đồng mới; … ký hay trả: ký» (30/10); giám sát đợt
dot0-cam-mau coi đó là quyết build (P1-57, giao P1 30/10).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] giá tỷ chẵn viết bằng đồng theo sau bởi khoảng trắng + số 1–2 chữ số có ra đúng giá (và số đứng sau còn nguyên) mà SĐT thật vẫn bị gạt không?
- Kết quả nào là SỐNG: [đề xuất] mọi dòng ma trận «giá tỷ chẵn + cách + 1–2 chữ số» ra đúng giá; ma trận của s03-gia-ty-chan-dong và N1 vẫn xanh; danh sách SĐT trích từ bài thật không đổi.
- Kết quả nào là CHẾT: [đề xuất] còn dòng thuộc dạng này ra null, hoặc một SĐT lọt vào bước đọc số.
- Timebox: một vòng T2.
