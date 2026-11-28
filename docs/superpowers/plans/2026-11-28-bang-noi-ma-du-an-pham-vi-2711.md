# DA3 bang-noi-ma-du-an — kế hoạch thi công bản phạm vi 27/11

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Thay phần còn dở của kế hoạch 25/11 (`2026-11-25-bang-noi-ma-du-an.md`). Mã của kế hoạch 25/11 đã xong ở S3 trên nhánh: bộ chuyển,
bộ khớp, lệnh thẻ/áp/đảo, ô trên màn, probe. Kế hoạch này chỉ ĐỔI mã ấy theo phạm vi 27/11, Mạnh duyệt 28/11 (sổ
d-20261128T003900Z-45..48).

**Goal:**
- S09 rút khỏi đường ghi, ba đường ghi bị chặn.
- Thẻ tách mẫu theo hạng và nguồn đúc của nút đích; K2 có ô biên ngưỡng.
- Ô S09 đọc tập DA42 và thêm một dòng riêng cho tập cũ.
- Hồ sơ áp viết lại đủ năm thứ, có cách lùi đã chạy thử.
- Số trên màn đo lại trên dữ liệu thật.

**Spec:** `_acceptance/bang-noi-ma-du-an/contract.md` (duyệt 28/11) · `evals.yaml` · thiết kế
`docs/superpowers/specs/2026-11-25-bang-noi-ma-du-an-design.md` (đầu đề bản 27/11) · số đo `evidence/bang-phu-s1.md` §8.

## Global Constraints

- Ràng buộc của kế hoạch 25/11 giữ nguyên: không migration; test ghi DB chỉ trên `oneinvest_suite_*`; chỉ mã `S0x`; thẻ không in
  mã dự án nguồn; tệp test mới xếp vào `pipeline/test-nua.json`.
- Đổi theo phạm vi 27/11:
  - S08 và S09 không bao giờ được áp. Thông điệp: `S08 do thẻ luật DA55 nối` và `S09 do DA42 nối`.
  - Tên luật có thêm `<nguồn>-K2`. Ngưỡng K2 300 m (`K2_M` trong `pipeline/lib/khop-du-an.mjs`), không đổi.
  - DA3 không ghi, không sửa dòng nào của `project_links` nguồn S08, S09 và không đổi `asset_nodes.catalog_tier`.
- Không viết mã trước khi Mạnh duyệt kế hoạch này (Gate 1.5, T3).
- Eval chạy `pipeline_that` thì khai `long_running: 90` (CHUNG.md điểm 16). Hôm nay không eval nào của hồ sơ gọi `pipeline_that`.
  E11 và E12 chạy `pipeline_a`, `pipeline_b` và đã khai 90. Task nào thêm lệnh `pipeline_that` thì khai cùng lúc.
- Probe không ghi vào cây `_acceptance/bang-noi-ma-du-an/` khi chạy. Tạo phẩm ra `.acceptance-runs/bang-noi-ma-du-an/`, chỉ chép vào
  `evidence/` khi nội dung khác (bài học PL36 27/11).
- Worktree đủ năm `node_modules` (app, pipeline, agent, data-api, collector; CHUNG.md điểm 15). Đã kiểm 27/11.

## Review Focus

1. Lệnh áp bằng băm (`--ap --bam`) không mang cờ nguồn. Kỳ vọng: lệnh đọc nguồn từ chính thẻ dựng lại và từ chối S09. Test ở Task 1.
2. Bản ghi S07 trùng tên một nút ứng viên S09 (tập DA42, nút không có điểm). Kỳ vọng: vẫn xếp theo luật chung. Đo 27/11 ra 0 bản ghi
   trúng nút S09; mẫu thẻ có ô «ứng viên S09» khi có. Test ở Task 2.
3. Mã S09 có ở cả hai tập. Kỳ vọng: đếm một lần, theo tập DA42. Mã chỉ có ở tập cũ vào dòng riêng, không cộng vào ô. Test ở Task 4.
4. `oSo` của `registry-view.tsx` là hàm cộng duy nhất. Kỳ vọng: probe E9 import nó, không chép phép cộng. Test ở Task 5.

---

### Task 0: Nhận main mới nhất — `independent: false` · trước mọi task mã

**Files:** không sửa tệp; gộp `origin/main` (GS báo 28/11: c60c50f74).

- [ ] `git fetch origin main`, gộp `origin/main` một lần. Xung đột ở tệp của hàng khác thì lấy bản main; ở tệp DA3 thì áp lại riêng
      diff DA3 (cách làm 27/11).
- [ ] Chạy `cd pipeline && node --test scripts/chia-nua.test.mjs` và `node --test scripts/suite-neu-doi.test.mjs`; `cd app && npx tsc --noEmit`.
- [ ] Main có hàng nào đổi danh bạ dự án (`asset_nodes` dự án, `project_links`) thì chạy lại bộ đo S1 chỉ đọc. Số lệch §8 thì ghi
      §9 của bảng phủ kèm lý do. Không sửa kỳ vọng khi chưa hiểu vì sao lệch.

