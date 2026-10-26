# Tin rao và bước gán theo toạ độ chỉ gán vào phường hợp lệ — thiết kế

Hàng `tin-rao-gan-khu-vuc-dung` (P3, Ngoài-1 của AU9). Ô cơ hội: `_acceptance/tin-rao-gan-khu-vuc-dung/opportunity.md`.

## 1. Hiện trạng (đo DB local 26/10 sau lượt dọn AU9)

AU9 thêm `phuongHopLe(p)` vào `pipeline/lib/osm.mjs`: `meta->>'source' = 'osm-phuong' AND NOT (meta ? 'lac')`.
reassign-areas (PIP) và hai câu PIP của transform-airbnb đã dùng nó. Bốn bước gán khác tự viết câu chọn khu vực:

| Bước | Cách gán | Câu chọn khu vực hiện tại |
|---|---|---|
| `transform-zalo.mjs` (S03) | khớp tên phường trong chữ (`matchPhuong`) | `parent_id = 'vn-hanoi' AND region_type = 'submarket'` |
| `transform-fb.mjs` (S05) | khớp chữ | `region_type = 'submarket' AND parent_id IN ('vn-hanoi','vn-hcmc')` |
| `transform-chotot.mjs` (S06) | tên `ward_name_v3` → `ward_name` → khớp chữ | như transform-fb |
| `transform-hcmc-simple.mjs` | PIP listing `vn-hcmc` | `a.parent_id = 'vn-hcmc' AND a.geom IS NOT NULL` |

Số đo: 0 khu vực lạc (lượt dọn có cờ của AU9 vừa xoá 34); 11 khu vực `airbnb-discovery` dưới `vn-hanoi`; 9 tin S05 gắn
vào bốn khu vực «Quận …» `airbnb-discovery`; S06 18.472/18.472 tin có phường, S03 2/269, S05 13/28. Không ai gọi
`transform-hcmc-simple.mjs` theo lịch (chỉ chạy tay); ba transform tin rao chạy hằng ngày qua `zalo-import-daily.sh`,
`apify-facebook-daily.sh`, `chotot-daily.sh`, và S03 thêm một lần trong `finalize-hanoi.sh` ngay sau reassign-areas.

## 2. Thiết kế

1. **Một bộ đọc phường hợp lệ** trong `pipeline/lib/osm.mjs`:
   `docPhuongHopLe(client, markets) → Promise<{ id, name, parent_id }[]>` — `region_type = 'submarket' AND parent_id =
   ANY($1) AND ${phuongHopLe()}`, sắp theo `id`. Ba transform tin rao thay câu chọn riêng bằng hàm này, giữ đúng thị
   trường hiện đọc: transform-zalo `["vn-hanoi"]`; transform-fb và transform-chotot `["vn-hanoi","vn-hcmc"]`. Phần dựng
   bản đồ tên (`byCity`, `slugLists`, `phuongSlugs`) giữ nguyên.
2. **PIP theo toạ độ dùng chung** trong `pipeline/lib/osm.mjs`:
   `ganPhuongTheoToaDo(client, marketId) → Promise<number>` — câu UPDATE hiện có của transform-hcmc-simple, điều kiện
   khu vực thay bằng `a.parent_id = $1 AND a.geom IS NOT NULL AND ${phuongHopLe("a.")}`. transform-hcmc-simple gọi hàm.
3. **transform-chotot xuất `runTransformChotot(client)`** như transform-zalo/fb (người gọi giữ transaction; `main` bọc
   BEGIN…COMMIT như hiện có) để test và phép đo gọi được trong transaction.
4. **Không đổi `matchPhuong`, `writeOffers`, luật COALESCE của chotot.** Tin đã gắn khu vực không hợp lệ từ trước: S03/S05
   ghi đè `area_id` ở lượt kế (writeOffers `SET area_id = EXCLUDED.area_id`); S06 giữ cũ khi lượt mới không khớp (ngoài
   phạm vi — §Out of scope của hợp đồng).

