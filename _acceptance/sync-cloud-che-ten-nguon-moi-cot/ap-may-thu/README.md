# Áp — sync-cloud-che-ten-nguon-moi-cot (HT26)

**Gộp PR = ghi cloud.** Job launchd `com.oneinvest.cloud-sync` (15′, `scripts/cloud-sync.sh` → `pipeline/sync-cloud.mjs`) chạy mã
từ checkout chính. Sau khi PR gộp và checkout chính kéo `main`, lượt sync kế tiếp chạy mã mới: che tên nguồn ở mọi ô rồi THAY TRỌN
các bảng FILL trên Supabase. Lượt ấy dọn 3.743 ô mang tên nguồn đang nằm trên cloud. Mạnh đã cho lời áp kèm gộp ở Cổng Phạm vi
(sổ quyết định `d-20261125T091331Z-10`, theo Hỏi-1 `d-20261125T090136Z-8`; nguyên văn «/acceptance-gate:approve
sync-cloud-che-ten-nguon-moi-cot duyệt», 25/11 09:13Z). Lời ấy chỉ phủ việc áp khi hồ sơ có đủ năm mục dưới đây. Mạnh rút lời bằng
một câu trước khi gộp thì phải chặn job sync trước khi gộp; không có đường nào khác.

## 1. Lệnh áp

1. Chạy mục 3 (sao lưu trước) **trước khi gộp**, rồi dán kết quả vào `sao-luu-truoc.txt` cạnh tệp này.
2. Điều phối làn merge: `gh pr merge <số PR>` rồi `git -C ~/dev/onehub-invest pull --ff-only origin main`.
3. Không gõ lệnh sync tay. Lượt launchd kế tiếp (≤ 15′, kể cả lượt đang chạy dở bằng mã cũ phải xong trước) là lượt áp. Ghi giờ
   pull làm **giờ áp**.
4. Theo dõi lượt: `tail -f ~/dev/onehub-invest/pipeline/logs/cloud-sync.log`. Kỳ vọng thấy một dòng
   `WARN che tên nguồn N ô: …` (chỉ có bảng.cột và số, không giá trị), rồi `sync xong … leak gate PASS`.
   Gặp `SYNC FAIL [scan]`, `[che]` hay bất kỳ pha nào thì cloud vẫn giữ bản cũ (tráo là một giao dịch): dừng, báo GS, không sửa tay.

## 2. Số chạy khô (E5, 25/11 12:20Z, máy thu thật)

Lệnh `nice -n 10 node pipeline/sync-cloud.mjs --kho` chạy với mọi biến đường cloud (`SUPABASE_MGMT_TOKEN`, URL Supabase, proxy)
trỏ cổng chết `127.0.0.1:1`. Lượt khô không đọc tệp khoá và không dựng exec thật. `lsof` soát tiến trình mỗi 0,3 s và chỉ thấy
`127.0.0.1 → 127.0.0.1:5433` (DB máy thu, chỉ đọc). Mã thoát 0.

| bảng.cột | ô che (lượt khô) | S1 (cloud, 25/11) |
|---|---|---|
| ref_calib_listings.metrics | 1575 | 1575 |
| ref_calib_listings.listing_url | 1575 | 1575 |
| areas.meta | 501 | 501 |
| dq_check_results.detail | 75 | 75 |
| listings.photo_urls | 10 | 10 |
| area_sources.meta | 3 | 3 |
| ref_calib_listings.title | 3 | 3 |
| listings.name | 1 | 1 |
| sale_offers.street_raw | 0 | 0 (S1 máy thu 1; ô ấy đã được GS đặt NULL) |
| **tổng** | **3743 ở 8 bảng.cột** | **3743** |

- Bộ chặn mọi bảng sau che: 0. Đếm thô độc lập trên payload đã che: 0. Số dòng: 1.024.103 dòng ở 22 bảng.
- `do-ten-nguon-cloud.mjs --chi-may-thu` (cùng giờ): xem `chay-kho.md`.
- Thời gian: lượt khô có đọc 514,3 s, che 30,7 s, soát 46,2 s, cộng 591,3 s. Mã cũ ở merge-base `caadfbb1c` (worktree tạm tách rời,
  đo cùng giờ, cloud giả): pha đọc + soát tới câu nạp đầu ≤ 971,8 s. Tỉ số ≤ 1,5 đạt. Kể cả khi so với riêng phần đọc của mã mới
  (514,3 s) thì tỉ số vẫn là 1,15.
- Lượt đầy đủ ước tính: lượt prod tốt gần nhất mất 1244,6 s, cộng che 30,7 s và soát mọi bảng 46,2 s, ra khoảng 1320 s (~22′).
  **Vượt trần 15′ của AC-5** vì đường nền mã cũ đã 20–27′ (pha stage 664–1025 s, đọc 452–497 s). Phần mã mới thêm vào chỉ khoảng 77 s.

## 3. Sao lưu trước (chỉ đọc, chạy TRƯỚC khi gộp)

