---
schema_version: 1
feature: audit-all không còn PASS giả ở backup và membership S03, và kiểm các trang /ops ở đúng cổng :3456
slug: audit-all-noi-that
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, docs]
status: signed-off
design_doc: docs/superpowers/specs/2026-10-23-audit-all-noi-that-design.md
lo_trinh_ma: AU5
approved_by: Mạnh
approved_at: 2026-10-23
---

# Acceptance Contract: audit-all-noi-that

## Context

Hàng AU5 (đợt `cam-mau-2310`). Audit 23/10 L6: `scripts/audit-all.sh` có 2 PASS giả (backup, membership S03) và
4 FAIL giả (trang `/ops` gọi `:3000`, app ở `:3456`). Gốc PASS giả: khuôn `$(grep -c … || echo 0)` — không khớp thì
biến thành `"0\n0"`, phép so số lỗi rồi rơi xuống nhánh PASS (design doc §1). Vòng này: bộ đếm an toàn, ba mục câu
giao nói thật, gốc `/ops` đúng cổng, phép đo chạy nguyên script trong hộp giả.

Source input: hàng AU5 `docs/plan/lo-trinh.json` + ô cơ hội `_acceptance/audit-all-noi-that/opportunity.md` (Mạnh
«build duyệt» 23/10) + LUAT đợt `dot0-cam-mau`.

## Criteria

- AC-1: Given `scripts/audit-all.sh` chạy nguyên trong cây tạm với `launchctl` giả phát lại đầu ra `launchctl list` THẬT chụp 23/10 (`scripts/fixtures/launchctl-list-2026-10-23.txt`, dòng backup sinh bằng thay nhãn trên dòng thật, giữ nguyên tab/cột) và plist backup giả ở `$HOME/Library/LaunchAgents`, When chạy với (a) không có job `oneinvest.backup`, (b) job mã 1, (c) job mã 0 mà plist không khai `BACKUP_DIR`, (d) job mã 0, `BACKUP_DIR` khai mà không có `db-*.sql.gz` nào trong 8 ngày, (e) job mã 0 và có `db-*.sql.gz` 2 ngày tuổi, Then (a) đúng dòng `❌ Backup tuần CHƯA cài`; (b) `❌` kèm mã 1; (c) `❌` «chưa đặt BACKUP_DIR»; (d) `❌` «không có bản sao lưu trong 8 ngày»; (e) `✅` kèm tên tệp — chỉ (e) ra PASS; chiều đỏ: bản sao script giữ khuôn `|| echo 0` cũ ở dòng backup → ca (a) ra PASS và ca đo đỏ nêu «backup».
- AC-2: Given cùng hộp (PATH chỉ gồm thư mục bản giả + `/usr/bin:/bin`, `HOME` tạm), When CLI OpenClaw (a) không có — ca kiểm trước `command -v openclaw` thất bại và `$HOME/.openclaw/bin/openclaw` không tồn tại trong hộp, (b) bản giả in danh sách CÓ id nhóm, (c) bản giả in danh sách KHÔNG có id nhóm, Then (a) `⚠️` «không kiểm được membership», (b) `✅` còn membership và nhật ký bản giả ghi đúng 1 lần gọi, (c) `⚠️` rời nhóm — không đường nào ngoài (b) ra PASS.
- AC-3: Given hàm `count_matches` của script, When đếm trên tệp vắng, tệp 0 khớp, tệp 3 khớp và trên stdin, Then in đúng MỘT dòng số nguyên `0`, `0`, `3`, đúng số; khi chạy nguyên script với log pipe (a) vắng và (b) có mà 0 khớp, dòng gate `gate <số> pass/<số> skip` mang đúng hai số nguyên; và mọi `grep -c` trong `audit-all.sh` chỉ nằm trong thân `count_matches`.
- AC-4: Given `curl` giả ghi mọi URL, When chạy script không đặt `OPS_BASE_URL`, Then bốn trang `/ops`, `/ops/collections`, `/ops/quality`, `/ops/sources` được gọi ở `http://localhost:3456` và không URL nào chứa `:3000`; đặt `OPS_BASE_URL=http://localhost:4999` thì bốn trang đi tới cổng đó.
- AC-5: Given `curl` giả trả mã cho trang `/ops`, When mã là 200, 307, 500, Then dòng tương ứng là `✅` · `⚠️` «chưa đăng nhập» · `❌` — 307 không còn được tính PASS và dòng ⚠️ trỏ `scripts/dev-ops-login-check.sh` để kiểm sau đăng nhập (Hỏi-1 = A, Mạnh 23/10).
- AC-6: Given hộp giả (PATH chỉ thư mục bản giả + `/usr/bin:/bin`; mọi bản giả `docker`, `curl`, `launchctl`, `security`, `openclaw` ghi nhật ký lời gọi), When chạy trọn script, Then script chạy tới dòng `TỔNG KẾT: <p> PASS · <f> FAIL · <l> LIMITED` với ba số bằng đúng số dòng ✅/❌/⚠️ đã in, tập lệnh ngoài được gọi nằm trong danh sách bản giả (không `curl`/`docker`/`openclaw` thật nào chạy), và `ROOT` trỏ cây tạm (log đọc ở `<cây tạm>/pipeline/logs`).
- AC-7: Given `.claude/skills/ops-check/SKILL.md` (bước audit), When người vận hành đọc, Then biết backup chưa cài là FAIL, `/ops` kiểm ở `OPS_BASE_URL` (mặc định `:3456`) và 307 nghĩa là chỉ thấy trang sống — muốn kiểm trang thật thì chạy `scripts/dev-ops-login-check.sh`. (judgment)

