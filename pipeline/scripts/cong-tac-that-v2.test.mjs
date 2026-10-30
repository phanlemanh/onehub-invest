import test from "node:test"; import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const REPO = fileURLToPath(new URL("../..", import.meta.url)); // pipeline/scripts → gốc repo
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * 2610-13 v2 (MỞ LẠI): `VD_KQ="$(node … vong-doi)"; VD_RC=$?` dưới set -e làm
 * script THOÁT NGẦM mã 3 khi vong-doi trả 3 — if không bao giờ chạy. Sửa:
 * `VD_RC=0; VD_KQ="$(…)" || VD_RC=$?`. Kiểm bằng CHÉP SCRIPT THẬT ra thư mục
 * tạm + vong-doi GIẢ (exit 0/3/2 theo env VONG_DOI_RC) đứng đầu PATH… không
 * được — script gọi `node $ROOT/pipeline/lib/vong-doi.mjs` — nên chép vong-doi
 * GIẢ vào $ROOT/pipeline/lib/vong-doi.mjs của thư mục tạm.
 */

const SCRIPTS = [
  // 2610-13 vòng 3: chotot-daily thật — S06 không chạy → MỘT dòng + thoát 0,
  // KHÔNG chạy import/transform/refresh/resolve (Claude bắt: hiện vẫn chạy 4 dòng)
  ["scripts/chotot-daily.sh", "S06"],
  ["scripts/smoke-daily.sh", "S01"],
  ["scripts/airdna-daily.sh", "S02"],
  ["pipeline/scripts/weekly-with-jitter.sh", "S01"],
];

