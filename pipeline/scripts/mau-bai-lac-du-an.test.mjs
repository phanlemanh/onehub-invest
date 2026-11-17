// mau-bai-lac-du-an.test.mjs — hồ sơ _acceptance/dong-dau-dia-chi-luc-nap (TG2), AC-10.
// Thước «tỉ lệ bài lạc dự án» chỉ đạt khi CẬN TRÊN của khoảng Wilson 95% ≤ ngưỡng chốt, với cỡ mẫu
// khai TRƯỚC khi gắn nhãn. Hai hàm thuần ở đây là chỗ con số ấy được tính; rút mẫu cần DB nên không ở đây.
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { chonMau, docBangDaDien, docKhaiMau, docMaKhoa, docTepDuyet, laLac, locKhung, soMau, wilson95 } from "./mau-bai-lac-du-an.mjs";

/** Làm tròn 4 chữ số để so số thực. */
const r4 = (x) => Math.round(x * 1e4) / 1e4;

describe("AC-10 khoảng Wilson 95%", () => {
  test("không ca lạc nào trên 100 bài vẫn cho cận trên 3,70% — không phải 0", () => {
    const w = wilson95(0, 100);
    assert.equal(r4(w.p), 0);
    assert.equal(r4(w.duoi), 0);
    assert.equal(r4(w.tren), 0.037);
  });

  test("bốn ca lạc trên 100 bài ĐẠT ngưỡng 10%, năm ca thì TRƯỢT", () => {
    assert.equal(r4(wilson95(4, 100).tren), 0.0984);
    assert.equal(r4(wilson95(5, 100).tren), 0.1118);
    assert.ok(wilson95(4, 100).tren <= 0.10, "4/100 phải đạt");
    assert.ok(wilson95(5, 100).tren > 0.10, "5/100 phải trượt");
  });

  test("mẫu nhỏ bị phạt đúng: 0 ca lạc trên 20 bài cho cận trên 16,1%, quá ngưỡng", () => {
    assert.equal(r4(wilson95(0, 20).tren), 0.1611);
    assert.ok(wilson95(0, 20).tren > 0.10, "n=20 không được lọt ngưỡng dù 0 ca lạc");
  });

  test("cỡ mẫu 0 không trả số giả", () => {
    assert.throws(() => wilson95(0, 0), /cỡ mẫu/);
    assert.throws(() => wilson95(3, 2), /số ca lạc/);
  });
});

describe("AC-10 rút mẫu có hạt giống", () => {
  const BAI = Array.from({ length: 500 }, (_, i) => ({ post_id: `p${i}`, conversation_id: `g${i % 7}` }));

  test("cùng hạt giống cho cùng mẫu, khác hạt giống cho mẫu khác", () => {
    const a = chonMau(BAI, 100, "hat-1").map((b) => b.post_id);
    assert.equal(a.length, 100);
    assert.deepEqual(chonMau(BAI, 100, "hat-1").map((b) => b.post_id), a);
    assert.notDeepEqual(chonMau(BAI, 100, "hat-2").map((b) => b.post_id), a);
  });

  test("mẫu không lặp bài, và không im lặng trả thiếu khi kho nhỏ hơn cỡ mẫu", () => {
    const a = chonMau(BAI, 100, "hat-1").map((b) => b.post_id);
    assert.equal(new Set(a).size, 100);
    assert.throws(() => chonMau(BAI.slice(0, 50), 100, "hat-1"), /không đủ bài/);
  });
});

describe("AC-10 đọc bảng đã điền — chỉ dòng nhãn thật mới được tính", () => {
  const DONG = (i, lac, pid) => `| ${i} | ${lac} | \`${pid}\` | 1 | đầu bài gì đó |`;
  const BANG = ["| # | lac | post_id | dự án của nhóm | đầu bài |", "|---|---|---|---|---|",
    DONG(1, "x", "p1"), DONG(2, "", "p2"), DONG(3, "x", "p3"), DONG(4, "", "p4")].join("\n");

  test("đếm đúng cỡ mẫu và số ca lạc trên bảng hợp lệ", () => {
    assert.deepEqual(docBangDaDien(BANG), { n: 4, k: 2 });
  });

  test("bảng ngưỡng của tệp bằng chứng KHÔNG bị đếm thành bài lạc", () => {
    // Đúng khuôn trong evidence/mau-bai-lac-du-an.md: cột 1 là số, cột 2 có chữ, không có post_id.
    const nguong = ["| số bài lạc | cận trên Wilson 95% | |", "|---|---|---|",
      "| 0 | 3,70% | đạt |", "| 4 | 9,84% | đạt |", "| 5 | 11,18% | **chưa đạt** |"].join("\n");
    assert.deepEqual(docBangDaDien(nguong), { n: 0, k: 0 });
    assert.deepEqual(docBangDaDien(`${BANG}\n\n${nguong}`), { n: 4, k: 2 });
  });

  test("dòng nhãn thiếu post_id bị bỏ qua, đúng như chú thích nói", () => {
    assert.deepEqual(docBangDaDien(`${BANG}\n| 5 | x |  | 1 | thiếu mã bài |`), { n: 4, k: 2 });
  });

  test("cỡ mẫu phải là số nguyên dương, không nhận NaN hay 0", () => {
    assert.equal(soMau("100"), 100);
    for (const x of [undefined, "", "0", "-3", "abc", "1.5"]) assert.throws(() => soMau(x), /cỡ mẫu/, `nhận ${x}`);
  });
});

