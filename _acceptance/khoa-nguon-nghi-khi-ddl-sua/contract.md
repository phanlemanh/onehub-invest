---
schema_version: 1
feature: khoaNguon của lược đồ riêng (test DB song song) nghỉ 100 ms mỗi lần bị chặn — kể cả khi đã tới lượt 33033 mà bảng vẫn bị một khoá DDL ngoài 33033 giữ — thay vì quay rỗng tới hết lượt thử rồi ném 55P03
slug: khoa-nguon-nghi-khi-ddl-sua
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
veto_state: mo
veto_opened_at: 2026-11-09T09:00:00Z
design_doc: docs/superpowers/specs/2026-11-09-khoa-nguon-nghi-khi-ddl-sua-design.md
approved_by:
approved_at:
---

# Acceptance Contract: khoa-nguon-nghi-khi-ddl-sua

## Context

Mạnh chọn «mở hợp đồng mới» cho Ngoài-1 và Ngoài-3 khi ký `so-ghep-s06-nhan-danh-ba` (sổ `d-20261103T062845Z-34` và
`-36`, 03/11). Hai mục cùng một lỗi của `pipeline/lib/luoc-do-rieng.mjs`: `khoaNguon` chỉ nghỉ 100 ms khi CHƯA tới lượt
khoá 33033. Khi đã lấy được 33033 mà `LOCK … NOWAIT` vẫn bị một khoá DDL không đi qua 33033 chặn, nó lấy lại 33033 ngay
(khoá rảnh) và quay rỗng tới hết `toiDa`, rồi ném 55P03. Ngoài-4 cùng hồ sơ (ghi Known limits) là ca test cho đúng nhánh
ấy, đi cùng việc sửa này. Giám sát đợt duyệt hàng ở P4-160 (09/11). Thư viện chỉ có bộ thử dùng — mười tệp test của
pipeline và app liệt ở AC-5 (kể cả test của chính thư viện) — không mã sản xuất nào.

## Criteria

- **AC-1** — Given một phiên giữ ACCESS EXCLUSIVE trên `public.field_assertions` mà KHÔNG giữ khoá tư vấn 33033, nhả sau
  1,5 giây, When một phiên khác gọi `khoaNguon(c, ["sale_offer_records", "field_assertions"], { toiDa: 40 })` (bảng bị
  chặn đứng sau), Then lời gọi trả về (không ném) sau khi kẻ chặn nhả, số lần thử lại nằm trong khoảng nhịp nghỉ 100 ms
  (từ 5 tới 25), và sau đó phiên không giữ 33033 mà giữ ACCESS SHARE trên cả hai bảng nguồn.
- **AC-2** — Given kẻ chặn ngoài 33033 giữ suốt, When gọi `khoaNguon` với `toiDa: 5`, Then lời gọi ném 55P03 sau ít nhất
  450 ms (đã nghỉ ở mỗi lần thử), giao dịch của phiên còn chạy được câu lệnh, và phiên không giữ 33033.
- **AC-3** — Given kẻ chặn ngoài 33033 giữ 1 giây, When `khoaNguon` đang chờ và một phiên thứ ba lấy mẫu `pg_locks` mỗi
  20 ms trong khoảng từ lúc gọi tới lúc trả về (ít nhất 30 mẫu), Then nhiều nhất 50% số mẫu thấy phiên gọi giữ 33033 —
  lúc nghỉ không cầm 33033, nên ca nạp DDL xếp hàng 33033 không bị chặn thêm (mã đúng cầm 33033 chỉ trong vài câu lệnh
  mỗi vòng ~100 ms; bản nghỉ khi còn giữ cầm gần trọn vòng). Tỉ lệ đo được in ra.
- **AC-4** — Given bản chép tạm của thư viện mang một trong bốn đột biến — «mã cũ» (chỉ nghỉ khi chưa tới lượt), «nghỉ
  khi còn giữ 33033», «quên nhả 33033 khi vào được», «thử lại mọi mã lỗi» —, When chạy các ca `KN-` của bản test chép tạm
  trỏ vào bản đột biến, Then mỗi bản đỏ với thông điệp ghim của đúng ca nó phá (bảng ở evals E4); bản thật xanh; tệp thật
  không đổi; và danh sách tệp test import thư viện bằng đúng danh sách của AC-5.
