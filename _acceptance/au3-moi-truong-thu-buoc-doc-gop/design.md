# Hộp thử AU3 có bước đọc gộp — phép đo nạp báo lỗi xanh lại sau job sáu bước

Hàng `au3-moi-truong-thu-buoc-doc-gop` (dãy P2). Mở từ Ngoài-4 của `pl34-lich-dem-sau-buoc`: Mạnh chọn «mở hợp đồng
mới» ở Cổng Bằng chứng 09/11; giám sát duyệt hàng 10/11 (P2-149), vùng `scripts/au3-nap-bao-loi/**`.

## Vì sao

PL34 (#384, `a7e73831`) cho `scripts/zalo-import-daily.sh` gọi thêm `bash "$ROOT/pipeline/doc-gop-hang-ngay.sh"`
giữa lần nạp cuối và `enrich-run`. Hộp thử của `scripts/au3-nap-bao-loi/acceptance.mjs` chép script vào thư mục tạm
và dựng bản giả cho từng bước, nhưng chưa có tệp `pipeline/doc-gop-hang-ngay.sh`. Bước đó thoát 127 nên job thoát
127. Đo trên `a7e73831`:

| Chế độ | Kết quả | Hồ sơ đang dùng |
|---|---|---|
| `ts-format` | PASS — không ca nào xét mã thoát của zalo, lỗ 127 bị nuốt | au3-nap-bao-loi E10, s03-nap-argmax E4, khoa-nap-s05-paused E8 |
| `lock` | FAIL 2 ca («khoá >2h → nạp bình thường» đòi exit 0) | au3-nap-bao-loi E11, khoa-nap-s05-paused E1–E3, s03-nap-argmax E5 |
| `mo-coi` | FAIL 2 ca (ca `.partial` đòi exit 0) | s03-nap-argmax E6 |

Ba hồ sơ đã ký vì thế không ghim lại được bằng làn máy.

## Cách làm

- `tsSandbox` ghi `pipeline/doc-gop-hang-ngay.sh` giả, một dòng ghi lời gọi nhãn `doc-gop-hang-ngay` vào sổ lời
  gọi của hộp thử. Không chép bản thật: bản thật gọi model trả phí. Cùng khuôn với tệp giả của PL34
  (`pl34-lich-dem-sau-buoc` dòng S1 `d-20261109T053838Z-2`) và với lệ sửa hộp thử sau ký của AU3
  (`au3-nap-bao-loi` dòng `d-20261030T234514Z-2`).
- Tham số `boDocGop` của `tsSandbox` bỏ riêng tệp giả — chỉ dùng cho đối chứng âm.
- Chế độ `ts-format`, nhánh `zalo-import-daily.sh`, thêm hai ca `MOI TRUONG DU BUOC`: job thoát 0; lời gọi đọc gộp
  đứng sau lần nạp cuối và trước `enrich-run`. Sau vòng lặp, một ca `DOI CHUNG THIEU DOC GOP` dựng CÙNG hộp thử với
  `boDocGop: true` và đòi job thoát 127 kèm dòng `JOB FAIL … bước doc-gop-hang-ngay mã 127`.
- Không đổi ngưỡng hay ý nghĩa ca cũ nào. Không chạm `scripts/zalo-*.sh` hay `pipeline/doc-gop-hang-ngay.sh` thật.

Vì sao đặt đối chứng âm ngay trong `ts-format`: lệnh `au3_ts_format` có sẵn trong `_acceptance/config.yaml` nên cả hai
chiều chạy trong làn máy mà không thêm khoá executor — `config.yaml` nằm ngoài vùng của hàng.

## Đã đo hai chiều (trước Cổng Phạm vi)

- Năm chế độ `ts-format`, `lock`, `mo-coi`, `apify`, `chotot` đều PASS sau sửa.
- Đột biến 1 (không ghi tệp giả): `TS-FORMAT FAIL (2 mục)`, hai dòng `MOI TRUONG DU BUOC … (được 127)`.
- Đột biến 2 (đối chứng vẫn có tệp giả): `TS-FORMAT FAIL (1 mục)`, dòng `DOI CHUNG THIEU DOC GOP … (được 0)`.

## Ghim lại

Sau khi gộp, ghim lại `au3-nap-bao-loi`, `khoa-nap-s05-paused`, `s03-nap-argmax` bằng MỘT lượt làn máy
(`repin-lane.mjs --slug … --slug … --slug … --write`) dưới khoá `ghim-lai` của đợt.
