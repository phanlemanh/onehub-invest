#!/usr/bin/env node
// dot-bien.mjs — NB1 cham-bong-bo-sung-tin: chạy ca của một AC trên mã thật (phải xanh), rồi trên từng bản đột biến (phải đỏ với
// thông điệp ghim) — điều khoản «phép đo mới phải từng đỏ». Bản đột biến là bản chép agent/src/enrich/cham-bong/ sang
// agent/src/enrich/cham-bong.dot-bien/ (cùng độ sâu nên import tương đối giữ nguyên), sửa đúng một chỗ, test nạp qua CHAM_BONG_SRC.
// Gọi qua cham.sh (bên trong db-thu.sh --chay, DATABASE_URL trỏ DB của riêng lượt). Dùng: node dot-bien.mjs AC-n
import { spawnSync } from "node:child_process";
import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const AGENT = join(import.meta.dirname, "../../../agent");
const GOC = join(AGENT, "src/enrich/cham-bong");
const AC = process.argv[2];
if (!/^AC-\d+$/.test(AC ?? "")) { console.error("dùng: dot-bien.mjs AC-n"); process.exit(2); }
// Mỗi lượt một thư mục bản sao riêng (theo AC và pid): lượt chấm chạy các AC song song, thư mục chung thì lượt này xoá bản sao
// lượt kia đang nạp (S4 r1: ERR_MODULE_NOT_FOUND, đột biến «thước vẫn xanh» vì nạp nhầm bản sao của AC khác).
const TEN_BAN = `cham-bong.dot-bien-${AC.toLowerCase()}-${process.pid}`;
const BAN = join(AGENT, "src/enrich", TEN_BAN);

/** [AC, tên, tệp, chuỗi tìm (đúng một lần), chuỗi thay, thông điệp ghim (regex trên đầu ra test)] */
const DB = [
  ["AC-1", "đọc cả thẻ «Để sau»", "doc-db.ts", "r.status = 'pending'", "r.status IN ('pending', 'deferred')", /thẻ c11: 2 lời gọi, mong 0/],
  ["AC-1", "một model đọc hai lần", "chay.ts", "for (const m of o.cauHinh.model) {", "for (const m of [o.cauHinh.model[0], o.cauHinh.model[0]]) {", /thẻ c\d+: 1 lời gọi, mong 2/],
  ["AC-1", "gọi một lần mỗi đề xuất", "chay.ts", "vong: for (const t of ds) {", "vong: for (const t of ds.flatMap((x) => x.de_xuat.map((p) => ({ ...x, de_xuat: [p] })))) {", /thẻ c06: 6 lời gọi, mong 2/],
  ["AC-2", "chèn giá trị đề xuất vào lời nhắc", "chay.ts", "const dauVao = { text: t.text, group_name: t.group_name,", "const dauVao = { text: t.text, group_name: (t.group_name ?? \"\") + t.de_xuat.map((p) => p.value).join(\",\"),", /lộ (giá trị đề xuất )?«[^»]+»/],
  ["AC-2", "dùng chữ cắt 300 ký tự", "doc-db.ts", "SELECT s.text, s.group_name", "SELECT left(s.text, 300) AS text, s.group_name", /khối bài không nguyên văn/],
  ["AC-3", "bỏ kiểm trích", "doc.ts", "if (!trichCoThat(trich, chu))", "if (false && !trichCoThat(trich, chu))", /ca trích không có trong bài → rỗng/],
  ["AC-4", "so chuỗi thô", "ket-cuc.ts", "const a = khoaGiaTri(d1.v), b = khoaGiaTri(d2.v);", "const a = d1.v, b = d2.v;", /ô «02\/2» phải khop/],
  ["AC-4", "xếp A/B thành bac_dong_thuan", "ket-cuc.ts", "if (a !== b) return \"lech_hai_lan\";", "if (a !== b && (a === khoaGiaTri(deXuat) || b === khoaGiaTri(deXuat))) return \"lech_hai_lan\";", /ô (A\/B|B\/A) .*kết cục bac_dong_thuan, mong lech_hai_lan/],
  ["AC-4", "bỏ lech_tren_the khỏi ca biên", "ket-cuc.ts", "return k !== \"khop\" || lechTrenThe;", "return k !== \"khop\";", /lech=true .*ca biên false/],
  ["AC-5", "chế độ áp gọi apply_enrichment", "chay.ts", "if (d.ok) kho.ghi(k, d, o.runId);", "if (d.ok) kho.ghi(k, d, o.runId);\n        if (o.cheDo === \"ap\") await o.truy(\"SELECT apply_enrichment($1::bigint[], 'dot-bien')\", [[t.de_xuat[0].id]]);", /lượt áp trọn: bảng đổi .+/],
  ["AC-6", "bỏ ghi sổ khi lỗi", "doc.ts", "      await o.recordCall(dongSo(o.model, kq, o.trace));\n      if ((pl.lop", "      if ((pl.lop", /sổ tệp 18 dòng, mong 20/],
  ["AC-7", "bỏ khoá băm", "chay.ts", "if (kho.co(k)) { tk.dung_lai++; continue; }", "", /\(a\) lần hai gọi 20 lời gọi lặp/],
  ["AC-7", "lưu kết quả lỗi vào khoá", "kho.ts", "if (d.khoa && d.doc?.ok === true)", "if (d.khoa && d.doc)", null],
  ["AC-8", "kiểm trần sau khi gọi", "chay.ts", "if (tk.usd + uoc > tran)", "if (tk.usd > tran)", /có lời gọi thứ 8, mong dừng sau lời gọi thứ 7/],
  ["AC-9", "đếm theo thẻ thay vì đề xuất", "bao-cao.ts", "for (const d of kc) {", "for (const d of kc.filter((x, i) => kc.findIndex((y) => y.review_id === x.review_id) === i)) {", /tổng lệch: 10, mong 13|ô .+: 0, mong \d/],
  ["AC-9", "gộp lỗi vào bo_trong", "bao-cao.ts", ": \"chua_du\";", ": \"bo_trong\";", /× (bo_trong|chua_du) × e2_llm: \d, mong \d/],
  ["AC-10", "lấy cả thẻ có đề xuất", "ke-the-trong.ts", "\n  AND NOT EXISTS (SELECT 1 FROM enrichment_proposals p WHERE p.review_id = r.id)", "", /tổng lệch: 9, mong 7/],
];
// Đột biến AC-7 «lưu lỗi» cần hai chỗ: nhận lời lỗi vào kho lúc ghi và lúc nạp lại.
const KEP = { "lưu kết quả lỗi vào khoá": [["chay.ts", "if (d.ok) kho.ghi(k, d, o.runId);", "if (true) kho.ghi(k, d as never, o.runId);"]] };
const GHIM_KEP = { "lưu kết quả lỗi vào khoá": /\(b\) lần hai gọi 0, mong đúng 2/ };

