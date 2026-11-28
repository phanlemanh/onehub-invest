# Kế hoạch thi công HT46 — thu-duoi-nhuong-luot-khong-dung-may-that

Hồ sơ: `_acceptance/thu-duoi-nhuong-luot-khong-dung-may-that/` (T2). Design: `docs/superpowers/specs/2026-11-28-thu-duoi-nhuong-luot-khong-dung-may-that-design.md`.
Chỉ chạy sau khi Mạnh duyệt Cổng Phạm vi. Mọi lệnh kit chạy đường 2.37.0 tường minh (nợ HT41).

| # | Việc | Tệp | Kiểm từng bước | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | Hai ca e2e đặt shim `pgrep` (thoát 1) lên đầu `PATH` của wrapper | `pipeline/scripts/thu-duoi-chon-nap-e2e.test.mjs` | probe `e2e-khi-quet-du-song.mjs` trên db-thu → `E2E-CACH-LY OK` | AC-1 | false |
| 2 | Tệp test mới: tiến trình thật khớp mẫu + `pgrep` thật → nhường lượt, 0 lời gọi node; nhận `THU_DUOI_NHUONG_WRAPPER` | `pipeline/scripts/thu-duoi-nhuong-luot.test.mjs` | `node --test pipeline/scripts/thu-duoi-nhuong-luot.test.mjs`; `node _acceptance/<slug>/probes/dot-bien-nhuong.mjs` → `DOT-BIEN-NHUONG OK` | AC-2, AC-3 | false |
| 3 | Phạm vi, soát, phép đo ZC18 | — | `pham-vi.mjs` → `PHAM-VI OK`; `soat.mjs` → `SOAT OK`; `s06tl_test` xanh | AC-4–AC-6 | false |

Tuần tự (hai tệp test cùng một phép đo). S4 xin khoá s4 trên Mac mini khi GS gọi (xếp sau DA56, DA3).
