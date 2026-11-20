---
schema_version: 1
feature: Cho bước suy phường từ dự án chạy thật và nối vào chuỗi nạp S03
slug: phuong-tu-du-an-chay-that
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, db]
status: implemented
design_doc: docs/superpowers/specs/2026-11-19-phuong-tu-du-an-chay-that-design.md
veto_state:
veto_opened_at:
approved_by: Mạnh
approved_at: 2026-11-19
---

# Acceptance Contract: phuong-tu-du-an-chay-that

## Context

Hàng DA9 đã ký và gộp nhưng lệnh ghi chưa từng chạy, nên 72 trên 7.309 tin S03 đang hiện có phường thật (đo 19/11). Hàng này cho lệnh chạy
thật một lần có hồ sơ áp và nối nó vào chuỗi nạp để tin mới tự có phường. Cổng Đáng: Mạnh «Làm cả năm», 2026-11-18T23:13:44Z.

Lệnh đo số xong việc, chạy trên DB máy thu:

```sql
SELECT count(*) FILTER (WHERE a.region_type = 'submarket') AS co_phuong, count(*) AS tong
  FROM sale_offers s LEFT JOIN areas a ON a.id = s.area_id WHERE s.source = 'S03';
```

Trước: 72 trên 7.309. Sau lượt ghi: bằng số chạy thử ghi trong `ap-may-thu/so-chay-thu.md`, dự kiến khoảng 7.069 (97%). Ô «Có phường» trên màn
chưa phản ánh số này cho tới hàng DF7.

## Criteria

### AC-1 — Bước nằm đúng chỗ trong chuỗi nạp
Given `scripts/zalo-import-daily.sh`,
When chạy chuỗi với các bước giả ghi lại thứ tự, ở cả lượt nhanh và lượt 00:00,
Then `phuong-tu-du-an` chạy với `--ghi --noi-tiep` ngay sau `transform-zalo` và trước `transform-media`; ở cả hai lượt, bước lỗi thì job trả mã khác 0 mà các
bước sau vẫn chạy; khi một phiên thứ hai giữ khoá thật trên bảng phát biểu, lượt nhanh in `BỎ LƯỢT` và không tính vào mã thoát, lượt 00:00 trả mã khác 0.

### AC-2 — Chuỗi không tự chạy lượt ghi đầu
Given DB thử chưa có phát biểu sống nào của luật `phuong-tu-du-an`,
When chạy `--ghi --noi-tiep`,
Then 0 phát biểu được chèn, cột tin không đổi, lệnh thoát 0 và in `chưa áp lượt đầu`; sau khi lượt đầu đã áp bằng `--ghi`, cùng lệnh ấy ghi được phát biểu của bài mới.

### AC-3 — Chạy lại qua chuỗi thật không nhân dòng, không mất phường
Given DB thử chép từ máy thu đã áp lượt đầu,
When chạy thật `transform-zalo`, bước phường, `transform-zalo`, bước phường,
Then lần bước phường thứ hai có 0 chèn, 0 rút, 0 tin phân xử lại; số dòng `field_assertions` của luật không đổi; mọi tin đã nhận phường vẫn giữ phường.

### AC-4 — Tin mới nhận phường trong cùng lượt
Given DB thử đã áp lượt đầu và một bài S03 mới được nạp qua `transform-zalo` thật, thuộc dự án nằm trọn một phường,
When chạy bước phường,
Then cột `area_id` của tin là phường ấy và `field_provenance->'area_id'` mang `nguon = du-an`; đối chứng: bài thuộc dự án không có phường giữ nguyên cột.

### AC-5 — Từng ô của bảng phủ ca đúng số kỳ vọng
Given DB thử chép từ máy thu và ma trận viết trước trong `ma-tran-o.json` (mỗi ô của `bang-phu-ca.md`: điều kiện SQL, số tin, kết quả mong đợi),
When đếm từng ô trước và sau `--ghi`,
Then 0 tin vốn có cột cấp phường bị đổi; tin một dự án một phường ở cột tỉnh hay trống nhận đúng phường ấy; tin nhiều dự án giữ nguyên cột kể cả khi hai dự án
cùng một phường; mọi tin có phường theo thẻ khác phường theo dự án, ở cột tỉnh hay cột trống, đi đúng lối Mạnh chọn ở Cổng Phạm vi (Hỏi-1; số tin từng ô ghi ở `so-chay-thu.md`, đo lại mỗi lượt chấm); mọi tin đổi tỉnh được liệt kê trong `so-chay-thu.md`.

