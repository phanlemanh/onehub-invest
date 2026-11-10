---
schema_version: 1
feature: DO1 giữ dấu ngày lập mốc (đổi thang, lập mốc đầu) suốt cả ngày qua mọi lượt cloud-sync, ngày ấy không có dòng chuyển bậc, lệnh sửa ngày đổi thang đã qua, thước TB-AC-11 chạy được sau khi máy thu áp 087
slug: do1-giu-dau-doi-thang
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [pipeline]
status: implemented
design_doc: docs/superpowers/specs/2026-11-10-do1-giu-dau-doi-thang-design.md
approved_by: Mạnh
approved_at: 2026-11-09T23:42:15Z
---

# Acceptance Contract: do1-giu-dau-doi-thang

## Context

Mục Ngoài-4 của `thang-bac-moi-b0-b5` (Mạnh chọn «mở hợp đồng mới» ở Cổng 2 ngày 10/11): DO1 chạy mỗi 15 phút trong
cloud-sync; lượt hai của ngày đổi thang xoá dấu `doi-thang` và ghi dòng chuyển bậc cho chính ngày ấy, nên `/ops/quality`
mất câu «lần hạ một lần» và hiện một phần bảng chuyển bậc. Giám sát gộp thêm Ngoài-5 (N1-53): thước TB-AC-11 đỏ vĩnh viễn từ
khi máy thu áp 087. Máy thu 10/11: 087 đã áp, `data_level_unit` còn 76.124 dòng thang-2310, `data_level_change` ngày 10/11 đã
có 1.364 dòng do code cũ ghi.

## Criteria

- AC-1: Given DB thử có 087, `data_level_unit` còn dòng `thang-2310` và ảnh chụp `thang-0811` ngày D, When DO1 `--write` chạy
  ngày D, rồi một tin đổi bậc, rồi DO1 `--write` chạy lần hai cùng ngày D, Then sau lần hai dòng `do1-chuyen-bac` của D vẫn là
  `skip` với `ly_do: doi-thang`, `thang: {ma: thang-0811, tu_ngay: D}` và `don_vi` của lần hai; `data_level_change` ngày D có
  0 dòng; `data_level_unit` mang bậc lần hai.
- AC-2: Given ngày D đã lập mốc đổi thang qua hai lượt như AC-1, When một tin đổi bậc và DO1 chạy ngày D+1, Then ngày D+1 có
  đúng dòng chuyển của tin ấy so với trạng thái cuối ngày D, dòng DO1 D+1 là `pass` mang `thang`.
- AC-3: Given `data_level_unit` rỗng (lập mốc lần đầu), kể cả khi ảnh chụp `thang-0811` nhỏ nhất là chính ngày ấy, When DO1
  chạy hai lượt cùng ngày có một tin đổi bậc ở giữa, Then cả hai lượt ghi `skip` `ly_do: lap-moc` (không thành `doi-thang`),
  0 dòng `data_level_change` ngày ấy.
- AC-4: Given ngày D bằng ngày áp thang nhưng không còn dấu (bảng đơn vị đã toàn thang mới, dòng DO1 của D là `pass` không
  dấu — như máy thu nhận bản sửa trễ trong ngày), When DO1 chạy ngày D có một tin đổi bậc, Then ghi lại `skip` `doi-thang`
  kèm `thang`, không thêm dòng `data_level_change` nào cho D (dòng có sẵn của D xử theo AC-5); ngày khác ngày áp mà không dấu
  thì so như thường.
- AC-5: Given ngày lập mốc D đã có sẵn dòng `data_level_change` (ghi bởi code cũ hay lượt trước bản sửa), When DO1 chạy ngày
  D, Then theo câu trả lời Hỏi-1 — mặc định khuyến nghị «xoá»: mọi dòng của D bị xoá; nhánh «giữ»: còn đúng các dòng có sẵn,
  không thêm dòng mới — và ở cả hai nhánh, dòng các ngày khác giữ nguyên từng dòng.
- AC-6: (cross-layer) Given DO1 thật `--write` chạy hai lượt cùng ngày đổi thang có một tin đổi bậc ở giữa, When `loadDo1` của
  app đọc và khối «Đo hằng ngày» dựng, Then khối vẫn có dòng thang (`data-do1-thang`) với «Thang bậc 08/11», «lần hạ một lần»
  và ngày áp.
