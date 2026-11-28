# ZC18 · s06-thu-duoi-lich-va-chon-snapshot — thiết kế

Ngày: 26/11/2026 · Dãy U2 · Hạng T2 · Hàng trước: ZC17 `s06-thu-duoi-do` (bộ thu đuôi, đang chấm trên M5)

## Vì sao

Mạnh chốt thước «đăng → Invest» cho S06 ngày 24/11: p50 ≤ 30 phút, p90 ≤ 2 giờ. ZC17 đưa bộ thu đuôi vào main
(`pipeline/collect-s06-duoi.mjs`). Bộ thu chưa có ai gọi nó theo nhịp, và snapshot nó ghi chưa có ai nạp. ZC18 đưa vào main
lớp lịch của làn thu, nhánh `zcode/s06-thu-duoi-wrapper` @ `7fe8bb5b0` (thay `7173fc21a`, xem «Lỗi đã trả ZCode»), gồm tám tệp:

| Tệp | Việc |
|---|---|
| `scripts/thu-duoi-s06.sh` | wrapper một vòng: khoá một lượt, nhường lượt quét đủ, cổng vòng đời, cắt mốc, thu từng vùng, chọn-nạp ≤ 1 snapshot/vùng |
| `pipeline/lib/thu-duoi-moc.mjs` | cắt `moc.json` theo trần số id |
| `pipeline/cron/com.oneinvest.thu-duoi-s06.plist` | khuôn plist, `StartInterval` 300 s — KHÔNG cài trong vòng này |
| `scripts/install-cron.sh` | `--chi` nhận thêm tên `thu-duoi-s06`, hành vi mặc định giữ ba job cũ |
| `scripts/thu-duoi-s06.test.mjs`, `scripts/install-cron-chi.test.mjs` | 16 + 6 ca, shim `node`, không DB, không mạng |
| `pipeline/scripts/thu-duoi-chon-nap-e2e.test.mjs`, `pipeline/scripts/thu-duoi-moc-symlink.test.mjs` | ca chọn-nạp trên DB tạm (nạp A → quét đủ đè → vòng rảnh không nạp lại A) + 3 ca CLI qua symlink; xếp nửa b trong `pipeline/test-nua.json` |

Mã là của làn ZCode. U2 tích hợp nguyên commit; lỗi logic thì ghi lại và trả ZCode qua LL, không tự sửa (lời GS 26/11).

## Phạm vi vòng này

- Đưa tám tệp vào main, chấm trên mã, test và DB của riêng lượt.
- KHÔNG nạp launchd, KHÔNG chạy `install-cron.sh` thật, KHÔNG chạy sống wrapper vào `state/` hay `collector/snapshots`.
- Cài plist là việc cần lời riêng của Mạnh (AGENTS.md «Vẫn cần lời riêng của Mạnh»: plist launchd mới). Thẻ Cổng Bằng chứng
  sẽ mang câu xin lời đó; chữ ký Cổng Bằng chứng không tự phủ việc cài.
- Độ trễ «đăng → Invest» còn qua transform, resolve, sync-cloud: đó là PL38 `s06-duoi-toi-invest-trong-nhip`. ZC18 chỉ chịu
  chặng «nguồn → stg».

## Bảng phủ ca (số đếm từ DB máy thu, chỉ đọc, 26/11 ~12:40Z)

