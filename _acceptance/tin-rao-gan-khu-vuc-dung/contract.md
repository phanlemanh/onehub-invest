---
schema_version: 1
feature: Tin rao bán và bước gán theo toạ độ chỉ gán vào phường hợp lệ — không vào khu vực lạc hay khu vực không phải phường OSM
slug: tin-rao-gan-khu-vuc-dung
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [pipeline]
status: draft
design_doc: docs/superpowers/specs/2026-10-26-tin-rao-gan-khu-vuc-dung-design.md
---

# Acceptance Contract: tin-rao-gan-khu-vuc-dung

## Context

Hàng phát sinh từ Ngoài-1 của AU9 (Mạnh ký 26/10, «mở hợp đồng mới»). «Phường hợp lệ» = khu vực thoả `phuongHopLe()`
của `pipeline/lib/osm.mjs`: `meta.source = 'osm-phuong'` và không mang dấu `meta.lac`. «Khu vực không hợp lệ» = con
`submarket` của `vn-hanoi`/`vn-hcmc` không thoả điều kiện đó (khu vực lạc, khu vực `airbnb-discovery`). Việc gộp
khu vực `airbnb-discovery` vào «không hợp lệ» là Hỏi-1 ở Cổng Phạm vi (sổ quyết định). «Bốn bước gán»
= `transform-zalo.mjs`, `transform-fb.mjs`, `transform-chotot.mjs`, `transform-hcmc-simple.mjs`. Hiện trạng đo ở design
doc §1.

## Criteria

- AC-1: Given trong một transaction có ba con của `vn-hanoi` — một phường hợp lệ mồi, một khu vực lạc mồi (`meta.lac`),
  một khu vực `airbnb-discovery` mồi — When gọi `docPhuongHopLe(client, ["vn-hanoi","vn-hcmc"])`, Then kết quả chứa
  phường hợp lệ mồi và không chứa hai khu vực kia; đối chứng dương: gỡ dấu `lac` của khu vực lạc mồi thì nó có trong
  kết quả.
- AC-2: Given bài S03 mồi trong `stg_zalo_posts` nhắc tên một khu vực lạc mồi và bài khác nhắc tên phường hợp lệ mồi,
  When `runTransformZalo` chạy trong transaction, Then tin bán từ bài thứ nhất có `area_id` khác khu vực lạc mồi, tin
  từ bài thứ hai có `area_id` = phường hợp lệ mồi (đối chứng dương); và một phường hợp lệ mồi dưới `vn-hcmc` trùng tên
  với tên nhắc trong bài S03 không được chọn (transform-zalo chỉ đọc phường `vn-hanoi`).
- AC-3: Given bài S05 mồi tương tự cho `vn-hanoi` và `vn-hcmc`, When `runTransformFb` chạy trong transaction, Then không
  tin nào gắn vào khu vực lạc mồi của hai thị trường, tin nhắc phường hợp lệ mồi gắn đúng phường đó.
- AC-4: Given tin S06 mồi trong `stg_chotot_ads` có `ward_name_v3` = tên khu vực lạc mồi và tin khác có `ward_name_v3` =
  tên phường hợp lệ mồi, When `runTransformChotot` chạy trong transaction, Then tin thứ nhất không gắn vào khu vực lạc
  mồi, tin thứ hai gắn đúng phường hợp lệ mồi.
- AC-5: Given bài S05 mồi nhắc tên một khu vực `airbnb-discovery` mồi («Quận …») mà không nhắc phường hợp lệ nào, When
  `runTransformFb` chạy, Then tin của bài không gắn vào khu vực `airbnb-discovery` đó.
- AC-6: Given dưới `vn-hcmc` có một khu vực lạc mồi và một phường hợp lệ mồi có polygon, cùng listing mồi `area_id =
  'vn-hcmc'` nằm trong mỗi polygon, When gọi `ganPhuongTheoToaDo(client, "vn-hcmc")` trong transaction, Then listing
  trong khu vực lạc giữ `area_id = 'vn-hcmc'`, listing trong phường hợp lệ sang phường đó; `transform-hcmc-simple.mjs`
  không còn câu `UPDATE listings … area_id` nào của riêng nó — bước gán phường của nó là lời gọi hàm này (kiểm qua ma
  trận của AC-7).
