---
slug: bat-dieu-phoi-cap-du-an
at: 2026-10-29T10:05:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ bỏ đo hiệu lực trên phiên mới ghi mot-loi, nhưng còn lối đo thật: phiên headless claude -p --setting-sources project,local (hay CLAUDE_CONFIG_DIR tạm) không nạp phạm vi user. | Khoá đúng chữ nhưng Claude Code không nạp gói; E1–E4 xanh, Mạnh ký, máy khác vẫn báo hook-phien thiếu. | Dòng sổ supersedes, thêm AC đo phiên mới với cặp đỏ bỏ khoá. | human-gate1: dòng mới nguồn chi-nguoi (Hỏi-1) — khuyên người kiểm ở Cổng Bằng chứng (máy đo thì mỗi lượt gọi model và ghi tệp sống vào thư mục đợt chung); AC-2 nay đo tên gói có thật trong manifest |
| P0 | design | Dòng sổ ghim nền cố định trích hợp đồng m2-ac10 — chỉ liên quan, không quyết nền của hàng này [m2-ac10-so-cap-co-dinh#F1]. | Cổng Phạm vi duyệt cách so dựa trên căn cứ không đứng; lối chết thật (merge-base rỗng sau gộp) không nêu. | Dòng sổ supersedes nguồn mot-loi nêu ràng buộc và đường ghim lại nền. | fixed: dòng mới mot-loi — so merge-base thì sau gộp không còn khoá để thấy; nêu giá khi main sửa settings.json sau 0103d246 |
| P1 | contract | AC-3 lấy tệp đổi so nền cố định; nhánh gộp main thì liệt cả tệp PR khác; AC-3 không có bản phá. | Nhánh gộp main → E3 đỏ giả; hay thước lọc nhầm để lọt tệp ngoài vùng mà E3 vẫn xanh. | Tệp đổi lấy từ merge-base; thêm bản phá tệp ngoài vùng và config +2 dòng. | fixed: AC-3 đo từ merge-base với luật tập con (rỗng sau gộp vẫn đạt); AC-4/E4 thêm bản phá scripts/x.sh và config.yaml +2 dòng |
| P1 | evals | AC-2 chỉ đo hậu tố; đúng hậu tố nhưng sai tên gói vẫn xanh. | Gõ nhầm tên gói → Claude Code bỏ qua khoá, E1–E4 xanh. | E2 đọc manifest marketplace, đòi có gói dieu-phoi; bản phá tên lạ đúng hậu tố. | fixed: AC-2/E2 đọc ~/.claude/plugins/marketplaces/acceptance-gate-kit/.claude-plugin/marketplace.json (chỉ đọc); AC-4 thêm bản phá tên gói lạ |
| P2 | contract | Vế «không có tệp nào ở phạm vi user» của AC-3 không đo được bằng diff của kho. | Người thử sửa ~/.claude/settings.json; E3 vẫn xanh và hồ sơ khẳng định sai. | Ghi băm tệp user rồi so, hoặc bỏ vế này khỏi AC-3. | fixed: bỏ vế khỏi AC-3; OOS-3 ghi rõ không có thước máy cho vế này |