### Task 1: S09 rút khỏi đường ghi — `independent: true` · phục vụ E4, E6 (AC-4, AC-6)

**Files:** `pipeline/noi-du-an-nguon.mjs` · `pipeline/tests/noi-du-an-nguon.itest.mjs`.

- [ ] Viết test đỏ trước, ba ca. Mỗi ca thoát khác 0 với lời `S09 do DA42 nối`, và đếm bốn bảng cùng băm có sắp xếp của
      `project_links` S09 không đổi:
      - `--the --nguon S09`;
      - `apThe({ nguon: "S09", … })`;
      - `--ap --bam <băm thẻ S09 dựng bằng dungThe trong test>`.
- [ ] Đối chứng dương: thẻ S07, cùng đường `--ap --bam`, ghi đúng như E4.
- [ ] Thay `NGUON_DA55` bằng bảng `NGUON_KHONG_AP = { S08: "S08 do thẻ luật DA55 nối", S09: "S09 do DA42 nối" }`.
- [ ] Đặt chặn ở ba chỗ:
      - `dungThe` từ chối S09; S08 vẫn dựng thẻ bóng;
      - `apThe` từ chối theo nguồn của thẻ dựng lại, không theo cờ;
      - nhánh `--ap` của CLI.
- [ ] Gỡ S09 khỏi phần nối sẵn của DA3 (`docNoiSan` không còn đọc `NOI_KHU_S09`). Cập nhật comment đầu tệp: DA3 ghi S07, S10, S16.

### Task 2: Thẻ tách mẫu theo hạng và nguồn đúc nút đích — `independent: false` (sau Task 1, cùng tệp) · phục vụ E3, E10 (AC-3)

**Files:** `pipeline/noi-du-an-nguon.mjs` (`dungThe`, `vietThe`, `docNut`) · `pipeline/scripts/noi-du-an-nguon-the.test.mjs` (mới, xếp
vào `test-nua.json`).

- [ ] `docNut` trả thêm `tier` (đã có) và `nguonDuc` (`meta->>'nguon'`; vắng → `S09` khi nút có `meta.s09_*`, còn lại `—`).
- [ ] Viết test trước: mẫu khoá theo `căn cứ|hạng|nguồn đúc`, mỗi ô có `min(20, số cặp)` mẫu, có số đếm của ô. Bảng thẻ in một dòng
      mỗi ô. Băm không đổi định nghĩa: chỉ phụ thuộc mã, kết cục, nút, căn cứ.
- [ ] Ba đột biến của E3, mỗi đột biến đổi băm tính lại: đổi kết cục, đổi nút đích, đổi căn cứ.
- [ ] Số kỳ vọng trên bản chép 27/11:

      | Căn cứ | Xác minh | Ứng viên S06 | Ứng viên S08 |
      |---|---|---|---|
      | K3 | 1 | 47 | 14 |
      | T | 11 | 198 | 65 |
      | K2 | — | — | 11 |

      Probe đếm độc lập bằng SQL, không lấy số này làm hằng.

### Task 3: K2 có ô biên ngưỡng — `independent: true` · phục vụ E2 (AC-2)

**Files:** `pipeline/scripts/khop-du-an.test.mjs` · `_acceptance/bang-noi-ma-du-an/probes/xep-nga.sh`.

- [ ] Thêm ô vào ma trận:
      - nút `mot_loi_khai` do S08 đúc, có điểm, cách 150 m, tên trùng → `noi:K2`;
      - cách 301 m và cách 350 m, khác xã → `chua_noi:khong-khop`;
      - cách 301 m, cùng xã → `noi:K3`.
- [ ] Probe thêm đột biến nâng `K2_M` lên 400. Ô 350 m phải đỏ, thông điệp ghim «300».
- [ ] Mã `khop-du-an.mjs` không đổi; task chỉ thêm phép đo.

### Task 4: Ô S09 theo tập DA42 và dòng tập cũ — `independent: true` · phục vụ E8 (AC-8)

**Files:** `app/src/lib/ops/registry/doc.ts` (`SQL_DANH_MUC`, kiểu dòng danh mục) ·
`app/src/components/ops/registry/registry-view.tsx` (`oSo`) · `app/tests/registry-nguon-chua-noi.test.tsx`.

- [ ] Viết test đỏ trước trên DB thử fixture, với bản ghi rút từ bản chép:
      - dòng S09 có đã nạp bằng số dự án của `v_s09_db_du_an` và đã nối bằng số mã có dòng `noi` ở `project_links` S09;
      - dòng «S09 · chưa có ở danh bạ S09 mới» bằng số mã chỉ có ở `v_s09_du_an_moi`, `tinhVaoO = false`;
      - mã có ở cả hai tập đếm một lần.
- [ ] `SQL_DANH_MUC`: S09 đổi nguồn từ `v_s09_du_an_moi` sang `v_s09_db_du_an`. Thêm nhánh tập cũ, trả `lyDoRieng`
      «chưa có ở danh bạ S09 mới». S06, S07, S08, S10, S16 giữ nguyên.
