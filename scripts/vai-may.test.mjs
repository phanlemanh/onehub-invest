// vai-may.test.mjs — hồ sơ pipeline-that-ca-may-thu-co-ten-tren-may-phat-trien (HT33) E1–E4: vai máy đọc từ tệp hai máy,
// chay-that.mjs bỏ qua có tên, có đếm các ca chỉ máy thu khi vai là máy phát triển; máy thu chạy đủ. Mỗi ca có chiều đỏ.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.join(import.meta.dirname, "..");
const THAT = path.join(ROOT, "pipeline/chay-that.mjs");
const DS = JSON.parse(readFileSync(path.join(ROOT, "scripts/ci-bo-qua.json"), "utf8")).pipeline;
const tam = () => mkdtempSync(path.join(tmpdir(), "ht33-"));
const tepVai = (text) => { const f = path.join(tam(), "hai-may.env"); writeFileSync(f, text); return f; };
const ENV = (tep) => { const e = { ...process.env, ONEHUB_HAI_MAY_TEP: tep }; delete e.NODE_TEST_CONTEXT; return e; };
const liet = (tep, extra = {}, args = []) => spawnSync(process.execPath, [THAT, ...args, "--liet"], { encoding: "utf8", env: { ...ENV(tep), ...extra } });
const caChay = (r) => r.stdout.split("\n").filter((l) => l && !l.startsWith("pipeline/"));

test("HT33-AC-1 vaiMay: ma trận mười một ô; chỉ đúng may-phat-trien mới nới", async () => {
  const { vaiMay } = await import(path.join(ROOT, "scripts/lib/vai-may.mjs"));
  const MA_TRAN = [
    ["vắng", null, "may-thu"],
    ["may-thu", "VAI=may-thu\n", "may-thu"],
    ["may-phat-trien", "VAI=may-phat-trien\n", "may-phat-trien"],
    ["ngoặc kép", 'VAI="may-phat-trien"\n', "may-phat-trien"],
    ["export", "export VAI=may-phat-trien\n", "may-phat-trien"],
    ["CRLF", "X=1\r\nVAI=may-phat-trien\r\n", "may-phat-trien"],
    ["khoảng trắng cuối", "VAI=may-phat-trien   \n", "may-phat-trien"],
    ["lạ", "VAI=may-khac\n", "may-thu"],
    ["chú thích", "# VAI=may-phat-trien\n", "may-thu"],
    ["không dòng VAI=", "CAU_GIAO_DIEN=bridge0\n", "may-thu"],
    ["hai dòng VAI= (dòng cuối)", "VAI=may-phat-trien\nVAI=may-thu\n", "may-thu"],
  ];
  const ra = MA_TRAN.map(([ten, text]) => [ten, vaiMay({ tep: text === null ? path.join(tam(), "khong-co.env") : tepVai(text) })]);
  assert.deepEqual(ra, MA_TRAN.map(([ten, , mong]) => [ten, mong]));
  // Chiều đỏ: bản sao coi tệp vắng là máy phát triển.
  const goc = readFileSync(path.join(ROOT, "scripts/lib/vai-may.mjs"), "utf8");
  const cu = "try { text = readFileSync(tep, \"utf8\"); } catch { return VAI_THU; }";
  assert.ok(goc.includes(cu), "mỏ neo đọc tệp không còn");
  const ban = path.join(tam(), "vai-may-pha.mjs");
  writeFileSync(ban, goc.replace(cu, "try { text = readFileSync(tep, \"utf8\"); } catch { return VAI_PHAT_TRIEN; }"));
  const { vaiMay: pha } = await import(pathToFileURL(ban).href);
  const ghim = (v) => { if (v !== "may-thu") throw new Error("không đọc được vai mà vẫn nới"); };
  ghim(vaiMay({ tep: path.join(tam(), "khong-co.env") }));
  assert.throws(() => ghim(pha({ tep: path.join(tam(), "khong-co.env") })), /không đọc được vai mà vẫn nới/);
});