function chayTest(src) {
  const r = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-concurrency=1", `--test-name-pattern=^${AC} `, "tests/cham-bong-bo-sung-tin.test.ts"],
    { cwd: AGENT, env: { ...process.env, CHAM_BONG_SRC: src }, encoding: "utf8", maxBuffer: 64 << 20 });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}
const soCa = (out) => Number(/ℹ pass (\d+)/.exec(out)?.[1] ?? 0) + Number(/ℹ fail (\d+)/.exec(out)?.[1] ?? 0);

let hong = 0;
const goc = chayTest("cham-bong");
if (goc.code !== 0 || soCa(goc.out) === 0) {
  console.log(`ĐỎ ${AC} trên mã thật (thoát ${goc.code}, ${soCa(goc.out)} ca):\n${goc.out.slice(-3000)}`);
  process.exit(1);
}
console.log(`xanh ${AC} trên mã thật: ${soCa(goc.out)} ca`);
for (const [ac, ten, tep, tim, thay, ghim0] of DB.filter((d) => d[0] === AC)) {
  rmSync(BAN, { recursive: true, force: true });
  cpSync(GOC, BAN, { recursive: true });
  try {
    for (const [t, a, b] of [[tep, tim, thay], ...(KEP[ten] ?? [])]) {
      const p = join(BAN, t), s = readFileSync(p, "utf8");
      if (s.split(a).length !== 2) throw new Error(`đột biến «${ten}»: không thấy đúng một chỗ «${a.slice(0, 60)}» trong ${t}`);
      writeFileSync(p, s.replace(a, b));
    }
    const r = chayTest(TEN_BAN);
    const ghim = ghim0 ?? GHIM_KEP[ten];
    if (r.code === 0) { console.log(`HỎNG đột biến «${ten}»: thước vẫn xanh`); hong++; }
    else if (!ghim.test(r.out)) { console.log(`HỎNG đột biến «${ten}»: đỏ nhưng không có thông điệp ghim ${ghim}\n${r.out.slice(-2000)}`); hong++; }
    else console.log(`đỏ đúng ${ac} «${ten}»: ${ghim.exec(r.out)[0]}`);
  } finally {
    rmSync(BAN, { recursive: true, force: true });
  }
}
process.exit(hong ? 1 : 0);