22 bảng FILL trên cloud là **bản chiếu** của DB máy thu: mỗi lượt sync nạp vào `sync_stage`, rồi tráo trọn từng bảng trong một giao
dịch. **Bản sao lưu thật là DB máy thu** (restic hằng ngày); hàng này không ghi gì vào DB máy thu. Ở bước này chỉ lấy **dấu vân tay**
từng bảng cloud (số dòng và một dấu băm), KHÔNG lưu giá trị: 3.743 ô kia mang tầng A, không được ra đĩa hay vào hồ sơ. Dấu trước và
sau áp chỉ để chứng một điều: ngoài 8 bảng.cột bị che, không gì khác đổi (mục 5). Lệnh chạy từ checkout chính, chỉ gửi SELECT trong
giao dịch chỉ đọc, tuần tự một lời một lúc. Trước mỗi lời, lệnh soát `pipeline/logs/cloud-sync.log`: lượt sync cuối phải đã có dòng
kết thúc, không chạm pha stage của job. Chạm trần thời gian câu thì lệnh chia bảng theo dải băm khoá chính, mỗi dải một dấu:

```bash
cd ~/dev/onehub-invest/pipeline && node ../_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/sao-luu.mjs | tee ../_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/sao-luu-truoc.txt
```

Câu đo mỗi bảng (`sao-luu.mjs`, thư mục này):
`SELECT count(*), md5(string_agg(md5(x::text), '' ORDER BY md5(x::text))) FROM public."<bảng>" x`, kèm `max(swapped_at)` của
`sync_stage.swaps`.

**Số thử (25/11, cloud thật, chỉ đọc):** 24 lời gọi tuần tự (1 câu khoá chính, 22 bảng, 1 câu `sync_stage.swaps`). Lệnh khởi động
12:46:28Z, gặp lượt sync đang chạy (phút 18,9 → 21,5) nên chờ 6 lần × 30 s, tới lúc lượt ấy có dòng `sync xong 12:49:18Z` mới gọi.
Tổng 212,2 s, trong đó các lời gọi chỉ khoảng 32 s. Mỗi bảng 0,7–3,8 s (`properties` 120.371 dòng 3,8 s, `nights` 346.750 dòng 2,6 s,
`sale_offers` 148.753 dòng 2,6 s). Không chạm trần thời gian câu (`SET LOCAL statement_timeout = '110s'`), nên không phải chia dải.
`lần tráo cuối` = 12:47:33Z, đúng lượt vừa xong. Số dòng và băm của lần thử không lưu vào hồ sơ (chúng là dấu của giờ thử, không phải
của giờ gộp); lần chạy thật ở bước 1 của mục 1 sẽ ghi `sao-luu-truoc.txt`.

Thêm số đo cloud trước áp: `node scripts/do-ten-nguon-cloud.mjs > …/ap-may-thu/do-truoc-ap.txt` (in số, không in giá trị; mã 1 là
đúng vì cloud còn 3.743 ô).

## 4. Cách lùi

Cloud là bản chiếu của máy thu, nên lùi = **revert mã + một lượt sync**:

1. Mở PR `git revert <sha gộp>` (main có branch protection nên không đẩy thẳng), rồi `gh pr merge`, rồi
   `git -C ~/dev/onehub-invest pull --ff-only origin main`.
2. Lượt launchd kế tiếp chạy mã cũ, stage rồi tráo trọn 22 bảng từ DB máy thu, tức bản sao lưu thật. Cloud về đúng bản chiếu của mã
   cũ: tên nguồn quay lại ở 8 bảng.cột, đó là chính nghĩa của việc lùi.
3. Không có DDL nào để lùi, không ghi gì vào DB máy thu. Dấu băm ở mục 3 không dùng để khôi phục; chúng chỉ để chứng phạm vi đổi.

## 5. Lệnh kiểm sau (E7, trong 1 giờ sau giờ áp)

1. `node scripts/do-ten-nguon-cloud.mjs`: mã 0, dòng `tổng` có ô cloud 0 và thô cloud 0 ở mọi bảng.cột. Dán đầu ra vào
   `do-sau-ap.txt`.
2. Lần tráo mới: chạy lại lệnh mục 3 rồi lưu vào `sau-ap.txt`. `lần tráo cuối` phải lớn hơn giờ áp. Bảng ngoài 8 bảng.cột có thể
   đổi dấu chỉ vì máy thu có dữ liệu mới giữa hai lượt. Bảng nào đổi số dòng hay dấu băm mà không giải thích được bằng dữ liệu mới
   (so `cloud-sync.log` và đếm máy thu cùng lượt) thì dừng, báo GS.
3. Số dòng đuổi kịp: với mỗi bảng FILL, số dòng cloud ở `sau-ap.txt` ≥ 99% số dòng máy thu cùng lượt (in ở dòng `  <bảng>: <số>`
   của lượt sync trong `cloud-sync.log`).
4. Số thật đặt cạnh số chạy khô ở mục 2: tổng ô che của lượt áp, lấy từ dòng `WARN che tên nguồn`, phải ≈ 3743 (dữ liệu máy thu
   có thể đổi vài ô). Lệch lớn hay cloud còn ô thì dừng, báo GS, không tự sửa cho khớp.

## Đã biết, ngoài hồ sơ

- `pipeline/scripts/check-cloud-sync.mjs allow` (executor `cloud_sync_allow`) đã sửa theo GS 25/11, giữ hai chiều trên cùng dữ liệu
  cấy: (a) có che → lượt qua scan, ô thành mã, lệnh đo trên cloud mô phỏng ra 0; (b) `che:false` → dừng scan, nêu bảng.cột.
