# Bản phạm vi — Bảng Yêu cầu (10/11)

> Nguồn: phân tích chỉ đọc 10/11 trên DB máy thu (phiên phân tích bảng Yêu cầu), ghi ở kho tri thức riêng, trang
> `wiki/chu-de/bang-yeu-cau.md`. Mạnh «Đồng ý theo khuyến nghị» ngày 10/11 cho năm câu Q1–Q5, ghi ở ROADMAP §3 mục 43. Nguồn gọi
> bằng mã: S03, S05 nhóm cộng đồng.
>
> **Kết luận.** Bài Yêu cầu (người cần thuê, mua) hiện chỉ được nhận ra lúc chạy transform rồi bỏ; chưa có bảng nên không đếm,
> lọc hay ghép được với tin rao. S03 có 11.616 bài Yêu cầu trên 67.202 bài có chữ; luật hiện có bỏ sót thêm khoảng 1.300 bài viết
> tắt. Số phòng ngủ đọc được 96%, ngân sách 73%, dịch vụ suy được 86% (thuê khoảng 78%); phường gần như không có trong chữ, dự án
> suy theo tên nhóm được 42%. 670 người đăng, 317 người viết 94% số bài, 48% số bài là môi giới «có khách». Bài giống hệt chỉ lặp
> trong cùng ngày: gom theo người và chữ còn 4.832 nhu cầu nhưng không theo được nhu cầu qua nhiều ngày.
>
> **Hàng có sẵn ngoài lộ trình:** bảng `inquiry_records` (migration 058, `pipeline/lib/yeu-cau.mjs`) đã dựng ở nhánh
> `feat/bang-yeu-cau`, Mạnh ký Cổng Bằng chứng 30/10, chưa có PR; nhánh đứng trên PL5 và chậm main gần 2.000 commit. YC0 nối lại
> nhánh này với nguồn ý định theo Q1, lấy số migration kế tiếp; YC1 gánh các lỗi bộ đọc ngân sách mà Mạnh dặn sửa trước khi áp
> bảng lên máy thu (Ngoài-4/5/7/9/10/11 của hồ sơ cũ).
>
> **Ngoài phạm vi:** định vị tin rao S03 (DV2–DV5, PL20) và gom tin rao (GT5–GT8) — dãy khác giữ, YC3 dùng chung bộ định vị ·
> Kev (PL5) — thêm vào làm một lớp ý định khi giao · đọc bài chỉ có ảnh (KC4) · gửi tin cho người đăng Yêu cầu — máy không tự
> gửi gì (luật 7, an toàn Zalo).

<!-- <<<PHAM-VI-MA -->
```
dot: bang-yeu-cau-1011
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/chu-de/bang-yeu-cau.md#7176736f250e19dba7c67fd0e32c44035894eb1c

- `YC0` — nối bảng inquiry_records vào main: ý định lấy từ luật laYeuCau và nhãn model đọc tin, lớp cao nhất thắng, không chờ PL5
- `YC1` — sửa bộ đọc ngân sách của Yêu cầu (Ngoài-4/5/7/9/10/11 và các cách viết «tc 8tr», «2ty6», «6tr5», «quay đầu»)
- `YC2` — mở rộng luật nhận Yêu cầu cho bài viết tắt, đo precision và recall trên nhãn bạc và mẫu đọc tay
- `YC3` — Yêu cầu nhận dự án, phân khu, toà bằng cùng bộ định vị mức bài của tin S03
- `YC4` — gom mềm nhu cầu trong 7 ngày (người, dự án, dịch vụ, số phòng, ngân sách ± 15%) và hết hạn sau 7 ngày không có bài mới
- `YC5` — người vận hành tra Yêu cầu ở /ops/inquiries: bảng có lọc, ngăn chi tiết với tiêu chí, bài đăng, người đăng
- `YC6` — ghép Yêu cầu với tin rao theo RESO ContactListings, người bấm Có thể hay Bỏ, máy không gửi gì
- `YC7` — chỉ số cầu theo dự án × dịch vụ × số phòng × tuần tính sẵn ở pipeline, hiện trên Ops
- `YC8` — chỉ số cầu lên cloud và cổng Invest (không có từng Yêu cầu), bật sau 4 tuần đo trên Ops
```
<!-- PHAM-VI-MA>>> -->
