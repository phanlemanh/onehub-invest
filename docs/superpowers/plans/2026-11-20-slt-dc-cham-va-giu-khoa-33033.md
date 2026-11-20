# Kế hoạch — slt-dc-cham-va-giu-khoa-33033

Hồ sơ `_acceptance/slt-dc-cham-va-giu-khoa-33033/`. Các task phụ thuộc nhau (cùng hai tệp test), làm tuần tự.

| Task | Tệp | Lệnh kiểm từng task | Phục vụ | independent |
|---|---|---|---|---|
| T1 Câu rút mới `SQL_RUT_THAY` | `pipeline/lib/assert.mjs` | `node --check pipeline/lib/assert.mjs` | E1, E2, E3 | false |
| T2 Test tương đương + không bậc hai | `pipeline/scripts/assert-rut-thay.test.mjs`, `pipeline/test-nua.json` | `config:executors.test.trt_db` | E1, E3 | false |
| T3 `moGiaoDichGiuKhoa` + SLT-DC nhả khoá, trần theo số đo | `pipeline/lib/nap-045.mjs`, `pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs` | `config:executors.script.trt_slt_dc_gio` | E4, E5 | false |
| T4 Probe tương đương lượt thật, đo giờ, sản xuất, phạm vi | `_acceptance/slt-dc-cham-va-giu-khoa-33033/probes/*` | `config:executors.script.trt_tuong_duong`, `trt_pham_vi` | E2, E6, E7, E8 | false |
