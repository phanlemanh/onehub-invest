import test from "node:test"; import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(fileURLToPath(import.meta.url + "/../.."));

/** Fixture "repo giả": chép script + plist khuôn, dựng dist/src/launcher/key
 *  trong HOME giả — không launchctl thật, không đụng ~/.openclaw thật. */
function fixture({ distMoiHon = true, coKey = true, nodeHopLe = true } = {}) {
  const S = mkdtempSync(join(tmpdir(), "zc4-install-"));
  const root = join(S, "repo");
  for (const d of ["scripts", "pipeline/cron", "collector/src/api", "collector/dist/api", "collector/scripts"]) {
    mkdirSync(join(root, d), { recursive: true });
  }
  cpSync(join(REPO, "scripts/install-collector-api.sh"), join(root, "scripts/install-collector-api.sh"));
  cpSync(join(REPO, "pipeline/cron/com.oneinvest.collector-api.plist"), join(root, "pipeline/cron/com.oneinvest.collector-api.plist"));
  writeFileSync(join(root, "collector/src/api/main.ts"), "export {}; // nguồn\n");
  writeFileSync(join(root, "collector/dist/api/main.js"), "// build\n");
  const gio = Date.now() / 1000;
  utimesSync(join(root, "collector/src/api/main.ts"), new Date(gio - 1000), new Date(gio - 1000));
  utimesSync(join(root, "collector/dist/api/main.js"), new Date(gio + (distMoiHon ? 1000 : -5000)), new Date(gio + (distMoiHon ? 1000 : -5000)));
  writeFileSync(join(root, "collector/scripts/api-launchd.sh"), `#!/bin/bash\nexec ${nodeHopLe ? "/usr/bin/true" : "/khong/co/node"} dist/api/main.js\n`);
  const home = join(S, "home");
  mkdirSync(join(home, ".openclaw/credentials"), { recursive: true });
  if (coKey) writeFileSync(join(home, ".openclaw/credentials/oneinvest-agent.key"), "k1");
  return { S, root, home, cleanup: () => rmSync(S, { recursive: true, force: true }) };
}

const chay = (fx, ...args) => {
  const r = spawnSync("bash", [join(fx.root, "scripts/install-collector-api.sh"), ...args], {
    env: { HOME: fx.home, PATH: "/usr/bin:/bin" },
    encoding: "utf8",
    timeout: 30_000,
  });
  return { code: r.status, out: r.stdout + r.stderr };
};

test("--dry: in plist đã thế __ROOT__ + cặp lệnh triển khai, KHÔNG ghi tệp nào", () => {
  const fx = fixture();
  try {
    const r = chay(fx, "--dry");
    assert.equal(r.code, 0, `dry phải exit 0 (out: ${r.out})`);
    assert.ok(!r.out.includes("__ROOT__"), "không còn __ROOT__ trong plist in ra");
    assert.ok(r.out.includes(fx.root), "plist in ra chứa đường dẫn root giả");
    assert.ok(r.out.includes("launchctl bootstrap"), "dry in cặp lệnh triển khai");
    assert.ok(!existsSync(join(fx.home, "Library/LaunchAgents/com.oneinvest.collector-api.plist")), "dry KHÔNG ghi tệp");
  } finally {
    fx.cleanup();
  }
});

test("cài thật: ghi plist vào LaunchAgents của HOME giả, plutil sạch, chmod 600, chỉ IN lệnh launchctl", () => {
  const fx = fixture();
  try {
    const r = chay(fx);
    const out = join(fx.home, "Library/LaunchAgents/com.oneinvest.collector-api.plist");
    assert.equal(r.code, 0, `cài phải exit 0 (out: ${r.out})`);
    assert.ok(existsSync(out), "plist đã ghi vào HOME giả");
    const nd = readFileSync(out, "utf8");
    assert.ok(!nd.includes("__ROOT__") && nd.includes(fx.root), "__ROOT__ đã thế đúng");
    const lint = spawnSync("plutil", ["-lint", out], { encoding: "utf8" });
    assert.equal(lint.status, 0, "plutil -lint sạch");
    const mode = spawnSync("stat", ["-f", "%Lp", out], { encoding: "utf8" }).stdout.trim();
    assert.equal(mode, "600", "quyền 600");
    assert.ok(r.out.includes("launchctl bootstrap") && r.out.includes("TRIỂN KHAI"), "in cặp lệnh + nhãn TRIỂN KHAI");
  } finally {
    fx.cleanup();
  }
});

test("kiểm trước chặn: dist cũ hơn src / thiếu khoá / node không có — exit ≠0, không ghi", () => {
  for (const [ten, fx] of [
    ["dist cũ hơn src", fixture({ distMoiHon: false })],
    ["thiếu tệp khoá", fixture({ coKey: false })],
    ["node của launcher không tồn tại", fixture({ nodeHopLe: false })],
  ]) {
    try {
      const r = chay(fx);
      assert.notEqual(r.code, 0, `${ten}: phải exit ≠0`);
      assert.ok(r.out.includes("lỗi:"), `${ten}: thông báo lỗi rõ`);
      assert.ok(!existsSync(join(fx.home, "Library/LaunchAgents/com.oneinvest.collector-api.plist")), `${ten}: không ghi tệp`);
    } finally {
      fx.cleanup();
    }
  }
});
