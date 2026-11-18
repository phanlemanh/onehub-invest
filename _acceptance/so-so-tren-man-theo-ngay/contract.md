---
schema_version: 1
feature: Người vận hành mở /ops/data-flow và thấy mỗi con số mốc của S03 — có dự án, gắn toà, có hạng cấp dự án, có hạng cấp toà — theo từng ngày, kèm mức đổi so với hôm trước
slug: so-so-tren-man-theo-ngay
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [db, pipeline, ui]
status: draft
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-18-so-so-tren-man-theo-ngay-design.md
---

# Acceptance Contract: so-so-tren-man-theo-ngay

## Context

Hàng SM1 (`docs/plan/lo-trinh.json`), thước đầu-cuối của các mốc MS1–MS3. Cổng Đáng: Mạnh «build» 18/11. Hàng ghi một dòng mỗi ngày VN vào
`dq_check_results` (`check_name = s03-moc-ngay`) trong chính lượt làm tươi `600_data_flow.sql`, chở 30 ngày gần nhất trong `facts` và vẽ
vùng «Số mốc S03 theo ngày» trên `/ops/data-flow`. Không thêm migration.

## Criteria

- AC-1: Given DB của riêng lượt, When chạy lượt làm tươi thật, Then có đúng một dòng `dq_check_results` với `check_name = s03-moc-ngay`,
  `entity = S03`, `status = pass`, `detail` là JSON đúng sáu khoá (`ngay` và năm số); bảng chung của `/ops/quality` không hiện dòng này,
  `dqCheckName` trả nhãn tiếng Việt; nhánh không thêm tệp nào dưới `db/migrations/`.
- AC-2: Given ma trận tin viết trước, mỗi ô một tin (S03 có một dự án; S03 không dự án; S05 và S06 có dự án; hạng `du_an`, `phan_khu`,
  `toa` có điểm; hạng `du_an` không điểm; hạng `phuong` có điểm; tin S03 đã nghỉ có hạng), When chạy lượt làm tươi thật, Then
  `offers_total`, `project_linked`, `project_ranked`, `building_ranked` bằng số viết trước của từng ô và `building_linked = 0`. Ba đột
  biến đỏ, thông điệp nêu tên cột: bỏ lọc nguồn, chỉ đếm `cap = 'du_an'`, đếm cả hạng không điểm.
- AC-3: Given đã làm tươi một lần ở ngày D, When dữ liệu đổi rồi làm tươi lại cùng ngày, Then vẫn một dòng cho D, số là số mới; When làm tươi ở ngày D+1, Then có hai dòng và dòng D không đổi. Đột biến lỗi sau bước ghi làm cả
  dòng số mốc lẫn `data_flow_snapshot` giữ nguyên số cũ (một giao dịch).
- AC-4: Given sau một lượt làm tươi, When đọc dòng hôm nay và khối `facts` của cả ba cửa sổ, Then `project_linked` bằng `located` và
  `offers_total` bằng `offers` của S03 ở cửa sổ `all`; phần tử cuối của `facts.milestones` bằng đúng dòng hôm nay;
  chuỗi tăng dần theo ngày, tối đa 30 phần tử dù đã có 35 ngày.
- AC-5: Given `dq_check_results` có dòng của kiểm khác cùng ngày và dòng `s03-moc-ngay` của ngày khác, When làm tươi, Then các dòng đó
  giữ nguyên `id` và nội dung; When hai lượt làm tươi chạy đồng thời, Then ngày hôm nay vẫn đúng một dòng. Đột biến bỏ điều kiện ngày
  ở bước xoá và đột biến bỏ khoá advisory đều đỏ.
- AC-6: Given khối `dataFlow` do `push-ops-facts` thật dựng từ DB có số mốc, When app ở chế độ cloud đọc, Then `milestones` tới màn
  nguyên giá trị; khối cũ không có khoá này đọc thành mảng rỗng, không lỗi; bộ soát tầng A của lượt đẩy không báo chặn.
