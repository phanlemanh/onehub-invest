# airbnb-nghi-khong-hoi-sinh — listing Airbnb nghỉ ngoài phường không bị reassign-areas đánh thức bằng toạ độ cũ

Hàng P2 của đợt `dot0-cam-mau`, Ngoài-4 của PL14 (`nap-lai-khong-xoa`, Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng
26/10). Cổng Đáng `build` (giám sát, P2-71). Hạng T2: một đường ghi của pipeline, không migration, không UI.

## 1. Lỗi

`transform-airbnb.mjs` `ghiListing` thấy toạ độ của lần thu mới nhất nằm ngoài mọi phường (hoặc thiếu toạ độ).
Khi đó nó cho listing nghỉ bằng:

```sql
UPDATE listing_records SET retired_at = now(), retired_reason = 'ngoai_phuong' WHERE id = $1 AND retired_at IS NULL
```

Câu này không ghi toạ độ mới, nên bản ghi còn giữ toạ độ CŨ (nằm trong phường). Lịch đêm chạy
`reassign-areas.mjs` ngay sau transform VN (pipeline/CLAUDE.md «Sau MỌI transform VN»). Bước 2 của reassign xét lại
mọi listing `retired_reason = 'ngoai_phuong'` (quyết định PL14 `d-20261026T083857Z-20`: quay lại phường thì sống lại).
Nó làm point-in-polygon trên toạ độ đang có trong bản ghi, tức toạ độ cũ, nên thấy listing «trong phường» và gỡ nghỉ.
Kết quả: căn đã rời phường hiện lại trên cổng với toạ độ, tên và giá của lần thu trước.

Đo DB local 27/10, nối snapshot Airbnb mới nhất của từng listing với bản ghi (số «0 nghỉ `ngoai_phuong`» một mình
không đủ, vì lỗi làm căn nghỉ rồi sống lại ngay trong cùng đêm):
- 611 bản ghi đều sống, toạ độ trong phường, khớp đúng snapshot mới nhất;
- 23 listing có snapshot mới nhất ngoài mọi phường nhưng chưa từng có bản ghi (OOS-1);
- 0/853 snapshot trong 30 ngày thiếu toạ độ.

Không có căn nào đang sống sai, nên không cần dọn dữ liệu. Lỗi sẽ xảy ra ngay khi một căn đã có bản ghi đổi toạ độ ra
ngoài vùng hoặc payload mất toạ độ.

## 2. Thiết kế

Sửa ở gốc, tức đường ghi. Giữ nguyên luật của reassign: reassign xét lại listing nghỉ ngoài phường **bằng toạ độ hiện
có trong bản ghi**. Điều cần bảo đảm là toạ độ ấy luôn là toạ độ của lần thu mới nhất.

Nhánh cho nghỉ của `ghiListing` đổi thành:

```sql
UPDATE listing_records
   SET latitude = $2, longitude = $3,
       geom = CASE WHEN $2::float8 IS NULL OR $3::float8 IS NULL THEN NULL
                   ELSE ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography END,
       retired_at = COALESCE(retired_at, now()),
       retired_reason = COALESCE(retired_reason, 'ngoai_phuong')
 WHERE id = $1
```

- Toạ độ (và `geom`) luôn là của lần thu mới nhất. Payload thiếu toạ độ thì ghi NULL. Reassign bỏ qua listing không
  toạ độ, nên listing ở nghỉ tới lần thu có toạ độ. Luật «thiếu toạ độ → nghỉ» đã có từ PL14 (reassign-areas bước 3);
  lối «thiếu toạ độ thì không cho nghỉ» là đổi luật đó, không thuộc hàng này.
- Listing đang nghỉ thì GIỮ mốc `retired_at` và `retired_reason` cũ. Mốc nghỉ không trôi theo lịch đêm, và lý do
  khác (`doi_khoa`) không bị ghi đè thành `ngoai_phuong`.
