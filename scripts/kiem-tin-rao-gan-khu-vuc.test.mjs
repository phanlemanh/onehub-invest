// do-khu-vuc-tu-dung-moi AC-3 (ba chiều của `kiem-tin-rao-gan-khu-vuc.mjs --thu` trên cùng DB local) · AC-4 (hàm so
// băm đỏ đúng bảng — thuần) · AC-5 (E8 của tin-rao-gan-khu-vuc-dung khai thay bởi AC-2 — đọc tĩnh).
// Chạy: node --test scripts/kiem-tin-rao-gan-khu-vuc.test.mjs
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { BANG_GHI, soBam } from "./kiem-tin-rao-gan-khu-vuc.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts/kiem-tin-rao-gan-khu-vuc.mjs");

const chay = (...args) => {
  const r = spawnSync(process.execPath, [SCRIPT, "--thu", ...args], { cwd: ROOT, encoding: "utf8", timeout: 240_000 });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
};
const dongMoi = (out) => [...out.matchAll(/^mồi (S0\d) (offer_\w+) → /gm)].map((m) => ({ nguon: m[1], id: m[2] }));

test("KDM-AC-3 ba chiều trên cùng DB", { timeout: 900_000 }, () => {
  const xanh = chay();
  assert.equal(xanh.code, 0, `bản thường phải exit 0:\n${xanh.out}`);
  assert.match(xanh.out, /^ok {3}trạng thái trước có 6 tin mồi trỏ khu vực không hợp lệ \(\+ \d+ tin thật\)$/m);
  assert.match(xanh.out, /^kiem-tin-rao-gan: PASS$/m);

  const khongSua = chay("--pha", "khong-sua");
  assert.equal(khongSua.code, 1, `--pha khong-sua phải exit 1:\n${khongSua.out}`);
  const moi = dongMoi(khongSua.out);
  assert.equal(moi.length, 6, "phải có sáu dòng tin mồi");
  const hong = khongSua.out.match(/^FAIL .* tin trỏ khu vực không hợp lệ hay khu vực mồi: (.*)$/m);
  assert.ok(hong, `khong-sua: thiếu dòng FAIL khối sau:\n${khongSua.out}`);
  for (const m of moi) assert.ok(hong[1].includes(m.id), `khong-sua: dòng FAIL không gọi tên tin mồi ${m.id}`);
  for (const s of ["S03", "S05", "S06"]) assert.match(khongSua.out, new RegExp(`^FAIL ${s}: 2 tin mồi → 0 về phường cũ$`, "m"));

  const moLoc = chay("--pha", "mo-loc");
  assert.equal(moLoc.code, 1, `--pha mo-loc phải exit 1:\n${moLoc.out}`);
  const roi = moLoc.out.match(/^FAIL .* tin trỏ khu vực không hợp lệ hay khu vực mồi: (.*)$/m);
  assert.ok(roi, `mo-loc: thiếu dòng FAIL «… tin trỏ khu vực mồi»:\n${moLoc.out}`);
  assert.ok(dongMoi(moLoc.out).some((m) => roi[1].includes(m.id)), `mo-loc: dòng FAIL không gọi tên tin mồi nào — ${roi[1]}`);
});

test("KDM-AC-4 so băm đỏ đúng bảng", () => {
  const goc = Object.fromEntries([...BANG_GHI, "ops_audit"].map((t, i) => [t, { n: i, h: `h${i}` }]));
  assert.deepEqual(soBam(goc, structuredClone(goc)), [], "băm bằng nhau → không bảng nào lệch");
  const sau = structuredClone(goc);
  sau.review_queue.h = "khac";
  sau.ops_audit.n += 1;
  assert.deepEqual(soBam(goc, sau), ["review_queue", "ops_audit"], "phải gọi đúng hai bảng lệch");
});

/** Lỗi khai thay của E8 trong một evals.yaml, [] khi đúng. */
export function kiemE8(yaml) {
  const khoi = Object.fromEntries(yaml.split(/^ {2}- id: /m).slice(1).map((b) => [b.split("\n")[0].trim(), b]));
  const loi = [];
  const e8 = khoi.E8 ?? "";
  if (!/^ {4}status: not-run$/m.test(e8)) loi.push("E8 thiếu status: not-run");
  if (!/^ {4}superseded_by: do-khu-vuc-tu-dung-moi#AC-2$/m.test(e8)) loi.push("E8 thiếu superseded_by: do-khu-vuc-tu-dung-moi#AC-2");
  if (!/^ {4}cmd: config:executors\.script\.tin_rao_gan_do$/m.test(e8)) loi.push("E8 đổi cmd");
  for (const id of ["E1", "E2", "E3", "E4", "E5", "E6", "E7"]) {
    if (!khoi[id]) loi.push(`${id} vắng`);
    else if (/^ {4}(status|superseded_by):/m.test(khoi[id])) loi.push(`${id} khai status/superseded_by`);
  }
  return loi;
}

test("KDM-AC-5 E8 cũ khai thay bởi AC-2", () => {
  const yaml = readFileSync(path.join(ROOT, "_acceptance/tin-rao-gan-khu-vuc-dung/evals.yaml"), "utf8");
  assert.deepEqual(kiemE8(yaml), []);
  const doc = readFileSync(path.join(ROOT, "docs/superpowers/specs/2026-10-26-do-khu-vuc-tu-dung-moi-design.md"), "utf8");
  assert.ok(doc.includes("`tin-rao-gan-khu-vuc-dung/E8`"), "design doc thiếu thẻ tin-rao-gan-khu-vuc-dung/E8");
  // Chiều đỏ: bản chép bỏ superseded_by
  const hong = yaml.replace(/^ {4}superseded_by: .*\n/m, "");
  assert.ok(kiemE8(hong).some((l) => l.startsWith("E8 thiếu superseded_by")), "bỏ superseded_by mà hàm kiểm không gọi tên E8");
});
