# Kế hoạch MH1 model-may-sang-haiku

Hợp đồng: `_acceptance/model-may-sang-haiku/contract.md` (Mạnh duyệt 21/11: Hỏi-1 trần 0,5 USD enrich, 1 USD judge; Hỏi-2 chạy lượt đo
thật; Hỏi-3 lượt 00:00 tự gọi Haiku sau gộp). Thiết kế: `docs/superpowers/specs/2026-11-21-model-may-sang-haiku-design.md`.
Mọi task phụ thuộc tuần tự (cùng runtime `agent/src/runtime/`) → `independent: false`, làm tuần tự trong vòng chính.

## T1 — Tệp cấu hình model và bộ nạp
- Files: `agent/config/model-agent.json` (mới), `agent/src/runtime/model-agent.ts` (mới), `agent/src/runtime/models.ts`.
- Bộ nạp đọc tệp, kiểm `phien_ban`, mã model thuộc `MODEL_DUYET`, giá không âm, mỗi agent có khoá model, `tran_usd` của agent; lỗi → `LoiCauHinhModel` gọi tên ca.
  Hàm `modelCuaAgent(ten)` trả mã Gateway, giá, trần mặc định; `chiPhiUsd(gia, vao, ra)`; bộ đếm trần `taoTran(tranUsd, gia)`.
- `models.ts`: bỏ `qwen27b`, `qwen27b-khong-nghi`, `MTPLX_URL`, `createOpenAI` cho MTPLX.
- Verify: `cd agent && npx tsc --noEmit`. Phục vụ E2.
- independent: false

## T2 — runAgent lấy model từ cấu hình, gửi cờ Gateway, trả token
- Files: `agent/src/runtime/loop.ts`, `agent/src/agents/enrich-text.ts`, `agent/src/agents/judge-entity.ts`, `agent/scripts/smoke.ts`.
- `AgentConfig` bỏ trường `model`; `runAgent` dùng `deps.model` (test) hoặc `modelCuaAgent(config.name)`; gửi `providerOptions: tuyChonGui(mã)`;
  `qwenParams` → `modelParams`; `LoopResult` thêm `model` và `usage`. Agent `smoke` có khoá trong tệp cấu hình.
- Verify: tsc + `node --import tsx --test tests/model-agent.test.ts`. Phục vụ E1, E2, E3.
- independent: false

## T3 — Trần tiền cho enrich-run và judge-run
- Files: `agent/scripts/enrich-run.ts`, `agent/src/enrich/run.ts`, `agent/src/enrich/tong-ket.ts`, `agent/scripts/judge-run.ts`.
- Cờ `--tran-usd` (mặc định từ `tran_usd` của tệp cấu hình); trước mỗi lời gọi `tran.coTheGoi(input)` (đã chi + ước tối đa của lời kế ≤ trần);
  không được thì dừng vòng, `hetTran` → mã thoát 4, dòng tổng kết «hết trần: đã chi X USD / trần Y USD».
- Verify: `bash db/db-thu.sh oneinvest_suite_mh1t --chay node --import tsx --test --test-concurrency=1 agent/tests/tran-tien-agent.itest.ts`. Phục vụ E5, E10.
- independent: false

## T4 — Gỡ backend qwen khỏi nhãn bạc, đọc ảnh; kiemLoThat
- Files: `agent/src/agents/nhan-bac-s03.ts`, `agent/src/agents/vlm-anh-s03.ts`, `agent/scripts/nhan-bac-run.ts`, `agent/scripts/vlm-anh-run.ts`,
  `pipeline/lib/vlm-anh.mjs`, test cũ nhắc qwen (`agent/tests/nhan-bac-s03*.ts`, `agent/tests/vlm-anh-s03-db.itest.ts`, `agent/tests/enrich-cli.itest.ts`,
  `pipeline/tests/vlm-anh.test.mjs`) và test dùng `model: "qwen27b"` làm nhãn.
- CLI `--model qwen` → mã 2, «model không được duyệt». `kiemLoThat` đòi ≥ 1 dòng tốt của bất kỳ model nào.
- Verify: `cd agent && npm test` trên DB thử; `node --test pipeline/tests/vlm-anh.test.mjs`. Phục vụ E6, E7.
- independent: false

## T5 — Test và probe của hồ sơ
- Files: `agent/tests/model-agent.test.ts`, `agent/tests/tran-tien-agent.itest.ts`, `agent/tests/du-lieu-gui-agent.itest.ts`,
  `_acceptance/model-may-sang-haiku/probes/khong-goi-8000.mjs`, `_acceptance/model-may-sang-haiku/probes/do-truoc-sau.mjs`.
- Mỗi phép đo mới có cặp hai chiều trên cùng fixture (MEASURE-BIRTH-CLAUSE): vật lành xanh, phá trong bản sao đỏ với thông điệp ghim.
- Phục vụ E1–E6, E8, E10.
- independent: false

## T6 — Lượt đo thật AC-8 (Hỏi-2 đã duyệt)
- `node _acceptance/model-may-sang-haiku/probes/do-truoc-sau.mjs --chon-mau` (ghi `mau-enrich.json`, `mau-judge.json`), rồi `--chay --tran-usd 1`
  trên DB máy thu, phiên READ ONLY; báo GS số thật. Phục vụ E8.
- independent: false

## T7 — Tài liệu
- Files: `agent/CLAUDE.md` (bỏ «Local-first Qwen», ghi model theo `agent/config/model-agent.json`), ROADMAP §2 as-built khi xong.
- independent: false
