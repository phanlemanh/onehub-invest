// zalo-import-chia-tran-zcode.test.mjs — lưới chia trần của lượt 00:00 nạp S03 (claudedp-2311-5, bổ sung 2311-6).
// CHẠY LẺ: node --test --test-concurrency=1 scripts/zalo-import-chia-tran-zcode.test.mjs
// Mọi ca chạy BẢN SAO của script trong ROOT tmp (không đụng runtime thật, không đụng DB — bước pipeline là fixture
// trong tmp, DATABASE_URL trỏ cổng đóng). Mỗi lượt khởi DETACHED nên có nhóm tiến trình riêng. Đồng hồ dùng node đang
// chạy test (ZALO_IMPORT_NODE_BIN = symlink <root>/node-dong-ho → process.execPath). `bien` = hàm đột biến chuỗi
// script: mỗi ca chính có một chiều đỏ phá đúng nhánh nó đo.
// Lời giao chạm cả hai phía của mốc ranh giới làn trong tệp bọc (luật U1-1711-5: một nhánh sửa MỘT phía), nên làm
// hai nhánh, mỗi nhánh một phía; tệp test này là chung:
//   A (phía trên mốc — nhánh zcode/s03-nhap-chia-tran): trần tổng lượt 00:00 21600s (từ 14400), tuổi khoá theo
//     cùng trần; xuất DOC_GOP_TRAN_GIAY = TRAN_DOC_GOP − 300 cho bước đọc gộp (hợp đồng dừng sạch P3/HT6).
//   B (phía dưới mốc — nhánh zcode/s03-nhap-chia-tran-buoc, đứng trên A): đồng hồ riêng của bước đọc gộp, và 75 của
//     bước = đi tiếp (không JOB FAIL, không vào JOB_RC).
import test from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(REPO, "scripts", "zalo-import-daily.sh");
const NODE = process.execPath;
const XONG = "process.exit(0);\n";
const NAP_GIA = `import fs from "node:fs"; import p from "node:path"; const __dirname=p.dirname(new URL(import.meta.url).pathname);
fs.mkdirSync(p.join(__dirname,"logs"),{recursive:true});
const ngu=Number(process.env.NAP_NGU||0)*1000; setTimeout(()=>{process.exit(Number(process.env.NAP_MA||0))},ngu);\n`;
// ---- fixture bước đọc gộp (thế cho pipeline/doc-gop-hang-ngay.sh của làn Claude) ----
// treo: bash ngủ vòng — nhận TERM thì thoát 143 (sau lần sleep đang chạy)
const DG_TREO = "#!/bin/bash\nwhile true; do sleep 1; done\n";
// phớt TERM: bash gọi node con bỏ qua SIGTERM — chỉ chết bằng SIGKILL ân hạn
const DG_PHOT_MJS = 'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000);\n';
const DG_PHOT = '#!/bin/bash\nnode "$(dirname "$0")/doc-gop-phong-term.mjs"\n';
// hợp đồng P3/HT6: nhận DOC_GOP_TRAN_GIAY, giữ sổ đã-đọc; chưa xong thì thoát 75 kèm dòng WARN. Số bài làm được
// trong lượt do FIX_DOC_GOP_LAM (thế cho đồng hồ của bước): lượt 1 làm 2 rồi 75, lượt 2 làm nốt.
const DG_HOP_DONG = `#!/bin/bash
s="$(dirname "$0")/logs-doc"; mkdir -p "$s"
printf '%s\\n' "\${DOC_GOP_TRAN_GIAY:-KHONG_DAT}" > "$s/tran-nhan.txt"
da=$(cat "$s/da-doc" 2>/dev/null || echo 0)
con=$(( \${FIX_DOC_GOP_LAM:-6} - da )); [ "$con" -lt 0 ] && con=0
i=0
while [ "$i" -lt "$con" ]; do da=$((da+1)); echo "$da" >> "$s/so-doc.txt"; echo "$da" > "$s/da-doc"; i=$((i+1)); done
if [ "$da" -lt 6 ]; then echo "JOB WARN [doc-gop-hang-ngay] het-gio: hom-qua con lai $((6-da)) loi goi" >&2; exit 75; fi
exit 0
`;
// fixture enrich: chạy qua `node --import tsx scripts/enrich-run.ts` như bản thật — tsx giả rỗng trong agent/node_modules,
// tệp .ts chỉ chứa JS thường (node 24 chạy thẳng). Ghi số lần chạy vào ENRICH_DA_CHAY.
const ENRICH_TS = `import fs from "node:fs";
const f = process.env.ENRICH_DA_CHAY;
fs.writeFileSync(f, String((fs.existsSync(f) ? Number(fs.readFileSync(f, "utf8")) : 0) + 1));
`;