- [ ] `oSo` không đổi logic: cộng `tinhVaoO`, dòng riêng hiện kèm nhãn.
- [ ] Test jsdom dựng `registry-view` thật:
      - con số ô bằng tổng chưa nối của S06, S07, S08, S09, S16;
      - đột biến cộng S10 thì đỏ, ghim «S10»;
      - đột biến cộng dòng tập cũ thì đỏ, ghim «tap-cu».

### Task 5: Probe theo phạm vi mới — `independent: false` (cần Task 1–4) · phục vụ E1–E10

**Files:** `_acceptance/bang-noi-ma-du-an/probes/{the,ap,noi-san,ben-doc,o-man,dau-cuoi}.sh` · `app/probes/da3-dau-cuoi.test.tsx`.

- [ ] Sửa từng probe:
      - `the.sh` (E3): đếm theo ô căn cứ × hạng × nguồn đúc, có ba đột biến băm.
      - `ap.sh` (E4, E5): có `S07-K2`; băm `project_links` S08, S09 và `catalog_tier` bằng trước áp. Lùi theo đúng danh sách
        `rule_id` mà lệnh `--ap` in ra, không tự liệt luật từ DB.
      - `noi-san.sh` (E6): bỏ S09 chép cứng; thêm ba đường ghi S09 bị từ chối, đối chứng S07.
      - `ben-doc.sh` (E7): áp ba nguồn S07, S10, S16.
      - `o-man.sh` (E8): S09 theo tập DA42, dòng tập cũ.
      - `dau-cuoi.sh` (E9): chạy S07, S10, S16. K4 của bộ đo cộng vào «không khớp». Dòng `giu` so với ngả bóng. Ô tính bằng `oSo`
        import từ `registry-view.tsx`. Assert tổng ô trừ tổng dòng `docDanhBa` bằng −(S10 + S09 tập cũ).
- [ ] Mọi probe ghi tạm vào `mktemp` hoặc `.acceptance-runs/bang-noi-ma-du-an/`. Kiểm bằng `chup()`/`soChup()` của làn feature-loop:
      chạy từng probe, cây hồ sơ không bị chạm.

### Task 6: Hồ sơ áp viết lại đủ năm thứ, cách lùi chạy thử — `independent: false` (cần Task 1–5) · phục vụ việc áp

**Files:** `_acceptance/bang-noi-ma-du-an/ho-so-ap.md` (viết lại) · `_acceptance/bang-noi-ma-du-an/lui/chay-thu-lui.sh` (mới).

- [ ] Năm thứ:
      1. **Lệnh áp:** S07, S10, S16 theo băm thẻ đã ký; mỗi lệnh `--ap` in `rule_id`.
      2. **Số chạy thử:** đo CHỈ ĐỌC trên DB máy thu sau DA42, DA55 và PL36 đã áp. Gồm thẻ ba nguồn, bộ đo S1 và ô `docDanhBa`.
      3. **Sao lưu:** `pg_dump -Fc` trước áp, khác 0 byte, ghi số dòng bốn bảng.
      4. **Cách lùi:** `--dao` đủ danh sách `rule_id` đã in (K2, K3, T, noi-san, trang-thai), không xoá dòng; lối cuối là khôi phục bản
         sao lưu.
      5. **Lệnh kiểm sau:** bất biến AC-4 và AC-7; ô bằng số chạy thử.
- [ ] Cách lùi chạy thử TRƯỚC Cổng Bằng chứng (CHUNG.md điểm 13), trên DB thử chép từ DB máy thu (`db/db-thu.sh`), dưới khoá s4:
      - chụp trạng thái;
      - áp S07, S10, S16;
      - đảo đủ luật;
      - so bốn bảng, bí danh còn hiệu lực và ô với trước áp.
      Ghi lệnh và đầu ra vào mục 4, thêm một dòng sổ «chạy thử đường lùi <giờ> — đạt». Đỏ thì dừng, báo GS.

### Task 7: Đo lại số trên màn lúc S3 — `independent: false` (sau Task 0–6) · phục vụ AC-9

**Files:** `_acceptance/bang-noi-ma-du-an/evidence/bang-phu-s1.md` §9 · `decisions.jsonl`.

- [ ] Trên DB máy thu, chỉ đọc, bằng mã nhánh: ô theo `oSo` trên đầu ra `docDanhBa` ở hai cột:
      - đổi phạm vi: 27/11 là 6.169;
      - sau nối, chạy trên DB thử chép: 27/11 là 5.813.
- [ ] Lệch so với 27/11 thì ghi lý do (snapshot mới, hàng khác đổi danh bạ) vào §9 và một dòng sổ, rồi cập nhật số kỳ vọng của AC-9
      bằng một dòng sổ `revisit`. Không đổi lời AC.

## Thứ tự

Task 0 → (Task 1, Task 2, Task 3, Task 4 song song được: khác tệp, trừ Task 1 và Task 2 cùng `noi-du-an-nguon.mjs` — làm tuần tự
1 rồi 2) → Task 5 → Task 6 → Task 7 → S4.
