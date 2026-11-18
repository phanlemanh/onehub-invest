# Nối phân khu S16 trùng nơi về nút đã có (DA46)

## Vấn đề

Thẻ luật phân khu S16 của DA37 chỉ nhận nút sẵn khi tên chuẩn hoá khớp đúng, và chỉ xét nút `subzone` là con trực tiếp của dự án. Nó
không dùng bằng chứng S09 trên chính dòng toà. Vì vậy luật số 2 đúc 51 nút mới, trong đó bảy nút trùng nơi với nút đã có, và view
`v_toa_nut_vung` kéo 50 toà sang các nút trùng.

## Cách làm

1. **Bước khớp** (`keHoachPhanKhu`): tìm khoá khu trên cả cây của dự án, mọi loại nút chưa nghỉ. Khu chưa gán thì xét bằng chứng S09
   của các toà trong khu: ít nhất một nửa số toà của khu có S09 và mọi toà có S09 cùng về một nút (cụm thắng phân khu cha) thì nhận nút đó; rẽ từ hai nút trở lên thì «mơ hồ», không đúc; dưới một nửa hoặc không có bằng chứng thì giữ luật tên như cũ.
2. **Thẻ luật bổ sung** (`phan-khu-s16.mjs --the-noi`, `--noi --bam`, `--dao-noi`, `--kiem-noi`): thẻ liệt từng cặp, số toà có bằng chứng
   trên tổng toà, và các ca không nối kèm lý do. Áp đúng băm: chuyển khoá khu và bí danh về nút cũ; nút mới mang `meta.nghi`, thành con
   của nút giữ lại, không xoá. Giữ id cũ vì 39 dòng `buildings.region_node_id` đang trỏ nút cũ và rào chỉ-thêm 082 cấm đổi cột đó.
3. **Bên đọc nút**: danh bạ Ops và danh sách phân khu của thẻ địa chỉ nhóm bỏ nút nghỉ. Cổng Invest và API công khai chỉ đọc nút dự án.
   Lượt dựng đêm không nhận nút nghỉ vì nút đã rời cấp con của dự án.

Không có migration: dòng luật dùng bảng `project_link_rules` đã có, nút dùng `asset_nodes`.

## Bảy cặp nối

| Dự án | Nút mới | Nút giữ lại | Loại nút giữ lại | Toà có S09 trên tổng toà |
|---|---|---|---|---|
| Ocean Park 1 | 394 The Sapphire 1 | 41 S1 | cụm cháu | 11/11 |
| Ocean Park 1 | 392 The Sapphire 2 | 42 S2 | cụm cháu | 15/15 |
| Ocean Park 1 | 391 Ruby 1 | 40 R1 | cụm cháu | 4/4 |
| Ocean Park 1 | 395 London | 33 The London | phân khu con trực tiếp | 3/3 |
| Ocean Park 1 | 397 Paris | 27 The Paris | phân khu con trực tiếp | 5/5 |
| Grand Park | 382 The Beverly | 23 The Beverly | nút `building` | 6/7 |
| Grand Park | 388 Glory Heights | 43 The Glory Heights | phân khu con trực tiếp | 5/5 |

Sàn một nửa số toà chặn ca một toà có S09 kéo cả khu đi theo; tỉ lệ thấp nhất của bảy cặp là 6/7.

## Bảng phủ ca

Số đếm trên DB máy thu 18/11 sau khi áp luật số 2, chỉ đọc.

| Chiều | Giá trị | Số trong ô | Xử lý | Ai đọc đầu ra phía sau |
|---|---|---|---|---|
| Khu trên thẻ luật | đã có nút trước luật 2 (cùng tên) | 10 | không đổi | view toà, Ops |
| Khu trên thẻ luật | nút mới, toà có S09 về một nút cũ | 7 khu, 50 toà | nối về nút cũ | view toà, PL20, Ops |
| Khu trên thẻ luật | nút mới, toà có S09 rẽ hai nút (387 → 46, 47) | 1 khu, 8 toà | ngoài phạm vi, vì một khu S16 phủ hai phân khu S09, cần người chọn | Ops |
| Khu trên thẻ luật | nút mới, không có bằng chứng S09 | 43 khu | giữ nguyên | view toà, Ops |
| Cặp nối | nút cũ là `subzone` con trực tiếp | 3 (33, 27, 43) | nối | bước khớp |
| Cặp nối | nút cũ là cụm cháu của dự án | 3 (40, 41, 42) | nối, cụm thắng phân khu cha | bước khớp |
| Cặp nối | nút cũ loại `building` | 1 (23) | nối | bước khớp |
| Trùng không có bằng chứng toà | 398 Sapphire 2, 0 toà | 1 | ngoài phạm vi, vì không có toà để chứng | người xem ở Cổng Phạm vi |
| Trùng không có bằng chứng toà | 389 Rainbow với 48 The Rainbow | 1 | ngoài phạm vi, vì chỉ gần tên | người xem ở Cổng Phạm vi |
| Trùng giữa các nút mới | 409/412, 419/421, 406/411 | 3 cặp | ngoài phạm vi, vì không có nút cũ làm đích và tối đa 1 toà | người xem ở Cổng Phạm vi |

Bên đọc `asset_nodes`: `app/src/lib/ops/registry/doc.ts` và `du-an.ts` (danh bạ Ops), `app/src/lib/the-dia-chi-nhom.ts` (phân khu của thẻ
địa chỉ), `pipeline/lib/s09-dung.mjs` và `s16-dung.mjs` (dựng đêm), `pipeline/sync-cloud.mjs` (đồng bộ nguyên bảng), `app/src/lib/deals.ts`
và `data-api/src/routes/deals.ts` (chỉ nút dự án). PL20 đã lọc nút nghỉ trên nhánh của nó; hiện chưa có bảng nào lưu id nút của PL20.

## Số đo trên bản chép DB máy thu (18/11)

Áp thử: 50 toà đổi nút, đều về đúng nút cũ; 0 toà khác đổi; 0 nút ngoài 14 nút của các cặp đổi; toà S16 treo dưới dự án 0. Sau áp: 41 = 11,
42 = 16, 40 = 4, 23 = 7, 43 = 5, 33 = 3, 27 = 5; bảy nút nghỉ 0 toà và là con của nút giữ lại. Dựng lại năm khu: 0 khoá mới, 0 phân khu S09 mới,
tổng nút giữ 429. Lùi: 0 toà lệch, 0 nút lệch (gồm nút cha, meta, bí danh), còn một dòng luật đã đảo.
