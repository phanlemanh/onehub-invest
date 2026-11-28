---
schema_version: 1
feature: Bản thu đuôi S06 hỏng không còn chặn hàng đợi nạp của vùng — wrapper bỏ qua có ghi dấu, không xoá, không sửa raw
slug: s06-thu-duoi-snapshot-hong-khong-chan
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
design_doc: docs/superpowers/specs/2026-11-28-s06-thu-duoi-snapshot-hong-khong-chan-design.md
approved_by: Mạnh
approved_at: 2026-11-28
---

# Acceptance Contract: s06-thu-duoi-snapshot-hong-khong-chan

## Context

ZC18 (`s06-thu-duoi-lich-va-chon-snapshot`, đã gộp #581) đưa wrapper một vòng `scripts/thu-duoi-s06.sh` vào main. Ở bước
chọn-nạp, mỗi vùng nạp đúng một snapshot: bản mới nhất chưa có trong sổ nạp `airbnb_snapshots`. Mục Ngoài-9 của Cổng Bằng
chứng ZC18 (Mạnh chọn «mở hợp đồng mới» 28/11, GS cấp mã ZC26) chỉ ra: bản thu không nạp được (thiếu manifest, checksum sai,
nguồn khác…) không bao giờ vào sổ nạp, nên bị chọn lại mỗi vòng 5 phút và chặn mọi bản cũ hơn của cùng vùng. Riêng bản khai
nguồn khác thì bộ nạp còn thoát 0 trong im lặng (`readSnapshot` gọi `process.exit(0)`), nên vòng trông như lành.

Hồ sơ này sửa đúng bước chọn-nạp: trước khi trả một bản để nạp, wrapper kiểm nó đọc được bằng chính `readSnapshot` của bộ
nạp. Bản đọc không được thì ghi dấu vào tệp state của wrapper, in một dòng log gọi tên bản ấy, rồi đi tiếp xuống bản cũ hơn
trong CÙNG vòng. Thư mục snapshot không bị xoá, không bị sửa (luật bất biến số 1: raw snapshot bất biến).

Đây là hàng PHÒNG NGỪA: đo trên máy thu 28/11, lịch thu đuôi chưa cài (gốc `state/thu-duoi-s06/` không tồn tại, launchd 0
job), 233 snapshot đuôi hiện có đều đọc được, 0 hỏng — số snapshot tồn đọng bị chặn hôm nay là 0.

## Criteria

- AC-1: Given vùng có một bản LÀNH chưa nạp và một bản HỎNG mới hơn chưa nạp, với mỗi lớp hỏng trong bảy lớp: thiếu
  `manifest.json`, manifest không phải JSON, `source` khác `chotot-ads`, `schemaVersion` bộ nạp chưa hỗ trợ, `finishedAt`
  hỏng, checksum tệp items sai, thiếu tệp items. When một vòng chạy, Then vòng đó nạp ĐÚNG bản lành (một bản cho vùng) và
  không gọi bộ nạp cho bản hỏng. Vùng mà MỌI bản chưa nạp đều hỏng thì vòng không gọi bộ nạp cho vùng ấy lần nào, mỗi bản
  hỏng một dòng log, vòng thoát 1. Phá bước kiểm trên bản chép thì ca checksum đỏ, đo trong lượt chấm.
- AC-2: Given cùng tình huống, When vòng đầu tiên gặp bản hỏng, Then wrapper in ĐÚNG MỘT dòng log cho bản ấy, khớp khuôn
  `bỏ qua snapshot hỏng <id>: <lý do khác rỗng> — không xoá, không sửa`, và vòng ấy thoát 1 để người vận hành thấy.
- AC-3: Given cùng tình huống, When vòng đầu tiên gặp bản hỏng, Then tệp `bo-qua-hong.json` trong gốc state của wrapper có
  khoá là tên thư mục bản hỏng (mang tiền tố vùng `<vùng>__`, nên hai vùng không trùng khoá), `lyDo` khác rỗng và `luc` là
  giờ UTC ISO kết thúc bằng `Z`.
- AC-4: Given bản hỏng đã bị bỏ qua, When so thư mục của nó trước và sau vòng, Then danh sách tệp và sha256 từng tệp y hệt —
  không tệp nào bị xoá, sửa hay thêm.
- AC-5: Given bản hỏng đã có trong tệp đánh dấu, When vòng kế chạy, Then wrapper không chọn lại nó (0 lần nạp nó), không lặp
  dòng log, và vòng thoát 0 khi không còn lỗi nào khác.
- AC-6: Given một bản ĐỌC ĐƯỢC mà bộ nạp thoát khác 0 (lỗi tạm, vd DB đứt), When hai vòng liên tiếp chạy, Then bản ấy KHÔNG bị
  đánh dấu, và vòng sau chọn và thử nạp lại nó — giữ hành vi «nạp lỗi → thoát 1, vòng sau thử lại» của ZC18 AC-6.
- AC-7: Given tệp đánh dấu bị hỏng (không phải JSON), When vòng chạy, Then wrapper không nổ: coi như chưa đánh dấu bản nào,
  kiểm lại, và vẫn nạp đúng bản lành, ghi lại tệp đánh dấu hợp lệ.
- AC-8: Given nhánh so với `origin/main`, When liệt tệp đổi, Then ngoài vật hồ sơ chỉ có `scripts/thu-duoi-s06.sh` (và
  `scripts/thu-duoi-s06.test.mjs` nếu test shim cần đổi); `pipeline/import-chotot.mjs` không đổi; launchd không có job
  `com.oneinvest.thu-duoi-s06`.
- AC-9: Given mã mới, When chạy lại các phép đo của ZC18 (tệp test shim, probe đột biến, probe chọn-nạp trên DB riêng), Then
  tất cả xanh như trên main — ZC26 không làm hỏng lời hứa nào ZC18 đã ký.

## Coverage

Không gian ca là các nhánh của một bước chọn-nạp đã có sẵn trong wrapper, nên liệt theo nhánh mã và theo dữ liệu thật trên máy
thu, không quét ý tưởng (dòng `descope` «bỏ coverage-scan» trong sổ).

- Trục lớp hỏng (đúng các nhánh từ chối của `readSnapshot` + bước đọc items): thiếu manifest · manifest hỏng · source khác ·
  schema lạ · finishedAt hỏng · checksum sai · thiếu tệp items → AC-1, AC-2, AC-3, AC-4, AC-5
- Trục lỗi nạp không do bản thu (bản đọc được, bộ nạp thoát ≠ 0) → AC-6
- Trục vùng: còn bản lành cũ hơn · toàn bản hỏng → AC-1, AC-2, AC-5
- Trục khoá đánh dấu: tên thư mục có tiền tố vùng (hai vùng không trùng) → AC-3
- Trục trạng thái của tệp đánh dấu: vắng · hợp lệ · hỏng → AC-5, AC-7
- Trục bất biến raw: danh sách tệp · nội dung từng tệp → AC-4
- Trục không phá ZC18: test shim · đột biến · chọn-nạp DB → AC-9
- Trục phạm vi: tệp đổi · bộ nạp · lịch → AC-8
- Số đếm trên máy thu 28/11 (đọc, không ghi): 233 snapshot đuôi S06 (231 phép đo 24 giờ, 2 bản thu thử), 233 đọc được, 0
  hỏng; 0/233 trong sổ nạp; gốc sản xuất chưa tồn tại.
- [GIẢ ĐỊNH] Bảy lớp hỏng dựng trên bản chép của snapshot thật, chưa từng gặp tự nhiên trên máy thu (0 bản hỏng thật).
- Ngoài phạm vi, vì: bản đang ghi dở lúc chọn-nạp — gốc state chỉ do bộ thu của chính wrapper ghi, chạy tuần tự TRƯỚC bước
  chọn trong cùng khoá `<gốc>.lock`, và bộ thu ghi `manifest.json` sau cùng; lúc chọn, thư mục thiếu manifest chỉ có thể là
  bản bị ngắt giữa chừng, không bao giờ hoàn tất (gap-probe P1, xử lý trong `gap-probe.md`).

## Đường đo

Miễn số trên màn. Không có `opportunity.md`: hàng do GS mở từ mục Ngoài-9 của ZC18. Con số của hàng là «số snapshot S06 tồn đọng
bị chặn» và đang là 0 trước và sau, vì lịch thu đuôi chưa cài. Lời hứa đo bằng probe trên dữ liệu thật đã làm hỏng có chủ đích
(AC-1 đến AC-7); sau khi cài lịch, bản hỏng thật nếu có sẽ hiện trong `bo-qua-hong.json` và log của job.

## Out of scope

- Cài lịch, plist, launchd: bước triển khai sau gộp của ZCode (ghi chú `giao-trien-khai-zc18-zv.md`), cần lời riêng của Mạnh.
- Sửa `pipeline/import-chotot.mjs` (kể cả `process.exit(0)` trong `readSnapshot`): bộ nạp dùng chung với lượt quét đủ, ngoài hàng.
- Thử lại lượt nạp đứt giữa chừng (Ngoài-8 của ZC18, đã ghi Known limits): sổ nạp ghi trước khi tin vào stg — việc riêng.
- Xoá, dời hay sửa bản hỏng; công cụ gỡ dấu tự động. Người gỡ dấu bằng tay nếu cần (xoá khoá trong tệp đánh dấu).
- Báo động ra ngoài máy (issue, kênh) khi gặp bản hỏng.

## Notes

- Hàng do U2 viết mã (GS phán 28/11, cùng nếp ZC17, ZC18 ở chính tệp này); LL được báo để ghi sổ làn, ZCode nhận khi triển khai.
- Bước kiểm dùng chính `readSnapshot` của bộ nạp (khuôn rút từ bên đọc thật, không chép luật), cộng kiểm `source` trước vì
  `readSnapshot` thoát tiến trình ở nhánh đó.
- Vòng đầu gặp bản hỏng thoát 1 có chủ đích: để người vận hành thấy, và để probe chọn-nạp của ZC18 (vòng 6 dựng bản hanoi
  checksum sai, đòi thoát 1) vẫn xanh.
