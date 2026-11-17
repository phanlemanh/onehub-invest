---
schema_version: 1
feature: Lượt nạp S03 có trần thời gian — lượt 00:00 không chạy quá 4 giờ, phần nạp không quá 30 phút, lượt bị cắt không mất snapshot nào và lượt sau nạp nốt, khoá của lượt đang chạy không bị gỡ, trần không bao giờ dừng nhầm tiến trình ngoài lượt
slug: s03-tran-thoi-gian-luot-nap
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
veto_state: mo
veto_opened_at: 2026-11-17T14:27:07Z
design_doc: _acceptance/s03-tran-thoi-gian-luot-nap/design.md
approved_by:
approved_at:
---

# Acceptance Contract: s03-tran-thoi-gian-luot-nap

## Context

Lượt nạp S03 00:00 ngày 17/11 chạy ≈ 5 giờ 38 phút không trần, đụng cloud-sync nhịp 15′. ZCode viết trần ở nhánh
`zcode/s03-tran-zalo-import` @99b2778e9 (phía trên mốc làn của `scripts/zalo-import-daily.sh`); U1 tích hợp. GS duyệt Cổng
Đáng (U1-133): miễn con số trên màn, đo thay bằng thời lượng lượt 00:00 trong log. Thiết kế và ba lỗ đo được trên bản sao
(đồng hồ mồ côi, TERM trúng người gọi, test phụ thuộc máy): `design.md`. Mọi ca chạy bản sao script trong thư mục tạm,
fixture thay bước pipeline, DB trỏ cổng đóng; lượt thử khởi detached có nhóm tiến trình riêng.

## Acceptance Criteria

- **AC-1** Given bản sao script, một snapshot tin (hoặc hồ sơ) chưa nạp và `ZALO_IMPORT_TRAN_NAP=0`, When chạy lượt 00:00,
  Then log có dòng TIMEOUT phần nạp nêu đúng snapshot, lượt thoát 124, state tin (hoặc state hồ sơ) giữ mốc cũ, và không
  bước transform nào chạy; vòng tin và vòng hồ sơ mỗi vòng một ca.
- **AC-2** Given hai snapshot tin chưa nạp và bước nạp giả ghi tên snapshot rồi ngủ, When lượt 1 bị cắt giữa chừng — (a) bởi
  trần nạp sau snapshot đầu, (b) bởi trần tổng trong lúc nạp snapshot đầu — rồi lượt 2 chạy với trần mặc định, Then lượt 2
  lấy khoá không phải chờ, nạp đúng các snapshot lượt 1 chưa ghi state, state cuối bằng snapshot sau cùng, và không snapshot
  nào bị bỏ qua; ở (b) snapshot đang nạp dở khi bị cắt (bước nạp giả chưa ghi «XONG») thì state sau lượt 1 nhỏ hơn nó và
  lượt 2 nạp lại nó tới «XONG».
- **AC-3** Given `ZALO_IMPORT_TRAN_TONG=3`, `ZALO_IMPORT_CANH_BAO=1` và một bước treo, When chạy lượt trong nhóm tiến trình
  riêng, Then log có đúng một dòng WARN rồi đúng một dòng TIMEOUT, lượt thoát 143 (bị TERM), và một tiến trình canh do test
  tạo ngoài nhóm ấy vẫn sống sau ca.
- **AC-4** Given ba kết cục lượt — 00:00 chạy hết chuỗi tới enrich, lượt nhanh xong, lượt 00:00 thoát 1 vì lỗi nạp — When
  script thoát, Then trên toàn máy không còn tiến trình đồng hồ nào mang dấu riêng của thư mục thử (node đồng hồ chạy
  qua một symlink trong thư mục ấy) sau tối đa 10 giây — đếm theo dấu, không theo nhóm (đỏ trên @99b2778e9 ở kết cục 00:00).
- **AC-5** Given script được gọi qua `bash -c '<script>; echo NGUOI-GOI-SONG'` (script không phải trưởng nhóm) và trần tổng
  2 giây với một bước treo, When trần bắn, Then người gọi vẫn in `NGUOI-GOI-SONG rc=143` (script bị cắt bằng TERM) và thoát
  bằng mã, không bởi tín hiệu; bước treo không còn tiến trình nào sau tối đa 10 giây (đỏ trên @99b2778e9).
- **AC-6** Given khoá mang PID đang sống, When chạy lượt 00:00 (chờ `ZALO_IMPORT_CHO_KHOA=2`) và lượt nhanh, Then lượt
  00:00 in «khoá còn sống … không gỡ», thoát 1; lượt nhanh bỏ lượt thoát 0; khoá còn nguyên ở cả hai. Đối chứng: khoá mang
  PID đã chết thì bị gỡ và lượt chạy tiếp.
