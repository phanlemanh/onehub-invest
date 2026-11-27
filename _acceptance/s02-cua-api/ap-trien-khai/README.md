# Triển khai lên máy thu — s02-cua-api (ZC22)

Không migration, không ghi dữ liệu, không plist mới, không đổi lịch. Lượt S02 19:05 (`scripts/airdna-daily.sh`) chạy
`collector/dist/cli.js` của checkout chính và chỉ build khi `dist/cli.js` vắng — nên mã mới chỉ có hiệu lực sau một lần build
`collector/` ở checkout chính.

Người làm: phiên ZCode vận hành (ZV) theo lời GIAO triển khai của LL, sau khi PR gộp và GS kéo main về checkout chính. ZT không
làm bước nào dưới đây (giới hạn phía Claude: không chạy bộ thu với phiên thật, không đọc log có thể chứa phiên).

1. **Lệnh áp.** Giờ: ngoài 18:45–20:30 giờ VN (lượt 19:05 đang chạy) và ngoài lượt đêm. Kiểm trước: checkout chính ở main có
   commit gộp của ZC22.
   ```bash
   cd ~/dev/onehub-invest/collector
   G=$(date +%Y%m%d%H%M); cp -a dist dist.bak-$G      # mục 3
   npm run build
   ls dist/collectors/*.js | xargs grep -l "export function docPhienTuProfile" | wc -l   # = 1
   node dist/cli.js list-sources                                                        # thoát 0, có bộ thu S02
   ```
   Build đỏ, hoặc hai lệnh kiểm không đúng → lùi ngay (mục 4), báo LL.
2. **Số chạy thử** (hộp cát, không phải checkout chính; `chay-thu-lui-2711.txt`): dist «trước» dựng từ origin/main — 0 tệp mô-đun
   phiên mới, `list-sources` thoát 0; dist «sau» — 1 tệp mô-đun phiên mới, `list-sources` thoát 0, CLI chạy; lùi xong băm dist
   trùng băm «trước». Chấm hành vi bằng fixture: S4 trên M5 (18 eval). Số «trước» trên máy thu: mọi lượt 19:05 từ 24/11 dừng ở
   «appToken ĐÃ HẾT HẠN», 0 bản ghi.
3. **Sao lưu trước.** `cp -a dist dist.bak-$G` ngay trước `npm run build` (bước 1). Không có dữ liệu nào để sao lưu: hàng không
   ghi DB, không đổi snapshot.
4. **Cách lùi** (vài giây, không đụng dữ liệu, không cần lời riêng): `cd ~/dev/onehub-invest/collector && rm -rf dist && mv
   dist.bak-$G dist`. Đã chạy thử 27/11 trong hộp cát: băm dist sau lùi = trước (`chay-thu-lui-2711.txt`). Lùi xong lượt 19:05
   chạy lại mã cũ (vẫn hỏng như trước triển khai, không tệ hơn). Lùi hẳn mã nguồn: PR `git revert -m 1 <sha gộp>`, gộp, kéo main,
   build lại.
5. **Lệnh kiểm sau.** Ngay sau áp: hai lệnh kiểm ở bước 1. Sau mỗi lượt 19:05 của ba đêm liền (Đường đo của hợp đồng): ZV đọc log
   lượt — thoát 0, 0 dòng `AUTH FAIL [S02]`, 0 dòng `BỊ CHẶN [S02]`, số bản ghi > 0 — và báo số qua LL (không dán log có giá trị
   phiên). Có `AUTH FAIL` → Mạnh đăng nhập lại bằng lệnh login của bộ thu; có `BỊ CHẶN` → dừng S02, báo GS, không chạy lại.