// Dựng ROOT tmp: sao script vào <root>/scripts/ (ROOT của script = dirname($0)/..), pipeline/logs, collector/snapshots
// rỗng, fixture các bước. `docGop` = nội dung tệp giả của bước đọc gộp; `bien` = hàm đột biến chuỗi script;
// `cham` = transform-zalo chậm 1 giây (lượt xong tức thì thì trap giết node giả trước khi nó kịp ghi sổ).
const dungMoi = ({ bien = null, docGop = "exit 0\n", cham = false } = {}) => {
  const root = mkdtempSync(join(tmpdir(), "zalo-chia-"));
  mkdirSync(join(root, "scripts", "lib"), { recursive: true });
  const goc = readFileSync(SCRIPT, "utf8");
  writeFileSync(join(root, "scripts", "zalo-import-daily.sh"), bien ? bien(goc) : goc);
  chmodSync(join(root, "scripts", "zalo-import-daily.sh"), 0o755); // ca chạy thẳng tệp qua bash -c '"$0"'
  cpSync(join(REPO, "scripts", "lib", "job-step.sh"), join(root, "scripts", "lib", "job-step.sh"));
  mkdirSync(join(root, "pipeline", "logs"), { recursive: true });
  mkdirSync(join(root, "collector", "snapshots", "vn"), { recursive: true });
  mkdirSync(join(root, "pipeline", "scripts"), { recursive: true });
  for (const f of ["transform-zalo", "transform-media", "refresh-bait-gap", "xep-hang-gia"])
    writeFileSync(join(root, "pipeline", `${f}.mjs`), XONG);
  if (cham) writeFileSync(join(root, "pipeline", "transform-zalo.mjs"), "setTimeout(() => process.exit(0), 1000);\n");
  writeFileSync(join(root, "pipeline", "scripts", "phuong-tu-du-an.mjs"), XONG);
  writeFileSync(join(root, "pipeline", "import-airbnb.mjs"), NAP_GIA);
  writeFileSync(join(root, "pipeline", "doc-gop-hang-ngay.sh"), docGop);
  writeFileSync(join(root, "pipeline", "doc-gop-phong-term.mjs"), DG_PHOT_MJS);
  mkdirSync(join(root, "agent", "node_modules", "tsx"), { recursive: true });
  writeFileSync(join(root, "agent", "node_modules", "tsx", "package.json"), '{"name":"tsx","type":"module","main":"index.mjs","exports":"./index.mjs"}\n');
  writeFileSync(join(root, "agent", "node_modules", "tsx", "index.mjs"), "");
  mkdirSync(join(root, "agent", "scripts"), { recursive: true });
  writeFileSync(join(root, "agent", "scripts", "enrich-run.ts"), ENRICH_TS);
  symlinkSync(NODE, join(root, "node-dong-ho"));
  return root;
};
const ENV0 = (root) => ({ DATABASE_URL: "postgres://127.0.0.1:1/khong-co", ENRICH_DA_CHAY: join(root, "enrich-da-chay") });

// Khởi lượt detached (nhóm riêng). `boc` = chạy qua `bash -c` ngoài (script KHÔNG là trưởng nhóm — như chạy tay).
const chay = (root, extraEnv = {}, { args = [], boc = false, sauThoat } = {}) =>
  new Promise((giai) => {
    const sc = join(root, "scripts", "zalo-import-daily.sh");
    const argv = boc ? ["-c", '"$0" "$@"; echo NGUOI-GOI-SONG rc=$?', sc, ...args] : [sc, ...args];
    const con = spawn("bash", argv, { detached: true, env: { ...process.env, ...ENV0(root), ZALO_IMPORT_NODE_BIN: join(root, "node-dong-ho"), ...extraEnv } });
    let out = "";
    con.stdout.on("data", (d) => { out += d; });
    con.stderr.on("data", (d) => { out += d; });
    const chot = setTimeout(() => { try { process.kill(-con.pid, "SIGKILL"); } catch {} }, 150_000);
    con.on("exit", async (code, signal) => {
      await new Promise((r) => setTimeout(r, 300)); // gom nốt đầu ra; KHÔNG chờ «close» (đồng hồ mồ côi sẽ giữ ống)
      clearTimeout(chot);
      const them = sauThoat ? await sauThoat() : undefined;
      try { process.kill(-con.pid, "SIGKILL"); } catch {}
      giai({ status: code ?? (signal === "SIGTERM" ? 143 : -1), signal, out, them });
    });
  });
