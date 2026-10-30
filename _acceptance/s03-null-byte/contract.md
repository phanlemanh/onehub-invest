---
schema_version: 1
feature: bộ nạp S03 lọc U+0000 khỏi mọi chuỗi trước khi ghi stg_zalo_posts — gỡ kẹt nạp đêm từ 29/10
slug: s03-null-byte
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: machine-cleared
veto_state: mo
veto_opened_at: 2026-10-30T10:38:43Z
approved_by:
approved_at:
---

# Acceptance Contract: s03-null-byte

## Context

Lượt `zalo-import-daily` 00:00 (+07) 30/10 thoát 1 ở bước nạp S03: snapshot `hanoi__zalo-agent__2026-10-29T042737822`
có ký tự U+0000 trong chuỗi, Postgres từ chối (`invalid byte sequence for encoding "UTF8": 0x00`). Script giữ con trỏ
state ở snapshot hỏng nên mỗi đêm thử lại đúng nó — S03 không nạp được gì mới từ 04:27Z 29/10 (tồn ~1.360 snapshot),
và các bước transform sau không chạy. Snapshot bất biến (luật 1), nên sửa ở bên đọc: ZCode (claudedp-3010-3, nhánh
`zcode/s03-null-byte` @ 835cdf3f) thêm `stripNullBytes` đệ quy và áp vào mọi tham số chuỗi/jsonb của lệnh INSERT
`stg_zalo_posts` trong `pipeline/import-airbnb.mjs`.

Source input: GIAO claudedp-3010-3 (giám sát dot0, 30/10) + XONG của ZCode lúc 10:35Z.

## Criteria

- AC-1: Given nhánh, When chạy `node --test scripts/s03-null-byte.test.mjs` trong `pipeline/`, Then exit 0 — hàm lọc bỏ U+0000 ở chuỗi phẳng, mảng, đối tượng lồng, cả khoá; giữ nguyên số, null, undefined.
- AC-2: Given một snapshot GIẢ đúng khuôn (U+0000 trong text, tên người gửi, tên nhóm, media lồng hai tầng, meta.mediaFiles), When nạp vào một DB tạm chỉ có `airbnb_snapshots` + `stg_zalo_posts` (schema chép từ DB local), Then exit 0, đúng 1 dòng, mọi giá trị là bản gốc bỏ U+0000 (phần còn lại giữ nguyên, `media_files[].snapshotId` còn).
- AC-3: Given cùng snapshot giả, When nạp bằng importer TRƯỚC bản sửa (merge-base với main), Then ĐỎ với lỗi Postgres về 0x00 — snapshot giả tái hiện đúng lỗi thật, bản sửa không che lỗi khác.
- AC-4: Given DB local sau lượt chạy thật của ZCode từ nhánh, When đếm `stg_zalo_posts`, Then snapshot hỏng 29/10 04:27Z đã có dòng và có dòng của snapshot sau nó — bản sửa qua được dữ liệu thật (chỉ đọc).
- AC-5: Given cùng snapshot giả, When nạp lần hai, Then vẫn exit 0 và vẫn 1 dòng — nạp lại không nhân dòng (upsert giữ nguyên).
- AC-6: Given nhánh so với main, When liệt kê tệp đổi, Then chỉ có `pipeline/import-airbnb.mjs`, `pipeline/scripts/s03-null-byte.test.mjs`, hồ sơ này, `_acceptance/config.yaml`, `PRODUCT-MAP.md`, `LO-TRINH.html`; trong importer, dòng bị thay chỉ là tham số của INSERT `stg_zalo_posts` — không chạm nhánh Airbnb, S08, OSM hay `airbnb_snapshots`.

## Coverage

- Bỏ coverage-scan — vòng hẹp sửa gấp một lỗi nạp; trục rủi ro liệt kê thẳng: hàm đúng (AC-1), đường nạp đầu-cuối
  (AC-2), đúng nguyên nhân (AC-3, đối chứng âm), dữ liệu thật (AC-4), không nhân dòng (AC-5), không lan sang nguồn
  khác (AC-6).

## Out of scope

- Sửa hay xoá snapshot gốc — bất biến; chỉ lọc lúc đọc.
- Nạp bù ~1.360 snapshot tồn sau mốc state — việc triển khai sau gộp (GIAO riêng cho ZCode chạy `zalo-import-daily` trên checkout chính), không thuộc mã nhánh.
- Lọc U+0000 cho nhánh Airbnb, S08, OSM hay manifest `airbnb_snapshots` — chưa có ca lỗi; thêm khi có số đo (luật 11).
- Tìm vì sao collector ghi U+0000 vào snapshot — làn ZCode, việc riêng nếu lặp lại.

## Notes

Gấp: cần gộp trước 17:00Z 30/10 (00:00 31/10 +07, trước lượt chạy đêm).
