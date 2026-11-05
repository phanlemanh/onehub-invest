---
slug: khu-trung-anh-tin
at: 2026-11-05T09:44:19Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ về xoá dòng trùng ghi `kho_dao` false, câu giá «chạy lại transform là có lại» sai sau gộp, hợp đồng không nêu số dòng xoá và chuyện lan lên cloud | Mạnh tưởng đảo được miễn phí nên ký; lượt đêm đầu tự xoá khoảng 8.500 dòng | Đổi `kho_dao` true, sửa câu giá, nêu số dòng, cách lùi, phạm vi lan | fixed: dòng sổ mới `kho_dao` true, câu giá nói phải hoàn PR rồi chạy lại; hợp đồng nêu số dòng và cách lùi. Đã đọc mã: `media` nằm trong danh sách không sync của `sync-cloud.mjs` dòng 462–463, nên không lan; AC-6 đo cả lượt đầu. Trình Mạnh ở Hỏi-1 (human-gate1) |
| P1 | contract | Lời hứa cho người gắn nhãn chưa xảy ra trong vòng này: hôm nay 0/28.220 bài trùng trong bài, trùng giữa các bài nằm ở nhánh chưa gộp | Mạnh ký vì tưởng nhóm gắn nhãn hết thấy ảnh đăng lại; E9 xanh mà màn thật không đổi | Sửa câu feature; ghi một dòng sổ; ca ma trận ở nhánh kia | fixed: câu feature và AC-8 nói rõ chỉ chuẩn bị khoá, có dòng sổ. Ca `danhSachAnhCum` hai bài cùng băm: giám sát đã báo GC đổi khoá, ca đo thuộc hồ sơ nhánh đó |
| P1 | evals | E6 chỉ có đối chứng cho mất băm, mẫu số không ghim, bộ lọc chỉ ở design; E8 đọc dòng trong bộ nhớ, không qua DB; Given của AC-7 không dựng được | Nối `media` với `stg` lỗi làm tập so rỗng, mọi số lệch bằng 0, E6 vẫn exit 0 | In và assert mẫu số; mỗi điều kiện thoát một đối chứng; E8 qua DB thử | fixed: E6 in mẫu số, đòi so được ít nhất 1.700 tin có tệp, bốn đối chứng ghim thông điệp, khai cả AC-4; AC-5 ghi phạm vi lọc; E8 đi qua `runTransformMedia` trên DB thử; Given sửa thành 20 entry, 13 băm. S05 có 0 tệp nên chỉ chạy nhánh URL, đã ghi ở Coverage |
| P1 | contract, evals | Hai thước đã ký (`do-gop-anh`, `buildOfferImages`) đổi trong chính PR đổi hành vi; E4 không có ca đỏ | Thước nới quá tay, PL28 báo khớp giả | Nêu rõ trong hợp đồng; ca đỏ; in hiệu thước cũ và mới | fixed: AC-3, AC-7 nêu thước đổi, có dòng sổ; E4 thêm ca đỏ và in hiệu tập cặp, mọi cặp lệch phải giải thích được bằng trùng băm |
| P1 | contract, evals | AC-1 đòi `media_order` liền nhau nên dòng sau dòng bị xoá dời chỗ; AC-6 và E7 không nói | Dòng trùng ở cuối fixture nên E7 xanh; dữ liệu thật dòng trùng nằm giữa tin | Ma trận dòng trùng ở đầu và giữa; chốt dấu thời gian | fixed: AC-6 chốt dòng dời chỗ đổi thứ tự và dấu thời gian, dòng không dời giữ nguyên; E7 có ma trận; E6 in số dòng đổi thứ tự. Không có ràng buộc duy nhất trên `media_order` (đã đọc chỉ mục) |
