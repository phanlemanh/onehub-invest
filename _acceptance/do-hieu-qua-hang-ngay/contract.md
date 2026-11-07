---
schema_version: 1
feature: Đo hiệu quả hằng ngày — mẫu soát cuốn chiếu 20 bài, tỉ lệ giữ nháp theo cách đọc × ô, ước bỏ sót, tín hiệu không cần nhãn, dòng chuyển bậc; lát phường/xã, dự án, toà; xem trên /ops/quality
slug: do-hieu-qua-hang-ngay
owner: phanlemanh@gmail.com
risk_tier: T3      # lộ trình ghi T2; máy nâng T3 vì cần migration (db/migrations/** thuộc t3_paths)
surfaces: [ui, db, script]
status: signed-off
design_doc: docs/superpowers/specs/2026-11-07-do-hieu-qua-hang-ngay-design.md
approved_by: Mạnh
approved_at: 2026-11-07
lo_trinh_ma: DO1
duyet_lai: 2026-11-07   # Mạnh «Đồng ý tất cả theo khuyến nghị» — gộp gói rà soát (trước/sau, chênh có ý nghĩa, đổi khoá, tỉ lệ soát, nguyên tắc đo, thị trường, hai ô chưa gắn, dự án theo chữ bài)
---

# Acceptance Contract: do-hieu-qua-hang-ngay

## Context

Hàng DO1 (`docs/plan/lo-trinh.json`). Mạnh 07/11: «Đo lường là quan trọng» · «Có thể nhìn trên từng phường/xã, dự án, từng
toà». Q2 của `docs/architecture/mo-hinh-pipeline-mot-can-nha.md` bản 4 (Mạnh duyệt 07/11) thu hẹp hàng đo còn mẫu soát cuốn
chiếu + dòng chuyển bậc + tín hiệu không cần nhãn. Bảng mục tiêu Mạnh duyệt 07/11: D3 (tín hiệu ≤ 1%, đỏ > 2%), D4 (giữ nháp
≥ 90% ô nhóm A, so tuần với tuần), F4 (bỏ sót ≤ 10%), NS3 (biến động bậc có lý do). Thiết kế: `design_doc`.

## Criteria

- **AC-1** — Given bài S03 nhận trong ngày D (giờ VN) ở `stg_zalo_posts`, When chạy `pipeline/mau-soat-cuon-chieu.mjs --ngay D`,
  Then `eval_label_items` lát `s03-cuon-chieu` có đúng min(20, số bài khác nội dung không phải bài thử) thẻ của ngày D, chọn
  tất định theo ngày, gồm cả bài máy không nhận là tin rao; bài trong mẫu chưa có kết quả đọc gộp được gọi đọc gộp đúng một lần
  TRƯỚC khi chụp nháp, dừng gọi khi chi trong ngày chạm trần (mặc định 0,05 USD); mỗi thẻ mang `draft` chụp nháp của mọi cách
  đọc theo khuôn `{trang_thai: co | khong-tin | vang, o}` (khoá `cach_doc` ổn định, đổi model hay prompt là khoá mới) và tên cách
  đọc hiện (`bo-doc-luat` khi bài không có đọc gộp); chạy lại cùng ngày thêm 0 dòng và 0 lời gọi model.
- **AC-2** (cross-layer) — Given một thẻ lát `s03-cuon-chieu` có `draft`, When người mở `/ops/labels` lát đó, Then biểu mẫu
  điền sẵn mọi ô theo nháp của cách đọc hiện, kèm huy hiệu «Nháp máy · <cách đọc>»; ô bảng chọn model giao người để trống;
  người lưu thì `eval_labels` ghi giá trị người chốt và `draft` không đổi.
- **AC-3** — Given thẻ mẫu soát đã gắn nhãn trong hai tuần ISO liền nhau, When chạy `pipeline/do-hang-ngay.mjs --write`, Then
  `dq_check_results` có dòng `do1-giu-nhap` mà `detail` cho từng (cách đọc × ô): nhóm ô A/B/C theo F3, n, số giữ, tỉ lệ, khoảng
  Wilson 95% của tuần này và tuần trước, chênh, cờ `co_y_nghia` (đúng khi hai khoảng không chồng nhau) và ngưỡng phát hiện được;
  «giữ» với ô số dùng dung sai (giá ±1%, diện tích ±1 m²), ô chữ so sau chuẩn hoá; kèm cơ cấu mẫu (bán/thuê × loại nhà) của hai
  tuần, tỉ lệ soát (thẻ đã soát / thẻ đã rút, cờ khi < 70%) và mã phiên bản thước; tỉ lệ ô người sửa = 1 − giữ của cách đọc hiện;
  một khoá cách đọc mới hiện thành dòng riêng.
