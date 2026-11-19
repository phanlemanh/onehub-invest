---
schema_version: 1
feature: "Tích hợp ba nhánh ZCode cho bộ thu S02: lượt thu ném lỗi giữ thư mục tạm ẩn; bộ thu dừng ngay khi appToken hết hạn; xác thực hỏng (401 sau refresh, token hết hạn hay rác) ghi dòng AUTH FAIL"
slug: s02-luot-loi-sach-va-kiem-han-token
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, data]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-19T19:24:56Z
approved_by:
approved_at:
design_doc: _acceptance/s02-luot-loi-sach-va-kiem-han-token/design.md
---

# Acceptance Contract: s02-luot-loi-sach-va-kiem-han-token

## Context

Hàng tích hợp làn thu, GS giao dãy P4 ngày 20/11. Gộp `zcode/s02-luot-loi-sach` @0dc032fab, `zcode/s02-apptoken-het-han`
@b49971757 (LL đã soát: npm test collector 72/72, đột biến đỏ đúng) và `zcode/s02-auth-fail-kiem-han` @26c008a2e (nối thẳng trên
b49971757, LL soát 75/75; sửa hai điểm hàng này từng để ngoài phạm vi) vào một nhánh, một lượt chấm. Claude chỉ tích hợp,
không sửa logic thu. Sự cố gốc: 29 thư mục bản thu S02 tên thật 0 items che lượt 401; 19/11 «token OK (327 chars)» là token
hết hạn 26/10, cả lượt 401.

## Acceptance Criteria

- **AC-1** (lượt lỗi không thành bản thu) Given bộ thu ném lỗi giữa lượt, When `runCollector` chạy, Then thư mục thành phố
  không có thư mục tên thật nào của lượt đó; đúng một `.<id>.partial` ẩn mang `manifest.json` có `error` và 0 items; mọi tệp
  của bản thu có sẵn trước lượt vẫn còn sau lượt. Đối chứng: lượt thành công vẫn đổi tên ra thư mục tên thật, không sót
  `.partial`.
- **AC-2** (dòng AUTH FAIL) Given bộ thu S02, When xác thực hỏng, Then một dòng `AUTH FAIL [S02] <ISO>` được ghi vào log TRƯỚC
  khi lượt ném lỗi, ở cả hai đường: (a) token hết hạn, rỗng hay thiếu `exp` — đo HÀNH VI trên hàm `duyetAppToken` với mốc `now` cố
  định, ô còn hạn không có dòng này; chiều đỏ: bản đột biến bỏ bước ghi AUTH FAIL khi ném bị bắt ở ô hết hạn; (b) 401 sau refresh
  token — đo tĩnh: trong khối `if (res.status === 401)` sau refresh, dòng AUTH FAIL đứng trước throw; chiều đỏ: bản chép bỏ dòng
  thì lệnh đỏ ghim «thiếu AUTH FAIL [S02] trước throw». Đúng một tệp trong `collector/src/collectors/` có dòng này. Chạy hành vi
  nhánh 401 nằm ngoài phạm vi (hàm gọi API không xuất ra).
- **AC-3** (người đọc phía sau, cross-layer) Given một bản thu S02 thành công rồi một lượt ném lỗi trên cùng thư mục, When
  lệnh `collect` trả về và dòng `SNAP=` của script đêm S02 (rút nguyên văn) chọn bản thu, Then lượt ném lỗi làm lệnh thoát 1
  (CLI `collect` bắt lời từ chối bằng `process.exit(1)`; `set -e` dừng trước transform), lượt thành công thoát 0, và
  `SNAP=` chọn bản thành công. Chiều đỏ: đổi `.partial` ra tên thật như đời cũ thì `SNAP=` chọn bản hỏng, lệnh đỏ ghim tên
  thư mục.
- **AC-4** (kiểm hạn token) Given ma trận năm ô với mốc `now` cố định — token rỗng · hết hạn một giờ · hết hạn đúng `now` ·
  thiếu `exp` · còn hạn 30 phút, When gọi `kiemAppToken`, Then bốn ô đầu ném với đúng chẩn đoán (ô hết hạn kèm mốc ISO),
  ô cuối trả `token OK (<n> chars, hết hạn sau 30 phút)`; một dòng mỗi ô. Chiều đỏ: bản đột biến bỏ điều kiện hết hạn bị
  bắt ở ô hết hạn.
- **AC-5** (mọi lối ra của hàm lấy token đi qua kiểm hạn) Given hàm `appToken` của bộ thu S02, When đọc thân hàm (bỏ callback
  chạy trong trình duyệt), Then mọi câu `return` đứng sau lời gọi `duyetAppToken(log, token)` (kiểm hạn + AUTH FAIL) và tệp không còn dòng log
  «token OK (${token.length} chars)» cũ. Chiều đỏ trên ba bản chép — bỏ lời gọi · cấy đường trả sớm trước lời gọi · cấy lại
  dòng log cũ — mỗi bản đỏ với đúng thông điệp ghim.
- **AC-6** (không phá, đúng vùng) Given nhánh tích hợp, When so `git diff --name-only $(git merge-base origin/main HEAD) HEAD`,
  Then tệp đổi chỉ gồm đúng năm tệp sau và hồ sơ này, cả năm đều có mặt: tệp bộ thu S02 trong `collector/src/collectors/`
  (tệp duy nhất xuất `kiemAppToken`) · `collector/src/core/scheduler.ts` · `collector/src/core/storage.ts` ·
  `collector/src/test/snapshot-loi-khong-tac-thu-muc.test.ts` · `collector/src/test/apptoken-exp.test.ts`; `npm test` của
  collector (tsc + toàn bộ ca) xanh. Chiều đỏ: cấy một tệp ngoài danh sách thì lệnh in «ĐỎ: tệp ngoài vùng: <tệp>».

## Coverage

Bỏ quét không gian AC (entry `descope` «bỏ coverage-scan»): hàng tích hợp hai bản sửa đã soát, phạm vi là đúng năm tệp.
Trục máy vẫn liệt để soi:

- **Trục kết cục lượt**: thành công · ném lỗi giữa lượt — AC-1, AC-3.
- **Trục token**: rỗng · hết hạn · biên 0 · thiếu exp · còn hạn — AC-4; đường nối vào `appToken` — AC-5.
- **Trục xác thực**: 401 rồi refresh thành công (không đổi) · 401 sau refresh · token hết hạn, rỗng, thiếu exp — AC-2.
- **Trục người đọc**: script đêm S02 (exit + `SNAP=`) — AC-3; bộ đọc bỏ thư mục chấm (2510-8) và freshness theo DB — không
  đổi, ghi trong design doc.
- **Ô bỏ**: chạy hành vi nhánh 401 (hàm `call` không xuất, sửa là việc làn thu).

## Out of scope

- Sửa logic thu S02 (làn ZCode): lỗi logic → LL `tin MỞ LẠI`.
- Thước độ tươi đọc dòng `AUTH FAIL [S02]` (chưa có bộ đọc).
- Triển khai sau gộp (build `dist` collector trên checkout chính): ZCode, LL giao riêng.
- Dọn 29 thư mục bản thu tên thật 0 items đã có (luật 1: snapshot bất biến).

## Notes

- Lệnh đo nằm ở `_acceptance/s02-luot-loi-sach-va-kiem-han-token/probes/`; `_acceptance/config.yaml` là tệp bảo vệ, không sửa.
- Phép đo cần `collector/dist` mới: lệnh eval build bằng `npx tsc -p tsconfig.json` trước.
