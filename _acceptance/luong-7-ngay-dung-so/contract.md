---
schema_version: 1
feature: Người vận hành đọc «Luồng 7 ngày qua» trên /ops/collections thấy mỗi cột đếm đúng thứ nhãn nói — tin rao đúng nguồn, đủ 7 ngày từ số máy thu đẩy lên, cột không có số trên máy chủ ghi «Chỉ ở máy thu»
slug: luong-7-ngay-dung-so
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [ui]
status: verified
approved_by: Mạnh
approved_at: 2026-10-25
design_doc: docs/superpowers/specs/2026-10-25-luong-7-ngay-dung-so-design.md
lo_trinh_ma: ON5
---

# Acceptance Contract: luong-7-ngay-dung-so

## Context

Hàng ON5 (OPS-8, gốc G1 + G4), đứng trên ON22 (khối số tổng hợp, ADR-0014). Hôm nay cột «S03 — tin rao» đếm
`sale_offers` mọi nguồn, cột «S03 — bài thô» đếm cả bài mock theo giờ nạp, bản tin máy thu chỉ mang những ngày có
dòng, và máy chủ không dựng bảng (ON3 gom vào Alert). «Cột S03» = «S03 — bài thô» và «S03 — tin rao (đã đọc)».
«Ngày» = ngày giờ VN (ON8). «Khối `luong7`» = khối trong `blocks` của bản tin `ops_heartbeat` (khuôn ON22). Định nghĩa
và trạng thái ở design doc §2 và §Đặc tả UX.

## Criteria

- AC-1: Given lược đồ tạm có tin `sale_offers` nguồn S03 và S06 cùng ngày, tin S03 lúc 23:59 và 00:01 giờ VN, When
  `getFlowDays` chạy ở máy thu, Then cột «S03 — tin rao» mỗi ngày bằng đúng số tin nguồn S03 có `first_seen` rơi vào
  ngày đó (số viết trước cho từng ngày); chiều đỏ: bản sao đếm mọi nguồn → thước báo đúng ngày và hai số.
- AC-2: Given lược đồ tạm có bài S03 thật, bài mock và bài đăng 22:49 giờ VN được nạp sau nửa đêm, When `getFlowDays`
  chạy ở máy thu, Then cột «S03 — bài thô» mỗi ngày bằng số bài thật (không mock) có `posted_at` rơi vào ngày đó; chiều
  đỏ: bản sao đếm theo `captured_at` (bài 22:49 rơi sang hôm sau) → thước báo đúng ngày và hai số.
- AC-3: Given máy thu đẩy bản tin (bên ghi thật, chế độ khô) với ngày đo bất kỳ, When đọc `blocks.luong7`, Then khối có
  `measured_at` và đúng 7 khoá ngày VN liên tiếp kết thúc ở ngày đo, mỗi khoá có `s03Posts` và `s03Offers` là số (ngày
  không có dòng = 0), bộ soát tầng A không chặn; đo hỏng (bảng vắng) → khối `{measured_at, error}` và các khối khác vẫn
  đi; chiều đỏ: bên ghi đột biến bỏ một ngày, và bên ghi đột biến bỏ `measured_at` → thước báo tên khối và ngày thiếu.
- AC-4: Given cùng một lược đồ tạm, When so khối `luong7` của bên ghi thật với hai cột S03 của `getFlowDays` ở máy
  thu, Then từng ngày bằng nhau; chiều đỏ: bên ghi đột biến đếm tin mọi nguồn → thước báo đúng ngày lệch.
- AC-5: Given bản tin do bên ghi THẬT dựng trên lược đồ tạm (chế độ khô, mốc đo ghim 00:30 giờ VN) được ghi vào
  `ops_heartbeat` của lược đồ đó, When máy chủ đọc nó qua `readOpsFacts` rồi dựng `/ops/collections` (SSR), Then bảng
  «Luồng 7 ngày qua» có mặt và 14 ô S03 (2 cột × 7 ngày) bằng đúng số viết trước của lược đồ, không ô nào mang lớp mờ;
  cột «S01 — listing tươi» có mặt; cột «S01 — snapshot» cả 7 ô ghi «Chỉ ở máy thu» (không ô nào là số); không cột S02
  nào; Alert «Phần còn lại…» không còn chữ «Luồng 7 ngày»; chiều đỏ: bên ghi đột biến đổi tên một khoá của khối → thước
  báo tên khoá và ô «—»; bản sao để ô snapshot là 0 → thước báo; bản sao còn cột S02 → thước báo; bản sao luôn làm mờ ô
  S03 → thước báo tên ô ở ca tươi.
- AC-6: Given máy chủ ở ba trạng thái, When dựng `/ops/collections`, Then: bản tin tươi nhưng không có khối `luong7`
  (hoặc khối mang `error`) → 14 ô S03 là «—», không ô nào là 0; bản tin cũ quá 45′ → cả 14 ô S03 mang lớp mờ
  `text-muted-foreground` (đọc theo từng ô, không theo cả hàng — ô «Chỉ ở máy thu» vốn mờ); chưa có bản tin → không có
  bảng và Alert vẫn liệt «Luồng 7 ngày»; chiều đỏ: bản sao hiện 0 khi khối vắng → thước báo; bản sao không làm mờ ô S03
  khi bản tin cũ → thước báo tên ô.
