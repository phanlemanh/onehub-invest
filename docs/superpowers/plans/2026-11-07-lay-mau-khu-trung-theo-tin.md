# Lấy mẫu khử trùng theo tin — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps dùng checkbox (`- [ ]`).

**Goal:** sampler và `label-ghep` khử trùng theo tin của pipeline rồi theo chữ đã gạt URL; gạt sự kiện JSON và bài thử «noi-dung»; `label-ghep --lam-lai` không xoá dấu ẩn tay.

**Architecture:** ba hàm thuần mới ở `pipeline/lib/eval-labels.mjs` (`chuGatUrl`, `khoaTrung`, `laSuKien`) là chỗ duy nhất định nghĩa khoá trùng. `chonMau`/`chonMauTheoNhom`/`chonMauPhanTang` khử theo khoá này. Một hàm thuần mới `nhomTrung` ở `lib/ghep-mau.mjs` chạy sau `ghepChoMau` trong `ghepLat`. Dấu bài thử mới nằm trong `lib/test-posts.mjs`, nên transform S03 tự nhận qua `loadStgPosts`.

**Tech Stack:** Node `.mjs`, `node:test`, pg; DB thử `oneinvest_gn2` qua `db/db-thu.sh`.

**Spec:** `docs/superpowers/specs/2026-11-07-lay-mau-khu-trung-theo-tin-design.md` · hợp đồng `_acceptance/lay-mau-khu-trung-theo-tin/contract.md` · evals `evals.yaml`.

## Global Constraints

- Quyết ở Cổng Phạm vi (sổ gate1):
  - Hỏi-1: nhận 48 thẻ ẩn trên lát thật.
  - Hỏi-2: dấu `noi-dung` (link `trycloudflare.com` hoặc chuỗi «[Tên sàn]») đặt ở `lib/test-posts.mjs`, transform và sampler cùng gạt. KHÔNG thêm dấu nhóm toàn chữ số.
  - Hỏi-3: chỉ chạy trên DB thử; không ghi DB máy thu.
- Tệp được đổi: chỉ danh sách AC-8 (`pipeline/lib/eval-labels.mjs`, `label-sample.mjs`, `label-ghep.mjs`, `lib/ghep-mau.mjs`, `lib/test-posts.mjs`, `lib/*.test.mjs`, `scripts/*.test.mjs`, `pipeline/CLAUDE.md`, `_acceptance/…`, `docs/**`, bản đồ). Không `app/`, không `collector/`, không `db/migrations/`.
- `textHash` vẫn ghi vào `eval_label_items.text_hash`; bên đọc ở app (`trung_voi IS NULL`) và `eval-classify` không đổi.
- Mỗi phép đo mới có cặp chiều đỏ, thông điệp ghim đúng chuỗi trong `evals.yaml`.
- Probe chỉ in mã thẻ, khoá và số, không in chữ bài. Bài giả không mang tên nguồn thật.

## Review Focus