- AC-7: Given ma trận chuỗi ngày viết trước, When tính ô số mốc, Then một assert mỗi ca: tăng, giảm, không đổi; thiếu đúng ngày hôm
  trước thì ghi «Chưa có số hôm trước»; ba ngày đã chốt bằng nhau thì đánh dấu đứng yên; hai ngày đã chốt bằng nhau thì không; hôm nay
  bằng hôm qua mà các ngày chốt có đổi thì không; ngày trống giữa chuỗi thì không; số 0 đứng yên theo câu trả lời Hỏi-1 ở Cổng Phạm vi.
- AC-8: Given các `DataFlow` viết trước (không dòng, một ngày, đủ ngày, có ô đứng yên, khối thiếu khoá), When dựng vùng số mốc, Then thấy
  đúng chữ của từng trạng thái trong bảng trạng thái của thiết kế, bốn nhãn lấy từ `CONTEXT.md`, phần trăm trên tin đang rao, và bảng ẩn
  mang số từng ngày cho trình đọc màn hình.
- AC-9: Given bản chép DB máy thu, When làm tươi hai lần và đếm độc lập bằng SQL riêng, Then đúng một dòng hôm nay, bốn số
  lệch 0 so với đếm độc lập, `project_linked` khớp ô Định vị của S03, lượt có ghi số mốc chậm hơn lượt không ghi tối đa 2 giây; ghi
  kết quả vào `.acceptance-runs/so-so-tren-man-theo-ngay/do-may-thu.md`.
- AC-10: Given app chạy trên DB thử của AC-9 ở cổng 3462, When mở `/ops/data-flow`, Then vùng số mốc hiện bốn ô với số khớp dòng hôm nay
  trong DB và khớp ô Định vị của màn chặng; đọc được ở sáng, tối và khổ điện thoại, không tràn ngang.

## Coverage

Trục đếm từ DB máy thu 18/11, bảng phủ ca ở thiết kế §6.

- Trục nguồn: S03 · S05 · S06 — AC-2.
- Trục trạng thái tin: đang rao · đã nghỉ — AC-2.
- Trục mốc: có dự án · không dự án · gắn toà rỗng · cấp hạng `du_an`, `phan_khu`, `toa`, `phuong`, không cấp · có điểm, không điểm — AC-2, AC-9.
- Trục thời gian: lượt đầu · chạy lại cùng ngày · ngày kế · ngày trống · quá 30 ngày — AC-3, AC-4, AC-7.
- Trục môi trường: hai lượt đồng thời · lỗi giữa giao dịch · dòng của kiểm khác · máy thu · cloud khối mới · cloud khối cũ — AC-3, AC-5, AC-6.
- Trục trạng thái màn: trống · một ngày · đủ · đứng yên · sáng, tối, hẹp — AC-8, AC-10.
- Ô loại có lý do: S05, S06 (thước của đợt đếm trên S03); số các ngày trước khi có bảng (không dựng lại được).

## Đường đo

- Ngưỡng «mỗi lượt đêm ghi một dòng, chạy lại không nhân dòng»: đếm dòng `s03-moc-ngay` theo `detail.ngay` trên DB máy thu — AC-3, AC-9.
- Ngưỡng «số khớp màn chặng cùng thời điểm»: so dòng hôm nay với khối `facts` cùng `computed_at` — AC-4, AC-10.
- Ngưỡng «số đứng yên hai ngày liền thì ô được đánh dấu»: hàm tính ô — AC-7, AC-8.

## Out of scope

- Dựng lại số của các ngày trước khi có bảng.
- Số mốc của S05, S06 và lọc theo nguồn hay theo dự án.
- Viết bước gắn toà hay chấm hạng cấp toà: hai số này là 0 tới khi các hàng PL20, CG đó xong.
- Thêm bảng hay cột trên cloud.
- Cảnh báo chủ động khi số đứng yên (chỉ đánh dấu trên màn).

## Notes

Không có migration nên không có bước áp: lượt làm tươi kế sau khi PR gộp vào `main` tự ghi dòng đầu tiên. Sau đó chạy ON12-AC-5 trên DB
máy thu theo luật đợt 30/10.

Ảnh xem màn chụp trên DB thử `oneinvest_u2_sm1`: số của các ngày trước hôm dựng DB là số chèn tay để thấy đường và cờ đứng yên, không phải
số đo. Bằng chứng số thật là phép đo trên bản chép DB máy thu (AC-9), không phải ảnh.
