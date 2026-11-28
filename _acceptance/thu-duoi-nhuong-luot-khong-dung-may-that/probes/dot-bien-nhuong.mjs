#!/usr/bin/env node
// dot-bien-nhuong.mjs — E3 của thu-duoi-nhuong-luot-khong-dung-may-that (HT46): tệp test mới phải ĐỎ khi nhánh nhường lượt
// của wrapper bị tắt. Bản chép đột biến ở thư mục tạm (mã thật không đụng), truyền cho test qua THU_DUOI_NHUONG_WRAPPER.
// Đối chứng dương: cùng tệp test trên bản thật phải xanh.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const TEST = join(ROOT, "pipeline/scripts/thu-duoi-nhuong-luot.test.mjs");
const TIM = 'if pgrep -f "scripts/chotot-daily.sh" >/dev/null 2>&1; then';
const chay = (env) => spawnSync(process.execPath, ["--test", TEST], { encoding: "utf8", env: { ...process.env, ...env }, timeout: 120_000 });
let loi = 0;
const that = chay({});
if (that.status === 0 && /so loi goi node: 0/.test(that.stdout)) console.log("ban that: test xanh · so loi goi node 0");
else { console.log(`BAN THAT DO (thoát ${that.status})\n${(that.stdout + that.stderr).slice(-800)}`); loi++; }
const goc = readFileSync(join(ROOT, "scripts/thu-duoi-s06.sh"), "utf8");
if (!goc.includes(TIM)) { console.log("KHONG TIM THAY CHO PHA (dòng nhường lượt đã đổi chữ)"); loi++; }
else {
  const T = mkdtempSync(join(tmpdir(), "ht46-dot-bien-"));
  try {
    const p = join(T, "thu-duoi-s06.sh");
    writeFileSync(p, goc.replace(TIM, "if false; then"));
    const r = chay({ THU_DUOI_NHUONG_WRAPPER: p });
    // đỏ phải vì ĐÚNG lý do: thiếu dòng nhường lượt (thông điệp ghim của test), và bản tắt có ≥1 lời gọi node — đối
    // chứng dương cho vế «0 lời gọi node» (shim node của test thật sự đếm được lời gọi).
    const n = Number((r.stdout.match(/so loi goi node: (\d+)/) ?? [])[1] ?? -1);
    if (r.status !== 0 && /THIEU DONG NHUONG LUOT/.test(r.stdout) && n >= 1)
      console.log(`dot bien tat nhuong luot: test do (dung) · so loi goi node ${n}`);
    else { console.log(`DOT BIEN SONG: test thoát ${r.status} · thông điệp ghim ${/THIEU DONG NHUONG LUOT/.test(r.stdout)} · lời gọi node ${n}`); loi++; }
  } finally { rmSync(T, { recursive: true, force: true }); }
}
console.log(loi ? `DOT-BIEN-NHUONG DO (${loi})` : "DOT-BIEN-NHUONG OK");
process.exit(loi ? 1 : 0);