const demTheoDau = (dau) =>
  execFileSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" }).split("\n").filter((l) => l.includes(dau)).length;
const choHet = async (dau, lan = 80) => { // tối đa 40s
  for (let i = 0; i < lan; i++) { if (demTheoDau(dau) === 0) return 0; await new Promise((r) => setTimeout(r, 500)); }
  return demTheoDau(dau);
};
const donCon = (dau) => { try { execFileSync("pkill", ["-9", "-f", dau]); } catch {} };
const voiRoot = async (opts, fn) => {
  const root = dungMoi(opts);
  try { return await fn(root); } finally { donCon("doc-gop-phong-term.mjs"); rmSync(root, { recursive: true, force: true }); }
};
const chuKyThat = (pid) => execFileSync("ps", ["-o", "lstart=", "-p", String(pid)], { encoding: "utf8" }).replace(/\s+/g, " ").trim();

const CAU = {
  tranTong: "|| echo 21600)}", // mặc định trần tổng ở phần đồng hồ
  // nhánh B (phía dưới mốc)
  dongHoBuoc: 'canh_gio_buoc "$TRAN_DOC_GOP" "bước đọc gộp" "$buoc_pid"',
  kt75: 'if [ "$rc" -eq 75 ]; then',
  anHanBuoc: "setTimeout(diet, 20_000).unref();",
  boQuaTerm: 'process.on("SIGTERM", () => {}); // đồng hồ bước',
  usr1: 'process.on("SIGUSR1", () => { if (!daBan) process.exit(0); diet(); });',
};

// ══════ A (3) trần tổng lượt 00:00 mặc định 21600 s được áp ══════
const nodeGia = (root) => { // đồng hồ giả: ghi TRAN_GIAY CANH_GIAY của mỗi lần được gọi
  const f = join(root, "node-gia.sh");
  writeFileSync(f, `#!/bin/bash\necho "$TRAN_GIAY $CANH_GIAY" >> "${root}/dong-ho.txt"\n`);
  chmodSync(f, 0o755);
  return f;
};
const kiemA3 = (bien) => voiRoot({ bien, docGop: "sleep 1\n", cham: true }, async (root) => {
  const r = await chay(root, { ZALO_IMPORT_NODE_BIN: nodeGia(root) });
  assert.match(r.out, /\[zalo-import-daily\] trần: nạp ≤1800s · đọc gộp ≤16200s \(dừng sạch ở 15900s\) · lượt ≤21600s/, "A(3) dòng khai trần lúc khởi động: lượt 00:00 mặc định 21600s");
  const dong = readFileSync(join(root, "dong-ho.txt"), "utf8").trim().split("\n").map((l) => l.trim().split(/\s+/).join(" "));
  assert.deepEqual(dong, ["21600 10800", "16200"], `A(3) hai đồng hồ của lượt (nhánh B): tổng 21600s (WARN 10800s) rồi của bước đọc gộp 16200s — thực tế ${JSON.stringify(dong)}`);
  // tuổi khoá theo cùng trần tổng: khoá 5h của chủ thật (pid sống + chữ ký khớp) — dưới 6h nên KHÔNG gỡ
  const khoa = join(root, "pipeline", "logs", "apify-daily.state.lock");
  mkdirSync(khoa, { recursive: true });
  writeFileSync(join(khoa, "pid"), `${process.pid}\n`);
  writeFileSync(join(khoa, "luc"), `${Math.floor(Date.now() / 1000) - 5 * 3600}\n`);
  writeFileSync(join(khoa, "chu"), `${chuKyThat(process.pid)}\n`);
  const r5h = await chay(root, {}, { args: ["--luot-nhanh"] });
  assert.match(r5h.out, /khoá còn sống \(PID \d+, lấy lúc \d+, tuổi \d+s\) — không gỡ/, "A(3) CA LỖI: trần tổng 6h thì khoá 5h của lượt thật vẫn còn chủ (bản cũ 4h → gỡ nhầm → chồng lượt)");
  assert.match(r5h.out, /⏭ bỏ lượt/, "A(3) lượt nhanh nhường lượt 00:00 còn trong trần");
  assert.ok(existsSync(join(khoa, "pid")), "A(3) khoá còn nguyên");
  writeFileSync(join(khoa, "luc"), `${Math.floor(Date.now() / 1000) - 7 * 3600}\n`);
  const r7h = await chay(root, {}, { args: ["--luot-nhanh"] });
  assert.match(r7h.out, /gỡ khoá của lượt chạy thật đã VƯỢT trần tổng 21600s/, "A(3) khoá 7h (quá trần 6h, đồng hồ chết) thì gỡ được");
  assert.doesNotMatch(r7h.out, /⏭ bỏ lượt/, "A(3) sau khi gỡ, lượt nhanh chạy");
});
test("2311-5 A(3): trần tổng lượt 00:00 mặc định 21600s (WARN 10800s) áp cho đồng hồ và tuổi khoá; nhánh B thêm đồng hồ bước đọc gộp 16200s", () => kiemA3());
test("2311-5 A(3) chiều đỏ: bản sao trả trần tổng về 14400 → đỏ dòng khai trần", () =>
  assert.rejects(kiemA3((s) => s.replace(CAU.tranTong, "|| echo 14400)}")), /lượt 00:00 mặc định 21600s/));