- **AC-4** — Given thẻ mẫu soát người gắn ý định «Tin rao», When chạy `do-hang-ngay.mjs --write`, Then dòng `do1-bo-sot` cho
  từng cách đọc theo tuần, đọc từ `draft` đã chụp (không đọc lại `sale_offers`): n tin rao người xác nhận có nháp của cách đọc
  đó, số nháp `khong-tin`, tỉ lệ ước bỏ sót, khoảng Wilson 95%, chênh và cờ `co_y_nghia` so tuần trước; thẻ thiếu nháp (`vang`)
  đếm riêng, không vào bỏ sót.
- **AC-5** — Given dòng `silver_labels` ghi trong ngày D, When chạy `do-hang-ngay.mjs --write`, Then dòng `do1-tin-hieu`
  cho từng cách đọc LLM: tỉ lệ JSON hỏng (lượt mà mọi lời gọi hỏng vẫn ra số), tỉ lệ câu trích không có trong bài, độ phủ
  từng ô với ô trả sai khuôn đếm riêng, và tỉ lệ bất đồng theo ô giữa từng cặp cách đọc trên cùng bài; cách đọc không có
  dòng nào trong ngày D ghi `status = 'skip'`, không ghi 0.
- **AC-6** — Given `data_level_unit` giữ bậc lần chạy trước, When chạy `do-hang-ngay.mjs --write` sau khi bậc đổi, Then
  `data_level_change` có đúng một dòng mỗi đơn vị (căn, tin lẻ) đổi bậc với hướng `len`/`tut`/`moi`/`mat` và mảng lý do (trường
  lõi đổi đủ↔thiếu, `gan-can`, `tin-nghi`, `do-luong`, `doi-khoa` khi tin rời căn này sang căn khác), `data_level_unit` khớp bậc
  hiện tại của hai hàm SQL 056, dòng `do1-chuyen-bac` đếm theo nguồn × hướng × lý do và tách riêng cặp «mất + mới» do đổi khoá;
  đơn vị không đổi bậc không sinh dòng; lần chạy đầu chỉ lập mốc (`skip`, 0 dòng chuyển).
- **AC-7** — Given số của AC-3..AC-6, When `detail` được ghi, Then mỗi nhóm số có phân rã theo thị trường, phường/xã, dự án, toà;
  mỗi chiều dưới thị trường có hai ô chưa gắn tách nhau — `khong-tin-hieu` (bài không nêu chỗ) và `chua-co-danh-ba` (bài nêu tên mà
  danh bạ chưa có vật thể) — tối đa 30 ô lớn nhất + `khac`; tổng các ô của mỗi chiều bằng tổng chung; số giữ nháp và bỏ sót
  trên mẫu soát có thêm chiều `du_an_theo_chu` (tên dự án đọc từ bài, nhãn «theo chữ bài, chưa qua danh bạ»).
- **AC-8** (cross-layer) — Given dòng `do1-*` trong `dq_check_results`, When người vận hành mở `/ops/quality` (máy thu hay
  cloud), Then khối «Đo hằng ngày» hiện bảng giữ nháp tuần này/tuần trước theo cách đọc × ô (dấu «chênh có ý nghĩa», ngưỡng
  phát hiện, nhóm ô), tỉ lệ soát kèm cảnh báo, bỏ sót, tín hiệu, chuyển bậc (đổi khoá tách riêng), so cặp trước/sau; chọn lát
  Tổng · Thị trường · Phường/xã · Dự án · Toà; có trạng thái tải, trống kèm lệnh, lập mốc, lỗi kèm «Thử lại»; bảng «Kiểm chất
  lượng» chung không lặp dòng `do1-*`.
- **AC-9** — Given mọi dòng `do1-*` ghi ra, When kiểm `detail`, Then không chứa chữ bài, câu trích, tên hay số người đăng,
  `labeler_id`, tên nguồn thật (`source_registry.real_name`, tên miền) — chỉ số, tỉ lệ, mã S0x, khoá cách đọc, mã khu vực, khoá
  vật thể, tên dự án đã có trong danh bạ hoặc nhãn; `data_level_unit`, `data_level_change`, `eval_label_items.draft` không vào
  FILL của `sync-cloud.mjs`.