- Listing chưa có bản ghi mà lần thu đầu đã ngoài phường thì vẫn không chèn (hành vi hôm nay, ngoài phạm vi).
- Reassign không đổi. Listing nghỉ có toạ độ MỚI rơi vào một phường hợp lệ vẫn được gỡ nghỉ. Ca này có thật: ranh
  phường được nạp lại sau transform, và toạ độ mới khi ấy là hiện hành nên đánh thức là đúng.

Lối khác đã loại:
- **Cho reassign không đụng listing nghỉ bởi transform** (cờ/lý do nghỉ riêng): phải thêm giá trị `retired_reason`,
  tức một migration T3. Nó còn bỏ luôn ca đánh thức đúng ở trên. Gốc sai là toạ độ cũ, không phải reassign.
- **Giữ toạ độ cũ khi payload thiếu toạ độ**: reassign sẽ đánh thức bằng toạ độ cũ, đúng lỗi đang sửa.

## 3. Quét không gian (Zwicky, rút gọn)

Trục A (trạng thái trước lượt thu): sống | nghỉ `ngoai_phuong` | nghỉ lý do khác | chưa có bản ghi.
Trục B (toạ độ lần thu mới nhất): trong phường | ngoài mọi phường | thiếu.
Trục C (bước của lịch đêm): sau `ghiListing` | sau `reassign-areas`.

| A × B | Sau ghiListing | Sau reassign | Nhãn |
|---|---|---|---|
| sống × ngoài | nghỉ, toạ độ mới | vẫn nghỉ | Core (AC-1, AC-2) |
| sống × thiếu | nghỉ, toạ độ NULL | vẫn nghỉ | Core (AC-3) |
| nghỉ ngoai_phuong × ngoài (toạ độ khác) | nghỉ, toạ độ mới, mốc nghỉ cũ | vẫn nghỉ | Core (AC-4) |
| nghỉ lý do khác × ngoài | lý do + mốc giữ, toạ độ mới | không xét (reassign chỉ xét ngoai_phuong) | Core (AC-4) |
| nghỉ × trong | sống lại (upsert) | sống | hồi quy (AC-5) |
| nghỉ ngoai_phuong, toạ độ hiện hành vào phường (ranh nạp lại) | — | sống lại | hồi quy (AC-5) |
| sống × trong | sống | sống | hồi quy, ND-AC-6 có sẵn |
| nghỉ ngoai_phuong (toạ độ cũ trong phường) × thiếu | nghỉ, toạ độ NULL, mốc cũ | vẫn nghỉ | Core (AC-4 dòng 3) |
| chưa có × ngoài/thiếu | không chèn | — | Later (OOS-1) |

Đi ngang mọi ô: đêm (`nights`) và `listing_stats` không đổi; không câu `DELETE` (đã có răng `scan-delete`).
Chân ngành: «vị trí của bản ghi là của lần quan sát mới nhất». Đây là nếp của mọi bảng ghi lịch sử nguồn
(RESO `ModificationTimestamp`). Ở đây nó được chứng bằng lỗi thật, không cần đối chiếu sâu thêm.

## 4. Đo

Test DB mới `pipeline/scripts/airbnb-nghi.itest.mjs`, mỗi ca chạy trong BEGIN … ROLLBACK. Fixture là một listing thật
có đêm và thống kê, dùng `ghiListing` và `runReassign` thật. Ca AC-2 có đối chứng cặp: cùng fixture, chạy câu cũ (chép
nguyên văn vào test làm hằng `CAU_NGHI_CU`) rồi reassign. Listing phải sống lại, chứng phép đo phân biệt được bản sửa.

Luật đo của giám sát (27/10): reassign-areas cập nhật hàng loạt `listing_records` và `areas`. Vì vậy test chạy trên DB
thử riêng `oneinvest_p2_airbnb` (`bash db/db-thu.sh`), không chạy trên `oneinvest` :5433 dùng chung. Hàng này không
có migration nên không cần bước áp sau merge.
