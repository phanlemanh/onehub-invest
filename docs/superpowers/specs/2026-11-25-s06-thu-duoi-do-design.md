# ZC17 — đưa bộ thu đuôi S06 vào main (s06-thu-duoi-do)

Ngày: 25/11/2026 · Dãy U2 · Hạng T2 · Hồ sơ `_acceptance/s06-thu-duoi-do/`

## Vì sao

Mạnh chốt thước «đăng → Invest» cho S06 ngày 24/11: p50 không quá 30 phút, p90 không quá 2 giờ. Lượt quét đủ S06 chạy hai
lần mỗi ngày, nên tin mới đăng có thể chờ tới nửa ngày. Làn thu (ZT, vòng `claudedp-2411-6`) viết một bộ thu «đuôi»: mỗi nhịp
chỉ lấy trang 1–3 của một vùng × một mục, mới nhất trước, và dừng ở trang đầu tiên không còn tin mới. Phép đo 24 giờ trên cặp
đông nhất (288 lượt, nhịp 5 phút) cho ra:

- bắt được 1.072 trên 1.072 tin mới của lượt quét đủ cùng ngày;
- độ trễ từ lúc đăng tới lúc thu: p50 12,2 phút, p90 28,6 phút;
- 0,36 lời gọi mỗi phút, 0 lần bị chặn.

Hàng này chỉ đưa mã của bộ thu và bộ test vào main. Bộ thu chưa chạy theo lịch, và snapshot của nó chưa được nạp tự động.

## Vật vào main

Nhánh `zcode/zt-thu-duoi-s06-do` @ `d93783b0a`, 4 commit trên `caadfbb1c`. Ba tệp đều thuộc làn ZCode:

- `pipeline/collect-s06-duoi.mjs` (788 dòng). Gồm: một nhịp thu đuôi `thuDuoi`, hàm lấy trang có nghỉ, thử lại và nhận diện
  bị chặn (`taoLayTrangS06`), hàm ghi snapshot theo DATA-CONTRACT (`ghiSnapshot`), phiên DB chỉ đọc (`moDbChiDoc`), vòng đo
  (`chayDoi`) và báo cáo (`tinhBaoCao`, `baoCao`).
- `pipeline/scripts/collect-s06-duoi.test.mjs` (859 dòng, 56 ca). 51 ca chạy với nguồn giả và thư mục tạm. 5 ca cần DB thật,
  chỉ chạy trên DB tên `oneinvest_suite_*`.
- `pipeline/test-nua.json`: thêm một dòng, đăng ký tệp test vào nửa B.

Claude chỉ sửa lỗi tích hợp. Lỗi logic thu thì trả làn ZCode qua LL (`tin MỞ LẠI`).

## Đọc mã tích hợp (25/11)

- **DB chỉ đọc:** bộ thu mở `BEGIN READ ONLY` rồi kiểm `transaction_read_only = on`. Nó chỉ SELECT `stg_chotot_ads`,
  `source_groups` và `airbnb_snapshots`, không ghi bảng nào. Mã vùng lấy từ `source_groups`, không lấy từ đối số dòng lệnh.
- **Cổng vòng đời, fail-closed:** mỗi nhịp hỏi `docTrangThai` trước. Nguồn tạm dừng thì thoát mã 4. DB lỗi thì bỏ lượt đó và
  không gọi nguồn lần nào. Cách này khớp quyết định cổng-tắc-thật ở Cổng Phạm vi (`cong-tac-that#d-20261026T231111Z-1`).
- **Snapshot:** khuôn `schemaVersion: 1` và `chotot-ads` giống hệt `collect-chotot.mjs`, `import-chotot.mjs` đọc được nguyên
  vẹn. Hai snapshot đụng tên trong cùng một giây thì thêm hậu tố `-n`, `mkdir` không đệ quy, nên snapshot không bao giờ bị ghi đè.
  Bộ thu chỉ ghi dưới `--goc <thư mục>` do người chạy chỉ định, không đọc và không ghi HOME.
- **Bị chặn:** gặp 403, 429, hoặc trang HTML trả kèm mã 200, bộ thu dừng cả phép đo và thoát mã 3, giữ snapshot phần đã lấy,
  không thử lại. Lỗi mạng và 5xx được thử lại tối đa 3 lần. Vượt trần lời gọi thì thoát mã 5.
- **Địa chỉ nguồn:** dùng đúng địa chỉ mà `collect-chotot.mjs` đã dùng trên main, không thêm tên miền mới.

## Bảng phủ ca (đếm từ phép đo thật, không fixture)

Nguồn số: thư mục phép đo của làn thu. Gồm `nhat-ky.jsonl` (288 dòng lượt), `bao-cao-chinh-thuc.json`, và 231 snapshot S06.
Probe `_acceptance/s06-thu-duoi-do/probes/phu-ca.mjs` đếm lại mỗi lượt chấm. Cột «ai đọc phía sau» theo luật bảng phủ ca của
AGENTS.md.

