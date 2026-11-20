# Bản phạm vi — các hàng cắt ngày 20/11 sau cuộc soát nguồn và đồng bộ trên Ops

Cuộc soát chỉ đọc ngày 20/11 (nguồn và đồng bộ của nó trên Ops, 11 phát hiện L1–L11) cùng bản đề xuất đo nguồn kho cho ra các hàng
dưới đây. Số đo và nơi giữ định nghĩa ở trang tri thức của đợt (kho tri thức riêng). Quyết định đi kèm: ROADMAP §3 mục 58, 59, 60.

Lời Mạnh làm căn cứ:
- 20/11 02:27Z, phiên rà soát, bốn câu Cổng Phạm vi của khung đo nguồn kho: «Theo khuyến nghị» — căn cứ của NK1–NK4.
- 20/11 ~01:55Z, phiên giám sát: «Cho áp» bảng `offer_price_rank` lên cloud; sau đó `/ops/deals` cloud tải 60–100 giây — căn cứ của CG19.
- GT5 Hỏi-1 (`_acceptance/khoa-gom-hai-tang/decisions.jsonl`, `d-20261119T152224Z-6`), Mạnh duyệt 20/11 — căn cứ của DA51.

Việc đi kèm, không thành mã (ra khỏi kho, liệt ở mô tả PR): Mạnh đăng nhập lại S02 khi có trình duyệt chuyên dụng; huỷ gói Apify;
làn thu nạp bù S07, S10 và đặt ba lịch.

<!-- <<<PHAM-VI-MA -->
```
dot: sau-soat-nguon-2011
dang: lan-va
nguon: onehub-invest-tri-thuc:wiki/dot/sau-soat-nguon-2011.md#571f282c4201f107330fa3a28e4f7de283ad776f

- `DA51` — bốn tên viết tắt phân khu (ori, rb, bs, gh) vào bí danh của nút phân khu qua thẻ luật có băm, đảo được, để bước đọc phân khu của GT5 lấy từ danh bạ
- `ZC13` — bộ thu S02: lượt ném lỗi giữ thư mục tạm ẩn, dừng ngay khi token ứng dụng hết hạn, xác thực hỏng ghi dòng AUTH FAIL
- `NK1` — sổ nguồn khai họ nguồn, nhịp, tổng thể, bảng nạp; độ tươi đọc nhịp từ sổ, đo nguồn kho qua bảng nạp; thêm dòng S09, S17
- `NK2` — thước vận hành và biến động của nguồn kho trên trang Thu thập: lần thu gần nhất, số dòng nạp, biến động, cảnh báo co rút
- `NK3` — phễu và phủ của nguồn kho, đi cùng các hàng danh bạ toà
- `NK4` — chất lượng nguồn kho, mở lại DA20
- `CG19` — trang Căn giá tốt trên cloud tải trong vài giây thay vì 60–100 giây
- `TV19` — trên cloud, nhãn nguồn ở ba trang Ops chỉ là mã kèm vai trò, không còn tên nguồn thật ở chữ hay trong DOM
```
<!-- PHAM-VI-MA>>> -->