test("HT33-AC-2 vai may-phat-trien: bỏ đúng ca may_thu, có tên, có đếm; ca khác vẫn chạy; CI không đổi gì", () => {
  const f = tepVai("VAI=may-phat-trien\n");
  const MAY_THU = DS.filter((m) => m.may_thu);
  const r = liet(f);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(caChay(r).sort(), DS.filter((m) => !m.may_thu).map((m) => m.ca).sort());
  assert.match(r.stderr, new RegExp(`^chay-that: vai may-phat-trien — bỏ qua ${MAY_THU.length} ca chỉ máy thu$`, "m"));
  for (const m of MAY_THU) assert.ok(r.stderr.includes(`bỏ qua (chỉ máy thu) — ${m.tep} — ${m.ca} — ${m.may_thu}`), `thiếu dòng cho «${m.ca}»`);
  assert.deepEqual(liet(f, { CI: "true" }).stdout, r.stdout, "CI=true làm đổi tập chạy");
  // Chiều đỏ: bản sao bỏ lọc may_thu → máy phát triển chạy ca chỉ máy thu.
  const goc = readFileSync(THAT, "utf8");
  const cu = "const bo = vai === VAI_PHAT_TRIEN ? ds.filter((m) => m.may_thu) : [];";
  assert.ok(goc.includes(cu), "mỏ neo lọc không còn");
  const ban = path.join(path.dirname(THAT), `.ht33-pha-${process.pid}.mjs`);
  writeFileSync(ban, goc.replace(cu, "const bo = [];"));
  try {
    const rp = spawnSync(process.execPath, [ban, "--liet"], { encoding: "utf8", env: ENV(f) });
    const ghim = (ca) => { if (MAY_THU.some((m) => ca.includes(m.ca))) throw new Error("máy phát triển chạy ca chỉ máy thu"); };
    ghim(caChay(r));
    assert.throws(() => ghim(caChay(rp)), /máy phát triển chạy ca chỉ máy thu/);
  } finally { rmSync(ban, { force: true }); }
});

test("HT33-AC-3 vai may-thu và tệp vắng: chạy đủ mọi ca, không dòng bỏ qua", () => {
  for (const f of [tepVai("VAI=may-thu\n"), path.join(tam(), "khong-co.env")]) {
    const r = liet(f);
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(caChay(r).sort(), DS.map((m) => m.ca).sort());
    assert.match(r.stderr, new RegExp(`chay-that: vai may-thu — chạy đủ ${DS.length} ca`));
    assert.doesNotMatch(r.stderr, /bỏ qua/);
  }
});

test("HT33-AC-4 may_thu chỉ ở ON22-AC-10; lý do phải là chữ có nội dung", async () => {
  assert.deepEqual(DS.filter((m) => "may_thu" in m).map((m) => m.ca.split(" ")[0]), ["ON22-AC-10"]);
  const { loiDanhSach } = await import(path.join(ROOT, "scripts/lib/ci-can-du-lieu.mjs"));
  const goc = DS.find((m) => m.may_thu);
  for (const xau of ["", "   ", 3, true]) {
    const loi = loiDanhSach([{ ...goc, may_thu: xau }], ROOT);
    assert.ok(loi.some((l) => l.includes("khoá may_thu phải là lý do bằng chữ")), `may_thu=${JSON.stringify(xau)} lọt: ${loi}`);
    const d = tam();
    const ds = path.join(d, "ci-bo-qua.json");
    writeFileSync(ds, JSON.stringify({ pipeline: [{ ...goc, may_thu: xau }] }));
    const r = spawnSync(process.execPath, [THAT, "--danh-sach", ds, "--liet"], { encoding: "utf8", env: ENV(path.join(d, "khong-co")) });
    assert.equal(r.status, 2, `chay-that phải thoát 2 với may_thu=${JSON.stringify(xau)}`);
  }
  assert.deepEqual(loiDanhSach([goc], ROOT), []);
});
