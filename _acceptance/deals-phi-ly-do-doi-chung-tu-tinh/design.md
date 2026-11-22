# Thiết kế: deals-phi-ly-do-doi-chung-tu-tinh

## Vấn đề

`scripts/deals-phi-ly-do.mjs` là đường đo của hồ sơ `deals-loai-tin-phi-ly` (E7, cmd
`config:executors.script.deals_phi_ly_do`). Lệnh đo có một đối chứng: «bản chưa loại còn ≥ 1 tin phi lý» — chứng phép đo phân
biệt được danh sách đã loại với danh sách chưa loại. Đối chứng hiện đọc danh sách `cu` bằng `dealsSql()` trên trạng thái DB
TRƯỚC khi gọi `refreshBaitGap` trong giao dịch. Nhưng bước đêm đã chạy chính luật loại và commit: tin phi lý đã mất
`bait_gap_pct`. Nên `cu` cũng đã sạch, và đối chứng đỏ dù luật đúng (P4 báo 31/10; đo lại 19/11 trên DB máy thu: «FAIL đối
chứng: bản chưa loại còn 0 tin phi lý», mọi kiểm khác xanh).

Đo thêm 19/11 (giao dịch ROLLBACK): kể cả tính lại số giảm mà không chạy luật loại, danh sách vẫn 0 tin phi lý — tin phi lý duy
nhất trong DB (thiếu diện tích) giảm 52,8%, quá trần 50% của danh sách. Vậy dữ liệu thật không bảo đảm có tin phi lý trong danh
sách; đối chứng dựa vào dữ liệu thật thì đỏ hay xanh theo ngày.

## Cách làm (chọn)

Đối chứng tự dựng tin phi lý trong một SAVEPOINT của giao dịch, rồi lùi về SAVEPOINT trước phần đo chính — các kiểm chính chạy
trên dữ liệu nguyên, không mất tin đầu danh sách:

1. Trong `BEGIN … ROLLBACK` (như cũ), lấy danh sách hiện tại. Danh sách rỗng → không dựng được đối chứng: kiểm đỏ ghim
   «không dựng được tin đối chứng», lượt đo không đạt.
2. `SAVEPOINT doi_chung`. Chọn tin đầu danh sách (đang hợp lý, số giảm trong khoảng danh sách) làm **tin đối chứng**; đặt
   `area_m2 = NULL` cho nó → tin ấy phi lý lý do `thieu-dien-tich`, số giảm còn nguyên.
3. Danh sách `cu` (trước luật) đọc lại bằng `dealsSql()` → phải chứa tin đối chứng: «đối chứng: bản chưa loại còn k tin phi lý».
4. Chạy bước đêm (`refresh`, mặc định `refreshBaitGap`); dòng audit `bait-gap:loai-phi-ly` của lượt phải chứa mã tin đối chứng
   («luật loại bắt tin đối chứng»). `ROLLBACK TO SAVEPOINT doi_chung`.
5. Phần đo chính như cũ trên dữ liệu nguyên: bước đêm, «loại: …», «5 tin đầu: …», ba kiểm không-tin-phi-lý, kiểm đầu danh
   sách ≤ 35%.
6. ROLLBACK; đếm + băm `offer_id:bait_gap_pct:area_m2` của `sale_offers` và số dòng audit `bait-gap:loai-phi-ly` trước/sau bằng
   nhau («DB không đổi»).

Bản đầu dựng đối chứng trên chính lượt đo chính; phản biện context sạch chỉ ra nó làm kiểm «đầu danh sách ≤ 35%» và «5 tin đầu»
đọc danh sách đã mất tin đầu (`gap-probe.md` P0) — nên đối chứng tách vào SAVEPOINT.

Lõi đo tách thành hàm `doTrongGiaoDich(c, { refresh, log })` chạy trong giao dịch của người gọi, trả danh sách kiểm; phần chạy
trực tiếp giữ dòng in và mã thoát. `refresh` mặc định là `refreshBaitGap`; test truyền bản hỏng để chứng chiều đỏ.

## Lối khác đã bỏ

- **Chèn tin tổng hợp mới** (mã riêng, chép thuộc tính tin đầu): phải chép đủ cột cho `dealsSql()`, và nếu chép cả
  `property_offers` thì đổi thước `v_ruler_p2`; sửa diện tích tin thật trong SAVEPOINT đơn giản hơn và lùi trọn.
- **Tính lại số giảm mà tắt luật loại** (chặn câu ghi của luật bằng client bọc): vẫn phụ thuộc dữ liệu thật — đo 19/11 ra 0 tin
  phi lý trong danh sách.
- **Sửa `pipeline/refresh-bait-gap.mjs` cho cờ tắt luật**: ngoài ranh giới hàng; luật bên ghi không nên mang cờ chỉ phục vụ đo.
- **Bỏ đối chứng**: mất bằng chứng phép đo phân biệt — đúng lớp lỗi «thước chưa từng đỏ».

## Kiểm bằng test

`app/tests/deals-phi-ly-do.test.tsx`, lược đồ riêng trong giao dịch (khuôn của `deals-phi-ly.test.tsx`), fixture: thước bịa năm
căn + tin P1 hợp lý, số giảm do `refreshBaitGap` thật đặt (trạng thái sau bước đêm — không tin phi lý nào trong danh sách):

- lành: mọi kiểm xanh, gồm đối chứng và «luật loại bắt tin đối chứng»; sau lượt tin đối chứng còn diện tích và đứng đầu;
- phá: `refresh` là `refreshBaitGap` thật chạy qua client bọc bỏ hai câu ghi của luật loại (ghim đúng 2 câu bị chặn) → đỏ, ghim
  «luật loại bắt tin đối chứng»; ba kiểm không-tin-phi-lý vẫn xanh vì dữ liệu không có tin phi lý thật — chính tình huống đối
  chứng phải phân biệt;
- rỗng: không tin nào trong danh sách → đỏ, ghim «không dựng được tin đối chứng»;
- đầu danh sách: chỉ một tin ≤ 35% → kiểm «đầu danh sách ≤ 35% (DB còn 1 …)» xanh, không rơi vào lối thoát.

«DB không đổi» đo ở phần chạy trực tiếp trên DB thật (E4).

## Ngoài phạm vi

- Lệnh đo dùng `dealsSql()` mặc định (thước CG8); trang Căn giá tốt đã có đường `coBang` (CG9, `offer_price_rank`). Đổi đường
  đo theo CG9 là việc riêng.
- Trần 50% của danh sách che tin phi lý giảm sâu (52,8%) — đúng thiết kế danh sách, không thuộc hàng.
