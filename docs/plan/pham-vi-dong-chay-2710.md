# Bản phạm vi — Dòng chảy dữ liệu /ops/data-flow sau DF0 (27/10)

> Nguồn: design doc `docs/superpowers/specs/2026-10-26-ops-dong-chay-du-lieu-ia-design.md` §3.4 (thứ tự làm DF0–DF5,
> Mạnh duyệt 5 khuyến nghị §5 ngày 26/10), chưng cất ở trang tri thức `chu-de/dong-chay-du-lieu.md`. DF0 đã giao (PR
> #136, hồ sơ `ops-dong-chay-df0`); hai hàng tách từ Cổng Bằng chứng DF0 (`df0-dem-de-xuat-lam-giau`,
> `df0-chang-theo-ngay-diem-0`) đi riêng. Thứ tự 27/10: Mạnh chốt «đội vận hành qua cloud» → DF1 (số chặng lên cloud)
> đứng đầu; DF2–DF3 sau DF1 (LUAT.md đợt dieu-phoi-dot0-cam-mau, mục «27/10 ~00:15Z — DF1 lên trước»).
> Nguồn gọi bằng mã: S03 nhóm chat cộng đồng · S05 nhóm mạng xã hội · S06 rao vặt công khai.
>
> Không có việc của người trong đợt này. Hồ sơ tin trang riêng `/ops/offers/[id]` (quyết định §5 câu 3) nằm ở hàng
> TV10 đã có, không cắt lại.

<!-- <<<PHAM-VI-MA -->
```
dot: dong-chay-2710
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/chu-de/dong-chay-du-lieu.md#c8fda8c16b6a3c754ea9dcda0dab5f5197cb3514

- `DF1` — một định nghĩa số chặng + bậc tính sẵn ở pipeline/sql trên máy thu, Thu thập và Dòng chảy cùng đọc; khối bản tin đẩy lên cloud qua push-ops-facts để /ops/data-flow trên prod có số
- `DF2` — thẻ điểm tin trong hồ sơ tin (độ chắc, lượng bằng chứng, cờ phi lý) + điều kiện còn thiếu để lên bậc kế, luật thuần có test
- `DF3` — bảng chặn bậc: mỗi nút thắt bao nhiêu tin kẹt, kèm tin mẫu
- `DF4` — lăng kính nguyên tắc T1–T8 trên dòng chảy; ba dòng «chưa đo được» trỏ PL7/PL9/PL15
- `DF5` — dọn IA: bỏ cột tin rao khỏi Thu thập, link hai chiều Thu thập ↔ Dòng chảy, portals.md thêm luật ranh giới trang = ranh giới hợp đồng dữ liệu, gạch UH4
```
<!-- PHAM-VI-MA>>> -->