- **AC-7** Given node giả ở `ZALO_IMPORT_NODE_BIN` ghi lại biến môi trường đồng hồ, When chạy lượt 00:00 và lượt nhanh không
  đặt biến trần, Then trần/WARN lần lượt là 14400/7200 và 1200/600; đặt biến thì giá trị đặt thắng; `pipeline/cron/` và hai
  plist không đổi so với origin/main; `ZALO_IMPORT_NODE_BIN` trỏ tệp không có thì log có dòng «TRẦN THỜI GIAN TẮT», lượt
  vẫn chạy đủ các bước, mã thoát như khi có đồng hồ.
- **AC-8** Given cây làm việc của nhánh, When chạy các bộ test job cũ (lưới thời lượng JOB STEP gồm lưới phạm vi làn hai
  phía, năm bộ hồi quy job, khoá nạp trên DB thử) và trọn `node --test scripts/*.test.mjs` theo cách CI (HOME tạm không có
  `~/.local/node-v24.21.0`), Then tất cả thoát 0.
- **AC-9** Given thư mục `ap-may-thu/` của hồ sơ, Then có năm thứ: lệnh áp (gộp là có hiệu lực ở lượt 00:00 kế, không khởi
  động lại gì), số chạy thử trên bản sao, «sao lưu trước» là sha checkout chính trước gộp, cách lùi `git revert`, và lệnh
  kiểm sau `do-luot-dem.sh` đọc lượt 00:00 gần nhất trong log; chạy trên năm log mẫu (lượt 3 giờ · lượt 5 giờ 38 phút
  không dòng cắt · lượt có dòng TIMEOUT · lượt 3 giờ có dòng «TRẦN THỜI GIAN TẮT» · lượt cũ tắt rồi lượt mới 3 giờ có trần)
  thì in lần lượt ĐẠT, KHÔNG ĐẠT, ĐẠT (cắt trần), KHÔNG ĐẠT (trần tắt), ĐẠT.

## Out of scope

- Điểm dừng an toàn của bước đọc gộp khi bị cắt giữa chừng (hàng PL34 sở hữu).
- Trần riêng từng bước; báo trần bắn ra kênh cảnh báo; đổi plist.
- Lượt 00:00 dưới 4 giờ vẫn có thể chồng nhịp cloud-sync 15′ trong khoảng ấy; hàng này chỉ chặn lượt kéo quá 4 giờ (GS
  U1-133 chốt thước «≤ 4 giờ hoặc có dòng cắt trần»), không đo va chạm với cloud-sync.
- Bộ zc3 `import-daily` đỏ sẵn 13 mục trên main 120099fc5 (đo 17/11, không do nhánh này).

## Coverage

- Trục kết cục lượt: xong sớm · lỗi nạp · chạm trần nạp · chạm trần tổng · khoá bận [thước CE: câu giao GS U1-133 và
  `design.md`] — AC-1, AC-2, AC-3, AC-4, AC-6.
- Trục loại lượt: 00:00 · nhanh [thước CE: hai plist `pipeline/cron/`] — AC-4, AC-6, AC-7.
- Trục người gọi: launchd (trưởng nhóm) · `bash -c`/script khác (không trưởng nhóm) · test runner [thước CE: lỗ B đo
  17/11] — AC-3, AC-5. Launchd không dựng được trong test; kiểm sau áp ở AC-9.
- Trục môi trường: node thật có/không · biến trần đặt/không · CI không có node riêng [thước CE: lỗ C] — AC-7, AC-8.
- Trục dữ liệu: snapshot tin · snapshot hồ sơ · bắt kịp lượt sau [thước CE: câu giao GS «không mất, lượt sau bắt kịp»] —
  AC-1, AC-2.

## Đường đo

- Thời lượng lượt 00:00 (thước thay con số trên màn, GS U1-133): trước 5 giờ 38 phút (17/11); sau áp ≤ 4 giờ hoặc có dòng
  TIMEOUT của lượt — `bash _acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.sh pipeline/logs/zalo-import.log`
  trên máy thu sáng hôm sau gộp — AC-9.

## Notes

- Lỗ A, B (AC-4, AC-5) thuộc logic đồng hồ phía trên mốc làn → trả ZCode qua GS/LL (U1-1711-6, U1-1711-7); U1 chỉ sửa lỗ C
  ở tệp test.