| Chiều | Giá trị | Số trên máy thu | Ai đọc đầu ra phía sau | Ca phủ |
|---|---|---|---|---|
| Vùng S06 chạy được | hanoi, hcmc, da-nang, binh-duong, hai-phong, khanh-hoa (`source_groups` active, `source_registry` S06 active) | 6 vùng; stg: hcmc 104.603 · hanoi 17.308 · da-nang 13.982 · binh-duong 13.760 · hai-phong 212 · khanh-hoa 0 | wrapper bước 5 → bộ thu từng vùng | AC-3 (vùng rỗng), AC-5 (2 vùng) |
| Phép đo 24h của làn thu | chỉ hcmc, 231 snapshot | 231 snapshot · 1.215 tin, mọi tin trong snapshot đuôi là tin mới | E6 ZC17; không phủ năm vùng còn lại | ngoài phạm vi, vì phép đo năm vùng kia cần chạy sống, ghi vào Notes |
| Snapshot S06 đã nạp (`airbnb_snapshots`, source chotot-ads) | 375 | 100 không còn dòng nào trong stg mang `snapshot_id` của nó (94 thuộc nhóm «vn», 6 snapshot vùng) | wrapper bước 7 tra stg để biết «đã nạp» | AC-5 (ca đè) |
| Snapshot đuôi đã nạp vào DB máy thu | 0 | 0 dòng manifest đuôi | — | chưa có dữ liệu thật; AC-5 dựng trên DB của riêng lượt |
| Kết cục của bộ thu | 0 · 3 chặn · 4 cổng đóng · 5 vượt trần · khác | — | wrapper bước 6, mã thoát lên launchd | AC-6 |
| Khoá | rảnh · bận (pid sống) · sót (pid chết) | — | launchd gọi chồng mỗi 300 s | AC-1 |
| Lượt quét đủ | đang chạy · không | 05:30 và 14:00 VN | wrapper bước 2 | AC-2 |
| Gốc snapshot | mặc định `state/thu-duoi-s06` · trỏ vào `collector/` | — | `chotot-daily.sh` nạp tên mới nhất ở `collector/snapshots` | AC-4 |
| Nạp | xong · lỗi | — | `stg_chotot_ads` → transform (PL38) | AC-5, AC-6 |
| Cài lịch | `--chi thu-duoi-s06` · vắng cờ · tên lạ | — | launchd của máy thu | AC-8 |

## Lỗi đã trả ZCode

Wrapper bước 7 coi «chưa nạp» là «`stg_chotot_ads` không còn dòng nào mang `snapshot_id` này». Nhưng `import-chotot.mjs`
upsert theo `list_id` và ghi `snapshot_id` của bản mới hơn. Lượt quét đủ 05:30/14:00 thu lại các tin đuôi với `captured_at`
mới hơn, nên mọi snapshot đuôi trong ngày trông như «chưa nạp». Vòng rảnh chọn snapshot mới nhất trong đó và nạp lại. UPSERT bị
`WHERE captured_at` chặn nên `snapshot_id` không đổi, và vòng sau lại chọn đúng snapshot đó. Dữ liệu không lùi, nhưng mỗi vùng
mỗi 5 phút nạp lại một snapshot cũ và nhật ký ghi sai. Test của nhánh shim cả bước tra stg nên không bắt được.

Hợp đồng đặt ca này thành AC-5 (đo trên DB của riêng lượt, dùng `import-chotot.mjs` thật). Trên 7173fc21a ca này đỏ. Ba lối:
ZCode sửa (tra `airbnb_snapshots`, nơi bộ nạp ghi mỗi lần nạp) rồi chấm trên sha mới; hoặc thu AC-5 về Known limits; hoặc
dừng vòng. GS phán 26/11: trả ZCode (claudedp-2611-21), không thu về Known limits. Lỗi phụ cùng vòng: `thu-duoi-moc.mjs` chạy
qua symlink (`~/dev/one-invest`) thì CLI thoát 0 im lặng, mốc lớn dần.

ZCode giao `7fe8bb5b0` ngày 27/11 (vòng claudedp-2611-21/23/24), rebase lên main. Sửa ba chỗ: argv của `node -e` lệch một đối số
(bước chọn-nạp trên `7173fc21a` thật ra chưa từng nạp); soát «chưa nạp» qua sổ nạp bền thay vì dòng stg; CLI mốc chạy đúng qua
symlink và luôn in kết quả. E5 chạy trên `7173fc21a` làm đối chứng đỏ và trên sha gộp làm bằng chứng xanh.

Tải: wrapper chạy tuần tự sáu vùng mỗi 5 phút. Phép đo 24 giờ của ZC17 chỉ có một vùng × một mục (0,36 lời/phút). Tải sáu vùng dự
kiến khoảng sáu lần, CHƯA đo. Thẻ Cổng Bằng chứng nêu điều này cạnh câu xin cài plist.

## Lựa chọn

- Chấm wrapper bằng chính test của nhánh (shim) cho đường điều khiển, CỘNG một probe trên DB của riêng lượt cho bước chọn-nạp.
  Shim không đủ cho bước chọn-nạp vì lỗi nằm ở quan hệ giữa wrapper và bộ nạp thật.
- Không chạy wrapper sống. Đo «không cài lịch» bằng `launchctl list` chỉ đọc trên máy thu.
- `paths` của eval hẹp đúng tám tệp + probe (luật R4 của GS).

## Ngoài phạm vi

- Cài plist, chọn nhịp khác 300 s, đổi `StartInterval`.
- Transform gia tăng, resolve, sync-cloud theo nhịp (PL38).
- Phép đo sống ở năm vùng ngoài hcmc.
