# HT20 — bốn đường markets của data-api thôi đọc S02: kế hoạch thi công

Hồ sơ `_acceptance/data-api-markets-khong-doc-s02/` (Cổng Phạm vi Mạnh ký 27/11 theo khuyến nghị: bỏ điểm S02 · tiểu vùng chỉ
tên + số tin · gỡ insights 410). Hạng T2 — không Cổng 1.5. HT20 gộp trước PB2.

| # | Việc | Tệp | Kiểm từng task | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | `markets.ts`: danh sách 4 khoá xếp số tin; chi tiết 4 khoá (mã cũ giải như hôm nay, không có → 404); submarkets 3 khoá theo tên (mã cũ giải, không có → 200 rỗng); insights 410 GONE, không phát SQL; không câu nào nhắc bảng S02 hay `area_sources` | `data-api/src/routes/markets.ts` | typecheck + gọi tay chỉ đọc trên DB M5 | E1–E5 | false |
| 2 | `/openapi.json` bỏ insights, mô tả không còn «score»; README bảng đường; CLAUDE.md trỏ rào | `data-api/src/app.ts`, `data-api/README.md`, `data-api/CLAUDE.md` | typecheck | E4, E7 | false |
| 3 | Test DB thử: thị trường quốc gia `zz`, dòng canh mọi bảng S02, bộ ghi SQL + tham số, rào tĩnh `data-api/{src,api}/**`, ba đột biến trong ca | `data-api/test/markets-khong-s02.test.ts` | `bash db/db-thu.sh oneinvest_suite_dapi_mk --chay sh -c 'cd data-api && node --import tsx --test test/markets-khong-s02.test.ts'` | E1–E5 | false |
| 4 | Probe E6 (bản markets.ts merge-base đỏ đủ năm ca), E7 (ranh giới, chữ cấm README/openapi, typecheck, test cũ, lưới tên nguồn); khoá lệnh `dapi_mk*` | `_acceptance/data-api-markets-khong-doc-s02/probes/*`, `_acceptance/config.yaml` | chạy từng probe | E6, E7 | false |
