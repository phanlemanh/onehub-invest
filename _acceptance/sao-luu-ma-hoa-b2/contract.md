---
schema_version: 1
feature: Máy thu có công cụ sao lưu hằng ngày ra kho restic mã hoá trên máy (đích B2), thử khôi phục định kỳ và cảnh báo quá hạn — chứng minh trên dữ liệu giả
slug: sao-luu-ma-hoa-b2
owner: phanlemanh@gmail.com
risk_tier: T3      # giám sát giao T3: dữ liệu tầng A rời máy (dù đã mã hoá) khi lượt gửi thật chạy
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-11-sao-luu-ma-hoa-b2-design.md
---

# Acceptance Contract: sao-luu-ma-hoa-b2

## Context

Máy thu chưa có bản sao lưu nào ra ngoài đĩa của nó: `scripts/db-sao-luu.sh` chạy tay, ghi ra cùng ổ; raw snapshot (bài S03 không
thu lại được) chỉ có một bản. Mạnh quyết 11/11: cho một bản sao lưu đã mã hoá ra ngoài máy, khoá giữ ở máy (QĐ3); đích Backblaze B2,
tách khỏi Supabase (QĐ5); chạy B2 luôn, không chờ ổ ngoài (QĐ15). Hàng này dựng công cụ `scripts/sao-luu-ngoai-may.sh` (restic,
mã hoá phía máy) và chứng minh nó trên dữ liệu giả và kho restic cục bộ. Lượt gửi dữ liệu thật lên B2 chờ luật 6 đã sửa, thùng và tệp
khoá do Mạnh đặt, và lời riêng của Mạnh.

Source input: lời giao của giám sát 11/11; bản phạm vi `research-local/pham-vi-sao-luu-1111.md` (sáu tiêu chí bắt).

## Criteria

- AC-1: Given máy thiếu tệp xác nhận «đã cất bản khoá» do Mạnh tạo, When chạy `chay` hay `khoi-tao`, Then thoát mã 3, restic giả ghi 0
  lời gọi và không thư mục dump nào được tạo; Given có tệp xác nhận và đủ điều kiện, Then restic được gọi.
- AC-2: Given tệp cấu hình B2 có quyền khác 600, nằm trong cây kho, máy không có restic, hay Keychain không có mục mật khẩu, When chạy
  `chay`, Then thoát lần lượt mã 4, 4, 5, 6 trước mọi lời gọi restic, và thông điệp không chứa giá trị khoá hay mật khẩu nào.
- AC-3: Given cây giả có raw snapshot, trạng thái thu (gồm tệp mang tên phiên, cookie, profile, QR, token), kho ảnh và một bản dump giả,
  When `chay` vào kho restic cục bộ, Then bản mới có mọi tệp của bốn mục trừ đúng các tệp phiên/khoá dưới `collector/state/`, số tệp và
  tổng cỡ khớp nguồn; raw snapshot có tên chứa các từ đó (vd `chat_profile`, `author`) vẫn có đủ; kho ảnh vắng thì trạng thái ghi
  `chua_co` và lượt vẫn xong.
- AC-4: Given kho cục bộ dựng từ cây có chuỗi canh, When đọc mọi tệp dưới `data/` của kho và khôi phục bằng mật khẩu sai, Then không tệp
  nào chứa chuỗi canh và lệnh khôi phục thất bại; và các tệp của hàng không gọi lệnh tải lên nào ngoài restic.
- AC-5: Given kho lành dựng bằng chính `chay` (bản dump tạm đã xoá), When chạy `kiem`, Then khôi phục ít nhất 50 tệp raw snapshot (so với
  đĩa) cộng mọi tệp của bản dump mới nhất (so với sha256 `chay` đã ghi lúc dump) ra thư mục tạm ngoài kho, mọi sha256 khớp, mã 0; Given
  một tệp pack bị phá hay một tệp dump trong kho bị sửa, Then mã 1 và thông điệp nêu bước hay tệp hỏng.
- AC-6 (cross-layer): Given một DB thử nhỏ đã dump qua `db-sao-luu.sh` và đã vào kho, When chạy `kiem-db`, Then bản dump khôi phục nạp vào
  DB thử khác có số dòng mọi bảng khớp `so-dong.tsv`, DB thử bị xoá sau đó; Given `so-dong.tsv` lệch một dòng, Then mã 1 nêu bảng lệch.
