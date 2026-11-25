# Áp lên máy thu — s03-jpg-path-fallback (ZC16)

Áp CHUNG MỘT LẦN với ZC15 (`_acceptance/s03-media-r2-allowlist/ap-may-thu/README.md`): cùng một lần build `collector/dist`
và một lần khởi động lại `com.oneinvest.collector-api`. ZC16 không có tệp cấu hình riêng, không migration, không ghi DB, không
plist mới. Người làm: phiên ZCode vận hành (ZV) theo lời GIAO triển khai của LL sau khi hai PR gộp. Phiên dãy ZT không làm
bước nào dưới đây.

1. **Lệnh áp.** Giờ áp: NGOÀI 05:30–06:30 và 14:00–14:45 giờ VN. **Khởi động lại collector API cần lời riêng của Mạnh** —
   chữ ký cho bước áp phủ đúng bước 1.4; không có thì dừng sau bước 1.3.
   1. `git -C ~/dev/onehub-invest pull --ff-only origin main`; kiểm `grep -c 'altUrlForJpg' ~/dev/onehub-invest/collector/src/core/media-fetch.ts` ≥ `2` và ZC15 đã có (`grep -c parseHostSuffixes …` ≥ `1`).
   2. Sao lưu (mục 3) — nếu áp cùng ZC15 thì dùng chung bản sao lưu của ZC15.
   3. `cd ~/dev/onehub-invest/collector && npm run build` — `grep -c altUrlForJpg dist/core/media-fetch.js` ≥ `1`. Bước ghi tệp
      hậu tố host của ZC15 (mục 1.4 hồ sơ ZC15) làm trong cùng lượt.
   4. `launchctl kickstart -k gui/$(id -u)/com.oneinvest.collector-api` (lời riêng của Mạnh); `curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:9210/agent-report` trả `401`.
2. **Số chạy thử.** Hộp cát: `cd collector && npm test` → 88/88 (gồm ca 2511-3 và hai ca ZC16); round-trip
   `bash _acceptance/s03-jpg-path-fallback/ap-may-thu/kiem.sh` → bộ tải nhánh `ĐẠT — 2 bài có ảnh · 0 mất hết ảnh`, bộ tải ZC15
   `KHÔNG ĐẠT — ảnh link /jpg/ lỗi http-400 100.0% > 5%`. Số «trước» trên máy thu (đo 25/11, ngày đăng VN): mất hết ảnh 24/11 27,5%,
   ảnh link `/jpg/` lỗi 400 trong ngày 24/11 1.069; tỉ lệ đích tính trên cùng ngày (bỏ bài chỉ hỏng vì 400 `/jpg/`, r2.dev,
   redirect-host) 0,4%; làn thu đo 15–25/11: 22,9% → 8,1% (link cũ quá ba tuần 404).
3. **Sao lưu trước.** Ngay trước bước 1.3 (chung với ZC15), bản sao `collector/dist.bak-$G` và mốc giờ `/tmp/zc16-moc.txt`:
   ```bash
   G=$(date +%Y%m%d%H%M); C=~/dev/onehub-invest/collector
   cp -R "$C/dist" "$C/dist.bak-$G" && date -u +%Y-%m-%dT%H:%M:%SZ > /tmp/zc16-moc.txt && echo "$G" >> /tmp/zc16-moc.txt
   ```
4. **Cách lùi** (≈1′, không đụng dữ liệu). `rm -rf "$C/dist" && mv "$C/dist.bak-$G" "$C/dist"` rồi
   `launchctl kickstart -k gui/$(id -u)/com.oneinvest.collector-api` (cùng lời riêng của Mạnh). Lùi riêng ZC16 mà giữ ZC15:
   `git revert -m 1 <sha commit gộp ZC16>` trên một nhánh, PR lùi, gộp, pull, build lại, khởi động lại. Snapshot đã ghi không bị
   đụng (luật 1).
5. **Lệnh kiểm sau.** Từ 30′ sau bước 1.4, chỉ đọc DB máy thu:
   ```bash
   cd ~/dev/onehub-invest && node _acceptance/s03-jpg-path-fallback/ap-may-thu/kiem-sau.mjs --sau "$(sed -n 1p /tmp/zc16-moc.txt)"
   ```
   Kỳ vọng: `ĐẠT — <n> bài có ảnh · … · link /jpg/ <k> ảnh, có file …, lỗi 400 … (≤5%) · …`, mã 0 — ghi cạnh số chạy thử ở mục 2
   (trước vá 24/11: 1.069/3.347 ảnh `/jpg/` lỗi 400 ≈ 32%; không đòi 0 vì ảnh chia lại từ link cũ chết cả hai biến thể vẫn giữ
   400). `chưa có bài mới` hay `chưa có ảnh link /jpg/ nào` thì đợi 30′ rồi đo lại. Trên 5% → lùi (mục 4), báo GS, không tự sửa. Một ngày VN trọn sau áp:
   `node _acceptance/s03-jpg-path-fallback/ap-may-thu/kiem-sau.mjs --ty-le --ngay 3` — tỉ lệ mất hết ảnh của ngày ấy ≤ khoảng 8%.