| Trục | Giá trị | Số trong dữ liệu thật | Ca test (nguồn giả — số dòng trong tệp test) | Ai đọc đầu ra phía sau |
|---|---|---|---|---|
| Lý do dừng | trang-toan-da-co | 287 | 53, 61 | nhật ký → báo cáo luật dừng |
| | toi-da-trang | 1 | 83 | như trên |
| | het-trang | 0 | 91 | như trên |
| | gap-da-co (luật rẻ) | không chạy, tính lại được: 9 tin bỏ sót trên 288 trang | 75 | báo cáo `luat.gap-da-co.boSot` |
| Số trang mỗi lượt | 1 / 2 / 3 | 57 / 228 / 3 | 53, 61, 83 | — |
| Trang trộn tin mới lẫn tin đã có | có | 235 trang; tin mới ở trang 2–3: 4 trang | 61, 75 | — |
| Tin mới ở trang 1 | 0 / 1–5 / 6–20 | 57 / 142 / 89 | 53, 61 | — |
| Kết cục lượt | chạy được | 288 | 343 | — |
| | bị chặn (403/429/HTML) | 0 | 187, 196, 463 | mã thoát 3 → người vận hành |
| | lỗi mạng, 5xx | 0 | 202, 209, 215, 444 | — |
| | DB lỗi (fail-closed) | 0 | 426 | — |
| | cổng vòng đời đóng | 0 | 411 | mã thoát 4 |
| | vượt trần lời gọi | 0 | 235, 491 | mã thoát 5 |
| HTTP | 200, lần thử 1 | 522 lời | 221 | — |
| Giờ đăng | có `orig_list_time` / không | 23.316 / 2.784 mục | 834 (ca DB) | độ trễ, tỉ lệ bắt được |
| Snapshot | có tin mới → ghi | 231, đọc lại được cả 231, tổng 1.215 tin = tổng mục mới | 275, 297, 343 | `import-chotot.mjs` (hàng sau) |
| | không tin mới → không ghi | 57 | 390 | — |

Những ô bằng 0 trong dữ liệu thật được phủ bằng ca nguồn giả. Phép đo 24 giờ không gặp lần bị chặn hay lỗi nào, nên các nhánh
đó chưa từng chạy với nguồn thật. Mục giới hạn có ghi điểm này.

## Lựa chọn

1. **Tích hợp nguyên vẹn, không sửa mã.** Lời giao của GS: «CHỈ tích hợp bộ thu + test». Đọc mã không thấy lỗi tích hợp nào.
2. **5 ca DB chạy trên DB của riêng lượt**, qua `db/db-thu.sh oneinvest_suite_s06td --chay`. Ở suite, bộ test pipeline nửa B
   cũng tự chạy 5 ca này vì `npm run test:b` đã bọc `db-thu.sh`. Không ca nào bị bỏ qua có tên ở máy. Trên CI không có
   `DATABASE_URL` nên 5 ca tự bỏ qua, giống mọi tệp test pipeline cần DB.
3. **Số đo lấy từ phép đo thật của làn thu**, đọc tại chỗ. Probe tính lại độ trễ độc lập từ nhật ký, không gọi chính
   `tinhBaoCao`, rồi so với `tinhBaoCao` và báo cáo chính thức. Tính cách này để bộ đo không phải tự chấm chính nó.
4. **Không gọi mạng thật trong test:** đo bằng bộ chặn nạp qua `--import`. Bộ chặn đếm mọi `fetch` và mọi socket TCP ra ngoài
   máy, và chạy với HOME tạm. Tự kiểm: một tệp test gọi `fetch` thật phải bị bắt.
5. **Eval trỏ suite khai `paths` hẹp và `long_running: 90`** theo luật R4 của GS. `paths` gồm đúng ba tệp của nhánh. Trên Mac
   mini, nửa A của bộ test pipeline chạy khoảng 41 phút.

## Ngoài phạm vi

- Chạy theo lịch 3–5 phút, plist launchd, bộ hẹn giờ: hàng sau. Plist mới cần lời riêng của Mạnh. LL đã hỏi ZV đề xuất giao
  diện (`claudedp-2511-24`).
- Bước chọn snapshot để nạp, và tránh nạp trùng với lượt quét đủ 05:30: hàng phía transform, sau đề xuất của ZV. Rủi ro đã thấy:
  `scripts/chotot-daily.sh` nạp snapshot có tên mới nhất của mỗi thành phố. Nếu bộ thu đuôi ghi thẳng vào
  `collector/snapshots/<city>/` sau lượt thu ngày, thì lượt nạp ngày có thể nhận nhầm snapshot đuôi nhỏ thay cho lượt quét đủ.
  Vì vậy trước khi có hàng ấy, bộ thu chỉ chạy tay với `--goc` ngoài kho chuẩn.
- Nạp 231 snapshot của phép đo vào `stg_chotot_ads`: làn Claude quyết ở hàng phía transform.
- Mở rộng sang vùng và mục khác: phép đo mới chỉ phủ một vùng × một mục.
- Mốc `moc.json` lớn dần không giới hạn (12 KB sau 24 giờ): xử ở hàng chạy theo lịch.
