# Kế hoạch — db-volume-live-ban-lui (T2, không Gate 1.5)

| Việc | Tệp | Lệnh kiểm | Phục vụ | independent |
|---|---|---|---|---|
| 1. `gom_ban_lui <regex>` (mảng rỗng khi không khớp), `check_ban_lui <mảng> <giờ>` theo lối b (hằng `BAN_LUI_GIU_DEN=2026-11-05T09:20:00Z`, giờ ép `DB_VOLUME_GIO_GIA`), `live_doc` dùng `gom_ban_lui`; tự kiểm: hai ô round-trip đường gom + ma trận 16 ô dựng từ `docker inspect one-invest-db` thật, đếm ô = 16; `expect` xanh kèm thông điệp ghim | `scripts/db-volume-check.sh` | `bash scripts/db-volume-check.sh live` + phá thử (đổi một kỳ vọng ô → đỏ ghim) | E1–E4 | false |
| 2. Hồi quy cùng tệp | — | `static`, `mutation`, `tap-duot` | E5–E7 | false |
| 3. Ghim lại hồ sơ `db-vao-volume` (xin lượt `ghim-lai`) | `_acceptance/db-vao-volume/run-log.jsonl`, `evidence-report.md` | `repin-lane.mjs --slug db-vao-volume --reason "sau db-volume-live-ban-lui" --write` | E8 | false |