1. Hai khoá khác nhau nhưng cùng `text_hash` (cùng chữ, hai tin): khoá UNIQUE `(lat, text_hash)` của `eval_label_items` sẽ nuốt một bài. Sampler phải giữ một thẻ mỗi `text_hash` trong cùng lát (đếm vào `bo_vi_trung`) — ca có test ở Task 1.
2. Dấu ẩn tay trỏ tới thẻ mà luật mới chọn khác: thẻ giữ ưu tiên thẻ đang được dấu ẩn tay trỏ tới (bậc 2) — ca A→B, C ở Task 4.
3. Thẻ không có cụm ảnh (ghep null) bị ẩn mới: ghi object đủ khoá mà `docGhep` của app đọc được (`anh_refs: []`, `chu_ref` = chính bài) — Task 4.
4. Chữ mở đầu «[» thật (tin rao) không bị coi là sự kiện — Task 1.
5. `--lam-lai` chạy hai lần không đổi dòng — Task 4, Task 5.

---

### Task 1: khoá trùng, sự kiện, sampler thuần — phục vụ E1, E3 · `independent: false`

**Files:** Modify `pipeline/lib/eval-labels.mjs` · Test `pipeline/lib/eval-labels.test.mjs`.

**Interfaces — Produces:**
- `chuGatUrl(text: string): string` = `normText(text.replace(/https?:\/\/\S+/gi, " "))`.
- `khoaTrung(bai: {post_id, text}, tinCua: Map<string,string>): string|null`: `o:<offer_id>` khi `tinCua.get(post_id)`; ngược lại `c:<chuGatUrl>` khi khác rỗng; không thì `null`.
- `laSuKien(text): boolean`: trim mở đầu `[` hoặc `{`, `JSON.parse` được, và kết quả là object, hoặc mảng không rỗng toàn object.
- `chonMau(posts, { n, seed, tiLeTrung, tinCua = new Map() })` trả thêm `bo_su_kien`, `bo_vi_trung`. Khử theo `khoaTrung` (null → `p:<post_id>`), giữ `post_id` nhỏ nhất. Sau đó giữ một đại diện mỗi `text_hash` (`bo_vi_trung` đếm mọi bài bị bỏ). Sắp, chọn trùng, chia dev/test theo băm `(seed, nhãn, khoá)`.
- `chonMauTheoNhom(posts, { …, tinCua })`: `daDung` theo khoá. `moiNhom[].bo_vi_trung` giữ nghĩa cũ; tổng thêm `bo_su_kien`.

- [ ] Viết test `GN2-AC-1`: ma trận 7 dòng của E1 (deepEqual khoá từng bài), cộng `chuGatUrl` so với `normText`. Bốn bản đột biến bằng chép tệp tạm, mỗi bản ghim một thông điệp: `CUNG CHU KHAC LINK BI TACH`, `CUNG TIN KHAC CHU BI TACH`, `HAI TIN KHAC BI GOP`, `CHU RONG CO KHOA`.
- [ ] Viết test `GN2-AC-3`: `laSuKien` trên 8 dòng ra `[true,true,true,false,false,false,false,false]`. `chonMau` trên tập có hai sự kiện: không ref sự kiện nào được chọn, `bo_su_kien = 2`. Hai đột biến: `NGOAC VUONG KHONG PHAI SU KIEN`, `SU KIEN VAO MAU`.
- [ ] Chạy `cd pipeline && node --test lib/eval-labels.test.mjs` → đỏ. Cài đặt. Chạy lại → xanh, kể cả các test cũ của tệp.
- [ ] Commit `feat(labels): khoá trùng theo tin và chữ đã gạt URL, gạt sự kiện JSON khi lấy mẫu`.

### Task 2: dấu bài thử `noi-dung` — phục vụ E4, E5 · `independent: true`

**Files:** Modify `pipeline/lib/test-posts.mjs` · Test mới `pipeline/lib/test-posts.test.mjs`.

**Interfaces — Produces:** `TEST_MARKERS = ["snapshot-source","agent","group","noi-dung"]`. `testMarker(row)` xét `row.text` sau ba dấu cũ: `/trycloudflare\.com/i` hoặc chuỗi `[Tên sàn]` (không phân biệt hoa thường) → `"noi-dung"`.

- [ ] Test `GN2-AC-4`: bảng ≥ 10 dòng theo E4. Nhánh nhóm toàn chữ số đọc dòng gate1 «Hỏi-2» mới nhất trong `decisions.jsonl`; câu đó không chọn nhóm toàn chữ số nên mong đợi `null`. Hai đột biến: `NHOM CO SO BI GAT`, `BAI THU NOI DUNG LOT`.
- [ ] Chạy đỏ → cài đặt → xanh. Chạy `node --test scripts/test-posts.test.mjs` (test cũ) vẫn xanh.
- [ ] Commit `feat(pipeline): dấu bài thử noi-dung (trycloudflare, «[Tên sàn]») cho transform và lấy mẫu`.

### Task 3: `label-sample` dùng khoá và sổ tin — phục vụ E2 · `independent: false` (cần Task 1, 2)

**Files:** Modify `pipeline/label-sample.mjs` · Create `_acceptance/lay-mau-khu-trung-theo-tin/probes/mau.mjs`.

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `docTinCua(client): Promise<Map<post_id, offer_id>>`. Nguồn: `unnest(post_ids)` của `sale_offer_records` có `offer_id LIKE 'zalo%'` hay cột nguồn S03 (tra cột thật lúc làm), kể cả tin đã nghỉ.
  - `layMau` trả thêm `bo_su_kien`, `bo_vi_trung`. `chonMauPhanTang` khử theo khoá.
  - `main` in hai số này.

- [ ] Viết probe `mau.mjs` đúng E2:
  - dựng `oneinvest_gn2` bằng `db/db-thu.sh`;
  - nạp bài giả và tin giả;
  - chạy `node pipeline/label-sample.mjs` thật (lát thường `--nhom-khop`, lát `--theo-nhom`);
  - in các dòng `ok …`, `MAU OK`;
  - hai đột biến `THE TRUNG TRONG LAT`, và dòng đỏ thứ hai theo đúng E2;
  - xoá DB thử.
- [ ] Chạy probe → đỏ. Cài đặt. Chạy lại → `MAU OK`.
- [ ] Commit `feat(labels): label-sample khử trùng theo tin của pipeline, in số bỏ vì trùng và vì sự kiện`.

### Task 4: `label-ghep` dựng dấu trùng, giữ dấu ẩn tay — phục vụ E6 · `independent: false` (cần Task 1)

**Files:** Modify `pipeline/lib/ghep-mau.mjs`, `pipeline/label-ghep.mjs` · Test `pipeline/scripts/label-ghep.test.mjs` (thêm ca).

**Interfaces — Produces:**

`nhomTrung(items, ghep, { posts, tinCua, soNhan })` → `Map<item_id, ghep>`:
- `items`: `{item_id, ref_id, ghep_cu}`.
- `ghep`: kết quả `ghepChoMau`.
- `soNhan`: `Map<item_id, so dòng eval_labels>`.

Luật:
- Dòng có `ghep_cu.an_tay` được giữ nguyên.
- Khoá của thẻ = `khoaTrung` trên bài chữ: `chu_ref` của cụm, hoặc chính bài khi bài có chữ.
- Thẻ đã ẩn vì cụm (`trung_voi` từ `ghepChoMau`) không xét lại.
- Mỗi nhóm khoá ≥ 2 thẻ: thẻ giữ chọn trong các thẻ chưa ẩn tay, theo thứ tự `soNhan` lớn nhất → được dấu ẩn tay trỏ tới → `item_id` nhỏ nhất.
- Thẻ còn lại nhận `trung_voi = ref_id thẻ giữ` và `khu_trung = "tin"|"chu"`. Thẻ không có cụm thì ghi `{chu_ref: ref_id, anh_refs: [], so_chu_gan: 0, trung_voi, khu_trung}`.

`ghepLat` đọc `ghep` cũ cùng số nhãn, gọi `docTinCua` (export từ `label-sample.mjs` hay chuyển vào lib — chọn lib `eval-labels`? Không: cần pg; đặt ở `label-ghep.mjs` rồi `label-sample` import), rồi trả thêm `an_moi` và `an_tay_giu`. `main` in hai số này.

- [ ] Test `GN2-AC-5` trên DB thử dựng bằng `db/migrations`, lát 12 thẻ theo E6. Chạy `ghepLat` thường rồi `--lam-lai` và assert như E6. Hai đột biến: `DAU AN TAY BI XOA`, `THE CO NHAN BI AN`.
- [ ] Chạy đỏ → cài đặt → xanh. Test cũ `label-ghep.test.mjs` và `eval-classify-ghep.test.mjs` vẫn xanh.
- [ ] Commit `feat(labels): label-ghep dựng dấu trùng theo tin và chữ, giữ dấu ẩn tay`.

### Task 5: lát thật trên DB thử, phạm vi, tài liệu — phục vụ E7, E10 · `independent: false`

**Files:** Create `_acceptance/…/probes/lat-that.mjs`, `_acceptance/…/probes/pham-vi.sh` · Modify `pipeline/CLAUDE.md` (dòng `label-sample`, thêm dòng `label-ghep`).

- [ ] `lat-that.mjs` theo E7:
  - đọc chỉ đọc DB máy thu (`PGOPTIONS default_transaction_read_only`), chép sang `oneinvest_gn2`;
  - chạy `node pipeline/label-ghep.mjs --lat s03-theo-nhom --lam-lai` thật trên DB thử;
  - in `ok 44 the an cu van an`, `ok so the an = 48` (48 đọc từ dòng sổ gate1 Hỏi-1), mỗi thẻ ẩn thêm một dòng `an them <item_id> <khoa>`;
  - in `ok lan hai khong doi` và `tin canonical se nghi vi dau moi = <n>`;
  - chiều đỏ `AN TAY MAT`;
  - xoá DB thử.
- [ ] `pham-vi.sh` theo E10, cùng khuôn với `truong-nhan-s03-081/probes/pham-vi.sh`.
- [ ] Chạy cả hai → OK. Commit `test(acceptance): lay-mau-khu-trung-theo-tin — probe lát thật và phạm vi`.

### Task 6: kiểm toàn bộ — E5, E8, E9

- [ ] `cd pipeline && npm test` · `cd app && node --import tsx --test tests/labels-nhom.test.tsx` · lệnh `ecr_lenh` của config · `node pipeline/vocab.mjs --lint` → xanh.
- [ ] Contract `status: implemented`, rồi S4.
