---
schema_version: 1
feature: Dấu lược đồ của bản mẫu DB thử phủ constraint, index, trigger, enum, độ dài kiểu, NOT NULL, DEFAULT, RLS, quyền và schema ngoài public, để bản mẫu dựng lại ngay khi migration đổi những thứ đó
slug: dau-luoc-do-ban-mau
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, ci]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-06T03:24:31Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-06-dau-luoc-do-ban-mau-design.md
---

# Acceptance Contract: dau-luoc-do-ban-mau

## Context

`db/db-thu.sh --chay` giữ bản mẫu `oneinvest_suite_mau` tới 24 giờ khi dấu lược đồ của DB chung không đổi. Dấu hiện chỉ gồm cột (tên + `data_type`), view và thân
hàm, nên migration thêm constraint, index, trigger, giá trị enum, đổi độ dài kiểu, NOT NULL, DEFAULT hay bật RLS không làm mẫu dựng lại: test chạy trên cấu trúc cũ
tới 24 giờ (Ngoài-5 của `test-suite-db-thu`, Mạnh chọn «mở hợp đồng mới» ngày 06/11). DB chung đang có 26 schema rác của test mang đuôi pid.

Source input: lời giao của giám sát 06/11 (phiên local_08504d44) sau khi #326 gộp; `_acceptance/test-suite-db-thu/review-findings.md` mục Ngoài-5.

## Criteria

Ca của AC-1 tới AC-6 nằm trong một ma trận viết trước, mỗi ca đo ba điểm trên cùng lược đồ mẫu (có PostGIS): dấu trước ca bằng dấu gốc, dấu sau ca khác dấu gốc,
dấu sau `ROLLBACK` bằng dấu gốc. Số ca chạy bằng số phần tử ma trận.

- AC-1: Given lược đồ mẫu trên Postgres thật, When thêm hoặc xoá constraint (CHECK, FOREIGN KEY, UNIQUE, PRIMARY KEY), đổi biểu thức CHECK, `VALIDATE` một constraint
  `NOT VALID` có sẵn trong lược đồ mẫu, hoặc thêm CHECK cho một domain, Then dấu đổi theo ba điểm.
- AC-2: Given như trên, When thêm hoặc xoá index, đổi cột của index, đổi điều kiện của index một phần, đổi index thường thành UNIQUE, hoặc thêm index trên materialized
  view, Then dấu đổi theo ba điểm.
- AC-3: Given như trên, When thêm hoặc xoá trigger, đổi thời điểm (`BEFORE`/`AFTER`) hay sự kiện, hoặc `DISABLE TRIGGER`, Then dấu đổi theo ba điểm.
- AC-4: Given như trên, When thêm giá trị enum (ở cuối và chèn `BEFORE` một giá trị có sẵn), đổi tên giá trị, hoặc tạo kiểu enum mới, Then dấu đổi theo ba điểm.
- AC-5: Given như trên, When đổi độ dài `varchar(n)`, độ chính xác `numeric(p,s)`, đổi `integer` thành `bigint`, đổi SRID của cột `geometry`, đổi collation của cột, đặt
  hay bỏ NOT NULL, đặt hay đổi DEFAULT, thêm cột generated, thêm overload hàm cùng thân, Then dấu đổi theo ba điểm; và ba ca dấu cũ đã bắt (thêm cột, đổi định nghĩa
  view, đổi thân hàm) vẫn làm dấu đổi.
- AC-6: Given như trên, When đổi bảng trong schema `sync_stage` hoặc trong một schema mới không đuôi số, bật RLS, thêm policy, `REVOKE` hoặc `GRANT` trên bảng, tạo
  extension, tạo domain, đổi thuộc tính của kiểu composite, hoặc đổi `INCREMENT` của sequence, Then dấu đổi theo ba điểm.
- AC-7: Given như trên, When chỉ ghi dữ liệu (`INSERT`, `UPDATE`, `DELETE`), chạy `ANALYZE` hay `VACUUM`, gọi `nextval` của sequence, tạo hoặc xoá bảng trong schema
  đuôi `_<số>` (schema rác của test), hoặc tính dấu hai lần liên tiếp, Then dấu bằng dấu gốc; đối chứng cùng lược đồ: bảng trong schema không đuôi số làm dấu đổi.
- AC-8: Given `db/db-thu.sh`, When script tính dấu DB chung (trong `--chay` và chế độ mới `--dau`), Then câu dấu đọc từ `db/dau-luoc-do.sql` — cùng tệp test dùng —
  và lệnh `docker exec` mang `-e PGOPTIONS=-c default_transaction_read_only=on` trong đối số; trên DB chung thật `--dau` in `chi_doc=on` (đọc bằng chính lời gọi đó) và
  một dấu 32 ký tự hex, hai lần liên tiếp bằng nhau, mỗi lần dưới 3 giây; các ca luồng dựng mẫu đã có (`DT-AC-3`) vẫn xanh.
