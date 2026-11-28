# Bản phạm vi — Danh bạ môi giới ở /ops/people (28/11/2026)

Lời Mạnh và các câu chốt ở ROADMAP §3 mục 66. Bảng phủ ca (chiều × giá trị, số đếm từ DB máy thu 28/11) nằm ở thư mục điều
tra cục bộ; mỗi hàng chép phần liên quan vào `contract.md` ở S1. Thành phần UI: họ Frame như các màn Ops khác; block ReUI Pro
`solution-crm-3` (danh bạ), `solution-crm-2` (bảng quy trình mời), `solution-crm-5` (dòng hoạt động); thân một người
`PersonBody` dùng chung cho sheet và trang, như `DealBody`.

Việc vận hành không vào bản này: áp DDL cloud, gọi điện thật, rà pháp lý.

<!-- <<<PHAM-VI-MA -->
```
dot: danh-ba-moi-gioi-2811
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/dot/danh-ba-moi-gioi-2811.md#d35327cca573efec2fde1e454128c0ef87f5d695

- `NG0` — gộp người đăng S06 với người mang số S06 theo luật HD13, có vết và đảo được; S1 đo nguyên nhân HD13 không phủ cặp này — xong khi: số môi giới có SĐT gắn vào chính mình từ 2 lên số đo sau gộp (trần trên khoảng 5.003); số người 0 tin giảm tương ứng; phép đếm SQL độc lập khớp
- `NG1` — bảng tổng hợp theo người tính sẵn ở pipeline: số tin theo trạng thái, khu và dự án chính, khoảng giá, tuần hoạt động, điểm tiềm năng (phát biểu suy luận, không gắn khu cố định) — xong khi: khớp phép đếm SQL độc lập, chạy lại lần hai không đổi số
- `NG2` — trang hồ sơ 360 /ops/people/[partyKey]: thẻ liên hệ, ô số, vùng hoạt động (tâm phường khi không có toạ độ), danh sách tin bấm được, lịch sử hoạt động, chân dung, bằng chứng — xong khi: mở một môi giới bất kỳ của S03, S05, S06 đều thấy đủ vùng, vùng thiếu dữ liệu ghi «chưa biết»; không còn cột khoá băm
- `NG3` — danh sách chế độ Môi giới: lọc khu, dự án, hoạt động, liên hệ (xác minh hay suy ra), ẩn người 0 tin, xếp theo điểm, ô số trên đầu — xong khi: ô «Sẵn sàng gọi» trên màn đổi từ 2 lên số đo sau NG0, tách hai mức số xác minh và số suy ra
- `NG4` — trường Zalo trên hồ sơ và danh sách; ngày sinh, giới tính chỉ hiện khi chạy ở máy thu và vai owner — xong khi: ô «Có Zalo» từ 0 lên số đo; cấy hai trường vào bản cloud thì bộ soát đỏ
- `NG5` — danh bạ Người và bảng tổng hợp lên cloud, chỉ /ops vai ops trở lên — xong khi: bản cloud mở được hồ sơ; không có ngày sinh, giới tính
- `NG6` — trao danh sách tiềm năng cho khách nội bộ qua API có L3 — xong khi: một danh sách 50 người được trao và nhận đúng, có nhật ký; người «không liên hệ» không bao giờ có mặt
- `NG7` — quy trình mời trong /ops: bảng tiếp cận + migration, giao người phụ trách hàng loạt, bảng kéo thả theo trạng thái, nhật ký cuộc gọi trên hồ sơ, ghi ops_audit — xong khi: ô «Đã liên hệ tuần này» từ 0 lên số thật; người «không liên hệ» bị loại khỏi mọi danh sách xuất
- `NG8` — API nội bộ cho quy trình mời (đọc hồ sơ, đọc và ghi trạng thái) qua lớp khách API — xong khi: một ứng dụng nội bộ đọc được danh sách tiềm năng và trạng thái tiếp cận
```
<!-- PHAM-VI-MA>>> -->

Thứ tự phụ thuộc:
- NG0 → NG1 → (NG2 ∥ NG3);
- NG4 sau EN3; NG5 sau NG1; NG6 sau PB14 và NG3;
- NG7 sau NG2 và NG3; NG8 sau NG7 và PB14.
