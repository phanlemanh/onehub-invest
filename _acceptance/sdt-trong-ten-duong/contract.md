---
schema_version: 1
feature: Chuỗi đường chứa số điện thoại không lên tin và căn
slug: sdt-trong-ten-duong
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: approved
approved_by:
veto_state: mo
veto_opened_at: 2026-11-03T04:45:00Z
design_doc: docs/superpowers/specs/2026-11-03-sdt-trong-ten-duong-design.md
---

# Acceptance Contract: sdt-trong-ten-duong

## Context

Ngoài-4 của `s06-duong-du-an-len-tin`: người bán S06 gõ số điện thoại vào ô đường. Đo 03/11 có 55 tin nguồn mang số trong đường, 61.171 tin có đường, và một giá trị đã nằm ở
tin và căn. Hai cột đó lên cloud và danh sách API, trong khi luật 6 chỉ cho trả số khi bấm «Xem số». Giám sát giữ PR #291 tới khi có bản vá này.

**Dãy số** trong hợp đồng này: từ 9 chữ số trở lên, giữa hai chữ số có tối đa một dấu cách, chấm hoặc gạch.

## Criteria

- AC-1: Given bảng «Ma trận AC-1» dưới đây, When đọc từng hàng qua `docDacTrungS06`, và khớp cùng hàng bằng mẫu `MAU_DAY_SO` trong Postgres, Then bộ đọc ra đúng cột «Kết quả», Postgres khớp đúng các hàng «không phát biểu»; ca `DS1-AC-1` đổi đúng một hàng: `Nguyễn Xiển 0912345678` từ giữ nguyên sang không phát biểu, tổng vẫn 27 hàng.
- AC-2: Given bảng «Ma trận AC-2» trên DB thử, phát biểu `legacy` sinh bằng `catChuyen` thật, When chạy `runTransformChotot` thật, Then cột `street_raw` từng tin đúng cột «Kết quả», ô NULL không còn trỏ phát biểu và ô có chữ trỏ phát biểu sống; không còn phát biểu `street_raw` sống mang dãy số; phát biểu `legacy` mang số bị rút với lý do `chua-sdt` và dòng vẫn còn; lượt chạy kế không thêm, không rút, không đổi tin nào. (cross-layer)
- AC-3: Given bảng «Ma trận AC-3» trên DB thử, ô căn và nhật ký sinh bằng `resolve-properties` thật, When chạy `resolve-properties` thật, Then từng ô đúng cột «Kết quả»; ô từng mang số có đúng một mục `src = go-sdt-duong`, ô khác không có; toàn bộ nhật ký của các ô không chứa dãy số; lượt hai không thêm mục; `hoanTacDuong` đảo được ít nhất một mục và không ô nào mang dãy số sau đó. (cross-layer)
- AC-4: Given bản chép DB máy thu (`db/db-thu.sh`), thước từ chối chạy khi `DATABASE_URL` không phải DB thử, và `scripts/chotot-daily.sh` gọi `transform-chotot.mjs` rồi `resolve-properties.mjs` không kèm đối số, When thước chạy đúng hai bước đó và đếm bằng định nghĩa độc lập với mẫu của mã (gộp chữ số cách nhau đúng một dấu rồi tìm 9 chữ số liền), Then trước khi chạy tin và căn đều có ít nhất một giá trị mang số và nguồn có ít nhất một tin mang số; lượt chạy rút ít nhất một phát biểu `chua-sdt` và ghi ít nhất một mục `go-sdt-duong`; sau khi chạy có 0 giá trị mang dãy số ở `sale_offers.street_raw` mọi nguồn, `properties.street`, và các mục `street`, `go-sdt-duong` của `enrichment_log`; mọi tin có nguồn sạch mang đúng chữ `docDuong` đọc ra, mẫu số từ 40.000 tin; 0 ô căn đường sạch bị đổi hoặc mất; in số từng dòng, số chuỗi có chữ bị bỏ, số chuỗi theo định nghĩa rộng; không dòng in nào chứa dãy số. Vi phạm bất kỳ dòng nào thì thoát 1 và in dòng báo cáo. (cross-layer)
- AC-5: Given một tin và một căn vừa về NULL trên DB thử, When dựng câu đọc `localReadSql` + `selectList` và câu tráo `buildSwapSql` thật của `sync-cloud.mjs`, Then lô đọc chứa đúng hai dòng đó với `street_raw`, `street` là null và câu tráo ghi đè hai cột; mục `go-sdt-duong` đi lên cùng lô không chứa dãy số; `field_assertions` không có trong CLOUD_ALLOW, `street_number`, `unit_number` không có trong danh sách cho phép của `sale_offers`. (cross-layer)

## Ma trận AC-1

Số trong mọi bảng là số bịa.

