# Bản phạm vi — sản phẩm phía sau, chờ quyết định hoặc chờ nền (23/10)

> Nguồn: khảo sát «tồn đọng & hậu kỳ» lượt cắt chung 23/10 — ROADMAP §4 Track 1–4 (mục ⬜), FRAMING §7 câu mở,
> review phân loại §4 (Q8b), hồ sơ `enrich-qua-de-xuat` Out of scope, ADR-0007 sửa đổi theo PR #19.
> Mọi mã ở đây đều chưa cắt được thành hàng vì chờ một quyết định của Mạnh hoặc một hàng nền chưa giao — chúng là
> mục chờ điều kiện, có lý do và điều kiện mở lại. Hoãn có chủ đích, KHÔNG đưa vào (audit §6): A6 advisor/compaction,
> M5 pgvector, P-C advisor chat, G-2.5 pHash ảnh.

<!-- <<<PHAM-VI-MA -->
```
dot: san-pham-sau-2310
dang: lan-va
nguon: khảo sát tồn đọng & hậu kỳ lượt cắt chung 23/10 (ROADMAP §4, FRAMING §7, review §4, ADR-0007 sửa đổi), xem docs/plan/BOI-CANH.md

- `TD5` — nới PII_EXCLUDE cho cột người bán và đưa liên hệ người bán trở lại cổng Invest
- `TD6` — gỡ hoặc đổi tên nguồn thật S01/S04/bộ dữ liệu mở trên cổng Invest
- `TD26` — S06 lộ SĐT theo từng tin (tối đa 50/ngày, top deals)
- `TD10` — E5 học alias mới vào asset_nodes từ quyết định duyệt
- `TD24` — asset_nodes thêm phân khu/subzone và geo-polygon
- `TD18` — ghép listing Airbnb với tin rao bán
- `TD23` — Kev-V media gate và VLM collage
- `TD19` — MCP server tools (gom C3-wrap và data-api)
- `TD20` — consolidation đêm bằng Qwen local, gắn source và evidence
- `TD21` — form hồ sơ nhà đầu tư và export JSON có consent
- `TD22` — G4 quản lý danh mục sau mua (comps giá đêm)
- `TD27` — tin «tìm mua / tìm thuê» thành tín hiệu cầu
- `TD28` — luật hiển thị và gỡ tin của môi giới, kênh báo «tin sai»
- `TD29` — môi giới «nhận căn» để xác nhận hoặc sửa
```
<!-- PHAM-VI-MA>>> -->
