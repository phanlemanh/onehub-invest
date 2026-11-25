// ghi-tep-mo.mjs — bộ ghi tệp thật sự mở của một lượt chạy (hồ sơ db-thu-tach-khoi-cum-that T3, fixture của E4/E5).
// Nạp qua NODE_OPTIONS="--import <tệp này>" và GHI_TEP_MO=<tệp ghi>: mỗi tiến trình node (kể cả tiến trình con của test
// runner, vì NODE_OPTIONS đi theo) nối một dòng cho mỗi module nạp (hook resolve), mỗi tệp mở/đọc qua fs, và mỗi lời
// gọi tiến trình con (lệnh + đối số, cwd). Chỉ dùng cho lượt ghi fixture; không nằm trong đường chạy thường.
import fs from "node:fs";
import cp from "node:child_process";
import { registerHooks, syncBuiltinESMExports } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RA = process.env.GHI_TEP_MO;
if (RA) {
  const ghiGoc = fs.appendFileSync.bind(fs);
  const ghi = (loai, gt, cwd = process.cwd()) => {
    try { ghiGoc(RA, JSON.stringify({ loai, gt, cwd }) + "\n"); } catch { /* bộ ghi không được làm hỏng lượt */ }
  };
  const duong = (p) => (typeof p === "string" ? p : p instanceof URL ? fileURLToPath(p) : Buffer.isBuffer(p) ? p.toString() : null);
  registerHooks({
    resolve(spec, ctx, next) {
      const r = next(spec, ctx);
      if (r.url?.startsWith("file:")) ghi("module", fileURLToPath(r.url));
      return r;
    },
  });
  for (const ten of ["openSync", "readFileSync", "readdirSync", "createReadStream", "open", "readFile", "readdir", "copyFileSync", "cpSync"]) {
    const goc = fs[ten];
    if (typeof goc !== "function") continue;
    fs[ten] = function (p, ...rest) { const d = duong(p); if (d) ghi("fs", path.resolve(d)); return goc.call(this, p, ...rest); };
  }
  for (const ten of ["open", "readFile", "readdir"]) {
    const goc = fs.promises[ten];
    fs.promises[ten] = function (p, ...rest) { const d = duong(p); if (d) ghi("fs", path.resolve(d)); return goc.call(this, p, ...rest); };
  }
  for (const ten of ["spawn", "spawnSync", "execFile", "execFileSync", "exec", "execSync"]) {
    const goc = cp[ten];
    cp[ten] = function (lenh, a, o, ...rest) {
      const args = Array.isArray(a) ? a : [];
      const opt = Array.isArray(a) ? o : a;
      ghi("con", [lenh, ...args].map(String), path.resolve(opt?.cwd ?? process.cwd()));
      return goc.call(this, lenh, a, o, ...rest);
    };
  }
  // `import { readFileSync } from "node:fs"` giữ liên kết riêng: đồng bộ lại để tệp nạp sau thấy bản đã bọc.
  syncBuiltinESMExports();
}

// Gom: node scripts/lib/ghi-tep-mo.mjs --gom <nhật ký> --ra <fixture.json> --lenh "<lệnh đã chạy>"
// Giữ tệp nằm trong cây kho (git ls-files), đường tương đối gốc kho; tiến trình con mang đối số là tệp kho cũng tính.
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url)) && process.argv.includes("--gom")) {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const goc = cp.execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  const kho = new Set(cp.execFileSync("git", ["ls-files"], { cwd: goc, encoding: "utf8" }).split("\n").filter(Boolean));
  const tep = new Set();
  const them = (p, cwd) => {
    if (typeof p !== "string" || !p) return;
    const r = path.relative(goc, path.resolve(cwd ?? goc, p));
    if (kho.has(r)) tep.add(r);
  };
  for (const l of fs.readFileSync(arg("--gom"), "utf8").split("\n")) {
    if (!l) continue;
    let d;
    try { d = JSON.parse(l); } catch { continue; }
    if (d.loai === "con") for (const a of d.gt) them(a, d.cwd);
    else them(d.gt, d.cwd);
  }
  const sha = cp.execFileSync("git", ["rev-parse", "HEAD"], { cwd: goc, encoding: "utf8" }).trim();
  fs.writeFileSync(arg("--ra"), JSON.stringify({ sha, lenh: arg("--lenh"), ghi_luc: new Date().toISOString(), tep: [...tep].sort() }, null, 2) + "\n");
  console.log(`ghi-tep-mo: ${tep.size} tệp trong kho → ${arg("--ra")}`);
}
