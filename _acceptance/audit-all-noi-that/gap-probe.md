---
slug: audit-all-noi-that
at: 2026-10-23T15:05:00Z
verdict: findings
p0: 1
p1: 2
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract + sổ d-2 | Lối «audit đăng nhập bằng tài khoản ops thử» còn sống mà d-2 ghi mot-loi; chọn kiểm trang sống hay trang thật là việc người | Trang /ops hỏng 500 sau lớp đăng nhập không bao giờ lộ; Mạnh tưởng /ops đã được kiểm | Dòng Hỏi thay d-2 nêu cả lối đăng nhập | human-gate1: Hỏi-1 (A giữ chỉ đọc · B tự đăng nhập — dev-ops-account.mjs ghi DB) |
| P1 | contract Out of scope | Job backup mã 0 khi BACKUP_DIR chưa đặt là PASS giả ở backup — đúng mục câu giao — mà bị đẩy ra ngoài | Cài job thiếu BACKUP_DIR → audit báo ✅ đã cài mà không sao lưu gì | Thêm ca job mã 0 + BACKUP_DIR vắng | fixed: AC-1 thêm ca (c) plist không BACKUP_DIR → ❌, (d) không có bản 8 ngày → ❌, (e) có bản → ✅; dòng sổ căn cứ backup.sh |
| P1 | contract AC-2, AC-6 | «Không gọi thật» chỉ đo trên curl; PATH thật còn lọt openclaw/psql thật | Máy có openclaw trong PATH → ca CLI vắng gọi OpenClaw thật (luật 8) | PATH chỉ bản giả + /usr/bin:/bin, mọi bản giả ghi nhật ký, ca (a) kiểm command -v | fixed: AC-2/AC-6 + E2/E6 viết lại |
| P2 | evals E1/E2 + sổ d-3 | Fixture launchctl tự dựng, openclaw không căn cứ | Khuôn thật khác khuôn giả → xanh giả | Bản chụp đầu ra thật | fixed (một phần): scripts/fixtures/launchctl-list-2026-10-23.txt chụp thật, dòng backup sinh bằng thay nhãn; deferred: OpenClaw không chụp thật (an toàn Zalo) — ghi Notes |
| P2 | evals E3 | Lỗi đếm gate chỉ đo bằng quét chuỗi | Code bỏ count_matches, dòng gate in số trống mà E3 xanh | Ca chạy script với log vắng/0 khớp + quét grep -c chỉ trong count_matches | fixed: AC-3/E3 thêm hai ca |
