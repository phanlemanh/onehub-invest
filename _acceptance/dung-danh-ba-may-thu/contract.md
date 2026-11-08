---
schema_version: 1
feature: Lệnh dựng danh bạ vật thể chạy được trên DB máy thu bằng cờ cho phép tường minh, kiểm slug khu, và có bước trong chạy đêm
slug: dung-danh-ba-may-thu
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, config]
status: implemented
design_doc: docs/superpowers/specs/2026-11-08-dung-danh-ba-may-thu-design.md
approved_by: Mạnh
approved_at: 2026-11-07T23:51:50Z
---

# Acceptance Contract: dung-danh-ba-may-thu

## Context

DB1b: lệnh `pipeline/danh-ba-vat-the.mjs` của DB1 (#347) hôm nay chỉ chạy trên DB thử — nó từ chối tên `oneinvest`
nhưng lại không chặn máy chủ ngoài máy (Known limit Ngoài-7), slug khu gõ sai vẫn «xong» với toàn số 0 (Ngoài-6,
Ngoài-10), và không có bước nào giữ danh bạ tươi. Mạnh chọn «Ngoài-9: mở hợp đồng mới» ở Cổng Bằng chứng DB1 07/11;
082 đã áp lên DB máy thu 07/11, ba bảng vật thể rỗng. Vòng này đưa lệnh lên máy thu bằng cờ tường minh, khoá đường ra
ngoài máy, kiểm slug, và thêm bước đêm chỉ giữ tươi khu đã được dựng tay.

Source input: `_acceptance/dung-danh-ba-may-thu/opportunity.md` (hàng DB1b của `docs/plan/lo-trinh.json`).

## Criteria

- AC-1: Given lệnh dựng và một ma trận đích viết trước (DB thử `oneinvest_<việc>` trên máy này, DB `oneinvest` trên
  máy này, DB tên khác trên máy này, theo ba cách viết máy này `localhost`/`127.0.0.1`/`::1`), When chạy có và không có
  `--db-that`, Then DB thử ghi được ở cả hai cách; mọi đích khác chỉ ghi khi có `--db-that`; thiếu cờ thì lệnh thoát 2
  với thông điệp gọi tên cờ `--db-that`, không mở kết nối và DB đích không đổi dòng nào. When đích không phải DB thử
  CHƯA có toà nào (lần dựng đầu) và lệnh có `--db-that` mà thiếu `--sao-luu <tệp>` trỏ một tệp có thật, không rỗng,
  Then lệnh thoát 2 với thông điệp gọi tên `--sao-luu`, không ghi dòng nào; có `--sao-luu` hợp lệ thì dựng, và đích đã
  có toà thì không đòi `--sao-luu`.
- AC-2: Given một đích ngoài máy này (máy chủ đám mây, máy khác, tham số `?host=` trỏ máy khác, URL không ghi máy chủ
  trong khi `PGHOST` trỏ máy khác, URL thiếu tên DB hoặc không đọc được), qua `--db` hay qua `DATABASE_URL`, When chạy
  lệnh dựng có hoặc không có `--db-that`, Then lệnh thoát 2 trước khi mở kết nối; máy chủ được kiểm là máy chủ mà
  `pg.Client` thật sẽ nối tới (đọc từ `connectionParameters` của nó, chưa `connect`); thông điệp nói «đích ngoài máy
  này» (hay «URL không đọc được») và không chứa mật khẩu hay URL đầy đủ. When bước đêm nhận một `pg.Client` thật chưa
  nối tới đích ngoài máy này, Then nó ném lỗi «đích ngoài máy này» trước câu truy vấn đầu tiên.
- AC-3: Given DB thử có hai khu đã nối S08, When chạy lệnh với `--khu` chứa một slug không có nút khu nào, Then lệnh
  thoát 2, thông điệp gọi tên đúng slug sai, và không khu nào được ghi (kể cả khu đúng trong cùng lệnh); When `--khu`
  chứa một slug có nút khu nhưng 0 dòng S08 cao tầng đã nối, Then lệnh dựng xong các khu khác, tổng kết có
  `khu_khong_s08` mang đúng slug đó và stderr có một dòng cảnh báo gọi tên nó.
- AC-4: Given DB thử chưa áp 082, hoặc đã áp 082 nhưng chưa có toà nào (kể cả khi đã có bí danh `ma_nguon` của nguồn
  danh mục hay nguồn khác), When `refresh-bait-gap.mjs` chạy như job đêm, Then bước vật thể in đúng một dòng «bỏ qua —
  DB chưa áp 082» hoặc «bỏ qua — chưa dựng lần đầu», không ghi dòng nào vào ba bảng vật thể và bí danh, và
  `refresh-bait-gap.mjs` thoát 0; bộ dựng không bao giờ nhận danh sách khu rỗng mà rơi về khu mặc định.
- AC-5: Given DB thử đã dựng tay khu hai (có toà gắn phân khu) bằng lệnh, khu một có S08 nhưng chưa dựng, và lần chụp
  S08 mới thêm một mã căn vào phân khu của khu hai và một mã vào khu một, When `refresh-bait-gap.mjs` chạy như job đêm hai
  lần, Then lần một đúc đúng các khoá của mã mới ở khu hai và không đúc khoá nào ở khu một; lần hai đúc 0 khoá; bước đêm
  không ghi phát biểu `builder_name` nào.
- AC-6: Given bước vật thể của đêm hỏng giữa giao dịch (DB thử có ràng buộc làm INSERT căn thất bại sau khi đã INSERT
  toà, chạy mã thật), When `refresh-bait-gap.mjs` chạy, Then nó thoát khác 0 và stderr gọi tên bước `danh-ba-vat-the`;
  bait gap và danh bạ Người của lượt đó vẫn đã commit (số người bằng lượt đối chứng không hỏng); ba bảng vật thể và bí
  danh không có dòng nửa chừng; `refresh-bait-gap.mjs` không đọc biến môi trường nào để thay mô-đun bước đêm.
- AC-7: Given lệnh dựng gọi qua một symlink trỏ gốc kho (như launchd gọi qua `~/dev/one-invest`), When chạy trên DB thử,
  Then lệnh thật sự chạy (in `tong_ket`, ghi khoá như gọi bằng đường thật) chứ không thoát 0 im lặng (Ngoài-9).
- AC-8: Given hai DB có ba bảng vật thể, When so bảng đếm độc lập theo khu (toà, trục, căn đếm bằng SQL trên ba bảng,
  không qua tổng kết bộ dựng), Then hai DB dựng từ cùng dữ liệu cho danh sách lệch rỗng; một căn thừa ở một bên cho đúng
  một dòng lệch gọi tên khu và cấp; hàm chọn nhánh đi vào nhánh so khi DB đóng vai máy thu đã có toà và vào nhánh «máy
  thu chưa dựng — chưa so» khi chưa; ca dữ liệu thật (bản chép chỉ đọc từ máy thu) dùng đúng hàm đó; không in mã S08 nào.
- AC-9 (judgment): Given `pipeline/CLAUDE.md` và `docs/ops/runtime-map.md` sau vòng, When người làm sau đọc, Then họ biết
  lệnh dựng danh bạ vật thể chạy ở đâu, cờ nào mở DB máy thu, rằng đích ngoài máy luôn bị chặn, rằng bước đêm nằm trong
  `refresh-bait-gap` và chỉ giữ tươi khu đã dựng tay, và rằng ở bản này ba bảng vật thể chưa được đồng bộ lên cloud —
  ghi là phạm vi của vòng, không phải luật dữ liệu (Ngoài-8).

## Coverage

Quét bốn trục (preset risk-premortem + entity-feature, `acceptance-gate:morphological-scan`):

- Trục A — đích DB: DB thử máy này | DB máy thu `oneinvest` | DB khác trên máy này | máy chủ ngoài máy | URL hỏng/thiếu
  tên DB. [thước CE: bảng đích trong design doc; chân ngành NGÀNH: Rails ActiveRecord protected environments
  (`DISABLE_DATABASE_ENVIRONMENT_CHECK`) — tác vụ ghi phá trên môi trường bảo vệ phải có cờ tường minh]
- Trục B — đường gọi: lệnh tay đường thật | lệnh tay qua symlink | bước đêm `refresh-bait-gap` | ca dữ liệu thật
  (đối chiếu). [thước CE: launchd plist `pipeline/cron/*.plist` + `scripts/*-daily.sh` gọi `refresh-bait-gap.mjs`]
- Trục C — trạng thái dữ liệu: chưa áp 082 | 082 có, chưa dựng lần đầu | đã dựng một phần khu | S08 có mã mới | slug
  sai | khu không S08. [thước CE: Known limits Ngoài-6/7/8/9/10/19 của `_acceptance/danh-ba-toa-truc-can/contract.md`]
- Trục D — cờ: không cờ | `--db-that`. [thước CE: mẫu `pipeline/label-ghep.mjs`]

Core → AC-1 (A×D, máy này), AC-2 (A ngoài máy × D), AC-3 (C slug), AC-4 (B đêm × C chưa áp/chưa dựng), AC-5 (B đêm × C
đã dựng/mã mới), AC-6 (B đêm × lỗi), AC-7 (B symlink), AC-8 (B đối chiếu), AC-9 (tài liệu, Ngoài-8). Later/Never ở Out
of scope.

## Out of scope

- Lần dựng đầu trên DB máy thu — lời riêng của Mạnh sau Cổng Bằng chứng và sau gộp (sao lưu trước); vòng này chỉ đo
  trên DB thử và bản chép chỉ đọc.
- Mở ra 150 dự án S08 — PX2.
- Trang `/ops` xem danh bạ vật thể (DN3/DN4); đồng bộ vật thể lên cloud.
- Lệnh tự chạy `pg_dump` — lệnh chỉ đòi tệp sao lưu có sẵn ở lần dựng đầu (AC-1); sao lưu là bước của giám sát.
- Nhãn tiếng Việt cho tám dòng kiểm DQ vật thể (Ngoài-4) và các Known limits phép đo khác của DB1 (Ngoài-1…3, 11…18).

## Đường đo

- Ngưỡng «dựng lần đầu trên DB máy thu ra đúng số toà/trục/căn như bản chép chỉ đọc»: số từ `demTheoKhu` trên máy thu so
  với bản chép trong ca dữ liệu thật `pipeline/scripts/danh-ba-vat-the-that.itest.mjs` — AC-8 bảo đảm phép so và hàm chọn
  nhánh. Đo SAU gộp, cùng bước Hỏi-2: sau lần dựng đầu chạy `config:executors.test.dbv_that`, đầu ra phải ở nhánh so
  (không phải «chưa so») với danh sách lệch rỗng.
- Ngưỡng «chạy lại ra 0 mã mới»: chạy lại `--db-that` trên máy thu ngay sau lần đầu, `khoa_moi` phải bằng 0 — AC-5 bảo
  đảm trên DB thử cho đường đêm, AC-4 cũ của DB1 cho đường tay.
- Hai kết quả đo sau gộp ghi vào `_acceptance/dung-danh-ba-may-thu/decisions.jsonl` (một dòng `revisit` stage `uat`,
  chỉ số, không mã S08) làm bằng chứng cho Cổng Giá trị.

## Notes

- Mọi phép đo chạy trên DB thử (`pipeline/scripts/db-thu-dbv.mjs`, tên `oneinvest_dbv_*`); dữ liệu thật chỉ chép đọc từ
  máy thu (ca `dbv_that`, ngoài CI). Không ghi DB máy thu trong vòng.
- Fixture là mã tổng hợp tiền tố Q; đầu ra phép đo chỉ in số (nếp của DB1). Chính sách dữ liệu dự án (S07, S08, S09, nguồn
  nhà nước) Mạnh mở 08/11, văn bản sửa ở hàng DA0 — vòng này không dựa vào luật 5 cho tiêu chí nào; chặn đích ngoài máy
  ở AC-2 là rào an toàn của lệnh ghi.
- Vùng mã: `pipeline/danh-ba-vat-the.mjs`, `pipeline/lib/danh-ba-vat-the*`, `pipeline/scripts/danh-ba-vat-the*`, cộng
  (khai ở Cổng Phạm vi) `pipeline/refresh-bait-gap.mjs`, `pipeline/CLAUDE.md`, `docs/ops/runtime-map.md`.
