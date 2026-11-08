# Bản phạm vi — Danh bạ dự án, phân khu, toà, căn (08/11)

> Nguồn: `docs/plan/ke-hoach-danh-ba-du-an-0811.md` bản 2 (đã gộp ở PR #364), Mạnh duyệt «Theo khuyến nghị» ngày 08/11. Quyết định nằm ở
> ROADMAP §3 mục 38, 39. Nguồn gọi bằng mã: S06 rao vặt công khai, S03 nhóm cộng đồng, S08 danh mục dự án, S07 cổng rao (phần danh
> mục), S09 nguồn danh mục mới.
>
> **Kết luận.** Gắn tin vào dự án, phân khu, toà bằng dữ liệu sẵn có trước, rồi mới thu thêm. Dọn nền gồm bốn việc: mở danh bạ vật thể
> cho 34 tỉnh, mở chỗ ghi dự án/phân khu/phường trên tin (phải trước GCQ2), làm bảng nối mã đa nguồn có người duyệt, và đưa từ vựng
> theo mục 39. Mã căn S06 và khoá gộp căn đứng ngay sau mốc GCM1 (Hỏi-5). Phần thu thuộc ZCode: trần, nhịp, đường thu do ZCode chọn.
>
> **Đối chiếu mã tạm của kế hoạch → mã chính thức:**
>
> | Kế hoạch | Mã | Kế hoạch | Mã |
> |---|---|---|---|
> | DR1 + DB1c | `DA1` | DA1b | `DA8` |
> | DF1 | `DA2` | DA4 | `DA9` |
> | DA3 | `DA3` | Z1a | `DAZ1` |
> | DA0a + DA0b | `DA4` | DA5 + DO-S09 | `DA10` |
> | DA1 | `DA5` | Z1b | `DAZ2` |
> | DC1 | `DA6` | Z2 | `DAZ3` |
> | DA2 | `DA7` | DA7 | `DA11` |
> | DA6 | `DA12` (chờ) | DA8 | `DA13` |
> | DA9 | `DA14` | Z3 | `DAZ4` (chờ) |
>
> **Hàng có sẵn, không gánh lại mà sửa:** `GCQ2` đứng thêm trên `DA2`. `PX2` thêm việc nối 142 dự án S08, chỉ hứa toà–trục–căn cho 83
> dự án cao tầng, đứng thêm trên `DA1`, `DA3`. `DS2` mở rộng: trường ở `DA2`, mã nối ở `DA7`, mốc ≥ 30% tin căn hộ S06 có dự án. Sửa lời
> theo mục 38: `DN2`, `DN4`, `GC2`, `GC3`, `PL10b`. `DN1`, `GN1` đã ký nên không sửa.
>
> **Ngoài phạm vi:** `collector/` và cách thu (làn ZCode) · ghi thẳng cột `kind`, `area_m2`, `price_vnd` (C4 của bản đối chiếu, cắt
> riêng sau `DA6`).

<!-- <<<PHAM-VI-MA -->
```
dot: danh-ba-du-an-0811
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/chu-de/danh-ba-du-an.md#edb1ed9c0173dacf34754cae052cffc6b19eea8b

- `DA1` — danh bạ vật thể dựng được toà ở cả 34 tỉnh, chủ đầu tư ghi đúng phương pháp
- `DA2` — tin ghi được phát biểu dự án, phân khu, phường
- `DA3` — bảng nối mã dự án đa nguồn có thẻ duyệt và bí danh nút vùng
- `DA4` — từ vựng và mappings theo mục 39
- `DA5` — mã căn S06 sạch, toà S06 thành phát biểu
- `DA6` — mỗi tin thuộc nhiều nhất một căn, đổi giá không sinh căn
- `DA7` — nối 282 dự án S06 có từ 10 tin
- `DA8` — ba nút Grand Park theo luật dự án con, phân khu
- `DA9` — phường suy từ dự án nằm trọn một xã
- `DA10` — toà S09 vào danh bạ, đo phủ và phân giải để mở thu toàn bộ
- `DA11` — dự án S07 vào bảng nối, thuộc tính dự án thành phát biểu
- `DA12` — lô thấp tầng S08 có khoá
- `DA13` — trang dự án trên Invest
- `DA14` — chỉ số mức gắn mỗi đêm
- `DAZ1` — thu thử S09 Ocean Park 1 và Grand Park
- `DAZ2` — thu toàn bộ S09
- `DAZ3` — thu phần danh mục của S07
- `DAZ4` — khảo sát nguồn nhà nước về dự án
```
<!-- PHAM-VI-MA>>> -->