- **AC-5** — Given bộ thử có sẵn dùng thư viện (`luoc-do-rieng`, `so-ghep-s06`, `bait-gap-sellers`, `gan-sdt-s06`,
  `importer-schema-v5`, `kiem-do-sau-070`, `deals-phi-ly` của pipeline; `deals-phi-ly`, `dq-moi-nhat`,
  `can-gia-tot-biet-can` của app — gồm ca «LDR chuỗi ca DDL giữ khoá liền nhau»), When chạy trên mã đã sửa, Then mọi ca
  vẫn xanh.
- **AC-6** — Given bảng nguồn không tồn tại, When gọi `khoaNguon(c, ["bang_khong_co_kn"], { toiDa: 3 })`, Then lời gọi ném
  ngay lỗi mang code 42P01 (không thử lại, không nghỉ: dưới 250 ms) và giao dịch còn chạy được câu lệnh.

## Coverage

Bỏ quét hình thái bằng dòng sổ descope «bỏ coverage-scan — …» (căn cứ: hàm có ba nhánh kết cục, kê tay đủ). Trục tự kê
để người soát:

| Trục | Giá trị | AC |
|---|---|---|
| Kẻ chặn | DDL đi qua 33033 (chuỗi ca nạp) · DDL ngoài 33033 (33033 rảnh) · `lock_timeout` cắt lúc xếp hàng | AC-5 (ca LDR cũ) · AC-1, AC-2, AC-3 · ngoài phạm vi (Ngoài-6, ca LDR cũ vẫn chạy ở AC-5) |
| Mã lỗi | 55P03 (thử lại) · lỗi khác (ném ngay) | AC-1, AC-2 · AC-6 |
| Số bảng nguồn | một bảng · nhiều bảng, bảng bị chặn đứng sau | AC-2, AC-3 · AC-1 |
| Kết cục | vào được sau khi kẻ chặn nhả · hết lượt thử | AC-1 · AC-2 |
| Khoá 33033 | sau khi vào · sau khi hết lượt · trong lúc nghỉ | AC-1 · AC-2 · AC-3 |
| Chiều đỏ | mã cũ · nghỉ khi còn giữ · quên nhả · thử lại mọi lỗi | AC-4 |
| Hồi quy | bộ thử có sẵn dùng thư viện | AC-5 |

## Out of scope

- Ngoài-5 của so-ghep-s06-nhan-danh-ba (ca chuỗi ca DDL chỉ có một mắt, chưa dựng lại chuỗi nhiều mắt) — đã ghi Known
  limits, không thuộc nhánh lỗi này.
- Ngoài-6 cùng hồ sơ (ca «xếp hàng bị lock_timeout cắt» bỏ giá trị trả về) — đã ghi Known limits.
- Đổi `toiDa` mặc định (3000), đổi khoá 33033 hay cách các bộ thử nạp migration.
- Dùng thư viện ở mã sản xuất — thư viện chỉ cho bộ thử.
- Thước E4 của hồ sơ đã ký `app-test-chiu-song-song` (`probes/song-song.mjs lib`) đòi `ℹ pass 3` trên tệp test này. Thước đã
  lệch từ khi so-ghep-s06-nhan-danh-ba thêm hai ca (tệp có 5 ca trước hàng này); hàng này thêm ca nữa. Không sửa thước của
  hồ sơ đã ký trong hàng này — đã báo giám sát (P4-161).

## Notes

- Không migration, không route, không đổi chữ ký hàm hay giá trị trả về của `khoaNguon`.
- Mỗi vòng thử bị chặn nay có ít nhất 100 ms nghỉ, nên trần chờ mặc định là khoảng 5 phút (3000 × 100 ms) thay vì vài giây
  quay rỗng.
- Thời gian thêm của ca chuỗi DDL qua 33033 không có thước riêng: AC-5 chỉ chứng các bộ thử vẫn xanh.