- **AC-10** — Given một khoá cách đọc mới (model hay prompt khác) và thẻ mẫu soát đã gắn nhãn trong 4 tuần gần nhất, When chạy
  `pipeline/so-sanh-cach-doc.mjs --cu <khoá> --moi <khoá> --tuan 4 --tran-usd 0.30`, Then cách đọc mới được chạy trên đúng các
  bài ấy (bài đã có kết quả của khoá mới không gọi lại, dừng ở trần), và dòng `do1-so-sanh` cho từng ô: n cặp cùng bài, giữ của
  khoá cũ, giữ của khoá mới, chênh cặp kèm khoảng tin cậy 95% và cờ `co_y_nghia`; `do-hang-ngay` ghi `skip` «chưa so cặp» cho
  khoá mới chưa có dòng so sánh.

## Coverage

Bỏ quét hình thái bằng dòng sổ descope «bỏ coverage-scan — …» (spec ngoài đã chốt phạm vi: câu giao hàng DO1 + §3.2 tài liệu
mô hình bản 4). Trục tự kê để người soát:

| Trục | Giá trị | AC |
|---|---|---|
| Đầu ra | giữ nháp · bỏ sót · tín hiệu (JSON hỏng, trích lạc, phủ ô, bất đồng, ô người sửa) · chuyển bậc | AC-3, AC-4, AC-5, AC-6 |
| Lát | tổng · thị trường · phường/xã · dự án · dự án theo chữ bài · toà · `khong-tin-hieu` · `chua-co-danh-ba` · `khac` | AC-7 |
| Cách đọc | bộ đọc luật · đọc gộp (model × prompt) · đọc chữ · so cặp trước/sau | AC-1, AC-3, AC-5, AC-10 |
| Nguyên tắc đo | đơn vị + mẫu số · dung sai ô số · nhóm A/B/C · phiên bản thước · cơ cấu mẫu · chênh có ý nghĩa · tỉ lệ soát | AC-3, AC-4, AC-10 |
| Ngày | có số · không lượt đọc (skip) · lần đầu (lập mốc) · mẫu chưa gắn nhãn | AC-5, AC-6, AC-8 |
| Mặt | pipeline ghi · màn soát · `/ops/quality` máy thu · cloud | AC-1, AC-2, AC-8 |
| Rò rỉ | chữ bài · trích · người đăng · labeler · tên nguồn thật | AC-9 |

[CE chưa kiểm chứng] Trục «Mặt cloud» chỉ chứng bằng `dq_check_results` có trong FILL; không chụp trang cloud thật ở vòng này.

## Đường đo

Không có `opportunity.md` (Cổng Đáng gom về giám sát). Ngưỡng của bảng mục tiêu 07/11 đọc từ:
- D3 tín hiệu ≤ 1% / đỏ > 2% → `do1-tin-hieu` (AC-5).
- D4 giữ nháp ≥ 90% ô nhóm A → `do1-giu-nhap` (AC-3).
- F4 bỏ sót ≤ 10% → `do1-bo-sot` (AC-4).
- NS3 biến động bậc có lý do → `do1-chuyen-bac` (AC-6).
Chấm đạt/đỏ theo đích là việc của `scripts/bao-cao-ngay.mjs`, không phải hàng này. Nguyên tắc đo (đơn vị, mẫu số, dung sai,
nhóm ô, phiên bản thước, cơ cấu, chênh có ý nghĩa, tỉ lệ soát) ghi ở FRAMING §5 trong vòng này — một chỗ theo ROADMAP §0.

## Out of scope

- Chi phí lên bậc (PL31), độ tươi p50/p95 (PL22), lý do rơi từng chặng (DF3).
- Tập test mù đóng băng và cổng tự áp (PL21; Q3 hoãn) — tỉ lệ giữ nháp không dùng để mở cổng.
- Đo gắn căn, tách/gộp nhầm (DO2); đo làm giàu (DO3); GNH2.
- Bật đọc gộp chạy toàn S03 hằng ngày.
- Chấm đạt/đỏ theo đích (báo cáo ngày làm).
- Lấy mẫu phân tầng theo khu trọng tâm có trọng số — hoãn sau 2 tuần số thật; giám sát ghi vào lộ trình (Mạnh 07/11 «Phần chưa làm»).

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-11-08:
  - Ngoài-1: Bộ chặn rò chưa bắt số điện thoại hay mã người gắn nhãn nếu chúng nằm trong một nhãn máy dạng ghép; hiện chưa đường ghi nào đưa chúng vào.
  - Ngoài-2: Bài tự soát nhãn máy chưa có ca đối chứng chứng tỏ nó biết báo đỏ, nên lưới an toàn ở nhánh này yếu hơn.
  - Ngoài-3: Ca thử tên «Khắc» không kiểm được ô «Khác» vì dữ liệu thử không có ô ấy.
  - Ngoài-4: Chưa có ca thử nào cho nhánh chặn số điện thoại trên nhãn máy.
