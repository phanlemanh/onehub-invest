# test-nen-on22-on12 — test app thôi đỏ nền khi nhiều bộ test dùng chung DB :5433

Hàng P4 của đợt dieu-phoi-dot0-cam-mau (giám sát thêm 27/10 ~00:00Z, ưu tiên 97.2). Bốn ca: ON22-AC-5
(`ops-facts-so-tong-hop.test.tsx:124` đọc `blocks` của null), ON12-AC-7 (`ops-nhan-theo-context.test.tsx`, deadlock DB khi
chạy song song), ON7-AC-2 (`ops-nhan-ma-nguon.test.tsx`, /ops/quality trên DB local) và CT-AC-1 (`cong-tac-nhom-go.test.tsx`,
CI PR #153).

## Gốc (đo 27/10)

1. **Hết suất kết nối DB local.** Lần ON7-AC-2 đỏ ở lượt ghim lại `repin-20261026T232828Z-21709` báo `53300 sorry, too many
   clients already` (pg-pool, `getAirdnaComparison`). `max_connections` = 100. Một lượt `cd app && npm test` (53 tệp, mặc định
   17 tiến trình song song, mỗi tiến trình pool tối đa 5 + client riêng) đạt **đỉnh 53 kết nối**; pipeline 16. Hai phiên chạy
   bộ test app cùng lúc (đợt có 5–6 dãy, làn ghim lại, đường nền) là vượt 100. ON22 «đọc blocks của null» là cùng lớp: bên ghi
   (tiến trình con push-ops-facts) không mở được kết nối, trả mã ≠ 0 và payload null — test đọc payload trước khi kiểm mã.
   ON12-AC-7 «deadlock» chưa có nhật ký gốc (đã xin giám sát, P4-60); ca chỉ ĐỌC DB thật nên chỉ có thể là nạn nhân khi phiên
   khác chạy DDL trên bảng chung — xếp cùng lớp lỗi DB tạm thời.
2. **CT-AC-1 ghi nền (đã hết trên main).** Lượt CI đỏ (run 40429230276, 00:53Z, `active+tat: một dòng nhật ký`) chạy lúc
   route còn ghi `ops_audit` NỀN bằng `auditOpsWrite` và test chờ cố định 120 ms. Từ #155 (e627e4fe, vào main 02:20Z) route ghi
   nhật ký TRONG giao dịch (`ghiAuditTrong`) trước khi trả — cơ chế đỏ hết. Không sửa tệp; chứng bằng đầu dò.

## Cách sửa (chỉ test + cấu hình chạy test, không đổi `app/src`)

- `app/package.json`: `npm test` chạy `--test-concurrency=8` — đo: đỉnh 36 kết nối, 38 giây (4 tiến trình: 23 kết nối, 51
  giây). Hai bộ app + pipeline cùng lúc ≈ 88 < 100.
- `app/tests/helpers/db-tam-thoi.ts`: `thuLaiDbTam(fn)` thử lại tối đa 3 lần (chờ tăng dần) khi lỗi mang mã tạm thời
  `53300` hết suất kết nối · `40P01` deadlock · `57P03` DB đang khởi động; lỗi khác ném ngay. `laLoiBenGhiTam(stderr)` nhận
  cùng các lỗi ấy từ stderr của tiến trình con.
- ON7-AC-2, ON12-AC-7 (ca DB local) bọc phần chạm DB thật bằng `thuLaiDbTam`; ON22-AC-5 bên ghi thử lại khi stderr là lỗi
  tạm, rồi `assert.equal(r.code, 0, stderr)` TRƯỚC khi đọc payload.
- CT-AC-1: không đổi tệp (xem Gốc 2).

### Lối đã loại

- **Nâng `max_connections` của DB :5433** — phải khởi động lại container dùng chung (ZCode, launchd); đúng loại việc hàng
  `do-nen-hieu-nang` sẽ làm (bật pg_stat_statements cũng cần khởi động lại) — đề nghị gộp vào đó, không làm ở đây.
- **Giảm `max` pool trong `app/src/lib/db.ts`** — đổi mã app.
- **Chỉ thử lại, không giới hạn song song** — mỗi lượt vẫn chiếm 53 kết nối, đẩy phiên khác vào lỗi.

## Đo

- Đỉnh kết nối RIÊNG (đỉnh − nền, lấy mẫu mỗi 100 ms): một lượt app ≤ 40, 0 dòng thử lại; suy 2 × app + pipeline + 10 ≤ 100.
  Không chạy song song thật (đẩy DB dùng chung tới trần là gây lỗi cho phiên khác); nền > 10 → không kết luận.
- `thuLaiDbTam`: test riêng với lỗi giả (tạm 1 lần → xanh; tạm 3 lần → ném đúng mã; lỗi thường → ném ngay, không thử lại);
  đột biến bỏ `53300` khỏi tập mã → đỏ với thông điệp ghim.
- Hành vi thử lại: tiêm `53300` vào `pg.Client.connect` (NODE_OPTIONS --import) rồi chạy chính ON7-AC-2, ON12-AC-7 — một lần
  → xanh có dòng thử lại; mãi mãi → đỏ nêu 53300; ca không bọc → đỏ (đối chứng). ON22 bên ghi đo cấu trúc (tiến trình con).
  `canDb()` của ON12 bọc cả bước mở kết nối.
- CT-AC-1: bản sao tệp test chèn vào pg (Pool lẫn Client) cho `INSERT INTO ops_audit`: trễ 400 ms có chờ → xanh; ghi nền sau
  400 ms (lớp trước #155) → đỏ «một dòng nhật ký».
- Lặp: bộ test app 6 lần xanh, 0 dòng thử lại.
