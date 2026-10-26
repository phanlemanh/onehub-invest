---
schema_version: 1
feature: ca ON16-AC-2 của audit-all.test.mjs thôi chập chờn qua ranh giới phút — hộp test ghim mốc giờ của dòng tiêu đề bằng bản giả date
slug: audit-all-test-moc-phut
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
veto_state: mo
veto_opened_at: 2026-10-26T15:36:40Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-26-audit-all-test-moc-phut-design.md
---

# Acceptance Contract: audit-all-test-moc-phut

## Context

Căn cứ: hàng `audit-all-test-moc-phut` của đợt dieu-phoi-dot0-cam-mau (P4, giám sát thêm 26/10 ~06:25Z). P3 đo trên CI
#116 (run 40278986279): ca «ON16-AC-2 script main từ worktree → khác ở mục A1» (`scripts/audit-all.test.mjs:346`) so đầu
ra hai lượt audit; dòng tiêu đề «AUDIT TOÀN DIỆN … YYYY-MM-DD HH:MM» mang mốc phút nên hai lượt vắt qua ranh giới phút thì
lệch. Ca dòng 334 cùng kiểu. Việc: tệp test tất định, không đổi hành vi audit-all.

## Criteria

- AC-1: Given hộp `runAudit` của tệp test, When `scripts/audit-all.sh` gọi `date '+%Y-%m-%d %H:%M'`, Then nhận mốc ghim
  `2026-10-23 09:00` từ bản giả `date`: ca canh mới «MP-AC-1» khẳng định dòng tiêu đề là « AUDIT TOÀN DIỆN ONE INVEST —
  2026-10-23 09:00», nhật ký lời gọi có `date +%Y-%m-%d %H:%M`, và bản giả gọi với `+%s` trả giờ thật (lệch dưới 5 giây).
  Ba bản sao đột biến của cùng tệp làm ca canh đỏ với thông điệp ghim riêng: gỡ bản giả → «dòng tiêu đề phải mang mốc ghim»;
  bản giả trả mốc cho mọi đối số → «date giả phải chuyển định dạng khác cho date thật»; bản giả thôi ghi nhật ký → «nhật ký
  lời gọi phải có date».
- AC-2: Given một `date` «nhảy phút» (mỗi lần gọi tăng một phút) chèn vào PATH ngay sau thư mục bản giả, When chạy hai ca
  «ON16-AC-2» trên bản tệp test của main 53e2b83b và trên bản sửa, Then bản cũ đỏ cả hai và đầu ra nêu dòng «AUDIT TOÀN DIỆN»;
  bản sửa xanh cả hai và `date` nhảy phút không được gọi lần nào. Kiểm kê nguồn giờ của `scripts/audit-all.sh` (`date`,
  `stat`, `-mmin`/`-mtime`/`-newer`, `SECONDS`, `printf %(`) ra đúng tập đã khai: dòng tiêu đề và `find -mtime -8` ở mục backup;
  nguồn giờ mới ngoài tập thì đỏ và gọi tên dòng.
- AC-3: Given cây sạch (không tệp theo dõi nào bị sửa), When chạy trọn `node --test scripts/audit-all.test.mjs` 12 lần liên tiếp,
  Then cả 12 lần 0 ca đỏ và số ca bằng số ca của main 53e2b83b cộng một (ca canh), không bớt ca nào.
- AC-4: Given nhánh so với merge-base của origin/main, When liệt kê tệp đổi, Then ngoài `scripts/audit-all.test.mjs` chỉ có
  hồ sơ này, `_acceptance/config.yaml`, tệp máy sinh và hồ sơ ghim lại (`audit-all-noi-that`, `audit-all-doc-log-o-checkout`);
  `scripts/audit-all.sh` không đổi.

## Coverage

- Bỏ coverage-scan (dòng sổ descope mới nhất, thay d-3) — vòng sửa một tệp test theo câu giao đã chốt; nguồn giờ khác của script đo bằng kiểm kê ở AC-2; trục: ghim mốc có ca canh hai chiều (AC-1), đối chứng qua
  ranh giới phút tất định (AC-2), lặp xanh (AC-3), không đổi sản phẩm (AC-4).

## Out of scope

- Thêm biến môi trường ghim giờ vào `scripts/audit-all.sh` — đổi script sản phẩm, không làm.
- Lọc dòng tiêu đề trong phép so của hai ca ON16-AC-2 — thước mù với lệch thật ở dòng tiêu đề, không làm.
- Ghim mốc cho `find -mtime` ở mục backup — các ca backup dùng tuổi tệp 2 và 10 ngày, xa ngưỡng 8 ngày, không chập chờn.

## Notes
