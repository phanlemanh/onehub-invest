# Bản phạm vi — Nợ cắt hàng của giám sát (13/11)

> Nguồn: tệp nợ phiên giám sát gom trong đợt chạy 11–13/11 (việc đã lộ ra khi làm hàng khác mà chưa có hàng); ghi ở kho tri
> thức riêng, trang `wiki/dot/no-cat-hang-1311.md`. Mã giữ theo số mục của tệp nợ: `A1` là hàng đang chạy chưa có mã, `B2`–`B15`
> là việc phát triển. Mục `B6` tách theo nguyên nhân thành `B6a` (bộ rút câu không đọc được mã hiện hành) và `B6b` (ca phụ
> thuộc trạng thái dữ liệu chép từ máy thu) — đo ở `_acceptance/itest-nap-lai-migration-cu-sau-095/anh-em.md` trên nhánh của
> hàng đó.
>
> **Không vào bản phạm vi** (việc của người hay của kit — liệt «Ra khỏi kho» ở mô tả PR): dọn lược đồ tạm `td_*` trên DB máy
> thu; giao dãy cho TL1–TL4; cách xử các hàng chờ phiên nghiệm thu; lỗi của kit.

<!-- <<<PHAM-VI-MA -->
```
dot: no-cat-hang-1311
dang: lan-va
nguon: onehub-invest-tri-thuc:wiki/dot/no-cat-hang-1311.md#8930a18f0d39e9d314ff3b6fc06e2e166a265920

- `A1` — ghi dự án lên tin S03 từ sổ nhóm một dự án và từ tên dự án bài tự nêu (hàng du-an-tren-tin-s03-tu-nhom-va-ten đang chạy)
- `B2` — transform S06 gán tỉnh theo từng tin để bật được vùng thứ ba đang nháp
- `B3` — đo tỉ lệ gán phường và toạ độ cho ba vùng S06 mới sau lượt thu đầu, kèm ngưỡng
- `B4` — view sellers của migration 060 đọc thẳng bảng bản ghi, trái luật của migration 044
- `B5` — trang-thai-chao.itest AC-3 (kỳ vọng trục đóng băng) và AC-7 (B5/B4 không đổi) còn đỏ
- `B6a` — vocab-db.itest (bộ rút câu ref_* không đọc 081) và so-nhom.itest SN-AC-1/2 (bộ rút câu script thu S06) đỏ
- `B6b` — danh-ba-nguoi.itest AC-8, HD13 E7 và the-duyet-nguoi.itest TN-AC-10 đỏ vì phụ thuộc dữ liệu chép từ máy thu
- `B7` — props trang /ops/quality sai kiểu (TS2344 khi typegen cũ), sửa gốc thay vì dựa vào typegen
- `B8` — ca kiểm plist tự bỏ qua khi máy thiếu plutil, nên khai có tên trong scripts/ci-bo-qua.json
- `B9` — sao lưu mã hoá: khoi-tao đòi tệp da-cat-khoa trước khi mật khẩu tồn tại, ngược checklist cho người
- `B10` — lượt chạy định kỳ các itest không chạy trên CI (cần DB máy thu)
- `B11` — lịch thu hiện trên Ops
- `B12` — DA10 lát hai khu (Ocean Park 1, Grand Park): toà S09 vào danh bạ cho hai khu trước
- `B13` — PL20: tập nhãn 300–450 bài cho ghép tin vào danh mục; sửa dung_tren của PL20
- `B14` — dọn tên nguồn thật còn trên kho công khai, kèm chặn tên mới bằng máy
- `B15` — bộ nạp S10: chuỗi rỗng và null thành mã dự án 0; test dựng DDL chép tay (làn thu)
```
<!-- PHAM-VI-MA>>> -->
