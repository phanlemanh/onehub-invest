# Kế hoạch — db-volume-check-volume-khac-ten (T2, không Gate 1.5)

| Việc | Tệp | Lệnh kiểm | Phục vụ | independent |
|---|---|---|---|---|
| 1. Tách `doc_dd <container>` khỏi `live_doc`; khối «nhánh dữ liệu» 4 ô trong `run_live_selftest` (dung · khac-ten · gan-data · khong-doc, bản lùi `mot-dung` giờ `sau`), ô khong-doc lấy dd bằng `doc_dd one-invest-db-khong-co-$$`; đếm `PASS nhánh dữ liệu đủ 4 ô` | `scripts/db-volume-check.sh` | `bash scripts/db-volume-check.sh live` + phá thử tay (đổi kỳ vọng một ô → đỏ ghim) | E1, E2, E4 | false |
| 2. `run_mutation`: bản sao tệp với nhánh khác tên `fail`→`pass` → `live-selftest` của bản sao đỏ ghim `ô dữ liệu khac-ten lẽ ra đỏ`; bản lành xanh ghim `PASS nhánh dữ liệu đủ 4 ô` | `scripts/db-volume-check.sh` | `bash scripts/db-volume-check.sh mutation` | E3, E5 | false |
| 3. Hồi quy cùng tệp | — | `static`, `tap-duot` | E6, E7 | false |
| 4. Ghim lại `db-vao-volume` + `db-volume-live-ban-lui` (lượt `ghim-lai`, cham-tep P2-86 đã duyệt) | `_acceptance/{db-vao-volume,db-volume-live-ban-lui}/{run-log.jsonl,evidence-report.md}` | `repin-lane.mjs --slug db-vao-volume --slug db-volume-live-ban-lui --write` | E8 | false |