describe("AC-10 mẫu rút lại được", () => {
  const kho = (n) => Array.from({ length: n }, (_, i) => ({ post_id: `p${i}` }));

  test("kho lớn lên thì cùng hạt giống KHÔNG còn cho cùng mẫu — nên hồ sơ phải ghi danh sách mã bài", () => {
    const a = chonMau(kho(500), 100, "h").map((b) => b.post_id);
    const b = chonMau(kho(520), 100, "h").map((b) => b.post_id);
    const chung = a.filter((x) => b.includes(x)).length;
    assert.ok(chung < 100, "nếu bằng 100 thì câu «rút lại được bằng hạt giống» mới đúng");
    assert.ok(chung > 80, `mẫu không được đổi gần hết (trùng ${chung}/100)`);
  });
});

describe("AC-10 mẫu v2 — khung rút và định nghĩa khai trước (lối A, GS 17/11)", () => {
  test("khung «bài trong tin»: chỉ giữ bài nằm trong một tin đang rao — đúng tập bài sẽ bị đóng dấu", () => {
    const bai = [{ post_id: "a" }, { post_id: "b" }, { post_id: "c" }];
    assert.deepEqual(locKhung(bai, "bai-trong-tin", new Set(["a", "c"])).map((b) => b.post_id), ["a", "c"]);
    assert.deepEqual(locKhung(bai, "moi-bai", new Set(["a"])).map((b) => b.post_id), ["a", "b", "c"]);
    assert.throws(() => locKhung(bai, "khung-la", new Set()), /khung/);
  });

  test("định nghĩa «trong hệ VGP»: bài MCP hay LBV trong nhóm VGP không lạc; dự án khác vẫn lạc", () => {
    // Danh bạ 17/11: Vinhomes Grand Park = 16, Masteri Centre Point = 304, Lumiere Boulevard = 310.
    assert.equal(laLac("16", "304"), false);
    assert.equal(laLac("16", "310"), false);
    assert.equal(laLac("16", "16"), false);
    assert.equal(laLac("16", "2"), true, "Ocean Park 2 trong nhóm VGP phải là lạc");
    assert.equal(laLac("1", "304"), true, "hệ VGP chỉ áp cho nhóm VGP");
    assert.equal(laLac("16", null), false, "bài không nêu dự án không lạc");
  });
});

