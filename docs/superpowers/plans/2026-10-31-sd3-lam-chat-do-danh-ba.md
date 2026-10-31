# sd3-lam-chat-do-danh-ba — kế hoạch thi công

Design: `docs/superpowers/specs/2026-10-31-sd3-lam-chat-do-danh-ba-design.md` · hợp đồng `_acceptance/sd3-lam-chat-do-danh-ba/`.

## Task 1 — Kiểm N6 trong bộ đo trục SĐT (phục vụ E1, E2) · independent: false
Files: `pipeline/do-danh-ba-sdt.mjs`, `pipeline/do-danh-ba-sdt.test.mjs`.
`tinhSo` nhận bí danh `sdt` kèm `retired_at` và tập SĐT trên bản ghi tin theo nguồn; N1/N2 giữ lọc bí danh còn hiệu lực.
N6 = `trung · thua · thieu · tong`; `veDong` ra 11 dòng. Test: ma trận viết trước + đối chứng đỏ bỏ đếm `thua`, chặn SĐT
trong detail.
Verify: `node --test pipeline/do-danh-ba-sdt.test.mjs`.

## Task 2 — Nhãn N6 trên /ops/quality (phục vụ E3) · independent: false (sau Task 1)
Files: `app/src/lib/dq-labels.ts`, `app/tests/dq-danh-ba-sdt-label.test.tsx`.
Verify: `cd app && node --import tsx --test tests/dq-danh-ba-sdt-label.test.tsx && npx tsc --noEmit`.

## Task 3 — Probe chuyển 060 trên DB thử (phục vụ E4, E5, E6) · independent: true
Files: `_acceptance/sd3-lam-chat-do-danh-ba/probes/chuyen.mjs` (phần `n6`, `anh`, `ten`; DB thử qua
`_acceptance/sdt-luu-goc-e164/probes/db-thu-chac.sh`; bước đêm đời trước bung từ commit cha thứ nhất của merge SD3).
Verify: chạy ba phần trên DB thử.

## Task 4 — Che số /ops/people qua loader thật (phục vụ E7) · independent: true
Files: `app/tests/people-che-so-loader.test.tsx`, `_acceptance/sd3-lam-chat-do-danh-ba/probes/people.sh`.
Verify: `bash _acceptance/sd3-lam-chat-do-danh-ba/probes/people.sh`.

## Task 5 — Phạm vi (phục vụ E8) · independent: true
Files: `_acceptance/sd3-lam-chat-do-danh-ba/probes/pham-vi.sh`.
Verify: `bash _acceptance/sd3-lam-chat-do-danh-ba/probes/pham-vi.sh`.
