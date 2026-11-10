# Kế hoạch — od2-phim-va-loi-ghi

Hồ sơ `_acceptance/od2-phim-va-loi-ghi/` (T2, Cổng Phạm vi Mạnh duyệt 08/11, Hỏi-1: giữ chữ «Đã ghi»). Thiết kế:
`docs/superpowers/specs/2026-11-08-od2-phim-va-loi-ghi-design.md`. Ba task đụng cùng hai tệp nên chạy tuần tự.

| # | Task | Files | Verify | Evals | independent |
|---|---|---|---|---|---|
| 1 | Xả khi gỡ/pagehide đi chung `gui()` (keepalive trên lệnh); bảng tình trạng lệnh; `onXep` nhận `tinhTrang`; `ReviewQueue` biết đã gỡ, «Mở thẻ» sau gỡ điều hướng (prop `moTheQuaUrl`), «Hoàn tác» nói đúng tình trạng | `app/src/components/ops/review/hang-gui.tsx`, `review-queue.tsx` | ca OPL-AC-1, OPL-AC-2 + ca OD2-AC-5 | E1, E2, E5 | false |
| 2 | Bỏ qua `keydown` lặp của `1`–`4` | `app/src/components/ops/review/use-phim-duyet.ts` | ca OPL-AC-3 + ca OD2-AC-4 | E3, E5 | false |
| 3 | Phím im khi có hộp thoại khác sheet duyệt | `app/src/components/ops/review/use-phim-duyet.ts` | ca OPL-AC-4 + ca OD2-AC-4 | E4, E5 | false |
| 4 | Bộ thử `app/tests/ops-duyet-phim-va-loi-ghi.test.tsx`, mỗi ca có chiều đỏ trên bản chép nguồn | `app/tests/ops-duyet-phim-va-loi-ghi.test.tsx` | `node --import tsx --test` tệp đó + tệp OD2 | E1–E5 | false |

Giữ nguyên mọi chuỗi mã nguồn mà ca đột biến OD2 thay (`const res = await guiQuyet(lenh)`, `const hen = setTimeout(...)`,
dòng `pagehide`, `if (!hoanTac()) return baoTin(`, các dòng của `usePhimDuyet`/`bamDapAn`).
