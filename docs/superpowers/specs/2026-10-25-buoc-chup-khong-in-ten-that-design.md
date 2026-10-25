# Thiết kế — buoc-chup-khong-in-ten-that

Căn cứ: Cổng Bằng chứng `hieu-chuan-mot-bo-so` 25/10 — Mạnh chọn «Ngoài-9: mở hợp đồng mới» (sổ
`_acceptance/hieu-chuan-mot-bo-so/decisions.jsonl` dòng `d-20261025T012505Z-32`); luật 6 / ADR-0007 (tên nguồn thật là
tầng A, không rời máy local); kho đã công khai (`repo-public`).

## Vấn đề

`scripts/ui-capture-login.mjs` che tầng A bằng cách nhúng mảng tên thật vào chính dòng lệnh
`playwright-cli eval "() => { window.__TIER_A_NAMES = [...] … }"`. Hậu quả:

- Lệnh ấy lỗi (trang lỗi JS, phiên chết, timeout) → `execFileSync` ném lỗi mang nguyên argv → Node in ra stderr cả danh
  sách tên thật. Đầu ra bước chụp hay được dán vào bằng chứng `_acceptance/` của kho công khai.
- Lúc chạy, tên nằm trong argv của tiến trình con — `ps` thấy được.
- Mọi lỗi lệnh con khác (`goto`, `screenshot`, `state-load`) cũng thoát bằng ngoại lệ thô, không có lời chung.

## Cách làm

1. **Tên thật không rời tiến trình Node.** Bước che chỉ chạy `mask-tier-a.js` với danh sách rỗng — nó thay chữ trong mọi
   phần tử `[data-tier-a]` bằng `█` nhưng GIỮ thuộc tính của chúng — rồi một lệnh `eval` khác trả về chữ hiển thị và giá trị
   thuộc tính của trang, **bỏ trọn cây con `[data-tier-a]`** (chữ lẫn thuộc tính: phần ấy đã được che, tooltip không lên
   ảnh) và bỏ `<script>`/`<style>`. Node so tên bằng hàm thuần `tierALeaks(names, page) → { leaked, attrLeaked }` (không
   phân biệt hoa thường, tên ≥ 3 ký tự). Còn lộ → thoát 5, lời chỉ có SỐ tên, không ảnh. Kết quả eval đọc chữ không có khối
   «### Result» hoặc không parse được → coi là lỗi bước (mã 7), không bao giờ coi là «không lộ».
2. **Mọi lệnh con đi qua một lớp bọc.** `step(name, args)` gọi `run(args)`; lỗi → ném `CaptureError` mang tên bước và mã
   thoát, lời ra ngoài là «bước chụp lỗi ở «<bước>» (mã <n>)» cộng tối đa một dòng stderr của playwright-cli đã **xoá tên
   thật** (thay bằng `███`) và không có argv. `capture()` bắt lỗi ấy → thoát 7, không ảnh.
3. **Tệp tạm của danh sách tên luôn bị xoá**, cả khi `tier-a-names.mjs` lỗi hay lệnh con lỗi (dọn trong `finally`).
4. **Không có biến môi trường nào đổi nguồn danh sách tên** trên đường chạy thật (phản biện S1: một biến như vậy là lối vòng
   qua rào tầng A — danh sách rỗng thì không so gì mà vẫn ghi ảnh). Phép đo trình duyệt thật gọi thẳng `capture()` và tiêm
   nguồn tên qua tham số `tierANames`.

## Phép đo

- `scripts/ui-capture-login.test.mjs` (máy chủ giả + runner giả): argv của mọi lệnh con không chứa tên nào; tên còn trong
  chữ/thuộc tính trang → mã 5; lỗi lệnh con ở từng bước → mã 7, đầu ra không chứa tên/mật khẩu/cookie; tệp tạm bị xoá.
- `scripts/ui-capture-browser.test.mjs` (trình duyệt THẬT qua playwright-cli, máy chủ `node:http` phục vụ `/login` +
  `/ops/x`; gọi `capture()` với runner thật và nguồn tên tiêm, dùng đúng bộ 3 tên giả của UC-TA-1 — có dấu, hoa-thường
  lẫn, có nháy): tên lộ trong chữ hay thuộc tính → mã 5 không ảnh; tên chỉ trong `[data-tier-a]` (chữ + `title`) → được
  che, có ảnh. Không cần DB, không cần app.

## Không làm

- Kiểm ảnh đã ghi ra tệp (Ngoài-11/14 của ON10), giới hạn origin của đăng nhập (Ngoài-12) — việc khác của bước chụp.
- Đổi `mask-tier-a.js` (dùng chung với phép đo B1/B3).
