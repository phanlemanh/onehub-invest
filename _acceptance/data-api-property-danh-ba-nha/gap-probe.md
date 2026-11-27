---
slug: data-api-property-danh-ba-nha
at: 2026-11-27T05:30:00Z
verdict: findings
p0: 3
p1: 15
p2: 9
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract AC-2/3/5 · Hỏi-3 | AC chỉ theo lối «mở S16», lối giữ nội bộ không có AC; toà, căn chỉ có S16 xử lý ra sao chưa ghi | Mạnh chọn giữ nội bộ mà AC không đổi | Bộ AC riêng cho mỗi lối | fixed: bảng «Lối khác → AC đổi» ghi đủ AC-1, AC-2, AC-3, AC-6 cho lối giữ nội bộ (109 toà, 109 922 căn chỉ S16 → 404; còn 198 toà, 1 749 căn) |
| P0 | AC-2 `unitNumber` ↔ AC-5 | Mã căn người đọc chính là mã của bí danh nguồn | AC-5 xanh giả trong khi mã nguồn ra API | Ghi rõ nguồn của `unitNumber`, canh hai phần | fixed: Context sự thật 2; `unitNumber` chỉ nhắc lại chuỗi khách nhập ở lookup (AC-3), không có ở GET căn (AC-2); AC-6 canh cả phần `<dự án>/` lẫn phần mã |
| P0 | Hỏi-2 · AC-2/4 | `UniversalPropertySubId` = trục:tầng → dò được cả cột căn | Dựng lại danh mục S16 từ một căn | AC đếm căn lộ khi dò | fixed: API không trả SubId, khoá trục; căn mang `unitKey` mờ (Context sự thật 3); AC-5 đo «số căn lộ thêm khi dò» = 0; đột biến trả SubId phải đỏ (AC-9) |
| P1 | AC-6 · E6 | Đột biến «không mount» cho AC-5 xanh giả | Route ghép bí danh không bị bắt | Đột biến ghép bí danh; khẳng định 200 trước khi soát | fixed: điều kiện chung «khẳng định 200 và có phần tử cấy»; AC-9 ba đột biến |
| P1 | AC-5 · E5 | Canh chỉ ở `ma_nguon` | Ghép căn cứ, nguồn, thân lỗi lọt | Canh nhiều chỗ, soát thân lỗi, openapi | fixed: AC-6 canh năm chỗ, soát thân 400/404/503 và openapi, cấm khoá `nguon`, `evidence`, `originatingSystem*`, `aliases` mọi cấp |
| P1 | error-handler · 503 cloud | Lỗi lộ chữ SQL; 503 chưa có AC | Khách thấy tên bảng | AC 503 + lỗi chung | fixed: AC-10; `error-handler.ts` vào Vùng |
| P1 | AC-1/3 `buildingName`, `building=` | Không luật chọn tên, «tên hay mã» mơ hồ | Tên đổi giữa hai lần gọi; mã nguồn thành khoá | Thứ tự nguồn, tập đầu vào, gập chữ | fixed: AC-1 thứ tự S09 → S08 → S16 → S03, hai lần gọi bằng nhau; AC-3 nhận `buildingKey` hoặc tên đã gập chữ, mã nguồn → 400 |
| P1 | AC-3 | Ca mơ hồ rỗng nghĩa; căn nhiều mã | Chọn bừa căn | Ca hai toà trùng tên; căn hai mã | fixed: AC-3 `AMBIGUOUS_BUILDING`; `C3` hai mã cùng `unitKey` |
| P1 | AC-3 `project=` | Kiểu mã dự án chưa định nghĩa | Mã nguồn thành khoá công khai | Chốt kiểu mã, trả trong phần tử toà | fixed: `project` nhận id nút hoặc tên; phần tử toà trả `projectId`; mã nguồn → 400 |
| P1 | AC-1 `complexName`/`subdivisionName` | Không ghim ánh xạ | Đảo hai ô vẫn xanh | Ghi rõ, dòng cấy hai giá trị | fixed: AC-1 ghi phân khu → `complexName`, dự án → `subdivisionName`; E1 dòng cấy hai giá trị khác |
| P1 | AC-1 `stateOrProvince` · AC-7 | 21 toà VN-66; lookup DD là bang Mỹ | AC-7 đỏ hoặc nới tay | Khai giá trị local | fixed: bảng phủ ca ghi VN-66 21 (khoá ngoại `iso_regions`, không chỉ HN/SG); AC-11 miễn có tên cho `stateOrProvince` |
| P1 | AC-2 `directionFaces`, `propertySubType` | Không bảng đổi; mảng local | Giá trị local lọt ra | Bảng đổi + probe trên giá trị thật | fixed: `directionFaces` ra Out of scope (cần bảng đổi riêng); AC-8 bảng đổi loại căn + probe trên mọi giá trị khác nhau của DB thử |
| P1 | dòng cấy · căn không trục | Chỉ hai căn cấy | Căn không trục sai không ai bắt | Thêm căn không trục | fixed: AC-2 ba căn C1 (trục), C2 (không trục), C3 (hai nguồn); không trả `stack` |
| P1 | AC-2 · căn hai nguồn | `unitNumber` lấy mã nào | Đổi giữa lần gọi | Thứ tự chọn | fixed: GET không trả `unitNumber`; lookup nhắc lại chuỗi khách nhập; hai mã cùng `unitKey` (AC-3) |
| P1 | AC-1–AC-4 · merged | Không AC cho vật thể gộp | Đếm dư, UPI cũ lạc | Ca merged | fixed: AC-7 |
| P1 | đầu hồ sơ · Hỏi-1/2 | Lối khác chưa có AC | Ký sai hành vi | Bảng lối khác | fixed: bảng «Lối khác → AC đổi» cho cả ba câu |
| P1 | CLAUDE.md · dong-ba-route | Route đếm tin không có ca chặn bảng cấm | Hồi quy join `stg_*`, S02 | Thêm ca vào dong-ba-route | fixed: `dong-ba-route.test.ts` vào Vùng; AC-11 đòi ca PB6 trong đó |
| P1 | AC-8 · repo công khai | Mã căn thật có thể vào ví dụ | Mã nội bộ ra kho công khai | Giá trị mẫu giả | fixed: điều kiện chung «mọi giá trị mẫu là giả, không khớp bí danh nào» |
| P2 | `livingAreaUnits` | ADR-0013 viết `SquareMeters` | Lệch chữ | Ghim theo DD | fixed: đã tra DD 2.1 — StandardName `Square Meters`; Notes ghi lệch ở ADR |
| P2 | AC-7 · E7 | Không soát sáu điều kiện; CI không có DD | Extension thiếu vẫn qua | Soát sáu điều kiện; ghi thước tại máy | fixed: AC-11 đủ sáu điều kiện; E11 chạy tại máy thu, CI bỏ qua có tên |
| P2 | meta | `total`, trần `limit`, hình lookup | Phân trang sai | Ghi rõ | fixed: AC-3 hình `{data, meta.total}`; AC-4 `total` tổng khớp, trần 100 |
| P2 | Đường đo | Tự khớp, không ngưỡng | Số vô nghĩa | Nguồn mẫu thật | fixed: Đường đo miễn có lý do; số nội bộ rút từ mã căn trong chữ tin S03 |
| P2 | Hỏi-3 số | 340 bỏ sót 1 409 | Đánh giá trên số sai | Sửa số | fixed: dòng sổ mới thay Hỏi-3, 1 749 căn có mã S08, 198 toà |
| P2 | CONTEXT.md | Thuật ngữ chưa có | Từ vựng lệch | Lời GS trước gộp | deferred: Vùng ghi «chờ GS cho, phải có trước khi gộp»; hỏi GS trong báo kết lượt |
| P2 | Context | Chỉ chạy tại máy thu | Người duyệt tưởng CRM gọi được | Ghi rõ | fixed: Context mục «Chỉ chạy tại máy thu tới khi danh bạ lên cloud»; README phải ghi (AC-11) |
| P2 | `catalogTier` | Toà một lời khai có ra không | Khách coi như đã xác minh | Luật lọc hay nhãn | fixed: AC-1 toà `T2` ra với nhãn `mot_loi_khai` |
| P2 | evals paths | Thiếu tệp hợp đồng | Không đánh dấu cũ | Thêm | fixed: E1–E4 có `data-api/src/contract/property.ts` |