- AC-7: Given DB của lượt chép từ máy thu đã áp 087, When chạy TB-AC-11, Then thước dựng lược đồ chưa áp 087 trong giao dịch —
  bỏ mọi hàm 087 tạo mà không migration trước nào tạo, và mọi cột 087 thêm, tập đối tượng suy từ tệp migration — cùng một dòng
  DO1 đời trước, kiểm như cũ (bản ghi ⊆ B0/B1, không dòng thang) và xanh; câu truy vấn bản ghi của app bị đột biến gọi một hàm
  của 087 thì lỗi 42883; DB không có 087 vẫn chạy như cũ.
- AC-8: Given ngày áp thang D đã qua, `data_level_change` ngày D có dòng và dòng DO1 ngày D không còn dấu, When chạy
  `do-hang-ngay.mjs --sua-ngay-doi-thang` không cờ rồi có `--write`, Then không cờ: in ngày D và số dòng sẽ xoá, DB không đổi;
  có `--write`: dòng DO1 ngày D là `skip` `doi-thang` kèm `thang`, dòng `data_level_change` ngày D xử theo Hỏi-2 (mặc định
  khuyến nghị «xoá»: 0 dòng; nhánh «giữ»: còn nguyên), các ngày khác và `data_level_unit` giữ nguyên; đã có dấu `doi-thang` ở
  một ngày khác D thì lệnh từ chối và in hai ngày; DB chưa áp 087 hay chưa có ảnh chụp thang mới thì in một dòng có tên, không
  ghi.

## Coverage

Trục (morphological-scan, preset test-matrix — thực thể «một lượt DO1 trong ngày»; design doc §2). Ma trận viết trước
Bảng đơn vị × Ngày áp × Dấu của ngày → nhãn kỳ vọng (design doc §2 bảng 1): rỗng × (= D | khác D | không có) × không dấu →
`lap-moc` (AC-3); thang cũ × mọi ngày áp × không dấu → `doi-thang` (AC-1); thang mới × = D × không dấu → `doi-thang` (AC-4);
thang mới × khác D × không dấu → so thường (AC-2, AC-4); mọi bảng × mọi ngày áp × có dấu `lap-moc`/`doi-thang` → giữ dấu ấy
(AC-1, AC-3).
- Lượt trong ngày: lượt đầu · lượt sau có tin đổi bậc ở giữa → AC-1, AC-3, AC-4, AC-6.
- Dòng chuyển có sẵn của ngày lập mốc: có · không; Hỏi-1, Hỏi-2: xoá · giữ → AC-1, AC-5, AC-8.
- Bề mặt: dòng DO1 (`dq_check_results`) · `data_level_change` · `data_level_unit` · khối DO1 `/ops/quality` · lệnh sửa · thước
  TB-AC-11 → AC-1 … AC-8.
- Lược đồ: có 087 · chưa có 087 → AC-7, AC-8.
Thước CE: hiện trạng máy thu 10/11 ở design doc §1 (76.124 đơn vị thang-2310, 1.364 dòng chuyển ngày 10/11, chưa có ảnh chụp
thang-0811 lúc 06:19).

## Out of scope

- OOS-1: Tạm bỏ hay bật lại bước `do-hang-ngay` trong `scripts/cloud-sync.sh` (T3, vận hành máy thu) — giám sát và Mạnh
  quyết theo N1-54; hàng này không sửa `cloud-sync.sh`.
- OOS-2: Chạy `--sua-ngay-doi-thang --write` trên DB máy thu — lời riêng của Mạnh sau gộp, kèm pg_dump; vòng này chỉ chạy trên
  DB thử.
- OOS-3: Bảy mục Known limits khác của `thang-bac-moi-b0-b5` (Ngoài-1 … 3, 6 … 11) — không mở lại ở đây.

## Notes

- Ngày lập mốc nhận theo dấu trước, ngày áp sau; ngày áp là ngày nhỏ nhất có ảnh chụp thang mới, cùng định nghĩa AC-5 của
  `thang-bac-moi-b0-b5`.
