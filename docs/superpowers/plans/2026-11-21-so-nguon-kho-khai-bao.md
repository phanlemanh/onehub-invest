# Kế hoạch thi công NK1 so-nguon-kho-khai-bao

Hợp đồng: `_acceptance/so-nguon-kho-khai-bao/contract.md` (duyệt 21/11, Mạnh «duyệt» theo khuyến nghị Hỏi-1, Hỏi-2). Thiết kế:
`docs/superpowers/specs/2026-11-21-so-nguon-kho-khai-bao-design.md`. Mọi lệnh DB chạy trên DB của riêng lượt (`db/db-thu.sh
oneinvest_suite_<x> --chay`); DB máy thu chỉ đọc.

**Một nguồn nhịp, cả trong test.** Nhịp chỉ sống ở migration 122. Test cần nhịp (lược đồ cấy, client giả) đọc nó qua
`scripts/lib/so-nguon-122.mjs` — bộ đọc tệp 122 (khối cột có dấu mốc + bảng VALUES `(mã, họ, nhịp, …)`), không chép số tay. Lược
đồ cấy `LIKE public.source_registry` thêm cột bằng chính khối cột của 122 chạy trong schema tạm, nên test chạy được cả trên DB chưa
áp 122 (DB máy thu trước áp) lẫn DB đã áp (CI dựng từ migration).

**Test của hồ sơ đã ký.** `check-freshness.test.mjs` (AU4, GT, SL), `freshness-parity.test.mjs` (SL-AC-1), `s05-slo.test.mjs`
(S5-AC-1, S5-AC-6), `slo-mot-nguon.test.tsx` (SL-AC-2/3) đang ghim hằng `SLO_HOURS`. Giữ NGUYÊN tên ca (evals của hồ sơ cũ
đòi đúng tên), đổi nguồn số sang migration 122; ý của tiêu chí cũ (S05 = 96, một chỗ ghi nhịp, hai bản khớp) giữ, chỗ ghi duy nhất
nay là 122. Ghi dòng sổ `approach`.

| # | Việc | Tệp | Kiểm từng việc | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | Migration 122 (năm cột, VALUES họ + nhịp, S16/S09/S17/S11/S01, S07/S10 stg_tables) + bộ đọc `so-nguon-122.mjs` + `so-nguon-kho.test.mjs` NK-AC-1 (áp hai lần lên public của DB lượt, CHECK, bảng viết trước, chiều đỏ) | `db/migrations/122_source_registry_family_cadence.sql`, `scripts/lib/so-nguon-122.mjs`, `scripts/so-nguon-kho.test.mjs` | `bash db/db-thu.sh oneinvest_suite_nk --chay node --test scripts/so-nguon-kho.test.mjs` | E1 | false |
| 2 | Hai bản độ tươi: bỏ `SLO_HOURS`, đọc `cadence_hours`, `stg_tables`, `measured_markets`; câu đo chung qua bảng nạp (khuôn tên + `to_regclass`); lọc thị trường sau `gopThanhPho`; sổ thiếu cột → lỗi gọi tên 122 | `scripts/lib/freshness.mjs`, `app/src/lib/freshness.ts` | `node --check`, `cd app && npx tsc --noEmit` | E2–E4 | false |
| 3 | Test CLI + hai bản: lược đồ cấy thêm cột từ 122, nhịp từ 122; ca NK-AC-2/3/4 + chiều đỏ; parity, s05-slo đổi nguồn số | `scripts/check-freshness.test.mjs`, `scripts/freshness-parity.test.mjs`, `scripts/s05-slo.test.mjs`, `scripts/so-nguon-kho.test.mjs` | `config:executors.test.nk_db` + `node --test scripts/s05-slo.test.mjs` | E2–E4 | false |
| 4 | Test app: `slo-mot-nguon.test.tsx` (lược đồ cấy, NK-AC-5 dựng trọn bảng Sức khoẻ nguồn + chiều đỏ), các test app/pipeline/báo cáo đọc sổ thì thêm cột | `app/tests/slo-mot-nguon.test.tsx`, `app/tests/o-kpi-chi-do-local.test.tsx`, `pipeline/scripts/ops-facts-so-tong-hop.test.mjs`, `scripts/bao-cao-ngay.test.mjs` | `config:executors.test.nk_app`, executor cũ của các test đó trên DB lượt | E5 | false |
| 5 | Ba máy đo: `tang-a.mjs` (danh sách tên từ tệp tạm hoặc sổ máy thu + biến thể gập, tự kiểm cấy), `pham-vi.sh` (danh sách cho phép + tự kiểm), `may-thu.mjs` (CLI + readFreshness app ở checkout chính, đếm mục tầng A) | `_acceptance/so-nguon-kho-khai-bao/probes/*` | chạy `nk_tang_a`, `nk_pham_vi`; `may-thu.mjs --tu-kiem` trên DB lượt | E6–E8 | true |
| 6 | Hồ sơ áp: `ap-may-thu.md` (năm thứ), `ap-may-thu/tra-s09-s17.mjs`, `lui-122.sql`, sao lưu bảng; chạy thử áp + điền + lùi trên DB lượt | `_acceptance/so-nguon-kho-khai-bao/ap-may-thu*` | chạy thử trên `oneinvest_suite_nkap`, ghi số | E7 | true |
| 7 | Gộp main vào nhánh, `/verify` các module đổi, contract → implemented | — | `/verify` | — | false |

Việc 5 và 6 độc lập với nhau nhưng nhỏ: làm tuần tự trong vòng chính, không mở Workflow song song.
