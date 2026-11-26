#!/usr/bin/env node
// dot-bien.mjs — cham-bong-cau-tra-loi-khong-bi-cat: chạy ca của một AC trên mã thật (phải xanh), rồi trên từng bản đột biến (phải đỏ
// với thông điệp ghim). Bản đột biến chép agent/src/enrich/cham-bong/ sang agent/src/enrich/cham-bong.cat-<ac>-<pid>/ (cùng độ sâu,
// import tương đối giữ nguyên), sửa đúng các chỗ khai, test nạp qua CHAM_BONG_SRC. Dùng: node dot-bien.mjs AC-n (từ agent/).
import { spawnSync } from "node:child_process";
import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const AGENT = join(import.meta.dirname, "../../../agent");
const GOC = join(AGENT, "src/enrich/cham-bong");
const TEP_TEST = "tests/cham-bong-cau-tra-loi-khong-bi-cat.test.ts";
const AC = process.argv[2];
if (!/^AC-\d+$/.test(AC ?? "")) { console.error("dùng: dot-bien.mjs AC-n"); process.exit(2); }
const TEN_BAN = `cham-bong.cat-${AC.toLowerCase()}-${process.pid}`;
const BAN = join(AGENT, "src/enrich", TEN_BAN);

/** [AC, tên, [[tệp, chuỗi tìm (đúng một lần), chuỗi thay], …], thông điệp ghim (regex trên đầu ra test)] */
const DB = [
  ["AC-1", "trần hằng 1000", [["doc.ts", "=> TOKEN_RA_GOC + TOKEN_RA_MOI_O * soO;", "=> 1000;"]], /n=2: trần 1000, mong 1600/],
  ["AC-1", "quên truyền trần sang Gateway", [["doc.ts", "maxOutputTokens: maxRa });", "maxOutputTokens: 1000 });"]], /gateway maxOutputTokens 1000, mong 2200/],
  ["AC-2", "bỏ kiểm cat (dùng JSON đã tách khi bị cắt)", [["doc.ts", "const json = r.cat ? null : tachJson(r.text);\n      kq = r.cat\n", "const json = tachJson(r.text);\n      kq = false\n"]], /mong bi-cat/],
  ["AC-3", "cắt + JSON hỏng xếp thành json-hong", [["doc.ts", "const json = r.cat ? null : tachJson(r.text);", "const json = tachJson(r.text);"], ["doc.ts", "      kq = r.cat\n", "      kq = r.cat && json\n"]], /ô cắt \+ JSON hỏng: json-hong, mong bi-cat/],
  ["AC-4", "đếm mọi lỗi vào json-hong", [["chay.ts", "const ld = lyDoLoi(d.loi);", "const ld = \"json-hong\";"]], /loi_theo_ly_do \{"json-hong":4\}/],
  ["AC-5", "ước lời gọi đầu bằng hằng 1000", [["chay.ts", "tranTokenRa(o.length) * m.gia_ra) / 1e6;", "1000 * m.gia_ra) / 1e6;"]], /n=3: ước [0-9.e-]+, mong/],
  ["AC-6", "đưa trần token ra vào khoá dùng lại", [["kho.ts", "m.gateway, promptVersion])", "m.gateway, promptVersion, 400 + 600 * o.length])"]], /khoá dùng lại lệch cho/],
  ["AC-8", "bỏ dòng dừng vì trần", [["bao-cao.ts", "...(t.dung_vi_tran\n", "...(false\n"]], /thiếu dòng rõ lý do/],
];

function chayTest(src) {
  const r = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-concurrency=1", `--test-name-pattern=^${AC} `, TEP_TEST],
    { cwd: AGENT, env: { ...process.env, CHAM_BONG_SRC: src }, encoding: "utf8", maxBuffer: 64 << 20 });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}
const soCa = (out) => Number(/ℹ pass (\d+)/.exec(out)?.[1] ?? 0) + Number(/ℹ fail (\d+)/.exec(out)?.[1] ?? 0);

const goc = chayTest("cham-bong");
if (goc.code !== 0 || soCa(goc.out) === 0) {
  console.log(`ĐỎ ${AC} trên mã thật (thoát ${goc.code}, ${soCa(goc.out)} ca):\n${goc.out.slice(-3000)}`);
  process.exit(1);
}
console.log(`xanh ${AC} trên mã thật: ${soCa(goc.out)} ca`);
let hong = 0;
for (const [ac, ten, sua, ghim] of DB.filter((d) => d[0] === AC)) {
  rmSync(BAN, { recursive: true, force: true });
  cpSync(GOC, BAN, { recursive: true });
  try {
    for (const [t, a, b] of sua) {
      const p = join(BAN, t), s = readFileSync(p, "utf8");
      if (s.split(a).length !== 2) throw new Error(`đột biến «${ten}»: không thấy đúng một chỗ «${a.slice(0, 60)}» trong ${t}`);
      writeFileSync(p, s.replace(a, b));
    }
    const r = chayTest(TEN_BAN);
    if (r.code === 0) { console.log(`HỎNG đột biến «${ten}»: thước vẫn xanh`); hong++; }
    else if (!ghim.test(r.out)) { console.log(`HỎNG đột biến «${ten}»: đỏ nhưng không có thông điệp ghim ${ghim}\n${r.out.slice(-2000)}`); hong++; }
    else console.log(`đỏ đúng ${ac} «${ten}»: ${ghim.exec(r.out)[0]}`);
  } finally {
    rmSync(BAN, { recursive: true, force: true });
  }
}
process.exit(hong ? 1 : 0);