describe("AC-10 mẫu v2 — đọc tệp nhãn người duyệt lưu từ trang duyệt", () => {
  const HG = "tg2-ac10-v2-20261117";
  const KHOA = ["a", "b", "c", "e"];
  const tep = (nhan, them = {}) => ({ mau: "v2", hat_giong: HG, nguoi_duyet: "Mạnh", luc: "2026-11-17T17:00:00Z", nhan, ...them });
  const d = (post_id, nhap, chon) => ({ post_id, nhap, chon });
  const du = (chon = "dung") => KHOA.map((id) => d(id, "khong", chon));
  const doc = (t, them = {}) => docTepDuyet(t, { hatGiong: HG, maKhoa: KHOA, ...them });

  test("chỉ dòng người đã bấm mới tính; «đúng nháp» lấy nháp, «sửa» lấy giá trị người chọn", () => {
    const r = doc(tep([d("a", "khong", "dung"), d("b", "khong", "lac"), d("c", "lac", "khong"), d("e", "khong", null)]));
    assert.deepEqual(r, { n: 3, k: 1, chuaDuyet: 1, sua: 2, nguoiDuyet: "Mạnh", luc: "2026-11-17T17:00:00Z" });
  });

  test("tệp thiếu tên người duyệt hay giờ thì không nhận — nhãn người phải có người", () => {
    assert.throws(() => doc(tep(du(), { nguoi_duyet: "" })), /người duyệt/);
    assert.throws(() => doc(tep(du(), { luc: null })), /giờ/);
  });

  test("tệp của mẫu khác hay hạt giống khác thì không nhận", () => {
    assert.throws(() => doc(tep(du(), { hat_giong: "khac" })), /hạt giống/);
  });

  test("lựa chọn lạ thì không nhận, không đoán", () => {
    assert.throws(() => doc(tep([d("a", "khong", "co-le"), ...du().slice(1)])), /lựa chọn/);
  });

  // Vòng S4-r2: thứ khoá mẫu là DANH SÁCH MÃ BÀI trong hồ sơ, nên tệp nhãn phải khớp đúng danh sách ấy — cỡ mẫu
  // thật không được nhỏ hơn cỡ đã khai chỉ vì tệp bỏ hẳn những dòng chưa duyệt.
  test("tệp bỏ hẳn một mã bài của mẫu thì không nhận, gọi tên mã thiếu", () => {
    assert.throws(() => doc(tep(du().slice(1))), /thiếu 1 mã bài.*a/);
  });

  test("tệp có mã bài ngoài mẫu thì không nhận, gọi tên mã lạ", () => {
    assert.throws(() => doc(tep([...du(), d("z", "khong", "dung")])), /ngoài mẫu.*z/);
  });

  test("tệp trùng một mã bài thì không nhận — trùng là thổi cỡ mẫu", () => {
    assert.throws(() => doc(tep([...du(), d("b", "khong", "dung")])), /trùng.*b/);
  });

  test("ô nháp ngoài «lac» / «khong» thì không nhận — «đúng nháp» trên nháp hỏng không được đếm thành «không lạc»", () => {
    assert.throws(() => doc(tep([d("a", undefined, "dung"), ...du().slice(1)])), /nháp.*a/);
    assert.throws(() => doc(tep([d("a", "lạc", "dung"), ...du().slice(1)])), /nháp.*a/);
  });

  test("thiếu hạt giống hay danh sách mã khoá thì không đọc — không có đường bỏ qua phép đối chiếu", () => {
    assert.throws(() => docTepDuyet(tep(du()), { maKhoa: KHOA }), /hạt giống/);
    assert.throws(() => docTepDuyet(tep(du()), { hatGiong: HG }), /danh sách mã/);
    assert.throws(() => docTepDuyet(tep(du()), { hatGiong: HG, maKhoa: [] }), /danh sách mã/);
  });

  test("tệp đủ, đúng danh sách, đã duyệt hết thì đọc ra n bằng cỡ mẫu khai trước", () => {
    const r = doc(tep(du()));
    assert.equal(r.n, KHOA.length);
    assert.equal(r.chuaDuyet, 0);
  });
});

describe("AC-10 mẫu v2 — đọc danh sách mã bài đã khoá từ hồ sơ", () => {
  test("lấy khối mã ngay dưới mục «Đã rút», bỏ dòng trống", () => {
    const md = "# x\n\n## Khai trước\n\n```\nkhong-phai\n```\n\n## Đã rút\n\nRút lúc …\n\n```\nm1\nm2\n\nm3\n```\n\n## Nháp\n";
    assert.deepEqual(docMaKhoa(md), ["m1", "m2", "m3"]);
  });

  test("hồ sơ không có mục «Đã rút» hay khối mã rỗng thì báo lỗi, không trả danh sách rỗng", () => {
    assert.throws(() => docMaKhoa("# x\n"), /Đã rút/);
    assert.throws(() => docMaKhoa("## Đã rút\n\n```\n```\n"), /rỗng/);
  });

  test("hồ sơ v2 thật khoá đúng 100 mã, không trùng", async () => {
    const { readFileSync } = await import("node:fs");
    const md = readFileSync(new URL("../../_acceptance/dong-dau-dia-chi-luc-nap/evidence/mau-bai-lac-du-an-v2.md", import.meta.url), "utf8");
    const ma = docMaKhoa(md);
    assert.equal(ma.length, 100);
    assert.equal(new Set(ma).size, 100);
  });
});

