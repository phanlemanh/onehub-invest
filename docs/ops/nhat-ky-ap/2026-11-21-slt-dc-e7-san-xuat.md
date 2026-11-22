# Nhật ký đo sau gộp — slt-dc-cham-va-giu-khoa-33033 (E7, AC-7), 21/11/2026

Hồ sơ: `_acceptance/slt-dc-cham-va-giu-khoa-33033/` (PR #505, gộp vào `main` 718c893ca). Lệnh kiểm sau ở
`_acceptance/slt-dc-cham-va-giu-khoa-33033/ap-may-thu.md` bước 5. Hồ sơ đã chấm giữ nguyên; số sau gộp ghi ở nhật ký này.

Không có bước áp DB: mã chạy từ checkout chính. Checkout chính kéo main 718c893ca lúc 2026-11-20T15:45:38Z.

## Ba mốc (ghi trước khi kéo main)

| Mốc | Giá trị |
|---|---|
| `--tu-dong` (`pipeline/logs/s03-nap-15phut.log`, số dòng) | 34590 |
| `--chotot-tu-dong` (`pipeline/logs/chotot.log`, số dòng) | 2465 |
| `--gop-luc` | 2026-11-20T15:45:24Z |

## Lệnh và đầu ra

Chạy lúc 2026-11-21T00:54Z ở checkout chính, chỉ đọc log và DB máy thu, exit 0:

```
node _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/san-xuat.mjs --tu-dong 34590 --chotot-tu-dong 2465 --gop-luc 2026-11-20T15:45:24Z
tự kiểm: log lành đạt, log có bước 400 s đỏ «LAT»
transform-zalo: bốn bước 124, 95, 75, 103 s · trung vị 99 s
transform-chotot: mã 0 · 378 s
rút thay-boi-luot S03: 2 giờ trước 0 · 2 giờ sau 0
rút thay-boi-luot S06: 2 giờ trước 0 · 2 giờ sau 0
SAN XUAT OK
```

## Số theo lượt

| Bước | Lượt | Số | Đích |
|---|---|---|---|
| transform-zalo nhanh | bốn lượt 15′ liền nhau đầu tiên sau mốc, khoảng 00:00–00:54Z 21/11 (lượt nhanh nghỉ sau 22h VN) | 124 · 95 · 75 · 103 s, trung vị 99 s | ≤ 123 s |
| transform-chotot | lượt `chotot-daily` đầu tiên sau mốc, sáng 21/11 | mã 0, 378 s | ≤ 400 s |
| rút `thay-boi-luot` | 2 giờ trước / sau mốc | S03 0/0 · S06 0/0 | không vượt |
| transform-zalo đầy đủ (tham khảo, ngoài thước) | `zalo-import-daily` bắt đầu chiều 20/11, bước transform chạy mã mới xong 17:06Z | 92 s (ba lượt đầy đủ trước: 49 · 89 · 82 s) | — |

Kết luận: E7 đạt — SAN XUAT OK.

## Ghi chú và theo dõi

transform-chotot 378 s chậm hơn ba lượt trước gộp (169 · 276 · 201 s), lúc máy tải khoảng 9 (load average lúc 00:08Z
8,66 / 10,22 / 9,23). Theo dõi hai lượt kế (sáng 22/11, 23/11): một lượt vượt 400 s khi máy không tải thì báo giám sát, không tự
sửa.