test("2311-5 A(3) chiều đỏ: bản sao để tuổi khoá ở 14400 → đỏ «khoá 5h của lượt thật vẫn còn chủ»", () =>
  assert.rejects(kiemA3((s) => s.replace("${ZALO_IMPORT_TRAN_TONG:-21600}", "${ZALO_IMPORT_TRAN_TONG:-14400}")), /khoá 5h của lượt thật vẫn còn chủ/));
test("2311-5 A(3) tĩnh: hai chỗ đặt mặc định trần tổng (tuổi khoá + đồng hồ) phải cùng số 21600", () => {
  const src = readFileSync(SCRIPT, "utf8");
  const a = src.match(/\$\{ZALO_IMPORT_TRAN_TONG:-(\d+)\}/), b = src.match(/\|\| echo (\d+)\)\}"/);
  assert.ok(a && b, "thấy cả hai chỗ đặt mặc định trần tổng");
  assert.equal(a[1], b[1], "hai mặc định trần tổng lệch nhau");
  assert.equal(a[1], "21600");
});

test("2311-5 A(3) lượt nhanh: trần giữ nguyên 2400s, một đồng hồ", () => voiRoot({ cham: true }, async (root) => {
  const r = await chay(root, { ZALO_IMPORT_NODE_BIN: nodeGia(root) }, { args: ["--luot-nhanh"] });
  assert.match(r.out, /\[zalo-import-daily\] trần: nạp ≤1800s · lượt ≤2400s$/m, "lượt nhanh: dòng khai trần không nhắc đọc gộp");
  const dong = readFileSync(join(root, "dong-ho.txt"), "utf8").trim().split("\n").map((l) => l.trim().split(/\s+/).join(" "));
  assert.deepEqual(dong, ["2400 1200"], `lượt nhanh: một đồng hồ 2400s — thực tế ${JSON.stringify(dong)}`);
}));

// ══════ A hợp đồng dừng sạch: bước đọc gộp nhận DOC_GOP_TRAN_GIAY = TRAN_DOC_GOP − 300 ══════
const DG_GHI_TRAN = '#!/bin/bash\nprintf \'%s\\n\' "${DOC_GOP_TRAN_GIAY:-KHONG_DAT}" > "$(dirname "$0")/logs-doc/tran-nhan.txt"\nexit 0\n';
const kiemA4 = (env, ke) => voiRoot({ docGop: DG_GHI_TRAN }, async (root) => {
  mkdirSync(join(root, "pipeline", "logs-doc"));
  const r = await chay(root, env);
  assert.equal(r.status, 0, `lượt lành thoát 0 — thực tế ${r.status}`);
  assert.equal(readFileSync(join(root, "pipeline", "logs-doc", "tran-nhan.txt"), "utf8").trim(), ke, "A(2) DOC_GOP_TRAN_GIAY bước đọc gộp nhận được");
});
test("2311-5 A hợp đồng: bước đọc gộp nhận DOC_GOP_TRAN_GIAY = (21600 − 2400 − 3000) − 300 = 15900 (mặc định)", () => kiemA4({}, "15900"));
test("2311-5 A hợp đồng: ZALO_IMPORT_TRAN_DOC_GOP=1200 → bước nhận 900 (lệch trước đồng hồ 300s)", () => kiemA4({ ZALO_IMPORT_TRAN_DOC_GOP: "1200" }, "900"));
test("2311-5 A hợp đồng: trần đọc gộp quá nhỏ thì mốc dừng sạch không xuống dưới 60s", () => kiemA4({ ZALO_IMPORT_TRAN_DOC_GOP: "30" }, "60"));
// Trên nhánh B bước nhận biến TƯỜNG MINH từ doc_gop_run (không chỉ nhờ export): chiều đỏ phải bỏ cả hai đường.
test("2311-5 A hợp đồng chiều đỏ: bản sao bỏ cả export lẫn chỗ truyền tường minh → bước nhận KHONG_DAT (đỏ «không nhận được»)", () => assert.rejects(
  voiRoot({ bien: (s) => s.replace("export DOC_GOP_TRAN_GIAY\n", "").replace('DOC_GOP_TRAN_GIAY="$DOC_GOP_TRAN_GIAY" "$@" &', '"$@" &'), docGop: DG_GHI_TRAN }, async (root) => {
    mkdirSync(join(root, "pipeline", "logs-doc"));
    await chay(root, {});
    assert.equal(readFileSync(join(root, "pipeline", "logs-doc", "tran-nhan.txt"), "utf8").trim(), "15900", "A(2) CA LỖI: bước đọc gộp không nhận được DOC_GOP_TRAN_GIAY (thiếu export)");
  }), /bước đọc gộp không nhận được DOC_GOP_TRAN_GIAY/));

