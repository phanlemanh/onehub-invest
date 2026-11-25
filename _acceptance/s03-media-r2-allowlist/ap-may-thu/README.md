# Áp lên máy thu — s03-media-r2-allowlist (ZC15)

Không migration, không ghi dữ liệu DB, không plist mới. Collector API (`com.oneinvest.collector-api`) chạy
`collector/dist/api/main.js` của checkout chính → mã mới chỉ có hiệu lực sau khi build lại `dist` và khởi động lại dịch vụ.
Host đích chuyển hướng (họ băm md5 `99ee4ac919`) là tầng A: tên thật chỉ đi vào `collector/state/media-host-suffixes.txt`
(gitignored, mode 600) — không in ra màn, không lên kênh.

Người làm: phiên ZCode vận hành (ZV) theo lời GIAO triển khai của LL sau khi PR gộp và GS chuyển lời. Phiên dãy ZT không
làm bước nào dưới đây.

1. **Lệnh áp.** Giờ áp: NGOÀI 05:30–06:30 và 14:00–14:45 giờ VN. **Khởi động lại collector API cần lời riêng của Mạnh** —
   chữ ký Cổng Bằng chứng của hồ sơ này phủ đúng bước 1.5; không có chữ ký thì dừng sau bước 1.4.
   1. `git -C ~/dev/onehub-invest pull --ff-only origin main`; kiểm `grep -c 'R2_SUFFIX_ZC9\|parseHostSuffixes\|MEDIA_ACCEPT' ~/dev/onehub-invest/collector/src/core/media-fetch.ts` ≥ `3`.
   2. Sao lưu (mục 3).
   3. `cd ~/dev/onehub-invest/collector && npm run build` — `grep -c parseHostSuffixes dist/core/media-fetch.js` ≥ `1`.
   4. Ghi tệp hậu tố từ tệp nghiên cứu local của LL, không in tên (lệnh tự chọn họ host có băm `99ee4ac919`):
      ```bash
      cd ~/dev/onehub-invest/collector && node -e '
      const fs=require("fs"),c=require("crypto");
      const t=fs.readFileSync(process.env.HOME+"/dev/onehub-invest-zcode/research-local/do-2411-46-host-redirect.txt","utf8");
      const ho=[...new Set((t.match(/https?:\/\/[^\s\/"]+/g)||[]).map(u=>new URL(u).hostname.split(".").slice(-2).join(".")))]
        .filter(h=>c.createHash("md5").update(h).digest("hex").startsWith("99ee4ac919"));
      if(ho.length!==1){console.error("không thấy đúng một họ host 99ee4ac919");process.exit(1)}
      fs.mkdirSync("state",{recursive:true});
      fs.writeFileSync("state/media-host-suffixes.txt","# ZC15 host đích chuyển hướng (họ 99ee4ac919) — tầng A, không chép ra ngoài\n"+ho[0]+"\n",{mode:0o600});
      console.log("đã ghi 1 hậu tố");'
      ```
   5. `launchctl kickstart -k gui/$(id -u)/com.oneinvest.collector-api` (lời riêng của Mạnh). Bộ tắt êm đẩy hết tin trong
      bộ đệm thành snapshot trước khi thoát (hạn 45 giây). Rồi `grep 'hậu tố thêm từ máy' ~/dev/onehub-invest/pipeline/logs/launchd-collector-api.log | tail -1`
      phải là `media: 2 hậu tố mặc định + 1 hậu tố thêm từ máy`; `curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:9210/agent-report` trả `401` (sống, đòi khoá).
2. **Số chạy thử.** Hộp cát, không chạm máy thu: `cd collector && npm test` → 85/85 (gồm 5 ca ZC15 và 2 ca ZC9); round-trip
   `bash _acceptance/s03-media-r2-allowlist/ap-may-thu/kiem.sh` → bộ tải của nhánh ra `ĐẠT — 3 bài có ảnh · 0 mất hết ảnh`,
   bộ tải của main ra `KHÔNG ĐẠT — còn 1 ảnh r2.dev lỗi host-not-allowed; còn 1 ảnh lỗi redirect-host`. Số «trước» trên máy
   thu (đo 25/11, ngày đăng VN): tỉ lệ bài có ảnh mà mất hết ảnh 22/11 33,7% · 23/11 28,2% · 24/11 27,5%; ảnh r2.dev bị chặn
   326 và redirect-host 17 trong ngày 24/11. Ước sau áp: 24/11 27,5% → 20,9% (phần còn lại là http-400 zdn.vn, ngoài phạm vi).
3. **Sao lưu trước.** Ngay trước bước 1.3:
   ```bash
   G=$(date +%Y%m%d%H%M); C=~/dev/onehub-invest/collector
   cp -R "$C/dist" "$C/dist.bak-$G" && date -u +%Y-%m-%dT%H:%M:%SZ > /tmp/zc15-moc.txt && echo "$G" >> /tmp/zc15-moc.txt
   ```
   `collector/state/media-host-suffixes.txt` chưa có trước áp — không cần sao lưu.
4. **Cách lùi** (≈1′, không đụng dữ liệu). `rm -rf "$C/dist" && mv "$C/dist.bak-$G" "$C/dist"` rồi
   `launchctl kickstart -k gui/$(id -u)/com.oneinvest.collector-api` (cùng lời riêng của Mạnh). Muốn chỉ tắt host đích mà
   giữ r2.dev: xoá `collector/state/media-host-suffixes.txt` rồi khởi động lại. Mã: `git revert -m 1 <sha commit gộp>` trên
   một nhánh, PR lùi, gộp, pull, build lại. Snapshot đã ghi không bị đụng (luật 1).
5. **Lệnh kiểm sau.** Từ 30′ sau bước 1.5 (đủ vài nhịp poll và một lượt nạp S03 15′), chỉ đọc DB máy thu:
   ```bash
   cd ~/dev/onehub-invest && node _acceptance/s03-media-r2-allowlist/ap-may-thu/kiem-sau.mjs --sau "$(sed -n 1p /tmp/zc15-moc.txt)"
   ```
   Kỳ vọng: `ĐẠT — <n> bài có ảnh · … · r2.dev có file ≥1 · r2.dev bị chặn 0 · redirect-host 0 · .jxl <k>`, mã 0 — ghi dòng
   ấy cạnh số chạy thử ở mục 2. `KHÔNG ĐẠT — chưa có bài mới có ảnh` hay `chưa có ảnh r2.dev nào tải được` thì đợi thêm 30′
   rồi đo lại (r2.dev khoảng 330 bài/ngày). Còn ảnh r2.dev bị chặn hay redirect-host mới → lùi (mục 4), báo GS, không tự sửa.
   Một ngày VN trọn sau áp: `node _acceptance/s03-media-r2-allowlist/ap-may-thu/kiem-sau.mjs --ty-le --ngay 3` — tỉ lệ mất
   hết ảnh của ngày ấy giảm đúng phần r2.dev + redirect-host (so 24/11: 27,5% → khoảng 20,9%); `.jxl` > 0 thì báo LL kèm số.
