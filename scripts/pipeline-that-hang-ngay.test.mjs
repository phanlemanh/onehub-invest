// pipeline-that-hang-ngay.test.mjs — hồ sơ db-thu-tach-khoi-cum-that E11. Lệnh suite giả (PIPELINE_THAT_LENH) trên một kho
// git tạm đứng ở main; sổ ở thư mục tạm (PIPELINE_THAT_SO). Phần dòng «ca dữ liệu thật» của suite-neu-doi.mjs ở cuối tệp.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SCRIPT = path.join(import.meta.dirname, "pipeline-that-hang-ngay.mjs");

function kho(nhanh = "main") {
  const d = mkdtempSync(path.join(tmpdir(), "pt-hang-ngay-"));
  const g = (...a) => spawnSync("git", ["-C", d, ...a], { encoding: "utf8" });
  g("init", "-q", "-b", nhanh);
  g("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", "x");
  return { d, sha: g("rev-parse", "HEAD").stdout.trim(), so: path.join(d, "so", "lan-chay.jsonl") };
}
const chay = (k, lenh) => spawnSync(process.execPath, [SCRIPT], {
  cwd: k.d, encoding: "utf8", env: { ...process.env, PIPELINE_THAT_LENH: lenh, PIPELINE_THAT_SO: k.so },
});
const dongSo = (k) => readFileSync(k.so, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));

