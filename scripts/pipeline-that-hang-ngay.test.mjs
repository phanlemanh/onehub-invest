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
  assert.equal(dongDuLieuThat(false, so), "ca dữ liệu thật: không kích — lần xanh gần nhất trên main: 2026-11-25 (bbbbbbbbb)");
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
  assert.equal(dongDuLieuThat(false, so), "ca dữ liệu thật: không kích — chưa có lần xanh nào trên main");
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
