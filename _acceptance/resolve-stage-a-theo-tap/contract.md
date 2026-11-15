---
schema_version: 1
feature: Stage A của bộ dựng căn chạy theo tập — cùng tập căn và link như vòng mỗi cụm, xong dưới 5 phút thay vì hàng giờ
slug: resolve-stage-a-theo-tap
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
design_doc: docs/superpowers/specs/2026-11-15-resolve-stage-a-theo-tap-design.md
veto_state: mo
veto_opened_at: 2026-11-15T03:40:00Z
---

# Acceptance Contract: resolve-stage-a-theo-tap

## Context

Lượt chuỗi đêm 22:30Z 14/11 kẹt ở Stage A của `pipeline/resolve-properties.mjs` hơn 3 giờ 28 phút: mỗi cụm một câu nối lại cả
`stg_chotot_ads`, 90 nghìn cụm thành bình phương. Các bước sau resolve (metrics, `xep-hang-gia`) không chạy kịp, hạng giá không
tươi — hàng nằm trên đường găng nhịp 1. Bản mới tính khoá cụm một lần vào bảng tạm của phiên rồi xử mọi cụm bằng vài câu. Luật
gom không đổi; Stage B vẫn đóng băng.

## Criteria

### AC-1 — Cùng kết quả với vòng mỗi cụm
Given hai bản chép DB máy thu cùng dữ liệu (mẫu `list_id % 20 = 0` của `stg_chotot_ads`), đưa về trạng thái trước lượt đêm
14/11 22:30Z (xoá căn và link tạo từ mốc ấy trên bản chép),
When bản cũ (rút từ mốc nhánh `d2b4beaf`, cùng chữ với `origin/main` lúc mở hàng) chạy trên một bản chép và bản mới chạy trên bản kia,
Then tập (stable_key, offer_id, score, signals) của `property_offers` và tập căn (stable_key, n_evidence, first_seen, last_seen,
area_id, kind, property_type, geo, verification, resolved_by, cluster_key) bằng nhau, lệch 0; dòng log `Stage A:` hai bản giống
hệt; và lượt thật sự chạy qua đường chèn: ít nhất 1 căn mới và 1 link mới, không thì phép so thoát 1.

### AC-2 — Phép so thấy lệch
Given hai bản chép mà bản mới mang sẵn một link khác bản cũ,
When chạy phép so của AC-1,
Then phép so in «TỔNG lệch 1» và thoát 1; đối chứng âm trong lượt (bỏ một link khỏi ảnh mới) thấy lệch đúng 1.

### AC-3 — Dưới 5 phút trên đủ dữ liệu
Given bản chép DB máy thu đủ dữ liệu (110 nghìn dòng stg, ~90 nghìn cụm), đưa về trước lượt đêm 14/11 22:30Z,
When bản mới chạy một lượt resolve,
Then lượt xong dưới 300 giây và chèn ít nhất 1.000 link (cỡ một lượt đêm — đo 15/11: 9.316 link, 8.107 căn); trần hạ về 0
giây thì phép đo in «VƯỢT TRẦN» và thoát 1.

### AC-4 — Chạy lại không đổi gì
Given bản mới vừa chạy xong trên một bản chép,
When chạy lần hai trên cùng dữ liệu,
Then dòng log mang «+ 0 NEW», số link không đổi, tập căn và link lệch 0 so với sau lần một.

### AC-5 — Chữ SQL được ghim lại, không câu gọi thẳng client
Given bản chụp SQL của Stage A (`pipeline/lib/thu-lai-deadlock.sql-base.json`) chụp lại ở hàng này,
When chạy test RTLD-AC-7,
Then mọi câu SQL trong `resolve-properties.mjs` khớp bản chụp, không câu nào gọi thẳng `c.query`.

### AC-6 — Deadlock thật vẫn được thử lại
Given vũ đạo deadlock thật của hồ sơ resolve-thu-lai-deadlock trên DB thử riêng,
When Stage A theo tập gặp 40P01 ở câu chèn link,
Then resolve hoàn tất, kết quả bằng lượt sạch, dòng tổng kết thử lại đúng khuôn (RTLD-AC-5, 6, 8).

### AC-7 — Người đọc cũ của Stage A còn xanh
Given itest Stage B đóng băng và itest khoá gộp căn không giá trên DB của riêng lượt,
When chạy hai itest,
Then itest Stage B thoát 0; ở itest khoá gộp, mọi ca gọi bộ dựng căn (KGC-AC-2, AC-4…AC-7, AC-9, KGC-CAT) xanh, và chỉ ba ca
tiền đề trước-098 (KGC-AC-8, KGC-AC-1, KGC-AC-3) đỏ — chúng đòi DB chưa áp 098 trong khi DB máy thu đã áp, nên đỏ ở câu kiểm tiền
đề trước khi gọi bộ dựng căn, trên main cũng vậy (itest thoát 1, đạt-có-giới-hạn).