test("lần xanh: nối đúng một dòng sổ {ngay, sha, ket_qua xanh, ca_do []} và in một dòng xanh", () => {
  const k = kho();
  const r = chay(k, "echo 'ℹ pass 30'; exit 0");
  assert.equal(r.status, 0, r.stderr);
  const so = dongSo(k);
  assert.equal(so.length, 1);
  assert.equal(so[0].sha, k.sha);
  assert.equal(so[0].ket_qua, "xanh");
  assert.deepEqual(so[0].ca_do, []);
  assert.match(so[0].ngay, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(r.stdout, new RegExp(`ca dữ liệu thật trên main ${k.sha.slice(0, 9)} \\S+: xanh`));
});

test("lần đỏ: dòng sổ đỏ và dòng in gọi tên ca đỏ", () => {
  const k = kho();
  const r = chay(k, "printf '✔ SLT-DC ok (12ms)\\n✖ DO1-AC-6 tin nghỉ (721.5s)\\n✖ failing tests:\\n✖ DO1-AC-6 tin nghỉ (721.5s)\\n'; exit 1");
  assert.equal(r.status, 1);
  const so = dongSo(k);
  assert.equal(so.length, 1);
  assert.equal(so[0].ket_qua, "do");
  assert.deepEqual(so[0].ca_do, ["DO1-AC-6 tin nghỉ"]);
  assert.match(r.stdout, /ĐỎ \(mã 1\) — ca đỏ: DO1-AC-6 tin nghỉ/);
});

test("từ chối chạy khi cây không ở main; không ghi sổ", () => {
  const k = kho("feat/x");
  const r = chay(k, "exit 0");
  assert.equal(r.status, 2);
  assert.match(r.stderr, /chỉ chạy trên main/);
  assert.ok(!existsSync(k.so));
});

// ── Dòng «ca dữ liệu thật» của suite-neu-doi.mjs (lượt chấm) đọc sổ trên ─────────────────────────────────────────────
const SND = path.join(import.meta.dirname, "suite-neu-doi.mjs");

test("suite-neu-doi: dòng ca dữ liệu thật — kích, không kích có lần xanh, sổ trống", async () => {
  const { dongDuLieuThat } = await import(SND);
  const d = mkdtempSync(path.join(tmpdir(), "pt-dong-"));
  const so = path.join(d, "lan-chay.jsonl");
  assert.equal(dongDuLieuThat(true, so), "ca dữ liệu thật: chạy trong lượt này");
  assert.equal(dongDuLieuThat(false, so), "ca dữ liệu thật: không kích — chưa có lần xanh nào trên main");
  writeFileSync(so, [
    { ngay: "2026-11-24", sha: "aaaaaaaaa111", ket_qua: "xanh", ca_do: [] },
    { ngay: "2026-11-25", sha: "bbbbbbbbb222", ket_qua: "xanh", ca_do: [] },
    { ngay: "2026-11-26", sha: "ccccccccc333", ket_qua: "do", ca_do: ["X"] },
  ].map((x) => JSON.stringify(x)).join("\n") + "\n");
  assert.equal(dongDuLieuThat(false, so), "ca dữ liệu thật: không kích — lần xanh gần nhất trên main: 2026-11-25 (bbbbbbbbb); ĐỎ mới hơn: 2026-11-26 (ccccccccc) — ca đỏ: X");
});

test("suite-neu-doi in dòng ca dữ liệu thật vào đầu ra suite pipeline_that (lệnh thật, sổ qua PIPELINE_THAT_SO)", () => {
  const d = mkdtempSync(path.join(tmpdir(), "pt-snd-"));
  const so = path.join(d, "lan-chay.jsonl");
  writeFileSync(so, JSON.stringify({ ngay: "2026-11-25", sha: "deadbeef0123", ket_qua: "xanh", ca_do: [] }) + "\n");
  // SUITE_NEU_DOI=chay ép chạy → dòng «chạy trong lượt này», trước dòng «chạy pipeline_that»
  const r = spawnSync(process.execPath, [SND, "pipeline_that", "--", "true"], {
    encoding: "utf8", env: { ...process.env, PIPELINE_THAT_SO: so, SUITE_NEU_DOI: "chay" },
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^ca dữ liệu thật: chạy trong lượt này$/m);
});

test("chiều đỏ: sổ chỉ có lần đỏ → không in «lần xanh gần nhất» kèm ngày", async () => {
  const { dongDuLieuThat } = await import(SND);
  const d = mkdtempSync(path.join(tmpdir(), "pt-do-"));
  const so = path.join(d, "lan-chay.jsonl");
  writeFileSync(so, JSON.stringify({ ngay: "2026-11-26", sha: "ccccccccc333", ket_qua: "do", ca_do: ["X"] }) + "\n");
  const ghim = (dong) => { if (/lần xanh gần nhất trên main: \d{4}-/.test(dong)) throw new Error(`in lần xanh từ sổ không có lần xanh: ${dong}`); };
  ghim(dongDuLieuThat(false, so));
  assert.equal(dongDuLieuThat(false, so), "ca dữ liệu thật: không kích — chưa có lần xanh nào trên main; ĐỎ mới nhất: 2026-11-26 (ccccccccc) — ca đỏ: X");
  // bản sao phá: lấy dòng cuối bất kể xanh/đỏ → phép ghim phải đỏ
  const goc = readFileSync(SND, "utf8");
  const pha = goc.replace('if (d.ket_qua === "xanh") xanh = d;', "xanh = d;")
    .replace('from "./pipeline-that-hang-ngay.mjs"', `from ${JSON.stringify(path.join(import.meta.dirname, "pipeline-that-hang-ngay.mjs"))}`);
  assert.notEqual(pha, goc, "bản sao phải khác bản thật");
  const ban = path.join(d, "suite-neu-doi-pha.mjs");
  writeFileSync(ban, pha);
  const { dongDuLieuThat: phaDong } = await import(ban);
  assert.throws(() => ghim(phaDong(false, so)), /in lần xanh từ sổ không có lần xanh/);
});

// ── HT30 dong-du-lieu-that-neu-lan-do-moi-nhat: dòng nêu lần ĐỎ mới nhất, sổ không đọc được ─────────────────────────────
const KH = "ca dữ liệu thật: không kích — ";
const soTam = (dong) => {
  const d = mkdtempSync(path.join(tmpdir(), "ht30-"));
  const so = path.join(d, "lan-chay.jsonl");
  writeFileSync(so, dong.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join("\n") + "\n");
  return so;
};
const X = (ngay, sha = "aaaaaaaaa111") => ({ ngay, sha, ket_qua: "xanh", ca_do: [] });
const D = (ngay, ca_do, sha = "ccccccccc333") => ({ ngay, sha, ket_qua: "do", ...(ca_do === undefined ? {} : { ca_do }) });
/** Bản sao suite-neu-doi.mjs đã thay `cu` bằng `moi` — chiều đỏ trên cùng fixture. */
async function banPha(cu, moi) {
  const goc = readFileSync(SND, "utf8");
  assert.ok(goc.includes(cu), `mỏ neo «${cu.slice(0, 40)}…» không còn — thước mất mỏ neo`);
  const ban = path.join(mkdtempSync(path.join(tmpdir(), "ht30-pha-")), "suite-neu-doi-pha.mjs");
  writeFileSync(ban, goc.replace(cu, moi));
  return import(ban);
}

test("HT30-AC-1 xanh rồi ĐỎ mới hơn: nêu cả hai; tên ca 1 · 3 · 4 (+1); rỗng và thiếu khoá → không bóc được tên ca", async () => {
  const { dongDuLieuThat } = await import(SND);
  const MA_TRAN = [
    [["A"], "A"],
    [["A", "B", "C"], "A; B; C"],
    [["A", "B", "C", "D"], "A; B; C (+1)"],
    [[], "không bóc được tên ca"],
    [undefined, "không bóc được tên ca"],
  ];
  for (const [ca, chu] of MA_TRAN) {
    const dong = dongDuLieuThat(false, soTam([X("2026-11-25"), D("2026-11-26", ca)]));
    assert.equal(dong, `${KH}lần xanh gần nhất trên main: 2026-11-25 (aaaaaaaaa); ĐỎ mới hơn: 2026-11-26 (ccccccccc) — ca đỏ: ${chu}`);
    if (ca?.length === 3) assert.doesNotMatch(dong, /\(\+/);
  }
  // Dòng sổ từ bên ghi thật: pipeline-that-hang-ngay.mjs chạy xanh rồi đỏ trên một kho main tạm.
  const k = kho();
  assert.equal(chay(k, "exit 0").status, 0);
  assert.equal(chay(k, "printf '✖ CA-MOT (1ms)\\n✖ CA-HAI (2ms)\\n'; exit 1").status, 1);
  const [xanh, doMoi] = dongSo(k);
  assert.equal(dongDuLieuThat(false, k.so),
    `${KH}lần xanh gần nhất trên main: ${xanh.ngay} (${k.sha.slice(0, 9)}); ĐỎ mới hơn: ${doMoi.ngay} (${k.sha.slice(0, 9)}) — ca đỏ: CA-MOT; CA-HAI`);
  // Chiều đỏ: bản sao bỏ nhánh đỏ-mới-hơn (dòng cuối đỏ coi như xanh) → giấu lần đỏ.
  const { dongDuLieuThat: pha } = await banPha('if (!cuoi || cuoi.ket_qua === "xanh") {', "if (true) {");
  const ghim = (s) => { if (!/ĐỎ mới hơn/.test(s)) throw new Error(`giấu lần đỏ mới hơn: ${s}`); };
  ghim(dongDuLieuThat(false, k.so));
  assert.throws(() => ghim(pha(false, k.so)), /giấu lần đỏ mới hơn/);
});

test("HT30-AC-2 chỉ ĐỎ: «chưa có lần xanh nào; ĐỎ mới nhất», không bao giờ «lần xanh gần nhất» kèm ngày", async () => {
  const { dongDuLieuThat } = await import(SND);
  const dong = dongDuLieuThat(false, soTam([D("2026-11-24", ["P"]), D("2026-11-26", ["Q", "R"])]));
  assert.equal(dong, `${KH}chưa có lần xanh nào trên main; ĐỎ mới nhất: 2026-11-26 (ccccccccc) — ca đỏ: Q; R`);
  assert.doesNotMatch(dong, /lần xanh gần nhất trên main: \d{4}-/);
});

test("HT30-AC-3 giữ chữ bản HT9: dòng cuối xanh sau đỏ cũ · sổ vắng · sổ rỗng · kích", async () => {
  const { dongDuLieuThat } = await import(SND);
  const MA_TRAN = [
    [false, soTam([D("2026-11-24", ["P"]), X("2026-11-25", "bbbbbbbbb222")]), `${KH}lần xanh gần nhất trên main: 2026-11-25 (bbbbbbbbb)`],
    [false, path.join(mkdtempSync(path.join(tmpdir(), "ht30-vang-")), "khong-co.jsonl"), `${KH}chưa có lần xanh nào trên main`],
    [false, soTam([""]), `${KH}chưa có lần xanh nào trên main`],
    [true, null, "ca dữ liệu thật: chạy trong lượt này"],
  ];
  for (const [kich, so, mong] of MA_TRAN) assert.equal(dongDuLieuThat(kich, so), mong);
});

test("HT30-AC-4 không đọc được sổ: ngoài kho git · đường là thư mục · dòng cuối hỏng; dòng giữa hỏng thì bỏ qua", async () => {
  const { dongDuLieuThat, duongSo } = await import(SND);
  const ngoai = mkdtempSync(path.join(tmpdir(), "ht30-ngoai-"));
  const cu = process.env.PIPELINE_THAT_SO;
  delete process.env.PIPELINE_THAT_SO;
  try { assert.equal(duongSo(ngoai), null); } finally { if (cu !== undefined) process.env.PIPELINE_THAT_SO = cu; }
  assert.match(dongDuLieuThat(false, null), /^ca dữ liệu thật: không kích — không đọc được sổ soát hằng ngày \(/);
  assert.match(dongDuLieuThat(false, ngoai), /^ca dữ liệu thật: không kích — không đọc được sổ soát hằng ngày \(EISDIR\)$/);
  assert.equal(dongDuLieuThat(false, soTam([X("2026-11-25"), '{"ngay":"2026-11-26","sha":"cc'])),
    `${KH}không đọc được sổ soát hằng ngày (dòng cuối hỏng)`);
  assert.equal(dongDuLieuThat(false, soTam([X("2026-11-25"), "{hỏng", D("2026-11-26", ["Z"])])),
    `${KH}lần xanh gần nhất trên main: 2026-11-25 (aaaaaaaaa); ĐỎ mới hơn: 2026-11-26 (ccccccccc) — ca đỏ: Z`);
  // Lệnh thật: suite-neu-doi chạy ngoài kho git, không PIPELINE_THAT_SO → dòng «không đọc được sổ».
  const env = { ...process.env, SUITE_NEU_DOI: "", SUITE_NEU_DOI_BASE: "" };
  delete env.PIPELINE_THAT_SO;
  const r = spawnSync(process.execPath, [SND, "pipeline_that", "--", "true"], { cwd: ngoai, encoding: "utf8", env });
  assert.match(r.stdout, /^ca dữ liệu thật: (chạy trong lượt này|không kích — không đọc được sổ soát hằng ngày \(.+\))$/m, r.stdout + r.stderr);
  // Chiều đỏ: bản sao duongSo cũ (rơi về đường tương đối) → dòng in như sổ trống.
  const { dongDuLieuThat: phaDong, duongSo: phaDuong } = await banPha(
    'if (r.status !== 0 || !path.isAbsolute(common)) return null;', "");
  const ghim = (s) => { if (/chưa có lần xanh nào trên main$/.test(s)) throw new Error(`sổ không đọc được trông như sổ trống: ${s}`); };
  delete process.env.PIPELINE_THAT_SO;
  try {
    ghim(dongDuLieuThat(false, duongSo(ngoai)));
    assert.throws(() => ghim(phaDong(false, phaDuong(ngoai))), /sổ không đọc được trông như sổ trống/);
  } finally { if (cu !== undefined) process.env.PIPELINE_THAT_SO = cu; }
});

