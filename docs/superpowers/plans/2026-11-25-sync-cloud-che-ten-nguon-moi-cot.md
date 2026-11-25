# Kế hoạch: sync-cloud-che-ten-nguon-moi-cot (HT26, T3)

Hợp đồng: `_acceptance/sync-cloud-che-ten-nguon-moi-cot/contract.md` (AC-1…AC-9, Mạnh duyệt 25/11 09:13Z, kèm lời áp khi gộp).
Luật: không lượt nào ngoài hồ sơ áp được gọi cloud thật hay ghi cloud; mọi ca test dùng exec giả; lượt khô E5 trỏ mọi đường cloud vào
cổng chết. DB máy thu chỉ đọc. Tải 1′ < 12, `nice -n 10` cho việc nặng ngoài s4.

## Task 1 — Che trong sync-cloud (independent: false)
Files: `pipeline/sync-cloud.mjs`, `pipeline/sync-cloud-che.test.mjs`.
- Sau bước đọc mỗi bảng FILL: giải dòng JSON giữ số (JSON.rawJSON), che từng ô bằng `pipeline/lib/che-ten-nguon-gia-tri.mjs`, khoá cấp
  dòng (tên cột từ catalog) giữ nguyên; khoá json lồng vẫn che. Đếm ô che theo bảng.cột → một dòng cảnh báo của lượt, không giá trị.
- Cờ `--kho`: đọc + che + soát, không gọi exec cloud (exec giả chặn mọi lời gọi), in số và thời gian từng pha.
- Verify: E1, E3, E8 (ca SCC-1, SCC-3, SCC-8 trên DB của lượt).

## Task 2 — Bộ chặn mọi bảng (independent: false, sau Task 1)
Files: `pipeline/sync-cloud.mjs`, `pipeline/sync-cloud-che.test.mjs`.
- `assertNoSourceNames` lặp mọi bảng trong `data` (không chỉ `CLOUD_ALLOW`), bỏ khoá cấp dòng là định danh lược đồ; fail-closed giữ.
- Verify: E2 (ca SCC-2, kèm đối chứng bản cũ để lọt).

## Task 3 — Bên đọc (independent: false, sau Task 1)
Files: `app/src/lib/do-hang-ngay.ts`, `app/tests/do-hang-ngay-che.test.tsx`, ca SCC-9 trong `pipeline/sync-cloud-che.test.mjs`.
- do-hang-ngay che `detail` bằng cùng hàm che của app như dq-checks.ts.
- Ca markets trước/sau che `areas.meta`; ca thẻ Invest khi mọi ảnh bị bỏ.
- Verify: E4, E9.

## Task 4 — Lệnh đo (independent: false)
Files: `scripts/do-ten-nguon-cloud.mjs`, `scripts/do-ten-nguon-cloud.test.mjs`.
- Đóng gói phép đo S1: SELECT khoá + cột, giao dịch chỉ đọc, phân trang keyset, đếm tại máy bằng findSourceNames + đếm thô độc lập;
  `--chi-may-thu` không gọi cloud. Không ghi đĩa giá trị.
- Verify: E6 (exec giả ghi câu SQL, soát không token), E5 (lượt khô máy thu thật — chỉ khi tải cho phép).

## Task 5 — Hồ sơ áp (independent: false, cuối)
Files: `_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/` (README năm mục: lệnh áp = gộp + lượt sync đầu, số chạy khô E5, sao lưu
cloud trước — đếm và băm từng bảng FILL trên cloud, cách lùi = revert + sync lại, lệnh kiểm sau = E7).
