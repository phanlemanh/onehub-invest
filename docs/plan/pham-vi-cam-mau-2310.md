# Bản phạm vi — cầm máu + nền vận hành từ audit 23/10

> Nguồn: `docs/audit/2026-10-23-hien-trang-va-lo-trinh.md` §6 Đợt 0 và Đợt 1 (PR #25), Mạnh đồng ý đưa vào lộ trình
> ngày 23/10. Chỉ mã việc PHÁT TRIỂN; việc vận hành (áp 037 + xoá sessions, tắt project Vercel cũ, nạp plist,
> cấp BACKUP_DIR) liệt ở «Ra khỏi kho» của PR. Mã giữ theo số mục của audit (`A0.x`, `A1.x`). Mục 0.4 (rút tin
> mock) đã là PL1/PL2 của đợt `phan-loai-2310`; mục 1.1 là điều kiện đo nền, không phải việc.

<!-- <<<PHAM-VI-MA -->
```
dot: cam-mau-2310
dang: lan-va
nguon: onehub-invest-tri-thuc:wiki/dot/cam-mau-2310.md#13fb7b0d691eb98809e5d5c1d6b45774bf4995d4

- `A0.2` — leak gate của sync cloud đỏ khi role anon còn SELECT được bảng nào
- `A0.5` — /api/v1/deals công khai tạm chỉ trả cho token ops cho tới khi tin mock được rút
- `A0.6a` — job đêm thoát khác 0 khi DB không tới; cảnh báo khi DB sập
- `A0.6b` — check-freshness đo theo nguồn thật, thêm SLO S05/S06, hết báo quá hạn giả
- `A0.6c` — audit-all hết PASS giả (backup, membership S03) và trỏ đúng cổng app
- `A0.6d` — /ops và /ops/collections dùng chung một nguồn số SLO
- `A0.7` — DB local tự khởi động lại (restart trong docker-compose)
- `A0.8` — backup tuần V1 của DB local
- `A0.9` — ROADMAP §2.5/§4 và CONTEXT-PRODUCT §5 khớp thực tế
- `A1.2` — ranh giới khu vực đúng: gỡ 33 khu vực cấp tỉnh khỏi vn-hanoi, dựng phường Đà Nẵng
- `A1.3` — sổ migration đã áp ở DB local và cloud, so được với db/migrations
- `A1.4` — CI chạy typecheck và test của app, pipeline, agent, data-api
- `A1.5` — coverage trên cloud bằng bản registry đã gọt tầng A qua ops-facts
- `A1.6` — data-api có bản deploy chạy được hoặc ghi rõ hoãn
```
<!-- PHAM-VI-MA>>> -->
