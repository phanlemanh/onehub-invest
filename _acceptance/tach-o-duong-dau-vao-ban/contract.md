---
schema_version: 1
feature: Bộ tách ô đường (khoaDuong, luật judge và thẻ duyệt) xử đúng năm lớp đầu vào bẩn có thật trong DB máy thu, và ca probe đo dữ liệu thật ra khỏi suite chung sang chỗ chạy có người đọc
slug: tach-o-duong-dau-vao-ban
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-15
design_doc: docs/superpowers/specs/2026-11-15-tach-o-duong-dau-vao-ban-design.md
---

# Acceptance Contract: tach-o-duong-dau-vao-ban

## Context

Suite agent đỏ sẵn trên main d2b4beaf. Nguyên nhân là ca `CD-AC-8 probe ô đường thật` gặp «Hẻm 5 ,,1/ Đường chùa Pháp
thạnh», dữ liệu S06 đêm 14/11. Suite chung đỏ thì chặn mọi lượt chấm và ghim lại; nhãn «đỏ sẵn trên nền» không áp cho
suite. Hàng do GS giao (đợt dot0-cam-mau, ưu tiên số một), điểm xong: suite agent xanh trên bản chép DB máy thu mới
nhất.

Bảng phủ ca đo trên DB máy thu (15.413 giá trị, 102.345 tin) và cách sửa ở design doc §2–§4. Hai bản chép `khoaDuong`
(`agent/src/agents/judge-entity.ts`, `app/src/lib/ops/review-can-cu.ts`) sửa cùng một đoạn.

## Acceptance Criteria

- **AC-1** Given ô đường có cụm vị trí rồi đến dấu phẩy lặp hay khoảng trắng trước phẩy («Hẻm 5 ,,1/ Đường chùa Pháp
  thạnh», «Ngõ 5 , Kim Mã»), When so với ô chỉ mang tên đường («Chùa Pháp Thạnh», «Kim Mã»), Then `soDuong` ra Khớp hai
  chiều và luật không ghi `khac_duong`.
- **AC-2** Given ô đường mở đầu bằng số nhà trần rồi đến dấu phẩy («208, Nguyễn Hữu Cảnh, Phường 22, Quận Bình Thạnh,
  Tp Hồ Chí Minh», «46, Đường Điện Biên Phủ, Phường Hòa Khê, Quận Thanh Khê, Đà Nẵng»), When so với tên đường, Then ra
  Khớp hai chiều; và «Đường 70, Phường Phương Canh, Quận Nam Từ Liêm, Hà Nội» so với «Minh Khai» vẫn ra Thiếu (đường
  đánh số không khoá).
- **AC-3** Given cụm vị trí ngõ/ngách/hẻm/kiệt đứng sau chữ khác («Đường Kiệt 91 Lê Tân Trung», «Đường Kiệt 322 Đường
  Hải Phòng», «Số nhà 17 ngõ 60 Dương Khuê, Dịch Vọng Hậu, Cầu Giấy», «Ngách xxx Ngõ 364 Phố Giải Phóng»), When so với
  tên đường sau cụm, Then ra Khớp hai chiều.
  - So «Đường Kiệt 91 Lê Tân Trung» với «Tô Hiệu» thì ra Lệch.
  - «Đường số 7» với «Đường số 9» vẫn ra Lệch.
- **AC-4** Given bề rộng hẻm có số lẻ hay khoảng trắng trước gạch chéo giữa hai số, When so, Then:
  - «hẻm 3,5m Lê Văn Sỹ» ↔ «Lê Văn Sỹ» ra Khớp;
  - «Ngõ 2.5m» ↔ «Minh Khai» ra Thiếu;
  - khoá của «hẻm 3,5m, 1 trục thẳng thới tam thôn 16» không có «5m»;
  - «Hẻm 822 /131A HƯƠNG LỘ 2 BÌNH TRỊ ĐÔNG A, QUẬN BÌNH TÂN , TPHCM» ↔ «Hương Lộ 2 Bình Trị Đông A» ra Khớp;
  - «1/ TRẦN VĂN MƯỜI» ↔ «Trần Văn Mười» vẫn ra Khớp.
- **AC-5** (cross-layer) Given ma trận AC-1…AC-4 cộng ma trận cũ CD-AC-1…7, When chạy trên luật judge và trên bản thẻ
  duyệt rút từ `app/src/lib/ops/review-can-cu.ts`, Then hai bên ra cùng kết quả ở mọi cặp và các ca cũ vẫn xanh.
