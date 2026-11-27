# HT33 — pipeline_that bỏ qua có tên các ca chỉ máy thu chạy được, khi chạy trên máy phát triển

## Vấn đề

Suite `pipeline_that` (HT9) chạy 34 ca cần dữ liệu thật. M5 nay có nguyên DB máy thu (Mạnh 26/11), nhưng suite vẫn không xanh
ở đó vì ít nhất một ca đòi tài nguyên CHỈ máy thu có: ON22-AC-10 (`pipeline/scripts/ops-facts-so-tong-hop.test.mjs`) chạy
`push-ops-facts` thật (chế độ khô rồi gửi về máy chủ thu tạm) trên log, cấu hình `~/.oneinvest`, `launchctl` có job thật và DB
của máy thu — và chạy `push-ops-facts` thật trên M5 là việc CHUNG.md cấm. Hệ quả: mọi hàng đổi `pipeline/*.mjs`,
`pipeline/lib/**`, `docs/ops/runtime-map.md` phải chấm trên Mac mini.

## Bảng phủ ca (đọc tĩnh 34 ca, 26/11, main b013b4428)

| Tệp | Số ca | Cần gì ngoài DB | Chạy được trên M5 |
|---|---|---|---|
| test-posts.test.mjs | 6 | — | có |
| deals-phi-ly.test.mjs | 3 | — | có |
| reassign-areas.test.mjs | 14 | — (stg_osm_boundaries trong DB) | có |
| transform-zalo-loai-tin-doi-chieu.test.mjs | 2 | — | có |
| assert-rut-thay.test.mjs | 2 | — | có |
| do-hang-ngay.test.mjs | 2 | — | có |
| install-collector-api.test.mjs | 2 | `plutil` (macOS), HOME giả | có (M5 là macOS) |
| ops-apply-plist.test.mjs | 2 | `plutil`, chỉ đọc danh sách LaunchAgents thật | có |
| ops-facts-so-tong-hop.test.mjs (ON22-AC-10) | 1 | launchctl có job thật, log, `~/.oneinvest/cloud.env`, chạy push-ops-facts thật | **không** — chỉ máy thu |

Đối chiếu đo thật (M5B, lượt pipeline_that không trần trên M5, sha 39971ce7 của HT31, 26/11 08:01–08:45Z): 38 ca node đếm
(34 mục danh sách + 4 khung `describe`), 37 xanh, đỏ DUY NHẤT ON22-AC-10 — khối `s03` «không đo được» vì đọc cấu hình OpenClaw
và nhật ký cổng ở thư mục nhà, chỉ máy thu có. Khớp bảng trên.

## Thiết kế

1. `scripts/lib/vai-may.mjs` — `vaiMay({ tep })` đọc dòng `VAI=` của `~/.config/onehub/hai-may.env`. Chỉ giá trị đúng
   `may-phat-trien` mới nới; tệp vắng, không đọc được, không có dòng `VAI=`, giá trị lạ → `may-thu` (không nới).
2. `scripts/ci-bo-qua.json`: mục pipeline nào chỉ chạy được ở máy thu mang thêm khoá `may_thu` = lý do (một câu). Hôm nay
   đúng một mục: ON22-AC-10. `loiDanhSach` từ chối khoá `may_thu` rỗng hay không phải chữ.
3. `pipeline/chay-that.mjs`: vai `may-phat-trien` → bỏ qua đúng các mục mang `may_thu` (qua `--test-skip-pattern` như CI), in
   một dòng tổng «chay-that: vai may-phat-trien — bỏ qua N ca chỉ máy thu» và mỗi ca một dòng «bỏ qua (chỉ máy thu) — <tệp> —
   <ca> — <lý do>»; các ca còn lại chạy. Vai `may-thu` → chạy đủ, in «chay-that: vai may-thu — chạy đủ N ca». Không đọc `CI`.
4. Lượt soát hằng ngày (`pipeline-that-hang-ngay.mjs`) chạy trên main ở Mac mini (vai `may-thu`) nên vẫn đủ 34 ca — không đổi.

Không đổi: các tệp test (không thêm nhánh skip vào ca ON22-AC-10 — ca vẫn đỏ khi thiếu trên máy thu), danh sách ca của
`pipeline_that`, cách CI bỏ qua.

## Đặc tả UX

Không chạm UI.