- AC-9: Given máy có Postgres :5433 hoặc job CI `scripts`, When chạy ma trận AC-1–AC-7, Then test chỉ nối DB `postgres` và DB `oneinvest_suite_dau_<pid>` của nó (không
  nối `oneinvest`), xoá DB của nó khi xong; `CI=true` mà không nối được thì đỏ, máy không có server thì bỏ qua kèm lý do; mỗi ca trong ma trận khai trước «câu cũ:
  bắt» hay «câu cũ: sót», và câu dấu trước vòng này chạy cùng ma trận khớp đúng từng ô; hai bản đột biến của câu mới (bỏ `tgenabled`; bỏ typmod
  của `format_type`) làm đúng ca `DISABLE TRIGGER`, và đúng ba ca độ dài `varchar`, độ chính xác `numeric`, SRID đỏ.

## Coverage

- Trục **loại đối tượng trên bảng** (cột: kiểu đầy đủ · NOT NULL · DEFAULT · generated/identity · collation; constraint; index; trigger; RLS + policy; quyền) — AC-1,
  AC-2, AC-3, AC-5, AC-6. Thước CE: danh sách đối tượng mà công cụ so lược đồ migra (djrobstep/migra) so `[NGÀNH: migra]`, đối chiếu đếm trong `db/migrations/`
  (99 CHECK, 65 index, 14 trigger, 12 REVOKE, 3 COLLATE, RLS ở 037) `[SUY-TỪ-REPO: db/migrations]`.
- Trục **đối tượng độc lập** (enum · domain · kiểu composite · sequence · view/matview · hàm · extension · schema) — AC-1, AC-4, AC-5, AC-6. Cùng thước. Comment, owner:
  Out of scope.
- Trục **chiều đổi** (thêm · xoá · sửa định nghĩa · đổi tên · đổi thứ tự · bật/tắt) — mỗi ô của hai trục trên có ít nhất một chiều trong ma trận; mọi ca đo ba điểm.
- Trục **sự kiện không phải lược đồ** (ghi dữ liệu · thống kê, vacuum · nextval · schema rác đuôi pid · đọc lặp) — AC-7. Thước: 26 schema đuôi số trên DB chung đo 06/11.
- Trục **nơi đối tượng** (`public` · `sync_stage` · schema mới do migration sau · schema rác · schema của extension) — AC-5 (PostGIS), AC-6, AC-7.
- Trục **bàn đo** (Postgres máy · Postgres CI · không có server · đột biến câu mới · câu cũ) — AC-9.

## Out of scope

- Comment (`COMMENT ON`, 6 lần trong migration) và owner: không đổi kết quả câu lệnh nào của test; bản mẫu dựng bằng `pg_dump --no-owner` nên owner luôn là `oneinvest`.
- Đổi luồng dựng bản mẫu (khoá, tuổi 24 giờ, `VACUUM ANALYZE`, dọn mồ côi).
- Dọn 26 schema rác của test trên DB chung: 86 executor đơn tệp vẫn chạy thẳng trên DB chung (Out of scope của `test-suite-db-thu`) nên rác còn sinh tiếp; schema hợp lệ
  có tên đuôi `_<số>` sẽ không được tính vào dấu.

## Notes

- Lần `--chay` đầu tiên sau gộp ở mỗi máy dựng lại bản mẫu một lần, vì công thức dấu đổi.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-06:
  - Ngoài-1: Khi bước dựng DB riêng cho bộ kiểm lược đồ gặp lỗi hiếm (thiếu quyền, DB trùng tên bỏ dở), lệnh kiểm có thể đứng im thay vì báo đỏ; người chạy phải tự dừng rồi chạy lại.
  - Ngoài-2: Nhánh coi lỗi kết nối là «không có máy chủ» chưa có ca canh giữ, nên một lần sửa sau có thể làm máy sai mật khẩu bị bỏ qua và báo xanh.
  - Ngoài-4: Bộ kiểm lược đồ đọc biến DL_PG_ADMIN riêng, nên trên máy dùng Postgres ở địa chỉ khác nó nối nhầm chỗ và không chạy được.
  - Ngoài-5: Bài kiểm nhanh không bắt được việc bỏ dòng báo chế độ chỉ đọc khỏi lệnh in dấu; chỉ phép đo trên DB thật phát hiện.
  - Ngoài-6: Xoá bớt một tình huống khỏi ma trận kiểm thì bộ kiểm vẫn xanh, không báo thiếu độ phủ.
  - Ngoài-7: «Test chỉ nối DB của nó» dựa trên danh sách tự khai của hàm nối, không kiểm kết nối thật trên máy chủ.
