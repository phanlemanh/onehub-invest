// Thước của scripts/dung-worktree-cham.sh (hồ sơ s4-suite-theo-vung, AC-7). Repo git tạm + worktree, không DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LENH = path.join(path.dirname(fileURLToPath(import.meta.url)), "dung-worktree-cham.sh");
const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const ghi = (f, s) => { mkdirSync(path.dirname(f), { recursive: true }); writeFileSync(f, s); };

// Checkout chính giả: .worktreeinclude + .gitignore đã commit; env, node_modules, types chưa theo dõi.
function dung(t, { nextGia = false } = {}) {
  const goc = realpathSync(mkdtempSync(path.join(tmpdir(), "dwc-")));
  t.after(() => rmSync(goc, { recursive: true, force: true }));
  const chinh = path.join(goc, "chinh");
  mkdirSync(chinh);
  git(chinh, "init", "-q", "-b", "main");
  git(chinh, "config", "user.email", "t@local.test");
  git(chinh, "config", "user.name", "t");
  ghi(path.join(chinh, ".worktreeinclude"), "app/.env.local\n**/.env\n");
  ghi(path.join(chinh, ".gitignore"), ".env\n.env.local\nnode_modules/\n.next/\nbi-mat.json\n");
  for (const d of ["app", "pipeline"]) { ghi(path.join(chinh, d, "package.json"), "{}\n"); ghi(path.join(chinh, d, "package-lock.json"), "{\"v\":1}\n"); }
  git(chinh, "add", "-A");
  git(chinh, "commit", "-qm", "goc");
  ghi(path.join(chinh, ".env"), "GOC=1\n");
  ghi(path.join(chinh, "app/.env.local"), "APP=2\n");
  ghi(path.join(chinh, "bi-mat.json"), "{\"k\":1}\n");
  ghi(path.join(chinh, "app/node_modules/x/index.js"), "\n");
  ghi(path.join(chinh, "pipeline/node_modules/pg/index.js"), "\n");
  ghi(path.join(chinh, "app/.next/dev/types/routes.d.ts"), "// tu chinh\n");
  if (nextGia) {
    const bin = path.join(chinh, "app/node_modules/.bin/next");
    ghi(bin, "#!/usr/bin/env bash\nmkdir -p .next/types && echo '// tu typegen' > .next/types/routes.d.ts\n");
    chmodSync(bin, 0o755);
  }
  const wt = path.join(goc, "wt");
  git(chinh, "worktree", "add", "-q", "-b", "viec", wt);
  return { chinh, wt };
}

const chay = (wt, ...a) => spawnSync("bash", [LENH, wt, ...a], { encoding: "utf8", env: { ...process.env } });

test("S4V-AC-7 — dựng worktree: env, node_modules, types; không ghi đè, không chép tệp ngoài .worktreeinclude; chạy lại không đổi", (t) => {
  const { chinh, wt } = dung(t);
  ghi(path.join(wt, "pipeline/.env"), "DICH=giu\n");
  ghi(path.join(chinh, "pipeline/.env"), "DICH=goc\n");
  const r = chay(wt, "--khong-tsc");
  assert.equal(r.status, 0, `S4V-AC-7 thoát ≠ 0: ${r.stdout}${r.stderr}`);
  assert.equal(readFileSync(path.join(wt, ".env"), "utf8"), "GOC=1\n", "S4V-AC-7 .env không chép nguyên nội dung");
  assert.equal(readFileSync(path.join(wt, "app/.env.local"), "utf8"), "APP=2\n", "S4V-AC-7 app/.env.local không chép");
  assert.equal(readFileSync(path.join(wt, "pipeline/.env"), "utf8"), "DICH=giu\n", "S4V-AC-7 env có sẵn ở đích bị ghi đè");
  assert.equal(existsSync(path.join(wt, "bi-mat.json")), false, "S4V-AC-7 tệp ngoài .worktreeinclude bị chép");
  assert.doesNotMatch(r.stdout, /GOC=1|APP=2/, "S4V-AC-7 in nội dung env");
  for (const d of ["app", "pipeline"]) {
    const nm = path.join(wt, d, "node_modules");
    assert.ok(lstatSync(nm).isSymbolicLink(), `S4V-AC-7 ${d}/node_modules không phải symlink`);
    assert.equal(readlinkSync(nm), path.join(chinh, d, "node_modules"), `S4V-AC-7 ${d}/node_modules trỏ sai`);
  }
  assert.equal(readFileSync(path.join(wt, "app/.next/dev/types/routes.d.ts"), "utf8"), "// tu chinh\n", "S4V-AC-7 types không chép từ checkout chính");
  const r2 = chay(wt, "--khong-tsc");
  assert.equal(r2.status, 0);
  assert.doesNotMatch(r2.stdout, /\bchép\b|\bnối\b|\bsinh\b/, `S4V-AC-7 lần hai còn đổi: ${r2.stdout}`);
});

