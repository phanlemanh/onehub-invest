// thu-duoi-moc-symlink.test.mjs — claudedp-2611-23: cắt mốc phải chạy đúng dù gọi qua SYMLINK
// (cài lịch từ ~/dev/one-invest — symlink tới kho — thì plist mang đường symlink; khuôn cũ so
// import.meta.url với process.argv[1] chưa chuẩn hoá → CLI thoát 0 IM LẶNG, mốc lớn dần mãi).
// Yêu cầu 2611-23: chạy đúng qua symlink lẫn đường thật; lệnh không làm gì cũng không được
// im lặng thoát 0. Cùng mẫu AC-3 của pipeline/scripts/entrypoint-symlink.test.mjs (main).
// Chạy: HOME="$(mktemp -d)" node --test scripts/thu-duoi-moc-symlink.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

const NUT = dirname(process.execPath);
const MOC_LIB = new URL("../lib/thu-duoi-moc.mjs", import.meta.url).pathname;

function dung(goc, soId) {
  const home = mkdtempSync(join(tmpdir(), "mocsym-"));
  mkdirSync(goc, { recursive: true });
  const ids = Array.from({ length: soId }, (_, i) => 10_000 + i);
  writeFileSync(join(goc, "moc.json"), JSON.stringify({ daCo: ids }));
  return { home, ids };
}
const chay = (home, link, goc, tran) =>
  spawnSync(process.execPath, [link, goc, String(tran)], {
    env: { PATH: `${NUT}:/bin:/usr/bin`, HOME: home }, encoding: "utf8", timeout: 30_000,
  });

test("2611-23 gọi qua SYMLINK: cắt mốc đúng trần và CÓ in kết quả (khuôn cũ im lặng thoát 0 → đỏ)", () => {
  const goc = join(tmpdir(), "mocsym-goc-", String(Date.now()));
  const { home, ids } = dung(goc, 250);
  const link = join(home, "moc-via-link.mjs");
  symlinkSync(MOC_LIB, link);
  try {
    const r = chay(home, link, goc, 200);
    assert.equal(r.status, 0, `thoát 0 — stderr=${r.stderr?.slice(0, 200)}`);
    assert.ok((r.stdout || "").trim().length > 0, "không được im lặng: phải in JSON kết quả cắt");
    const kq = JSON.parse(r.stdout.trim().split("\n").at(-1));
    assert.equal(kq.daCat, true, "mốc 250 id, trần 200 → phải cắt");
    const sau = JSON.parse(readFileSync(join(goc, "moc.json"), "utf8")).daCo;
    assert.equal(sau.length, 200, "mốc sau cắt còn đúng trần");
    assert.deepEqual(sau, ids.slice(-200), "giữ N id CUỐI");
  } finally { rmSync(home, { recursive: true, force: true }); rmSync(goc, { recursive: true, force: true }); }
});

test("2611-23 gọi qua ĐƯỜNG THẬT vẫn cắt đúng (đối chứng)", () => {
  const goc = join(tmpdir(), "mocsym-goc2-", String(Date.now()));
  const { home, ids } = dung(goc, 250);
  try {
    const r = chay(home, MOC_LIB, goc, 200);
    assert.equal(r.status, 0);
    const kq = JSON.parse(r.stdout.trim().split("\n").at(-1));
    assert.equal(kq.daCat, true);
    assert.equal(JSON.parse(readFileSync(join(goc, "moc.json"), "utf8")).daCo.length, 200);
    assert.deepEqual(JSON.parse(readFileSync(join(goc, "moc.json"), "utf8")).daCo, ids.slice(-200));
  } finally { rmSync(home, { recursive: true, force: true }); rmSync(goc, { recursive: true, force: true }); }
});

test("2611-23 không làm gì cũng KHÔNG im lặng: moc.json thiếu → in JSON lyDo, thoát 0", () => {
  const goc = join(tmpdir(), "mocsym-goc3-", String(Date.now()));
  const { home } = dung(goc, 0);
  rmSync(join(goc, "moc.json"));
  const link = join(home, "moc-via-link.mjs");
  symlinkSync(MOC_LIB, link);
  try {
    const r = chay(home, link, goc, 200);
    assert.equal(r.status, 0);
    assert.ok((r.stdout || "").trim().length > 0, "không im lặng khi không làm gì");
    const kq = JSON.parse(r.stdout.trim().split("\n").at(-1));
    assert.equal(kq.daCat, false);
    assert.ok(kq.lyDo, "phải nêu lý do không cắt");
  } finally { rmSync(home, { recursive: true, force: true }); rmSync(goc, { recursive: true, force: true }); }
});
