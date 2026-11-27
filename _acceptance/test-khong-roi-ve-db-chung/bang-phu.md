# Bảng phủ HT35 — tệp test có khuôn `DATABASE_URL ??|| …`, đếm từ kho @1a2cb6a43

Lệnh đếm: `python3` quét `git ls-files` các tệp `*.test.*`/`*.itest.*` có `DATABASE_URL ?? | ||` kèm chuỗi mặc định; cột theo grep trên nội dung tệp:
«DB chung» = chuỗi mặc định kết thúc `/oneinvest`; «ghi» = có `CREATE|ALTER|DROP|TRUNCATE` hoặc `INSERT INTO|UPDATE … SET|DELETE FROM`;
«spawn» = gọi tiến trình con (URL chảy sang script con); «rào» = tệp đã nhắc `oneinvest_suite_` (rào một phần hay toàn phần). Ai đọc đầu ra này phía sau: S1 của HT36.

Tổng: 70 tệp có khuôn; 66 tệp rơi về DB chung; trong đó 62 không rào.

| Tệp | Gói | Ghi | Spawn | Rào sẵn | Ô của HT35 |
|---|---|---|---|---|---|
| `agent/probes/context-resolver-that.test.ts` | agent | không |  |  | ngoài phạm vi, vì chỉ đọc |
| `agent/probes/judge-luat-that.test.ts` | agent | không |  |  | ngoài phạm vi, vì chỉ đọc |
| `agent/probes/o-duong-that.test.ts` | agent | không |  |  | ngoài phạm vi, vì chỉ đọc |
| `agent/tests/cham-bong-bo-sung-tin.test.ts` | agent | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `agent/tests/doc-gop-hang-ngay.test.ts` | agent | có | có |  | để lại cho HT36 — có ghi, chưa rào |
| `agent/tests/doc-gop-s03-db.itest.ts` | agent | có |  | có | ngoài phạm vi, vì đã có rào (HT36 soát lại độ đủ) |
| `agent/tests/doc-gop-song-song.test.ts` | agent | có | có |  | để lại cho HT36 — có ghi, chưa rào |
| `agent/tests/enrich-revert.test.ts` | agent | có | có |  | để lại cho HT36 — có ghi, chưa rào |
| `agent/tests/goi-thang-anthropic.test.ts` | agent | có | có |  | để lại cho HT36 — có ghi, chưa rào |
| `agent/tests/nhan-bac-s03-db.itest.ts` | agent | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `agent/tests/vlm-anh-s03-db.itest.ts` | agent | có | có |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/anh-chup.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/can-gia-tot-biet-can.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/can-gia-tot-doi-chieu.test.tsx` | app | không |  |  | ngoài phạm vi, vì chỉ đọc |
| `app/tests/deals-phi-ly-do.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/deals-phi-ly.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/dq-moi-nhat.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/enrich-nguoi-s03.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/finder-ranh-gioi.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/gio-ops-gio-vn.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/hieu-chuan.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/ops-cloud-khong-bang-nap.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/ops-nhan-theo-context.test.tsx` | app | không |  |  | ngoài phạm vi, vì chỉ đọc |
| `app/tests/ops-review-sources-cloud.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/sellers-chip.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/slo-mot-nguon.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/so-ghep-nhan.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/tin-rao-cong-khai.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/tin-rao-doi-chieu.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `app/tests/ty-le-listing-gop.test.tsx` | app | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/import-s09-danh-ba.test.mjs` | pipeline | có | có | có | **trong phạm vi** — tự dựng bảng thật rồi ghi |
| `pipeline/lib/s16-soat.test.mjs` | pipeline | không |  |  | ngoài phạm vi, vì chỉ đọc |
| `pipeline/scripts/bait-gap-sellers.test.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/can-theo-tin.itest.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/chotot-thieu-moc.test.mjs` | pipeline | có | có |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/dau-bai-thu-sql.test.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/deals-phi-ly.test.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/gan-sdt-s06.test.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/gop-trung-s03.itest.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/importer-schema-v5.test.mjs` | pipeline | không |  |  | ngoài phạm vi, vì chỉ đọc |
| `pipeline/scripts/kiem-do-sau-070.test.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/label-ghep.test.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/luoc-do-rieng.test.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/nap-dvhc-cu.test.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/nap-dvhc.test.mjs` | pipeline | có | có |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/nap-lai-ba-luot-fk.test.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/nap-lai-db.itest.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/phat-bieu-chung-bai.itest.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/phat-bieu-db.itest.mjs` | pipeline | có | có |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/reassign-areas.test.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/s07-danh-muc-db.test.mjs` | pipeline | có | có |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/s10-bang-hang.test.mjs` | pipeline | có | có |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/so-ghep-s06.test.mjs` | pipeline | có | có |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/test-posts.test.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/thu-so-s06-viec.test.mjs` | pipeline | có | có |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/tin-rao-gan-khu-vuc.test.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/transform-zalo-loai-tin-doi-chieu.test.mjs` | pipeline | có | có |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/vn-day.test.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/vocab-db.itest.mjs` | pipeline | có | có |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/scripts/write-offers.test.mjs` | pipeline | có |  |  | để lại cho HT36 — có ghi, chưa rào |
| `pipeline/sync-pii.test.mjs` | pipeline | không |  |  | ngoài phạm vi, vì chỉ đọc (soi tay: một SELECT / giao dịch read-only) |
| `scripts/bao-cao-ngay.test.mjs` | scripts | không |  |  | ngoài phạm vi, vì chỉ đọc (soi tay: một SELECT / giao dịch read-only) |
| `scripts/check-freshness.test.mjs` | scripts | có | có |  | **trong phạm vi** — tự dựng bảng thật rồi ghi |
| `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs` | scripts | có | có | có | ngoài phạm vi, vì đã có rào (HT36 soát lại độ đủ) |
| `scripts/phuong-tu-du-an-chuoi.test.mjs` | scripts | có | có |  | để lại cho HT36 — có ghi, chưa rào |
| `scripts/so-nguon-kho.test.mjs` | scripts | có |  | có | ngoài phạm vi, vì đã có rào (HT36 soát lại độ đủ) |

Tệp có khuôn nhưng mặc định KHÔNG phải DB chung (4): `pipeline/scripts/dac-trung-s06.itest.mjs`, `pipeline/scripts/s06-duong.itest.mjs`, `pipeline/scripts/sdt-trong-duong.itest.mjs`, `scripts/db-thu.test.mjs` — ngoài phạm vi, vì không rơi về DB chung.

Làn thu: không tệp nào trong danh sách thuộc làn thu (`collect-*`, `import-*`, `apify-*`, `collector/`) ngoài `pipeline/import-s09-danh-ba.test.mjs`, tệp zk đã vá (nhánh `zcode/zk-s09-test-chong-db-chung` @3cb318df3).
