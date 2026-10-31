---
schema_version: 1
feature: Công tắc cho bước gộp Người theo SĐT trong job đêm, mặc định tắt, bật/tắt bằng lệnh có lý do ghi ops_audit
slug: cong-tac-gop-nguoi-dem
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-10-31T15:31:01Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-31-cong-tac-gop-nguoi-dem-design.md
---

# Acceptance Contract: cong-tac-gop-nguoi-dem

## Context

HD13 (`nguoi-noi-theo-sdt`, PR #250) gộp người theo SĐT trong mọi lượt `dungNguoi`, kể cả job đêm (`buocDem` COMMIT).
DB máy thu đã có 055 + 060 nên gộp #250 vào main là gộp thật trên dữ liệu thật lượt đêm kế tiếp — trái OOS-5 của HD13.
Mạnh chọn «mở hợp đồng mới» cho Ngoài-1 ở Cổng Bằng chứng HD13 (31/10); giám sát giao hàng này ưu tiên 1.

Vùng: `pipeline/lib/danh-ba-nguoi.mjs`, `pipeline/dung-nguoi.mjs`, `pipeline/refresh-bait-gap.mjs`,
`pipeline/scripts/danh-ba-nguoi*.test.mjs`, `pipeline/scripts/danh-ba-nguoi.itest.mjs`, `pipeline/scripts/nap-lai-nguoi.mjs`.

## Criteria

- AC-1: Given DB không có dòng `ops_audit` nào mang `action = 'danh-ba:gop-sdt'`, When dựng danh bạ (cả `dungNguoi` lẫn
  bước đêm `buocDem`) trên dữ liệu có cặp một–một, Then 0 người chuyển `merged`, 0 sự kiện `gop`, kết quả trả
  `cong_tac_gop = "tat"` và `gop_cho` bằng số cặp đủ luật HD13, dòng in có «công tắc gộp tắt (chờ N)».
- AC-2: Given dòng `danh-ba:gop-sdt` mới nhất có `detail.bat = true`, When dựng danh bạ (cả `dungNguoi` lẫn bước đêm
  `buocDem`, không truyền tham số gộp), Then gộp đúng như HD13 (cùng tập cặp `tu → vao` với lượt truyền `gop: true`), kết
  quả trả `cong_tac_gop = "bat"` và `gop_cho = 0`.
- AC-3: Given nhiều dòng công tắc, When đọc công tắc, Then dòng có id lớn nhất thắng (bật rồi tắt → tắt; tắt rồi bật →
  bật); dòng mang `detail.bat` không phải boolean → coi là tắt; DB chưa có bảng `ops_audit` → tắt mà giao dịch đang mở
  vẫn dùng tiếp được (không câu lỗi nào làm hỏng giao dịch).
- AC-4: Given công tắc tắt và DB đã có người `merged` từ một lượt bật trước, When dựng danh bạ hai lượt, Then người đã
  gộp giữ nguyên `merged`/`merged_into`, vai của tin vẫn trên người tài khoản, và lượt hai ghi 0 người, 0 bí danh, 0 vai
  mới, 0 vai rút, 0 sự kiện.
- AC-5: Given lệnh `dung-nguoi.mjs --cong-tac-gop bat|tat --ly-do «…»`, When chạy trên DB thử, Then đúng một dòng
  `ops_audit` được thêm (actor `dung-nguoi`, action `danh-ba:gop-sdt`, `detail.bat` đúng giá trị, `detail.ly_do` = lý do),
  không chạy bộ dựng (bốn bảng danh bạ không đổi), và `--thu` không để lại dòng nào.
- AC-6: Given lệnh công tắc sai (giá trị khác `bat`/`tat`, thiếu `--ly-do`, hoặc đi cùng `--tach`), When chạy, Then thoát 2
  trước khi mở kết nối DB, stderr nêu lý do, không ghi dòng nào.
- AC-7: Given DB thử chép máy thu (công tắc chưa có dòng), When chạy thước nạp lại trong một giao dịch ROLLBACK, Then lượt
  đêm đầu gộp 0 và `gop_cho` theo nguồn bằng N1 chưa gộp đếm độc lập; bật công tắc trong giao dịch rồi lượt kế gộp đúng
  N1, N1 sau = 0, các kiểm HD13 (đích gộp, không người hai SĐT, không gộp khác nguồn, lượt sau gộp 0) vẫn đúng; đối
  chứng: bộ dựng bỏ qua công tắc (luôn bật) làm thước đỏ ở lượt đầu.
- AC-8: Given mã nguồn sau vòng, When đọc tĩnh, Then câu đọc công tắc chỉ đọc `ops_audit`, câu ghi công tắc chỉ là
  INSERT `ops_audit`, không câu SQL nào của bộ dựng hay `dung-nguoi.mjs` UPDATE/DELETE `ops_audit`, và không lời gọi
  `dungNguoi(` nào trong mã chạy thật (`refresh-bait-gap.mjs`, `dung-nguoi.mjs`, `lib/danh-ba-nguoi.mjs`) truyền khoá `gop`.
- AC-9: Given DB thử không có dòng công tắc bật, When chạy lệnh dựng tay `dung-nguoi.mjs --thu` trên dữ liệu có cặp
  một–một, Then thoát 0, dòng in có «công tắc gộp tắt», và 0 người `merged` mới (kết nối riêng đếm trước = sau).

## Coverage

Trục (quét hình thái, preset test-matrix):
- Trạng thái công tắc: không dòng · bật · tắt · bật-rồi-tắt · tắt-rồi-bật · detail hỏng · không bảng → AC-1, AC-2, AC-3.
- Đường gọi: `dungNguoi` trực tiếp · bước đêm `buocDem` · CLI dựng · CLI công tắc · tách → AC-1, AC-2, AC-9, AC-5, AC-7,
  AC-8 (tách giữ nguyên: phủ bởi HD13 E6/E9 chạy lại với công tắc bật).
- Lịch sử: chưa từng gộp · đã gộp trước khi tắt → AC-1, AC-4.
- Mức dựng: hàm thuần (đọc công tắc từ dòng) · DB thử viết tay · dữ liệu thật chép máy thu · đọc tĩnh → AC-3, AC-1/2/4/5,
  AC-7, AC-8.
- Lệnh sai: giá trị lạ · thiếu lý do · trộn `--tach` → AC-6.

## Out of scope

- OOS-1: Bật công tắc trên DB máy thu (`oneinvest`) — lệnh của Mạnh, sau khi PR vào main.
- OOS-2: Kiểm N1 đêm đếm người đã tách (Ngoài-2 HD13 → hàng `n1-dem-nguoi-tach`).
- OOS-3: Tự tách lại người đã gộp khi tắt công tắc.
- OOS-4: Giao diện `/ops` để bật/tắt hay xem lịch sử công tắc.

## Đường đo

Hàng không có `opportunity.md` (giao từ Ngoài-1 HD13); thước là AC-7 trên dữ liệu thật chép máy thu.

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-11-01:
  - Ngoài-1: Thước nạp lại xoá dòng nhật ký công tắc trong lượt thử trên DB thử (luôn lùi lại), lệch nếp nhật ký chỉ-thêm trong mã kiểm thử.
  - Ngoài-2: Bài kiểm lệnh dựng tay khi công tắc tắt (E9) chỉ dựa vào nhãn tự báo, chưa kiểm số cặp gộp; việc không gộp khi tắt vẫn được chứng ở E1, E4 và thước E7.
