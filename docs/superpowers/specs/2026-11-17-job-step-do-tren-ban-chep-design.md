# job-step-do-tren-ban-chep — lưới phạm vi làn của JST-AC-8 đo trên bản chép

Ngày: 2026-11-17 · Dãy N1 · Hạng T2 · Nguồn: Ngoài-1 + Ngoài-5 của `job-step-ghi-thoi-luong`, Mạnh định tuyến
«mở hợp đồng mới» ở Cổng Bằng chứng 17/11.

## 1. Vấn đề

Ca `JST-AC-8 lưới phạm vi làn` trong `scripts/job-step-thoi-luong.test.mjs` có hai ô đột biến (chèn một dòng
DƯỚI dòng mốc làn → phải xanh; chèn một dòng TRÊN dòng mốc → phải đỏ). Hàm `voiDongChen` làm hai ô ấy bằng cách
`writeFileSync` thẳng vào `scripts/zalo-import-daily.sh` THẬT trong cây làm việc rồi ghi lại bản gốc ở `finally`.

Hai hệ quả, cùng một gốc:

- **Ngắt giữa chừng** (Ctrl-C, timeout của runner, OOM) thì `finally` không chạy: tệp bọc thật còn dính dòng chèn.
  `AGENTS.md` kê `node --test scripts/*.test.mjs` chạy ở gốc kho; ở checkout chính, launchd chạy đúng tệp ấy mỗi
  15 phút.
- **Chạy song song**: node test runner chạy các TỆP song song; ít nhất bốn bộ khác đọc đúng tệp bọc lúc chạy
  (`zalo-import-job`, `zalo-import-job-nhe`, `s03-nap-nhanh`, `nap-ts-order`). Trong cửa sổ giữa hai lần ghi chúng có
  thể chép phải bản bị chèn → đỏ ngẫu nhiên không tái hiện được.

Mọi bộ test job khác của kho đều chép tệp bọc sang cây tạm trước khi đột biến; riêng hai ô này phá khuôn.

## 2. Thiết kế

Tách hàm lưới thành hai phần:

1. **Hàm thuần `khoiTrenMoc(diff, socMoc)`** — nhận văn bản diff `-U0`, trả các khối `@@` có dòng bắt đầu ≤ số dòng
   của mốc. Không đọc tệp, không gọi git.
2. **Hai nguồn diff cho cùng một hàm:**
   - Ô (i) «cây hiện tại»: `git diff -U0 origin/main -- scripts/zalo-import-daily.sh` trên chính kho — CHỈ ĐỌC, như cũ.
   - Ô (ii) và (iii): lấy bản `origin/main` của tệp bọc (lời gọi `git show` có kiểm mã thoát và đầu ra không rỗng),
     ghi bản gốc và bản đã chèn thành HAI tệp trong một thư mục tạm, rồi `git diff --no-index -U0 <gốc> <sửa>`
     (mã thoát 1 = có khác, là bình thường). Không một byte nào được ghi vào cây làm việc.

Vị trí chèn giữ y như cũ (dưới mốc: dòng i+2; trên mốc: dòng i−1) — cố ý không đụng ca «đỏ nhầm khi sửa ngay sát dưới
mốc» (Ngoài-6, đã ghi Known limits).

`git diff --no-index` in cùng khuôn đầu khối `@@ -N[,M] +…` như diff theo ref, nên ô (i) và ô (ii)/(iii) đi qua đúng
một hàm tách khối — chiều đỏ đo chính đường mã mà ô (i) dùng.

### Vì sao không dùng `git worktree add` tạm

Nó ghi siêu dữ liệu vào `.git` chung của một kho đang có hàng chục worktree của nhiều phiên, và bị ngắt giữa chừng thì
để lại một mục worktree mồ côi — đúng lớp «ngắt giữa chừng để lại vết trong kho thật» mà hàng này gỡ. `--no-index`
không cần gì của kho ngoài lời `git show` chỉ đọc.

## 3. Phép đo

- **Không ghi vào cây (AC-1).** Một ca mới dựng một kho git TẠM nhỏ (tệp bọc, `lib/job-step.sh`, tệp test; một commit;
  `refs/remotes/origin/main` trỏ commit ấy) rồi chạy riêng ca lưới làn trong đó bằng `--test-name-pattern`. Chụp
  (băm, mtime, ctime) của tệp bọc trong kho tạm trước và sau: phải y nguyên, và `git status --porcelain` của kho tạm
  rỗng. Chiều đỏ cùng fixture: bản chép tệp test đột biến cho ô (ii)/(iii) ghi vào tệp bọc của kho (đúng hành vi cũ)
  → ca đỏ ghim «JST-AC-1-bc ô đột biến đã ghi vào cây làm việc». Kho tạm là chỗ duy nhất có thể bị ghi — cây thật
  không bao giờ là fixture; ca vẫn chụp tệp bọc THẬT trước và sau cả hai chiều làm lưới đỡ, phòng khi tệp test suy
  gốc kho sai (gốc kho suy từ `import.meta.url`, nên trong kho tạm nó là gốc kho tạm).
- **Vẫn phân biệt (AC-2).** Ô (ii) xanh, ô (iii) đỏ với thông điệp ghim cũ, cùng hàm tách khối — chứng bằng hai đột
  biến ngược chiều: hàm luôn trả rỗng làm ô (iii) đỏ, hàm luôn trả một khối giả làm ô (i) đỏ. Thêm: kho tạm không có
  `refs/remotes/origin/main` → ca lưới làn ĐỎ với «JST-AC-8 không đọc được bản origin/main của tệp bọc», không xanh
  rỗng.
- **Không gì khác đổi (AC-3).** `jst_unit` trọn tệp và lưới hồi quy năm bộ `jst_regress` xanh.

Chiều đỏ của AC-1 rút từ bản chép ĐỘT BIẾN của tệp test hiện tại, không từ `git show origin/main:` của chính tệp
test: gộp PR xong thì `origin/main` mang bản mới, và đối chứng rút từ đó mất chiều đỏ.

## 4. Hồ sơ cũ

Hợp đồng `job-step-ghi-thoi-luong` giữ nguyên chữ như lúc ký (Mạnh chọn «mở hợp đồng mới», không chọn «nâng phạm vi
sửa ngay»; và chọn «Để nguyên» khi được hỏi có sửa lời một tiêu chí đã ký). Sổ của hồ sơ cũ nhận một dòng trỏ sang hàng
này. Tệp test là `paths` của E1–E9 hồ sơ cũ, nên sau S4 của hàng này máy ghim lại hồ sơ cũ một lượt (làn máy, không
đụng chữ ký).

## 5. Ngoài phạm vi

- Ngoài-4, 6, 7, 8, 10, 12–15 của hồ sơ cũ — Mạnh đã ghi Known limits; hàng này không sửa dù cùng tệp.
- Mở rộng lưới hồi quy (Ngoài-3) — Mạnh chốt để nguyên.
- `scripts/zalo-import-daily.sh`, `scripts/lib/job-step.sh` — vòng không sửa; đọc ở diff của PR, không có eval riêng
  (một ca khẳng định hai tệp bằng `origin/main` sẽ đỏ ở mọi nhánh sau này sửa chúng hợp lệ).
