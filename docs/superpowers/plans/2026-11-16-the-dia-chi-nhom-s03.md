# Kế hoạch thi công — TG1 the-dia-chi-nhom-s03

Hợp đồng: `_acceptance/the-dia-chi-nhom-s03/contract.md` (duyệt Mạnh 16/11, Hỏi-1…4 theo khuyến nghị: vai ops duyệt thẻ ·
không ghi ngược sổ · ngưỡng như Hỏi-3 · bỏ design-pass). Thiết kế: `docs/superpowers/specs/2026-11-16-the-dia-chi-nhom-s03-design.md`.
Verify theo CLAUDE.md của kho (`/verify` từng module); test DB chạy qua `db/db-thu.sh oneinvest_suite_* --chay`. Không áp 108 lên
`oneinvest` (máy thu) — chỉ DB thử và bản chép `oneinvest_u1_tg1`.

| # | Task | Tệp | Verify per-task | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | Migration 108: hai bảng, mã thẻ `TN-nnn` từ dãy, trigger kiểm tham chiếu (dự án `project`, phân khu `subzone`/`building`, phường cấp phường, ≤ 3 dự án); itest AC-1 + đối chứng đỏ `kiem-du-an` | `db/migrations/108_the_dia_chi_nhom.sql`, `pipeline/tests/the-dia-chi-nhom.itest.mjs` (ca AC-1) | áp hai lần trên DB thử; `tg1_db` ca AC-1 | E1 | false (nền cho 3–6) |
| 2 | Hàm thuần dựng nháp + ma trận 16 ô + hai đối chứng đỏ `nguong-10`, `tran-3` | `pipeline/lib/the-dia-chi-nhom.mjs`, `pipeline/tests/the-dia-chi-nhom.test.mjs` | `node --test` tệp test; `node --check` | E2 | true |
| 3 | Lệnh dựng nháp: đọc nhóm thật + nhãn + danh bạ, ghi thẻ `nhap` + lịch sử, không đụng thẻ đã duyệt/bác; cờ `--bo-so` (AC-8), `--dem`; itest AC-3 năm lớp + đối chứng `giu-da-duyet` | `pipeline/scripts/the-dia-chi-nhom.mjs`, `pipeline/tests/the-dia-chi-nhom.itest.mjs` (ca AC-3), `pipeline/test-nua.json` | `tg1_db` | E3 | false (sau 1, 2) |
| 4 | App: đọc thẻ (null khi chưa có bảng), action `card-decide` (nhận/sửa/bác, version, lịch sử + `ops_audit` cùng giao dịch), quyền `unit.card_decide` vai ops; itest AC-4, AC-6 | `app/src/lib/the-dia-chi-nhom.ts`, `app/src/app/api/v1/ops/source-groups/route.ts`, `app/src/lib/ops-access.ts`, `app/tests/the-dia-chi-nhom-app.itest.tsx` | `npx tsc --noEmit`, `npm run lint`, `tg1_app` | E4, E6 | false (sau 1) |
| 5 | Giao diện: bộ đếm đầu lưới Nhóm S03, cột badge thẻ, hộp «Duyệt thẻ» (bốn ô + căn cứ, Nhận/Lưu sửa/Bác, 409 giữ chữ, viewer chỉ xem), nhóm chưa có trong sổ cuối lưới; thuật ngữ «Thẻ địa chỉ nhóm» vào `CONTEXT.md` | `app/src/components/ops/sources/the-dia-chi-*.tsx`, `so-don-vi.tsx`, `CONTEXT.md` | tsc + lint + luật ReUI tự soát; xem bản chạy :3460 trên DB thử | E5, E10 | false (sau 4) |
| 6 | Script dữ liệu thật: `--dem` (AC-7: số nhóm có thẻ, năm lớp, sàn từng ô) và `--chat-luong` (AC-8: 13 nhóm, bỏ sổ) chỉ chạy trên `oneinvest_u1_tg1`; executor vào `_acceptance/config.yaml` | `pipeline/scripts/the-dia-chi-nhom-that.mjs`, `_acceptance/config.yaml` | chạy hai cờ trên bản chép | E7, E8 | false (sau 3) |
| 7 | Hồ sơ áp `ap-may-thu/` năm tệp + itest lùi (AC-9) | `_acceptance/the-dia-chi-nhom-s03/ap-may-thu/*`, `pipeline/tests/the-dia-chi-nhom-lui.itest.mjs` | `tg1_lui` | E9 | false (sau 1) |

Thứ tự: 1 → 2 (song song được nhưng nhỏ, làm tuần tự) → 3 → 4 → 5 → 6 → 7. Không fan-out (chỉ task 2 độc lập).

Lựa chọn load-bearing: khoá thẻ là khoá nhóm thật nhưng API và giao diện chỉ dùng `card_code` (AC-6); thẻ đọc ở app bằng
`to_regclass` để cloud không lỗi; nháp dựng lại chỉ khi băm căn cứ đổi (AC-3 chạy lần hai không đổi byte).
