# Bản phạm vi — Mỏ neo «ở dự án B, tháp X, tầng A, căn nào giá tốt nhất» (14/11)

> Nguồn: phân tích chỉ đọc 14/11 trên DB máy thu (chuỗi danh bạ dự án → danh bạ căn → định vị tin → trung vị → căn giá tốt →
> hiển thị) và chín quyết định QĐ1–QĐ9 Mạnh chốt cùng ngày, ghi ở ROADMAP §3 mục 48; tóm ở kho tri thức riêng, trang
> `wiki/dot/mo-neo-1411.md`. Nguồn gọi bằng mã; S16 là danh mục do một chủ đầu tư tự công bố.
>
> **Thước của đợt**: số tin căn hộ đang rao được xếp hạng giá từ cấp dự án trở xuống và hiện trên màn (14/11: 0). Ba nhịp:
> nhịp 1 cấp dự án trên Ops (mốc MN1), nhịp 2 cấp toà ở Ocean Park 1 và Grand Park (MN2), nhịp 3 tầng, ngoài hai khu và lên
> Invest (MN3). Thứ tự hàng trong mốc là thứ tự làm.
>
> **Hàng có sẵn, sửa lời trong cùng PR** (không mang mã của bản này): DA3 thành lát đầy đủ, đứng sau `M1`; PL20 thành nhịp toà
> (gắn tin vào toà), nhịp trục và căn là `M2`; CG7, CG14 bỏ chuỗi CG5 → CG6 (QĐ3: máy tự hiện, chưa dựng rào); CG10 nhận thước
> tin thuê thiếu m² (QĐ4); TN1 thêm tệp tham số lượt chấm; `dung_tren` của DA7, CG10, GC2 sửa theo chuỗi mới.
>
> **Không vào bản phạm vi** (việc của người hay của làn thu — liệt «Ra khỏi kho» ở mô tả PR): lời ghi thật DV6, DA5 (QĐ1, QĐ2);
> người duyệt nháp nhãn PL35; gọi xác minh người bán; làn thu đóng gói bản thu S16 và hợp đồng dữ liệu; Mạnh dùng thật rồi đánh
> giá lại rào.

<!-- <<<PHAM-VI-MA -->
```
dot: mo-neo-1411
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/dot/mo-neo-1411.md#25d4d86af406a37bd41d0ce5f05dead8bc4e54b2

- `M1` — mã dự án S06 thành nút danh bạ, lát mỏng: đúc nút ứng viên hàng loạt qua thẻ luật theo nguồn, Mạnh xem mẫu (QĐ5)
- `M2` — gắn tin căn hộ hai khu vào trục và căn, nhịp sau của PL20 (QĐ6)
- `M3` — nạp S16 vào danh bạ dự án, phân khu, toà, căn; mã căn S16 là neo tin cậy cao nhất (QĐ7, quyết định S16 14/11)
- `M4` — thẻ duyệt toà S09 quyết được trên /ops/review và áp vào danh bạ (Ngoài-1 của DA31, Mạnh chọn mở hợp đồng mới 14/11)
- `N1` — bước gộp căn hằng ngày chèn link theo tập thay vì từng cụm; chạy lại itest của DA6 trên dữ liệu đầy đủ
- `N2` — bộ dò độ tươi S10 đo trên bảng stg thay vì bản thu (ngoài hợp đồng của khai-slo-s10-s11)
- `N3` — lược đồ mẫu của data-api bản công khai có v_ruler_p2, xong trước lần sync-public kế
- `N4` — DB thử của các suite áp migration của nhánh trước khi chạy (ưu tiên cao)
- `N5` — itest cho hàm tach() của bài thử nạp lại (ngoài hợp đồng số 3 của itest-nap-lai-migration-cu-sau-095)
- `N7` — lượt chấm local chạy đủ các chân test mà CI chạy (suite_keys so với job của .github/workflows), có ca kiểm so hai danh sách
- `N6` — typecheck app xanh khi không có .next: kiểu LayoutProps, PageProps của layout và /ops/data-flow (OOS-1 của CI1)
```
<!-- PHAM-VI-MA>>> -->