- AC-7: Given trang Thu thập ở máy thu, When dựng bảng, Then đủ 7 cột như main 8731f81 (`day`, `airdnaMarkets`,
  `airdnaListings`, `airbnbSeen`, `airbnbSnapshots`, `zaloPosts`, `zaloOffers`), mô tả bảng nói «giờ VN» và «ngày đăng
  bài», không còn «giờ máy»; chiều đỏ: bản sao thiếu một cột → thước báo cột thiếu.
- AC-8: Given DB local thật, When `scripts/luong-7-ngay-do.mjs` chạy, Then với mỗi ngày trong 7 ngày gần nhất,
  `s03Offers` của khối bằng số tin S03 đếm theo đường độc lập (ngày đăng của bài sớm nhất trong `post_ids`) và không
  lớn hơn `s03Posts`, và có ít nhất một ngày `s03Offers` > 0 (không có → thoát ≠ 0, báo «không có ngày nào có tin
  S03 trong 7 ngày»); chiều đỏ: cùng phép đo trên con số đếm mọi nguồn → báo ngày vi phạm (chỉ được bỏ khi DB không có
  tin nguồn khác S03 trong 7 ngày, và in con số đếm đó).
- AC-9: Given app chạy thật từ worktree ở chế độ máy chủ, đọc bản tin từ một lược đồ tạm (bản tin bên ghi thật; không
  đụng dòng `ops_heartbeat` thật của DB local), phiên admin tạm tạo và xoá trong cùng lượt, Chromium ở 1280×800 và
  390×844, When mở `/ops/collections` ở ba trạng thái tươi · cũ · thiếu khối, Then bảng «Luồng 7 ngày qua» hiện đúng
  như AC-5/AC-6 trên DOM thật (ô S03, «Chỉ ở máy thu», «—», lớp mờ), ô «Chỉ ở máy thu» canh phải như ô số, trang không
  cuộn ngang ở 390px, và ảnh chụp từng trạng thái × khổ được lưu cho người ký; chiều đỏ: chèn CSS làm ô «Chỉ ở máy thu»
  canh trái → báo; chèn phần tử rộng 500px → báo trang. (Theo khuyến nghị của Hỏi-2.)

## Coverage

Trục: {cột: S03 tin rao, S03 bài thô, S01 listing tươi, S01 snapshot, S02 ×2} × {nơi: máy thu, máy chủ tươi, máy chủ
cũ, máy chủ thiếu khối, máy chủ chưa có bản tin} × {biên dữ liệu: nguồn khác cùng ngày, bài mock, nạp sau nửa đêm,
23:59/00:01 giờ VN, ngày rỗng}. AC-1/AC-2 phủ định nghĩa × biên dữ liệu; AC-3/AC-4 phủ bên ghi (7 khoá, ngày rỗng,
khớp bên đọc); AC-5/AC-6 phủ cột × trạng thái máy chủ, nối bên ghi thật qua `readOpsFacts` tới trang; AC-9 phủ ba
trạng thái máy chủ × hai khổ trên trình duyệt; AC-7 phủ máy thu không mất cột; AC-8 là đường đo ngưỡng trên dữ liệu thật. Ô bỏ có tên: S02 trên máy chủ (không dựng — ON6); S01 listing tươi trên máy chủ đọc bảng đã đồng bộ, không
có phép đo riêng ngoài AC-5 [CE chưa kiểm chứng: bảng `listings` trên máy chủ cùng số với máy thu].

## Đường đo

- «cột tin rao bằng số tin S03 của ngày đó, không lớn hơn số post» — `scripts/luong-7-ngay-do.mjs` trên DB local · AC-8.
- «facts có 7 khoá ngày» — bên ghi thật ở chế độ khô · AC-3.
- «cột thô trên cloud ghi «chỉ local»» — SSR trang máy chủ đọc bản tin bên ghi thật · AC-5; trình duyệt thật · AC-9.
  «Cột thô» là «S01 — snapshot» (Hỏi-1, Mạnh duyệt theo khuyến nghị ở Cổng Phạm vi 2026-10-25).

## Out of scope

- Gỡ số S02 khỏi trang Thu thập ở máy thu, biểu đồ luồng và panel Rotation (ON6).
- Bỏ khoá cũ `zaloFlow` khỏi bản tin.
- Lưới job, nhóm S03, lockdown trên máy chủ (ON4, ON23).

## Notes

- Nhãn «Chỉ ở máy thu» thay chữ «chỉ local» của câu giao: «Máy thu» là nhãn chuẩn trong `CONTEXT.md` (code `local`).
- Máy chủ chỉ nhận số đếm theo ngày cho mã S03 — không tên nguồn, không nội dung bài (ADR-0007, luật 6).
