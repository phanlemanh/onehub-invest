---
schema_version: 1
feature: Bộ thu S17 (thửa đất + căn thẩm định) vào kho chính — trần bắt buộc, dừng khi bị chặn, khoá một lượt, giữ số dư, ảnh an toàn, snapshot chốt mới ghi tiến độ, không lộ tên nguồn (ZC21)
slug: s17-bo-thu-mo-rong
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: verified
veto_state: mo
veto_opened_at: 2026-11-26T09:45:00Z
design_doc: docs/superpowers/specs/2026-11-26-s17-bo-thu-mo-rong-design.md
---

# Acceptance Contract: s17-bo-thu-mo-rong

## Context

Hàng ZC21 (dãy ZT), sau HT9. Bộ thu S17 do làn thu (phiên S17) dựng theo lời Mạnh 24–25/11 (mốc ngày 1, ngày 2, mở rộng toàn
bộ dự án, thửa, ảnh cả máy chủ ngoài). Nguồn mã: nhánh làn thu `zcode/s17-mo-rong` @75de72613 (LL soát ĐẠT 26/11; commit sau
4d026c6d2 LL soát chưa đạt nên không đi cùng), gộp main thành fbebcbda6. Vòng này không viết lại logic thu.

## Acceptance Criteria

- AC-1: Given lệnh chạy bộ thu thiếu trần lời gọi hoặc trần thời gian, nhịp ngoài 150–400 ms, hay số luồng ngoài 1–8, When
  phân tích dòng lệnh, Then từ chối trước khi gọi nguồn; bản bỏ bắt buộc trần lời làm đỏ ca «thiếu trần».
- AC-2: Given nguồn trả 403 hay trang thử thách giữa một đợt lời, When bộ thu xử lý, Then dừng cả lượt (đợt sau không gửi);
  bị chặn một lần thì lượt sau chỉ một luồng nhịp cũ; hai lần thì dừng hẳn chờ người; nhiều lỗi mạng liền nhau ở pha ảnh thì
  dừng «network-down»; bản bỏ dừng khi 403 và bản nâng ngưỡng «hai lần» đều làm đỏ đúng ca.
- AC-3: Given một pha cần phiên đang giữ khoá chung (tiến trình còn sống), When pha cần phiên thứ hai khởi động, Then dừng với
  lý do «another-run» trước khi gọi gì; khoá của tiến trình đã chết được dọn; bản bỏ kiểm tiến trình sống làm đỏ ca khoá.
- AC-4: Given pha đụng tài khoản, When số dư sau lượt nhỏ hơn trước, Then dừng «balance-spent»; không đọc được số dư thì
  dừng trước khi chạy pha; bản bỏ phép so số dư làm đỏ ca số dư.
- AC-5: Given URL ảnh trỏ địa chỉ nội bộ (trực tiếp, qua DNS, hay qua chuyển hướng) hoặc máy chủ ngoài danh sách, When tải
  ảnh, Then không gửi lời nào tới đó; ảnh khai cỡ vượt trần thì bỏ, không đọc thân; lỗi cấp máy chủ ở lượt nguồn là lỗi tạm,
  không ghi vĩnh viễn; bản bỏ chặn địa chỉ nội
  bộ và bản biến lỗi máy chủ thành vĩnh viễn đều làm đỏ đúng ca.
- AC-6: Given một lô snapshot chốt hỏng, hay tệp DUNG xuất hiện giữa lượt, When bộ thu ghi tiến độ, Then trạng thái không nói
  đã làm việc chưa xuống đĩa; manifest mang sha256 từng tệp; chạy lại không lặp việc đã xong; DUNG dừng sạch ở lời kế; bản
  ghi tiến độ khi lô chưa chốt và bản bỏ kiểm DUNG đều làm đỏ đúng ca.
- AC-7: Given danh sách tên thật và tên miền S17 trong sổ máy thu, When quét mọi tệp nhánh đổi, Then 0 chỗ trúng; tự kiểm cấy
  từng biến thể vào bản chép đều trúng.
- AC-8: Given dist collector dựng lại từ đầu, When kiểm kiểu và chạy 13 tệp test S17 với HOME + TMPDIR tạm, Then 0 lỗi kiểu,
  đúng 263 ca, 0 đỏ, 0 bỏ qua, 0 todo, mọi ca nêu tên ở evals chạy xanh; tệp nhánh đổi chỉ thuộc thư mục S17, test S17, hồ sơ
  này và bản đồ; cờ `--bo-doc-so-du` (commit 4d026c6d2) vắng.

## Out of scope

- Bộ nạp `stg_s17_*`, migration và DATA-CONTRACT (snapshot phiên bản 17, 18) — ngoài phạm vi, vì là làn Claude: nhánh hợp đồng
  dữ liệu `zcode/s17-dc-mo-rong` đi cùng DA58 của dãy P1 (phán GS 26/11).
- Commit 4d026c6d2 (ghi câu trả lời, cờ --bo-doc-so-du) — ngoài phạm vi, vì LL soát chưa đạt (lỗ test cắt 600 ký tự); vòng sau.
- Build dist và chạy bộ thu trên máy thu — ngoài phạm vi vòng code, vì là bước triển khai sau gộp (LL soạn lời GIAO).
- Bộ test collector trọn — ngoài lệnh chấm, vì ca S08 đọc token ở HOME còn đỏ tới khi ZC19 gộp; CI chạy bộ trọn trên PR.

## Coverage

- Trục chốt chặn lời gọi: trần lời · trần giờ · nhịp · luồng — AC-1.
- Trục phản ứng nguồn: 403 · trang thử thách · lỗi mạng · bị chặn lần một / lần hai — AC-2, AC-5.
- Trục tài nguyên dùng chung: khoá phiên · số dư tài khoản — AC-3, AC-4.
- Trục an toàn mạng của ảnh: địa chỉ nội bộ · DNS riêng · chuyển hướng · trần cỡ — AC-5.
- Trục ghi bền: lô chốt · manifest · nối tiếp · tệp DUNG — AC-6.
- Trục tầng A: tên thật, tên miền nguồn trong kho — AC-7.
- Trục kho chính: kiểm kiểu · test S17 · mã ngoài S17 — AC-8.

## Notes

- Nền hạ tầng: lượt soát M5 chỉ đỏ ca app «QV-AC-5 zalo: việc xong → 1 dòng…» — ca của cổng app, đỏ sẵn trên main, không
  thuộc vùng collector của ZC21 (luật đợt: «xanh» = chỉ còn QV-AC-5).
- LL đo 26/11 trên M5X: 13 tệp test S17 263/263; đột biến khoa-phien.ts:48 → đỏ 2 ca khoá; pha-anh.ts:367 → đỏ 1 ca lỗi
  máy chủ. Probe vòng này đo lại hai đột biến ấy cùng ba đột biến mới.
