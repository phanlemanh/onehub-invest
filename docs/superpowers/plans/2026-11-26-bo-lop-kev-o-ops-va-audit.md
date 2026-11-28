# Kế hoạch KEV2 — gỡ lớp Kev ở trang Thu thập và audit-all

Hồ sơ `_acceptance/bo-lop-kev-o-ops-va-audit/` (T3, Cổng Phạm vi Mạnh duyệt 26/11). Tuần tự, một nhánh.

| # | Việc | Tệp | Kiểm từng việc | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | Test viết trước (đỏ trên mã hiện tại): `app/tests/kev2-thu-thap.test.tsx` — khối khoá an toàn bảy dòng + fetch giả (đối chứng :9210), lưới máy móc không kev, cloud đọc bản tin cũ sinh bằng push-ops-facts ở 04b9ddc3b, chữ khung đường ống/chú thích, phễu trên nhật ký dựng từ khuôn log của handler.js; `scripts/kev2-ops-local.test.mjs` — readLockdown bảy dòng khớp app, bản tin push-ops-facts không Kev + parseLog khớp readGateFunnel, khối F của audit-all với curl giả, quét chuỗi Kev ≥ 9 tệp; mỗi ca có bản sao phá ghim thông điệp | hai tệp test mới | ca mới đỏ trên mã cũ | E1–E9 | false |
| 2 | Khối khoá an toàn: bỏ dòng Kev khỏi `LOCKDOWN_LAYERS`, bỏ lời dò :8009 và trường `kevUp` (app); bản `.mjs` bên ghi đổi theo | `app/src/lib/ops-queries.ts`, `scripts/lib/ops-local.mjs`, `app/src/components/ops/collections/collections-content.tsx` | E1, E2 xanh | E1, E2 | false |
| 3 | Lưới máy móc + phễu máy thu: bỏ hàng `kev`; `readGateFunnel` bỏ dòng `kev null` | `app/src/lib/collections-queries.ts` | E3, E7 xanh | E3, E7 | false |
| 4 | Bản tin đẩy lên: bỏ hàng `kev`; `parseLog` bỏ dòng `kev null` | `pipeline/push-ops-facts.mjs` | E4 xanh | E4 | false |
| 5 | Máy chủ: `GATE_LAYER` chỉ còn cổng nhận tin; lọc hàng `kev` và lớp «Cổng Kev :8009» khỏi bản tin cũ ở chỗ đọc | `app/src/lib/ops-cloud.ts` (+ chỗ đọc lockdown/jobs của bản tin trong `collections-queries.ts`) | E5 xanh | E5 | false |
| 6 | Chữ UI: «Hook Zalo … đẩy vào cổng nhận tin», chú thích bảng nhóm | `app/src/components/ops/collections/pipe-panels.tsx`, `app/src/components/ops/collections-tables.tsx` | E6 xanh; luật ReUI tự kiểm trên hai tệp | E6 | false |
| 7 | audit-all mục F chỉ dò :9210 | `scripts/audit-all.sh` | E8 xanh | E8 | false |
| 8 | Sửa test cũ ghim tám dòng/hàng Kev: ma trận còn bảy lớp, bỏ fixture `kevUp`, danh sách id job | `app/tests/lockdown-cloud-theo-facts.test.tsx`, `ops-mobile-cot-trang-thai.test.tsx`, các fixture `kevUp`, `pipeline/scripts/ops-nhan-ma-nguon.test.mjs` | các tệp ấy xanh; E9 xanh | E5, E9 | false |

Không làm ở vòng này: `docs/ops/runtime-map.md` (sửa sau khi KEV1 của làn thu gộp — GS phán 26/11), hook Zalo, watchdog.

Chạy thử: không chạy suite nặng trên Mac mini — kiểm từng việc bằng chính các tệp test của hồ sơ (một tệp `node --test`, test app chạy qua `db/db-thu.sh` chỉ khi giữ khoá); trước S4 tự soát trên M5 (`soat-m5`).
