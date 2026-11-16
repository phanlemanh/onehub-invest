---
slug: khai-slo-s10-s11
at: 2026-11-12T23:22:01Z
verdict: findings
p0: 1
p1: 1
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Không AC nào kiểm bản thu thật của S10, S11 có vào `airbnb_snapshots`; thực tế chưa bộ nạp nào ghi (import-airbnb.mjs:74-84 không có hai nguồn) | Qua hết eval mà máy thu vẫn ra «none» mãi, check-freshness vẫn thoát 1, chỉ đổi chữ | Hoặc AC trên DB máy thu, hoặc khai rõ ở Context/Out of scope rằng hai ô vẫn đỏ tới khi có bộ nạp và nêu chỗ chặn | fixed: Context nêu rõ «sau hàng này S10, S11 vẫn đỏ, đổi lý do», gốc là bộ nạp (làn ZCode); Out of scope ghi bộ nạp + giám sát gửi GIAO; bỏ chữ «như S01» |
| P1 | contract + evals | Số tóm tắt /ops đổi (none vào mẫu số) mà không AC nào nói; surfaces chỉ [cli] | /ops chuyển «6/6» sang «6/8 nguồn đạt SLO» không lời giải; bản sai mẫu số không bị bắt | AC + ca summarizeFreshness với S10, S11 none/fresh; thêm ops vào surfaces | fixed: AC-6 + E8 (ca KSL-AC-6 ở freshness-parity.test.mjs), surfaces [cli, ops] |
| P2 | contract | Báo cáo ngày in hàng none của S10, S11 như «quá SLO 192h» | Liên làn đọc thành thu trễ, giao nhầm cho làn thu | Thêm AC phân biệt none/stale, hoặc ghi Out of scope kèm lý do | fixed: Out of scope ghi cách in hiện tại và vì sao (sửa bao-cao-ngay.mjs ngoài vùng); Context nêu gốc là bộ nạp |
