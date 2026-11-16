---
schema_version: 1
feature: Phân khu và toà S09 của Ocean Park 1 và Grand Park vào danh bạ không sinh toà trùng, nên tên toà bài S03 nêu mà danh bạ chỉ có từ S08 khớp được
slug: toa-s09-hai-khu-vao-danh-ba
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, data]
status: signed-off
approved_by: Mạnh
approved_at: 2026-11-13
design_doc: docs/superpowers/specs/2026-11-13-toa-s09-hai-khu-vao-danh-ba-design.md
---

# Acceptance Contract: toa-s09-hai-khu-vao-danh-ba

## Context

Danh bạ toà của OP1 và GP chỉ từ mã căn S08 (18 và 46 tên). Số đo 13/11: bản tay S09 có 115 toà OP1, 61 bản ghi GP (60
toà), 13 và 7 phân khu; 12 và 34 toà trùng S08; bài S03 gắn được toà OP1 5.663 → 8.295, GP 3.772 → 5.689 (ước). Nguồn
là bản thu khuôn API (Mạnh chốt 13/11 thu định kỳ đường này); hai bản Mạnh mở tay (khuôn trang) là đối chứng số. Bên
đọc không dùng `item.meta`/`notes` (bản 13/11 có ghi chú meta bị sửa). Mọi lời gọi tới S09 đóng băng.

## Criteria

- AC-1: Given DB thử áp 001…097, When nạp item S09 khuôn API (fixture tổng hợp viết trước: `danh-muc`, một `du-an` có toà đủ, toà
  không phân khu, hai bản ghi cùng tên, một item thiếu `sourceId`, một `kind` lạ, một `du-an` có `chiTiet.meta.code` khác
  200, một `du-an` có `meta.duAnId` khác `chiTiet.data.id`) bằng `dongItemS09` + `CAU_CHEN_S09_ITEM`
  hai lần, Then lần một ghi đúng số dòng hợp lệ, lần hai ghi 0; item hỏng bị bỏ và đếm theo lý do; `project_id` lấy từ `chiTiet.data.id`, không từ `meta`; `v_s09_toa` ra đúng
  mỗi bản ghi toà (toà không phân khu có `sector_id` rỗng, không rơi) và `v_s09_phan_khu` ra đúng mỗi phân khu.
- AC-2: Given ma trận viết trước cho `toaS09` (hai bản ghi cùng tên chuẩn hoá cùng phân khu · cùng tên, một bản không
  phân khu, không ngày bàn giao (dạng `OS2`) · cùng tên khác phân khu · tên khác cách viết «S1.01»/«s1 01»), When gộp,
  Then mỗi ô ra đúng: gộp thành một toà giữ cả hai `block_id`, phân khu và ngày bàn giao lấy từ bản đủ; khác phân khu →
  ca mơ hồ, không gộp (một assert mỗi ô).
- AC-3: Given DB thử có danh bạ S08 tổng hợp của một khu (toà khớp đúng một, toà không khớp, tên khớp hai toà ở hai phân
  khu) và item S09 đã nạp, When dựng danh bạ, Then toà khớp đúng một nhận bí danh `ma_nguon` S09 và `ten`, không đúc toà;
  toà không khớp xử theo Hỏi-3 — lối khuyến nghị: đúc với `catalog_tier = 'mot_loi_khai'` và UPI (lối khác: không đúc, mỗi toà một thẻ `review_queue` `entity_match`, chiều đỏ là đột biến đúc thẳng); tên khớp hai toà không ghi toà nào và có đúng một
  thẻ `review_queue` `entity_match` nêu hai khoá toà; 0 toà có hai UPI, 0 `block_id` S09 làm bí danh hai toà.
- AC-4: Given cùng DB thử, When dựng, Then mỗi phân khu S09 thành đúng một nút `subzone` con của khu (phân khu trùng tên
  nút đã có thì dùng lại nút đó, đếm 0 nút mới); toà mới từ S09 được tạo với nút vùng là phân khu (hay cụm) của nó; toà S09
  không phân khu nằm ở cấp khu; toà S08 đã có giữ nguyên nút vùng (bảng toà chỉ thêm, 082) và view `v_toa_nut_vung` (097)
  trả phân khu (hay cụm) S09 của nó qua bí danh mã nguồn S09 — mọi toà nối S09 có đúng một dòng ở view, toà không nối S09
  trả nút vùng gốc.