test("S4V-AC-7 — next typegen có thì sinh types bằng nó; đích là checkout chính thì thoát 2, không tạo tệp", (t) => {
  const { chinh, wt } = dung(t, { nextGia: true });
  const r = chay(wt, "--khong-tsc");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /sinh app\/\.next\/dev\/types \(next typegen\)/);
  assert.equal(readFileSync(path.join(wt, "app/.next/dev/types/routes.d.ts"), "utf8").trim(), "// tu typegen", "S4V-AC-7 types không từ typegen");
  const truoc = git(chinh, "status", "--porcelain", "--ignored");
  const c = chay(chinh, "--khong-tsc");
  assert.equal(c.status, 2, "S4V-AC-7 đích = checkout chính mà không thoát 2");
  assert.match(c.stderr, /không dựng vào checkout chính/);
  assert.equal(git(chinh, "status", "--porcelain", "--ignored"), truoc, "S4V-AC-7 đã ghi vào checkout chính");
});

test("S4V-AC-7 — kiểm tsc: xanh thì thoát 0, đỏ thì thoát 1 và in «tsc: đỏ»", (t) => {
  const { wt } = dung(t);
  const bin = mkdtempSync(path.join(tmpdir(), "dwc-bin-"));
  t.after(() => rmSync(bin, { recursive: true, force: true }));
  const npx = path.join(bin, "npx");
  const voi = (ma) => {
    writeFileSync(npx, ma === 0 ? "#!/usr/bin/env bash\nexit 0\n" : "#!/usr/bin/env bash\necho 'src/x.ts(1,1): error TS2322: sai kiểu'\nexit 1\n");
    chmodSync(npx, 0o755);
    return spawnSync("bash", [LENH, wt], { encoding: "utf8", env: { ...process.env, PATH: `${bin}:${process.env.PATH}` } });
  };
  const xanh = voi(0);
  assert.equal(xanh.status, 0, xanh.stdout + xanh.stderr);
  assert.match(xanh.stdout, /^tsc: xanh$/m);
  const do_ = voi(1);
  assert.equal(do_.status, 1, "S4V-AC-7 tsc đỏ mà không thoát 1");
  assert.match(do_.stdout, /^tsc: đỏ \(1 dòng lỗi\)$/m);
  assert.match(do_.stdout, /error TS2322/);
});

test("S4V-AC-7 — lock lệch: không nối node_modules thư mục đó, in «lock lệch», thoát 3; node_modules checkout chính nguyên", (t) => {
  const { chinh, wt } = dung(t);
  ghi(path.join(wt, "app/package-lock.json"), "{\"v\":2}\n");
  const dem = () => execFileSync("find", [path.join(chinh, "app/node_modules")], { encoding: "utf8" }).trim().split("\n").length;
  const truoc = dem();
  const r = chay(wt, "--khong-tsc");
  assert.equal(r.status, 3, `S4V-AC-7 lock lệch mà không thoát 3: ${r.stdout}`);
  assert.match(r.stdout, /lock lệch: app/);
  assert.equal(existsSync(path.join(wt, "app/node_modules")), false, "S4V-AC-7 lock lệch mà vẫn nối app/node_modules");
  assert.ok(lstatSync(path.join(wt, "pipeline/node_modules")).isSymbolicLink(), "S4V-AC-7 pipeline (lock khớp) không được nối");
  assert.equal(dem(), truoc, "S4V-AC-7 node_modules của checkout chính bị đổi");
});