### AC-8 — Không DDL lên lược đồ
Given diff của nhánh so với `origin/main`,
When liệt kê tệp đổi trong `db/migrations/`,
Then không có tệp nào; bảng tạm chỉ là `CREATE TEMP TABLE` trong phiên (AC-5 ghim chữ).

## Coverage

Trục (preset risk-premortem cho «viết lại một bước dựng căn, giữ kết quả»):

- Lớp cụm: khớp căn · mới có tin chưa gắn · mới toàn tin đã gắn · khớp còn tin chưa gắn — AC-1 trên dữ liệu thật (đếm ở design §Bảng phủ ca).
- Lớp tin: đã gắn · chưa gắn — AC-1. Thiếu toạ độ (30 tin), thiếu m², giá ≤ 0, cấp thị trường, list_id trùng, thuộc nhiều cụm: số đếm 0 hoặc gần 0 trên dữ liệu nên AC-1 không chạy qua — chưa phủ bằng dữ liệu; điều kiện lọc (hai hằng CLUSTER_EXPR, KHONG_CAP_THI_TRUONG và mệnh đề lọc tin S06) được so chữ với bản cũ `d2b4beaf` ở lượt AC-1 (dòng «điều kiện lọc: khớp …», có đối chứng âm); AC-5 chỉ ghim chữ SQL từ hàng này về sau, bản chụp rút từ chính hàng này.
- Lượt: lần đầu (AC-1, AC-3) · lần hai (AC-4) · gặp deadlock (AC-6).
- Thước: phép so có chiều đỏ (AC-2) · phép đo giờ có chiều đỏ (AC-3).
- Người đọc phía sau: tập dòng không đổi (AC-1) · itest cũ (AC-7).

Core: AC-1…AC-8.

## Đường đo

| Ngưỡng của hàng | Đo ở |
|---|---|
| «bản mới cho ra đúng tập (property_id, offer_id) như bản cũ trên cùng dữ liệu, lệch 0» | AC-1 (so theo stable_key — id căn mới không tất định ở bản cũ) |
| «Stage A xong dưới 5 phút trên bản chép mới nhất» | AC-3 |
| «sau gộp, lượt chuỗi thật kế tiếp chạy trọn, bước resolve trong log dưới 10 phút» | trên máy thật sau gộp: log `scripts/chotot-daily.sh` lượt kế (`pipeline/logs/`), giám sát đọc |

## Out of scope

- Phép so bản cũ trên ĐỦ dữ liệu: CHƯA ĐO — bản cũ chạy hàng giờ (671 giây chỉ trên mẫu 10%), lượt đủ dữ liệu bị dừng giữa chừng để nhường máy (giám sát 15/11). Căn cứ thay: mẫu 10% lệch 0, mẫu trước lượt đêm lệch 0 có chèn căn và link, chiều đỏ của phép so; một lượt đủ dữ liệu chạy khi máy rảnh, ghi ở Notes.
- Đổi luật gom (khoá cụm, ngưỡng lưới), Stage B, `goSdtKhoiCan`, `dienDuongCan`, các bước khác của chuỗi đêm.
- Dừng hay đụng lượt resolve đang chạy trên DB máy thu: hàng không chạm DB `oneinvest`, chỉ đếm chỉ đọc.
- Ca RTLD-AC-9 (điểm vào CLI, ô lỗi 42P10) đỏ sẵn trên main d2b4beaf (`0 !== 1`), không thuộc hàng; E6 bỏ ca này.

## Notes
- Phép so đủ dữ liệu (ngoài lượt chấm, bù cho mẫu 5%): `node pipeline/scripts/resolve-so-stage-a.mjs --cu <bản chép A> --moi <bản chép B>` trên hai bản chép đủ dữ liệu dựng 15/11 ~03:00Z; kết quả ghi vào `_acceptance/resolve-stage-a-theo-tap/so-du-lieu-du.log` khi máy rảnh — chưa chạy được thì Cổng Bằng chứng ghi rõ «chưa đo», không chặn (giám sát 15/11).
- Gộp là chạy thật: launchd chạy chuỗi từ checkout chính, lượt kế sau gộp dùng mã mới. Không migration, không lượt ghi dữ liệu riêng — chữ ký không kèm lời áp nào.
