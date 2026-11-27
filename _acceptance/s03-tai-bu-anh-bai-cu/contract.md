---
schema_version: 1
feature: Tải bù ảnh S03 bài cũ sau ZC15 + ZC16 và giữ ảnh đã bù khi nạp lại raw — snapshot bù phase cuối, raw bất biến (ZC20)
slug: s03-tai-bu-anh-bai-cu
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-26T10:35:00Z
design_doc: docs/superpowers/specs/2026-11-26-s03-tai-bu-anh-bai-cu-design.md
---

# Acceptance Contract: s03-tai-bu-anh-bai-cu

## Context

Hàng ZC20 (dãy ZT), sau HT9. Ba điều kiện cổng của GS (LL chuyển 26/11): thứ tự nạp lại raw giữ ảnh bù; hợp đồng dữ liệu ghi
5 snapshot bù và 695 bài theo ngày; đặt state về 0 rồi nạp lại không mất ảnh bù. Nguồn mã: nhánh làn thu `zcode/s03-tai-bu-anh`
@2f0865de9 (LL soát ĐẠT), gộp main, cộng hai sửa tích hợp của ZT @aee72a12a (LL ĐẠT 26/11).

## Acceptance Criteria

- AC-1: Given danh sách snapshot gồm bản gốc và bản bù (`coverage.loai = "tai-bu-anh-2511"`), When `sapXepReplay` xếp rồi bộ nạp
  nạp lại raw theo thứ tự đó trên DB trống, Then bản bù nạp sau chót, mỗi nhóm giữ thứ tự tên, và bài giữ ảnh đã bù; bản
  `sapXepReplay` giữ nguyên thứ tự làm đỏ ca đơn vị.
- AC-2: Given DATA-CONTRACT, When đọc «Quy tắc tiêu thụ» điều 7, Then có quy tắc nạp snapshot bù phase cuối, đủ 5 tên snapshot bù
  21–25/11, số bài theo đúng cặp ngày 177 · 318 · 35 · 165 (695), trỏ `sapXepReplay()` và nêu hai chỗ nạp lại raw phải dùng nó
  (`zalo-import-daily.sh`, `finalize-hanoi.sh`); bản điều 7 sai một số làm phép kiểm đỏ.
- AC-3: Given state của `zalo-import-daily.sh` là `00000000T000000`, When job nạp lại, Then bản gốc 21/11 tên muộn nạp trước, cả 5
  snapshot bù phase cuối, state về mốc lớn nhất; lượt thường (state có mốc) giữ thứ tự tên, không đi nhánh replay; bản bỏ nhánh
  replay làm đỏ ca «replay state 0», bản luôn đi replay làm đỏ ca «lượt thường».
- AC-4: Given snapshot gốc đã có, When một lượt tải bù chạy, Then tệp và manifest của snapshot gốc giữ nguyên băm; lượt bù chỉ
  ghi snapshot mới.
- AC-5: Given máy chủ ảnh trả 403, trần lời gọi, hay lệnh dừng mềm giữa bài, When tải bù, Then 403 dừng hẳn không ghi snapshot và
  dọn thư mục tạm; không cửa sổ nào vượt trần lời; bài chưa xong bị bỏ, không bao giờ ghi entry null; entry 404 giữ nguyên;
  bản không nhận ra 403 làm đỏ ca «http-403 dừng HẲN».
- AC-6: Given nhánh đã gộp main, When chạy họ test zalo-import (HOME tạm), nap-argmax và AC-3 lối vào, Then 0 ca đỏ — khối liệt
  kê giống hệt bản apify, lối vào backfill đúng khuôn main; bản lệch khối liệt kê làm đỏ nap-argmax.

## Out of scope

- Chạy lượt tải bù hay nạp lại thật trên máy thu — ngoài phạm vi vòng code, vì là vận hành sau gộp (GS tự kéo main ngoài lượt
  đêm và lượt 15′, rồi soi lượt đầu — LL 26/11, không cần GIAO).
- `pipeline/finalize-hanoi.sh` dùng `sapXepReplay` — ngoài phạm vi, vì là hàng PL40 của dãy P4 (sau ZC20).

## Coverage

- Trục thứ tự nạp: thường · replay state 0 · bản bù tên ngày đăng · bản bù tên giờ chạy — AC-1, AC-3.
- Trục người đọc quy tắc: DATA-CONTRACT · job hằng ngày · finalize (ngoài phạm vi) — AC-2, AC-3.
- Trục an toàn tải bù: raw gốc · 403 · trần lời · dừng mềm · 404 — AC-4, AC-5.
- Trục luật main: khối liệt kê BÁO 2510-5 · lối vào symlink — AC-6.

## Notes

- Lượt soát trước của LL chỉ chạy họ zalo-import và backfill nên không thấy hai vi phạm luật main; M5 đỏ 4 ca @e994fc21a, ZT
  vá @aee72a12a, M5 xanh (26/11).
- Rào áp (GS 27/11, hàng ZC25 «nạp lại raw S03 chịu được ngắt giữa chừng», làn ZCode qua LL): KHÔNG replay raw S03 từ state 0 trên
  máy thu tới khi ZC25 gộp — lượt replay bị ngắt giữa chừng có thể đè hoặc bỏ vĩnh viễn ảnh đã bù của ~695 bài (Ngoài-1, Ngoài-4).
  Ghi lại rào này trong thân PR của ZC20.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-27:
  - Ngoài-2: khi chạy tải bù với một kho dữ liệu thử, phần ghi vẫn có thể rơi vào kho chung của máy, nên dữ liệu thử lẫn vào dữ liệu thật.
  - Ngoài-6: chạy tải bù trong khoảng 0 đến 7 giờ sáng giờ Việt Nam mà không chỉ định ngày kết thúc thì các bài đăng hôm nay bị bỏ sót.
  - Ngoài-7: tên nhãn nhận diện lô ảnh bù bị đổi ở một phía thì các kiểm thử vẫn xanh nhưng lô bù thật bị nạp sai thứ tự và ảnh bù bị ghi đè.
