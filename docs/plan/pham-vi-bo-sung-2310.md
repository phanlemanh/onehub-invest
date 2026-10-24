# Bản phạm vi — bổ sung 23/10 (phát sinh trong đợt dot0-cam-mau)

> Hai lỗ lộ ra khi thi công, đều ngoài câu giao của hàng đang chạy nên không vá trong vòng đó:
> - `HK1`: nghiệm thu ZC2 vòng 3 (23/10, phiên điều phối liên làn) — hook Zalo không retry; chú thích «agent tự
>   retry» trong `collector/src/main.ts` và quyết định d-3 của hồ sơ `collector-graceful-shutdown` sai. Phải xong
>   TRƯỚC ZC4, vì chuyển collector API sang launchd là một lần khởi động lại. Làn ZCode, giao qua phiên liên làn.
> - `CS1`: AU3 Cổng Phạm vi Hỏi-1, Mạnh chọn A (23/10): AU3 giữ T2, lỗ cloud-sync vá ở một hàng T3 riêng
>   (yêu cầu P3-3 của đợt dot0-cam-mau). Hai tệp thuộc `t3_paths`.

> - `KV1`–`KV3`: nghiệm thu PL4 `kev-thanh-nhan` + ZC1 (phiên liên làn, 23/10, nhánh `claude/acceptance-kev-nhan`)
>   lộ ra ba việc làn Claude khi hook thôi lọc theo điểm Kev. Phần làn ZCode (Kev không timeout, ingest 500 khi media
>   hỏng…) đã giao ZCode (claudedp-2310-24), không cắt ở đây.

<!-- <<<PHAM-VI-MA -->
```
dot: bo-sung-2310
dang: lan-va
nguon: nghiệm thu ZC2 vòng 3 (phiên điều phối liên làn, 23/10); AU3 Cổng Phạm vi Hỏi-1 A (Mạnh, 23/10), yêu cầu P3-3 đợt dot0-cam-mau

- `HK1` — hook Zalo ghi tin gửi lỗi tới collector API vào spool cục bộ append-only và gửi lại ở event kế hoặc theo nhịp, không mất tin khi :9210 khởi động lại
- `CS1` — cloud-sync.sh thoát khác 0 khi sync-cloud hỏng dù push-ops-facts lành; push-ops-facts.mjs đọc DATABASE_URL thay chuỗi kết nối viết cứng
- `KV1` — backfill-zalo-media nhận snapshot schemaVersion 3; `zalo_media_backfill --check` không còn xanh giả khi snapshot v3 thiếu ảnh
- `KV2` — phễu «skip» của cổng Kev trên audit-all và trang Ops đếm theo meta.kev.p thay dòng log «skip p=» mà hook không còn ghi
- `KV3` — hết lọc Kev, dữ liệu Zalo vào raw/stg dự kiến phình ×3: đo dung lượng và thời gian chạy transform-zalo + sync cloud trước khi bật
```
<!-- PHAM-VI-MA>>> -->