// ══════ A trần đọc gộp SUY TỪ TRẦN TỔNG THỰC (BÁO claudedp-2411-11 và -12, GS phán 24/11) ══════
// Biến môi trường ZALO_IMPORT_TRAN_TONG thắng mặc định — đêm 24→25/11 plist đặt 32400 một đêm. Trần đọc gộp =
// trần tổng − 2400 (nạp, transform) − 3000 (enrich); đặt tường minh lớn hơn thì kẹp và in một dòng JOB WARN.
const CAU_KEP = 'if [ "$TRAN_DOC_GOP" -gt "$TRAN_DOC_GOP_MAX" ]; then';
const dongKhai = (r) => r.out.split("\n").find((l) => l.includes("[zalo-import-daily] trần:")) ?? "";
const chayTran = (bien, env) => voiRoot({ bien, docGop: DG_GHI_TRAN, cham: true }, async (root) => {
  mkdirSync(join(root, "pipeline", "logs-doc"));
  const r = await chay(root, { ZALO_IMPORT_NODE_BIN: nodeGia(root), ...env });
  return { ra: r, tran: readFileSync(join(root, "pipeline", "logs-doc", "tran-nhan.txt"), "utf8").trim(),
    dong: readFileSync(join(root, "dong-ho.txt"), "utf8").trim().split("\n").map((l) => l.trim().split(/\s+/).join(" ")) };
});
test("2311-5 A trần tổng 32400 (plist đêm 24→25/11): biến môi trường thắng mặc định — đọc gộp ≤27000s, dừng sạch ở 26700s, đồng hồ nhận 32400 (nhánh B: thêm đồng hồ bước 27000s)", async () => {
  const d = await chayTran(null, { ZALO_IMPORT_TRAN_TONG: "32400" });
  assert.match(dongKhai(d.ra), /đọc gộp ≤27000s \(dừng sạch ở 26700s\) · lượt ≤32400s/, "(i) dòng khai trần theo biến môi trường");
  assert.deepEqual(d.dong, ["32400 16200", "27000"], `(i) đồng hồ tổng nhận 32400, WARN 16200, rồi đồng hồ bước đọc gộp 27000 — thực tế ${JSON.stringify(d.dong)}`);
  assert.equal(d.tran, "26700", "(i) bước đọc gộp nhận DOC_GOP_TRAN_GIAY = 32400 − 2400 − 3000 − 300");
  assert.doesNotMatch(d.ra.out, /JOB WARN/, "(i) cấu hình hợp lệ: không có dòng cảnh báo");
});
test("2311-5 A trần đọc gộp đặt tường minh lớn hơn chỗ còn lại → kẹp về 16200s và in một dòng JOB WARN", async () => {
  const r = await chayTran(null, { ZALO_IMPORT_TRAN_DOC_GOP: "30000" });
  assert.match(r.ra.out, /^JOB WARN \[zalo-import-daily\] trần đọc gộp 30000s không vừa trần tổng 21600s — kẹp về 16200s /m, "(ii) CA LỖI: trần đọc gộp vượt chỗ còn lại của trần tổng phải được kẹp và báo");
  assert.equal(r.tran, "15900", "(ii) sau khi kẹp: 16200 − 300");
});
test("2311-5 A trần tổng nhỏ (6000s) → đọc gộp tự co về 600s (dừng sạch ở 300s), vẫn chừa chỗ cho enrich", async () => {
  const n = await chayTran(null, { ZALO_IMPORT_TRAN_TONG: "6000" });
  assert.match(dongKhai(n.ra), /đọc gộp ≤600s \(dừng sạch ở 300s\) · lượt ≤6000s/, "(iii) dòng khai trần khi trần tổng nhỏ");
  assert.equal(n.tran, "300", "(iii) bước nhận 300");
});
test("2311-5 A chiều đỏ: bản sao bỏ chỗ kẹp → trần đọc gộp vượt trần tổng mà không báo (đỏ «phải được kẹp và báo»)", () =>
  assert.rejects(
    chayTran((s) => s.replace(CAU_KEP, "if false; then"), { ZALO_IMPORT_TRAN_DOC_GOP: "30000" }).then((r) => {
      assert.match(r.ra.out, /^JOB WARN \[zalo-import-daily\] trần đọc gộp 30000s không vừa trần tổng 21600s — kẹp về 16200s /m, "(ii) CA LỖI: trần đọc gộp vượt chỗ còn lại của trần tổng phải được kẹp và báo");
      assert.equal(r.tran, "15900", "(ii) CA LỖI: sau khi kẹp bước phải nhận 16200 − 300");
    }),
    /phải được kẹp và báo/));