- AC-5: Given DB thử đã dựng, When dựng lại lần hai và lần ba, Then 0 khoá toà, nút, bí danh, thẻ mới; tập
  `(building_key, upi)` và nút vùng của mọi toà giống hệt lần một (so băm).
- AC-6 (cross-layer): Given bản chép DB máy thu sang DB thử (DB riêng cho lượt, xoá khi xong) và bản thu khuôn API 13/11
  nạp qua `dongItemS09`, When dựng hai khu, Then `v_s09_toa` hai khu ra 115 và 61 bản ghi, 91 và 59 ngày bàn giao,
  `v_s09_phan_khu` 13 và 7 — bằng số đếm trực tiếp trên hai bản Mạnh mở tay (đối chứng, đọc tệp riêng, không qua hàm của
  hàng); danh bạ: OP1 đúng 115 toà nối S09, GP đúng 60 (61 bản ghi; theo lối khuyến nghị của Hỏi-2, Hỏi-3), 13 và 7 nút phân khu, 12 và 34 toà S08 nhận bí danh, 0 toà
  hai UPI; in bảng trước/sau.
- AC-7 (cross-layer): Given cùng DB thử, When đếm độc lập bằng thước viết trước trong script đo (không gọi hàm dựng: tên
  chuẩn hoá của phát biểu `block_raw`/`unit_number` trên bài S03 căn hộ nhóm một khu so với bí danh `ten` của toà khu đó),
  Then in số bài gắn được toà trước và sau dựng mỗi khu, và số bài chỉ nêu phân khu hay cụm phân giải được về một nút
  vùng trước và sau; số sau lớn hơn số trước ở cả hai khu; số trước bằng số đếm trên DB trước lượt (đối chứng thước).
- AC-8: Given bước dựng S09, When chạy trên DB không có `stg_s09_item` (chưa áp 097) hay không có dòng S09 cho một khu,
  Then bước S09 bỏ qua có in lý do, bước S08 chạy như cũ (danh bạ giống bản trước hàng, so băm), lệnh thoát 0.
- AC-9: Given diff của hàng so với main, When quét, Then tệp đổi nằm trong vùng hàng; `collector/`, `snapshots/`,
  `pipeline/sync-cloud.mjs`, `app/` không đổi; không dòng thêm nào chứa tên nguồn hay tên miền thật (danh sách tên đọc từ
  DB máy thu không rỗng — rỗng thì thoát 2); 097 có header, idempotent (áp hai lần không lỗi).

- AC-10 (chỉ khi Hỏi-1 chọn «trong hàng này»): Given ma trận viết trước (tiền tố `S10` có từ hai toà cùng phân khu · một
  toà lẻ `GH1` không cùng tiền tố · cùng tiền tố ở hai phân khu khác nhau · toà không dấu chấm), When dựng, Then đúng một
  nút cụm `subzone` con của phân khu cho ô đầu, 0 nút cho ba ô còn lại (một assert mỗi ô), toà `S10.0x` có nút vùng là
  cụm; dựng lại 0 nút mới. Hỏi-1 chọn «hàng sau» → AC này bị bỏ có tên và vế ngưỡng cấp cụm ghi giới hạn.

## Coverage

- Trục nạp: hợp lệ · thiếu `sourceId` · `kind` lạ · chi tiết không đọc được · `meta` lệch payload · nạp lại (AC-1).
- Trục gộp toà: cùng tên cùng phân khu · cùng tên khác phân khu · cách viết khác · thiếu trường (AC-2).
- Trục khớp danh bạ: khớp một · không khớp · khớp hai (AC-3).
- Trục phân khu: mới · trùng nút có · toà không phân khu · toà S08 giữ nút vùng, view phân khu (AC-4); cụm theo Hỏi-1 (AC-10).
- Trục tất định: chạy lại hai, ba lần (AC-5).
- Trục dữ liệu thật: bản thu API trên bản chép máy thu, đối chứng hai bản tay, số kỳ vọng 115 · 61 · 91 · 59 · 13 · 7 · 60 · 12 · 34 (AC-6).
- Trục giá trị cho người dùng: số bài S03 gắn được toà trước/sau, thước độc lập (AC-7).
- Trục an toàn: chưa áp 097 · thiếu dòng một khu (AC-8); ranh giới, tầng A, idempotent (AC-9).

## Đường đo