- AC-7: Given lượt `chay` xong hay lỗi, When đọc tệp trạng thái, Then nó có `ket_qua`, `lan_ok_cuoi`, `snapshot_id`, số tệp, số byte và
  không chứa khoá, đường kho hay tên nguồn; Given `lan_ok_cuoi` cách 35 giờ, 37 giờ, lần cuối lỗi, hay chưa có tệp, When chạy
  `check-freshness`, Then thoát 0, 1, 1; chưa có tệp mà chưa bật (không có tệp xác nhận) → 0 kèm dòng «chưa bật»; chưa có tệp mà đã bật → 1.
- AC-8: Given khoá B2 và mật khẩu giả đã dùng cho một lượt, When soát log, tệp trạng thái, stdout/stderr và cây kho, Then không chỗ nào
  chứa giá trị; Given một tệp gài giá trị khoá, When chạy `soat-khoa`, Then mã 1 và chỉ in đường tệp, không in giá trị.
- AC-9: Given 12 bản giả cách nhau theo ngày, When `chay` chạy bước giữ, Then còn đúng tập 7 ngày / 4 tuần / 6 tháng; Given chạy lại lần
  hai không đổi nguồn, Then byte mới dưới 1% lần đầu; Given dump lỗi, Then trạng thái `loi`, `buoc_loi: dump`, không lời gọi backup.
- AC-10: Given diff của hàng so với main, When quét, Then không đổi `pipeline/sync-cloud.mjs`, `collector/**`, không có tệp plist hay
  lệnh `launchctl`, mọi test dùng kho restic dưới thư mục tạm (không `b2:`/`s3:`), và không dòng thêm nào chứa tên nguồn thật đứng riêng.

## Coverage

- Trục điều kiện chạy: thiếu xác nhận × cấu hình sai quyền × cấu hình trong kho × thiếu restic × thiếu Keychain × đủ (AC-1, AC-2).
  Thước: ma trận C1–C5 của design doc, mỗi ca một assert, restic giả đếm lời gọi.
- Trục phạm vi dữ liệu: bốn mục gồm × loại trừ tầng A × lớp dẫn xuất × kho ảnh chưa có (AC-3). Thước: so danh sách tệp `restic ls` với
  cây giả.
- Trục bảo mật: mã hoá (AC-4), khoá không lộ (AC-2, AC-8), không đường tải khác (AC-4, AC-10).
- Trục khôi phục: tệp (AC-5), DB (AC-6), có ca phá cho từng loại.
- Trục vận hành: trạng thái và cảnh báo quá hạn (AC-7), giữ phiên bản, chạy lại, lỗi giữa chừng (AC-9).
- Trục ranh giới hàng: không dữ liệu thật, không launchd (AC-10).
- `[CE chưa kiểm chứng]`: bộ loại trừ theo tên tệp — tệp phiên mang tên trung tính không bị bắt; S3 kiểm kê `collector/state/` thật bằng số đếm.

## Đường đo

Hàng không có ô cơ hội với ngưỡng; sáu tiêu chí bắt của bản phạm vi ánh xạ: (1) bản đầu lên B2 → ngoài hàng, đo ở lượt gửi thật; (2) thử
khôi phục → AC-5, AC-6; (3) cảnh báo quá hạn → AC-7; (4) khoá không lộ → AC-2, AC-8; (5) bước chặn → AC-1; (6) không tệp thô rời máy →
AC-4, AC-10.

## Out of scope

- Lượt gửi dữ liệu thật lên B2 (tiêu chí 1 của bản phạm vi), nạp launchd, tệp plist — chờ luật 6 đã sửa, thùng và khoá của Mạnh, lời riêng
  của Mạnh; ghi `docs/ops/runtime-map.md` sau khi hàng P4 gộp.
- Sửa luật 6 trong AGENTS.md và ADR-0007 — giám sát lo.
- Cảnh báo trên `/ops` (cần `push-ops-facts` và mã app) — đề xuất hàng riêng (câu hỏi «cảnh báo /ops»).
- Object Lock và hạn giữ dài hơn hạn ảnh QĐ8; ổ ngoài; xoá các bản dump cũ dưới `~/onehub-backups/db`.

## Notes
