# Soát test chạm tiến trình, khoá, launchd thật của máy (HT46, 28/11 trên 2beb7d6ba)

Rút danh sách: mọi tệp git-theo-dõi trong `scripts/**`, `pipeline/**` (đuôi `.sh .mjs .js .cjs .ts`) có `pgrep`, `pidof`, hay
`launchctl list|print`. Probe `probes/soat.mjs` rút lại đúng danh sách ấy ở mỗi lượt chấm và đòi mỗi tệp một dòng dưới đây.
Soát khoá/pid (`*.lock`, `kill -0`): đọc theo từng test gọi script có khoá, ghi cùng dòng của script.

| Tệp | Test nào chạy nó | Trạng thái máy nó đọc | Cách ly trong test | Kết luận |
|---|---|---|---|---|
| `pipeline/scripts/thu-duoi-chon-nap-e2e.test.mjs` | chính nó (hai ca) | `pgrep -f "scripts/chotot-daily.sh"` của wrapper; khoá ở gốc tạm | chưa có trên 2beb7d6ba (PATH thật) | sửa trong hàng: shim `pgrep` đầu PATH |
| `pipeline/scripts/thu-duoi-nhuong-luot.test.mjs` | chính nó (tệp mới) | tiến trình do chính test dựng; khoá `$GOC.lock` của wrapper | tiến trình riêng, giết trong finally; wrapper chép vào cây tạm, `THU_DUOI_S06_GOC` và `HOME` tạm | tệp mới của hàng |
| `scripts/thu-duoi-s06.sh` | `scripts/thu-duoi-s06.test.mjs`, ca e2e, tệp mới | `pgrep -f "scripts/chotot-daily.sh"`; `$GOC.lock`, `kill -0` pid trong khoá | gốc theo `THU_DUOI_S06_GOC` | không sửa (hành vi chạy thật); mẫu khớp cả tiến trình lạ → ngoài phạm vi |
| `scripts/thu-duoi-s06.test.mjs` | chính nó | `pgrep` | shim `pgrep` đầu PATH (ZC18) | an toàn |
| `pipeline/scripts/capture-ops-facts.mjs` | `pipeline/scripts/ops-facts-so-tong-hop.test.mjs` | `launchctl list`, `HOME`, `/tmp/openclaw`; `readLockdown` gọi `pgrep -f openclaw` | launchctl, HOME, log giả ở các ca thường; ca ON22-AC-10 đọc máy thật có chủ ý | an toàn ở ca thường (cờ pgrep không bị assert); ON22-AC-10 cố ý, đã ở `scripts/ci-bo-qua.json` → ngoài phạm vi |
| `scripts/lib/ops-local.mjs` | qua `capture-ops-facts.mjs` như trên | `pgrep -f openclaw`, cổng 8009/9210 | không shim pgrep; không ca nào assert cờ ấy | an toàn (chưa chắc tuyệt đối — kết quả không đổi assert) |
| `pipeline/scripts/thu-so-s06-e2e.itest.mjs` | chính nó (itest, chạy tay) | `pgrep -f <thư mục profile tạm>` | đường tạm riêng mỗi lượt | an toàn |
| `scripts/audit-all.sh` | `scripts/audit-all.test.mjs` | `launchctl list` | stub đọc fixture | an toàn |
| `scripts/audit-all.test.mjs` | chính nó | — (dựng stub launchctl) | stub | an toàn |
| `scripts/install-cron.sh` | `scripts/install-cron-chi.test.mjs` | `launchctl` | stub + HOME tạm | an toàn |
| `scripts/zalo-import-daily.sh` | các test `zalo-import-*` | `pipeline/logs/apify-daily.state.lock`, `kill -0`, `pgrep -P` | script chép sang cây tạm (khoá tạm); `pgrep -P` chỉ xem tiến trình con của chính nó | an toàn |
| `scripts/zalo-watchdog.sh` | không test `*.test.mjs` nào chạy | `pgrep -f openclaw` | — | không có test → ngoài phạm vi |
| `scripts/db-chuyen-volume.sh` | không test nào chạy | `pgrep -fl` | — | không có test → ngoài phạm vi |
| `scripts/check-db-autostart.sh` | không test nào chạy | `launchctl list` (chế độ thật) | — | không có test → ngoài phạm vi |
| `scripts/install-airbnb-cron.sh` | không test nào chạy | `launchctl` | — | không có test → ngoài phạm vi |
| `scripts/install-airdna-daily.sh` | không test nào chạy | `launchctl` | — | không có test → ngoài phạm vi |
| `scripts/install-chotot-daily.sh` | không test nào chạy | `launchctl` | — | không có test → ngoài phạm vi |
| `scripts/audit-p1-resilience/acceptance.mjs` | không phải test (`acceptance.mjs`) | `launchctl`/`pgrep` có stub riêng | — | không phải test → ngoài phạm vi |
| `scripts/canh-bao-s03-ngung-thu/acceptance.mjs` | không phải test | như trên | — | không phải test → ngoài phạm vi |
| `scripts/watchdog-l4b-cuoi-ngay/acceptance.mjs` | không phải test | như trên | — | không phải test → ngoài phạm vi |
| `scripts/watchdog-l4b-history/acceptance.mjs` | không phải test | như trên | — | không phải test → ngoài phạm vi |
| `scripts/watchdog-l4d-agentdb/acceptance.mjs` | không phải test | như trên | — | không phải test → ngoài phạm vi |

Khoá/pid khác đã soát (không có `pgrep`): `scripts/s05-khoa-nap.test.mjs`, `scripts/job-exit.test.mjs` (`apify-daily.state.lock`,
`kill -0`) và `scripts/cloud-sync-do.test.mjs` (`cloud-sync-do.lock`) chạy script trên bản chép tạm → an toàn.
`scripts/suite-neu-doi.mjs` dùng `process.kill(pid, 0)` chỉ để dọn DB CI sót, không quyết pass/fail.