// ══════ (1) hết đồng hồ đọc gộp → enrich VẪN chạy ══════
const kiem1 = ({ bien, tong = "40" } = {}) => voiRoot({ bien, docGop: DG_TREO }, async (root) => {
  const r = await chay(root, { ZALO_IMPORT_TRAN_DOC_GOP: "2", ZALO_IMPORT_TRAN_TONG: tong, ZALO_IMPORT_CANH_BAO: "30" });
  assert.match(r.out, /TIMEOUT: bước đọc gộp vượt trần 2s/, "(1) dòng TIMEOUT của đồng hồ riêng bước đọc gộp");
  assert.match(r.out, /^JOB STEP \[zalo-import-daily\] bước doc-gop-hang-ngay mã 143 giây \d+ nhanh 0$/m, "(1) bước bị cắt: ghim JOB STEP mã 143");
  assert.match(r.out, /^JOB FAIL \[zalo-import-daily\] bước doc-gop-hang-ngay mã 143$/m, "(1) bị đồng hồ cắt (không phải dừng sạch 75) thì vẫn là lỗi của bước");
  assert.match(r.out, /^JOB STEP \[zalo-import-daily\] bước enrich-run mã 0/m, "(1) CA LÕI: enrich phải VẪN chạy sau khi bước đọc gộp bị cắt");
  assert.doesNotMatch(r.out, /TIMEOUT: lượt vượt trần/, "(1) đồng hồ TỔNG không bắn — đồng hồ riêng cắt bước trước");
  assert.equal(r.status, 143, `(1) mã của lượt = mã bước bị cắt — thực tế ${r.status}`);
});
test("2311-5 (1): bước đọc gộp treo → đồng hồ riêng cắt đúng bước, enrich VẪN chạy, đồng hồ tổng không bắn", () => kiem1());
test("2311-5 (1) chiều đỏ: bản sao bỏ đồng hồ riêng → bước treo tới trần tổng, enrich chết theo (đỏ «enrich phải VẪN chạy»)", () => {
  // bản cũ không có đồng hồ riêng: chỉ đồng hồ tổng (8s) cắt → enrich chưa tới lượt
  const cut = kiem1({ tong: "8", bien: (s) => s.replace(CAU.dongHoBuoc, ': # đột biến: bỏ đồng hồ riêng của bước đọc gộp') });
  return assert.rejects(cut, /\(1\) dòng TIMEOUT của đồng hồ riêng bước đọc gộp|\(1\) CA LÕI/);
});

