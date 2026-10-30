// node --test scripts/nap-ts-order.test.mjs
// Mở lại 2310-8 vòng 3: TS_RE cũ '[0-9]{6}(Z)?$' loại MỌI snapshot sau khi
// storage.ts (b0898fe) đặt tên mili-giây + hậu tố '-n' khi trùng ms —
// zalo-import-daily và apify-facebook-daily sẽ bỏ mọi snapshot Zalo mới mà
// không báo lỗi. Chạy CHÍNH hai tệp bọc (chép sang cây tạm, HOME/PATH giả,
// node giả ghi lại lượt nạp): 6 chữ số / 9 chữ số / '-1' nạp đúng thứ tự;
// '__TEST' / '__e2e' bị bỏ có log; state 6 số cũ không cản snapshot ms mới.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync,
  rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// realpath: tmpdir() của macOS là symlink (/var → /private/var)
const SCRATCH = mkdtempSync(path.join(realpathSync(tmpdir()), "nap-ts-"));

const TS_RE_CANONICAL = String.raw`^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{6}([0-9]{3})?(-[0-9]+)?Z?$`;

const NODE_SHIM = `#!/bin/bash
# node giả: import-airbnb ghi snapshot vào $CALLS; mọi bước khác thoát 0
case "$1" in
  */pipeline/import-airbnb.mjs) printf '%s\\n' "$2" >> "$CALLS" ;;
esac
exit 0
`;

let treeSeq = 0;
function buildTree(scriptName) {
  const base = path.join(SCRATCH, `${scriptName}-${++treeSeq}`);
  const t = {
    home: path.join(base, "home"),
    bin: path.join(base, "bin"),
    root: path.join(base, "root"),
    calls: path.join(base, "calls.txt"),
  };
  for (const d of [
    t.home, t.bin,
    path.join(t.root, "scripts", "lib"),
    path.join(t.root, "pipeline", "logs"),
    path.join(t.root, "collector", "snapshots", "hanoi"),
    path.join(t.root, "agent"), // bước enrich-run cuối zalo-import-daily chạy trong agent/ (enrich-chay-sau-nap)
  ]) mkdirSync(d, { recursive: true });
  copyFileSync(path.join(REPO, "scripts", scriptName), path.join(t.root, "scripts", scriptName));
  copyFileSync(path.join(REPO, "scripts", "lib", "job-step.sh"), path.join(t.root, "scripts", "lib", "job-step.sh"));
  writeFileSync(path.join(t.bin, "node"), NODE_SHIM, { mode: 0o755 });
  return t;
}

function snapDir(t, name) {
  const d = path.join(t.root, "collector", "snapshots", "hanoi", name);
  mkdirSync(d, { recursive: true });
  // 2510-8: tệp bọc chỉ nạp thư mục đã có manifest (thiếu manifest < 30′ = đang ghi → dừng chuỗi)
  writeFileSync(path.join(d, "manifest.json"), "{}\n");
}

function runScript(t, scriptName) {
  return spawnSync("bash", [path.join(t.root, "scripts", scriptName)], {
    env: {
      ...process.env,
      HOME: t.home, // không có ~/.local/node-v24… thật và ~/.openclaw thật
      PATH: `${t.bin}:/usr/bin:/bin`,
      CALLS: t.calls,
      DATABASE_URL: "vo-hieu-vi-moi-node-deu-la-shim", // không có DB thật trong test
    },
    encoding: "utf8",
    timeout: 60_000,
  });
}

function stateOf(t) {
  return readFileSync(path.join(t.root, "pipeline", "logs", "apify-daily.state"), "utf8").trim();
}

function calls(t) {
  try {
    return readFileSync(t.calls, "utf8").trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

const REAL_SNAPS = [
  "hanoi__zalo-agent__2026-10-24T235959", // giây — khuôn cũ (:9210 đang chạy)
  "hanoi__zalo-agent__2026-10-25T021827", // giây, cùng giây với bản ms dưới
  "hanoi__zalo-agent__2026-10-25T021827756", // mili-giây — storage.ts b0898fe
  "hanoi__zalo-agent__2026-10-25T021827756-1", // trùng ms → hậu tố '-n'
  "hanoi__zalo-agent__TEST",
  "hanoi__zalo-agent__e2e",
];

test("TS_RE trong hai tệp bọc phải là cùng một bản canonical (BÁO 2510-5)", () => {
  for (const f of ["apify-facebook-daily.sh", "zalo-import-daily.sh"]) {
    const src = readFileSync(path.join(REPO, "scripts", f), "utf8");
    const m = src.match(/^TS_RE='(.*)'$/m);
    assert.ok(m, `${f} phải khai báo TS_RE=`);
    assert.equal(m[1], TS_RE_CANONICAL, `${f} TS_RE phải đúng khuôn ms + '-n'`);
  }
});

for (const scriptName of ["apify-facebook-daily.sh", "zalo-import-daily.sh"]) {
  test(`${scriptName}: 6 số / 9 số / '-1' nạp đúng thứ tự; __TEST, __e2e bỏ có log`, () => {
    const t = buildTree(scriptName);
    for (const s of REAL_SNAPS) snapDir(t, s);
    const r = runScript(t, scriptName);
    assert.equal(r.status, 0, `script phải xanh (stderr: ${r.stderr})`);
    assert.deepEqual(
      calls(t).map((c) => path.basename(c)),
      [
        "hanoi__zalo-agent__2026-10-24T235959",
        "hanoi__zalo-agent__2026-10-25T021827",
        "hanoi__zalo-agent__2026-10-25T021827756",
        "hanoi__zalo-agent__2026-10-25T021827756-1",
      ],
    );
    assert.match(r.stderr, /bỏ qua thư mục TS không phải mốc thời gian: .*__TEST/);
    assert.match(r.stderr, /bỏ qua thư mục TS không phải mốc thời gian: .*__e2e/);
    assert.equal(stateOf(t), "2026-10-25T021827756-1");
  });

  test(`${scriptName}: state 6 số cũ không cản snapshot mili-giây mới`, () => {
    const t = buildTree(scriptName);
    for (const s of REAL_SNAPS) snapDir(t, s);
    writeFileSync(path.join(t.root, "pipeline", "logs", "apify-daily.state"), "2026-10-25T021827");
    const r = runScript(t, scriptName);
    assert.equal(r.status, 0);
    assert.deepEqual(
      calls(t).map((c) => path.basename(c)),
      ["hanoi__zalo-agent__2026-10-25T021827756", "hanoi__zalo-agent__2026-10-25T021827756-1"],
    );
  });

  test(`${scriptName}: không có gì mới hơn state → không nạp, state giữ nguyên`, () => {
    const t = buildTree(scriptName);
    for (const s of REAL_SNAPS) snapDir(t, s);
    writeFileSync(path.join(t.root, "pipeline", "logs", "apify-daily.state"), "2026-10-26T000000000");
    const r = runScript(t, scriptName);
    assert.equal(r.status, 0);
    assert.deepEqual(calls(t), []);
    assert.equal(stateOf(t), "2026-10-26T000000000");
  });
}

test.after(() => rmSync(SCRATCH, { recursive: true, force: true }));
