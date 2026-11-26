# Kế hoạch thi công NB10 · ghi-tam-do-sau-co-han

Hợp đồng: `_acceptance/ghi-tam-do-sau-co-han/contract.md` (Mạnh duyệt 26/11, nhận khuyến nghị Hỏi-1..5). Thiết kế:
`docs/superpowers/specs/2026-11-26-ghi-tam-do-sau-co-han-design.md`. Hạng T3 → Gate 1.5 trước khi viết mã.

Mọi task tuần tự (`independent: false`): T2–T6 cùng dựa vào lược đồ của T1, T3 và T4 cùng sửa đường áp.
Verify per-task theo quy ước kho: `cd agent && npx tsc --noEmit`, test chạy trên DB của riêng lượt (`db/db-thu.sh`), không
thử migration chưa gộp trên DB dùng chung `oneinvest` (luật đợt 27/10).

## T1 — Migration 129: lô, cờ, rút có actor máy, B3
- Files: `db/migrations/129_ghi_tam_lo.sql` (mới).
- Nội dung:
  - bảng `ghi_tam_lo` (ma, field, nguon_luot, doc_lap, ghi_boi, model, nac, mo_luc, han_do_bu, ket_qua_do_bu, trang_thai,
    doi_boi, doi_luc);
  - bảng `ghi_tam_o` (field, dung, ly_do, luc, mo_lai_boi);
  - hai cột `enrichment_proposals.lo_id`, `ghi_tam`;
  - điền lùi ba lô, idempotent, hạn = `current_date + 14`;
  - `revert_enrichment` bản 129: chép thân bản 066, chỉ nới kiểm actor — `hitl:` như cũ, hoặc `may:ghi-tam:` khi MỌI id thuộc
    một lô ghi tạm;
  - `rut_lo_ghi_tam(ma, actor, ly_do)`;
  - `unit_data_level()` bản 129: tin có loại hình từ đề xuất ghi tạm còn sống không vào `du`;
  - khối lùi ghi trong chú thích đầu tệp.
- Verify: áp trên DB thử dựng từ migration, áp hai lần, `\df` thấy hàm mới.
- Phục vụ: E4, E5, E7, E8.

## T2 — Lời nhắc độc lập và phiếu độc lập
- Files: `agent/src/agents/enrich-text.ts`, `agent/src/enrich/ghi-tam/doc-lap.ts` (mới), `agent/scripts/enrich-run.ts`,
  `agent/src/enrich/run.ts` (kiểu `LlmFn` trả kèm `prompt`).
- Nội dung:
  - `buildEnrichInput` bỏ «Loại hình từ nhóm», «Mã tòa phát hiện»;
  - `phieuDocLap(prompt)` dò hai nhãn, giá trị luật đi kèm nhãn, và danh sách toà;
  - lời gọi model trả lời nhắc đã gửi.
- Verify: tsc + test đơn vị ma trận 2 × 2.
- Phục vụ: E1, E2.

## T3 — Cổng ghi tạm trong lượt đêm (thay chốt NB11)
- Files: `agent/src/enrich/ghi-tam/lo.ts` (mới), `agent/src/enrich/run.ts`, `agent/src/enrich/tong-ket.ts`,
  `agent/scripts/enrich-run.ts`.
- Nội dung:
  - đầu lượt `xetHan` (lô quá hạn hoặc `khong-dat` → `rut_lo_ghi_tam` actor `may:ghi-tam:het-han`, ô dừng, dòng tổng kết);
  - corroborated chỉ áp khi `doc_lap` và ô mở, khác thì đi `review` kèm `trung_luat` như NB11;
  - áp thì mở lô `<run_id>:<field>` rồi gắn `lo_id`, `ghi_tam` trước `apply_enrichment`;
  - `evidence.doc_lap` + băm lời nhắc;
  - gỡ `chanTuApCanCu` và tuỳ chọn của nó.
- Verify: tsc + test DB thử.
- Phục vụ: E2, E3, E6, E9.

## T4 — Lượt đọc toàn bộ đi qua cùng cổng
- Files: `agent/src/enrich/doc-toan-bo.ts`.
- Nội dung: hai chỗ gọi `apply_enrichment` cho corroborated gọi qua `lo.ts` (lô `<run_id>:property_type`, `doc_lap` true theo
  mục 63); ô dừng thì không áp.
- Verify: tsc + test doc-toan-bo hiện có xanh + ca mới.
- Phục vụ: E3.

## T5 — Lệnh rút và kết quả đo bù
- Files: `pipeline/scripts/rut-lo-ghi-tam.mjs`, `pipeline/scripts/rut-lo-ghi-tam.test.mjs` (mới).
- Nội dung:
  - `--lo` chạy thử / `--ghi`;
  - `--ket-qua dat|khong-dat`;
  - `--mo-o <field>`;
  - `--het-han` (không cần lượt);
  - `--nguoi hitl:` và `--ly-do` bắt buộc khi ghi; `--het-han` dùng actor máy.
- Verify: `node --test` trên DB thử.
- Phục vụ: E5, E6, E7.

## T6 — Probe hồ sơ và cập nhật test NB11
- Files:
  - `_acceptance/ghi-tam-do-sau-co-han/probes/{cham.sh,dot-bien.mjs,ban-chep.sh}`;
  - `agent/tests/ghi-tam*.test.ts` (mới);
  - `agent/tests/enrich-luot-dem-khong-tu-ap.test.ts` (cập nhật).
- Nội dung:
  - mỗi AC: ca xanh trên mã thật, đột biến trong bản sao đỏ kèm thông điệp ghim;
  - `ban-chep.sh` chép DB máy thu sang DB thử (chỉ đọc nguồn), áp 129 hai lần, in câu đếm, xoá DB thử.
- Verify: `bash probes/cham.sh AC-n` từng AC, `ban-chep.sh AC-4`.
- Phục vụ: E1–E9.

## T7 — Hồ sơ áp lên máy thu
- Files: `_acceptance/ghi-tam-do-sau-co-han/ap-may-thu.md`.
- Nội dung: năm thứ:
  - lệnh áp từ `main`;
  - số chạy thử lấy từ lượt `ban-chep.sh`;
  - `pg_dump -t enrichment_proposals` trước khi áp;
  - khối lùi đã chạy thử trên bản chép, kèm số;
  - lệnh kiểm sau.
- Phục vụ: E10.

Sau T7: `status: implemented` → S4 (chấm trên M5 hoặc s4 Mac mini theo GS).