function fixture(script) {
  const S = mkdtempSync(join(tmpdir(), "vd-gate-"));
  const root = join(S, "repo");
  mkdirSync(join(root, "pipeline/lib"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(join(root, "pipeline/scripts"), { recursive: true });
  // vong-doi GIẢ: in một dòng JSON + thoát mã theo VONG_DOI_RC
  writeFileSync(join(root, "pipeline/lib/vong-doi.mjs"),
    `process.stdout.write(JSON.stringify({code:"X",run:process.env.VONG_DOI_RC!=="3",ly_do:process.env.VONG_DOI_RC==="3"?"nguon-paused":"chay"})+"\\n");process.exit(Number(process.env.VONG_DOI_RC));\n`);
  const dest = join(root, script);
  mkdirSync(join(dest, ".."), { recursive: true });
  copyFileSync(join(REPO, script), dest);
  chmodSync(dest, 0o755);
  // chotot-daily cần thêm: collector giả (thoát 0 = collect xong), import giả,
  // transform/refresh/resolve giả (đếm lượt chạy), logs dir + state
  if (script.includes("chotot-daily")) {
    writeFileSync(join(root, "pipeline/collect-chotot.mjs"), "// giả\nprocess.exit(0);\n");
    writeFileSync(join(root, "pipeline/import-chotot.mjs"), "// giả\nconsole.log(\"[giả] import-chotot\");\nprocess.exit(0);\n");
    for (const [f] of [["transform-chotot.mjs"], ["transform-media.mjs"], ["refresh-bait-gap.mjs"], ["resolve-properties.mjs"]]) {
      writeFileSync(join(root, "pipeline/" + f), `// giả — đếm lượt chạy\nconst { appendFileSync } = await import("node:fs");\nappendFileSync("${join(S, "runs.log")}", "${f.replace(".mjs", "")}\\n");\n`);
    }
    mkdirSync(join(root, "pipeline/logs"), { recursive: true });
    writeFileSync(join(root, "pipeline/logs/apify-daily.state"), "2026-01-01T000000\n");
    // chép job-step.sh thật (làn Claude)
    mkdirSync(join(root, "scripts/lib"), { recursive: true });
    copyFileSync(join(REPO, "scripts/lib/job-step.sh"), join(root, "scripts/lib/job-step.sh"));
  }
  return { S, root, dest, runs: join(S, "runs.log"), cleanup: () => rmSync(S, { recursive: true, force: true }) };
}

const chay = (fx, rc, extraPatch) => {
  if (extraPatch) extraPatch(fx);
  const r = spawnSync("bash", [fx.dest], {
    env: { ...process.env, VONG_DOI_RC: String(rc), PATH: process.env.PATH },
    encoding: "utf8", timeout: 30_000,
  });
  return { code: r.status, out: (r.stdout + r.stderr) };
};

test("v2: vong-doi trả 3 → script in dòng bỏ-đi và THOÁT 0 (không còn chết ngầm mã 3)", () => {
  for (const [script] of SCRIPTS) {
    const fx = fixture(script);
    try {
      const r = chay(fx, 3);
      assert.equal(r.code, 0, `${script}: exit 0 (được ${r.code}; out: ${r.out.slice(0, 150)})`);
      assert.match(r.out, /bỏ qua lượt thu/, `${script}: dòng bỏ-đi`);
      assert.match(r.out, /nguon-paused/, `${script}: kèm lý_do`);
    } finally { fx.cleanup(); }
  }
});

test("v2: vong-doi trả 2 (DB lỗi) → script THOÁT 1 rõ ràng với dòng lỗi", () => {
  for (const [script] of SCRIPTS) {
    const fx = fixture(script);
    try {
      const r = chay(fx, 2);
      assert.equal(r.code, 1, `${script}: exit 1 (được ${r.code})`);
      assert.match(r.out, /vong-doi .* lỗi — dừng \(fail-closed\)/, `${script}: dòng lỗi`);
    } finally { fx.cleanup(); }
  }
});

test("v2: vong-doi trả 0 → script VƯỢT cổng sang bước kế (không chết ở thay thế lệnh)", () => {
  // weekly-with-jitter: sleep ≤30' + exec weekly-collect — vá bản chép: sleep→echo,
  // exec weekly-collect → echo marker. smoke/airdna: vá bước nặng thành echo.
  const patches = {
    "pipeline/scripts/weekly-with-jitter.sh": (fx) => {
      const p = fx.dest;
      let t = readFileSync(p, "utf8");
      t = t.replace("sleep $((RANDOM % 1800))", 'echo "[vá-test] đã qua cổng, jitter"');
      t = t.replace(/exec bash .*weekly-collect\.sh.*/, 'echo "[vá-test] tới weekly-collect"');
      writeFileSync(p, t);
    },
    "scripts/smoke-daily.sh": (fx) => {
      const p = fx.dest;
      let t = readFileSync(p, "utf8");
      t = t.replace(/LOG="\$\(mktemp -t smoke-daily\)"/, 'LOG=/dev/null');
      t = t.replace(/if ! \(cd "\$ROOT\/collector".*?fi/s, 'echo "[vá-test] đã qua cổng, tới bước smoke"');
      writeFileSync(p, t);
    },
    "scripts/chotot-daily.sh": (fx) => {
      const f = fx.dest;
      let s = readFileSync(f, "utf8");
      const iBat = s.indexOf("CITIES=");
      const iKet = s.indexOf("for CITY in", iBat);
      s = s.slice(0, iBat) + 'CITIES="hanoi"\n' + s.slice(iKet);
      writeFileSync(f, s);
    },
    "scripts/airdna-daily.sh": (fx) => {
      const p = fx.dest;
      let t = readFileSync(p, "utf8");
      t = t.replace(/cd "\$ROOT\/collector"[\s\S]*/, 'echo "[vá-test] đã qua cổng, tới bước thu"');
      writeFileSync(p, t);
    },
  };
  for (const [script] of SCRIPTS) {
    const fx = fixture(script);
    try {
      const r = chay(fx, 0, patches[script]);
      assert.equal(r.code, 0, `${script}: exit 0 (được ${r.code}; out: ${r.out.slice(0, 200)})`);
      if (script.includes("chotot-daily")) {
        // chotot-daily chạy thật collect/import giả — kiểm exit 0 + KHÔNG dừng ở cổng
        assert.ok(!/bỏ qua lượt thu/.test(r.out) && !/vong-doi .* lỗi/.test(r.out), `${script}: không dừng ở cổng`);
      } else {
        assert.match(r.out, /\[vá-test\] đã qua cổng/, `${script}: script đi tiếp sau cổng`);
      }
      assert.ok(!/vong-doi .* lỗi/.test(r.out), `${script}: không dừng ở cổng`);
    } finally { fx.cleanup(); }
  }
});