## 3. Lựa chọn và căn cứ

- **Hỏi-1 (chờ Mạnh ở Cổng Phạm vi):** khu vực `airbnb-discovery` («Quận …» cũ) có bị loại khỏi danh sách khớp như khu
  vực lạc không. Khuyến nghị: loại — luật `pipeline/CLAUDE.md` «Submarket VN chỉ là phường OSM», và transform-airbnb đã
  loại chúng từ AU9. Giá: 9 tin S05 đang gắn bốn khu vực «Quận …» sang phường OSM khớp tên hoặc mất nhãn phường ở lượt
  nạp kế, 22 dòng `market_asset_stats` của các khu vực đó được dựng lại theo tin còn lại; 0 `saved_markets`,
  `properties`, `market_metrics`, `listings` trỏ vào chúng (đếm DB local 26/10). Lối khác: chỉ loại khu vực lạc, giữ
  khớp tên với «Quận …» — 9 tin giữ nhãn quận cũ, transform tin rao và transform-airbnb dùng hai điều kiện khác nhau.
- Một bộ đọc trong `lib/osm.mjs` thay vì sửa từng câu — cùng lối AU9 chọn cho `phuongHopLe()` (sổ AU9
  `d-20261026T014342Z-30`): một điều kiện, mọi bước gán dùng chung.
- transform-hcmc-simple không chạy theo lịch nhưng vẫn sửa: Ngoài-1 gọi tên nó, và sửa rẻ khi đã có `ganPhuongTheoToaDo`.

## 4. Đường đo

`scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu` (DB local, một transaction rồi ROLLBACK): chèn một khu vực lạc mồi dưới
`vn-hanoi` mang tên một phường thật (để chữ tin rao thật khớp được), đánh dấu `lac`; chụp trước = số tin mỗi nguồn có
`area_id`, số tin trỏ khu vực không hợp lệ; chạy ba transform tin rao; chụp sau. Đối chứng dương: trạng thái trước có
tin trỏ khu vực không hợp lệ (9 tin S05 «Quận …») — thước nhìn thấy đỏ.

## 5. Ma trận bước gán của `pipeline/` (viết trước, AC-7)

Quét `pipeline/` (`.mjs`, `.sql`, trừ test) theo mẫu `region_type = 'submarket'` · `'osm-phuong'` ·
`UPDATE listings|sale_offers … area_id` · `SET area_id`, cùng lời gọi bộ chung (`docPhuongHopLe(`, `ganPhuongTheoToaDo(`, `phuongHopLe(`), 26/10 — 12 tệp:

| Tệp | Nhãn |
|---|---|
| `lib/osm.mjs` | nguồn của điều kiện và hằng `NGUON_PHUONG` — nơi duy nhất mang `'osm-phuong'` |
| `reassign-areas.mjs` | dùng bộ chung (AU9); nhãn nguồn đọc từ `NGUON_PHUONG` (vòng này) |
| `transform-airbnb.mjs` | dùng bộ chung (AU9) |
| `transform-zalo.mjs` | dùng bộ chung (vòng này) |
| `transform-fb.mjs` | dùng bộ chung (vòng này) |
| `transform-chotot.mjs` | dùng bộ chung (vòng này) |
| `transform-hcmc-simple.mjs` | dùng bộ chung (vòng này) |
| `scripts/bench-extraction.mjs` | miễn: chỉ đọc để đo bộ trích, không ghi `area_id` |
| `sql/200_transform.sql` | miễn: lượt cũ đặt `area_id` theo tên; reassign-areas chạy sau mọi transform VN gán lại theo PIP với `phuongHopLe` (`pipeline/CLAUDE.md`) |
| `sql/300_metrics.sql` | miễn: chỉ đọc khu vực để gộp số |
| `sql/450_dq_checks.sql` | miễn: chỉ đọc để kiểm chất lượng |
| `refresh-bait-gap.mjs` | miễn: chỉ ghi `bait_gap_pct`, đọc `area_id` để so thước |
