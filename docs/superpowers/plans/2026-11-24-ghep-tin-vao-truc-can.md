# Kế hoạch thi công PL36 ghep-tin-vao-truc-can

Thiết kế: `docs/superpowers/specs/2026-11-24-ghep-tin-vao-truc-can-design.md`. Hợp đồng: `_acceptance/ghep-tin-vao-truc-can/contract.md`
(Mạnh duyệt 24/11: Hỏi-1 chấm theo khu, GP báo số; Hỏi-2 trợ lý nháp 110 bài, Mạnh duyệt, thẻ cài lỗi).

Mọi test chạy trên DB thử của riêng lượt (`db/db-thu.sh`); không ghi vào `oneinvest`. Chạy khô và đo thời gian trên bản chép
chỉ đọc. Không áp 131 lên DB máy thu ở hàng này (làm sau gộp, theo hồ sơ áp).

| # | Việc | Tệp | Kiểm từng việc | Phục vụ | Độc lập |
|---|---|---|---|---|---|
| 1 | Sổ từ vựng: thêm `universal_property_sub_id` (UniversalPropertySubId, «Trục, căn của tin») | `pipeline/mappings.yaml`, `pipeline/lib/vocab.generated.mjs` (sinh lại) | lệnh sinh vocab + `node --check` | E4 | không |
| 2 | Migration 131: dòng đính chính «Lùi» của 117; CHECK trường; trigger 082 thêm luật sub_id (chỉ Property, khuôn `stk_…:<tầng>`/`stk_…:*`, trục đang hoạt động); `ref_lookup`; viết lại thân `offer_building` với `v_toa_nut_vung` trong CTE `MATERIALIZED`; tạo `offer_unit` | `db/migrations/131_ghep_truc_can_tren_tin.sql` | áp hai lần trên DB thử, lần hai sạch | E4, E5, E7 | không (sau 1) |
| 3 | Hàm thuần: đọc mã căn, tiền tố toà, trục, tầng (chuẩn không số 0 đầu), căn, bí danh, bài nhiều căn; mỗi nguồn một `rule_id` | `pipeline/lib/ghep-tin-truc-can.mjs` + `pipeline/scripts/ghep-tin-truc-can.test.mjs` | `node --test`; mỗi ô một assert, cặp hai chiều với bản đột biến | E1, E2, E3 | có |
| 4 | Đọc đầu vào (bài có toà sống của PL20, `unit_number`, `floor_raw`, trục, căn, bí danh) và ghi (rút rồi chèn, khoá tư vấn `ghep-can`, trần 60 giây) | `pipeline/lib/ghep-tin-truc-can-doc.mjs`, `pipeline/lib/ghep-tin-truc-can-ghi.mjs` | itest trên DB thử: lượt hai 0/0 | E5, E6 | không (sau 2, 3) |
| 5 | Nối vào cuối lượt nạp sau bước gắn toà; `assert.mjs` chừa `ghep-can-%` | `pipeline/transform-zalo.mjs`, `pipeline/lib/assert.mjs` | itest lượt nạp, cấy lỗi | E6, E8 | không (sau 4) |
| 6 | Lệnh chạy khô theo khu (in mức, lý do, từng tin mức căn) và lệnh rút lát chấm 110 bài OP1 có mã dạng trục (nạp `eval_label_items`, lát `hai-khu-truc`, có băm) | `pipeline/scripts/ghep-tin-truc-can-kho.mjs`, `pipeline/scripts/ghep-tin-truc-can-lat.mjs` | chạy trên bản chép | E9, E10a | không (sau 4) |
| 7 | Lệnh chấm: so băm tập, Wilson theo khu, bảng bài sai → `evidence/cham-truc.md` | `pipeline/scripts/ghep-tin-truc-can-cham.mjs` | test với tập giả + đổi một nhãn đỏ | E10a, E10 | không (sau 3) |
| 8 | Probe của hồ sơ (mỗi eval một lệnh) | `_acceptance/ghep-tin-vao-truc-can/probes/*.sh` | chạy từng probe | mọi eval | không (sau 2–7) |
| 9 | Hồ sơ áp 131 (năm phần: lệnh áp, số chạy thử, sao lưu, cách lùi, lệnh kiểm sau) + tệp lùi | `_acceptance/ghep-tin-vao-truc-can/ho-so-ap.md`, `…/lui/lui-131.sql` | chạy thử lùi trên bản chép | AC-4 (áp) | không (sau 2) |

Thứ tự: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9, làm tuần tự trong phiên chính (chỉ việc 3 độc lập, không đủ hai việc để chạy song song).

Chạy dài (lượt nạp thử, đo thời gian trên bản chép) xin lượt `s4` theo luật đợt; việc nhẹ chạy trên DB thử của riêng lượt.
Sau việc 6, báo GS và phiên gắn nhãn tên lát `hai-khu-truc` để trợ lý điền nháp; AC-10 chờ Mạnh duyệt nhãn.