| # | `payload.street_name` | Kết quả |
|---|---|---|
| 1 | `0912345678` | không phát biểu |
| 2 | `Nguyễn Xiển 0912345678` | không phát biểu |
| 3 | `0912345678 Nguyễn Xiển` | không phát biểu |
| 4 | `0912 345 678` | không phát biểu |
| 5 | `091 234 56 78` | không phát biểu |
| 6 | `0912.345.678` | không phát biểu |
| 7 | `0912-345-678` | không phát biểu |
| 8 | `+84912345678` | không phát biểu |
| 9 | `912345678` | không phát biểu |
| 10 | `a/c Nam 0912.345.678` | không phát biểu |
| 11 | `12345678 Lê Lợi` | giữ nguyên |
| 12 | `Số 277 Đường Bến Bình Đông, Phường 14` | giữ nguyên |
| 13 | `Đường 3/2` | giữ nguyên |
| 14 | `12/5A Lê Lợi` | giữ nguyên |
| 15 | `Tỉnh lộ 10` | giữ nguyên |
| 16 | `Km 12 Quốc lộ 1A` | giữ nguyên |
| 17 | `123-125-127 Lê Lợi` | không phát biểu |

## Ma trận AC-2

| # | Nguồn | `legacy` | Kết quả `street_raw` |
|---|---|---|---|
| 1 | có số | có số | NULL |
| 2 | có số | sạch | chữ `legacy` |
| 3 | có số | không | NULL |
| 4 | sạch | có số | chữ nguồn |
| 5 | sạch | sạch | chữ nguồn |
| 6 | sạch | không | chữ nguồn |
| 7 | trống | có số | NULL |
| 8 | trống | sạch | chữ `legacy` |
| 9 | trống | không | NULL |
| 10 | sạch rồi có số | không | NULL |
| 11 | có số rồi sạch | không | chữ nguồn |
| 12 | trống, có sẵn phát biểu nguồn mang số | không | NULL |

## Ma trận AC-3

| Ô căn \ Tin | sạch | không đường | còn số | sạch và còn số |
|---|---|---|---|---|
| có số | chữ tin sạch | NULL | NULL | chữ tin sạch |
| sạch | giữ ô | giữ ô | giữ ô | giữ ô |
| trống | chữ tin sạch | NULL | NULL | chữ tin sạch |

## Coverage

Quét tay theo bốn trục (không dùng khung quét: ít chiều, đo từ dữ liệu thật).

| Trục | Giá trị | AC |
|---|---|---|
| Dạng số trong chuỗi (số tin đo ở design doc) | liền · ngăn khoảng trắng · ngăn dấu chấm · ngăn gạch · +84 · thiếu số 0 · kèm chữ trước, sau · số ngắn của đường thật | AC-1, AC-4 |
| Trạng thái ô tin | nguồn × `legacy` · nguồn đổi hai chiều giữa hai lượt · phát biểu cũ mang số | AC-2 |
| Trạng thái ô căn | ô × tin, 12 ô | AC-3 |
| Nơi đọc | hàm thuần · Postgres · DB thử · bản chép DB máy thu · lô đồng bộ cloud | AC-1 đến AC-5 |

## Out of scope

- Số điện thoại trong `street_number` (85/26.417) và `unit_number` (2/9.040) của S06: hai cột không lên cloud hay API, AC-5 ghim điều đó; dọn là hàng riêng. `block_raw`: 0 dòng. Đường của S03, S05: 0 dòng `street_raw`. Số đo 03/11.
- Số ngăn bằng dấu khác `[ .-]` hoặc nhiều dấu liền (định nghĩa rộng đo 3 chuỗi, không phải số điện thoại) và số bàn tám chữ số (1 chuỗi). Thước in số này mỗi lượt, hàng 11 ghim ranh giới.
- Tách phần chữ khỏi số để giữ tên đường trong chuỗi lẫn: cả 7 chuỗi có chữ đo được đều là lời liên hệ.
- Sửa `app/`, `sync-cloud.mjs`, migration; chạy tay transform trên DB máy thu: job đêm làm sau khi gộp.

## Notes

- Hồ sơ DS1 đã ký không sửa; hàng 8 trong Ma trận AC-1 của DS1 (`Nguyễn Xiển 0912345678`, giữ nguyên) được thay bằng AC-1 của hợp đồng này, chỉ ca test đổi.
- Điều kiện đóng việc, ngoài lượt chấm, giám sát chịu trách nhiệm: sau job đêm và lượt đồng bộ đầu tiên đếm trên cloud số `street_raw`, `properties.street` mang dãy số, ngưỡng 0. Chưa đếm cloud trước gộp: một giá trị có thể đã lên. Khác 0 thì báo Mạnh trước khi xếp việc khác.
- Phát biểu đã rút vẫn giữ số trong `field_assertions` ở máy thu; bảng này không nằm trong CLOUD_ALLOW.
- Biết trước: chuỗi kiểu `123-125-127 Lê Lợi` bị bỏ cùng số điện thoại (hàng 17), đo 03/11 có 0 tin. Gỡ nhầm thì đổi mẫu rồi chạy lại transform; `legacy` đã rút không tự sống lại.
- Thứ tự resolve trước transform không chở số lên căn: AC-3 cột «còn số».