// ══════ (2) + (4) + 2311-6 (3): 75 = đi tiếp, checkpoint không mất bài ══════
const kiem2 = (bien) => voiRoot({ bien, docGop: DG_HOP_DONG }, async (root) => {
  const so = () => (existsSync(join(root, "pipeline", "logs-doc", "so-doc.txt")) ? readFileSync(join(root, "pipeline", "logs-doc", "so-doc.txt"), "utf8").trim().split("\n") : []);
  const r1 = await chay(root, { FIX_DOC_GOP_LAM: "2" });
  assert.match(r1.out, /^JOB STEP \[zalo-import-daily\] bước doc-gop-hang-ngay mã 75 giây \d+ nhanh 0$/m, "(2) ghim JOB STEP mã 75 thật của bước");
  assert.doesNotMatch(r1.out, /JOB FAIL \[zalo-import-daily\] bước doc-gop-hang-ngay/, "(2) CA LÕI: 75 là dừng sạch, không phải lỗi — không có dòng JOB FAIL");
  assert.match(r1.out, /^JOB WARN \[zalo-import-daily\] bước doc-gop-hang-ngay: hết giờ dừng sạch \(mã 75\) — đi tiếp/m, "(2) một dòng JOB WARN nói bước dừng sạch");
  assert.match(r1.out, /^JOB STEP \[zalo-import-daily\] bước enrich-run mã 0/m, "(2) enrich chạy ngay lượt đó sau khi đọc gộp dừng sạch");
  assert.equal(r1.status, 0, `(2) CA LÕI: 75 KHÔNG vào JOB_RC — lượt 00:00 thoát 0, thực tế ${r1.status}`);
  assert.deepEqual(so(), ["1", "2"], "(2) lượt 1 đọc được 2 bài rồi dừng sạch");
  assert.equal(readFileSync(join(root, "pipeline", "logs-doc", "tran-nhan.txt"), "utf8").trim(), "15900", "(2) bước nhận DOC_GOP_TRAN_GIAY = 16200 − 300 (trần đọc gộp suy từ trần tổng 21600)");
  const r2 = await chay(root, { FIX_DOC_GOP_LAM: "6" });
  assert.equal(r2.status, 0, `(2) lượt 2 thoát 0 — thực tế ${r2.status}`);
  assert.match(r2.out, /^JOB STEP \[zalo-import-daily\] bước doc-gop-hang-ngay mã 0 /m, "(2) lượt 2 bước đọc gộp xong trọn");
  assert.deepEqual(so(), ["1", "2", "3", "4", "5", "6"], "(2) CA LÕI: lượt sau đọc tiếp phần dở theo checkpoint — không mất, không lặp");
});
test("2311-5 (2)(4): bước dừng sạch thoát 75 → không lỗi, lượt 00:00 thoát 0, enrich chạy; lượt sau đọc tiếp phần dở", () => kiem2());
test("2311-5 (2) chiều đỏ: bản sao coi 75 là lỗi → JOB FAIL + lượt thoát 75 (đỏ «không có dòng JOB FAIL»)", () =>
  assert.rejects(kiem2((s) => s.replace(CAU.kt75, "if false; then")), /75 là dừng sạch, không phải lỗi/));

test("2311-5 (4) đối chứng: 75 thoát ngay → thoát 0, không JOB FAIL; mã khác (3) vẫn là lỗi như job_run", () => voiRoot({ docGop: "exit 75\n" }, async (root) => {
  const r = await chay(root, {});
  assert.equal(r.status, 0, `(4) thoát 0 — thực tế ${r.status}`);
  assert.doesNotMatch(r.out, /JOB FAIL /, "(4) không có dòng JOB FAIL nào");
  assert.match(r.out, /^JOB STEP \[zalo-import-daily\] bước doc-gop-hang-ngay mã 75 /m, "(4) ghim vẫn ghi mã thật 75");
  await voiRoot({ docGop: "exit 3\n" }, async (root3) => {
    const r3 = await chay(root3, {});
    assert.equal(r3.status, 3, `đối chứng: mã 3 của bước đọc gộp vẫn thành mã của lượt — thực tế ${r3.status}`);
    assert.match(r3.out, /^JOB FAIL \[zalo-import-daily\] bước doc-gop-hang-ngay mã 3$/m, "đối chứng: mã 3 vẫn có dòng JOB FAIL");
  });
}));

// ══════ bước phớt TERM: con phớt TERM không mồ côi, chuỗi chạy tiếp ══════
// bash của bước nhận TERM là chết ngay (ghim mã 143) còn node con phớt TERM: đồng hồ phải KILL nó (SIGUSR1 từ nơi
// gọi) trước khi chuỗi chạy tiếp — không chờ 20s, không để mồ côi.
const kiem5 = ({ bien } = {}) => voiRoot({ bien, docGop: DG_PHOT }, async (root) => {
  const t0 = Date.now();
  const r = await chay(root, { ZALO_IMPORT_TRAN_DOC_GOP: "2", ZALO_IMPORT_TRAN_TONG: "60", ZALO_IMPORT_CANH_BAO: "50" }, { sauThoat: () => choHet("doc-gop-phong-term.mjs") });
  assert.match(r.out, /TIMEOUT: bước đọc gộp vượt trần 2s/, "(5) dòng TIMEOUT");
  assert.match(r.out, /^JOB STEP \[zalo-import-daily\] bước doc-gop-hang-ngay mã 143 /m, `(5) bash của bước chết vì TERM → ghim mã 143 — thực tế: ${(r.out.split("\n").filter((l) => /bước doc-gop-hang-ngay/.test(l)) || []).join(" | ")}`);
  assert.match(r.out, /^JOB STEP \[zalo-import-daily\] bước enrich-run mã 0/m, "(5) CA LÕI: sau khi bước bị cắt, chuỗi chạy tiếp tới enrich");
  assert.doesNotMatch(r.out, /TIMEOUT: lượt vượt trần/, "(5) đồng hồ tổng không bắn");
  assert.equal(r.them, 0, `(5) CA LỖ: node con phớt TERM của bước phải bị KILL — còn ${r.them} tiến trình sau khi lượt thoát`);
  assert.ok(Date.now() - t0 < 12_000, `(5) CA LỖI: chuỗi phải chạy tiếp NGAY khi bước đã chết, không chờ ân hạn 20s của đồng hồ — mất ${Math.round((Date.now() - t0) / 1000)}s`);
});
test("2311-5 (5): bước đọc gộp phớt TERM → bash chết ngay, node con phớt TERM bị KILL, enrich vẫn chạy, không mồ côi", () => kiem5());
test("2311-5 (5) chiều đỏ: bản sao bỏ SIGUSR1 → nơi gọi phải chờ đồng hồ hết ân hạn 20s mới chạy tiếp (đỏ «không chờ ân hạn 20s»)", () =>
  assert.rejects(kiem5({ bien: (s) => s.replace(CAU.usr1, "") }), /không chờ ân hạn 20s/));