- «Hai khu có đủ toà của snapshot S09 (115 và 61)»: AC-6 (và AC-1, AC-2 cho 61 bản ghi → 60 toà).
- «0 toà có hai UPI»: AC-3, AC-6.
- «Toà khớp toà S08 thành bí danh, không khớp thì lên thẻ»: AC-3.
- «Grand Park có cấp phân khu để bài ghi phân khu thay toà phân giải được»: AC-4 (phân khu S09), AC-7 (bài nêu phân khu/cụm phân giải được), AC-10 (cấp cụm, theo Hỏi-1).
- «Dựng lại hai lần không đổi khoá»: AC-5.
- «Số bài S03 hai khu gắn được toà trước, sau khớp đếm độc lập»: AC-7.

## Out of scope

- Bộ nạp `pipeline/import-s09*`, đường thu định kỳ và đưa hợp đồng khuôn API vào DATA-CONTRACT (DAZ1, làn thu).
- Ngày bàn giao, loại cao/thấp tầng, chủ đầu tư vào danh bạ (DA16).
- Toà S09 của dự án khác ngoài hai khu (DA10).
- Trục, căn từ S09 (`inventory`).
- Áp 097 vào máy thu và lượt dựng thật (sau gộp, lời Mạnh).
- Gán dự án cho nhóm S03 (DV6), toà dự án khác lẫn nhóm (H1–H3, M1–M3 của OP1).

## Notes

- Ba câu cho Mạnh ở Cổng Phạm vi — Hỏi-1 (cấp cụm), Hỏi-2 (dãy thấp tầng), Hỏi-3 (toà mới đúc thẳng hay qua thẻ). AC-6, AC-3
  viết theo lối khuyến nghị; Mạnh chọn lối khác ở Hỏi-2 hay Hỏi-3 thì máy viết lại AC, eval và mở lại thẻ Cổng Phạm vi
  trước khi code.
- Nháp hợp đồng dữ liệu S09 khuôn API: `s09-data-contract-api-nhap.md` trong hồ sơ (LL chuyển làn thu).
- Known limits — chọn ở Cổng Bằng chứng 2026-11-14:
  - Ngoài-2: Một số toà có tên viết có khoảng trắng giữa hai số có thể được xếp vào phân khu thay vì cụm toà trong cách xem vùng, dù lúc tạo toà lại xếp vào cụm.
  - Ngoài-3: Muốn thêm khu thứ ba hoặc sửa nối sai giữa dự án nguồn và khu thì phải sửa mã rồi gộp lại, không chỉnh được bằng dữ liệu.
  - Ngoài-4: Nếu bản thu S09 có thời điểm thu hay nội dung sai dạng thì cả lượt nạp có thể lỗi thay vì chỉ bỏ dòng hỏng đó.
  - Ngoài-5: Với toà có nhiều mã nguồn S09 viết khác nhau, vùng hiển thị của toà có thể lúc là cụm lúc là phân khu giữa các lần xem.
  - Ngoài-6: Bộ kiểm tra tên nguồn thật có thể im lặng nếu chính nó hỏng, nên một tên nguồn lọt vào thay đổi có thể không bị báo.
  - Ngoài-7: Nếu có toà S09 ghi tên kiểu có khoảng trắng giữa hai số, danh bạ có thể xếp toà đó vào phân khu thay vì cụm. Dữ liệu 13/11 chưa có toà nào như vậy nên hiện chưa sai số nào.
  - Ngoài-8: Trên máy thu, bảng S09 mới sẽ được áp sau hai thay đổi có số lớn hơn, khác thứ tự trên DB dựng mới. Hai phần này độc lập nên khả năng gây lỗi rất thấp.
  - Ngoài-9: Với toà có nhiều cách viết tên, danh bạ có thể báo toà thuộc phân khu thay vì cụm và kết quả có thể đổi giữa các lần chạy. Hiện dữ liệu thật chưa có toà nào như vậy.
  - Ngoài-10: Phép kiểm không phát hiện được trường hợp một toà bị tạo thành hai dòng riêng, nên kết quả an toàn có thể xanh dù có toà trùng.
  - Ngoài-11: Phép đo trên dữ liệu thật báo không có toà hai mã định danh nhưng không thể phát hiện việc cùng một toà bị đúc thành hai bản.
  - Ngoài-12: Lần kiểm ranh giới theo cấu hình không tự chứng minh rằng nó bắt được tệp nằm ngoài vùng cho phép, nên kết quả xanh chưa chắc đáng tin hoàn toàn.