- AC-7: Given ma trận viết trước liệt kê MỌI tệp `.mjs`/`.sql` không phải test trong `pipeline/` khớp một trong các mẫu
  `region_type = 'submarket'`, `'osm-phuong'`, `UPDATE listings|sale_offers … area_id`, `SET area_id` — mỗi tệp gắn nhãn
  «dùng bộ chung» hoặc «miễn: <lý do>» (design doc §5) — When quét tĩnh `pipeline/`, Then tập tệp khớp mẫu bằng đúng tập
  tệp của ma trận; tệp «dùng bộ chung» không còn câu chọn `submarket` hay `UPDATE … area_id` riêng (chỉ gọi
  `docPhuongHopLe`/`ganPhuongTheoToaDo`/`phuongHopLe`); chuỗi `'osm-phuong'` chỉ ở `pipeline/lib/osm.mjs`. Chiều đỏ: bản
  sao một transform thêm lại câu chọn riêng → kiểm báo đúng tên tệp; một tệp mới khớp mẫu mà ma trận không có → kiểm
  báo tệp đó.
- AC-8: Given DB local, When `scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu` chụp trạng thái trước, chèn một khu vực lạc
  mồi dưới `vn-hanoi` mang tên một phường hợp lệ thật, chạy `runTransformZalo` + `runTransformFb` + `runTransformChotot`
  trong MỘT transaction, chụp trạng thái sau rồi ROLLBACK, Then: trạng thái trước có ít nhất một tin trỏ khu vực không
  hợp lệ (đối chứng dương); trạng thái sau có 0 tin trỏ khu vực không hợp lệ hay khu vực lạc mồi; nối từng tin theo
  `offer_id`, 0 tin đã có `area_id` hợp lệ trước lượt bị chuyển sang NULL hay sang khu vực khác (in danh sách tin lệch;
  đối chứng dương: một tin mồi có phường hợp lệ bị gỡ nhãn trong lượt thì thước báo đỏ gọi `offer_id`); các tin trước
  lượt trỏ khu vực không hợp lệ được in riêng theo nguồn: bao nhiêu sang phường hợp lệ, bao nhiêu thành NULL; script in
  dòng ROLLBACK với số dòng `sale_offers` trước = sau lượt.

## Coverage

Trục: {bước gán: zalo (AC-2), fb (AC-3, AC-5), chotot (AC-4), PIP hcmc-simple (AC-6)} × {loại khu vực không hợp lệ: lạc
(AC-1…AC-4, AC-6), không phải phường OSM (AC-1, AC-5)} × {đo: hàm trong transaction có mồi (AC-1…AC-6), ma trận viết trước mọi bước gán
của `pipeline/` (AC-7), dữ liệu thật trong transaction rồi rollback, nối theo từng tin (AC-8)}. Ô {chotot × không phải
phường OSM} phủ qua bộ đọc chung (AC-1) + ma trận (AC-7), không có ca riêng. Bước gán thứ năm chưa biết: ma trận AC-7
đỏ khi một tệp mới khớp mẫu.

## Đường đo

- «0 tin bán và 0 listing gán vào khu vực lạc hay khu vực không phải phường OSM» — AC-2…AC-6 (mồi), AC-8 (dữ liệu thật).
- «Số tin có phường không tụt ngoài đúng các tin đang gắn sai» — AC-8.

## Out of scope

- Gỡ nhãn phường của tin S06 đã gắn khu vực không hợp lệ từ trước — `transform-chotot` giữ `area_id` cũ khi lượt mới
  không khớp (COALESCE); hiện 0 tin như vậy, lượt dọn có cờ của AU9 đặt NULL tin trỏ khu vực lạc.
- Xoá 11 khu vực `airbnb-discovery` cũ dưới Hà Nội (AU9 để ngoài phạm vi vì còn bị tham chiếu).
- Đổi luật khớp chữ `matchPhuong` (độ phủ thấp của S03: 2/269 tin có phường) — việc riêng của bộ trích.
- Áp thật lên DB local: lượt nạp theo lịch hằng ngày tự áp sau khi merge; không chạy tay transform trước khi ký.

## Notes

- AC-8 chọn tên mồi là tên một phường hợp lệ thật để chữ tin rao thật khớp được khu vực lạc mồi; nếu không bài thật nào
  nhắc tên đó thì phần «0 tin trỏ khu vực lạc mồi» đúng hiển nhiên — đối chứng dương của AC-8 là 9 tin S05 trỏ khu vực
  «Quận …» trước lượt.