describe("AC-10 --tinh-duyet ở dòng lệnh — mã thoát của từng nhánh", async () => {
  const { spawnSync } = await import("node:child_process");
  const { mkdtempSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const SCRIPT = new URL("./mau-bai-lac-du-an.mjs", import.meta.url).pathname;
  const dir = mkdtempSync(join(tmpdir(), "tinh-duyet-"));
  const KHOA = Array.from({ length: 100 }, (_, i) => `m${i}`);
  const mau = join(dir, "mau.md");
  const hoSo = (ma, { hg = "hg", n = 100 } = {}) =>
    `# mẫu\n\n| | |\n|---|---|\n| Hạt giống | \`${hg}\` |\n| Cỡ mẫu | **n = ${n}** |\n\n## Đã rút\n\n\`\`\`\n${ma.join("\n")}\n\`\`\`\n`;
  writeFileSync(mau, hoSo(KHOA));
  const chay = (nhan, args = ["--seed", "hg", "--mau", mau]) => {
    const f = join(dir, `nhan-${Math.random().toString(36).slice(2)}.json`);
    writeFileSync(f, JSON.stringify({ hat_giong: "hg", nguoi_duyet: "Mạnh", luc: "2026-11-17T17:00:00Z", nhan }));
    return spawnSync(process.execPath, [SCRIPT, "--tinh-duyet", f, ...args], { encoding: "utf8" });
  };
  const du = (sua = {}) => KHOA.map((id) => ({ post_id: id, nhap: "khong", chon: "dung", ...(sua[id] ?? {}) }));

  test("đủ 100 dòng, đã duyệt hết, 0 lạc → thoát 0, in ĐẠT và cỡ mẫu 100", () => {
    const r = chay(du());
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /cỡ mẫu khai 100 · dòng đã duyệt 100/);
    assert.match(r.stdout, /ĐẠT/);
  });

  test("còn một dòng chưa bấm → thoát 1, KHÔNG in «ĐẠT»", () => {
    const r = chay(du({ m7: { chon: null } }));
    assert.equal(r.status, 1);
    assert.match(r.stdout, /còn 1 dòng chưa duyệt/);
    assert.doesNotMatch(r.stdout, /: ĐẠT/);
  });

  test("hồ sơ có số mã khoá khác cỡ mẫu khai trước → thoát 1, không tính trên mẫu bị cắt", () => {
    const cut = join(dir, "mau-cut.md");
    writeFileSync(cut, hoSo(KHOA.slice(0, 35)));
    const r = chay(du().slice(0, 35), ["--seed", "hg", "--mau", cut]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /35 mã.*n = 100/);
  });

  test("--seed khác hạt giống khai trong hồ sơ → thoát 1", () => {
    const khac = join(dir, "mau-khac.md");
    writeFileSync(khac, hoSo(KHOA, { hg: "hat-khac" }));
    const r = chay(du(), ["--seed", "hg", "--mau", khac]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /hạt giống/);
  });

  test("tệp bỏ hẳn một dòng → thoát 1, gọi tên mã thiếu", () => {
    const r = chay(du().slice(1));
    assert.equal(r.status, 1);
    assert.match(r.stderr, /thiếu 1 mã bài.*m0/);
  });

  test("tệp trùng dòng → thoát 1", () => {
    const r = chay([...du(), { post_id: "m3", nhap: "khong", chon: "dung" }]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /trùng/);
  });

  test("thiếu --mau hay --seed → thoát 2, không tính", () => {
    assert.equal(chay(du(), ["--seed", "hg"]).status, 2);
    assert.equal(chay(du(), ["--mau", mau]).status, 2);
  });

  test("năm bài lạc trên 100 → thoát 1, CHƯA ĐẠT", () => {
    const lac = Object.fromEntries(KHOA.slice(0, 5).map((id) => [id, { chon: "lac" }]));
    const r = chay(du(lac));
    assert.equal(r.status, 1);
    assert.match(r.stdout, /CHƯA ĐẠT/);
  });
});

describe("AC-10 đọc phần khai trước của hồ sơ mẫu", () => {
  test("hồ sơ v2 thật: hạt giống, n = 100, 100 mã", async () => {
    const { readFileSync } = await import("node:fs");
    const md = readFileSync(new URL("../../_acceptance/dong-dau-dia-chi-luc-nap/evidence/mau-bai-lac-du-an-v2.md", import.meta.url), "utf8");
    const k = docKhaiMau(md);
    assert.equal(k.hatGiong, "tg2-ac10-v2-20261117");
    assert.equal(k.n, 100);
    assert.equal(k.ma.length, 100);
  });
  test("thiếu dòng hạt giống hay cỡ mẫu thì báo lỗi", () => {
    assert.throws(() => docKhaiMau("| Cỡ mẫu | **n = 100** |\n## Đã rút\n```\na\n```\n"), /hạt giống/);
    assert.throws(() => docKhaiMau("| Hạt giống | `x` |\n## Đã rút\n```\na\n```\n"), /cỡ mẫu/);
  });
});