### AC-6 — Hồ sơ áp đủ năm thứ và lùi giữ được qua chuỗi
Given thư mục `ap-may-thu/`,
When chạy trên DB thử theo thứ tự sao lưu, áp, kiểm sau, lùi, rồi chạy lại `transform-zalo` và bước phường,
Then có đủ lệnh áp, số chạy thử, sao lưu, cách lùi, lệnh kiểm sau; sau khi lùi và chạy lại chuỗi, băm `area_id` trên tin S03 và số phát biểu sống của luật bằng
trạng thái trước khi áp, còn băm `area_id`, `field_provenance` bằng trạng thái trước khi áp đã phân xử lại một lượt; hồ sơ lùi kê lệnh chạy lại hạng giá và lệnh kiểm
bản cloud.

### AC-7 — Thời gian và số chạy thử đọc được
Given DB thử chép từ máy thu,
When đo lượt ghi đầu và lượt lặp không có gì mới,
Then lượt lặp xong trong 60 giây; `so-chay-thu.md` có mốc thời gian, tử số, mẫu số toàn kho và cửa sổ 13–19/11, số giây lượt đầu; thiếu một số thì eval đỏ. Khi áp thật, đạt khi luật có phát biểu sống, có tin mang nhãn `du-an`, và tỉ lệ tin S03 có phường không thấp hơn tỉ lệ chạy thử trên
bản chép trừ 2 điểm phần trăm (bản chép 20/11: 96,4%).

### AC-8 — Hồi quy
Given cây sau khi sửa,
When chạy `feature_loop.suite_keys`,
Then tất cả thoát 0.

## Coverage

Bảng phủ ca đếm từ DB máy thu: `bang-phu-ca.md`. Trục: ô phường hiện có (phường · tỉnh · trống) × dự án trên bài (một phường · không phường · nhiều dự án ·
không có) × phát biểu phường từ thẻ nhóm (trùng · khác · không có) × lượt chạy (lượt đầu · chạy lại · tin mới · lùi).

Core → AC-1…AC-7. Later: đưa phát biểu phường từ thẻ nhóm vào cột. Never: đổi luật DA9, sửa 099, 102.

## Đường đo

- Tin S03 có phường thật ← lệnh đo ở Context, chạy trước và sau lượt ghi trên máy thu; AC-5 và AC-7 bảo đảm số ấy đúng trên DB thử.
- Cửa sổ 13–19/11 từ 15 lên khoảng 1.201 trên 1.285 ← cùng lệnh đo, thêm `first_seen >= '2026-11-13' AND first_seen < '2026-11-20'`.

## Out of scope

- Sửa ô «Có phường» trên màn: hàng DF7.
- Tin S05, S06: luật DA9 chỉ đọc phát biểu dự án trên bài S03; S06 đã có phường ở 98% tin.
- Đọc phát biểu phường từ thẻ nhóm vào cột, trừ khi Mạnh chọn khác ở Cổng Phạm vi.
- Sửa migration 099, 102.

## Notes

AC-6 đổi lời 19/11 theo lời Mạnh «theo khuyến nghị» (yêu cầu P3-209): `field_provenance` so với bản trước khi áp đã phân xử lại một lượt, vì 267 tin S03
mang dấu cũ chưa từng phân xử lại; xem `ap-may-thu/so-chay-thu.md` mục «Lùi qua chuỗi».


Hợp đồng DA9 ghi lượt ghi thật cần lời riêng của Mạnh; hàng này xin chữ ký Cổng Bằng chứng phủ lượt ghi. Xem `cau-cong-pham-vi.md`.