// ══════ người gọi không trưởng nhóm: trần TỔNG bắn giữa lúc đọc gộp → bước không sống mồ côi ══════
// Chạy tay / bash -c: script không phải trưởng nhóm, đồng hồ tổng chỉ TERM/KILL CON TRỰC TIẾP của script. Node của
// bước là con cháu từ lúc bước chạy nền → đồng hồ riêng phải ở lại dọn nó (bỏ qua SIGTERM), nếu không nó sống mồ côi.
const kiem6 = (bien) => voiRoot({ bien, docGop: DG_PHOT }, async (root) => {
  const r = await chay(root, { ZALO_IMPORT_TRAN_TONG: "6", ZALO_IMPORT_CANH_BAO: "4" }, { boc: true, sauThoat: () => choHet("doc-gop-phong-term.mjs") });
  assert.match(r.out, /TIMEOUT: lượt vượt trần 6s/, "(6) đồng hồ tổng bắn");
  assert.match(r.out, /^NGUOI-GOI-SONG rc=143$/m, "(6) người gọi sống, script bị cắt");
  assert.doesNotMatch(r.out, /bước enrich-run/, "(6) fixture: trần tổng bắn trong lúc đọc gộp — enrich chưa tới lượt");
  assert.equal(r.them, 0, `(6) CA LỖ: node của bước đọc gộp sống mồ côi sau khi lượt và người gọi đã thoát — còn ${r.them}`);
});
test("2311-5 (6): chạy tay, trần tổng bắn giữa lúc đọc gộp → đồng hồ riêng dọn nốt cây của bước, không mồ côi", () => kiem6());
test("2311-5 (6) chiều đỏ a: đồng hồ bước không bỏ qua SIGTERM → chết theo TERM của đồng hồ tổng, node của bước mồ côi (đỏ «sống mồ côi»)", () =>
  assert.rejects(kiem6((s) => s.replace(CAU.boQuaTerm, "")), /sống mồ côi/));
test("2311-5 (6) chiều đỏ b: bản sao bỏ KILL ân hạn → node phớt TERM bị TERM mãi không chết, mồ côi (đỏ «sống mồ côi»)", () =>
  assert.rejects(kiem6((s) => s.replace(CAU.anHanBuoc, "setTimeout(diet, 20_000_000).unref();")), /sống mồ côi/));

// ══════ lượt lành: không còn đồng hồ nào sau khi lượt thoát ══════
test("2311-5 A lượt 00:00 lành chạy trọn tới enrich → thoát 0, không còn đồng hồ, không FAIL/WARN", () => voiRoot({}, async (root) => {
  const r = await chay(root, {}, { sauThoat: () => choHet(join(root, "node-dong-ho")) });
  assert.equal(r.status, 0, `thoát 0 — thực tế ${r.status}\n${r.out}`);
  assert.doesNotMatch(r.out, /JOB FAIL|JOB WARN/, "lượt lành không có dòng FAIL hay WARN");
  assert.deepEqual(
    r.out.split("\n").filter((l) => /^JOB STEP \[zalo-import-daily\] bước (doc-gop-hang-ngay|enrich-run) /.test(l)).map((l) => l.split(" ")[4]).slice(0, 2),
    ["doc-gop-hang-ngay", "enrich-run"], "thứ tự bước giữ nguyên: đọc gộp rồi enrich",
  );
  assert.equal(r.them, 0, `còn ${r.them} đồng hồ sau khi lượt thoát`);
}));
