#!/usr/bin/env node
// Phép đo AC-3 (cross-layer) của hồ sơ s02-luot-loi-sach-va-kiem-han-token:
// lượt S02 ném lỗi thì NGƯỜI ĐỌC phía sau không thấy nó như một bản thu.
// Người đọc thật: dòng `SNAP=` của script đêm S02 (scripts/*-daily.sh có dòng chọn bản thu
// `vn__<id>-research__*`; rút nguyên văn từ tệp, không chép tay) chọn bản thu mới nhất để transform.
// Cùng một fixture: (1) lượt thành công → thư mục tên thật; (2) lượt ném lỗi.
// Xanh: lệnh collect bị từ chối (exit 1), dòng SNAP= chọn bản (1), lượt (2) chỉ còn
// '.partial' ẩn có manifest lỗi. Chiều đỏ (--pha): đổi tên '.partial' ra tên thật như
// finalize đời cũ → dòng SNAP= chọn bản hỏng → ĐỎ ghim tên thư mục, exit 1.
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const PHA = process.argv.includes("--pha");
const SCHED = join(ROOT, "collector/dist/core/scheduler.js");
if (!existsSync(SCHED)) { console.error(`ĐỎ: thiếu ${SCHED} — build collector trước`); process.exit(2); }

// Dò script đêm S02: đúng một scripts/*-daily.sh có dòng SNAP= chọn `snapshots/vn/vn__<id>-research__*`.
const RE = /^SNAP="\$\((ls -td snapshots\/vn\/vn__([a-z]+-research)__\*.*)\)"$/m;
const ung = readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith("-daily.sh"))
  .map((f) => [f, readFileSync(join(ROOT, "scripts", f), "utf8").match(RE)]).filter(([, m]) => m);
if (ung.length !== 1) { console.error(`ĐỎ: cần đúng một script đêm S02 có dòng SNAP=, thấy ${ung.length}`); process.exit(2); }
const [tepDem, m] = ung[0];
const lenhSnap = m[1], NGUON = m[2];
// đầu ra đi vào bằng chứng trên kho công khai — che tên nguồn thật (luật 6) bằng mã S02
const che = (s) => String(s).split(NGUON).join("S02").split(NGUON.replace(/-research$/, "")).join("S02");
const inRa = (s) => console.log(che(s));
inRa(`script đêm S02: scripts/${tepDem}`);

const CA = (nem) => `
import { runCollector } from ${JSON.stringify(SCHED)};
const collector = { id: ${JSON.stringify(NGUON)}, requestsPerSecond: 1, async collect() {
  if (${nem}) throw new Error("401 sau refresh token — dừng chạy (/v1/market/thu)");
  return { items: [{ source: ${JSON.stringify(NGUON)}, sourceId: "m1", kind: "market", fetchedAt: new Date().toISOString(), payload: { x: 1 } }],
           coverage: { discovered: 1, captured: 1, failed: 0, methods: {} } };
} };
runCollector({ city: { id: "vn" }, collector, snapshotRoot: process.env.ZC_ROOT, stateDir: process.env.ZC_STATE })
  .then(() => process.exit(0), () => process.exit(1));
`;

// CLI `collect` (lệnh script đêm gọi) phải biến lời từ chối của runCollector thành exit 1:
// rút lời gọi runCollector({...}).catch(...) của collector/src/cli.ts, đòi process.exit(1) trong catch.
const cli = readFileSync(join(ROOT, "collector/src/cli.ts"), "utf8");
const okCli = /runCollector\(\{[\s\S]*?\}\)\.catch\(\([^)]*\)\s*=>\s*\{[\s\S]*?process\.exit\(1\)[\s\S]*?\}\);/.test(cli);
const S = mkdtempSync(join(tmpdir(), "s02-nguoi-doc-"));
const COL = join(S, "collector");
const env = { ...process.env, ZC_ROOT: join(COL, "snapshots"), ZC_STATE: join(S, "state"), CONDUCT_WINDOW: "off", CONDUCT_JITTER: "0" };
let loi = 0;
const ok = (dk, msg) => { inRa(`${dk ? "đạt" : "ĐỎ"}: ${msg}`); if (!dk) loi++; };
ok(okCli, "CLI collect bắt lời từ chối của runCollector bằng process.exit(1)");
try {
  const r1 = spawnSync(process.execPath, ["--input-type=module", "-e", CA(false)], { env, encoding: "utf8", timeout: 60_000 });
  ok(r1.status === 0, `lượt thành công thoát 0 (thực tế ${r1.status})`);
  const vn = join(COL, "snapshots/vn");
  const tot = readdirSync(vn).filter((d) => !d.startsWith("."));
  ok(tot.length === 1, `có đúng một bản thu tên thật sau lượt thành công (${tot.join(", ")})`);
  // tập tệp có sẵn trước lượt hỏng — sau lượt phải còn nguyên (luật 1: không xoá)
  const truoc = [];
  const ke = (d, g = "") => { for (const e of readdirSync(join(d, g), { withFileTypes: true })) { const r = join(g, e.name); e.isDirectory() ? ke(d, r) : truoc.push(r); } };
  ke(vn);
  // mốc tên theo ms — chờ để lượt hai có sid khác và mtime mới hơn
  execFileSync("sleep", ["1.1"]);
  const r2 = spawnSync(process.execPath, ["--input-type=module", "-e", CA(true)], { env, encoding: "utf8", timeout: 60_000 });
  ok(r2.status === 1, `lượt ném lỗi làm lệnh collect thoát 1 — set -e của script đêm S02 dừng trước transform (thực tế ${r2.status})`);
  const sau = []; { const ke2 = (g = "") => { for (const e of readdirSync(join(vn, g), { withFileTypes: true })) { const r = join(g, e.name); e.isDirectory() ? ke2(r) : sau.push(r); } }; ke2(); }
  const mat = truoc.filter((f) => !sau.includes(f));
  ok(mat.length === 0 && truoc.length > 0, `lượt hỏng không xoá tệp nào của bản thu cũ (${truoc.length} tệp trước, mất ${mat.length}${mat.length ? ": " + mat.join(", ") : ""})`);
  const an = readdirSync(vn).filter((d) => d.startsWith(".") && d.endsWith(".partial"));
  ok(an.length === 1, `lượt ném lỗi để lại đúng một '.partial' ẩn (${an.join(", ")})`);
  if (an.length === 1) {
    const mf = JSON.parse(readFileSync(join(vn, an[0], "manifest.json"), "utf8"));
    ok(/401 sau refresh token/.test(mf.error ?? "") && mf.counts?.items === 0, "manifest lỗi trong '.partial' giữ error và 0 items");
    if (PHA) {
      const ten = an[0].slice(1, -".partial".length);
      renameSync(join(vn, an[0]), join(vn, ten));
      inRa(`(--pha) đổi tên '.partial' ra tên thật như finalize đời cũ: ${ten}`);
    }
  }
  const snap = execFileSync("bash", ["-c", `${lenhSnap} 2>/dev/null | head -1`], { cwd: COL, encoding: "utf8" }).trim();
  const chon = snap.split("/").pop();
  ok(chon === tot[0], `dòng SNAP= của script đêm S02 chọn bản thu thành công, không chọn lượt hỏng (chọn: ${chon || "(rỗng)"})`);
} finally {
  rmSync(S, { recursive: true, force: true });
}
console.log(loi ? `ĐỎ: ${loi} điều kiện hỏng${PHA ? " (chiều đỏ --pha, đúng kỳ vọng)" : ""}` : "XANH: người đọc phía sau không thấy lượt hỏng");
process.exit(loi ? 1 : 0);
