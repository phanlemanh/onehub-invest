// zalo-import-replay.test.mjs — ZC20 (claudedp-2511-56): replay trọn từ state 0
// phải xếp snapshot bù ảnh S03 (coverage.loai=tai-bu-anh-2511) PHASE CUỐI —
// bản gốc cùng ngày tên muộn hơn nạp trước không được đè ảnh đã bù (695 bài).
// Dùng đúng 5 tên snapshot bù 21–25/11 + 1 gốc 21/11 tên muộn hơn. Harness giống
// zalo-import-tran.test.mjs: ROOT tmp, bước pipeline là fixture, không đụng DB.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmodSync, cpSync, symlinkSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(REPO, "scripts", "zalo-import-daily.sh");
const NODE = process.execPath;
const XONG = "process.exit(0);\n";
const NAP_GIA = `import fs from "node:fs"; import p from "node:path"; const __dirname=p.dirname(new URL(import.meta.url).pathname);
fs.appendFileSync(p.join(__dirname,"logs","so-nap.txt"),p.basename(process.argv[2])+"\\n");process.exit(0);\n`;
const MODULE_GIA = existsSync(join(REPO, "pipeline", "backfill-s03-media-2511.mjs"))
  ? readFileSync(join(REPO, "pipeline", "backfill-s03-media-2511.mjs"), "utf8")
  : null;

const dungMoi = () => {
  const root = mkdtempSync(join(tmpdir(), "zalo-replay-"));
  mkdirSync(join(root, "scripts", "lib"), { recursive: true });
  mkdirSync(join(root, "pipeline", "logs"), { recursive: true });
  writeFileSync(join(root, "scripts", "zalo-import-daily.sh"), readFileSync(SCRIPT, "utf8"));
  chmodSync(join(root, "scripts", "zalo-import-daily.sh"), 0o755);
  cpSync(join(REPO, "scripts", "lib", "job-step.sh"), join(root, "scripts", "lib", "job-step.sh"));
  writeFileSync(join(root, "pipeline", "transform-zalo.mjs"), XONG);
  for (const f of ["transform-media", "refresh-bait-gap", "xep-hang-gia"]) writeFileSync(join(root, "pipeline", `${f}.mjs`), XONG);
  writeFileSync(join(root, "pipeline", "import-airbnb.mjs"), NAP_GIA);
  writeFileSync(join(root, "pipeline", "doc-gop-hang-ngay.sh"), "exit 0\n");
  symlinkSync(NODE, join(root, "node-dong-ho"));
  if (MODULE_GIA) {
    // module THẬT (sapXepReplay) vào fixture pipeline — pg mượn node_modules của REPO
    writeFileSync(join(root, "pipeline", "backfill-s03-media-2511.mjs"), MODULE_GIA);
    try {
      symlinkSync(join(REPO, "pipeline", "node_modules"), join(root, "pipeline", "node_modules"));
    } catch {}
  }
  // 5 snapshot bù (coverage.loai=tai-bu-anh-2511) + 1 gốc 21/11 tên muộn hơn
  const buu = [
    "hanoi__zalo-agent__2026-11-21T143738670",
    "hanoi__zalo-agent__2026-11-22T140520119",
    "hanoi__zalo-agent__2026-11-23T134413716",
    "hanoi__zalo-agent__2026-11-24T131547604",
    "hanoi__zalo-agent__2026-11-25T125516859",
  ];
  for (const d of [...buu, "hanoi__zalo-agent__2026-11-21T193000000"]) {
    const dir = join(root, "collector", "snapshots", "hanoi", d);
    mkdirSync(dir, { recursive: true });
    const laBuu = buu.includes(d);
    writeFileSync(join(dir, "manifest.json"), JSON.stringify({ snapshotId: d, coverage: laBuu ? { loai: "tai-bu-anh-2511" } : { discovered: 1 } }) + "\n");
  }
  return { root, buu };
};

const chay = (root, extraEnv = {}) =>
  new Promise((giai) => {
    const env = { ...process.env, ...extraEnv, ZALO_IMPORT_NODE_BIN: join(root, "node-dong-ho"), DATABASE_URL: "postgres://127.0.0.1:1/khong-co" };
    const con = spawn("bash", [join(root, "scripts", "zalo-import-daily.sh")], { detached: true, env });
    let out = "";
    con.stdout.on("data", (d) => { out += d; });
    con.stderr.on("data", (d) => { out += d; });
    const chot = setTimeout(() => { try { process.kill(-con.pid, "SIGKILL"); } catch {} }, 90_000);
    con.on("exit", async (code, signal) => {
      await new Promise((r) => setTimeout(r, 300));
      clearTimeout(chot);
      try { process.kill(-con.pid, "SIGKILL"); } catch {}
      giai({ status: code ?? -1, out });
    });
  });

const docSo = (root) => {
  const f = join(root, "pipeline", "logs", "so-nap.txt");
  return existsSync(f) ? readFileSync(f, "utf8").trim().split("\n").filter(Boolean) : [];
};
const docState = (root, ten = "apify-daily.state") => {
  const f = join(root, "pipeline", "logs", ten);
  return existsSync(f) ? readFileSync(f, "utf8").trim() : "00000000T000000";
};

test("replay state 0: gốc 21/11 tên muộn nạp TRƯỚC, cả 5 snapshot bù phase cuối; state = mốc lớn nhất", { skip: !MODULE_GIA && "cần pipeline/backfill-s03-media-2511.mjs trong REPO" }, async () => {
  const { root, buu } = dungMoi();
  try {
    const r = await chay(root);
    assert.match(r.out, /replay từ state 0 — snapshot bù ảnh S03 xếp phase cuối/, "phải đi nhánh replay");
    const so = docSo(root);
    assert.deepEqual(so, [
      "hanoi__zalo-agent__2026-11-21T193000000", // gốc tên muộn hơn cùng ngày — nạp TRƯỚC
      ...buu, // cả 5 bù phase cuối, theo thứ tự tên trong nhóm
    ], `thứ tự nạp sai: ${JSON.stringify(so)}`);
    // state = mốc lớn nhất trong các tên đã nạp (25/11 của snapshot bù) — không bao giờ bị kéo lùi
    assert.equal(docState(root), "2026-11-25T125516859");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("lượt thường (LAST có mốc): thứ tự tên nguyên bản, KHÔNG đi nhánh replay", { skip: !MODULE_GIA && "cần pipeline/backfill-s03-media-2511.mjs trong REPO" }, async () => {
  const { root } = dungMoi();
  try {
    writeFileSync(join(root, "pipeline", "logs", "apify-daily.state"), "2026-11-25T000000000");
    const r = await chay(root);
    assert.doesNotMatch(r.out, /replay từ state 0/);
    const so = docSo(root);
    // chỉ snapshot tên > state được nạp: 25/11 bù duy nhất qua cửa; 21-24/11 đã ≤ state
    assert.deepEqual(so, ["hanoi__zalo-agent__2026-11-25T125516859"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
