---
schema_version: 1
feature: Đẩy bản chép đã lọc từ máy thu sang máy phát triển M5 qua cầu Thunderbolt bằng một lệnh — soát ở máy thu, khoá chỉ chạy bước nhận, nạp nguyên tử có lùi
slug: day-ban-chep-sang-may-phat-trien
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-25T08:24:50Z
design_doc: docs/superpowers/specs/2026-11-25-day-ban-chep-sang-may-phat-trien-design.md
---

# Acceptance Contract: day-ban-chep-sang-may-phat-trien

## Context

M5 chỉ chạy cổng Invest và API, cần dữ liệu thật mà không giữ tầng A. HT18 làm ra bản chép đã lọc và soát trên máy thu. Mạnh không
chép tay được và giao máy làm trọn (25/11). Hàng này dựng đường đẩy một chiều qua cầu Thunderbolt có sẵn giữa hai máy, theo năm rào
của GS, và ghi cách vận hành hai máy vào kho để phiên sau không hỏi lại.

## Criteria

- AC-1: Given lệnh đẩy, When chạy, Then nó tự chép + soát (HT18) trong cùng lượt, chỉ gửi khi `ke.json` xanh và sha256 tệp sắp gửi
  bằng sha256 đã ghi lúc soát; tệp bị sửa một byte sau soát thì dừng trước khi gửi, nêu «sha256», M5 không nhận tệp nào.
- AC-2: Given một dòng tầng A cấy vào nguồn của lượt, When đẩy, Then lượt đỏ ở bộ soát trên máy thu, không có kết nối gửi nào tới M5
  (số tệp trong thư mục đến của M5 trước = sau).
- AC-3: Given khoá đẩy, When dùng nó xin shell, chạy một lệnh khác, scp/sftp, lệnh con có ký tự lạ, hay chuyển tiếp cổng, Then M5 từ chối; khoá chỉ chạy được bước
  nhận (dòng `authorized_keys` có `restrict` và `command=`); lượt đẩy không dùng khoá dựng máy (khoá toàn quyền đang có) — lệnh đẩy
  chỉ nạp khoá đẩy (`IdentitiesOnly`, không agent); tệp đi qua stdin của lệnh con `nhan`; bước nhận từ chối khi không đi qua `command=`.
- AC-4: Given hai máy, When liệt kê khoá, Then `authorized_keys` của Mac mini không có khoá nào của M5 và lệnh đẩy chỉ mở kết nối từ
  Mac mini sang M5.
- AC-5: Given lượt đẩy, When gửi, Then chỉ đúng hai tệp (dump, `ke.json`) rời máy; tệp nằm ngoài danh sách cho phép (từ điển nguồn,
  `.env`, raw snapshot) bị từ chối trước khi gửi.
- AC-6: Given tệp tới M5, When nhận, Then M5 so sha256, chạy `--kiem --khong-tu-dien`, nạp vào DB mới bằng `docker exec`, đếm từng bảng
  bằng `ke.json`, rồi mới đổi tên (DB đang chạy thành bản cũ, DB mới thành DB chạy); giữ đúng một bản cũ; tệp dump xoá sau khi nạp xanh.
- AC-7: Given lỗi ở bất kỳ chặng nào (sha, kiểm, nạp, đếm, xoá bản cũ, giữa hai lần đổi tên, đổi tên bị từ chối vì còn kết nối),
  When nhận, Then luôn còn một DB chạy đúng tên với dữ liệu trước lượt, DB mới bị xoá, thông điệp nêu chặng; `lui` đổi lại bản cũ thành
  DB chạy.
- AC-12: Given bước nhận chạy trên máy thu (test), When đích là container hay DB của máy thu, Then từ chối trước mọi lệnh đổi tên hay
  xoá; tên container, tên DB đọc từ biến của lượt; vân tay DB máy thu trước và sau toàn bộ lượt chấm bằng nhau.
- AC-8: Given hàng xong, When liệt kê lịch chạy của hai máy, Then không có plist hay cron mới cho việc đẩy; lệnh chỉ chạy khi gọi.
- AC-9: Given cầu Thunderbolt, When đẩy, Then lệnh dùng địa chỉ cầu cố định đọc từ cấu hình riêng máy (không viết cứng trong kho); cầu
  không thông thì dừng nêu «cầu Thunderbolt», không rơi sang mạng khác.
- AC-10: Given lượt đẩy đầu từ DB máy thu thật, When xong, Then trên M5 DB chạy có dữ liệu bản chép (số dòng từng bảng = `ke.json`),
  trang Invest khu Hà Nội và `/v1/listings` của data-api trên M5 trả dữ liệu; in thời gian từng chặng.
- AC-11: Given kho công khai, When hàng gộp, Then ADR-0019, mục «Hai máy» của AGENTS.md, `docs/ops/hai-may.md` (trỏ từ runtime-map) và
  ROADMAP §3 mục 64 nêu đúng mô hình, năm rào và lệnh; không tệp nào trong kho chứa tên máy M5, địa chỉ cầu hay đường khoá.

## Coverage

- Cổng rời máy: soát + ghim băm → AC-1; cấy tầng A → AC-2; tệp ngoài danh sách → AC-5
- Một chiều: khoá ép lệnh → AC-3; không khoá ngược → AC-4
- Nhận và lùi: nạp nguyên tử → AC-6; lỗi và lùi → AC-7; không bao giờ chạm DB máy thu → AC-12
- Lịch: chỉ theo lệnh → AC-8
- Đường truyền: cầu cố định, không rơi mạng khác → AC-9
- Dữ liệu thật và trang M5 → AC-10
- Không hỏi lại: tài liệu, không lộ riêng máy → AC-11

## Out of scope

- Chạy hằng đêm bằng plist: hàng sau, cần lời riêng của Mạnh.
- Mã hoá hay VPN thêm ngoài SSH: GS 25/11, không cần.
- Kéo từ M5 về Mac mini, hay bất kỳ dữ liệu nào từ M5 về máy thu.
- Sửa bản chép, bộ soát của HT18: hàng chỉ gọi.

## Notes

- Mạnh gõ mật khẩu quản trị cho lệnh đặt địa chỉ cầu trên hai máy (máy in sẵn lệnh).
- Cấu hình riêng máy ở `~/.config/onehub/hai-may.env` (Mac mini) và `CLAUDE.local.md`; không vào kho.