## Coverage

Bỏ quét hình thái — xem dòng `bỏ coverage-scan` trong sổ. Ma trận:

- Trục A — mục câu giao: backup (AC-1) | membership S03 (AC-2) | trang `/ops` (AC-4, AC-5) [thước CE: audit L6 — 2 PASS
  giả + 4 FAIL giả].
- Trục B — gốc lỗi chung: khuôn `|| echo 0` (AC-3, chiều đỏ AC-1) | ROOT viết cứng (AC-6).
- Trục C — trạng thái từng mục: vắng/có-0/có-lỗi (AC-1) | CLI vắng/có/không (AC-2) | 200/307/500 (AC-5).
- Trục D — toàn script: tổng kết khớp, không mạng thật (AC-6) | tài liệu (AC-7).

## Đường đo

- «Khi chưa có job backup: mục backup FAIL» · số từ ca AC-1 của `node --test scripts/audit-all.test.mjs` (chạy nguyên script, `launchctl` giả vắng job) · AC-1

## Out of scope

- Cài job backup và chọn `BACKUP_DIR`/`BACKUP_PASS` thật — audit Q6 của Mạnh (vòng này chỉ báo đúng trạng thái).
- Các mục khác của audit-all (DB local, launchd agents, độ phủ S02 luôn PASS) và `/ops` dùng chung số SLO (AU6).

## Notes

- Fixture `launchctl` là bản chụp đầu ra thật (23/10); đầu ra OpenClaw CLI KHÔNG chụp thật (an toàn Zalo, AGENTS luật 8) — bản giả dựng tay theo khuôn script đọc.

- Phép đo không gọi mạng thật (Supabase, Vercel, OpenClaw): mọi lệnh ngoài đi qua bản giả đầu `PATH` và `HOME` tạm.

- Known limits — chọn ở Cổng Bằng chứng 2026-10-23:
  - Ngoài-2: bản chụp danh sách job nền chỉ giữ hai dòng thật, chưa có dòng tiêu đề và chưa có ca job backup đang chạy (có PID).
  - Ngoài-4: nếu ai viết cứng lại đường dẫn tới máy tác giả, bộ kiểm vẫn xanh trên máy này vì log thật cũng có ở đó.
  - Ngoài-5: phần «không lệnh thật nào chạy» chỉ quét mã nguồn tìm vài đường gọi quen thuộc; một cách gọi mới có thể lọt.
  - Ngoài-6: cấu hình backup trong test dựng tay theo khoá công cụ cài ghi hôm nay; công cụ cài đổi cách ghi thì bộ kiểm không biết.
