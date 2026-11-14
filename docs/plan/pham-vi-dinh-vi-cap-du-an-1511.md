# Bản phạm vi — Dự án của tin lên ô Định vị (15/11)

> Nguồn: điều tra 15/11 «vì sao lộ trình chậm và vì sao 0 tin được định vị» (phiên DT, chỉ đọc) và bảng phủ ca của U1,
> ghi ở kho tri thức riêng, trang `wiki/dot/dinh-vi-cap-du-an-1511.md`. GS giao 15/11, chọn đường A (một nguồn chung
> trong DB, migration 105, hạng T3). Nguồn gọi bằng mã: S03 nhóm cộng đồng, S05 mạng xã hội, S06 trang rao.
>
> **Vấn đề.** Màn Ops «Chất lượng từng chặng» báo Định vị = 0 cho mọi nguồn vì `pipeline/sql/600_data_flow.sql` nối ô
> vào một CTE rỗng (#377), trong khi 4.934/6.102 tin S03 đã mang dự án qua phát biểu `project_node_id` (DV6). Bậc B2 của
> thang dữ liệu (`offer_located()` của 087) cũng trả false cứng. Không hàng nào của lộ trình nối chúng; DS2 chỉ nói S06
> và còn đòi cột trên tin, căn cùng sync-cloud.

dot: dinh-vi-cap-du-an-1511
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/dot/dinh-vi-cap-du-an-1511.md#27dde04ad0671d70159c98831dd97f745a69d458

- `DV7` — Một nguồn «dự án của tin» chung cho mọi nguồn (view `offer_project`, migration 105, chỉ máy thu): S03, S05 theo
  bài qua phát biểu `project_node_id`, S06 qua `s06_offer_project`; nối ô Định vị của `600_data_flow.sql` và bậc B2
  (`offer_located()`); định vị cấp dự án, «chờ khớp» giữ nghĩa cấp toà.