- **AC-6** Given glob suite agent (`tests/*.test.ts` của `agent/package.json`), When quét mọi tệp khớp tìm dấu probe
  dữ liệu thật (ca bỏ qua dưới CI vì «cần DB máy thu»), Then:
  - không tệp suite nào còn ca `CD-AC-8 probe ô đường thật`;
  - số ca probe dữ liệu thật mỗi tệp không vượt danh sách nợ đã đo (judge-entity-khong-dau 1, judge-luat 2,
    judge-entity-duong 0), nên một probe mới đưa vào suite thì đỏ;
  - ca probe nằm ở `agent/probes/o-duong-that.test.ts`, và `executors.test.judge_entity_duong` chạy cả tệp đó.
- **AC-7** (cross-layer) Given DB máy thu hiện tại, When chạy probe qua `executors.test.judge_entity_duong`, Then:
  - ca `CD-AC-8 probe ô đường thật` xanh như lúc ký;
  - ca `CD-AC-12 probe lớp ô đường thật` chọn trên DB máy thu mọi giá trị thuộc từng lớp L1–L5 (cụm ở bất kỳ vị trí
    nào), so khoá với bộ tách độc lập theo lớp, ra 0 lệch, và in số giá trị đã chọn theo lớp;
  - bản luật đột biến bỏ bước L3 làm ca này đỏ, gọi tên một giá trị L3;
  - `scripts/o-duong-that.sh` chạy probe: dữ liệu sạch thì in ✅ kèm số giá trị và dòng lớp, thoát 0; chế độ đột biến
    (`O_DUONG_DOT_BIEN=1`) thì in ❌ kèm giá trị lệch, thoát 1;
  - `scripts/audit-all.sh` gọi script đó trong mục «Ô đường thật» và đổi mã thoát thành `pass`/`fail`, nên bộ đếm FAIL
    mà `/ops-check` (bước 2) báo có tính mục này.
- **AC-8** Given bản chép DB máy thu mới nhất (`db/db-thu.sh`), When chạy `cd agent && npm test`, Then exit 0.

## Coverage

Quét theo preset test-matrix (design doc §2):
- **Trục A — lớp đầu vào × kết quả:**
  - L1 (AC-1), L2 (AC-2), L3 (AC-3), L4 + L5 (AC-4);
  - lớp đã đúng giữ nguyên: «/» treo, cụm đầu, số nhà, tháng, Eth, không dấu (AC-4, AC-5 qua CD-AC-1…7).
  - [CE: đếm từ DB máy thu 15/11, `research`: notes p4-tach-o-duong-bang-phu-ca.md]
- **Trục B — lớp chạy:** luật judge, thẻ duyệt app (AC-5). [CE: CD-AC-7 sẵn có]
- **Trục C — nơi đo:**
  - suite chung, ca cố định (AC-5, AC-6, AC-8);
  - eval hồ sơ, dữ liệu thật (AC-7);
  - /ops-check (AC-7).
  - [CE: luật «đỏ sẵn trên nền chỉ áp eval», GUIDE §7.1]

## Đường đo

Không có ô cơ hội (hàng do GS giao trực tiếp). Điểm xong đo bằng AC-8 (suite agent trên bản chép DB máy thu) và AC-7
(probe trên DB máy thu).

## Out of scope

- Typo từ vị trí («kiêt 90»), đuôi rác sau tên («… an lạc bình tân»), số nhà dính chữ («175/cô Giang»).
- Đọc tên đường bằng model; sửa dữ liệu nguồn hay thu thập S06 (làn ZCode).
- Đẩy cảnh báo chủ động (issue riêng tư) khi probe ❌ — /ops-check là kênh đọc của lát này.
- Dời bốn ca probe dữ liệu thật khác còn trong suite agent (KD-AC-6 phần b, hai ca LT-AC-6, ca đếm tin của
  context-resolver). Hiện chúng chưa đỏ, nên chỉ được khoá số bằng danh sách nợ của AC-6; dời là việc riêng (Hỏi-2).
- Sửa evals của ba hồ sơ đã ký dùng `judge_entity_duong` — executor chạy thêm tệp probe nên eval của chúng đo như cũ.

## Notes

- `_acceptance/config.yaml` cũng thuộc vùng hàng `ngoai-n-tu-dinh-tuyen-bat` (P2). Lát này chỉ sửa dòng executor
  `judge_entity_duong`; P2 nhận main sau.
